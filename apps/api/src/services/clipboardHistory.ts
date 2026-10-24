import { redact } from "./redact.js";

const MAX_HISTORY = 20;
const history: Array<{ content: string; timestamp: string }> = [];

export function recordClipboard(content: string): void {
  if (history[0]?.content === content) return;
  const sanitized = redact(content);
  history.unshift({
    content: sanitized.slice(0, 5000),
    timestamp: new Date().toISOString(),
  });
  if (history.length > MAX_HISTORY) history.pop();
}

export function getClipboardHistory(): Array<{
  content: string;
  timestamp: string;
}> {
  return [...history];
}

export function getLastClipboard(): string | null {
  return history[0]?.content ?? null;
}

export interface ClipboardPattern {
  type: "iban" | "tracking" | "phone" | "url" | "email";
  suggestion: string;
}

const PATTERNS: Array<{
  type: ClipboardPattern["type"];
  re: RegExp;
  suggestion: string;
}> = [
  {
    type: "iban",
    re: /\bDE\d{20}\b/,
    suggestion:
      "IBAN erkannt — soll ich sie in ein Dokument einfügen oder eine Überweisung vorbereiten?",
  },
  {
    type: "tracking",
    re: /\b(1Z[A-Z0-9]{16}|JD\d{18}|\d{12,20})\b/,
    suggestion:
      "Paketnummer erkannt — soll ich den Versandstatus nachschlagen?",
  },
  {
    type: "phone",
    re: /(\+49|0049|0)[1-9]\d{6,14}/,
    suggestion:
      "Telefonnummer erkannt — soll ich einen Termin oder eine Notiz dazu anlegen?",
  },
  {
    type: "url",
    re: /https?:\/\/[^\s]{15,}/,
    suggestion:
      "URL erkannt — soll ich die Seite für dich öffnen oder zusammenfassen?",
  },
  {
    type: "email",
    re: /[a-zA-Z0-9._%+-]{2,}@[a-zA-Z0-9.-]{2,}\.[a-zA-Z]{2,}/,
    suggestion:
      "E-Mail-Adresse erkannt — soll ich eine neue E-Mail an diese Adresse vorbereiten?",
  },
];

export function detectPattern(text: string): ClipboardPattern | null {
  const sample = text.slice(0, 1000);
  for (const p of PATTERNS) {
    if (p.re.test(sample)) {
      return { type: p.type, suggestion: p.suggestion };
    }
  }
  return null;
}
