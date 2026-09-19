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

export function getWifiInfo(): WifiInfo {
  // Get-NetAdapter ist sprachunabhängig — kein DE/EN-Problem wie bei netsh
  const ps = `
try {
  $adapter = Get-NetAdapter | Where-Object { $_.PhysicalMediaType -like '*802.11*' -and $_.Status -eq 'Up' } | Select-Object -First 1
  if (-not $adapter) {
    Write-Output '{"connected":false,"reason":"Kein aktives WLAN-Interface. PC wahrscheinlich per LAN verbunden oder WLAN deaktiviert."}'
  } else {
    $profile = Get-NetConnectionProfile -InterfaceAlias $adapter.Name -ErrorAction SilentlyContinue
    $ssid = if ($profile) { $profile.Name } else { $adapter.Name }
    $raw = (netsh wlan show interfaces 2>$null) -join "\`n"
    # Regex matcht DE (Signal/Signalstaerke) und EN (Signal)
    $signal = if ($raw -match '(?im)Signal.*?:\s*(.+)$') { $Matches[1].Trim() } else { '' }
    $recv   = if ($raw -match '(?im)(Receive rate|Empfangsrate).*?:\s*(.+)$') { $Matches[2].Trim() } else { '' }
    $send   = if ($raw -match '(?im)(Transmit rate|Senderate).*?:\s*(.+)$') { $Matches[2].Trim() } else { '' }
    @{ connected=$true; ssid=$ssid; signal=$signal; receiveRate=$recv; sendRate=$send } | ConvertTo-Json -Compress
  }
} catch {
  Write-Output '{"connected":false,"reason":"Fehler beim Abrufen der WLAN-Informationen."}'
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
