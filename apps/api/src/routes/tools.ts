import { Router } from "express";
import { toolExecutor } from "../tools/executor.js";
import { getSettings } from "../services/settings.js";
import type { ToolCall, ToolName } from "@ella/shared";

export const toolsRouter = Router();

toolsRouter.get("/", (_req, res) => {
  res.json({ tools: getSettings().enabledTools });
});

toolsRouter.post("/execute", async (req, res, next) => {
  try {
    const call = req.body as ToolCall;
    if (!call?.tool) {
      res.status(400).json({ error: "tool required" });
      return;
    }
    const result = await toolExecutor.execute(call);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

toolsRouter.post("/confirm", async (req, res, next) => {
  try {
    const { tool, args } = req.body as {
      tool: string;
      args: Record<string, unknown>;
    };
    // Erlaubt: _confirmed-Tools ODER Tools die confirmed:true im args haben
    const isAllowed =
      tool.endsWith("_confirmed") ||
      (typeof args === "object" && args !== null && args["confirmed"] === true);
    if (!tool || !isAllowed) {
      res.status(400).json({ success: false, error: "Nicht erlaubt." });
      return;
    }
    const result = await toolExecutor.execute({
      tool: tool as ToolName,
      args: args ?? {},
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});
