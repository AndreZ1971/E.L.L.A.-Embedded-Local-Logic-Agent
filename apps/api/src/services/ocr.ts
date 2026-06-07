import { execSync } from "child_process";
import * as fsSync from "fs";
import * as os from "os";
import * as path from "path";
import { takeScreenshot } from "./vision.js";

export interface OcrElement {
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const OCR_BASE_PS = `
param([string]$imgPath)
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Media.Ocr.OcrEngine,          Windows.Media.Ocr,           ContentType=WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType=WindowsRuntime]
$null = [Windows.Storage.Streams.InMemoryRandomAccessStream, Windows.Storage.Streams, ContentType=WindowsRuntime]
$null = [Windows.Storage.Streams.DataWriter,    Windows.Storage.Streams,     ContentType=WindowsRuntime]

function Await-WinRT {
  param([object]$Task, [type]$Type)
  $m = ([System.WindowsRuntimeSystemExtensions].GetMethods() |
    Where-Object { $_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 })[0]
  $t = $m.MakeGenericMethod($Type).Invoke($null, @($Task))
  $t.Wait(-1) | Out-Null; $t.Result
}
function Await-WinRTAction {
  param([object]$Task)
  $m = ([System.WindowsRuntimeSystemExtensions].GetMethods() |
    Where-Object { $_.Name -eq 'AsTask' -and -not $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 })[0]
  $t = $m.Invoke($null, @($Task)); $t.Wait(-1) | Out-Null
}

$bytes  = [System.IO.File]::ReadAllBytes($imgPath)
$stream = [Windows.Storage.Streams.InMemoryRandomAccessStream]::new()
$writer = [Windows.Storage.Streams.DataWriter]::new($stream)
$writer.WriteBytes($bytes)
Await-WinRTAction $writer.StoreAsync()
$writer.DetachStream() | Out-Null
$stream.Seek(0)

$dec = Await-WinRT ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
$bmp = Await-WinRT ($dec.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
$eng = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
if (-not $eng) { Write-Output '{"error":"OCR Engine nicht verfuegbar"}'; exit }
$res = Await-WinRT ($eng.RecognizeAsync($bmp)) ([Windows.Media.Ocr.OcrResult])
`.trimStart();

export async function readScreenOcrElements(): Promise<{
  text: string;
  elements: OcrElement[];
}> {
  const screenshotPath = await takeScreenshot();

  const ps =
    OCR_BASE_PS +
    `
$elements = [System.Collections.Generic.List[PSCustomObject]]::new()
foreach ($line in $res.Lines) {
  foreach ($word in $line.Words) {
    $r = $word.BoundingRect
    $elements.Add([PSCustomObject]@{ text=$word.Text; x=[int]$r.X; y=[int]$r.Y; w=[int]$r.Width; h=[int]$r.Height })
  }
}
$fullText = ($res.Lines | ForEach-Object { $_.Text }) -join "\`n"
@{ text=$fullText; elements=@($elements) } | ConvertTo-Json -Compress -Depth 5`.trim();

  const tmpOcr = path.join(os.tmpdir(), `ella-ocr-el-${Date.now()}.ps1`);
  try {
    fsSync.writeFileSync(tmpOcr, ps, "utf-8");
    const raw = execSync(
      `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${tmpOcr}" -imgPath "${screenshotPath}"`,
      { encoding: "utf-8", timeout: 30_000 },
    ).trim();
    const parsed = JSON.parse(raw) as {
      text?: string;
      elements?: OcrElement[];
      error?: string;
    };
    if (parsed.error) throw new Error(parsed.error);
    return {
      text: parsed.text ?? "",
      elements: parsed.elements ?? [],
    };
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : String(err));
  } finally {
    try {
      fsSync.unlinkSync(tmpOcr);
    } catch {
      /* best effort */
    }
    try {
      fsSync.unlinkSync(screenshotPath);
    } catch {
      /* best effort */
    }
  }
}

export async function readScreenOcr(): Promise<string> {
  const screenshotPath = await takeScreenshot();

  // Windows.Media.Ocr via WinRT — läuft offline, kein Cloud-Dienst
  const ps = `
param([string]$imgPath)
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Media.Ocr.OcrEngine,          Windows.Media.Ocr,           ContentType=WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType=WindowsRuntime]
$null = [Windows.Storage.Streams.InMemoryRandomAccessStream, Windows.Storage.Streams, ContentType=WindowsRuntime]
$null = [Windows.Storage.Streams.DataWriter,    Windows.Storage.Streams,     ContentType=WindowsRuntime]

function Await-WinRT {
  param([object]$Task, [type]$Type)
  $m = ([System.WindowsRuntimeSystemExtensions].GetMethods() |
    Where-Object { $_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 })[0]
  $t = $m.MakeGenericMethod($Type).Invoke($null, @($Task))
  $t.Wait(-1) | Out-Null; $t.Result
}
function Await-WinRTAction {
  param([object]$Task)
  $m = ([System.WindowsRuntimeSystemExtensions].GetMethods() |
    Where-Object { $_.Name -eq 'AsTask' -and -not $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 })[0]
  $t = $m.Invoke($null, @($Task)); $t.Wait(-1) | Out-Null
}

try {
  $bytes  = [System.IO.File]::ReadAllBytes($imgPath)
  $stream = [Windows.Storage.Streams.InMemoryRandomAccessStream]::new()
  $writer = [Windows.Storage.Streams.DataWriter]::new($stream)
  $writer.WriteBytes($bytes)
  Await-WinRTAction $writer.StoreAsync()
  $writer.DetachStream() | Out-Null
  $stream.Seek(0)

  $dec = Await-WinRT ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
  $bmp = Await-WinRT ($dec.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])

  $eng = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
  if (-not $eng) { Write-Output 'OCR Engine nicht verfuegbar (keine Sprache installiert).'; exit }

  $res  = Await-WinRT ($eng.RecognizeAsync($bmp)) ([Windows.Media.Ocr.OcrResult])
  $text = ($res.Lines | ForEach-Object { $_.Text }) -join "\`n"
  if ($text) { Write-Output $text } else { Write-Output 'Kein Text erkannt.' }
} catch {
  Write-Output "OCR Fehler: $($_.Exception.Message)"
}`.trim();

  const tmpOcr = path.join(os.tmpdir(), `ella-ocr-${Date.now()}.ps1`);
  try {
    fsSync.writeFileSync(tmpOcr, ps, "utf-8");
    const text = execSync(
      `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${tmpOcr}" -imgPath "${screenshotPath}"`,
      { encoding: "utf-8", timeout: 25_000 },
    ).trim();
    return text || "Kein Text erkannt.";
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : String(err));
  } finally {
    try {
      fsSync.unlinkSync(tmpOcr);
    } catch {
      /* best effort */
    }
    try {
      fsSync.unlinkSync(screenshotPath);
    } catch {
      /* best effort */
    }
  }
}
