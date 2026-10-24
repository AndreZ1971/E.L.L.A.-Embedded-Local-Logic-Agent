import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import { getSettings, cloudAllowed, cloudFirst } from "./settings.js";
import { env } from "../config/env.js";
import { openaiRequest, CloudBlockedError } from "./openai.js";

const execAsync = promisify(exec);

// ffmpeg-static: lazy geladen damit kein Crash beim Start wenn Binary fehlt
let _ffmpegBin: string | null = null;
function getFfmpegBin(): string {
  if (!_ffmpegBin) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    _ffmpegBin = require("ffmpeg-static") as string;
  }
  return _ffmpegBin;
}

// Xenova-Typen — nur für Laufzeit-Cast, kein Top-Level-Import
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ASRPipeline = (audio: unknown, opts: unknown) => Promise<unknown>;

let _pipe: ASRPipeline | null = null;
let _loading: Promise<ASRPipeline> | null = null;

const MODEL = "Xenova/whisper-small";

export async function getWhisperPipeline(): Promise<ASRPipeline> {
  if (_pipe) return _pipe;
  if (_loading) return _loading;

  // @xenova/transformers lazy laden — nicht beim API-Start, nur wenn Whisper gebraucht wird
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { pipeline, env: xenv } = (await import("@xenova/transformers")) as any;
  xenv.cacheDir = "./whisper-cache";

  _loading = pipeline("automatic-speech-recognition", MODEL, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    progress_callback: (p: any) => {
      if (p.status === "downloading") {
        const pct = Math.round(p.progress ?? 0);
        process.stdout.write(`\r[WHISPER] Lade Modell: ${pct}%   `);
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }).then((p: any) => {
    _pipe = p as ASRPipeline;
    _loading = null;
    process.stdout.write("\n[WHISPER] Modell bereit.\n");
    return _pipe;
  });

  return _loading as Promise<ASRPipeline>;
}

// OpenAI Whisper API — wenn API-Key konfiguriert (whisper-1 ≈ large-v2, beste Genauigkeit)
async function transcribeOpenAI(audioBuffer: Buffer): Promise<string> {
  const form = new FormData();
  form.append(
    "file",
    new Blob([new Uint8Array(audioBuffer)], { type: "audio/webm" }),
    "audio.webm",
  );
  form.append("model", "whisper-1");
  form.append("language", "de");

  const res = await openaiRequest(
    "/v1/audio/transcriptions",
    { body: form, json: false },
    "transcription",
  );

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
      `"${getFfmpegBin()}" -y -i "${tmpInput}" -ar 16000 -ac 1 -f f32le -`,
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
  if (cloudFirst()) {
    try {
      return await transcribeOpenAI(audioBuffer);
    } catch (err) {
      if (err instanceof CloudBlockedError) {
        // Cloud blockiert — direkt zum lokalen Modell
      } else {
        // OpenAI-Fehler — Fallback auf lokales Modell
      }
    }
  }
  try {
    return await transcribeLocal(audioBuffer);
  } catch (err) {
    if (cloudAllowed()) {
      try {
        return await transcribeOpenAI(audioBuffer);
      } catch {
        // OpenAI-Fallback auch fehlgeschlagen
      }
    }
    const msg = err instanceof Error ? err.message : String(err);
    if (
      msg.includes("ERR_MODULE_NOT_FOUND") ||
      msg.includes("@xenova") ||
      msg.includes("Cannot find package")
    ) {
      const e = new Error(
        "Spracherkennung nicht verfügbar. Bitte einen OpenAI-Key in den Einstellungen eintragen.",
      ) as Error & { status?: number };
      e.status = 503;
      throw e;
    }
    throw err;
  }
}

export function isWhisperReady(): boolean {
  return _pipe !== null;
}

const ALIGN_PROMPT = `Du bist ein Sprachbefehl-Extraktor für ELLA (KI-Assistent).
Extrahiere aus dem Transkript NUR den Befehl des Nutzers.
Entferne: Stottern, Versprecher, Wiederholungen, Füllwörter (äh/ähm/also/halt/sozusagen), Musik-Lyrics, TV-Dialog, andere Stimmen.
Kein klarer Befehl erkennbar → antworte exakt: KEIN_BEFEHL
Antworte NUR mit dem bereinigten Befehl oder KEIN_BEFEHL. Keine Erklärung.

Beispiele:
"äh ella öffne öffne mal den Explorer" → Öffne den Explorer
"Bohemian Rhapsody is this the real life is this just fantasy" → KEIN_BEFEHL
"ella spiel mir was von Rammstein is this the real life" → Spiel mir was von Rammstein
"ella setze den wecker auf halb" → Setze den Wecker auf halb
"ich ich ich will wissen was auf Laufwerk H ist" → Was ist auf Laufwerk H

Transkript: `;

export async function contextAlign(rawText: string): Promise<string> {
  const trimmed = rawText.trim();
  if (trimmed.length < 3) return "";

  // Versuch 1: Ollama
  const model = getSettings().ollamaModel || "llama3.1:8b";
  try {
    const res = await fetch(`${env.ollamaBaseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt: ALIGN_PROMPT + trimmed,
        stream: false,
        options: { temperature: 0, num_predict: 120, num_ctx: 512 },
      }),
      signal: AbortSignal.timeout(8_000),
    });

    if (res.ok) {
      const data = (await res.json()) as { response?: string };
      const aligned = (data.response ?? "").trim();
      if (!aligned || aligned === "KEIN_BEFEHL") return "";
      return aligned;
    }
  } catch {
    // Ollama offline oder Modell nicht geladen
  }

  // Versuch 2: OpenAI-Fallback (gpt-4o-mini — günstig + schnell)
  if (cloudAllowed()) {
    try {
      const res = await openaiRequest(
        "/v1/chat/completions",
        {
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: ALIGN_PROMPT + trimmed }],
            temperature: 0,
            max_tokens: 120,
          }),
        },
        "text",
      );

      if (res.ok) {
        const data = (await res.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const aligned = (data.choices?.[0]?.message?.content ?? "").trim();
        if (!aligned || aligned === "KEIN_BEFEHL") return "";
        return aligned;
      }
    } catch {
      // OpenAI-Fallback fehlgeschlagen
    }
  }

  return trimmed;
}
