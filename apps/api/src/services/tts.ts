import { EdgeTTS } from "@andresaya/edge-tts";
import { isKokoroReady, synthesizeKokoro } from "./kokoro.js";

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

async function synthesizeMsEdge(
  text: string,
  options: TTSOptions,
): Promise<TTSResult> {
  const rawVoice = options.voice?.trim() ?? "";
  const voice = /^[a-z]{2}-[A-Z]{2}-.+/.test(rawVoice)
    ? rawVoice
    : DEFAULT_VOICE;

  const tts = new EdgeTTS();
  const result = await tts.generate(text, voice);
  const buffer = Buffer.from(result.audio);

  return { buffer, contentType: "audio/mpeg" };
}

// Kokoro only for languages with proper voice quality — German uses MsEdgeTTS/Katja
const KOKORO_LANGS = new Set(["en", "fr", "es"]);

export async function synthesize(
  text: string,
  options: TTSOptions = {},
): Promise<TTSResult> {
  const lang = options.lang ?? "de";
  if (isKokoroReady() && KOKORO_LANGS.has(lang)) {
    try {
      return await synthesizeKokoro(text, lang);
    } catch {
      // fall through to MsEdgeTTS
    }
  }
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
