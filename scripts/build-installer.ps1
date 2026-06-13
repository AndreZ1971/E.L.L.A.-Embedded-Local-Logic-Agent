Write-Host "E.L.L.A. Installer Build" -ForegroundColor Cyan
$root = Split-Path $PSScriptRoot -Parent

Write-Host "[1/4] API bauen..." -ForegroundColor Yellow
cd "$root\apps\api"; npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "API Build fehlgeschlagen!" -ForegroundColor Red; exit 1 }

Write-Host "[2/4] Frontend bauen..." -ForegroundColor Yellow
cd "$root\apps\web"; npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "Frontend Build fehlgeschlagen!" -ForegroundColor Red; exit 1 }

Write-Host "[3/4] Shared packages bauen..." -ForegroundColor Yellow
cd "$root\packages\shared"; npm run build 2>$null
cd "$root\packages\agent-tools"; npm run build 2>$null

Write-Host "[4/4] Installer bauen..." -ForegroundColor Yellow
cd "$root\apps\desktop"; npm run dist
if ($LASTEXITCODE -ne 0) { Write-Host "Installer Build fehlgeschlagen!" -ForegroundColor Red; exit 1 }

Write-Host "Fertig: $root\apps\desktop\dist-installer\E.L.L.A Setup 1.0.0-rc.exe" -ForegroundColor Green
