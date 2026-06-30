$ErrorActionPreference = "Stop"
$root   = Split-Path $PSScriptRoot -Parent
$apiDir = Join-Path $root "apps\api"
$outDir = Join-Path $apiDir "prod-node-modules"

Write-Host "Production node_modules fuer API erstellen..." -ForegroundColor Cyan

if (Test-Path $outDir) { Remove-Item $outDir -Recurse -Force }
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

# Package.json mit konkreten Versionen aus dem Lock-File — ohne Workspace-Pakete
# Workspace-Pakete (@ella/*) werden direkt in bundle.cjs eingebettet
$pkgJson = @"
{
  "name": "ella-api-prod",
  "version": "1.0.0",
  "dependencies": {
    "cheerio": "^1.2.0",
    "dotenv": "^16.4.0",
    "express": "^4.21.0",
    "googleapis": "^173.0.0",
    "mammoth": "^1.12.0",
    "msedge-tts": "^2.0.5",
    "multer": "^2.1.1",
    "mysql2": "^3.11.0",
    "pdf-parse": "^2.4.5",
    "turndown": "^7.2.4",
    "xlsx": "^0.18.5",
    "ffmpeg-static": "^5.3.0",
    "@xenova/transformers": "^2.17.2",
    "kokoro-js": "^1.2.1",
    "@huggingface/transformers": "^3.5.1",
    "phonemizer": "^1.2.1"
  }
}
"@

$pkgJson | Set-Content (Join-Path $outDir "package.json") -Encoding utf8
cd $outDir
npm install --omit=dev --ignore-scripts --no-fund --no-audit 2>&1 | Select-Object -Last 5

Remove-Item (Join-Path $outDir "package.json")
Remove-Item (Join-Path $outDir "package-lock.json") -ErrorAction SilentlyContinue

# Nested onnxruntime-node v1.21.0 entfernen — @huggingface/transformers bringt eine eigene
# Version mit, deren onnxruntime.dll Windows AI Platform DLLs benötigt die nicht überall
# vorhanden sind. Node.js fällt dann auf root v1.14.0 zurück, das einwandfrei läuft.
$nestedOrt = Join-Path $outDir "node_modules\@huggingface\transformers\node_modules\onnxruntime-node"
if (Test-Path $nestedOrt) {
    Remove-Item $nestedOrt -Recurse -Force
    Write-Host "Nested onnxruntime-node v1.21.0 entfernt (CPU-only Kokoro TTS)" -ForegroundColor Yellow
}

$sizeMB = [math]::Round((Get-ChildItem $outDir -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB, 0)
Write-Host "Fertig: prod-node-modules/ ($sizeMB MB)" -ForegroundColor Green
