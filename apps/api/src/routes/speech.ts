import { Router } from "express";
import multer from "multer";
import {
  transcribe,
  contextAlign,
  isWhisperReady,
  getWhisperPipeline,
} from "../services/whisper.js";
import {
  synthesize,
  listVoices,
  getVoiceForLanguage,
} from "../services/tts.js";
import { getSettings } from "../services/settings.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const speechRouter = Router();

speechRouter.get("/status", (_req, res) => {
  res.json({ ready: isWhisperReady(), model: "Xenova/whisper-small" });
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
      const raw = await transcribe(req.file.buffer);
      const text = req.query.raw === "true" ? raw : await contextAlign(raw);
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

// ── Edge TTS ──────────────────────────────────────────────────────────────────

speechRouter.post("/synthesize", async (req, res, next) => {
  try {
    const { text, voice, rate } = req.body as {
      text: string;
      voice?: string;
      rate?: string;
    };
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      res.status(400).json({ error: "Kein Text angegeben" });
      return;
    }
    if (text.length > 2000) {
      res.status(400).json({ error: "Text zu lang (max 2000 Zeichen)" });
      return;
    }
    const { spokenLanguage } = getSettings();
    const resolvedVoice = voice || getVoiceForLanguage(spokenLanguage ?? "de");
    const audio = await synthesize(text.trim(), { voice: resolvedVoice, rate });
    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": String(audio.length),
      "Cache-Control": "no-store",
    });
    res.send(audio);
  } catch (err) {
    next(err);
  }
});

speechRouter.post("/kokoro", async (req, res, next) => {
  try {
    const { text } = req.body as { text?: string };
    if (!text) {
      res.status(400).json({ error: "text required" });
      return;
    }

    const { spokenLanguage } = getSettings();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const upstream = await fetch("http://127.0.0.1:3003/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang: spokenLanguage ?? "de" }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!upstream.ok) {
        res.status(503).json({ error: "Kokoro TTS nicht verfügbar." });
        return;
      }

      res.json({ ok: true });
    } catch {
      clearTimeout(timeout);
      res.status(503).json({
        error: "Kokoro TTS nicht erreichbar — Fallback auf System-TTS.",
      });
    }
  } catch (e) {
    next(e);
  }
});

speechRouter.get("/voices", (_req, res, next) => {
  try {
    const voices = listVoices();
    res.json({ voices });
  } catch (err) {
    next(err);
  }
});
