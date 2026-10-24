import { describe, it, expect } from "vitest";
import { resolveAppearance } from "../hooks/useAppearance";

describe("resolveAppearance", () => {
  const base = {
    wanted: "hud" as const,
    accessibilityMode: "none" as const,
    homeworkActive: false,
    reducedMotion: false,
  };

  it("returns wanted appearance when no override active", () => {
    const result = resolveAppearance(base);
    expect(result.effective).toBe("hud");
    expect(result.forcedReason).toBeNull();
  });

  it("forces calm when blind mode active", () => {
    const result = resolveAppearance({ ...base, accessibilityMode: "blind" });
    expect(result.effective).toBe("calm");
    expect(result.forcedReason).toBe("blind");
  });

  it("forces calm when homework mode active", () => {
    const result = resolveAppearance({ ...base, homeworkActive: true });
    expect(result.effective).toBe("calm");
    expect(result.forcedReason).toBe("homework");
  });

  it("forces calm when reduced motion active", () => {
    const result = resolveAppearance({ ...base, reducedMotion: true });
    expect(result.effective).toBe("calm");
    expect(result.forcedReason).toBe("reduced_motion");
  });

  it("blind takes priority over homework", () => {
    const result = resolveAppearance({
      ...base,
      accessibilityMode: "blind",
      homeworkActive: true,
    });
    expect(result.forcedReason).toBe("blind");
  });

  it("homework takes priority over reduced motion", () => {
    const result = resolveAppearance({
      ...base,
      homeworkActive: true,
      reducedMotion: true,
    });
    expect(result.forcedReason).toBe("homework");
  });

  it("deaf mode does not force calm", () => {
    const result = resolveAppearance({ ...base, accessibilityMode: "deaf" });
    expect(result.effective).toBe("hud");
    expect(result.forcedReason).toBeNull();
  });

  it("show appearance passes through when no override", () => {
    const result = resolveAppearance({ ...base, wanted: "show" });
    expect(result.effective).toBe("show");
    expect(result.forcedReason).toBeNull();
  });

  it("calm appearance passes through when no override", () => {
    const result = resolveAppearance({ ...base, wanted: "calm" });
    expect(result.effective).toBe("calm");
    expect(result.forcedReason).toBeNull();
  });
});
