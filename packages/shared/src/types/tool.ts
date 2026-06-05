export type ToolName =
  | "open_app"
  | "get_disk_usage"
  | "clean_temp"
  | "empty_recycle_bin"
  | "format_drive"
  | "rename_drive"
  | "list_programs"
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
  | "create_appointment"
  | "list_devices"
  | "scan_network"
  | "list_connections"
  | "get_system_status"
  | "search_web"
  | "get_location"
  | "get_datetime"
  | "shutdown_system"
  | "delete_files"
  | "web_search"
  | "fetch_url"
  | "get_weather"
  | "pause_ella"
  | "play_music"
  | "read_gmail"
  | "mark_gmail"
  | "read_google_calendar"
  | "create_google_appointment"
  | "search_files"
  | "open_file"
  | "explore_folder"
  | "create_document"
  | "dictate_to_document"
  | "compose_email"
  | "list_processes"
  | "kill_process"
  | "kill_process_confirmed"
  | "set_volume"
  | "get_clipboard"
  | "set_clipboard"
  | "set_reminder"
  | "list_reminders"
  | "delete_reminder"
  | "take_screenshot"
  | "write_for_me"
  | "find_duplicates"
  | "list_autostart"
  | "add_task"
  | "list_tasks"
  | "complete_task"
  | "delete_task";

export interface ToolCall {
  tool: ToolName;
  args: Record<string, unknown>;
}

export interface PendingAction {
  tool: string;
  args: Record<string, unknown>;
}

export interface ToolResult {
  success: boolean;
  output?: unknown;
  error?: string;
  directive?: boolean;
  confirm_required?: boolean;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
  pendingAction?: PendingAction;
  executedAt?: string;
}
