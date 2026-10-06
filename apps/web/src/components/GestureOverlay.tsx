import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  gestureEngine,
  type GestureFrame,
  type GestureType,
} from "../services/gestureEngine";

const GESTURE_LABELS: Record<GestureType, string> = {
  none: "",
  pinch: "✊ Greifen",
  pinch_drag: "✊ Verschieben",
  point: "☝ Zeigen",
  palm: "✋ Stopp",
  fist: "👊",
  swipe_left: "← Wisch",
  swipe_right: "Wisch →",
};

const GESTURE_COLORS: Record<GestureType, string> = {
  none: "74, 222, 128",
  pinch: "124, 106, 247",
  pinch_drag: "167, 139, 250",
  point: "74, 222, 128",
  palm: "248, 113, 113",
  fist: "251, 191, 36",
  swipe_left: "96, 165, 250",
  swipe_right: "96, 165, 250",
};

// Hand skeleton connections for debug overlay
const CONNECTIONS = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4], // thumb
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8], // index
  [0, 9],
  [9, 10],
  [10, 11],
  [11, 12], // middle
  [0, 13],
  [13, 14],
  [14, 15],
  [15, 16], // ring
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20], // pinky
  [5, 9],
  [9, 13],
  [13, 17], // palm
];

interface Props {
  showSkeleton?: boolean;
}

const GestureOverlay: React.FC<Props> = ({ showSkeleton = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const camRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<GestureFrame | null>(null);
  const trailRef = useRef<{ x: number; y: number; age: number }[]>([]);
  const [gestureLabel, setGestureLabel] = useState("");
  const labelTimeout = useRef<ReturnType<typeof setTimeout>>();

  const showLabel = useCallback((g: GestureType) => {
    const label = GESTURE_LABELS[g];
    if (!label) return;
    setGestureLabel(label);
    clearTimeout(labelTimeout.current);
    labelTimeout.current = setTimeout(() => setGestureLabel(""), 800);
  }, []);

  useEffect(() => {
    if (!gestureEngine.running) return;

    const canvas = canvasRef.current;
    const camCanvas = camRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const camCtx = camCanvas?.getContext("2d") ?? null;

    let prevGesture: GestureType = "none";
    let raf = 0;

    const onFrame = (f: GestureFrame) => {
      frameRef.current = f;
      if (f.gesture !== "none" && f.gesture !== prevGesture) {
        showLabel(f.gesture);
      }
      prevGesture = f.gesture;

      // cursor trail
      trailRef.current.push({
        x: f.cursor.screenX,
        y: f.cursor.screenY,
        age: 0,
      });
      if (trailRef.current.length > 12) trailRef.current.shift();
    };

    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
      ctx.clearRect(0, 0, w, h);

      // Webcam PiP
      const video = gestureEngine.getVideo();
      if (camCtx && camCanvas && video && video.readyState >= 2) {
        camCanvas.width = 160;
        camCanvas.height = 120;
        camCtx.save();
        camCtx.scale(-1, 1);
        camCtx.drawImage(video, -160, 0, 160, 120);
        camCtx.restore();
      }

      const f = frameRef.current;
      if (!f) {
        raf = requestAnimationFrame(draw);
        return;
      }

      const { screenX: sx, screenY: sy } = f.cursor;
      const color = GESTURE_COLORS[f.gesture] ?? GESTURE_COLORS.none;

      // Trail
      const trail = trailRef.current;
      for (let i = 0; i < trail.length; i++) {
        trail[i].age++;
        const alpha = (1 - i / trail.length) * 0.3;
        const r = 3 + (i / trail.length) * 3;
        ctx.beginPath();
        ctx.arc(trail[i].x, trail[i].y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color}, ${alpha})`;
        ctx.fill();
      }

      // Glow
      const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, 44);
      grad.addColorStop(0, `rgba(${color}, 0.6)`);
      grad.addColorStop(0.5, `rgba(${color}, 0.15)`);
      grad.addColorStop(1, `rgba(${color}, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(sx, sy, 44, 0, Math.PI * 2);
      ctx.fill();

      // Cursor dot
      ctx.beginPath();
      ctx.arc(
        sx,
        sy,
        f.gesture === "pinch" || f.gesture === "pinch_drag" ? 12 : 8,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = `rgba(${color}, 0.9)`;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.8)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Pinch ring
      if (f.gesture === "pinch" || f.gesture === "pinch_drag") {
        ctx.beginPath();
        ctx.arc(sx, sy, 20, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${color}, 0.5)`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Hand skeleton
      if (showSkeleton && f.landmarks) {
        const lm = f.landmarks;
        ctx.strokeStyle = "rgba(124, 106, 247, 0.4)";
        ctx.lineWidth = 1.5;
        for (const [a, b] of CONNECTIONS) {
          const ax = (1 - lm[a].x) * w;
          const ay = lm[a].y * h;
          const bx = (1 - lm[b].x) * w;
          const by = lm[b].y * h;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.stroke();
        }
        for (let i = 0; i < 21; i++) {
          const px = (1 - lm[i].x) * w;
          const py = lm[i].y * h;
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fillStyle =
            i === 4 || i === 8
              ? "rgba(167, 139, 250, 0.9)"
              : "rgba(124, 106, 247, 0.6)";
          ctx.fill();
        }
      }

      raf = requestAnimationFrame(draw);
    };

    const unsub = gestureEngine.on(onFrame);
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      unsub();
      clearTimeout(labelTimeout.current);
    };
  }, [showSkeleton, showLabel]);

  return (
    <>
      {/* Main canvas overlay */}
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          pointerEvents: "none",
          zIndex: 9998,
        }}
      />

      {/* Webcam PiP */}
      <canvas
        ref={camRef}
        style={{
          position: "fixed",
          bottom: 16,
          right: 16,
          width: 160,
          height: 120,
          borderRadius: 10,
          border: "2px solid rgba(124, 106, 247, 0.4)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
          pointerEvents: "none",
          zIndex: 9999,
          opacity: 0.85,
        }}
      />

      {/* Gesture label toast */}
      {gestureLabel && (
        <div
          style={{
            position: "fixed",
            top: 80,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(15, 17, 23, 0.85)",
            border: "1px solid rgba(124, 106, 247, 0.4)",
            borderRadius: 12,
            padding: "8px 20px",
            color: "#a78bfa",
            fontSize: "0.9rem",
            fontWeight: 600,
            letterSpacing: "0.04em",
            pointerEvents: "none",
            zIndex: 9999,
            backdropFilter: "blur(8px)",
            animation: "gesture-toast 0.3s ease-out",
          }}
        >
          {gestureLabel}
        </div>
      )}

      <style>{`
        @keyframes gesture-toast {
          from { opacity: 0; transform: translateX(-50%) translateY(-8px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </>
  );
};

export default GestureOverlay;
