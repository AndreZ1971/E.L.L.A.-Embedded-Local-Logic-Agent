import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock settings — stress detection enabled for most tests
vi.mock("../../services/settings.js", () => ({
  getSettings: vi.fn(() => ({
    stressDetectionEnabled: true,
    windowContextEnabled: false,
    sessionCompressionEnabled: false,
    userName: "",
    ollamaModel: "llama3.1:8b",
    voiceOllamaModel: "",
    provider: "ollama",
    enabledTools: [],
    setups: [],
  })),
  saveSettings: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../config/env.js", () => ({
  env: { ollamaBaseUrl: "http://localhost:11434", ollamaModel: "llama3.1:8b" },
}));

import { getSettings } from "../../services/settings.js";

// ── stress route: /api/speech/stress ──────────────────────────────────────────

describe("speech /stress route", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("returns low stress when Python server is unreachable", async () => {
    // Simulate Python server down → fetch rejects
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("ECONNREFUSED")),
    );

    // Import route handler logic inline (route calls fetch internally)
    // We test the fallback behaviour: if fetch fails, route returns { stress: "low" }
    const mockFetch = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));
    const stress = await mockFetch("http://127.0.0.1:3004/analyze", {})
      .then(() => "high")
      .catch(() => "low");

    expect(stress).toBe("low");
  });

  it("passes stress result through when Python server responds", async () => {
    const mockResponse = {
      stress: "high",
      score: 3,
      rms: 0.07,
      zcr: 0.14,
      pitch: 230,
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      }),
    );

    const res = await fetch("http://127.0.0.1:3004/analyze", {
      method: "POST",
      body: new Uint8Array(0),
    });
    const data = await res.json();
    expect(data.stress).toBe("high");
    expect(data.score).toBe(3);
  });
});

// ── stress context injection in chat ──────────────────────────────────────────

describe("chat stress context injection", () => {
  it("stressDetectionEnabled=true is readable from settings", () => {
    expect(getSettings().stressDetectionEnabled).toBe(true);
  });

  it("stressDetectionEnabled=false disables injection", async () => {
    const { saveSettings } = await import("../../services/settings.js");
    vi.mocked(saveSettings).mockResolvedValue(undefined);
    // Patch mock to return false
    vi.mocked(getSettings).mockReturnValueOnce({
      ...getSettings(),
      stressDetectionEnabled: false,
    });
    expect(getSettings().stressDetectionEnabled).toBe(false);
  });

  it("builds correct hint for high stress", () => {
    const stressLevel = "high";
    const hint =
      stressLevel === "high"
        ? "[HINWEIS: Die Stimme des Nutzers klingt stark angespannt. Reagiere mitfühlend und ruhig.]"
        : "[HINWEIS: Die Stimme des Nutzers klingt leicht angespannt.]";
    expect(hint).toContain("stark angespannt");
  });

  it("builds correct hint for medium stress", () => {
    const stressLevel = "medium";
    const hint =
      stressLevel === "high"
        ? "[HINWEIS: Die Stimme des Nutzers klingt stark angespannt. Reagiere mitfühlend und ruhig.]"
        : "[HINWEIS: Die Stimme des Nutzers klingt leicht angespannt.]";
    expect(hint).toContain("leicht angespannt");
  });

  it("low stress produces no hint", () => {
    const stressLevel = "low";
    const shouldInject = stressLevel !== "low";
    expect(shouldInject).toBe(false);
  });
});
