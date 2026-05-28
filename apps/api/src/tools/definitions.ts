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

export function buildToolDefinitions(setups: Setup[]): OllamaTool[] {
  const defs = [
    ...TOOL_DEFINITIONS,
    ...MEMORY_TOOLS,
    HOMEWORK_TOOL,
    SYSTEM_INFO_TOOL,
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

  return defs;
}
