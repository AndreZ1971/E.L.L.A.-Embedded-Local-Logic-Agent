import { env } from '../config/env.js';
import type { OllamaMessage, OllamaTool } from './ollama.js';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }>;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      role: string;
      content: string | null;
      tool_calls?: Array<{
        id: string;
        function: { name: string; arguments: string };
      }>;
    };
  }>;
}

const SYSTEM_PROMPT = `Du bist E.L.L.A. (Embedded Local Logic Assistant), ein intelligenter persönlicher Assistent der lokal auf dem Rechner des Nutzers läuft.
Du kannst Programme öffnen, Systeminformationen abrufen, temporäre Dateien bereinigen und den Papierkorb leeren.
Antworte immer auf Deutsch, es sei denn, der Nutzer spricht eine andere Sprache.
Wenn du ein Tool benutzt, erkläre kurz was du tust.`;

export const openaiClient = {
  isAvailable: (): boolean => Boolean(env.openaiApiKey),

  chat: async (
    messages: OllamaMessage[],
    tools: OllamaTool[],
  ): Promise<{ message: OllamaMessage; done: boolean }> => {
    const body = {
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.map((m): OpenAIMessage => {
          const msg: OpenAIMessage = { role: m.role, content: m.content || null };
          if (m.tool_call_id) msg.tool_call_id = m.tool_call_id;
          if (m.tool_calls?.length) {
            msg.tool_calls = m.tool_calls.map(tc => ({
              id: tc.id ?? 'call_unknown',
              type: 'function',
              function: {
                name: tc.function.name,
                arguments: JSON.stringify(tc.function.arguments),
              },
            }));
          }
          return msg;
        }),
      ],
      tools: tools.map(t => ({ type: 'function', function: t.function })),
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.openaiApiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenAI error ${response.status}: ${text}`);
    }

    const data = await response.json() as OpenAIResponse;
    const choice = data.choices[0].message;

    const toolCalls = choice.tool_calls?.map(tc => ({
      id: tc.id,
      function: {
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments) as Record<string, unknown>,
      },
    }));

    return {
      message: {
        role: 'assistant',
        content: choice.content ?? '',
        tool_calls: toolCalls,
      },
      done: true,
    };
  },
};
