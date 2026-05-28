import React, { useState, useRef, useEffect, useCallback } from "react";

type VoiceMode = "off" | "manual" | "wakeword";

/* ── Message + stream types ──────────────────────────────────────────── */
interface Message {
  role: "user" | "assistant";
  content: string;
}
type StreamEvent =
  | { type: "chunk"; text: string }
  | { type: "tool"; name: string }
  | { type: "confirm"; tool: string; description: string }
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
  const [pendingConfirm, setPendingConfirm] = useState<{
    tool: string;
    description: string;
  } | null>(null);
  const pendingConfirmRef = useRef<{
    tool: string;
    description: string;
  } | null>(null);
  const confirmActionRef = useRef<(confirmed: boolean) => void>(() => {});
  const bottomRef = useRef<HTMLDivElement>(null);

  /* Hausaufgaben-Modus */
  const [homeworkActive, setHomeworkActive] = useState(false);
  const [homeworkConfigured, setHomeworkConfigured] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinBusy, setPinBusy] = useState(false);

  /* Alert-Toasts vom Worker */
  const [toasts, setToasts] = useState<
    { id: number; message: string; severity: "warning" | "error" }[]
  >([]);

  /* TTS state */
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const ttsEnabledRef = useRef(false);
  const ttsVoiceRef = useRef("");
  useEffect(() => {
    ttsEnabledRef.current = ttsEnabled;
  }, [ttsEnabled]);

  const speak = useCallback((text: string) => {
    if (!ttsEnabledRef.current) return;
    window.speechSynthesis.cancel();
    const clean = text
      .replace(/#{1,6}\s?/g, "")
      .replace(/[*_`~]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .trim();
    if (!clean) return;
    const utt = new SpeechSynthesisUtterance(clean);
    utt.lang = "de-DE";
    const voices = window.speechSynthesis.getVoices();
    const saved = ttsVoiceRef.current;
    const match =
      voices.find((v) => v.name === saved) ??
      voices.find((v) => v.lang.startsWith("de"));
    if (match) utt.voice = match;
    utt.rate = 1.05;
    window.speechSynthesis.speak(utt);
  }, []);

  /* Voice state — Whisper (lokal, kein Google) */
  const [voiceMode, setVoiceMode] = useState<VoiceMode>("off");
  const [micActive, setMicActive] = useState(false);
  const [micStatus, setMicStatus] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  /* ── Worker-Events (Alerts) ── */
  useEffect(() => {
    const es = new EventSource(`${API}/api/events/stream`);
    es.onmessage = (e: MessageEvent<string>) => {
      const ev = JSON.parse(e.data) as {
        type: string;
        payload: Record<string, unknown>;
        id?: number;
      };
      const toastId = Date.now();
      if (ev.type === "alert") {
        const severity =
          (ev.payload.severity as "warning" | "error") ?? "warning";
        const message = (ev.payload.message as string) ?? "System-Alert";
        setToasts((prev) => [...prev, { id: toastId, message, severity }]);
        setTimeout(
          () => setToasts((prev) => prev.filter((t) => t.id !== toastId)),
          8000,
        );
      } else if (ev.type === "device_connected") {
        const name = (ev.payload.name as string) ?? "Gerät";
        setToasts((prev) => [
          ...prev,
          {
            id: toastId,
            message: `Gerät verbunden: ${name}`,
            severity: "warning" as const,
          },
        ]);
        setTimeout(
          () => setToasts((prev) => prev.filter((t) => t.id !== toastId)),
          6000,
        );
      } else if (ev.type === "device_disconnected") {
        const name = (ev.payload.name as string) ?? "Gerät";
        setToasts((prev) => [
          ...prev,
          {
            id: toastId,
            message: `Gerät getrennt: ${name}`,
            severity: "warning" as const,
          },
        ]);
        setTimeout(
          () => setToasts((prev) => prev.filter((t) => t.id !== toastId)),
          6000,
        );
      } else if (ev.type === "network_device_connected") {
        const ip = (ev.payload.ip as string) ?? "";
        setToasts((prev) => [
          ...prev,
          {
            id: toastId,
            message: `Neues Gerät im Netzwerk: ${ip}`,
            severity: "warning" as const,
          },
        ]);
        setTimeout(
          () => setToasts((prev) => prev.filter((t) => t.id !== toastId)),
          6000,
        );
      }
    };
    return () => es.close();
  }, []);

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
  const sendText = useCallback(
    async (text: string) => {
      if (!text || loading) return;
      window.speechSynthesis.cancel();
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
              setStreaming("");
              setToolStatus("");
              const pc = { tool: ev.tool, description: ev.description };
              pendingConfirmRef.current = pc;
              setPendingConfirm(pc);
              break outer;
            } else if (ev.type === "done") {
              setMessages((p) => [...p, { role: "assistant", content: full }]);
              setStreaming("");
              setToolStatus("");
              speak(full);
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
    },
    [speak],
  );

  const send = useCallback(() => sendText(input.trim()), [input, sendText]);

  const confirmAction = useCallback(
    async (confirmed: boolean) => {
      setPendingConfirm(null);
      pendingConfirmRef.current = null;
      setLoading(true);
      try {
        const r = await fetch(`${API}/api/chat/confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: SESSION_ID, confirmed }),
        });
        const d = (await r.json()) as { reply: string };
        setMessages((p) => [...p, { role: "assistant", content: d.reply }]);
        if (confirmed) speak(d.reply);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Fehler bei Bestätigung");
      } finally {
        setLoading(false);
      }
    },
    [speak],
  );

  useEffect(() => {
    confirmActionRef.current = confirmAction;
  }, [confirmAction]);

  /* ── Whisper-basierte Spracheingabe ── */
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setMicStatus("Transkription…");
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const form = new FormData();
        form.append("audio", blob, "recording.webm");
        try {
          const r = await fetch(`${API}/api/speech/transcribe`, {
            method: "POST",
            body: form,
          });
          const { text } = (await r.json()) as { text: string };
          if (text) setInput(text);
        } catch {
          /* Fehler still ignorieren */
        }
        setMicStatus("");
        setMicActive(false);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setMicActive(true);
      setMicStatus("Aufnahme…");
    } catch {
      setMicStatus("Mikrofon nicht verfügbar");
      setTimeout(() => setMicStatus(""), 3000);
    }
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
  }, []);

  const toggleMic = useCallback(() => {
    if (micActive) stopRecording();
    else startRecording();
  }, [micActive, startRecording, stopRecording]);

  /* Load voiceMode + homework status on mount */
  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/settings`).then((r) => r.json()) as Promise<{
        voiceMode?: VoiceMode;
        ttsEnabled?: boolean;
        ttsVoice?: string;
      }>,
      fetch(`${API}/api/homework/status`).then((r) => r.json()) as Promise<{
        active: boolean;
        configured: boolean;
      }>,
    ])
      .then(([s, h]) => {
        setVoiceMode(s.voiceMode ?? "off");
        ttsEnabledRef.current = s.ttsEnabled ?? false;
        setTtsEnabled(s.ttsEnabled ?? false);
        ttsVoiceRef.current = s.ttsVoice ?? "";
        setHomeworkActive(h.active);
        setHomeworkConfigured(h.configured);
      })
      .catch(() => {});
  }, []);

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

  const clearHistory = async () => {
    await fetch(`${API}/api/chat/history/${SESSION_ID}`, { method: "DELETE" });
    setMessages([]);
    setStreaming("");
    setToolStatus("");
    setError("");
  };

  const showMic = voiceMode !== "off";

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
          <button
            onClick={() => {
              const next = !ttsEnabled;
              setTtsEnabled(next);
              ttsEnabledRef.current = next;
              if (!next) window.speechSynthesis.cancel();
              fetch(`${API}/api/settings`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ttsEnabled: next }),
              }).catch(() => {});
            }}
            title={ttsEnabled ? "Sprachausgabe aus" : "Sprachausgabe ein"}
            style={{
              padding: "4px 10px",
              borderRadius: 4,
              fontSize: "0.85rem",
              background: ttsEnabled ? "#1e1b4b" : "transparent",
              border: ttsEnabled ? "1px solid #7c6af7" : "1px solid #2d3148",
              color: ttsEnabled ? "#a5b4fc" : "#64748b",
              cursor: "pointer",
            }}
          >
            {ttsEnabled ? "🔊" : "🔇"}
          </button>
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

      {/* Mic-Status */}
      {micStatus && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: "0.78rem",
            color: micActive ? "#7c6af7" : "#94a3b8",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              display: "inline-block",
              background: micActive ? "#7c6af7" : "#94a3b8",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
          {micStatus}
        </div>
      )}

      {/* Confirmation card */}
      {pendingConfirm && (
        <div
          style={{
            background: "#1e1425",
            border: "1px solid #7c3aed",
            borderRadius: 8,
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            flexShrink: 0,
          }}
        >
          <div
            style={{ fontWeight: 600, fontSize: "0.9rem", color: "#c4b5fd" }}
          >
            Aktion bestätigen
          </div>
          <div style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
            <span style={{ color: "#e2e8f0" }}>{pendingConfirm.tool}</span>
            {" — "}
            {pendingConfirm.description}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              data-testid="confirm-yes"
              onClick={() => confirmAction(true)}
              style={{
                padding: "7px 18px",
                borderRadius: 6,
                border: "none",
                background: "#7c3aed",
                color: "#fff",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: 600,
              }}
            >
              Bestätigen
            </button>
            <button
              data-testid="confirm-no"
              onClick={() => confirmAction(false)}
              style={{
                padding: "7px 18px",
                borderRadius: 6,
                border: "1px solid #2d3148",
                background: "transparent",
                color: "#64748b",
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              Ablehnen
            </button>
          </div>
        </div>
      )}

      {/* Input row */}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder={
            micActive ? "Spreche deinen Befehl…" : "Anweisung eingeben…"
          }
          disabled={loading || !!pendingConfirm}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 6,
            border: micActive ? "1px solid #7c6af7" : "1px solid #2d3148",
            background: "#1a1d27",
            color: "#e2e8f0",
            fontSize: "0.9rem",
            outline: "none",
            opacity: loading || !!pendingConfirm ? 0.6 : 1,
            transition: "border-color 0.2s",
          }}
        />
        {showMic && (
          <button
            onClick={toggleMic}
            title={micActive ? "Aufnahme stoppen" : "Mikrofon starten"}
            style={{
              padding: "10px 14px",
              borderRadius: 6,
              minWidth: 42,
              background: micActive ? "#7c6af7" : "#1a1d27",
              border: micActive ? "none" : "1px solid #2d3148",
              color: micActive ? "#fff" : "#64748b",
              cursor: "pointer",
              fontSize: "1rem",
              lineHeight: 1,
              transition: "background 0.2s, color 0.2s",
            }}
          >
            {micActive ? "◉" : "○"}
          </button>
        )}
        <button
          onClick={send}
          disabled={loading || !input.trim() || !!pendingConfirm}
          style={{
            padding: "10px 20px",
            borderRadius: 6,
            background:
              loading || !input.trim() || !!pendingConfirm
                ? "#4a4670"
                : "#7c6af7",
            color: "#fff",
            border: "none",
            cursor:
              loading || !input.trim() || !!pendingConfirm
                ? "not-allowed"
                : "pointer",
            fontSize: "0.9rem",
          }}
        >
          Senden
        </button>
      </div>

      {/* Alert-Toasts vom Worker */}
      {toasts.length > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            zIndex: 1000,
            pointerEvents: "none",
          }}
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                fontSize: "0.85rem",
                background: t.severity === "error" ? "#431407" : "#422006",
                border: `1px solid ${t.severity === "error" ? "#c2410c" : "#d97706"}`,
                color: t.severity === "error" ? "#fdba74" : "#fde68a",
                maxWidth: 320,
                boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                pointerEvents: "auto",
              }}
            >
              {t.severity === "error" ? "⚠ " : "● "}
              {t.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Chat;
