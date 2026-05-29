import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";

export interface AppEntry {
  name: string;
  command: string;
  allowed: boolean;
}

export interface Setup {
  id: string;
  name: string;
  open: string[];
  close: string[];
}

export interface HomeworkModeConfig {
  pinHash: string;
  apps: string[];
  active: boolean;
}

export interface Settings {
  provider: "auto" | "openai" | "ollama";
  ollamaModel: string;
  enabledTools: string[];
  sessionLimit: number;
  openaiApiKey: string;
  apps: AppEntry[];
  voiceMode: "off" | "manual" | "wakeword";
  setups: Setup[];
  homeworkMode: HomeworkModeConfig;
  ttsEnabled: boolean;
  ttsVoice: string;
  onboardingComplete: boolean;
  eulaAccepted: boolean;
  emergencyResetAt: string | null;
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
    "remember",
    "forget",
    "list_memories",
    "homework_mode",
    "get_system_info",
    "create_setup",
    "update_setting",
    "create_rule",
    "free_ram",
    "read_emails",
    "mark_email",
    "read_calendar",
    "create_appointment",
    "list_devices",
    "scan_network",
    "list_connections",
    "get_system_status",
    "search_web",
    "get_location",
  ],
  sessionLimit: 40,
  openaiApiKey: "",
  voiceMode: "off",
  setups: [],
  homeworkMode: { pinHash: "", apps: [], active: false },
  ttsEnabled: false,
  ttsVoice: "",
  onboardingComplete: false,
  eulaAccepted: false,
  emergencyResetAt: null,
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
    const parsed = JSON.parse(raw);
    // Migrate old setup format: apps[] → open[]
    if (Array.isArray(parsed.setups)) {
      parsed.setups = parsed.setups.map((s: Record<string, unknown>) => ({
        ...s,
        open: Array.isArray(s.open)
          ? s.open
          : Array.isArray(s.apps)
            ? s.apps
            : [],
        close: Array.isArray(s.close) ? s.close : [],
      }));
    }
    // Migrate homeworkMode: fill in missing fields
    if (parsed.homeworkMode && typeof parsed.homeworkMode === "object") {
      parsed.homeworkMode = {
        ...DEFAULT_SETTINGS.homeworkMode,
        ...parsed.homeworkMode,
      };
    }
    // Migrate enabledTools: add any new default tools missing from old settings files
    if (Array.isArray(parsed.enabledTools)) {
      const missing = DEFAULT_SETTINGS.enabledTools.filter(
        (t) => !(parsed.enabledTools as string[]).includes(t),
      );
      if (missing.length > 0) {
        parsed.enabledTools = [...parsed.enabledTools, ...missing];
      }
    }
    current = { ...DEFAULT_SETTINGS, ...parsed };
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
