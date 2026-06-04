import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@ella/agent-tools", () => ({
  openApp: vi.fn(),
  getDiskUsage: vi
    .fn()
    .mockResolvedValue({ success: true, output: "50 GB free" }),
  cleanTemp: vi.fn(),
  emptyRecycleBin: vi.fn(),
}));
vi.mock("child_process", () => ({ execSync: vi.fn(), exec: vi.fn() }));
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
