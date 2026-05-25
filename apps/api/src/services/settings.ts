import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";

export interface AppEntry {
  name: string;
  command: string;
  allowed: boolean;
}

export interface Settings {
  provider: "auto" | "openai" | "ollama";
  ollamaModel: string;
  enabledTools: string[];
  sessionLimit: number;
  openaiApiKey: string;
  apps: AppEntry[];
  voiceMode: "off" | "manual" | "wakeword";
}

const SETTINGS_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../settings.json",
);

export const DEFAULT_SETTINGS: Settings = {
  provider: "auto",
  ollamaModel: "llama3.1:8b",
  enabledTools: [
    "open_app",
    "get_disk_usage",
    "clean_temp",
    "empty_recycle_bin",
  ],
  sessionLimit: 40,
  openaiApiKey: "",
  voiceMode: "off",
  apps: [
    { name: "vscode", command: "code", allowed: true },
    { name: "notepad", command: "notepad.exe", allowed: true },
    { name: "explorer", command: "explorer.exe", allowed: true },
    { name: "terminal", command: "wt.exe", allowed: true },
    { name: "chrome", command: "chrome.exe", allowed: true },
    { name: "edge", command: "msedge.exe", allowed: true },
  ],
};

export const MASKED = "***" as const;

let current: Settings = { ...DEFAULT_SETTINGS };

export async function loadSettings(): Promise<void> {
  try {
    const raw = await fs.readFile(SETTINGS_PATH, "utf-8");
    current = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    // no file yet — keep defaults
  }
}

export async function saveSettings(patch: Partial<Settings>): Promise<void> {
  current = { ...current, ...patch };
  await fs.writeFile(SETTINGS_PATH, JSON.stringify(current, null, 2));
}

export function getSettings(): Settings {
  return current;
}

export function getActiveApiKey(envKey: string): string {
  return current.openaiApiKey || envKey;
}
