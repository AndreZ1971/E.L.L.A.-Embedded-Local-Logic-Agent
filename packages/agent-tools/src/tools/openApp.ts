import { exec } from "child_process";
import { promisify } from "util";
import type { ToolResult } from "@ella/shared";

const execAsync = promisify(exec);

export const DEFAULT_APP_MAP: Record<string, string> = {
  vscode: "code",
  notepad: "notepad.exe",
  explorer: "explorer.exe",
  terminal: "wt.exe",
  chrome: "chrome.exe",
  edge: "msedge.exe",
};

export async function openApp(
  args: { name: string },
  map: Record<string, string> = DEFAULT_APP_MAP,
): Promise<ToolResult> {
  const cmd = map[args.name.toLowerCase()];
  if (!cmd) {
    return {
      success: false,
      error: `Unbekannte App: '${args.name}'. Bekannt: ${Object.keys(map).join(", ")}`,
    };
  }
  try {
    await execAsync(`start "" "${cmd}"`);
    return {
      success: true,
      output: `Opened ${args.name}`,
      executedAt: new Date().toISOString(),
    };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
