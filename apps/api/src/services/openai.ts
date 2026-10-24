import { cloudAllowed, getActiveApiKey } from "./settings.js";
import { pool } from "../config/database.js";
import { eventBus, EVENT_SYSTEM } from "./eventBus.js";
import { buildSystemPrompt, type LearningExample } from "./ollama.js";
import type { OllamaMessage, OllamaTool } from "./ollama.js";

export type CloudPurpose =
  | "chat"
  | "vision"
  | "transcription"
  | "text"
  | "style"
  | "web_search"
  | "pipeline"
  | "chess";

export class CloudBlockedError extends Error {
  constructor(public purpose: CloudPurpose) {
    super(`Cloud blockiert (Modus: lokal) — ${purpose}`);
  }
}

export async function openaiRequest(
  endpoint: string,
  init: { body: BodyInit; json?: boolean },
  purpose: CloudPurpose,
): Promise<Response> {
  if (!cloudAllowed()) throw new CloudBlockedError(purpose);

  const headers: Record<string, string> = {
    Authorization: `Bearer ${getActiveApiKey()}`,
  };
  if (init.json !== false) headers["Content-Type"] = "application/json";

  pool
    .execute(
      `INSERT INTO system_events (type, payload) VALUES ('cloud_request', ?)`,
      [JSON.stringify({ purpose, endpoint })],
    )
    .catch(() => {});
  eventBus.emit(EVENT_SYSTEM, {
    type: "cloud_request",
    payload: { purpose },
    created_at: new Date().toISOString(),
  });

  return fetch(`https://api.openai.com${endpoint}`, {
    method: "POST",
    headers,
    body: init.body,
  });
}

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

function buildOpenAIMessages(
  messages: OllamaMessage[],
  memories: string[] = [],
  userName = "",
  temporalContext = "",
  learningExamples: LearningExample[] = [],
): OpenAIMessage[] {
  return [
    {
      role: "system",
      content: buildSystemPrompt(
        memories,
        userName,
        temporalContext,
        learningExamples,
      ),
    },
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

interface ResponsesOutput {
  output: Array<{
    type: string;
    content?: Array<{ type: string; text: string }>;
  }>;
}

export const openaiClient = {
  isAvailable: (): boolean => cloudAllowed(),

  searchWeb: async (query: string): Promise<string> => {
    const response = await openaiRequest(
      "/v1/responses",
      {
        body: JSON.stringify({
          model: "gpt-4o",
          tools: [{ type: "web_search_preview" }],
          input: query,
        }),
      },
      "web_search",
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenAI Responses error ${response.status}: ${text}`);
    }

    const data = (await response.json()) as ResponsesOutput;
    const text = data.output
      .filter((o) => o.type === "message")
      .flatMap((o) => o.content ?? [])
      .filter((c) => c.type === "output_text")
      .map((c) => c.text)
      .join("");

    return text || "Keine Suchergebnisse gefunden.";
  },

  chat: async (
    messages: OllamaMessage[],
    tools: OllamaTool[],
    memories: string[] = [],
    userName = "",
    temporalContext = "",
    learningExamples: LearningExample[] = [],
  ): Promise<{ message: OllamaMessage; done: boolean }> => {
    const response = await openaiRequest(
      "/v1/chat/completions",
      {
        body: JSON.stringify({
          model: "gpt-4o",
          messages: buildOpenAIMessages(
            messages,
            memories,
            userName,
            temporalContext,
            learningExamples,
          ),
          ...(tools.length > 0 && {
            tools: tools.map((t) => ({
              type: "function",
              function: t.function,
            })),
          }),
        }),
      },
      "chat",
    );

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
    memories: string[] = [],
    userName = "",
    temporalContext = "",
    learningExamples: LearningExample[] = [],
  ): AsyncGenerator<
    | { type: "chunk"; text: string }
    | { type: "done"; toolCalls?: OllamaMessage["tool_calls"] }
  > {
    const response = await openaiRequest(
      "/v1/chat/completions",
      {
        body: JSON.stringify({
          model: "gpt-4o",
          stream: true,
          messages: buildOpenAIMessages(
            messages,
            memories,
            userName,
            temporalContext,
            learningExamples,
          ),
          ...(tools.length > 0 && {
            tools: tools.map((t) => ({
              type: "function",
              function: t.function,
            })),
          }),
        }),
      },
      "chat",
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenAI error ${response.status}: ${text}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

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
