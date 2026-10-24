import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("fs/promises", () => ({
  readFile: vi.fn(),
  writeFile: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../config/database.js", () => ({
  pool: { execute: vi.fn().mockResolvedValue([[], []]) },
}));

vi.mock("../../services/eventBus.js", () => ({
  eventBus: { emit: vi.fn() },
  EVENT_SYSTEM: "system",
}));

import {
  cloudAllowed,
  saveSettings,
  getSettings,
} from "../../services/settings.js";
import { CloudBlockedError, openaiRequest } from "../../services/openai.js";

describe("cloudAllowed()", () => {
  beforeEach(async () => {
    await saveSettings({ provider: "auto", openaiApiKey: "" });
  });

  it("returns false when provider is ollama", async () => {
    await saveSettings({ provider: "ollama", openaiApiKey: "sk-test" });
    expect(cloudAllowed()).toBe(false);
  });

  it("returns false when no API key is set", async () => {
    await saveSettings({ provider: "openai", openaiApiKey: "" });
    expect(cloudAllowed()).toBe(false);
  });

  it("returns true when provider is openai and key is set", async () => {
    await saveSettings({ provider: "openai", openaiApiKey: "sk-test" });
    expect(cloudAllowed()).toBe(true);
  });

  it("returns true when provider is auto and key is set", async () => {
    await saveSettings({ provider: "auto", openaiApiKey: "sk-test" });
    expect(cloudAllowed()).toBe(true);
  });
});

describe("CloudBlockedError", () => {
  it("has the correct purpose property", () => {
    const err = new CloudBlockedError("vision");
    expect(err.purpose).toBe("vision");
    expect(err.message).toContain("vision");
    expect(err).toBeInstanceOf(Error);
  });
});

describe("openaiRequest()", () => {
  beforeEach(async () => {
    await saveSettings({ provider: "ollama", openaiApiKey: "" });
  });

  it("throws CloudBlockedError when cloud is not allowed", async () => {
    await expect(
      openaiRequest("/v1/chat/completions", { body: "{}" }, "chat"),
    ).rejects.toThrow(CloudBlockedError);
  });

  it("throws CloudBlockedError with correct purpose", async () => {
    try {
      await openaiRequest("/v1/chat/completions", { body: "{}" }, "vision");
    } catch (e) {
      expect(e).toBeInstanceOf(CloudBlockedError);
      expect((e as CloudBlockedError).purpose).toBe("vision");
    }
  });
});
