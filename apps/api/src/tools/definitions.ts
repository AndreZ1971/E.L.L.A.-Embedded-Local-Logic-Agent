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
  const defs = [...TOOL_DEFINITIONS, ...MEMORY_TOOLS, HOMEWORK_TOOL];

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
