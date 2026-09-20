import * as fs from "fs/promises";
import * as fsSync from "fs";
import * as path from "path";
import { pool } from "../config/database.js";
import { env } from "../config/env.js";
import { cosine } from "./memory.js";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import * as pdfParseModule from "pdf-parse";
const pdfParse =
  (
    pdfParseModule as unknown as {
      default: (buf: Buffer) => Promise<{ text: string }>;
    }
  ).default ??
  (pdfParseModule as unknown as (buf: Buffer) => Promise<{ text: string }>);

const EMBED_MODEL = "nomic-embed-text";
const CHUNK_SIZE = 1800;
const CHUNK_OVERLAP = 200;
const RECALL_LIMIT = 5;
const MIN_SCORE = 0.3;
const SUPPORTED_EXTENSIONS = new Set([".txt", ".md", ".docx", ".pdf", ".xlsx"]);

async function embed(text: string): Promise<number[] | null> {
  try {
    const r = await fetch(`${env.ollamaBaseUrl}/api/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: EMBED_MODEL, input: text }),
    });
    if (!r.ok) return null;
    const data = (await r.json()) as { embeddings?: number[][] };
    return data.embeddings?.[0] ?? null;
  } catch {
    return null;
  }
}

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    chunks.push(text.slice(start, end).trim());
    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return chunks.filter((c) => c.length > 50);
}

async function extractText(filePath: string): Promise<string | null> {
  const ext = path.extname(filePath).toLowerCase();
  try {
    if (ext === ".txt" || ext === ".md") {
      return await fs.readFile(filePath, "utf-8");
    }
    if (ext === ".docx") {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    }
    if (ext === ".pdf") {
      const buf = fsSync.readFileSync(filePath);
      const data = await pdfParse(buf);
      return data.text;
    }
    if (ext === ".xlsx") {
      const wb = XLSX.readFile(filePath);
      return wb.SheetNames.map((name) =>
        XLSX.utils.sheet_to_csv(wb.Sheets[name]),
      ).join("\n");
    }
    return null;
  } catch {
    return null;
  }
}

export async function indexFile(
  filePath: string,
  profileId: number | null = null,
): Promise<{ chunks: number; skipped: boolean }> {
  const ext = path.extname(filePath).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.has(ext)) return { chunks: 0, skipped: true };

  let stat: Awaited<ReturnType<typeof fs.stat>>;
  try {
    stat = await fs.stat(filePath);
  } catch {
    return { chunks: 0, skipped: true };
  }
  const mtime = stat.mtimeMs;

  // Schon indiziert und unverändert?
  const [existing] = await pool.execute<any[]>(
    "SELECT id, file_mtime FROM document_chunks WHERE file_path = ? LIMIT 1",
    [filePath],
  );
  if (existing.length > 0 && existing[0].file_mtime === mtime) {
    return { chunks: 0, skipped: true };
  }

  // Alte Chunks löschen (Datei wurde verändert)
  if (existing.length > 0) {
    await pool.execute("DELETE FROM document_chunks WHERE file_path = ?", [
      filePath,
    ]);
  }

  const text = await extractText(filePath);
  if (!text || text.trim().length < 50) return { chunks: 0, skipped: true };

  const chunks = chunkText(text);
  const filename = path.basename(filePath);
  let inserted = 0;

  for (let i = 0; i < chunks.length; i++) {
    const vec = await embed(chunks[i]);
    if (!vec) continue;
    await pool.execute(
      `INSERT INTO document_chunks
         (file_path, filename, file_type, chunk_index, chunk_text, embedding, file_mtime, profile_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        filePath,
        filename,
        ext.slice(1),
        i,
        chunks[i],
        JSON.stringify(vec),
        mtime,
        profileId,
      ],
    );
    inserted++;
  }

  return { chunks: inserted, skipped: false };
}

export async function indexFolder(
  folderPath: string,
  profileId: number | null = null,
): Promise<{
  indexed: number;
  chunks: number;
  skipped: number;
  errors: number;
}> {
  let allFiles: string[] = [];
  try {
    allFiles = await collectFiles(folderPath);
  } catch {
    return { indexed: 0, chunks: 0, skipped: 0, errors: 1 };
  }

  let indexed = 0,
    totalChunks = 0,
    skipped = 0,
    errors = 0;

  for (const f of allFiles) {
    try {
      const r = await indexFile(f, profileId);
      if (r.skipped) {
        skipped++;
      } else {
        indexed++;
        totalChunks += r.chunks;
      }
    } catch {
      errors++;
    }
  }

  return { indexed, chunks: totalChunks, skipped, errors };
}

async function collectFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const result: string[] = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      try {
        result.push(...(await collectFiles(full)));
      } catch {}
    } else if (
      e.isFile() &&
      SUPPORTED_EXTENSIONS.has(path.extname(e.name).toLowerCase())
    ) {
      result.push(full);
    }
  }
  return result;
}

export interface DocumentChunk {
  filename: string;
  file_path: string;
  chunk_text: string;
  score: number;
}

export async function recallDocuments(
  query: string,
  limit = RECALL_LIMIT,
): Promise<DocumentChunk[]> {
  const qVec = await embed(query);
  if (!qVec) return [];

  const [rows] = await pool.execute<any[]>(
    `SELECT filename, file_path, chunk_text, embedding
     FROM document_chunks
     ORDER BY indexed_at DESC
     LIMIT 2000`,
  );

  return rows
    .map((r) => {
      try {
        const vec = JSON.parse(r.embedding as string) as number[];
        return {
          filename: r.filename as string,
          file_path: r.file_path as string,
          chunk_text: r.chunk_text as string,
          score: cosine(qVec, vec),
        };
      } catch {
        return null;
      }
    })
    .filter((m): m is DocumentChunk => m !== null && m.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export async function getIndexStats(): Promise<{
  files: number;
  chunks: number;
}> {
  const [r] = await pool.execute<any[]>(
    "SELECT COUNT(DISTINCT file_path) AS files, COUNT(*) AS chunks FROM document_chunks",
  );
  return { files: r[0].files ?? 0, chunks: r[0].chunks ?? 0 };
}
