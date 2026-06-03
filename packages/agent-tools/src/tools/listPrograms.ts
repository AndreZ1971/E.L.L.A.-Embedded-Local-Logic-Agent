import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import type { ToolResult } from '@ella/shared';

// Erlaubte Suchpfade — explizit ohne System32, SysWOW64, Windows\
const SEARCH_ROOTS = [
  process.env['ProgramFiles'] ?? 'C:\\Program Files',
  process.env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)',
  process.env['LOCALAPPDATA']
    ? path.join(process.env['LOCALAPPDATA'], 'Programs')
    : null,
  process.env['APPDATA']
    ? path.join(process.env['APPDATA'], 'Microsoft\\Windows\\Start Menu\\Programs')
    : null,
].filter((p): p is string => p !== null);

// Definitiv gesperrte Pfade — Directive [01] harm + [02] conceal
const BLOCKED_PATH_FRAGMENTS = [
  'system32',
  'syswow64',
  'windows\\system',
  'windows/system',
  '\\windows\\',
  '/windows/',
  'microsoft.net',
  'windowsapps',
  'windowspowershell',
];

function isBlockedPath(p: string): boolean {
  const lower = p.toLowerCase();
  return BLOCKED_PATH_FRAGMENTS.some((frag) => lower.includes(frag));
}

interface FoundApp {
  name: string;
  exe: string;
  path: string;
}

function findExesInDir(dir: string, depth = 0, maxDepth = 3): FoundApp[] {
  if (depth > maxDepth) return [];
  if (isBlockedPath(dir)) return [];

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const results: FoundApp[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (isBlockedPath(fullPath)) continue;

    if (entry.isDirectory()) {
      results.push(...findExesInDir(fullPath, depth + 1, maxDepth));
    } else if (
      entry.isFile() &&
      entry.name.toLowerCase().endsWith('.exe') &&
      // Installer, Updater und Uninstaller ausschließen
      !/unins|uninst|setup|install|update|updater|crash|helper|_x64|_x86/i.test(entry.name)
    ) {
      results.push({
        name: path.basename(entry.name, '.exe'),
        exe: entry.name,
        path: fullPath,
      });
    }
  }

  return results;
}

export async function listPrograms(args: {
  query?: string;
  limit?: number;
}): Promise<ToolResult> {
  const query = ((args.query as string) ?? '').trim().toLowerCase();
  const limit = Math.min(50, Math.max(1, Number(args.limit) || 20));

  const allApps: FoundApp[] = [];

  for (const root of SEARCH_ROOTS) {
    if (!fs.existsSync(root)) continue;
    allApps.push(...findExesInDir(root));
  }

  // Deduplizieren nach exe-Name
  const seen = new Set<string>();
  const unique = allApps.filter((a) => {
    const key = a.exe.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Filter nach Suchbegriff wenn angegeben
  const filtered = query
    ? unique.filter(
        (a) =>
          a.name.toLowerCase().includes(query) ||
          a.path.toLowerCase().includes(query),
      )
    : unique;

  // Sortieren nach Name
  filtered.sort((a, b) => a.name.localeCompare(b.name));

  const results = filtered.slice(0, limit);

  return {
    success: true,
    output: {
      total: filtered.length,
      shown: results.length,
      apps: results.map((a) => ({
        name: a.name,
        exe: a.exe,
        path: a.path,
      })),
      searchPaths: SEARCH_ROOTS,
      note: 'System32 und Windows-Systemordner werden nicht durchsucht.',
    },
    executedAt: new Date().toISOString(),
  };
}

// Findet den Pfad zu einer bestimmten App — für open_app Erweiterung
export function findAppPath(name: string): string | null {
  const query = name.toLowerCase();

  for (const root of SEARCH_ROOTS) {
    if (!fs.existsSync(root)) continue;
    const apps = findExesInDir(root);
    const match = apps.find(
      (a) =>
        a.name.toLowerCase() === query ||
        a.exe.toLowerCase() === query + '.exe',
    );
    if (match) return match.path;
  }

  return null;
}
