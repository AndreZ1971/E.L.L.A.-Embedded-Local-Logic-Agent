import { execSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

function psTmpRun(script: string, timeout = 10_000): string {
  const tmp = path.join(os.tmpdir(), `ella-remind-${Date.now()}.ps1`);
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

export function createReminder(id: string, message: string, at: Date): void {
  const time = at.toTimeString().slice(0, 5);
  const dateStr = at.toISOString().slice(0, 10);
  const safeMsg = message.replace(/'/g, "''");

  const ps = `
$action  = New-ScheduledTaskAction -Execute 'powershell.exe' \`
           -Argument '-NoProfile -WindowStyle Hidden -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show(''${safeMsg}'', ''E.L.L.A. Erinnerung'')"'
$trigger = New-ScheduledTaskTrigger -Once -At '${dateStr} ${time}'
Register-ScheduledTask -TaskName 'ELLA_${id}' -Action $action -Trigger $trigger -Force | Out-Null
Write-Output 'ok'`.trim();

  psTmpRun(ps);
}

export function deleteReminder(id: string): void {
  const ps = `Unregister-ScheduledTask -TaskName 'ELLA_${id}' -Confirm:$false -ErrorAction SilentlyContinue`;
  psTmpRun(ps, 5000);
}

export function listReminders(): Array<{
  id: string;
  name: string;
  nextRun: string;
}> {
  const ps = `
Get-ScheduledTask | Where-Object { $_.TaskName -like 'ELLA_*' } |
ForEach-Object {
  $info = $_ | Get-ScheduledTaskInfo -ErrorAction SilentlyContinue
  [PSCustomObject]@{
    id      = $_.TaskName.Substring(5)
    name    = $_.TaskName
    nextRun = if ($info -and $info.NextRunTime) { $info.NextRunTime.ToString('yyyy-MM-dd HH:mm') } else { '' }
  }
} | ConvertTo-Json -Compress`.trim();

  const out = psTmpRun(ps);
  if (!out || out === "null") return [];
  const data = JSON.parse(out) as unknown;
  return (Array.isArray(data) ? data : [data]) as Array<{
    id: string;
    name: string;
    nextRun: string;
  }>;
}
