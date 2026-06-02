import React, { useState, useRef, useEffect, useCallback } from "react";
import { AudioVAD, encodeWav } from "../../utils/audioVAD.js";

type VoiceMode = "off" | "manual" | "wakeword";

const WAKEWORD_RE = /el+a+[,.\s!?]*/i;
// Whisper-tiny hallucinations — skip these segments entirely
const HALLUCINATION_RE =
  /^\[.*\]$|^\(.*\)$|wir sehen uns wieder|bis zum nächsten|vielen dank für|untertitel|copyright/i;

/* ── Message + stream types ──────────────────────────────────────────── */
interface Message {
  role: "user" | "assistant" | "directive_deny";
  content: string;
  toolName?: string;
}
type StreamEvent =
  | { type: "chunk"; text: string }
  | { type: "tool"; name: string }
  | { type: "directive_deny"; tool: string }
  | { type: "shutdown"; cmd: string; delay: number }
  | { type: "done" }
  | { type: "error"; message: string };

const SESSION_ID = "default";
const API = import.meta.env.VITE_API_BASE ?? "";

const TOOL_LABELS: Record<string, string> = {
  open_app: "App öffnen",
  get_disk_usage: "Festplattennutzung abrufen",
  clean_temp: "Temp-Dateien bereinigen",
  empty_recycle_bin: "Papierkorb leeren",
  remember: "Erinnerung speichern",
  forget: "Erinnerung löschen",
  list_memories: "Erinnerungen auflisten",
  homework_mode: "Hausaufgaben-Modus",
  get_system_info: "Systeminfo abrufen",
  create_setup: "Setup anlegen",
  update_setting: "Einstellung ändern",
  create_rule: "Regel erstellen",
  free_ram: "RAM freigeben",
  read_emails: "E-Mails lesen",
  mark_email: "E-Mail markieren",
  read_calendar: "Kalender lesen",
  create_appointment: "Termin erstellen",
  list_devices: "Geräte auflisten",
  scan_network: "Netzwerk scannen",
  list_connections: "Verbindungen auflisten",
  get_system_status: "System-Status abrufen",
  search_web: "Web-Suche",
  get_location: "Standort ermitteln",
  delete_files: "Dateien löschen",
  load_setup: "Setup laden",
};

/* ── Component ───────────────────────────────────────────────────────── */
const Chat: React.FC = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState("");
  const [toolStatus, setToolStatus] = useState("");
  const [directiveDeny, setDirectiveDeny] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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

  const speakProactive = useCallback((text: string) => {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "de-DE";
    const voices = window.speechSynthesis.getVoices();
    const saved = ttsVoiceRef.current;
    const match =
      voices.find((v) => v.name === saved) ??
      voices.find((v) => v.lang.startsWith("de"));
    if (match) utt.voice = match;
    utt.rate = 1.0;
    utt.volume = 0.9;
    window.speechSynthesis.speak(utt);
  }, []);

  const speakEdge = useCallback(
    async (text: string) => {
      const clean = text
        .replace(/#{1,6}\s?/g, "")
        .replace(/[*_`~]/g, "")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .trim();
      if (!clean) return;
      try {
        const voice = ttsVoiceRef.current || "de-DE-KatjaNeural";
        const res = await fetch(`${API}/api/speech/synthesize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: clean, voice }),
        });
        if (!res.ok) throw new Error(`TTS HTTP ${res.status}`);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => URL.revokeObjectURL(url);
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          speakProactive(clean);
        };
        await audio.play();
      } catch {
        speakProactive(clean);
      }
    },
    [speakProactive],
  );

  const speak = useCallback(
    (text: string) => {
      if (!ttsEnabledRef.current) return;
      speakEdge(text);
    },
    [speakEdge],
  );

  /* Voice state — Whisper (lokal, kein Google) */
  const [voiceMode, setVoiceMode] = useState<VoiceMode>("off");
  const [micActive, setMicActive] = useState(false);
  const [micStatus, setMicStatus] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const vadRef = useRef<AudioVAD | null>(null);
  const awaitingCommandRef = useRef(false);
  const awaitingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [wakeListening, setWakeListening] = useState(false);
  const loadingRef = useRef(false);

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
        speakEdge(message);
        (
          window as unknown as {
            electronAPI?: {
              notifyAlert?: (m: string, s?: "warning" | "error") => void;
            };
          }
        ).electronAPI?.notifyAlert?.(message, severity);
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
        speakEdge(`Neues Gerät verbunden: ${name}`);
        (
          window as unknown as {
            electronAPI?: {
              notifyDevice?: (m: string, t: string) => void;
            };
          }
        ).electronAPI?.notifyDevice?.(
          `Neues Gerät verbunden: ${name}`,
          "connected",
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
        speakEdge(`Gerät getrennt: ${name}`);
        (
          window as unknown as {
            electronAPI?: {
              notifyDevice?: (m: string, t: string) => void;
            };
          }
        ).electronAPI?.notifyDevice?.(
          `Gerät getrennt: ${name}`,
          "disconnected",
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
        speakEdge(`Neues Gerät im Netzwerk erkannt: ${ip}`);
        (
          window as unknown as {
            electronAPI?: {
              notifyDevice?: (m: string, t: string) => void;
            };
          }
        ).electronAPI?.notifyDevice?.(
          `Neues Gerät im Netzwerk: ${ip}`,
          "network",
        );
      }
    };

    // Begrüßung vom Main-Process
    const removeSpeak = (
      window as unknown as {
        electronAPI?: { onSpeak?: (cb: (text: string) => void) => () => void };
      }
    ).electronAPI?.onSpeak?.((text) => speakEdge(text));

    // Hintergrund-Modus: Wakeword erzwingen wenn Fenster versteckt
    const removeBackground = (
      window as unknown as {
        electronAPI?: {
          onBackground?: (cb: (v: boolean) => void) => () => void;
        };
      }
    ).electronAPI?.onBackground?.((isBackground) => {
      if (isBackground) setVoiceMode("wakeword");
    });

    return () => {
      es.close();
      removeSpeak?.();
      removeBackground?.();
    };
  }, [speakEdge]);

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
            let ev: StreamEvent;
            try {
              ev = JSON.parse(raw) as StreamEvent;
            } catch {
              continue;
            }
            if (ev.type === "chunk") {
              full += ev.text;
              setStreaming(full);
              setToolStatus("");
              setDirectiveDeny(null);
            } else if (ev.type === "tool") {
              setToolStatus(TOOL_LABELS[ev.name] ?? ev.name);
            } else if (ev.type === "directive_deny") {
              setDirectiveDeny(ev.tool);
              setToolStatus("");
              setMessages((p) => [
                ...p,
                {
                  role: "directive_deny",
                  content:
                    "Diese Aktion ist durch die E.L.L.A. Directive architektonisch blockiert.",
                  toolName: ev.tool,
                },
              ]);
              setTimeout(() => setDirectiveDeny(null), 3000);
            } else if (ev.type === "shutdown") {
              const { cmd, delay } = ev;
              setTimeout(
                () => {
                  (
                    window as unknown as {
                      electronAPI?: { executeShutdown?: (c: string) => void };
                    }
                  ).electronAPI?.executeShutdown?.(cmd);
                },
                (Number(delay) + 2) * 1000,
              );
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
    } catch (err) {
      const msg = err instanceof Error ? err.name : "Unbekannt";
      setMicStatus(`Mikrofon: ${msg}`);
      console.error("[MIC] getUserMedia fehlgeschlagen:", err);
      setTimeout(() => setMicStatus(""), 5000);
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

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  /* ── Wakeword-Loop (AudioVAD + Whisper) ── */
  useEffect(() => {
    if (voiceMode !== "wakeword") {
      vadRef.current?.stop();
      vadRef.current = null;
      setWakeListening(false);
      setMicStatus("");
      return;
    }

    const vad = new AudioVAD();
    vadRef.current = vad;

    vad
      .start({
        onSpeechStart: () => setMicStatus("Erkenne…"),
        onSegment: async (audio, sampleRate) => {
          if (loadingRef.current) {
            setMicStatus("");
            return;
          }
          const blob = encodeWav(audio, sampleRate);
          const form = new FormData();
          form.append("audio", blob, "segment.wav");
          try {
            const r = await fetch(`${API}/api/speech/transcribe`, {
              method: "POST",
              body: form,
            });
            const { text } = (await r.json()) as { text: string };
            const clean = (text ?? "").trim();
            if (!clean || HALLUCINATION_RE.test(clean)) return;
            console.log("[WAKEWORD] Whisper:", JSON.stringify(clean));
            // Phase 2: wakeword already heard — treat next segment as command
            if (awaitingCommandRef.current) {
              awaitingCommandRef.current = false;
              if (awaitingTimerRef.current) {
                clearTimeout(awaitingTimerRef.current);
                awaitingTimerRef.current = null;
              }
              sendText(clean);
              return;
            }
            // Phase 1: check for wakeword
            if (WAKEWORD_RE.test(clean)) {
              const command = clean.replace(/^.*?el+a+[,.\s!?]*/i, "").trim();
              if (command) {
                sendText(command);
              } else {
                // Wakeword alone — wait for next segment as command
                awaitingCommandRef.current = true;
                setMicStatus("Bereit…");
                // Auto-reset after 6 s if no follow-up
                awaitingTimerRef.current = setTimeout(() => {
                  awaitingCommandRef.current = false;
                  awaitingTimerRef.current = null;
                  setMicStatus("");
                }, 6000);
              }
            }
          } catch {
            /* Segment still ignorieren */
          } finally {
            setMicStatus("");
          }
        },
      })
      .then(() => setWakeListening(true))
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.name : "Unbekannt";
        setMicStatus(`Wakeword: ${msg}`);
        console.error("[WAKEWORD] VAD-Start fehlgeschlagen:", err);
        setTimeout(() => setMicStatus(""), 5000);
      });

    return () => {
      vad.stop();
      setWakeListening(false);
      setMicStatus("");
    };
  }, [voiceMode, sendText]);

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
        {messages.map((m, i) => {
          if (m.role === "directive_deny") {
            return (
              <div
                key={i}
                style={{
                  alignSelf: "flex-start",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #7f1d1d",
                  borderLeft: "3px solid #ef4444",
                  background: "#1a0a0a",
                  maxWidth: "75%",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "#ef4444",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                    }}
                  >
                    ⊘ E.L.L.A. DIRECTIVE
                  </span>
                  {m.toolName && (
                    <span
                      style={{
                        fontSize: "0.7rem",
                        background: "#450a0a",
                        border: "1px solid #7f1d1d",
                        color: "#fca5a5",
                        borderRadius: 4,
                        padding: "1px 6px",
                        fontFamily: "monospace",
                      }}
                    >
                      {m.toolName}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: "0.83rem",
                    color: "#94a3b8",
                    lineHeight: 1.5,
                  }}
                >
                  {m.content}
                </div>
              </div>
            );
          }
          return (
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
          );
        })}
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

      {/* Directive-Denial Badge */}
      {directiveDeny && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 12px",
            borderRadius: 6,
            borderLeft: "3px solid #ef4444",
            background: "#1a0a0a",
            fontSize: "0.82rem",
          }}
        >
          <span
            style={{
              color: "#ef4444",
              fontWeight: 600,
              letterSpacing: "0.05em",
            }}
          >
            E.L.L.A. DIRECTIVE
          </span>
          <span style={{ color: "#94a3b8" }}>
            Diese Aktion ist architektonisch nicht erlaubt.
          </span>
        </div>
      )}

      {/* Wakeword-Indikator */}
      {voiceMode === "wakeword" && wakeListening && !micStatus && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: "0.78rem",
            color: "#475569",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              display: "inline-block",
              background: "#475569",
              animation: "pulse 2.5s ease-in-out infinite",
            }}
          />
          ELLA lauscht…
        </div>
      )}

      {/* Mic-Status */}
      {micStatus && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: "0.78rem",
            color: "#7c6af7",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              display: "inline-block",
              background: "#7c6af7",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
          {micStatus}
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
          disabled={loading}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 6,
            border: micActive ? "1px solid #7c6af7" : "1px solid #2d3148",
            background: "#1a1d27",
            color: "#e2e8f0",
            fontSize: "0.9rem",
            outline: "none",
            opacity: loading ? 0.6 : 1,
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
