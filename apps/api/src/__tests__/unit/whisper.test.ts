import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../services/settings.js", () => ({
  getSettings: () => ({ ollamaModel: "llama3.1:8b" }),
}));

vi.mock("../../config/env.js", () => ({
  env: { ollamaBaseUrl: "http://localhost:11434" },
}));

// contextAlign importieren — whisper pipeline selbst nicht laden
const { contextAlign } = await import("../../services/whisper.js");

describe("contextAlign", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("gibt bereinigten Befehl zurück", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ response: "Öffne den Explorer" }),
      }),
    );
    const result = await contextAlign("äh ella öffne öffne mal den Explorer");
    expect(result).toBe("Öffne den Explorer");
  });

  it("gibt leer zurück bei KEIN_BEFEHL", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ response: "KEIN_BEFEHL" }),
      }),
    );
    const result = await contextAlign(
      "Bohemian Rhapsody is this the real life",
    );
    expect(result).toBe("");
  });

  it("gibt Raw-Text zurück wenn Ollama offline", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("ECONNREFUSED")),
    );
    const raw = "Spiel Rammstein";
    const result = await contextAlign(raw);
    expect(result).toBe(raw);
  });

  it("gibt leer zurück für zu kurzen Input", async () => {
    const result = await contextAlign("ok");
    expect(result).toBe("");
  });
});
