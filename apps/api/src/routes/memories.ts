import { Router } from "express";
import type { RowDataPacket } from "mysql2";
import {
  listMemoriesPaged,
  getMemoryStats,
  remember,
  forgetById,
  getMemoryGraph,
  cosine,
} from "../services/memory.js";
import { getSettings } from "../services/settings.js";
import { pool } from "../config/database.js";

const router = Router();

// GET /api/memories?type=user&search=text&limit=50&offset=0
router.get("/", async (req, res) => {
  try {
    const { type, search, limit, offset } = req.query as Record<string, string>;
    const { activeProfileId } = getSettings();
    const result = await listMemoriesPaged({
      type: type || undefined,
      search: search || undefined,
      limit: limit ? Math.min(200, Math.max(1, Number(limit))) : 50,
      offset: offset ? Math.max(0, Number(offset)) : 0,
      profileId: activeProfileId,
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/memories/graph?docs=1  — semantic graph, optionally with doc-file nodes
router.get("/graph", async (req, res) => {
  try {
    const { activeProfileId } = getSettings();
    const withDocs = req.query["docs"] === "1";
    const base = await getMemoryGraph(activeProfileId);

    if (!withDocs) {
      res.json(base);
      return;
    }

    // --- load one representative embedding per indexed file ---
    const DOC_SIM_THRESHOLD = 0.4;
    interface DocRow extends RowDataPacket {
      file_path: string;
      filename: string;
      file_type: string;
      embedding: string;
      chunks: number;
    }
    const [docRows] = await pool.execute<DocRow[]>(
      `SELECT file_path, filename, file_type,
              (SELECT embedding FROM document_chunks dc2
               WHERE dc2.file_path = dc.file_path ORDER BY chunk_index LIMIT 1) AS embedding,
              COUNT(*) AS chunks
       FROM document_chunks dc
       GROUP BY file_path, filename, file_type
       ORDER BY MAX(indexed_at) DESC
       LIMIT 120`,
    );

    const docNodes: {
      id: string;
      filename: string;
      file_path: string;
      file_type: string;
      chunks: number;
    }[] = [];
    const docVecs: (number[] | null)[] = [];

    for (const r of docRows) {
      try {
        const vec = JSON.parse(r.embedding) as number[];
        docNodes.push({
          id: `doc::${r.file_path}`,
          filename: r.filename,
          file_path: r.file_path,
          file_type: r.file_type,
          chunks: Number(r.chunks),
        });
        docVecs.push(vec);
      } catch {
        // skip docs without valid embedding
      }
    }

    // --- cross-edges: memory ↔ doc above threshold (top-2 per memory) ---
    const memVecs: (number[] | null)[] = (
      base.nodes as Array<{ id: number }>
    ).map((_, i) => {
      try {
        return (
          (base as unknown as { _vecs?: (number[] | null)[] })._vecs?.[i] ??
          null
        );
      } catch {
        return null;
      }
    });
    void memVecs;

    // Re-query memory embeddings for cross-similarity
    const memIds = base.nodes.map((n) => n.id);
    const crossEdges: { source: string; target: string; weight: number }[] = [];

    if (memIds.length > 0 && docNodes.length > 0) {
      const placeholders = memIds.map(() => "?").join(",");
      interface MemRow extends RowDataPacket {
        id: number;
        embedding: string;
      }
      const [memRows] = await pool.execute<MemRow[]>(
        `SELECT id, embedding FROM memories WHERE id IN (${placeholders})`,
        memIds,
      );
      for (const mr of memRows) {
        let vec: number[] | null = null;
        try {
          vec = JSON.parse(mr.embedding) as number[];
        } catch {
          continue;
        }
        const hits: { idx: number; sim: number }[] = [];
        for (let di = 0; di < docVecs.length; di++) {
          if (!docVecs[di]) continue;
          const sim = cosine(vec, docVecs[di]!);
          if (sim >= DOC_SIM_THRESHOLD) hits.push({ idx: di, sim });
        }
        hits.sort((a, b) => b.sim - a.sim);
        for (const { idx, sim } of hits.slice(0, 2)) {
          crossEdges.push({
            source: `mem_${mr.id}`,
            target: docNodes[idx].id,
            weight: sim,
          });
        }
      }
    }

    res.json({ ...base, docNodes, crossEdges });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/memories/stats
router.get("/stats", async (_req, res) => {
  try {
    const { activeProfileId } = getSettings();
    const stats = await getMemoryStats(activeProfileId);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/memories  { type, content }
router.post("/", async (req, res) => {
  try {
    const { type, content } = req.body as { type?: string; content?: string };
    if (!content?.trim())
      return res.status(400).json({ error: "content fehlt" });
    const validType = (["user", "system", "note"] as const).includes(
      type as "user" | "system" | "note",
    )
      ? (type as "user" | "system" | "note")
      : "note";
    const result = await remember(validType, content.trim(), "manual");
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// DELETE /api/memories/:id
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    if (!Number.isFinite(id) || id <= 0)
      return res.status(400).json({ error: "Ungültige ID" });
    const result = await forgetById(id);
    if (!result.success) return res.status(404).json(result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
