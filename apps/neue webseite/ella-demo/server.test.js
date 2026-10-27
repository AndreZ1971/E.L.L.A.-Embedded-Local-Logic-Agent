// Phase I: Tests für die E.L.L.A. Demo
// Ausführen: node --test server.test.js

import { describe, it, beforeEach, after, mock } from "node:test";
import assert from "node:assert/strict";
import { app, sessions, ipTracker } from "./server.js";
import http from "http";

let server;
let baseUrl;

async function startServer() {
  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
}

async function stopServer() {
  return new Promise((resolve) => {
    if (server) server.close(resolve);
    else resolve();
  });
}

async function createSession() {
  const res = await fetch(`${baseUrl}/api/session`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.sessionId);
  return data;
}

// ── Setup ───────────────────────────────────────────────────────

await startServer();

after(async () => {
  await stopServer();
});

beforeEach(() => {
  sessions.clear();
  ipTracker.clear();
});

// ── Test 1: Zwei Sessions sehen separate Gespräche ─────────────

describe("Separate Sessions", () => {
  it("zwei Sessions vom gleichen Client haben getrennte Zähler", async () => {
    const s1 = await createSession();
    const s2 = await createSession();

    assert.notEqual(s1.sessionId, s2.sessionId);
    assert.equal(s1.remaining, 15);
    assert.equal(s2.remaining, 15);

    const sess1 = sessions.get(s1.sessionId);
    const sess2 = sessions.get(s2.sessionId);
    assert.ok(sess1);
    assert.ok(sess2);
    assert.equal(sess1.count, 0);
    assert.equal(sess2.count, 0);
  });
});

// ── Test 2: Session-Limit, IP-Limit, fehlerhafte Requests ──────

describe("Rate Limiting", () => {
  it("Session-Limit nach MAX_PER_SESSION Nachrichten", async () => {
    const { sessionId } = await createSession();
    const session = sessions.get(sessionId);
    session.count = 15;

    const res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Session-Id": sessionId,
      },
      body: JSON.stringify({ message: "test" }),
    });

    assert.equal(res.status, 429);
    const data = await res.json();
    assert.equal(data.type, "session_limit");
    assert.equal(session.count, 15, "Fehler verbraucht keine Nachricht");
  });

  it("ungültige Nachricht verbraucht kein Limit", async () => {
    const { sessionId } = await createSession();
    const session = sessions.get(sessionId);

    const res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Session-Id": sessionId,
      },
      body: JSON.stringify({ message: "" }),
    });

    assert.equal(res.status, 400);
    assert.equal(session.count, 0);
  });

  it("zu lange Nachricht wird abgelehnt", async () => {
    const { sessionId } = await createSession();
    const longMsg = "a".repeat(501);

    const res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Session-Id": sessionId,
      },
      body: JSON.stringify({ message: longMsg }),
    });

    assert.equal(res.status, 400);
  });

  it("concurrent-lock verhindert parallele Anfragen", async () => {
    const { sessionId } = await createSession();
    const session = sessions.get(sessionId);
    session.busy = true;

    const res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Session-Id": sessionId,
      },
      body: JSON.stringify({ message: "test" }),
    });

    assert.equal(res.status, 429);
    assert.equal(session.count, 0);
  });
});

// ── Test 3: Abgelaufene Session → 401 + renew ─────────────────

describe("Session Expiry", () => {
  it("unbekannte Session-ID gibt 401 mit renew", async () => {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Session-Id": "non-existent-uuid",
      },
      body: JSON.stringify({ message: "test" }),
    });

    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.renew, true);
  });

  it("fehlende Session-ID gibt 401", async () => {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "test" }),
    });

    assert.equal(res.status, 401);
  });

  it("status-Endpoint mit abgelaufener Session gibt 401", async () => {
    const res = await fetch(`${baseUrl}/api/status`, {
      headers: { "X-Session-Id": "expired-session" },
    });

    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.renew, true);
  });
});

// ── Test 4: Cleanup entfernt alte Sessions ─────────────────────

describe("Session Cleanup", () => {
  it("alte Sessions werden beim Aufräumen entfernt", () => {
    const oldId = "old-session";
    const newId = "new-session";

    sessions.set(oldId, {
      count: 5,
      history: [],
      lastSeen: Date.now() - 31 * 60_000,
      ip: "127.0.0.1",
      busy: false,
    });
    sessions.set(newId, {
      count: 0,
      history: [],
      lastSeen: Date.now(),
      ip: "127.0.0.1",
      busy: false,
    });

    // Simulate cleanup (same logic as setInterval in server.js)
    const cutoff = Date.now() - 30 * 60_000;
    for (const [id, s] of sessions) {
      if (s.lastSeen < cutoff) sessions.delete(id);
    }

    assert.equal(sessions.has(oldId), false);
    assert.equal(sessions.has(newId), true);
  });
});

// ── Test 5: Max Sessions (503) ─────────────────────────────────

describe("Max Sessions", () => {
  it("503 wenn 2000 Sessions erreicht", async () => {
    for (let i = 0; i < 2000; i++) {
      sessions.set(`s-${i}`, {
        count: 0,
        history: [],
        lastSeen: Date.now(),
        ip: "other",
        busy: false,
      });
    }

    const res = await fetch(`${baseUrl}/api/session`);
    assert.equal(res.status, 503);
  });
});

// ── Test 6: Logs enthalten keinen Nachrichtentext ──────────────

describe("Privacy - Logging", () => {
  it("server.js enthält kein console.log mit message/content-Inhalt", async () => {
    const { readFileSync } = await import("fs");
    const { fileURLToPath } = await import("url");
    const { dirname, join } = await import("path");
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    const source = readFileSync(join(__dirname, "server.js"), "utf-8");
    const logLines = source.split("\n").filter((l) => l.includes("console."));

    for (const line of logLines) {
      assert.ok(
        !line.includes("message") || line.includes("// "),
        `Log-Zeile enthält möglicherweise Nachrichteninhalt: ${line.trim()}`,
      );
      assert.ok(
        !line.includes("content") || line.includes("// "),
        `Log-Zeile enthält möglicherweise Inhalt: ${line.trim()}`,
      );
      assert.ok(
        !line.includes("fullResponse"),
        `Log-Zeile enthält möglicherweise Antwort: ${line.trim()}`,
      );
    }
  });

  it("store: false wird an OpenAI gesendet", async () => {
    const { readFileSync } = await import("fs");
    const { fileURLToPath } = await import("url");
    const { dirname, join } = await import("path");
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    const source = readFileSync(join(__dirname, "server.js"), "utf-8");
    assert.ok(
      source.includes("store: false"),
      "store: false muss in der OpenAI-Anfrage stehen",
    );
  });
});

// ── Test 7: Prompt enthält keine Wettbewerber und kein "ChatGPT" ─

describe("Prompt Integrity", () => {
  it("Prompt enthält keine Wettbewerber-Namen", async () => {
    const { SYSTEM_PROMPT } = await import("./prompt.js");
    const competitors = [
      "Alexa",
      "Siri",
      "Cortana",
      "Google Assistant",
      "Jarvis",
      "packstart",
      "James",
    ];
    for (const name of competitors) {
      assert.ok(
        !SYSTEM_PROMPT.toLowerCase().includes(name.toLowerCase()),
        `Prompt enthält Wettbewerber "${name}"`,
      );
    }
  });

  it('Prompt verwendet "ChatGPT" nur als Verbotsregel', async () => {
    const { SYSTEM_PROMPT } = await import("./prompt.js");
    const lines = SYSTEM_PROMPT.split("\n").filter((l) =>
      l.includes("ChatGPT"),
    );
    for (const line of lines) {
      assert.ok(
        line.includes("nie") ||
          line.includes("nicht") ||
          line.includes("never"),
        `"ChatGPT" in Prompt-Zeile ohne Verbot: ${line.trim()}`,
      );
    }
    assert.ok(lines.length <= 1, "ChatGPT sollte maximal einmal vorkommen");
  });

  it("Prompt enthält ehrliche TTS-Info (Edge TTS für Deutsch)", async () => {
    const { SYSTEM_PROMPT } = await import("./prompt.js");
    assert.ok(
      SYSTEM_PROMPT.includes("Edge TTS"),
      "Prompt muss Edge TTS für deutsche Sprache erwähnen",
    );
  });

  it("Prompt enthält Hinweis dass dies die OpenAI-API ist", async () => {
    const { SYSTEM_PROMPT } = await import("./prompt.js");
    assert.ok(
      SYSTEM_PROMPT.includes("OpenAI-API"),
      "Prompt muss klarstellen dass dies die OpenAI-API ist",
    );
    assert.ok(
      SYSTEM_PROMPT.includes("NICHT die echte E.L.L.A."),
      "Prompt muss sagen dass dies nicht die echte ELLA ist",
    );
  });
});

// ── Test 8: Session-Erstellung mit IP-Stunden-Limit ────────────

describe("IP Hour Limit", () => {
  it("max 10 neue Sessions pro IP pro Stunde", async () => {
    // Erstelle 10 Sessions (+ die IP-Counter manuell setzen)
    const { sessionId } = await createSession();
    const session = sessions.get(sessionId);
    const ip = session.ip;

    const ipData = ipTracker.get(ip);
    ipData.hourCount = 10;

    const res = await fetch(`${baseUrl}/api/session`);
    assert.equal(res.status, 429);
  });
});

// ── Test 9: Status-Endpoint ────────────────────────────────────

describe("Status Endpoint", () => {
  it("gibt remaining und limit zurück", async () => {
    const { sessionId } = await createSession();
    const session = sessions.get(sessionId);
    session.count = 3;

    const res = await fetch(`${baseUrl}/api/status`, {
      headers: { "X-Session-Id": sessionId },
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.remaining, 12);
    assert.equal(data.limit, 15);
    assert.equal(data.paused, false);
  });
});
