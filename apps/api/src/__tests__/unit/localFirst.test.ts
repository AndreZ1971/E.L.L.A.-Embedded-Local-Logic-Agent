/**
 * Lokal-Zuerst Integration Tests (v1.5.1)
 *
 * Verifiziert per gemocktem fetch, dass ELLA im Ollama-Modus (und Auto-Modus
 * mit erreichbarem Ollama) null Aufrufe an api.openai.com macht.
 * Im Auto-Modus bei fehlendem Ollama: genau ein Aufruf pro Service.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Module Mocks (hoisted) ──────────────────────────────────────────────────

vi.mock("fs/promises", () => ({
  readFile: vi.fn(),
  writeFile: vi.fn().mockResolvedValue(undefined),
  unlink: vi.fn().mockResolvedValue(undefined),
}));

let chessDbOverride: Record<string, unknown>[] | null = null;

vi.mock("../../config/database.js", () => {
  const execute = vi.fn().mockImplementation(async (sql: string) => {
    if (sql.includes("chess_games") && sql.trimStart().startsWith("SELECT")) {
      if (chessDbOverride) return [chessDbOverride, []];
      return [
        [
          {
            id: 1,
            fen: "8/8/8/8/8/5k2/8/3K4 w - - 0 1",
            moves: JSON.stringify(["e4", "e5", "d4", "exd4", "Qxd4"]),
            status: "checkmate",
            player_color: "white",
            winner: "player",
          },
        ],
        [],
      ];
    }
    return [{ insertId: 1, affectedRows: 1 }, []];
  });
  return { pool: { execute } };
});

vi.mock("../../services/eventBus.js", () => ({
  eventBus: { emit: vi.fn() },
  EVENT_SYSTEM: "system",
}));

vi.mock("../../services/memory.js", () => ({
  listMemories: vi.fn().mockResolvedValue([]),
  listMemoriesPaged: vi.fn().mockResolvedValue({ memories: [], total: 0 }),
  remember: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("../../services/proactive.js", () => ({
  sendProactiveMessage: vi.fn(),
}));

vi.mock("@xenova/transformers", () => ({
  pipeline: vi
    .fn()
    .mockResolvedValue(
      vi.fn().mockResolvedValue({ text: "Transkribierter Text" }),
    ),
  env: { cacheDir: "" },
}));

vi.mock("child_process", () => {
  const fn: any = vi.fn();
  fn[Symbol.for("nodejs.util.promisify.custom")] = async () => {
    const float32 = new Float32Array([0.1, 0.2, 0.1, -0.1]);
    return {
      stdout: Buffer.from(float32.buffer),
      stderr: Buffer.from(""),
    };
  };
  return { exec: fn, execSync: vi.fn() };
});

// ── Imports ──────────────────────────────────────────────────────────────────

import { saveSettings } from "../../services/settings.js";
import { analyzeImage } from "../../services/vision.js";
import { contextAlign, transcribe } from "../../services/whisper.js";
import { translateText, summarizeText } from "../../services/textProcessing.js";
import { correctText } from "../../services/textCorrection.js";
import { writeInUserStyle } from "../../services/styleProfile.js";
import { reflectOnGame, applyPlayerMove } from "../../services/chess.js";
import { openaiClient, CloudBlockedError } from "../../services/openai.js";
import { searchWeb } from "../../services/webSearch.js";
import * as fsMock from "fs/promises";

// ── Fetch-Tracking ──────────────────────────────────────────────────────────

let fetchCalls: {
  url: string;
  target: "openai" | "ollama" | "ddg" | "other";
}[] = [];

function openaiCalls(): number {
  return fetchCalls.filter((c) => c.target === "openai").length;
}

function ddgCalls(): number {
  return fetchCalls.filter((c) => c.target === "ddg").length;
}

const OLLAMA_CHAT_OK = () => ({
  ok: true,
  status: 200,
  json: async () => ({
    message: { content: "Lokal-Antwort", role: "assistant" },
  }),
  text: async () => "Lokal-Antwort",
});

const OLLAMA_GENERATE_OK = () => ({
  ok: true,
  status: 200,
  json: async () => ({ response: "Öffne den Explorer" }),
  text: async () => "Öffne den Explorer",
});

const OLLAMA_TAGS_OK = () => ({
  ok: true,
  status: 200,
  json: async () => ({ models: [{ name: "llava" }] }),
});

const OPENAI_CHAT_OK = () => ({
  ok: true,
  status: 200,
  json: async () => ({
    choices: [{ message: { content: "OpenAI-Antwort", role: "assistant" } }],
  }),
  text: async () =>
    JSON.stringify({
      choices: [{ message: { content: "OpenAI-Antwort" } }],
    }),
  body: null,
});

function installFetch(ollamaReachable: boolean) {
  fetchCalls = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL | Request) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : (input as Request).url;

      if (url.includes("api.openai.com")) {
        fetchCalls.push({ url, target: "openai" });
        return OPENAI_CHAT_OK();
      }

      if (url.includes("localhost:11434")) {
        fetchCalls.push({ url, target: "ollama" });
        if (!ollamaReachable) throw new Error("ECONNREFUSED");
        if (url.includes("/api/tags")) return OLLAMA_TAGS_OK();
        if (url.includes("/api/generate")) return OLLAMA_GENERATE_OK();
        return OLLAMA_CHAT_OK();
      }

      if (url.includes("duckduckgo.com")) {
        fetchCalls.push({ url, target: "ddg" });
        return {
          ok: true,
          text: async () =>
            `<div class="result"><a class="result__title">Test</a>` +
            `<a class="result__url" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com">example.com</a>` +
            `<span class="result__snippet">Ein Snippet</span></div>`,
        };
      }

      fetchCalls.push({ url, target: "other" });
      return { ok: true, json: async () => ({}), text: async () => "" };
    }),
  );
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("Lokal-Zuerst Pattern (v1.5.1)", () => {
  // ─── Szenario 1: provider 'ollama', Key gesetzt ──────────────────────────
  describe("provider: 'ollama' + openaiApiKey gesetzt → null Cloud-Aufrufe", () => {
    beforeEach(async () => {
      await saveSettings({ provider: "ollama", openaiApiKey: "sk-test-key" });
      installFetch(true);
    });

    it("analyzeImage: null Aufrufe an api.openai.com", async () => {
      await analyzeImage("dGVzdA==", "Beschreibe das Bild");
      expect(openaiCalls()).toBe(0);
    });

    it("contextAlign: null Aufrufe", async () => {
      await contextAlign("ella öffne den Explorer");
      expect(openaiCalls()).toBe(0);
    });

    it("transcribe: null Aufrufe (auch bei lokalem Fehler)", async () => {
      try {
        await transcribe(Buffer.from("fake-audio"));
      } catch {
        // transcribeLocal darf fehlschlagen — entscheidend ist: kein Cloud-Call
      }
      expect(openaiCalls()).toBe(0);
    });

    it("translateText: null Aufrufe", async () => {
      await translateText("Hallo Welt", "Englisch");
      expect(openaiCalls()).toBe(0);
    });

    it("summarizeText: null Aufrufe", async () => {
      await summarizeText("Ein langer Text über Technologie.", "kurz");
      expect(openaiCalls()).toBe(0);
    });

    it("correctText: null Aufrufe", async () => {
      await correctText("das ist ein test mit fehlern");
      expect(openaiCalls()).toBe(0);
    });

    it("writeInUserStyle: null Aufrufe", async () => {
      await writeInUserStyle("Schreibe eine E-Mail an Max", "");
      expect(openaiCalls()).toBe(0);
    });

    it("reflectOnGame (Schachzug): null Aufrufe", async () => {
      await reflectOnGame(1, null);
      expect(openaiCalls()).toBe(0);
    });

    it("openaiClient.chat wirft CloudBlockedError (Chat-Gate)", async () => {
      await expect(
        openaiClient.chat([{ role: "user", content: "Hallo" }], []),
      ).rejects.toThrow(CloudBlockedError);
      expect(openaiCalls()).toBe(0);
    });

    it("openaiClient.isAvailable() → false (search_web-Gate)", () => {
      expect(openaiClient.isAvailable()).toBe(false);
    });
  });

  // ─── Szenario 2: provider 'auto', Key gesetzt, Ollama erreichbar ────────
  describe("provider: 'auto' + Key + Ollama erreichbar → null Cloud-Aufrufe", () => {
    beforeEach(async () => {
      await saveSettings({ provider: "auto", openaiApiKey: "sk-test-key" });
      installFetch(true);
    });

    it("analyzeImage: null Aufrufe", async () => {
      await analyzeImage("dGVzdA==", "Beschreibe das Bild");
      expect(openaiCalls()).toBe(0);
    });

    it("contextAlign: null Aufrufe", async () => {
      await contextAlign("ella öffne den Explorer");
      expect(openaiCalls()).toBe(0);
    });

    it("transcribe: null Aufrufe (lokale Pipeline)", async () => {
      const result = await transcribe(Buffer.from("fake-audio"));
      expect(result).toBe("Transkribierter Text");
      expect(openaiCalls()).toBe(0);
    });

    it("translateText: null Aufrufe", async () => {
      await translateText("Hallo Welt", "Englisch");
      expect(openaiCalls()).toBe(0);
    });

    it("summarizeText: null Aufrufe", async () => {
      await summarizeText("Ein langer Text über Technologie.", "kurz");
      expect(openaiCalls()).toBe(0);
    });

    it("correctText: null Aufrufe", async () => {
      await correctText("das ist ein test mit fehlern");
      expect(openaiCalls()).toBe(0);
    });

    it("writeInUserStyle: null Aufrufe", async () => {
      await writeInUserStyle("Schreibe eine E-Mail an Max", "");
      expect(openaiCalls()).toBe(0);
    });

    it("reflectOnGame (Schachzug): null Aufrufe", async () => {
      await reflectOnGame(1, null);
      expect(openaiCalls()).toBe(0);
    });
  });

  // ─── Szenario 3: provider 'auto', Key gesetzt, Ollama fehlgeschlagen ────
  describe("provider: 'auto' + Key + Ollama Fehler → genau ein OpenAI-Aufruf", () => {
    beforeEach(async () => {
      await saveSettings({ provider: "auto", openaiApiKey: "sk-test-key" });
      installFetch(false);
    });

    it("analyzeImage: genau ein OpenAI-Aufruf", async () => {
      const result = await analyzeImage("dGVzdA==", "Beschreibe das Bild");
      expect(result).toBe("OpenAI-Antwort");
      expect(openaiCalls()).toBe(1);
    });

    it("contextAlign: genau ein OpenAI-Aufruf", async () => {
      await contextAlign("ella öffne den Explorer");
      expect(openaiCalls()).toBe(1);
    });

    it("transcribe: genau ein OpenAI-Aufruf", async () => {
      vi.mocked(fsMock.writeFile).mockRejectedValueOnce(
        new Error("forced local failure"),
      );
      await transcribe(Buffer.from("fake-audio"));
      expect(openaiCalls()).toBe(1);
    });

    it("translateText: genau ein OpenAI-Aufruf", async () => {
      await translateText("Hallo Welt", "Englisch");
      expect(openaiCalls()).toBe(1);
    });

    it("summarizeText: genau ein OpenAI-Aufruf", async () => {
      await summarizeText("Ein langer Text über Technologie.", "kurz");
      expect(openaiCalls()).toBe(1);
    });

    it("correctText: genau ein OpenAI-Aufruf", async () => {
      await correctText("das ist ein test mit fehlern");
      expect(openaiCalls()).toBe(1);
    });

    it("writeInUserStyle: genau ein OpenAI-Aufruf", async () => {
      await writeInUserStyle("Schreibe eine E-Mail an Max", "");
      expect(openaiCalls()).toBe(1);
    });

    it("reflectOnGame (Schachzug): genau ein OpenAI-Aufruf", async () => {
      await reflectOnGame(1, null);
      expect(openaiCalls()).toBe(1);
    });

    it("openaiClient.chat: genau ein OpenAI-Aufruf", async () => {
      const result = await openaiClient.chat(
        [{ role: "user", content: "Hallo ELLA" }],
        [],
      );
      expect(result.message.content).toBe("OpenAI-Antwort");
      expect(openaiCalls()).toBe(1);
    });
  });

  // ─── Szenario 4: Schach ellaThinks + generateChessComment ────────────────
  describe("Schach: ellaThinks + generateChessComment respektieren Provider", () => {
    const ACTIVE_GAME = [
      {
        id: 42,
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        moves: JSON.stringify([]),
        status: "active",
        player_color: "white",
        winner: null,
      },
    ];

    it("ollama-Modus: ellaThinks + Kommentar ohne Cloud-Aufrufe", async () => {
      await saveSettings({ provider: "ollama", openaiApiKey: "sk-test-key" });
      chessDbOverride = ACTIVE_GAME;
      installFetch(true);

      const result = await applyPlayerMove(42, "e4", null);
      expect(result.ok).toBe(true);
      expect(result.ellaMove).toBeDefined();

      await new Promise((r) => setTimeout(r, 50));
      expect(openaiCalls()).toBe(0);
      chessDbOverride = null;
    });

    it("auto-Modus + Ollama erreichbar: kein Cloud-Aufruf", async () => {
      await saveSettings({ provider: "auto", openaiApiKey: "sk-test-key" });
      chessDbOverride = ACTIVE_GAME;
      installFetch(true);

      const result = await applyPlayerMove(42, "e4", null);
      expect(result.ok).toBe(true);
      expect(result.ellaMove).toBeDefined();

      await new Promise((r) => setTimeout(r, 50));
      expect(openaiCalls()).toBe(0);
      chessDbOverride = null;
    });

    it("auto-Modus + Ollama-Fehler: Fallback-Aufrufe an OpenAI", async () => {
      await saveSettings({ provider: "auto", openaiApiKey: "sk-test-key" });
      chessDbOverride = ACTIVE_GAME;
      installFetch(false);

      const result = await applyPlayerMove(42, "e4", null);
      expect(result.ok).toBe(true);

      await new Promise((r) => setTimeout(r, 50));
      expect(openaiCalls()).toBeGreaterThanOrEqual(1);
      chessDbOverride = null;
    });
  });

  // ─── Szenario 5: searchWeb DuckDuckGo-Verifikation ──────────────────────
  describe("searchWeb: DuckDuckGo wird tatsächlich aufgerufen", () => {
    it("ollama-Modus: searchWeb nutzt DuckDuckGo, nicht OpenAI", async () => {
      await saveSettings({ provider: "ollama", openaiApiKey: "sk-test-key" });
      installFetch(true);

      const results = await searchWeb("test query", 3);
      expect(ddgCalls()).toBe(1);
      expect(openaiCalls()).toBe(0);
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].title).toBe("Test");
    });

    it("auto-Modus: searchWeb nutzt DuckDuckGo primär", async () => {
      await saveSettings({ provider: "auto", openaiApiKey: "sk-test-key" });
      installFetch(true);

      const results = await searchWeb("test query", 3);
      expect(ddgCalls()).toBe(1);
      expect(openaiCalls()).toBe(0);
      expect(results[0].snippet).toBe("Ein Snippet");
    });
  });
});
