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
  const ps = `
Get-Process | Sort-Object CPU -Descending | Select-Object -First ${top} |
ForEach-Object {
  [PSCustomObject]@{
    pid    = $_.Id
    name   = $_.ProcessName
    cpuPct = [math]::Round($_.CPU, 1)
    ramMB  = [math]::Round($_.WorkingSet64 / 1MB, 1)
  }
} | ConvertTo-Json -Compress`.trim();

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
