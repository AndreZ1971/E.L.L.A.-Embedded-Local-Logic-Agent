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
  createReminder: vi.fn(),
  deleteReminder: vi.fn(),
  listReminders: vi.fn(() => []),
}));
vi.mock("../../services/vision.js", () => ({
  analyzeScreenshot: vi.fn(() => Promise.resolve("Ein Desktop.")),
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
    // wmic-Format: "DriveType=3\r\n"
    vi.mocked(execSync).mockReturnValue("DriveType=3\r\n" as any);
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
      .mockReturnValueOnce("DriveType=2\r\n" as any) // getDriveType
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
