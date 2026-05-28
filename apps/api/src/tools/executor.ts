import {
  openApp,
  getDiskUsage,
  cleanTemp,
  emptyRecycleBin,
} from "@ella/agent-tools";
import { execSync } from "child_process";
import * as path from "path";
import { toolRegistry } from "./registry.js";
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
import { readEmails, markEmail as markEmailService } from "../services/mail.js";
import {
  readCalendar,
  createAppointment as createOutlookAppointment,
} from "../services/calendar.js";
import { pool } from "../config/database.js";
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
  forget: (a) => forgetById(Number(a.id)),
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
        error: `Direktive: ${result.error}`,
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

    if (!toolRegistry.isEnabled(name)) {
      return { success: false, error: `Tool '${name}' is not enabled.` };
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
