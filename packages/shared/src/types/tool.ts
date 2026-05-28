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
  | "get_system_info"
  | "create_setup"
  | "update_setting"
  | "create_rule"
  | "free_ram"
  | "read_emails"
  | "mark_email"
  | "read_calendar"
  | "create_appointment";

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
