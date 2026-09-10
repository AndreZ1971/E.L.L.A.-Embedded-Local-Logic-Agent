import React, { useRef, useEffect, useState } from "react";

type OrbMode = "idle" | "thinking" | "speaking";

interface Props {
  isThinking: boolean;
  isSpeaking: boolean;
}

const PHI = Math.PI * (3 - Math.sqrt(5));

function orbColor(
  depth: number,
  t: number,
  mode: OrbMode,
): [number, number, number] {
  const d = depth;
  if (mode === "idle") {
    const p = 0.45 + 0.55 * Math.sin(t * 0.75);
    return [~~(18 + d * 108 * p), ~~(14 + d * 88 * p), ~~(60 + d * 187 * p)];
  }
  if (mode === "speaking") {
    const p = 0.4 + 0.6 * Math.abs(Math.sin(t * 7.5));
    return [~~(80 + d * 110 * p), ~~(60 + d * 130 * p), ~~(180 + d * 67 * p)];
  }
  // thinking
  const p = 0.5 + 0.5 * Math.sin(t * 3.2);
  return [~~(50 + d * 110 * p), ~~(5 + d * 18 * p), ~~(100 + d * 130 * p)];
}

const INFO_LINES: Record<OrbMode, string[]> = {
  idle: ["Clipboard überwacht", "Monitoring aktiv", "Modell geladen"],
  thinking: ["Tool wird aufgerufen …", "Analysiere …", "Verarbeite …"],
  speaking: ["TTS aktiv", "Audio läuft …"],
};

const DOT_COLOR: Record<OrbMode, string> = {
  idle: "#7c6af7",
  thinking: "#9333ea",
  speaking: "#a78bfa",
};

const DOT_DURATION: Record<OrbMode, string> = {
  idle: "2.2s",
  thinking: "1.1s",
  speaking: "0.5s",
};

const STATE_LABEL: Record<OrbMode, string> = {
  idle: "Bereit",
  thinking: "Verarbeitet …",
  speaking: "Spricht",
};

const API = (import.meta.env.VITE_API_BASE ?? "") as string;

const AvatarPanel: React.FC<Props> = ({ isThinking, isSpeaking }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modeRef = useRef<OrbMode>("idle");
  const rafRef = useRef<number>(0);
  const infoIdxRef = useRef(0);
  const infoTimerRef = useRef(0);

  const [ollamaOk, setOllamaOk] = useState<boolean | null>(null);
  const [kokoroReady, setKokoroReady] = useState(false);
  const [activeProvider, setActiveProvider] = useState<
    "ollama" | "openai" | null
  >(null);
  const [infoText, setInfoText] = useState(INFO_LINES.idle[0]);

  const mode: OrbMode = isSpeaking
    ? "speaking"
    : isThinking
      ? "thinking"
      : "idle";

  useEffect(() => {
    modeRef.current = mode;
    infoIdxRef.current = 0;
    infoTimerRef.current = 0;
    setInfoText(INFO_LINES[mode][0]);
  }, [mode]);

  // Health polling — Ollama + Kokoro Status
  useEffect(() => {
    const poll = async () => {
      try {
        const r = await fetch(`${API}/api/health`);
        if (!r.ok) return;
        const d = (await r.json()) as {
          ollama_ok?: boolean;
          ollama?: boolean;
          kokoro_ready?: boolean;
          provider?: "ollama" | "openai";
        };
        setOllamaOk(d.ollama_ok ?? d.ollama ?? false);
        setKokoroReady(d.kokoro_ready ?? false);
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

  // Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function frame(ts: number) {
      const t = ts * 0.001;
      const m = modeRef.current;
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

      const W = 164,
        H = 164;
      const cx = W / 2,
        cy = H / 2;
      const N = 800;
      const R = Math.min(W, H) * 0.4;

      ctx.fillStyle = "#0f1117";
      ctx.fillRect(0, 0, W, H);

      // Glow behind orb
      const glowMap: Record<OrbMode, [number, number, number]> = {
        idle: [124, 106, 247],
        speaking: [167, 139, 250],
        thinking: [147, 51, 234],
      };
      const [gr, gg, gb] = glowMap[m];
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.4);
      grd.addColorStop(0, `rgba(${gr},${gg},${gb},0.16)`);
      grd.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.4, 0, Math.PI * 2);
      ctx.fill();

      const speed = m === "idle" ? 0.18 : m === "speaking" ? 0.65 : 0.38;
      const distort = m === "idle" ? 0.015 : m === "speaking" ? 0.07 : 0.04;

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
        const [r, g, b] = orbColor(p.depth, t, m);
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, 0.8 * (0.5 + p.depth * 0.8), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${0.2 + p.depth * 0.72})`;
        ctx.fill();
      }

      // Orbital ring
      ctx.save();
      ctx.strokeStyle = "rgba(124,106,247,0.15)";
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
    return () => cancelAnimationFrame(rafRef.current);
  }, []); // modeRef is read dynamically — no dep needed

  const chipBase: React.CSSProperties = {
    padding: "2px 7px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid #2d3148",
    borderRadius: 20,
    fontSize: "0.68rem",
    color: "#64748b",
    whiteSpace: "nowrap",
  };

  const chipGreen: React.CSSProperties = {
    ...chipBase,
    borderColor: "rgba(34,197,94,0.3)",
    color: "#22c55e",
    background: "rgba(34,197,94,0.08)",
  };

  return (
    <div
      style={{
        width: 210,
        flexShrink: 0,
        background: "#1a1d27",
        border: "1px solid #2d3148",
        borderRadius: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 20,
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        width={164}
        height={164}
        style={{ display: "block", width: 164, height: 164, flexShrink: 0 }}
      />

      <div
        style={{
          fontFamily: "monospace",
          fontSize: "0.875rem",
          fontWeight: 600,
          color: "#e2e8f0",
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
          background: "#2d3148",
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
            style={{ fontSize: "0.78rem", fontWeight: 500, color: "#e2e8f0" }}
          >
            {STATE_LABEL[mode]}
          </span>
        </div>

        {/* Info line */}
        <div
          style={{
            fontSize: "0.75rem",
            color: "#64748b",
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
