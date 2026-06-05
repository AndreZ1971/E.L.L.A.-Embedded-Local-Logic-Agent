import { execSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

export interface DuplicateGroup {
  hash: string;
  size: number;
  files: string[];
  wastedMB: number;
}

export function findDuplicates(
  drives: string[] = ["C", "E", "H"],
): DuplicateGroup[] {
  const driveList = drives.map((d) => `'${d}:\\'`).join(",");

  const ps = `
$drives = @(${driveList})
$files  = @{}
foreach ($drive in $drives) {
  if (-not (Test-Path $drive)) { continue }
  Get-ChildItem $drive -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object {
      $_.Length -gt 100KB -and
      $_.FullName -notmatch '\\\\windows\\\\|\\\\system32\\\\|\\\\appdata\\\\'
    } |
    ForEach-Object {
      $key = "$($_.Length)_$($_.Name)"
      if (-not $files[$key]) { $files[$key] = [System.Collections.Generic.List[string]]::new() }
      $files[$key].Add($_.FullName)
    }
}
$dupes = $files.GetEnumerator() | Where-Object { $_.Value.Count -gt 1 }
$results = $dupes | ForEach-Object {
  $size = [long]($_.Key.Split('_')[0])
  [PSCustomObject]@{
    size   = $size
    files  = @($_.Value)
    wasted = [math]::Round($size * ($_.Value.Count - 1) / 1MB, 1)
  }
} | Sort-Object wasted -Descending | Select-Object -First 50
if ($results) { $results | ConvertTo-Json -Compress -Depth 3 }
else { Write-Output '[]' }`.trim();

  const tmp = path.join(os.tmpdir(), `ella-dupes-${Date.now()}.ps1`);
  try {
    fs.writeFileSync(tmp, ps, "utf-8");
    const out = execSync(
      `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${tmp}"`,
      { encoding: "utf-8", timeout: 60_000 },
    ).trim();

    const data = JSON.parse(out || "[]") as Array<{
      size: number;
      files: string[];
      wasted: number;
    }>;
    const arr = Array.isArray(data) ? data : [data];
    return arr.map((d, i) => ({
      hash: `dup_${i}`,
      size: d.size,
      files: d.files,
      wastedMB: d.wasted,
    }));
  } finally {
    try {
      fs.unlinkSync(tmp);
    } catch {
      // best effort
    }
  }
}
