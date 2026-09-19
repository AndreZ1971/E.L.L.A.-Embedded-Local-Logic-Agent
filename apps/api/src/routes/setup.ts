import { Router } from "express";
import { spawn } from "child_process";
import { env } from "../config/env.js";
import { toolExecutor } from "../tools/executor.js";

export const setupRouter = Router();

setupRouter.post("/run", async (req, res) => {
  const { name } = req.body as { name?: string };
  if (!name) {
    res.status(400).json({ success: false, error: "name fehlt" });
    return;
  }
  const result = await toolExecutor.execute({
    tool: "load_setup",
    args: { name },
  });
  res.json(result);
});

setupRouter.get("/status", async (_req, res) => {
  let ollama = false;
  let nomic = false;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const r = await fetch(`${env.ollamaBaseUrl}/api/tags`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (r.ok) {
      ollama = true;
      const data = (await r.json()) as { models?: Array<{ name: string }> };
      nomic =
        data.models?.some((m) => m.name.includes("nomic-embed-text")) ?? false;
    }
  } catch {
    // Ollama nicht erreichbar
  }

  // MariaDB: wenn die API läuft, ist MariaDB verfügbar
  res.json({ ollama, nomic, mariadb: true, allOk: ollama && nomic });
});

setupRouter.post("/pull-nomic", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const send = (data: object): void => {
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  };

  const proc = spawn("ollama", ["pull", "nomic-embed-text"], {
    stdio: ["ignore", "pipe", "pipe"],
  });

  proc.stdout?.on("data", (chunk: Buffer) => {
    const text = chunk
      .toString()
      .split(/[\r\n]+/)
      .map((l) => l.trim())
      .filter(Boolean)
      .join(" ");
    if (text) send({ text });
  });

  proc.stderr?.on("data", (chunk: Buffer) => {
    const text = chunk
      .toString()
      .split(/[\r\n]+/)
      .map((l) => l.trim())
      .filter(Boolean)
      .join(" ");
    if (text) send({ text });
  });

  proc.on("close", (code) => {
    send({ done: true, success: code === 0 });
    res.end();
  });

  proc.on("error", (err) => {
    send({ done: true, success: false, error: err.message });
    res.end();
  });

  req.on("close", () => {
    if (!proc.killed) proc.kill();
  });
});
