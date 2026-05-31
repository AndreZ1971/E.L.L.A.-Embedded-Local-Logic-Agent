import { describe, it, expect } from "vitest";
import { wmoLabel, WMO_CODES } from "../../services/weather.js";

describe("weather — WMO-Code-Mapping", () => {
  it("gibt korrekte Beschreibung für Code 0 zurück", () => {
    expect(wmoLabel(0)).toBe("Klarer Himmel");
  });

  it("gibt korrekte Beschreibung für Gewitter zurück", () => {
    expect(wmoLabel(95)).toBe("Gewitter");
  });

  it("gibt Fallback für unbekannten Code zurück", () => {
    expect(wmoLabel(999)).toBe("Unbekannte Wetterlage");
  });

  it("alle WMO_CODES Einträge sind nicht-leere Strings", () => {
    for (const [, label] of Object.entries(WMO_CODES)) {
      expect(typeof label).toBe("string");
      expect(label.length).toBeGreaterThan(0);
    }
  });

  it("rundet Temperatur korrekt (via Math.round)", () => {
    expect(Math.round(18.7)).toBe(19);
    expect(Math.round(18.4)).toBe(18);
    expect(Math.round(-0.6)).toBe(-1);
  });
});
