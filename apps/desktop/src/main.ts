import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain } from "electron";
import type { Event as ElectronEvent } from "electron";
import { spawn } from "child_process";
import type { ChildProcess } from "child_process";
import * as net from "net";
import { deflateSync } from "zlib";
import * as path from "path";

const isDev = process.env.ELLA_DEV === "1";
const FRONTEND_URL = "http://127.0.0.1:5173";
const API_PORT = 3002;

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;
let apiProcess: ChildProcess | null = null;

// ── API-Spawn ─────────────────────────────────────────────────────────────────

function startApi(): void {
  const apiDir = path.join(app.getAppPath(), "../api");
  console.log("[ELLA] Starte API in:", apiDir);

  apiProcess = spawn("node", ["dist/index.js"], {
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

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;

  const raw = Buffer.alloc(size * (1 + size * 3));
  for (let y = 0; y < size; y++) {
    const off = y * (1 + size * 3);
    raw[off] = 0;
    for (let x = 0; x < size; x++) {
      raw[off + 1 + x * 3] = 124;
      raw[off + 1 + x * 3 + 1] = 58;
      raw[off + 1 + x * 3 + 2] = 237;
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
    mainWindow?.hide();
    mainWindow?.setSkipTaskbar(true);
  });

  mainWindow.on("close", (e: ElectronEvent) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow?.hide();
      mainWindow?.setSkipTaskbar(true);
    }
  });
}

// ── Tray ──────────────────────────────────────────────────────────────────────

function createTray(): void {
  const icon = nativeImage.createFromBuffer(buildPngIcon(32));
  tray = new Tray(icon);
  tray.setToolTip("E.L.L.A. — Embedded Local Logic Agent");

  const menu = Menu.buildFromTemplate([
    { label: "E.L.L.A. öffnen", click: showWindow },
    { type: "separator" },
    {
      label: "Beenden",
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(menu);
  tray.on("click", () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
      mainWindow.setSkipTaskbar(true);
    } else {
      showWindow();
    }
  });
}

function showWindow(): void {
  if (!mainWindow) return;
  mainWindow.setSkipTaskbar(false);
  mainWindow.show();
  mainWindow.focus();
}

// ── IPC ───────────────────────────────────────────────────────────────────────

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

  if (!isDev) {
    startApi();
    try {
      console.log(`[ELLA] Warte auf API :${API_PORT}…`);
      await waitForPort(API_PORT);
      console.log("[ELLA] API bereit.");
    } catch (e) {
      console.error("[ELLA] API-Start fehlgeschlagen:", e);
    }
  }

  registerIpc();
  createWindow();
  createTray();
});

app.on("window-all-closed", () => {
  /* Tray-App — absichtlich leer */
});

app.on("before-quit", () => {
  isQuitting = true;
  if (apiProcess && !apiProcess.killed) {
    apiProcess.kill();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
  else showWindow();
});
