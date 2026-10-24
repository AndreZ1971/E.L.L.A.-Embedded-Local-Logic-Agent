import { execSync } from "child_process";
import * as fsSync from "fs";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import { getSettings } from "./settings.js";
import { env } from "../config/env.js";
import { openaiRequest, CloudBlockedError } from "./openai.js";

const ACCESSIBILITY_SYSTEM = `Du bist ELLAs Sehvermögen – du hilfst Menschen mit Sehbehinderung.
Beschreibe was du siehst klar und präzise in natürlicher gesprochener Sprache.
Kein Markdown, keine Sternchen, keine Listen mit Bindestrichen.
Struktur: Erst was der Hauptinhalt ist, dann wichtige Details (Text, Zahlen, Schaltflächen), dann Kontext.
Antworte auf Deutsch.`;

export async function takeScreenshot(): Promise<string> {
  const outPath = path
    .join(os.tmpdir(), `ella-screen-${Date.now()}.png`)
    .replace(/\\/g, "\\\\");

  const ps = `
Add-Type -AssemblyName System.Windows.Forms,System.Drawing
$screens = [System.Windows.Forms.Screen]::AllScreens
$top    = ($screens | ForEach-Object { $_.Bounds.Top }    | Measure-Object -Minimum).Minimum
$left   = ($screens | ForEach-Object { $_.Bounds.Left }   | Measure-Object -Minimum).Minimum
$width  = ($screens | ForEach-Object { $_.Bounds.Right }  | Measure-Object -Maximum).Maximum - $left
$height = ($screens | ForEach-Object { $_.Bounds.Bottom } | Measure-Object -Maximum).Maximum - $top
$bmp = New-Object System.Drawing.Bitmap($width, $height)
$g   = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($left, $top, 0, 0, $bmp.Size)
$bmp.Save('${outPath}')
$g.Dispose(); $bmp.Dispose()`.trim();

  const tmp = path.join(os.tmpdir(), `ella-shot-${Date.now()}.ps1`);
  try {
    fsSync.writeFileSync(tmp, ps, "utf-8");
    execSync(
      `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${tmp}"`,
      { timeout: 10_000 },
    );
  } finally {
    try {
      fsSync.unlinkSync(tmp);
    } catch {
      // best effort
    }
  }

  return outPath.replace(/\\\\/g, "\\");
}

async function analyzeWithOpenAI(
  base64: string,
  prompt: string,
  mimeType = "image/png",
): Promise<string> {
  const response = await openaiRequest(
    "/v1/chat/completions",
    {
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: ACCESSIBILITY_SYSTEM,
          },
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64}`,
                  detail: "high",
                },
              },
            ],
          },
        ],
        max_tokens: 1200,
      }),
    },
    "vision",
  );

  if (!response.ok)
    throw new Error(
      `OpenAI Vision ${response.status}: ${await response.text()}`,
    );

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string | null } }>;
  };
  return data.choices[0]?.message?.content?.trim() ?? "Kein Ergebnis.";
}

async function analyzeWithLLaVA(
  base64: string,
  prompt: string,
): Promise<string> {
  // Detect available LLaVA model from Ollama tag list
  let model = "llava";
  try {
    const tagsRes = await fetch(`${env.ollamaBaseUrl}/api/tags`, {
      signal: AbortSignal.timeout(3_000),
    });
    if (tagsRes.ok) {
      const tags = (await tagsRes.json()) as {
        models: Array<{ name: string }>;
      };
      const found = tags.models
        .map((m) => m.name)
        .find(
          (n) =>
            n.startsWith("llava") ||
            n.startsWith("bakllava") ||
            n.startsWith("moondream"),
        );
      if (found) model = found;
    }
  } catch {
    // keep default
  }

  const response = await fetch(`${env.ollamaBaseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: ACCESSIBILITY_SYSTEM },
        { role: "user", content: prompt, images: [base64] },
      ],
      stream: false,
      options: { temperature: 0.1, num_predict: 800 },
    }),
    signal: AbortSignal.timeout(120_000),
  });

  if (!response.ok)
    throw new Error(
      `LLaVA (${model}) ${response.status}: ${await response.text()}`,
    );

  const data = (await response.json()) as { message?: { content: string } };
  return data.message?.content?.trim() ?? "Kein Ergebnis.";
}

// Core: routes based on provider setting — ollama | auto | openai
export async function analyzeImage(
  base64: string,
  prompt: string,
  mimeType = "image/png",
): Promise<string> {
  const { provider } = getSettings();

  if (provider === "ollama") {
    return analyzeWithLLaVA(base64, prompt);
  }

  if (provider === "openai") {
    try {
      return await analyzeWithOpenAI(base64, prompt, mimeType);
    } catch (err) {
      if (err instanceof CloudBlockedError) {
        throw new Error(
          "Bildanalyse lokal nicht verfügbar — bitte LLaVA-Modell installieren",
        );
      }
      throw err;
    }
  }

  // auto: LLaVA zuerst, OpenAI nur wenn LLaVA fehlt/fehlschlägt
  try {
    return await analyzeWithLLaVA(base64, prompt);
  } catch {
    // LLaVA nicht verfügbar — OpenAI versuchen
  }

  try {
    return await analyzeWithOpenAI(base64, prompt, mimeType);
  } catch (err) {
    if (err instanceof CloudBlockedError) {
      throw new Error(
        "Bildanalyse lokal nicht verfügbar — bitte LLaVA-Modell installieren",
      );
    }
    throw err;
  }
}

export async function analyzeScreenshot(
  question = "Was siehst du? Beschreibe den Bildschirminhalt.",
): Promise<string> {
  const screenshotPath = await takeScreenshot();
  const imageBuffer = await fs.readFile(screenshotPath);
  const base64 = imageBuffer.toString("base64");
  await fs.unlink(screenshotPath).catch(() => {});
  return analyzeImage(base64, question, "image/png");
}

export async function describeImageFile(
  filePath: string,
  question?: string,
): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();
  const mimeMap: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".bmp": "image/bmp",
  };
  const mimeType = mimeMap[ext] ?? "image/png";
  const imageBuffer = await fs.readFile(filePath);
  const base64 = imageBuffer.toString("base64");
  return analyzeImage(
    base64,
    question ?? "Beschreibe dieses Bild detailliert.",
    mimeType,
  );
}

export async function describeWebpage(
  url?: string,
  question?: string,
): Promise<string> {
  let htmlContext = "";
  if (url) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(10_000),
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      });
      const html = await res.text();
      const text = html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 2000);
      if (text) htmlContext = `\nSeitentext-Auszug: ${text}\n`;
    } catch {
      // screenshot allein reicht
    }
  }

  const urlNote = url ? `Webseite: ${url}` : "Aktueller Bildschirm";
  const prompt =
    urlNote +
    htmlContext +
    "\n\n" +
    (question ??
      "Beschreibe den Inhalt und Aufbau dieser Webseite. Was sind die Hauptbereiche, Navigationselemente, Überschriften und der Hauptinhalt?");

  return analyzeScreenshot(prompt);
}
