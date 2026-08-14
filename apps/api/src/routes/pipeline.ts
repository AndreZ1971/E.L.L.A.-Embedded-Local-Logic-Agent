import { Router } from "express";
import { PREDEFINED_PIPELINES, runPipeline } from "../services/pipeline.js";
import { openaiClient } from "../services/openai.js";
import { getSettings } from "../services/settings.js";
import type { PipelineEvent } from "@ella/shared";

export const pipelineRouter = Router();

// Liste aller verfügbaren Pipelines + verfügbare Setups
pipelineRouter.get("/", (_req, res) => {
  const { setups } = getSettings();
  res.json({
    pipelines: PREDEFINED_PIPELINES.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      icon: p.icon,
      executionMode: p.executionMode,
      agentCount: p.agents.length,
    })),
    setups: setups.map((s) => ({ name: s.name })),
    openaiAvailable: openaiClient.isAvailable(),
  });
});

// Pipeline ausführen — SSE-Stream
pipelineRouter.post("/:id/run", async (req, res) => {
  const { id } = req.params;
  const setupName = (req.body as Record<string, unknown>)?.setupName as
    string | undefined;
  const config = PREDEFINED_PIPELINES.find((p) => p.id === id);

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
