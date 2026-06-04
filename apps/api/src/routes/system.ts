import { Router } from "express";
import { execSync } from "child_process";
import { pool } from "../config/database.js";
import { env } from "../config/env.js";
import { getDiskUsage } from "@ella/agent-tools";
import { getSettings } from "../services/settings.js";

export const systemRouter = Router();

// Pfad-Fragmente die NIE in Programmlisten erscheinen dürfen
export const BLOCKED_PATH_FRAGMENTS = [
  "\\windows\\",
  "\\system32\\",
  "\\syswow64\\",
  "\\winsxs\\",
  "\\microsoft.net\\",
  "\\windowsapps\\",
  "\\microsoftedgeupdate\\",
  "\\windowsdefender\\",
];

// Executable-Namen die NIE in Programmlisten erscheinen dürfen
export const BLOCKED_NAME_PATTERNS = [
  "uninstall",
  "uninst",
  "setup",
  "install",
  "installer",
  "updater",
  "update",
  "cleanup",
  "repair",
  "remove",
  "crash",
  "reporter",
];

systemRouter.get("/status", async (_req, res) => {
  const [ollama, db] = await Promise.all([
    fetch(`${env.ollamaBaseUrl}/api/tags`)
      .then((r) => r.ok)
      .catch(() => false),
    pool
      .execute("SELECT 1")
      .then(() => true)
      .catch(() => false),
  ]);

  res.json({
    ollama: { ok: ollama, url: env.ollamaBaseUrl },
    db: { ok: db },
  });
});

systemRouter.get("/disk", async (_req, res) => {
  const drives = ["C", "E", "Z"];
  const results = await Promise.all(
    drives.map((d) => getDiskUsage({ drive: d })),
  );
  res.json(Object.fromEntries(drives.map((d, i) => [d, results[i]])));
});

systemRouter.get("/programs", (_req, res) => {
  const { customProgramPaths } = getSettings();

  const blockedFragments = BLOCKED_PATH_FRAGMENTS.map(
    (f) => `'${f.replace(/\\/g, "\\\\")}'`,
  ).join(",");
  const blockedNames = BLOCKED_NAME_PATTERNS.map((n) => `'${n}'`).join(",");

  const extraPaths = customProgramPaths
    .map((p) => `'${p.replace(/'/g, "''")}'`)
    .join(",");

  const ps = `
$blockedFragments = @(${blockedFragments})
$blockedNames = @(${blockedNames})

$standardPaths = @(
  [Environment]::ExpandEnvironmentVariables('%ProgramFiles%'),
  [Environment]::ExpandEnvironmentVariables('%ProgramFiles(x86)%'),
  [Environment]::ExpandEnvironmentVariables('%LOCALAPPDATA%\\Programs'),
  [Environment]::ExpandEnvironmentVariables('%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs'),
  [Environment]::ExpandEnvironmentVariables('%ProgramData%\\Microsoft\\Windows\\Start Menu\\Programs')
)
${extraPaths ? `$extraPaths = @(${extraPaths})` : "$extraPaths = @()"}
$allPaths = $standardPaths + $extraPaths

$results = [System.Collections.Generic.List[PSCustomObject]]::new()
$seen = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
$shell = New-Object -ComObject WScript.Shell

foreach ($basePath in $allPaths) {
  if (-not (Test-Path $basePath -ErrorAction SilentlyContinue)) { continue }

  if ($basePath -like '*Start Menu*') {
    Get-ChildItem $basePath -Recurse -Filter '*.lnk' -ErrorAction SilentlyContinue | ForEach-Object {
      try {
        $lnk = $shell.CreateShortcut($_.FullName)
        $target = $lnk.TargetPath
        if (-not $target -or $target -notlike '*.exe') { return }
        $tLow = $target.ToLower()
        foreach ($b in $blockedFragments) { if ($tLow.Contains($b)) { return } }
        $nLow = [System.IO.Path]::GetFileNameWithoutExtension($target).ToLower()
        foreach ($bn in $blockedNames) { if ($nLow.Contains($bn)) { return } }
        if ($seen.Add($target)) {
          $results.Add([PSCustomObject]@{ name = $_.BaseName; command = $target })
        }
      } catch {}
    }
  } else {
    Get-ChildItem $basePath -Recurse -Depth 3 -Filter '*.exe' -ErrorAction SilentlyContinue | ForEach-Object {
      $fLow = $_.FullName.ToLower()
      foreach ($b in $blockedFragments) { if ($fLow.Contains($b)) { return } }
      $nLow = $_.BaseName.ToLower()
      foreach ($bn in $blockedNames) { if ($nLow.Contains($bn)) { return } }
      if ($seen.Add($_.FullName)) {
        $results.Add([PSCustomObject]@{ name = $_.BaseName; command = $_.FullName })
      }
    }
  }
}

$results | Sort-Object name | ConvertTo-Json -Compress -Depth 2
  `.trim();

  try {
    const encoded = Buffer.from(ps, "utf16le").toString("base64");
    const raw = execSync(
      `powershell -NoProfile -NonInteractive -EncodedCommand ${encoded}`,
      { timeout: 20_000 },
    ).toString();
    const parsed = JSON.parse(raw || "[]");
    const list = Array.isArray(parsed) ? parsed : [parsed];
    res.json({ programs: list });
  } catch {
    res.json({ programs: [] });
  }
});
