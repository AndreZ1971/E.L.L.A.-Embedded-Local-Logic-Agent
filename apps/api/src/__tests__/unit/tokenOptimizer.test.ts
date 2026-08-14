import { describe, it, expect } from "vitest";
import {
  optimizeToolResult,
  optimizeToolResultString,
} from "../../services/tokenOptimizer.js";

describe("optimizeToolResult", () => {
  it("gibt kompaktes JSON zurück", () => {
    const result = optimizeToolResult({ success: true, output: { value: 42 } });
    expect(result).toBe('{"success":true,"output":{"value":42}}');
  });

  it("entfernt Base64-Blobs", () => {
    const fakeBase64 = "A".repeat(250);
    const result = optimizeToolResult({ data: fakeBase64 });
    expect(result).toContain("[base64-Daten entfernt]");
    expect(result).not.toContain("A".repeat(200));
  });

  it("kürzt Arrays über 50 Einträge", () => {
    const bigArray = Array.from({ length: 100 }, (_, i) => ({ id: i }));
    const result = optimizeToolResult(bigArray);
    const parsed = JSON.parse(result) as unknown[];
    expect(parsed.length).toBe(51); // 50 Einträge + Kürzungs-Hinweis
    expect(parsed[50]).toContain("50 weitere");
  });

  it("lässt kleine Arrays unberührt", () => {
    const small = [1, 2, 3];
    const result = optimizeToolResult(small);
    expect(JSON.parse(result)).toEqual([1, 2, 3]);
  });

  it("behandelt null korrekt", () => {
    const result = optimizeToolResult(null);
    expect(result).toBe("null");
  });

  it("behandelt strings korrekt", () => {
    const result = optimizeToolResult("hallo");
    expect(result).toBe('"hallo"');
  });

  it("kürzt verschachtelte Arrays", () => {
    const nested = { items: Array.from({ length: 60 }, (_, i) => i) };
    const result = optimizeToolResult(nested);
    const parsed = JSON.parse(result) as { items: unknown[] };
    expect(parsed.items.length).toBe(51);
  });
});

describe("optimizeToolResultString", () => {
  it("minifiziert JSON-Strings", () => {
    const input = '{ "key":  "value",  "num": 42 }';
    const result = optimizeToolResultString(input);
    expect(result).toBe('{"key":"value","num":42}');
  });

  it("entfernt Base64-Blobs aus Strings", () => {
    const fakeBase64 = "B".repeat(250);
    const input = `data:image/png;base64,${fakeBase64}`;
    const result = optimizeToolResultString(input);
    expect(result).toContain("[base64-Daten entfernt]");
  });

  it("lässt Nicht-JSON-Strings unverändert (außer Base64)", () => {
    const input = "Einfacher Text ohne JSON";
    const result = optimizeToolResultString(input);
    expect(result).toBe(input);
  });
});
