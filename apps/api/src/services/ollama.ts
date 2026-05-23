import { env } from '../config/env.js';
import type { Message } from '@ella/shared';

export interface OllamaTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, { type: string; description: string }>;
      required?: string[];
    };
  };
}

export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: Array<{
    function: { name: string; arguments: Record<string, unknown> };
  }>;
}

export interface OllamaChatResponse {
  message: OllamaMessage;
  done: boolean;
}

const SYSTEM_PROMPT = `Du bist E.L.L.A. (Embedded Local LLM Assistant), ein intelligenter persönlicher Assistent der lokal auf dem Rechner des Nutzers läuft.
Du kannst Programme öffnen, Systeminformationen abrufen, temporäre Dateien bereinigen und den Papierkorb leeren.
Antworte immer auf Deutsch, es sei denn, der Nutzer spricht eine andere Sprache.
Wenn du ein Tool benutzt, erkläre kurz was du tust.`;

export const ollamaClient = {
  chat: async (
    messages: OllamaMessage[],
    tools: OllamaTool[],
    model: string,
  ): Promise<OllamaChatResponse> => {
    const response = await fetch(`${env.ollamaBaseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
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
    if (!response.ok) throw new Error('Ollama nicht erreichbar');
    const data = await response.json() as { models: Array<{ name: string }> };
    return data.models.map(m => m.name);
  },

  toOllamaMessages: (history: Message[]): OllamaMessage[] =>
    history.map(m => ({ role: m.role as OllamaMessage['role'], content: m.content })),
};
