import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

let mockSettings = {
  offlineMode: false,
  provider: "auto" as "auto" | "openai" | "ollama",
  openaiApiKey: "sk-test",
  enabledTools: [
    "search_web",
    "web_search",
    "fetch_url",
    "get_weather",
    "get_location",
    "describe_webpage",
    "list_connections",
    "scan_network",
    "list_devices",
  ],
  ollamaModel: "llama3.1:8b",
};

vi.mock("../../services/settings.js", () => ({
  getSettings: () => mockSettings,
  cloudAllowed: () => {
    if (mockSettings.offlineMode) return false;
    return (
      mockSettings.provider !== "ollama" && Boolean(mockSettings.openaiApiKey)
    );
  },
  cloudFirst: () =>
    mockSettings.provider === "openai" && Boolean(mockSettings.openaiApiKey),
}));

vi.mock("../../services/rules.js", () => ({
  evaluateRules: vi.fn().mockResolvedValue("allow"),
  createRule: vi.fn(),
}));

vi.mock("../../config/database.js", () => ({
  pool: {
    execute: vi.fn().mockResolvedValue([[], []]),
    getConnection: vi.fn(),
  },
}));

vi.mock("../../config/env.js", () => ({
  env: { ollamaBaseUrl: "http://localhost:11434", openaiApiKey: "" },
}));

vi.mock("../../services/memory.js", () => ({
  remember: vi.fn(),
  forgetById: vi.fn(),
  listMemories: vi.fn(),
  trackToolUsage: vi.fn(),
}));

vi.mock("../../services/homework.js", () => ({
  activateHomeworkMode: vi.fn(),
  deactivateHomeworkMode: vi.fn(),
}));

vi.mock("@ella/agent-tools", () => ({
  openApp: vi.fn(),
  getDiskUsage: vi.fn(),
  cleanTemp: vi.fn(),
  emptyRecycleBin: vi.fn(),
}));

describe("Offline-Modus", () => {
  beforeEach(() => {
    mockSettings = {
      offlineMode: false,
      provider: "auto",
      openaiApiKey: "sk-test",
      enabledTools: [
        "search_web",
        "web_search",
        "fetch_url",
        "get_weather",
        "get_location",
        "describe_webpage",
        "list_connections",
        "scan_network",
        "list_devices",
      ],
      ollamaModel: "llama3.1:8b",
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("blockiert Netzwerk-Tools wenn offlineMode aktiv", async () => {
    mockSettings.offlineMode = true;
    const { toolExecutor } = await import("../../tools/executor.js");

    for (const tool of [
      "search_web",
      "web_search",
      "fetch_url",
      "get_weather",
      "get_location",
      "describe_webpage",
    ]) {
      const result = await toolExecutor.execute({ tool, args: {} });
      expect(result.success).toBe(false);
      expect(result.error).toContain("Offline-Modus");
    }
  }, 15_000);

  it("erlaubt lokale Netzwerk-Tools im Offline-Modus", async () => {
    mockSettings.offlineMode = true;
    const { toolExecutor } = await import("../../tools/executor.js");

    for (const tool of ["list_connections", "scan_network", "list_devices"]) {
      const result = await toolExecutor.execute({ tool, args: {} });
      // Soll NICHT vom Offline-Guard blockiert werden (Fehler wegen fehlender Mocks sind OK)
      expect(result.error ?? "").not.toContain("Offline-Modus");
    }
  });

  it("cloudAllowed() gibt false zurück wenn offlineMode aktiv", async () => {
    mockSettings.offlineMode = true;
    const { cloudAllowed } = await import("../../services/settings.js");
    expect(cloudAllowed()).toBe(false);
  });

  it("cloudAllowed() gibt true zurück wenn offlineMode inaktiv und Key vorhanden", async () => {
    mockSettings.offlineMode = false;
    mockSettings.provider = "auto";
    mockSettings.openaiApiKey = "sk-test";
    const { cloudAllowed } = await import("../../services/settings.js");
    expect(cloudAllowed()).toBe(true);
  });

  it("Netzwerk-Tools funktionieren wenn offlineMode aus", async () => {
    mockSettings.offlineMode = false;
    const { toolExecutor } = await import("../../tools/executor.js");

    const result = await toolExecutor.execute({
      tool: "search_web",
      args: { query: "test" },
    });
    // Soll nicht vom Offline-Guard blockiert werden
    expect(result.error ?? "").not.toContain("Offline-Modus");
  });
});
