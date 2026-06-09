import { execSync, spawn } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const AUDIO_EXTENSIONS = [
  "*.mp3",
  "*.flac",
  "*.aac",
  "*.wav",
  "*.m4a",
  "*.ogg",
  "*.wma",
  "*.opus",
];

export interface MusicSearchResult {
  path: string;
  title: string;
  isFolder: boolean;
}

export function searchMusic(
  libraryPath: string,
  query: string,
): MusicSearchResult | null {
  try {
    const ext = AUDIO_EXTENSIONS.map((e) => `'${e}'`).join(",");
    const safeLib = libraryPath.replace(/'/g, "''");
    const safeQuery = query.replace(/'/g, "''");

    const ps = `
$lib   = '${safeLib}'.TrimEnd('\\')
$query = '${safeQuery}'
$ext   = @(${ext})

$folder = Get-ChildItem $lib -Directory -Recurse -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -like "*$query*" } |
  Select-Object -First 1

if ($folder) {
  [PSCustomObject]@{ path = $folder.FullName; title = $folder.Name; isFolder = $true } |
    ConvertTo-Json -Compress
  exit
}

# "$lib\\*" behebt PS-Bug: ohne \\* werden Dateien direkt im Root-Ordner uebergangen
$file = Get-ChildItem "$lib\\*" -Recurse -Include $ext -ErrorAction SilentlyContinue |
  Where-Object { $_.BaseName -like "*$query*" } |
  Select-Object -First 1

if ($file) {
  [PSCustomObject]@{ path = $file.FullName; title = $file.BaseName; isFolder = $false } |
    ConvertTo-Json -Compress
  exit
}

Write-Output 'null'
`.trim();

    // Temp-Datei statt EncodedCommand (vermeidet CMD-Zeilenlimit)
    const tmpFile = path.join(os.tmpdir(), `ella-music-${Date.now()}.ps1`);
    try {
      fs.writeFileSync(tmpFile, ps, "utf-8");
      const out = execSync(
        `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${tmpFile}"`,
        { encoding: "utf-8", timeout: 45_000 },
      ).trim();

      if (!out || out === "null") return null;
      return JSON.parse(out) as MusicSearchResult;
    } finally {
      try {
        fs.unlinkSync(tmpFile);
      } catch {
        // best effort
      }
    }
  } catch {
    return null;
  }
}

export function openWithPlayer(
  playerCommand: string,
  targetPath: string,
): void {
  spawn(playerCommand, [targetPath], {
    detached: true,
    stdio: "ignore",
  }).unref();
}
