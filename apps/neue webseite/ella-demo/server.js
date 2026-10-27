import express from "express";
import helmet from "helmet";
import { createServer } from "http";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { randomUUID } from "crypto";
import { execFile } from "child_process";
import { readFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { SYSTEM_PROMPT } from "./prompt.js";
import { CANNED_RESPONSES } from "./canned.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── Phase A: Eigene .env ────────────────────────────────────────
function loadEnv() {
  try {
    const lines = readFileSync(join(__dirname, ".env"), "utf-8").split("\n");
    for (const line of lines) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  } catch {}
}
loadEnv();

const API_KEY = process.env.DEMO_OPENAI_API_KEY || "";
const isMainModule =
  process.argv[1] &&
  fileURLToPath(import.meta.url).replace(/\\/g, "/") ===
    process.argv[1].replace(/\\/g, "/");

if (!API_KEY && isMainModule) {
  console.error(
    "\n  DEMO_OPENAI_API_KEY fehlt in ella-demo/.env\n" +
      "  Trage den Key dort ein und starte neu.\n" +
      "  (Der Key wird nie geloggt oder ausgegeben.)\n",
  );
  process.exit(1);
}

const PORT = Number(process.env.PORT) || 3333;
const TRUST_PROXY = Number(process.env.TRUST_PROXY) || 0;
const MAX_PER_SESSION = Number(process.env.MAX_PER_SESSION) || 15;
const MAX_PER_IP_DAY = Number(process.env.MAX_PER_IP_DAY) || 40;
const MAX_GLOBAL_DAY = Number(process.env.MAX_GLOBAL_DAY) || 1500;
const SESSION_TTL_MIN = Number(process.env.SESSION_TTL_MIN) || 30;
const MAX_SESSIONS = 2000;
const MAX_NEW_SESSIONS_PER_IP_HOUR = 10;

// ── Phase B: Sitzungen pro Browser ──────────────────────────────
const sessions = new Map();
let globalDayCount = 0;
let currentDay = todayBerlin();

// IP-Tracker: { dayCount, hourBucket, hourCount }
const ipTracker = new Map();

function todayBerlin() {
  return new Date().toLocaleDateString("de-DE", { timeZone: "Europe/Berlin" });
}

function currentHourBerlin() {
  return new Date().toLocaleString("de-DE", {
    timeZone: "Europe/Berlin",
    hour: "2-digit",
    hour12: false,
  });
}

function resetDayIfNeeded() {
  const day = todayBerlin();
  if (day !== currentDay) {
    currentDay = day;
    globalDayCount = 0;
    ipTracker.clear();
  }
}

function getIpData(ip) {
  resetDayIfNeeded();
  let data = ipTracker.get(ip);
  if (!data) {
    data = { dayCount: 0, hourBucket: currentHourBerlin(), hourCount: 0 };
    ipTracker.set(ip, data);
  }
  const hour = currentHourBerlin();
  if (data.hourBucket !== hour) {
    data.hourBucket = hour;
    data.hourCount = 0;
  }
  return data;
}

// Aufräumen alle 5 Minuten
setInterval(() => {
  const cutoff = Date.now() - SESSION_TTL_MIN * 60_000;
  for (const [id, s] of sessions) {
    if (s.lastSeen < cutoff) sessions.delete(id);
  }
}, 5 * 60_000).unref();

// ── Express ─────────────────────────────────────────────────────
const app = express();
app.set("trust proxy", TRUST_PROXY);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "js.stripe.com"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:"],
        mediaSrc: ["'self'", "blob:"],
        frameSrc: ["js.stripe.com", "*.stripe.com"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  }),
);
app.use(express.json({ limit: "4kb" }));
app.use(express.static(join(__dirname, "public")));

function clientIp(req) {
  return req.ip || req.socket.remoteAddress || "unknown";
}

// Middleware: Session validieren
function requireSession(req, res, next) {
  const id = req.headers["x-session-id"];
  if (!id || !sessions.has(id)) {
    return res.status(401).json({ error: "Sitzung abgelaufen", renew: true });
  }
  const session = sessions.get(id);
  session.lastSeen = Date.now();
  req.demoSession = session;
  req.sessionId = id;
  next();
}

// ── GET /api/session — neue Sitzung erstellen ───────────────────
app.get("/api/session", (req, res) => {
  resetDayIfNeeded();
  const ip = clientIp(req);
  const ipData = getIpData(ip);

  if (sessions.size >= MAX_SESSIONS) {
    return res
      .status(503)
      .json({ error: "Gerade sehr viel los – bitte gleich nochmal." });
  }

  if (ipData.hourCount >= MAX_NEW_SESSIONS_PER_IP_HOUR) {
    return res
      .status(429)
      .json({ error: "Zu viele Sitzungen – bitte warte einen Moment." });
  }

  const id = randomUUID();
  sessions.set(id, {
    count: 0,
    history: [],
    lastSeen: Date.now(),
    ip,
    busy: false,
  });
  ipData.hourCount++;

  res.json({
    sessionId: id,
    remaining: MAX_PER_SESSION,
    limit: MAX_PER_SESSION,
  });
});

// ── GET /api/status ─────────────────────────────────────────────
app.get("/api/status", requireSession, (req, res) => {
  resetDayIfNeeded();
  const s = req.demoSession;
  const paused = globalDayCount >= MAX_GLOBAL_DAY;
  res.json({
    remaining: Math.max(0, MAX_PER_SESSION - s.count),
    limit: MAX_PER_SESSION,
    paused,
  });
});

// ── POST /api/chat — Hauptendpoint ──────────────────────────────
app.post("/api/chat", requireSession, async (req, res) => {
  resetDayIfNeeded();
  const session = req.demoSession;
  const ip = clientIp(req);
  const ipData = getIpData(ip);

  // Concurrent-Sperre
  if (session.busy) {
    return res
      .status(429)
      .json({ error: "Bitte warte, bis die aktuelle Antwort fertig ist." });
  }

  // Session-Limit
  if (session.count >= MAX_PER_SESSION) {
    return res.status(429).json({
      error: `Du hast ${MAX_PER_SESSION} Nachrichten erreicht. Lade E.L.L.A. herunter für das volle Erlebnis!`,
      type: "session_limit",
    });
  }

  // IP-Tageslimit
  if (ipData.dayCount >= MAX_PER_IP_DAY) {
    return res.status(429).json({
      error:
        "Tageslimit erreicht – morgen geht es weiter, oder lade E.L.L.A. herunter!",
      type: "ip_limit",
    });
  }

  // Globales Tageslimit
  if (globalDayCount >= MAX_GLOBAL_DAY) {
    return res.status(429).json({
      error:
        "Die Demo macht für heute Pause – lade E.L.L.A. herunter und frag sie lokal.",
      type: "global_limit",
    });
  }

  const { message } = req.body;
  if (!message || typeof message !== "string" || message.length > 500) {
    return res.status(400).json({ error: "Ungültige Nachricht" });
  }

  session.busy = true;
  session.history.push({ role: "user", content: message });
  if (session.history.length > 20) {
    session.history = session.history.slice(-10);
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // AbortController für Client-Disconnect (res, nicht req — req.close feuert nach Body-Consume)
  const abort = new AbortController();
  res.on("close", () => {
    if (!res.writableEnded) abort.abort();
  });

  const startTime = Date.now();
  let success = false;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...session.history.slice(-10),
        ],
        stream: true,
        max_tokens: 300,
        temperature: 0.7,
        store: false,
      }),
      signal: abort.signal,
    });

    if (!response.ok) {
      // Phase D: nur Statuscode loggen, nicht den Body
      console.error(
        `[${new Date().toISOString()}] OpenAI ${response.status} (${Date.now() - startTime}ms)`,
      );
      session.history.pop();
      res.write(
        `data: ${JSON.stringify({ error: "LLM nicht erreichbar" })}\n\n`,
      );
      res.write("data: [DONE]\n\n");
      return res.end();
    }

    let fullResponse = "";
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let sseBuffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      sseBuffer += decoder.decode(value, { stream: true });
      const parts = sseBuffer.split("\n");
      sseBuffer = parts.pop();

      for (const line of parts) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6);
        if (data === "[DONE]") {
          session.history.push({ role: "assistant", content: fullResponse });
          success = true;
          res.write("data: [DONE]\n\n");
          continue;
        }
        try {
          const parsed = JSON.parse(data);
          const token = parsed.choices?.[0]?.delta?.content || "";
          if (token) {
            fullResponse += token;
            res.write(`data: ${JSON.stringify({ token })}\n\n`);
          }
        } catch {}
      }
    }

    // Nur bei Erfolg zählen (Phase C)
    if (success) {
      session.count++;
      ipData.dayCount++;
      globalDayCount++;
      const remaining = MAX_PER_SESSION - session.count;
      res.write(
        `data: ${JSON.stringify({ meta: { remaining, limit: MAX_PER_SESSION } })}\n\n`,
      );
    } else {
      session.history.pop();
    }

    // Phase D: nur Metadaten loggen
    const tokens = fullResponse.length;
    console.log(
      `[${new Date().toISOString()}] chat 200 ${Date.now() - startTime}ms ~${tokens}chars`,
    );

    res.end();
  } catch (err) {
    if (err.name === "AbortError") {
      console.log(
        `[${new Date().toISOString()}] chat aborted ${Date.now() - startTime}ms`,
      );
    } else {
      console.error(
        `[${new Date().toISOString()}] chat error ${Date.now() - startTime}ms`,
      );
      res.write(`data: ${JSON.stringify({ error: "Verbindungsfehler" })}\n\n`);
      res.write("data: [DONE]\n\n");
    }
    session.history.pop();
    res.end();
  } finally {
    session.busy = false;
  }
});

// ── GET /api/canned/:key — Feste Antworten für Vorschlagsfragen ──
app.get("/api/canned/:key", requireSession, (req, res) => {
  const entry = CANNED_RESPONSES[req.params.key];
  if (!entry) return res.status(404).json({ error: "Unbekannte Frage" });
  const lang = req.query.lang === "en" ? "en" : "de";
  const localized = entry[lang] || entry.de;
  res.json({ text: localized.text });
});

// ── POST /api/tts — Edge TTS Sprachsynthese (Python CLI) ──────
const EDGE_TTS_BIN = join(__dirname, "tts-venv", "bin", "edge-tts");

function synthesize(text, voice) {
  return new Promise((resolve, reject) => {
    const outFile = join(tmpdir(), `ella-tts-${randomUUID()}.mp3`);
    execFile(
      EDGE_TTS_BIN,
      ["--voice", voice, "--text", text, "--write-media", outFile],
      { timeout: 15_000 },
      async (err) => {
        if (err) return reject(err);
        try {
          const buf = await readFile(outFile);
          await unlink(outFile).catch(() => {});
          resolve(buf);
        } catch (e) {
          reject(e);
        }
      },
    );
  });
}

app.post("/api/tts", requireSession, async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== "string" || text.length > 2000) {
    return res.status(400).json({ error: "Ungültiger Text" });
  }
  const lang = req.body.lang === "en" ? "en" : "de";
  const voice = lang === "de" ? "de-DE-KatjaNeural" : "en-US-JennyNeural";
  try {
    const audioBuffer = await synthesize(text, voice);
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    res.send(audioBuffer);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] tts error: ${err.message}`);
    res.status(500).json({ error: "TTS fehlgeschlagen" });
  }
});

// ── Start (nur wenn direkt ausgeführt) ─────────────────────────
if (isMainModule) {
  createServer(app).listen(PORT, () => {
    console.log(`\n  E.L.L.A. Demo läuft auf http://localhost:${PORT}`);
    console.log(
      `  Limits: ${MAX_PER_SESSION}/Session, ${MAX_PER_IP_DAY}/IP/Tag, ${MAX_GLOBAL_DAY}/Global/Tag\n`,
    );
  });
}

// Export für Tests
export { app, sessions, ipTracker };
