import {
  openApp,
  getDiskUsage,
  cleanTemp,
  emptyRecycleBin,
} from "@ella/agent-tools";
import { execSync } from "child_process";
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
import type { ToolCall, ToolResult, ToolName } from "@ella/shared";

type Handler = (args: Record<string, unknown>) => Promise<ToolResult>;

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
      const { execSync } = await import("child_process");
      const out = execSync(
        "wmic logicaldisk get DeviceID,DriveType /format:csv",
        {
          stdio: ["ignore", "pipe", "ignore"],
          encoding: "utf-8",
        },
      );
      for (const line of out.trim().split("\n")) {
        const cols = line.split(",");
        if (cols.length < 3) continue;
        const type = cols[2].trim();
        if (type !== "2" && type !== "3") continue;
        const letter = cols[1].replace(":", "").trim().toUpperCase();
        if (letter.length === 1) drives.push(letter);
      }
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
    const connections = getTcpConnections();
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

    // Sync: drives
    let drives: Array<{
      drive: string;
      usedPct: number;
      freeGB: string;
      totalGB: string;
    }> = [];
    try {
      const out = execSync(
        "wmic logicaldisk get DeviceID,DriveType,FreeSpace,Size /format:csv",
        { stdio: ["ignore", "pipe", "ignore"], encoding: "utf-8" },
      );
      for (const line of out.trim().split("\n")) {
        const cols = line.split(",");
        if (cols.length < 5) continue;
        const driveType = cols[2].trim();
        if (driveType !== "2" && driveType !== "3") continue;
        const letter = cols[1].replace(":", "").trim().toUpperCase();
        const free = Number(cols[3]);
        const total = Number(cols[4]);
        if (!total || letter.length !== 1) continue;
        drives.push({
          drive: letter,
          usedPct: Math.round(((total - free) / total) * 100),
          freeGB: (free / 1024 ** 3).toFixed(1) + " GB",
          totalGB: (total / 1024 ** 3).toFixed(1) + " GB",
        });
      }
    } catch {
      /* ignore */
    }

    // Sync: last boot
    let boot: { bootTime: string; uptimeHours: number } | null = null;
    try {
      const out = execSync("wmic os get LastBootUpTime /format:value", {
        stdio: ["ignore", "pipe", "ignore"],
        encoding: "utf-8",
      });
      const match = out.match(/LastBootUpTime=(\d{14})/);
      if (match) {
        const dt = match[1];
        const bootDate = new Date(
          `${dt.slice(0, 4)}-${dt.slice(4, 6)}-${dt.slice(6, 8)}T` +
            `${dt.slice(8, 10)}:${dt.slice(10, 12)}:${dt.slice(12, 14)}`,
        );
        boot = {
          bootTime: bootDate.toISOString(),
          uptimeHours: Math.floor(
            (Date.now() - bootDate.getTime()) / 3_600_000,
          ),
        };
      }
    } catch {
      /* ignore */
    }

    // Sync: temp folder size estimate
    let tempSizeMB = "unbekannt";
    try {
      const script =
        "$s=(Get-ChildItem $env:TEMP -Recurse -ErrorAction SilentlyContinue|Measure-Object -Property Length -Sum).Sum; [math]::Round($s/1MB,1)";
      const encoded = Buffer.from(script, "utf16le").toString("base64");
      const out = execSync(
        `powershell -NoProfile -NonInteractive -EncodedCommand ${encoded}`,
        {
          stdio: ["ignore", "pipe", "ignore"],
          encoding: "utf-8",
          timeout: 10000,
        },
      );
      tempSizeMB = (out.trim() || "0") + " MB";
    } catch {
      /* ignore */
    }

    // Sync: active connections
    const conns = getTcpConnections();
    const network = {
      listening: conns.filter((c) => String(c.state).includes("isten")).length,
      established: conns.filter((c) => String(c.state).includes("stablish"))
        .length,
    };

    // Async: Ollama + DB alerts in parallel
    const [ollamaResult, alertsResult] = await Promise.allSettled([
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
        drives,
        ollama:
          ollamaResult.status === "fulfilled" ? ollamaResult.value : false,
        alerts24h:
          alertsResult.status === "fulfilled" ? alertsResult.value : [],
        network,
        boot,
        tempSizeMB,
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
      return { success: false, error: `Tool '${name}' ist nicht aktiviert.` };
    }

    const decision = await evaluateRules(name);
    if (decision === "deny") {
      return {
        success: false,
        error: `Direktive verweigert '${name}'. Diese Aktion ist dauerhaft gesperrt.`,
      };
    }
    if (decision === "no_match") {
      return {
        success: false,
        error: `Keine Erlaubnis-Regel für '${name}'. Erstelle eine Regel unter Einstellungen → Regeln.`,
      };
    }

    const handler = HANDLERS[name];
    if (!handler) {
      return { success: false, error: `Tool '${name}' has no handler.` };
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
