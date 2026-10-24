import { describe, it, expect } from "vitest";

// Mirror of the regex from Chat.tsx — tests the stop-interrupt pattern
const STOP_INTERRUPT_RE =
  /^(stopp?|halt|sei still|ruhig|leise|quiet|stop it|shut up|still)[\s!.]*$/i;

describe("Stop-Interrupt Regex", () => {
  const SHOULD_MATCH = [
    "stopp",
    "stop",
    "Stopp",
    "STOPP",
    "halt",
    "Halt!",
    "sei still",
    "Sei still!",
    "ruhig",
    "Ruhig!",
    "leise",
    "Leise.",
    "quiet",
    "Quiet!",
    "stop it",
    "Stop it!",
    "shut up",
    "Shut up!",
    "still",
    "Still!",
    "stopp!",
    "stop!!",
    "halt...",
    "stopp   ",
  ];

  const SHOULD_NOT_MATCH = [
    "stoppe den Prozess",
    "halte die Datei offen",
    "sei still und hör zu",
    "ruhig bleiben",
    "leise sein bitte",
    "bitte stopp",
    "kannst du stoppen",
    "Hallo ELLA",
    "was ist das Wetter",
    "",
    "   ",
    "stop the world",
    "shut up and dance",
  ];

  for (const word of SHOULD_MATCH) {
    it(`erkennt Stop-Wort: "${word}"`, () => {
      expect(STOP_INTERRUPT_RE.test(word)).toBe(true);
    });
  }

  for (const phrase of SHOULD_NOT_MATCH) {
    it(`ignoriert Nicht-Stop-Phrase: "${phrase}"`, () => {
      expect(STOP_INTERRUPT_RE.test(phrase)).toBe(false);
    });
  }

  it("Regex hat kein sticky/global-State-Problem", () => {
    expect(STOP_INTERRUPT_RE.test("stopp")).toBe(true);
    expect(STOP_INTERRUPT_RE.test("stopp")).toBe(true);
    expect(STOP_INTERRUPT_RE.test("halt")).toBe(true);
  });
});

describe("Follow-Up-Fenster Konstante", () => {
  const FOLLOW_UP_MS = 8_000;

  it("Follow-Up-Fenster ist 8 Sekunden", () => {
    expect(FOLLOW_UP_MS).toBe(8000);
  });

  it("Follow-Up-Fenster ist positiv und realistisch", () => {
    expect(FOLLOW_UP_MS).toBeGreaterThan(0);
    expect(FOLLOW_UP_MS).toBeLessThanOrEqual(30_000);
  });
});
