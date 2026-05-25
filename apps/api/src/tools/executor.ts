import {
  openApp,
  getDiskUsage,
  cleanTemp,
  emptyRecycleBin,
} from "@ella/agent-tools";
import { toolRegistry } from "./registry.js";
import { getSettings } from "../services/settings.js";
import type { ToolCall, ToolResult, ToolName } from "@ella/shared";

type Handler = (args: Record<string, unknown>) => Promise<ToolResult>;

function openAppWithSettings(
  args: Record<string, unknown>,
): Promise<ToolResult> {
  const { apps } = getSettings();
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

  return openApp({ name }, { [name]: entry.command });
}

const HANDLERS: Partial<Record<ToolName, Handler>> = {
  open_app: openAppWithSettings,
  get_disk_usage: (a) => getDiskUsage(a as { drive?: string }),
  clean_temp: (a) => cleanTemp(a as { scope?: string }),
  empty_recycle_bin: () => emptyRecycleBin(),
};

export const toolExecutor = {
  execute: async (call: ToolCall): Promise<ToolResult> => {
    const name = call.tool;

    if (!toolRegistry.isEnabled(name)) {
      return { success: false, error: `Tool '${name}' is not enabled.` };
    }

    const handler = HANDLERS[name];
    if (!handler) {
      return { success: false, error: `Tool '${name}' has no handler.` };
    }

    return handler(call.args);
  },
};
