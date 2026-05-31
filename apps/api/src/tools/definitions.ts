import type { OllamaTool } from "../services/ollama.js";
import type { Setup } from "../services/settings.js";

export const TOOL_DEFINITIONS: OllamaTool[] = [
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
        "Legt ein neues App-Setup an. Nutze dies wenn der Nutzer sagt er möchte ein Setup erstellen oder eine Gruppe von Apps gemeinsam starten können.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: 'Name des Setups, z.B. "Arbeit" oder "Gaming"',
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
      "Aktiviert oder deaktiviert den gesicherten Hausaufgaben-Modus. Aktivieren braucht keine PIN. Deaktivieren erfordert die PIN.",
    parameters: {
      type: "object",
      properties: {
        action: {
          type: "string",
          description:
            'Aktion: "activate" zum Einschalten (kein PIN nötig) oder "deactivate" zum Ausschalten (PIN erforderlich)',
        },
        pin: {
          type: "string",
          description:
            "PIN — nur bei action=deactivate erforderlich, sonst weglassen",
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
    ...CONVERSATION_TOOLS,
    ...MAIL_TOOLS,
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

  return defs;
}
