import { execSync } from "child_process";
import * as fsSync from "fs";
import * as os from "os";
import * as path from "path";

const BLOCKED_PREFIXES = [
  "c:\\windows",
  "c:\\program files",
  "c:\\program files (x86)",
  "c:\\programdata\\microsoft",
  "c:\\users\\default",
];

function isBlockedPath(filePath: string): boolean {
  const lower = filePath.toLowerCase().replace(/\//g, "\\");
  return BLOCKED_PREFIXES.some((p) => lower.startsWith(p));
}

export function deleteToRecycleBin(filePath: string): {
  success: boolean;
  error?: string;
} {
  if (isBlockedPath(filePath)) {
    return {
      success: false,
      error: `Pfad "${filePath}" liegt in einem Systempfad und kann nicht gelöscht werden.`,
    };
  }

  const ps = `
Add-Type -AssemblyName Microsoft.VisualBasic
$p = '${filePath.replace(/'/g, "''")}'
if (!(Test-Path $p)) { Write-Error "Nicht gefunden: $p"; exit 1 }
if ((Get-Item $p) -is [System.IO.DirectoryInfo]) {
  [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteDirectory($p, 'OnlyErrorDialogs', 'SendToRecycleBin')
} else {
  [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile($p, 'OnlyErrorDialogs', 'SendToRecycleBin')
}
Write-Output "ok"`.trim();

  const tmp = path.join(os.tmpdir(), `ella-del-${Date.now()}.ps1`);
  try {
    fsSync.writeFileSync(tmp, ps, "utf-8");
    execSync(
      `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${tmp}"`,
      { encoding: "utf-8", timeout: 10_000 },
    );
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    try {
      fsSync.unlinkSync(tmp);
    } catch {
      /* best effort */
    }
  }
}
