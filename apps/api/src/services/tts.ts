import { MsEdgeTTS, MetadataOptions, OUTPUT_FORMAT } from "msedge-tts";
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
  const tts = new MsEdgeTTS();

  const rawVoice = options.voice?.trim() ?? "";
  const voice = /^[a-z]{2}-[A-Z]{2}-.+/.test(rawVoice)
    ? rawVoice
    : DEFAULT_VOICE;
  const locale = voice.split("-").slice(0, 2).join("-");

  const metadataOptions = new MetadataOptions();
  metadataOptions.voiceLocale = locale;

  await tts.setMetadata(
    voice,
    OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3,
    metadataOptions,
  );

  const buffer = await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let settled = false;
    const { audioStream } = tts.toStream(text);
    audioStream.on("data", (chunk: Buffer) => chunks.push(chunk));
    audioStream.on("end", () => {
      if (settled) return;
      settled = true;
      resolve(Buffer.concat(chunks));
    });
    audioStream.on("error", (err: Error) => {
      if (settled) return;
      settled = true;
      reject(err);
    });
  });

  return { buffer, contentType: "audio/mpeg" };
}

// Languages with actual Kokoro voice models — no German, no Italian, no Hindi etc.
const KOKORO_LANGS = new Set(["en", "fr", "es"]);

export async function synthesize(
  text: string,
  options: TTSOptions = {},
): Promise<TTSResult> {
  const lang = options.lang ?? "de";
  // Kokoro only where it has a real voice model — German always uses MsEdgeTTS/Katja
  if (isKokoroReady() && KOKORO_LANGS.has(lang)) {
    try {
      return await synthesizeKokoro(text, lang);
    } catch {
      // fall through to MsEdgeTTS
    }
  }
  // MsEdgeTTS — proper neural voices for all languages including German
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
