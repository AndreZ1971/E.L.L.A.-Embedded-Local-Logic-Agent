import type { OllamaTool } from "../services/ollama.js";
import type { Setup } from "../services/settings.js";

export const TOOL_DEFINITIONS: OllamaTool[] = [
  {
    type: "function",
    function: {
      name: "list_programs",
      description:
        "Zeigt alle installierten Programme die gestartet werden können. " +
        "Gibt nur Namen zurück — keine Pfade. " +
        "Nutze filter um die Liste einzuschränken, z.B. 'office' oder 'browser'.",
      parameters: {
        type: "object",
        properties: {
          filter: {
            type: "string",
            description:
              'Optional: Suchbegriff um die Liste zu filtern, z.B. "office" oder "browser"',
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "open_app",
      description:
        "Öffnet eine Anwendung oder ein Programm auf dem Computer des Nutzers.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description:
              'Name der Anwendung, z.B. "notepad", "chrome", "explorer"',
          },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_disk_usage",
      description: "Gibt die Festplattennutzung eines Laufwerks zurück.",
      parameters: {
        type: "object",
        properties: {
          drive: {
            type: "string",
            description: 'Laufwerksbuchstabe, z.B. "C" (optional, Standard: C)',
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "clean_temp",
      description:
        "Bereinigt temporäre Dateien auf dem System um Speicherplatz freizugeben.",
      parameters: {
        type: "object",
        properties: {
          scope: {
            type: "string",
            description:
              '"user" für nur Nutzer-Temp, "system" für System-Temp (Standard: user)',
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "empty_recycle_bin",
      description: "Leert den Windows-Papierkorb.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
];

const MEMORY_TOOLS: OllamaTool[] = [
  {
    type: "function",
    function: {
      name: "remember",
      description:
        'Speichert eine wichtige Information dauerhaft im Langzeitgedächtnis. Nutze dies wenn der Nutzer "Merk dir", "Denk daran" o.ä. sagt, oder wenn du eine dauerhaft relevante Beobachtung machen willst.',
      parameters: {
        type: "object",
        properties: {
          type: {
            type: "string",
            description:
              '"user" für persönliche Infos über den Nutzer, "system" für System-/App-Infos, "note" für explizite Notizen',
          },
          content: {
            type: "string",
            description:
              "Der zu merkende Inhalt als vollständiger, verständlicher Satz",
          },
        },
        required: ["type", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "forget",
      description:
        "Löscht eine Erinnerung aus dem Langzeitgedächtnis anhand ihrer ID.",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Die numerische ID der zu löschenden Erinnerung",
          },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_memories",
      description:
        "Listet gespeicherte Erinnerungen aus dem Langzeitgedächtnis auf. Nutze dies wenn der Nutzer fragt was E.L.L.A. über ihn weiß, oder um IDs für forget() zu finden.",
      parameters: {
        type: "object",
        properties: {
          type: {
            type: "string",
            description:
              'Optional: Filter nach Typ — "user", "system" oder "note". Weglassen für alle.',
          },
        },
        required: [],
      },
    },
  },
];

const CONVERSATION_TOOLS: OllamaTool[] = [
  {
    type: "function",
    function: {
      name: "create_setup",
      description:
        "Legt ein neues App-Setup an. Kann Apps öffnen/schließen und beliebige ELLA-Tool-Aktionen als Schritte enthalten (z.B. Lautstärke setzen, Dark Mode, Clipboard). Nutze dies wenn der Nutzer ein Setup erstellen oder eine komplexe Prozedur automatisieren möchte.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: 'Name des Setups, z.B. "Gaming" oder "Arbeiten"',
          },
          open: {
            type: "array",
            items: { type: "string" },
            description:
              "Liste der App-Namen die beim Setup geöffnet werden sollen",
          },
          close: {
            type: "array",
            items: { type: "string" },
            description:
              "Liste der App-Namen die beim Setup geschlossen werden sollen",
          },
          actions: {
            type: "array",
            description:
              "Optionale geordnete Liste von Tool-Aktionen die sequenziell ausgeführt werden. Jede Aktion hat 'tool' (Tool-Name), 'args' (Parameter) und optional 'label' (Beschreibung).",
            items: {
              type: "object",
              properties: {
                tool: {
                  type: "string",
                  description:
                    "Name des auszuführenden Tools, z.B. 'set_volume', 'toggle_dark_mode', 'set_clipboard'",
                },
                args: {
                  type: "object",
                  description: "Parameter für das Tool",
                },
                label: {
                  type: "string",
                  description:
                    "Menschenlesbare Beschreibung dieser Aktion, z.B. 'Lautstärke auf 80%'",
                },
              },
              required: ["tool", "args"],
            },
          },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_setting",
      description:
        "Ändert eine Einstellung von E.L.L.A. Nur erlaubte Felder können geändert werden. Gesperrt sind: API-Keys, PIN, Hausaufgaben-Modus-Status.",
      parameters: {
        type: "object",
        properties: {
          key: {
            type: "string",
            description:
              "Name der Einstellung: provider, ollamaModel, voiceMode, sessionLimit, ttsEnabled, ttsVoice",
          },
          value: {
            type: "string",
            description: "Neuer Wert der Einstellung",
          },
        },
        required: ["key", "value"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_rule",
      description:
        "Legt eine neue Erlaubnis- oder Verbots-Regel für ein Tool an. Nutze dies wenn der Nutzer ein Tool freischalten oder sperren möchte.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Beschreibender Name der Regel",
          },
          tool_name: {
            type: "string",
            description:
              'Tool-Name auf den die Regel zutrifft, oder "*" für alle Tools',
          },
          trigger: {
            type: "string",
            description:
              'Wann gilt die Regel: "always", "hour > 22", "disk_c > 85"',
          },
          action: {
            type: "string",
            description: '"allow" um zu erlauben, "deny" um zu sperren',
          },
        },
        required: ["name", "tool_name", "action"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "free_ram",
      description:
        "Gibt ungenutzten Arbeitsspeicher frei und zeigt die aktuelle RAM-Belegung. Nicht destruktiv.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
];

const MAIL_TOOLS: OllamaTool[] = [
  {
    type: "function",
    function: {
      name: "read_emails",
      description:
        "Ruft ungelesene E-Mails ab (Outlook oder Thunderbird). Gibt Betreff, Absender, Vorschau, ID und Quelle zurück.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "string",
            description: "Maximale Anzahl Mails (Standard: 10, max: 20)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "mark_email",
      description:
        'Markiert eine E-Mail aus read_emails. Aktionen: "read" (als gelesen), "spam" (in Junk), "archive" (archivieren), "delete" (nur für bereits gelesene Mails — Direktive verbietet Löschen ungelesener Mails). Nur für Outlook-Mails (source: "outlook").',
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description:
              'EntryID der Mail aus read_emails (source muss "outlook" sein)',
          },
          action: {
            type: "string",
            description: '"read", "spam", "archive" oder "delete"',
          },
        },
        required: ["id", "action"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_calendar",
      description:
        "Liest Termine aus dem Outlook-Kalender. Standard: heute und morgen.",
      parameters: {
        type: "object",
        properties: {
          days: {
            type: "string",
            description: "Anzahl Tage ab heute (Standard: 2, max: 14)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_appointment",
      description: "Legt einen neuen Termin im Outlook-Kalender an.",
      parameters: {
        type: "object",
        properties: {
          subject: {
            type: "string",
            description: "Titel des Termins",
          },
          start: {
            type: "string",
            description: 'Startzeit im Format "2026-05-28 14:00"',
          },
          end: {
            type: "string",
            description: 'Endzeit im Format "2026-05-28 15:00"',
          },
          location: {
            type: "string",
            description: "Ort (optional)",
          },
        },
        required: ["subject", "start", "end"],
      },
    },
  },
];

const GOOGLE_TOOLS: OllamaTool[] = [
  {
    type: "function",
    function: {
      name: "read_gmail",
      description:
        "Liest ungelesene E-Mails aus Gmail. Gibt Betreff, Absender, Vorschau und ID zurück. Nur wenn Google verbunden ist.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "string",
            description: "Anzahl Mails (Standard: 10, max: 20)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "mark_gmail",
      description:
        'Markiert eine Gmail-Nachricht. Aktionen: "read", "archive", "spam", "delete" (nur gelesene). source muss "gmail" sein.',
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Message-ID aus read_gmail",
          },
          action: {
            type: "string",
            description: '"read", "archive", "spam" oder "delete"',
          },
        },
        required: ["id", "action"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_google_calendar",
      description:
        "Liest Termine aus Google Kalender. Standard: heute und morgen.",
      parameters: {
        type: "object",
        properties: {
          days: {
            type: "string",
            description: "Anzahl Tage ab heute (Standard: 2, max: 14)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_google_appointment",
      description: "Legt einen neuen Termin in Google Kalender an.",
      parameters: {
        type: "object",
        properties: {
          subject: { type: "string", description: "Titel des Termins" },
          start: {
            type: "string",
            description: 'Startzeit "2026-06-01 14:00"',
          },
          end: { type: "string", description: 'Endzeit "2026-06-01 15:00"' },
          location: { type: "string", description: "Ort (optional)" },
        },
        required: ["subject", "start", "end"],
      },
    },
  },
];

const DRIVE_TOOLS: OllamaTool[] = [
  {
    type: "function",
    function: {
      name: "format_drive",
      description:
        "Formatiert ein Laufwerk (USB-Stick, externe HDD, SD-Karte oder interne Festplatte). " +
        "Vor der Ausführung wird eine Bestätigung eingeholt. " +
        "Dateisystem: FAT32 (Standard, max 4 GB/Datei), NTFS (Windows), exFAT (große Dateien).",
      parameters: {
        type: "object",
        properties: {
          drive: {
            type: "string",
            description: 'Laufwerksbuchstabe ohne Doppelpunkt, z.B. "E"',
          },
          filesystem: {
            type: "string",
            description: "FAT32, NTFS oder exFAT (Standard: FAT32)",
          },
          label: {
            type: "string",
            description:
              "Optionaler Name für das Laufwerk nach dem Formatieren",
          },
        },
        required: ["drive"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "rename_drive",
      description:
        "Benennt ein Laufwerk um (Volume-Label). Systemlaufwerke sind geschützt.",
      parameters: {
        type: "object",
        properties: {
          drive: {
            type: "string",
            description: 'Laufwerksbuchstabe ohne Doppelpunkt, z.B. "E"',
          },
          label: {
            type: "string",
            description: "Neuer Name des Laufwerks",
          },
        },
        required: ["drive", "label"],
      },
    },
  },
];

const HARDWARE_TOOLS: OllamaTool[] = [
  {
    type: "function",
    function: {
      name: "scan_network",
      description:
        "Scannt das lokale Netzwerk per ARP und listet alle aktiven Geräte mit IP- und MAC-Adresse. Nützlich um zu sehen wer im Heimnetz aktiv ist.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_connections",
      description:
        "Zeigt alle aktiven TCP-Verbindungen und lauschenden Ports inkl. zugehörigem Prozessnamen. Hilfreich um unbekannte Netzwerkaktivität zu erkennen.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_devices",
      description:
        "Listet alle aktuell angeschlossenen Hardware-Geräte auf (USB, Kameras, Festplatten) sowie alle erkannten Laufwerke. Nutze dies wenn der Nutzer fragt welche Geräte verbunden sind.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
];

const SYSTEM_STATUS_TOOL: OllamaTool = {
  type: "function",
  function: {
    name: "get_system_status",
    description:
      "Rundum-Diagnose: liefert in einem Aufruf alle Laufwerke mit Belegung, RAM-Stand, Ollama-Status, aktive Netzwerkverbindungen, letzten Boot-Zeitpunkt, Temp-Ordner-Größe und alle Alerts der letzten 24 h. Nutze dies wenn der Nutzer fragt ob alles okay ist oder einen Überblick über das System möchte.",
    parameters: {
      type: "object",
      properties: {},
    },
  },
};

const SEARCH_WEB_TOOL: OllamaTool = {
  type: "function",
  function: {
    name: "search_web",
    description:
      "Sucht im Web nach aktuellen Informationen: Wetter, Nachrichten, Preise, Veranstaltungen, Fakten — alles was sich mit gespeichertem Wissen nicht beantworten lässt. Nutze dies für Small Talk über aktuelle Ereignisse oder wenn der Nutzer nach etwas Zeitabhängigem fragt.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            'Suchanfrage auf Deutsch oder Englisch, z.B. "Wetter München heute"',
        },
      },
      required: ["query"],
    },
  },
};

const WEB_TOOLS: OllamaTool[] = [
  {
    type: "function",
    function: {
      name: "web_search",
      description:
        "Sucht im Web nach aktuellen Informationen. Nutze dies für Echtzeit-Daten, aktuelle Ereignisse, Preise, Nachrichten — alles was sich ändern kann und nicht im Trainingsdata steht. Funktioniert ohne OpenAI.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Die Suchanfrage — so konkret wie möglich",
          },
          limit: {
            type: "string",
            description: "Anzahl Ergebnisse (Standard: 5, max: 10)",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "fetch_url",
      description:
        "Ruft den Inhalt einer bestimmten Webseite ab und extrahiert den lesbaren Text. Nutze dies wenn der Nutzer eine konkrete URL nennt oder du nach web_search tiefer in ein Ergebnis einsteigen willst.",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "Die vollständige URL der Seite (inkl. https://)",
          },
        },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_weather",
      description:
        "Gibt die aktuelle Wettervorhersage für einen Ort zurück — heute und die nächsten Tage. Kein API-Key nötig. Wenn kein Ort angegeben wird, nutze den gespeicherten Standort des Nutzers.",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description:
              "Stadtname, z.B. 'Berlin'. Weglassen wenn gespeicherter Standort genutzt werden soll.",
          },
          days: {
            type: "string",
            description: "Anzahl Tage (Standard: 3, max: 7)",
          },
        },
        required: [],
      },
    },
  },
];

const SYSTEM_INFO_TOOL: OllamaTool = {
  type: "function",
  function: {
    name: "get_system_info",
    description:
      "Gibt gespeicherte Informationen über diesen Computer zurück — CPU, GPU, RAM, Computername. Nutze dies wenn der Nutzer nach seinem System fragt.",
    parameters: {
      type: "object",
      properties: {},
    },
  },
};

const HOMEWORK_TOOL: OllamaTool = {
  type: "function",
  function: {
    name: "homework_mode",
    description:
      "Aktiviert den gesicherten Hausaufgaben-Modus (action=activate). Deaktivieren ist nur über den 🔒-Button in der App-Oberfläche möglich — niemals per Tool-Call.",
    parameters: {
      type: "object",
      properties: {
        action: {
          type: "string",
          description: '"activate" — schaltet den Hausaufgaben-Modus ein',
        },
      },
      required: ["action"],
    },
  },
};

export function buildToolDefinitions(setups: Setup[] = []): OllamaTool[] {
  const defs = [
    ...TOOL_DEFINITIONS,
    ...MEMORY_TOOLS,
    HOMEWORK_TOOL,
    SYSTEM_INFO_TOOL,
    SYSTEM_STATUS_TOOL,
    SEARCH_WEB_TOOL,
    ...WEB_TOOLS,
    ...HARDWARE_TOOLS,
    ...DRIVE_TOOLS,
    ...CONVERSATION_TOOLS,
    ...MAIL_TOOLS,
    ...GOOGLE_TOOLS,
  ];

  if (setups.length > 0) {
    const names = setups.map((s) => `"${s.name.toLowerCase()}"`).join(", ");
    defs.push({
      type: "function",
      function: {
        name: "load_setup",
        description: `Startet alle Apps eines definierten Setups. Verfügbare Setups: ${names}.`,
        parameters: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: `Name des Setups (Kleinschreibung), z.B. ${names.split(",")[0]}`,
            },
          },
          required: ["name"],
        },
      },
    });
  }

  defs.push({
    type: "function",
    function: {
      name: "get_location",
      description:
        "Gibt den aktuellen Standort des Nutzers zurück — Stadt und Land. Nutze dies bevor du Wetter, lokale Nachrichten oder standortbezogene Informationen abrufst. Wenn kein Standort bekannt ist, erst den Nutzer fragen. Wenn der Nutzer 'ja' sagt, erneut mit user_consented=true aufrufen.",
      parameters: {
        type: "object",
        properties: {
          user_consented: {
            type: "boolean",
            description:
              "true wenn der Nutzer explizit zugestimmt hat seinen Standort per IP zu ermitteln. Erst true setzen wenn der Nutzer 'ja' oder ähnliches geantwortet hat.",
          },
        },
      },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "get_datetime",
      description:
        "Gibt die exakte aktuelle Uhrzeit, das Datum und die Zeitzone zurück. Nutze dies für Berechnungen wie 'Wie viele Tage bis...', 'Was ist in 3 Stunden?' oder wenn du die genaue Zeit für eine andere Zeitzone brauchst.",
      parameters: {
        type: "object",
        properties: {
          timezone: {
            type: "string",
            description:
              "Optional: IANA Zeitzone z.B. 'America/New_York'. Weglassen für lokale Systemzeit.",
          },
        },
      },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "shutdown_system",
      description:
        "Fährt den PC herunter, startet ihn neu oder versetzt ihn in den Schlafmodus. Nur auf explizite Nutzeranfrage verwenden. Sage vorher 'Bis später' oder 'Gute Nacht' in deiner Antwort.",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            description:
              "Aktion: 'shutdown' = herunterfahren, 'restart' = neu starten, 'sleep' = Schlafmodus",
          },
          delay_seconds: {
            type: "number",
            description:
              "Verzögerung in Sekunden bevor die Aktion ausgeführt wird. Standard: 5",
          },
        },
        required: ["action"],
      },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "pause_ella",
      description:
        "Versetzt E.L.L.A. in den Pausenmodus für eine bestimmte Dauer. " +
        "Das Wakeword wird deaktiviert. Nach Ablauf meldet sich E.L.L.A. selbstständig zurück. " +
        "Nutze dies wenn der Nutzer sagt: 'mach Pause', 'ich brauche Ruhe', 'nicht stören' o.ä.",
      parameters: {
        type: "object",
        properties: {
          minutes: {
            type: "number",
            description: "Pausendauer in Minuten (1–120). Standard: 10",
          },
        },
        required: [],
      },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "play_music",
      description:
        "Spielt Musik aus der konfigurierten Musikbibliothek. " +
        "Ohne Suchbegriff: oeffnet die gesamte Bibliothek im Media Player. " +
        "Mit Suchbegriff: sucht nach Kuenstler, Album oder Titel und oeffnet den Treffer. " +
        "Wenn der Nutzer ein konkretes Laufwerk oder einen Pfad nennt (z.B. 'auf Laufwerk H', 'H:\\\\Billy Idol'), " +
        "'path' direkt setzen statt zu suchen. " +
        "Beispiele: 'spiel Musik', 'spiel etwas von AC/DC', 'oeffne meine Jazz-Playlist'.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "Kuenstler, Album oder Titel — weglassen fuer gesamte Bibliothek",
          },
          path: {
            type: "string",
            description:
              "Direkter Pfad zu Datei oder Ordner — wenn bekannt, Suche ueberspringen (z.B. H:\\\\Billy Idol)",
          },
        },
      },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "search_files",
      description:
        "Durchsucht alle Laufwerke nach Dateien. Findet Dokumente, Bilder, Videos, Musik nach Name oder Typ.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Suchbegriff — Dateiname oder Teil davon",
          },
          type: {
            type: "string",
            description:
              "Dateityp: word, excel, pdf, bild, video, audio, text, alle",
          },
          drive: {
            type: "string",
            description: "Laufwerk einschränken: C, D, E, H — leer = alle",
          },
        },
        required: ["query"],
      },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "open_file",
      description:
        "Öffnet eine Datei. Optional mit bestimmter App. Bei Word-Dokumenten optional direkt ans Ende springen.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Vollständiger Dateipfad",
          },
          app: {
            type: "string",
            description: "App-Name aus der Programmliste (optional)",
          },
          position: {
            type: "string",
            description: '"end" um Cursor ans Ende zu setzen (nur Word)',
          },
        },
        required: ["path"],
      },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "explore_folder",
      description: "Öffnet einen Ordner im Windows Explorer.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: 'Ordnerpfad, z.B. "E:\\Dokumente"',
          },
        },
        required: ["path"],
      },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "list_folder",
      description:
        "Listet den Inhalt eines Ordners oder Laufwerks auf (nicht rekursiv). Zeigt Dateien und Unterordner mit Größe und Datum. Verwende dies wenn der Nutzer fragt was sich auf einem Laufwerk oder in einem Ordner befindet.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description:
              'Pfad zum Ordner oder Laufwerk, z.B. "H:\\\\" oder "C:\\\\Users\\\\Andre\\\\Documents"',
          },
          show_hidden: {
            type: "boolean",
            description: "Versteckte Dateien anzeigen (Standard: false)",
          },
        },
        required: ["path"],
      },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "create_document",
      description:
        "Erstellt ein neues Dokument. Word oder Textdatei. Optional mit Inhalt vorbefüllen.",
      parameters: {
        type: "object",
        properties: {
          type: {
            type: "string",
            description: '"word" (Standard) oder "text"',
          },
          name: {
            type: "string",
            description: "Dateiname ohne Endung (optional)",
          },
          path: {
            type: "string",
            description: "Speicherordner (optional, Standard: Dokumente)",
          },
          content: {
            type: "string",
            description: "Anfangsinhalt (optional)",
          },
        },
      },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "dictate_to_document",
      description:
        "Schreibt diktierten Text in ein offenes Word-Dokument oder die Zwischenablage. " +
        "KI korrigiert automatisch Rechtschreibung, Grammatik und Zeichensetzung. " +
        'Nutze dies wenn der Nutzer Text diktieren will oder "schreib das auf" sagt.',
      parameters: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "Der diktierte Rohtext",
          },
          target: {
            type: "string",
            description: '"word" (Standard), "clipboard"',
          },
          correct: {
            type: "boolean",
            description: "KI-Korrektur aktivieren (Standard: true)",
          },
        },
        required: ["text"],
      },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "compose_email",
      description:
        "Öffnet einen E-Mail-Entwurf in Outlook. KI korrigiert den Text automatisch. Sendet NICHT — Nutzer entscheidet.",
      parameters: {
        type: "object",
        properties: {
          to: {
            type: "string",
            description: "Empfänger-E-Mail",
          },
          subject: {
            type: "string",
            description: "Betreff",
          },
          body: {
            type: "string",
            description: "E-Mail-Text",
          },
        },
      },
    },
  });

  // ── WOW-Features ────────────────────────────────────────────────────────────
  defs.push({
    type: "function",
    function: {
      name: "list_processes",
      description: "Zeigt laufende Prozesse nach CPU/RAM-Verbrauch sortiert.",
      parameters: {
        type: "object",
        properties: {
          top: {
            type: "string",
            description: "Anzahl anzeigen (Standard: 20)",
          },
        },
      },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "kill_process",
      description:
        "Beendet einen laufenden Prozess. Systemkritische Prozesse sind geschützt.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Prozessname" },
          pid: {
            type: "string",
            description: "Prozess-ID (alternative zu name)",
          },
        },
      },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "set_volume",
      description: "Setzt die Windows-Systemlautstärke oder schaltet stumm.",
      parameters: {
        type: "object",
        properties: {
          level: { type: "number", description: "Lautstärke 0–100" },
          mute: { type: "boolean", description: "true = stumm schalten" },
        },
      },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "get_clipboard",
      description:
        "Liest den aktuellen Inhalt der Zwischenablage. Optional: Historie der letzten 20 Einträge.",
      parameters: {
        type: "object",
        properties: {
          history: {
            type: "boolean",
            description: "true für die letzten 20 Einträge",
          },
        },
      },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "set_clipboard",
      description: "Kopiert Text in die Zwischenablage.",
      parameters: {
        type: "object",
        properties: {
          text: { type: "string", description: "Text der kopiert werden soll" },
        },
        required: ["text"],
      },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "set_reminder",
      description:
        "Setzt eine Erinnerung die zum angegebenen Zeitpunkt als Windows-Benachrichtigung erscheint.",
      parameters: {
        type: "object",
        properties: {
          message: { type: "string", description: "Text der Erinnerung" },
          time: {
            type: "string",
            description: "Uhrzeit im Format HH:MM",
          },
          date: {
            type: "string",
            description:
              "Datum YYYY-MM-DD (optional, Standard: heute oder morgen)",
          },
        },
        required: ["message", "time"],
      },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "list_reminders",
      description: "Zeigt alle aktiven ELLA-Erinnerungen.",
      parameters: { type: "object", properties: {} },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "delete_reminder",
      description: "Löscht eine Erinnerung anhand ihrer ID.",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Erinnerungs-ID aus list_reminders",
          },
        },
        required: ["id"],
      },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "set_alarm",
      description:
        "Stellt einen täglichen Wecker. E.L.L.A. meldet sich zur eingestellten Uhrzeit im Chat und liest ihn vor.",
      parameters: {
        type: "object",
        properties: {
          time: {
            type: "string",
            description: 'Uhrzeit im Format HH:MM, z.B. "07:00"',
          },
          label: {
            type: "string",
            description:
              'Bezeichnung des Weckers, z.B. "Aufstehen" (optional, Standard: Wecker)',
          },
        },
        required: ["time"],
      },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "list_alarms",
      description: "Zeigt alle aktiven Wecker.",
      parameters: { type: "object", properties: {} },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "delete_alarm",
      description: "Löscht einen Wecker anhand seiner ID.",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Wecker-ID aus list_alarms",
          },
        },
        required: ["id"],
      },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "take_screenshot",
      description:
        "Macht einen Screenshot und analysiert ihn mit KI. " +
        "Nutze dies wenn der Nutzer fragt was auf dem Bildschirm ist oder eine Fehlermeldung zeigt.",
      parameters: {
        type: "object",
        properties: {
          question: {
            type: "string",
            description: "Konkrete Frage zum Bildschirminhalt (optional)",
          },
        },
      },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "write_for_me",
      description:
        "Schreibt einen Text im Stil des Nutzers — E-Mail, Brief, Nachricht. " +
        "Lernt automatisch aus bisherigen Texten.",
      parameters: {
        type: "object",
        properties: {
          task: {
            type: "string",
            description:
              'Was soll geschrieben werden? Z.B. "Absage an Müller wegen Termin nächste Woche"',
          },
          style: {
            type: "boolean",
            description: "Nutzerstil anwenden (Standard: true)",
          },
        },
        required: ["task"],
      },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "find_duplicates",
      description:
        "Sucht nach doppelten Dateien auf dem System die Speicherplatz verschwenden.",
      parameters: {
        type: "object",
        properties: {
          drives: {
            type: "string",
            description:
              'Laufwerke kommagetrennt, z.B. "C,E,H" (Standard: C,E,H)',
          },
        },
      },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "list_autostart",
      description:
        "Zeigt alle Programme die beim Windows-Start automatisch gestartet werden.",
      parameters: { type: "object", properties: {} },
    },
  });

  // ── Aufgabenliste ──────────────────────────────────────────────────────────
  defs.push({
    type: "function",
    function: {
      name: "add_task",
      description:
        "Fügt eine neue Aufgabe zur persistenten Aufgabenliste hinzu. " +
        'Nutze dies wenn der Nutzer sagt: "Merk dir", "Ich muss noch", "Aufgabe anlegen".',
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Aufgabenbeschreibung" },
          priority: {
            type: "string",
            description: '"low", "normal" (Standard) oder "high"',
          },
          due_date: {
            type: "string",
            description: "Fälligkeitsdatum YYYY-MM-DD (optional)",
          },
          note: { type: "string", description: "Zusätzliche Notiz (optional)" },
        },
        required: ["title"],
      },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "list_tasks",
      description:
        "Zeigt offene oder erledigte Aufgaben aus der Aufgabenliste.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            description:
              '"pending" (Standard — offene) oder "done" (erledigte)',
          },
        },
      },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "complete_task",
      description: "Markiert eine Aufgabe als erledigt.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "number", description: "Aufgaben-ID aus list_tasks" },
        },
        required: ["id"],
      },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "delete_task",
      description: "Bricht eine Aufgabe ab und entfernt sie aus der Liste.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "number", description: "Aufgaben-ID aus list_tasks" },
        },
        required: ["id"],
      },
    },
  });

  // Directive-Demo — kein Handler, wird von DIRECTIVE_DENY blockiert
  defs.push({
    type: "function",
    function: {
      name: "delete_files",
      description:
        "Löscht Dateien oder Ordner vom System. Wird von der E.L.L.A. Directive blockiert.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Pfad zur Datei oder zum Ordner",
          },
        },
        required: ["path"],
      },
    },
  });

  // ── v3.2.0 System Automation ─────────────────────────────────────────────────
  defs.push({
    type: "function",
    function: {
      name: "launch_app",
      description:
        "Startet ein Programm auf dem Windows-System. Kann beliebige Apps per Name oder Pfad starten. " +
        'Nutze dies wenn der Nutzer sagt "starte X", "öffne X" (wenn nicht in App-Liste), "starte Y mit Argument Z".',
      parameters: {
        type: "object",
        properties: {
          app: {
            type: "string",
            description:
              'Programmname oder Pfad, z.B. "notepad", "chrome", "C:\\\\MeinApp\\\\app.exe"',
          },
          args: {
            type: "string",
            description: "Optionale Argumente, leerzeichen-getrennt (optional)",
          },
        },
        required: ["app"],
      },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "control_window",
      description:
        "Steuert ein Fenster: in den Vordergrund bringen, minimieren, maximieren oder schließen. " +
        "Sucht Fenster anhand des Titels (Teilstring).",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description:
              'Fenstertitel oder Teil davon, z.B. "Notepad", "Chrome", "Word"',
          },
          action: {
            type: "string",
            description:
              '"focus" (in Vordergrund), "minimize", "maximize", "close"',
          },
        },
        required: ["title", "action"],
      },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "send_keys",
      description:
        "Sendet Tastatureingaben an ein Fenster oder das aktuell aktive Fenster. " +
        "Format: Text wird direkt getippt. Sondertasten: {ENTER}, {TAB}, {ESC}, {F1}–{F16}, {BACKSPACE}, {DELETE}. " +
        "Modifikatoren: ^ = Ctrl, % = Alt, + = Shift. Beispiel: ^s = Ctrl+S, ^a{DELETE} = Alles markieren und löschen.",
      parameters: {
        type: "object",
        properties: {
          keys: {
            type: "string",
            description:
              'Tastatureingabe im WScript.Shell-Format, z.B. "Hallo Welt{ENTER}" oder "^s"',
          },
          window: {
            type: "string",
            description:
              "Zielfenster-Titel (optional — ohne Angabe: aktives Fenster)",
          },
        },
        required: ["keys"],
      },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "delete_file",
      description:
        "Verschiebt eine Datei oder einen Ordner in den Windows-Papierkorb (KEIN permanentes Löschen). " +
        "Systempfade sind gesperrt. Immer Bestätigung einholen.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description:
              'Pfad zur Datei oder zum Ordner, z.B. "E:\\\\Temp\\\\alt.docx"',
          },
        },
        required: ["path"],
      },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "manage_service",
      description:
        "Verwaltet Windows-Dienste: auflisten, starten, stoppen oder neu starten. " +
        "Systemkritische Dienste sind geschützt.",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            description: '"list" (Standard), "start", "stop", "restart"',
          },
          name: {
            type: "string",
            description:
              'Dienstname (erforderlich für start/stop/restart), z.B. "Spooler", "wuauserv"',
          },
          filter: {
            type: "string",
            description: "Suchbegriff für action=list (optional)",
          },
        },
      },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "read_screen",
      description:
        "Liest Text vom Bildschirm via lokalem OCR (Windows.Media.Ocr — offline, kein Cloud-Dienst). " +
        "Im Gegensatz zu take_screenshot benötigt read_screen keinen OpenAI API-Key und gibt nur den erkannten Text zurück.",
      parameters: { type: "object", properties: {} },
    },
  });

  // ── v3.3.0 Mouse, Shell, Screen Monitor ──────────────────────────────────────
  defs.push({
    type: "function",
    function: {
      name: "move_mouse",
      description:
        "Bewegt den Mauszeiger zu einer bestimmten Bildschirmposition. Keine Aktion — nur Bewegung.",
      parameters: {
        type: "object",
        properties: {
          x: { type: "number", description: "X-Koordinate in Pixel" },
          y: { type: "number", description: "Y-Koordinate in Pixel" },
        },
        required: ["x", "y"],
      },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "click_at",
      description:
        "Klickt an einer bestimmten Bildschirmposition. " +
        "Sicherheitskritische Fenster (Passwort-Manager, Banking) werden blockiert. " +
        "Immer Bestätigung einholen — zeige Koordinaten und aktives Fenster.",
      parameters: {
        type: "object",
        properties: {
          x: { type: "number", description: "X-Koordinate in Pixel" },
          y: { type: "number", description: "Y-Koordinate in Pixel" },
          button: {
            type: "string",
            description: '"left" (Standard), "right", "middle"',
          },
          double: {
            type: "boolean",
            description: "true für Doppelklick (Standard: false)",
          },
        },
        required: ["x", "y"],
      },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "drag_drop",
      description:
        "Zieht die Maus von einer Position zu einer anderen (Drag & Drop). " +
        "Nützlich zum Verschieben von Dateien, Fenstern oder Elementen. " +
        "Immer Bestätigung einholen.",
      parameters: {
        type: "object",
        properties: {
          from_x: { type: "number", description: "Start X-Koordinate" },
          from_y: { type: "number", description: "Start Y-Koordinate" },
          to_x: { type: "number", description: "Ziel X-Koordinate" },
          to_y: { type: "number", description: "Ziel Y-Koordinate" },
        },
        required: ["from_x", "from_y", "to_x", "to_y"],
      },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "run_command",
      description:
        "Führt einen lesenden PowerShell-Befehl aus. " +
        "Erlaubt: Get-*, Select-*, Where-*, Sort-*, Measure-*, Format-*, Test-Path, usw. " +
        "Gesperrt: alle schreibenden, netzwerk- oder ausführenden Operationen. " +
        "Immer Bestätigung einholen — zeige den genauen Befehl.",
      parameters: {
        type: "object",
        properties: {
          command: {
            type: "string",
            description:
              'PowerShell-Befehl, z.B. "Get-Process | Sort-Object CPU -Descending | Select-Object -First 10"',
          },
        },
        required: ["command"],
      },
    },
  });

  // ── v3.4.0 Komfort & Intelligenz ─────────────────────────────────────────────
  defs.push({
    type: "function",
    function: {
      name: "read_file_content",
      description:
        "Liest den Inhalt einer Datei und gibt ihn zurück. " +
        "Unterstützt: txt, log, md, csv, json, xml, ini, py, js, ts, docx und viele mehr. " +
        "Max. 15.000 Zeichen. Nutze dies wenn der Nutzer fragt was in einer Datei steht.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Vollständiger Dateipfad" },
        },
        required: ["path"],
      },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "rename_file",
      description: "Benennt eine Datei oder einen Ordner um.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Vollständiger Pfad zur Datei" },
          new_name: {
            type: "string",
            description: "Neuer Name (nur Dateiname, nicht vollständiger Pfad)",
          },
        },
        required: ["path", "new_name"],
      },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "copy_file",
      description:
        "Kopiert eine Datei oder einen Ordner an ein neues Ziel. Systempfade sind gesperrt.",
      parameters: {
        type: "object",
        properties: {
          source: { type: "string", description: "Quellpfad" },
          destination: { type: "string", description: "Zielpfad" },
        },
        required: ["source", "destination"],
      },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "create_folder",
      description: "Erstellt einen neuen Ordner (inkl. Unterordner).",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: 'Vollständiger Pfad, z.B. "E:\\\\Projekte\\\\Neu"',
          },
        },
        required: ["path"],
      },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "toggle_dark_mode",
      description:
        "Schaltet Windows zwischen Dark Mode und Light Mode um. Ändert Apps und System.",
      parameters: { type: "object", properties: {} },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "get_battery_status",
      description:
        "Gibt Akku-Status zurück: Ladestand, ob geladen wird, geschätzte Restlaufzeit.",
      parameters: { type: "object", properties: {} },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "get_temperatures",
      description:
        "Gibt CPU/System-Temperaturen zurück (ACPI Thermalzonen). " +
        "Nicht auf allen Systemen verfügbar — ELLA gibt 'nicht verfügbar' zurück falls nicht.",
      parameters: { type: "object", properties: {} },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "get_event_log",
      description:
        "Zeigt Windows Fehler und Warnungen aus System- und Anwendungsprotokoll.",
      parameters: {
        type: "object",
        properties: {
          hours: {
            type: "number",
            description: "Zeitraum in Stunden (Standard: 24)",
          },
          max_events: {
            type: "number",
            description: "Max. Einträge (Standard: 20)",
          },
        },
      },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "get_wifi_info",
      description:
        "Zeigt aktuelle WLAN-Verbindung: Netzwerkname (SSID), Signalstärke, Übertragungsrate.",
      parameters: { type: "object", properties: {} },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "control_media",
      description:
        "Steuert die aktuelle Medienwiedergabe (Spotify, YouTube, VLC, usw.) per Medientasten.",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            description:
              '"play", "pause", "toggle" (Play/Pause), "next", "prev", "stop"',
          },
        },
        required: ["action"],
      },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "get_now_playing",
      description:
        "Zeigt was gerade abgespielt wird: Titel, Künstler, Album und Status. " +
        "Nutzt die Windows Media Session API — funktioniert mit Spotify, Browser, VLC usw.",
      parameters: { type: "object", properties: {} },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "translate_text",
      description:
        "Übersetzt Text in eine beliebige Sprache. Läuft offline über Ollama oder optional über OpenAI.",
      parameters: {
        type: "object",
        properties: {
          text: { type: "string", description: "Zu übersetzender Text" },
          target_language: {
            type: "string",
            description:
              'Zielsprache, z.B. "Englisch", "Französisch", "Spanisch"',
          },
        },
        required: ["text", "target_language"],
      },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "summarize_text",
      description:
        "Fasst einen langen Text zusammen. Läuft offline über Ollama oder optional über OpenAI.",
      parameters: {
        type: "object",
        properties: {
          text: { type: "string", description: "Zu zusammenfassender Text" },
          style: {
            type: "string",
            description:
              '"kurz" (1–2 Sätze), "mittel" (Standard), "ausführlich" (1–2 Absätze)',
          },
        },
        required: ["text"],
      },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "click_element",
      description:
        "Klickt auf ein UI-Element auf dem Bildschirm anhand seines sichtbaren Textes (semantischer Klick). " +
        "ELLA macht einen Screenshot, liest alle Texte per OCR und klickt das passende Element. " +
        'Nutze dies statt click_at wenn der Nutzer sagt "klick auf Speichern" oder "drück OK".',
      parameters: {
        type: "object",
        properties: {
          label: {
            type: "string",
            description:
              'Sichtbarer Text des Elements, z.B. "Speichern", "OK", "Abbrechen"',
          },
        },
        required: ["label"],
      },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "watch_screen",
      description:
        "Beobachtet den Bildschirm für eine kurze Zeit via lokalem OCR und meldet Änderungen. " +
        "Vollständig offline — kein Cloud-Dienst. Maximal 30 Sekunden, opt-in durch den Nutzer.",
      parameters: {
        type: "object",
        properties: {
          duration: {
            type: "number",
            description: "Beobachtungsdauer in Sekunden (5–30, Standard: 10)",
          },
          interval: {
            type: "number",
            description:
              "Abstand zwischen Snapshots in Sekunden (3–15, Standard: 5)",
          },
        },
      },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "describe_screen",
      description:
        "Macht einen Screenshot und beschreibt was auf dem Bildschirm zu sehen ist. Ideal für Nutzer mit Sehbehinderung oder wenn gefragt wird was gerade auf dem Bildschirm ist. Nutzt GPT-4o Vision (online) oder LLaVA (offline).",
      parameters: {
        type: "object",
        properties: {
          question: {
            type: "string",
            description:
              "Optionale spezifische Frage zum Bildschirminhalt, z.B. 'Was steht in der Fehlermeldung?'",
          },
        },
      },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "describe_image",
      description:
        "Beschreibt den Inhalt einer Bilddatei. Unterstützt PNG, JPG, JPEG, GIF, WebP, BMP. Für Sehbehinderte oder zum Verstehen von Bildinhalten.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description:
              "Vollständiger Dateipfad zum Bild, z.B. C:\\\\Users\\\\Andre\\\\Bilder\\\\foto.jpg",
          },
          question: {
            type: "string",
            description: "Optionale spezifische Frage zum Bild",
          },
        },
        required: ["path"],
      },
    },
  });

  defs.push({
    type: "function",
    function: {
      name: "describe_webpage",
      description:
        "Beschreibt den visuellen Inhalt und Aufbau einer Webseite. Macht einen Screenshot des aktuellen Browsers. Optional mit URL für zusätzlichen Textkontext.",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "Optionale URL der Webseite für zusätzlichen Kontext",
          },
          question: {
            type: "string",
            description:
              "Optionale spezifische Frage zur Webseite, z.B. 'Wo ist der Anmelde-Button?'",
          },
        },
      },
    },
  });

  defs.push(
    {
      type: "function",
      function: {
        name: "open_chess_window",
        description:
          "Öffnet das Schachfenster damit ELLA und der Nutzer eine Partie Schach spielen können.",
        parameters: {
          type: "object",
          properties: {},
          required: [],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "list_monitors",
        description:
          "Listet alle angeschlossenen Monitore mit Index, Auflösung und Position auf.",
        parameters: {
          type: "object",
          properties: {},
          required: [],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "open_app_on_monitor",
        description:
          "Öffnet eine Anwendung auf einem bestimmten Monitor. Nutze list_monitors um die Monitor-Indizes zu kennen.",
        parameters: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description:
                'Name der Anwendung, z.B. "chrome", "notepad", "spotify"',
            },
            monitor: {
              type: "number",
              description:
                "Monitor-Index (1 = erster/primärer, 2 = zweiter usw.)",
            },
          },
          required: ["name", "monitor"],
        },
      },
    },
  );

  defs.push(
    {
      type: "function",
      function: {
        name: "index_documents",
        description:
          "Indiziert Dokumente in einem Ordner (TXT, MD, DOCX, PDF, XLSX) mit KI-Embeddings damit ELLA Fragen dazu beantworten kann. Nur neue oder geänderte Dateien werden verarbeitet.",
        parameters: {
          type: "object",
          properties: {
            folder: {
              type: "string",
              description:
                "Vollständiger Pfad zum Ordner der indiziert werden soll",
            },
          },
          required: ["folder"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "search_documents",
        description:
          "Durchsucht indizierte Dokumente semantisch. Nutze dies wenn der Nutzer nach Inhalt in eigenen Dateien fragt, z.B. 'Was stand in dem Vertrag?', 'Finde das Dokument über...'",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Suchanfrage oder Frage zum Dokumenteninhalt",
            },
          },
          required: ["query"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "reflect_on_experiences",
        description:
          "ELLA analysiert ihre eigenen Erinnerungen und leitet daraus allgemeine Prinzipien ab, die über den ursprünglichen Kontext hinaus gelten — z.B. von Schach-Taktiken zu allgemeinen Strategie-Prinzipien. Ergebnisse werden als neue Memories gespeichert.",
        parameters: {
          type: "object",
          properties: {},
        },
      },
    },
  );

  defs.push(
    {
      type: "function",
      function: {
        name: "list_printers",
        description:
          "Listet alle installierten Drucker mit Name, Status und ob sie als Standard gesetzt sind.",
        parameters: { type: "object", properties: {} },
      },
    },
    {
      type: "function",
      function: {
        name: "print_document",
        description:
          "Druckt eine Datei auf dem angegebenen oder Standard-Drucker. Unterstützt PDF, DOCX, TXT und Bilder.",
        parameters: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Vollständiger Dateipfad der zu druckenden Datei",
            },
            printer: {
              type: "string",
              description:
                "Druckername (optional — Standard-Drucker wird verwendet wenn nicht angegeben)",
            },
          },
          required: ["path"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "get_print_jobs",
        description:
          "Zeigt die aktuelle Druckwarteschlange — alle wartenden oder laufenden Druckjobs.",
        parameters: {
          type: "object",
          properties: {
            printer: {
              type: "string",
              description:
                "Druckername (optional — alle Drucker wenn nicht angegeben)",
            },
          },
        },
      },
    },
    {
      type: "function",
      function: {
        name: "cancel_print_job",
        description: "Bricht einen laufenden oder wartenden Druckjob ab.",
        parameters: {
          type: "object",
          properties: {
            printer: {
              type: "string",
              description: "Name des Druckers",
            },
            job_id: {
              type: "number",
              description: "Job-ID aus get_print_jobs",
            },
          },
          required: ["printer", "job_id"],
        },
      },
    },
  );

  return defs;
}
