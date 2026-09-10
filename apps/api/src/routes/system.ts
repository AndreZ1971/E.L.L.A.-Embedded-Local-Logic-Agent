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

# Quelle 3: Uninstall-Registry (findet Programme ohne Start-Menu-Eintrag)
$skipPattern = 'Update for|Security Update|Hotfix|KB\d{6}|Microsoft VC |Visual C\+\+|\.NET Framework|DirectX|Windows SDK|Runtime|Redistributable|Language Pack|Driver|MUI Pack'
$uninstPaths = @(
  'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*',
  'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*',
  'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*'
)
foreach ($regGlob in $uninstPaths) {
  Get-ItemProperty $regGlob -ErrorAction SilentlyContinue | Where-Object {
    $_.DisplayName -and -not $_.SystemComponent -and ($_.WindowsInstaller -ne 1)
  } | ForEach-Object {
    $displayName = $_.DisplayName.Trim()
    if ($displayName -match $skipPattern) { return }
    $nameLow = $displayName.ToLower()
    $skip = $false
    foreach ($b in $blockedNames) { if ($nameLow.Contains($b)) { $skip = $true; break } }
    if ($skip) { return }
    $exe = $null
    if ($_.InstallLocation -and (Test-Path $_.InstallLocation)) {
      $found = Get-ChildItem $_.InstallLocation -Filter '*.exe' -Depth 1 -ErrorAction SilentlyContinue |
        Where-Object { $_.BaseName -notmatch 'uninstall|uninst|setup|install|update|help|readme|repair|remove|crash|report|diagnos|troubleshoot' } |
        Select-Object -First 1
      if ($found) { $exe = $found.FullName }
    }
    if (-not $exe -and $_.DisplayIcon) {
      $iconPath = ($_.DisplayIcon -replace ',\s*-?\d+$','').Trim('"')
      if ($iconPath -like '*.exe' -and (Test-Path $iconPath)) { $exe = $iconPath }
    }
    if (-not $exe) { return }
    $exeLow = $exe.ToLower()
    if ($exeLow -match '\\windows\\|\\system32\\|\\syswow64\\|\\winsxs\\|\\windowsapps\\') { return }
    $baseLow = [System.IO.Path]::GetFileNameWithoutExtension($exeLow)
    $skip2 = $false
    foreach ($b in $blockedNames) { if ($baseLow.Contains($b)) { $skip2 = $true; break } }
    if ($skip2) { return }
    if ($seen.Add($exe)) {
      $results.Add([PSCustomObject]@{ name = $displayName; command = $exe })
    }
  }
}

# Quelle 4: %LOCALAPPDATA%\Programs (Slack, Discord, VS Code, Cursor, Signal, ...)
$localApps = [Environment]::GetFolderPath('LocalApplicationData') + '\Programs'
if (Test-Path $localApps) {
  Get-ChildItem $localApps -Filter '*.exe' -Depth 3 -ErrorAction SilentlyContinue | ForEach-Object {
    $nameLow = $_.BaseName.ToLower()
    foreach ($b in $blockedNames) { if ($nameLow.Contains($b)) { return } }
    if ($_.FullName.ToLower() -match '\\windows\\|\\system32\\|\\syswow64\\') { return }
    if ($seen.Add($_.FullName)) {
      $results.Add([PSCustomObject]@{ name = $_.BaseName; command = $_.FullName })
    }
  }
}

# Quelle 5: Benutzerdefinierte Pfade
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

    // Programme die der Nutzer explizit deaktiviert hat merken wir uns
    const explicitlyDenied = new Set(
      existingApps.filter((a) => !a.allowed).map((a) => a.name.toLowerCase()),
    );

    const fresh = runProgramScan(customProgramPaths);

    const merged: AppEntry[] = fresh.map((p) => ({
      name: p.name,
      command: p.command,
      // Neu gefundene Programme sind standardmäßig erlaubt —
      // außer der Nutzer hat dieses Programm zuvor bewusst deaktiviert
      allowed: !explicitlyDenied.has(p.name.toLowerCase()),
    }));

    await saveSettings({ apps: merged });
    res.json({ ok: true, total: merged.length });
  } catch (err) {
    next(err);
  }
});

// Suche nach einem Programm anhand seines Namens
systemRouter.post("/find-program", (req, res) => {
  const query = (
    ((req.body as Record<string, unknown>)?.query as string) ?? ""
  ).trim();
  if (!query || query.length < 2) {
    res.json({ results: [] });
    return;
  }

  const safeQuery = query.replace(/['"\\`]/g, "");
  const searchScript = `
$ErrorActionPreference = 'SilentlyContinue'
$query = '${safeQuery}'
$results = [System.Collections.Generic.List[PSCustomObject]]::new()
$seen = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)

$blockedNames = @('uninstall','uninst','setup','install','installer','updater','update','cleanup','repair','remove','crash','reporter')

$searchRoots = @(
  [Environment]::GetFolderPath('ProgramFiles'),
  [Environment]::GetFolderPath('ProgramFilesX86'),
  [Environment]::GetFolderPath('LocalApplicationData'),
  [Environment]::GetFolderPath('ApplicationData'),
  [System.IO.Path]::Combine([Environment]::GetFolderPath('LocalApplicationData'), 'Programs')
) | Sort-Object -Unique

foreach ($root in $searchRoots) {
  if (-not (Test-Path $root)) { continue }
  Get-ChildItem $root -Filter "*${query}*.exe" -Recurse -Depth 4 -ErrorAction SilentlyContinue |
    Where-Object {
      $path = $_.FullName.ToLower()
      $base = $_.BaseName.ToLower()
      $path -notmatch '\\\\windows\\\\|\\\\system32\\\\|\\\\syswow64\\\\|\\\\winsxs\\\\' -and
      -not ($blockedNames | Where-Object { $base.Contains($_) })
    } |
    ForEach-Object {
      if ($seen.Add($_.FullName)) {
        $results.Add([PSCustomObject]@{ name = $_.BaseName; command = $_.FullName })
      }
    }
}

if ($results.Count -eq 0) { Write-Output '[]' }
else { $results | Select-Object -First 20 | ConvertTo-Json -Compress -Depth 2 }
`.trim();

  const tmpFile = path.join(os.tmpdir(), `ella-find-${Date.now()}.ps1`);
  try {
    fs.writeFileSync(tmpFile, searchScript, "utf-8");
    const raw = execSync(
      `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${tmpFile}"`,
      { timeout: 15_000, encoding: "utf-8" },
    ).trim();

    if (!raw || raw === "[]") {
      res.json({ results: [] });
      return;
    }
    const parsed = JSON.parse(raw) as unknown;
    const list = (Array.isArray(parsed) ? parsed : [parsed]) as Array<{
      name: string;
      command: string;
    }>;
    res.json({ results: list });
  } catch {
    res.json({ results: [] });
  } finally {
    try {
      fs.unlinkSync(tmpFile);
    } catch {
      /* best effort */
    }
  }
});

// Programm manuell zur Liste hinzufügen
systemRouter.post("/add-program", async (req, res, next) => {
  try {
    const body = req.body as Record<string, unknown>;
    const name = ((body?.name as string) ?? "").trim();
    const command = ((body?.command as string) ?? "").trim();
    if (!name || !command) {
      res
        .status(400)
        .json({ ok: false, error: "name und command erforderlich" });
      return;
    }
    const { apps } = getSettings();
    const exists = apps.some(
      (a) => a.name.toLowerCase() === name.toLowerCase(),
    );
    if (exists) {
      // Bereits vorhanden — als allowed markieren
      await saveSettings({
        apps: apps.map((a) =>
          a.name.toLowerCase() === name.toLowerCase()
            ? { ...a, allowed: true }
            : a,
        ),
      });
    } else {
      await saveSettings({ apps: [...apps, { name, command, allowed: true }] });
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
