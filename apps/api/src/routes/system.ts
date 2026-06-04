import { Router } from "express";
import { execSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { pool } from "../config/database.js";
import { env } from "../config/env.js";
import { getDiskUsage } from "@ella/agent-tools";
import { getSettings, saveSettings } from "../services/settings.js";
import type { AppEntry } from "../services/settings.js";

export const systemRouter = Router();

// Pfad-Fragmente die NIE in Programmlisten erscheinen dürfen (für open_app Validierung)
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

// ── Shared Scanner-Logik ────────────────────────────────────────────────────

function buildScanScript(customProgramPaths: string[]): string {
  const customPathsPs =
    customProgramPaths.length > 0
      ? `@(${customProgramPaths.map((p) => `'${p.replace(/'/g, "''")}'`).join(",")})`
      : "@()";

  return `
$ErrorActionPreference = 'SilentlyContinue'

$blockedNames = @(
  'uninstall','uninst','setup','install','installer',
  'updater','update','cleanup','repair','remove',
  'help','hilfe','readme','release notes','what',
  'crash','reporter','diagnostics','troubleshoot'
)

$seen    = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
$results = [System.Collections.Generic.List[PSCustomObject]]::new()
$shell   = New-Object -ComObject WScript.Shell

# Quelle 1: Start Menu Shortcuts
$startPaths = @(
  [Environment]::GetFolderPath('CommonPrograms'),
  [Environment]::GetFolderPath('Programs')
)

foreach ($base in $startPaths) {
  if (-not (Test-Path $base)) { continue }
  Get-ChildItem $base -Recurse -Filter '*.lnk' -ErrorAction SilentlyContinue |
    Where-Object { $_.BaseName -notmatch 'uninstall|uninst|setup|install|update|help|readme|repair|remove|crash|report|diagnos|troubleshoot' } |
    ForEach-Object {
      try {
        $lnk    = $shell.CreateShortcut($_.FullName)
        $target = $lnk.TargetPath
        if (-not $target -or $target -notlike '*.exe') { return }
        $tLow = $target.ToLower()
        if ($tLow -match '\\\\windows\\\\|\\\\system32\\\\|\\\\syswow64\\\\|\\\\winsxs\\\\') { return }
        $baseName = [System.IO.Path]::GetFileNameWithoutExtension($target).ToLower()
        foreach ($b in $blockedNames) { if ($baseName.Contains($b)) { return } }
        $displayName = $_.BaseName.Trim()
        if ($seen.Add($target)) {
          $results.Add([PSCustomObject]@{ name = $displayName; command = $target })
        }
      } catch {}
    }
}

# Quelle 2: App Paths Registry
$regPath = 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths'
if (Test-Path $regPath) {
  Get-ChildItem $regPath -ErrorAction SilentlyContinue | ForEach-Object {
    try {
      $exeName = [System.IO.Path]::GetFileNameWithoutExtension($_.PSChildName).ToLower()
      foreach ($b in $blockedNames) { if ($exeName.Contains($b)) { return } }
      $target = (Get-ItemProperty $_.PSPath).'(default)' -as [string]
      if (-not $target -or $target -notlike '*.exe') { return }
      $tLow = $target.ToLower()
      if ($tLow -match '\\\\windows\\\\|\\\\system32\\\\|\\\\syswow64\\\\') { return }
      $displayName = [System.IO.Path]::GetFileNameWithoutExtension($_.PSChildName)
      if ($seen.Add($target)) {
        $results.Add([PSCustomObject]@{ name = $displayName; command = $target })
      }
    } catch {}
  }
}

# Quelle 3: Benutzerdefinierte Pfade
$customPaths = ${customPathsPs}
foreach ($customBase in $customPaths) {
  if (-not (Test-Path $customBase)) { continue }
  Get-ChildItem $customBase -Filter '*.exe' -Depth 2 -ErrorAction SilentlyContinue | ForEach-Object {
    $nameLow = $_.BaseName.ToLower()
    foreach ($b in $blockedNames) { if ($nameLow.Contains($b)) { return } }
    if ($seen.Add($_.FullName)) {
      $results.Add([PSCustomObject]@{ name = $_.BaseName; command = $_.FullName })
    }
  }
}

if ($results.Count -eq 0) { Write-Output '[]' }
else { $results | Sort-Object name | ConvertTo-Json -Compress -Depth 2 }
`.trim();
}

function runProgramScan(
  customProgramPaths: string[],
): Array<{ name: string; command: string }> {
  const ps = buildScanScript(customProgramPaths);
  // Script in Temp-Datei schreiben — umgeht CMD-Zeilenlimit von ~8191 Zeichen
  const tmpFile = path.join(os.tmpdir(), `ella-scan-${Date.now()}.ps1`);
  try {
    fs.writeFileSync(tmpFile, ps, "utf-8");
    const raw = execSync(
      `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${tmpFile}"`,
      { timeout: 20_000, encoding: "utf-8" },
    ).trim();

    if (!raw || raw === "[]") return [];
    const parsed = JSON.parse(raw) as unknown;
    const list = Array.isArray(parsed) ? parsed : [parsed];
    return list as Array<{ name: string; command: string }>;
  } finally {
    try {
      fs.unlinkSync(tmpFile);
    } catch {
      // best effort cleanup
    }
  }
}

// ── Routes ──────────────────────────────────────────────────────────────────

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
  res.json({ ollama: { ok: ollama, url: env.ollamaBaseUrl }, db: { ok: db } });
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
  try {
    const list = runProgramScan(customProgramPaths);
    res.json({ programs: list, total: list.length });
  } catch {
    res.json({ programs: [], total: 0 });
  }
});

systemRouter.post("/scan-programs", async (_req, res, next) => {
  try {
    const { apps: existingApps, customProgramPaths } = getSettings();
    const existingAllowed = new Map(
      existingApps
        .filter((a) => a.allowed)
        .map((a) => [a.name.toLowerCase(), a]),
    );

    const fresh = runProgramScan(customProgramPaths);

    const merged: AppEntry[] = fresh.map((p) => ({
      name: p.name,
      command: p.command,
      allowed: existingAllowed.has(p.name.toLowerCase()),
    }));

    await saveSettings({ apps: merged });
    res.json({ ok: true, total: merged.length });
  } catch (err) {
    next(err);
  }
});
