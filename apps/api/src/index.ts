import "dotenv/config";
import express from "express";
import { chatRouter } from "./routes/chat.js";
import { toolsRouter } from "./routes/tools.js";
import { systemRouter } from "./routes/system.js";
import { settingsRouter } from "./routes/settings.js";
import { rulesRouter } from "./routes/rules.js";
import { homeworkRouter } from "./routes/homework.js";
import { eventsRouter } from "./routes/events.js";
import { onboardingRouter } from "./routes/onboarding.js";
import { setupRouter } from "./routes/setup.js";
import { speechRouter, preloadWhisper } from "./routes/speech.js";
import { wakewordRouter } from "./routes/wakeword.js";
import { loadWakewordModels } from "./services/wakewordDetector.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { env } from "./config/env.js";
import { loadSettings } from "./services/settings.js";
import { runMigrations } from "./config/migrate.js";
import { worker } from "./services/worker.js";

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
app.use("/api/setup", setupRouter);
app.use("/api/homework", homeworkRouter);
app.use("/api/speech", speechRouter);
app.use("/api/wakeword", wakewordRouter);

app.use(errorHandler);

loadSettings()
  .then(runMigrations)
  .then(() => {
    app.listen(env.port, () => {
      console.log(`E.L.L.A. API  →  http://localhost:${env.port}`);
      worker.start();
      preloadWhisper();
      loadWakewordModels().catch(() => {});
    });
  });
