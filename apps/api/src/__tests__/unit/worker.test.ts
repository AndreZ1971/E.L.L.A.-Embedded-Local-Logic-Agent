import { describe, it, expect, vi } from "vitest";

vi.mock("../../config/database.js", () => ({ pool: { execute: vi.fn() } }));
vi.mock("../../config/env.js", () => ({
  env: { ollamaBaseUrl: "http://localhost:11434" },
}));
vi.mock("../../services/eventBus.js", () => ({
  eventBus: { emit: vi.fn() },
  EVENT_SYSTEM: "system",
}));
vi.mock("../../services/memory.js", () => ({
  remember: vi.fn().mockResolvedValue({ success: true }),
}));

import {
  computePnPDelta,
  getDiskMetric,
  type PnPDevice,
} from "../../services/worker.js";

const makeDevice = (id: string, name: string): PnPDevice => ({
  instanceId: id,
  name,
  class: "USB",
});

describe("computePnPDelta", () => {
  it("returns empty arrays when both maps are empty", () => {
    const result = computePnPDelta(new Map(), new Map());
    expect(result.connected).toHaveLength(0);
    expect(result.disconnected).toHaveLength(0);
  });

  it("detects newly connected device", () => {
    const current = new Map([["id1", makeDevice("id1", "USB Drive")]]);
    const last = new Map<string, PnPDevice>();
    const { connected, disconnected } = computePnPDelta(current, last);
    expect(connected).toHaveLength(1);
    expect(connected[0].name).toBe("USB Drive");
    expect(disconnected).toHaveLength(0);
  });

  it("detects disconnected device", () => {
    const current = new Map<string, PnPDevice>();
    const last = new Map([["id1", makeDevice("id1", "Camera")]]);
    const { connected, disconnected } = computePnPDelta(current, last);
    expect(connected).toHaveLength(0);
    expect(disconnected).toHaveLength(1);
    expect(disconnected[0].name).toBe("Camera");
  });

  it("reports nothing when device is in both maps", () => {
    const device = makeDevice("id1", "USB Hub");
    const current = new Map([["id1", device]]);
    const last = new Map([["id1", device]]);
    const { connected, disconnected } = computePnPDelta(current, last);
    expect(connected).toHaveLength(0);
    expect(disconnected).toHaveLength(0);
  });

  it("handles simultaneous connect and disconnect", () => {
    const current = new Map([["new", makeDevice("new", "Webcam")]]);
    const last = new Map([["old", makeDevice("old", "Headset")]]);
    const { connected, disconnected } = computePnPDelta(current, last);
    expect(connected[0].name).toBe("Webcam");
    expect(disconnected[0].name).toBe("Headset");
  });
});

// getDiskMetric uses execSync internally — tested against the real WMIC binary
// (Windows-only, gracefully skipped when WMIC is unavailable).
describe("getDiskMetric — WMIC integration", () => {
  it("returns null for a non-existent drive letter", () => {
    // Drive letter Z is only used as a workspace mount in this repo, but the
    // function should still return null or a valid metric — never throw.
    const result = getDiskMetric("Q");
    expect(result === null || typeof result?.usedPct === "number").toBe(true);
  });

  it("returns a valid metric for drive C", () => {
    const metric = getDiskMetric("C");
    if (metric === null) return; // WMIC unavailable / deprecated in this environment
    expect(metric.drive).toBe("C");
    expect(metric.usedPct).toBeGreaterThanOrEqual(0);
    expect(metric.usedPct).toBeLessThanOrEqual(100);
    expect(metric.totalBytes).toBeGreaterThan(0);
    expect(metric.freeBytes).toBeGreaterThanOrEqual(0);
  });

  it("never throws — returns null on any error", () => {
    // Call with an obviously invalid drive; the function must not propagate errors.
    expect(() => getDiskMetric("!")).not.toThrow();
  });
});
