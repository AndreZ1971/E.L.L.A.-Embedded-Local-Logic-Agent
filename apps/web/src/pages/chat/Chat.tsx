import React, { useState, useRef, useEffect, useCallback } from "react";

/* ── SpeechRecognition types (not in default TS lib) ─────────────────── */
interface SrAlt {
  transcript: string;
  confidence: number;
}
interface SrRes {
  isFinal: boolean;
  readonly length: number;
  [i: number]: SrAlt;
}
interface SrList {
  readonly length: number;
  [i: number]: SrRes;
}
interface SrEvent extends Event {
  readonly resultIndex: number;
  readonly results: SrList;
}
interface Recog extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((ev: SrEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
}
declare global {
  interface Window {
    SpeechRecognition?: new () => Recog;
    webkitSpeechRecognition?: new () => Recog;
  }
}

type VoiceMode = "off" | "manual" | "wakeword";
type VoicePhase = "idle" | "wake" | "listen";

const SUBMIT_RE =
  /\b(ausf[uü]hren|los|mach es(?: bitte)?|mache es(?: bitte)?|abschicken|sende)\b/i;
const CANCEL_RE = /\b(abbrechen|stopp?|vergiss es)\b/i;

function mkRecog(): Recog | null {
  const C = window.SpeechRecognition ?? window.webkitSpeechRecognition;
  return C ? new C() : null;
}

/* ── Message + stream types ──────────────────────────────────────────── */
interface Message {
  role: "user" | "assistant";
  content: string;
}
interface ConfirmRequest {
  id: string;
  tool: string;
  label: string;
}

type StreamEvent =
  | { type: "chunk"; text: string }
  | { type: "tool"; name: string }
  | { type: "confirm"; id: string; tool: string; label: string }
  | { type: "done" }
  | { type: "error"; message: string };

const SESSION_ID = "default";
const API = import.meta.env.VITE_API_BASE ?? "";

const TOOL_LABELS: Record<string, string> = {
  get_disk_usage: "Festplattennutzung abrufen",
  open_app: "App öffnen",
  clean_temp: "Temp-Dateien bereinigen",
  empty_recycle_bin: "Papierkorb leeren",
};

/* ── Component ───────────────────────────────────────────────────────── */
const Chat: React.FC = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState("");
  const [toolStatus, setToolStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirms, setConfirms] = useState<ConfirmRequest[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  /* Hausaufgaben-Modus */
  const [homeworkActive, setHomeworkActive] = useState(false);
  const [homeworkConfigured, setHomeworkConfigured] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinBusy, setPinBusy] = useState(false);

  /* Voice state */
  const [voiceMode, setVoiceMode] = useState<VoiceMode>("off");
  const [voicePhase, setVoicePhase] = useState<VoicePhase>("idle");
  const voiceModeRef = useRef<VoiceMode>("off");
  const voicePhaseRef = useRef<VoicePhase>("idle");
  const wakeRef = useRef<Recog | null>(null);
  const cmdRef = useRef<Recog | null>(null);
  const loadingRef = useRef(false);
  const startWakeRef = useRef<() => void>(() => {});
  const startCmdRef = useRef<() => void>(() => {});
  const sendFnRef = useRef<(t: string) => void>(() => {});

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  /* ── History ── */
  useEffect(() => {
    fetch(`${API}/api/chat/history/${SESSION_ID}`)
      .then((r) => r.json())
      .then((d: { messages: Message[] }) => {
        if (d.messages?.length > 0) setMessages(d.messages);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming, loading]);

  /* ── sendText ── */
  const sendText = useCallback(async (text: string) => {
    if (!text || loadingRef.current) return;
    setMessages((p) => [...p, { role: "user", content: text }]);
    setInput("");
    setLoading(true);
    setError("");
    setStreaming("");
    setToolStatus("");

    try {
      const res = await fetch(`${API}/api/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId: SESSION_ID }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let full = "";
      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;
          const ev = JSON.parse(raw) as StreamEvent;
          if (ev.type === "chunk") {
            full += ev.text;
            setStreaming(full);
            setToolStatus("");
          } else if (ev.type === "tool") {
            setToolStatus(TOOL_LABELS[ev.name] ?? ev.name);
          } else if (ev.type === "confirm") {
            setToolStatus("");
            setConfirms((p) => [
              ...p,
              { id: ev.id, tool: ev.tool, label: ev.label },
            ]);
          } else if (ev.type === "done") {
            setMessages((p) => [...p, { role: "assistant", content: full }]);
            setStreaming("");
            setToolStatus("");
            setConfirms([]);
            break outer;
          } else if (ev.type === "error") throw new Error(ev.message);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
      setStreaming("");
      setToolStatus("");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    sendFnRef.current = sendText;
  }, [sendText]);
  const send = useCallback(() => sendText(input.trim()), [input, sendText]);

  /* ── Tool-Bestätigung ── */
  const resolveConfirm = useCallback(async (id: string, approved: boolean) => {
    setConfirms((p) => p.filter((c) => c.id !== id));
    await fetch(`${API}/api/approvals/${id}/${approved ? "confirm" : "deny"}`, {
      method: "POST",
    });
  }, []);

  /* ── Voice helpers ── */
  const setPhase = useCallback((p: VoicePhase) => {
    voicePhaseRef.current = p;
    setVoicePhase(p);
  }, []);

  const stopAll = useCallback(() => {
    try {
      wakeRef.current?.abort();
    } catch {}
    try {
      cmdRef.current?.abort();
    } catch {}
    wakeRef.current = null;
    cmdRef.current = null;
    setPhase("idle");
  }, [setPhase]);

  const startWake = useCallback(() => {
    try {
      wakeRef.current?.abort();
    } catch {}
    try {
      cmdRef.current?.abort();
    } catch {}
    wakeRef.current = null;
    cmdRef.current = null;

    const r = mkRecog();
    if (!r) return;
    r.continuous = true;
    r.interimResults = false;
    r.lang = "de-DE";
    wakeRef.current = r;
    setPhase("wake");

    r.onresult = (ev) => {
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        if (ev.results[i][0].transcript.toLowerCase().includes("ella")) {
          r.abort();
          wakeRef.current = null;
          startCmdRef.current();
          return;
        }
      }
    };
    r.onerror = () => {};
    r.onend = () => {
      if (
        voiceModeRef.current === "wakeword" &&
        voicePhaseRef.current === "wake"
      ) {
        setTimeout(() => startWakeRef.current(), 250);
      }
    };
    try {
      r.start();
    } catch {}
  }, [setPhase]);

  const startCmd = useCallback(() => {
    try {
      cmdRef.current?.abort();
    } catch {}
    const r = mkRecog();
    if (!r) return;
    r.continuous = true;
    r.interimResults = true;
    r.lang = "de-DE";
    cmdRef.current = r;
    setPhase("listen");

    r.onresult = (ev) => {
      let allFinals = "";
      let interim = "";
      let latestFinal = "";
      for (let i = 0; i < ev.results.length; i++) {
        const t = ev.results[i][0].transcript;
        if (ev.results[i].isFinal) allFinals += t;
        else interim += t;
      }
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        if (ev.results[i].isFinal) latestFinal = ev.results[i][0].transcript;
      }

      setInput(allFinals + interim);
      if (!latestFinal) return;

      if (SUBMIT_RE.test(latestFinal)) {
        const cmd = allFinals.replace(SUBMIT_RE, "").trim();
        r.abort();
        cmdRef.current = null;
        setInput("");
        setPhase("idle");
        if (cmd) sendFnRef.current(cmd);
        if (voiceModeRef.current === "wakeword")
          setTimeout(() => startWakeRef.current(), 400);
        return;
      }
      if (CANCEL_RE.test(latestFinal)) {
        r.abort();
        cmdRef.current = null;
        setInput("");
        setPhase("idle");
        if (voiceModeRef.current === "wakeword")
          setTimeout(() => startWakeRef.current(), 400);
      }
    };

    r.onerror = (ev) => {
      if (ev.error === "no-speech") return;
      r.abort();
      cmdRef.current = null;
      setInput("");
      if (voiceModeRef.current === "wakeword") {
        setTimeout(() => startWakeRef.current(), 400);
      } else {
        setPhase("idle");
      }
    };

    r.onend = () => {
      if (
        voicePhaseRef.current === "listen" &&
        voiceModeRef.current === "manual"
      ) {
        setPhase("idle");
      }
    };

    try {
      r.start();
    } catch {}
  }, [setPhase]);

  useEffect(() => {
    startWakeRef.current = startWake;
    startCmdRef.current = startCmd;
  }, [startWake, startCmd]);

  /* Load voiceMode + homework status on mount */
  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/settings`).then((r) => r.json()) as Promise<{
        voiceMode?: VoiceMode;
      }>,
      fetch(`${API}/api/homework/status`).then((r) => r.json()) as Promise<{
        active: boolean;
        configured: boolean;
      }>,
    ])
      .then(([s, h]) => {
        const m = s.voiceMode ?? "off";
        voiceModeRef.current = m;
        setVoiceMode(m);
        if (m === "wakeword") setTimeout(() => startWakeRef.current(), 500);
        setHomeworkActive(h.active);
        setHomeworkConfigured(h.configured);
      })
      .catch(() => {});
    return () => stopAll();
  }, [stopAll]);

  const activateHomework = useCallback(async () => {
    const r = await fetch(`${API}/api/homework/activate`, { method: "POST" });
    const d = (await r.json()) as { success?: boolean; error?: string };
    if (d.success) setHomeworkActive(true);
  }, []);

  const deactivateHomework = useCallback(async () => {
    if (!pinInput.trim()) {
      setPinError("PIN eingeben.");
      return;
    }
    setPinBusy(true);
    setPinError("");
    try {
      const r = await fetch(`${API}/api/homework/deactivate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinInput }),
      });
      const d = (await r.json()) as { success?: boolean; error?: string };
      if (d.success) {
        setHomeworkActive(false);
        setShowPinDialog(false);
        setPinInput("");
      } else {
        setPinError(d.error ?? "Falscher PIN.");
      }
    } finally {
      setPinBusy(false);
    }
  }, [pinInput]);

  /* Manual mic toggle */
  const toggleMic = useCallback(() => {
    if (voicePhaseRef.current === "listen") stopAll();
    else startCmdRef.current();
  }, [stopAll]);

  /* Cancel command in wakeword mode */
  const cancelCmd = useCallback(() => {
    try {
      cmdRef.current?.abort();
    } catch {}
    cmdRef.current = null;
    setInput("");
    setTimeout(() => startWakeRef.current(), 300);
  }, []);

  const clearHistory = async () => {
    await fetch(`${API}/api/chat/history/${SESSION_ID}`, { method: "DELETE" });
    setMessages([]);
    setStreaming("");
    setToolStatus("");
    setError("");
  };

  /* ── Mic button props ── */
  const micIcon =
    voicePhase === "listen" ? "◉" : voicePhase === "wake" ? "◎" : "○";
  const micClick =
    voiceMode === "manual"
      ? toggleMic
      : voicePhase === "listen"
        ? cancelCmd
        : undefined;
  const micTitle =
    voicePhase === "listen"
      ? "Aufnahme abbrechen"
      : voicePhase === "wake"
        ? "Warte auf Aktivierungswort…"
        : "Mikrofon starten";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        gap: 12,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2 style={{ margin: 0 }}>Chat</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {homeworkConfigured && (
            <button
              onClick={() =>
                homeworkActive ? setShowPinDialog(true) : activateHomework()
              }
              title={
                homeworkActive
                  ? "Hausaufgaben-Modus deaktivieren"
                  : "Hausaufgaben-Modus aktivieren"
              }
              style={{
                padding: "4px 10px",
                borderRadius: 4,
                fontSize: "0.85rem",
                background: homeworkActive ? "#431407" : "transparent",
                border: homeworkActive
                  ? "1px solid #c2410c"
                  : "1px solid #2d3148",
                color: homeworkActive ? "#fdba74" : "#64748b",
                cursor: "pointer",
              }}
            >
              {homeworkActive ? "🔒" : "🔓"}
            </button>
          )}
          {messages.length > 0 && (
            <button
              onClick={clearHistory}
              style={{
                padding: "4px 12px",
                borderRadius: 4,
                fontSize: "0.8rem",
                background: "transparent",
                border: "1px solid #2d3148",
                color: "#64748b",
                cursor: "pointer",
              }}
            >
              Verlauf löschen
            </button>
          )}
        </div>
      </div>

      {/* Hausaufgaben-Modus Banner */}
      {homeworkActive && (
        <div
          style={{
            background: "#431407",
            border: "1px solid #c2410c",
            borderRadius: 6,
            padding: "8px 14px",
            fontSize: "0.82rem",
            color: "#fdba74",
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexShrink: 0,
          }}
        >
          <span>🔒</span> Hausaufgaben-Modus aktiv — nur erlaubte Programme
          laufen.
        </div>
      )}

      {/* PIN-Dialog */}
      {showPinDialog && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPinDialog(false);
              setPinInput("");
              setPinError("");
            }
          }}
        >
          <div
            style={{
              background: "#1a1d27",
              border: "1px solid #2d3148",
              borderRadius: 10,
              padding: 24,
              width: 300,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div style={{ fontWeight: 600, fontSize: "1rem" }}>
              Hausaufgaben-Modus deaktivieren
            </div>
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && deactivateHomework()}
              placeholder="PIN eingeben"
              autoFocus
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid #2d3148",
                background: "#0f1117",
                color: "#e2e8f0",
                fontSize: "0.9rem",
                outline: "none",
              }}
            />
            {pinError && (
              <div style={{ fontSize: "0.82rem", color: "#f87171" }}>
                {pinError}
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={deactivateHomework}
                disabled={pinBusy}
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: 6,
                  border: "none",
                  background: "#c2410c",
                  color: "#fff",
                  cursor: pinBusy ? "not-allowed" : "pointer",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                }}
              >
                {pinBusy ? "…" : "Deaktivieren"}
              </button>
              <button
                onClick={() => {
                  setShowPinDialog(false);
                  setPinInput("");
                  setPinError("");
                }}
                style={{
                  padding: "8px 14px",
                  borderRadius: 6,
                  border: "1px solid #2d3148",
                  background: "transparent",
                  color: "#64748b",
                  cursor: "pointer",
                  fontSize: "0.88rem",
                }}
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {messages.length === 0 && !loading && (
          <div
            style={{
              color: "#64748b",
              fontSize: "0.9rem",
              marginTop: 32,
              textAlign: "center",
            }}
          >
            Hallo! Ich bin E.L.L.A. — wie kann ich helfen?
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              background: m.role === "user" ? "#7c6af7" : "#1a1d27",
              border: m.role === "assistant" ? "1px solid #2d3148" : "none",
              padding: "10px 14px",
              borderRadius: 8,
              maxWidth: "75%",
              fontSize: "0.9rem",
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
            }}
          >
            {m.content}
          </div>
        ))}
        {toolStatus && (
          <div
            style={{
              alignSelf: "flex-start",
              background: "#1a1d27",
              border: "1px solid #2d3148",
              padding: "8px 14px",
              borderRadius: 8,
              fontSize: "0.8rem",
              color: "#94a3b8",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ color: "#7c6af7" }}>⚙</span>
            {toolStatus}…
          </div>
        )}

        {/* Bestätigungs-Cards */}
        {confirms.map((c) => (
          <div
            key={c.id}
            style={{
              alignSelf: "flex-start",
              background: "#1a1d27",
              border: "1px solid #7c6af7",
              borderRadius: 8,
              padding: "14px 16px",
              maxWidth: "75%",
            }}
          >
            <div
              style={{ fontSize: "0.8rem", color: "#94a3b8", marginBottom: 8 }}
            >
              <span style={{ color: "#7c6af7" }}>⚙</span> E.L.L.A. möchte
              ausführen:
            </div>
            <div
              style={{
                fontSize: "0.9rem",
                color: "#e2e8f0",
                marginBottom: 12,
                fontWeight: 500,
              }}
            >
              {c.label}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => resolveConfirm(c.id, true)}
                style={{
                  padding: "6px 16px",
                  borderRadius: 5,
                  border: "none",
                  background: "#22c55e",
                  color: "#0f1117",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                }}
              >
                Bestätigen
              </button>
              <button
                onClick={() => resolveConfirm(c.id, false)}
                style={{
                  padding: "6px 16px",
                  borderRadius: 5,
                  border: "1px solid #7f1d1d",
                  background: "transparent",
                  color: "#f87171",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                }}
              >
                Ablehnen
              </button>
            </div>
          </div>
        ))}
        {streaming && (
          <div
            style={{
              alignSelf: "flex-start",
              background: "#1a1d27",
              border: "1px solid #2d3148",
              padding: "10px 14px",
              borderRadius: 8,
              maxWidth: "75%",
              fontSize: "0.9rem",
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
            }}
          >
            {streaming}
            <span
              style={{
                display: "inline-block",
                width: 2,
                height: "1em",
                background: "#7c6af7",
                marginLeft: 2,
                animation: "blink 1s step-end infinite",
                verticalAlign: "text-bottom",
              }}
            />
          </div>
        )}
        {loading && !streaming && !toolStatus && (
          <div
            style={{
              alignSelf: "flex-start",
              background: "#1a1d27",
              border: "1px solid #2d3148",
              padding: "10px 14px",
              borderRadius: 8,
              fontSize: "0.85rem",
              color: "#7c6af7",
            }}
          >
            E.L.L.A. denkt…
          </div>
        )}
        {error && (
          <div
            style={{
              alignSelf: "flex-start",
              background: "#2d1a1a",
              border: "1px solid #7f1d1d",
              padding: "10px 14px",
              borderRadius: 8,
              fontSize: "0.85rem",
              color: "#fca5a5",
            }}
          >
            Fehler: {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <style>{`
        @keyframes blink  { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes pulse  { 0%,100%{opacity:0.4} 50%{opacity:1} }
      `}</style>

      {/* Wake-word status indicator */}
      {voiceMode !== "off" && voicePhase !== "idle" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: "0.78rem",
            color: voicePhase === "listen" ? "#7c6af7" : "#64748b",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              display: "inline-block",
              background: voicePhase === "listen" ? "#7c6af7" : "#64748b",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
          {voicePhase === "wake" && 'Warte auf "ella"…'}
          {voicePhase === "listen" &&
            (voiceMode === "wakeword"
              ? 'Spreche deinen Befehl, dann "ausführen" oder "los".'
              : "Höre zu…")}
        </div>
      )}

      {/* Input row */}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder={
            voicePhase === "listen"
              ? "Spreche deinen Befehl…"
              : "Anweisung eingeben…"
          }
          disabled={loading}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 6,
            border:
              voicePhase === "listen"
                ? "1px solid #7c6af7"
                : "1px solid #2d3148",
            background: "#1a1d27",
            color: "#e2e8f0",
            fontSize: "0.9rem",
            outline: "none",
            opacity: loading ? 0.6 : 1,
            transition: "border-color 0.2s",
          }}
        />
        {voiceMode !== "off" && (
          <button
            onClick={micClick}
            title={micTitle}
            style={{
              padding: "10px 14px",
              borderRadius: 6,
              minWidth: 42,
              background: voicePhase === "listen" ? "#7c6af7" : "#1a1d27",
              border: voicePhase === "listen" ? "none" : "1px solid #2d3148",
              color:
                voicePhase === "listen"
                  ? "#fff"
                  : voicePhase === "wake"
                    ? "#475569"
                    : "#64748b",
              cursor: micClick ? "pointer" : "default",
              fontSize: "1rem",
              lineHeight: 1,
              transition: "background 0.2s, color 0.2s",
            }}
          >
            {micIcon}
          </button>
        )}
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          style={{
            padding: "10px 20px",
            borderRadius: 6,
            background: loading || !input.trim() ? "#4a4670" : "#7c6af7",
            color: "#fff",
            border: "none",
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            fontSize: "0.9rem",
          }}
        >
          Senden
        </button>
      </div>
    </div>
  );
};

export default Chat;
