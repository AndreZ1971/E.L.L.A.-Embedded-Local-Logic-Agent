import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@ella/agent-tools", () => ({
  openApp: vi.fn(),
  getDiskUsage: vi
    .fn()
    .mockResolvedValue({ success: true, output: "50 GB free" }),
  cleanTemp: vi.fn(),
  emptyRecycleBin: vi.fn(),
}));
vi.mock("child_process", () => ({
  execSync: vi.fn(),
  exec: vi.fn(),
  spawn: vi.fn(() => ({ unref: vi.fn() })),
}));
vi.mock("../../services/music.js", () => ({
  searchMusic: vi.fn(),
  openWithPlayer: vi.fn(),
}));
vi.mock("../../services/textCorrection.js", () => ({
  correctText: vi.fn((t: string) => Promise.resolve(t + " [korrigiert]")),
}));
vi.mock("../../services/processes.js", () => ({
  listProcesses: vi.fn(() => [
    { pid: 1, name: "notepad", cpuPct: 0.5, ramMB: 12 },
  ]),
  killProcess: vi.fn(() => true),
}));
vi.mock("../../services/clipboardHistory.js", () => ({
  recordClipboard: vi.fn(),
  getClipboardHistory: vi.fn(() => []),
  getLastClipboard: vi.fn(() => null),
}));
vi.mock("../../services/tasks.js", () => ({
  addTask: vi.fn((title: string) =>
    Promise.resolve({
      id: 42,
      title,
      status: "pending",
      priority: "normal",
      dueDate: null,
      note: null,
    }),
  ),
  listTasks: vi.fn(() =>
    Promise.resolve([
      {
        id: 1,
        title: "Arzt anrufen",
        priority: "high",
        dueDate: "2026-06-10",
        note: null,
      },
    ]),
  ),
  completeTask: vi.fn(() => Promise.resolve(true)),
  deleteTask: vi.fn(() => Promise.resolve(true)),
}));
vi.mock("../../services/reminder.js", () => ({
  createReminder: vi.fn().mockResolvedValue(undefined),
  deleteReminder: vi.fn(),
  listReminders: vi.fn(() => []),
}));
vi.mock("../../services/vision.js", () => ({
  analyzeScreenshot: vi.fn(() => Promise.resolve("Ein Desktop.")),
  describeImageFile: vi.fn(() =>
    Promise.resolve("Ein Foto mit einem Hund auf einer Wiese."),
  ),
  describeWebpage: vi.fn(() =>
    Promise.resolve("Eine Webseite mit Navigationleiste und Hauptinhalt."),
  ),
}));
vi.mock("../../services/styleProfile.js", () => ({
  buildStyleProfile: vi.fn(() => Promise.resolve("")),
  writeInUserStyle: vi.fn(() => Promise.resolve("Sehr geehrter Herr Müller")),
}));
vi.mock("../../services/duplicateFinder.js", () => ({
  findDuplicates: vi.fn(() => [
    { hash: "dup_0", size: 1024000, files: ["a.pdf", "b.pdf"], wastedMB: 1.0 },
  ]),
}));
vi.mock("../../services/windowManager.js", () => ({
  launchApp: vi.fn(() => ({ pid: 1234 })),
  controlWindow: vi.fn(() => ({ found: 1 })),
  sendKeysToWindow: vi.fn(() => ({ success: true })),
}));
vi.mock("../../services/fileOps.js", () => ({
  deleteToRecycleBin: vi.fn(() => ({ success: true })),
}));
vi.mock("../../services/serviceManager.js", () => ({
  listServicesPs: vi.fn(() => [
    {
      name: "Spooler",
      displayName: "Print Spooler",
      status: "Running",
      startType: "Automatic",
    },
  ]),
  controlService: vi.fn(() => ({ success: true })),
}));
vi.mock("../../services/ocr.js", () => ({
  readScreenOcr: vi.fn(() => Promise.resolve("Hallo Welt OCR")),
  readScreenOcrElements: vi.fn(() =>
    Promise.resolve({
      text: "Speichern Abbrechen OK",
      elements: [
        { text: "Speichern", x: 100, y: 50, w: 80, h: 25 },
        { text: "Abbrechen", x: 200, y: 50, w: 80, h: 25 },
        { text: "OK", x: 300, y: 50, w: 30, h: 25 },
      ],
    }),
  ),
}));
vi.mock("../../services/fileManager.js", () => ({
  readFileContent: vi.fn(() =>
    Promise.resolve({
      success: true,
      content: "Zeile 1\nZeile 2",
      truncated: false,
    }),
  ),
  renameFile: vi.fn(() => ({ success: true, newPath: "E:\\Datei_neu.txt" })),
  copyFile: vi.fn(() => ({ success: true })),
  createFolder: vi.fn(() => ({ success: true })),
}));
vi.mock("../../services/mediaControl.js", () => ({
  controlMedia: vi.fn(() => ({ success: true })),
  getNowPlaying: vi.fn(() =>
    Promise.resolve({
      available: true,
      playing: true,
      title: "Test Song",
      artist: "Test Artist",
      album: "Test Album",
    }),
  ),
}));
vi.mock("../../services/systemComfort.js", () => ({
  toggleDarkMode: vi.fn(() => ({ success: true, mode: "dark" })),
  getBatteryStatus: vi.fn(() => ({
    success: true,
    available: true,
    chargePercent: 80,
    charging: false,
    statusText: "Entladen",
  })),
  getTemperatures: vi.fn(() => ({
    success: true,
    available: true,
    zones: [{ name: "Zone 0", celsius: 45.5 }],
  })),
  getEventLog: vi.fn(() => ({
    success: true,
    events: [
      {
        time: "01.06.2026 10:00",
        level: "Fehler",
        source: "Application Error",
        message: "Prozess abgestürzt",
      },
    ],
  })),
  getWifiInfo: vi.fn(() => ({
    success: true,
    connected: true,
    ssid: "MeinWLAN",
    signal: "80%",
    receiveRate: "120 Mbps",
  })),
}));
vi.mock("../../services/textProcessing.js", () => ({
  translateText: vi.fn(() => Promise.resolve("Hello World")),
  summarizeText: vi.fn(() => Promise.resolve("Kurze Zusammenfassung.")),
}));
vi.mock("../../services/mouseControl.js", () => ({
  moveMouse: vi.fn(() => ({ success: true })),
  clickAt: vi.fn(() => ({ success: true })),
  dragDrop: vi.fn(() => ({ success: true })),
}));
vi.mock("../../services/shellRunner.js", () => ({
  runSafeCommand: vi.fn(() => ({ success: true, output: "PID 1234" })),
}));
vi.mock("util", () => ({
  promisify: vi.fn((fn: unknown) =>
    vi.fn().mockResolvedValue({ stdout: "", stderr: "" }),
  ),
}));
vi.mock("../../config/database.js", () => ({
  pool: { execute: vi.fn().mockResolvedValue([[], []]) },
}));
vi.mock("../../config/env.js", () => ({
  env: { ollamaBaseUrl: "http://localhost:11434", openaiApiKey: "" },
}));
vi.mock("../../services/settings.js", () => ({
  getSettings: vi.fn(() => ({
    enabledTools: ["get_disk_usage", "clean_temp", "open_app"],
    apps: [],
    homeworkMode: { active: false, apps: [], pinHash: "" },
    setups: [],
  })),
  saveSettings: vi.fn(),
}));
vi.mock("../../services/rules.js", () => ({
  evaluateRules: vi.fn().mockResolvedValue("allow"),
  createRule: vi.fn(),
  DIRECTIVE_DENY: new Set<string>(),
}));
vi.mock("../../services/homework.js", () => ({
  activateHomeworkMode: vi.fn(),
  deactivateHomeworkMode: vi.fn(),
}));
vi.mock("../../services/memory.js", () => ({
  remember: vi.fn(),
  forgetById: vi.fn(),
  listMemories: vi.fn().mockResolvedValue([]),
  trackToolUsage: vi.fn(),
}));
vi.mock("../../services/systemScan.js", () => ({
  scanHardware: vi.fn(() => ({
    computerName: "TEST-PC",
    cpu: "i9",
    gpu: "RTX",
    ramLabel: "32 GB",
  })),
  runSystemScan: vi.fn(),
}));
vi.mock("../../services/worker.js", () => ({
  getPnPSnapshot: vi.fn(() => new Map()),
  getArpSnapshot: vi.fn(() => []),
  getTcpConnections: vi.fn().mockResolvedValue([]),
}));
vi.mock("../../services/mail.js", () => ({
  readEmails: vi.fn(() => ({
    source: "none",
    error: "not available",
    items: [],
  })),
  markEmail: vi.fn(),
}));
vi.mock("../../services/calendar.js", () => ({
  readCalendar: vi.fn(() => []),
  createAppointment: vi.fn(),
}));

import {
  toolExecutor,
  getDriveType,
  getDriveSizeLabel,
} from "../../tools/executor.js";
import { getSettings } from "../../services/settings.js";
import { evaluateRules } from "../../services/rules.js";
import { getDiskUsage } from "@ella/agent-tools";
import { execSync } from "child_process";
import { searchMusic, openWithPlayer } from "../../services/music.js";
import { correctText } from "../../services/textCorrection.js";
import {
  listProcesses,
  killProcess as killSystemProcess,
} from "../../services/processes.js";
import { getLastClipboard } from "../../services/clipboardHistory.js";
import { analyzeScreenshot } from "../../services/vision.js";
import { writeInUserStyle } from "../../services/styleProfile.js";
import {
  addTask,
  listTasks,
  completeTask,
  deleteTask,
} from "../../services/tasks.js";
import {
  launchApp,
  controlWindow,
  sendKeysToWindow,
} from "../../services/windowManager.js";
import { deleteToRecycleBin } from "../../services/fileOps.js";
import {
  listServicesPs,
  controlService,
} from "../../services/serviceManager.js";
import { readScreenOcr, readScreenOcrElements } from "../../services/ocr.js";
import { moveMouse, clickAt, dragDrop } from "../../services/mouseControl.js";
import { runSafeCommand } from "../../services/shellRunner.js";
import {
  readFileContent,
  renameFile,
  copyFile,
  createFolder,
} from "../../services/fileManager.js";
import { controlMedia, getNowPlaying } from "../../services/mediaControl.js";
import {
  toggleDarkMode,
  getBatteryStatus,
  getTemperatures,
  getEventLog,
  getWifiInfo,
} from "../../services/systemComfort.js";
import { translateText, summarizeText } from "../../services/textProcessing.js";
import { pool } from "../../config/database.js";

describe("toolExecutor", () => {
  beforeEach(() => {
    vi.mocked(getSettings).mockReturnValue({
      enabledTools: ["get_disk_usage", "clean_temp", "open_app"],
      apps: [],
      homeworkMode: { active: false, apps: [], pinHash: "" },
      setups: [],
    } as any);
    vi.mocked(evaluateRules).mockResolvedValue("allow");
  });

  it("rejects a disabled tool", async () => {
    vi.mocked(getSettings).mockReturnValue({
      enabledTools: [],
      apps: [],
      homeworkMode: { active: false, apps: [], pinHash: "" },
      setups: [],
    } as any);
    const result = await toolExecutor.execute({
      tool: "get_disk_usage",
      args: {},
    });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/deaktiviert/);
  });

  it("returns deny error when evaluateRules returns deny", async () => {
    vi.mocked(evaluateRules).mockResolvedValue("deny");
    const result = await toolExecutor.execute({
      tool: "get_disk_usage",
      args: {},
    });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/grundsätzlich nicht erlaubt/);
  });

  it("returns fallback error when evaluateRules returns no_match", async () => {
    vi.mocked(evaluateRules).mockResolvedValue("no_match");
    const result = await toolExecutor.execute({
      tool: "get_disk_usage",
      args: {},
    });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/leider nicht ausführen/);
  });

  it("calls handler and returns result when tool is allowed", async () => {
    vi.mocked(getDiskUsage).mockResolvedValue({
      success: true,
      output: "C: 80 GB free",
    });
    const result = await toolExecutor.execute({
      tool: "get_disk_usage",
      args: { drive: "C" },
    });
    expect(result.success).toBe(true);
  });
});

describe("format_drive", () => {
  const mockSettings = {
    enabledTools: ["format_drive", "rename_drive"],
    apps: [],
    homeworkMode: { active: false, apps: [], pinHash: "" },
    setups: [],
    protectedDrives: ["C", "D"],
  };

  beforeEach(() => {
    vi.mocked(getSettings).mockReturnValue(mockSettings as any);
    vi.mocked(evaluateRules).mockResolvedValue("allow");
  });

  it("blockiert C: immer — directive:true", async () => {
    const result = await toolExecutor.execute({
      tool: "format_drive",
      args: { drive: "C" },
    });
    expect(result.success).toBe(false);
    expect(result.directive).toBe(true);
    expect(result.error).toMatch(/geschützt/);
  });

  it("blockiert C: auch wenn protectedDrives leer wäre", async () => {
    vi.mocked(getSettings).mockReturnValue({
      ...mockSettings,
      protectedDrives: [],
    } as any);
    const result = await toolExecutor.execute({
      tool: "format_drive",
      args: { drive: "C" },
    });
    expect(result.directive).toBe(true);
  });

  it("blockiert D: (in protectedDrives) — directive:true", async () => {
    const result = await toolExecutor.execute({
      tool: "format_drive",
      args: { drive: "D" },
    });
    expect(result.success).toBe(false);
    expect(result.directive).toBe(true);
  });

  it("blockiert internes Laufwerk DriveType 3 — directive:true", async () => {
    // PowerShell Get-CimInstance gibt nur die Zahl zurück
    vi.mocked(execSync).mockReturnValue("3" as any);
    const result = await toolExecutor.execute({
      tool: "format_drive",
      args: { drive: "F" },
    });
    expect(result.success).toBe(false);
    expect(result.directive).toBe(true);
    expect(result.error).toMatch(/internes Laufwerk/);
  });

  it("gibt requiresConfirmation für USB-Stick (DriveType 2)", async () => {
    vi.mocked(execSync)
      .mockReturnValueOnce("2" as any) // getDriveType → PowerShell gibt "2" zurück
      .mockReturnValueOnce("8589934592" as any); // getDriveSizeLabel (8 GB)
    const result = await toolExecutor.execute({
      tool: "format_drive",
      args: { drive: "E" },
    });
    expect(result.success).toBe(false);
    expect(result.requiresConfirmation).toBe(true);
    expect(result.confirmationMessage).toContain("E:");
    expect(result.pendingAction?.tool).toBe("format_drive_confirmed");
  });
});

describe("rename_drive", () => {
  const mockSettings = {
    enabledTools: ["format_drive", "rename_drive"],
    apps: [],
    homeworkMode: { active: false, apps: [], pinHash: "" },
    setups: [],
    protectedDrives: ["C", "D"],
  };

  beforeEach(() => {
    vi.mocked(getSettings).mockReturnValue(mockSettings as any);
    vi.mocked(evaluateRules).mockResolvedValue("allow");
  });

  it("blockiert D: (geschützt) — directive:true", async () => {
    const result = await toolExecutor.execute({
      tool: "rename_drive",
      args: { drive: "D", label: "Backup" },
    });
    expect(result.success).toBe(false);
    expect(result.directive).toBe(true);
  });

  it("benennt E: erfolgreich um", async () => {
    vi.mocked(execSync).mockReturnValue('{"success":true}' as any);
    const result = await toolExecutor.execute({
      tool: "rename_drive",
      args: { drive: "E", label: "USB-Stick" },
    });
    expect(result.success).toBe(true);
  });

  it("fehlt label → Fehler", async () => {
    const result = await toolExecutor.execute({
      tool: "rename_drive",
      args: { drive: "E", label: "" },
    });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Name fehlt/);
  });
});

describe("pause_ella", () => {
  beforeEach(() => {
    vi.mocked(getSettings).mockReturnValue({
      enabledTools: ["pause_ella"],
      apps: [],
      homeworkMode: { active: false, apps: [], pinHash: "" },
      setups: [],
      protectedDrives: ["C", "D"],
      customProgramPaths: [],
    } as any);
    vi.mocked(evaluateRules).mockResolvedValue("allow");
  });

  it("gibt korrekte Dauer zurück", async () => {
    const result = await toolExecutor.execute({
      tool: "pause_ella",
      args: { minutes: 5 },
    });
    expect(result.success).toBe(true);
    expect((result.output as any).minutes).toBe(5);
    expect((result.output as any).paused).toBe(true);
    expect((result.output as any).resumeAt).toBeDefined();
  });

  it("begrenzt auf 120 Minuten", async () => {
    const result = await toolExecutor.execute({
      tool: "pause_ella",
      args: { minutes: 999 },
    });
    expect((result.output as any).minutes).toBe(120);
  });

  it("Standard 10 Minuten wenn kein Argument", async () => {
    const result = await toolExecutor.execute({
      tool: "pause_ella",
      args: {},
    });
    expect((result.output as any).minutes).toBe(10);
  });

  it("Minimum 1 Minute bei negativem Wert", async () => {
    const result = await toolExecutor.execute({
      tool: "pause_ella",
      args: { minutes: -5 },
    });
    expect((result.output as any).minutes).toBe(1);
  });
});

describe("list_programs", () => {
  beforeEach(() => {
    vi.mocked(evaluateRules).mockResolvedValue("allow");
  });

  it("gibt nur Namen zurück — keine Pfade", async () => {
    vi.mocked(getSettings).mockReturnValue({
      enabledTools: ["list_programs"],
      apps: [
        { name: "Chrome", command: "C:\\chrome.exe", allowed: true },
        { name: "VSCode", command: "C:\\code.exe", allowed: true },
      ],
      homeworkMode: { active: false, apps: [], pinHash: "" },
      setups: [],
      protectedDrives: ["C"],
      customProgramPaths: [],
    } as any);
    const result = await toolExecutor.execute({
      tool: "list_programs",
      args: {},
    });
    expect(result.success).toBe(true);
    const programs = (result.output as any).programs as string[];
    expect(programs).toContain("Chrome");
    expect(programs).toContain("VSCode");
    const hasPath = programs.some((p) => p.includes("\\") || p.includes("/"));
    expect(hasPath).toBe(false);
  });

  it("filtert nach Suchbegriff", async () => {
    vi.mocked(getSettings).mockReturnValue({
      enabledTools: ["list_programs"],
      apps: [
        { name: "Chrome", command: "C:\\chrome.exe", allowed: true },
        { name: "Firefox", command: "C:\\firefox.exe", allowed: true },
        { name: "VSCode", command: "C:\\code.exe", allowed: true },
      ],
      homeworkMode: { active: false, apps: [], pinHash: "" },
      setups: [],
      protectedDrives: ["C"],
      customProgramPaths: [],
    } as any);
    const result = await toolExecutor.execute({
      tool: "list_programs",
      args: { filter: "fire" },
    });
    const programs = (result.output as any).programs as string[];
    expect(programs).toContain("Firefox");
    expect(programs).not.toContain("Chrome");
    expect(programs).not.toContain("VSCode");
  });

  it("gibt nur erlaubte Apps zurück", async () => {
    vi.mocked(getSettings).mockReturnValue({
      enabledTools: ["list_programs"],
      apps: [
        { name: "Chrome", command: "C:\\chrome.exe", allowed: true },
        { name: "BadApp", command: "C:\\bad.exe", allowed: false },
      ],
      homeworkMode: { active: false, apps: [], pinHash: "" },
      setups: [],
      protectedDrives: ["C"],
      customProgramPaths: [],
    } as any);
    const result = await toolExecutor.execute({
      tool: "list_programs",
      args: {},
    });
    const programs = (result.output as any).programs as string[];
    expect(programs).toContain("Chrome");
    expect(programs).not.toContain("BadApp");
  });
});

describe("play_music", () => {
  const baseSettings = {
    enabledTools: ["play_music"],
    apps: [{ name: "vlc", command: "C:\\vlc.exe", allowed: true }],
    homeworkMode: { active: false, apps: [], pinHash: "" },
    setups: [],
    protectedDrives: ["C"],
    customProgramPaths: [],
    musicLibraryPath: "H:\\",
    defaultMediaPlayer: "vlc",
  };

  beforeEach(() => {
    vi.mocked(evaluateRules).mockResolvedValue("allow");
    vi.mocked(openWithPlayer).mockReturnValue(undefined);
  });

  it("Fehler wenn keine Musikbibliothek konfiguriert", async () => {
    vi.mocked(getSettings).mockReturnValue({
      ...baseSettings,
      musicLibraryPath: "",
    } as any);
    const result = await toolExecutor.execute({
      tool: "play_music",
      args: {},
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("konfiguriert");
  });

  it("Fehler wenn Player nicht in apps[]", async () => {
    vi.mocked(getSettings).mockReturnValue({
      ...baseSettings,
      apps: [],
    } as any);
    const result = await toolExecutor.execute({
      tool: "play_music",
      args: {},
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("nicht gefunden");
  });

  it("Fehler wenn Suche kein Ergebnis liefert", async () => {
    vi.mocked(getSettings).mockReturnValue(baseSettings as any);
    vi.mocked(searchMusic).mockReturnValue(null);
    const result = await toolExecutor.execute({
      tool: "play_music",
      args: { query: "xyzNichtVorhanden" },
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("Keine Musik gefunden");
  });

  it("oeffnet gesamte Bibliothek ohne Query", async () => {
    vi.mocked(getSettings).mockReturnValue(baseSettings as any);
    const result = await toolExecutor.execute({
      tool: "play_music",
      args: {},
    });
    expect(result.success).toBe(true);
    expect(result.output).toContain("Musikbibliothek");
    expect(openWithPlayer).toHaveBeenCalledWith("C:\\vlc.exe", "H:\\");
  });

  it("oeffnet gefundenen Kuenstler-Ordner", async () => {
    vi.mocked(getSettings).mockReturnValue(baseSettings as any);
    vi.mocked(searchMusic).mockReturnValue({
      path: "H:\\AC DC",
      title: "AC DC",
      isFolder: true,
    });
    const result = await toolExecutor.execute({
      tool: "play_music",
      args: { query: "AC DC" },
    });
    expect(result.success).toBe(true);
    expect(openWithPlayer).toHaveBeenCalledWith("C:\\vlc.exe", "H:\\AC DC");
  });
});

const prodToolSettings = {
  enabledTools: [
    "search_files",
    "open_file",
    "explore_folder",
    "create_document",
    "dictate_to_document",
    "compose_email",
  ],
  apps: [{ name: "Word", command: "C:\\Word\\winword.exe", allowed: true }],
  homeworkMode: { active: false, apps: [], pinHash: "" },
  setups: [],
  protectedDrives: ["Z"],
  customProgramPaths: [],
  musicLibraryPath: "",
  defaultMediaPlayer: "vlc",
  provider: "auto" as const,
  ollamaModel: "llama3.1:8b",
  openaiApiKey: "",
};

describe("search_files", () => {
  beforeEach(() => {
    vi.mocked(evaluateRules).mockResolvedValue("allow");
    vi.mocked(getSettings).mockReturnValue(prodToolSettings as any);
    vi.mocked(execSync).mockReturnValue(
      JSON.stringify([
        {
          name: "Angebot.docx",
          path: "H:\\Docs\\Angebot.docx",
          size: 12.5,
          changed: "2025-01-01 10:00",
          ext: ".docx",
        },
      ]) as any,
    );
  });

  it("search_files — Fehler wenn kein Suchbegriff", async () => {
    const result = await toolExecutor.execute({
      tool: "search_files",
      args: {},
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("Suchbegriff");
  });

  it("search_files — gibt Treffer zurück", async () => {
    vi.mocked(execSync).mockReturnValue(
      JSON.stringify([
        {
          name: "Angebot.docx",
          path: "H:\\Angebot.docx",
          size: 12,
          changed: "2025-01-01 10:00",
          ext: ".docx",
        },
      ]) as any,
    );
    const result = await toolExecutor.execute({
      tool: "search_files",
      args: { query: "Angebot" },
    });
    expect(result.success).toBe(true);
    expect((result.output as any).count).toBe(1);
  });
});

describe("open_file", () => {
  beforeEach(() => {
    vi.mocked(evaluateRules).mockResolvedValue("allow");
    vi.mocked(getSettings).mockReturnValue(prodToolSettings as any);
    vi.mocked(execSync).mockReturnValue("" as any);
  });

  it("open_file — Fehler wenn kein Pfad", async () => {
    const result = await toolExecutor.execute({ tool: "open_file", args: {} });
    expect(result.success).toBe(false);
    expect(result.error).toContain("fehlt");
  });

  it("open_file — blockiert .exe Dateien", async () => {
    const result = await toolExecutor.execute({
      tool: "open_file",
      args: { path: "C:\\Windows\\evil.exe" },
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("open_app");
  });
});

describe("explore_folder", () => {
  beforeEach(() => {
    vi.mocked(evaluateRules).mockResolvedValue("allow");
    vi.mocked(getSettings).mockReturnValue(prodToolSettings as any);
    vi.mocked(execSync).mockReturnValue("" as any);
  });

  it("explore_folder — Fehler wenn kein Pfad", async () => {
    const result = await toolExecutor.execute({
      tool: "explore_folder",
      args: {},
    });
    expect(result.success).toBe(false);
  });

  it("explore_folder — Erfolg", async () => {
    const result = await toolExecutor.execute({
      tool: "explore_folder",
      args: { path: "E:\\Dokumente" },
    });
    expect(result.success).toBe(true);
    expect(result.output).toContain("Explorer");
  });
});

describe("list_folder", () => {
  beforeEach(() => {
    vi.mocked(evaluateRules).mockResolvedValue("allow");
    vi.mocked(getSettings).mockReturnValue({
      ...prodToolSettings,
      enabledTools: [...prodToolSettings.enabledTools, "list_folder"],
    } as any);
  });

  it("list_folder — Fehler wenn kein Pfad", async () => {
    const result = await toolExecutor.execute({
      tool: "list_folder",
      args: {},
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("fehlt");
  });

  it("list_folder — gibt Ordnerinhalt zurück", async () => {
    vi.mocked(execSync).mockReturnValue(
      JSON.stringify([
        {
          name: "Musik",
          type: "folder",
          size_kb: null,
          modified: "2026-01-01 10:00",
          ext: "",
        },
        {
          name: "track.mp3",
          type: "file",
          size_kb: 4096,
          modified: "2026-01-01 11:00",
          ext: ".mp3",
        },
      ]) as any,
    );
    const result = await toolExecutor.execute({
      tool: "list_folder",
      args: { path: "H:\\" },
    });
    expect(result.success).toBe(true);
    expect((result.output as any).total).toBe(2);
    expect((result.output as any).folders).toBe(1);
    expect((result.output as any).files).toBe(1);
  });
});

describe("dictate_to_document", () => {
  beforeEach(() => {
    vi.mocked(evaluateRules).mockResolvedValue("allow");
    vi.mocked(getSettings).mockReturnValue(prodToolSettings as any);
    vi.mocked(execSync).mockReturnValue(
      JSON.stringify({ success: true }) as any,
    );
    vi.mocked(correctText).mockClear();
    vi.mocked(correctText).mockResolvedValue(
      "Ich habe morgen einen Termin. [korrigiert]",
    );
  });

  it("dictate_to_document — Fehler wenn kein Text", async () => {
    const result = await toolExecutor.execute({
      tool: "dictate_to_document",
      args: {},
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("Text");
  });

  it("dictate_to_document — ruft correctText auf", async () => {
    vi.mocked(execSync).mockReturnValue("" as any);
    const result = await toolExecutor.execute({
      tool: "dictate_to_document",
      args: { text: "ich hab morgen en termin", target: "word" },
    });
    expect(correctText).toHaveBeenCalledWith("ich hab morgen en termin");
    expect(result.success).toBe(true);
    expect((result.output as any).corrections).toBe(true);
  });

  it("dictate_to_document — correct:false überspringt Korrektur", async () => {
    vi.mocked(execSync).mockReturnValue("" as any);
    const result = await toolExecutor.execute({
      tool: "dictate_to_document",
      args: { text: "hallo welt", target: "word", correct: false },
    });
    expect(correctText).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect((result.output as any).corrections).toBe(false);
  });
});

describe("compose_email", () => {
  beforeEach(() => {
    vi.mocked(evaluateRules).mockResolvedValue("allow");
    vi.mocked(getSettings).mockReturnValue(prodToolSettings as any);
    vi.mocked(execSync).mockReturnValue("" as any);
    vi.mocked(correctText).mockResolvedValue("Hallo Herr Müller. [korrigiert]");
  });

  it("compose_email — Erfolg ohne Empfänger", async () => {
    const result = await toolExecutor.execute({
      tool: "compose_email",
      args: { subject: "Test", body: "Hallo" },
    });
    expect(result.success).toBe(true);
    expect(result.output).toContain("Entwurf");
  });

  it("compose_email — nennt Empfänger in Ausgabe", async () => {
    const result = await toolExecutor.execute({
      tool: "compose_email",
      args: {
        to: "mueller@example.com",
        subject: "Test",
        body: "Hallo Herr Mueller",
      },
    });
    expect(result.success).toBe(true);
    expect(result.output).toContain("mueller@example.com");
  });
});

const wowSettings = {
  enabledTools: [
    "list_processes",
    "kill_process",
    "set_volume",
    "get_clipboard",
    "set_clipboard",
    "set_reminder",
    "list_reminders",
    "delete_reminder",
    "take_screenshot",
    "write_for_me",
    "find_duplicates",
    "list_autostart",
    "add_task",
    "list_tasks",
    "complete_task",
    "delete_task",
    "launch_app",
    "control_window",
    "send_keys",
    "delete_file",
    "manage_service",
    "read_screen",
    "move_mouse",
    "click_at",
    "drag_drop",
    "run_command",
    "watch_screen",
    "read_file_content",
    "rename_file",
    "copy_file",
    "create_folder",
    "toggle_dark_mode",
    "get_battery_status",
    "get_temperatures",
    "get_event_log",
    "get_wifi_info",
    "control_media",
    "get_now_playing",
    "translate_text",
    "summarize_text",
    "click_element",
    "set_alarm",
    "list_alarms",
    "delete_alarm",
  ],
  apps: [],
  homeworkMode: { active: false, apps: [], pinHash: "" },
  setups: [],
  protectedDrives: [],
  customProgramPaths: [],
  musicLibraryPath: "",
  defaultMediaPlayer: "vlc",
  provider: "auto" as const,
  ollamaModel: "llama3.1:8b",
  openaiApiKey: "sk-test",
};

describe("list_processes", () => {
  beforeEach(() => {
    vi.mocked(evaluateRules).mockResolvedValue("allow");
    vi.mocked(getSettings).mockReturnValue(wowSettings as any);
  });

  it("gibt Prozessliste zurück", async () => {
    const result = await toolExecutor.execute({
      tool: "list_processes",
      args: {},
    });
    expect(result.success).toBe(true);
    expect((result.output as any).count).toBe(1);
  });
});

describe("kill_process", () => {
  beforeEach(() => {
    vi.mocked(evaluateRules).mockResolvedValue("allow");
    vi.mocked(getSettings).mockReturnValue(wowSettings as any);
  });

  it("blockiert systemkritische Prozesse", async () => {
    const result = await toolExecutor.execute({
      tool: "kill_process",
      args: { name: "svchost" },
    });
    expect(result.success).toBe(false);
    expect(result.directive).toBe(true);
  });

  it("gibt Bestätigungsanfrage für normale Prozesse zurück", async () => {
    const result = await toolExecutor.execute({
      tool: "kill_process",
      args: { name: "notepad" },
    });
    expect(result.requiresConfirmation).toBe(true);
  });

  it("Fehler wenn Name und PID fehlen", async () => {
    const result = await toolExecutor.execute({
      tool: "kill_process",
      args: {},
    });
    expect(result.success).toBe(false);
  });
});

describe("set_volume", () => {
  beforeEach(() => {
    vi.mocked(evaluateRules).mockResolvedValue("allow");
    vi.mocked(getSettings).mockReturnValue(wowSettings as any);
    vi.mocked(execSync).mockReturnValue("" as any);
  });

  it("clampt level auf 100", async () => {
    const result = await toolExecutor.execute({
      tool: "set_volume",
      args: { level: 150 },
    });
    expect(result.success).toBe(true);
    expect(result.output).toContain("100%");
  });
});

describe("get_clipboard", () => {
  beforeEach(() => {
    vi.mocked(evaluateRules).mockResolvedValue("allow");
    vi.mocked(getSettings).mockReturnValue(wowSettings as any);
  });

  it("Fehler wenn Zwischenablage leer", async () => {
    vi.mocked(getLastClipboard).mockReturnValue(null);
    const result = await toolExecutor.execute({
      tool: "get_clipboard",
      args: {},
    });
    expect(result.success).toBe(false);
  });

  it("gibt Inhalt zurück", async () => {
    vi.mocked(getLastClipboard).mockReturnValue("Hallo Welt");
    const result = await toolExecutor.execute({
      tool: "get_clipboard",
      args: {},
    });
    expect(result.success).toBe(true);
    expect((result.output as any).content).toBe("Hallo Welt");
  });
});

describe("set_reminder", () => {
  beforeEach(() => {
    vi.mocked(evaluateRules).mockResolvedValue("allow");
    vi.mocked(getSettings).mockReturnValue(wowSettings as any);
  });

  it("Fehler ohne Uhrzeit", async () => {
    const result = await toolExecutor.execute({
      tool: "set_reminder",
      args: { message: "Arzttermin" },
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("Uhrzeit");
  });

  it("Fehler ohne Nachricht", async () => {
    const result = await toolExecutor.execute({
      tool: "set_reminder",
      args: { time: "09:00" },
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("Erinnerungstext");
  });

  it("setzt Erinnerung erfolgreich", async () => {
    const result = await toolExecutor.execute({
      tool: "set_reminder",
      args: { message: "Arzttermin", time: "09:00" },
    });
    expect(result.success).toBe(true);
    expect(result.output).toContain("Arzttermin");
  });
});

describe("take_screenshot", () => {
  beforeEach(() => {
    vi.mocked(evaluateRules).mockResolvedValue("allow");
    vi.mocked(getSettings).mockReturnValue(wowSettings as any);
  });

  it("gibt Analyse zurück", async () => {
    const result = await toolExecutor.execute({
      tool: "take_screenshot",
      args: {},
    });
    expect(result.success).toBe(true);
    expect((result.output as any).analysis).toBe("Ein Desktop.");
  });

  it("Fehler ohne OpenAI Key", async () => {
    vi.mocked(analyzeScreenshot).mockRejectedValueOnce(
      new Error("Vision benötigt OpenAI API-Key"),
    );
    const result = await toolExecutor.execute({
      tool: "take_screenshot",
      args: {},
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("OpenAI");
  });
});

describe("write_for_me", () => {
  beforeEach(() => {
    vi.mocked(evaluateRules).mockResolvedValue("allow");
    vi.mocked(getSettings).mockReturnValue(wowSettings as any);
  });

  it("Fehler ohne Aufgabe", async () => {
    const result = await toolExecutor.execute({
      tool: "write_for_me",
      args: {},
    });
    expect(result.success).toBe(false);
  });

  it("gibt generierten Text zurück", async () => {
    const result = await toolExecutor.execute({
      tool: "write_for_me",
      args: { task: "Absage an Müller" },
    });
    expect(result.success).toBe(true);
    expect((result.output as any).text).toBe("Sehr geehrter Herr Müller");
  });
});

describe("find_duplicates", () => {
  beforeEach(() => {
    vi.mocked(evaluateRules).mockResolvedValue("allow");
    vi.mocked(getSettings).mockReturnValue(wowSettings as any);
  });

  it("gibt Duplikat-Gruppen zurück", async () => {
    const result = await toolExecutor.execute({
      tool: "find_duplicates",
      args: {},
    });
    expect(result.success).toBe(true);
    expect((result.output as any).count).toBe(1);
    expect((result.output as any).totalWastedMB).toBe(1);
  });
});

describe("add_task", () => {
  beforeEach(() => {
    vi.mocked(evaluateRules).mockResolvedValue("allow");
    vi.mocked(getSettings).mockReturnValue(wowSettings as any);
  });

  it("Fehler wenn kein Titel", async () => {
    const result = await toolExecutor.execute({ tool: "add_task", args: {} });
    expect(result.success).toBe(false);
    expect(result.error).toContain("fehlt");
  });

  it("legt Aufgabe an und gibt ID zurück", async () => {
    const result = await toolExecutor.execute({
      tool: "add_task",
      args: { title: "Arzt anrufen", priority: "high" },
    });
    expect(result.success).toBe(true);
    expect(result.output).toContain("42");
    expect(addTask).toHaveBeenCalledWith(
      "Arzt anrufen",
      expect.objectContaining({ priority: "high" }),
    );
  });

  it("lehnt ungültiges Datum ab", async () => {
    const result = await toolExecutor.execute({
      tool: "add_task",
      args: { title: "Test", due_date: "kein-datum" },
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("Datum");
  });
});

describe("list_tasks", () => {
  beforeEach(() => {
    vi.mocked(evaluateRules).mockResolvedValue("allow");
    vi.mocked(getSettings).mockReturnValue(wowSettings as any);
  });

  it("listet offene Aufgaben auf", async () => {
    const result = await toolExecutor.execute({
      tool: "list_tasks",
      args: {},
    });
    expect(result.success).toBe(true);
    expect((result.output as any).count).toBe(1);
    expect(listTasks).toHaveBeenCalledWith(undefined, "pending");
  });
});

describe("complete_task", () => {
  beforeEach(() => {
    vi.mocked(evaluateRules).mockResolvedValue("allow");
    vi.mocked(getSettings).mockReturnValue(wowSettings as any);
    vi.mocked(completeTask).mockClear();
  });

  it("Fehler wenn keine ID", async () => {
    const result = await toolExecutor.execute({
      tool: "complete_task",
      args: {},
    });
    expect(result.success).toBe(false);
  });

  it("erledigt Aufgabe", async () => {
    const result = await toolExecutor.execute({
      tool: "complete_task",
      args: { id: 1 },
    });
    expect(result.success).toBe(true);
    expect(completeTask).toHaveBeenCalledWith(1);
  });
});

describe("delete_task", () => {
  beforeEach(() => {
    vi.mocked(evaluateRules).mockResolvedValue("allow");
    vi.mocked(getSettings).mockReturnValue(wowSettings as any);
    vi.mocked(deleteTask).mockClear();
  });

  it("bricht Aufgabe ab", async () => {
    const result = await toolExecutor.execute({
      tool: "delete_task",
      args: { id: 5 },
    });
    expect(result.success).toBe(true);
    expect(deleteTask).toHaveBeenCalledWith(5);
  });
});

// ── v3.2.0 System Automation ─────────────────────────────────────────────────

describe("launch_app", () => {
  beforeEach(() => {
    vi.mocked(evaluateRules).mockResolvedValue("allow");
    vi.mocked(getSettings).mockReturnValue(wowSettings as any);
    vi.mocked(launchApp).mockClear();
  });

  it("Fehler wenn kein App-Name", async () => {
    const result = await toolExecutor.execute({ tool: "launch_app", args: {} });
    expect(result.success).toBe(false);
    expect(result.error).toContain("fehlt");
  });

  it("blockiert gesperrten Systempfad", async () => {
    const result = await toolExecutor.execute({
      tool: "launch_app",
      args: { app: "C:\\Windows\\System32\\cmd.exe" },
    });
    expect(result.success).toBe(false);
    expect(result.directive).toBe(true);
  });

  it("gibt Bestätigung für normales Programm zurück", async () => {
    const result = await toolExecutor.execute({
      tool: "launch_app",
      args: { app: "notepad" },
    });
    expect(result.requiresConfirmation).toBe(true);
    expect(result.pendingAction?.tool).toBe("launch_app_confirmed");
  });

  it("launch_app_confirmed startet App und gibt PID zurück", async () => {
    const result = await toolExecutor.execute({
      tool: "launch_app_confirmed",
      args: { app: "notepad", args: [] },
    });
    expect(result.success).toBe(true);
    expect(result.output).toContain("1234");
    expect(launchApp).toHaveBeenCalledWith("notepad", []);
  });
});

describe("control_window", () => {
  beforeEach(() => {
    vi.mocked(evaluateRules).mockResolvedValue("allow");
    vi.mocked(getSettings).mockReturnValue(wowSettings as any);
    vi.mocked(controlWindow).mockClear();
  });

  it("Fehler wenn kein Titel", async () => {
    const result = await toolExecutor.execute({
      tool: "control_window",
      args: { action: "focus" },
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("fehlt");
  });

  it("focus führt direkt aus", async () => {
    const result = await toolExecutor.execute({
      tool: "control_window",
      args: { title: "Notepad", action: "focus" },
    });
    expect(result.success).toBe(true);
    expect(controlWindow).toHaveBeenCalledWith("Notepad", "focus");
  });

  it("close verlangt Bestätigung", async () => {
    const result = await toolExecutor.execute({
      tool: "control_window",
      args: { title: "Chrome", action: "close" },
    });
    expect(result.requiresConfirmation).toBe(true);
    expect(result.pendingAction?.tool).toBe("control_window_confirmed");
  });

  it("Fehler wenn Fenster nicht gefunden", async () => {
    vi.mocked(controlWindow).mockReturnValueOnce({ found: 0 });
    const result = await toolExecutor.execute({
      tool: "control_window",
      args: { title: "XYZ-Gibts-Nicht", action: "minimize" },
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("gefunden");
  });
});

describe("send_keys", () => {
  beforeEach(() => {
    vi.mocked(evaluateRules).mockResolvedValue("allow");
    vi.mocked(getSettings).mockReturnValue(wowSettings as any);
    vi.mocked(sendKeysToWindow).mockClear();
  });

  it("Fehler wenn keine Tasteneingabe", async () => {
    const result = await toolExecutor.execute({
      tool: "send_keys",
      args: {},
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("fehlt");
  });

  it("gibt Bestätigung zurück", async () => {
    const result = await toolExecutor.execute({
      tool: "send_keys",
      args: { keys: "^s", window: "Word" },
    });
    expect(result.requiresConfirmation).toBe(true);
    expect(result.pendingAction?.tool).toBe("send_keys_confirmed");
    expect(result.confirmationMessage).toContain("Word");
  });

  it("send_keys_confirmed sendet Eingabe", async () => {
    const result = await toolExecutor.execute({
      tool: "send_keys_confirmed",
      args: { keys: "^s", window: "Word" },
    });
    expect(result.success).toBe(true);
    expect(sendKeysToWindow).toHaveBeenCalledWith("^s", "Word");
  });
});

describe("delete_file", () => {
  beforeEach(() => {
    vi.mocked(evaluateRules).mockResolvedValue("allow");
    vi.mocked(getSettings).mockReturnValue(wowSettings as any);
    vi.mocked(deleteToRecycleBin).mockClear();
  });

  it("Fehler wenn kein Pfad", async () => {
    const result = await toolExecutor.execute({
      tool: "delete_file",
      args: {},
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("fehlt");
  });

  it("gibt Bestätigung zurück", async () => {
    const result = await toolExecutor.execute({
      tool: "delete_file",
      args: { path: "E:\\\\Temp\\\\alt.docx" },
    });
    expect(result.requiresConfirmation).toBe(true);
    expect(result.pendingAction?.tool).toBe("delete_file_confirmed");
  });

  it("delete_file_confirmed verschiebt in Papierkorb", async () => {
    const result = await toolExecutor.execute({
      tool: "delete_file_confirmed",
      args: { path: "E:\\\\Temp\\\\alt.docx" },
    });
    expect(result.success).toBe(true);
    expect(deleteToRecycleBin).toHaveBeenCalledWith("E:\\\\Temp\\\\alt.docx");
  });
});

describe("manage_service", () => {
  beforeEach(() => {
    vi.mocked(evaluateRules).mockResolvedValue("allow");
    vi.mocked(getSettings).mockReturnValue(wowSettings as any);
    vi.mocked(listServicesPs).mockClear();
    vi.mocked(controlService).mockClear();
  });

  it("list gibt Dienstliste zurück", async () => {
    const result = await toolExecutor.execute({
      tool: "manage_service",
      args: { action: "list" },
    });
    expect(result.success).toBe(true);
    expect((result.output as any).count).toBe(1);
    expect(listServicesPs).toHaveBeenCalled();
  });

  it("blockiert systemkritischen Dienst", async () => {
    const result = await toolExecutor.execute({
      tool: "manage_service",
      args: { action: "stop", name: "lsass" },
    });
    expect(result.success).toBe(false);
    expect(result.directive).toBe(true);
  });

  it("stop gibt Bestätigung zurück", async () => {
    const result = await toolExecutor.execute({
      tool: "manage_service",
      args: { action: "stop", name: "BITS" },
    });
    expect(result.requiresConfirmation).toBe(true);
    expect(result.pendingAction?.tool).toBe("manage_service_confirmed");
  });

  it("manage_service_confirmed stoppt Dienst", async () => {
    const result = await toolExecutor.execute({
      tool: "manage_service_confirmed",
      args: { name: "BITS", action: "stop" },
    });
    expect(result.success).toBe(true);
    expect(controlService).toHaveBeenCalledWith("BITS", "stop");
  });
});

describe("read_screen", () => {
  beforeEach(() => {
    vi.mocked(evaluateRules).mockResolvedValue("allow");
    vi.mocked(getSettings).mockReturnValue(wowSettings as any);
    vi.mocked(readScreenOcr).mockClear();
  });

  it("gibt erkannten Text zurück", async () => {
    const result = await toolExecutor.execute({
      tool: "read_screen",
      args: {},
    });
    expect(result.success).toBe(true);
    expect((result.output as any).text).toBe("Hallo Welt OCR");
    expect(readScreenOcr).toHaveBeenCalled();
  });

  it("Fehler wenn OCR fehlschlägt", async () => {
    vi.mocked(readScreenOcr).mockRejectedValueOnce(
      new Error("OCR Engine nicht verfügbar"),
    );
    const result = await toolExecutor.execute({
      tool: "read_screen",
      args: {},
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("OCR");
  });
});

// ── v3.3.0 Mouse, Shell, Screen Monitor ──────────────────────────────────────

describe("move_mouse", () => {
  beforeEach(() => {
    vi.mocked(evaluateRules).mockResolvedValue("allow");
    vi.mocked(getSettings).mockReturnValue(wowSettings as any);
    vi.mocked(moveMouse).mockClear();
  });

  it("Fehler ohne Koordinaten", async () => {
    const result = await toolExecutor.execute({ tool: "move_mouse", args: {} });
    expect(result.success).toBe(false);
    expect(result.error).toContain("Koordinaten");
  });

  it("bewegt Maus und gibt Position zurück", async () => {
    const result = await toolExecutor.execute({
      tool: "move_mouse",
      args: { x: 400, y: 300 },
    });
    expect(result.success).toBe(true);
    expect(result.output).toContain("400");
    expect(moveMouse).toHaveBeenCalledWith(400, 300);
  });
});

describe("click_at", () => {
  beforeEach(() => {
    vi.mocked(evaluateRules).mockResolvedValue("allow");
    vi.mocked(getSettings).mockReturnValue(wowSettings as any);
    vi.mocked(clickAt).mockClear();
  });

  it("Fehler ohne Koordinaten", async () => {
    const result = await toolExecutor.execute({ tool: "click_at", args: {} });
    expect(result.success).toBe(false);
    expect(result.error).toContain("Koordinaten");
  });

  it("gibt Bestätigung zurück", async () => {
    const result = await toolExecutor.execute({
      tool: "click_at",
      args: { x: 100, y: 200 },
    });
    expect(result.requiresConfirmation).toBe(true);
    expect(result.pendingAction?.tool).toBe("click_at_confirmed");
    expect(result.confirmationMessage).toContain("100");
  });

  it("click_at_confirmed führt Klick aus", async () => {
    const result = await toolExecutor.execute({
      tool: "click_at_confirmed",
      args: { x: 100, y: 200, button: "left", double: false },
    });
    expect(result.success).toBe(true);
    expect(clickAt).toHaveBeenCalledWith(100, 200, "left", false);
  });

  it("click_at_confirmed — sicherheitskritisches Fenster blockiert", async () => {
    vi.mocked(clickAt).mockReturnValueOnce({
      success: false,
      error: "Klick nicht erlaubt — aktives Fenster ist sicherheitskritisch.",
    });
    const result = await toolExecutor.execute({
      tool: "click_at_confirmed",
      args: { x: 50, y: 50, button: "left", double: false },
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("sicherheitskritisch");
  });
});

describe("drag_drop", () => {
  beforeEach(() => {
    vi.mocked(evaluateRules).mockResolvedValue("allow");
    vi.mocked(getSettings).mockReturnValue(wowSettings as any);
    vi.mocked(dragDrop).mockClear();
  });

  it("Fehler wenn Koordinaten fehlen", async () => {
    const result = await toolExecutor.execute({
      tool: "drag_drop",
      args: { from_x: 10 },
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("Koordinaten");
  });

  it("gibt Bestätigung zurück", async () => {
    const result = await toolExecutor.execute({
      tool: "drag_drop",
      args: { from_x: 100, from_y: 100, to_x: 500, to_y: 300 },
    });
    expect(result.requiresConfirmation).toBe(true);
    expect(result.pendingAction?.tool).toBe("drag_drop_confirmed");
  });

  it("drag_drop_confirmed führt Drag aus", async () => {
    const result = await toolExecutor.execute({
      tool: "drag_drop_confirmed",
      args: { from_x: 100, from_y: 100, to_x: 500, to_y: 300 },
    });
    expect(result.success).toBe(true);
    expect(dragDrop).toHaveBeenCalledWith(100, 100, 500, 300);
  });
});

describe("run_command", () => {
  beforeEach(() => {
    vi.mocked(evaluateRules).mockResolvedValue("allow");
    vi.mocked(getSettings).mockReturnValue(wowSettings as any);
    vi.mocked(runSafeCommand).mockClear();
  });

  it("Fehler wenn Befehl fehlt", async () => {
    const result = await toolExecutor.execute({
      tool: "run_command",
      args: {},
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("fehlt");
  });

  it("gibt Bestätigung mit Befehl zurück", async () => {
    const result = await toolExecutor.execute({
      tool: "run_command",
      args: { command: "Get-Process | Select-Object -First 5" },
    });
    expect(result.requiresConfirmation).toBe(true);
    expect(result.confirmationMessage).toContain("Get-Process");
  });

  it("run_command_confirmed führt Befehl aus", async () => {
    const result = await toolExecutor.execute({
      tool: "run_command_confirmed",
      args: { command: "Get-Process | Select-Object -First 5" },
    });
    expect(result.success).toBe(true);
    expect((result.output as any).result).toBe("PID 1234");
    expect(runSafeCommand).toHaveBeenCalledWith(
      "Get-Process | Select-Object -First 5",
    );
  });

  it("run_command_confirmed — gesperrtes Muster blockiert", async () => {
    vi.mocked(runSafeCommand).mockReturnValueOnce({
      success: false,
      error: "Befehl enthält gesperrte Operation.",
    });
    const result = await toolExecutor.execute({
      tool: "run_command_confirmed",
      args: { command: "Remove-Item C:\\evil.txt" },
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("gesperrte");
  });
});

describe("watch_screen", () => {
  beforeEach(() => {
    vi.mocked(evaluateRules).mockResolvedValue("allow");
    vi.mocked(getSettings).mockReturnValue(wowSettings as any);
    vi.mocked(readScreenOcr).mockClear();
  });

  it("gibt Snapshots und latest-Text zurück", async () => {
    vi.mocked(readScreenOcr)
      .mockResolvedValueOnce("Zeile A\nZeile B")
      .mockResolvedValueOnce("Zeile A\nZeile C");
    const result = await toolExecutor.execute({
      tool: "watch_screen",
      args: { duration: 5, interval: 3 },
    });
    expect(result.success).toBe(true);
    expect((result.output as any).snapshots).toBeGreaterThanOrEqual(1);
    expect((result.output as any).latest).toContain("Zeile");
  });

  it("erkennt Änderungen zwischen Snapshots", async () => {
    vi.mocked(readScreenOcr)
      .mockResolvedValueOnce("Alt\nUnverändert")
      .mockResolvedValueOnce("Neu\nUnverändert");
    const result = await toolExecutor.execute({
      tool: "watch_screen",
      args: { duration: 5, interval: 3 },
    });
    expect(result.success).toBe(true);
    const changes = (result.output as any).changes as string[];
    expect(changes.some((c: string) => c.includes("Neu"))).toBe(true);
  });
});

// ── v3.4.0 Komfort & Intelligenz ─────────────────────────────────────────────

describe("read_file_content", () => {
  beforeEach(() => {
    vi.mocked(evaluateRules).mockResolvedValue("allow");
    vi.mocked(getSettings).mockReturnValue(wowSettings as any);
    vi.mocked(readFileContent).mockClear();
  });

  it("Fehler wenn kein Pfad", async () => {
    const result = await toolExecutor.execute({
      tool: "read_file_content",
      args: {},
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("fehlt");
  });

  it("gibt Dateiinhalt zurück", async () => {
    const result = await toolExecutor.execute({
      tool: "read_file_content",
      args: { path: "E:\\Notizen.txt" },
    });
    expect(result.success).toBe(true);
    expect((result.output as any).content).toBe("Zeile 1\nZeile 2");
    expect(readFileContent).toHaveBeenCalledWith("E:\\Notizen.txt");
  });

  it("Fehler wenn Service fehlschlägt", async () => {
    vi.mocked(readFileContent).mockResolvedValueOnce({
      success: false,
      error: "Datei nicht gefunden",
    });
    const result = await toolExecutor.execute({
      tool: "read_file_content",
      args: { path: "E:\\Gibts-Nicht.txt" },
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("nicht gefunden");
  });
});

describe("rename_file", () => {
  beforeEach(() => {
    vi.mocked(evaluateRules).mockResolvedValue("allow");
    vi.mocked(getSettings).mockReturnValue(wowSettings as any);
    vi.mocked(renameFile).mockClear();
  });

  it("Fehler wenn Pfad oder Name fehlt", async () => {
    const result = await toolExecutor.execute({
      tool: "rename_file",
      args: { path: "E:\\alt.txt" },
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("fehlt");
  });

  it("gibt Bestätigung zurück", async () => {
    const result = await toolExecutor.execute({
      tool: "rename_file",
      args: { path: "E:\\alt.txt", new_name: "neu.txt" },
    });
    expect(result.requiresConfirmation).toBe(true);
    expect(result.pendingAction?.tool).toBe("rename_file_confirmed");
  });

  it("rename_file_confirmed benennt Datei um", async () => {
    const result = await toolExecutor.execute({
      tool: "rename_file_confirmed",
      args: { path: "E:\\alt.txt", new_name: "neu.txt" },
    });
    expect(result.success).toBe(true);
    expect(result.output).toContain("Datei_neu.txt");
    expect(renameFile).toHaveBeenCalledWith("E:\\alt.txt", "neu.txt");
  });
});

describe("copy_file", () => {
  beforeEach(() => {
    vi.mocked(evaluateRules).mockResolvedValue("allow");
    vi.mocked(getSettings).mockReturnValue(wowSettings as any);
    vi.mocked(copyFile).mockClear();
  });

  it("Fehler wenn Quelle oder Ziel fehlt", async () => {
    const result = await toolExecutor.execute({
      tool: "copy_file",
      args: { source: "E:\\a.txt" },
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("fehlt");
  });

  it("gibt Bestätigung zurück", async () => {
    const result = await toolExecutor.execute({
      tool: "copy_file",
      args: { source: "E:\\a.txt", destination: "E:\\Backup\\a.txt" },
    });
    expect(result.requiresConfirmation).toBe(true);
    expect(result.pendingAction?.tool).toBe("copy_file_confirmed");
  });

  it("copy_file_confirmed kopiert Datei", async () => {
    const result = await toolExecutor.execute({
      tool: "copy_file_confirmed",
      args: { source: "E:\\a.txt", destination: "E:\\Backup\\a.txt" },
    });
    expect(result.success).toBe(true);
    expect(copyFile).toHaveBeenCalledWith("E:\\a.txt", "E:\\Backup\\a.txt");
  });
});

describe("create_folder", () => {
  beforeEach(() => {
    vi.mocked(evaluateRules).mockResolvedValue("allow");
    vi.mocked(getSettings).mockReturnValue(wowSettings as any);
    vi.mocked(createFolder).mockClear();
  });

  it("Fehler wenn kein Pfad", async () => {
    const result = await toolExecutor.execute({
      tool: "create_folder",
      args: {},
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("fehlt");
  });

  it("erstellt Ordner", async () => {
    const result = await toolExecutor.execute({
      tool: "create_folder",
      args: { path: "E:\\NeuerOrdner" },
    });
    expect(result.success).toBe(true);
    expect(createFolder).toHaveBeenCalledWith("E:\\NeuerOrdner");
  });
});

describe("toggle_dark_mode", () => {
  beforeEach(() => {
    vi.mocked(evaluateRules).mockResolvedValue("allow");
    vi.mocked(getSettings).mockReturnValue(wowSettings as any);
    vi.mocked(toggleDarkMode).mockClear();
  });

  it("schaltet Dark Mode um", async () => {
    const result = await toolExecutor.execute({
      tool: "toggle_dark_mode",
      args: {},
    });
    expect(result.success).toBe(true);
    expect(result.output).toContain("Dark Mode");
    expect(toggleDarkMode).toHaveBeenCalled();
  });

  it("Fehler wenn Umschaltung fehlschlägt", async () => {
    vi.mocked(toggleDarkMode).mockReturnValueOnce({
      success: false,
      error: "Registry-Zugriff verweigert",
    });
    const result = await toolExecutor.execute({
      tool: "toggle_dark_mode",
      args: {},
    });
    expect(result.success).toBe(false);
  });
});

describe("get_battery_status", () => {
  beforeEach(() => {
    vi.mocked(evaluateRules).mockResolvedValue("allow");
    vi.mocked(getSettings).mockReturnValue(wowSettings as any);
    vi.mocked(getBatteryStatus).mockClear();
  });

  it("gibt Akkustatus zurück", async () => {
    const result = await toolExecutor.execute({
      tool: "get_battery_status",
      args: {},
    });
    expect(result.success).toBe(true);
    expect((result.output as any).chargePercent).toBe(80);
    expect(getBatteryStatus).toHaveBeenCalled();
  });
});

describe("get_temperatures", () => {
  beforeEach(() => {
    vi.mocked(evaluateRules).mockResolvedValue("allow");
    vi.mocked(getSettings).mockReturnValue(wowSettings as any);
    vi.mocked(getTemperatures).mockClear();
  });

  it("gibt Temperaturzonen zurück", async () => {
    const result = await toolExecutor.execute({
      tool: "get_temperatures",
      args: {},
    });
    expect(result.success).toBe(true);
    expect((result.output as any).zones).toHaveLength(1);
    expect(getTemperatures).toHaveBeenCalled();
  });
});

describe("get_event_log", () => {
  beforeEach(() => {
    vi.mocked(evaluateRules).mockResolvedValue("allow");
    vi.mocked(getSettings).mockReturnValue(wowSettings as any);
    vi.mocked(getEventLog).mockClear();
  });

  it("gibt Ereignisprotokoll zurück", async () => {
    const result = await toolExecutor.execute({
      tool: "get_event_log",
      args: {},
    });
    expect(result.success).toBe(true);
    expect((result.output as any).count).toBe(1);
    expect(getEventLog).toHaveBeenCalled();
  });

  it("übergibt hours und maxEvents korrekt", async () => {
    await toolExecutor.execute({
      tool: "get_event_log",
      args: { hours: 48, max_events: 50 },
    });
    expect(getEventLog).toHaveBeenCalledWith(48, 50);
  });
});

describe("get_wifi_info", () => {
  beforeEach(() => {
    vi.mocked(evaluateRules).mockResolvedValue("allow");
    vi.mocked(getSettings).mockReturnValue(wowSettings as any);
    vi.mocked(getWifiInfo).mockClear();
  });

  it("gibt WLAN-Info zurück", async () => {
    const result = await toolExecutor.execute({
      tool: "get_wifi_info",
      args: {},
    });
    expect(result.success).toBe(true);
    expect((result.output as any).ssid).toBe("MeinWLAN");
    expect(getWifiInfo).toHaveBeenCalled();
  });
});

describe("control_media", () => {
  beforeEach(() => {
    vi.mocked(evaluateRules).mockResolvedValue("allow");
    vi.mocked(getSettings).mockReturnValue(wowSettings as any);
    vi.mocked(controlMedia).mockClear();
  });

  it("defaults zu toggle wenn keine Aktion angegeben", async () => {
    const result = await toolExecutor.execute({
      tool: "control_media",
      args: {},
    });
    expect(result.success).toBe(true);
    expect(controlMedia).toHaveBeenCalledWith("toggle");
  });

  it("gibt play-Aktion weiter", async () => {
    const result = await toolExecutor.execute({
      tool: "control_media",
      args: { action: "play" },
    });
    expect(result.success).toBe(true);
    expect(controlMedia).toHaveBeenCalledWith("play");
  });
});

describe("get_now_playing", () => {
  beforeEach(() => {
    vi.mocked(evaluateRules).mockResolvedValue("allow");
    vi.mocked(getSettings).mockReturnValue(wowSettings as any);
    vi.mocked(getNowPlaying).mockClear();
  });

  it("gibt aktuelle Wiedergabe zurück", async () => {
    const result = await toolExecutor.execute({
      tool: "get_now_playing",
      args: {},
    });
    expect(result.success).toBe(true);
    expect((result.output as any).title).toBe("Test Song");
    expect(getNowPlaying).toHaveBeenCalled();
  });
});

describe("translate_text", () => {
  beforeEach(() => {
    vi.mocked(evaluateRules).mockResolvedValue("allow");
    vi.mocked(getSettings).mockReturnValue(wowSettings as any);
    vi.mocked(translateText).mockClear();
  });

  it("Fehler wenn Text fehlt", async () => {
    const result = await toolExecutor.execute({
      tool: "translate_text",
      args: { target_language: "English" },
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("fehlt");
  });

  it("übersetzt Text", async () => {
    const result = await toolExecutor.execute({
      tool: "translate_text",
      args: { text: "Hallo Welt", target_language: "English" },
    });
    expect(result.success).toBe(true);
    expect((result.output as any).translation).toBe("Hello World");
    expect(translateText).toHaveBeenCalledWith("Hallo Welt", "English");
  });
});

describe("summarize_text", () => {
  beforeEach(() => {
    vi.mocked(evaluateRules).mockResolvedValue("allow");
    vi.mocked(getSettings).mockReturnValue(wowSettings as any);
    vi.mocked(summarizeText).mockClear();
  });

  it("Fehler wenn Text fehlt", async () => {
    const result = await toolExecutor.execute({
      tool: "summarize_text",
      args: {},
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("fehlt");
  });

  it("gibt Zusammenfassung zurück", async () => {
    const result = await toolExecutor.execute({
      tool: "summarize_text",
      args: { text: "Langer Text über viele Dinge...", style: "kurz" },
    });
    expect(result.success).toBe(true);
    expect((result.output as any).summary).toBe("Kurze Zusammenfassung.");
    expect(summarizeText).toHaveBeenCalledWith(
      "Langer Text über viele Dinge...",
      "kurz",
    );
  });
});

describe("click_element", () => {
  beforeEach(() => {
    vi.mocked(evaluateRules).mockResolvedValue("allow");
    vi.mocked(getSettings).mockReturnValue(wowSettings as any);
    vi.mocked(readScreenOcrElements).mockClear();
    vi.mocked(clickAt).mockClear();
  });

  it("Fehler wenn kein Label", async () => {
    const result = await toolExecutor.execute({
      tool: "click_element",
      args: {},
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("fehlt");
  });

  it("findet Element via OCR und fragt Bestätigung", async () => {
    const result = await toolExecutor.execute({
      tool: "click_element",
      args: { label: "Speichern" },
    });
    expect(result.requiresConfirmation).toBe(true);
    expect(result.pendingAction?.tool).toBe("click_element_confirmed");
    expect(result.confirmationMessage).toContain("Speichern");
    expect(readScreenOcrElements).toHaveBeenCalled();
  });

  it("Fehler wenn Element nicht gefunden", async () => {
    const result = await toolExecutor.execute({
      tool: "click_element",
      args: { label: "Nichtexistent" },
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("Bildschirm");
  });

  it("click_element_confirmed klickt auf gefundene Koordinaten", async () => {
    const result = await toolExecutor.execute({
      tool: "click_element_confirmed",
      args: { x: 140, y: 62 },
    });
    expect(result.success).toBe(true);
    expect(clickAt).toHaveBeenCalledWith(140, 62, "left", false);
  });
});

// ── v3.4.1 Wecker ─────────────────────────────────────────────────────────────

describe("set_alarm", () => {
  beforeEach(() => {
    vi.mocked(evaluateRules).mockResolvedValue("allow");
    vi.mocked(getSettings).mockReturnValue(wowSettings as any);
    vi.mocked(pool.execute).mockClear();
  });

  it("Fehler wenn Uhrzeit fehlt", async () => {
    const result = await toolExecutor.execute({
      tool: "set_alarm",
      args: { label: "Morgen" },
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("Uhrzeit");
  });

  it("Fehler bei ungültigem Format", async () => {
    const result = await toolExecutor.execute({
      tool: "set_alarm",
      args: { time: "8:00" },
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("HH:MM");
  });

  it("stellt Wecker erfolgreich", async () => {
    vi.mocked(pool.execute).mockResolvedValueOnce([{ insertId: 1 }, []]);
    const result = await toolExecutor.execute({
      tool: "set_alarm",
      args: { time: "07:30", label: "Aufstehen" },
    });
    expect(result.success).toBe(true);
    expect(result.output).toContain("07:30");
    expect(result.output).toContain("Aufstehen");
  });
});

describe("list_alarms", () => {
  beforeEach(() => {
    vi.mocked(evaluateRules).mockResolvedValue("allow");
    vi.mocked(getSettings).mockReturnValue(wowSettings as any);
  });

  it("gibt leere Liste zurück wenn keine Wecker", async () => {
    vi.mocked(pool.execute).mockResolvedValueOnce([[], []]);
    const result = await toolExecutor.execute({
      tool: "list_alarms",
      args: {},
    });
    expect(result.success).toBe(true);
    expect((result.output as any).alarms).toHaveLength(0);
  });

  it("gibt Wecker-Liste zurück", async () => {
    vi.mocked(pool.execute).mockResolvedValueOnce([
      [{ id: 1, label: "Aufstehen", time_hhmm: "07:30", active: true }],
      [],
    ]);
    const result = await toolExecutor.execute({
      tool: "list_alarms",
      args: {},
    });
    expect(result.success).toBe(true);
    expect((result.output as any).alarms).toHaveLength(1);
    expect((result.output as any).alarms[0].label).toBe("Aufstehen");
  });
});

describe("delete_alarm", () => {
  beforeEach(() => {
    vi.mocked(evaluateRules).mockResolvedValue("allow");
    vi.mocked(getSettings).mockReturnValue(wowSettings as any);
    vi.mocked(pool.execute).mockClear();
  });

  it("Fehler wenn ID fehlt", async () => {
    const result = await toolExecutor.execute({
      tool: "delete_alarm",
      args: {},
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("ID");
  });

  it("Fehler wenn Wecker nicht gefunden", async () => {
    vi.mocked(pool.execute).mockResolvedValueOnce([{ affectedRows: 0 }, []]);
    const result = await toolExecutor.execute({
      tool: "delete_alarm",
      args: { id: 99 },
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("nicht gefunden");
  });

  it("löscht Wecker erfolgreich", async () => {
    vi.mocked(pool.execute).mockResolvedValueOnce([{ affectedRows: 1 }, []]);
    const result = await toolExecutor.execute({
      tool: "delete_alarm",
      args: { id: 1 },
    });
    expect(result.success).toBe(true);
    expect(result.output).toContain("gelöscht");
  });
});

describe("describe_screen", () => {
  const wowSettings = {
    ...prodToolSettings,
    enabledTools: [...prodToolSettings.enabledTools, "describe_screen"],
  };
  it("gibt Bildschirmbeschreibung zurück", async () => {
    vi.mocked(getSettings).mockReturnValue(
      wowSettings as ReturnType<typeof getSettings>,
    );
    const result = await toolExecutor.execute({
      tool: "describe_screen",
      args: {},
    });
    expect(result.success).toBe(true);
    expect((result.output as { description: string }).description).toContain(
      "Desktop",
    );
  });
});

describe("describe_image", () => {
  const wowSettings = {
    ...prodToolSettings,
    enabledTools: [...prodToolSettings.enabledTools, "describe_image"],
  };
  it("Fehler wenn kein Pfad angegeben", async () => {
    vi.mocked(getSettings).mockReturnValue(
      wowSettings as ReturnType<typeof getSettings>,
    );
    const result = await toolExecutor.execute({
      tool: "describe_image",
      args: {},
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("Dateipfad");
  });
  it("gibt Bildbeschreibung zurück", async () => {
    vi.mocked(getSettings).mockReturnValue(
      wowSettings as ReturnType<typeof getSettings>,
    );
    const result = await toolExecutor.execute({
      tool: "describe_image",
      args: { path: "C:\test.jpg" },
    });
    expect(result.success).toBe(true);
    expect((result.output as { description: string }).description).toContain(
      "Hund",
    );
  });
});

describe("describe_webpage", () => {
  const wowSettings = {
    ...prodToolSettings,
    enabledTools: [...prodToolSettings.enabledTools, "describe_webpage"],
  };
  it("gibt Webseitenbeschreibung zurück", async () => {
    vi.mocked(getSettings).mockReturnValue(
      wowSettings as ReturnType<typeof getSettings>,
    );
    const result = await toolExecutor.execute({
      tool: "describe_webpage",
      args: {},
    });
    expect(result.success).toBe(true);
    expect((result.output as { description: string }).description).toContain(
      "Webseite",
    );
  });
});
