import { load } from "cheerio";

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
  "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
};

/**
 * Sucht via DuckDuckGo HTML-Endpoint.
 * Kein API-Key. Privacy-first. Kein Tracking.
 */
export async function searchWeb(
  query: string,
  limit = 5,
): Promise<SearchResult[]> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}&kl=de-de`;

  const res = await fetch(url, {
    headers: HEADERS,
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) throw new Error(`DDG HTTP ${res.status}`);

  const html = await res.text();
  const $ = load(html);
  const results: SearchResult[] = [];

  $(".result").each((_i, el) => {
    if (results.length >= limit) return false;

    const title = $(el).find(".result__title").text().trim();
    const snippet = $(el).find(".result__snippet").text().trim();
    const href = $(el).find(".result__url").attr("href") ?? "";

    // DDG-Redirect-URLs auflösen: //duckduckgo.com/l/?uddg=https%3A%2F%2F...
    let cleanUrl = href;
    try {
      const uddg = new URL("https:" + href).searchParams.get("uddg");
      if (uddg) cleanUrl = decodeURIComponent(uddg);
    } catch {
      // href war bereits sauber
    }

    if (title && snippet) {
      results.push({ title, url: cleanUrl, snippet });
    }
  });

  return results;
}

/**
 * Ruft eine URL ab und extrahiert den lesbaren Text.
 * Gibt max. 3000 Zeichen zurück — genug für das LLM, kein Context-Overflow.
 */
export async function fetchUrl(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: HEADERS,
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status} für ${url}`);

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) {
    throw new Error(`Nicht unterstützter Content-Type: ${contentType}`);
  }

  const html = await res.text();
  const $ = load(html);

  $("script, style, nav, footer, header, aside, iframe, noscript").remove();

  const main =
    $("main").text() ||
    $("article").text() ||
    $('[role="main"]').text() ||
    $("body").text();

  return main.replace(/\s+/g, " ").trim().slice(0, 3000);
}
