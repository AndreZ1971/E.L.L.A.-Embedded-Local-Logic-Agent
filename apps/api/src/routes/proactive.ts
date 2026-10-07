import { Router, type Request, type Response } from "express";
import {
  recordProactiveDismiss,
  setProactiveMuted,
  getProactivePreferences,
  type ProactiveCategory,
} from "../services/proactive.js";

export const proactiveRouter = Router();

proactiveRouter.post(
  "/dismiss",
  async (req: Request, res: Response): Promise<void> => {
    const { category } = req.body as { category?: string };
    if (!category) {
      res.status(400).json({ error: "category required" });
      return;
    }
    const result = await recordProactiveDismiss(category as ProactiveCategory);
    if (result.muted) {
      res.json({
        ok: true,
        muted: true,
        message: `Kategorie "${category}" wurde automatisch stummgeschaltet (zu oft verworfen).`,
      });
    } else {
      res.json({ ok: true, muted: false });
    }
  },
);

proactiveRouter.post(
  "/mute",
  async (req: Request, res: Response): Promise<void> => {
    const { category, muted } = req.body as {
      category?: string;
      muted?: boolean;
    };
    if (!category || typeof muted !== "boolean") {
      res.status(400).json({ error: "category and muted required" });
      return;
    }
    await setProactiveMuted(category as ProactiveCategory, muted);
    res.json({ ok: true, category, muted });
  },
);

proactiveRouter.get(
  "/preferences",
  async (_req: Request, res: Response): Promise<void> => {
    const prefs = await getProactivePreferences();
    res.json(prefs);
  },
);
