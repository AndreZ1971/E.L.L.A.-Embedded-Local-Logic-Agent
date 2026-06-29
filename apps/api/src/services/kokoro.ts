import path from "path";
import os from "os";
import fs from "fs";
import type { KokoroTTS } from "kokoro-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ttsInstance: KokoroTTS | null = null;
let initPromise: Promise<void> | null = null;
let kokoroReady = false;
let kokoroFailed = false;

const VOICE_MAP: Record<string, string> = {
  de: "af_sarah",
  en: "bf_emma",
  es: "ef_dora",
  fr: "ff_siwis",
};

const MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";

function getModelCache(): string {
  const base = process.env.APPDATA ?? os.homedir();
  return path.join(base, "ELLA", "kokoro-cache");
}

function getBundledModelPath(): string {
  // In installer: vendor/kokoro/ next to the node.exe
  const exeDir = path.dirname(process.execPath);
  return path.join(exeDir, "..", "..", "vendor", "kokoro");
}

export function isKokoroReady(): boolean {
  return kokoroReady;
}

export function isKokoroFailed(): boolean {
  return kokoroFailed;
}

export function preloadKokoro(): void {
  if (kokoroReady || kokoroFailed || initPromise) return;
  initPromise = doInit().catch(() => {});
}

async function doInit(): Promise<void> {
  try {
    const cacheDir = getModelCache();
    process.env.HF_HOME = cacheDir;

    const { KokoroTTS } = await import("kokoro-js");

    const bundledPath = getBundledModelPath();
    const modelId = fs.existsSync(bundledPath) ? bundledPath : MODEL_ID;

    console.log(
      `[TTS] Lade Kokoro (${modelId === bundledPath ? "lokal/vendor" : "HuggingFace Hub"})...`,
    );

    ttsInstance = await KokoroTTS.from_pretrained(modelId, {
      dtype: "q8",
      device: "cpu",
    });

    kokoroReady = true;
    console.log("[TTS] Kokoro bereit");
  } catch (err) {
    kokoroFailed = true;
    console.warn(
      "[TTS] Kokoro nicht verfuegbar — Fallback auf MsEdgeTTS:",
      err instanceof Error ? err.message : String(err),
    );
  }
}

function float32ToWav(samples: Float32Array, sampleRate: number): Buffer {
  const numSamples = samples.length;
  const dataLen = numSamples * 2;
  const buf = Buffer.alloc(44 + dataLen);

  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + dataLen, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28); // byte rate (16-bit mono)
  buf.writeUInt16LE(2, 32); // block align
  buf.writeUInt16LE(16, 34); // bits per sample
  buf.write("data", 36);
  buf.writeUInt32LE(dataLen, 40);

  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(s < 0 ? s * 32768 : s * 32767), 44 + i * 2);
  }

  return buf;
}

export async function synthesizeKokoro(
  text: string,
  lang = "de",
): Promise<{ buffer: Buffer; contentType: string }> {
  if (!kokoroReady || !ttsInstance) {
    throw new Error("Kokoro nicht bereit");
  }
  // Voice is typed as a literal union in kokoro-js — cast through unknown
  const voice = (VOICE_MAP[lang] ?? VOICE_MAP["de"]) as Parameters<
    KokoroTTS["generate"]
  >[1] extends { voice?: infer V }
    ? V
    : never;
  const audio = await ttsInstance.generate(text, { voice });
  const buffer = float32ToWav(audio.audio as Float32Array, audio.sampling_rate);
  return { buffer, contentType: "audio/wav" };
}
