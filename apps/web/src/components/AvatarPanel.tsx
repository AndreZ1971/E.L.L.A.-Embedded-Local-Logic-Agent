import React, { useRef, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

type OrbMode =
  "idle" | "listening" | "thinking" | "speaking" | "cloud" | "offline";
type StressLevel = "low" | "medium" | "high";

interface Props {
  isThinking: boolean;
  isSpeaking: boolean;
  stressLevel?: StressLevel;
  isListening?: boolean;
  listenRemainingMs?: number;
  cloudActive?: boolean;
  offline?: boolean;
  hudMode?: boolean;
}

const PHI = Math.PI * (3 - Math.sqrt(5));

const STRESS_TINT: Record<StressLevel, [number, number, number]> = {
  low: [0, 0, 0],
  medium: [40, 20, -30],
  high: [70, -10, -60],
};

function orbColor(
  depth: number,
  t: number,
  mode: OrbMode,
  stress: StressLevel = "low",
): [number, number, number] {
  const d = depth;
  const [sr, sg, sb] = STRESS_TINT[stress];
  let r: number, g: number, b: number;
  if (mode === "idle") {
    const p = 0.45 + 0.55 * Math.sin(t * 0.75);
    r = 18 + d * 108 * p;
    g = 14 + d * 88 * p;
    b = 60 + d * 187 * p;
  } else if (mode === "speaking") {
    const p = 0.4 + 0.6 * Math.abs(Math.sin(t * 7.5));
    r = 80 + d * 110 * p;
    g = 60 + d * 130 * p;
    b = 180 + d * 67 * p;
  } else if (mode === "listening") {
    const p = 0.6 + 0.4 * Math.sin(t * 1.8);
    r = 60 + d * 140 * p;
    g = 80 + d * 160 * p;
    b = 200 + d * 55 * p;
  } else if (mode === "cloud") {
    const p = 0.5 + 0.5 * Math.sin(t * 2.0);
    r = 180 + d * 65 * p;
    g = 120 + d * 60 * p;
    b = 20 + d * 50 * p;
  } else if (mode === "offline") {
    const p = 0.3 + 0.2 * Math.sin(t * 0.5);
    r = 40 + d * 50 * p;
    g = 40 + d * 50 * p;
    b = 50 + d * 60 * p;
  } else {
    const p = 0.5 + 0.5 * Math.sin(t * 3.2);
    r = 50 + d * 110 * p;
    g = 5 + d * 18 * p;
    b = 100 + d * 130 * p;
  }
  return [
    Math.max(0, Math.min(255, ~~(r + sr * d))),
    Math.max(0, Math.min(255, ~~(g + sg * d))),
    Math.max(0, Math.min(255, ~~(b + sb * d))),
  ];
}

const INFO_LINES: Record<OrbMode, string[]> = {
  idle: ["Clipboard überwacht", "Monitoring aktiv", "Modell geladen"],
  listening: ["Wakeword erkannt", "Hört zu …"],
  thinking: ["Tool wird aufgerufen …", "Analysiere …", "Verarbeite …"],
  speaking: ["TTS aktiv", "Audio läuft …"],
  cloud: ["via OpenAI", "Cloud-Anfrage …"],
  offline: ["Kein Netzwerk", "Nur lokale Modelle"],
};

const DOT_COLOR: Record<OrbMode, string> = {
  idle: "var(--ella-accent)",
  listening: "var(--ella-success-strong)",
  thinking: "#9333ea",
  speaking: "var(--ella-accent-soft)",
  cloud: "var(--ella-warning)",
  offline: "var(--ella-text-dim)",
};

const DOT_DURATION: Record<OrbMode, string> = {
  idle: "2.2s",
  listening: "0.8s",
  thinking: "1.1s",
  speaking: "0.5s",
  cloud: "1.4s",
  offline: "3s",
};

const STATE_LABEL: Record<OrbMode, string> = {
  idle: "Bereit",
  listening: "Hört zu",
  thinking: "Verarbeitet …",
  speaking: "Spricht",
  cloud: "Cloud aktiv",
  offline: "Offline",
};

const RING_ANIM_SPEED = "var(--ella-anim-speed, 1)";

const OrbRings: React.FC<{
  mode: OrbMode;
  listenRemainingMs?: number;
  size?: number;
}> = ({ mode, listenRemainingMs, size }) => {
  const isHud =
    document.documentElement.dataset.theme === "hud" ||
    document.documentElement.dataset.theme === "show";
  if (!isHud) return null;

  const sz = size ?? 164;
  const cx = sz / 2;
  const cy = sz / 2;
  const scale = sz / 164;
  const outerR = 76 * scale;
  const dashR = 72 * scale;
  const ellipseRx = 70 * scale;
  const ellipseRy = 30 * scale;

  const countdownFraction =
    mode === "listening" && listenRemainingMs != null
      ? Math.max(0, Math.min(1, listenRemainingMs / 8000))
      : 0;
  const countdownCirc = 2 * Math.PI * outerR;
  const countdownDash = `${countdownCirc * countdownFraction} ${countdownCirc}`;

  return (
    <svg
      aria-hidden="true"
      width={sz}
      height={sz}
      style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
    >
      <style>{`
        @keyframes orbSpin { to { transform: rotate(360deg); } }
        @keyframes orbSpinR { to { transform: rotate(-360deg); } }
      `}</style>
      {/* Dotted outer ring */}
      <circle
        cx={cx}
        cy={cy}
        r={outerR}
        fill="none"
        stroke="var(--ella-accent-soft)"
        strokeWidth="0.5"
        strokeDasharray="2 6"
        opacity="0.4"
        style={{
          transformOrigin: `${cx}px ${cy}px`,
          animation: `orbSpin calc(36s / max(${RING_ANIM_SPEED}, 0.01)) linear infinite`,
        }}
      />
      {/* Dashed inner ring */}
      <circle
        cx={cx}
        cy={cy}
        r={dashR}
        fill="none"
        stroke="var(--ella-accent-soft)"
        strokeWidth="0.5"
        strokeDasharray="8 12"
        opacity="0.25"
        style={{
          transformOrigin: `${cx}px ${cy}px`,
          animation: `orbSpinR calc(36s / max(${RING_ANIM_SPEED}, 0.01)) linear infinite`,
        }}
      />
      {/* Tilted ellipse 1 */}
      <ellipse
        cx={cx}
        cy={cy}
        rx={ellipseRx}
        ry={ellipseRy}
        fill="none"
        stroke="var(--ella-accent-soft)"
        strokeWidth="0.4"
        opacity="0.2"
        transform={`rotate(25 ${cx} ${cy})`}
        style={{
          transformOrigin: `${cx}px ${cy}px`,
          animation: `orbSpin calc(22s / max(${RING_ANIM_SPEED}, 0.01)) linear infinite`,
        }}
      />
      {/* Tilted ellipse 2 — counter-rotating */}
      <ellipse
        cx={cx}
        cy={cy}
        rx={ellipseRx}
        ry={ellipseRy}
        fill="none"
        stroke="var(--ella-accent-soft)"
        strokeWidth="0.4"
        opacity="0.2"
        transform={`rotate(-25 ${cx} ${cy})`}
        style={{
          transformOrigin: `${cx}px ${cy}px`,
          animation: `orbSpinR calc(22s / max(${RING_ANIM_SPEED}, 0.01)) linear infinite`,
        }}
      />
      {/* Countdown ring — only when listening */}
      {mode === "listening" && countdownFraction > 0 && (
        <circle
          cx={cx}
          cy={cy}
          r={outerR}
          fill="none"
          stroke="var(--ella-success-strong, #22c55e)"
          strokeWidth="2"
          strokeDasharray={countdownDash}
          strokeDashoffset={countdownCirc * 0.25}
          strokeLinecap="round"
          opacity="0.7"
          style={{ transition: "stroke-dasharray 0.3s linear" }}
        />
      )}
      {/* Cloud ring — amber */}
      {mode === "cloud" && (
        <circle
          cx={cx}
          cy={cy}
          r={outerR}
          fill="none"
          stroke="var(--ella-warning, #f5b14c)"
          strokeWidth="1.5"
          strokeDasharray="4 8"
          opacity="0.6"
          style={{
            transformOrigin: `${cx}px ${cy}px`,
            animation: `orbSpin calc(8s / max(${RING_ANIM_SPEED}, 0.01)) linear infinite`,
          }}
        />
      )}
      {/* Offline — square frame instead of ring */}
      {mode === "offline" && (
        <rect
          x={cx - outerR + 6}
          y={cy - outerR + 6}
          width={(outerR - 6) * 2}
          height={(outerR - 6) * 2}
          rx="4"
          fill="none"
          stroke="var(--ella-text-dim)"
          strokeWidth="1"
          strokeDasharray="6 4"
          opacity="0.4"
        />
      )}
    </svg>
  );
};

const AvatarPanel: React.FC<Props> = ({
  isThinking,
  isSpeaking,
  stressLevel = "low",
  isListening = false,
  listenRemainingMs,
  cloudActive = false,
  offline = false,
  hudMode = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modeRef = useRef<OrbMode>("idle");
  const stressRef = useRef<StressLevel>("low");
  const rafRef = useRef<number>(0);
  const infoIdxRef = useRef(0);
  const infoTimerRef = useRef(0);
  const lastFrameRef = useRef(0);
  const visibleRef = useRef(!document.hidden);

  const [ollamaOk, setOllamaOk] = useState<boolean | null>(null);
  const [kokoroReady, setKokoroReady] = useState(false);
  const [activeProvider, setActiveProvider] = useState<
    "ollama" | "openai" | null
  >(null);
  const [healthOffline, setHealthOffline] = useState(false);
  const [infoText, setInfoText] = useState(INFO_LINES.idle[0]);

  const isOffline = offline || healthOffline;
  const isCloud = cloudActive || (activeProvider === "openai" && isThinking);

  const mode: OrbMode = isOffline
    ? "offline"
    : isSpeaking
      ? "speaking"
      : isCloud
        ? "cloud"
        : isThinking
          ? "thinking"
          : isListening
            ? "listening"
            : "idle";

  useEffect(() => {
    modeRef.current = mode;
    infoIdxRef.current = 0;
    infoTimerRef.current = 0;
    setInfoText(INFO_LINES[mode][0]);
  }, [mode]);

  useEffect(() => {
    stressRef.current = stressLevel;
  }, [stressLevel]);

  // Health polling — Ollama + Kokoro Status
  useEffect(() => {
    const poll = async () => {
      try {
        const r = await apiFetch("/api/health");
        if (!r.ok) return;
        const d = (await r.json()) as {
          ollama_ok?: boolean;
          ollama?: boolean;
          kokoro_ready?: boolean;
          provider?: "ollama" | "openai";
          offline_mode?: boolean;
        };
        setOllamaOk(d.ollama_ok ?? d.ollama ?? false);
        setKokoroReady(d.kokoro_ready ?? false);
        setHealthOffline(!!d.offline_mode);
        if (d.provider) setActiveProvider(d.provider);
      } catch {
        // offline
      }
    };
    poll();
    const id = setInterval(poll, 30_000);
    return () => clearInterval(id);
  }, []);

  // Inject animation keyframe once
  useEffect(() => {
    const styleId = "ella-orb-kf";
    if (!document.getElementById(styleId)) {
      const s = document.createElement("style");
      s.id = styleId;
      s.textContent =
        "@keyframes ellaPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.25;transform:scale(.7)}}";
      document.head.appendChild(s);
    }
  }, []);

  // Canvas render loop with visibility pause + FPS throttle
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function frame(ts: number) {
      if (!visibleRef.current) {
        rafRef.current = 0;
        return;
      }

      // FPS limit: check --ella-anim-speed; if throttled (<1), cap at 20fps
      const animSpeed = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--ella-anim-speed",
        ) || "1",
      );
      if (animSpeed < 1) {
        const delta = ts - lastFrameRef.current;
        if (delta < 50) {
          rafRef.current = requestAnimationFrame(frame);
          return;
        }
      }
      lastFrameRef.current = ts;

      const t = ts * 0.001;
      const m = modeRef.current;
      const sl = stressRef.current;
      const ctx = canvas!.getContext("2d");
      if (!ctx) {
        rafRef.current = requestAnimationFrame(frame);
        return;
      }

      // Rotate info text every 4s
      if (infoTimerRef.current === 0) infoTimerRef.current = t;
      if (t - infoTimerRef.current > 4) {
        infoTimerRef.current = t;
        const lines = INFO_LINES[m];
        infoIdxRef.current = (infoIdxRef.current + 1) % lines.length;
        setInfoText(lines[infoIdxRef.current]);
      }

      const W = canvas!.width,
        H = canvas!.height;
      const cx = W / 2,
        cy = H / 2;
      const N = 800;
      const baseR = Math.min(W, H) * 0.4;

      // Organic breathing — subtle radius oscillation
      const breathe =
        m === "idle"
          ? 0.02 * Math.sin(t * 0.6) + 0.01 * Math.sin(t * 1.1)
          : m === "listening"
            ? 0.03 * Math.sin(t * 1.2) + 0.02 * Math.sin(t * 2.5)
            : m === "speaking"
              ? 0.04 * Math.sin(t * 4.3) +
                0.025 * Math.sin(t * 7.1) +
                0.015 * Math.sin(t * 11.3)
              : m === "cloud"
                ? 0.02 * Math.sin(t * 1.5) + 0.015 * Math.sin(t * 2.8)
                : m === "offline"
                  ? 0.005 * Math.sin(t * 0.3)
                  : 0.015 * Math.sin(t * 1.8);
      const R = baseR * (1 + breathe);

      const isHudTheme =
        document.documentElement.dataset.theme === "hud" ||
        document.documentElement.dataset.theme === "show";
      if (isHudTheme) {
        ctx.clearRect(0, 0, W, H);
      } else {
        ctx.fillStyle = "#0f1117";
        ctx.fillRect(0, 0, W, H);
      }

      // Glow behind orb — stress shifts hue
      const glowBase: Record<OrbMode, [number, number, number]> = {
        idle: [124, 106, 247],
        listening: [34, 197, 94],
        speaking: [167, 139, 250],
        thinking: [147, 51, 234],
        cloud: [245, 177, 76],
        offline: [80, 80, 100],
      };
      const [gbr, gbg, gbb] = glowBase[m];
      const [str, stg, stb] = STRESS_TINT[sl];
      const gr = Math.max(0, Math.min(255, gbr + str * 0.6));
      const gg = Math.max(0, Math.min(255, gbg + stg * 0.6));
      const gb = Math.max(0, Math.min(255, gbb + stb * 0.6));
      const glowAlpha = sl === "high" ? 0.22 : sl === "medium" ? 0.19 : 0.16;
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.4);
      grd.addColorStop(0, `rgba(${~~gr},${~~gg},${~~gb},${glowAlpha})`);
      grd.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.4, 0, Math.PI * 2);
      ctx.fill();

      const speed =
        m === "idle"
          ? 0.18
          : m === "listening"
            ? 0.25
            : m === "speaking"
              ? 0.65
              : m === "cloud"
                ? 0.3
                : m === "offline"
                  ? 0.08
                  : 0.38;
      const distort =
        m === "idle"
          ? 0.015
          : m === "listening"
            ? 0.025
            : m === "speaking"
              ? 0.07
              : m === "cloud"
                ? 0.035
                : m === "offline"
                  ? 0.06
                  : 0.04;

      const rY = t * speed;
      const rX = t * speed * 0.38 + Math.sin(t * 0.22) * 0.28;
      const cY = Math.cos(rY),
        sY = Math.sin(rY);
      const cX = Math.cos(rX),
        sX = Math.sin(rX);

      const pts: { sx: number; sy: number; depth: number; z3: number }[] = [];
      for (let i = 0; i < N; i++) {
        const y0 = 1 - (i / (N - 1)) * 2;
        const r0 = Math.sqrt(Math.max(0, 1 - y0 * y0));
        const theta = PHI * i;
        const wave = distort * Math.sin(theta * 6 + t * 3.5 + y0 * 5);
        const rr = R * (1 + wave);
        const x = r0 * Math.cos(theta) * rr,
          y = y0 * rr,
          z = r0 * Math.sin(theta) * rr;
        const x2 = x * cY - z * sY,
          z2 = x * sY + z * cY;
        const y3 = y * cX - z2 * sX,
          z3 = y * sX + z2 * cX;
        const persp = 1 + z3 / (R * 3.5);
        pts.push({
          sx: cx + x2 * persp,
          sy: cy + y3 * persp,
          depth: (z3 / R + 1) / 2,
          z3,
        });
      }
      pts.sort((a, b) => a.z3 - b.z3);

      for (const p of pts) {
        const [r, g, b] = orbColor(p.depth, t, m, sl);
        const sz = 0.8 * (0.5 + p.depth * 0.8);
        ctx.fillStyle = `rgba(${r},${g},${b},${0.2 + p.depth * 0.72})`;
        if (m === "offline") {
          ctx.fillRect(p.sx - sz, p.sy - sz, sz * 2, sz * 2);
        } else {
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, sz, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Orbital ring — stress shifts color
      const ringAlpha = sl === "high" ? 0.22 : 0.15;
      ctx.save();
      ctx.strokeStyle = `rgba(${~~gr},${~~gg},${~~gb},${ringAlpha})`;
      ctx.lineWidth = 0.7;
      const rng = R * 1.2,
        tilt = Math.PI / 7 + rX * 0.25;
      ctx.beginPath();
      for (let a = 0; a < Math.PI * 2; a += 0.05) {
        const rx = Math.cos(a + rY) * rng,
          ry = Math.sin(a + rY) * rng * Math.sin(tilt);
        a === 0 ? ctx.moveTo(cx + rx, cy + ry) : ctx.lineTo(cx + rx, cy + ry);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);

    const onVis = () => {
      visibleRef.current = !document.hidden;
      if (!document.hidden && !rafRef.current) {
        rafRef.current = requestAnimationFrame(frame);
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const orbSize = hudMode ? 320 : 164;

  if (hudMode) {
    return (
      <div
        style={{
          position: "relative",
          width: orbSize,
          height: orbSize,
          flexShrink: 0,
        }}
      >
        <canvas
          ref={canvasRef}
          width={orbSize}
          height={orbSize}
          style={{ display: "block", width: orbSize, height: orbSize }}
        />
        <OrbRings
          mode={mode}
          listenRemainingMs={listenRemainingMs}
          size={orbSize}
        />
      </div>
    );
  }

  const chipBase: React.CSSProperties = {
    padding: "2px 7px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid var(--ella-border)",
    borderRadius: 20,
    fontSize: "0.68rem",
    color: "var(--ella-text-dim)",
    whiteSpace: "nowrap",
  };

  const chipGreen: React.CSSProperties = {
    ...chipBase,
    borderColor: "rgba(34,197,94,0.3)",
    color: "var(--ella-success-strong)",
    background: "rgba(34,197,94,0.08)",
  };

  return (
    <div
      style={{
        width: 210,
        flexShrink: 0,
        background: "var(--ella-surface)",
        border: "1px solid var(--ella-border)",
        borderRadius: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 20,
        overflow: "hidden",
      }}
    >
      <div
        style={{ position: "relative", width: 164, height: 164, flexShrink: 0 }}
      >
        <canvas
          ref={canvasRef}
          width={164}
          height={164}
          style={{ display: "block", width: 164, height: 164 }}
        />
        <OrbRings mode={mode} listenRemainingMs={listenRemainingMs} />
      </div>

      <div
        style={{
          fontFamily: "monospace",
          fontSize: "0.875rem",
          fontWeight: 600,
          color: "var(--ella-text)",
          letterSpacing: "0.1em",
          marginTop: 4,
          flexShrink: 0,
        }}
      >
        E.L.L.A.
      </div>

      {/* Divider */}
      <div
        style={{
          width: "80%",
          height: 1,
          background: "var(--ella-border)",
          margin: "12px 0 0",
          flexShrink: 0,
        }}
      />

      {/* Status */}
      <div
        style={{
          width: "100%",
          padding: "12px 14px 0",
          display: "flex",
          flexDirection: "column",
          gap: 7,
        }}
      >
        {/* State row */}
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: DOT_COLOR[mode],
              flexShrink: 0,
              transition: "background 0.4s",
              animation: `ellaPulse ${DOT_DURATION[mode]} ease-in-out infinite`,
            }}
          />
          <span
            style={{
              fontSize: "0.78rem",
              fontWeight: 500,
              color: "var(--ella-text)",
            }}
          >
            {STATE_LABEL[mode]}
          </span>
        </div>

        {/* Info line */}
        <div
          style={{
            fontSize: "0.75rem",
            color: "var(--ella-text-dim)",
            lineHeight: 1.4,
            minHeight: 14,
          }}
        >
          {infoText}
        </div>

        {/* Status chips */}
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {activeProvider === "openai" ? (
            <span style={chipGreen}>OpenAI</span>
          ) : ollamaOk !== null ? (
            <span style={ollamaOk ? chipGreen : chipBase}>
              Ollama {ollamaOk ? "OK" : "—"}
            </span>
          ) : null}
          {kokoroReady && <span style={chipGreen}>Kokoro</span>}
        </div>
      </div>
    </div>
  );
};

export default AvatarPanel;
