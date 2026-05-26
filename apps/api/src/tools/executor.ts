import {
  openApp,
  getDiskUsage,
  cleanTemp,
  emptyRecycleBin,
} from "@ella/agent-tools";
import { execSync } from "child_process";
import * as path from "path";
import { toolRegistry } from "./registry.js";
import { getSettings } from "../services/settings.js";
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
import { pool } from "../config/database.js";
import type { ToolCall, ToolResult, ToolName } from "@ella/shared";

type Handler = (args: Record<string, unknown>) => Promise<ToolResult>;
type ConfirmFn = (id: string, tool: string, label: string) => Promise<boolean>;

const DANGEROUS = new Set<ToolName>(["clean_temp", "empty_recycle_bin"]);

const DANGEROUS_LABELS: Partial<Record<ToolName, string>> = {
  clean_temp: "Temporäre Dateien löschen",
  empty_recycle_bin: "Papierkorb leeren",
};

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
    return Promise.resolve({
      success: false,
      error: `Unbekannte App: '${name}'. Erlaubt: ${known || "keine"}`,
    });
  }
  if (!entry.allowed) {
    return Promise.resolve({
      success: false,
      error: `'${name}' ist verboten.`,
    });
  }
  if (
    homeworkMode.active &&
    !homeworkMode.apps.map((a) => a.toLowerCase()).includes(name)
  ) {
    return Promise.resolve({
      success: false,
      error: `Hausaufgaben-Modus aktiv — '${name}' ist nicht erlaubt.`,
    });
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

  // Apps schließen
  const toClose = setup.close ?? [];
  for (const appName of toClose) {
    const entry = apps.find(
      (a) => a.name.toLowerCase() === appName.toLowerCase(),
    );
    if (entry) killProcess(entry.command);
  }

  // Apps öffnen
  const toOpen = setup.open ?? [];
  const results = await Promise.allSettled(
    toOpen.map((appName) => {
      const entry = apps.find(
        (a) => a.name.toLowerCase() === appName.toLowerCase(),
      );
      if (!entry?.allowed) return Promise.resolve(null);
      if (
        homeworkMode.active &&
        !homeworkMode.apps.map((a) => a.toLowerCase()).includes(appName.toLowerCase())
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
  if (toClose.length > 0) parts.push(`${toClose.length} geschlossen`);

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
};

export const toolExecutor = {
  execute: async (
    call: ToolCall,
    onConfirm?: ConfirmFn,
  ): Promise<ToolResult> => {
    const name = call.tool;

    if (!toolRegistry.isEnabled(name)) {
      return { success: false, error: `Tool '${name}' is not enabled.` };
    }
    const handler = HANDLERS[name];
    if (!handler) {
      return { success: false, error: `Tool '${name}' has no handler.` };
    }

    if (DANGEROUS.has(name) && onConfirm) {
      const id = crypto.randomUUID();
      const label = DANGEROUS_LABELS[name] ?? name;
      const approved = await onConfirm(id, name, label);
      if (!approved) {
        return { success: false, error: "Vom Benutzer abgelehnt." };
      }
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
