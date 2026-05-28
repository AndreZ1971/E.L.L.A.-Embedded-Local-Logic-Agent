import { Router } from "express";
import multer from "multer";
import {
  transcribe,
  isWhisperReady,
  getWhisperPipeline,
} from "../services/whisper.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const speechRouter = Router();

speechRouter.get("/status", (_req, res) => {
  res.json({ ready: isWhisperReady(), model: "Xenova/whisper-tiny" });
});

speechRouter.post(
  "/transcribe",
  upload.single("audio"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "Keine Audio-Datei" });
        return;
      }
      const text = await transcribe(req.file.buffer);
      res.json({ text });
    } catch (err) {
      next(err);
    }
  },
);

// Modell im Hintergrund vorladen (beim ersten API-Start)
export function preloadWhisper(): void {
  getWhisperPipeline().catch(() => {});
}
