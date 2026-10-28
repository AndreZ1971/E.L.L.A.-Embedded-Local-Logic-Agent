import { EdgeTTS } from "@andresaya/edge-tts";
import { isKokoroReady, synthesizeKokoro } from "./kokoro.js";
import { getSettings } from "./settings.js";

const FEMALE_VOICES: Record<string, string> = {
  de: "de-DE-KatjaNeural",
  en: "en-GB-SoniaNeural",
  es: "es-ES-ElviraNeural",
  fr: "fr-FR-DeniseNeural",
};
const DEFAULT_VOICE = "de-DE-KatjaNeural";

export function getVoiceForLanguage(lang: string): string {
  return FEMALE_VOICES[lang] ?? DEFAULT_VOICE;
}

export interface TTSOptions {
  voice?: string;
  rate?: string;
  pitch?: string;
  lang?: string;
}

export interface TTSResult {
  buffer: Buffer;
  contentType: string;
}

const MAX_RETRIES = 3;
const RETRY_BASE_MS = 800;

async function synthesizeMsEdge(
  text: string,
  options: TTSOptions,
): Promise<TTSResult> {
  const rawVoice = options.voice?.trim() ?? "";
  const voice = /^[a-z]{2}-[A-Z]{2}-.+/.test(rawVoice)
    ? rawVoice
    : DEFAULT_VOICE;

  let lastErr: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const tts = new EdgeTTS();
      const result = await tts.generate(text, voice);
      return { buffer: Buffer.from(result.audio), contentType: "audio/mpeg" };
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("429") || msg.includes("Too Many")) {
        await new Promise((r) => setTimeout(r, RETRY_BASE_MS * 2 ** attempt));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

// Kokoro only for languages with proper voice quality — German uses MsEdgeTTS/Katja
const KOKORO_LANGS = new Set(["en", "fr", "es"]);

export function activeTtsEngine(lang: string): "Kokoro" | "Edge TTS" | "off" {
  if (isKokoroReady() && KOKORO_LANGS.has(lang)) return "Kokoro";
  if (getSettings().offlineMode) return "off";
  return "Edge TTS";
}

export async function synthesize(
  text: string,
  options: TTSOptions = {},
): Promise<TTSResult | null> {
  const lang = options.lang ?? "de";
  const { offlineMode } = getSettings();
  if (isKokoroReady() && KOKORO_LANGS.has(lang)) {
    try {
      return await synthesizeKokoro(text, lang);
    } catch {
      // fall through to MsEdgeTTS (if allowed)
    }
  }
  if (offlineMode) return null;
  return synthesizeMsEdge(text, options);
}

export interface VoiceOption {
  name: string;
  locale: string;
  gender: "Female";
  lang: "de" | "en" | "es" | "fr";
  label: string;
}

export function listVoices(): VoiceOption[] {
  return [
    {
      name: "de-DE-KatjaNeural",
      locale: "de-DE",
      gender: "Female",
      lang: "de",
      label: "Deutsch — Katja",
    },
    {
      name: "en-GB-SoniaNeural",
      locale: "en-GB",
      gender: "Female",
      lang: "en",
      label: "English — Sonia",
    },
    {
      name: "es-ES-ElviraNeural",
      locale: "es-ES",
      gender: "Female",
      lang: "es",
      label: "Español — Elvira",
    },
    {
      name: "fr-FR-DeniseNeural",
      locale: "fr-FR",
      gender: "Female",
      lang: "fr",
      label: "Français — Denise",
    },
  ];
}
