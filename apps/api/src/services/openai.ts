import { env } from "../config/env.js";
import { getActiveApiKey } from "./settings.js";
import type { OllamaMessage, OllamaTool } from "./ollama.js";

interface OpenAIMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: "function";
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

function buildOpenAIMessages(messages: OllamaMessage[]): OpenAIMessage[] {
  return [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages.map((m): OpenAIMessage => {
      const msg: OpenAIMessage = { role: m.role, content: m.content || null };
      if (m.tool_call_id) msg.tool_call_id = m.tool_call_id;
      if (m.tool_calls?.length) {
        msg.tool_calls = m.tool_calls.map((tc) => ({
          id: tc.id ?? "call_unknown",
          type: "function",
          function: {
            name: tc.function.name,
            arguments: JSON.stringify(tc.function.arguments),
          },
        }));
      }
      return msg;
    }),
  ];
}

export const openaiClient = {
  isAvailable: (): boolean => Boolean(getActiveApiKey(env.openaiApiKey)),

  chat: async (
    messages: OllamaMessage[],
    tools: OllamaTool[],
  ): Promise<{ message: OllamaMessage; done: boolean }> => {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getActiveApiKey(env.openaiApiKey)}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: buildOpenAIMessages(messages),
        tools: tools.map((t) => ({ type: "function", function: t.function })),
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenAI error ${response.status}: ${text}`);
    }

    const data = (await response.json()) as OpenAIResponse;
    const choice = data.choices[0].message;

    const toolCalls = choice.tool_calls?.map((tc) => ({
      id: tc.id,
      function: {
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments) as Record<string, unknown>,
      },
    }));

    return {
      message: {
        role: "assistant",
        content: choice.content ?? "",
        tool_calls: toolCalls,
      },
      done: true,
    };
  },

  async *chatStream(
    messages: OllamaMessage[],
    tools: OllamaTool[],
  ): AsyncGenerator<
    | { type: "chunk"; text: string }
    | { type: "done"; toolCalls?: OllamaMessage["tool_calls"] }
  > {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getActiveApiKey(env.openaiApiKey)}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        stream: true,
        messages: buildOpenAIMessages(messages),
        tools: tools.map((t) => ({ type: "function", function: t.function })),
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenAI error ${response.status}: ${text}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    // Accumulate tool_calls across chunks (OpenAI splits them by index)
    const acc = new Map<number, { id: string; name: string; args: string }>();

    try {
      mainLoop: while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") {
            const toolCalls =
              acc.size > 0
                ? Array.from(acc.values()).map((tc) => ({
                    id: tc.id,
                    function: {
                      name: tc.name,
                      arguments: JSON.parse(tc.args) as Record<string, unknown>,
                    },
                  }))
                : undefined;
            yield { type: "done", toolCalls };
            break mainLoop;
          }

          const chunk = JSON.parse(raw) as {
            choices: Array<{
              delta: {
                content?: string | null;
                tool_calls?: Array<{
                  index: number;
                  id?: string;
                  function?: { name?: string; arguments?: string };
                }>;
              };
            }>;
          };

          const delta = chunk.choices[0]?.delta;
          if (!delta) continue;

          if (delta.content) {
            yield { type: "chunk", text: delta.content };
          }

          if (delta.tool_calls) {
            for (const tc of delta.tool_calls) {
              if (!acc.has(tc.index)) {
                acc.set(tc.index, { id: "", name: "", args: "" });
              }
              const entry = acc.get(tc.index)!;
              if (tc.id) entry.id = tc.id;
              if (tc.function?.name) entry.name += tc.function.name;
              if (tc.function?.arguments) entry.args += tc.function.arguments;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  },
};
