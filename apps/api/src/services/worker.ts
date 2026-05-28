import os from "os";
import { execSync, exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
import { pool } from "../config/database.js";
import { env } from "../config/env.js";
import { eventBus, EVENT_SYSTEM, type SystemEvent } from "./eventBus.js";
import { remember } from "./memory.js";

const INTERVAL_MS = Number(process.env.WORKER_INTERVAL_MS ?? 60_000);
const DISK_ALERT_THRESHOLD = Number(process.env.DISK_ALERT_THRESHOLD ?? 85);

// ── Disk ──────────────────────────────────────────────────────────────────────

interface DiskMetric {
  drive: string;
  usedPct: number;
  freeBytes: number;
  totalBytes: number;
}

// WMIC ist seit Windows 11 22H2 deprecated. Fallback:
//   Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='${drive}:'" | Select FreeSpace,Size
export function getDiskMetric(drive: string): DiskMetric | null {
  try {
    const out = execSync(
      `wmic logicaldisk where "DeviceID='${drive}:'" get FreeSpace,Size /format:csv`,
      { stdio: ["ignore", "pipe", "ignore"], encoding: "utf-8" },
    );
    const lines = out.trim().split("\n").filter(Boolean);
    const data = lines[lines.length - 1].split(",");
    if (data.length < 3) return null;
    const free = Number(data[1]);
    const total = Number(data[2]);
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

// Returns drive letters for fixed (DriveType 3) and removable (DriveType 2) disks.
// WMIC fallback: Get-CimInstance Win32_LogicalDisk | Where { $_.DriveType -in 2,3 } | Select DeviceID
function getLogicalDrives(): string[] {
  try {
    const out = execSync(
      "wmic logicaldisk get DeviceID,DriveType /format:csv",
      { stdio: ["ignore", "pipe", "ignore"], encoding: "utf-8" },
    );
    const drives: string[] = [];
    for (const line of out.trim().split("\n")) {
      const cols = line.split(",");
      if (cols.length < 3) continue;
      const driveType = cols[2].trim();
      if (driveType !== "2" && driveType !== "3") continue;
      const letter = cols[1].replace(":", "").trim().toUpperCase();
      if (letter.length === 1) drives.push(letter);
    }
    return drives.length > 0 ? drives : ["C"];
  } catch {
    return ["C"];
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
      "$procs = @{}; Get-Process | ForEach-Object { $procs[$_.Id] = $_.ProcessName }; " +
      "Get-NetTCPConnection -State Listen,Established | " +
      "Select-Object LocalAddress,LocalPort,RemoteAddress,RemotePort,State,OwningProcess | " +
      "ForEach-Object { $_ | Add-Member -NotePropertyName ProcessName -NotePropertyValue ($procs[$_.OwningProcess] ?? 'Unknown') -Force; $_ } | " +
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

function getListeningPorts(): Set<number> {
  try {
    const script =
      "Get-NetTCPConnection -State Listen | Select-Object -ExpandProperty LocalPort | Sort-Object -Unique | ConvertTo-Json -Compress";
    const encoded = Buffer.from(script, "utf16le").toString("base64");
    const out = execSync(
      `powershell -NoProfile -NonInteractive -EncodedCommand ${encoded}`,
      { stdio: ["ignore", "pipe", "ignore"], encoding: "utf-8", timeout: 8000 },
    );
    const raw = out.trim();
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    const items = Array.isArray(parsed) ? parsed : [parsed];
    return new Set(items.filter((p) => typeof p === "number") as number[]);
  } catch {
    return new Set();
  }
}

function checkFirewallDisabled(): string[] {
  try {
    const script =
      "Get-NetFirewallProfile | Where-Object { -not $_.Enabled } | Select-Object -ExpandProperty Name | ConvertTo-Json -Compress";
    const encoded = Buffer.from(script, "utf16le").toString("base64");
    const out = execSync(
      `powershell -NoProfile -NonInteractive -EncodedCommand ${encoded}`,
      { stdio: ["ignore", "pipe", "ignore"], encoding: "utf-8", timeout: 8000 },
    );
    const raw = out.trim();
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [parsed as string];
  } catch {
    return [];
  }
}

function checkOpenWifi(): boolean {
  try {
    const out = execSync("netsh wlan show interfaces", {
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf-8",
    });
    const authLine = out
      .split("\n")
      .find((l) => l.toLowerCase().includes("authentication"));
    return !!authLine && authLine.toLowerCase().includes(": open");
  } catch {
    return false;
  }
}

function getDnsServers(): string {
  try {
    const script =
      "Get-DnsClientServerAddress -AddressFamily IPv4 | Select-Object -ExpandProperty ServerAddresses | Where-Object { $_ } | Sort-Object -Unique | ConvertTo-Json -Compress";
    const encoded = Buffer.from(script, "utf16le").toString("base64");
    const out = execSync(
      `powershell -NoProfile -NonInteractive -EncodedCommand ${encoded}`,
      { stdio: ["ignore", "pipe", "ignore"], encoding: "utf-8", timeout: 8000 },
    );
    return out.trim();
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
let ollamaWasDown = false;
let lastDevices: Map<string, PnPDevice> = new Map();
let devicesInitialized = false;
let lastArpIps: Set<string> = new Set();
let arpInitialized = false;
let lastListeningPorts: Set<number> = new Set();
let portsInitialized = false;
let lastDnsServers = "";
let disabledFirewallProfiles: Set<string> = new Set();
let openWifiAlerted = false;

async function tick() {
  const now = new Date().toISOString();

  // ── Disk ──────────────────────────────────────────────────────
  for (const drive of getLogicalDrives()) {
    const m = getDiskMetric(drive);
    if (!m) continue;

    const id = await writeEvent("disk", {
      drive: m.drive,
      usedPct: m.usedPct,
      freeBytes: m.freeBytes,
      totalBytes: m.totalBytes,
    });

    emit({
      id,
      type: "disk",
      payload: { drive: m.drive, usedPct: m.usedPct },
      created_at: now,
    });

    if (m.usedPct >= DISK_ALERT_THRESHOLD) {
      const alertId = await writeEvent("alert", {
        severity: "warning",
        message: `Disk ${drive}: ${m.usedPct}% belegt`,
        drive: m.drive,
        usedPct: m.usedPct,
      });
      emit({
        id: alertId,
        type: "alert",
        payload: {
          severity: "warning",
          message: `Disk ${drive}: ${m.usedPct}% belegt`,
        },
        created_at: now,
      });
    }
  }

  // ── RAM ───────────────────────────────────────────────────────
  const ram = ramMetric();
  const ramId = await writeEvent("ram", ram);
  emit({ id: ramId, type: "ram", payload: ram, created_at: now });

  // ── Ollama ────────────────────────────────────────────────────
  const ollamaOk = await checkOllama();
  const ollamaId = await writeEvent("ollama", { ok: ollamaOk });
  emit({
    id: ollamaId,
    type: "ollama",
    payload: { ok: ollamaOk },
    created_at: now,
  });

  if (!ollamaOk && !ollamaWasDown) {
    const alertId = await writeEvent("alert", {
      severity: "error",
      message: "Ollama nicht erreichbar",
    });
    emit({
      id: alertId,
      type: "alert",
      payload: { severity: "error", message: "Ollama nicht erreichbar" },
      created_at: now,
    });
  }
  ollamaWasDown = !ollamaOk;

  // ── PnP Delta-Detection ───────────────────────────────────────
  const currentDevices = getPnPSnapshot();

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

  const currentPorts = getListeningPorts();
  if (!portsInitialized) {
    lastListeningPorts = currentPorts;
    portsInitialized = true;
  } else {
    for (const port of currentPorts) {
      if (!lastListeningPorts.has(port)) {
        const alertId = await writeEvent("alert", {
          severity: "warning",
          message: `Neuer lauschender Port geöffnet: ${port}`,
          port,
        });
        emit({
          id: alertId,
          type: "alert",
          payload: {
            severity: "warning",
            message: `Neuer lauschender Port geöffnet: ${port}`,
          },
          created_at: now,
        });
      }
    }
    lastListeningPorts = currentPorts;
  }

  const nowDisabled = new Set(checkFirewallDisabled());
  for (const profile of nowDisabled) {
    if (!disabledFirewallProfiles.has(profile)) {
      const alertId = await writeEvent("alert", {
        severity: "error",
        message: `Firewall deaktiviert: ${profile}`,
        profile,
      });
      emit({
        id: alertId,
        type: "alert",
        payload: {
          severity: "error",
          message: `Firewall deaktiviert: ${profile}`,
        },
        created_at: now,
      });
    }
  }
  disabledFirewallProfiles = nowDisabled;

  const wifiOpen = checkOpenWifi();
  if (wifiOpen && !openWifiAlerted) {
    const alertId = await writeEvent("alert", {
      severity: "warning",
      message: "Offenes WLAN ohne Verschlüsselung erkannt",
    });
    emit({
      id: alertId,
      type: "alert",
      payload: {
        severity: "warning",
        message: "Offenes WLAN ohne Verschlüsselung erkannt",
      },
      created_at: now,
    });
  }
  openWifiAlerted = wifiOpen;

  const currentDns = getDnsServers();
  if (lastDnsServers && currentDns && currentDns !== lastDnsServers) {
    const alertId = await writeEvent("alert", {
      severity: "warning",
      message: "DNS-Server haben sich geändert",
    });
    emit({
      id: alertId,
      type: "alert",
      payload: {
        severity: "warning",
        message: "DNS-Server haben sich geändert",
      },
      created_at: now,
    });
  }
  if (currentDns) lastDnsServers = currentDns;
}

export const worker = {
  start() {
    if (timer) return;
    tick().catch(() => {});
    timer = setInterval(() => tick().catch(() => {}), INTERVAL_MS);
  },
  stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  },
};
