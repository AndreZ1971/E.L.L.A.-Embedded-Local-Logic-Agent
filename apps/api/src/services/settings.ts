import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";

export interface Settings {
  provider: "auto" | "openai" | "ollama";
  ollamaModel: string;
  enabledTools: string[];
  sessionLimit: number;
  openaiApiKey: string;
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
