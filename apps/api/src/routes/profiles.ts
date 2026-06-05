import { Router } from "express";
import {
  listProfiles,
  createProfile,
  switchProfile,
  deleteProfile,
} from "../services/profiles.js";

export const profilesRouter = Router();

profilesRouter.get("/", async (_req, res, next) => {
  try {
    res.json(await listProfiles());
  } catch (e) {
    next(e);
  }
});

profilesRouter.post("/", async (req, res, next) => {
  try {
    const { name, color, pin } = req.body as {
      name?: string;
      color?: string;
      pin?: string;
    };

    if (!name?.trim()) {
      res.status(400).json({ error: "Name erforderlich." });
      return;
    }

    const profile = await createProfile(name.trim(), color, pin);
    res.json(profile);
  } catch (e) {
    next(e);
  }
});

profilesRouter.put("/:id/activate", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { pin } = req.body as { pin?: string };

    const result = await switchProfile(id, pin);
    if (!result.success) {
      res.status(403).json({ error: result.error });
      return;
    }

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

profilesRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const result = await deleteProfile(id);
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});
