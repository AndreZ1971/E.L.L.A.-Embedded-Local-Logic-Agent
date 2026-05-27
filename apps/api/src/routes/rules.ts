import { Router } from "express";
import {
  listRules,
  createRule,
  updateRule,
  deleteRule,
  toggleRule,
} from "../services/rules.js";

export const rulesRouter = Router();

rulesRouter.get("/", async (_req, res, next) => {
  try {
    res.json(await listRules());
  } catch (err) {
    next(err);
  }
});

rulesRouter.post("/", async (req, res, next) => {
  try {
    const { name, tool_name, trigger, action, enabled } = req.body as {
      name?: string;
      tool_name?: string;
      trigger?: string;
      action?: "allow" | "deny";
      enabled?: boolean;
    };
    if (!name || !action) {
      res.status(400).json({ error: "name und action sind Pflichtfelder" });
      return;
    }
    const id = await createRule({
      name,
      tool_name: tool_name ?? "*",
      trigger: trigger ?? "always",
      action,
      enabled: enabled ?? true,
    });
    res.status(201).json({ id });
  } catch (err) {
    next(err);
  }
});

rulesRouter.put("/:id", async (req, res, next) => {
  try {
    await updateRule(
      Number(req.params.id),
      req.body as Parameters<typeof updateRule>[1],
    );
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

rulesRouter.delete("/:id", async (req, res, next) => {
  try {
    await deleteRule(Number(req.params.id));
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

rulesRouter.patch("/:id/toggle", async (req, res, next) => {
  try {
    await toggleRule(Number(req.params.id));
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
