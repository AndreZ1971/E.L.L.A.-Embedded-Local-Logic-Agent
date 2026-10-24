import { getSettings, cloudAllowed, cloudFirst } from "./settings.js";
import { env } from "../config/env.js";
import { openaiRequest, CloudBlockedError } from "./openai.js";

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

  if (cloudFirst()) {
    try {
      const response = await openaiRequest(
        "/v1/chat/completions",
        {
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              { role: "system", content: CORRECTION_PROMPT },
              { role: "user", content: rawText },
            ],
            temperature: 0.1,
          }),
        },
        "text",
      );
      if (!response.ok)
        throw new Error(
          `OpenAI error ${response.status}: ${await response.text()}`,
        );
      const data = (await response.json()) as {
        choices: Array<{ message: { content: string | null } }>;
      };
      return data.choices[0]?.message?.content?.trim() ?? rawText;
    } catch (err) {
      if (!(err instanceof CloudBlockedError)) throw err;
    }
  }

  try {
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
    if (!response.ok) throw new Error(`Ollama error ${response.status}`);
    const data = (await response.json()) as { message: { content: string } };
    return data.message?.content?.trim() ?? rawText;
  } catch (err) {
    if (cloudAllowed()) {
      const response = await openaiRequest(
        "/v1/chat/completions",
        {
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              { role: "system", content: CORRECTION_PROMPT },
              { role: "user", content: rawText },
            ],
            temperature: 0.1,
          }),
        },
        "text",
      );
      if (!response.ok)
        throw new Error(
          `OpenAI error ${response.status}: ${await response.text()}`,
        );
      const data = (await response.json()) as {
        choices: Array<{ message: { content: string | null } }>;
      };
      return data.choices[0]?.message?.content?.trim() ?? rawText;
    }
    throw err;
  }
}
