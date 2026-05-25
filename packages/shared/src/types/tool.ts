export type ToolName =
  | "open_app"
  | "get_disk_usage"
  | "clean_temp"
  | "empty_recycle_bin"
  | "list_running_processes"
  | "load_setup"
  | "homework_mode"
  | "remember"
  | "forget";

export interface ToolCall {
  tool: ToolName;
  args: Record<string, unknown>;
  requiresConfirmation?: boolean;
}

export interface ToolResult {
  success: boolean;
  output?: unknown;
  error?: string;
  executedAt?: string;
}
