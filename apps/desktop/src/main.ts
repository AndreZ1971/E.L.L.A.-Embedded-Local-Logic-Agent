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

const isDev = process.env.ELLA_DEV === "1";
const FRONTEND_URL = "http://127.0.0.1:5173";
const API_PORT = 3002;

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;
let apiProcess: ChildProcess | null = null;
let ttsProcess: ChildProcess | null = null;
let mariadbProcess: ChildProcess | null = null;
let ollamaProcess: ChildProcess | null = null;

// In production: process.resourcesPath = <install>/resources
// In dev: fall back to vendor/ folder in repo root
function vendorPath(...parts: string[]): string {
  const base =
    process.resourcesPath ??
    path.join(app.getAppPath(), "..", "..", "..", "vendor");
  return path.join(base, ...parts);
}

function sendSetupStatus(msg: string): void {
  mainWindow?.webContents.send("ella:setup", msg);
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
    await new Promise<void>((resolve, reject) => {
      const init = spawn(
        mysqld,
        ["--initialize-insecure", `--datadir=${dataDir}`],
        {
          stdio: "pipe",
        },
      );
      init.on("close", (code) =>
        code === 0
          ? resolve()
          : reject(new Error(`mysqld --initialize exit ${code}`)),
      );
      init.on("error", reject);
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
    console.log("[MariaDB]", d.toString().trimEnd()),
  );
  mariadbProcess.stderr?.on("data", (d: Buffer) =>
    console.error("[MariaDB]", d.toString().trimEnd()),
  );
  mariadbProcess.on("error", (e) =>
    console.error("[MariaDB] spawn error:", e.message),
  );
  mariadbProcess.on("exit", (code) =>
    console.log("[MariaDB] Prozess beendet, Code:", code),
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

function startApi(): void {
  const apiDir = path.join(app.getAppPath(), "../api");
  console.log("[ELLA] Starte API in:", apiDir);

  // Gebündeltes Node.js bevorzugen, System-Node als Fallback
  const bundledNode = vendorPath("node", "node.exe");
  const nodeExe = fs.existsSync(bundledNode) ? bundledNode : "node";

  apiProcess = spawn(nodeExe, ["dist/index.js"], {
    cwd: apiDir,
    stdio: "pipe",
  });

  apiProcess.stdout?.on("data", (d: Buffer) =>
    console.log("[API]", d.toString().trimEnd()),
  );
  apiProcess.stderr?.on("data", (d: Buffer) =>
    console.error("[API]", d.toString().trimEnd()),
  );
  apiProcess.on("exit", (code: number | null) =>
    console.log("[API] Prozess beendet, Code:", code),
  );
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

  registerIpc();
  createWindow(); // Splash sofort sichtbar während Dienste starten
  createTray();

  if (!isDev) {
    await freePort(API_PORT);
    await startMariaDB().catch((e) =>
      console.error("[ELLA] MariaDB-Fehler:", e),
    );
    await startOllama().catch((e) => console.error("[ELLA] Ollama-Fehler:", e));
    sendSetupStatus("Starte E.L.L.A.…");
    startApi();
    startKokoroTts();
    try {
      console.log(`[ELLA] Warte auf API :${API_PORT}…`);
      await waitForPort(API_PORT);
      console.log("[ELLA] API bereit.");
    } catch (e) {
      console.error("[ELLA] API-Start fehlgeschlagen:", e);
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
