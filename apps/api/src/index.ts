import "dotenv/config";

// Verhindert dass ein einzelner TTS/WebSocket-Fehler den gesamten API-Prozess killt
process.on("uncaughtException", (err) => {
  console.error(
    "[API] Uncaught exception (Prozess läuft weiter):",
    err.message,
  );
});
process.on("unhandledRejection", (reason) => {
  console.error("[API] Unhandled rejection (Prozess läuft weiter):", reason);
});
import express from "express";
import { chatRouter } from "./routes/chat.js";
import { toolsRouter } from "./routes/tools.js";
import { systemRouter } from "./routes/system.js";
import { settingsRouter } from "./routes/settings.js";
import { rulesRouter } from "./routes/rules.js";
import { homeworkRouter } from "./routes/homework.js";
import { eventsRouter } from "./routes/events.js";
import { onboardingRouter } from "./routes/onboarding.js";
import { licenseRouter } from "./routes/license.js";
import { setupRouter } from "./routes/setup.js";
import { speechRouter, preloadWhisper } from "./routes/speech.js";
import { wakewordRouter } from "./routes/wakeword.js";
import { googleRouter } from "./routes/google.js";
import { feedbackRouter } from "./routes/feedback.js";
import { profilesRouter } from "./routes/profiles.js";
import { loadWakewordModels } from "./services/wakewordDetector.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { env } from "./config/env.js";
import { loadSettings, getSettings } from "./services/settings.js";
import { runMigrations } from "./config/migrate.js";
import { worker } from "./services/worker.js";

// Model-Pull-Fortschritt — gelesen von /api/health
export let modelPullProgress: { pct: number; status: string } | null = null;

async function pullModelIfNeeded(): Promise<void> {
  const { provider, ollamaModel } = getSettings();
  if (provider === "openai") return;
  try {
    const tagsResp = await fetch(`${env.ollamaBaseUrl}/api/tags`, {
      signal: AbortSignal.timeout(5_000),
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

const app = express();

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json());

app.use("/api/chat", chatRouter);
app.use("/api/tools", toolsRouter);
app.use("/api/system", systemRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/rules", rulesRouter);
app.use("/api/events", eventsRouter);
app.use("/api/onboarding", onboardingRouter);
app.use("/api/license", licenseRouter);
app.use("/api/setup", setupRouter);
app.use("/api/homework", homeworkRouter);
app.use("/api/speech", speechRouter);
app.use("/api/wakeword", wakewordRouter);
app.use("/api/google", googleRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/profiles", profilesRouter);

app.get("/api/health", async (_req, res) => {
  const { provider, ollamaModel } = getSettings();
  let ollamaOk = false;
  let modelReady = false;
  if (provider !== "openai") {
    try {
      const r = await fetch(`${env.ollamaBaseUrl}/api/tags`, {
        signal: AbortSignal.timeout(3000),
      });
      if (r.ok) {
        ollamaOk = true;
        const tags = (await r.json()) as { models?: Array<{ name: string }> };
        const base = ollamaModel.split(":")[0];
        modelReady = tags.models?.some((m) => m.name.includes(base)) ?? false;
      }
    } catch {
      ollamaOk = false;
    }
  } else {
    modelReady = true;
  }
  res.json({
    api: true,
    ollama: ollamaOk,
    model: ollamaModel,
    provider,
    model_ready: modelReady,
    model_pull: modelPullProgress,
  });
});

app.use(errorHandler);

loadSettings()
  .then(runMigrations)
  .catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[ELLA] DB nicht verfügbar (${msg}) — starte ohne DB`);
  })
  .then(() => {
    app.listen(env.port, () => {
      console.log(`E.L.L.A. API  →  http://localhost:${env.port}`);
      worker.start();
      preloadWhisper();
      loadWakewordModels().catch(() => {});
      pullModelIfNeeded();
    });
  });
