import { openApp, getDiskUsage, cleanTemp, emptyRecycleBin } from '@ella/agent-tools';
import { toolRegistry } from './registry.js';
import type { ToolCall, ToolResult, ToolName } from '@ella/shared';

type Handler = (args: Record<string, unknown>) => Promise<ToolResult>;

const HANDLERS: Partial<Record<ToolName, Handler>> = {
  open_app:          (a) => openApp(a as { name: string }),
  get_disk_usage:    (a) => getDiskUsage(a as { drive?: string }),
  clean_temp:        (a) => cleanTemp(a as { scope?: string }),
  empty_recycle_bin: ()  => emptyRecycleBin(),
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
