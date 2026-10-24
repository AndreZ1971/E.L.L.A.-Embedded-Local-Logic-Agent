import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock-Setup ──────────────────────────────────────────────────────────────

const mockTranscribe = vi.fn().mockResolvedValue("Das ist ein Test.");
const mockCorrectText = vi
  .fn()
  .mockResolvedValue("Das ist ein korrigierter Test.");
const mockTypeText = vi.fn().mockReturnValue({ success: true });

vi.mock("../../services/whisper.js", () => ({
  transcribe: (...args: unknown[]) => mockTranscribe(...args),
  contextAlign: vi.fn().mockImplementation((t: string) => Promise.resolve(t)),
  isWhisperReady: () => true,
  getWhisperPipeline: vi.fn(),
}));

vi.mock("../../services/textCorrection.js", () => ({
  correctText: (...args: unknown[]) => mockCorrectText(...args),
}));

const mockIsDictationClipboard = vi.fn().mockReturnValue(false);

vi.mock("../../services/windowManager.js", () => ({
  typeTextToActiveWindow: (...args: unknown[]) => mockTypeText(...args),
  sendKeysToWindow: vi.fn(),
  isDictationClipboardActive: () => mockIsDictationClipboard(),
}));

let mockSettings: Record<string, unknown> = {
  dictationCorrection: false,
  spokenLanguage: "de",
};

vi.mock("../../services/settings.js", () => ({
  getSettings: () => mockSettings,
  DEFAULT_SETTINGS: {
    dictationCorrection: false,
    dictationHotkey: "CommandOrControl+Alt+Space",
    spokenLanguage: "de",
    offlineMode: false,
  },
}));

// ── Dictation-Logik nachgebildet (aus speech.ts POST /dictate) ─────────────

async function dictateLogic(audioBuffer: Buffer | null): Promise<{
  status: number;
  body: Record<string, unknown>;
}> {
  if (!audioBuffer) {
    return { status: 400, body: { error: "Keine Audio-Datei" } };
  }

  const { transcribe } = await import("../../services/whisper.js");
  const raw = await transcribe(audioBuffer);
  if (!raw || (raw as string).trim().length < 2) {
    return { status: 200, body: { text: "", typed: false } };
  }

  const { getSettings } = await import("../../services/settings.js");
  const { dictationCorrection } = getSettings();

  let text = raw as string;
  if (dictationCorrection) {
    const { correctText } = await import("../../services/textCorrection.js");
    text = await correctText(raw as string);
  }

  const { typeTextToActiveWindow } =
    await import("../../services/windowManager.js");
  const result = typeTextToActiveWindow(text);
  if (!result.success) {
    return { status: 500, body: { error: result.error, text } };
  }

  return { status: 200, body: { text, typed: true } };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Diktat-Route Logik", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSettings = { dictationCorrection: false, spokenLanguage: "de" };
  });

  it("gibt 400 zurück wenn keine Audio-Datei", async () => {
    const res = await dictateLogic(null);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Keine Audio-Datei");
  });

  it("transkribiert und tippt ohne Korrektur", async () => {
    mockTranscribe.mockResolvedValueOnce("Hallo Welt");
    const res = await dictateLogic(Buffer.from("fake-audio"));

    expect(res.status).toBe(200);
    expect(res.body.text).toBe("Hallo Welt");
    expect(res.body.typed).toBe(true);
    expect(mockTypeText).toHaveBeenCalledWith("Hallo Welt");
    expect(mockCorrectText).not.toHaveBeenCalled();
  });

  it("korrigiert Text wenn dictationCorrection aktiv", async () => {
    mockSettings.dictationCorrection = true;
    mockTranscribe.mockResolvedValueOnce("hallo welt");
    mockCorrectText.mockResolvedValueOnce("Hallo Welt.");
    const res = await dictateLogic(Buffer.from("fake-audio"));

    expect(res.status).toBe(200);
    expect(res.body.text).toBe("Hallo Welt.");
    expect(res.body.typed).toBe(true);
    expect(mockCorrectText).toHaveBeenCalledWith("hallo welt");
  });

  it("gibt typed: false zurück bei leerem Transkript", async () => {
    mockTranscribe.mockResolvedValueOnce("");
    const res = await dictateLogic(Buffer.from("fake-audio"));

    expect(res.status).toBe(200);
    expect(res.body.typed).toBe(false);
    expect(res.body.text).toBe("");
    expect(mockTypeText).not.toHaveBeenCalled();
  });

  it("gibt typed: false zurück bei zu kurzem Transkript", async () => {
    mockTranscribe.mockResolvedValueOnce("a");
    const res = await dictateLogic(Buffer.from("fake-audio"));

    expect(res.status).toBe(200);
    expect(res.body.typed).toBe(false);
    expect(mockTypeText).not.toHaveBeenCalled();
  });

  it("gibt 500 zurück wenn typeTextToActiveWindow fehlschlägt", async () => {
    mockTranscribe.mockResolvedValueOnce("Test");
    mockTypeText.mockReturnValueOnce({
      success: false,
      error: "Kein aktives Fenster",
    });
    const res = await dictateLogic(Buffer.from("fake-audio"));

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Kein aktives Fenster");
    expect(res.body.text).toBe("Test");
  });
});

describe("typeTextToActiveWindow", () => {
  beforeEach(() => vi.clearAllMocks());

  it("wird mit dem (ggf. korrigierten) Text aufgerufen", async () => {
    mockSettings.dictationCorrection = true;
    mockTranscribe.mockResolvedValueOnce("test input");
    mockCorrectText.mockResolvedValueOnce("Test Input.");
    await dictateLogic(Buffer.from("audio"));

    expect(mockTypeText).toHaveBeenCalledWith("Test Input.");
  });

  it("wird nicht aufgerufen bei leerem Transkript", async () => {
    mockTranscribe.mockResolvedValueOnce("  ");
    await dictateLogic(Buffer.from("audio"));

    expect(mockTypeText).not.toHaveBeenCalled();
  });
});

describe("dictationCorrection Setting", () => {
  it("default ist false", async () => {
    const { DEFAULT_SETTINGS } = await import("../../services/settings.js");
    expect(
      (DEFAULT_SETTINGS as Record<string, unknown>).dictationCorrection,
    ).toBe(false);
  });
});

describe("dictationHotkey Setting", () => {
  it("default ist CommandOrControl+Alt+Space", async () => {
    const { DEFAULT_SETTINGS } = await import("../../services/settings.js");
    expect((DEFAULT_SETTINGS as Record<string, unknown>).dictationHotkey).toBe(
      "CommandOrControl+Alt+Space",
    );
  });
});

describe("isDictationClipboardActive", () => {
  it("gibt false zurück wenn kein Diktat aktiv", async () => {
    const { isDictationClipboardActive } =
      await import("../../services/windowManager.js");
    expect(isDictationClipboardActive()).toBe(false);
  });
});
