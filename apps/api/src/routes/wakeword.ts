import { Router } from "express";
import multer from "multer";
import {
  detectWakeword,
  isWakewordAvailable,
} from "../services/wakewordDetector.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const wakewordRouter = Router();

wakewordRouter.get("/status", (_req, res) => {
  res.json({ available: isWakewordAvailable() });
});

wakewordRouter.post(
  "/detect",
  upload.single("audio"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "Keine Audio-Datei" });
        return;
      }
      const result = await detectWakeword(req.file.buffer);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);
