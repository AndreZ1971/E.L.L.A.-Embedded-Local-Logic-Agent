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
import { searchMusic, openWithPlayer } from "../services/music.js";
import {
  addTask,
  listTasks,
  completeTask,
  deleteTask,
} from "../services/tasks.js";
import { correctText } from "../services/textCorrection.js";
import {
  listProcesses,
  killProcess as killSystemProcess,
} from "../services/processes.js";
import {
  recordClipboard,
  getClipboardHistory,
  getLastClipboard,
} from "../services/clipboardHistory.js";
import {
  createReminder,
  deleteReminder,
  listReminders,
} from "../services/reminder.js";
import { analyzeScreenshot } from "../services/vision.js";
import {
  buildStyleProfile,
  writeInUserStyle,
} from "../services/styleProfile.js";
import { findDuplicates } from "../services/duplicateFinder.js";
import {
  launchApp,
  controlWindow,
  sendKeysToWindow,
} from "../services/windowManager.js";
import { deleteToRecycleBin } from "../services/fileOps.js";
import { listServicesPs, controlService } from "../services/serviceManager.js";
import { moveMouse, clickAt, dragDrop } from "../services/mouseControl.js";
import { runSafeCommand } from "../services/shellRunner.js";
import {
  readFileContent,
  renameFile,
  copyFile,
  createFolder,
} from "../services/fileManager.js";
import { controlMedia, getNowPlaying } from "../services/mediaControl.js";
import {
  toggleDarkMode,
  getBatteryStatus,
  getTemperatures,
  getEventLog,
  getWifiInfo,
} from "../services/systemComfort.js";
import { translateText, summarizeText } from "../services/textProcessing.js";
import {
  readScreenOcr,
  readScreenOcrElements,
  type OcrElement,
} from "../services/ocr.js";
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
    const filter = ((args["filter"] as string) ?? "").toLowerCase().trim();
    const { apps } = getSettings();

    let programs = apps.filter((a) => a.allowed).map((a) => a.name);
    if (filter) {
      programs = programs.filter((name) => name.toLowerCase().includes(filter));
    }

    trackToolUsage("list_programs", filter || "alle");
    return { success: true, output: { count: programs.length, programs } };
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

  play_music: async (args) => {
    const query = ((args["query"] as string) ?? "").trim();
    const { musicLibraryPath, defaultMediaPlayer, apps } = getSettings();

    if (!musicLibraryPath) {
      return {
        success: false,
        error:
          "Keine Musikbibliothek konfiguriert. Bitte in Einstellungen den Musikpfad festlegen.",
      };
    }

    const playerApp = apps.find(
      (a) =>
        a.name.toLowerCase() === defaultMediaPlayer.toLowerCase() && a.allowed,
    );
    if (!playerApp) {
      return {
        success: false,
        error: `Media Player "${defaultMediaPlayer}" nicht gefunden oder nicht erlaubt. Bitte in Einstellungen konfigurieren.`,
      };
    }

    let targetPath = musicLibraryPath;
    let description = "Musikbibliothek";

    if (query) {
      const result = searchMusic(musicLibraryPath, query);
      if (!result) {
        return {
          success: false,
          error: `Keine Musik gefunden fuer "${query}". Versuche es mit Kuenstlername oder Albumtitel.`,
        };
      }
      targetPath = result.path;
      description = result.title;
    }

    try {
      openWithPlayer(playerApp.command, targetPath);
      trackToolUsage("play_music", query || "alle");
      return {
        success: true,
        output: query
          ? `"${description}" wird in ${playerApp.name} geoeffnet.`
          : `Musikbibliothek wird in ${playerApp.name} geoeffnet.`,
      };
    } catch (err) {
      return {
        success: false,
        error: `Media Player konnte nicht gestartet werden: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  },

  search_files: async (args) => {
    const query = ((args["query"] as string) ?? "").trim();
    const type = ((args["type"] as string) ?? "").toLowerCase();
    const drive = ((args["drive"] as string) ?? "").toUpperCase();
    const searchPath = ((args["path"] as string) ?? "").trim();

    if (!query) return { success: false, error: "Suchbegriff fehlt." };

    // Extension maps: WSI SQL extensions (.pdf) and GCI glob patterns (*.pdf)
    const extMapDot: Record<string, string[]> = {
      word: [".docx", ".doc"],
      excel: [".xlsx", ".xls"],
      pdf: [".pdf"],
      bild: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"],
      video: [".mp4", ".mkv", ".avi", ".mov", ".wmv"],
      audio: [".mp3", ".flac", ".wav", ".m4a", ".aac"],
      text: [".txt", ".md"],
    };
    const dotExts = extMapDot[type];
    const extWhereSQL = dotExts
      ? dotExts.length === 1
        ? `AND System.FileExtension = '${dotExts[0]}'`
        : `AND System.FileExtension IN (${dotExts.map((e) => `'${e}'`).join(",")})`
      : "";
    const gcIncludes = dotExts
      ? dotExts.map((e) => `'*${e}'`).join(",")
      : "'*.*'";

    const { protectedDrives } = getSettings();
    const drivesToSearch = searchPath
      ? [searchPath]
      : drive
        ? [`${drive}:\\`]
        : ["C:\\", "D:\\", "E:\\", "H:\\", "Z:\\"].filter(
            (d) => !protectedDrives.includes(d[0]!) || d[0] === "C",
          );

    // WSI SCOPE: specific path or drive; empty = all indexed locations
    const scopeClause = searchPath
      ? `AND SCOPE='file:${searchPath.replace(/\\/g, "/")}'`
      : drive
        ? `AND SCOPE='file:${drive}:/'`
        : "";

    const safeQ = query.replace(/'/g, "''");

    const ps = `
$q = '${safeQ}'
$wsiOk = $false
try {
  Add-Type -AssemblyName System.Data -ErrorAction Stop
  $conn = New-Object System.Data.OleDb.OleDbConnection("Provider=Search.CollatorDSO;Extended Properties='Application=Windows'")
  $conn.Open()
  $cmd = $conn.CreateCommand()
  $cmd.CommandTimeout = 20
  $cmd.CommandText = "SELECT TOP 20 System.ItemPathDisplay, System.FileName, System.Size, System.DateModified FROM SystemIndex WHERE System.FileName LIKE '%$q%' ${extWhereSQL} ${scopeClause}"
  $reader = $cmd.ExecuteReader()
  $results = [System.Collections.Generic.List[PSCustomObject]]::new()
  while ($reader.Read() -and $results.Count -lt 20) {
    $fpath = if ($reader.IsDBNull(0)) { '' } else { $reader.GetValue(0).ToString() }
    $fname = if ($reader.IsDBNull(1)) { '' } else { $reader.GetValue(1).ToString() }
    $fsize = if ($reader.IsDBNull(2)) { 0 } else { try { [math]::Round([long]$reader.GetValue(2) / 1KB, 1) } catch { 0 } }
    $fmod  = if ($reader.IsDBNull(3)) { '' } else { try { [datetime]$reader.GetValue(3) | Get-Date -Format 'yyyy-MM-dd HH:mm' } catch { '' } }
    $fext  = [System.IO.Path]::GetExtension($fpath).ToLower()
    if ($fpath -ne '') { $results.Add([PSCustomObject]@{ name=$fname; path=$fpath; size=$fsize; changed=$fmod; ext=$fext }) }
  }
  $reader.Close()
  $conn.Close()
  $wsiOk = $true
  if ($results.Count -eq 0) { Write-Output '[]' } else { $results | ConvertTo-Json -Compress -Depth 2 }
} catch { $wsiOk = $false }

if (-not $wsiOk) {
  $drives  = @(${drivesToSearch.map((d) => `'${d}'`).join(",")})
  $inc     = @(${gcIncludes})
  $blocked = @('\\windows\\','\\system32\\','\\syswow64\\','\\winsxs\\')
  $results = [System.Collections.Generic.List[PSCustomObject]]::new()
  foreach ($drv in $drives) {
    if (-not (Test-Path $drv)) { continue }
    Get-ChildItem $drv -Recurse -Depth 4 -Include $inc -ErrorAction SilentlyContinue |
      Where-Object { $_.Name -like "*$q*" -and -not ($blocked | Where-Object { $_.FullName.ToLower().Contains($_) }) } |
      Select-Object -First 20 |
      ForEach-Object {
        $results.Add([PSCustomObject]@{
          name    = $_.Name; path = $_.FullName
          size    = [math]::Round($_.Length / 1KB, 1)
          changed = $_.LastWriteTime.ToString('yyyy-MM-dd HH:mm')
          ext     = $_.Extension.ToLower()
        })
      }
    if ($results.Count -ge 20) { break }
  }
  if ($results.Count -eq 0) { Write-Output '[]' } else { $results | ConvertTo-Json -Compress -Depth 2 }
}
`.trim();

    const tmpFile = path.join(os.tmpdir(), `ella-search-${Date.now()}.ps1`);
    try {
      const fs = await import("fs");
      fs.writeFileSync(tmpFile, ps, "utf-8");
      const out = execSync(
        `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${tmpFile}"`,
        { encoding: "utf-8", timeout: 60_000 },
      ).trim();

      const files = JSON.parse(!out || out === "[]" ? "[]" : out) as Array<{
        name: string;
        path: string;
        size: number;
        changed: string;
        ext: string;
      }>;

      trackToolUsage("search_files", query);
      return { success: true, output: { query, count: files.length, files } };
    } finally {
      try {
        const fs = await import("fs");
        fs.unlinkSync(tmpFile);
      } catch {
        // best effort
      }
    }
  },

  open_file: async (args) => {
    const filePath = ((args["path"] as string) ?? "").trim();
    const appName = ((args["app"] as string) ?? "").trim();
    const position = ((args["position"] as string) ?? "").toLowerCase();

    if (!filePath) return { success: false, error: "Dateipfad fehlt." };

    if (filePath.toLowerCase().endsWith(".exe")) {
      return {
        success: false,
        error:
          "Ausführbare Dateien können nicht direkt geöffnet werden. Nutze open_app für Programme.",
      };
    }

    const { apps } = getSettings();

    if (
      position === "end" &&
      (filePath.endsWith(".docx") || filePath.endsWith(".doc"))
    ) {
      const ps = `
$word = New-Object -ComObject Word.Application
$word.Visible = $true
$doc = $word.Documents.Open('${filePath.replace(/'/g, "''")}')
$word.Activate()
$word.Selection.EndKey(6)
Write-Output '{"success":true}'
`.trim();
      const tmpFile = path.join(os.tmpdir(), `ella-word-${Date.now()}.ps1`);
      const fs = await import("fs");
      try {
        fs.writeFileSync(tmpFile, ps, "utf-8");
        execSync(
          `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${tmpFile}"`,
          { encoding: "utf-8", timeout: 15_000 },
        );
        trackToolUsage("open_file", filePath);
        return {
          success: true,
          output:
            "Dokument geöffnet. Cursor ist am Ende — bereit zum Schreiben.",
        };
      } finally {
        try {
          fs.unlinkSync(tmpFile);
        } catch {
          // best effort
        }
      }
    }

    if (appName) {
      const app = apps.find(
        (a) => a.name.toLowerCase() === appName.toLowerCase() && a.allowed,
      );
      if (!app) {
        return {
          success: false,
          error: `App "${appName}" nicht gefunden oder nicht erlaubt.`,
        };
      }
      {
        const psLaunch = `Start-Process '${app.command.replace(/'/g, "''")}' -ArgumentList "'${filePath.replace(/'/g, "''")}'"`;
        const tmpLaunch = path.join(
          os.tmpdir(),
          `ella-launch-${Date.now()}.ps1`,
        );
        const fsLaunch = await import("fs");
        try {
          fsLaunch.writeFileSync(tmpLaunch, psLaunch, "utf-8");
          execSync(
            `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${tmpLaunch}"`,
            { timeout: 10_000 },
          );
        } finally {
          try {
            fsLaunch.unlinkSync(tmpLaunch);
          } catch {
            // best effort
          }
        }
      }
    } else {
      const ps = `Start-Process '${filePath.replace(/'/g, "''")}'`;
      const tmpFile = path.join(os.tmpdir(), `ella-open-${Date.now()}.ps1`);
      const fs = await import("fs");
      try {
        fs.writeFileSync(tmpFile, ps, "utf-8");
        execSync(
          `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${tmpFile}"`,
          { timeout: 10_000 },
        );
      } finally {
        try {
          fs.unlinkSync(tmpFile);
        } catch {
          // best effort
        }
      }
    }

    trackToolUsage("open_file", filePath);
    return {
      success: true,
      output: `${filePath.split("\\").pop()} wurde geöffnet.`,
    };
  },

  explore_folder: async (args) => {
    const folderPath = ((args["path"] as string) ?? "").trim();
    if (!folderPath) return { success: false, error: "Pfad fehlt." };
    const { spawn } = await import("child_process");
    const child = spawn("explorer.exe", [folderPath], {
      detached: true,
      stdio: "ignore",
    });
    child.unref();
    trackToolUsage("explore_folder", folderPath);
    return { success: true, output: `Explorer geöffnet: ${folderPath}` };
  },

  list_folder: async (args) => {
    const folderPath = ((args["path"] as string) ?? "").trim();
    const showHidden = (args["show_hidden"] as boolean) ?? false;
    if (!folderPath) return { success: false, error: "Pfad fehlt." };

    const safePath = folderPath.replace(/'/g, "''");
    const hiddenFilter = showHidden
      ? ""
      : "| Where-Object { -not $_.Attributes.HasFlag([System.IO.FileAttributes]::Hidden) }";
    const ps = `
$p = '${safePath}'
if (-not (Test-Path $p)) { Write-Output '{"error":"Pfad nicht gefunden."}'; exit }
$items = Get-ChildItem $p -ErrorAction SilentlyContinue ${hiddenFilter} | Sort-Object @{e={$_.PSIsContainer};d=$true}, Name
$result = $items | ForEach-Object {
  [PSCustomObject]@{
    name    = $_.Name
    type    = if ($_.PSIsContainer) { 'folder' } else { 'file' }
    size_kb = if ($_.PSIsContainer) { $null } else { [math]::Round($_.Length / 1KB, 1) }
    modified = $_.LastWriteTime.ToString('yyyy-MM-dd HH:mm')
    ext     = if ($_.PSIsContainer) { '' } else { $_.Extension.ToLower() }
  }
}
if ($null -eq $result -or @($result).Count -eq 0) { Write-Output '[]' }
else { @($result) | ConvertTo-Json -Compress -Depth 2 }
`.trim();

    const tmpFile = path.join(os.tmpdir(), `ella-ls-${Date.now()}.ps1`);
    try {
      const fs = await import("fs");
      fs.writeFileSync(tmpFile, ps, "utf-8");
      const out = execSync(
        `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${tmpFile}"`,
        { encoding: "utf-8", timeout: 15_000 },
      ).trim();

      if (out.startsWith('{"error"')) {
        const e = JSON.parse(out) as { error: string };
        return { success: false, error: e.error };
      }

      type Item = {
        name: string;
        type: "file" | "folder";
        size_kb: number | null;
        modified: string;
        ext: string;
      };
      const items = JSON.parse(!out || out === "[]" ? "[]" : out) as Item[];
      const folders = items.filter((i) => i.type === "folder");
      const files = items.filter((i) => i.type === "file");

      trackToolUsage("list_folder", folderPath);
      return {
        success: true,
        output: {
          path: folderPath,
          total: items.length,
          folders: folders.length,
          files: files.length,
          items,
        },
      };
    } finally {
      try {
        const fs = await import("fs");
        fs.unlinkSync(tmpFile);
      } catch {
        /* best effort */
      }
    }
  },

  create_document: async (args) => {
    const docType = ((args["type"] as string) ?? "word").toLowerCase();
    const fileName = ((args["name"] as string) ?? "").trim();
    const savePath = ((args["path"] as string) ?? "").trim();
    const content = ((args["content"] as string) ?? "").trim();

    const folder = savePath || `${process.env["USERPROFILE"]}\\Documents`;

    if (docType === "word" || docType === "docx") {
      const safeFolder = folder.replace(/'/g, "''");
      const safeFile = fileName.replace(/'/g, "''");
      const safeContent = content.replace(/'/g, "''");
      const fs = await import("fs");

      // Empty document: fire-and-forget via Start-Process to avoid COM timeout
      if (!content && !fileName) {
        const tmpFile = path.join(os.tmpdir(), `ella-create-${Date.now()}.ps1`);
        try {
          fs.writeFileSync(
            tmpFile,
            `$paths = @(
  "$env:ProgramFiles\\Microsoft Office\\root\\Office16\\WINWORD.EXE",
  "$env:ProgramFiles\\Microsoft Office\\root\\Office15\\WINWORD.EXE",
  "${String.raw`$env:ProgramFiles(x86)`}\\Microsoft Office\\root\\Office16\\WINWORD.EXE",
  "$env:ProgramFiles\\Microsoft Office\\Office16\\WINWORD.EXE"
)
$exe = $paths | Where-Object { Test-Path $_ } | Select-Object -First 1
if ($exe) { Start-Process $exe -ArgumentList "/w" }
else { Start-Process "WINWORD.EXE" -ArgumentList "/w" }
Write-Output '{"success":true}'`,
            "utf-8",
          );
          execSync(
            `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${tmpFile}"`,
            { timeout: 10_000 },
          );
        } finally {
          try {
            fs.unlinkSync(tmpFile);
          } catch {
            /* best effort */
          }
        }
        trackToolUsage("create_document", "word");
        return {
          success: true,
          output: "Neues leeres Word-Dokument geöffnet.",
        };
      }

      // Document with content or filename: use COM, release cleanly to avoid save-dialog timeout
      const ps = `
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Add()
${content ? `$word.Selection.TypeText('${safeContent}')` : ""}
${fileName ? `$p = '${safeFolder}\\${safeFile}.docx'\n$doc.SaveAs([ref]$p)` : ""}
$doc.Saved = $true
$word.Visible = $true
$word.Activate()
$word.Selection.EndKey(6)
[void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($doc)
[void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($word)
[System.GC]::Collect()
Write-Output '{"success":true}'
`.trim();
      const tmpFile = path.join(os.tmpdir(), `ella-create-${Date.now()}.ps1`);
      try {
        fs.writeFileSync(tmpFile, ps, "utf-8");
        execSync(
          `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${tmpFile}"`,
          { timeout: 30_000 },
        );
        trackToolUsage("create_document", "word");
        return {
          success: true,
          output: `Neues Word-Dokument erstellt${fileName ? `: ${fileName}.docx` : ""}. Bereit zum Schreiben.`,
        };
      } finally {
        try {
          fs.unlinkSync(tmpFile);
        } catch {
          /* best effort */
        }
      }
    }

    if (docType === "text" || docType === "txt") {
      const name =
        fileName || `Notiz_${new Date().toISOString().replace(/[:.]/g, "-")}`;
      const fullPath = `${folder}\\${name}.txt`;
      const fs = await import("fs");
      fs.writeFileSync(fullPath, content || "", "utf-8");
      const psNotepad = `Start-Process notepad.exe -ArgumentList '${fullPath.replace(/'/g, "''")}'`;
      const tmpNotepad = path.join(
        os.tmpdir(),
        `ella-notepad-${Date.now()}.ps1`,
      );
      try {
        fs.writeFileSync(tmpNotepad, psNotepad, "utf-8");
        execSync(
          `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${tmpNotepad}"`,
          { timeout: 10_000 },
        );
      } finally {
        try {
          fs.unlinkSync(tmpNotepad);
        } catch {
          // best effort
        }
      }
      trackToolUsage("create_document", "text");
      return { success: true, output: `Textdatei erstellt: ${name}.txt` };
    }

    return {
      success: false,
      error: `Unbekannter Dokumenttyp: ${docType}. Nutze "word" oder "text".`,
    };
  },

  dictate_to_document: async (args) => {
    const rawText = ((args["text"] as string) ?? "").trim();
    const target = ((args["target"] as string) ?? "word").toLowerCase();
    const doCorrect = args["correct"] !== false;

    if (!rawText) return { success: false, error: "Kein Text zum Diktieren." };

    let finalText = rawText;
    if (doCorrect) {
      try {
        finalText = await correctText(rawText);
      } catch {
        finalText = rawText;
      }
    }

    if (target === "word") {
      const ps = `
try {
  $word = [Runtime.InteropServices.Marshal]::GetActiveObject('Word.Application')
} catch {
  $word = New-Object -ComObject Word.Application
  $word.Visible = $true
  $doc = $word.Documents.Add()
}
$word.Activate()
$word.Selection.TypeText('${finalText.replace(/'/g, "''")}')
Write-Output '{"success":true}'
`.trim();
      const tmpFile = path.join(os.tmpdir(), `ella-dictate-${Date.now()}.ps1`);
      const fs = await import("fs");
      try {
        fs.writeFileSync(tmpFile, ps, "utf-8");
        execSync(
          `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${tmpFile}"`,
          { timeout: 15_000, encoding: "utf-8" },
        );
        trackToolUsage("dictate_to_document", "word");
        return {
          success: true,
          output: {
            written: true,
            original: rawText,
            corrected: finalText,
            corrections: rawText !== finalText,
          },
        };
      } catch (err) {
        return {
          success: false,
          error: `Word nicht erreichbar: ${err instanceof Error ? err.message : String(err)}`,
        };
      } finally {
        try {
          fs.unlinkSync(tmpFile);
        } catch {
          // best effort
        }
      }
    }

    if (target === "clipboard") {
      const ps = `Set-Clipboard -Value '${finalText.replace(/'/g, "''")}'`;
      const tmpFile = path.join(
        os.tmpdir(),
        `ella-clipboard-${Date.now()}.ps1`,
      );
      const fs = await import("fs");
      try {
        fs.writeFileSync(tmpFile, ps, "utf-8");
        execSync(
          `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${tmpFile}"`,
          { timeout: 10_000 },
        );
      } finally {
        try {
          fs.unlinkSync(tmpFile);
        } catch {
          // best effort
        }
      }
      trackToolUsage("dictate_to_document", "clipboard");
      return {
        success: true,
        output: `Text in Zwischenablage kopiert${rawText !== finalText ? " (korrigiert)" : ""}.`,
      };
    }

    return {
      success: false,
      error: `Unbekanntes Ziel: ${target}. Nutze "word" oder "clipboard".`,
    };
  },

  compose_email: async (args) => {
    const to = ((args["to"] as string) ?? "").trim();
    const subject = ((args["subject"] as string) ?? "").trim();
    const body = ((args["body"] as string) ?? "").trim();
    const doCorrect = args["correct"] !== false;

    let finalBody = body;
    if (body && doCorrect) {
      try {
        finalBody = await correctText(body);
      } catch {
        finalBody = body;
      }
    }

    const esc = (s: string) => s.replace(/'/g, "''");
    const ps = `
$o    = New-Object -ComObject Outlook.Application
$mail = $o.CreateItem(0)
${to ? `$mail.To = '${esc(to)}'` : ""}
${subject ? `$mail.Subject = '${esc(subject)}'` : ""}
${finalBody ? `$mail.Body = '${esc(finalBody)}'` : ""}
$mail.Display()
Write-Output '{"success":true}'
`.trim();

    const tmpFile = path.join(os.tmpdir(), `ella-mail-${Date.now()}.ps1`);
    const fs = await import("fs");
    try {
      fs.writeFileSync(tmpFile, ps, "utf-8");
      execSync(
        `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${tmpFile}"`,
        { timeout: 10_000 },
      );
      trackToolUsage("compose_email", to || "draft");
      return {
        success: true,
        output: `E-Mail-Entwurf geöffnet${to ? ` an ${to}` : ""}${body && doCorrect ? ". Text wurde KI-korrigiert." : "."}`,
      };
    } finally {
      try {
        fs.unlinkSync(tmpFile);
      } catch {
        // best effort
      }
    }
  },

  list_processes: async (args) => {
    const top = Math.min(50, Number(args["top"]) || 20);
    const procs = listProcesses(top);
    trackToolUsage("list_processes", `top ${top}`);
    return { success: true, output: { count: procs.length, processes: procs } };
  },

  kill_process: async (args) => {
    const target =
      ((args["name"] as string) ?? "").trim() ||
      ((args["pid"] as string) ?? "").trim();
    if (!target) return { success: false, error: "Name oder PID fehlt." };

    const PROTECTED = [
      "ella",
      "node",
      "electron",
      "system",
      "svchost",
      "lsass",
      "csrss",
      "winlogon",
      "smss",
    ];
    if (PROTECTED.some((p) => target.toLowerCase().includes(p))) {
      return {
        success: false,
        directive: true,
        error: `Prozess "${target}" ist systemkritisch und kann nicht beendet werden.`,
      };
    }

    return {
      success: false,
      requiresConfirmation: true,
      confirmationMessage: `Prozess "${target}" beenden. Nicht gespeicherte Daten gehen verloren.`,
      pendingAction: { tool: "kill_process_confirmed", args: { target } },
    };
  },

  kill_process_confirmed: async (args) => {
    const target = (args["target"] as string) ?? "";
    const ok = killSystemProcess(target);
    trackToolUsage("kill_process", target);
    return ok
      ? { success: true, output: `Prozess "${target}" beendet.` }
      : {
          success: false,
          error: `Prozess konnte nicht beendet werden. Möglicherweise bereits beendet.`,
        };
  },

  set_volume: async (args) => {
    const level = Math.min(100, Math.max(0, Number(args["level"] ?? 50)));
    const mute = args["mute"] === true || args["mute"] === "true";

    // DLL-Pfad: einmalig kompilieren, danach über Add-Type -Path laden (~0.5s statt ~8s)
    const dllPath = path
      .join(os.tmpdir(), "ella-volume-ctrl.dll")
      .replace(/\\/g, "\\\\");

    const ps = mute
      ? `$obj = New-Object -ComObject WScript.Shell; for ($i=0;$i -lt 50;$i++){$obj.SendKeys([char]173)}`
      : `
$vol = ${(level / 100.0).toFixed(4)}
$dll = '${dllPath}'
$code = @'
using System.Runtime.InteropServices;
[Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IAudioEndpointVolume {
  void M1(); void M2(); void M3(); void M4();
  int SetMasterVolumeLevelScalar(float fLevel, System.Guid pguidEventContext);
}
[Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDevice {
  int Activate(ref System.Guid iid, int dwClsCtx, System.IntPtr pActivationParams, [MarshalAs(UnmanagedType.IUnknown)] out object ppInterface);
}
[Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDeviceEnumerator {
  int f();
  int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice ppDevice);
}
[ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")] class MMDeviceEnumeratorComObject {}
'@
if (Test-Path $dll) {
  try { Add-Type -Path $dll -ErrorAction Stop } catch { Add-Type -TypeDefinition $code -OutputAssembly $dll; Add-Type -Path $dll }
} else {
  Add-Type -TypeDefinition $code -OutputAssembly $dll; Add-Type -Path $dll
}
$enum = [Activator]::CreateInstance([type]::GetTypeFromCLSID([guid]'BCDE0395-E52F-467C-8E3D-C4579291692E'))
$dev = $null; $enum.GetDefaultAudioEndpoint(0,1,[ref]$dev) | Out-Null
$iid = [guid]'5CDF2C82-841E-4546-9722-0CF74078229A'
$vol_obj = $null; $dev.Activate([ref]$iid, 23, [IntPtr]::Zero, [ref]$vol_obj) | Out-Null
([IAudioEndpointVolume]$vol_obj).SetMasterVolumeLevelScalar($vol, [guid]::Empty) | Out-Null`.trim();

    const tmpFile = path.join(os.tmpdir(), `ella-vol-${Date.now()}.ps1`);
    const fsVol = await import("fs");
    try {
      fsVol.writeFileSync(tmpFile, ps, "utf-8");
      execSync(
        `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${tmpFile}"`,
        { timeout: 20000 },
      );
    } finally {
      try {
        fsVol.unlinkSync(tmpFile);
      } catch {
        // best effort
      }
    }
    trackToolUsage("set_volume", mute ? "mute" : `${level}%`);
    return {
      success: true,
      output: mute ? "Stumm geschaltet." : `Lautstärke auf ${level}% gesetzt.`,
    };
  },

  get_clipboard: async (args) => {
    if (args["history"] === true) {
      return { success: true, output: { history: getClipboardHistory() } };
    }
    const last = getLastClipboard();
    return last
      ? { success: true, output: { content: last } }
      : { success: false, error: "Zwischenablage ist leer." };
  },

  set_clipboard: async (args) => {
    const text = ((args["text"] as string) ?? "").trim();
    if (!text) return { success: false, error: "Text fehlt." };
    const ps = `Set-Clipboard -Value '${text.replace(/'/g, "''")}'`;
    const encoded = Buffer.from(ps, "utf16le").toString("base64");
    execSync(
      `powershell -NoProfile -NonInteractive -EncodedCommand ${encoded}`,
      { timeout: 5000 },
    );
    recordClipboard(text);
    trackToolUsage("set_clipboard", `${text.length} Zeichen`);
    return { success: true, output: "Text in Zwischenablage kopiert." };
  },

  set_reminder: async (args) => {
    const message = ((args["message"] as string) ?? "").trim();
    const timeStr = ((args["time"] as string) ?? "").trim();
    const dateStr = ((args["date"] as string) ?? "").trim();

    if (!message) return { success: false, error: "Erinnerungstext fehlt." };
    if (!timeStr) return { success: false, error: "Uhrzeit fehlt." };
    if (!/^\d{2}:\d{2}$/.test(timeStr))
      return { success: false, error: "Uhrzeit im Format HH:MM angeben." };

    const now = new Date();
    const base = dateStr || now.toISOString().slice(0, 10);
    let targetDate = new Date(`${base}T${timeStr}:00`);
    if (isNaN(targetDate.getTime()))
      return { success: false, error: "Ungültiges Datum oder Uhrzeit." };
    if (targetDate <= now) targetDate.setDate(targetDate.getDate() + 1);

    const id = `${Date.now()}`;
    try {
      await createReminder(id, message, targetDate);
    } catch {
      return {
        success: false,
        error:
          "Erinnerung konnte nicht gesetzt werden — Windows Task Scheduler nicht erreichbar.",
      };
    }

    const formatted = targetDate.toLocaleString("de-DE", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
    trackToolUsage("set_reminder", message);
    return {
      success: true,
      output: `Erinnerung gesetzt: "${message}" — ${formatted}`,
    };
  },

  set_alarm: async (args) => {
    const label = ((args["label"] as string) ?? "Wecker").trim() || "Wecker";
    const timeStr = ((args["time"] as string) ?? "").trim();
    if (!timeStr) return { success: false, error: "Uhrzeit fehlt." };
    if (!/^\d{2}:\d{2}$/.test(timeStr))
      return { success: false, error: "Uhrzeit im Format HH:MM angeben." };

    await pool.execute(
      `INSERT INTO alarms (label, time_hhmm, active) VALUES (?, ?, TRUE)`,
      [label, timeStr],
    );
    return {
      success: true,
      output: `Wecker gestellt: "${label}" täglich um ${timeStr} Uhr.`,
    };
  },

  list_alarms: async () => {
    const [rows] = await pool.execute(
      `SELECT id, label, time_hhmm, active FROM alarms ORDER BY time_hhmm`,
    );
    return { success: true, output: { alarms: rows } };
  },

  delete_alarm: async (args) => {
    const id = Number(args["id"]);
    if (!id) return { success: false, error: "ID fehlt." };
    const [res] = await pool.execute(`DELETE FROM alarms WHERE id = ?`, [id]);
    const affected = (res as { affectedRows: number }).affectedRows;
    if (!affected) return { success: false, error: "Wecker nicht gefunden." };
    return { success: true, output: "Wecker gelöscht." };
  },

  list_reminders: async () => {
    const reminders = listReminders();
    return { success: true, output: { count: reminders.length, reminders } };
  },

  delete_reminder: async (args) => {
    const id = ((args["id"] as string) ?? "").trim();
    if (!id) return { success: false, error: "ID fehlt." };
    deleteReminder(id);
    trackToolUsage("delete_reminder", id);
    return { success: true, output: "Erinnerung gelöscht." };
  },

  take_screenshot: async (args) => {
    const question = ((args["question"] as string) ?? "").trim();
    try {
      const analysis = await analyzeScreenshot(
        question || "Was siehst du? Beschreibe den Bildschirminhalt.",
      );
      trackToolUsage("take_screenshot", question || "analyze");
      return { success: true, output: { analysis } };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  },

  write_for_me: async (args) => {
    const task = ((args["task"] as string) ?? "").trim();
    const useStyle = args["style"] !== false;

    if (!task) return { success: false, error: "Aufgabe fehlt." };

    let profile = "";
    if (useStyle) {
      try {
        profile = await buildStyleProfile();
      } catch {
        // kein Profil verfügbar
      }
    }

    try {
      const text = await writeInUserStyle(task, profile);
      trackToolUsage("write_for_me", task.slice(0, 50));
      return {
        success: true,
        output: { text, styleApplied: Boolean(profile) },
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  },

  find_duplicates: async (args) => {
    const drivesArg = ((args["drives"] as string) ?? "").trim();
    const drives = drivesArg
      ? drivesArg.split(",").map((d) => d.trim().toUpperCase())
      : ["C", "E", "H"];
    try {
      const dupes = findDuplicates(drives);
      const totalWasted = dupes.reduce((s, d) => s + d.wastedMB, 0);
      trackToolUsage("find_duplicates", drives.join(","));
      return {
        success: true,
        output: {
          count: dupes.length,
          totalWastedMB: Math.round(totalWasted),
          groups: dupes,
        },
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  },

  list_autostart: async () => {
    const ps = `
$reg = @(
  'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run',
  'HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run'
)
$results = [System.Collections.Generic.List[PSCustomObject]]::new()
foreach ($regPath in $reg) {
  if (Test-Path $regPath) {
    $props = Get-ItemProperty $regPath
    $props | Get-Member -MemberType NoteProperty |
      Where-Object { $_.Name -notlike 'PS*' } |
      ForEach-Object {
        $results.Add([PSCustomObject]@{
          name    = $_.Name
          command = $props.$($_.Name)
          scope   = if ($regPath -like '*HKLM*') { 'System' } else { 'Nutzer' }
        })
      }
  }
}
if ($results.Count -eq 0) { Write-Output '[]' }
else { $results | ConvertTo-Json -Compress }`.trim();

    const tmpFile = path.join(os.tmpdir(), `ella-autostart-${Date.now()}.ps1`);
    const fsAs = await import("fs");
    try {
      fsAs.writeFileSync(tmpFile, ps, "utf-8");
      const out = execSync(
        `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${tmpFile}"`,
        { encoding: "utf-8", timeout: 8000 },
      ).trim();
      const data = JSON.parse(!out || out === "[]" ? "[]" : out) as unknown[];
      trackToolUsage(
        "list_autostart",
        `${Array.isArray(data) ? data.length : 0} Einträge`,
      );
      return {
        success: true,
        output: { entries: Array.isArray(data) ? data : [data] },
      };
    } finally {
      try {
        fsAs.unlinkSync(tmpFile);
      } catch {
        // best effort
      }
    }
  },

  add_task: async (args) => {
    const title = ((args["title"] as string) ?? "").trim();
    if (!title) return { success: false, error: "Aufgabentitel fehlt." };

    const rawPriority = (
      (args["priority"] as string) ?? "normal"
    ).toLowerCase();
    const priority: "low" | "normal" | "high" = (
      ["low", "normal", "high"] as const
    ).includes(rawPriority as "low" | "normal" | "high")
      ? (rawPriority as "low" | "normal" | "high")
      : "normal";
    const dueDate = ((args["due_date"] as string) ?? "").trim() || undefined;
    const note = ((args["note"] as string) ?? "").trim() || undefined;

    if (dueDate && isNaN(new Date(dueDate).getTime())) {
      return { success: false, error: "Ungültiges Datum — Format: YYYY-MM-DD" };
    }

    const task = await addTask(title, { priority, dueDate, note });
    trackToolUsage("add_task", title);
    return {
      success: true,
      output: `Aufgabe angelegt: "${task.title}" (ID ${task.id}, Priorität: ${task.priority})`,
    };
  },

  list_tasks: async (args) => {
    const status =
      ((args["status"] as string) ?? "pending") === "done" ? "done" : "pending";
    const tasks = await listTasks(undefined, status as "pending" | "done");
    trackToolUsage("list_tasks", status);
    return {
      success: true,
      output: {
        count: tasks.length,
        tasks: tasks.map((t) => ({
          id: t.id,
          title: t.title,
          priority: t.priority,
          dueDate: t.dueDate,
          note: t.note,
        })),
      },
    };
  },

  complete_task: async (args) => {
    const id = Number(args["id"]);
    if (!id) return { success: false, error: "Aufgaben-ID fehlt." };
    const ok = await completeTask(id);
    trackToolUsage("complete_task", String(id));
    return ok
      ? { success: true, output: `Aufgabe ${id} als erledigt markiert.` }
      : {
          success: false,
          error: `Aufgabe ${id} nicht gefunden oder bereits erledigt.`,
        };
  },

  delete_task: async (args) => {
    const id = Number(args["id"]);
    if (!id) return { success: false, error: "Aufgaben-ID fehlt." };
    const ok = await deleteTask(id);
    trackToolUsage("delete_task", String(id));
    return ok
      ? { success: true, output: `Aufgabe ${id} abgebrochen.` }
      : { success: false, error: `Aufgabe ${id} nicht gefunden.` };
  },

  // ── v3.2.0 System Automation ─────────────────────────────────────────────────

  launch_app: async (args) => {
    const appName = ((args["app"] as string) ?? "").trim();
    if (!appName) return { success: false, error: "App-Name fehlt." };

    const argsArr = ((args["args"] as string) ?? "")
      .split(" ")
      .map((s) => s.trim())
      .filter(Boolean);

    const cmdLower = appName.toLowerCase();
    if (BLOCKED_PATH_FRAGMENTS.some((b) => cmdLower.includes(b))) {
      return {
        success: false,
        directive: true,
        error: `"${appName}" liegt in einem gesperrten Systempfad.`,
      };
    }
    const exeName = path.basename(cmdLower, ".exe");
    if (BLOCKED_NAME_PATTERNS.some((b) => exeName.includes(b))) {
      return {
        success: false,
        directive: true,
        error: `"${appName}" ist ein gesperrtes Systemprogramm.`,
      };
    }

    return {
      success: false,
      requiresConfirmation: true,
      confirmationMessage: `Programm "${appName}" starten?${argsArr.length ? ` (Argumente: ${argsArr.join(" ")})` : ""}`,
      pendingAction: {
        tool: "launch_app_confirmed",
        args: { app: appName, args: argsArr },
      },
    };
  },

  launch_app_confirmed: async (args) => {
    const appName = (args["app"] as string) ?? "";
    const argsArr = (args["args"] as string[]) ?? [];
    const result = launchApp(appName, argsArr);
    trackToolUsage("launch_app", appName);
    if (result.error) return { success: false, error: result.error };
    return {
      success: true,
      output: `"${appName}" gestartet${result.pid ? ` (PID ${result.pid})` : ""}.`,
    };
  },

  control_window: async (args) => {
    const title = ((args["title"] as string) ?? "").trim();
    const action = ((args["action"] as string) ?? "focus") as
      | "focus"
      | "minimize"
      | "maximize"
      | "close";

    if (!title) return { success: false, error: "Fenstertitel fehlt." };

    const validActions = ["focus", "minimize", "maximize", "close"];
    if (!validActions.includes(action)) {
      return {
        success: false,
        error: `Ungültige Aktion. Erlaubt: ${validActions.join(", ")}`,
      };
    }

    if (action === "close") {
      return {
        success: false,
        requiresConfirmation: true,
        confirmationMessage: `Fenster "${title}" schließen? Nicht gespeicherte Daten gehen verloren.`,
        pendingAction: {
          tool: "control_window_confirmed",
          args: { title, action },
        },
      };
    }

    const result = controlWindow(title, action);
    trackToolUsage("control_window", `${action}:${title}`);
    if (result.error) return { success: false, error: result.error };
    return result.found > 0
      ? {
          success: true,
          output: `Aktion "${action}" auf ${result.found} Fenster ausgeführt.`,
        }
      : { success: false, error: `Kein Fenster mit "${title}" gefunden.` };
  },

  control_window_confirmed: async (args) => {
    const title = (args["title"] as string) ?? "";
    const action = (args["action"] as "close") ?? "close";
    const result = controlWindow(title, action);
    trackToolUsage("control_window", `${action}:${title}`);
    if (result.error) return { success: false, error: result.error };
    return result.found > 0
      ? { success: true, output: `${result.found} Fenster geschlossen.` }
      : { success: false, error: `Kein Fenster mit "${title}" gefunden.` };
  },

  send_keys: async (args) => {
    const keys = ((args["keys"] as string) ?? "").trim();
    const window = ((args["window"] as string) ?? "").trim() || undefined;

    if (!keys) return { success: false, error: "Tasteneingabe fehlt." };

    const preview = keys.length > 30 ? `${keys.slice(0, 30)}…` : keys;
    return {
      success: false,
      requiresConfirmation: true,
      confirmationMessage: `Eingabe "${preview}" senden${window ? ` an "${window}"` : " (aktives Fenster)"}?`,
      pendingAction: { tool: "send_keys_confirmed", args: { keys, window } },
    };
  },

  send_keys_confirmed: async (args) => {
    const keys = (args["keys"] as string) ?? "";
    const window = (args["window"] as string | undefined) ?? undefined;
    const result = sendKeysToWindow(keys, window);
    trackToolUsage("send_keys", window ?? "active");
    if (!result.success) return { success: false, error: result.error };
    return { success: true, output: "Tastatureingabe gesendet." };
  },

  delete_file: async (args) => {
    const filePath = ((args["path"] as string) ?? "").trim();
    if (!filePath) return { success: false, error: "Pfad fehlt." };

    return {
      success: false,
      requiresConfirmation: true,
      confirmationMessage: `"${filePath}" in den Papierkorb verschieben?`,
      pendingAction: {
        tool: "delete_file_confirmed",
        args: { path: filePath },
      },
    };
  },

  delete_file_confirmed: async (args) => {
    const filePath = (args["path"] as string) ?? "";
    const result = deleteToRecycleBin(filePath);
    trackToolUsage("delete_file", filePath);
    if (!result.success) return { success: false, error: result.error };
    return {
      success: true,
      output: `"${filePath}" in den Papierkorb verschoben.`,
    };
  },

  manage_service: async (args) => {
    const action = ((args["action"] as string) ?? "list").toLowerCase();
    const name = ((args["name"] as string) ?? "").trim();
    const filter = ((args["filter"] as string) ?? "").trim() || undefined;

    if (action === "list") {
      const services = listServicesPs(filter);
      trackToolUsage("manage_service", "list");
      return { success: true, output: { count: services.length, services } };
    }

    if (!["start", "stop", "restart"].includes(action)) {
      return {
        success: false,
        error: 'Aktion muss "list", "start", "stop" oder "restart" sein.',
      };
    }
    if (!name) return { success: false, error: "Dienstname fehlt." };

    const PROTECTED = [
      "winlogon",
      "lsass",
      "services",
      "smss",
      "wininit",
      "csrss",
      "spooler",
      "eventlog",
      "plugplay",
      "rpcss",
      "dcomlaunch",
    ];
    if (PROTECTED.some((p) => name.toLowerCase().includes(p))) {
      return {
        success: false,
        directive: true,
        error: `Dienst "${name}" ist systemkritisch und kann nicht geändert werden.`,
      };
    }

    const labels: Record<string, string> = {
      start: "starten",
      stop: "stoppen",
      restart: "neu starten",
    };
    return {
      success: false,
      requiresConfirmation: true,
      confirmationMessage: `Dienst "${name}" ${labels[action]}?`,
      pendingAction: {
        tool: "manage_service_confirmed",
        args: { name, action },
      },
    };
  },

  manage_service_confirmed: async (args) => {
    const name = (args["name"] as string) ?? "";
    const action = (args["action"] as "start" | "stop" | "restart") ?? "start";
    const result = controlService(name, action);
    trackToolUsage("manage_service", `${action}:${name}`);
    if (!result.success) return { success: false, error: result.error };
    const done: Record<string, string> = {
      start: "gestartet",
      stop: "gestoppt",
      restart: "neu gestartet",
    };
    return { success: true, output: `Dienst "${name}" ${done[action]}.` };
  },

  read_screen: async () => {
    try {
      const text = await readScreenOcr();
      trackToolUsage("read_screen", "ocr");
      return { success: true, output: { text } };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  },

  // ── v3.3.0 Mouse, Shell, Screen Monitor ──────────────────────────────────────

  move_mouse: async (args) => {
    const x = Number(args["x"]);
    const y = Number(args["y"]);
    if (isNaN(x) || isNaN(y))
      return { success: false, error: "Koordinaten fehlen oder ungültig." };

    const result = moveMouse(x, y);
    trackToolUsage("move_mouse", `${x},${y}`);
    if (!result.success) return { success: false, error: result.error };
    return { success: true, output: `Maus bewegt zu (${x}, ${y}).` };
  },

  click_at: async (args) => {
    const x = Number(args["x"]);
    const y = Number(args["y"]);
    if (isNaN(x) || isNaN(y))
      return { success: false, error: "Koordinaten fehlen oder ungültig." };

    const button = (args["button"] as "left" | "right" | "middle") ?? "left";
    const double = args["double"] === true;
    const btnLabel = double
      ? `Doppelklick (${button})`
      : `${button === "left" ? "Links" : button === "right" ? "Rechts" : "Mittel"}klick`;

    return {
      success: false,
      requiresConfirmation: true,
      confirmationMessage: `${btnLabel} an Position (${x}, ${y})?`,
      pendingAction: {
        tool: "click_at_confirmed",
        args: { x, y, button, double },
      },
    };
  },

  click_at_confirmed: async (args) => {
    const x = Number(args["x"]);
    const y = Number(args["y"]);
    const button = (args["button"] as "left" | "right" | "middle") ?? "left";
    const double = args["double"] === true;

    const result = clickAt(x, y, button, double);
    trackToolUsage("click_at", `${x},${y}`);
    if (!result.success) return { success: false, error: result.error };
    return { success: true, output: `Klick an (${x}, ${y}) ausgeführt.` };
  },

  drag_drop: async (args) => {
    const fromX = Number(args["from_x"]);
    const fromY = Number(args["from_y"]);
    const toX = Number(args["to_x"]);
    const toY = Number(args["to_y"]);

    if ([fromX, fromY, toX, toY].some(isNaN))
      return { success: false, error: "Koordinaten fehlen oder ungültig." };

    return {
      success: false,
      requiresConfirmation: true,
      confirmationMessage: `Drag von (${fromX}, ${fromY}) nach (${toX}, ${toY})?`,
      pendingAction: {
        tool: "drag_drop_confirmed",
        args: { from_x: fromX, from_y: fromY, to_x: toX, to_y: toY },
      },
    };
  },

  drag_drop_confirmed: async (args) => {
    const fromX = Number(args["from_x"]);
    const fromY = Number(args["from_y"]);
    const toX = Number(args["to_x"]);
    const toY = Number(args["to_y"]);

    const result = dragDrop(fromX, fromY, toX, toY);
    trackToolUsage("drag_drop", `(${fromX},${fromY})→(${toX},${toY})`);
    if (!result.success) return { success: false, error: result.error };
    return {
      success: true,
      output: `Drag von (${fromX}, ${fromY}) nach (${toX}, ${toY}) ausgeführt.`,
    };
  },

  run_command: async (args) => {
    const command = ((args["command"] as string) ?? "").trim();
    if (!command) return { success: false, error: "Befehl fehlt." };

    const preview = command.length > 60 ? `${command.slice(0, 60)}…` : command;
    return {
      success: false,
      requiresConfirmation: true,
      confirmationMessage: `PowerShell ausführen: "${preview}"?`,
      pendingAction: { tool: "run_command_confirmed", args: { command } },
    };
  },

  run_command_confirmed: async (args) => {
    const command = ((args["command"] as string) ?? "").trim();
    if (!command) return { success: false, error: "Befehl fehlt." };

    const result = runSafeCommand(command);
    trackToolUsage("run_command", command.slice(0, 80));
    if (!result.success) return { success: false, error: result.error };
    return { success: true, output: { command, result: result.output ?? "" } };
  },

  watch_screen: async (args) => {
    const durationSec = Math.min(
      30,
      Math.max(5, Number(args["duration"]) || 10),
    );
    const intervalSec = Math.min(
      15,
      Math.max(3, Number(args["interval"]) || 5),
    );
    const maxSnaps = Math.max(2, Math.floor(durationSec / intervalSec));

    const snapshots: { time: string; text: string }[] = [];
    for (let i = 0; i < maxSnaps; i++) {
      const time = new Date().toLocaleTimeString("de-DE");
      try {
        const text = await readScreenOcr();
        snapshots.push({ time, text });
      } catch {
        snapshots.push({ time, text: "[OCR-Fehler]" });
      }
      if (i < maxSnaps - 1) {
        await new Promise((resolve) => setTimeout(resolve, intervalSec * 1000));
      }
    }

    const changes: string[] = [];
    for (let i = 1; i < snapshots.length; i++) {
      const prev = new Set(snapshots[i - 1].text.split("\n").filter(Boolean));
      const newLines = snapshots[i].text
        .split("\n")
        .filter((l) => l.trim() && !prev.has(l));
      if (newLines.length > 0) {
        changes.push(
          `[${snapshots[i].time}] ${newLines.slice(0, 5).join(" | ")}`,
        );
      }
    }

    trackToolUsage(
      "watch_screen",
      `${durationSec}s / ${snapshots.length} Snapshots`,
    );
    return {
      success: true,
      output: {
        duration: durationSec,
        snapshots: snapshots.length,
        latest: snapshots[snapshots.length - 1]?.text ?? "",
        changes: changes.length > 0 ? changes : ["Keine Änderungen erkannt."],
      },
    };
  },

  // ── v3.4.0 Komfort & Intelligenz ─────────────────────────────────────────────

  read_file_content: async (args) => {
    const filePath = ((args["path"] as string) ?? "").trim();
    if (!filePath) return { success: false, error: "Pfad fehlt." };
    const result = await readFileContent(filePath);
    trackToolUsage("read_file_content", filePath);
    if (!result.success) return { success: false, error: result.error };
    return {
      success: true,
      output: {
        path: filePath,
        content: result.content,
        truncated: result.truncated ?? false,
      },
    };
  },

  rename_file: async (args) => {
    const filePath = ((args["path"] as string) ?? "").trim();
    const newName = ((args["new_name"] as string) ?? "").trim();
    if (!filePath) return { success: false, error: "Pfad fehlt." };
    if (!newName) return { success: false, error: "Neuer Name fehlt." };
    return {
      success: false,
      requiresConfirmation: true,
      confirmationMessage: `"${filePath.split("\\").pop()}" umbenennen zu "${newName}"?`,
      pendingAction: {
        tool: "rename_file_confirmed",
        args: { path: filePath, new_name: newName },
      },
    };
  },

  rename_file_confirmed: async (args) => {
    const filePath = (args["path"] as string) ?? "";
    const newName = (args["new_name"] as string) ?? "";
    const result = renameFile(filePath, newName);
    trackToolUsage("rename_file", `${filePath} → ${newName}`);
    if (!result.success) return { success: false, error: result.error };
    return { success: true, output: `Umbenannt: ${result.newPath}` };
  },

  copy_file: async (args) => {
    const src = ((args["source"] as string) ?? "").trim();
    const dst = ((args["destination"] as string) ?? "").trim();
    if (!src) return { success: false, error: "Quelle fehlt." };
    if (!dst) return { success: false, error: "Ziel fehlt." };
    return {
      success: false,
      requiresConfirmation: true,
      confirmationMessage: `"${src.split("\\").pop()}" kopieren nach "${dst}"?`,
      pendingAction: {
        tool: "copy_file_confirmed",
        args: { source: src, destination: dst },
      },
    };
  },

  copy_file_confirmed: async (args) => {
    const src = (args["source"] as string) ?? "";
    const dst = (args["destination"] as string) ?? "";
    const result = copyFile(src, dst);
    trackToolUsage("copy_file", `${src} → ${dst}`);
    if (!result.success) return { success: false, error: result.error };
    return { success: true, output: `Kopiert nach: ${dst}` };
  },

  create_folder: async (args) => {
    const folderPath = ((args["path"] as string) ?? "").trim();
    if (!folderPath) return { success: false, error: "Pfad fehlt." };
    const result = createFolder(folderPath);
    trackToolUsage("create_folder", folderPath);
    if (!result.success) return { success: false, error: result.error };
    return { success: true, output: `Ordner erstellt: ${folderPath}` };
  },

  toggle_dark_mode: async () => {
    const result = toggleDarkMode();
    trackToolUsage("toggle_dark_mode", result.mode ?? "?");
    if (!result.success) return { success: false, error: result.error };
    return {
      success: true,
      output:
        result.mode === "dark"
          ? "Dark Mode aktiviert."
          : "Light Mode aktiviert.",
    };
  },

  get_battery_status: async () => {
    const result = getBatteryStatus();
    trackToolUsage("get_battery_status", "query");
    if (!result.success) return { success: false, error: result.error };
    if (!result.available)
      return {
        success: true,
        output: {
          available: false,
          message: "Kein Akku erkannt (Desktop-PC oder Treiber fehlt).",
        },
      };
    return { success: true, output: result };
  },

  get_temperatures: async () => {
    const result = getTemperatures();
    trackToolUsage("get_temperatures", "query");
    if (!result.success) return { success: false, error: result.error };
    if (!result.available)
      return {
        success: true,
        output: { available: false, reason: result.reason },
      };
    return { success: true, output: { zones: result.zones } };
  },

  get_event_log: async (args) => {
    const hours = Math.min(168, Math.max(1, Number(args["hours"]) || 24));
    const maxEvents = Math.min(
      50,
      Math.max(5, Number(args["max_events"]) || 20),
    );
    const result = getEventLog(hours, maxEvents);
    trackToolUsage("get_event_log", `${hours}h`);
    if (!result.success) return { success: false, error: result.error };
    return {
      success: true,
      output: { count: result.events?.length ?? 0, events: result.events },
    };
  },

  get_wifi_info: async () => {
    const result = getWifiInfo();
    trackToolUsage("get_wifi_info", "query");
    if (!result.success) return { success: false, error: result.error };
    return { success: true, output: result };
  },

  control_media: async (args) => {
    const action = ((args["action"] as string) ?? "toggle").toLowerCase();
    const result = controlMedia(action);
    trackToolUsage("control_media", action);
    if (!result.success) return { success: false, error: result.error };
    const labels: Record<string, string> = {
      play: "Wiedergabe gestartet.",
      pause: "Pausiert.",
      toggle: "Play/Pause umgeschaltet.",
      next: "Nächster Titel.",
      prev: "Vorheriger Titel.",
      previous: "Vorheriger Titel.",
      back: "Vorheriger Titel.",
      stop: "Wiedergabe gestoppt.",
    };
    return {
      success: true,
      output: labels[action] ?? "Mediensteuerung ausgeführt.",
    };
  },

  get_now_playing: async () => {
    const result = await getNowPlaying();
    trackToolUsage("get_now_playing", "query");
    if (!result.available)
      return {
        success: true,
        output: {
          available: false,
          message: "Keine aktive Medienwiedergabe gefunden.",
        },
      };
    return { success: true, output: result };
  },

  translate_text: async (args) => {
    const text = ((args["text"] as string) ?? "").trim();
    const targetLanguage = (
      (args["target_language"] as string) ?? "Englisch"
    ).trim();
    if (!text) return { success: false, error: "Text fehlt." };
    try {
      const translated = await translateText(text, targetLanguage);
      trackToolUsage("translate_text", targetLanguage);
      return {
        success: true,
        output: { original: text, translation: translated, targetLanguage },
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  },

  summarize_text: async (args) => {
    const text = ((args["text"] as string) ?? "").trim();
    const style = ((args["style"] as string) ?? "mittel") as
      | "kurz"
      | "mittel"
      | "ausführlich";
    if (!text) return { success: false, error: "Text fehlt." };
    try {
      const summary = await summarizeText(text, style);
      trackToolUsage("summarize_text", style);
      return { success: true, output: { summary, style } };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  },

  click_element: async (args) => {
    const label = ((args["label"] as string) ?? "").trim();
    if (!label) return { success: false, error: "Element-Name fehlt." };

    let elements: OcrElement[];
    try {
      const ocr = await readScreenOcrElements();
      elements = ocr.elements;
    } catch (err) {
      return {
        success: false,
        error: `OCR fehlgeschlagen: ${err instanceof Error ? err.message : String(err)}`,
      };
    }

    const lower = label.toLowerCase();

    // 1. Exact match
    let match = elements.find((e) => e.text.toLowerCase() === lower);
    // 2. Contains
    if (!match)
      match = elements.find((e) => e.text.toLowerCase().includes(lower));

    if (match) {
      const cx = Math.round(match.x + match.w / 2);
      const cy = Math.round(match.y + match.h / 2);
      return {
        success: false,
        requiresConfirmation: true,
        confirmationMessage: `"${match.text}" gefunden bei (${cx}, ${cy}) — klicken?`,
        pendingAction: {
          tool: "click_element_confirmed",
          args: { x: cx, y: cy },
        },
      };
    }

    // 3. Multi-word consecutive match
    const words = lower.split(/\s+/);
    if (words.length > 1) {
      for (let i = 0; i <= elements.length - words.length; i++) {
        const group = elements.slice(i, i + words.length);
        const groupText = group.map((e) => e.text.toLowerCase()).join(" ");
        if (groupText === lower || groupText.includes(lower)) {
          const x1 = Math.min(...group.map((e) => e.x));
          const y1 = Math.min(...group.map((e) => e.y));
          const x2 = Math.max(...group.map((e) => e.x + e.w));
          const y2 = Math.max(...group.map((e) => e.y + e.h));
          const cx = Math.round(x1 + (x2 - x1) / 2);
          const cy = Math.round(y1 + (y2 - y1) / 2);
          return {
            success: false,
            requiresConfirmation: true,
            confirmationMessage: `"${group.map((e) => e.text).join(" ")}" gefunden bei (${cx}, ${cy}) — klicken?`,
            pendingAction: {
              tool: "click_element_confirmed",
              args: { x: cx, y: cy },
            },
          };
        }
      }
    }

    return {
      success: false,
      error: `Element "${label}" nicht auf dem Bildschirm gefunden.`,
    };
  },

  click_element_confirmed: async (args) => {
    const x = Number(args["x"]);
    const y = Number(args["y"]);
    const result = clickAt(x, y, "left", false);
    trackToolUsage("click_element", `${x},${y}`);
    if (!result.success) return { success: false, error: result.error };
    return { success: true, output: `Klick bei (${x}, ${y}) ausgeführt.` };
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
    // _confirmed-Tools sind interne Callbacks nach Nutzer-Bestätigung — kein enabledTools-Check
    if (!name.endsWith("_confirmed") && !enabledTools.includes(name)) {
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
