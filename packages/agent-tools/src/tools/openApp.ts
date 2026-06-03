import { exec } from 'child_process';
import { promisify } from 'util';
import { findAppPath } from './listPrograms.js';
import type { ToolResult } from '@ella/shared';

const execAsync = promisify(exec);

export const DEFAULT_APP_MAP: Record<string, string> = {
  vscode: 'code',
  notepad: 'notepad.exe',
  explorer: 'explorer.exe',
  terminal: 'wt.exe',
  chrome: 'chrome.exe',
  edge: 'msedge.exe',
  firefox: 'firefox.exe',
  vlc: 'vlc.exe',
  winrar: 'winrar.exe',
  '7zip': '7zFM.exe',
  paint: 'mspaint.exe',
  calculator: 'calc.exe',
  wordpad: 'wordpad.exe',
  spotify: 'Spotify.exe',
  discord: 'Discord.exe',
  steam: 'steam.exe',
  obs: 'obs64.exe',
};

export async function openApp(
  args: { name: string },
  map: Record<string, string> = DEFAULT_APP_MAP,
): Promise<ToolResult> {
  const name = (args.name ?? '').toLowerCase().trim();
  if (!name) {
    return { success: false, error: 'Kein App-Name angegeben.' };
  }

  // 1. Bekannte Map (direkte Befehle wie 'code', 'notepad.exe')
  const mapped = map[name];
  if (mapped) {
    try {
      await execAsync(`start "" "${mapped}"`);
      return {
        success: true,
        output: `${args.name} geöffnet.`,
        executedAt: new Date().toISOString(),
      };
    } catch (err) {
      // Fallthrough — vielleicht findet findAppPath es trotzdem
    }
  }

  // 2. Dynamische Suche in Program Files + Program Files (x86)
  //    System32 ist durch findAppPath/BLOCKED_PATH_FRAGMENTS ausgeschlossen
  const found = findAppPath(name);
  if (found) {
    try {
      await execAsync(`start "" "${found}"`);
      return {
        success: true,
        output: `${args.name} geöffnet (gefunden in ${found}).`,
        executedAt: new Date().toISOString(),
      };
    } catch (err) {
      return {
        success: false,
        error: `Gefunden in ${found}, aber Start fehlgeschlagen: ${String(err)}`,
      };
    }
  }

  // 3. Nicht gefunden
  const known = Object.keys(map).join(', ');
  return {
    success: false,
    error: `"${args.name}" nicht gefunden. Direkt bekannte Apps: ${known}. Oder frage mich "Welche Programme sind installiert?"`,
  };
}
