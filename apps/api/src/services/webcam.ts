import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const execAsync = promisify(exec);

// ffmpeg-static: lazy geladen
let _ffmpegBin: string | null = null;
function getFfmpegBin(): string {
  if (!_ffmpegBin) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    _ffmpegBin = require("ffmpeg-static") as string;
  }
  return _ffmpegBin;
}

export interface CameraDevice {
  name: string;
  index: number;
}

function parseDshowVideoDevices(stderr: string): CameraDevice[] {
  const cameras: CameraDevice[] = [];
  let inVideoSection = false;
  for (const line of stderr.split(/\r?\n/)) {
    if (line.includes("DirectShow video devices")) {
      inVideoSection = true;
      continue;
    }
    if (line.includes("DirectShow audio devices")) break;
    if (!inVideoSection) continue;
    if (line.includes('"') && !line.includes("Alternative name")) {
      const m = line.match(/"([^"]+)"/);
      if (m) cameras.push({ name: m[1], index: cameras.length });
    }
  }
  return cameras;
}

/**
 * Listet verfügbare Webcams via DirectShow (Windows).
 * ffmpeg gibt Exit-Code 1 zurück (kein gültiger Input) — stderr wird dennoch ausgewertet.
 */
export async function listCameras(): Promise<CameraDevice[]> {
  const ffmpeg = getFfmpegBin();
  try {
    const { stderr } = await execAsync(
      `"${ffmpeg}" -list_devices true -f dshow -i dummy`,
      { timeout: 6000 },
    );
    return parseDshowVideoDevices(stderr);
  } catch (err) {
    // execAsync wirft wenn Exit-Code != 0 — stderr steckt im Error-Objekt
    const stderr = (err as { stderr?: string }).stderr ?? "";
    return parseDshowVideoDevices(stderr);
  }
}

/**
 * Nimmt ein Foto mit einer Webcam auf.
 * @param cameraName  DirectShow-Name; wenn leer: erste verfügbare Kamera
 * @param outputDir   Zielordner; Standard: %USERPROFILE%\Pictures\ELLA
 */
export async function capturePhoto(
  cameraName?: string,
  outputDir?: string,
): Promise<{ path: string; camera: string }> {
  const ffmpeg = getFfmpegBin();

  let camera = cameraName?.trim() ?? "";
  if (!camera) {
    const cams = await listCameras();
    if (cams.length === 0) throw new Error("Keine Webcam gefunden.");
    camera = cams[0].name;
  }

  const folder =
    outputDir?.trim() ||
    path.join(process.env["USERPROFILE"] ?? os.homedir(), "Pictures", "ELLA");
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outFile = path.join(folder, `photo_${timestamp}.jpg`);

  const safeCam = camera.replace(/"/g, '\\"');

  // -frames:v 1 = ein Frame; -loglevel quiet = kein stderr-Spam
  await execAsync(
    `"${ffmpeg}" -f dshow -i video="${safeCam}" -frames:v 1 -loglevel quiet -y "${outFile}"`,
    { timeout: 12_000 },
  );

  if (!fs.existsSync(outFile)) {
    throw new Error(`Foto konnte nicht gespeichert werden: ${outFile}`);
  }

  return { path: outFile, camera };
}
