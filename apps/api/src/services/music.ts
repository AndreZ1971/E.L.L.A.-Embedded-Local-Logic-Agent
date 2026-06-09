import { execSync, spawn } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const AUDIO_EXTENSIONS_GLOB = [
  "*.mp3",
  "*.flac",
  "*.aac",
  "*.wav",
  "*.m4a",
  "*.ogg",
  "*.wma",
  "*.opus",
];

const AUDIO_EXTENSIONS_DOT = [
  ".mp3",
  ".flac",
  ".aac",
  ".wav",
  ".m4a",
  ".ogg",
  ".wma",
  ".opus",
];

export interface MusicSearchResult {
  path: string;
  title: string;
  isFolder: boolean;
}

// Sucht in einem einzelnen Pfad — WSI zuerst, GCI-Fallback mit Tiefenlimit
function searchInPath(
  libraryPath: string,
  query: string,
): MusicSearchResult | null {
  const extGlob = AUDIO_EXTENSIONS_GLOB.map((e) => `'${e}'`).join(",");
  const extSql = AUDIO_EXTENSIONS_DOT.map((e) => `'${e}'`).join(",");
  const safeLib = libraryPath.replace(/\\/g, "/").replace(/\/+$/, "");
  const safeQuery = query.replace(/'/g, "''");

  const ps = `
$libPs   = '${safeLib.replace(/\//g, "\\\\")}'
$libWsi  = '${safeLib}/'
$query   = '${safeQuery}'
$extGlob = @(${extGlob})
$extSql  = '${extSql}'

# ── Windows Search Index ──────────────────────────────────────────────────────
try {
  Add-Type -AssemblyName System.Data -ErrorAction Stop
  $conn = New-Object System.Data.OleDb.OleDbConnection(
    "Provider=Search.CollatorDSO;Extended Properties='Application=Windows'")
  $conn.Open()
  $cmd = $conn.CreateCommand(); $cmd.CommandTimeout = 10

  $cmd.CommandText = "SELECT TOP 1 System.ItemPathDisplay FROM SystemIndex WHERE SCOPE='file:$libWsi' AND System.Kind = 'folder' AND System.FileName LIKE '%$query%'"
  $r = $cmd.ExecuteReader()
  if ($r.Read()) {
    $p = [string]$r[0]; $r.Close(); $conn.Close()
    [PSCustomObject]@{ path=$p; title=[System.IO.Path]::GetFileName($p); isFolder=$true } | ConvertTo-Json -Compress
    exit
  }
  $r.Close()

  $cmd.CommandText = "SELECT TOP 1 System.ItemPathDisplay FROM SystemIndex WHERE SCOPE='file:$libWsi' AND System.FileExtension IN ($extSql) AND System.FileName LIKE '%$query%'"
  $r2 = $cmd.ExecuteReader()
  if ($r2.Read()) {
    $p = [string]$r2[0]; $r2.Close(); $conn.Close()
    [PSCustomObject]@{ path=$p; title=[System.IO.Path]::GetFileNameWithoutExtension($p); isFolder=$false } | ConvertTo-Json -Compress
    exit
  }
  $r2.Close(); $conn.Close()
} catch {}

# ── GCI-Fallback: Tiefe 4 — kein voller Rekursiv-Scan ────────────────────────
$folder = Get-ChildItem $libPs -Directory -Depth 4 -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -like "*$query*" } | Select-Object -First 1
if ($folder) {
  [PSCustomObject]@{ path=$folder.FullName; title=$folder.Name; isFolder=$true } | ConvertTo-Json -Compress
  exit
}

$file = Get-ChildItem $libPs -Recurse -Depth 4 -Include $extGlob -ErrorAction SilentlyContinue |
  Where-Object { $_.BaseName -like "*$query*" } | Select-Object -First 1
if ($file) {
  [PSCustomObject]@{ path=$file.FullName; title=$file.BaseName; isFolder=$false } | ConvertTo-Json -Compress
  exit
}

Write-Output 'null'
`.trim();

  const tmpFile = path.join(os.tmpdir(), `ella-music-${Date.now()}.ps1`);
  try {
    fs.writeFileSync(tmpFile, ps, "utf-8");
    const out = execSync(
      `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${tmpFile}"`,
      { encoding: "utf-8", timeout: 30_000 },
    ).trim();

    if (!out || out === "null") return null;
    return JSON.parse(out) as MusicSearchResult;
  } finally {
    try {
      fs.unlinkSync(tmpFile);
    } catch {
      /* best effort */
    }
  }
}

// Durchsucht alle konfigurierten Pfade — gibt erstes Ergebnis zurück
export function searchMusic(
  primaryPath: string,
  query: string,
  extraPaths: string[] = [],
): MusicSearchResult | null {
  const allPaths = [primaryPath, ...extraPaths].filter(
    (p, i, arr) => p.trim() !== "" && arr.indexOf(p) === i,
  );

  for (const libPath of allPaths) {
    try {
      const result = searchInPath(libPath, query);
      if (result) return result;
    } catch {
      // Nächsten Pfad versuchen
    }
  }
  return null;
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
