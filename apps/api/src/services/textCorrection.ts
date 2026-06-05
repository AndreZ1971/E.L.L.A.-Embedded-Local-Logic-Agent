import { getSettings } from "./settings.js";
import { env } from "../config/env.js";

const CORRECTION_PROMPT = `Du bist ein Lektor. Korrigiere den folgenden diktierten Text:
- Rechtschreibung und Grammatik
- Groß- und Kleinschreibung (deutsche Regeln)
- Satzzeichen und Absätze
- Umlaute (ue→ü, oe→ö, ae→ä, ss→ß wo korrekt)
- Zahlen ausgeschrieben oder als Ziffer je nach Kontext
- Stilistische Verbesserungen die den Sinn des Autors erhalten

Gib NUR den korrigierten Text zurück. Keine Erklärungen. Keine Kommentare.`;

export async function correctText(rawText: string): Promise<string> {
  const settings = getSettings();
  const apiKey = settings.openaiApiKey || env.openaiApiKey;

  const useOpenAI =
    (settings.provider === "auto" && Boolean(apiKey)) ||
    settings.provider === "openai";

  if (useOpenAI) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: CORRECTION_PROMPT },
          { role: "user", content: rawText },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `OpenAI error ${response.status}: ${await response.text()}`,
      );
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string | null } }>;
    };
    return data.choices[0]?.message?.content?.trim() ?? rawText;
  }

  // Ollama Fallback
  const response = await fetch(`${env.ollamaBaseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: settings.ollamaModel,
      messages: [
        { role: "system", content: CORRECTION_PROMPT },
        { role: "user", content: rawText },
      ],
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error ${response.status}`);
  }

  const data = (await response.json()) as {
    message: { content: string };
  };
  return data.message?.content?.trim() ?? rawText;
}
