import os from "os";
import { execSync, exec, spawn } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
import { pool } from "../config/database.js";
import { env } from "../config/env.js";
import { eventBus, EVENT_SYSTEM, type SystemEvent } from "./eventBus.js";
import { remember } from "./memory.js";
import { recordClipboard, detectPattern } from "./clipboardHistory.js";
import { getSettings } from "./settings.js";
import { toolExecutor } from "../tools/executor.js";
import { sendProactiveMessage } from "./proactive.js";
import { analyzeRhythm } from "./rhythmLearner.js";
import { checkUpcomingMeetings } from "./meetingPrep.js";
import { checkDayBriefing } from "./dayBriefing.js";
import { findDuplicates } from "./duplicateFinder.js";
import { runReflection } from "./reflection.js";
import { indexFolder, getIndexStats } from "./documentIndex.js";

const INTERVAL_MS = Number(process.env.WORKER_INTERVAL_MS ?? 60_000);
const DISK_ALERT_THRESHOLD = Number(process.env.DISK_ALERT_THRESHOLD ?? 85);

// ── Disk ──────────────────────────────────────────────────────────────────────

interface DiskMetric {
  drive: string;
  usedPct: number;
  freeBytes: number;
  totalBytes: number;
}

function psEncode(script: string): string {
  return Buffer.from(
    `$ProgressPreference='SilentlyContinue'\n${script}`,
    "utf16le",
  ).toString("base64");
}

function psSync(script: string): string {
  return execSync(
    `powershell -NoProfile -NonInteractive -EncodedCommand ${psEncode(script)}`,
    { stdio: ["ignore", "pipe", "ignore"], encoding: "utf-8", timeout: 8000 },
  );
}

// Async version — does NOT block the Node event loop (important during Ollama streaming)
function psAsync(script: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      "powershell",
      ["-NoProfile", "-NonInteractive", "-EncodedCommand", psEncode(script)],
      { stdio: ["ignore", "pipe", "ignore"] },
    );
    let out = "";
    proc.stdout?.on("data", (d: Buffer) => (out += d.toString()));
    const timer = setTimeout(() => {
      proc.kill();
      reject(new Error("psAsync timeout"));
    }, 8000);
    proc.on("close", (code: number | null) => {
      clearTimeout(timer);
      if (code !== 0 && !out.trim()) reject(new Error(`PS exit ${code}`));
      else resolve(out);
    });
    proc.on("error", reject);
  });
}

export function getDiskMetric(drive: string): DiskMetric | null {
  try {
    const script = `Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='${drive}:'" | Select-Object FreeSpace,Size | ConvertTo-Json -Compress`;
    const raw = psSync(script).trim();
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { FreeSpace: number; Size: number };
    const free = Number(parsed.FreeSpace);
    const total = Number(parsed.Size);
    if (!total) return null;
    return {
      drive,
      usedPct: Math.round(((total - free) / total) * 100),
      freeBytes: free,
      totalBytes: total,
    };
  } catch {
    return null;
  }
}

function getLogicalDrives(): string[] {
  try {
    const script = `Get-CimInstance Win32_LogicalDisk | Where-Object { $_.DriveType -in 2,3 } | Select-Object DeviceID | ConvertTo-Json -Compress`;
    const raw = psSync(script).trim();
    if (!raw) return ["C"];
    const parsed = JSON.parse(raw) as
      { DeviceID: string } | { DeviceID: string }[];
    const items = Array.isArray(parsed) ? parsed : [parsed];
    const drives = items
      .map((i) => i.DeviceID.replace(":", "").trim().toUpperCase())
      .filter((l) => l.length === 1);
    return drives.length > 0 ? drives : ["C"];
  } catch {
    return ["C"];
  }
}

// Async variants used in tick() so the event loop stays free during Ollama streaming
async function getLogicalDrivesAsync(): Promise<string[]> {
  try {
    const script = `Get-CimInstance Win32_LogicalDisk | Where-Object { $_.DriveType -in 2,3 } | Select-Object DeviceID | ConvertTo-Json -Compress`;
    const raw = (await psAsync(script)).trim();
    if (!raw) return ["C"];
    const parsed = JSON.parse(raw) as
      { DeviceID: string } | { DeviceID: string }[];
    const items = Array.isArray(parsed) ? parsed : [parsed];
    const drives = items
      .map((i) => i.DeviceID.replace(":", "").trim().toUpperCase())
      .filter((l) => l.length === 1);
    return drives.length > 0 ? drives : ["C"];
  } catch {
    return ["C"];
  }
}

async function getDiskMetricAsync(drive: string): Promise<DiskMetric | null> {
  try {
    const script = `Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='${drive}:'" | Select-Object FreeSpace,Size | ConvertTo-Json -Compress`;
    const raw = (await psAsync(script)).trim();
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { FreeSpace: number; Size: number };
    const free = Number(parsed.FreeSpace);
    const total = Number(parsed.Size);
    if (!total) return null;
    return {
      drive,
      usedPct: Math.round(((total - free) / total) * 100),
      freeBytes: free,
      totalBytes: total,
    };
  } catch {
    return null;
  }
}

// ── PnP ───────────────────────────────────────────────────────────────────────

export function computePnPDelta(
  current: Map<string, PnPDevice>,
  last: Map<string, PnPDevice>,
): { connected: PnPDevice[]; disconnected: PnPDevice[] } {
  const connected: PnPDevice[] = [];
  const disconnected: PnPDevice[] = [];
  for (const [id, device] of current) {
    if (!last.has(id)) connected.push(device);
  }
  for (const [id, device] of last) {
    if (!current.has(id)) disconnected.push(device);
  }
  return { connected, disconnected };
}

export interface PnPDevice {
  instanceId: string;
  name: string;
  class: string;
}

export function getPnPSnapshot(): Map<string, PnPDevice> {
  const map = new Map<string, PnPDevice>();
  try {
    const script =
      "Get-PnpDevice -Class Camera,Image,DiskDrive,USB -Status OK | Select-Object InstanceId,FriendlyName,Class | ConvertTo-Json -Compress";
    const encoded = Buffer.from(script, "utf16le").toString("base64");
    const out = execSync(
      `powershell -NoProfile -NonInteractive -EncodedCommand ${encoded}`,
      { stdio: ["ignore", "pipe", "ignore"], encoding: "utf-8", timeout: 8000 },
    );
    const raw = out.trim();
    if (!raw) return map;
    const parsed: unknown = JSON.parse(raw);
    const items = Array.isArray(parsed) ? parsed : [parsed];
    for (const item of items as Array<Record<string, unknown>>) {
      const id = (item["InstanceId"] as string) ?? "";
      if (!id) continue;
      map.set(id, {
        instanceId: id,
        name: (item["FriendlyName"] as string) ?? "Unbekanntes Gerät",
        class: (item["Class"] as string) ?? "",
      });
    }
  } catch {
    // PnP query failed — return empty snapshot
  }
  return map;
}

async function getPnPSnapshotAsync(): Promise<Map<string, PnPDevice>> {
  const map = new Map<string, PnPDevice>();
  try {
    const script =
      "Get-PnpDevice -Class Camera,Image,DiskDrive,USB -Status OK | Select-Object InstanceId,FriendlyName,Class | ConvertTo-Json -Compress";
    const raw = (await psAsync(script)).trim();
    if (!raw) return map;
    const parsed: unknown = JSON.parse(raw);
    const items = Array.isArray(parsed) ? parsed : [parsed];
    for (const item of items as Array<Record<string, unknown>>) {
      const id = (item["InstanceId"] as string) ?? "";
      if (!id) continue;
      map.set(id, {
        instanceId: id,
        name: (item["FriendlyName"] as string) ?? "Unbekanntes Gerät",
        class: (item["Class"] as string) ?? "",
      });
    }
  } catch {
    // PnP query failed
  }
  return map;
}

// ── Network ───────────────────────────────────────────────────────────────────

export interface ArpEntry {
  ip: string;
  mac: string;
}

export function getArpSnapshot(): ArpEntry[] {
  const entries: ArpEntry[] = [];
  try {
    const out = execSync("arp -a", {
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf-8",
    });
    for (const line of out.split("\n")) {
      const m = line.match(/^\s+(\d+\.\d+\.\d+\.\d+)\s+([\w-]+)\s+dynamic/i);
      if (m) entries.push({ ip: m[1], mac: m[2].toLowerCase() });
    }
  } catch {
    // network unavailable
  }
  return entries;
}

export interface TcpConnection {
  localAddress: string;
  localPort: number;
  remoteAddress: string;
  remotePort: number;
  state: string;
  pid: number;
  processName: string;
}

export async function getTcpConnections(): Promise<TcpConnection[]> {
  try {
    const script =
      "$procs = @{}; Get-Process | ForEach-Object { $procs[[int]$_.Id] = $_.ProcessName }; " +
      "Get-NetTCPConnection -State Listen,Established | " +
      "Select-Object LocalAddress,LocalPort,RemoteAddress,RemotePort,State,OwningProcess | " +
      "ForEach-Object { $_ | Add-Member -NotePropertyName ProcessName -NotePropertyValue $(if ($procs[[int]$_.OwningProcess]) { $procs[[int]$_.OwningProcess] } else { 'Unknown' }) -Force; $_ } | " +
      "ConvertTo-Json -Compress";
    const encoded = Buffer.from(script, "utf16le").toString("base64");
    const { stdout } = await execAsync(
      `powershell -NoProfile -NonInteractive -EncodedCommand ${encoded}`,
      { timeout: 10000 },
    );
    const raw = stdout.trim();
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    const items = Array.isArray(parsed) ? parsed : [parsed];
    return (items as Array<Record<string, unknown>>).map((item) => ({
      localAddress: (item["LocalAddress"] as string) ?? "",
      localPort: Number(item["LocalPort"]) || 0,
      remoteAddress: (item["RemoteAddress"] as string) ?? "",
      remotePort: Number(item["RemotePort"]) || 0,
      state: (item["State"] as string) ?? "",
      pid: Number(item["OwningProcess"]) || 0,
      processName: (item["ProcessName"] as string) ?? "Unknown",
    }));
  } catch {
    return [];
  }
}

interface ListeningPort {
  port: number;
  pid: number;
  processName: string;
}

async function getListeningPortsWithProcess(): Promise<
  Map<number, ListeningPort>
> {
  try {
    const script =
      "$procs = @{}; Get-Process | ForEach-Object { $procs[[int]$_.Id] = $_.ProcessName }; " +
      "Get-NetTCPConnection -State Listen | " +
      "Select-Object LocalPort,OwningProcess | " +
      "ForEach-Object { [PSCustomObject]@{ port=$_.LocalPort; pid=$_.OwningProcess; processName=$(if ($procs[[int]$_.OwningProcess]) { $procs[[int]$_.OwningProcess] } else { 'Unknown' }) } } | " +
      "Sort-Object port -Unique | ConvertTo-Json -Compress";
    const encoded = Buffer.from(script, "utf16le").toString("base64");
    const { stdout } = await execAsync(
      `powershell -NoProfile -NonInteractive -EncodedCommand ${encoded}`,
      { timeout: 8000 },
    );
    const raw = stdout.trim();
    if (!raw) return new Map();
    const parsed: unknown = JSON.parse(raw);
    const items = Array.isArray(parsed) ? parsed : [parsed];
    const result = new Map<number, ListeningPort>();
    for (const item of items as Array<Record<string, unknown>>) {
      const port = Number(item["port"]) || 0;
      if (port > 0) {
        result.set(port, {
          port,
          pid: Number(item["pid"]) || 0,
          processName: (item["processName"] as string) ?? "Unknown",
        });
      }
    }
    return result;
  } catch {
    return new Map();
  }
}

async function checkFirewallDisabled(): Promise<string[]> {
  try {
    const script =
      "Get-NetFirewallProfile | Where-Object { -not $_.Enabled } | Select-Object -ExpandProperty Name | ConvertTo-Json -Compress";
    const raw = (await psAsync(script)).trim();
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [parsed as string];
  } catch {
    return [];
  }
}

async function checkOpenWifi(): Promise<boolean> {
  try {
    const { stdout } = await execAsync("netsh wlan show interfaces", {
      timeout: 5000,
    });
    const authLine = stdout
      .split("\n")
      .find((l) => l.toLowerCase().includes("authentication"));
    return !!authLine && authLine.toLowerCase().includes(": open");
  } catch {
    return false;
  }
}

async function getDnsServers(): Promise<string> {
  try {
    const script =
      "Get-DnsClientServerAddress -AddressFamily IPv4 | Select-Object -ExpandProperty ServerAddresses | Where-Object { $_ } | Sort-Object -Unique | ConvertTo-Json -Compress";
    return (await psAsync(script)).trim();
  } catch {
    return "";
  }
}

// ── Misc ──────────────────────────────────────────────────────────────────────

async function checkOllama(): Promise<boolean> {
  try {
    const resp = await fetch(`${env.ollamaBaseUrl}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    return resp.ok;
  } catch {
    return false;
  }
}

function ramMetric() {
  const total = os.totalmem();
  const free = os.freemem();
  return {
    usedPct: Math.round(((total - free) / total) * 100),
    freeBytes: free,
    totalBytes: total,
  };
}

async function writeEvent(
  type: string,
  payload: Record<string, unknown>,
): Promise<number> {
  const [result] = await pool.execute<any>(
    "INSERT INTO system_events (type, payload) VALUES (?, ?)",
    [type, JSON.stringify(payload)],
  );
  return result.insertId as number;
}

function emit(event: SystemEvent) {
  eventBus.emit(EVENT_SYSTEM, event);
}

let timer: ReturnType<typeof setInterval> | null = null;
let clipboardTimer: ReturnType<typeof setInterval> | null = null;
let ollamaWasDown = false;

// ── Proaktiv-State ─────────────────────────────────────────────────────────────
export let lastActivityTime = Date.now();
let wasInactive = false;
const INACTIVE_THRESHOLD_MS = 30 * 60 * 1000;
let lastBreakReminder = Date.now();
const BREAK_INTERVAL_MS = 90 * 60 * 1000;

export function recordActivity(): void {
  const wasAway = Date.now() - lastActivityTime > INACTIVE_THRESHOLD_MS;
  lastActivityTime = Date.now();
  if (wasAway && wasInactive) {
    wasInactive = false;
    triggerComebackBriefing().catch(() => {});
  }
}

async function triggerComebackBriefing(): Promise<void> {
  try {
    const [alertRows] = await pool.execute<any[]>(`
      SELECT payload FROM system_events
      WHERE type = 'alert' AND created_at > DATE_SUB(NOW(), INTERVAL 45 MINUTE)
    `);
    let msg = "Willkommen zurück.";
    if (alertRows.length > 0) {
      msg += ` Während du weg warst: ${alertRows.length} System-Alert${alertRows.length > 1 ? "s" : ""}.`;
    }
    sendProactiveMessage(msg, "info", "comeback_briefing");
  } catch {
    // DB nicht verfügbar
  }
}
let lastDevices: Map<string, PnPDevice> = new Map();
let devicesInitialized = false;
let lastArpIps: Set<string> = new Set();
let arpInitialized = false;
let lastListeningPorts: Map<number, ListeningPort> = new Map();
let portsInitialized = false;
let lastDnsServers = "";
let disabledFirewallProfiles: Set<string> = new Set();
let openWifiAlerted = false;

async function tick() {
  const now = new Date().toISOString();

  // ── Disk ──────────────────────────────────────────────────────
  for (const drive of await getLogicalDrivesAsync()) {
    const m = await getDiskMetricAsync(drive);
    if (!m) continue;

    await writeEvent("disk", {
      drive: m.drive,
      usedPct: m.usedPct,
      freeBytes: m.freeBytes,
      totalBytes: m.totalBytes,
    });

    if (m.usedPct >= DISK_ALERT_THRESHOLD) {
      await writeEvent("alert", {
        severity: "warning",
        message: `Disk ${drive}: ${m.usedPct}% belegt`,
        drive: m.drive,
        usedPct: m.usedPct,
      });
    }
  }

  // ── RAM ───────────────────────────────────────────────────────
  const ram = ramMetric();
  await writeEvent("ram", ram);

  // ── Ollama ────────────────────────────────────────────────────
  const ollamaOk = await checkOllama();
  await writeEvent("ollama", { ok: ollamaOk });

  if (!ollamaOk && !ollamaWasDown) {
    await writeEvent("alert", {
      severity: "error",
      message: "Ollama nicht erreichbar",
    });
  }
  ollamaWasDown = !ollamaOk;

  // ── PnP Delta-Detection ───────────────────────────────────────
  const currentDevices = await getPnPSnapshotAsync();

  if (!devicesInitialized) {
    lastDevices = currentDevices;
    devicesInitialized = true;
  } else {
    for (const [id, device] of currentDevices) {
      if (!lastDevices.has(id)) {
        const evId = await writeEvent("device_connected", {
          instanceId: id,
          name: device.name,
          class: device.class,
        });
        emit({
          id: evId,
          type: "device_connected",
          payload: { name: device.name, class: device.class },
          created_at: now,
        });
        remember(
          "system",
          `Gerät verbunden: ${device.name} (${device.class})`,
        ).catch(() => {});
      }
    }

    for (const [id, device] of lastDevices) {
      if (!currentDevices.has(id)) {
        const evId = await writeEvent("device_disconnected", {
          instanceId: id,
          name: device.name,
          class: device.class,
        });
        emit({
          id: evId,
          type: "device_disconnected",
          payload: { name: device.name, class: device.class },
          created_at: now,
        });
      }
    }

    lastDevices = currentDevices;
  }

  // ── Network ────────────────────────────────────────────────────
  const arpEntries = getArpSnapshot();
  const currentArpIps = new Set(arpEntries.map((e) => e.ip));

  if (!arpInitialized) {
    lastArpIps = currentArpIps;
    arpInitialized = true;
  } else {
    for (const entry of arpEntries) {
      if (!lastArpIps.has(entry.ip)) {
        const evId = await writeEvent("network_device_connected", {
          ip: entry.ip,
          mac: entry.mac,
        });
        emit({
          id: evId,
          type: "network_device_connected",
          payload: { ip: entry.ip, mac: entry.mac },
          created_at: now,
        });
        remember(
          "system",
          `Netzwerkgerät erkannt: ${entry.ip} (${entry.mac})`,
        ).catch(() => {});
      }
    }
    lastArpIps = currentArpIps;
  }

  const currentPorts = await getListeningPortsWithProcess();
  if (!portsInitialized) {
    lastListeningPorts = currentPorts;
    portsInitialized = true;
  } else {
    for (const [port, info] of currentPorts) {
      if (!lastListeningPorts.has(port)) {
        const suspicious = info.processName === "Unknown";
        const evId = await writeEvent("port_opened", {
          port,
          pid: info.pid,
          processName: info.processName,
          suspicious,
        });
        // Dashboard-SSE — kein Chat, kein TTS
        emit({
          id: evId,
          type: "port_opened",
          payload: { port, processName: info.processName, suspicious },
          created_at: now,
        });
      }
    }
    lastListeningPorts = currentPorts;
  }

  const nowDisabled = new Set(await checkFirewallDisabled());
  for (const profile of nowDisabled) {
    if (!disabledFirewallProfiles.has(profile)) {
      await writeEvent("alert", {
        severity: "error",
        message: `Firewall deaktiviert: ${profile}`,
        profile,
      });
    }
  }
  disabledFirewallProfiles = nowDisabled;

  const wifiOpen = await checkOpenWifi();
  if (wifiOpen && !openWifiAlerted) {
    await writeEvent("alert", {
      severity: "warning",
      message: "Offenes WLAN ohne Verschlüsselung erkannt",
    });
  }
  openWifiAlerted = wifiOpen;

  const currentDns = await getDnsServers();
  if (lastDnsServers && currentDns && currentDns !== lastDnsServers) {
    await writeEvent("alert", {
      severity: "warning",
      message: "DNS-Server haben sich geändert",
    });
  }
  if (currentDns) lastDnsServers = currentDns;

  // ── Proaktive Intelligenz ──────────────────────────────────────────────────
  const now2 = new Date();
  const hour = now2.getHours();
  const minute = now2.getMinutes();

  // Inaktivität festhalten
  if (Date.now() - lastActivityTime > INACTIVE_THRESHOLD_MS) {
    wasInactive = true;
  }

  // Pause-Erinnerung alle 90 Minuten wenn Nutzer aktiv
  const timeSinceBreak = Date.now() - lastBreakReminder;
  const timeSinceActivity = Date.now() - lastActivityTime;
  if (timeSinceBreak > BREAK_INTERVAL_MS && timeSinceActivity < 5 * 60 * 1000) {
    lastBreakReminder = Date.now();
    sendProactiveMessage(
      `Du arbeitest seit ${Math.round(timeSinceBreak / 60000)} Minuten ohne Pause. ` +
        `Kurze Unterbrechung empfohlen.`,
      "info",
      "break_reminder",
    );
  }

  // Meeting-Vorbereitung alle 5 Minuten
  if (minute % 5 === 0) {
    checkUpcomingMeetings().catch(() => {});
  }

  // Tagesabschluss um 18 Uhr
  checkDayBriefing().catch(() => {});

  // Rhythmus-Analyse täglich um 12 Uhr
  if (hour === 12 && minute < 1) {
    analyzeRhythm().catch(() => {});
  }

  // Erfahrungsreflexion mittwochs um 14 Uhr
  if (now2.getDay() === 3 && hour === 14 && minute < 1) {
    runReflection()
      .then((r) => {
        if (r.derived > 0) {
          sendProactiveMessage(
            `Ich habe gerade über meine Erfahrungen nachgedacht und ${r.derived} neue ${r.derived === 1 ? "Erkenntnis" : "Erkenntnisse"} gewonnen.`,
            "info",
            "reflection",
          );
        }
      })
      .catch(() => {});
  }

  // Dokument-Re-Index täglich um 03:00 Uhr
  if (hour === 3 && minute < 1) {
    const { indexedFolders } = getSettings();
    if (indexedFolders.length > 0) {
      let totalNew = 0;
      for (const folder of indexedFolders) {
        try {
          const r = await indexFolder(folder, null);
          totalNew += r.indexed;
        } catch {
          // Ordner nicht verfügbar — überspringen
        }
      }
      if (totalNew > 0) {
        const stats = await getIndexStats();
        sendProactiveMessage(
          `Ich habe heute Nacht deine ${indexedFolders.length} indizierten ${indexedFolders.length === 1 ? "Ordner" : "Ordner"} aktualisiert — ${totalNew} neue ${totalNew === 1 ? "Datei" : "Dateien"} eingelesen. Insgesamt kenne ich jetzt ${stats.files} Dokumente.`,
          "info",
          "document_reindex",
        );
      }
    }
  }

  // Duplikat-Scan sonntags um 10 Uhr
  if (now2.getDay() === 0 && hour === 10 && minute < 1) {
    try {
      const dupes = findDuplicates();
      const totalWasted = dupes.reduce((s, d) => s + d.wastedMB, 0);
      if (totalWasted > 500) {
        sendProactiveMessage(
          `Ich habe ${dupes.length} doppelte Dateigruppen gefunden die ${totalWasted.toFixed(0)} MB belegen. ` +
            `Soll ich dir die Liste zeigen?`,
          "suggestion",
          "duplicate_scan",
        );
      }
    } catch {
      // Laufwerke nicht verfügbar
    }
  }

  // ── Wecker ────────────────────────────────────────────────────
  try {
    const nowD = new Date();
    const timeNow = `${String(nowD.getHours()).padStart(2, "0")}:${String(nowD.getMinutes()).padStart(2, "0")}`;
    const todayStr = nowD.toISOString().slice(0, 10);
    const [rows] = await pool.execute(
      `SELECT id, label FROM alarms WHERE active = TRUE AND time_hhmm = ? AND (last_fired IS NULL OR last_fired < ?)`,
      [timeNow, todayStr],
    );
    for (const alarm of rows as Array<{ id: number; label: string }>) {
      await pool.execute(`UPDATE alarms SET last_fired = ? WHERE id = ?`, [
        todayStr,
        alarm.id,
      ]);
      sendProactiveMessage(`⏰ Wecker: ${alarm.label}`, "alarm", "alarm");
    }
  } catch {
    // alarms-Tabelle noch nicht migriert
  }

  // ── Zeitgesteuerte Setups ────────────────────────────────────
  checkScheduledSetups().catch(() => {});
}

// ── Scheduled Setups ──────────────────────────────────────────────────────────
// In-memory dedup: "<setupId>-YYYY-MM-DDTHH:MM" — resets on restart
const firedScheduleKeys = new Set<string>();

async function checkScheduledSetups(): Promise<void> {
  const { setups } = getSettings();
  if (!setups?.length) return;

  const now = new Date();
  const day = now.getDay();
  const timeNow = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const minuteKey = now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM

  for (const setup of setups) {
    if (!setup.schedule) continue;
    if (!setup.schedule.days.includes(day)) continue;
    if (setup.schedule.time !== timeNow) continue;

    const key = `${setup.id}-${minuteKey}`;
    if (firedScheduleKeys.has(key)) continue;
    firedScheduleKeys.add(key);

    // Cleanup alter Keys (>2h) damit das Set nicht unbegrenzt wächst
    if (firedScheduleKeys.size > 500) {
      const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 16);
      for (const k of firedScheduleKeys) {
        if (k.endsWith(cutoff.slice(0, 13))) firedScheduleKeys.delete(k);
      }
    }

    try {
      await toolExecutor.execute({
        tool: "load_setup",
        args: { name: setup.name },
      });
      sendProactiveMessage(
        `⏰ Setup "${setup.name}" wurde automatisch gestartet.`,
        "info",
        "scheduled_setup",
      );
    } catch {
      // Setup nicht gefunden oder Fehler beim Ausführen — still ignorieren
    }
  }
}

export const worker = {
  start() {
    if (timer) return;
    tick().catch(() => {});
    timer = setInterval(() => tick().catch(() => {}), INTERVAL_MS);

    // Clipboard-Polling alle 3 Sekunden
    let lastClip = "";
    let clipboardFailCount = 0;
    clipboardTimer = setInterval(() => {
      if (clipboardFailCount >= 3) return; // nach 3 Fehlern deaktivieren
      try {
        // try/catch im PS-Script verhindert stderr-Output bei fehlendem Clipboard
        const ps =
          "try { Get-Clipboard -Raw } catch { [System.String]::Empty }";
        const clip = execSync(
          `powershell -NoProfile -NonInteractive -EncodedCommand ${psEncode(ps)}`,
          {
            encoding: "utf-8",
            timeout: 2000,
            stdio: ["ignore", "pipe", "ignore"],
          },
        ).trim();
        clipboardFailCount = 0;
        if (clip && clip !== lastClip && clip.length < 50000) {
          lastClip = clip;
          recordClipboard(clip);
          if (getSettings().clipboardPatternEnabled) {
            const pattern = detectPattern(clip);
            if (pattern) {
              sendProactiveMessage(
                pattern.suggestion,
                "suggestion",
                "clipboard_pattern",
              );
            }
          }
        }
      } catch {
        clipboardFailCount++;
      }
    }, 3000);
  },
  stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    if (clipboardTimer) {
      clearInterval(clipboardTimer);
      clipboardTimer = null;
    }
  },
};
