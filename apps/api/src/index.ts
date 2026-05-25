import "dotenv/config";
import express from "express";
import { chatRouter } from "./routes/chat.js";
import { toolsRouter } from "./routes/tools.js";
import { systemRouter } from "./routes/system.js";
import { settingsRouter } from "./routes/settings.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { env } from "./config/env.js";
import { loadSettings } from "./services/settings.js";

const app = express();

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
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

app.use(errorHandler);

loadSettings().then(() => {
  app.listen(env.port, () => {
    console.log(`E.L.L.A. API  →  http://localhost:${env.port}`);
  });
});
