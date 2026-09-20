import type { OllamaTool } from "./ollama.js";

// Tools die bei JEDER Anfrage mitgesendet werden — klein halten, jedes kostet Tokens
const CORE = new Set([
  "create_setup",
  "update_setting",
  "create_rule",
  "load_setup",
  "get_datetime",
  "pause_ella",
  "homework_mode",
  "get_location",
]);

// Jede Gruppe: Pattern (DE+EN) + zugehörige Tool-Namen
const LAZY_GROUPS: { pattern: RegExp; tools: string[] }[] = [
  {
    // Festplatte, RAM, Temp, Systeminfo, Akku, Temperaturen
    pattern:
      /disk|laufwerk|festplatt|speicher.*platz|freier.*speicher|ram|arbeitsspeich|temp(?:eratur)?|papierkorb|m[uü]ll|recycle|system.*info|cpu|prozessor|gpu|akku|batterie|overcloc|auslastung|free.*space|drive.*usage/i,
    tools: [
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
    ],
  },
  {
    // Netzwerk, WiFi, Verbindungen
    pattern:
      /netzwerk|network|wifi|wlan|verbindung|connection|gerät.*netz|device.*net|ip.?adress|scan.*netz|offene.*ports?|tcp|arp|dns/i,
    tools: [
      "scan_network",
      "list_connections",
      "list_devices",
      "get_wifi_info",
    ],
  },
  {
    // Gedächtnis / Memory
    pattern:
      /erinner(?:e|ung)?|merk(?:e|dir)|vergiss|gedächtnis|speicher.*das|weiß.*noch|remember|forget|memory|notiz für mich/i,
    tools: ["remember", "forget", "list_memories"],
  },
  {
    // Outlook E-Mail + Kalender
    pattern:
      /mail|e-mail|email|outlook|postfach|inbox|nachricht|kalender|termin|appointment|read.*email|send.*email|compose/i,
    tools: [
      "read_emails",
      "mark_email",
      "compose_email",
      "read_calendar",
      "create_appointment",
    ],
  },
  {
    // Gmail + Google Calendar
    pattern: /gmail|google.*mail|google.*kalender|google.*calendar/i,
    tools: [
      "read_gmail",
      "mark_gmail",
      "read_google_calendar",
      "create_google_appointment",
    ],
  },
  {
    // Web, Suche, Wetter, URL
    pattern:
      /such|search|google|bing|internet|online|web(?:site|seite)?|url|link|wetter|weather|news|aktuell|nachschlagen|nachrich/i,
    tools: ["search_web", "web_search", "fetch_url", "get_weather"],
  },
  {
    // Dateien, Ordner, Dokumente
    pattern:
      /datei|file|ordner|folder|verzeichnis|directory|dokument|document|pdf|word|xlsx|excel|öffne|erstell.*datei|suche.*datei|find.*file|lese.*datei|read.*file|kopier|verschib|rename/i,
    tools: [
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
    ],
  },
  {
    // Musik, Medien, Lautstärke
    pattern:
      /musik|music|lied|song|album|künstler|artist|play|abspielen|spiel.*ab|media|lautstärke|volume|laut(?:er)?|leise(?:r)?|stummer|mute|now.*playing/i,
    tools: ["play_music", "control_media", "get_now_playing", "set_volume"],
  },
  {
    // Apps / Programme starten
    pattern:
      /öffne|starte|programm\b|app\b|anwendung|browser|chrome|firefox|edge|starte|launch|start.*app|open.*app/i,
    tools: ["list_programs", "open_app", "launch_app"],
  },
  {
    // Schach
    pattern:
      /schach|chess|partie|spielen.*schach|schach.*spielen|brett|lass.*spielen|spielen.*wir/i,
    tools: ["open_chess_window"],
  },
  {
    // Reflexion / Erfahrungslernen
    pattern:
      /reflektier|reflect|was.*gelernt|erkenntnisse.*ableiten|aus.*erfahrungen.*lernen|prinzip.*ableiten|schlussfolger|transfer.*wissen/i,
    tools: ["reflect_on_experiences"],
  },
  {
    // Lokale Dokumente / RAG
    pattern:
      /was.*(?:stand|steht|enthält|enthält).*(?:dokument|vertrag|datei|bericht|notiz)|such.*(?:in|in meinen).*(?:dateien|dokumenten)|indizier|index.*dokument|dokument.*index|finde.*(?:in|text.*in)|inhalt.*(?:von|der|des).*(?:datei|dokument|pdf|word)/i,
    tools: ["index_documents", "search_documents"],
  },
  {
    // Multi-Monitor
    pattern:
      /monitor|bildschirm.*\d|zweiter.*bildschirm|monitor.*\d|auf.*monitor|welche.*monitore|monitore.*auflisten|zweiter.*monitor|haupt.*monitor|neben.*bildschirm/i,
    tools: ["list_monitors", "open_app_on_monitor"],
  },
  {
    // Prozesse & Dienste
    pattern:
      /prozess|process|dienst|service|task[\s-]?manag|beende.*prozess|kill|stoppe.*prozess|windows.*dienst/i,
    tools: ["list_processes", "kill_process", "manage_service"],
  },
  {
    // Zwischenablage
    pattern:
      /clipboard|zwischenablage|kopiert|zwischengespeich|paste|einfüg|was.*kopiert/i,
    tools: ["get_clipboard", "set_clipboard"],
  },
  {
    // Erinnerungen, Wecker, Aufgaben
    pattern:
      /erinner(?:ung)?.*(?:setze|stelle|um)|wecker|alarm|aufgabe|task|todo|to-do|erledige|liste.*aufgabe|reminder/i,
    tools: [
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
    ],
  },
  {
    // Screenshot, Bildschirm lesen, Vision
    pattern:
      /screenshot|bildschirm.*foto|screen.*shot|was.*auf.*(?:dem|meinem).*bildschirm|sieh.*dir.*(?:das|den|an)|zeig.*(?:mir.*)?(?:den|was)|beschreib.*(?:bild|screen|seite)|read.*screen/i,
    tools: [
      "take_screenshot",
      "read_screen",
      "describe_screen",
      "describe_image",
      "describe_webpage",
      "watch_screen",
      "click_element",
    ],
  },
  {
    // Schreibassistenz, Übersetzen, Zusammenfassen
    pattern:
      /schreib.*(?:mir|für|einen?|eine?)|formulier|mail.*schreib|brief.*schreib|text.*verfass|übersetze?|translate|zusammenfass|summari|korrigier|text.*verbesser/i,
    tools: ["write_for_me", "translate_text", "summarize_text"],
  },
  {
    // Autostart
    pattern:
      /autostart|startup|start.*mit.*windows|beim.*hochfahren|beim.*start/i,
    tools: ["list_autostart"],
  },
  {
    // Fenster- & UI-Automatisierung
    pattern:
      /fenster|window.*(?:steuer|kontroll)|klick|click|tastatur|keyboard|enter.*drück|maus|mouse|drag|drop|automatisier.*klick|taste.*drück/i,
    tools: [
      "control_window",
      "send_keys",
      "move_mouse",
      "click_at",
      "drag_drop",
    ],
  },
  {
    // Ereignis-Log / Windows-Log
    pattern:
      /event.*log|ereignis.*protokoll|windows.*log|fehler.*log|error.*log|system.*log/i,
    tools: ["get_event_log"],
  },
  {
    // Dark Mode / Design
    pattern:
      /dark.*mode|nacht.*modus|dunkles.*design|helles.*design|hell.*modus|dunkel.*modus|theme.*wechsel/i,
    tools: ["toggle_dark_mode"],
  },
  {
    // Herunterfahren / Power
    pattern:
      /herunterfahren|shutdown|neustart|restart|reboote?|ausschalten|ruhezustand|hibernat|schlafmodus|energie.*spar/i,
    tools: ["shutdown_system"],
  },
  {
    // Terminal / Befehl ausführen
    pattern:
      /befehl.*ausführ|führe.*befehl|terminal|powershell|cmd\.exe|kommando|run.*command|shell.*command|script.*ausführ/i,
    tools: ["run_command"],
  },
];

/**
 * Wählt aus `allTools` nur die Tools aus, die zur Anfrage passen.
 * In Round 0 auf den User-Message anwenden.
 * In Rounds 1+ auf den kombinierten Kontext (User-Message + bisherige Tool-Ergebnisse).
 */
export function selectToolsForQuery(
  query: string,
  allTools: OllamaTool[],
): OllamaTool[] {
  const active = new Set<string>(CORE);

  for (const group of LAZY_GROUPS) {
    if (group.pattern.test(query)) {
      for (const t of group.tools) active.add(t);
    }
  }

  const selected = allTools.filter((t) => active.has(t.function.name));

  // Fallback: mindestens CORE zurückgeben (sollte immer gelten)
  if (selected.length === 0)
    return allTools.filter((t) => CORE.has(t.function.name));

  return selected;
}

/**
 * Für Rounds 1+: selektiert Tools basierend auf dem bisherigen Konversations-Kontext.
 * Nutzt User-Message + letzten Assistant-Content + Tool-Namen aus dem letzten Round.
 * Gibt maximal `maxTools` zurück — Rounds 1+ sollen kompakt bleiben.
 */
export function selectToolsForContext(
  userMessage: string,
  lastAssistantContent: string,
  lastToolNames: string[],
  allTools: OllamaTool[],
  maxTools = 15,
): OllamaTool[] {
  const combined = [userMessage, lastAssistantContent, ...lastToolNames].join(
    " ",
  );
  const selected = selectToolsForQuery(combined, allTools);

  // In späteren Rounds nie mehr als maxTools senden
  return selected.slice(0, maxTools);
}
