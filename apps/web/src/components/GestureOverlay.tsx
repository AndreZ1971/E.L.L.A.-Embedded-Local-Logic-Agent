import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  gestureEngine,
  type GestureFrame,
  type GestureType,
  type HandData,
} from "../services/gestureEngine";

const GESTURE_LABELS: Record<GestureType, string> = {
  none: "",
  pinch: "✊ Greifen",
  pinch_drag: "✊ Verschieben",
  point: "☝ Zeigen",
  palm: "✋ Scroll",
  fist: "👊 Schließen",
  swipe_left: "← Wisch",
  swipe_right: "Wisch →",
};

type Pt = { x: number; y: number };
type RGB = { r: number; g: number; b: number };

const HAND_COLORS: Record<string, RGB> = {
  Left: { r: 130, g: 140, b: 255 },
  Right: { r: 80, g: 220, b: 200 },
};

// Finger chains: base → tip
const FINGER_CHAINS = [
  [1, 2, 3, 4],
  [5, 6, 7, 8],
  [9, 10, 11, 12],
  [13, 14, 15, 16],
  [17, 18, 19, 20],
];

// Width at each joint as fraction of handSize (wrist → middle-MCP distance)
const JOINT_W = [
  [0.24, 0.2, 0.17, 0.14],
  [0.17, 0.14, 0.12, 0.09],
  [0.18, 0.15, 0.12, 0.09],
  [0.16, 0.13, 0.11, 0.08],
  [0.14, 0.12, 0.1, 0.07],
];

// Palm skeleton: overlapping thick lines fill the palm
const PALM_BONES: [number, number, number][] = [
  [0, 1, 0.3],
  [0, 5, 0.28],
  [0, 9, 0.3],
  [0, 13, 0.28],
  [0, 17, 0.26],
  [1, 2, 0.22],
  [1, 5, 0.2],
  [5, 9, 0.18],
  [9, 13, 0.18],
  [13, 17, 0.18],
];

const FINGERTIPS = [4, 8, 12, 16, 20];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  r: number;
  g: number;
  b: number;
}

interface ClickRipple {
  x: number;
  y: number;
  frame: number;
  r: number;
  g: number;
  b: number;
}

const CLICK_MAX_MS = 500;
const CLICK_MAX_PX = 25;
const SCROLL_SPEED = 4.5;
const SCROLL_EMA = 0.3;
const RIPPLE_FRAMES = 20;

function findScrollableFrom(start: Element | null): Element | null {
  let el = start;
  while (el && el !== document.documentElement) {
    const s = window.getComputedStyle(el);
    if (
      (s.overflowY === "auto" || s.overflowY === "scroll") &&
      el.scrollHeight > el.clientHeight
    ) {
      return el;
    }
    el = el.parentElement;
  }
  return document.documentElement;
}

interface Props {
  showSkeleton?: boolean;
}

const GestureOverlay: React.FC<Props> = ({ showSkeleton = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const camRef = useRef<HTMLCanvasElement>(null);
  const offCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<GestureFrame | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const ripplesRef = useRef<ClickRipple[]>([]);
  const timeRef = useRef(0);
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

    const offCanvas = document.createElement("canvas");
    offCanvasRef.current = offCanvas;
    const offCtx = offCanvas.getContext("2d");
    if (!offCtx) return;

    let prevGesture: GestureType = "none";
    let raf = 0;

    // ── Pointer event bridge ──
    const SYNTH_PID = 9999;
    const origSetCapture = Element.prototype.setPointerCapture;
    const origReleaseCapture = Element.prototype.releasePointerCapture;
    Element.prototype.setPointerCapture = function (id: number) {
      if (id === SYNTH_PID) return;
      return origSetCapture.call(this, id);
    };
    Element.prototype.releasePointerCapture = function (id: number) {
      if (id === SYNTH_PID) return;
      return origReleaseCapture.call(this, id);
    };

    // Find the real element under the cursor, skipping our overlay canvases
    const elementBehind = (x: number, y: number): Element | null => {
      for (const el of document.elementsFromPoint(x, y)) {
        if (el === canvas || el === camCanvas) continue;
        return el;
      }
      return null;
    };

    let dragTarget: Element | null = null;
    let hoverTarget: Element | null = null;
    let lastCursorY = 0;
    let scrollSmooth = 0;
    let scrollTarget: Element | null = null;
    let pinchStartTime = 0;
    let pinchStartPos = { x: 0, y: 0 };
    let pinchMoved = false;
    let swipeTriggered = false;

    const mkPtr = (type: string, x: number, y: number): PointerEvent =>
      new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        composed: true,
        view: window,
        clientX: x,
        clientY: y,
        screenX: x,
        screenY: y,
        pointerId: SYNTH_PID,
        pointerType: "mouse",
        isPrimary: true,
        button: 0,
        buttons: type === "pointerup" ? 0 : 1,
        width: 1,
        height: 1,
      });

    const onFrame = (f: GestureFrame) => {
      frameRef.current = f;
      if (f.gesture !== "none" && f.gesture !== prevGesture)
        showLabel(f.gesture);

      const { screenX: sx, screenY: sy } = f.cursor;
      const wasPinch = prevGesture === "pinch" || prevGesture === "pinch_drag";
      const isPinch = f.gesture === "pinch" || f.gesture === "pinch_drag";

      // ── Scroll: open palm ──
      if (f.gesture === "palm") {
        if (prevGesture !== "palm") {
          scrollTarget = findScrollableFrom(elementBehind(sx, sy));
          scrollSmooth = 0;
        }
        if (lastCursorY !== 0 && scrollTarget) {
          const rawDelta = lastCursorY - sy;
          scrollSmooth += (rawDelta - scrollSmooth) * SCROLL_EMA;
          if (Math.abs(scrollSmooth) > 0.5) {
            scrollTarget.scrollBy({ top: scrollSmooth * SCROLL_SPEED });
          }
        }
      } else {
        scrollSmooth = 0;
        scrollTarget = null;
      }

      // ── Click / Drag: pinch ──
      if (isPinch && !wasPinch) {
        pinchStartTime = performance.now();
        pinchStartPos = { x: sx, y: sy };
        pinchMoved = false;

        const hit = elementBehind(sx, sy);
        dragTarget =
          hit instanceof SVGElement
            ? (hit.closest('g[cursor="pointer"]') ?? hit)
            : hit;
        if (dragTarget) {
          dragTarget.dispatchEvent(mkPtr("pointerdown", sx, sy));
        }
      }

      if (f.gesture === "pinch_drag") {
        if (
          Math.hypot(sx - pinchStartPos.x, sy - pinchStartPos.y) > CLICK_MAX_PX
        ) {
          pinchMoved = true;
        }
        window.dispatchEvent(mkPtr("pointermove", sx, sy));
        if (dragTarget && !(dragTarget instanceof SVGElement)) {
          dragTarget.dispatchEvent(mkPtr("pointermove", sx, sy));
        }
      }

      if (!isPinch && wasPinch) {
        window.dispatchEvent(mkPtr("pointerup", sx, sy));
        if (dragTarget && !(dragTarget instanceof SVGElement)) {
          dragTarget.dispatchEvent(mkPtr("pointerup", sx, sy));
        }

        const duration = performance.now() - pinchStartTime;
        if (duration < CLICK_MAX_MS && !pinchMoved) {
          const el = elementBehind(sx, sy);
          if (el) {
            el.dispatchEvent(
              new MouseEvent("click", {
                bubbles: true,
                cancelable: true,
                clientX: sx,
                clientY: sy,
                view: window,
              }),
            );
            const pc = f.hands?.[0]
              ? HAND_COLORS[f.hands[0].handedness]
              : HAND_COLORS.Left;
            ripplesRef.current.push({
              x: sx,
              y: sy,
              frame: 0,
              r: pc.r,
              g: pc.g,
              b: pc.b,
            });
          }
        }
        dragTarget = null;
      }

      // ── Hover ──
      if (!isPinch && f.gesture !== "palm") {
        const el = elementBehind(sx, sy);
        if (el !== hoverTarget) {
          hoverTarget?.dispatchEvent(
            new MouseEvent("mouseleave", {
              bubbles: false,
              clientX: sx,
              clientY: sy,
            }),
          );
          el?.dispatchEvent(
            new MouseEvent("mouseenter", {
              bubbles: false,
              clientX: sx,
              clientY: sy,
            }),
          );
          hoverTarget = el;
        }
      }

      // ── Swipe navigation ──
      if (f.gesture === "swipe_left" && !swipeTriggered) {
        swipeTriggered = true;
        window.history.back();
      } else if (f.gesture === "swipe_right" && !swipeTriggered) {
        swipeTriggered = true;
        window.history.forward();
      } else if (f.gesture !== "swipe_left" && f.gesture !== "swipe_right") {
        swipeTriggered = false;
      }

      // ── Fist = Escape ──
      if (f.gesture === "fist" && prevGesture !== "fist") {
        document.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "Escape",
            code: "Escape",
            bubbles: true,
            cancelable: true,
          }),
        );
      }

      lastCursorY = sy;
      prevGesture = f.gesture;
    };

    const toScreen = (
      lm: { x: number; y: number }[],
      i: number,
      w: number,
      h: number,
    ): Pt => ({
      x: (1 - lm[i].x) * w,
      y: lm[i].y * h,
    });

    // ── Draw solid hand silhouette on offscreen canvas ──
    const drawHandShape = (
      oc: CanvasRenderingContext2D,
      hand: HandData,
      w: number,
      h: number,
    ) => {
      const lm = hand.landmarks;
      const p = (i: number) => toScreen(lm, i, w, h);
      const col = HAND_COLORS[hand.handedness];

      oc.clearRect(0, 0, w, h);
      const color = `rgb(${col.r}, ${col.g}, ${col.b})`;
      oc.fillStyle = color;
      oc.strokeStyle = color;
      oc.lineCap = "round";
      oc.lineJoin = "round";

      const wrist = p(0);
      const midMCP = p(9);
      const handSize = Math.hypot(midMCP.x - wrist.x, midMCP.y - wrist.y);

      // Palm: thick rounded connections that overlap to fill the area
      for (const [a, b, wR] of PALM_BONES) {
        const pa = p(a);
        const pb = p(b);
        oc.beginPath();
        oc.moveTo(pa.x, pa.y);
        oc.lineTo(pb.x, pb.y);
        oc.lineWidth = wR * handSize;
        oc.stroke();
      }

      // Wrist circle
      oc.beginPath();
      oc.arc(wrist.x, wrist.y, handSize * 0.16, 0, Math.PI * 2);
      oc.fill();

      // Thenar eminence (thumb-side muscle)
      const p1 = p(1);
      const p2 = p(2);
      oc.beginPath();
      oc.arc(
        (wrist.x + p1.x + p2.x) / 3,
        (wrist.y + p1.y + p2.y) / 3,
        handSize * 0.14,
        0,
        Math.PI * 2,
      );
      oc.fill();

      // Hypothenar (pinky-side muscle)
      const p17 = p(17);
      oc.beginPath();
      oc.arc(
        (wrist.x + p17.x) / 2,
        (wrist.y + p17.y) / 2,
        handSize * 0.12,
        0,
        Math.PI * 2,
      );
      oc.fill();

      // Fingers: each segment with tapering width
      for (let fi = 0; fi < FINGER_CHAINS.length; fi++) {
        const chain = FINGER_CHAINS[fi];
        const ws = JOINT_W[fi];
        for (let si = 0; si < chain.length - 1; si++) {
          const a = p(chain[si]);
          const b = p(chain[si + 1]);
          const segW = ((ws[si] + ws[si + 1]) / 2) * handSize;
          oc.beginPath();
          oc.moveTo(a.x, a.y);
          oc.lineTo(b.x, b.y);
          oc.lineWidth = segW;
          oc.stroke();
        }
      }
    };

    // ── Ghost composite: blur the entire silhouette in layers ──
    const drawGhostHand = (
      ctx: CanvasRenderingContext2D,
      hand: HandData,
      w: number,
      h: number,
      t: number,
    ) => {
      const col = HAND_COLORS[hand.handedness];
      const lm = hand.landmarks;
      const p = (i: number) => toScreen(lm, i, w, h);
      const pulse = Math.sin(t * 0.05) * 0.07 + 0.93;

      if (offCanvas.width !== w || offCanvas.height !== h) {
        offCanvas.width = w;
        offCanvas.height = h;
      }
      drawHandShape(offCtx, hand, w, h);

      // Layer 1: Wide ghostly aura
      ctx.save();
      ctx.filter = "blur(22px)";
      ctx.globalAlpha = 0.09 * pulse;
      ctx.drawImage(offCanvas, 0, 0);
      ctx.restore();

      // Layer 2: Medium glow
      ctx.save();
      ctx.filter = "blur(10px)";
      ctx.globalAlpha = 0.14 * pulse;
      ctx.drawImage(offCanvas, 0, 0);
      ctx.restore();

      // Layer 3: Visible hand shape
      ctx.save();
      ctx.filter = "blur(4px)";
      ctx.globalAlpha = 0.22 * pulse;
      ctx.drawImage(offCanvas, 0, 0);
      ctx.restore();

      // Layer 4: Sharp core for definition
      ctx.save();
      ctx.globalAlpha = 0.06;
      ctx.drawImage(offCanvas, 0, 0);
      ctx.restore();

      // ── Fingertip highlights ──
      for (const tip of FINGERTIPS) {
        const pt = p(tip);
        const glow = ctx.createRadialGradient(
          pt.x,
          pt.y,
          0,
          pt.x,
          pt.y,
          12 * pulse,
        );
        glow.addColorStop(
          0,
          `rgba(${Math.min(col.r + 80, 255)}, ${Math.min(col.g + 80, 255)}, ${Math.min(col.b + 80, 255)}, ${0.35 * pulse})`,
        );
        glow.addColorStop(
          0.5,
          `rgba(${col.r}, ${col.g}, ${col.b}, ${0.08 * pulse})`,
        );
        glow.addColorStop(1, `rgba(${col.r}, ${col.g}, ${col.b}, 0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 12 * pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.6 * pulse})`;
        ctx.fill();
      }

      // ── Pinch energy ──
      if (
        (hand.gesture === "pinch" || hand.gesture === "pinch_drag") &&
        hand.pinchDistance < 0.1
      ) {
        const thumb = p(4);
        const index = p(8);
        const mx = (thumb.x + index.x) / 2;
        const my = (thumb.y + index.y) / 2;

        const arc = ctx.createRadialGradient(mx, my, 0, mx, my, 28);
        arc.addColorStop(
          0,
          `rgba(${Math.min(col.r + 50, 255)}, ${Math.min(col.g + 50, 255)}, ${Math.min(col.b + 50, 255)}, ${0.45 * pulse})`,
        );
        arc.addColorStop(
          0.5,
          `rgba(${col.r}, ${col.g}, ${col.b}, ${0.1 * pulse})`,
        );
        arc.addColorStop(1, `rgba(${col.r}, ${col.g}, ${col.b}, 0)`);
        ctx.fillStyle = arc;
        ctx.beginPath();
        ctx.arc(mx, my, 28, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(thumb.x, thumb.y);
        for (let s = 1; s < 5; s++) {
          const frac = s / 5;
          ctx.lineTo(
            thumb.x + (index.x - thumb.x) * frac + (Math.random() - 0.5) * 8,
            thumb.y + (index.y - thumb.y) * frac + (Math.random() - 0.5) * 8,
          );
        }
        ctx.lineTo(index.x, index.y);
        ctx.save();
        ctx.filter = "blur(3px)";
        ctx.strokeStyle = `rgba(${Math.min(col.r + 50, 255)}, ${Math.min(col.g + 50, 255)}, ${Math.min(col.b + 50, 255)}, 0.5)`;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.restore();
      }

      // Particles from fingertips
      const active = hand.gesture !== "none" && hand.gesture !== "fist";
      const rate = active ? 0.3 : 0.06;
      for (const tip of FINGERTIPS) {
        if (Math.random() > rate) continue;
        const pt = p(tip);
        particlesRef.current.push({
          x: pt.x + (Math.random() - 0.5) * 6,
          y: pt.y + (Math.random() - 0.5) * 6,
          vx: (Math.random() - 0.5) * 1.2,
          vy: -Math.random() * 1.0 - 0.2,
          life: 0,
          maxLife: 20 + Math.random() * 25,
          size: 1 + Math.random() * 2,
          r: col.r,
          g: col.g,
          b: col.b,
        });
      }
      if (particlesRef.current.length > 120) {
        particlesRef.current = particlesRef.current.slice(-80);
      }
    };

    // ── Energy bridge between two hands ──
    const drawBridge = (
      ctx: CanvasRenderingContext2D,
      h1: HandData,
      h2: HandData,
      w: number,
      h: number,
      t: number,
    ) => {
      const c1 = HAND_COLORS[h1.handedness];
      const c2 = HAND_COLORS[h2.handedness];
      for (const t1 of FINGERTIPS) {
        const a = toScreen(h1.landmarks, t1, w, h);
        for (const t2 of FINGERTIPS) {
          const b = toScreen(h2.landmarks, t2, w, h);
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 200) {
            const fade = 1 - dist / 200;
            ctx.save();
            ctx.filter = "blur(3px)";
            const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
            grad.addColorStop(
              0,
              `rgba(${c1.r}, ${c1.g}, ${c1.b}, ${fade * 0.12})`,
            );
            grad.addColorStop(0.5, `rgba(255, 255, 255, ${fade * 0.04})`);
            grad.addColorStop(
              1,
              `rgba(${c2.r}, ${c2.g}, ${c2.b}, ${fade * 0.12})`,
            );
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            const cpx = (a.x + b.x) / 2 + Math.sin(t * 0.04) * 12;
            const cpy = (a.y + b.y) / 2 - 15;
            ctx.quadraticCurveTo(cpx, cpy, b.x, b.y);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
          }
        }
      }
    };

    const drawParticles = (ctx: CanvasRenderingContext2D) => {
      const alive: Particle[] = [];
      for (const pt of particlesRef.current) {
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.vy += 0.01;
        pt.life++;
        if (pt.life >= pt.maxLife) continue;
        const progress = pt.life / pt.maxLife;
        const alpha = (1 - progress) * (1 - progress);
        const size = pt.size * (1 - progress * 0.5);

        const pg = ctx.createRadialGradient(
          pt.x,
          pt.y,
          0,
          pt.x,
          pt.y,
          size * 3,
        );
        pg.addColorStop(0, `rgba(${pt.r}, ${pt.g}, ${pt.b}, ${alpha * 0.25})`);
        pg.addColorStop(1, `rgba(${pt.r}, ${pt.g}, ${pt.b}, 0)`);
        ctx.fillStyle = pg;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, size * 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, size * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.4})`;
        ctx.fill();

        alive.push(pt);
      }
      particlesRef.current = alive;
    };

    // ── Main loop ──
    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
      ctx.clearRect(0, 0, w, h);
      timeRef.current++;
      const t = timeRef.current;

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
      drawParticles(ctx);

      if (!f) {
        raf = requestAnimationFrame(draw);
        return;
      }

      if (showSkeleton && f.hands?.length > 0) {
        for (const hand of f.hands) drawGhostHand(ctx, hand, w, h, t);
        if (f.hands.length === 2)
          drawBridge(ctx, f.hands[0], f.hands[1], w, h, t);
      }

      // ── Cursor ──
      const { screenX: sx, screenY: sy } = f.cursor;
      const isPinch = f.gesture === "pinch" || f.gesture === "pinch_drag";
      const pc = f.hands?.[0]
        ? HAND_COLORS[f.hands[0].handedness]
        : HAND_COLORS.Left;

      const ringA = isPinch ? 0.5 : 0.2;
      const ringR = isPinch ? 22 : 16;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(t * 0.02);
      ctx.beginPath();
      ctx.arc(0, 0, ringR, 0, Math.PI * 1.4);
      ctx.strokeStyle = `rgba(${pc.r}, ${pc.g}, ${pc.b}, ${ringA})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.rotate(-t * 0.04);
      ctx.beginPath();
      ctx.arc(0, 0, ringR - 4, Math.PI * 0.5, Math.PI * 1.7);
      ctx.strokeStyle = `rgba(${pc.r}, ${pc.g}, ${pc.b}, ${ringA * 0.5})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      const cGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, 35);
      const cc = isPinch
        ? {
            r: Math.min(pc.r + 30, 255),
            g: Math.min(pc.g + 30, 255),
            b: Math.min(pc.b + 30, 255),
          }
        : f.gesture === "palm"
          ? { r: 248, g: 113, b: 113 }
          : pc;
      cGrad.addColorStop(0, `rgba(${cc.r}, ${cc.g}, ${cc.b}, 0.3)`);
      cGrad.addColorStop(0.4, `rgba(${cc.r}, ${cc.g}, ${cc.b}, 0.06)`);
      cGrad.addColorStop(1, `rgba(${cc.r}, ${cc.g}, ${cc.b}, 0)`);
      ctx.fillStyle = cGrad;
      ctx.beginPath();
      ctx.arc(sx, sy, 35, 0, Math.PI * 2);
      ctx.fill();

      const ds = isPinch ? 5 : 3.5;
      ctx.beginPath();
      ctx.arc(sx, sy, ds, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${cc.r}, ${cc.g}, ${cc.b}, 0.9)`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sx, sy, ds * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.fill();

      // ── Scroll arrows when palm active ──
      if (f.gesture === "palm") {
        const arrowA = 0.4 + Math.sin(t * 0.12) * 0.15;
        ctx.save();
        ctx.translate(sx, sy);
        ctx.strokeStyle = `rgba(248, 113, 113, ${arrowA})`;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        // Up arrow
        ctx.beginPath();
        ctx.moveTo(-6, -28);
        ctx.lineTo(0, -35);
        ctx.lineTo(6, -28);
        ctx.stroke();
        // Down arrow
        ctx.beginPath();
        ctx.moveTo(-6, 28);
        ctx.lineTo(0, 35);
        ctx.lineTo(6, 28);
        ctx.stroke();
        ctx.restore();
      }

      // ── Click ripples ──
      const aliveRipples: ClickRipple[] = [];
      for (const rp of ripplesRef.current) {
        rp.frame++;
        if (rp.frame >= RIPPLE_FRAMES) continue;
        const prog = rp.frame / RIPPLE_FRAMES;
        const radius = 5 + prog * 35;
        const alpha = (1 - prog) * 0.5;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${rp.r}, ${rp.g}, ${rp.b}, ${alpha})`;
        ctx.lineWidth = 2 * (1 - prog);
        ctx.stroke();
        aliveRipples.push(rp);
      }
      ripplesRef.current = aliveRipples;

      raf = requestAnimationFrame(draw);
    };

    const unsub = gestureEngine.on(onFrame);
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      unsub();
      clearTimeout(labelTimeout.current);
      Element.prototype.setPointerCapture = origSetCapture;
      Element.prototype.releasePointerCapture = origReleaseCapture;
    };
  }, [showSkeleton, showLabel]);

  return (
    <>
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
      <canvas
        ref={camRef}
        style={{
          position: "fixed",
          bottom: 16,
          right: 16,
          width: 160,
          height: 120,
          borderRadius: 10,
          border: "1px solid rgba(130, 140, 255, 0.25)",
          boxShadow:
            "0 0 20px rgba(130, 140, 255, 0.1), 0 4px 20px rgba(0,0,0,0.5)",
          pointerEvents: "none",
          zIndex: 9999,
          opacity: 0.8,
        }}
      />
      {gestureLabel && (
        <div
          style={{
            position: "fixed",
            top: 80,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(15, 17, 23, 0.85)",
            border: "1px solid rgba(130, 140, 255, 0.25)",
            borderRadius: 12,
            padding: "8px 20px",
            color: "rgba(170, 180, 255, 0.9)",
            fontSize: "0.9rem",
            fontWeight: 600,
            letterSpacing: "0.04em",
            pointerEvents: "none",
            zIndex: 9999,
            backdropFilter: "blur(8px)",
            boxShadow: "0 0 24px rgba(130, 140, 255, 0.12)",
            animation: "gesture-toast 0.3s ease-out",
          }}
        >
          {gestureLabel}
        </div>
      )}
      <style>{`
        @keyframes gesture-toast {
          from { opacity: 0; transform: translateX(-50%) translateY(-8px) scale(0.95); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
};

export default GestureOverlay;
