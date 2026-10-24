import { getSettings, cloudAllowed, cloudFirst } from "./settings.js";
import { env } from "../config/env.js";
import { openaiRequest, CloudBlockedError } from "./openai.js";

async function callLLM(
  systemPrompt: string,
  userInput: string,
): Promise<string> {
  const settings = getSettings();

  if (cloudFirst()) {
    try {
      const response = await openaiRequest(
        "/v1/chat/completions",
        {
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userInput },
            ],
            temperature: 0.3,
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
      return data.choices[0]?.message?.content?.trim() ?? userInput;
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
          { role: "system", content: systemPrompt },
          { role: "user", content: userInput },
        ],
        stream: false,
      }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!response.ok) throw new Error(`Ollama error ${response.status}`);
    const data = (await response.json()) as { message: { content: string } };
    return data.message?.content?.trim() ?? userInput;
  } catch (err) {
    if (cloudAllowed()) {
      const response = await openaiRequest(
        "/v1/chat/completions",
        {
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userInput },
            ],
            temperature: 0.3,
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
      return data.choices[0]?.message?.content?.trim() ?? userInput;
    }
    throw err;
  }
}

export async function translateText(
  text: string,
  targetLanguage: string,
): Promise<string> {
  const prompt = `Du bist ein professioneller Übersetzer. Übersetze den folgenden Text ins ${targetLanguage}. Gib NUR die Übersetzung zurück, keine Erklärungen.`;
  return callLLM(prompt, text);
}

export async function summarizeText(
  text: string,
  style: "kurz" | "mittel" | "ausführlich" = "mittel",
): Promise<string> {
  const lengths: Record<string, string> = {
    kurz: "1–2 Sätze",
    mittel: "3–5 Sätze",
    ausführlich: "1–2 Absätze",
  };
  const prompt = `Du bist ein Assistent für Zusammenfassungen. Fasse den folgenden Text in ${lengths[style] ?? "3–5 Sätzen"} zusammen. Gib NUR die Zusammenfassung zurück, ohne Einleitung oder Erklärungen.`;
  return callLLM(prompt, text);
}
