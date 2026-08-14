/**
 * Token-Optimizer — verlustfreie Kompression von Tool-Ergebnissen
 * bevor sie in die Message-History eingehen.
 *
 * Pipeline (in dieser Reihenfolge):
 *   1. JSON-Minifikation     — entfernt Whitespace aus JSON (verlustlos, 20–40%)
 *   2. Base64-Entfernung     — ersetzt Binär-Blobs durch Platzhalter (verlustlos)
 *   3. Whitespace-Cleanup    — kollabiert Leerzeilen, trimmt Zeilen (verlustlos)
 *   4. Array-Truncation      — kürzt sehr lange Arrays auf MAX_ARRAY_ITEMS (leicht verlustreich)
 */

const MAX_ARRAY_ITEMS = 50;
const BASE64_RE = /[A-Za-z0-9+/]{200,}={0,2}/g;

function minifyJson(text: string): string {
  const t = text.trim();
  if (t[0] !== "{" && t[0] !== "[") return text;
  try {
    return JSON.stringify(JSON.parse(t));
  } catch {
    return text;
  }
}

function stripBase64(text: string): string {
  return text.replace(BASE64_RE, "[base64-Daten entfernt]");
}

function normalizeWhitespace(text: string): string {
  return text
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}

function truncateLargeArrays(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    const trimmed = obj.slice(0, MAX_ARRAY_ITEMS).map(truncateLargeArrays);
    if (obj.length > MAX_ARRAY_ITEMS) {
      (trimmed as unknown[]).push(
        `… ${obj.length - MAX_ARRAY_ITEMS} weitere Einträge gekürzt`,
      );
    }
    return trimmed;
  }
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
        k,
        truncateLargeArrays(v),
      ]),
    );
  }
  return obj;
}

/**
 * Optimiert ein Tool-Ergebnis (beliebiger Typ) für die Message-History.
 * Gibt einen kompakten JSON-String zurück.
 */
export function optimizeToolResult(result: unknown): string {
  const truncated = truncateLargeArrays(result);
  const raw = JSON.stringify(truncated);
  const noBase64 = stripBase64(raw);
  // minifyJson auf dem Ergebnis von stripBase64 — könnte JSON kaputt machen,
  // deshalb nur wenn es noch gültiges JSON ist
  try {
    return JSON.stringify(JSON.parse(noBase64));
  } catch {
    return normalizeWhitespace(noBase64);
  }
}

/**
 * Optimiert einen bereits-String (z.B. aus executor.ts).
 */
export function optimizeToolResultString(text: string): string {
  const minified = minifyJson(text);
  const noBase64 = stripBase64(minified);
  if (minified.length < text.length) return noBase64;
  return normalizeWhitespace(noBase64);
}
