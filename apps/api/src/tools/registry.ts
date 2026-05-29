import type { ToolName } from "@ella/shared";

// Alle bekannten Tools — vollständige Liste aus definitions.ts
// Die Registry entscheidet nicht ob ein Tool erlaubt ist —
// das macht die Rule Engine (rules.ts) und die Directive.
// Hier steht nur: kennt E.L.L.A. dieses Tool überhaupt?
const ALL_TOOLS = new Set<ToolName>([
  // System
  "get_disk_usage",
  "get_system_info",
  "get_system_status",
  "free_ram",
  "clean_temp",
  "empty_recycle_bin",
  // Apps & Setups
  "open_app",
  "load_setup",
  "create_setup",
  // Hardware & Netzwerk
  "list_devices",
  "scan_network",
  "list_connections",
  // Memory
  "remember",
  "forget",
  "list_memories",
  // Einstellungen & Regeln
  "update_setting",
  "create_rule",
  // Mail & Kalender
  "read_emails",
  "mark_email",
  "read_calendar",
  "create_appointment",
  // Sonstiges
  "homework_mode",
]);

export const toolRegistry = {
  isEnabled: (name: ToolName): boolean => ALL_TOOLS.has(name),
  listEnabled: (): ToolName[] => [...ALL_TOOLS],
  enable: (name: ToolName): void => {
    ALL_TOOLS.add(name);
  },
  disable: (name: ToolName): void => {
    ALL_TOOLS.delete(name);
  },
};