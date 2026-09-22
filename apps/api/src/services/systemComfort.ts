import { execSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

function runPs(script: string, timeoutMs = 10_000): string {
  const tmpFile = path.join(os.tmpdir(), `ella-comfort-${Date.now()}.ps1`);
  try {
    fs.writeFileSync(tmpFile, script, "utf-8");
    return execSync(
      `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${tmpFile}"`,
      { timeout: timeoutMs, encoding: "utf-8" },
    ).trim();
  } finally {
    try {
      fs.unlinkSync(tmpFile);
    } catch {
      /* best effort */
    }
  }
}

export function toggleDarkMode(): {
  success: boolean;
  mode?: "dark" | "light";
  error?: string;
} {
  const ps = `
$regPath = 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize'
$cur = (Get-ItemProperty $regPath -Name AppsUseLightTheme -ErrorAction SilentlyContinue).AppsUseLightTheme
$new = if ($cur -eq 0) { 1 } else { 0 }
Set-ItemProperty $regPath -Name AppsUseLightTheme   -Value $new -ErrorAction SilentlyContinue
Set-ItemProperty $regPath -Name SystemUsesLightTheme -Value $new -ErrorAction SilentlyContinue
Write-Output ('{"mode":"' + (if ($new -eq 0) { 'dark' } else { 'light' }) + '"}')`.trim();

  try {
    const out = runPs(ps);
    const { mode } = JSON.parse(out) as { mode: "dark" | "light" };
    return { success: true, mode };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export interface BatteryInfo {
  success: boolean;
  available?: boolean;
  chargePercent?: number;
  charging?: boolean;
  estimatedMinutes?: number | null;
  statusText?: string;
  error?: string;
}

export function getBatteryStatus(): BatteryInfo {
  const ps = `
$bat = Get-CimInstance Win32_Battery -ErrorAction SilentlyContinue
if ($null -eq $bat) {
  Write-Output '{"available":false}'
} else {
  @{
    available        = $true
    chargePercent    = [int]$bat.EstimatedChargeRemaining
    charging         = ($bat.BatteryStatus -eq 2)
    estimatedMinutes = if ($bat.EstimatedRunTime -lt 71582) { [int]$bat.EstimatedRunTime } else { $null }
    statusText       = switch([int]$bat.BatteryStatus) {
      1 { 'Entladen' }; 2 { 'Laden' }; 3 { 'Voll geladen' }
      4 { 'Niedrig' };  5 { 'Kritisch' }; default { 'Unbekannt' }
    }
  } | ConvertTo-Json -Compress
}`.trim();

  try {
    const out = runPs(ps);
    return { success: true, ...JSON.parse(out) };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export interface ThermalZone {
  name: string;
  celsius: number;
}

export function getTemperatures(): {
  success: boolean;
  available?: boolean;
  zones?: ThermalZone[];
  reason?: string;
  error?: string;
} {
  const ps = `
try {
  $zones = Get-CimInstance MSAcpi_ThermalZoneTemperature -Namespace root/wmi -ErrorAction Stop
  $result = $zones | ForEach-Object {
    [PSCustomObject]@{
      name    = $_.InstanceName -replace '.*_ThermalZone(\\d+).*','Zone $1'
      celsius = [math]::Round(($_.CurrentTemperature / 10.0) - 273.15, 1)
    }
  }
  if (@($result).Count -eq 0) {
    Write-Output '{"available":false,"reason":"Keine Thermalzonen gefunden"}'
  } else {
    @($result) | ConvertTo-Json -Compress
  }
} catch {
  Write-Output '{"available":false,"reason":"Thermalzonen nicht verfuegbar (herstellerspezifisch)"}'
}`.trim();

  try {
    const out = runPs(ps);
    const data = JSON.parse(out);
    if (Array.isArray(data))
      return { success: true, available: true, zones: data as ThermalZone[] };
    return { success: true, ...data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export interface EventLogEntry {
  time: string;
  level: string;
  source: string;
  message: string;
}

export function getEventLog(
  hours = 24,
  maxEvents = 20,
): { success: boolean; events?: EventLogEntry[]; error?: string } {
  const ps = `
$since = (Get-Date).AddHours(-${hours})
$events = Get-WinEvent -FilterHashtable @{LogName='System','Application'; Level=1,2,3; StartTime=$since} -MaxEvents ${maxEvents} -ErrorAction SilentlyContinue
if ($null -eq $events -or @($events).Count -eq 0) {
  Write-Output '[]'
} else {
  @($events) | Select-Object @{N='time';E={$_.TimeCreated.ToString('dd.MM.yyyy HH:mm')}}, @{N='level';E={$_.LevelDisplayName}}, @{N='source';E={$_.ProviderName}}, @{N='message';E={$_.Message.Substring(0,[Math]::Min($_.Message.Length,200))}} | ConvertTo-Json -Compress
}`.trim();

  try {
    const out = runPs(ps, 20_000);
    const data = JSON.parse(!out || out === "[]" ? "[]" : out);
    return {
      success: true,
      events: Array.isArray(data) ? data : [data],
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export interface WifiInfo {
  success: boolean;
  connected?: boolean;
  ssid?: string;
  signal?: string;
  receiveRate?: string;
  sendRate?: string;
  error?: string;
}

// ── Neue Hardware-Info-Tools ─────────────────────────────────────────────────

export function getGpuInfo(): {
  success: boolean;
  gpus?: object[];
  error?: string;
} {
  const ps = `
$gpus = Get-CimInstance Win32_VideoController | ForEach-Object {
  $vram = if ($_.AdapterRAM -gt 0) { [math]::Round($_.AdapterRAM / 1GB, 1) } else { $null }
  [PSCustomObject]@{
    name           = $_.Caption
    vram_gb        = $vram
    driver_version = $_.DriverVersion
    resolution     = if ($_.CurrentHorizontalResolution) { "$($_.CurrentHorizontalResolution)x$($_.CurrentVerticalResolution)" } else { $null }
    refresh_hz     = $_.CurrentRefreshRate
  }
}
@($gpus) | ConvertTo-Json -Compress -Depth 3`.trim();
  try {
    const out = runPs(ps);
    const raw = JSON.parse(out);
    const gpus = Array.isArray(raw) ? raw : [raw];
    return { success: true, gpus };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function getRamInfo(): {
  success: boolean;
  total?: string;
  slots_used?: number;
  modules?: object[];
  error?: string;
} {
  const ps = `
$memTypeMap = @{20='DDR';21='DDR2';22='DDR2 FB-DIMM';24='DDR3';26='DDR4';34='DDR5'}
$modules = Get-CimInstance Win32_PhysicalMemory | ForEach-Object {
  [PSCustomObject]@{
    slot         = $_.BankLabel
    gb           = [math]::Round($_.Capacity / 1GB, 0)
    mhz          = $_.Speed
    type         = if ($memTypeMap[[int]$_.SMBIOSMemoryType]) { $memTypeMap[[int]$_.SMBIOSMemoryType] } else { "Unknown" }
    manufacturer = $_.Manufacturer.Trim()
  }
}
$total = "{0:0.0} GB" -f ((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB)
@{ total=$total; slots_used=@($modules).Count; modules=@($modules) } | ConvertTo-Json -Compress -Depth 3`.trim();
  try {
    const out = runPs(ps);
    const data = JSON.parse(out) as {
      total: string;
      slots_used: number;
      modules: object[];
    };
    return { success: true, ...data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function getStorageDevices(): {
  success: boolean;
  devices?: object[];
  error?: string;
} {
  const ps = `
try {
  $disks = Get-PhysicalDisk -ErrorAction Stop | ForEach-Object {
    [PSCustomObject]@{
      name   = $_.FriendlyName
      gb     = [math]::Round($_.Size / 1GB, 0)
      type   = $_.MediaType
      health = $_.HealthStatus
      bus    = $_.BusType
    }
  }
  @($disks) | ConvertTo-Json -Compress -Depth 2
} catch {
  # Fallback: Win32_DiskDrive
  $disks = Get-CimInstance Win32_DiskDrive | ForEach-Object {
    [PSCustomObject]@{
      name   = $_.Caption
      gb     = [math]::Round($_.Size / 1GB, 0)
      type   = "Unknown"
      health = $_.Status
      bus    = $_.InterfaceType
    }
  }
  @($disks) | ConvertTo-Json -Compress -Depth 2
}`.trim();
  try {
    const out = runPs(ps);
    const raw = JSON.parse(out);
    const devices = Array.isArray(raw) ? raw : [raw];
    return { success: true, devices };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function getAudioDevices(): {
  success: boolean;
  devices?: object[];
  error?: string;
} {
  const ps = `
$devs = Get-CimInstance Win32_SoundDevice | ForEach-Object {
  [PSCustomObject]@{
    name         = $_.Caption
    manufacturer = $_.Manufacturer
    status       = $_.Status
  }
}
if (@($devs).Count -eq 0) { Write-Output '[]' } else { @($devs) | ConvertTo-Json -Compress -Depth 2 }`.trim();
  try {
    const out = runPs(ps);
    const raw = JSON.parse(!out || out === "[]" ? "[]" : out);
    const devices = Array.isArray(raw) ? raw : raw ? [raw] : [];
    return { success: true, devices };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function getUsbDevices(): {
  success: boolean;
  devices?: object[];
  error?: string;
} {
  const ps = `
$devs = Get-PnpDevice | Where-Object {
  $_.InstanceId -like 'USB*' -and
  $_.Status -eq 'OK' -and
  $_.Class -ne 'USB' -and
  $_.FriendlyName -notlike '*Root Hub*' -and
  $_.FriendlyName -notlike '*Host Controller*'
} | ForEach-Object {
  [PSCustomObject]@{
    name  = $_.FriendlyName
    class = $_.Class
  }
} | Sort-Object name
if (@($devs).Count -eq 0) { Write-Output '[]' } else { @($devs) | ConvertTo-Json -Compress -Depth 2 }`.trim();
  try {
    const out = runPs(ps, 12_000);
    const raw = JSON.parse(!out || out === "[]" ? "[]" : out);
    const devices = Array.isArray(raw) ? raw : raw ? [raw] : [];
    return { success: true, devices };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function getWifiInfo(): WifiInfo {
  // Get-NetConnectionProfile direkt — kein Adapter-Filter, kein Textparsing, PS 5.1 kompatibel.
  // netsh nur für Signal/Rate (optional).
  const ps = `
try {
  $profiles = @(Get-NetConnectionProfile -ErrorAction SilentlyContinue)
  if ($profiles.Count -eq 0) {
    Write-Output '{"connected":false,"reason":"Kein verbundenes Netzwerkprofil gefunden."}'
    return
  }
  $profile = $profiles | Select-Object -First 1
  $ssid = $profile.Name

  $signal = ''; $recv = ''; $send = ''
  try {
    $raw = (netsh wlan show interfaces 2>$null) -join "\`n"
    if ($raw -match '(?im)Signal\\s*:\\s*(\\d+%)') { $signal = $Matches[1] }
    if ($raw -match '(?im)(Receive rate|Empfangsrate)\\s*\\(Mbps\\)\\s*:\\s*(\\S+)') { $recv = $Matches[2] }
    if ($raw -match '(?im)(Transmit rate|Senderate)\\s*\\(Mbps\\)\\s*:\\s*(\\S+)') { $send = $Matches[2] }
  } catch {}

  @{ connected=$true; ssid=$ssid; signal=$signal; receiveRate=$recv; sendRate=$send } | ConvertTo-Json -Compress
} catch {
  Write-Output ('{"connected":false,"reason":"' + $_.Exception.Message.Replace('"','') + '"}')
}`.trim();

  try {
    const out = runPs(ps);
    return { success: true, ...JSON.parse(out) };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
