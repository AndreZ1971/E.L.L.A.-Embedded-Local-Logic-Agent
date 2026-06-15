import {
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  ipcMain,
  session,
  shell,
} from "electron";
import type { Event as ElectronEvent } from "electron";
import { spawn, exec } from "child_process";
import type { ChildProcess } from "child_process";
import * as net from "net";
import * as fs from "fs";
import { deflateSync } from "zlib";
import * as path from "path";

// Sauberen userData-Pfad setzen bevor app.getPath() genutzt wird
// Standard "@ella/desktop" enthält einen Schrägstrich → Probleme auf Windows
if (!process.env.ELLA_DEV) {
  app.setPath(
    "userData",
    require("path").join(require("os").homedir(), "AppData", "Roaming", "ELLA"),
  );
}

const isDev = process.env.ELLA_DEV === "1";
const FRONTEND_URL = "http://127.0.0.1:5173";
const API_PORT = 3002;

// Startup-Log für Fehlerdiagnose
let logStream: fs.WriteStream | null = null;
function initLog(): void {
  try {
    const logPath = path.join(app.getPath("userData"), "ella-startup.log");
    logStream = fs.createWriteStream(logPath, { flags: "a" });
    logStream.write(`\n\n=== ELLA Start ${new Date().toISOString()} ===\n`);
  } catch {}
}
function log(msg: string): void {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try {
    logStream?.write(line + "\n");
  } catch {}
}

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;
let apiProcess: ChildProcess | null = null;
let ttsProcess: ChildProcess | null = null;
let mariadbProcess: ChildProcess | null = null;
let ollamaProcess: ChildProcess | null = null;

// In production (installed via NSIS): process.resourcesPath = <install>/resources
// When running from source (electron . without installer): app.isPackaged = false,
// process.resourcesPath points to electron's own dist/resources (no vendor binaries).
function vendorPath(...parts: string[]): string {
  const base = app.isPackaged
    ? process.resourcesPath
    : path.join(app.getAppPath(), "..", "..", "..", "vendor");
  return path.join(base, ...parts);
}

function sendSetupStatus(msg: string): void {
  mainWindow?.webContents.send("ella:setup", msg);
}

function sendModelPullState(active: boolean): void {
  mainWindow?.webContents.send("ella:model-pull-state", active);
}

// ── MariaDB (portable) ────────────────────────────────────────────────────────

async function startMariaDB(): Promise<void> {
  const mysqld = vendorPath("mariadb", "bin", "mysqld.exe");
  if (!fs.existsSync(mysqld)) {
    console.log("[MariaDB] Binary nicht gefunden — überspringe.");
    return;
  }

  const dataDir = path.join(app.getPath("userData"), "mariadb-data");

  if (!fs.existsSync(path.join(dataDir, "mysql"))) {
    console.log("[MariaDB] Erststart — initialisiere Datenverzeichnis…");
    sendSetupStatus("Datenbank wird eingerichtet…");
    fs.mkdirSync(dataDir, { recursive: true });
    const baseDir = vendorPath("mariadb");
    // MariaDB nutzt mysql_install_db.exe für Initialisierung (nicht mysqld --initialize-insecure wie MySQL)
    const installDb = vendorPath("mariadb", "bin", "mysql_install_db.exe");
    const initErrorLog = path.join(app.getPath("userData"), "mariadb-init.log");
    await new Promise<void>((resolve, reject) => {
      const init = spawn(installDb, [`--datadir=${dataDir}`], {
        stdio: "pipe",
      });
      // mysqld-Ausgabe ins Startup-Log für Fehlerdiagnose
      init.stderr?.on("data", (d: Buffer) =>
        log(`[MariaDB-init] ${d.toString().trimEnd()}`),
      );
      init.stdout?.on("data", (d: Buffer) =>
        log(`[MariaDB-init] ${d.toString().trimEnd()}`),
      );
      // Timeout: nach 3 Minuten abbrechen — bei manchen Systemen hängt initialize
      const timer = setTimeout(() => {
        init.kill();
        reject(new Error("mysqld --initialize Timeout nach 3 Minuten"));
      }, 180_000);
      init.on("close", (code) => {
        clearTimeout(timer);
        if (code === 0) {
          resolve();
        } else {
          // Init-Log auslesen für bessere Fehlerdiagnose
          try {
            const errLog = fs.readFileSync(initErrorLog, "utf-8");
            log(`[MariaDB-init-log]\n${errLog.slice(-2000)}`);
          } catch {
            /* Log-Datei evtl. nicht erstellt */
          }
          reject(new Error(`mysqld --initialize exit ${code}`));
        }
      });
      init.on("error", (e) => {
        clearTimeout(timer);
        reject(e);
      });
    });
  }

  sendSetupStatus("Datenbank wird gestartet…");
  mariadbProcess = spawn(
    mysqld,
    [
      `--datadir=${dataDir}`,
      "--port=3306",
      "--bind-address=127.0.0.1",
      "--skip-networking=OFF",
      "--console",
    ],
    { stdio: "pipe" },
  );
  mariadbProcess.stdout?.on("data", (d: Buffer) =>
    log(`[MariaDB] ${d.toString().trimEnd()}`),
  );
  mariadbProcess.stderr?.on("data", (d: Buffer) =>
    log(`[MariaDB] ${d.toString().trimEnd()}`),
  );
  mariadbProcess.on("error", (e) => log(`[MariaDB] spawn error: ${e.message}`));
  mariadbProcess.on("exit", (code) =>
    log(`[MariaDB] Prozess beendet, Code: ${code}`),
  );

  await waitForPort(3306, 30_000);
  // Give MariaDB a moment to finish startup after port is open
  await new Promise((r) => setTimeout(r, 800));

  // First-run: create ella user + database
  const mysql = vendorPath("mariadb", "bin", "mysql.exe");
  const credFile = path.join(app.getPath("userData"), ".db-init");
  if (!fs.existsSync(credFile) && fs.existsSync(mysql)) {
    console.log("[MariaDB] Ersteinrichtung: Datenbank und Nutzer anlegen…");
    await new Promise<void>((resolve) => {
      const sql =
        "CREATE DATABASE IF NOT EXISTS ella;" +
        "CREATE USER IF NOT EXISTS 'ella'@'127.0.0.1' IDENTIFIED BY '';" +
        "GRANT ALL ON ella.* TO 'ella'@'127.0.0.1';" +
        "FLUSH PRIVILEGES;";
      const proc = spawn(
        mysql,
        ["-u", "root", "-h", "127.0.0.1", "-P", "3306", "-e", sql],
        {
          stdio: "pipe",
        },
      );
      proc.on("close", () => {
        try {
          fs.writeFileSync(credFile, "done");
        } catch {}
        resolve();
      });
      proc.on("error", () => resolve());
    });
  }
  console.log("[MariaDB] Bereit.");
}

// ── Ollama (portable) ─────────────────────────────────────────────────────────

async function startOllama(): Promise<void> {
  const ollamaExe = vendorPath("ollama", "ollama.exe");
  if (!fs.existsSync(ollamaExe)) {
    console.log("[Ollama] Binary nicht gefunden — überspringe.");
    return;
  }

  sendSetupStatus("KI-Motor wird gestartet…");
  const modelsDir = path.join(app.getPath("userData"), "ollama-models");
  fs.mkdirSync(modelsDir, { recursive: true });

  ollamaProcess = spawn(ollamaExe, ["serve"], {
    stdio: "pipe",
    env: { ...process.env, OLLAMA_MODELS: modelsDir },
  });
  ollamaProcess.stderr?.on("data", (d: Buffer) =>
    console.error("[Ollama]", d.toString().trimEnd()),
  );
  ollamaProcess.on("exit", (code) =>
    console.log("[Ollama] Prozess beendet, Code:", code),
  );

  await waitForPort(11434, 30_000);
  console.log("[Ollama] Server bereit.");
}

// ── KokoroTTS ─────────────────────────────────────────────────────────────────

function startKokoroTts(): void {
  const settingsPath = path.join(app.getPath("userData"), "settings.json");
  try {
    const raw = require("fs").readFileSync(settingsPath, "utf-8");
    const settings = JSON.parse(raw) as { ttsEngine?: string };
    if (settings.ttsEngine !== "kokoro") return;
  } catch {
    return;
  }

  const scriptPath = path.join(app.getAppPath(), "../scripts/tts_server.py");
  ttsProcess = spawn("python", [scriptPath], { stdio: "pipe" });
  ttsProcess.stdout?.on("data", (d: Buffer) =>
    console.log("[TTS]", d.toString().trimEnd()),
  );
  ttsProcess.stderr?.on("data", (d: Buffer) =>
    console.error("[TTS-ERR]", d.toString().trimEnd()),
  );
  ttsProcess.on("exit", (code) =>
    console.log("[TTS] Prozess beendet, Code:", code),
  );
}

// ── API-Spawn ─────────────────────────────────────────────────────────────────

function freePort(port: number): Promise<void> {
  return new Promise((resolve) => {
    const cmd =
      `Get-NetTCPConnection -LocalPort ${port} -State Listen ` +
      `-ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | ` +
      `ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }`;
    exec(
      `powershell -NoProfile -NonInteractive -Command "${cmd}"`,
      { timeout: 5000 },
      () => resolve(),
    );
  });
}

// ── Ollama Model Download ─────────────────────────────────────────────────────

async function getOllamaModel(): Promise<string> {
  // Read configured model from settings.json (userData)
  try {
    const settingsPath = path.join(app.getPath("userData"), "settings.json");
    if (fs.existsSync(settingsPath)) {
      const s = JSON.parse(fs.readFileSync(settingsPath, "utf-8")) as {
        ollamaModel?: string;
        provider?: string;
      };
      if (s.provider === "openai") return "";
      return s.ollamaModel || "llama3.1:8b";
    }
  } catch {}
  return "llama3.1:8b";
}

async function ensureOllamaModel(): Promise<void> {
  const modelName = await getOllamaModel();
  if (!modelName) return; // OpenAI mode — skip

  const ollamaExe = vendorPath("ollama", "ollama.exe");
  if (!fs.existsSync(ollamaExe)) return;

  // Check if model is already present
  log(`[Ollama] Prüfe Modell: ${modelName}`);
  const modelBase = modelName.split(":")[0];
  try {
    const listOut = await new Promise<string>((resolve, reject) => {
      const proc = spawn(ollamaExe, ["list"], {
        stdio: ["ignore", "pipe", "pipe"],
      });
      let out = "";
      proc.stdout?.on("data", (d: Buffer) => (out += d.toString()));
      proc.on("close", () => resolve(out));
      proc.on("error", reject);
      setTimeout(() => {
        proc.kill();
        reject(new Error("timeout"));
      }, 10_000);
    });
    if (listOut.toLowerCase().includes(modelBase.toLowerCase())) {
      log(
        `[Ollama] Modell ${modelName} bereits vorhanden — kein Download nötig.`,
      );
      return;
    }
  } catch {
    log(`[Ollama] 'ollama list' fehlgeschlagen — versuche Pull trotzdem.`);
  }

  // Model not found — pull it with progress shown in UI
  log(`[Ollama] Modell ${modelName} nicht gefunden — starte Download.`);
  sendSetupStatus(
    `Hallo! Ich bin E.L.L.A. — deine lokale KI.\n\nBevor wir loslegen, lade ich mein Gehirn herunter.\nDas passiert nur einmal und dauert je nach Internet 10–30 Minuten.\n\nBitte lass das Fenster offen — ich melde mich wenn ich bereit bin.`,
  );

  sendModelPullState(true);

  await new Promise<void>((resolve) => {
    const proc = spawn(ollamaExe, ["pull", modelName], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    proc.stdout?.on("data", (d: Buffer) => {
      const line = d.toString().trim();
      if (line) {
        log(`[Ollama-Pull] ${line}`);
        // Parse percentage out of lines like "pulling abc123... 42%"
        const pctMatch = line.match(/(\d+)%/);
        const pct = pctMatch ? ` (${pctMatch[1]}%)` : "";
        sendSetupStatus(
          `Ich lade gerade mein KI-Modell herunter${pct}\n\nBitte warten — das passiert nur beim ersten Start.\n${line}`,
        );
      }
    });
    proc.stderr?.on("data", (d: Buffer) => {
      const line = d.toString().trim();
      if (line) log(`[Ollama-Pull-ERR] ${line}`);
    });
    proc.on("close", (code) => {
      if (code === 0) {
        log(`[Ollama] Modell ${modelName} erfolgreich geladen.`);
        sendSetupStatus(
          `Mein Gehirn ist geladen — ich bin jetzt vollständig bereit!\n\nE.L.L.A. startet…`,
        );
      } else {
        log(`[Ollama] Pull beendet mit Code ${code} — ELLA startet trotzdem.`);
        sendSetupStatus(
          `Modell-Download unterbrochen (Code ${code}).\nE.L.L.A. startet — du kannst den Download in den Einstellungen wiederholen.`,
        );
      }
      sendModelPullState(false);
      resolve();
    });
    proc.on("error", (e) => {
      log(`[Ollama] Pull spawn error: ${e.message}`);
      sendModelPullState(false);
      resolve();
    });
  });
}

let apiRestartCount = 0;
const API_MAX_RESTARTS = 5;

function startApi(): void {
  const apiDir = path.join(app.getAppPath(), "../api");
  const bundledNode = vendorPath("node", "node.exe");
  const nodeExe = fs.existsSync(bundledNode) ? bundledNode : "node";
  log(`[API] Starte: ${nodeExe} dist/bundle.cjs  cwd=${apiDir}`);

  apiProcess = spawn(nodeExe, ["dist/bundle.cjs"], {
    cwd: apiDir,
    stdio: "pipe",
    env: {
      ...process.env,
      ELLA_RESOURCES: app.isPackaged
        ? process.resourcesPath
        : path.join(app.getAppPath(), "..", "..", "..", "vendor"),
      ELLA_USERDATA: app.getPath("userData"),
    },
  });

  apiProcess.stdout?.on("data", (d: Buffer) => {
    log("[API] " + d.toString().trimEnd());
  });
  apiProcess.stderr?.on("data", (d: Buffer) =>
    log("[API-ERR] " + d.toString().trimEnd()),
  );
  apiProcess.on("exit", (code: number | null) => {
    log(`[API] Prozess beendet, Code: ${code}`);
    if (isQuitting) return;
    if (apiRestartCount >= API_MAX_RESTARTS) {
      log(`[API] Zu viele Neustarts (${API_MAX_RESTARTS}) — gebe auf.`);
      return;
    }
    apiRestartCount++;
    const delay = Math.min(3000 * apiRestartCount, 15000);
    log(
      `[API] Neustart in ${delay / 1000}s… (Versuch ${apiRestartCount}/${API_MAX_RESTARTS})`,
    );
    setTimeout(() => {
      if (!isQuitting) startApi();
    }, delay);
  });
  apiProcess.on("error", (e) => log(`[API] spawn error: ${e.message}`));
}

function waitForPort(port: number, timeout = 20000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      const socket = net.connect(port, "127.0.0.1", () => {
        socket.destroy();
        resolve();
      });
      socket.on("error", () => {
        socket.destroy();
        if (Date.now() - start > timeout) {
          reject(new Error(`API nicht bereit nach ${timeout}ms`));
        } else {
          setTimeout(check, 300);
        }
      });
    };
    check();
  });
}

// ── PNG-Icon (inline) ─────────────────────────────────────────────────────────

function buildPngIcon(size: number): Buffer {
  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crcTable[n] = c;
  }
  const crc32 = (buf: Buffer): number => {
    let crc = 0xffffffff;
    for (const byte of buf) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, data: Buffer): Buffer => {
    const t = Buffer.from(type, "ascii");
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
    return Buffer.concat([len, t, data, crc]);
  };

  const s = size / 32;
  const r = 7 * s;

  const inRound = (px: number, py: number): boolean => {
    const cx = Math.min(Math.max(px, r), size - 1 - r);
    const cy = Math.min(Math.max(py, r), size - 1 - r);
    return (px - cx) ** 2 + (py - cy) ** 2 <= r * r;
  };

  const isWhite = (px: number, py: number): boolean => {
    const x = px / s;
    const y = py / s;
    if (x >= 5.5 && x < 9.5 && y >= 7 && y < 26) return true;
    if (x >= 9.5 && x < 20 && y >= 7 && y < 11) return true;
    if (x >= 9.5 && x < 18.5 && y >= 14.5 && y < 18.5) return true;
    if (x >= 9.5 && x < 20 && y >= 22 && y < 26) return true;
    const dx = px - 25.5 * s;
    const dy = py - 23.5 * s;
    return dx * dx + dy * dy < (2.5 * s) ** 2;
  };

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA

  const raw = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    const off = y * (1 + size * 4);
    raw[off] = 0;
    for (let x = 0; x < size; x++) {
      const p = off + 1 + x * 4;
      if (!inRound(x, y)) {
        raw[p] = raw[p + 1] = raw[p + 2] = raw[p + 3] = 0;
      } else if (isWhite(x, y)) {
        raw[p] = raw[p + 1] = raw[p + 2] = raw[p + 3] = 255;
      } else {
        raw[p] = 124;
        raw[p + 1] = 106;
        raw[p + 2] = 247;
        raw[p + 3] = 255;
      }
    }
  }

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ── Fenster ───────────────────────────────────────────────────────────────────

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 800,
    minHeight: 550,
    title: "E.L.L.A.",
    icon: nativeImage.createFromBuffer(buildPngIcon(64)),
    frame: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js"),
    },
    show: false,
  });

  if (isDev) {
    mainWindow.loadURL(FRONTEND_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../../../web/dist/index.html"));
  }

  mainWindow.webContents.on("did-fail-load", (_e, code, desc) => {
    console.error("[ELLA] Ladefehler:", code, desc);
  });

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }

  // Externe Links im System-Browser öffnen, nicht in Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
  mainWindow.webContents.on("will-navigate", (e, url) => {
    const internal =
      url.startsWith("http://127.0.0.1") || url.startsWith("file://");
    if (!internal) {
      e.preventDefault();
      shell.openExternal(url);
    }
  });

  // Kein Throttling im Hintergrund — ELLA muss immer zuhören
  mainWindow.webContents.setBackgroundThrottling(false);

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  mainWindow.on("maximize", () =>
    mainWindow?.webContents.send("window:maximized", true),
  );
  mainWindow.on("unmaximize", () =>
    mainWindow?.webContents.send("window:maximized", false),
  );

  mainWindow.on("minimize", () => {
    // 1x1px statt hide() — Audio-Kontext (Wakeword) bleibt aktiv
    mainWindow?.setPosition(-9999, -9999);
    mainWindow?.setSize(1, 1);
    mainWindow?.setSkipTaskbar(true);
    mainWindow?.webContents.send("ella:background", true);
  });

  mainWindow.on("close", (e: ElectronEvent) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow?.setPosition(-9999, -9999);
      mainWindow?.setSize(1, 1);
      mainWindow?.setSkipTaskbar(true);
      mainWindow?.webContents.send("ella:background", true);
    }
  });
}

// ── Autostart ─────────────────────────────────────────────────────────────────

function autostartArgs() {
  return { path: process.execPath, args: [app.getAppPath()] };
}

function isAutostartEnabled(): boolean {
  return app.getLoginItemSettings(autostartArgs()).openAtLogin;
}

function setAutostart(enable: boolean): void {
  app.setLoginItemSettings({ openAtLogin: enable, ...autostartArgs() });
}

// ── Begrüßung ─────────────────────────────────────────────────────────────────

function greetUser(): void {
  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12
      ? "Guten Morgen"
      : hour < 18
        ? "Guten Tag"
        : hour < 22
          ? "Guten Abend"
          : "Gute Nacht";
  const days = [
    "Sonntag",
    "Montag",
    "Dienstag",
    "Mittwoch",
    "Donnerstag",
    "Freitag",
    "Samstag",
  ];
  const weekday = days[now.getDay()];
  const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const message = `${greeting}. Es ist ${weekday}, ${timeStr} Uhr. Ich bin bereit.`;
  mainWindow?.webContents.send("ella:speak", message);
}

// ── Tray ──────────────────────────────────────────────────────────────────────

function buildTrayMenu(): Menu {
  return Menu.buildFromTemplate([
    { label: "E.L.L.A. öffnen", click: showWindow },
    { type: "separator" },
    {
      label: "Autostart",
      type: "checkbox",
      checked: isAutostartEnabled(),
      click: () => {
        setAutostart(!isAutostartEnabled());
        tray?.setContextMenu(buildTrayMenu());
      },
    },
    { type: "separator" },
    {
      label: "Beenden",
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);
}

function createTray(): void {
  const icon = nativeImage.createFromBuffer(buildPngIcon(32));
  tray = new Tray(icon);
  tray.setToolTip("E.L.L.A. — Embedded Local Logic Agent");
  tray.setContextMenu(buildTrayMenu());
  tray.on("click", () => {
    const isBackground =
      !mainWindow?.isVisible() || (mainWindow?.getPosition()[0] ?? 0) < -1000;
    if (isBackground) {
      showWindow();
    } else {
      // Gleicher Trick wie minimize — 1x1px statt hide() damit AudioContext läuft
      mainWindow?.setPosition(-9999, -9999);
      mainWindow?.setSize(1, 1);
      mainWindow?.setSkipTaskbar(true);
      mainWindow?.webContents.send("ella:background", true);
    }
  });
}

function showWindow(): void {
  if (!mainWindow) return;
  mainWindow.setSize(1100, 750);
  mainWindow.center();
  mainWindow.setSkipTaskbar(false);
  mainWindow.show();
  mainWindow.focus();
  mainWindow.webContents.send("ella:background", false);
}

// ── IPC ───────────────────────────────────────────────────────────────────────

ipcMain.on(
  "ella:alert",
  (_event, payload: { message: string; severity: "warning" | "error" }) => {
    const { message, severity } = payload;
    const title =
      severity === "error"
        ? "E.L.L.A. — Kritischer Fehler"
        : "E.L.L.A. — Warnung";
    tray?.setToolTip(`E.L.L.A. — ${message}`);
    tray?.displayBalloon({
      title,
      content: message,
      iconType: severity === "error" ? "error" : "warning",
      noSound: severity !== "error",
    });
    setTimeout(
      () => tray?.setToolTip("E.L.L.A. — Embedded Local Logic Agent"),
      30_000,
    );
  },
);

ipcMain.on(
  "ella:device",
  (
    _event,
    payload: {
      message: string;
      type: "connected" | "disconnected" | "network";
    },
  ) => {
    const { message, type } = payload;
    const title =
      type === "connected"
        ? "E.L.L.A. — Gerät verbunden"
        : type === "disconnected"
          ? "E.L.L.A. — Gerät getrennt"
          : "E.L.L.A. — Netzwerk";
    tray?.setToolTip(`E.L.L.A. — ${message}`);
    tray?.displayBalloon({
      title,
      content: message,
      iconType: "info",
      noSound: true,
    });
    setTimeout(
      () => tray?.setToolTip("E.L.L.A. — Embedded Local Logic Agent"),
      20_000,
    );
  },
);

ipcMain.on("ella:shutdown", (_event, cmd: string) => {
  const allowed = [
    /^shutdown \/s \/t \d+$/,
    /^shutdown \/r \/t \d+$/,
    /^rundll32\.exe powrprof\.dll,SetSuspendState 0,1,0$/,
  ];
  if (!allowed.some((pattern) => pattern.test(cmd))) {
    console.error("[ELLA] Ungültiger Shutdown-Befehl abgewiesen:", cmd);
    return;
  }
  exec(cmd, (err) => {
    if (err) console.error("[ELLA] Shutdown-Fehler:", err);
  });
});

function registerIpc(): void {
  ipcMain.on("window:minimize", () => mainWindow?.minimize());
  ipcMain.on("window:maximize", () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize();
    else mainWindow?.maximize();
  });
  ipcMain.on("window:close", () => mainWindow?.close());
  ipcMain.handle(
    "window:isMaximized",
    () => mainWindow?.isMaximized() ?? false,
  );
}

// ── App-Lifecycle ─────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  if (!app.requestSingleInstanceLock()) {
    app.quit();
    return;
  }
  app.on("second-instance", () => showWindow());

  // Grant microphone access for Web Speech API
  session.defaultSession.setPermissionRequestHandler(
    (_wc, permission, callback) => {
      callback(permission === "media");
    },
  );
  session.defaultSession.setPermissionCheckHandler(
    (_wc, permission) => permission === "media",
  );

  initLog();
  log(`resourcesPath=${process.resourcesPath}`);
  log(`appPath=${app.getAppPath()}`);
  log(`userData=${app.getPath("userData")}`);

  registerIpc();
  createWindow();
  createTray();

  if (!isDev) {
    await freePort(API_PORT);

    const mysqldPath = vendorPath("mariadb", "bin", "mysqld.exe");
    const ollamaPath = vendorPath("ollama", "ollama.exe");
    const nodePath = vendorPath("node", "node.exe");
    const apiDistPath = path.join(app.getAppPath(), "../api/dist/bundle.cjs");
    log(`mysqld exists: ${fs.existsSync(mysqldPath)} (${mysqldPath})`);
    log(`ollama exists: ${fs.existsSync(ollamaPath)} (${ollamaPath})`);
    log(`node exists:   ${fs.existsSync(nodePath)} (${nodePath})`);
    log(`api/dist:      ${fs.existsSync(apiDistPath)} (${apiDistPath})`);

    await startMariaDB().catch((e) => log(`[MariaDB] FEHLER: ${e}`));
    await startOllama().catch((e) => log(`[Ollama] FEHLER: ${e}`));

    // API und Modell-Download parallel starten — API antwortet sofort,
    // Modell wird im Hintergrund geladen (Status via IPC ins UI)
    startApi();
    startKokoroTts();
    ensureOllamaModel().catch((e) => log(`[Ollama] Modell-Check Fehler: ${e}`));

    try {
      log(`Warte auf API :${API_PORT}…`);
      await waitForPort(API_PORT);
      log("API bereit.");
    } catch (e) {
      log(`API-Start fehlgeschlagen: ${e}`);
    }
  }

  setTimeout(() => greetUser(), 2500);
});

app.on("window-all-closed", () => {
  /* Tray-App — absichtlich leer */
});

app.on("before-quit", () => {
  isQuitting = true;
  for (const proc of [apiProcess, ttsProcess, ollamaProcess, mariadbProcess]) {
    if (proc && !proc.killed) proc.kill();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
  else showWindow();
});
