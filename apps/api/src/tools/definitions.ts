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
  const defs = [...TOOL_DEFINITIONS, HOMEWORK_TOOL];

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
