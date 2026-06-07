import { execSync } from "child_process";
import * as fsSync from "fs";
import * as os from "os";
import * as path from "path";

const BLOCKED_TITLES = [
  "1password",
  "keepass",
  "bitwarden",
  "lastpass",
  "dashlane",
  "passwort",
  "password",
  "bank",
  "banking",
  "paypal",
  "kreditkarte",
];

function isSensitiveTitle(title: string): boolean {
  const lower = title.toLowerCase();
  return BLOCKED_TITLES.some((t) => lower.includes(t));
}

function runPs(script: string, timeout = 8000): string {
  const tmp = path.join(os.tmpdir(), `ella-wm-${Date.now()}.ps1`);
  try {
    fsSync.writeFileSync(tmp, script, "utf-8");
    return execSync(
      `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${tmp}"`,
      { encoding: "utf-8", timeout },
    ).trim();
  } finally {
    try {
      fsSync.unlinkSync(tmp);
    } catch {
      /* best effort */
    }
  }
}

export function launchApp(
  appName: string,
  args: string[] = [],
): { pid?: number; error?: string } {
  const argsStr =
    args.length > 0
      ? `-ArgumentList ${args.map((a) => `'${a.replace(/'/g, "''")}'`).join(",")} `
      : "";

  const ps = `
try {
  $p = Start-Process -FilePath '${appName.replace(/'/g, "''")}' ${argsStr}-PassThru -ErrorAction Stop
  Write-Output $p.Id
} catch {
  Write-Error $_.Exception.Message
  exit 1
}`.trim();

  try {
    const out = runPs(ps);
    const pid = parseInt(out, 10);
    return { pid: isNaN(pid) ? undefined : pid };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export function controlWindow(
  titlePattern: string,
  action: "focus" | "minimize" | "maximize" | "close",
): { found: number; error?: string } {
  if (isSensitiveTitle(titlePattern)) {
    return { found: 0, error: "Zugriff auf dieses Fenster ist nicht erlaubt." };
  }

  const actionCode: Record<string, string> = {
    focus:
      "[Win32W]::SetForegroundWindow($p.MainWindowHandle) | Out-Null; [Win32W]::ShowWindow($p.MainWindowHandle, 9) | Out-Null",
    minimize: "[Win32W]::ShowWindow($p.MainWindowHandle, 6) | Out-Null",
    maximize: "[Win32W]::ShowWindow($p.MainWindowHandle, 3) | Out-Null",
    close: "$p.CloseMainWindow() | Out-Null",
  };

  if (!actionCode[action]) return { found: 0, error: "Ungültige Aktion." };

  const ps = `
Add-Type @'
using System.Runtime.InteropServices;
public class Win32W {
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(System.IntPtr h);
  [DllImport("user32.dll")] public static extern bool ShowWindow(System.IntPtr h, int n);
}
'@
$procs = Get-Process | Where-Object {
  $_.MainWindowTitle -like '*${titlePattern.replace(/'/g, "''")}*' -and
  $_.MainWindowHandle -ne [System.IntPtr]::Zero
}
$count = 0
foreach ($p in $procs) {
  ${actionCode[action]}
  $count++
}
Write-Output $count`.trim();

  try {
    const out = runPs(ps);
    return { found: parseInt(out, 10) || 0 };
  } catch (err) {
    return {
      found: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function sendKeysToWindow(
  keys: string,
  windowTitle?: string,
): { success: boolean; error?: string } {
  if (windowTitle && isSensitiveTitle(windowTitle)) {
    return {
      success: false,
      error: "Zugriff auf dieses Fenster ist nicht erlaubt.",
    };
  }

  const activateLine = windowTitle
    ? `$wsh.AppActivate('${windowTitle.replace(/'/g, "''")}') | Out-Null\nStart-Sleep -Milliseconds 300`
    : "";

  const ps = `
$wsh = New-Object -ComObject WScript.Shell
${activateLine}
$wsh.SendKeys('${keys.replace(/'/g, "''")}')`.trim();

  try {
    runPs(ps);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
