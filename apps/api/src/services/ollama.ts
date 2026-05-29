import { env } from "../config/env.js";
import type { Message } from "@ella/shared";

export interface OllamaTool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<
        string,
        { type: string; description: string; items?: { type: string } }
      >;
      required?: string[];
    };
  };
}

export interface OllamaMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
  tool_calls?: Array<{
    id?: string;
    function: { name: string; arguments: Record<string, unknown> };
  }>;
}

export interface OllamaChatResponse {
  message: OllamaMessage;
  done: boolean;
}

const BASE_PROMPT = `Du bist E.L.L.A. (Embedded Local LLM Assistant) — ein intelligenter persönlicher Assistent, der vollständig lokal auf dem Rechner des Nutzers läuft. Keine Cloud, keine Weitergabe von Daten.

Du hast folgende Fähigkeiten:

SYSTEM & DATEIEN
- Programme öffnen (open_app)
- Festplattennutzung anzeigen (get_disk_usage)
- Temp-Dateien bereinigen (clean_temp)
- Papierkorb leeren (empty_recycle_bin)
- RAM freigeben (free_ram)
- Systeminfo abrufen (get_system_info)
- System-Status prüfen (get_system_status)

GEDÄCHTNIS
- Fakten merken (remember) — wenn der Nutzer "Merk dir" oder "Denk daran" sagt
- Erinnerungen löschen (forget)
- Erinnerungen auflisten (list_memories)

EINSTELLUNGEN & SETUP
- Setup anlegen und laden (create_setup, load_setup)
- Einstellungen ändern (update_setting)
- Regeln erstellen (create_rule)
- Hausaufgaben-Modus aktivieren (homework_mode)

E-MAIL & KALENDER
- E-Mails lesen und markieren (read_emails, mark_email)
- Kalender lesen (read_calendar)
- Termin erstellen (create_appointment)

NETZWERK & GERÄTE
- Netzwerk scannen (scan_network)
- Verbundene Geräte auflisten (list_devices)
- Aktive Verbindungen anzeigen (list_connections)

STANDORT & WEB
- Aktuellen Standort ermitteln (get_location)
- Im Web suchen (search_web)

VERHALTEN
- Antworte in der Sprache des Nutzers — wenn er Deutsch schreibt, antworte Deutsch; wenn er Englisch schreibt, antworte Englisch.
- Erkläre kurz was du tust wenn du ein Tool verwendest.
- Sei direkt und hilfreich — kein unnötiges Zögern.
- Wenn du etwas nicht weißt, nutze search_web.
- Wenn eine Aktion durch die E.L.L.A. Directive blockiert wird, erkläre ruhig und klar warum diese Aktion nicht möglich ist.`;

export function buildSystemPrompt(memories: string[] = []): string {
  if (memories.length === 0) return BASE_PROMPT;
  const ctx = memories.map((m) => `- ${m}`).join("\n");
  return `${BASE_PROMPT}\n\nRelevantes Gedächtnis (nutze dies als Kontext):\n${ctx}`;
}

export const ollamaClient = {
  chat: async (
    messages: OllamaMessage[],
    tools: OllamaTool[],
    model: string,
    memories: string[] = [],
  ): Promise<OllamaChatResponse> => {
    const response = await fetch(`${env.ollamaBaseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: buildSystemPrompt(memories) },
          ...messages,
        ],
        tools: tools.length > 0 ? tools : undefined,
        stream: false,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Ollama error ${response.status}: ${text}`);
    }

    return response.json() as Promise<OllamaChatResponse>;
  },

  listModels: async (): Promise<string[]> => {
    const response = await fetch(`${env.ollamaBaseUrl}/api/tags`);
    if (!response.ok) throw new Error("Ollama nicht erreichbar");
    const data = (await response.json()) as { models: Array<{ name: string }> };
    return data.models.map((m) => m.name);
  },

  async *chatStream(
    messages: OllamaMessage[],
    tools: OllamaTool[],
    model: string,
    memories: string[] = [],
  ): AsyncGenerator<
    | { type: "chunk"; text: string }
    | { type: "done"; toolCalls?: OllamaMessage["tool_calls"] }
  > {
    const response = await fetch(`${env.ollamaBaseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: buildSystemPrompt(memories) },
          ...messages,
        ],
        tools: tools.length > 0 ? tools : undefined,
        stream: true,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Ollama error ${response.status}: ${text}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          const chunk = JSON.parse(line) as OllamaChatResponse;
          if (chunk.done) {
            yield { type: "done", toolCalls: chunk.message.tool_calls };
          } else if (chunk.message?.content) {
            yield { type: "chunk", text: chunk.message.content };
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  },

  toOllamaMessages: (history: Message[]): OllamaMessage[] =>
    history.map((m) => ({
      role: m.role as OllamaMessage["role"],
      content: m.content,
    })),
};
