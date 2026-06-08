import { execSync } from "child_process";
import { createRequire } from "module";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import TurndownService from "turndown";

const _require = createRequire(import.meta.url);
const pdfParse = _require("pdf-parse") as (
  buffer: Buffer,
) => Promise<{ text: string }>;

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
  ".css",
  ".env",
  ".sh",
]);

const RICH_EXTENSIONS = new Set([
  ".docx",
  ".doc",
  ".pdf",
  ".xlsx",
  ".xls",
  ".html",
  ".htm",
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

function truncate(text: string): { content: string; truncated: boolean } {
  const truncated = text.length > MAX_CONTENT_BYTES;
  return { content: text.slice(0, MAX_CONTENT_BYTES), truncated };
}

async function convertDocx(filePath: string): Promise<string> {
  const result = await mammoth.convertToHtml({ path: filePath });
  const td = new TurndownService({
    headingStyle: "atx",
    bulletListMarker: "-",
  });
  return td.turndown(result.value);
}

async function convertPdf(filePath: string): Promise<string> {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return data.text;
}

function convertExcel(filePath: string): string {
  const wb = XLSX.readFile(filePath);
  const parts: string[] = [];
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
      header: 1,
    }) as unknown[][];
    if (rows.length === 0) continue;
    const headers = (rows[0] as unknown[]).map((c) => String(c ?? ""));
    parts.push(`## ${sheetName}\n`);
    parts.push("| " + headers.join(" | ") + " |");
    parts.push("| " + headers.map(() => "---").join(" | ") + " |");
    for (const row of rows.slice(1) as unknown[][]) {
      const cells = headers.map((_, i) => String((row as unknown[])[i] ?? ""));
      parts.push("| " + cells.join(" | ") + " |");
    }
    parts.push("");
  }
  return parts.join("\n");
}

function convertHtml(filePath: string): string {
  const raw = fs.readFileSync(filePath, "utf-8");
  const td = new TurndownService({
    headingStyle: "atx",
    bulletListMarker: "-",
  });
  return td.turndown(raw);
}

export async function readFileContent(filePath: string): Promise<{
  success: boolean;
  content?: string;
  truncated?: boolean;
  error?: string;
}> {
  if (!fs.existsSync(filePath))
    return { success: false, error: `Datei nicht gefunden: ${filePath}` };

  const ext = path.extname(filePath).toLowerCase();

  if (READABLE_EXTENSIONS.has(ext)) {
    const raw = fs.readFileSync(filePath);
    const truncated = raw.length > MAX_CONTENT_BYTES;
    const content = raw.slice(0, MAX_CONTENT_BYTES).toString("utf-8");
    return { success: true, content, truncated };
  }

  if (RICH_EXTENSIONS.has(ext)) {
    try {
      let raw: string;
      if (ext === ".docx" || ext === ".doc") raw = await convertDocx(filePath);
      else if (ext === ".pdf") raw = await convertPdf(filePath);
      else if (ext === ".xlsx" || ext === ".xls") raw = convertExcel(filePath);
      else raw = convertHtml(filePath);

      const { content, truncated } = truncate(raw);
      return { success: true, content, truncated };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  return {
    success: false,
    error: `Dateityp "${ext}" nicht unterstützt. Unterstützt: txt, log, md, csv, json, docx, pdf, xlsx, html und viele mehr.`,
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
