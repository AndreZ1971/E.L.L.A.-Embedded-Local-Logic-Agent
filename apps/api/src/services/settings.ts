import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";

export interface AppEntry {
  name: string;
  command: string;
  allowed: boolean;
  aliases?: string[];
}

export interface SetupAction {
  tool: string;
  args: Record<string, unknown>;
  label?: string;
  delay_ms?: number;
}

export interface ScheduleConfig {
  days: number[]; // 0 = So, 1 = Mo … 6 = Sa
  time: string; // "HH:MM"
}

export interface Setup {
  id: string;
  name: string;
  open: string[];
  close: string[];
  actions?: SetupAction[];
  schedule?: ScheduleConfig;
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
  voiceMode: "off" | "manual" | "wakeword" | "always";
  setups: Setup[];
  homeworkMode: HomeworkModeConfig;
  ttsEnabled: boolean;
  ttsVoice: string;
  onboardingComplete: boolean;
  eulaAccepted: boolean;
  userName: string;
  userCity: string;
  emergencyResetAt: string | null;
  protectedDrives: string[];
  customProgramPaths: string[];
  googleClientId: string;
  googleClientSecret: string;
  googleConnected: boolean;
  googleUserEmail: string;
  musicLibraryPath: string;
  musicSearchPaths: string[];
  defaultMediaPlayer: string;
  windowContextEnabled: boolean;
  ttsEngine: "system" | "kokoro";
  sessionCompressionEnabled: boolean;
  activeProfileId: number;
  clipboardPatternEnabled: boolean;
  accessibilityMode: "none" | "blind" | "deaf";
  searchDrives: string[];
  voiceOllamaModel: string;
  modelTier: "small" | "standard" | "balanced" | "large";
  licenseActivated: boolean;
  licenseKey: string;
  licenseToken: string;
  licenseProduct: string;
  language: string;
  spokenLanguage: "de" | "en" | "es" | "fr";
  stressDetectionEnabled: boolean;
  selfLearningEnabled: boolean;
  indexedFolders: string[];
  offlineMode: boolean;
  dictationCorrection: boolean;
  dictationHotkey: string;
  appearance: "calm" | "hud" | "show";
  hudAccent: "cyan" | "violett" | "bernstein";
  hudTelemetry: boolean;
  hudThrottle: boolean;
}

// Im Installer: ELLA_USERDATA = %APPDATA%\ELLA (gesetzt von Electron main.ts)
// Im Dev-Modus: relativer Pfad vom API-Verzeichnis
const SETTINGS_PATH = process.env.ELLA_USERDATA
  ? path.join(process.env.ELLA_USERDATA, "settings.json")
  : path.join(
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
    "compose_email",
    "read_calendar",
    "create_appointment",
    "list_devices",
    "scan_network",
    "list_connections",
    "get_system_status",
    "search_web",
    "get_location",
    "get_datetime",
    "web_search",
    "fetch_url",
    "get_weather",
    "shutdown_system",
    "format_drive",
    "rename_drive",
    "list_programs",
    "pause_ella",
    "read_gmail",
    "mark_gmail",
    "read_google_calendar",
    "create_google_appointment",
    "play_music",
    "search_files",
    "open_file",
    "explore_folder",
    "rename_file",
    "copy_file",
    "create_folder",
    "create_document",
    "dictate_to_document",
    "add_task",
    "list_tasks",
    "complete_task",
    "delete_task",
    "list_processes",
    "kill_process",
    "set_volume",
    "get_clipboard",
    "set_clipboard",
    "set_reminder",
    "list_reminders",
    "delete_reminder",
    "set_alarm",
    "list_alarms",
    "delete_alarm",
    "take_screenshot",
    "write_for_me",
    "find_duplicates",
    "list_autostart",
    "list_folder",
    "describe_screen",
    "describe_image",
    "describe_webpage",
    "open_chess_window",
    "index_documents",
    "search_documents",
    "reflect_on_experiences",
    "list_printers",
    "print_document",
    "get_print_jobs",
    "cancel_print_job",
    "list_cameras",
    "capture_photo",
    "get_gpu_info",
    "get_ram_info",
    "get_storage_devices",
    "get_audio_devices",
    "get_usb_devices",
    "list_indexed_folders",
  ],
  sessionLimit: 20,
  openaiApiKey: "",
  voiceMode: "off",
  setups: [],
  homeworkMode: { pinHash: "", apps: [], active: false },
  ttsEnabled: true,
  ttsVoice: "",
  onboardingComplete: false,
  eulaAccepted: false,
  userName: "",
  userCity: "",
  emergencyResetAt: null,
  protectedDrives: ["C", "D", "E"],
  customProgramPaths: [],
  googleClientId: "",
  googleClientSecret: "",
  googleConnected: false,
  googleUserEmail: "",
  musicLibraryPath: "",
  musicSearchPaths: [],
  defaultMediaPlayer: "vlc",
  windowContextEnabled: false,
  ttsEngine: "system",
  sessionCompressionEnabled: false,
  activeProfileId: 1,
  clipboardPatternEnabled: true,
  accessibilityMode: "none",
  searchDrives: ["C"],
  voiceOllamaModel: "llama3.1:8b",
  modelTier: "standard",
  licenseActivated: false,
  licenseKey: "",
  licenseToken: "",
  licenseProduct: "",
  language: "",
  spokenLanguage: "de",
  stressDetectionEnabled: false,
  selfLearningEnabled: true,
  indexedFolders: [],
  offlineMode: false,
  dictationCorrection: false,
  dictationHotkey: "CommandOrControl+Alt+Space",
  appearance: "calm",
  hudAccent: "cyan",
  hudTelemetry: true,
  hudThrottle: true,
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
    // Migrate protectedDrives: neues Feld auffüllen
    if (!Array.isArray(parsed.protectedDrives)) {
      parsed.protectedDrives = DEFAULT_SETTINGS.protectedDrives;
    }
    // C ist immer geschützt — unveränderlich
    if (
      !parsed.protectedDrives.map((d: string) => d.toUpperCase()).includes("C")
    ) {
      parsed.protectedDrives.push("C");
    }
    // Migrate customProgramPaths
    if (!Array.isArray(parsed.customProgramPaths)) {
      parsed.customProgramPaths = DEFAULT_SETTINGS.customProgramPaths;
    }
    // Migrate Google fields
    if (typeof parsed.googleClientId !== "string")
      parsed.googleClientId = DEFAULT_SETTINGS.googleClientId;
    if (typeof parsed.googleClientSecret !== "string")
      parsed.googleClientSecret = DEFAULT_SETTINGS.googleClientSecret;
    if (typeof parsed.googleConnected !== "boolean")
      parsed.googleConnected = DEFAULT_SETTINGS.googleConnected;
    if (typeof parsed.googleUserEmail !== "string")
      parsed.googleUserEmail = DEFAULT_SETTINGS.googleUserEmail;
    // Migrate Music fields
    if (typeof parsed.musicLibraryPath !== "string")
      parsed.musicLibraryPath = DEFAULT_SETTINGS.musicLibraryPath;
    if (typeof parsed.defaultMediaPlayer !== "string")
      parsed.defaultMediaPlayer = DEFAULT_SETTINGS.defaultMediaPlayer;
    // Migrate v3.1.0 fields
    if (typeof parsed.windowContextEnabled !== "boolean")
      parsed.windowContextEnabled = DEFAULT_SETTINGS.windowContextEnabled;
    if (parsed.ttsEngine !== "system" && parsed.ttsEngine !== "kokoro")
      parsed.ttsEngine = DEFAULT_SETTINGS.ttsEngine;
    if (typeof parsed.sessionCompressionEnabled !== "boolean")
      parsed.sessionCompressionEnabled =
        DEFAULT_SETTINGS.sessionCompressionEnabled;
    if (typeof parsed.activeProfileId !== "number")
      parsed.activeProfileId = DEFAULT_SETTINGS.activeProfileId;
    if (typeof parsed.clipboardPatternEnabled !== "boolean")
      parsed.clipboardPatternEnabled = DEFAULT_SETTINGS.clipboardPatternEnabled;
    if (!["none", "blind", "deaf"].includes(parsed.accessibilityMode))
      parsed.accessibilityMode = DEFAULT_SETTINGS.accessibilityMode;
    if (!Array.isArray(parsed.musicSearchPaths))
      parsed.musicSearchPaths = DEFAULT_SETTINGS.musicSearchPaths;
    if (!Array.isArray(parsed.searchDrives))
      parsed.searchDrives = DEFAULT_SETTINGS.searchDrives;
    if (typeof parsed.voiceOllamaModel !== "string" || !parsed.voiceOllamaModel)
      parsed.voiceOllamaModel = DEFAULT_SETTINGS.voiceOllamaModel;
    if (!["small", "standard", "balanced", "large"].includes(parsed.modelTier))
      parsed.modelTier = "standard";
    if (!Array.isArray(parsed.indexedFolders))
      parsed.indexedFolders = DEFAULT_SETTINGS.indexedFolders;
    if (typeof parsed.offlineMode !== "boolean")
      parsed.offlineMode = DEFAULT_SETTINGS.offlineMode;
    if (typeof parsed.dictationCorrection !== "boolean")
      parsed.dictationCorrection = DEFAULT_SETTINGS.dictationCorrection;
    if (typeof parsed.dictationHotkey !== "string" || !parsed.dictationHotkey)
      parsed.dictationHotkey = DEFAULT_SETTINGS.dictationHotkey;
    if (!["calm", "hud", "show"].includes(parsed.appearance))
      parsed.appearance = DEFAULT_SETTINGS.appearance;
    if (!["cyan", "violett", "bernstein"].includes(parsed.hudAccent))
      parsed.hudAccent = DEFAULT_SETTINGS.hudAccent;
    if (typeof parsed.hudTelemetry !== "boolean")
      parsed.hudTelemetry = DEFAULT_SETTINGS.hudTelemetry;
    if (typeof parsed.hudThrottle !== "boolean")
      parsed.hudThrottle = DEFAULT_SETTINGS.hudThrottle;
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

export function getActiveApiKey(): string {
  return current.openaiApiKey;
}

export function cloudAllowed(): boolean {
  if (current.offlineMode) return false;
  return current.provider !== "ollama" && Boolean(current.openaiApiKey);
}

export function cloudFirst(): boolean {
  return current.provider === "openai" && cloudAllowed();
}
