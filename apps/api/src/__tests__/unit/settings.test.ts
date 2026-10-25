import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("fs/promises", () => ({
  readFile: vi.fn(),
  writeFile: vi.fn().mockResolvedValue(undefined),
}));

import {
  DEFAULT_SETTINGS,
  getSettings,
  saveSettings,
  loadSettings,
} from "../../services/settings.js";
import * as fsMod from "fs/promises";

describe("DEFAULT_SETTINGS", () => {
  it("includes all phase-9/10/11 tools", () => {
    const tools = DEFAULT_SETTINGS.enabledTools;
    expect(tools).toContain("list_devices");
    expect(tools).toContain("scan_network");
    expect(tools).toContain("list_connections");
    expect(tools).toContain("get_system_status");
  });

  it("includes core tools", () => {
    const tools = DEFAULT_SETTINGS.enabledTools;
    expect(tools).toContain("get_disk_usage");
    expect(tools).toContain("clean_temp");
    expect(tools).toContain("open_app");
    expect(tools).toContain("remember");
  });

  it("has provider = auto", () => {
    expect(DEFAULT_SETTINGS.provider).toBe("auto");
  });

  it("has sessionLimit = 20", () => {
    expect(DEFAULT_SETTINGS.sessionLimit).toBe(20);
  });
});

describe("saveSettings / getSettings", () => {
  beforeEach(() => {
    vi.mocked(fsMod.writeFile).mockResolvedValue(undefined);
  });

  it("saveSettings patches the in-memory settings", async () => {
    await saveSettings({ ttsEnabled: true });
    expect(getSettings().ttsEnabled).toBe(true);
    await saveSettings({ ttsEnabled: false }); // restore
  });

  it("saveSettings calls writeFile", async () => {
    await saveSettings({ ollamaModel: "mistral" });
    expect(vi.mocked(fsMod.writeFile)).toHaveBeenCalled();
    await saveSettings({ ollamaModel: DEFAULT_SETTINGS.ollamaModel }); // restore
  });

  it("getSettings returns an object with all expected keys", () => {
    const s = getSettings();
    expect(s).toHaveProperty("provider");
    expect(s).toHaveProperty("enabledTools");
    expect(s).toHaveProperty("ollamaModel");
    expect(s).toHaveProperty("homeworkMode");
  });

  it("stressDetectionEnabled defaults to false", () => {
    expect(DEFAULT_SETTINGS.stressDetectionEnabled).toBe(false);
  });

  it("stressDetectionEnabled can be patched", async () => {
    await saveSettings({ stressDetectionEnabled: true });
    expect(getSettings().stressDetectionEnabled).toBe(true);
    await saveSettings({ stressDetectionEnabled: false });
  });
});

describe("loadSettings migration", () => {
  it("migrates old setup format: apps[] → open[]", async () => {
    const oldData = JSON.stringify({
      setups: [{ id: "x", name: "work", apps: ["vscode"], close: [] }],
    });
    vi.mocked(fsMod.readFile).mockResolvedValue(oldData as any);
    await loadSettings();
    const { setups } = getSettings();
    const workSetup = setups.find((s) => s.name === "work");
    expect(workSetup?.open).toEqual(["vscode"]);
  });

  it("adds new default tools missing from old settings files", async () => {
    const oldData = JSON.stringify({
      enabledTools: ["open_app", "get_disk_usage"],
    });
    vi.mocked(fsMod.readFile).mockResolvedValue(oldData as any);
    await loadSettings();
    const { enabledTools } = getSettings();
    expect(enabledTools).toContain("get_system_status");
    expect(enabledTools).toContain("list_devices");
  });

  it("falls back to defaults when file does not exist", async () => {
    vi.mocked(fsMod.readFile).mockRejectedValue(
      Object.assign(new Error("ENOENT"), { code: "ENOENT" }),
    );
    await loadSettings();
    // Should not throw; settings remain at defaults
    expect(getSettings().provider).toBe(DEFAULT_SETTINGS.provider);
  });

  it("migrates missing hudWidgets to defaults", async () => {
    const oldData = JSON.stringify({ provider: "auto" });
    vi.mocked(fsMod.readFile).mockResolvedValue(oldData as any);
    await loadSettings();
    const { hudWidgets } = getSettings();
    expect(hudWidgets).toEqual(DEFAULT_SETTINGS.hudWidgets);
    expect(hudWidgets.left).toEqual(["system", "monitors"]);
    expect(hudWidgets.right).toEqual(["routines", "directive"]);
  });

  it("migrates malformed hudWidgets to defaults", async () => {
    const badData = JSON.stringify({ hudWidgets: { left: "not-array" } });
    vi.mocked(fsMod.readFile).mockResolvedValue(badData as any);
    await loadSettings();
    expect(getSettings().hudWidgets).toEqual(DEFAULT_SETTINGS.hudWidgets);
  });

  it("preserves valid custom hudWidgets", async () => {
    const customWidgets = { left: ["clock"], right: ["system", "directive"] };
    const data = JSON.stringify({ hudWidgets: customWidgets });
    vi.mocked(fsMod.readFile).mockResolvedValue(data as any);
    await loadSettings();
    expect(getSettings().hudWidgets).toEqual(customWidgets);
  });

  it("hudWidgets can be patched via saveSettings", async () => {
    const newWidgets = { left: ["clock", "system"], right: ["monitors"] };
    await saveSettings({ hudWidgets: newWidgets });
    expect(getSettings().hudWidgets).toEqual(newWidgets);
    await saveSettings({ hudWidgets: DEFAULT_SETTINGS.hudWidgets });
  });
});
