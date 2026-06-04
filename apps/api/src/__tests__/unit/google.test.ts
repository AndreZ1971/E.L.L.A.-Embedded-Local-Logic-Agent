import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@ella/agent-tools", () => ({
  openApp: vi.fn(),
  getDiskUsage: vi.fn().mockResolvedValue({ success: true, output: "" }),
  cleanTemp: vi.fn(),
  emptyRecycleBin: vi.fn(),
}));
vi.mock("child_process", () => ({ execSync: vi.fn(), exec: vi.fn() }));
vi.mock("util", () => ({
  promisify: vi.fn(() => vi.fn().mockResolvedValue({ stdout: "", stderr: "" })),
}));
vi.mock("../../config/database.js", () => ({
  pool: { execute: vi.fn().mockResolvedValue([[], []]) },
}));
vi.mock("../../config/env.js", () => ({
  env: { ollamaBaseUrl: "http://localhost:11434", openaiApiKey: "" },
}));
vi.mock("../../services/settings.js", () => ({
  getSettings: vi.fn(() => ({
    enabledTools: [
      "read_gmail",
      "mark_gmail",
      "read_google_calendar",
      "create_google_appointment",
    ],
    apps: [],
    homeworkMode: { active: false, apps: [], pinHash: "" },
    setups: [],
    protectedDrives: ["C", "D"],
    customProgramPaths: [],
    googleConnected: false,
    googleClientId: "",
    googleClientSecret: "",
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
  scanHardware: vi.fn(() => ({ computerName: "TEST" })),
  runSystemScan: vi.fn(),
}));
vi.mock("../../services/worker.js", () => ({
  getPnPSnapshot: vi.fn(() => new Map()),
  getArpSnapshot: vi.fn(() => []),
  getTcpConnections: vi.fn().mockResolvedValue([]),
}));
vi.mock("../../services/mail.js", () => ({
  readEmails: vi.fn(() => ({ source: "none", items: [] })),
  markEmail: vi.fn(),
}));
vi.mock("../../services/calendar.js", () => ({
  readCalendar: vi.fn(() => []),
  createAppointment: vi.fn(),
}));
vi.mock("../../services/google/gmail.js", () => ({
  readGmailMessages: vi.fn().mockResolvedValue([]),
  markGmailMessage: vi
    .fn()
    .mockResolvedValue({
      success: false,
      directive: true,
      error: "Direktive: Ungelesene Mails dürfen nicht gelöscht werden.",
    }),
}));
vi.mock("../../services/google/calendar.js", () => ({
  readGoogleCalendar: vi
    .fn()
    .mockRejectedValue(new Error("Google nicht verbunden.")),
  createGoogleAppointment: vi.fn().mockResolvedValue({ success: true }),
}));
vi.mock("../../services/openai.js", () => ({
  openaiClient: { isAvailable: vi.fn(() => false), searchWeb: vi.fn() },
}));
vi.mock("../../services/webSearch.js", () => ({
  searchWeb: vi.fn(),
  fetchUrl: vi.fn(),
}));
vi.mock("../../services/weather.js", () => ({ getWeather: vi.fn() }));
vi.mock("../../routes/system.js", () => ({
  BLOCKED_PATH_FRAGMENTS: ["\\windows\\", "\\system32\\"],
  BLOCKED_NAME_PATTERNS: ["uninstall", "setup"],
}));

import { toolExecutor } from "../../tools/executor.js";
import { evaluateRules } from "../../services/rules.js";

describe("Google Tools", () => {
  beforeEach(() => {
    vi.mocked(evaluateRules).mockResolvedValue("allow");
  });

  it("mark_gmail — blockiert delete (Direktive-Mock)", async () => {
    const result = await toolExecutor.execute({
      tool: "mark_gmail",
      args: { id: "test-id", action: "delete" },
    });
    expect(result.success).toBe(false);
  });

  it("mark_gmail — ungültige Aktion gibt Fehler", async () => {
    const result = await toolExecutor.execute({
      tool: "mark_gmail",
      args: { id: "test-id", action: "explode" },
    });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Ungültige Aktion/);
  });

  it("mark_gmail — fehlende ID gibt Fehler", async () => {
    const result = await toolExecutor.execute({
      tool: "mark_gmail",
      args: { id: "", action: "read" },
    });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/ID fehlt/);
  });

  it("read_google_calendar — gibt Fehler wenn nicht verbunden", async () => {
    const result = await toolExecutor.execute({
      tool: "read_google_calendar",
      args: {},
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("nicht verbunden");
  });

  it("create_google_appointment — end vor start wird abgelehnt", async () => {
    const result = await toolExecutor.execute({
      tool: "create_google_appointment",
      args: {
        subject: "Test",
        start: "2026-06-01 15:00",
        end: "2026-06-01 14:00",
      },
    });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/nach der Startzeit/);
  });

  it("create_google_appointment — fehlender Betreff gibt Fehler", async () => {
    const result = await toolExecutor.execute({
      tool: "create_google_appointment",
      args: { subject: "", start: "2026-06-01 14:00", end: "2026-06-01 15:00" },
    });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Betreff fehlt/);
  });
});
