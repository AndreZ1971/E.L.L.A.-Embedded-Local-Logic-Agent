import { spawn, ChildProcessWithoutNullStreams } from "child_process";
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
const ELLA_PATH = path.join(MODEL_DIR, "ella.onnx");
const SERVER_SCRIPT = path.join(
  __dir,
  "../../../../scripts/wakeword_server.py",
);

let pyProcess: ChildProcessWithoutNullStreams | null = null;
let ready = false;
let pendingResolves: Array<
  (result: { score: number; detected: boolean }) => void
> = [];
let lineBuffer = "";

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

  return new Promise((resolve, reject) => {
    pyProcess = spawn("py", ["-3.12", SERVER_SCRIPT], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    pyProcess.stderr.on("data", (d: Buffer) => {
      process.stdout.write("[WAKEWORD] " + d.toString().trimEnd() + "\n");
    });

    pyProcess.stdout.on("data", (d: Buffer) => {
      lineBuffer += d.toString();
      const lines = lineBuffer.split("\n");
      lineBuffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line) as {
            ready?: boolean;
            score?: number;
            detected?: boolean;
            error?: string;
          };

          if (msg.ready) {
            ready = true;
            resolve();
            return;
          }

          const resolver = pendingResolves.shift();
          if (resolver) {
            resolver({
              score: msg.score ?? 0,
              detected: msg.detected ?? false,
            });
          }
        } catch {
          // ignore parse errors
        }
      }
    });

    pyProcess.on("error", (err) => {
      console.error("[WAKEWORD] Prozess-Fehler:", err.message);
      reject(err);
    });

    pyProcess.on("exit", (code) => {
      if (!ready) reject(new Error(`Python exited with code ${code}`));
      ready = false;
      pyProcess = null;
    });

    setTimeout(() => {
      if (!ready) {
        reject(new Error("Wakeword server timeout"));
      }
    }, 30000);
  });
}

export async function detectWakeword(
  audioBuffer: Buffer,
): Promise<{ detected: boolean; score: number }> {
  if (!ready || !pyProcess) return { detected: false, score: 0 };

  const tmpFile = path.join(os.tmpdir(), `wakeword-${Date.now()}.wav`);
  try {
    await fs.writeFile(tmpFile, audioBuffer);

    // Convert to 16kHz float32 WAV
    const wavFile = tmpFile.replace(".wav", "_16k.wav");
    await execAsync(
      `"${ffmpegBin}" -y -i "${tmpFile}" -ar 16000 -ac 1 "${wavFile}"`,
      { timeout: 10000 },
    );

    return new Promise((resolve) => {
      pendingResolves.push(resolve);
      const req = JSON.stringify({ audio_path: wavFile }) + "\n";
      pyProcess!.stdin.write(req);

      // Timeout fallback
      setTimeout(() => {
        const idx = pendingResolves.indexOf(resolve);
        if (idx !== -1) {
          pendingResolves.splice(idx, 1);
          resolve({ detected: false, score: 0 });
        }
        fs.unlink(wavFile).catch(() => {});
      }, 5000);
    }).finally(() => {
      fs.unlink(tmpFile).catch(() => {});
      fs.unlink(wavFile).catch(() => {});
    }) as Promise<{ detected: boolean; score: number }>;
  } catch {
    await fs.unlink(tmpFile).catch(() => {});
    return { detected: false, score: 0 };
  }
}

export function stopWakewordServer(): void {
  if (pyProcess) {
    pyProcess.stdin.end();
    pyProcess.kill();
    pyProcess = null;
    ready = false;
  }
}
