export type ToolName =
  | "open_app"
  | "get_disk_usage"
  | "clean_temp"
  | "empty_recycle_bin"
  | "load_setup"
  | "list_memories"
  | "homework_mode"
  | "remember"
  | "forget"
  | "get_system_info";

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
