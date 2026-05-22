import { execSync } from 'child_process';
import type { ToolResult } from '@ella/shared';

const SCOPE_PATHS: Record<string, string> = {
  user:   '%TEMP%',
  system: '%SystemRoot%\\Temp',
};

export async function cleanTemp(args: { scope?: string }): Promise<ToolResult> {
  const scope = args.scope ?? 'user';
  const path = SCOPE_PATHS[scope];
  if (!path) {
    return { success: false, error: `Unknown scope: '${scope}'. Use 'user' or 'system'.` };
  }
  try {
    execSync(`cmd /c "del /q /f /s ${path}\\* 2>nul"`);
    return { success: true, output: `Temp cleaned (scope: ${scope})`, executedAt: new Date().toISOString() };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
