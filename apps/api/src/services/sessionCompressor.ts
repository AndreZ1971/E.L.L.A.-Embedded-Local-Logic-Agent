import { env } from "../config/env.js";
import { getSettings } from "./settings.js";

export interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
}

const MSG_CONTENT_MAX = 2000;

/**
 * Stufe 1: Regelbasierte Vorkompression — KEIN LLM-Call.
 * - Kürzt überlange Nachrichten-Inhalte (Tool-Outputs die in der History gelandet sind)
 * - Kollabiert aufeinanderfolgende identische Nachrichten
 * - Entfernt leere Nachrichten
 */
export function precompress(messages: HistoryMessage[]): HistoryMessage[] {
  const result: HistoryMessage[] = [];

  for (const msg of messages) {
    if (!msg.content.trim()) continue;

    if (
      result.length > 0 &&
      result[result.length - 1].role === msg.role &&
      result[result.length - 1].content === msg.content
    ) {
      continue;
    }

    if (msg.content.length > MSG_CONTENT_MAX) {
      result.push({
        role: msg.role,
        content:
          msg.content.slice(0, MSG_CONTENT_MAX) +
          `\n… [${msg.content.length - MSG_CONTENT_MAX} Zeichen gekürzt]`,
      });
    } else {
      result.push(msg);
    }
  }

  return result;
}

const COMPRESSION_PROMPT =
  "Fasse die folgende Konversation in maximal 5 Sätzen zusammen. " +
  "Behalte alle wichtigen Fakten, Entscheidungen und Kontextinformationen. " +
  "Antworte NUR mit der Zusammenfassung — keine Einleitung, kein Kommentar.";

/**
 * Stufe 2: LLM-basierte Kompression (Ollama-only).
 * Stufe 1 (precompress) läuft immer zuerst.
 */
export async function compressSession(
  messages: HistoryMessage[],
): Promise<HistoryMessage[]> {
  const { sessionCompressionEnabled, ollamaModel } = getSettings();

  const precompressed = precompress(messages);

  if (!sessionCompressionEnabled || precompressed.length < 16)
    return precompressed;

  const toCompress = precompressed.slice(0, 10);
  const keep = precompressed.slice(10);

  const conversationText = toCompress
    .map((m) => `${m.role === "user" ? "Nutzer" : "ELLA"}: ${m.content}`)
    .join("\n");

  try {
    const response = await fetch(`${env.ollamaBaseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: ollamaModel,
        messages: [
          { role: "system", content: COMPRESSION_PROMPT },
          { role: "user", content: conversationText },
        ],
        stream: false,
        options: { num_predict: 300 },
      }),
    });

    if (!response.ok) return precompressed;

    const data = (await response.json()) as {
      message?: { content?: string };
    };
    const summary = data.message?.content?.trim();
    if (!summary) return precompressed;

    const summaryMsg: HistoryMessage = {
      role: "assistant",
      content: `[Zusammenfassung früherer Konversation]: ${summary}`,
    };

    return [summaryMsg, ...keep];
  } catch {
    return precompressed;
  }
}
