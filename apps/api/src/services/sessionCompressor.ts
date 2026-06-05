import { env } from "../config/env.js";
import { getSettings } from "./settings.js";

export interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
}

const COMPRESSION_PROMPT =
  "Fasse die folgende Konversation in maximal 5 Sätzen zusammen. " +
  "Behalte alle wichtigen Fakten, Entscheidungen und Kontextinformationen. " +
  "Antworte NUR mit der Zusammenfassung — keine Einleitung, kein Kommentar.";

export async function compressSession(
  messages: HistoryMessage[],
): Promise<HistoryMessage[]> {
  const { sessionCompressionEnabled, ollamaModel } = getSettings();
  if (!sessionCompressionEnabled || messages.length < 16) return messages;

  const toCompress = messages.slice(0, 10);
  const keep = messages.slice(10);

  const conversationText = toCompress
    .map((m) => `${m.role === "user" ? "Nutzer" : "ELLA"}: ${m.content}`)
    .join("\n");

  try {
    // Nur Ollama — niemals OpenAI (würde Gesprächsinhalte exfiltrieren)
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

    if (!response.ok) return messages;

    const data = (await response.json()) as {
      message?: { content?: string };
    };
    const summary = data.message?.content?.trim();
    if (!summary) return messages;

    const summaryMsg: HistoryMessage = {
      role: "assistant",
      content: `[Zusammenfassung früherer Konversation]: ${summary}`,
    };

    return [summaryMsg, ...keep];
  } catch {
    // Fallback: unkomprimiert zurückgeben
    return messages;
  }
}
