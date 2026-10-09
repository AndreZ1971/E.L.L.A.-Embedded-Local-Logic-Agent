import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../config/database.js", () => ({
  pool: { execute: vi.fn() },
}));
vi.mock("../../config/env.js", () => ({
  env: { ollamaBaseUrl: "http://localhost:11434" },
}));
vi.mock("../../services/settings.js", () => ({
  getSettings: vi.fn(() => ({
    ollamaModel: "llama3.1:8b",
    ttsEnabled: false,
    accessibilityMode: "none",
    homeworkMode: { active: false, pinHash: "", apps: [] },
    selfLearningEnabled: true,
  })),
  loadSettings: vi.fn(),
  saveSettings: vi.fn(),
  DEFAULT_SETTINGS: { ollamaModel: "llama3.1:8b" },
  MASKED: "***",
  getActiveApiKey: vi.fn(() => ""),
}));

import { pool } from "../../config/database.js";
import { recallExamples } from "../../services/memory.js";
import { buildSystemPrompt } from "../../services/ollama.js";

const mockExecute = vi.mocked(pool.execute);

const mockEmbedding = [0.1, 0.2, 0.3, 0.4, 0.5];

describe("recallExamples", () => {
  beforeEach(() => {
    mockExecute.mockReset();
    vi.restoreAllMocks();
  });

  it("returns empty array when embedding fails", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false }) as any;
    const result = await recallExamples("test query");
    expect(result).toEqual([]);
  });

  it("returns matching examples sorted by score", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ embeddings: [mockEmbedding] }),
    }) as any;

    const rows = [
      {
        id: 1,
        user_message: "Wie wird das Wetter?",
        assistant_reply: "Heute sonnig, 22°C.",
        embedding: JSON.stringify(mockEmbedding),
      },
      {
        id: 2,
        user_message: "Was sind Primzahlen?",
        assistant_reply: "Zahlen die nur durch 1 und sich selbst teilbar sind.",
        embedding: JSON.stringify([0.9, 0.8, 0.7, 0.6, 0.5]),
      },
    ];

    mockExecute
      .mockResolvedValueOnce([rows, []] as any)
      .mockResolvedValue([[], []] as any);

    const result = await recallExamples("Wie wird das Wetter morgen?");
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].userMessage).toBe("Wie wird das Wetter?");
    expect(result[0].assistantReply).toBe("Heute sonnig, 22°C.");
  });

  it("returns empty array when no examples exist", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ embeddings: [mockEmbedding] }),
    }) as any;

    mockExecute.mockResolvedValueOnce([[], []] as any);

    const result = await recallExamples("test");
    expect(result).toEqual([]);
  });

  it("respects limit parameter", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ embeddings: [mockEmbedding] }),
    }) as any;

    const rows = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      user_message: `Frage ${i}`,
      assistant_reply: `Antwort ${i}`,
      embedding: JSON.stringify(mockEmbedding),
    }));

    mockExecute
      .mockResolvedValueOnce([rows, []] as any)
      .mockResolvedValue([[], []] as any);

    const result = await recallExamples("Frage", 2);
    expect(result.length).toBeLessThanOrEqual(2);
  });
});

describe("buildSystemPrompt with learningExamples", () => {
  it("includes learning examples in prompt when provided", () => {
    const examples = [
      {
        userMessage: "Wie spät ist es?",
        assistantReply: "Es ist 14:30 Uhr.",
      },
    ];
    const prompt = buildSystemPrompt([], "", "", examples);
    expect(prompt).toContain("Erfolgreiche Antworten");
    expect(prompt).toContain("Wie spät ist es?");
    expect(prompt).toContain("Es ist 14:30 Uhr.");
  });

  it("does not include section when no examples", () => {
    const prompt = buildSystemPrompt([], "", "", []);
    expect(prompt).not.toContain("Erfolgreiche Antworten");
  });

  it("truncates long messages in examples", () => {
    const longMsg = "A".repeat(500);
    const examples = [
      { userMessage: longMsg, assistantReply: "Kurze Antwort" },
    ];
    const prompt = buildSystemPrompt([], "", "", examples);
    expect(prompt).toContain("Erfolgreiche Antworten");
    expect(prompt.indexOf("A".repeat(201))).toBe(-1);
  });
});
