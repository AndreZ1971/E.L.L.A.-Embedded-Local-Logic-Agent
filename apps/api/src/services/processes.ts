import { execSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

export interface RunningProcess {
  pid: number;
  name: string;
  cpuPct: number;
  ramMB: number;
}

function psTmpRun(script: string, timeout = 8000): string {
  const tmp = path.join(os.tmpdir(), `ella-ps-${Date.now()}.ps1`);
  try {
    fs.writeFileSync(tmp, script, "utf-8");
    return execSync(
      `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${tmp}"`,
      { encoding: "utf-8", timeout },
    ).trim();
  } finally {
    try {
      fs.unlinkSync(tmp);
    } catch {
      // best effort
    }
  }
}

export function listProcesses(top = 20): RunningProcess[] {
  // CPU% aus WMI (echte Rate), RAM aus Get-Process.WorkingSet64 (= Task-Manager-Wert).
  // WorkingSetPrivate in WMI liefert 0 fuer Prozesse mit hauptsaechlich shared Memory.
  const ps = `
$n = (Get-CimInstance Win32_ComputerSystem).NumberOfLogicalProcessors
$cpuMap = @{}
Get-CimInstance Win32_PerfFormattedData_PerfProc_Process |
  Where-Object { $_.Name -ne '_Total' -and $_.Name -ne 'Idle' } |
  ForEach-Object { $cpuMap[[int]$_.IDProcess] = [math]::Round($_.PercentProcessorTime / $n, 1) }
Get-Process | ForEach-Object {
  $pct = if ($cpuMap.ContainsKey($_.Id)) { $cpuMap[$_.Id] } else { 0 }
  [PSCustomObject]@{
    pid    = $_.Id
    name   = $_.ProcessName
    cpuPct = $pct
    ramMB  = [math]::Round($_.WorkingSet64 / 1MB, 1)
  }
} | Sort-Object cpuPct -Descending | Select-Object -First ${top} | ConvertTo-Json -Compress`.trim();

  const out = psTmpRun(ps);
  const data = JSON.parse(out || "[]") as unknown;
  return (Array.isArray(data) ? data : [data]) as RunningProcess[];
}

export function killProcess(nameOrPid: string): boolean {
  try {
    const isNum = /^\d+$/.test(nameOrPid);
    const cmd = isNum
      ? `Stop-Process -Id ${nameOrPid} -Force`
      : `Get-Process -Name '${nameOrPid.replace(/'/g, "''")}' -ErrorAction Stop | Stop-Process -Force`;
    psTmpRun(cmd);
    return true;
  } catch {
    return false;
  }
}
