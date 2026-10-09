import { pool } from "../config/database.js";
import { getSettings } from "./settings.js";
import { env } from "../config/env.js";

async function openAIChat(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  temperature = 0.1,
  maxTokens = 500,
): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
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

  const { openaiApiKey } = getSettings();
  const apiKey = openaiApiKey || env.openaiApiKey;
  if (!apiKey) return "";

  return openAIChat(
    apiKey,
    "",
    `Analysiere den Schreibstil dieser E-Mails und beschreibe ihn in 3-5 Sätzen. ` +
      `Fokus: Anrede, Tonalität, typische Formulierungen, Abschluss.\n\n${samples}`,
    0.1,
    300,
  );
}

export async function writeInUserStyle(
  task: string,
  styleProfile: string,
): Promise<string> {
  const { openaiApiKey, ollamaModel, provider } = getSettings();
  const apiKey = openaiApiKey || env.openaiApiKey;

  const systemPrompt = styleProfile
    ? `Du schreibst im Stil des Nutzers. Stilprofil: ${styleProfile}`
    : `Du schreibst professionelle, klare deutsche Texte.`;

  if ((provider === "auto" && apiKey) || provider === "openai") {
    return openAIChat(apiKey, systemPrompt, task, 0.7, 1000);
  }

  // Ollama Fallback
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
}
