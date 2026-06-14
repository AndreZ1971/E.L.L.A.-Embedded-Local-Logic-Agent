import { execSync } from "child_process";
import type { ToolResult } from "@ella/shared";

function psEncode(script: string): string {
  return Buffer.from(
    `$ProgressPreference='SilentlyContinue'\n${script}`,
    "utf16le",
  ).toString("base64");
}

export async function getDiskUsage(args: {
  drive?: string;
}): Promise<ToolResult> {
  const drive = (args.drive ?? "C").replace(":", "").toUpperCase();
  try {
    // Win32_LogicalDisk is more reliable than Get-PSDrive (also works for network drives)
    const ps = `$d=Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='${drive}:'"; if ($d) { @{Used=($d.Size-$d.FreeSpace);Free=$d.FreeSpace;Total=$d.Size} | ConvertTo-Json -Compress } else { '{}' }`;
    const raw = execSync(
      `powershell -NoProfile -NonInteractive -EncodedCommand ${psEncode(ps)}`,
      { encoding: "utf-8", timeout: 5000 },
    ).trim();
    if (!raw || raw === "{}") {
      return { success: false, error: `Laufwerk ${drive}: nicht gefunden` };
    }
    const data = JSON.parse(raw) as {
      Used: number;
      Free: number;
      Total: number;
    };
    return {
      success: true,
      output: {
        drive: `${drive}:`,
        usedBytes: data.Used,
        freeBytes: data.Free,
        totalBytes: data.Total,
      },
      executedAt: new Date().toISOString(),
    };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
