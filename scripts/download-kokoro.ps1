param(
    [string]$TargetDir = "$env:APPDATA\ELLA\kokoro-model"
)

$ErrorActionPreference = "Stop"
$base = "https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main"

$files = @(
    "config.json",
    "tokenizer.json",
    "tokenizer_config.json",
    "onnx/model_quantized.onnx"
)

New-Item -ItemType Directory -Force -Path $TargetDir | Out-Null
New-Item -ItemType Directory -Force -Path "$TargetDir\onnx" | Out-Null

Write-Host "Lade Kokoro TTS Modell herunter -> $TargetDir" -ForegroundColor Cyan

$client = New-Object System.Net.WebClient
$client.Headers.Add("User-Agent", "ELLA-Setup/1.0")

foreach ($file in $files) {
    $url  = "$base/$file"
    $dest = Join-Path $TargetDir $file.Replace("/", "\")

    if (Test-Path $dest) {
        Write-Host "  [SKIP] $file (existiert bereits)" -ForegroundColor DarkGray
        continue
    }

    Write-Host "  Lade $file..." -ForegroundColor Yellow -NoNewline
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $client.DownloadFile($url, $dest)
    $sw.Stop()
    $sizeMB = [math]::Round((Get-Item $dest).Length / 1MB, 1)
    Write-Host " $sizeMB MB in $([math]::Round($sw.Elapsed.TotalSeconds,1))s" -ForegroundColor Green
}

Write-Host "`nFertig! Modell bereit unter: $TargetDir" -ForegroundColor Cyan
