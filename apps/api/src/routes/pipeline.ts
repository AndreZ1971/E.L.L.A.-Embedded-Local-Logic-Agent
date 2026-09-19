import { Router } from "express";
import { randomUUID } from "crypto";
import { PREDEFINED_PIPELINES, runPipeline } from "../services/pipeline.js";
import { openaiClient } from "../services/openai.js";
import { getSettings } from "../services/settings.js";
import { pool } from "../config/database.js";
import type {
  PipelineEvent,
  PipelineConfig,
  PipelineAgentDef,
} from "@ella/shared";

export const pipelineRouter = Router();

// ── DB-Helpers ───────────────────────────────────────────────────────────────

interface DbPipeline {
  id: string;
  name: string;
  description: string;
  icon: string;
  execution_mode: "parallel" | "sequential";
  agents: string;
}

async function loadCustomPipelines(): Promise<PipelineConfig[]> {
  const [rows] = await pool.execute<any[]>(
    "SELECT id, name, description, icon, execution_mode, agents FROM custom_pipelines ORDER BY created_at ASC",
  );
  return (rows as DbPipeline[]).map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    icon: r.icon,
    executionMode: r.execution_mode,
    agents: JSON.parse(r.agents) as PipelineAgentDef[],
  }));
}

// ── GET / — alle Pipelines (vordefiniert + eigene) ───────────────────────────

pipelineRouter.get("/", async (_req, res) => {
  const { setups } = getSettings();
  const custom = await loadCustomPipelines().catch(() => []);

  const all = [
    ...PREDEFINED_PIPELINES.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      icon: p.icon,
      executionMode: p.executionMode,
      agentCount: p.agents.length,
      isCustom: false,
    })),
    ...custom.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      icon: p.icon,
      executionMode: p.executionMode,
      agentCount: p.agents.length,
      isCustom: true,
    })),
  ];

  res.json({
    pipelines: all,
    setups: setups.map((s) => ({ name: s.name })),
    openaiAvailable: openaiClient.isAvailable(),
  });
});

// ── Eigene Pipelines CRUD ────────────────────────────────────────────────────

pipelineRouter.get("/custom", async (_req, res) => {
  const custom = await loadCustomPipelines().catch(() => []);
  res.json(custom);
});

pipelineRouter.post("/custom", async (req, res) => {
  const body = req.body as Partial<PipelineConfig>;
  if (!body.name?.trim()) {
    res.status(400).json({ error: "Name fehlt." });
    return;
  }
  if (!Array.isArray(body.agents) || body.agents.length === 0) {
    res.status(400).json({ error: "Mindestens ein Agent erforderlich." });
    return;
  }

  const id = randomUUID();
  await pool.execute(
    `INSERT INTO custom_pipelines (id, name, description, icon, execution_mode, agents)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      id,
      body.name.trim(),
      body.description?.trim() ?? "",
      body.icon ?? "⚡",
      body.executionMode ?? "parallel",
      JSON.stringify(body.agents),
    ],
  );
  res.json({ id });
});

pipelineRouter.put("/custom/:id", async (req, res) => {
  const { id } = req.params;
  const body = req.body as Partial<PipelineConfig>;
  if (!body.name?.trim()) {
    res.status(400).json({ error: "Name fehlt." });
    return;
  }
  if (!Array.isArray(body.agents) || body.agents.length === 0) {
    res.status(400).json({ error: "Mindestens ein Agent erforderlich." });
    return;
  }

  await pool.execute(
    `UPDATE custom_pipelines SET name=?, description=?, icon=?, execution_mode=?, agents=?, updated_at=NOW()
     WHERE id=?`,
    [
      body.name.trim(),
      body.description?.trim() ?? "",
      body.icon ?? "⚡",
      body.executionMode ?? "parallel",
      JSON.stringify(body.agents),
      id,
    ],
  );
  res.json({ ok: true });
});

pipelineRouter.delete("/custom/:id", async (req, res) => {
  const { id } = req.params;
  await pool.execute("DELETE FROM custom_pipelines WHERE id=?", [id]);
  res.json({ ok: true });
});

// ── Pipeline ausführen — SSE-Stream ─────────────────────────────────────────

pipelineRouter.post("/:id/run", async (req, res) => {
  const { id } = req.params;
  const setupName = (req.body as Record<string, unknown>)?.setupName as
    string | undefined;

  // Vordefiniert oder eigene Pipeline suchen
  let config = PREDEFINED_PIPELINES.find((p) => p.id === id);
  if (!config) {
    const custom = await loadCustomPipelines().catch(() => []);
    config = custom.find((p) => p.id === id);
  }

  if (!config) {
    res.status(404).json({ error: `Pipeline '${id}' nicht gefunden.` });
    return;
  }

  if (!openaiClient.isAvailable()) {
    res
      .status(403)
      .json({ error: "Pipelines erfordern einen konfigurierten OpenAI-Key." });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const emit = (event: PipelineEvent) =>
    res.write(`data: ${JSON.stringify(event)}\n\n`);

  try {
    await runPipeline(config, emit, setupName || undefined);
  } catch (err) {
    emit({
      type: "error",
      message: err instanceof Error ? err.message : "Unbekannter Fehler",
    });
  }

  res.end();
});
