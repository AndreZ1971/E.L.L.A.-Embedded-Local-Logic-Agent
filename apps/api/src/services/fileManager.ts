import { execSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const BLOCKED_PREFIXES = [
  "c:\\windows",
  "c:\\program files",
  "c:\\program files (x86)",
  "c:\\programdata\\microsoft",
  "c:\\users\\default",
];

const READABLE_EXTENSIONS = new Set([
  ".txt",
  ".log",
  ".md",
  ".csv",
  ".json",
  ".xml",
  ".yaml",
  ".yml",
  ".ini",
  ".cfg",
  ".conf",
  ".bat",
  ".ps1",
  ".py",
  ".js",
  ".ts",
  ".html",
  ".css",
  ".env",
  ".sh",
]);

const MAX_CONTENT_BYTES = 15_000;

function isBlocked(filePath: string): boolean {
  const lower = filePath.toLowerCase().replace(/\//g, "\\");
  return BLOCKED_PREFIXES.some((b) => lower.startsWith(b));
}

function runPs(script: string, timeoutMs = 15_000): string {
  const tmpFile = path.join(os.tmpdir(), `ella-fm-${Date.now()}.ps1`);
  try {
    fs.writeFileSync(tmpFile, script, "utf-8");
    return execSync(
      `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${tmpFile}"`,
      { timeout: timeoutMs, encoding: "utf-8" },
    ).trim();
  } finally {
    try {
      fs.unlinkSync(tmpFile);
    } catch {
      /* best effort */
    }
  }
}

export function readFileContent(filePath: string): {
  success: boolean;
  content?: string;
  truncated?: boolean;
  error?: string;
} {
  if (!fs.existsSync(filePath))
    return { success: false, error: `Datei nicht gefunden: ${filePath}` };

  const ext = path.extname(filePath).toLowerCase();

  if (READABLE_EXTENSIONS.has(ext)) {
    const raw = fs.readFileSync(filePath);
    const truncated = raw.length > MAX_CONTENT_BYTES;
    const content = raw.slice(0, MAX_CONTENT_BYTES).toString("utf-8");
    return { success: true, content, truncated };
  }

  if (ext === ".docx" || ext === ".doc") {
    const safe = filePath.replace(/'/g, "''");
    const ps = `
try {
  $word = New-Object -ComObject Word.Application
  $word.Visible = $false
  $doc = $word.Documents.Open('${safe}', [ref]$false, [ref]$true)
  $text = $doc.Content.Text
  $doc.Close($false) | Out-Null
  $word.Quit() | Out-Null
  Write-Output $text.Substring(0, [Math]::Min($text.Length, ${MAX_CONTENT_BYTES}))
} catch {
  Write-Error $_.Exception.Message
}`.trim();
    try {
      const content = runPs(ps);
      return { success: true, content, truncated: false };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  return {
    success: false,
    error: `Dateityp "${ext}" nicht unterstützt. Unterstützt: txt, log, md, csv, json, docx und viele mehr.`,
  };
}

export function renameFile(
  oldPath: string,
  newName: string,
): { success: boolean; newPath?: string; error?: string } {
  if (isBlocked(oldPath))
    return { success: false, error: "Systempfad ist gesperrt." };
  if (!fs.existsSync(oldPath))
    return { success: false, error: `Nicht gefunden: ${oldPath}` };

  const dir = path.dirname(oldPath);
  const newPath = path.join(dir, newName);
  try {
    fs.renameSync(oldPath, newPath);
    return { success: true, newPath };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function copyFile(
  srcPath: string,
  destPath: string,
): { success: boolean; error?: string } {
  if (isBlocked(destPath))
    return { success: false, error: "Ziel-Systempfad ist gesperrt." };
  if (!fs.existsSync(srcPath))
    return { success: false, error: `Quelle nicht gefunden: ${srcPath}` };

  try {
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      const safe = (p: string) => p.replace(/'/g, "''");
      runPs(
        `Copy-Item -Path '${safe(srcPath)}' -Destination '${safe(destPath)}' -Recurse -Force`,
        30_000,
      );
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function createFolder(folderPath: string): {
  success: boolean;
  error?: string;
} {
  if (isBlocked(folderPath))
    return { success: false, error: "Systempfad ist gesperrt." };
  try {
    fs.mkdirSync(folderPath, { recursive: true });
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
