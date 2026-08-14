import { describe, it, expect } from "vitest";
import {
  selectToolsForQuery,
  selectToolsForContext,
} from "../../services/toolSelector.js";
import type { OllamaTool } from "../../services/ollama.js";

function makeTool(name: string): OllamaTool {
  return {
    type: "function",
    function: {
      name,
      description: "",
      parameters: { type: "object", properties: {}, required: [] },
    },
  };
}

const ALL_TOOL_NAMES = [
  "create_setup",
  "update_setting",
  "create_rule",
  "load_setup",
  "get_datetime",
  "pause_ella",
  "homework_mode",
  "get_location",
  "get_disk_usage",
  "clean_temp",
  "empty_recycle_bin",
  "free_ram",
  "get_system_status",
  "get_system_info",
  "get_battery_status",
  "get_temperatures",
  "format_drive",
  "rename_drive",
  "scan_network",
  "list_connections",
  "list_devices",
  "get_wifi_info",
  "remember",
  "forget",
  "list_memories",
  "read_emails",
  "mark_email",
  "compose_email",
  "read_calendar",
  "create_appointment",
  "read_gmail",
  "mark_gmail",
  "read_google_calendar",
  "create_google_appointment",
  "search_web",
  "web_search",
  "fetch_url",
  "get_weather",
  "search_files",
  "open_file",
  "explore_folder",
  "list_folder",
  "create_document",
  "dictate_to_document",
  "read_file_content",
  "rename_file",
  "copy_file",
  "create_folder",
  "delete_file",
  "delete_files",
  "find_duplicates",
  "play_music",
  "control_media",
  "get_now_playing",
  "set_volume",
  "list_programs",
  "open_app",
  "launch_app",
  "list_processes",
  "kill_process",
  "manage_service",
  "get_clipboard",
  "set_clipboard",
  "set_reminder",
  "list_reminders",
  "delete_reminder",
  "set_alarm",
  "list_alarms",
  "delete_alarm",
  "add_task",
  "list_tasks",
  "complete_task",
  "delete_task",
  "take_screenshot",
  "read_screen",
  "describe_screen",
  "describe_image",
  "describe_webpage",
  "watch_screen",
  "click_element",
  "write_for_me",
  "translate_text",
  "summarize_text",
  "list_autostart",
  "control_window",
  "send_keys",
  "move_mouse",
  "click_at",
  "drag_drop",
  "get_event_log",
  "toggle_dark_mode",
  "shutdown_system",
  "run_command",
];

const ALL_TOOLS = ALL_TOOL_NAMES.map(makeTool);

describe("selectToolsForQuery", () => {
  it("gibt immer CORE-Tools zurück", () => {
    const result = selectToolsForQuery("hallo", ALL_TOOLS);
    const names = result.map((t) => t.function.name);
    expect(names).toContain("get_datetime");
    expect(names).toContain("create_setup");
    expect(names).toContain("pause_ella");
  });

  it("gibt weniger als alle Tools zurück (Selektion greift)", () => {
    const result = selectToolsForQuery("hallo wie geht es dir", ALL_TOOLS);
    expect(result.length).toBeLessThan(ALL_TOOLS.length);
  });

  it("erkennt Festplatten-Anfrage (DE)", () => {
    const result = selectToolsForQuery(
      "wieviel speicher hat laufwerk c?",
      ALL_TOOLS,
    );
    const names = result.map((t) => t.function.name);
    expect(names).toContain("get_disk_usage");
  });

  it("erkennt Datei-Anfrage", () => {
    const result = selectToolsForQuery(
      "suche die datei bericht.pdf",
      ALL_TOOLS,
    );
    const names = result.map((t) => t.function.name);
    expect(names).toContain("search_files");
    expect(names).toContain("open_file");
  });

  it("erkennt E-Mail-Anfrage", () => {
    const result = selectToolsForQuery(
      "zeig mir meine outlook emails",
      ALL_TOOLS,
    );
    const names = result.map((t) => t.function.name);
    expect(names).toContain("read_emails");
    expect(names).toContain("compose_email");
  });

  it("erkennt Web-Suche-Anfrage", () => {
    const result = selectToolsForQuery(
      "suche im internet nach aktuellen neuigkeiten",
      ALL_TOOLS,
    );
    const names = result.map((t) => t.function.name);
    expect(names).toContain("search_web");
    expect(names).toContain("web_search");
  });

  it("erkennt Musik-Anfrage", () => {
    const result = selectToolsForQuery("spiel mir ein lied ab", ALL_TOOLS);
    const names = result.map((t) => t.function.name);
    expect(names).toContain("play_music");
    expect(names).toContain("set_volume");
  });

  it("erkennt Screenshot-Anfrage", () => {
    const result = selectToolsForQuery(
      "mach einen screenshot vom bildschirm",
      ALL_TOOLS,
    );
    const names = result.map((t) => t.function.name);
    expect(names).toContain("take_screenshot");
    expect(names).toContain("describe_screen");
  });

  it("erkennt mehrere Gruppen gleichzeitig", () => {
    const result = selectToolsForQuery(
      "suche die datei und sende sie per email",
      ALL_TOOLS,
    );
    const names = result.map((t) => t.function.name);
    expect(names).toContain("search_files");
    expect(names).toContain("read_emails");
  });

  it("Fallback: gibt CORE zurück wenn kein Tool matched", () => {
    const result = selectToolsForQuery("hallo", [makeTool("get_datetime")]);
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("selectToolsForContext", () => {
  it("gibt maximal maxTools zurück", () => {
    const result = selectToolsForContext(
      "suche datei und sende email und spiel musik",
      "Ich suche ...",
      ["search_files"],
      ALL_TOOLS,
      5,
    );
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it("enthält immer CORE-Tools (solange maxTools >= CORE-Größe)", () => {
    const result = selectToolsForContext("", "", [], ALL_TOOLS, 20);
    const names = result.map((t) => t.function.name);
    expect(names).toContain("get_datetime");
  });
});
