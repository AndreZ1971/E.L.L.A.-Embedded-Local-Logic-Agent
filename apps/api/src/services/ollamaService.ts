import { env } from "../config/env.js";
import { getSettings } from "./settings.js";

export const MODEL_TIERS = {
  small: { model: "llama3.2:3b", label: "Klein", size: "~2 GB", vram: "4 GB+" },
  standard: {
    model: "llama3.1:8b",
    label: "Standard",
    size: "~5 GB",
    vram: "6 GB+",
  },
  large: {
    model: "qwen2.5:14b",
    label: "Groß",
    size: "~8.5 GB",
    vram: "12 GB+",
  },
} as const;

export type ModelTier = keyof typeof MODEL_TIERS;

export let modelPullProgress: { pct: number; status: string } | null = null;

async function waitForOllama(maxWaitMs = 60_000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    try {
      const r = await fetch(`${env.ollamaBaseUrl}/api/tags`, {
        signal: AbortSignal.timeout(5_000),
      });
      if (r.ok) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 3_000));
  }
  return false;
}

export async function pullModelIfNeeded(): Promise<void> {
  const { provider, ollamaModel } = getSettings();
  if (provider === "openai") return;

  const ollamaReady = await waitForOllama(60_000);
  if (!ollamaReady) {
    console.error("[API] Ollama nicht erreichbar nach 60s — kein Auto-Pull");
    return;
  }

  try {
    const tagsResp = await fetch(`${env.ollamaBaseUrl}/api/tags`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!tagsResp.ok) return;
    const tags = (await tagsResp.json()) as {
      models?: Array<{ name: string }>;
    };
    const modelBase = ollamaModel.split(":")[0];
    const alreadyHave = tags.models?.some((m) => m.name.includes(modelBase));

    if (alreadyHave) {
      // Modell vorhanden — in RAM laden
      fetch(`${env.ollamaBaseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: ollamaModel, prompt: "", stream: false }),
        signal: AbortSignal.timeout(60_000),
      }).catch(() => {});
      return;
    }

    console.log(`[API] Lade Modell ${ollamaModel}…`);
    modelPullProgress = { pct: 0, status: "Starte Download…" };

    const pullResp = await fetch(`${env.ollamaBaseUrl}/api/pull`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: ollamaModel, stream: true }),
    });
    if (!pullResp.body) return;

    const reader = pullResp.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      for (const line of decoder.decode(value).split("\n")) {
        if (!line.trim()) continue;
        try {
          const ev = JSON.parse(line) as {
            status?: string;
            completed?: number;
            total?: number;
          };
          if (ev.completed && ev.total && ev.total > 0) {
            const pct = Math.round((ev.completed / ev.total) * 100);
            modelPullProgress = {
              pct,
              status: `KI-Modell wird geladen… ${pct}%`,
            };
          } else if (ev.status) {
            modelPullProgress = {
              pct: modelPullProgress?.pct ?? 0,
              status: ev.status,
            };
          }
        } catch {}
      }
    }
    modelPullProgress = null;
    console.log(`[API] Modell ${ollamaModel} bereit.`);
  } catch (e) {
    console.error("[API] pullModelIfNeeded Fehler:", e);
    modelPullProgress = null;
  }
}
