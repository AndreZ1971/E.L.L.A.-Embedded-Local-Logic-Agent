import React, { useState, useRef, useEffect, useCallback } from "react";
import { marked } from "marked";
import { useTranslation } from "react-i18next";
import { AudioVAD, encodeWav } from "../../utils/audioVAD.js";
import AvatarPanel from "../../components/AvatarPanel";
import { apiFetch, eventStreamUrl } from "../../lib/api";
import { useAppearance } from "../../hooks/useAppearance";
import { useHudData } from "../../hooks/useHudData";
import HudWidgetSlot from "../../components/hud/HudWidgetSlot";
import { DEFAULT_HUD_WIDGETS } from "../../components/hud/widgetRegistry";

type VoiceMode = "off" | "manual" | "wakeword" | "always" | "dictation";

// Stop-Wörter zum Unterbrechen der TTS-Sprachausgabe
const STOP_INTERRUPT_RE =
  /^(stopp?|halt|sei still|ruhig|leise|quiet|stop it|shut up|still)[\s!.]*$/i;

const FOLLOW_UP_MS = 8_000;

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
  proactiveCategory?: string;
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
  | { type: "homework_status"; active: boolean; configured: boolean }
  | { type: "done" }
  | { type: "error"; message: string };

const SESSION_ID = "default";

/* ── Component ───────────────────────────────────────────────────────── */
const Chat: React.FC = () => {
  const { t } = useTranslation();
  const appearance = useAppearance();
  const isHud =
    appearance.effective === "hud" || appearance.effective === "show";
  const isShow = appearance.effective === "show";
  const [hudTelemetryEnabled, setHudTelemetryEnabled] = useState(true);
  const [hudWidgets, setHudWidgets] = useState(DEFAULT_HUD_WIDGETS);
  const hudData = useHudData(isHud, hudTelemetryEnabled);
  const toolLabel = (name: string) =>
    t(`tools.${name}`, { defaultValue: name });
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
  const [accessibilityMode, setAccessibilityMode] = useState<
    "none" | "blind" | "deaf"
  >("none");
  const accessibilityModeRef = useRef<"none" | "blind" | "deaf">("none");
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentAbortRef = useRef<AbortController | null>(null);
  const ttsQueueRef = useRef<string[]>([]);
  const ttsQueueBusyRef = useRef(false);
  const ttsQueueAbortRef = useRef<AbortController | null>(null);
  // true while TTS audio is playing — prevents STT echo loop in Freihand mode
  const ttsSpeakingRef = useRef(false);
  const [ttsActive, setTtsActive] = useState(false);
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
    ttsSpeakingRef.current = false;
    setTtsActive(false);
  }, []);

  useEffect(() => {
    stopCurrentAudioRef.current = stopCurrentAudio;
  }, [stopCurrentAudio]);

  const speakEdge = useCallback(
    async (text: string) => {
      const clean = cleanTextForTTS(text);
      if (!clean) return;
      stopCurrentAudio();
      const abort = new AbortController();
      currentAbortRef.current = abort;
      try {
        const res = await apiFetch("/api/speech/synthesize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: clean }),
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
          if (currentAudioRef.current === audio) {
            currentAudioRef.current = null;
            ttsSpeakingRef.current = false;
            setTtsActive(false);
            const fu = Date.now() + FOLLOW_UP_MS;
            followUpUntilRef.current = fu;
            setFollowUpUntil(fu);
          }
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          if (currentAudioRef.current === audio) {
            currentAudioRef.current = null;
            ttsSpeakingRef.current = false;
            setTtsActive(false);
          }
        };
        ttsSpeakingRef.current = true;
        setTtsActive(true);
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
      const clean = cleanTextForTTS(sentence);
      if (!clean) continue;
      try {
        const res = await apiFetch("/api/speech/synthesize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: clean }),
          signal: abort.signal,
        });
        if (!res.ok || abort.signal.aborted) break;
        const blob = await res.blob();
        if (abort.signal.aborted) break;
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        currentAudioRef.current = audio;
        ttsSpeakingRef.current = true;
        setTtsActive(true);
        await new Promise<void>((resolve) => {
          audio.onended = () => {
            URL.revokeObjectURL(url);
            ttsSpeakingRef.current = false;
            setTtsActive(false);
            resolve();
          };
          audio.onerror = () => {
            URL.revokeObjectURL(url);
            ttsSpeakingRef.current = false;
            setTtsActive(false);
            resolve();
          };
          audio.play().catch(() => {
            ttsSpeakingRef.current = false;
            setTtsActive(false);
            resolve();
          });
        });
      } catch {
        // skip sentence on error
      }
    }
    const fu2 = Date.now() + FOLLOW_UP_MS;
    followUpUntilRef.current = fu2;
    setFollowUpUntil(fu2);
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
  const sendTextRef = useRef<(t: string) => void>(() => {});
  const awaitingCommandRef = useRef(false);
  const awaitingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [wakeListening, setWakeListening] = useState(false);
  const loadingRef = useRef(false);
  const lastWakewordTimeRef = useRef<number>(0);
  const stressLevelRef = useRef<"low" | "medium" | "high">("low");
  const [stressLevel, setStressLevel] = useState<"low" | "medium" | "high">(
    "low",
  );
  const followUpUntilRef = useRef<number>(0);
  const [followUpUntil, setFollowUpUntil] = useState(0);
  const stopCurrentAudioRef = useRef<() => void>(() => {});

  /* ── Worker-Events (Alerts) ── */
  useEffect(() => {
    let es: EventSource;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let dead = false;

    function connect() {
      if (dead) return;
      es = new EventSource(eventStreamUrl());
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
        const cat = (ev.payload.category as string) ?? "";
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: msg,
            proactive: true,
            proactiveCategory: cat,
          },
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

  /* ── Globaler Hotkey: Ctrl+Shift+D → Diktat-Modus togglen ── */
  useEffect(() => {
    const remove = (
      window as unknown as {
        electronAPI?: { onToggleDictation?: (cb: () => void) => () => void };
      }
    ).electronAPI?.onToggleDictation?.(() => {
      setVoiceMode((prev) => {
        const next = prev === "dictation" ? "off" : "dictation";
        apiFetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ voiceMode: next }),
        }).catch(() => {});
        return next;
      });
    });
    return () => remove?.();
  }, []);

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
    apiFetch(`/api/chat/history/${SESSION_ID}`)
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
        const res = await apiFetch("/api/chat/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            sessionId: SESSION_ID,
            isVoice,
            stressLevel: isVoice ? stressLevelRef.current : undefined,
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
              setToolStatus(toolLabel(ev.name));
              if (!usedToolsRef.current.includes(ev.name))
                usedToolsRef.current.push(ev.name);
            } else if (ev.type === "directive_deny") {
              setDirectiveDeny(ev.tool);
              setToolStatus("");
              setMessages((p) => [
                ...p,
                {
                  role: "directive_deny",
                  content: t("chat.directive_blocked"),
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
            } else if (ev.type === "homework_status") {
              setHomeworkActive(ev.active);
              setHomeworkConfigured(ev.configured);
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
          setError(t("chat.error_no_response"));
        } else {
          setError(e instanceof Error ? e.message : t("common.error"));
        }
        setStreaming("");
        setToolStatus("");
      } finally {
        clearTimeout(streamTimeout);
        loadingRef.current = false;
        setLoading(false);
        // Banner und Schloss-Icon sofort aktualisieren falls Tool Homework-Status geändert hat
        apiFetch("/api/homework/status")
          .then(
            (r) =>
              r.json() as Promise<{ active: boolean; configured: boolean }>,
          )
          .then((h) => {
            setHomeworkActive(h.active);
            setHomeworkConfigured(h.configured);
          })
          .catch(() => {});
      }
    },
    [speak, voiceMode, activatePause, enqueueTTS],
  );

  const send = useCallback(() => sendText(input.trim()), [input, sendText]);

  const sendFeedback = useCallback(
    async (idx: number, rating: "positive" | "negative", content: string) => {
      if (feedback[idx]) return;
      setFeedback((prev) => ({ ...prev, [idx]: rating }));
      const prevMsg = messages[idx - 1];
      const userMessage =
        prevMsg && prevMsg.role === "user" ? prevMsg.content.slice(0, 500) : "";
      apiFetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: SESSION_ID,
          messageExcerpt: content.slice(0, 300),
          feedback: rating,
          userMessage,
        }),
      }).catch(() => {});
    },
    [feedback, messages],
  );

  const [mutedCategories, setMutedCategories] = useState<
    Record<string, boolean>
  >({});

  const dismissProactive = useCallback(
    async (category: string, mute: boolean) => {
      const endpoint = mute ? "mute" : "dismiss";
      const body = mute ? { category, muted: true } : { category };
      try {
        const res = await apiFetch(`/api/proactive/${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = (await res.json()) as {
          muted?: boolean;
          message?: string;
        };
        if (data.muted) {
          setMutedCategories((prev) => ({ ...prev, [category]: true }));
        }
      } catch {
        // API nicht erreichbar
      }
    },
    [],
  );

  /* ── Spracheingabe (Web Speech API, kein OpenAI nötig) ── */
  const startRecording = useCallback(async () => {
    playTone(880, 120);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setMicStatus(t("chat.mic_transcribing"));
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const form = new FormData();
        form.append("audio", blob, "recording.webm");
        try {
          const r = await apiFetch("/api/speech/transcribe", {
            method: "POST",
            body: form,
            signal: AbortSignal.timeout(35_000),
          });
          const data = (await r.json()) as { text?: string; error?: string };
          if (!r.ok) {
            setMicStatus(data.error ?? t("chat.mic_stt_unavailable"));
            setTimeout(() => setMicStatus(""), 6000);
          } else if (data.text) {
            setInput(data.text);
          } else {
            setMicStatus(t("chat.mic_not_understood"));
            setTimeout(() => setMicStatus(""), 3000);
          }
        } catch {
          setMicStatus(t("chat.mic_failed"));
          setTimeout(() => setMicStatus(""), 3000);
        }
        setMicStatus("");
        setMicActive(false);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setMicActive(true);
      setMicStatus(t("chat.mic_recording"));
    } catch (err) {
      const msg = err instanceof Error ? err.name : "Unbekannt";
      setMicStatus(`Mikrofon: ${msg}`);
      console.error("[MIC] getUserMedia fehlgeschlagen:", err);
      setTimeout(() => setMicStatus(""), 5000);
    }
  }, [playTone, t]);

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

  useEffect(() => {
    sendTextRef.current = sendText;
  }, [sendText]);

  /* ── Wakeword-Loop (AudioVAD + Whisper) ── */
  useEffect(() => {
    if (
      voiceMode !== "wakeword" &&
      voiceMode !== "always" &&
      voiceMode !== "dictation"
    ) {
      vadRef.current?.stop();
      vadRef.current = null;
      setWakeListening(false);
      setMicStatus("");
      return;
    }

    /* ── Dictation mode: VAD + Whisper → aktives Fenster ── */
    if (voiceMode === "dictation") {
      const vad = new AudioVAD();
      vadRef.current = vad;

      vad
        .start({
          onSpeechStart: () => setMicStatus(t("chat.mic_detecting")),
          onSegment: async (audio, sampleRate) => {
            const blob = encodeWav(audio, sampleRate);
            setMicStatus("Diktiere…");
            try {
              const form = new FormData();
              form.append("audio", blob, "segment.wav");
              const r = await apiFetch("/api/speech/dictate", {
                method: "POST",
                body: form,
                signal: AbortSignal.timeout(15_000),
              });
              const data = (await r.json()) as {
                text?: string;
                typed?: boolean;
                error?: string;
              };
              if (!r.ok) {
                setMicStatus(data.error ?? "Diktat fehlgeschlagen");
                setTimeout(() => setMicStatus(""), 3000);
                return;
              }
              if (data.typed && data.text) {
                setMicStatus(
                  `✓ ${data.text.slice(0, 40)}${data.text.length > 40 ? "…" : ""}`,
                );
                setTimeout(() => setMicStatus(""), 2000);
              } else {
                setMicStatus("");
              }
            } catch {
              setMicStatus("Diktat fehlgeschlagen");
              setTimeout(() => setMicStatus(""), 3000);
            }
          },
        })
        .then(() => setWakeListening(true))
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.name : "Unbekannt";
          setMicStatus(`Mikrofon: ${msg}`);
          setTimeout(() => setMicStatus(""), 5000);
        });

      return () => {
        vad.stop();
        vadRef.current = null;
        setWakeListening(false);
        setMicStatus("");
      };
    }

    /* ── Always-on mode: VAD + Whisper (kein Wakeword nötig) ── */
    if (voiceMode === "always") {
      const vad = new AudioVAD();
      vadRef.current = vad;

      vad
        .start({
          onSpeechStart: () => setMicStatus(t("chat.mic_detecting")),
          onSegment: async (audio, sampleRate) => {
            if (loadingRef.current) {
              setMicStatus("");
              return;
            }
            const blob = encodeWav(audio, sampleRate);

            // Stop-Interrupt: während TTS nur Stop-Wörter erkennen
            if (ttsSpeakingRef.current) {
              try {
                const sf = new FormData();
                sf.append("audio", blob, "segment.wav");
                const r = await apiFetch("/api/speech/transcribe?raw=true", {
                  method: "POST",
                  body: sf,
                  signal: AbortSignal.timeout(8_000),
                });
                const d = (await r.json()) as { text?: string };
                const w = (d.text ?? "").trim();
                if (w && STOP_INTERRUPT_RE.test(w)) {
                  stopCurrentAudioRef.current();
                }
              } catch {
                /* ignore */
              }
              setMicStatus("");
              return;
            }

            const form = new FormData();
            form.append("audio", blob, "segment.wav");
            setMicStatus(t("chat.mic_transcribing_vad"));
            try {
              // Run transcription + stress analysis in parallel on the same WAV
              const stressForm = new FormData();
              stressForm.append("audio", blob, "segment.wav");
              const [r] = await Promise.all([
                apiFetch("/api/speech/transcribe?raw=true", {
                  method: "POST",
                  body: form,
                }),
                apiFetch("/api/speech/stress", {
                  method: "POST",
                  body: stressForm,
                })
                  .then((sr) => sr.json() as Promise<{ stress?: string }>)
                  .then((sd) => {
                    const lvl =
                      (sd.stress as "low" | "medium" | "high") ?? "low";
                    stressLevelRef.current = lvl;
                    setStressLevel(lvl);
                  })
                  .catch(() => {}),
              ]);
              const data = (await r.json()) as {
                text?: string;
                error?: string;
              };
              if (!r.ok) {
                setMicStatus(data.error ?? t("chat.mic_stt_unavailable"));
                setTimeout(() => setMicStatus(""), 6000);
                return;
              }
              const clean = (data.text ?? "").trim();
              if (clean && !HALLUCINATION_RE.test(clean)) {
                sendTextRef.current(clean);
              }
            } catch {
              setMicStatus(t("chat.mic_failed_vad"));
              setTimeout(() => setMicStatus(""), 3000);
            } finally {
              setMicStatus("");
            }
          },
        })
        .then(() => setWakeListening(true))
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.name : "Unbekannt";
          setMicStatus(`Mikrofon: ${msg}`);
          setTimeout(() => setMicStatus(""), 5000);
        });

      return () => {
        vad.stop();
        vadRef.current = null;
        setWakeListening(false);
        setMicStatus("");
      };
    }

    const vad = new AudioVAD();
    vadRef.current = vad;

    vad
      .start({
        onSpeechStart: () => setMicStatus(t("chat.mic_detecting")),
        onSegment: async (audio, sampleRate) => {
          if (loadingRef.current) {
            setMicStatus("");
            return;
          }
          const blob = encodeWav(audio, sampleRate);

          // Stop-Interrupt: während TTS nur Stop-Wörter erkennen
          if (ttsSpeakingRef.current) {
            try {
              const sf = new FormData();
              sf.append("audio", blob, "segment.wav");
              const r = await apiFetch("/api/speech/transcribe?raw=true", {
                method: "POST",
                body: sf,
                signal: AbortSignal.timeout(8_000),
              });
              const d = (await r.json()) as { text?: string };
              const w = (d.text ?? "").trim();
              if (w && STOP_INTERRUPT_RE.test(w)) {
                stopCurrentAudioRef.current();
              }
            } catch {
              /* ignore */
            }
            setMicStatus("");
            return;
          }

          // Follow-Up-Fenster: nach TTS direkt transkribieren ohne Wakeword
          if (followUpUntilRef.current > Date.now()) {
            followUpUntilRef.current = 0;
            setFollowUpUntil(0);
            const fuForm = new FormData();
            fuForm.append("audio", blob, "segment.wav");
            setMicStatus(t("chat.mic_transcribing_vad"));
            try {
              const r = await apiFetch("/api/speech/transcribe", {
                method: "POST",
                body: fuForm,
              });
              const data = (await r.json()) as {
                text?: string;
                error?: string;
              };
              if (!r.ok) {
                setMicStatus(data.error ?? t("chat.mic_stt_unavailable"));
                setTimeout(() => setMicStatus(""), 6000);
                return;
              }
              const clean = (data.text ?? "").trim();
              if (clean && !HALLUCINATION_RE.test(clean)) {
                sendTextRef.current(clean);
              } else {
                setMicStatus(t("chat.mic_not_understood"));
                setTimeout(() => setMicStatus(""), 3000);
              }
            } catch {
              setMicStatus(t("chat.mic_failed"));
              setTimeout(() => setMicStatus(""), 3000);
            } finally {
              setMicStatus("");
            }
            return;
          }

          const form = new FormData();
          form.append("audio", blob, "segment.wav");
          // Stress analysis on every spoken segment (fire-and-forget)
          const stressForm = new FormData();
          stressForm.append("audio", blob, "segment.wav");
          apiFetch("/api/speech/stress", {
            method: "POST",
            body: stressForm,
          })
            .then((sr) => sr.json() as Promise<{ stress?: string }>)
            .then((sd) => {
              const lvl = (sd.stress as "low" | "medium" | "high") ?? "low";
              stressLevelRef.current = lvl;
              setStressLevel(lvl);
            })
            .catch(() => {});
          try {
            // Phase 2: wakeword confirmed — transcribe as command
            if (awaitingCommandRef.current) {
              awaitingCommandRef.current = false;
              setAwaitingCommand(false);
              if (awaitingTimerRef.current) {
                clearTimeout(awaitingTimerRef.current);
                awaitingTimerRef.current = null;
              }
              setMicStatus(t("chat.mic_transcribing_vad"));
              let clean = "";
              try {
                const r = await apiFetch("/api/speech/transcribe", {
                  method: "POST",
                  body: form,
                });
                const data = (await r.json()) as {
                  text?: string;
                  error?: string;
                };
                if (!r.ok) {
                  setMicStatus(data.error ?? t("chat.mic_stt_unavailable"));
                  setTimeout(() => setMicStatus(""), 6000);
                  return;
                }
                clean = (data.text ?? "").trim();
              } catch {
                setMicStatus(t("chat.mic_failed"));
                setTimeout(() => setMicStatus(""), 3000);
                return;
              }
              console.log(
                "[WAKEWORD Phase 2] transkribiert:",
                JSON.stringify(clean),
              );
              if (clean && !HALLUCINATION_RE.test(clean)) {
                sendTextRef.current(clean);
              } else {
                setMicStatus(t("chat.mic_not_understood"));
                setTimeout(() => setMicStatus(""), 3000);
              }
              return;
            }

            // Phase 1: fast wakeword check via ONNX model
            const wakeR = await apiFetch("/api/wakeword/detect", {
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
            const trR = await apiFetch("/api/speech/transcribe", {
              method: "POST",
              body: form2,
            });
            const trData = (await trR.json()) as {
              text?: string;
              error?: string;
            };
            if (!trR.ok) {
              setMicStatus(trData.error ?? t("chat.mic_stt_unavailable"));
              setTimeout(() => setMicStatus(""), 6000);
              return;
            }
            const clean = (trData.text ?? "").trim();

            if (clean && !HALLUCINATION_RE.test(clean)) {
              const command = clean.replace(/^.*?el+a+[,.\s!?]*/i, "").trim();
              if (command) {
                sendTextRef.current(command);
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
  }, [voiceMode]);

  /* Load voiceMode + homework status on mount */
  useEffect(() => {
    Promise.all([
      apiFetch("/api/settings").then((r) => r.json()) as Promise<{
        voiceMode?: VoiceMode;
        ttsEnabled?: boolean;
        ttsVoice?: string;
        accessibilityMode?: "none" | "blind" | "deaf";
        hudTelemetry?: boolean;
        hudThrottle?: boolean;
        hudWidgets?: { left: string[]; right: string[] };
      }>,
      apiFetch("/api/homework/status").then((r) => r.json()) as Promise<{
        active: boolean;
        configured: boolean;
      }>,
    ])
      .then(([s, h]) => {
        setVoiceMode(s.voiceMode ?? "off");
        ttsEnabledRef.current = s.ttsEnabled ?? false;
        setTtsEnabled(s.ttsEnabled ?? false);
        ttsVoiceRef.current = s.ttsVoice ?? "";
        const mode = s.accessibilityMode ?? "none";
        accessibilityModeRef.current = mode;
        setAccessibilityMode(mode);
        setHudTelemetryEnabled(s.hudTelemetry !== false);
        setHudThrottle(s.hudThrottle !== false);
        if (s.hudWidgets?.left && s.hudWidgets?.right)
          setHudWidgets(s.hudWidgets);
        setHomeworkActive(h.active);
        setHomeworkConfigured(h.configured);
      })
      .catch(() => {});
  }, []);

  // Begrüßungsansage im Blind-Modus beim ersten Laden
  useEffect(() => {
    if (accessibilityMode !== "blind") return;
    const timer = setTimeout(() => {
      enqueueTTS(t("chat.welcome_blind"));
    }, 800);
    return () => clearTimeout(timer);
  }, [accessibilityMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Presentation mode — fullscreen toggle
  useEffect(() => {
    const api = (
      window as { electronAPI?: { setFullscreen?: (on: boolean) => void } }
    ).electronAPI;
    if (!api?.setFullscreen) return;
    api.setFullscreen(isShow);
    return () => {
      if (isShow) api.setFullscreen!(false);
    };
  }, [isShow]);

  // Phase G — hudThrottle: slow animations while thinking
  const [hudThrottle, setHudThrottle] = useState(false);
  useEffect(() => {
    if (!isHud) return;
    const root = document.documentElement;
    if (hudThrottle && loading) {
      root.style.setProperty("--ella-anim-speed", "0.35");
    } else {
      root.style.removeProperty("--ella-anim-speed");
    }
  }, [isHud, hudThrottle, loading]);

  const activateHomework = useCallback(async () => {
    const r = await apiFetch("/api/homework/activate", { method: "POST" });
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
      const r = await apiFetch("/api/homework/deactivate", {
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
        setPinError(d.error ?? t("chat.pin_error_wrong"));
      }
    } finally {
      setPinBusy(false);
    }
  }, [pinInput]);

  const clearHistory = async () => {
    await apiFetch(`/api/chat/history/${SESSION_ID}`, { method: "DELETE" });
    setMessages([]);
    setStreaming("");
    setToolStatus("");
    setError("");
  };

  const showMic = voiceMode !== "off" && accessibilityMode !== "deaf";

  const PRIVATE_TOOLS = new Set([
    "read_emails",
    "read_gmail",
    "read_calendar",
    "read_google_calendar",
  ]);
  const redactForShow = (text: string, tools?: string[]): string => {
    if (tools?.some((t) => PRIVATE_TOOLS.has(t)))
      return "[privat ausgeblendet]";
    return text
      .replace(/[A-Z]:\\[^\s,)]+/gi, "[Pfad]")
      .replace(/\/(?:home|Users|mnt)\/[^\s,)]+/g, "[Pfad]");
  };

  const now = Date.now();
  const isListeningNow = followUpUntil > now || awaitingCommand;
  const listenRemainingMs =
    followUpUntil > now ? followUpUntil - now : undefined;

  const hudStateText = loading
    ? t("hud.state_thinking", "DENKT")
    : ttsActive
      ? t("hud.state_speaking", "SPRICHT")
      : isListeningNow
        ? t("hud.state_listening", "HÖRT ZU")
        : stressLevel === "high"
          ? t("hud.state_stress", "STRESS")
          : t("hud.state_idle", "BEREIT");

  const hudHintText = loading
    ? toolStatus || null
    : isListeningNow && listenRemainingMs != null
      ? t("hud.hint_followup_full", { sec: Math.ceil(listenRemainingMs / 1000) })
      : null;

  const exitShow = useCallback(() => {
    if (!isShow) return;
    apiFetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appearance: "hud" }),
    }).catch(() => {});
  }, [isShow]);

  if (isHud) {
    const lastAssistant = isShow
      ? [...messages].reverse().find((m) => m.role === "assistant")
      : null;
    const tail = isShow ? [] : messages.slice(-12);

    return (
      <div
        className={
          isShow ? "hud-chat-layout hud-show-layout" : "hud-chat-layout"
        }
        onKeyDown={(e) => {
          if (isShow && e.key === "Escape") exitShow();
        }}
        tabIndex={isShow ? 0 : undefined}
      >
        {/* Show-Modus: Hinweis oben rechts */}
        {isShow && (
          <div className="hud-show-hint">Präsentation · Esc beendet</div>
        )}

        {/* Seitenpanels nur im normalen HUD, nicht im Show-Modus */}
        {!isShow && (
          <div className="hud-chat-left">
            {hudWidgets.left.map((id) => (
              <HudWidgetSlot key={id} widgetId={id} data={hudData} />
            ))}
          </div>
        )}

        <div
          className={
            isShow ? "hud-chat-center hud-show-center" : "hud-chat-center"
          }
        >
          <AvatarPanel
            isThinking={loading}
            isSpeaking={ttsActive}
            stressLevel={stressLevel}
            isListening={isListeningNow}
            listenRemainingMs={listenRemainingMs}
            hudMode
          />
          <div className="hud-state-text">
            <span className="hud-state-dot" />
            {hudStateText}
          </div>
          {hudHintText && <div className="hud-state-hint">{hudHintText}</div>}
        </div>

        {!isShow && (
          <div className="hud-chat-right">
            {hudWidgets.right.map((id) => (
              <HudWidgetSlot key={id} widgetId={id} data={hudData} />
            ))}
          </div>
        )}

        <div className="hud-chat-bottom">
          {/* Show-Modus: nur letzte ELLA-Antwort */}
          {isShow && lastAssistant && (
            <div className="hud-subtitle">
              <span className="hud-subtitle-prefix">E.L.L.A. ›</span>
              {redactForShow(
                lastAssistant.content
                  .replace(/\*\*([^*]+)\*\*/g, "$1")
                  .replace(/`([^`]+)`/g, "$1"),
                lastAssistant.usedTools,
              ).substring(0, 300)}
              {lastAssistant.usedTools?.map((tool) => (
                <span
                  key={tool}
                  className="hud-subtitle-tool hud-subtitle-tool--ok"
                >
                  [{toolLabel(tool)} ✓]
                </span>
              ))}
            </div>
          )}
          {/* Normaler HUD: letzte 12 Nachrichten */}
          {!isShow &&
            tail.map((m, i) => (
              <div
                key={i}
                className={`hud-subtitle${m.role === "user" ? " hud-subtitle--user" : ""}`}
              >
                <span className="hud-subtitle-prefix">
                  {m.role === "user" ? "DU ›" : "E.L.L.A. ›"}
                </span>
                {m.content
                  .replace(/\*\*([^*]+)\*\*/g, "$1")
                  .replace(/`([^`]+)`/g, "$1")
                  .substring(0, 200)}
                {m.usedTools?.map((tool) => (
                  <span
                    key={tool}
                    className="hud-subtitle-tool hud-subtitle-tool--ok"
                  >
                    [{toolLabel(tool)} ✓]
                  </span>
                ))}
              </div>
            ))}
          {streaming && (
            <div className="hud-subtitle">
              <span className="hud-subtitle-prefix">E.L.L.A. ›</span>
              {(isShow ? redactForShow(streaming) : streaming).substring(
                0,
                200,
              )}
            </div>
          )}
          {loading && !streaming && !toolStatus && (
            <div className="hud-subtitle">
              <span className="hud-subtitle-prefix">E.L.L.A. ›</span>
              {t("chat.thinking")}
            </div>
          )}
          {toolStatus && (
            <div className="hud-subtitle">
              <span className="hud-subtitle-prefix">TOOL ›</span>
              {toolStatus}
            </div>
          )}
          <div className="hud-input-row">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              aria-label={t("chat.aria_input")}
              placeholder={
                micActive ? t("chat.placeholder_mic") : t("chat.placeholder")
              }
              disabled={loading}
            />
            {showMic && (
              <button
                onClick={toggleMic}
                aria-label={t(
                  micActive ? "chat.aria_mic_on" : "chat.aria_mic_off",
                )}
                style={{
                  background: micActive
                    ? "var(--ella-accent)"
                    : "var(--ella-surface)",
                  border: micActive ? "none" : "1px solid var(--ella-border)",
                  color: micActive ? "var(--ella-bg)" : "var(--ella-text-dim)",
                }}
              >
                {micActive ? "◉" : "○"}
              </button>
            )}
            <button
              onClick={send}
              aria-label={t("chat.aria_send")}
              disabled={loading || !input.trim()}
            >
              {t("chat.send")}
            </button>
          </div>
          <div ref={bottomRef} />
        </div>

        {/* PIN-Dialog (shared) */}
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
                background: "var(--ella-surface)",
                border: "1px solid var(--ella-border)",
                borderRadius: 10,
                padding: 24,
                width: 300,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div style={{ fontWeight: 600 }}>
                {t("chat.homework_deactivate_title")}
              </div>
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && deactivateHomework()}
                placeholder={t("chat.pin_placeholder")}
                autoFocus
                style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid var(--ella-border)",
                  background: "var(--ella-bg)",
                  color: "var(--ella-text)",
                  fontSize: "0.9rem",
                  outline: "none",
                }}
              />
              {pinError && (
                <div
                  style={{ fontSize: "0.82rem", color: "var(--ella-danger)" }}
                >
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
                    fontWeight: 600,
                  }}
                >
                  {pinBusy ? "…" : t("chat.btn_deactivate")}
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
                    border: "1px solid var(--ella-border)",
                    background: "transparent",
                    color: "var(--ella-text-dim)",
                    cursor: "pointer",
                  }}
                >
                  {t("chat.btn_cancel")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Card (shared) */}
        {confirmationCard && (
          <div
            style={{
              position: "fixed",
              bottom: 80,
              left: "50%",
              transform: "translateX(-50%)",
              background: "#1a1f2e",
              border: "1px solid var(--ella-warning)",
              borderRadius: 10,
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              zIndex: 50,
              minWidth: 300,
              maxWidth: 500,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontWeight: 600,
                color: "var(--ella-warning)",
                fontSize: "0.85rem",
              }}
            >
              <span>⚠</span>
              {t("chat.confirm_title")}
            </div>
            <div
              style={{
                color: "var(--ella-text)",
                fontSize: "0.82rem",
                lineHeight: 1.5,
              }}
            >
              {confirmationCard.message}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                disabled={confirmBusy}
                onClick={async () => {
                  setConfirmBusy(true);
                  try {
                    const res = await apiFetch("/api/tools/confirm", {
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
                        : t("chat.action_success")
                      : `${t("chat.error_prefix")}: ${result.error ?? t("common.error")}`;
                    setMessages((p) => [
                      ...p,
                      { role: "assistant", content: msg },
                    ]);
                  } catch {
                    setMessages((p) => [
                      ...p,
                      { role: "assistant", content: t("chat.action_failed") },
                    ]);
                  } finally {
                    setConfirmationCard(null);
                    setConfirmBusy(false);
                  }
                }}
                style={{
                  background: "var(--ella-danger-strong)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 16px",
                  fontWeight: 600,
                  cursor: confirmBusy ? "not-allowed" : "pointer",
                }}
              >
                {confirmBusy ? t("chat.btn_confirming") : t("chat.btn_confirm")}
              </button>
              <button
                disabled={confirmBusy}
                onClick={() => setConfirmationCard(null)}
                style={{
                  background: "transparent",
                  color: "var(--ella-text-muted)",
                  border: "1px solid #334155",
                  borderRadius: 6,
                  padding: "6px 16px",
                  cursor: "pointer",
                }}
              >
                {t("chat.btn_cancel")}
              </button>
            </div>
          </div>
        )}

        {/* Toast overlay (shared) */}
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
  }

  return (
    <div style={{ display: "flex", height: "100%", gap: 16 }}>
      <AvatarPanel
        isThinking={loading}
        isSpeaking={ttsActive}
        stressLevel={stressLevel}
        isListening={isListeningNow}
        listenRemainingMs={listenRemainingMs}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          gap: 12,
          minWidth: 0,
          overflow: "hidden",
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
          <h2 style={{ margin: 0 }}>{t("chat.heading")}</h2>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={() => {
                const next = !ttsEnabled;
                setTtsEnabled(next);
                ttsEnabledRef.current = next;
                if (!next) stopCurrentAudio();
                apiFetch("/api/settings", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ ttsEnabled: next }),
                }).catch(() => {});
              }}
              aria-label={t(
                ttsEnabled ? "chat.aria_tts_on" : "chat.aria_tts_off",
              )}
              title={t(ttsEnabled ? "chat.aria_tts_on" : "chat.aria_tts_off")}
              style={{
                padding: "4px 10px",
                borderRadius: 4,
                fontSize: "0.85rem",
                background: ttsEnabled ? "#1e1b4b" : "transparent",
                border: ttsEnabled
                  ? "1px solid var(--ella-accent)"
                  : "1px solid var(--ella-border)",
                color: ttsEnabled ? "#a5b4fc" : "var(--ella-text-dim)",
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
                aria-label={t(
                  homeworkActive
                    ? "chat.aria_homework_on"
                    : "chat.aria_homework_off",
                )}
                title={t(
                  homeworkActive
                    ? "chat.aria_homework_on"
                    : "chat.aria_homework_off",
                )}
                style={{
                  padding: "4px 10px",
                  borderRadius: 4,
                  fontSize: "0.85rem",
                  background: homeworkActive ? "#431407" : "transparent",
                  border: homeworkActive
                    ? "1px solid #c2410c"
                    : "1px solid var(--ella-border)",
                  color: homeworkActive ? "#fdba74" : "var(--ella-text-dim)",
                  cursor: "pointer",
                }}
              >
                {homeworkActive ? "🔒" : "🔓"}
              </button>
            )}
            {messages.length > 0 && (
              <button
                onClick={clearHistory}
                aria-label={t("chat.aria_clear")}
                style={{
                  padding: "4px 12px",
                  borderRadius: 4,
                  fontSize: "0.8rem",
                  background: "transparent",
                  border: "1px solid var(--ella-border)",
                  color: "var(--ella-text-dim)",
                  cursor: "pointer",
                }}
              >
                {t("chat.clear")}
              </button>
            )}
          </div>
        </div>

        {/* Hausaufgaben-Modus Banner */}
        {homeworkActive && (
          <div
            role="status"
            aria-live="polite"
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
            <span aria-hidden="true">🔒</span> {t("chat.homework_banner")}
          </div>
        )}

        {/* Gehörlosenmodus Banner */}
        {accessibilityMode === "deaf" && (
          <div
            role="status"
            style={{
              background: "#0f172a",
              border: "1px solid #334155",
              borderRadius: 6,
              padding: "8px 14px",
              fontSize: "0.82rem",
              color: "var(--ella-text-muted)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexShrink: 0,
            }}
          >
            <span aria-hidden="true">🔇</span> {t("chat.deaf_banner")}
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
                background: "var(--ella-surface)",
                border: "1px solid var(--ella-border)",
                borderRadius: 10,
                padding: 24,
                width: 300,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div style={{ fontWeight: 600, fontSize: "1rem" }}>
                {t("chat.homework_deactivate_title")}
              </div>
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && deactivateHomework()}
                placeholder={t("chat.pin_placeholder")}
                autoFocus
                style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid var(--ella-border)",
                  background: "var(--ella-bg)",
                  color: "var(--ella-text)",
                  fontSize: "0.9rem",
                  outline: "none",
                }}
              />
              {pinError && (
                <div
                  style={{ fontSize: "0.82rem", color: "var(--ella-danger)" }}
                >
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
                  {pinBusy ? "…" : t("chat.btn_deactivate")}
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
                    border: "1px solid var(--ella-border)",
                    background: "transparent",
                    color: "var(--ella-text-dim)",
                    cursor: "pointer",
                    fontSize: "0.88rem",
                  }}
                >
                  {t("chat.btn_cancel")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div
          role="log"
          aria-label={t("chat.aria_messages")}
          aria-live="polite"
          aria-atomic="false"
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
                color: "var(--ella-text-dim)",
                fontSize: "0.9rem",
                marginTop: 32,
                textAlign: "center",
              }}
            >
              {t("chat.welcome")}
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
                    border: "1px solid var(--ella-danger-bg)",
                    borderLeft: "3px solid var(--ella-danger-strong)",
                    background: "#1a0a0a",
                    maxWidth: "75%",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--ella-danger-strong)",
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
                          border: "1px solid var(--ella-danger-bg)",
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
                      color: "var(--ella-text-muted)",
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
                  background:
                    m.role === "user"
                      ? "var(--ella-accent)"
                      : "var(--ella-surface)",
                  border:
                    m.role === "assistant"
                      ? "1px solid var(--ella-border)"
                      : "none",
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
                      {m.usedTools.map((tool) => (
                        <span
                          key={tool}
                          title={tool}
                          style={{
                            fontSize: "0.68rem",
                            background: "var(--ella-bg)",
                            border: "1px solid var(--ella-border)",
                            borderRadius: 4,
                            padding: "1px 6px",
                            color: "var(--ella-text-dim)",
                          }}
                        >
                          {toolLabel(tool)}
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
                        title={t(
                          r === "positive"
                            ? "chat.feedback_helpful"
                            : "chat.feedback_not_helpful",
                        )}
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
                                ? "var(--ella-success)"
                                : "var(--ella-danger)"
                              : "var(--ella-text-dim)",
                        }}
                      >
                        {r === "positive" ? "👍" : "👎"}
                      </button>
                    ))}
                  </div>
                )}
                {m.proactive && m.proactiveCategory && (
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      marginTop: 6,
                      opacity: mutedCategories[m.proactiveCategory] ? 1 : 0.35,
                      transition: "opacity 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLDivElement).style.opacity = "1")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLDivElement).style.opacity =
                        mutedCategories[m.proactiveCategory!] ? "1" : "0.35")
                    }
                  >
                    <button
                      onClick={() =>
                        dismissProactive(m.proactiveCategory!, false)
                      }
                      title={t("chat.proactive_dismiss")}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "0.75rem",
                        padding: "2px 4px",
                        borderRadius: 4,
                        color: "var(--ella-text-dim)",
                      }}
                    >
                      👋
                    </button>
                    <button
                      onClick={() =>
                        dismissProactive(m.proactiveCategory!, true)
                      }
                      disabled={mutedCategories[m.proactiveCategory] === true}
                      title={t("chat.proactive_mute")}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: mutedCategories[m.proactiveCategory]
                          ? "default"
                          : "pointer",
                        fontSize: "0.75rem",
                        padding: "2px 4px",
                        borderRadius: 4,
                        color: mutedCategories[m.proactiveCategory]
                          ? "var(--ella-danger)"
                          : "var(--ella-text-dim)",
                      }}
                    >
                      🔇
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {toolStatus && (
            <div
              style={{
                alignSelf: "flex-start",
                background: "var(--ella-surface)",
                border: "1px solid var(--ella-border)",
                padding: "8px 14px",
                borderRadius: 8,
                fontSize: "0.8rem",
                color: "var(--ella-text-muted)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ color: "var(--ella-accent)" }}>⚙</span>
              {toolStatus}…
            </div>
          )}

          {streaming && (
            <div
              style={{
                alignSelf: "flex-start",
                background: "var(--ella-surface)",
                border: "1px solid var(--ella-border)",
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
                  background: "var(--ella-accent)",
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
                background: "var(--ella-surface)",
                border: "1px solid var(--ella-border)",
                padding: "10px 14px",
                borderRadius: 8,
                fontSize: "0.85rem",
                color: "var(--ella-accent)",
              }}
            >
              {t("chat.thinking")}
            </div>
          )}
          {error && (
            <div
              style={{
                alignSelf: "flex-start",
                background: "#2d1a1a",
                border: "1px solid var(--ella-danger-bg)",
                padding: "10px 14px",
                borderRadius: 8,
                fontSize: "0.85rem",
                color: "#fca5a5",
              }}
            >
              {t("chat.error_prefix")}: {error}
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
              borderLeft: "3px solid var(--ella-danger-strong)",
              background: "#1a0a0a",
              fontSize: "0.82rem",
            }}
          >
            <span
              style={{
                color: "var(--ella-danger-strong)",
                fontWeight: 600,
                letterSpacing: "0.05em",
              }}
            >
              E.L.L.A. DIRECTIVE
            </span>
            <span style={{ color: "var(--ella-text-muted)" }}>
              {t("chat.directive_not_allowed")}
            </span>
          </div>
        )}

        {/* Pausenmodus-Indikator */}
        {isPaused && pauseEndsAt && (
          <div
            style={{
              background: "#1e1b4b",
              border: "1px solid var(--ella-accent)",
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
            <span>⏸ {t("chat.paused", { countdown: pauseCountdown })}</span>
            <button
              onClick={resumeFromPause}
              style={{
                background: "transparent",
                border: "1px solid var(--ella-accent)",
                borderRadius: 4,
                color: "#a5b4fc",
                padding: "3px 10px",
                cursor: "pointer",
                fontSize: "0.8rem",
              }}
            >
              {t("chat.btn_resume")}
            </button>
          </div>
        )}

        {/* Sprachstatus-Anzeige */}
        {(voiceMode === "wakeword" ||
          voiceMode === "always" ||
          voiceMode === "dictation") &&
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
                      color: "var(--ella-success-strong)",
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        display: "inline-block",
                        background: "var(--ella-success-strong)",
                        animation: "pulse 0.8s ease-in-out infinite",
                      }}
                    />
                    {t("chat.speak_now")}
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
                        background: "var(--ella-success-strong)",
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
                    color: "var(--ella-accent)",
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      display: "inline-block",
                      background: "var(--ella-accent)",
                      animation: "pulse 1.2s ease-in-out infinite",
                    }}
                  />
                  {micStatus}
                </div>
              ) : (
                /* Idle — lauscht / diktiert */
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: "0.78rem",
                    color:
                      voiceMode === "dictation"
                        ? "#5eead4"
                        : "var(--ella-border-strong)",
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      display: "inline-block",
                      background:
                        voiceMode === "dictation"
                          ? "#5eead4"
                          : "var(--ella-border-strong)",
                      animation: "pulse 2.5s ease-in-out infinite",
                    }}
                  />
                  {voiceMode === "dictation"
                    ? t(
                        "hud.dictation_mode",
                        "Diktat-Modus — Sprache → aktives Fenster",
                      )
                    : t("chat.listening")}
                </div>
              )}
            </div>
          )}

        {/* Confirmation Card */}
        {confirmationCard && (
          <div
            style={{
              background: "#1a1f2e",
              border: "1px solid var(--ella-warning)",
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
                color: "var(--ella-warning)",
                fontSize: "0.85rem",
              }}
            >
              <span>⚠</span>
              {t("chat.confirm_title")}
            </div>
            <div
              style={{
                color: "var(--ella-text)",
                fontSize: "0.82rem",
                lineHeight: 1.5,
              }}
            >
              {confirmationCard.message}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                disabled={confirmBusy}
                onClick={async () => {
                  setConfirmBusy(true);
                  try {
                    const res = await apiFetch("/api/tools/confirm", {
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
                        : t("chat.action_success")
                      : `${t("chat.error_prefix")}: ${result.error ?? t("common.error")}`;
                    setMessages((p) => [
                      ...p,
                      { role: "assistant", content: msg },
                    ]);
                  } catch {
                    setMessages((p) => [
                      ...p,
                      { role: "assistant", content: t("chat.action_failed") },
                    ]);
                  } finally {
                    setConfirmationCard(null);
                    setConfirmBusy(false);
                  }
                }}
                style={{
                  background: "var(--ella-danger-strong)",
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
                {confirmBusy ? t("chat.btn_confirming") : t("chat.btn_confirm")}
              </button>
              <button
                disabled={confirmBusy}
                onClick={() => setConfirmationCard(null)}
                style={{
                  background: "transparent",
                  color: "var(--ella-text-muted)",
                  border: "1px solid #334155",
                  borderRadius: 6,
                  padding: "6px 16px",
                  cursor: "pointer",
                  fontSize: "0.82rem",
                }}
              >
                {t("chat.btn_cancel")}
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
            aria-label={t("chat.aria_input")}
            placeholder={
              micActive ? t("chat.placeholder_mic") : t("chat.placeholder")
            }
            disabled={loading}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: 6,
              border: micActive
                ? "1px solid var(--ella-accent)"
                : "1px solid var(--ella-border)",
              background: "var(--ella-surface)",
              color: "var(--ella-text)",
              fontSize: "0.9rem",
              outline: "none",
              opacity: loading ? 0.6 : 1,
              transition: "border-color 0.2s",
            }}
          />
          {showMic && (
            <button
              onClick={toggleMic}
              aria-label={t(
                micActive ? "chat.aria_mic_on" : "chat.aria_mic_off",
              )}
              title={t(micActive ? "chat.aria_mic_on" : "chat.aria_mic_off")}
              style={{
                padding: "10px 14px",
                borderRadius: 6,
                minWidth: 42,
                background: micActive
                  ? "var(--ella-accent)"
                  : "var(--ella-surface)",
                border: micActive ? "none" : "1px solid var(--ella-border)",
                color: micActive ? "#fff" : "var(--ella-text-dim)",
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
            aria-label={t("chat.aria_send")}
            disabled={loading || !input.trim()}
            style={{
              padding: "10px 20px",
              borderRadius: 6,
              background:
                loading || !input.trim() ? "#4a4670" : "var(--ella-accent)",
              color: "#fff",
              border: "none",
              cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              fontSize: "0.9rem",
            }}
          >
            {t("chat.send")}
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
    </div>
  );
};

export default Chat;
