import { Router } from "express";
import {
  getSettings,
  saveSettings,
  MASKED,
  DEFAULT_SETTINGS,
} from "../services/settings.js";
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
      setups,
      homeworkMode,
      ttsEnabled,
      ttsVoice,
    } = req.body as {
      provider?: "auto" | "openai" | "ollama";
      ollamaModel?: string;
      enabledTools?: string[];
      sessionLimit?: number;
      openaiApiKey?: string;
      apps?: { name: string; command: string; allowed: boolean }[];
      voiceMode?: "off" | "manual" | "wakeword";
      setups?: { id: string; name: string; open: string[]; close: string[] }[];
      homeworkMode?: { apps?: string[] };
      ttsEnabled?: boolean;
      ttsVoice?: string;
    };

    const patch: Parameters<typeof saveSettings>[0] = {
      provider,
      ollamaModel,
      enabledTools,
      sessionLimit,
      apps,
      voiceMode,
      setups,
      ttsEnabled,
      ttsVoice,
    };

    // Only allow updating homeworkMode.apps — never overwrite pinHash or active
    if (homeworkMode?.apps !== undefined) {
      const current = getSettings();
      patch.homeworkMode = { ...current.homeworkMode, apps: homeworkMode.apps };
    }
    if (openaiApiKey !== undefined && openaiApiKey !== MASKED) {
      patch.openaiApiKey = openaiApiKey;
    }

    await saveSettings(patch);
    res.json(publicSettings());
  } catch (e) {
    next(e);
  }
});

settingsRouter.post("/emergency-reset", async (_req, res, next) => {
  try {
    const current = getSettings();
    await saveSettings({
      provider: DEFAULT_SETTINGS.provider,
      ollamaModel: DEFAULT_SETTINGS.ollamaModel,
      enabledTools: DEFAULT_SETTINGS.enabledTools,
      voiceMode: DEFAULT_SETTINGS.voiceMode,
      ttsEnabled: DEFAULT_SETTINGS.ttsEnabled,
      sessionLimit: DEFAULT_SETTINGS.sessionLimit,
      emergencyResetAt: new Date().toISOString(),
      // Behalte: apps, setups, homeworkMode, openaiApiKey, onboardingComplete
      apps: current.apps,
      setups: current.setups,
      homeworkMode: current.homeworkMode,
    });
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
