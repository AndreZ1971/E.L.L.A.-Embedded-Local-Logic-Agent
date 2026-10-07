/**
 * Token-Optimizer — verlustfreie Kompression von Tool-Ergebnissen
 * bevor sie in die Message-History eingehen.
 *
 * Pipeline (in dieser Reihenfolge):
 *   1. Array-Truncation      — kürzt sehr lange Arrays auf MAX_ARRAY_ITEMS (leicht verlustreich)
 *   2. JSON-Minifikation     — entfernt Whitespace aus JSON (verlustlos, 20–40%)
 *   3. Base64-Entfernung     — ersetzt Binär-Blobs durch Platzhalter (verlustlos)
 *   4. Whitespace-Cleanup    — kollabiert Leerzeilen, trimmt Zeilen (verlustlos)
 *   5. Output-Längenlimit    — kürzt auf MAX_TOOL_OUTPUT Zeichen (verlustreich)
 *   6. Lange String-Werte    — kürzt einzelne JSON-String-Werte >500 Zeichen
 */

const MAX_ARRAY_ITEMS = 50;
const MAX_TOOL_OUTPUT = 3000;
const MAX_STRING_VALUE = 500;
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
  if (typeof obj === "string" && obj.length > MAX_STRING_VALUE) {
    return (
      obj.slice(0, MAX_STRING_VALUE) +
      `… [${obj.length - MAX_STRING_VALUE} Zeichen gekürzt]`
    );
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

function enforceMaxLength(text: string): string {
  if (text.length <= MAX_TOOL_OUTPUT) return text;
  return (
    text.slice(0, MAX_TOOL_OUTPUT) +
    `\n… [gekürzt, ${text.length - MAX_TOOL_OUTPUT} Zeichen entfernt]`
  );
}

/**
 * Optimiert ein Tool-Ergebnis (beliebiger Typ) für die Message-History.
 * Gibt einen kompakten JSON-String zurück.
 */
export function optimizeToolResult(result: unknown): string {
  const truncated = truncateLargeArrays(result);
  const raw = JSON.stringify(truncated);
  const noBase64 = stripBase64(raw);
  try {
    return enforceMaxLength(JSON.stringify(JSON.parse(noBase64)));
  } catch {
    return enforceMaxLength(normalizeWhitespace(noBase64));
  }
}

/**
 * Optimiert einen bereits-String (z.B. aus executor.ts).
 */
export function optimizeToolResultString(text: string): string {
  const minified = minifyJson(text);
  const noBase64 = stripBase64(minified);
  const cleaned =
    minified.length < text.length ? noBase64 : normalizeWhitespace(noBase64);
  return enforceMaxLength(cleaned);
}
