import { pool } from "../config/database.js";
import { env } from "../config/env.js";
import { getSettings } from "./settings.js";
import { redact } from "./redact.js";
import type { ToolResult } from "@ella/shared";

const EMBED_MODEL = "nomic-embed-text";
const RECALL_LIMIT = 5;
const MIN_SCORE = 0.3;
const LOAD_LIMIT = 500; // max memories loaded for cosine search

export function cosine(a: number[], b: number[]): number {
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

const DEDUP_THRESHOLD = 0.85;
const DEDUP_CHECK_LIMIT = 200;

export async function remember(
  type: "user" | "system" | "note",
  content: string,
  source?: string,
): Promise<ToolResult> {
  content = redact(content);
  const vec = await embed(content);
  if (!vec) {
    return {
      success: false,
      error:
        "Embedding-Modell nicht verfügbar. Bitte 'ollama pull nomic-embed-text' ausführen.",
    };
  }

  const [existing] = await pool.execute<any[]>(
    "SELECT id, content, embedding FROM memories WHERE type = ? ORDER BY created_at DESC LIMIT ?",
    [type, DEDUP_CHECK_LIMIT],
  );
  for (const row of existing) {
    try {
      const existingVec = JSON.parse(row.embedding as string) as number[];
      if (cosine(vec, existingVec) >= DEDUP_THRESHOLD) {
        return {
          success: true,
          output: `Ähnliche Erinnerung existiert bereits (ID ${row.id}), übersprungen.`,
        };
      }
    } catch {
      continue;
    }
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

  const cosineResults = rows
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

  const graphResults = await recallByGraph(query, cosineResults);

  const seen = new Set(cosineResults);
  const merged = [...cosineResults];
  for (const g of graphResults) {
    if (!seen.has(g)) {
      merged.push(g);
      seen.add(g);
    }
  }
  return merged.slice(0, limit + 3);
}

async function recallByGraph(
  query: string,
  cosineHits: string[],
): Promise<string[]> {
  const queryLower = query.toLowerCase();
  const words = queryLower.split(/[\s,.!?;:]+/).filter((w) => w.length >= 3);
  if (words.length === 0) return [];

  try {
    const conditions = words.map(() => "(subject LIKE ? OR object LIKE ?)");
    const params = words.flatMap((w) => [`%${w}%`, `%${w}%`]);

    const [tripleRows] = await pool.execute<any[]>(
      `SELECT DISTINCT subject, predicate, object FROM knowledge_triples
       WHERE ${conditions.join(" OR ")}
       ORDER BY created_at DESC LIMIT 20`,
      params,
    );
    if (!tripleRows.length) return [];

    const relatedEntities = new Set<string>();
    for (const t of tripleRows) {
      relatedEntities.add(t.subject as string);
      relatedEntities.add(t.object as string);
    }

    const entityConditions = Array.from(relatedEntities)
      .slice(0, 10)
      .map(() => "(subject = ? OR object = ?)");
    const entityParams = Array.from(relatedEntities)
      .slice(0, 10)
      .flatMap((e) => [e, e]);

    const [expandedRows] = await pool.execute<any[]>(
      `SELECT DISTINCT subject, predicate, object FROM knowledge_triples
       WHERE ${entityConditions.join(" OR ")}
       ORDER BY confidence DESC, created_at DESC LIMIT 30`,
      entityParams,
    );

    const tripleStrings = expandedRows.map(
      (t) => `${t.subject} → ${t.predicate} → ${t.object}`,
    );

    const cosineSet = new Set(cosineHits.map((h) => h.toLowerCase()));
    return tripleStrings.filter((ts) => !cosineSet.has(ts.toLowerCase()));
  } catch {
    return [];
  }
}

async function saveTriples(
  triples: { subject: string; predicate: string; object: string }[],
  memoryId: number | null,
  profileId: number | null,
): Promise<void> {
  for (const t of triples) {
    await pool.execute(
      `INSERT INTO knowledge_triples (subject, predicate, object, memory_id, profile_id)
       VALUES (?, ?, ?, ?, ?)`,
      [
        t.subject.toLowerCase(),
        t.predicate.toLowerCase(),
        t.object.toLowerCase(),
        memoryId,
        profileId,
      ],
    );
  }
}

function parseTriples(
  text: string,
): { subject: string; predicate: string; object: string }[] {
  const results: { subject: string; predicate: string; object: string }[] = [];
  const tripleLine = text
    .split("\n")
    .find((l) => l.toUpperCase().startsWith("TRIPEL:"));
  if (!tripleLine) return results;

  const raw = tripleLine.replace(/^TRIPEL:\s*/i, "").trim();
  if (raw.toUpperCase() === "KEINE") return results;

  for (const part of raw.split(";")) {
    const segments = part.split("|").map((s) => s.trim());
    if (segments.length === 3 && segments[0] && segments[1] && segments[2]) {
      results.push({
        subject: segments[0].slice(0, 255),
        predicate: segments[1].slice(0, 100),
        object: segments[2].slice(0, 255),
      });
    }
  }
  return results.slice(0, 5);
}

// Hintergrund-Extraktion: LLM extrahiert lernwürdige Fakten + Knowledge-Graph-Tripel.
// Fire-and-forget — blockiert keine Antwort an den Nutzer.
export function extractAndRemember(
  userMsg: string,
  assistantMsg: string,
  sessionId: string,
  profileId?: number | null,
): void {
  setImmediate(async () => {
    try {
      const prompt = `Analysiere diesen Gesprächsauszug und antworte in GENAU diesem Format:

FAKT: <ein lernwürdiger Fakt über den Nutzer oder sein System, oder NICHTS>
TRIPEL: <Subjekt|Prädikat|Objekt>; <...> oder KEINE

Tripel-Beispiele:
- Nutzer|bevorzugt|Python
- Nutzer|öffnet morgens|Outlook
- Nutzer|arbeitet als|Entwickler
- Chrome|ist|Standardbrowser

Maximal 3 Tripel. Nur relevante Fakten und Beziehungen.

Nutzer: ${userMsg}
Assistent: ${assistantMsg}`;

      const r = await fetch(`${env.ollamaBaseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: getSettings().ollamaModel,
          prompt,
          stream: false,
          options: { temperature: 0.1, num_predict: 150 },
        }),
      });
      if (!r.ok) return;
      const data = (await r.json()) as { response?: string };
      const response = data.response?.trim();
      if (!response) return;

      const factLine = response
        .split("\n")
        .find((l) => l.toUpperCase().startsWith("FAKT:"));
      const rawFact = factLine?.replace(/^FAKT:\s*/i, "").trim();
      const fact = rawFact ? redact(rawFact) : rawFact;

      let memoryId: number | null = null;
      if (fact && !fact.toUpperCase().startsWith("NICHTS")) {
        const factVec = (await embed(fact)) ?? [];
        if (factVec.length > 0) {
          const [existing] = await pool.execute<any[]>(
            "SELECT id, embedding FROM memories WHERE type = 'user' ORDER BY created_at DESC LIMIT ?",
            [DEDUP_CHECK_LIMIT],
          );
          const isDuplicate = existing.some((row) => {
            try {
              const v = JSON.parse(row.embedding as string) as number[];
              return cosine(factVec, v) >= DEDUP_THRESHOLD;
            } catch {
              return false;
            }
          });
          if (!isDuplicate) {
            const result = await pool.execute(
              "INSERT INTO memories (type, content, embedding, source, profile_id) VALUES (?, ?, ?, ?, ?)",
              [
                "user",
                fact,
                JSON.stringify(factVec),
                `session:${sessionId}`,
                profileId ?? null,
              ],
            );
            memoryId = (result[0] as { insertId?: number }).insertId ?? null;
          }
        }
      }

      const triples = parseTriples(response);
      if (triples.length > 0) {
        await saveTriples(triples, memoryId, profileId ?? null);
      }
    } catch {
      // Fehler in Hintergrundextraktion sind nicht kritisch
    }
  });
}

// Aus positivem/negativem Feedback eine Präferenz-Memory extrahieren.
// Fire-and-forget — blockiert nie den API-Response.
export function processFeedbackMemory(
  excerpt: string,
  feedback: "positive" | "negative",
  toolName?: string,
): void {
  setImmediate(async () => {
    try {
      const valence = feedback === "positive" ? "POSITIV" : "NEGATIV";
      const toolHint = toolName ? `\nVerwendetes Tool: ${toolName}` : "";
      const prompt = `Generiere eine einzige kurze Gedächtnisnotiz über die Vorlieben des Nutzers basierend auf diesem Feedback.

Feedback: ${valence}${toolHint}
Nachrichtenausschnitt: "${excerpt.slice(0, 300)}"

Antworte mit genau einem deutschen Satz der mit "Nutzer bevorzugt" (bei POSITIV) oder "Nutzer mag nicht" (bei NEGATIV) beginnt. Keine Erklärung. Nur der Satz. Antworte mit "NICHTS" wenn kein sinnvoller Schluss möglich ist.`;

      const r = await fetch(`${env.ollamaBaseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: getSettings().ollamaModel,
          prompt,
          stream: false,
          options: { temperature: 0.1, num_predict: 60 },
        }),
      });
      if (!r.ok) return;
      const data = (await r.json()) as { response?: string };
      const fact = data.response?.trim();
      if (!fact || fact.toUpperCase().startsWith("NICHTS")) return;

      await remember("user", fact, "feedback");
    } catch {
      // Fehler in Feedback-Verarbeitung sind nicht kritisch
    }
  });
}

// ── Self-Learning: goldene Q&A-Paare ────────────────────────────────────────

const LEARNING_DEDUP_THRESHOLD = 0.85;
const LEARNING_LOAD_LIMIT = 200;
const LEARNING_RECALL_LIMIT = 3;
const LEARNING_MIN_SCORE = 0.4;

export function storeLearningExample(
  userMessage: string,
  assistantReply: string,
  profileId: number | null,
): void {
  setImmediate(async () => {
    try {
      const vec = await embed(userMessage);
      if (!vec) return;

      const [existing] = await pool.execute<any[]>(
        "SELECT id, embedding FROM learning_examples ORDER BY created_at DESC LIMIT ?",
        [LEARNING_LOAD_LIMIT],
      );
      for (const row of existing) {
        try {
          const existingVec = JSON.parse(row.embedding as string) as number[];
          if (cosine(vec, existingVec) >= LEARNING_DEDUP_THRESHOLD) return;
        } catch {
          continue;
        }
      }

      await pool.execute(
        `INSERT INTO learning_examples (profile_id, user_message, assistant_reply, embedding)
         VALUES (?, ?, ?, ?)`,
        [profileId, userMessage, assistantReply, JSON.stringify(vec)],
      );
    } catch {
      // Fehler beim Speichern goldener Beispiele sind nicht kritisch
    }
  });
}

export async function recallExamples(
  query: string,
  limit = LEARNING_RECALL_LIMIT,
): Promise<{ userMessage: string; assistantReply: string }[]> {
  const qVec = await embed(query);
  if (!qVec) return [];

  const [rows] = await pool.execute<any[]>(
    "SELECT id, user_message, assistant_reply, embedding FROM learning_examples ORDER BY created_at DESC LIMIT ?",
    [LEARNING_LOAD_LIMIT],
  );

  const scored = rows
    .map((r) => {
      try {
        const vec = JSON.parse(r.embedding as string) as number[];
        return {
          id: r.id as number,
          userMessage: r.user_message as string,
          assistantReply: r.assistant_reply as string,
          score: cosine(qVec, vec),
        };
      } catch {
        return null;
      }
    })
    .filter(
      (m): m is NonNullable<typeof m> =>
        m !== null && m.score >= LEARNING_MIN_SCORE,
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  for (const hit of scored) {
    pool
      .execute(
        "UPDATE learning_examples SET use_count = use_count + 1 WHERE id = ?",
        [hit.id],
      )
      .catch(() => {});
  }

  return scored.map((s) => ({
    userMessage: s.userMessage,
    assistantReply: s.assistantReply,
  }));
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

export async function listMemoriesPaged(opts: {
  type?: string;
  search?: string;
  limit?: number;
  offset?: number;
  profileId?: number | null;
}): Promise<{
  memories: {
    id: number;
    type: string;
    content: string;
    source: string | null;
    created_at: string;
  }[];
  total: number;
}> {
  const { type, search, limit = 50, offset = 0, profileId } = opts;

  const conditions: string[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const params: any[] = [];

  if (type && type !== "all") {
    if (type === "reflection") {
      conditions.push("source = 'reflection'");
    } else {
      conditions.push("type = ?");
      params.push(type);
      conditions.push("(source IS NULL OR source != 'reflection')");
    }
  }
  if (search) {
    conditions.push("content LIKE ?");
    params.push(`%${search}%`);
  }
  if (profileId !== undefined) {
    if (profileId === null) {
      conditions.push("profile_id IS NULL");
    } else {
      conditions.push("(profile_id = ? OR profile_id IS NULL)");
      params.push(profileId);
    }
  }

  const where =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const [countRows] = await pool.execute<any[]>(
    `SELECT COUNT(*) as total FROM memories ${where}`,
    params,
  );
  const total = (countRows[0] as { total: number }).total;

  const [rows] = await pool.execute<any[]>(
    `SELECT id, type, content, source, created_at FROM memories ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

  return { memories: rows, total };
}

export async function getMemoryStats(profileId?: number | null): Promise<{
  total: number;
  user: number;
  system: number;
  note: number;
  reflection: number;
}> {
  const conditions: string[] = ["1=1"];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const params: any[] = [];
  if (profileId !== undefined && profileId !== null) {
    conditions.push("(profile_id = ? OR profile_id IS NULL)");
    params.push(Number(profileId));
  }
  const where = conditions.join(" AND ");

  const sql =
    "SELECT COUNT(*) as total," +
    " SUM(CASE WHEN type='user' AND (source IS NULL OR source != 'reflection') THEN 1 ELSE 0 END) as user_count," +
    " SUM(CASE WHEN type='system' AND (source IS NULL OR source != 'reflection') THEN 1 ELSE 0 END) as system_count," +
    " SUM(CASE WHEN type='note' THEN 1 ELSE 0 END) as note_count," +
    " SUM(CASE WHEN source='reflection' THEN 1 ELSE 0 END) as reflection_count" +
    ` FROM memories WHERE ${where}`;

  const [rows] = await pool.execute<any[]>(sql, params);
  const r = rows[0] as {
    total: number;
    user_count: number;
    system_count: number;
    note_count: number;
    reflection_count: number;
  };
  return {
    total: Number(r.total),
    user: Number(r.user_count),
    system: Number(r.system_count),
    note: Number(r.note_count),
    reflection: Number(r.reflection_count),
  };
}

export interface GraphMemory {
  id: number;
  type: string;
  content: string;
  source: string | null;
  created_at: string;
}
export interface GraphEdge {
  source: number;
  target: number;
  weight: number;
  label?: string;
}

// Top-K semantic neighbours per node (keeps edge count manageable)
const GRAPH_LIMIT = 150;
const SIM_THRESHOLD = 0.45;
const TOP_K = 4;

export async function getMemoryGraph(profileId?: number | null): Promise<{
  nodes: GraphMemory[];
  edges: GraphEdge[];
}> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const params: any[] = [];
  const conditions: string[] = [];
  if (profileId !== undefined && profileId !== null) {
    conditions.push("(profile_id = ? OR profile_id IS NULL)");
    params.push(Number(profileId));
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await pool.execute<any[]>(
    `SELECT id, type, content, source, created_at, embedding FROM memories ${where} ORDER BY created_at DESC LIMIT ${GRAPH_LIMIT}`,
    params,
  );

  const nodes: GraphMemory[] = rows.map((r) => ({
    id: r.id as number,
    type: r.type as string,
    content: r.content as string,
    source: r.source as string | null,
    created_at: r.created_at as string,
  }));

  // Parse embeddings once
  const vecs: (number[] | null)[] = rows.map((r) => {
    try {
      return JSON.parse(r.embedding as string) as number[];
    } catch {
      return null;
    }
  });

  // Pairwise cosine — keep top-K per node above threshold
  const edgeMap = new Map<string, GraphEdge>();

  for (let i = 0; i < rows.length; i++) {
    if (!vecs[i]) continue;
    const candidates: { j: number; sim: number }[] = [];
    for (let j = i + 1; j < rows.length; j++) {
      if (!vecs[j]) continue;
      const sim = cosine(vecs[i]!, vecs[j]!);
      if (sim >= SIM_THRESHOLD) candidates.push({ j, sim });
    }
    candidates.sort((a, b) => b.sim - a.sim);
    for (const { j, sim } of candidates.slice(0, TOP_K)) {
      const key = `${nodes[i].id}-${nodes[j].id}`;
      if (!edgeMap.has(key)) {
        edgeMap.set(key, {
          source: nodes[i].id,
          target: nodes[j].id,
          weight: Math.round(sim * 100) / 100,
        });
      }
    }
  }

  const nodeIds = new Set(nodes.map((n) => n.id));
  try {
    const memoryIds = nodes.map((n) => n.id);
    if (memoryIds.length > 0) {
      const placeholders = memoryIds.map(() => "?").join(",");
      const [tripleRows] = await pool.execute<any[]>(
        `SELECT t1.memory_id AS src, t2.memory_id AS tgt, t1.predicate
         FROM knowledge_triples t1
         JOIN knowledge_triples t2
           ON t1.subject = t2.subject OR t1.object = t2.subject OR t1.subject = t2.object
         WHERE t1.memory_id IN (${placeholders})
           AND t2.memory_id IN (${placeholders})
           AND t1.memory_id != t2.memory_id
           AND t1.id < t2.id
         LIMIT 200`,
        [...memoryIds, ...memoryIds],
      );
      for (const tr of tripleRows) {
        const src = tr.src as number;
        const tgt = tr.tgt as number;
        if (!nodeIds.has(src) || !nodeIds.has(tgt)) continue;
        const key = `${src}-${tgt}`;
        if (!edgeMap.has(key)) {
          edgeMap.set(key, {
            source: src,
            target: tgt,
            weight: 0.8,
            label: tr.predicate as string,
          });
        }
      }
    }
  } catch {
    // Knowledge-Triples sind optional — Graph funktioniert auch ohne
  }

  return { nodes, edges: Array.from(edgeMap.values()) };
}

export async function deduplicateMemories(
  profileId?: number | null,
): Promise<{ removed: number; kept: number }> {
  const conditions: string[] = [];
  const params: any[] = [];
  if (profileId !== undefined && profileId !== null) {
    conditions.push("(profile_id = ? OR profile_id IS NULL)");
    params.push(Number(profileId));
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await pool.execute<any[]>(
    `SELECT id, type, content, embedding, created_at FROM memories ${where} ORDER BY created_at ASC`,
    params,
  );

  const parsed: {
    id: number;
    type: string;
    content: string;
    vec: number[] | null;
  }[] = rows.map((r) => ({
    id: r.id as number,
    type: r.type as string,
    content: r.content as string,
    vec: (() => {
      try {
        return JSON.parse(r.embedding as string) as number[];
      } catch {
        return null;
      }
    })(),
  }));

  const toDelete: number[] = [];
  const kept: number[] = [];

  for (let i = 0; i < parsed.length; i++) {
    if (toDelete.includes(parsed[i].id)) continue;

    let isDupOfEarlier = false;
    for (const keptId of kept) {
      const keptEntry = parsed.find((p) => p.id === keptId);
      if (
        !keptEntry ||
        keptEntry.type !== parsed[i].type ||
        !keptEntry.vec ||
        !parsed[i].vec
      )
        continue;
      if (cosine(keptEntry.vec, parsed[i].vec!) >= DEDUP_THRESHOLD) {
        isDupOfEarlier = true;
        break;
      }
    }

    if (isDupOfEarlier) {
      toDelete.push(parsed[i].id);
    } else {
      kept.push(parsed[i].id);
    }
  }

  if (toDelete.length > 0) {
    const batches = [];
    for (let i = 0; i < toDelete.length; i += 100) {
      batches.push(toDelete.slice(i, i + 100));
    }
    for (const batch of batches) {
      const placeholders = batch.map(() => "?").join(",");
      await pool.execute(
        `DELETE FROM memories WHERE id IN (${placeholders})`,
        batch,
      );
      await pool.execute(
        `DELETE FROM knowledge_triples WHERE memory_id IN (${placeholders})`,
        batch,
      );
    }
  }

  return { removed: toDelete.length, kept: kept.length };
}

export async function forgetById(id: number): Promise<ToolResult> {
  if (!Number.isFinite(id) || id <= 0) {
    return {
      success: false,
      error: "Ungültige ID. Nutze list_memories um IDs zu sehen.",
    };
  }
  await pool.execute("DELETE FROM memories WHERE id = ?", [id]);
  return { success: true, output: `Erinnerung ${id} gelöscht.` };
}
