import { execSync } from 'child_process';
import type { ToolResult } from '@ella/shared';

export async function emptyRecycleBin(): Promise<ToolResult> {
  try {
    execSync('powershell -Command "Clear-RecycleBin -Force -ErrorAction SilentlyContinue"');
    return { success: true, output: 'Recycle bin emptied', executedAt: new Date().toISOString() };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
