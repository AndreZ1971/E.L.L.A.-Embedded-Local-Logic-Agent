import {
  openApp,
  getDiskUsage,
  cleanTemp,
  emptyRecycleBin,
} from "@ella/agent-tools";
import { execSync, exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
import * as path from "path";
import { getSettings, saveSettings } from "../services/settings.js";
import { createRule as createRuleInDb } from "../services/rules.js";
import {
  activateHomeworkMode,
  deactivateHomeworkMode,
} from "../services/homework.js";
import {
  remember,
  forgetById,
  listMemories,
  trackToolUsage,
} from "../services/memory.js";
import { evaluateRules } from "../services/rules.js";
import os from "os";
import { scanHardware } from "../services/systemScan.js";
import {
  getPnPSnapshot,
  getArpSnapshot,
  getTcpConnections,
} from "../services/worker.js";
import { readEmails, markEmail as markEmailService } from "../services/mail.js";
import {
  readCalendar,
  createAppointment as createOutlookAppointment,
} from "../services/calendar.js";
import { pool } from "../config/database.js";
import { env } from "../config/env.js";
import { openaiClient } from "../services/openai.js";
import {
  searchWeb as searchWebDDG,
  fetchUrl as fetchUrlService,
} from "../services/webSearch.js";
import { getWeather } from "../services/weather.js";
import {
  BLOCKED_PATH_FRAGMENTS,
  BLOCKED_NAME_PATTERNS,
} from "../routes/system.js";
import {
  readGmailMessages,
  markGmailMessage,
} from "../services/google/gmail.js";
import {
  readGoogleCalendar,
  createGoogleAppointment as createGoogleAppt,
} from "../services/google/calendar.js";
import type { ToolCall, ToolResult, ToolName } from "@ella/shared";

type Handler = (args: Record<string, unknown>) => Promise<ToolResult>;

// ── Drive-Hilfsfunktionen ─────────────────────────────────────────────────────

function escLabel(s: string): string {
  return s.replace(/'/g, "''");
}

export function getDriveType(letter: string): number {
  try {
    // wmic gibt UTF-16 LE zurück — als Buffer lesen, dann dekodieren
    const raw = execSync(
      `wmic logicaldisk where DeviceID="${letter}:" get DriveType /format:value`,
      { stdio: ["ignore", "pipe", "ignore"], timeout: 5000 },
    );
    // In Tests kommt ein String (Mock) — in Produktion ein Buffer
    const out =
      typeof raw === "string"
        ? raw
        : (raw as unknown as Buffer).toString("utf16le");
    const line = out
      .split(/\r?\n/)
      .map((l) => l.trim())
      .find((l) => l.toLowerCase().startsWith("drivetype="));
    if (!line) return -1;
    const n = parseInt(line.split("=")[1], 10);
    return isNaN(n) ? -1 : n;
  } catch {
    return -1;
  }
}

export function getDriveSizeLabel(letter: string): string {
  try {
    const script = `(Get-CimInstance Win32_LogicalDisk | Where-Object { $_.DeviceID -eq '${letter}:' }).Size`;
    const encoded = Buffer.from(script, "utf16le").toString("base64");
    const out = execSync(
      `powershell -NoProfile -NonInteractive -EncodedCommand ${encoded}`,
      { timeout: 6000, encoding: "utf-8" },
    );
    const bytes = parseInt(out.trim(), 10);
    if (isNaN(bytes) || bytes <= 0) return "unbekannte Größe";
    return `${(bytes / 1024 ** 3).toFixed(0)} GB`;
  } catch {
    return "unbekannte Größe";
  }
}

// Wird direkt nach Nutzer-Bestätigung aufgerufen — kein LLM-Tool
export async function formatDriveConfirmed(args: {
  drive: string;
  filesystem: string;
  label?: string;
}): Promise<ToolResult> {
  const drive = args.drive.toUpperCase();
  const fs_type = (args.filesystem ?? "FAT32").toUpperCase();
  const label = (args.label ?? "").trim();

  try {
    const labelPart = label ? `-NewFileSystemLabel '${escLabel(label)}'` : "";
    const script = `
      Format-Volume -DriveLetter '${drive}' -FileSystem '${fs_type}' ${labelPart} -Confirm:$false -Force | Out-Null
      Write-Output '{"success":true}'
    `.trim();
    const encoded = Buffer.from(script, "utf16le").toString("base64");
    const out = execSync(
      `powershell -NoProfile -NonInteractive -EncodedCommand ${encoded}`,
      { timeout: 120_000, encoding: "utf-8" },
    );
    trackToolUsage("format_drive", `${drive}: ${fs_type}`);
    return JSON.parse(out.trim()) as ToolResult;
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function openAppWithSettings(
  args: Record<string, unknown>,
): Promise<ToolResult> {
  const { apps, homeworkMode } = getSettings();
  const name = ((args.name as string) ?? "").toLowerCase();
  const entry = apps.find((a) => a.name.toLowerCase() === name);
  if (!entry) {
    const known = apps
      .filter((a) => a.allowed)
      .map((a) => a.name)
      .join(", ");
    return {
      success: false,
      error: `Unbekannte App: '${name}'. Erlaubt: ${known || "keine"}`,
    };
  }
  if (!entry.allowed) {
    return { success: false, error: `'${name}' ist verboten.` };
  }
  if (
    homeworkMode.active &&
    !homeworkMode.apps.map((a) => a.toLowerCase()).includes(name)
  ) {
    return {
      success: false,
      error: `Hausaufgaben-Modus aktiv — '${name}' ist nicht erlaubt.`,
    };
  }
  const cmdLower = entry.command.toLowerCase();
  if (BLOCKED_PATH_FRAGMENTS.some((b) => cmdLower.includes(b))) {
    return {
      success: false,
      directive: true,
      error: `'${name}' liegt in einem gesperrten Systempfad und darf nicht geöffnet werden.`,
    };
  }
  const exeName = path.basename(cmdLower, ".exe");
  if (BLOCKED_NAME_PATTERNS.some((b) => exeName.includes(b))) {
    return {
      success: false,
      directive: true,
      error: `'${name}' ist ein Installations- oder Systemprogramm und darf nicht geöffnet werden.`,
    };
  }

  const result = await openApp({ name }, { [name]: entry.command });
  if (result.success) trackToolUsage("open_app", name);
  return result;
}

function killProcess(command: string): void {
  const exe = path.basename(command.split(" ")[0]);
  if (!exe) return;
  try {
    execSync(`taskkill /F /IM "${exe}" /T`, { stdio: "ignore" });
  } catch {
    // Prozess war nicht aktiv — kein Fehler
  }
}

async function loadSetup(args: Record<string, unknown>): Promise<ToolResult> {
  const { setups, apps, homeworkMode } = getSettings();
  const name = ((args.name as string) ?? "").toLowerCase();
  const setup = setups.find((s) => s.name.toLowerCase() === name);

  if (!setup) {
    const available = setups.map((s) => s.name).join(", ");
    return {
      success: false,
      error: `Setup '${name}' nicht gefunden. Verfügbar: ${available || "keine"}`,
    };
  }

  for (const appName of setup.close ?? []) {
    const entry = apps.find(
      (a) => a.name.toLowerCase() === appName.toLowerCase(),
    );
    if (entry) killProcess(entry.command);
  }

  const results = await Promise.allSettled(
    (setup.open ?? []).map((appName) => {
      const entry = apps.find(
        (a) => a.name.toLowerCase() === appName.toLowerCase(),
      );
      if (!entry?.allowed) return Promise.resolve(null);
      if (
        homeworkMode.active &&
        !homeworkMode.apps
          .map((a) => a.toLowerCase())
          .includes(appName.toLowerCase())
      )
        return Promise.resolve(null);
      return openApp({ name: appName }, { [appName]: entry.command });
    }),
  );

  const opened = results.filter(
    (r) => r.status === "fulfilled" && r.value?.success,
  ).length;

  const parts: string[] = [];
  if (opened > 0) parts.push(`${opened} gestartet`);
  if ((setup.close ?? []).length > 0)
    parts.push(`${setup.close.length} geschlossen`);

  trackToolUsage("load_setup", setup.name);
  return {
    success: true,
    output: `${setup.name} geladen — ${parts.join(", ") || "nichts zu tun"}.`,
  };
}

async function homeworkModeTool(
  args: Record<string, unknown>,
): Promise<ToolResult> {
  const action = args.action as string;
  if (action === "activate") return activateHomeworkMode();
  if (action === "deactivate") {
    const pin = args.pin as string | undefined;
    if (!pin) return { success: false, error: "PIN fehlt." };
    return deactivateHomeworkMode(pin);
  }
  return { success: false, error: `Unbekannte Aktion: ${action}` };
}

const HANDLERS: Partial<Record<ToolName, Handler>> = {
  open_app: openAppWithSettings,
  get_disk_usage: (a) => getDiskUsage(a as { drive?: string }),
  clean_temp: (a) => cleanTemp(a as { scope?: string }),
  empty_recycle_bin: () => emptyRecycleBin(),

  list_programs: async (args) => {
    const query = ((args["query"] as string) ?? "").toLowerCase().trim();
    const limit = Math.min(50, Math.max(1, Number(args["limit"]) || 20));
    const programDirs = [
      process.env["ProgramFiles"] ?? "C:\\Program Files",
      process.env["ProgramFiles(x86)"] ?? "C:\\Program Files (x86)",
    ];
    try {
      const results: { name: string; path: string }[] = [];
      for (const dir of programDirs) {
        const script = `
          Get-ChildItem -Path '${dir}' -Recurse -Include '*.exe' -Depth 3 -ErrorAction SilentlyContinue |
          Where-Object { $_.DirectoryName -notmatch 'unins|updater|update|crash|helper|\\\\$' } |
          Select-Object -First ${limit * 2} -ExpandProperty FullName |
          ConvertTo-Json -Compress
        `.trim();
        const encoded = Buffer.from(script, "utf16le").toString("base64");
        const { stdout } = await execAsync(
          `powershell -NoProfile -NonInteractive -EncodedCommand ${encoded}`,
          { timeout: 15000 },
        );
        const raw = stdout.trim();
        if (!raw) continue;
        const paths: string | string[] = JSON.parse(raw);
        const list = Array.isArray(paths) ? paths : [paths];
        for (const p of list) {
          const name = path.basename(p, ".exe");
          if (
            query &&
            !name.toLowerCase().includes(query) &&
            !p.toLowerCase().includes(query)
          )
            continue;
          results.push({ name, path: p });
          if (results.length >= limit) break;
        }
        if (results.length >= limit) break;
      }
      trackToolUsage("list_programs", query || "alle");
      return {
        success: true,
        output: { count: results.length, programs: results },
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  },

  load_setup: loadSetup,
  homework_mode: homeworkModeTool,
  remember: (a) =>
    remember(
      (a.type as "user" | "system" | "note") ?? "note",
      (a.content as string) ?? "",
    ),
  forget: (a) => {
    if (a.id === undefined || a.id === null || a.id === "") {
      return Promise.resolve({
        success: false,
        error: "ID fehlt. Nutze list_memories um IDs zu sehen.",
      });
    }
    return forgetById(Number(a.id));
  },
  list_memories: async (a) => {
    const rows = await listMemories(
      a.type as "user" | "system" | "note" | undefined,
    );
    return { success: true, output: rows };
  },
  get_system_info: async () => {
    const hw = scanHardware();
    const systemMemories = await listMemories("system");
    return {
      success: true,
      output: {
        computerName: hw.computerName,
        cpu: hw.cpu,
        gpu: hw.gpu,
        ram: hw.ramLabel,
        memories: systemMemories,
      },
    };
  },

  create_setup: async (args) => {
    const { setups } = getSettings();
    const name = ((args.name as string) ?? "").trim();
    if (!name) return { success: false, error: "Name darf nicht leer sein." };
    const open = Array.isArray(args.open) ? (args.open as string[]) : [];
    const close = Array.isArray(args.close) ? (args.close as string[]) : [];
    const id = crypto.randomUUID();
    await saveSettings({ setups: [...setups, { id, name, open, close }] });
    trackToolUsage("create_setup", name);
    return {
      success: true,
      output: `Setup "${name}" angelegt — ${open.length} App(s) öffnen, ${close.length} App(s) schließen.`,
    };
  },

  update_setting: async (args) => {
    const key = (args.key as string) ?? "";
    const value = args.value;

    const BLOCKED = new Set([
      "pinHash",
      "homeworkMode",
      "openaiApiKey",
      "onboardingComplete",
      "emergencyResetAt",
      "apps",
    ]);
    const ALLOWED = new Set([
      "provider",
      "ollamaModel",
      "voiceMode",
      "sessionLimit",
      "ttsEnabled",
      "ttsVoice",
    ]);

    if (BLOCKED.has(key)) {
      return {
        success: false,
        error: `Einstellung "${key}" ist gesperrt und kann nicht per Gespräch geändert werden.`,
      };
    }
    if (!ALLOWED.has(key)) {
      return {
        success: false,
        error: `Unbekannte Einstellung "${key}". Erlaubt: ${[...ALLOWED].join(", ")}.`,
      };
    }

    await saveSettings({ [key]: value } as never);
    trackToolUsage("update_setting", key);
    return {
      success: true,
      output: `Einstellung "${key}" auf "${value}" gesetzt.`,
    };
  },

  create_rule: async (args) => {
    const name = ((args.name as string) ?? "").trim();
    const toolName = ((args.tool_name as string) ?? "*").trim();
    const trigger = ((args.trigger as string) ?? "always").trim();
    const action = (args.action as "allow" | "deny") ?? "allow";

    if (!name) return { success: false, error: "Name darf nicht leer sein." };
    if (action !== "allow" && action !== "deny") {
      return { success: false, error: 'action muss "allow" oder "deny" sein.' };
    }

    const id = await createRuleInDb({
      name,
      tool_name: toolName,
      trigger,
      action,
      enabled: true,
    });
    trackToolUsage("create_rule", name);
    return {
      success: true,
      output: `Regel "${name}" angelegt (ID ${id}): ${action} für ${toolName} wenn ${trigger}.`,
    };
  },

  read_emails: async (args) => {
    const limit = Math.min(20, Math.max(1, Number(args["limit"]) || 10));
    const result = readEmails(limit);
    if (result.source === "none") {
      return { success: false, error: result.error };
    }
    trackToolUsage("read_emails", result.source);
    return {
      success: true,
      output: {
        source: result.source,
        count: result.items.length,
        mails: result.items,
      },
    };
  },

  mark_email: async (args) => {
    const id = ((args["id"] as string) ?? "").trim();
    const action = ((args["action"] as string) ?? "").trim();

    if (!id) return { success: false, error: "ID fehlt." };
    const validActions = ["read", "spam", "archive", "delete"] as const;
    if (!(validActions as readonly string[]).includes(action)) {
      return {
        success: false,
        error: `Ungültige Aktion "${action}". Erlaubt: ${validActions.join(", ")}.`,
      };
    }

    let result: { success: boolean; directive?: boolean; error?: string };
    try {
      result = markEmailService(id, action as (typeof validActions)[number]);
    } catch (err) {
      return {
        success: false,
        error: `Outlook nicht verfügbar: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
    if (result.directive) {
      return {
        success: false,
        error:
          result.error ??
          "Direktive: Ungelesene Mails dürfen nicht gelöscht werden.",
      };
    }
    if (!result.success) {
      return { success: false, error: result.error };
    }
    trackToolUsage("mark_email", action);
    return { success: true, output: `Mail als "${action}" markiert.` };
  },

  read_calendar: async (args) => {
    const days = Math.min(14, Math.max(1, Number(args["days"]) || 2));
    try {
      const events = readCalendar(days);
      trackToolUsage("read_calendar", `${days} Tage`);
      return { success: true, output: { days, count: events.length, events } };
    } catch (err) {
      return {
        success: false,
        error: `Kalender nicht verfügbar (Outlook benötigt): ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  },

  create_appointment: async (args) => {
    const subject = ((args["subject"] as string) ?? "").trim();
    const start = ((args["start"] as string) ?? "").trim();
    const end = ((args["end"] as string) ?? "").trim();
    const location = ((args["location"] as string) ?? "").trim();

    if (!subject) return { success: false, error: "Betreff fehlt." };
    if (!start) return { success: false, error: "Startzeit fehlt." };
    if (!end) return { success: false, error: "Endzeit fehlt." };

    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate.getTime())) {
      return { success: false, error: `Ungültiges Startdatum: "${start}".` };
    }
    if (isNaN(endDate.getTime())) {
      return { success: false, error: `Ungültiges Enddatum: "${end}".` };
    }
    if (endDate <= startDate) {
      return {
        success: false,
        error: "Endzeit muss nach der Startzeit liegen.",
      };
    }

    const result = createOutlookAppointment(subject, start, end, location);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    trackToolUsage("create_appointment", subject);
    return {
      success: true,
      output: `Termin "${subject}" am ${start} bis ${end} angelegt${location ? ` in ${location}` : ""}.`,
    };
  },

  list_devices: async () => {
    const snapshot = getPnPSnapshot();
    const devices = [...snapshot.values()];
    let drives: string[] = [];
    try {
      const script = `Get-CimInstance Win32_LogicalDisk | Where-Object { $_.DriveType -in 2,3 } | Select-Object DeviceID | ConvertTo-Json -Compress`;
      const encoded = Buffer.from(script, "utf16le").toString("base64");
      const { stdout } = await execAsync(
        `powershell -NoProfile -NonInteractive -EncodedCommand ${encoded}`,
        { timeout: 8000 },
      );
      const parsed = JSON.parse(stdout.trim()) as
        | { DeviceID: string }
        | { DeviceID: string }[];
      const items = Array.isArray(parsed) ? parsed : [parsed];
      drives = items
        .map((i) => i.DeviceID.replace(":", "").trim().toUpperCase())
        .filter((l) => l.length === 1);
      if (!drives.length) drives = ["C"];
    } catch {
      drives = ["C"];
    }
    trackToolUsage("list_devices", `${devices.length} Geräte`);
    return {
      success: true,
      output: { deviceCount: devices.length, devices, drives },
    };
  },

  scan_network: async () => {
    const entries = getArpSnapshot();
    trackToolUsage("scan_network", `${entries.length} Geräte`);
    return {
      success: true,
      output: { deviceCount: entries.length, devices: entries },
    };
  },

  list_connections: async () => {
    const connections = await getTcpConnections();
    trackToolUsage("list_connections", `${connections.length} Verbindungen`);
    return {
      success: true,
      output: { connectionCount: connections.length, connections },
    };
  },

  get_system_status: async () => {
    const hw = scanHardware();
    const ramFree = os.freemem();
    const ramTotal = os.totalmem();

    const tempScript =
      "$s=(Get-ChildItem $env:TEMP -Recurse -Depth 3 -ErrorAction SilentlyContinue|Measure-Object -Property Length -Sum).Sum; [math]::Round($s/1MB,1)";
    const tempEncoded = Buffer.from(tempScript, "utf16le").toString("base64");
    const bootScript = `Get-CimInstance Win32_OperatingSystem | Select-Object LastBootUpTime | ConvertTo-Json -Compress`;
    const bootEncoded = Buffer.from(bootScript, "utf16le").toString("base64");

    const [
      drivesResult,
      bootResult,
      tempResult,
      connResult,
      ollamaResult,
      alertsResult,
    ] = await Promise.allSettled([
      (async () => {
        const script = `Get-CimInstance Win32_LogicalDisk | Where-Object { $_.DriveType -in 2,3 } | Select-Object DeviceID,FreeSpace,Size | ConvertTo-Json -Compress`;
        const encoded = Buffer.from(script, "utf16le").toString("base64");
        const { stdout } = await execAsync(
          `powershell -NoProfile -NonInteractive -EncodedCommand ${encoded}`,
          { timeout: 8000 },
        );
        const parsed = JSON.parse(stdout.trim()) as
          | { DeviceID: string; FreeSpace: number; Size: number }
          | { DeviceID: string; FreeSpace: number; Size: number }[];
        const items = Array.isArray(parsed) ? parsed : [parsed];
        return items
          .filter((i) => i.Size)
          .map((i) => {
            const letter = i.DeviceID.replace(":", "").trim().toUpperCase();
            const free = Number(i.FreeSpace);
            const total = Number(i.Size);
            return {
              drive: letter,
              usedPct: Math.round(((total - free) / total) * 100),
              freeGB: (free / 1024 ** 3).toFixed(1) + " GB",
              totalGB: (total / 1024 ** 3).toFixed(1) + " GB",
            };
          });
      })(),

      execAsync(
        `powershell -NoProfile -NonInteractive -EncodedCommand ${bootEncoded}`,
        { timeout: 8000 },
      ).then(({ stdout }) => {
        const parsed = JSON.parse(stdout.trim()) as { LastBootUpTime: string };
        const bootDate = new Date(parsed.LastBootUpTime);
        return {
          bootTime: bootDate.toISOString(),
          uptimeHours: Math.floor(
            (Date.now() - bootDate.getTime()) / 3_600_000,
          ),
        };
      }),

      execAsync(
        `powershell -NoProfile -NonInteractive -EncodedCommand ${tempEncoded}`,
        { timeout: 12000 },
      ).then(({ stdout }) => (stdout.trim() || "0") + " MB"),

      getTcpConnections().then((conns) => ({
        listening: conns.filter((c) => String(c.state).includes("isten"))
          .length,
        established: conns.filter((c) => String(c.state).includes("stablish"))
          .length,
      })),

      fetch(`${env.ollamaBaseUrl}/api/tags`, {
        signal: AbortSignal.timeout(3000),
      })
        .then((r) => r.ok)
        .catch(() => false),

      pool
        .execute<
          any[]
        >("SELECT payload, created_at FROM system_events WHERE type = 'alert' AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR) ORDER BY created_at DESC LIMIT 20")
        .then(([rows]) =>
          rows.map((r) => ({
            ...(JSON.parse(r.payload as string) as Record<string, unknown>),
            time: r.created_at,
          })),
        ),
    ]);

    trackToolUsage("get_system_status", "full-scan");
    return {
      success: true,
      output: {
        computer: hw.computerName,
        cpu: hw.cpu,
        gpu: hw.gpu,
        ram: {
          usedPct: Math.round(((ramTotal - ramFree) / ramTotal) * 100),
          freeGB: (ramFree / 1024 ** 3).toFixed(1) + " GB",
          totalGB: (ramTotal / 1024 ** 3).toFixed(1) + " GB",
        },
        drives: drivesResult.status === "fulfilled" ? drivesResult.value : [],
        ollama:
          ollamaResult.status === "fulfilled" ? ollamaResult.value : false,
        alerts24h:
          alertsResult.status === "fulfilled" ? alertsResult.value : [],
        network: connResult.status === "fulfilled" ? connResult.value : null,
        boot: bootResult.status === "fulfilled" ? bootResult.value : null,
        tempSizeMB:
          tempResult.status === "fulfilled" ? tempResult.value : "unbekannt",
      },
    };
  },

  get_location: async (args) => {
    const consented = (args.user_consented as boolean) === true;

    // Pfad 1: Memory-First — immer erlaubt, kein externer Request
    const memories = await listMemories("system");
    const locationMemory = (memories as Array<{ content: string }>).find((m) =>
      ["wohnort", "standort", "city", "location"].some((kw) =>
        m.content.toLowerCase().includes(kw),
      ),
    );
    if (locationMemory) {
      const match =
        /(?:standort|wohnort|city)[:\s]+([A-ZÄÖÜ][a-zäöüß\-]+(?:\s+[A-ZÄÖÜ][a-zäöüß\-]+)*)/i.exec(
          locationMemory.content,
        ) ??
        /(?:in|aus)\s+([A-ZÄÖÜ][a-zäöüß\-]+(?:\s+[A-ZÄÖÜ][a-zäöüß\-]+)*)/i.exec(
          locationMemory.content,
        );
      const city = match ? match[1].trim() : locationMemory.content;
      trackToolUsage("get_location", city);
      return {
        success: true,
        output: { source: "memory", city },
      };
    }

    // Pfad 2: Kein Memory — erst Zustimmung holen (Prohibition IV)
    if (!consented) {
      return {
        success: false,
        confirm_required: true,
        error:
          "Ich kenne deinen Standort noch nicht. Darf ich ihn einmalig über deine IP-Adresse ermitteln? Die Anfrage geht an ip-api.com und wird danach lokal gespeichert. Antworte mit 'ja' um fortzufahren.",
      };
    }

    // Pfad 3: Zustimmung erteilt — IP-Request erlaubt
    try {
      const res = await fetch(
        "http://ip-api.com/json/?fields=city,regionName,country,lat,lon,timezone",
        { signal: AbortSignal.timeout(5000) },
      );
      if (!res.ok) throw new Error(`ip-api HTTP ${res.status}`);
      const geo = (await res.json()) as {
        city: string;
        regionName: string;
        country: string;
        lat: number;
        lon: number;
        timezone: string;
      };
      if (!geo.city) throw new Error("Kein Standort gefunden");
      await remember("system", `Standort: ${geo.city}, ${geo.country}`);
      trackToolUsage("get_location", `${geo.city}, ${geo.country}`);
      return {
        success: true,
        output: {
          source: "ip_geolocation",
          city: geo.city,
          region: geo.regionName,
          country: geo.country,
          lat: geo.lat,
          lon: geo.lon,
          timezone: geo.timezone,
          note: "Standort gespeichert — beim nächsten Mal kein externer Request mehr.",
        },
      };
    } catch {
      return {
        success: false,
        error: "Standort nicht ermittelbar. In welcher Stadt bist du?",
      };
    }
  },

  shutdown_system: async (args) => {
    const action = (args.action as string) ?? "shutdown";
    const delay = Number(args.delay_seconds ?? 5);
    const commands: Record<string, string> = {
      shutdown: `shutdown /s /t ${delay}`,
      restart: `shutdown /r /t ${delay}`,
      sleep: `rundll32.exe powrprof.dll,SetSuspendState 0,1,0`,
    };
    const cmd = commands[action];
    if (!cmd) return { success: false, error: "Unbekannte Aktion." };
    const farewells: Record<string, string> = {
      shutdown: "Bis später.",
      restart: "Ich starte neu. Gleich bin ich wieder da.",
      sleep: "Gute Nacht.",
    };
    trackToolUsage("shutdown_system", action);
    return {
      success: true,
      output: {
        action,
        message: farewells[action],
        exec_command: cmd,
        delay_seconds: delay,
      },
    };
  },

  get_datetime: async (args) => {
    const tz = ((args.timezone as string) ?? "").trim() || undefined;
    try {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: tz,
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "short",
      };
      const formatted = new Intl.DateTimeFormat("de-DE", options).format(now);
      const resolvedTz = tz ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
      trackToolUsage("get_datetime", resolvedTz);
      return {
        success: true,
        output: {
          datetime: formatted,
          iso: now.toISOString(),
          timezone: resolvedTz,
          timestamp: now.getTime(),
        },
      };
    } catch {
      const now = new Date();
      return {
        success: true,
        output: {
          datetime: now.toLocaleString("de-DE"),
          iso: now.toISOString(),
          timezone: "system",
          timestamp: now.getTime(),
        },
      };
    }
  },

  search_web: async (args) => {
    const query = (args.query as string) ?? "";
    if (!query.trim()) return { success: false, error: "query fehlt" };
    if (!openaiClient.isAvailable())
      return { success: false, error: "OpenAI nicht verfügbar" };
    trackToolUsage("search_web", query.slice(0, 80));
    const result = await openaiClient.searchWeb(query);
    return { success: true, output: result };
  },

  web_search: async (args) => {
    const query = ((args["query"] as string) ?? "").trim();
    const limit = Math.min(10, Math.max(1, Number(args["limit"]) || 5));
    if (!query) return { success: false, error: "Suchanfrage fehlt." };
    try {
      const results = await searchWebDDG(query, limit);
      trackToolUsage("web_search", query.slice(0, 80));
      return {
        success: true,
        output: {
          query,
          count: results.length,
          results,
          note: results.length === 0 ? "Keine Ergebnisse gefunden." : undefined,
        },
      };
    } catch (err) {
      return {
        success: false,
        error: `Web-Suche fehlgeschlagen: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  },

  fetch_url: async (args) => {
    const url = ((args["url"] as string) ?? "").trim();
    if (!url) return { success: false, error: "URL fehlt." };
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return { success: false, error: "Nur HTTP/HTTPS-URLs sind erlaubt." };
    }
    try {
      const content = await fetchUrlService(url);
      trackToolUsage("fetch_url", url.slice(0, 80));
      return { success: true, output: { url, content } };
    } catch (err) {
      return {
        success: false,
        error: `Seite konnte nicht geladen werden: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  },

  get_weather: async (args) => {
    let location = ((args["location"] as string) ?? "").trim();
    const days = Math.min(7, Math.max(1, Number(args["days"]) || 3));

    if (!location) {
      const memories = await listMemories("system");
      const loc = (memories as Array<{ content: string }>).find((m) =>
        ["wohnort", "standort", "wohne in", "bin in", "city"].some((kw) =>
          m.content.toLowerCase().includes(kw),
        ),
      );
      if (loc) {
        const match =
          /(?:wohnort|standort)[:\s]+([A-ZÄÖÜ][a-zäöüß\-]+(?:\s+[A-ZÄÖÜ][a-zäöüß\-]+)*)/i.exec(
            loc.content,
          ) ??
          /(?:in|aus)\s+([A-ZÄÖÜ][a-zäöüß\-]+(?:\s+[A-ZÄÖÜ][a-zäöüß\-]+)*)/i.exec(
            loc.content,
          );
        if (match) location = match[1];
      }
    }

    if (!location) {
      return {
        success: false,
        error:
          "Kein Standort angegeben und kein gespeicherter Standort gefunden. Bitte sage mir deinen Ort.",
      };
    }

    try {
      const weather = await getWeather(location, days);
      trackToolUsage("get_weather", location);
      return { success: true, output: weather };
    } catch (err) {
      return {
        success: false,
        error: `Wetter für "${location}" nicht verfügbar: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  },

  format_drive: async (args) => {
    const drive = ((args["drive"] as string) ?? "")
      .toUpperCase()
      .replace(":", "")
      .trim();
    const filesystem = (
      (args["filesystem"] as string) ?? "FAT32"
    ).toUpperCase();
    const label = ((args["label"] as string) ?? "").trim();

    if (!drive || drive.length !== 1 || !/[A-Z]/.test(drive)) {
      return { success: false, error: "Ungültiger Laufwerksbuchstabe." };
    }

    // Zone 1: Absolute Sperre — C immer, protectedDrives aus Settings, ELLA-Laufwerk
    const ellaDrive = process.cwd()[0].toUpperCase();
    const { protectedDrives } = getSettings();
    const blocked = new Set([
      "C",
      ellaDrive,
      ...protectedDrives.map((d) => d.toUpperCase()),
    ]);
    if (blocked.has(drive)) {
      return {
        success: false,
        directive: true,
        error: `Laufwerk ${drive}: ist permanent geschützt und kann nicht formatiert werden.`,
      };
    }

    // Zone 2: Nur Wechseldatenträger (DriveType 2) erlaubt
    const driveType = getDriveType(drive);
    if (driveType === -1) {
      return {
        success: false,
        error: `Laufwerk ${drive}: konnte nicht erkannt werden. Bitte prüfe ob das Laufwerk verbunden ist.`,
      };
    }
    if (driveType !== 2) {
      return {
        success: false,
        directive: true,
        error: `Laufwerk ${drive}: ist ein internes Laufwerk und kann nicht formatiert werden.`,
      };
    }

    const sizeInfo = getDriveSizeLabel(drive);
    const msg =
      `Laufwerk ${drive}: (${sizeInfo}) als ${filesystem} formatieren` +
      (label ? ` mit Label "${label}"` : "") +
      `. Alle Daten werden unwiderruflich gelöscht.`;

    return {
      success: false,
      requiresConfirmation: true,
      confirmationMessage: msg,
      pendingAction: {
        tool: "format_drive_confirmed",
        args: { drive, filesystem, label },
      },
    };
  },

  rename_drive: async (args) => {
    const drive = ((args["drive"] as string) ?? "")
      .toUpperCase()
      .replace(":", "")
      .trim();
    const newLabel = ((args["label"] as string) ?? "").trim();

    if (!drive || drive.length !== 1 || !/[A-Z]/.test(drive)) {
      return { success: false, error: "Ungültiger Laufwerksbuchstabe." };
    }
    if (!newLabel) {
      return { success: false, error: "Neuer Name fehlt." };
    }

    const ellaDrive = process.cwd()[0].toUpperCase();
    const { protectedDrives } = getSettings();
    const blocked = new Set([
      "C",
      ellaDrive,
      ...protectedDrives.map((d) => d.toUpperCase()),
    ]);
    if (blocked.has(drive)) {
      return {
        success: false,
        directive: true,
        error: `Laufwerk ${drive}: ist geschützt und kann nicht umbenannt werden.`,
      };
    }

    try {
      const script = `Set-Volume -DriveLetter '${drive}' -NewFileSystemLabel '${escLabel(newLabel)}'; Write-Output '{"success":true}'`;
      const encoded = Buffer.from(script, "utf16le").toString("base64");
      const out = execSync(
        `powershell -NoProfile -NonInteractive -EncodedCommand ${encoded}`,
        { timeout: 10_000, encoding: "utf-8" },
      );
      trackToolUsage("rename_drive", `${drive}: → ${newLabel}`);
      return JSON.parse(out.trim()) as ToolResult;
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  },

  read_gmail: async (args) => {
    const limit = Math.min(20, Math.max(1, Number(args["limit"]) || 10));
    try {
      const items = await readGmailMessages(limit);
      trackToolUsage("read_gmail", `${items.length} Mails`);
      return {
        success: true,
        output: { source: "gmail", count: items.length, mails: items },
      };
    } catch (err) {
      return {
        success: false,
        error: `Gmail nicht verfügbar: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  },

  mark_gmail: async (args) => {
    const id = ((args["id"] as string) ?? "").trim();
    const action = ((args["action"] as string) ?? "").trim();
    if (!id) return { success: false, error: "ID fehlt." };
    const valid = ["read", "archive", "spam", "delete"] as const;
    if (!valid.includes(action as (typeof valid)[number])) {
      return {
        success: false,
        error: `Ungültige Aktion "${action}". Erlaubt: ${valid.join(", ")}.`,
      };
    }
    try {
      const result = await markGmailMessage(
        id,
        action as (typeof valid)[number],
      );
      if (result.directive)
        return {
          success: false,
          directive: true,
          error: result.error ?? "Direktive verweigert.",
        };
      if (!result.success) return { success: false, error: result.error };
      trackToolUsage("mark_gmail", action);
      return { success: true, output: `Gmail-Mail als "${action}" markiert.` };
    } catch (err) {
      return {
        success: false,
        error: `Gmail nicht verfügbar: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  },

  read_google_calendar: async (args) => {
    const days = Math.min(14, Math.max(1, Number(args["days"]) || 2));
    try {
      const events = await readGoogleCalendar(days);
      trackToolUsage("read_google_calendar", `${days} Tage`);
      return { success: true, output: { days, count: events.length, events } };
    } catch (err) {
      return {
        success: false,
        error: `Google Kalender nicht verfügbar: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  },

  create_google_appointment: async (args) => {
    const subject = ((args["subject"] as string) ?? "").trim();
    const start = ((args["start"] as string) ?? "").trim();
    const end = ((args["end"] as string) ?? "").trim();
    const location = ((args["location"] as string) ?? "").trim();
    if (!subject) return { success: false, error: "Betreff fehlt." };
    if (!start) return { success: false, error: "Startzeit fehlt." };
    if (!end) return { success: false, error: "Endzeit fehlt." };
    if (new Date(end) <= new Date(start)) {
      return {
        success: false,
        error: "Endzeit muss nach der Startzeit liegen.",
      };
    }
    try {
      const result = await createGoogleAppt(subject, start, end, location);
      if (!result.success) return { success: false, error: result.error };
      trackToolUsage("create_google_appointment", subject);
      return {
        success: true,
        output: `Google-Termin "${subject}" am ${start} angelegt.`,
      };
    } catch (err) {
      return {
        success: false,
        error: `Google Kalender nicht verfügbar: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  },

  pause_ella: async (args) => {
    const minutes = Math.min(120, Math.max(1, Number(args["minutes"]) || 10));
    const resumeAt = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    trackToolUsage("pause_ella", `${minutes} Minuten`);
    return {
      success: true,
      output: {
        paused: true,
        minutes,
        resumeAt,
        message: `Ich mache ${minutes} Minute${minutes === 1 ? "" : "n"} Pause und melde mich zurück.`,
      },
    };
  },

  free_ram: async () => {
    const before = os.freemem();
    const total = os.totalmem();
    try {
      execSync(
        `powershell -NoProfile -Command "[System.GC]::Collect(); [System.GC]::WaitForPendingFinalizers(); [System.GC]::Collect()"`,
        { stdio: "ignore", timeout: 8000 },
      );
    } catch {
      // GC-Aufruf ist best-effort
    }
    const after = os.freemem();
    const freed = Math.max(0, after - before);
    const fmt = (b: number) => `${(b / 1024 ** 3).toFixed(1)} GB`;
    return {
      success: true,
      output: `RAM: ${fmt(after)} frei von ${fmt(total)}${freed > 10 * 1024 * 1024 ? ` (${fmt(freed)} freigegeben)` : ""}.`,
    };
  },
};

export const toolExecutor = {
  execute: async (call: ToolCall): Promise<ToolResult> => {
    const name = call.tool;

    const { enabledTools } = getSettings();
    if (!enabledTools.includes(name)) {
      return {
        success: false,
        error: `Das kann ich gerade nicht — diese Funktion ist deaktiviert.`,
      };
    }

    const decision = await evaluateRules(name);
    if (decision === "deny") {
      return {
        success: false,
        directive: true,
        error: `Das darf ich nicht tun — diese Aktion ist grundsätzlich nicht erlaubt.`,
      };
    }
    if (decision === "no_match") {
      // Fallback — tritt nach Default-Allow in evaluateRules nicht mehr auf
      return {
        success: false,
        error: `Das konnte ich leider nicht ausführen.`,
      };
    }

    const handler = HANDLERS[name];
    if (!handler) {
      return { success: false, error: `Diese Funktion kenne ich noch nicht.` };
    }

    const result = await handler(call.args);

    setImmediate(() => {
      pool
        .execute(
          `INSERT INTO tool_executions (tool_name, args, result, success, error, executed_at)
           VALUES (?, ?, ?, ?, ?, NOW())`,
          [
            name,
            JSON.stringify(call.args),
            JSON.stringify(result.output ?? null),
            result.success ? 1 : 0,
            result.error ?? null,
          ],
        )
        .catch(() => {});
    });

    return result;
  },
};
