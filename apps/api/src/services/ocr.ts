import { execSync } from "child_process";
import * as fsSync from "fs";
import * as os from "os";
import * as path from "path";
import { takeScreenshot } from "./vision.js";

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
