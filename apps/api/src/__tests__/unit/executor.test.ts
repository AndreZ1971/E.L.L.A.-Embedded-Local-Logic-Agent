import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@ella-directive/core", () => ({
  DirectiveLayer: vi.fn().mockImplementation(() => ({
    registerHarmTool: vi.fn(),
    registerExfiltrationTool: vi.fn(),
    registerAllowedTool: vi.fn(),
    check: vi.fn().mockReturnValue("allow"),
  })),
}));

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

import { toolExecutor } from "../../tools/executor.js";
import { getSettings } from "../../services/settings.js";
import { evaluateRules } from "../../services/rules.js";
import { getDiskUsage } from "@ella/agent-tools";

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
    expect(result.error).toMatch(/nicht aktiviert/);
  });

  it("returns deny error when evaluateRules returns deny", async () => {
    vi.mocked(evaluateRules).mockResolvedValue("deny");
    const result = await toolExecutor.execute({
      tool: "get_disk_usage",
      args: {},
    });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Direktive/);
  });

  it("returns no-permission error when evaluateRules returns no_match", async () => {
    vi.mocked(evaluateRules).mockResolvedValue("no_match");
    const result = await toolExecutor.execute({
      tool: "get_disk_usage",
      args: {},
    });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Keine Erlaubnis-Regel/);
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
