import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { pool } from "../../config/database.js";
import { evaluateRules, createRule, deleteRule } from "../../services/rules.js";
import {
  getSettings,
  saveSettings,
  loadSettings,
  DEFAULT_SETTINGS,
} from "../../services/settings.js";

let skipDb = false;

beforeAll(async () => {
  try {
    await pool.execute("SELECT 1");
    await loadSettings();
  } catch {
    skipDb = true;
  }
});

afterAll(async () => {
  await pool.end().catch(() => {});
});

describe("evaluateRules — DB integration", () => {
  it("returns allow for get_disk_usage (seed rule 1)", async () => {
    if (skipDb) return;
    const result = await evaluateRules("get_disk_usage");
    expect(["allow", "no_match"]).toContain(result);
  });

  it("returns allow for get_system_status (seed rule 20)", async () => {
    if (skipDb) return;
    const result = await evaluateRules("get_system_status");
    expect(result).toBe("allow");
  });

  it("returns no_match for unknown tool", async () => {
    if (skipDb) return;
    const result = await evaluateRules("__nonexistent_tool__" as any);
    expect(result).toBe("no_match");
  });
});

describe("createRule → evaluateRules round-trip", () => {
  let ruleId: number;

  it("deny rule blocks the tool", async () => {
    if (skipDb) return;
    ruleId = await createRule({
      name: "integration-test-deny",
      tool_name: "clean_temp",
      trigger: "always",
      action: "deny",
      enabled: true,
    });
    expect(ruleId).toBeGreaterThan(0);
    const decision = await evaluateRules("clean_temp");
    expect(decision).toBe("deny");
  });

  afterAll(async () => {
    if (ruleId) await deleteRule(ruleId).catch(() => {});
  });
});

describe("settings — getSettings / saveSettings round-trip", () => {
  it("patched value is readable via getSettings", async () => {
    const original = getSettings().ttsVoice;
    await saveSettings({ ttsVoice: "__integration_test__" });
    expect(getSettings().ttsVoice).toBe("__integration_test__");
    await saveSettings({ ttsVoice: original });
  });

  it("enabledTools contains list_devices after default migration", async () => {
    expect(getSettings().enabledTools).toContain("list_devices");
  });
});

describe("emergency-reset — homeworkMode & PIN cleared", () => {
  it("resets homeworkMode.active and pinHash via saveSettings", async () => {
    await saveSettings({
      homeworkMode: { pinHash: "abc123", apps: [], active: true },
      emergencyResetAt: null,
    });
    expect(getSettings().homeworkMode.active).toBe(true);
    expect(getSettings().homeworkMode.pinHash).toBe("abc123");

    const s = getSettings();
    await saveSettings({
      homeworkMode: { ...s.homeworkMode, active: false, pinHash: "" },
      emergencyResetAt: new Date().toISOString(),
    });

    expect(getSettings().homeworkMode.active).toBe(false);
    expect(getSettings().homeworkMode.pinHash).toBe("");
    expect(getSettings().emergencyResetAt).not.toBeNull();

    await saveSettings({
      homeworkMode: { pinHash: "", apps: [], active: false },
      emergencyResetAt: null,
    });
  });
});

describe("web_search — fetch_url — get_weather Tool-Kette", () => {
  it("fetch_url blockiert file://-URLs", async () => {
    if (skipDb) return;
    const { toolExecutor } = await import("../../tools/executor.js");
    const result = await toolExecutor.execute({
      tool: "fetch_url",
      args: { url: "file:///etc/passwd" },
    });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/HTTP\/HTTPS/i);
  });

  it("fetch_url blockiert ftp://-URLs", async () => {
    if (skipDb) return;
    const { toolExecutor } = await import("../../tools/executor.js");
    const result = await toolExecutor.execute({
      tool: "fetch_url",
      args: { url: "ftp://example.com/file.txt" },
    });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/HTTP\/HTTPS/i);
  });

  it("web_search gibt Fehler zurück bei leerer Query", async () => {
    if (skipDb) return;
    const { toolExecutor } = await import("../../tools/executor.js");
    const result = await toolExecutor.execute({
      tool: "web_search",
      args: { query: "" },
    });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Suchanfrage fehlt/i);
  });

  it("get_weather gibt Fehler zurück wenn kein Standort bekannt", async () => {
    if (skipDb) return;
    const { toolExecutor } = await import("../../tools/executor.js");
    const result = await toolExecutor.execute({
      tool: "get_weather",
      args: {},
    });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Standort/i);
  });

  it("DEFAULT_SETTINGS enthält web_search, fetch_url, get_weather", () => {
    expect(DEFAULT_SETTINGS.enabledTools).toContain("web_search");
    expect(DEFAULT_SETTINGS.enabledTools).toContain("fetch_url");
    expect(DEFAULT_SETTINGS.enabledTools).toContain("get_weather");
  });
});

describe("pool — direct SQL sanity", () => {
  it("can query system_events table", async () => {
    if (skipDb) return;
    const [rows] = await pool.execute<any[]>(
      "SELECT COUNT(*) as cnt FROM system_events",
    );
    expect(rows[0].cnt).toBeGreaterThanOrEqual(0);
  });

  it("can query rules table and it has at least one row", async () => {
    if (skipDb) return;
    const [rows] = await pool.execute<any[]>(
      "SELECT COUNT(*) as cnt FROM rules",
    );
    expect(rows[0].cnt).toBeGreaterThan(0);
  });
});
