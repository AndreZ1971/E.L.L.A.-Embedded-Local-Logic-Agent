$ErrorActionPreference = "Stop"
Write-Host "E.L.L.A. Installer Build v3.9.1" -ForegroundColor Cyan
$root = Split-Path $PSScriptRoot -Parent

Write-Host "[1/6] Shared packages bauen..." -ForegroundColor Yellow
cd "$root\packages\shared"; npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "Shared Build fehlgeschlagen!" -ForegroundColor Red; exit 1 }

Write-Host "[2/6] Agent-Tools bauen..." -ForegroundColor Yellow
cd "$root\packages\agent-tools"; npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "Agent-Tools Build fehlgeschlagen!" -ForegroundColor Red; exit 1 }

Write-Host "[3/6] API bauen..." -ForegroundColor Yellow
cd "$root\apps\api"; npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "API Build fehlgeschlagen!" -ForegroundColor Red; exit 1 }

Write-Host "[4/6] Frontend bauen..." -ForegroundColor Yellow
cd "$root\apps\web"; npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "Frontend Build fehlgeschlagen!" -ForegroundColor Red; exit 1 }

Write-Host "[5/6] Produktions-Abhaengigkeiten vorbereiten..." -ForegroundColor Yellow
& "$root\scripts\prepare-api-deps.ps1"
if ($LASTEXITCODE -ne 0) { Write-Host "prepare-api-deps fehlgeschlagen!" -ForegroundColor Red; exit 1 }

Write-Host "[6/6] Installer bauen..." -ForegroundColor Yellow
cd "$root\apps\desktop"; npm run dist
if ($LASTEXITCODE -ne 0) { Write-Host "Installer Build fehlgeschlagen!" -ForegroundColor Red; exit 1 }

Write-Host "Fertig: $root\apps\desktop\dist-installer\E.L.L.A. Setup 3.9.1.exe" -ForegroundColor Green
