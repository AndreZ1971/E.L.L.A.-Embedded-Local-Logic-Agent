import { execSync } from "child_process";
import * as fsSync from "fs";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import { getSettings } from "./settings.js";
import { env } from "../config/env.js";

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

export async function analyzeScreenshot(
  question = "Was siehst du? Beschreibe den Bildschirminhalt.",
): Promise<string> {
  const { openaiApiKey } = getSettings();
  const apiKey = openaiApiKey || env.openaiApiKey;

  if (!apiKey) {
    throw new Error(
      "Vision benötigt OpenAI API-Key. Bitte in Einstellungen konfigurieren.",
    );
  }

  const screenshotPath = await takeScreenshot();
  const imageBuffer = await fs.readFile(screenshotPath);
  const base64 = imageBuffer.toString("base64");
  await fs.unlink(screenshotPath).catch(() => {});

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: question },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${base64}`,
                detail: "high",
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `OpenAI Vision error ${response.status}: ${await response.text()}`,
    );
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string | null } }>;
  };
  return data.choices[0]?.message?.content ?? "Kein Ergebnis.";
}
