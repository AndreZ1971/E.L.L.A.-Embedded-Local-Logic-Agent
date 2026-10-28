import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

let mockSettings = {
  offlineMode: false,
  spokenLanguage: "de",
};

let mockKokoroReady = false;

vi.mock("../../services/settings.js", () => ({
  getSettings: () => mockSettings,
}));

vi.mock("../../services/kokoro.js", () => ({
  isKokoroReady: () => mockKokoroReady,
  synthesizeKokoro: vi.fn().mockResolvedValue({
    buffer: Buffer.from("kokoro-audio"),
    contentType: "audio/wav",
  }),
}));

vi.mock("@andresaya/edge-tts", () => ({
  EdgeTTS: vi.fn().mockImplementation(() => ({
    generate: vi.fn().mockResolvedValue({
      audio: new Uint8Array([1, 2, 3]),
    }),
  })),
}));

describe("TTS Offline-Modus", () => {
  beforeEach(() => {
    mockSettings = { offlineMode: false, spokenLanguage: "de" };
    mockKokoroReady = false;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("gibt null zurück wenn offlineMode aktiv und Kokoro nicht verfügbar (DE)", async () => {
    mockSettings.offlineMode = true;
    mockKokoroReady = false;
    const { synthesize } = await import("../../services/tts.js");
    const result = await synthesize("Hallo Welt", { lang: "de" });
    expect(result).toBeNull();
  });

  it("nutzt Edge TTS wenn offlineMode inaktiv und Kokoro nicht verfügbar", async () => {
    mockSettings.offlineMode = false;
    mockKokoroReady = false;
    const { synthesize } = await import("../../services/tts.js");
    const result = await synthesize("Hello", { lang: "de" });
    expect(result).not.toBeNull();
    expect(result!.contentType).toBe("audio/mpeg");
  });

  it("nutzt Kokoro wenn verfügbar, auch im Offline-Modus (EN)", async () => {
    mockSettings.offlineMode = true;
    mockKokoroReady = true;
    const { synthesize } = await import("../../services/tts.js");
    const result = await synthesize("Hello world", { lang: "en" });
    expect(result).not.toBeNull();
    expect(result!.contentType).toBe("audio/wav");
  });

  it("gibt null zurück wenn Kokoro-Fallback fehlschlägt im Offline-Modus", async () => {
    mockSettings.offlineMode = true;
    mockKokoroReady = true;
    const kokoro = await import("../../services/kokoro.js");
    vi.mocked(kokoro.synthesizeKokoro).mockRejectedValueOnce(
      new Error("Kokoro error"),
    );
    const { synthesize } = await import("../../services/tts.js");
    const result = await synthesize("Test", { lang: "en" });
    expect(result).toBeNull();
  });

  it("activeTtsEngine zeigt 'off' im Offline-Modus ohne Kokoro", async () => {
    mockSettings.offlineMode = true;
    mockKokoroReady = false;
    const { activeTtsEngine } = await import("../../services/tts.js");
    expect(activeTtsEngine("de")).toBe("off");
  });

  it("activeTtsEngine zeigt 'Kokoro' wenn bereit, unabhängig vom Offline-Modus", async () => {
    mockSettings.offlineMode = true;
    mockKokoroReady = true;
    const { activeTtsEngine } = await import("../../services/tts.js");
    expect(activeTtsEngine("en")).toBe("Kokoro");
  });
});
