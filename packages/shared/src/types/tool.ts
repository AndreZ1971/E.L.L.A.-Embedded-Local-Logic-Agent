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
  | "delete_task"
  | "launch_app"
  | "launch_app_confirmed"
  | "control_window"
  | "control_window_confirmed"
  | "send_keys"
  | "send_keys_confirmed"
  | "delete_file"
  | "delete_file_confirmed"
  | "manage_service"
  | "manage_service_confirmed"
  | "read_screen"
  | "click_at"
  | "click_at_confirmed"
  | "move_mouse"
  | "drag_drop"
  | "drag_drop_confirmed"
  | "run_command"
  | "run_command_confirmed"
  | "watch_screen"
  | "read_file_content"
  | "rename_file"
  | "rename_file_confirmed"
  | "copy_file"
  | "copy_file_confirmed"
  | "create_folder"
  | "toggle_dark_mode"
  | "get_battery_status"
  | "get_temperatures"
  | "get_event_log"
  | "get_wifi_info"
  | "control_media"
  | "get_now_playing"
  | "translate_text"
  | "summarize_text"
  | "click_element"
  | "click_element_confirmed";

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
