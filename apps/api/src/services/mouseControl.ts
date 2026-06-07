import { execSync } from "child_process";
import * as fs from "fs";
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

const MOUSE_TYPE = `Add-Type @"
using System.Runtime.InteropServices;
public class Win32Mouse {
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
  [DllImport("user32.dll")] public static extern void mouse_event(uint flags, uint dx, uint dy, uint data, int extra);
}
"@`;

function runPs(script: string, timeoutMs = 6000): void {
  const tmpFile = path.join(os.tmpdir(), `ella-mouse-${Date.now()}.ps1`);
  try {
    fs.writeFileSync(tmpFile, script, "utf-8");
    execSync(
      `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${tmpFile}"`,
      { timeout: timeoutMs },
    );
  } finally {
    try {
      fs.unlinkSync(tmpFile);
    } catch {
      /* best effort */
    }
  }
}

function getActiveWindowTitle(): string {
  const ps = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class WinApi {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, StringBuilder sb, int count);
}
"@
$sb = New-Object System.Text.StringBuilder 256
[WinApi]::GetWindowText([WinApi]::GetForegroundWindow(), $sb, 256) | Out-Null
$sb.ToString()`.trim();

  const tmpFile = path.join(os.tmpdir(), `ella-fgwin-${Date.now()}.ps1`);
  try {
    fs.writeFileSync(tmpFile, ps, "utf-8");
    return execSync(
      `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${tmpFile}"`,
      { timeout: 4000, encoding: "utf-8" },
    ).trim();
  } catch {
    return "";
  } finally {
    try {
      fs.unlinkSync(tmpFile);
    } catch {
      /* best effort */
    }
  }
}

function isSensitiveTitle(title: string): boolean {
  const lower = title.toLowerCase();
  return BLOCKED_TITLES.some((b) => lower.includes(b));
}

export function moveMouse(
  x: number,
  y: number,
): { success: boolean; error?: string } {
  const ps = `${MOUSE_TYPE}
[Win32Mouse]::SetCursorPos(${x}, ${y}) | Out-Null`.trim();
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

export function clickAt(
  x: number,
  y: number,
  button: "left" | "right" | "middle" = "left",
  double = false,
): { success: boolean; error?: string; blockedTitle?: string } {
  const title = getActiveWindowTitle();
  if (isSensitiveTitle(title)) {
    return {
      success: false,
      error: `Klick nicht erlaubt — aktives Fenster ist sicherheitskritisch.`,
      blockedTitle: title,
    };
  }

  const downFlag = button === "right" ? 8 : button === "middle" ? 0x20 : 2;
  const upFlag = button === "right" ? 16 : button === "middle" ? 0x40 : 4;
  const singleClick = `[Win32Mouse]::SetCursorPos(${x}, ${y}) | Out-Null
[Win32Mouse]::mouse_event(${downFlag}, 0, 0, 0, 0)
[Win32Mouse]::mouse_event(${upFlag}, 0, 0, 0, 0)`;

  const ps = `${MOUSE_TYPE}
${singleClick}${double ? `\nStart-Sleep -Milliseconds 150\n${singleClick}` : ""}`.trim();

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

export function dragDrop(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): { success: boolean; error?: string } {
  const title = getActiveWindowTitle();
  if (isSensitiveTitle(title)) {
    return {
      success: false,
      error: `Drag&Drop nicht erlaubt — aktives Fenster ist sicherheitskritisch.`,
    };
  }

  const ps = `${MOUSE_TYPE}
[Win32Mouse]::SetCursorPos(${fromX}, ${fromY}) | Out-Null
Start-Sleep -Milliseconds 100
[Win32Mouse]::mouse_event(2, 0, 0, 0, 0)
$steps = 15
for ($i = 1; $i -le $steps; $i++) {
  $nx = [int](${fromX} + ($i * (${toX} - ${fromX}) / $steps))
  $ny = [int](${fromY} + ($i * (${toY} - ${fromY}) / $steps))
  [Win32Mouse]::SetCursorPos($nx, $ny) | Out-Null
  Start-Sleep -Milliseconds 15
}
[Win32Mouse]::SetCursorPos(${toX}, ${toY}) | Out-Null
Start-Sleep -Milliseconds 50
[Win32Mouse]::mouse_event(4, 0, 0, 0, 0)`.trim();

  try {
    runPs(ps, 12000);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
