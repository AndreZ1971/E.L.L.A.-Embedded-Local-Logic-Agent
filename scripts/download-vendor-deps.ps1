param(
  [string]$MariaDbVersion = "11.4.5",
  [string]$OllamaVersion  = "0.40.12"
)

$ErrorActionPreference = "Stop"
$root   = Split-Path $PSScriptRoot -Parent
$vendor = Join-Path $root "vendor"

function Download-File($url, $dest) {
  if (Test-Path $dest) {
    Write-Host "  Already exists: $dest" -ForegroundColor DarkGray
    return
  }
  Write-Host "  Downloading $url ..." -ForegroundColor Cyan
  $tmp = "$dest.tmp"
  $client = New-Object System.Net.WebClient
  $client.DownloadFile($url, $tmp)
  Move-Item $tmp $dest
}

# MariaDB portable
$mariaDir = Join-Path $vendor "mariadb"
if (-not (Test-Path (Join-Path $mariaDir "bin\mysqld.exe"))) {
  Write-Host "`n[1/2] MariaDB $MariaDbVersion ..." -ForegroundColor Yellow
  $zipName = "mariadb-$MariaDbVersion-winx64.zip"
  $zipPath = Join-Path $vendor $zipName
  $url     = "https://downloads.mariadb.org/rest-api/mariadb/$MariaDbVersion/$zipName"

  New-Item -ItemType Directory -Force -Path $vendor | Out-Null
  Download-File $url $zipPath

  Write-Host "  Extracting..." -ForegroundColor Cyan
  $tmpExtract = Join-Path $vendor "mariadb-extract"
  if (Test-Path $tmpExtract) { Remove-Item $tmpExtract -Recurse -Force }
  Expand-Archive -Path $zipPath -DestinationPath $tmpExtract -Force

  $inner = Get-ChildItem $tmpExtract | Select-Object -First 1
  if (Test-Path $mariaDir) { Remove-Item $mariaDir -Recurse -Force }
  Move-Item $inner.FullName $mariaDir

  Remove-Item $tmpExtract -Force -ErrorAction SilentlyContinue
  Remove-Item $zipPath    -Force -ErrorAction SilentlyContinue
  Write-Host "  MariaDB OK: $mariaDir" -ForegroundColor Green
} else {
  Write-Host "`n[1/2] MariaDB already present - skipped." -ForegroundColor DarkGray
}

# Ollama binary (ZIP since v0.2+)
$ollamaDir = Join-Path $vendor "ollama"
$ollamaExe = Join-Path $ollamaDir "ollama.exe"
if (-not (Test-Path $ollamaExe)) {
  Write-Host "`n[2/2] Ollama $OllamaVersion ..." -ForegroundColor Yellow
  New-Item -ItemType Directory -Force -Path $ollamaDir | Out-Null
  $zipPath = Join-Path $vendor "ollama.zip"
  $url = "https://github.com/ollama/ollama/releases/download/v$OllamaVersion/ollama-windows-amd64.zip"
  Download-File $url $zipPath

  Write-Host "  Extracting..." -ForegroundColor Cyan
  $tmpExtract = Join-Path $vendor "ollama-extract"
  if (Test-Path $tmpExtract) { Remove-Item $tmpExtract -Recurse -Force }
  Expand-Archive -Path $zipPath -DestinationPath $tmpExtract -Force

  # Copy all extracted files into ollamaDir
  Get-ChildItem $tmpExtract | ForEach-Object { Copy-Item $_.FullName $ollamaDir -Recurse -Force }

  # CUDA v12 entfernen — CUDA v13 deckt alle GPUs mit Treiber >= 525 ab
  $cudaV12 = Join-Path $ollamaDir "lib\ollama\cuda_v12"
  if (Test-Path $cudaV12) {
    Write-Host "  Removing CUDA v12 (covered by v13)..." -ForegroundColor Yellow
    Remove-Item $cudaV12 -Recurse -Force
  }

  Remove-Item $tmpExtract -Recurse -Force -ErrorAction SilentlyContinue
  Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
  Write-Host "  Ollama OK: $ollamaExe" -ForegroundColor Green
} else {
  Write-Host "`n[2/2] Ollama already present - skipped." -ForegroundColor DarkGray
}

Write-Host "`nAll vendor deps ready." -ForegroundColor Green
Write-Host "Next: cd apps/desktop, then run: npm run dist" -ForegroundColor Green
