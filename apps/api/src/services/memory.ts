import { pool } from "../config/database.js";
import { env } from "../config/env.js";
import type { ToolResult } from "@ella/shared";

const EMBED_MODEL = "nomic-embed-text";
const RECALL_LIMIT = 5;
const MIN_SCORE = 0.3;
const LOAD_LIMIT = 500; // max memories loaded for cosine search

function cosine(a: number[], b: number[]): number {
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na === 0 || nb === 0 ? 0 : dot / (Math.sqrt(na) * Math.sqrt(nb));
}

async function embed(text: string): Promise<number[] | null> {
  try {
    const r = await fetch(`${env.ollamaBaseUrl}/api/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: EMBED_MODEL, input: text }),
    });
    if (!r.ok) return null;
    const data = (await r.json()) as { embeddings?: number[][] };
    return data.embeddings?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function remember(
  type: "user" | "system" | "note",
  content: string,
  source?: string,
): Promise<ToolResult> {
  const vec = await embed(content);
  if (!vec) {
    return {
      success: false,
      error:
        "Embedding-Modell nicht verfügbar. Bitte 'ollama pull nomic-embed-text' ausführen.",
    };
  }
  await pool.execute(
    "INSERT INTO memories (type, content, embedding, source) VALUES (?, ?, ?, ?)",
    [type, content, JSON.stringify(vec), source ?? null],
  );
  return { success: true, output: `Gespeichert (${type}): "${content}"` };
}

export async function recall(
  query: string,
  limit = RECALL_LIMIT,
): Promise<string[]> {
  const qVec = await embed(query);
  if (!qVec) return [];

  const [rows] = await pool.execute<any[]>(
    "SELECT content, embedding FROM memories ORDER BY created_at DESC LIMIT ?",
    [LOAD_LIMIT],
  );

  return rows
    .map((r) => {
      try {
        const vec = JSON.parse(r.embedding as string) as number[];
        return { content: r.content as string, score: cosine(qVec, vec) };
      } catch {
        return { content: r.content as string, score: 0 };
      }
    })
    .filter((m) => m.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((m) => m.content);
}

// Hintergrund-Extraktion: LLM extrahiert lernwürdige Fakten aus einem Gesprächsturn.
// Fire-and-forget — blockiert keine Antwort an den Nutzer.
export function extractAndRemember(
  userMsg: string,
  assistantMsg: string,
  sessionId: string,
): void {
  setImmediate(async () => {
    try {
      const prompt = `Analysiere diesen Gesprächsauszug und antworte mit genau einem lernwürdigen Fakt über den Nutzer oder sein System — oder mit "NICHTS" wenn kein relevanter Fakt vorliegt. Keine Erklärung, nur der Fakt oder "NICHTS".

Nutzer: ${userMsg}
Assistent: ${assistantMsg}`;

      const r = await fetch(`${env.ollamaBaseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama3.1:8b",
          prompt,
          stream: false,
          options: { temperature: 0.1, num_predict: 60 },
        }),
      });
      if (!r.ok) return;
      const data = (await r.json()) as { response?: string };
      const fact = data.response?.trim();
      if (!fact || fact.toUpperCase().startsWith("NICHTS")) return;

      await remember("user", fact, `session:${sessionId}`);
    } catch {
      // Fehler in Hintergrundextraktion sind nicht kritisch
    }
  });
}

// Wird nach open_app / load_setup aufgerufen um Nutzungsverhalten zu lernen
export function trackToolUsage(tool: string, detail: string): void {
  setImmediate(async () => {
    try {
      await remember(
        "system",
        `Nutzer hat ${detail} verwendet (${tool})`,
        `tool:${tool}`,
      );
    } catch {}
  });
}

export async function listMemories(
  type?: "user" | "system" | "note",
  limit = 20,
): Promise<
  { id: number; type: string; content: string; created_at: string }[]
> {
  const [rows] = type
    ? await pool.execute<any[]>(
        "SELECT id, type, content, created_at FROM memories WHERE type = ? ORDER BY created_at DESC LIMIT ?",
        [type, limit],
      )
    : await pool.execute<any[]>(
        "SELECT id, type, content, created_at FROM memories ORDER BY created_at DESC LIMIT ?",
        [limit],
      );
  return rows;
}

export async function forgetById(id: number): Promise<ToolResult> {
  await pool.execute("DELETE FROM memories WHERE id = ?", [id]);
  return { success: true, output: `Erinnerung ${id} gelöscht.` };
}
