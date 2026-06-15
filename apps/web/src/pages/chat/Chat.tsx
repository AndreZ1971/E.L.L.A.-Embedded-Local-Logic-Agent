import React, { useState, useRef, useEffect, useCallback } from "react";
import { marked } from "marked";
import { AudioVAD, encodeWav } from "../../utils/audioVAD.js";

type VoiceMode = "off" | "manual" | "wakeword" | "always";

const WAKEWORD_RE = /el+a+[,.\s!?]*/i;
// Whisper-tiny hallucinations — skip these segments entirely
const HALLUCINATION_RE =
  /^\[.*\]$|^\(.*\)$|wir sehen uns wieder|bis zum nächsten|vielen dank für|untertitel|copyright|^https?:\/\/\S+$|^\S+\.(com|de|org|net|io)\b/i;

function cleanTextForTTS(text: string): string {
  // Zähle Listen-artige Zeilen (Ports, IPs, Pfade, Prozesse etc.)
  const lines = text.split("\n");
  const listLineRe =
    /^\s*[-*+\d.]*\s*(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|:\d{2,5}|[A-Za-z]:\\|\/[a-z]|PID|TCP|UDP|\d{4,})/i;
  const listLines = lines.filter((l) => listLineRe.test(l));

  let processed = text;
  if (listLines.length > 4) {
    const nonListLines = lines.filter((l) => !listLineRe.test(l));
    processed = nonListLines.join(" ");
  }

  return processed
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/#{1,6}\s+/g, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, "")
    .replace(/[\u{2600}-\u{27BF}]/gu, "")
    .replace(/[\u{FE00}-\u{FE0F}]/gu, "")
    .replace(/‍/gu, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 400); // Absolute Obergrenze: 400 Zeichen gesprochen
}

/* ── Message + stream types ──────────────────────────────────────────── */
interface Message {
  role: "user" | "assistant" | "directive_deny";
  content: string;
  toolName?: string;
  proactive?: boolean;
  usedTools?: string[];
}
interface PendingAction {
  tool: string;
  args: Record<string, unknown>;
}

type StreamEvent =
  | { type: "chunk"; text: string }
  | { type: "tool"; name: string }
  | { type: "directive_deny"; tool: string }
  | { type: "shutdown"; cmd: string; delay: number }
  | {
      type: "confirmation_required";
      message: string;
      pendingAction: PendingAction;
    }
  | { type: "pause"; minutes: number }
  | { type: "done" }
  | { type: "error"; message: string };

const SESSION_ID = "default";
const API = import.meta.env.VITE_API_BASE ?? "";

const TOOL_LABELS: Record<string, string> = {
  open_app: "App öffnen",
  get_disk_usage: "Festplattennutzung",
  clean_temp: "Temp-Dateien bereinigen",
  empty_recycle_bin: "Papierkorb leeren",
  remember: "Erinnerung speichern",
  forget: "Erinnerung löschen",
  list_memories: "Erinnerungen auflisten",
  homework_mode: "Hausaufgaben-Modus",
  get_system_info: "Systeminfo",
  create_setup: "Setup anlegen",
  update_setting: "Einstellung ändern",
  create_rule: "Regel erstellen",
  free_ram: "RAM freigeben",
  read_emails: "E-Mails lesen",
  mark_email: "E-Mail markieren",
  compose_email: "E-Mail verfassen",
  read_calendar: "Kalender lesen",
  create_appointment: "Termin erstellen",
  list_devices: "Geräte auflisten",
  scan_network: "Netzwerk scannen",
  list_connections: "Verbindungen auflisten",
  get_system_status: "System-Status",
  search_web: "Web-Suche",
  web_search: "Web-Suche",
  fetch_url: "URL abrufen",
  get_weather: "Wetter abrufen",
  get_location: "Standort ermitteln",
  get_datetime: "Datum & Uhrzeit",
  delete_files: "Dateien löschen",
  load_setup: "Setup laden",
  format_drive: "Laufwerk formatieren",
  rename_drive: "Laufwerk umbenennen",
  list_programs: "Programme auflisten",
  pause_ella: "ELLA pausieren",
  shutdown_system: "PC herunterfahren",
  play_music: "Musik spielen",
  search_files: "Dateien suchen",
  open_file: "Datei öffnen",
  explore_folder: "Ordner öffnen",
  rename_file: "Datei umbenennen",
  copy_file: "Datei kopieren",
  create_folder: "Ordner erstellen",
  create_document: "Dokument erstellen",
  dictate_to_document: "Text diktieren",
  list_processes: "Prozesse auflisten",
  kill_process: "Prozess beenden",
  set_volume: "Lautstärke setzen",
  get_clipboard: "Zwischenablage lesen",
  set_clipboard: "Zwischenablage setzen",
  set_reminder: "Erinnerung setzen",
  list_reminders: "Erinnerungen auflisten",
  delete_reminder: "Erinnerung löschen",
  set_alarm: "Wecker stellen",
  list_alarms: "Wecker auflisten",
  delete_alarm: "Wecker löschen",
  take_screenshot: "Screenshot",
  write_for_me: "Text schreiben",
  find_duplicates: "Duplikate suchen",
  list_autostart: "Autostart auflisten",
  read_gmail: "Gmail lesen",
  mark_gmail: "Gmail markieren",
  read_google_calendar: "Google Kalender",
  create_google_appointment: "Google Termin",
  add_task: "Aufgabe anlegen",
  list_tasks: "Aufgaben auflisten",
  complete_task: "Aufgabe erledigt",
  delete_task: "Aufgabe löschen",
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
  const [confirmationCard, setConfirmationCard] = useState<{
    message: string;
    pendingAction: PendingAction;
  } | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const usedToolsRef = useRef<string[]>([]);

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
  const accessibilityModeRef = useRef<"none" | "blind" | "deaf">("none");
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentAbortRef = useRef<AbortController | null>(null);
  const ttsQueueRef = useRef<string[]>([]);
  const ttsQueueBusyRef = useRef(false);
  const ttsQueueAbortRef = useRef<AbortController | null>(null);
  useEffect(() => {
    ttsEnabledRef.current = ttsEnabled;
  }, [ttsEnabled]);

  const stopCurrentAudio = useCallback(() => {
    if (currentAbortRef.current) {
      currentAbortRef.current.abort();
      currentAbortRef.current = null;
    }
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    // Stop stream TTS queue
    ttsQueueAbortRef.current?.abort();
    ttsQueueAbortRef.current = null;
    ttsQueueRef.current = [];
    ttsQueueBusyRef.current = false;
    window.speechSynthesis.cancel();
  }, []);

  const speakEdge = useCallback(
    async (text: string) => {
      const clean = cleanTextForTTS(text);
      if (!clean) return;
      stopCurrentAudio();
      const abort = new AbortController();
      currentAbortRef.current = abort;
      try {
        const voice = ttsVoiceRef.current || "de-DE-KatjaNeural";
        const res = await fetch(`${API}/api/speech/synthesize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: clean, voice }),
          signal: abort.signal,
        });
        if (abort.signal.aborted) return;
        if (!res.ok) throw new Error(`TTS HTTP ${res.status}`);
        const blob = await res.blob();
        if (abort.signal.aborted) return;
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        currentAudioRef.current = audio;
        audio.onended = () => {
          URL.revokeObjectURL(url);
          if (currentAudioRef.current === audio) currentAudioRef.current = null;
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          if (currentAudioRef.current === audio) currentAudioRef.current = null;
        };
        await audio.play();
      } catch {
        // silent fail — kein Fallback auf andere TTS-Engine
      }
    },
    [stopCurrentAudio],
  );

  // Web Audio API — kurze Töne für Blind-Modus-Feedback
  const playTone = useCallback(
    (frequency: number, durationMs: number, volume = 0.12) => {
      if (accessibilityModeRef.current !== "blind") return;
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = frequency;
        osc.type = "sine";
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + durationMs / 1000,
        );
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + durationMs / 1000);
        osc.onended = () => ctx.close();
      } catch {
        // Audio API nicht verfügbar
      }
    },
    [],
  );

  const speak = useCallback(
    (text: string) => {
      if (accessibilityModeRef.current === "deaf") return;
      if (!ttsEnabledRef.current && accessibilityModeRef.current !== "blind")
        return;
      speakEdge(text);
    },
    [speakEdge],
  );

  // Stream TTS: play sentences back-to-back as they arrive from the LLM stream
  const drainTTSQueue = useCallback(async () => {
    if (ttsQueueBusyRef.current) return;
    ttsQueueBusyRef.current = true;
    const abort = new AbortController();
    ttsQueueAbortRef.current = abort;
    while (ttsQueueRef.current.length > 0 && !abort.signal.aborted) {
      const sentence = ttsQueueRef.current.shift()!;
      const clean = sentence
        .replace(/[*_`#>~]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (!clean) continue;
      try {
        const voice = ttsVoiceRef.current || "de-DE-KatjaNeural";
        const res = await fetch(`${API}/api/speech/synthesize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: clean, voice }),
          signal: abort.signal,
        });
        if (!res.ok || abort.signal.aborted) break;
        const blob = await res.blob();
        if (abort.signal.aborted) break;
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        currentAudioRef.current = audio;
        await new Promise<void>((resolve) => {
          audio.onended = () => {
            URL.revokeObjectURL(url);
            resolve();
          };
          audio.onerror = () => {
            URL.revokeObjectURL(url);
            resolve();
          };
          audio.play().catch(() => resolve());
        });
      } catch {
        // skip sentence on error
      }
    }
    ttsQueueBusyRef.current = false;
    ttsQueueAbortRef.current = null;
  }, []);

  const enqueueTTS = useCallback(
    (sentence: string) => {
      if (accessibilityModeRef.current === "deaf") return;
      if (!ttsEnabledRef.current && accessibilityModeRef.current !== "blind")
        return;
      ttsQueueRef.current.push(sentence);
      void drainTTSQueue();
    },
    [drainTTSQueue],
  );

  /* Pause-Modus */
  const [isPaused, setIsPaused] = useState(false);
  const [pauseEndsAt, setPauseEndsAt] = useState<Date | null>(null);
  const [feedback, setFeedback] = useState<
    Record<number, "positive" | "negative">
  >({});
  const [pauseCountdown, setPauseCountdown] = useState("");
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pauseTickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* Voice state — Whisper (lokal, kein Google) */
  const [voiceMode, setVoiceMode] = useState<VoiceMode>("off");
  const [micActive, setMicActive] = useState(false);
  const [micStatus, setMicStatus] = useState("");
  const [awaitingCommand, setAwaitingCommand] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const vadRef = useRef<AudioVAD | null>(null);
  const awaitingCommandRef = useRef(false);
  const awaitingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [wakeListening, setWakeListening] = useState(false);
  const loadingRef = useRef(false);
  const lastWakewordTimeRef = useRef<number>(0);
  const segmentProcessingRef = useRef(false);

  /* ── Worker-Events (Alerts) ── */
  useEffect(() => {
    let es: EventSource;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let dead = false;

    function connect() {
      if (dead) return;
      es = new EventSource(`${API}/api/events/stream`);
      es.onerror = () => {
        es.close();
        if (!dead) reconnectTimer = setTimeout(connect, 5000);
      };
      es.onmessage = handler;
    }

    function onVisible() {
      if (document.visibilityState === "visible") {
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }
        try {
          es?.close();
        } catch {
          /* noop */
        }
        connect();
      }
    }

    function handler(e: MessageEvent<string>) {
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
        // Port-Alerts und reine Zahlen-Meldungen nicht vorlesen — nur kritische Fehler
        const isPortAlert = /port|firewall/i.test(message);
        if (!isPortAlert) speakEdge(message);
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
      } else if (ev.type === "proactive_message") {
        const msg = (ev.payload.message as string) ?? "";
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: msg, proactive: true },
        ]);
        speakEdge(msg);
      }
    }

    connect();
    document.addEventListener("visibilitychange", onVisible);

    // Begrüßung vom Main-Process
    const removeSpeak = (
      window as unknown as {
        electronAPI?: { onSpeak?: (cb: (text: string) => void) => () => void };
      }
    ).electronAPI?.onSpeak?.((text) => speakEdge(text));

    // Hintergrund-Modus: nur UI-Signal — kein Modewechsel, VAD läuft durch
    const removeBackground = (
      window as unknown as {
        electronAPI?: {
          onBackground?: (cb: (v: boolean) => void) => () => void;
        };
      }
    ).electronAPI?.onBackground?.((_isBackground) => {
      // Absichtlich leer — ELLA hört immer, egal ob Tray oder Fenster
    });

    return () => {
      dead = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      document.removeEventListener("visibilitychange", onVisible);
      try {
        es?.close();
      } catch {
        /* noop */
      }
      removeSpeak?.();
      removeBackground?.();
    };
  }, [speakEdge]);

  /* ── Pausenmodus ── */
  const resumeFromPause = useCallback(() => {
    setIsPaused(false);
    setPauseEndsAt(null);
    setPauseCountdown("");
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
    if (pauseTickRef.current) {
      clearInterval(pauseTickRef.current);
      pauseTickRef.current = null;
    }
    setVoiceMode(pausedVoiceModeRef.current); // Wakeword wiederherstellen
    speakEdge("Ich bin wieder da.");
  }, [speakEdge]);

  const pausedVoiceModeRef = useRef<VoiceMode>("off");

  const activatePause = useCallback(
    (minutes: number, currentVoiceMode: VoiceMode) => {
      pausedVoiceModeRef.current = currentVoiceMode;
      setVoiceMode("off"); // Wakeword deaktivieren
      const endsAt = new Date(Date.now() + minutes * 60 * 1000);
      setIsPaused(true);
      setPauseEndsAt(endsAt);

      const fmt = (d: Date) => {
        const diff = Math.max(0, d.getTime() - Date.now());
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        return `${m}:${s.toString().padStart(2, "0")}`;
      };
      setPauseCountdown(fmt(endsAt));
      pauseTickRef.current = setInterval(
        () => setPauseCountdown(fmt(endsAt)),
        1000,
      );

      pauseTimerRef.current = setTimeout(
        () => resumeFromPause(),
        minutes * 60 * 1000,
      );
    },
    [resumeFromPause],
  );

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
      if (!text || loadingRef.current) return;
      loadingRef.current = true; // sofort sperren — verhindert parallele Aufrufe vor React-Re-Render
      stopCurrentAudio();
      setMessages((p) => [...p, { role: "user", content: text }]);
      setInput("");
      setLoading(true);
      setError("");
      setStreaming("");
      setToolStatus("");
      usedToolsRef.current = [];

      const isVoice = voiceMode === "always" || voiceMode === "wakeword";
      const streamAbort = new AbortController();
      const streamTimeout = setTimeout(() => streamAbort.abort(), 90_000);
      let sentenceBuffer = "";
      try {
        const res = await fetch(`${API}/api/chat/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            sessionId: SESSION_ID,
            isVoice,
          }),
          signal: streamAbort.signal,
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
              // Stream TTS: enqueue complete sentences as they arrive
              sentenceBuffer += ev.text;
              const sentenceRe = /[^.!?]*[.!?]+(?:\s|$)/g;
              let m: RegExpExecArray | null;
              let consumed = 0;
              while ((m = sentenceRe.exec(sentenceBuffer)) !== null) {
                const s = m[0].trim();
                if (s.length >= 8) enqueueTTS(s);
                consumed = m.index + m[0].length;
              }
              if (consumed > 0) sentenceBuffer = sentenceBuffer.slice(consumed);
            } else if (ev.type === "tool") {
              setToolStatus(TOOL_LABELS[ev.name] ?? ev.name);
              if (!usedToolsRef.current.includes(ev.name))
                usedToolsRef.current.push(ev.name);
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
            } else if (ev.type === "pause") {
              activatePause(ev.minutes, voiceMode);
            } else if (ev.type === "confirmation_required") {
              setConfirmationCard({
                message: ev.message,
                pendingAction: ev.pendingAction,
              });
              setMessages((p) => [
                ...p,
                { role: "assistant", content: ev.message },
              ]);
              setStreaming("");
              setToolStatus("");
              break outer;
            } else if (ev.type === "done") {
              const tools = [...usedToolsRef.current];
              usedToolsRef.current = [];
              setMessages((p) => [
                ...p,
                {
                  role: "assistant",
                  content: full,
                  usedTools: tools.length > 0 ? tools : undefined,
                },
              ]);
              setStreaming("");
              setToolStatus("");
              playTone(440, 200);
              // Flush remaining sentence buffer, then fall back to speak() if queue unused
              if (sentenceBuffer.trim().length >= 2)
                enqueueTTS(sentenceBuffer.trim());
              sentenceBuffer = "";
              if (
                ttsQueueRef.current.length === 0 &&
                !ttsQueueBusyRef.current
              ) {
                speak(full);
              }
              break outer;
            } else if (ev.type === "error") throw new Error(ev.message);
          }
        }
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") {
          setError("Keine Antwort — bitte nochmal versuchen.");
        } else {
          setError(e instanceof Error ? e.message : "Unbekannter Fehler");
        }
        setStreaming("");
        setToolStatus("");
      } finally {
        clearTimeout(streamTimeout);
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [speak, voiceMode, activatePause, enqueueTTS],
  );

  const send = useCallback(() => sendText(input.trim()), [input, sendText]);

  const sendFeedback = useCallback(
    async (idx: number, rating: "positive" | "negative", content: string) => {
      if (feedback[idx]) return;
      setFeedback((prev) => ({ ...prev, [idx]: rating }));
      fetch(`${API}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: SESSION_ID,
          messageExcerpt: content.slice(0, 300),
          feedback: rating,
        }),
      }).catch(() => {});
    },
    [feedback],
  );

  /* ── Spracheingabe (Web Speech API, kein OpenAI nötig) ── */
  const startRecording = useCallback(() => {
    playTone(880, 120); // Blind-Modus: Ton → ELLA hört jetzt zu
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR =
      (window as any).SpeechRecognition ??
      (window as any).webkitSpeechRecognition;
    if (SR) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recog: any = new SR();
      recog.lang = "de-DE";
      recog.continuous = false;
      recog.interimResults = false;
      recog.onstart = () => {
        setMicActive(true);
        setMicStatus("Höre zu…");
      };
      recog.onresult = (
        ev: // eslint-disable-next-line @typescript-eslint/no-explicit-any
        any,
      ) => {
        const text = ev.results[0][0].transcript.trim();
        if (text) setInput(text);
      };
      recog.onerror = (
        ev: // eslint-disable-next-line @typescript-eslint/no-explicit-any
        any,
      ) => {
        const msg =
          ev.error === "no-speech" ? "Nichts gehört" : `Mikrofon: ${ev.error}`;
        setMicStatus(msg);
        setTimeout(() => setMicStatus(""), 3000);
      };
      recog.onend = () => {
        setMicActive(false);
        setMicStatus("");
      };
      try {
        recog.start();
        mediaRecorderRef.current = null;
      } catch {
        setMicStatus("Spracherkennung konnte nicht gestartet werden");
        setTimeout(() => setMicStatus(""), 3000);
      }
      return;
    }
    // Fallback: MediaRecorder + Backend (braucht OpenAI-Key)
    try {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
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
            const data = (await r.json()) as { text?: string; error?: string };
            if (!r.ok) {
              setMicStatus(data.error ?? "Spracherkennung nicht verfügbar");
              setTimeout(() => setMicStatus(""), 6000);
            } else if (data.text) {
              setInput(data.text);
            } else {
              setMicStatus("Nicht verstanden — bitte nochmal");
              setTimeout(() => setMicStatus(""), 3000);
            }
          } catch {
            setMicStatus("Transkription fehlgeschlagen — bitte nochmal");
            setTimeout(() => setMicStatus(""), 3000);
          }
          setMicStatus("");
          setMicActive(false);
        };
        mr.start();
        mediaRecorderRef.current = mr;
        setMicActive(true);
        setMicStatus("Aufnahme…");
      });
    } catch (err) {
      const msg = err instanceof Error ? err.name : "Unbekannt";
      setMicStatus(`Mikrofon: ${msg}`);
      console.error("[MIC] getUserMedia fehlgeschlagen:", err);
      setTimeout(() => setMicStatus(""), 5000);
    }
  }, [playTone]);

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
    if (voiceMode !== "wakeword" && voiceMode !== "always") {
      vadRef.current?.stop();
      vadRef.current = null;
      setWakeListening(false);
      setMicStatus("");
      return;
    }

    /* ── Always-on mode: Web Speech API (kein OpenAI nötig) ── */
    if (voiceMode === "always") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SR =
        (window as any).SpeechRecognition ??
        (window as any).webkitSpeechRecognition;
      if (!SR) {
        setMicStatus("Spracherkennung nicht unterstützt");
        setTimeout(() => setMicStatus(""), 5000);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recog: any = new SR();
      recog.lang = "de-DE";
      recog.continuous = true;
      recog.interimResults = false;
      recog.maxAlternatives = 1;
      let stopped = false;

      recog.onstart = () => {
        setWakeListening(true);
        setMicStatus("");
      };
      recog.onresult = (
        ev: // eslint-disable-next-line @typescript-eslint/no-explicit-any
        any,
      ) => {
        const text = ev.results[ev.results.length - 1][0].transcript.trim();
        if (text && !loadingRef.current) {
          sendText(text);
        }
      };
      recog.onerror = (
        ev: // eslint-disable-next-line @typescript-eslint/no-explicit-any
        any,
      ) => {
        if (ev.error !== "no-speech" && ev.error !== "aborted") {
          setMicStatus(`Mikrofon: ${ev.error}`);
          setTimeout(() => setMicStatus(""), 4000);
        }
      };
      recog.onend = () => {
        // Automatisch neu starten solange Freihand-Modus aktiv
        if (!stopped) {
          try {
            recog.start();
          } catch {
            /* ignorieren */
          }
        }
      };

      try {
        recog.start();
      } catch {
        setMicStatus("Spracherkennung konnte nicht gestartet werden");
        setTimeout(() => setMicStatus(""), 5000);
      }

      return () => {
        stopped = true;
        recog.onend = null;
        try {
          recog.stop();
        } catch {
          /* ignorieren */
        }
        setWakeListening(false);
        setMicStatus("");
      };
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
          // Skip if previous segment is still being processed
          const blob = encodeWav(audio, sampleRate);
          const form = new FormData();
          form.append("audio", blob, "segment.wav");
          try {
            // Phase 2: wakeword confirmed — transcribe as command
            if (awaitingCommandRef.current) {
              awaitingCommandRef.current = false;
              setAwaitingCommand(false);
              if (awaitingTimerRef.current) {
                clearTimeout(awaitingTimerRef.current);
                awaitingTimerRef.current = null;
              }
              setMicStatus("Transkribiere…");
              let clean = "";
              try {
                const r = await fetch(`${API}/api/speech/transcribe`, {
                  method: "POST",
                  body: form,
                });
                const data = (await r.json()) as {
                  text?: string;
                  error?: string;
                };
                if (!r.ok) {
                  setMicStatus(data.error ?? "Spracherkennung nicht verfügbar");
                  setTimeout(() => setMicStatus(""), 6000);
                  return;
                }
                clean = (data.text ?? "").trim();
              } catch {
                setMicStatus("Transkription fehlgeschlagen — bitte nochmal");
                setTimeout(() => setMicStatus(""), 3000);
                return;
              }
              console.log(
                "[WAKEWORD Phase 2] transkribiert:",
                JSON.stringify(clean),
              );
              if (clean && !HALLUCINATION_RE.test(clean)) {
                sendText(clean);
              } else {
                setMicStatus("Nicht verstanden — bitte nochmal");
                setTimeout(() => setMicStatus(""), 3000);
              }
              return;
            }

            // Phase 1: fast wakeword check via ONNX model
            const wakeR = await fetch(`${API}/api/wakeword/detect`, {
              method: "POST",
              body: form,
            });
            const { detected, score } = (await wakeR.json()) as {
              detected: boolean;
              score: number;
            };
            console.log(
              `[WAKEWORD] score=${score.toFixed(4)} detected=${detected}`,
            );

            if (!detected) return;

            // Cooldown: ignore repeated wakewords within 3 seconds
            const now = Date.now();
            if (now - lastWakewordTimeRef.current < 3000) {
              console.log("[WAKEWORD] Cooldown aktiv — ignoriert");
              return;
            }
            lastWakewordTimeRef.current = now;

            // Wakeword confirmed — transcribe same audio for inline command
            const form2 = new FormData();
            form2.append("audio", blob, "segment.wav");
            const trR = await fetch(`${API}/api/speech/transcribe`, {
              method: "POST",
              body: form2,
            });
            const trData = (await trR.json()) as {
              text?: string;
              error?: string;
            };
            if (!trR.ok) {
              setMicStatus(trData.error ?? "Spracherkennung nicht verfügbar");
              setTimeout(() => setMicStatus(""), 6000);
              return;
            }
            const clean = (trData.text ?? "").trim();

            if (clean && !HALLUCINATION_RE.test(clean)) {
              const command = clean.replace(/^.*?el+a+[,.\s!?]*/i, "").trim();
              if (command) {
                sendText(command);
                return;
              }
            }

            // No inline command — wait for next segment
            awaitingCommandRef.current = true;
            setAwaitingCommand(true);
            lastWakewordTimeRef.current = Date.now();
            setMicStatus("");
            awaitingTimerRef.current = setTimeout(() => {
              awaitingCommandRef.current = false;
              setAwaitingCommand(false);
              awaitingTimerRef.current = null;
            }, 15000);
          } catch (err) {
            console.error("[WAKEWORD] Segment-Fehler:", err);
            awaitingCommandRef.current = false;
            setAwaitingCommand(false);
          } finally {
            if (!awaitingCommandRef.current) setMicStatus("");
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
        accessibilityMode?: "none" | "blind" | "deaf";
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
        accessibilityModeRef.current = s.accessibilityMode ?? "none";
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
              if (!next) stopCurrentAudio();
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
                whiteSpace: m.role === "user" ? "pre-wrap" : "normal",
              }}
            >
              {m.role === "user" ? (
                m.content
              ) : (
                <div
                  className="ella-md"
                  dangerouslySetInnerHTML={{
                    __html: marked(m.content, { async: false }) as string,
                  }}
                />
              )}
              {m.role === "assistant" &&
                m.usedTools &&
                m.usedTools.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 4,
                      marginTop: 8,
                    }}
                  >
                    {m.usedTools.map((t) => (
                      <span
                        key={t}
                        title={t}
                        style={{
                          fontSize: "0.68rem",
                          background: "#0f1117",
                          border: "1px solid #2d3148",
                          borderRadius: 4,
                          padding: "1px 6px",
                          color: "#64748b",
                        }}
                      >
                        {TOOL_LABELS[t] ?? t}
                      </span>
                    ))}
                  </div>
                )}
              {m.role === "assistant" && !m.proactive && (
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    marginTop: 6,
                    opacity: feedback[i] ? 1 : 0.35,
                    transition: "opacity 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLDivElement).style.opacity = "1")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLDivElement).style.opacity =
                      feedback[i] ? "1" : "0.35")
                  }
                >
                  {(["positive", "negative"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => sendFeedback(i, r, m.content)}
                      disabled={Boolean(feedback[i])}
                      title={r === "positive" ? "Hilfreich" : "Nicht hilfreich"}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: feedback[i] ? "default" : "pointer",
                        fontSize: "0.75rem",
                        padding: "2px 4px",
                        borderRadius: 4,
                        color:
                          feedback[i] === r
                            ? r === "positive"
                              ? "#4ade80"
                              : "#f87171"
                            : "#64748b",
                      }}
                    >
                      {r === "positive" ? "👍" : "👎"}
                    </button>
                  ))}
                </div>
              )}
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
        @keyframes blink     { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes pulse     { 0%,100%{opacity:0.4} 50%{opacity:1} }
        @keyframes countdown { from{width:100%} to{width:0%} }
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

      {/* Pausenmodus-Indikator */}
      {isPaused && pauseEndsAt && (
        <div
          style={{
            background: "#1e1b4b",
            border: "1px solid #7c6af7",
            borderRadius: 8,
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            fontSize: "0.85rem",
            color: "#a5b4fc",
          }}
        >
          <span>⏸ Pausiert — {pauseCountdown}</span>
          <button
            onClick={resumeFromPause}
            style={{
              background: "transparent",
              border: "1px solid #7c6af7",
              borderRadius: 4,
              color: "#a5b4fc",
              padding: "3px 10px",
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            Jetzt zurück
          </button>
        </div>
      )}

      {/* Sprachstatus-Anzeige */}
      {(voiceMode === "wakeword" || voiceMode === "always") &&
        wakeListening && (
          <div style={{ minHeight: 28 }}>
            {awaitingCommand ? (
              /* "Jetzt sprechen" — grün, prominent, mit Ablauf-Balken */
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "#22c55e",
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      display: "inline-block",
                      background: "#22c55e",
                      animation: "pulse 0.8s ease-in-out infinite",
                    }}
                  />
                  Jetzt sprechen…
                </div>
                <div
                  style={{
                    height: 2,
                    background: "#1e2d3d",
                    borderRadius: 1,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      background: "#22c55e",
                      borderRadius: 1,
                      animation: "countdown 15s linear forwards",
                    }}
                  />
                </div>
              </div>
            ) : micStatus ? (
              /* Aktiver Mic-Status: Erkenne / Transkribiere */
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
                    animation: "pulse 1.2s ease-in-out infinite",
                  }}
                />
                {micStatus}
              </div>
            ) : (
              /* Idle — lauscht */
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
          </div>
        )}

      {/* Confirmation Card */}
      {confirmationCard && (
        <div
          style={{
            background: "#1a1f2e",
            border: "1px solid #f59e0b",
            borderRadius: 10,
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontWeight: 600,
              color: "#f59e0b",
              fontSize: "0.85rem",
            }}
          >
            <span>⚠</span>
            Bestätigung erforderlich
          </div>
          <div
            style={{ color: "#e2e8f0", fontSize: "0.82rem", lineHeight: 1.5 }}
          >
            {confirmationCard.message}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              disabled={confirmBusy}
              onClick={async () => {
                setConfirmBusy(true);
                try {
                  const res = await fetch(`${API}/api/tools/confirm`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(confirmationCard.pendingAction),
                  });
                  const result = (await res.json()) as {
                    success: boolean;
                    output?: unknown;
                    error?: string;
                  };
                  const msg = result.success
                    ? typeof result.output === "string"
                      ? result.output
                      : "Aktion erfolgreich ausgeführt."
                    : `Fehler: ${result.error ?? "Unbekannt"}`;
                  setMessages((p) => [
                    ...p,
                    { role: "assistant", content: msg },
                  ]);
                } catch {
                  setMessages((p) => [
                    ...p,
                    { role: "assistant", content: "Aktion fehlgeschlagen." },
                  ]);
                } finally {
                  setConfirmationCard(null);
                  setConfirmBusy(false);
                }
              }}
              style={{
                background: "#ef4444",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "6px 16px",
                fontWeight: 600,
                cursor: confirmBusy ? "not-allowed" : "pointer",
                fontSize: "0.82rem",
                opacity: confirmBusy ? 0.6 : 1,
              }}
            >
              {confirmBusy ? "Wird ausgeführt…" : "Ja, ausführen"}
            </button>
            <button
              disabled={confirmBusy}
              onClick={() => setConfirmationCard(null)}
              style={{
                background: "transparent",
                color: "#94a3b8",
                border: "1px solid #334155",
                borderRadius: 6,
                padding: "6px 16px",
                cursor: "pointer",
                fontSize: "0.82rem",
              }}
            >
              Abbrechen
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
