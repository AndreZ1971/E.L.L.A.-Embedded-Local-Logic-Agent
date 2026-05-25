import { Router } from "express";
import { pool } from "../config/database.js";
import { env } from "../config/env.js";
import { getDiskUsage } from "@ella/agent-tools";

export const systemRouter = Router();

systemRouter.get("/status", async (_req, res) => {
  const [ollama, db] = await Promise.all([
    fetch(`${env.ollamaBaseUrl}/api/tags`)
      .then((r) => r.ok)
      .catch(() => false),
    pool
      .execute("SELECT 1")
      .then(() => true)
      .catch(() => false),
  ]);

  res.json({
    ollama: { ok: ollama, url: env.ollamaBaseUrl },
    db: { ok: db },
  });
});

systemRouter.get("/disk", async (_req, res) => {
  const drives = ["C", "E", "Z"];
  const results = await Promise.all(
    drives.map((d) => getDiskUsage({ drive: d })),
  );
  res.json(Object.fromEntries(drives.map((d, i) => [d, results[i]])));
});
