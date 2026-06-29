# ELLA Smoke Tests
# Aufruf: .\scripts\smoke-test.ps1

$API = "http://localhost:3002"
$script:pass = 0
$script:fail = 0
$script:warn = 0

function ok($label) {
    Write-Host "  [OK]  $label" -ForegroundColor Green
    $script:pass++
}
function err($label) {
    Write-Host "  [FAIL] $label" -ForegroundColor Red
    $script:fail++
}
function warn($label) {
    Write-Host "  [WARN] $label" -ForegroundColor DarkYellow
    $script:warn++
}

function Get-ApiJson($url) {
    try { Invoke-RestMethod -Uri $url -Method GET -TimeoutSec 10 -ErrorAction Stop }
    catch { $null }
}
function Send-ApiJson($url, $body) {
    try {
        Invoke-RestMethod -Uri $url -Method POST `
            -ContentType "application/json" `
            -Body ($body | ConvertTo-Json) `
            -TimeoutSec 10 -ErrorAction Stop
    } catch { $null }
}
function Remove-ApiResource($url) {
    try { Invoke-RestMethod -Uri $url -Method DELETE -TimeoutSec 5 -ErrorAction Stop | Out-Null; $true }
    catch { $false }
}

function Send-Chat($message, $sessionId = "smoke-$(Get-Date -Format 'HHmmss')") {
    try {
        Invoke-RestMethod -Uri "$API/api/chat" -Method POST `
            -ContentType "application/json" `
            -Body (@{ message = $message; sessionId = $sessionId } | ConvertTo-Json) `
            -TimeoutSec 60 -ErrorAction Stop
    } catch { $null }
}

Write-Host ""
Write-Host "ELLA Smoke Tests  --  $API" -ForegroundColor Cyan
Write-Host "================================================"

# 1. Basis
Write-Host ""
Write-Host "[1] Basis-Erreichbarkeit" -ForegroundColor Yellow

$health = Get-ApiJson "$API/api/health"
if ($health -and $health.api -eq $true) {
    ok "GET /api/health: OK (provider=$($health.provider), model_ready=$($health.model_ready))"
} else { err "GET /api/health nicht erreichbar -- laeuft ELLA?" }

$settings = Get-ApiJson "$API/api/settings"
if ($settings -and $null -ne $settings.ollamaModel) {
    ok "GET /api/settings: OK (model=$($settings.ollamaModel))"
} else { err "GET /api/settings fehlgeschlagen" }

$providerInfo = Get-ApiJson "$API/api/chat/provider"
if ($providerInfo -and $providerInfo.provider) {
    ok "GET /api/chat/provider: $($providerInfo.provider) / $($providerInfo.model)"
} else { err "GET /api/chat/provider fehlgeschlagen" }

# 2. Hausaufgaben-Modus
Write-Host ""
Write-Host "[2] Hausaufgaben-Modus" -ForegroundColor Yellow

$hwStatus = Get-ApiJson "$API/api/homework/status"
if ($null -ne $hwStatus.active) {
    ok "GET /api/homework/status: active=$($hwStatus.active), configured=$($hwStatus.configured)"
} else { err "GET /api/homework/status fehlgeschlagen" }

$hwActivate = Send-ApiJson "$API/api/homework/activate" @{}
if ($hwActivate -and $hwActivate.success) { ok "POST /api/homework/activate: erfolgreich" }
else { err "POST /api/homework/activate fehlgeschlagen" }

$hwAfterActivate = Get-ApiJson "$API/api/homework/status"
if ($hwAfterActivate.active -eq $true) { ok "Status nach Aktivierung: active=true" }
else { err "Status nach Aktivierung ist nicht true" }

# Falscher PIN darf nicht deaktivieren
Send-ApiJson "$API/api/homework/deactivate" @{ pin = "0000" } | Out-Null
$hwAfterWrongPin = Get-ApiJson "$API/api/homework/status"
if ($hwAfterWrongPin.active -eq $true) { ok "Falscher PIN (0000): Modus bleibt aktiv" }
else { err "Falscher PIN hat Modus deaktiviert -- Sicherheitsproblem!" }

# Richtiger PIN
Send-ApiJson "$API/api/homework/deactivate" @{ pin = "9704" } | Out-Null
$hwAfterDeactivate = Get-ApiJson "$API/api/homework/status"
if ($hwAfterDeactivate.active -eq $false) {
    ok "POST /api/homework/deactivate mit PIN 9704: Modus deaktiviert"
} else {
    warn "Deaktivierung mit PIN 9704 fehlgeschlagen -- anderer PIN gesetzt?"
}

# 3. Ollama
Write-Host ""
Write-Host "[3] Ollama" -ForegroundColor Yellow

try {
    $ollamaTags = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -TimeoutSec 5 -ErrorAction Stop
    $modelNames = $ollamaTags.models | ForEach-Object { $_.name }
    ok "Ollama erreichbar -- Modelle: $($modelNames -join ', ')"
} catch {
    err "Ollama nicht erreichbar auf :11434"
}

# 4. Chat + Tool-Tests ueber LLM
Write-Host ""
Write-Host "[4] Chat + Tools (via LLM, kann 30-60s dauern)" -ForegroundColor Yellow

# Einfache Antwort
$chatSimple = Send-Chat "Antworte nur mit dem Wort HALLO" "smoke-simple"
if ($chatSimple -and $chatSimple.reply) {
    $preview = $chatSimple.reply.Substring(0, [Math]::Min(60, $chatSimple.reply.Length))
    ok "POST /api/chat einfach: '$preview'"
} else { err "POST /api/chat (einfach) fehlgeschlagen" }

# Tool-Aufruf: get_datetime (einfachstes Tool, kein externes System)
$chatTool = Send-Chat "Welcher Wochentag ist heute? Nutze get_datetime." "smoke-tool"
if ($chatTool -and $chatTool.reply) {
    $preview = $chatTool.reply.Substring(0, [Math]::Min(80, $chatTool.reply.Length))
    ok "POST /api/chat mit Tool (get_datetime): '$preview'"
} else { err "POST /api/chat mit Tool fehlgeschlagen" }

# Tool-Aufruf: add_task + delete_task
$chatTask = Send-Chat "Leg eine Testaufgabe mit dem Titel SMOKE-TEST-AUFGABE an" "smoke-task"
if ($chatTask -and $chatTask.reply) {
    ok "add_task via Chat: '$($chatTask.reply.Substring(0,[Math]::Min(60,$chatTask.reply.Length)))'"
} else { err "add_task via Chat fehlgeschlagen" }

# 5. Lizenz
Write-Host ""
Write-Host "[5] Lizenz" -ForegroundColor Yellow

$licenseInfo = Get-ApiJson "$API/api/license/info"
if ($licenseInfo -and $null -ne $licenseInfo.activated) {
    ok "GET /api/license/info: activated=$($licenseInfo.activated), product=$($licenseInfo.product)"
} else { err "GET /api/license/info fehlgeschlagen" }

# Ergebnis
Write-Host ""
Write-Host "================================================"
$total = $script:pass + $script:fail
if ($script:fail -eq 0) {
    Write-Host "Alle $($script:pass)/$total Tests bestanden. ($($script:warn) Warnungen)" -ForegroundColor Green
} else {
    Write-Host "$($script:pass)/$total bestanden  --  $($script:fail) fehlgeschlagen  --  $($script:warn) Warnungen" -ForegroundColor Red
}
Write-Host ""
