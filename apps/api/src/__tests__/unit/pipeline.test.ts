import { describe, it, expect } from "vitest";
import { PREDEFINED_PIPELINES } from "../../services/pipeline.js";

describe("PREDEFINED_PIPELINES", () => {
  it("enthält mindestens 2 Pipelines", () => {
    expect(PREDEFINED_PIPELINES.length).toBeGreaterThanOrEqual(2);
  });

  it("jede Pipeline hat eine eindeutige ID", () => {
    const ids = PREDEFINED_PIPELINES.map((p) => p.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("jede Pipeline hat mindestens 2 Agenten", () => {
    for (const p of PREDEFINED_PIPELINES) {
      expect(p.agents.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("jeder Agent hat eine ID, einen Namen, eine Rolle und Tools", () => {
    for (const p of PREDEFINED_PIPELINES) {
      for (const a of p.agents) {
        expect(a.id).toBeTruthy();
        expect(a.name).toBeTruthy();
        expect(a.role).toBeTruthy();
        expect(a.tools.length).toBeGreaterThan(0);
      }
    }
  });

  it("Agent-IDs sind innerhalb einer Pipeline eindeutig", () => {
    for (const p of PREDEFINED_PIPELINES) {
      const ids = p.agents.map((a) => a.id);
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
    }
  });

  it("Morgenbriefing ist parallel", () => {
    const morning = PREDEFINED_PIPELINES.find(
      (p) => p.id === "morning_briefing",
    );
    expect(morning).toBeDefined();
    expect(morning!.executionMode).toBe("parallel");
  });

  it("System-Report ist parallel", () => {
    const report = PREDEFINED_PIPELINES.find((p) => p.id === "system_report");
    expect(report).toBeDefined();
    expect(report!.executionMode).toBe("parallel");
  });

  it("jede Pipeline hat ein Icon", () => {
    for (const p of PREDEFINED_PIPELINES) {
      expect(p.icon).toBeTruthy();
    }
  });
});
