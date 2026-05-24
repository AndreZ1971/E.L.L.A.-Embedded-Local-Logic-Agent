import { app, BrowserWindow, Tray, Menu, nativeImage } from 'electron';
import type { Event as ElectronEvent } from 'electron';
import { deflateSync } from 'zlib';
import * as path from 'path';

const isDev = !app.isPackaged;
const FRONTEND_URL = 'http://localhost:5173';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

// Erzeugt ein einfaches PNG-Icon ohne externe Abhängigkeiten.
// r=124 g=58 b=237 → #7C3AED (Violet) als E.L.L.A.-Farbe.
function buildPngIcon(size: number): Buffer {
  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    crcTable[n] = c;
  }
  const crc32 = (buf: Buffer): number => {
    let crc = 0xFFFFFFFF;
    for (const byte of buf) crc = crcTable[(crc ^ byte) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  };
  const chunk = (type: string, data: Buffer): Buffer => {
    const t = Buffer.from(type, 'ascii');
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
    return Buffer.concat([len, t, data, crc]);
  };

  // IHDR: Breite, Höhe, 8-bit RGB (color type 2)
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;

  // Scanlines: 1 Filter-Byte + size * 3 RGB-Bytes pro Zeile
  const raw = Buffer.alloc(size * (1 + size * 3));
  for (let y = 0; y < size; y++) {
    const off = y * (1 + size * 3);
    raw[off] = 0; // Filter: None
    for (let x = 0; x < size; x++) {
      raw[off + 1 + x * 3]     = 124; // R
      raw[off + 1 + x * 3 + 1] = 58;  // G
      raw[off + 1 + x * 3 + 2] = 237; // B
    }
  }

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG-Signatur
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width:    1100,
    height:   750,
    minWidth: 800,
    minHeight: 550,
    title: 'E.L.L.A.',
    icon: nativeImage.createFromBuffer(buildPngIcon(64)),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false, // erst anzeigen wenn geladen
  });

  if (isDev) {
    mainWindow.loadURL(FRONTEND_URL);
  } else {
    // dist/main/index.js → ../../web/dist/index.html
    mainWindow.loadFile(path.join(__dirname, '../../../web/dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  // Minimieren → in Tray legen statt Taskleiste
  mainWindow.on('minimize', () => {
    mainWindow?.hide();
    mainWindow?.setSkipTaskbar(true);
  });

  // Schließen → in Tray legen (außer beim echten Beenden via Tray-Menü)
  mainWindow.on('close', (e: ElectronEvent) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow?.hide();
      mainWindow?.setSkipTaskbar(true);
    }
  });
}

function createTray(): void {
  const icon = nativeImage.createFromBuffer(buildPngIcon(32));
  tray = new Tray(icon);
  tray.setToolTip('E.L.L.A. — Embedded Local Logic Agent');

  const menu = Menu.buildFromTemplate([
    {
      label: 'E.L.L.A. öffnen',
      click: showWindow,
    },
    { type: 'separator' },
    {
      label: 'Beenden',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(menu);

  // Linksklick auf Tray-Icon → Fenster ein-/ausblenden
  tray.on('click', () => {
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

app.whenReady().then(() => {
  // Nur eine Instanz erlauben
  if (!app.requestSingleInstanceLock()) {
    app.quit();
    return;
  }

  // Zweite Instanz öffnet das bestehende Fenster
  app.on('second-instance', () => showWindow());

  createWindow();
  createTray();
});

// Fenster geschlossen ≠ App beendet — wir leben im Tray weiter
app.on('window-all-closed', () => { /* nichts tun */ });

app.on('before-quit', () => {
  isQuitting = true;
});

// macOS: Dock-Klick öffnet das Fenster (falls je portiert)
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
  else showWindow();
});
