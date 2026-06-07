import { execSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const MEDIA_TYPE = `Add-Type @"
using System.Runtime.InteropServices;
public class MediaKeys {
  [DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, int dwExtraInfo);
  public const byte VK_MEDIA_PLAY_PAUSE = 0xB3;
  public const byte VK_MEDIA_NEXT_TRACK = 0xB0;
  public const byte VK_MEDIA_PREV_TRACK = 0xB1;
  public const byte VK_MEDIA_STOP      = 0xB2;
  public const uint KEYEVENTF_KEYUP   = 0x0002;
}
"@`;

function pressKey(keyConst: string): void {
  const ps = `${MEDIA_TYPE}
[MediaKeys]::keybd_event([MediaKeys]::${keyConst}, 0, 0, 0)
Start-Sleep -Milliseconds 50
[MediaKeys]::keybd_event([MediaKeys]::${keyConst}, 0, [MediaKeys]::KEYEVENTF_KEYUP, 0)`.trim();

  const tmpFile = path.join(os.tmpdir(), `ella-media-${Date.now()}.ps1`);
  try {
    fs.writeFileSync(tmpFile, ps, "utf-8");
    execSync(
      `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${tmpFile}"`,
      { timeout: 5000 },
    );
  } finally {
    try {
      fs.unlinkSync(tmpFile);
    } catch {
      /* best effort */
    }
  }
}

export function controlMedia(action: string): {
  success: boolean;
  error?: string;
} {
  try {
    switch (action.toLowerCase()) {
      case "play":
      case "pause":
      case "toggle":
        pressKey("VK_MEDIA_PLAY_PAUSE");
        break;
      case "next":
        pressKey("VK_MEDIA_NEXT_TRACK");
        break;
      case "prev":
      case "previous":
      case "back":
        pressKey("VK_MEDIA_PREV_TRACK");
        break;
      case "stop":
        pressKey("VK_MEDIA_STOP");
        break;
      default:
        return {
          success: false,
          error: `Unbekannte Aktion "${action}". Erlaubt: play, pause, toggle, next, prev, stop`,
        };
    }
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export interface NowPlayingInfo {
  available: boolean;
  playing?: boolean;
  status?: string;
  title?: string;
  artist?: string;
  album?: string;
  error?: string;
}

export async function getNowPlaying(): Promise<NowPlayingInfo> {
  const ps = `
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media, ContentType=WindowsRuntime]

function Await-WinRT {
  param([object]$Task, [type]$Type)
  $m = ([System.WindowsRuntimeSystemExtensions].GetMethods() |
    Where-Object { $_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 })[0]
  $t = $m.MakeGenericMethod($Type).Invoke($null, @($Task))
  $t.Wait(-1) | Out-Null; $t.Result
}

try {
  $mgr = Await-WinRT (
    [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()
  ) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])

  $session = $mgr.GetCurrentSession()
  if ($null -eq $session) {
    Write-Output '{"available":false}'
  } else {
    $props = Await-WinRT ($session.TryGetMediaPropertiesAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties])
    $pb = $session.GetPlaybackInfo()
    @{
      available = $true
      playing   = ($pb.PlaybackStatus.ToString() -eq 'Playing')
      status    = $pb.PlaybackStatus.ToString()
      title     = $props.Title
      artist    = $props.Artist
      album     = $props.AlbumTitle
    } | ConvertTo-Json -Compress
  }
} catch {
  Write-Output ('{"available":false,"error":"' + $_.Exception.Message.Replace('"','') + '"}')
}`.trim();

  const tmpFile = path.join(os.tmpdir(), `ella-nowplaying-${Date.now()}.ps1`);
  try {
    fs.writeFileSync(tmpFile, ps, "utf-8");
    const out = execSync(
      `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${tmpFile}"`,
      { timeout: 10_000, encoding: "utf-8" },
    ).trim();
    return JSON.parse(out) as NowPlayingInfo;
  } catch {
    return { available: false };
  } finally {
    try {
      fs.unlinkSync(tmpFile);
    } catch {
      /* best effort */
    }
  }
}
