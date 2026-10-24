import { pool } from "../config/database.js";
import { getSettings, cloudAllowed, cloudFirst } from "./settings.js";
import { env } from "../config/env.js";
import { openaiRequest, CloudBlockedError } from "./openai.js";

async function openAIChat(
  systemPrompt: string,
  userPrompt: string,
  temperature = 0.1,
  maxTokens = 500,
): Promise<string> {
  const response = await openaiRequest(
    "/v1/chat/completions",
    {
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature,
        max_tokens: maxTokens,
      }),
    },
    "style",
  );

  if (!response.ok) {
    throw new Error(
      `OpenAI error ${response.status}: ${await response.text()}`,
    );
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string | null } }>;
  };
  return data.choices[0]?.message?.content?.trim() ?? "";
}

export async function buildStyleProfile(): Promise<string> {
  const [rows] = await pool.execute<any[]>(`
    SELECT args FROM tool_executions
    WHERE tool_name = 'compose_email' AND success = 1
    ORDER BY executed_at DESC LIMIT 20
  `);

  if (rows.length < 5) return "";

  const samples = rows
    .map((r) => {
      try {
        const parsed = JSON.parse(r.args as string) as Record<string, unknown>;
        return parsed["body"] as string | undefined;
      } catch {
        return undefined;
      }
    })
    .filter((s): s is string => Boolean(s))
    .slice(0, 10)
    .join("\n---\n");

  if (!samples) return "";

  const stylePrompt =
    `Analysiere den Schreibstil dieser E-Mails und beschreibe ihn in 3-5 Sätzen. ` +
    `Fokus: Anrede, Tonalität, typische Formulierungen, Abschluss.\n\n${samples}`;

  if (cloudFirst()) {
    return openAIChat("", stylePrompt, 0.1, 300);
  }

  try {
    const settings = getSettings();
    const resp = await fetch(`${env.ollamaBaseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: settings.ollamaModel ?? "llama3.1:8b",
        messages: [{ role: "user", content: stylePrompt }],
        stream: false,
      }),
    });
    if (resp.ok) {
      const data = (await resp.json()) as { message?: { content?: string } };
      return data.message?.content?.trim() ?? "";
    }
    throw new Error(`Ollama error ${resp.status}`);
  } catch (err) {
    if (cloudAllowed()) {
      try {
        return await openAIChat("", stylePrompt, 0.1, 300);
      } catch {
        // OpenAI-Fallback auch fehlgeschlagen
      }
    }
    return "";
  }
}

export async function writeInUserStyle(
  task: string,
  styleProfile: string,
): Promise<string> {
  const { ollamaModel, provider } = getSettings();

  const systemPrompt = styleProfile
    ? `Du schreibst im Stil des Nutzers. Stilprofil: ${styleProfile}`
    : `Du schreibst professionelle, klare deutsche Texte.`;

  if (cloudFirst()) {
    try {
      return await openAIChat(systemPrompt, task, 0.7, 1000);
    } catch (err) {
      if (!(err instanceof CloudBlockedError)) throw err;
    }
  }

  try {
    const response = await fetch(`${env.ollamaBaseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: ollamaModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: task },
        ],
        stream: false,
      }),
    });
    if (!response.ok) throw new Error(`Ollama error ${response.status}`);
    const data = (await response.json()) as { message: { content: string } };
    return data.message?.content?.trim() ?? "";
  } catch (err) {
    if (cloudAllowed()) {
      return await openAIChat(systemPrompt, task, 0.7, 1000);
    }
    throw err;
  }
}
