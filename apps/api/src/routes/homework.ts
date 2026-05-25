import { Router } from "express";
import {
  activateHomeworkMode,
  deactivateHomeworkMode,
  getHomeworkStatus,
  hashPin,
  verifyPin,
} from "../services/homework.js";
import { getSettings, saveSettings } from "../services/settings.js";

export const homeworkRouter = Router();

homeworkRouter.get("/status", (_req, res) => {
  res.json(getHomeworkStatus());
});

homeworkRouter.post("/activate", async (_req, res, next) => {
  try {
    res.json(await activateHomeworkMode());
  } catch (e) {
    next(e);
  }
});

homeworkRouter.post("/deactivate", async (req, res, next) => {
  try {
    const { pin } = req.body as { pin?: string };
    if (!pin) {
      res.status(400).json({ error: "pin required" });
      return;
    }
    res.json(await deactivateHomeworkMode(pin));
  } catch (e) {
    next(e);
  }
});

// PIN setzen / Apps konfigurieren (erfordert aktuellen PIN wenn bereits gesetzt)
homeworkRouter.put("/config", async (req, res, next) => {
  try {
    const { newPin, currentPin, apps } = req.body as {
      newPin?: string;
      currentPin?: string;
      apps?: string[];
    };
    const s = getSettings();

    if (s.homeworkMode.pinHash) {
      if (!currentPin) {
        res.status(403).json({ error: "Aktueller PIN erforderlich." });
        return;
      }
      if (!verifyPin(currentPin)) {
        res.status(403).json({ error: "Falscher aktueller PIN." });
        return;
      }
    }

    const updated = { ...s.homeworkMode };
    if (newPin) updated.pinHash = hashPin(newPin);
    if (apps !== undefined) updated.apps = apps;

    await saveSettings({ homeworkMode: updated });
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});
