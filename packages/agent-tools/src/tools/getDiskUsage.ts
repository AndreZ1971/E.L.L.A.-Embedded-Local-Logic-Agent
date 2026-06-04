import { execSync } from "child_process";
import type { ToolResult } from "@ella/shared";

export async function getDiskUsage(args: {
  drive?: string;
}): Promise<ToolResult> {
  const drive = (args.drive ?? "C").replace(":", "");
  try {
    const ps = `Get-PSDrive -Name ${drive} | Select-Object Used,Free | ConvertTo-Json`;
    const raw = execSync(`powershell -Command "${ps}"`).toString();
    const data = JSON.parse(raw) as { Used: number; Free: number };
    return {
      success: true,
      output: {
        drive: `${drive}:`,
        usedBytes: data.Used,
        freeBytes: data.Free,
        totalBytes: data.Used + data.Free,
      },
      executedAt: new Date().toISOString(),
    };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
