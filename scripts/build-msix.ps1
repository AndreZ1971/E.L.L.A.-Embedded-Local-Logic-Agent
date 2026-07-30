Write-Host "E.L.L.A. MSIX Build v3.9.1" -ForegroundColor Cyan
Write-Host ""
Write-Host "HINWEIS: Fuer Microsoft Store-Einreichung muessen folgende Werte" -ForegroundColor Yellow
Write-Host "in apps/desktop/package.json (build.appx) angepasst werden:" -ForegroundColor Yellow
Write-Host "  identityName  -> Package Identity Name aus Partner Center" -ForegroundColor Yellow
Write-Host "  publisher     -> Publisher CN aus Partner Center (z.B. CN=...)" -ForegroundColor Yellow
Write-Host ""
$root = Split-Path $PSScriptRoot -Parent

Write-Host "[1/6] Shared packages bauen..." -ForegroundColor Yellow
Set-Location "$root\packages\shared"; npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "Shared Build fehlgeschlagen!" -ForegroundColor Red; exit 1 }

Write-Host "[2/6] Agent-Tools bauen..." -ForegroundColor Yellow
Set-Location "$root\packages\agent-tools"; npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "Agent-Tools Build fehlgeschlagen!" -ForegroundColor Red; exit 1 }

Write-Host "[3/6] API bauen..." -ForegroundColor Yellow
Set-Location "$root\apps\api"; npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "API Build fehlgeschlagen!" -ForegroundColor Red; exit 1 }

Write-Host "[4/6] Frontend bauen..." -ForegroundColor Yellow
Set-Location "$root\apps\web"; npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "Frontend Build fehlgeschlagen!" -ForegroundColor Red; exit 1 }

Write-Host "[5/6] Produktions-Abhaengigkeiten vorbereiten..." -ForegroundColor Yellow
& "$root\scripts\prepare-api-deps.ps1"
if ($LASTEXITCODE -ne 0) { Write-Host "prepare-api-deps fehlgeschlagen!" -ForegroundColor Red; exit 1 }

Write-Host "[6/6] MSIX bauen..." -ForegroundColor Yellow
$electronLink = "$root\apps\desktop\node_modules\electron"
if (-not (Test-Path $electronLink) -and (Test-Path "$root\node_modules\electron")) {
    New-Item -ItemType Junction -Path $electronLink -Target "$root\node_modules\electron" | Out-Null
    Write-Host "Electron-Junction angelegt" -ForegroundColor Yellow
}
Set-Location "$root\apps\desktop"; npm run dist:msix
if ($LASTEXITCODE -ne 0) { Write-Host "MSIX Build fehlgeschlagen!" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "Fertig: $root\apps\desktop\dist-installer\E.L.L.A. 3.9.1.appx" -ForegroundColor Green
Write-Host ""
Write-Host "Naechste Schritte fuer Microsoft Store:" -ForegroundColor Cyan
Write-Host "1. Partner Center: https://partner.microsoft.com/dashboard" -ForegroundColor White
Write-Host "2. Neue App anlegen, Package Identity + Publisher CN kopieren" -ForegroundColor White
Write-Host "3. Werte in apps/desktop/package.json (build.appx) eintragen" -ForegroundColor White
Write-Host "4. MSIX neu bauen und in Partner Center hochladen" -ForegroundColor White
