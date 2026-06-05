import { execSync } from "child_process";

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

function isSensitive(title: string): boolean {
  const lower = title.toLowerCase();
  return BLOCKED_TITLES.some((t) => lower.includes(t));
}

export function getForegroundWindowTitle(): string | null {
  try {
    const ps = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class Win32 {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);
}
"@
$hwnd = [Win32]::GetForegroundWindow()
$sb = New-Object System.Text.StringBuilder 256
[Win32]::GetWindowText($hwnd, $sb, 256) | Out-Null
$processId = 0
[Win32]::GetWindowThreadProcessId($hwnd, [ref]$processId) | Out-Null
$proc = Get-Process -Id $processId -ErrorAction SilentlyContinue
$app = if ($proc) { $proc.ProcessName } else { '' }
$title = $sb.ToString().Trim()
if ($title -ne '') { Write-Output "$app|$title" } else { Write-Output '' }`.trim();

    const encoded = Buffer.from(ps, "utf16le").toString("base64");
    const out = execSync(
      `powershell -NoProfile -NonInteractive -EncodedCommand ${encoded}`,
      { encoding: "utf-8", timeout: 3000 },
    ).trim();

    if (!out) return null;

    const [app, ...titleParts] = out.split("|");
    const title = titleParts.join("|");

    if (!title || isSensitive(title) || isSensitive(app ?? "")) return null;

    return `${app}: ${title}`;
  } catch {
    return null;
  }
}
