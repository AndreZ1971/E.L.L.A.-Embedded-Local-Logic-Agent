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
import { preloadKokoro, isKokoroReady } from "./services/kokoro.js";
import { wakewordRouter } from "./routes/wakeword.js";
import { googleRouter } from "./routes/google.js";
import { feedbackRouter } from "./routes/feedback.js";
import { profilesRouter } from "./routes/profiles.js";
import { pipelineRouter } from "./routes/pipeline.js";
import { chessRouter } from "./routes/chess.js";
import memoriesRouter from "./routes/memories.js";
import { backupRouter } from "./routes/backup.js";
import { loadWakewordModels } from "./services/wakewordDetector.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { env } from "./config/env.js";
import { loadSettings, getSettings } from "./services/settings.js";
import { runMigrations } from "./config/migrate.js";
import { worker } from "./services/worker.js";
import {
  modelPullProgress,
  pullModelIfNeeded,
} from "./services/ollamaService.js";

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
app.use("/api/pipeline", pipelineRouter);
app.use("/api/chess", chessRouter);
app.use("/api/memories", memoriesRouter);
app.use("/api/backup", backupRouter);

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
    kokoro_ready: isKokoroReady(),
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
      preloadKokoro();
      loadWakewordModels().catch(() => {});
      pullModelIfNeeded();
    });
  });
