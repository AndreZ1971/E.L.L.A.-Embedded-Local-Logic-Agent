import { Router } from "express";
import { getSettings, saveSettings } from "../services/settings.js";
import { runSystemScan, scanHardware } from "../services/systemScan.js";
import { remember } from "../services/memory.js";

export const onboardingRouter = Router();

onboardingRouter.get("/status", (_req, res) => {
  const { onboardingComplete } = getSettings();
  const { computerName } = scanHardware();
  res.json({ complete: onboardingComplete, computerName });
});

onboardingRouter.post("/scan", async (_req, res, next) => {
  try {
    const hw = await runSystemScan();
    res.json({ ok: true, hardware: hw });
  } catch (err) {
    next(err);
  }
});

onboardingRouter.post("/complete", async (req, res, next) => {
  try {
    const { userName, location } = req.body as {
      userName?: string;
      location?: string;
    };
    if (userName?.trim()) {
      await remember("user", `Mein Name ist ${userName.trim()}`);
    }
    if (location?.trim()) {
      await remember("system", `Wohnort: ${location.trim()}`);
    }
    await saveSettings({ onboardingComplete: true });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
