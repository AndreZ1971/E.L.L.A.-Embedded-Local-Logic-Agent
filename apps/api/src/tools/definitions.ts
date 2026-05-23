import type { OllamaTool } from '../services/ollama.js';

export const TOOL_DEFINITIONS: OllamaTool[] = [
  {
    type: 'function',
    function: {
      name: 'open_app',
      description: 'Öffnet eine Anwendung oder ein Programm auf dem Computer des Nutzers.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name der Anwendung, z.B. "notepad", "chrome", "explorer"' },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_disk_usage',
      description: 'Gibt die Festplattennutzung eines Laufwerks zurück.',
      parameters: {
        type: 'object',
        properties: {
          drive: { type: 'string', description: 'Laufwerksbuchstabe, z.B. "C" (optional, Standard: C)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'clean_temp',
      description: 'Bereinigt temporäre Dateien auf dem System um Speicherplatz freizugeben.',
      parameters: {
        type: 'object',
        properties: {
          scope: { type: 'string', description: '"user" für nur Nutzer-Temp, "system" für System-Temp (Standard: user)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'empty_recycle_bin',
      description: 'Leert den Windows-Papierkorb.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
];
