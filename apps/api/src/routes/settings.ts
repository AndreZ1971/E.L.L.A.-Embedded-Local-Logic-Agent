import { Router } from "express";
import { getSettings, saveSettings, MASKED } from "../services/settings.js";
import { env } from "../config/env.js";

export const settingsRouter = Router();

function publicSettings() {
  const s = getSettings();
  return {
    ...s,
    openaiApiKey: s.openaiApiKey || env.openaiApiKey ? MASKED : "",
  };
}

settingsRouter.get("/", (_req, res) => {
  res.json(publicSettings());
});

settingsRouter.put("/", async (req, res, next) => {
  try {
    const {
      provider,
      ollamaModel,
      enabledTools,
      sessionLimit,
      openaiApiKey,
      apps,
      voiceMode,
    } = req.body as {
      provider?: "auto" | "openai" | "ollama";
      ollamaModel?: string;
      enabledTools?: string[];
      sessionLimit?: number;
      openaiApiKey?: string;
      apps?: { name: string; command: string; allowed: boolean }[];
      voiceMode?: "off" | "manual" | "wakeword";
    };

    const patch: Parameters<typeof saveSettings>[0] = {
      provider,
      ollamaModel,
      enabledTools,
      sessionLimit,
      apps,
      voiceMode,
    };
    if (openaiApiKey !== undefined && openaiApiKey !== MASKED) {
      patch.openaiApiKey = openaiApiKey;
    }

    await saveSettings(patch);
    res.json(publicSettings());
  } catch (e) {
    next(e);
  }
});

settingsRouter.get("/models", async (_req, res) => {
  try {
    const r = await fetch(`${env.ollamaBaseUrl}/api/tags`);
    if (!r.ok) {
      res.json({ models: [] });
      return;
    }
    const data = (await r.json()) as { models: Array<{ name: string }> };
    res.json({ models: data.models.map((m) => m.name) });
  } catch {
    res.json({ models: [] });
  }
});
