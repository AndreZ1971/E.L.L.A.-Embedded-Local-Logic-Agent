import { pipeline, env as xenv } from "@xenova/transformers";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import { createRequire } from "module";
import { getSettings } from "./settings.js";
import { env } from "../config/env.js";

const execAsync = promisify(exec);

// ffmpeg-static liefert ffmpeg.exe gebündelt — kein System-Install nötig
const _require = createRequire(import.meta.url);
const ffmpegBin: string = _require("ffmpeg-static");

// Modell lokal im API-Verzeichnis cachen statt im globalen HuggingFace-Pfad
xenv.cacheDir = "./whisper-cache";

type ASRPipeline = Awaited<ReturnType<typeof pipeline>>;

let _pipe: ASRPipeline | null = null;
let _loading: Promise<ASRPipeline> | null = null;

// whisper-small: deutlich besser als base (~244 MB, einmalig geladen)
const MODEL = "Xenova/whisper-small";

export async function getWhisperPipeline(): Promise<ASRPipeline> {
  if (_pipe) return _pipe;
  if (_loading) return _loading;

  _loading = pipeline("automatic-speech-recognition", MODEL, {
    progress_callback: (p: { status: string; progress?: number }) => {
      if (p.status === "downloading") {
        const pct = Math.round(p.progress ?? 0);
        process.stdout.write(`\r[WHISPER] Lade Modell: ${pct}%   `);
      }
    },
  }).then((p) => {
    _pipe = p;
    _loading = null;
    process.stdout.write("\n[WHISPER] Modell bereit.\n");
    return p;
  });

  return _loading;
}

// OpenAI Whisper API — wenn API-Key konfiguriert (whisper-1 ≈ large-v2, beste Genauigkeit)
async function transcribeOpenAI(audioBuffer: Buffer): Promise<string> {
  const apiKey = getSettings().openaiApiKey || env.openaiApiKey;
  const form = new FormData();
  form.append(
    "file",
    new Blob([new Uint8Array(audioBuffer)], { type: "audio/webm" }),
    "audio.webm",
  );
  form.append("model", "whisper-1");
  form.append("language", "de");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) throw new Error(`OpenAI Whisper HTTP ${res.status}`);
  const data = (await res.json()) as { text: string };
  return (data.text ?? "").trim();
}

// Lokales Whisper (Xenova/whisper-small) — Fallback ohne API-Key
async function transcribeLocal(audioBuffer: Buffer): Promise<string> {
  const pipe = await getWhisperPipeline();

  const tmpInput = path.join(os.tmpdir(), `ella-audio-${Date.now()}.webm`);
  try {
    await fs.writeFile(tmpInput, audioBuffer);

    const { stdout: pcm } = await execAsync(
      `"${ffmpegBin}" -y -i "${tmpInput}" -ar 16000 -ac 1 -f f32le -`,
      { encoding: "buffer", maxBuffer: 10 * 1024 * 1024, timeout: 15000 },
    );

    const audioData = new Float32Array(
      pcm.buffer,
      pcm.byteOffset,
      pcm.byteLength / Float32Array.BYTES_PER_ELEMENT,
    );

    const result = (await (
      pipe as (a: Float32Array, o: unknown) => Promise<unknown>
    )(audioData, {
      language: "german",
      task: "transcribe",
    })) as { text: string } | Array<{ text: string }>;

    const text = Array.isArray(result) ? result[0]?.text : result.text;
    return (text ?? "").trim();
  } finally {
    await fs.unlink(tmpInput).catch(() => {});
  }
}

export async function transcribe(audioBuffer: Buffer): Promise<string> {
  const apiKey = getSettings().openaiApiKey || env.openaiApiKey;
  if (apiKey) {
    try {
      return await transcribeOpenAI(audioBuffer);
    } catch {
      // Fallback auf lokales Modell wenn OpenAI nicht erreichbar
    }
  }
  return transcribeLocal(audioBuffer);
}

export function isWhisperReady(): boolean {
  return _pipe !== null;
}
