import * as ort from "onnxruntime-node";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const execAsync = promisify(exec);
const _require = createRequire(import.meta.url);
const ffmpegBin: string = _require("ffmpeg-static");

const __dir = path.dirname(fileURLToPath(import.meta.url));
const MODEL_DIR = path.join(__dir, "../../wakeword-models");

const MEL_PATH = path.join(MODEL_DIR, "melspectrogram.onnx");
const EMB_PATH = path.join(MODEL_DIR, "embedding_model.onnx");
const ELLA_PATH = path.join(MODEL_DIR, "ella.onnx");

// Pipeline constants (verified against Python embed_clips output)
const TARGET_SR = 16000;
const AUDIO_SAMPLES = 20480; // 1.28s at 16kHz
const MEL_WIN = 76; // embedding model window size
const MEL_STRIDE = 8; // stride between windows
const N_EMB = 7; // embeddings per inference = (125 - 76) / 8 + 1

let melSess: ort.InferenceSession | null = null;
let embSess: ort.InferenceSession | null = null;
let ellaSess: ort.InferenceSession | null = null;

export function isWakewordAvailable(): boolean {
  try {
    return require("fs").existsSync(ELLA_PATH);
  } catch {
    return false;
  }
}

export async function loadWakewordModels(): Promise<void> {
  if (!isWakewordAvailable()) {
    console.log("[WAKEWORD] Kein Modell — Wakeword-Erkennung deaktiviert");
    return;
  }
  const opts: ort.InferenceSession.SessionOptions = {
    executionProviders: ["cpu"],
  };
  [melSess, embSess, ellaSess] = await Promise.all([
    ort.InferenceSession.create(MEL_PATH, opts),
    ort.InferenceSession.create(EMB_PATH, opts),
    ort.InferenceSession.create(ELLA_PATH, opts),
  ]);
  console.log("[WAKEWORD] Modelle geladen ✓");
}

export async function detectWakeword(
  audioBuffer: Buffer,
): Promise<{ detected: boolean; score: number }> {
  if (!melSess || !embSess || !ellaSess) return { detected: false, score: 0 };

  const tmpFile = path.join(os.tmpdir(), `wakeword-${Date.now()}.wav`);
  try {
    await fs.writeFile(tmpFile, audioBuffer);

    // Convert to 16kHz float32 PCM via ffmpeg
    const { stdout: pcm } = await execAsync(
      `"${ffmpegBin}" -y -i "${tmpFile}" -ar ${TARGET_SR} -ac 1 -f f32le -`,
      { encoding: "buffer", maxBuffer: 5 * 1024 * 1024, timeout: 10000 },
    );

    const audioF32 = new Float32Array(
      pcm.buffer,
      pcm.byteOffset,
      pcm.byteLength / 4,
    );
    if (audioF32.length < AUDIO_SAMPLES / 2) return { detected: false, score: 0 };

    // Pad or trim to exactly AUDIO_SAMPLES
    const audio = new Float32Array(AUDIO_SAMPLES);
    audio.set(audioF32.slice(0, Math.min(audioF32.length, AUDIO_SAMPLES)));

    // Step 1: mel spectrogram [1, AUDIO_SAMPLES] → [1, 1, 125, 32]
    const audioTensor = new ort.Tensor("float32", audio, [1, AUDIO_SAMPLES]);
    const melResult = await melSess.run({ input: audioTensor });
    const melData = melResult["output"].data as Float32Array;
    // Shape is [1, 1, 125, 32] → extract [125, 32] as flat
    const melFrames = 125;
    const melBins = 32;
    // melData layout: [time=1, ch=1, frames=125, bins=32]

    // Step 2: create N_EMB sliding windows [N_EMB, 76, 32, 1]
    const windowSize = MEL_WIN * melBins; // 76*32 = 2432 floats per window
    const windowData = new Float32Array(N_EMB * MEL_WIN * melBins * 1);
    for (let w = 0; w < N_EMB; w++) {
      const frameStart = w * MEL_STRIDE;
      for (let f = 0; f < MEL_WIN; f++) {
        const srcIdx = (frameStart + f) * melBins;
        const dstIdx = w * windowSize + f * melBins;
        windowData.set(melData.slice(srcIdx, srcIdx + melBins), dstIdx);
      }
    }
    const windowTensor = new ort.Tensor("float32", windowData, [
      N_EMB,
      MEL_WIN,
      melBins,
      1,
    ]);

    // Step 3: embedding model [N_EMB, 76, 32, 1] → [N_EMB, 1, 1, 96]
    const embResult = await embSess.run({ input_1: windowTensor });
    const embData = embResult["conv2d_19"].data as Float32Array;
    // Shape [N_EMB, 1, 1, 96] → flatten to [N_EMB, 96]
    const embDim = 96;
    const embFlat = new Float32Array(N_EMB * embDim);
    for (let i = 0; i < N_EMB; i++) {
      embFlat.set(embData.slice(i * embDim, (i + 1) * embDim), i * embDim);
    }

    // Step 4: ella classifier [1, N_EMB, 96] → [1, 1]
    const ellaTensor = new ort.Tensor("float32", embFlat, [1, N_EMB, embDim]);
    const ellaResult = await ellaSess.run({ x: ellaTensor });
    const score = (ellaResult["ella"].data as Float32Array)[0];

    return { detected: score > 0.5, score };
  } finally {
    await fs.unlink(tmpFile).catch(() => {});
  }
}
