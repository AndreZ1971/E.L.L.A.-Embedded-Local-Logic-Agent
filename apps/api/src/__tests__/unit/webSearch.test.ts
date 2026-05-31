import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch before importing module
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const { searchWeb, fetchUrl } = await import("../../services/webSearch.js");

describe("webSearch — URL-Bereinigung", () => {
  beforeEach(() => mockFetch.mockReset());

  it("extrahiert URL aus DDG-Redirect korrekt", async () => {
    const encoded = encodeURIComponent("https://example.com/page");
    const html = `
      <div class="result">
        <span class="result__title">Test Title</span>
        <span class="result__snippet">Test Snippet</span>
        <a class="result__url" href="//duckduckgo.com/l/?uddg=${encoded}"></a>
      </div>`;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => html,
    });
    const results = await searchWeb("test", 5);
    expect(results).toHaveLength(1);
    expect(results[0].url).toBe("https://example.com/page");
    expect(results[0].title).toBe("Test Title");
    expect(results[0].snippet).toBe("Test Snippet");
  });

  it("gibt leeres Array zurück bei leerem HTML", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => "<html><body></body></html>",
    });
    const results = await searchWeb("test", 5);
    expect(results).toEqual([]);
  });

  it("wirft Fehler bei HTTP-Fehler", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 503 });
    await expect(searchWeb("test")).rejects.toThrow("DDG HTTP 503");
  });
});

describe("fetchUrl — Inhalt extrahieren", () => {
  beforeEach(() => mockFetch.mockReset());

  it("extrahiert Text aus HTML-Seite", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => "text/html; charset=utf-8" },
      text: async () =>
        "<html><body><main>Hallo Welt  Test</main></body></html>",
    });
    const content = await fetchUrl("https://example.com");
    expect(content).toContain("Hallo Welt");
  });

  it("wirft bei nicht-HTML Content-Type", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => "application/json" },
      text: async () => "{}",
    });
    await expect(fetchUrl("https://example.com/api")).rejects.toThrow(
      "Content-Type",
    );
  });

  it("begrenzt Output auf 3000 Zeichen", async () => {
    const longText = "a".repeat(5000);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => "text/html" },
      text: async () => `<html><body><main>${longText}</main></body></html>`,
    });
    const content = await fetchUrl("https://example.com");
    expect(content.length).toBeLessThanOrEqual(3000);
  });
});
