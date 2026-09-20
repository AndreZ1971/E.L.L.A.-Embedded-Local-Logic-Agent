import { pool } from "../config/database.js";
import { env } from "../config/env.js";
import { getSettings } from "./settings.js";
import { remember, recall, cosine } from "./memory.js";

const REFLECTION_SOURCE = "reflection";
const MIN_MEMORIES_REQUIRED = 8;
const MIN_SCORE_DEDUP = 0.88;

async function embed(text: string): Promise<number[] | null> {
  try {
    const r = await fetch(`${env.ollamaBaseUrl}/api/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "nomic-embed-text", input: text }),
    });
    if (!r.ok) return null;
    const data = (await r.json()) as { embeddings?: number[][] };
    return data.embeddings?.[0] ?? null;
  } catch {
    return null;
  }
}

async function isDuplicate(text: string): Promise<boolean> {
  const vec = await embed(text);
  if (!vec) return false;
  const [rows] = await pool.execute<any[]>(
    "SELECT embedding FROM memories WHERE source = ? LIMIT 100",
    [REFLECTION_SOURCE],
  );
  for (const r of rows) {
    try {
      const existing = JSON.parse(r.embedding as string) as number[];
      if (cosine(vec, existing) >= MIN_SCORE_DEDUP) return true;
    } catch {
      /* ignore */
    }
  }
  return false;
}

export async function runReflection(): Promise<{
  derived: number;
  skipped: number;
}> {
  const settings = getSettings();

  // Neueste Memories laden (user + system, keine reflection-Quellen um Loops zu vermeiden)
  const [rows] = await pool.execute<any[]>(
    `SELECT content FROM memories
     WHERE (source IS NULL OR source != ?)
     ORDER BY created_at DESC
     LIMIT 40`,
    [REFLECTION_SOURCE],
  );

  if (rows.length < MIN_MEMORIES_REQUIRED) {
    return { derived: 0, skipped: 0 };
  }

  const memoryBlock = rows
    .map((r, i) => `${i + 1}. ${r.content as string}`)
    .join("\n");

  const prompt = `Du bist ELLA und analysierst deine eigenen Erfahrungen und Erinnerungen.

Hier sind deine neuesten Erinnerungen:
${memoryBlock}

Leite daraus bis zu 3 allgemeine Prinzipien oder Erkenntnisse ab, die:
- Über den ursprünglichen Kontext hinaus anwendbar sind (z.B. eine Schach-Erkenntnis kann ein allgemeines Strategie-Prinzip werden)
- Als konkrete Handlungsregel oder Einsicht formuliert sind
- Kurz und prägnant sind (ein Satz pro Erkenntnis)
- Wirklich neu sind und nicht bloß wiederholen was schon bekannt ist

Antworte NUR mit den Erkenntnissen, getrennt durch "|".
Wenn keine sinnvolle neue Erkenntnis ableitbar ist, antworte mit "NICHTS".
Keine Erklärungen, keine Nummerierung, nur die Erkenntnisse.`;

  try {
    const r = await fetch(`${env.ollamaBaseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: settings.ollamaModel,
        prompt,
        stream: false,
        options: { temperature: 0.4, num_predict: 200 },
      }),
    });
    if (!r.ok) return { derived: 0, skipped: 0 };

    const data = (await r.json()) as { response?: string };
    const raw = data.response?.trim() ?? "";
    if (!raw || raw.toUpperCase().startsWith("NICHTS")) {
      return { derived: 0, skipped: 0 };
    }

    const principles = raw
      .split("|")
      .map((s) => s.trim())
      .filter((s) => s.length > 10 && s.length < 300);

    let derived = 0;
    let skipped = 0;

    for (const principle of principles) {
      if (await isDuplicate(principle)) {
        skipped++;
        continue;
      }
      await remember("system", principle, REFLECTION_SOURCE);
      derived++;
    }

    return { derived, skipped };
  } catch {
    return { derived: 0, skipped: 0 };
  }
}
