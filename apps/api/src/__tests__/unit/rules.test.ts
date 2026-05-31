import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  evaluateRules,
  DIRECTIVE_DENY,
  createRule,
  updateRule,
  deleteRule,
  toggleRule,
} from "../../services/rules.js";

vi.mock("../../config/database.js", () => ({
  pool: { execute: vi.fn() },
}));

import { pool } from "../../config/database.js";
const mockExecute = vi.mocked(pool.execute);

describe("DIRECTIVE_DENY", () => {
  afterEach(() => {
    DIRECTIVE_DENY.delete("__test_blocked__");
  });

  it("returns deny and writes audit log for tool in directive set", async () => {
    mockExecute.mockResolvedValue([[], []]);
    DIRECTIVE_DENY.add("__test_blocked__");
    const result = await evaluateRules("__test_blocked__" as any);
    expect(result).toBe("deny");
    // auditDirectiveDeny writes to directive_audit table — one DB call expected
    expect(mockExecute).toHaveBeenCalledTimes(1);
  });
});

describe("evaluateRules", () => {
  beforeEach(() => mockExecute.mockReset());

  it("returns allow when rule list is empty (Default-Allow)", async () => {
    mockExecute.mockResolvedValue([[], []]);
    expect(await evaluateRules("get_disk_usage")).toBe("allow");
  });

  it("returns allow for wildcard always-allow rule", async () => {
    mockExecute.mockResolvedValue([
      [{ tool_name: "*", trigger: "always", action: "allow" }],
      [],
    ]);
    expect(await evaluateRules("clean_temp")).toBe("allow");
  });

  it("returns deny before allow when both rules match", async () => {
    mockExecute.mockResolvedValue([
      [
        { tool_name: "*", trigger: "always", action: "deny" },
        { tool_name: "*", trigger: "always", action: "allow" },
      ],
      [],
    ]);
    expect(await evaluateRules("clean_temp")).toBe("deny");
  });

  it("skips rule for a different tool_name and falls back to allow", async () => {
    mockExecute.mockResolvedValue([
      [{ tool_name: "open_app", trigger: "always", action: "deny" }],
      [],
    ]);
    expect(await evaluateRules("clean_temp")).toBe("allow");
  });

  it("evaluates hour > N as true when current hour is past threshold", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T15:00:00"));
    mockExecute.mockResolvedValue([
      [{ tool_name: "*", trigger: "hour > 12", action: "allow" }],
      [],
    ]);
    expect(await evaluateRules("clean_temp")).toBe("allow");
    vi.useRealTimers();
  });

  it("evaluates hour > N as false when current hour is before threshold — falls back to allow", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T10:00:00"));
    mockExecute.mockResolvedValue([
      [{ tool_name: "*", trigger: "hour > 12", action: "allow" }],
      [],
    ]);
    expect(await evaluateRules("clean_temp")).toBe("allow");
    vi.useRealTimers();
  });

  it("evaluates hour < N as true when current hour is before threshold", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T08:00:00"));
    mockExecute.mockResolvedValue([
      [{ tool_name: "*", trigger: "hour < 9", action: "deny" }],
      [],
    ]);
    expect(await evaluateRules("clean_temp")).toBe("deny");
    vi.useRealTimers();
  });
});

describe("createRule", () => {
  beforeEach(() => mockExecute.mockReset());

  it("inserts into DB and returns insertId", async () => {
    mockExecute.mockResolvedValue([{ insertId: 42 }, []]);
    const id = await createRule({
      name: "Test",
      tool_name: "*",
      trigger: "always",
      action: "allow",
      enabled: true,
    });
    expect(id).toBe(42);
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT"),
      expect.arrayContaining(["Test", "*", "always", "allow", true]),
    );
  });
});

describe("updateRule", () => {
  beforeEach(() => mockExecute.mockReset());

  it("calls UPDATE with field and id", async () => {
    mockExecute.mockResolvedValue([[], []]);
    await updateRule(7, { enabled: false });
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE"),
      expect.arrayContaining([false, 7]),
    );
  });

  it("is a no-op when no fields are provided", async () => {
    await updateRule(7, {});
    expect(mockExecute).not.toHaveBeenCalled();
  });
});

describe("deleteRule", () => {
  beforeEach(() => mockExecute.mockReset());

  it("deletes by id", async () => {
    mockExecute.mockResolvedValue([[], []]);
    await deleteRule(5);
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("DELETE"),
      [5],
    );
  });
});

describe("toggleRule", () => {
  beforeEach(() => mockExecute.mockReset());

  it("flips enabled flag by id", async () => {
    mockExecute.mockResolvedValue([[], []]);
    await toggleRule(3);
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("enabled"),
      [3],
    );
  });
});
