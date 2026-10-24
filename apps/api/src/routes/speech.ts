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
import { correctText } from "../services/textCorrection.js";
import { typeTextToActiveWindow } from "../services/windowManager.js";

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

// ── Diktat: Sprache → Text → aktives Fenster ────────────────────────────────

speechRouter.post(
  "/dictate",
  upload.single("audio"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "Keine Audio-Datei" });
        return;
      }

      const raw = await transcribe(req.file.buffer);
      if (!raw || raw.trim().length < 2) {
        res.json({ text: "", typed: false });
        return;
      }

      const { dictationCorrection } = getSettings();
      const text = dictationCorrection ? await correctText(raw) : raw;

      const result = typeTextToActiveWindow(text);
      if (!result.success) {
        res.status(500).json({ error: result.error, text });
        return;
      }

      res.json({ text, typed: true });
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
    const lang = spokenLanguage ?? "de";
    const resolvedVoice = voice || getVoiceForLanguage(lang);
    const result = await synthesize(text.trim(), {
      voice: resolvedVoice,
      rate,
      lang,
    });
    res.set({
      "Content-Type": result.contentType,
      "Content-Length": String(result.buffer.length),
      "Cache-Control": "no-store",
    });
    res.send(result.buffer);
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

const STRESS_PORT = 3004;

speechRouter.post("/stress", upload.single("audio"), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "Keine Audio-Datei" });
      return;
    }
    // Forward raw WAV bytes to Python stress_server
    const response = await fetch(`http://127.0.0.1:${STRESS_PORT}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": String(req.file.buffer.length),
      },
      body: new Uint8Array(req.file.buffer),
    }).catch(() => null);

    if (!response || !response.ok) {
      res.json({ stress: "low", score: 0 });
      return;
    }
    const result = (await response.json()) as {
      stress: string;
      score: number;
    };
    res.json(result);
  } catch (err) {
    next(err);
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
