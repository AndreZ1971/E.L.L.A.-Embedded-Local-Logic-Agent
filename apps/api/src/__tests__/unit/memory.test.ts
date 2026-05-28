import { describe, it, expect, vi, beforeEach } from "vitest";
import { cosine, forgetById } from "../../services/memory.js";

vi.mock("../../config/database.js", () => ({
  pool: { execute: vi.fn() },
}));
vi.mock("../../config/env.js", () => ({
  env: { ollamaBaseUrl: "http://localhost:11434" },
}));
vi.mock("../../services/settings.js", () => ({
  getSettings: vi.fn(() => ({ ollamaModel: "llama3.1:8b" })),
  loadSettings: vi.fn(),
  saveSettings: vi.fn(),
  DEFAULT_SETTINGS: { ollamaModel: "llama3.1:8b" },
  MASKED: "***",
  getActiveApiKey: vi.fn(() => ""),
}));

import { pool } from "../../config/database.js";
const mockExecute = vi.mocked(pool.execute);

describe("cosine", () => {
  it("returns 1 for identical unit vectors", () => {
    expect(cosine([1, 0, 0], [1, 0, 0])).toBeCloseTo(1);
  });

  it("returns 0 for perpendicular vectors", () => {
    expect(cosine([1, 0, 0], [0, 1, 0])).toBeCloseTo(0);
  });

  it("returns 0 when a vector is all zeros", () => {
    expect(cosine([0, 0, 0], [1, 2, 3])).toBe(0);
  });

  it("handles non-unit vectors correctly", () => {
    expect(cosine([2, 0, 0], [3, 0, 0])).toBeCloseTo(1);
  });

  it("returns a value between -1 and 1 for arbitrary vectors", () => {
    const score = cosine([1, 2, 3], [4, 5, 6]);
    expect(score).toBeGreaterThan(-1);
    expect(score).toBeLessThanOrEqual(1);
  });
});

describe("forgetById", () => {
  beforeEach(() => mockExecute.mockReset());

  it("returns error for id = 0", async () => {
    const result = await forgetById(0);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Ungültige ID/);
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it("returns error for negative id", async () => {
    const result = await forgetById(-5);
    expect(result.success).toBe(false);
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it("returns error for NaN", async () => {
    const result = await forgetById(NaN);
    expect(result.success).toBe(false);
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it("deletes and returns success for valid id", async () => {
    mockExecute.mockResolvedValue([[], []]);
    const result = await forgetById(5);
    expect(result.success).toBe(true);
    expect(result.output).toContain("5");
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("DELETE"),
      [5],
    );
  });

  it("returns success message with correct id", async () => {
    mockExecute.mockResolvedValue([[], []]);
    const result = await forgetById(99);
    expect(result.output).toContain("99");
  });
});
