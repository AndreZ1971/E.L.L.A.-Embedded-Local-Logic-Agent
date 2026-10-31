import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Chessboard } from "react-chessboard";
import { Chess as ChessEngine } from "chess.js";
import { apiFetch } from "../../lib/api";

const C = {
  bg: "#07090f",
  surface: "#0b0d1a",
  border: "#161929",
  purple: "#7c6af7",
  purpleLight: "#a78bfa",
  purpleMid: "#5b4fd4",
  text: "#e2e8f0",
  muted: "#475569",
  mutedLight: "#64748b",
  green: "#4ade80",
  red: "#f87171",
  amber: "#fbbf24",
} as const;

const THEMES = {
  ella: {
    label: "ELLA",
    dot: C.purple,
    light: { backgroundColor: "#4a4280" },
    dark: { backgroundColor: "#1b1836" },
    glowColor: "124,106,247",
    accent: C.purple,
  },
  holz: {
    label: "Holz",
    dot: "#c4956a",
    light: { backgroundColor: "#f0d9b5" },
    dark: { backgroundColor: "#b58863" },
    glowColor: "181,136,99",
    accent: "#c4956a",
  },
  nacht: {
    label: "Nacht",
    dot: "#4a7ab5",
    light: { backgroundColor: "#2a3a5c" },
    dark: { backgroundColor: "#14202e" },
    glowColor: "74,122,181",
    accent: "#4a7ab5",
  },
  gruen: {
    label: "Grün",
    dot: "#6aaf52",
    light: { backgroundColor: "#ebecd0" },
    dark: { backgroundColor: "#6a8a3e" },
    glowColor: "106,175,82",
    accent: "#6aaf52",
  },
} as const;

type ThemeName = keyof typeof THEMES;
type WCS = React.CSSProperties & { WebkitAppRegion?: "drag" | "no-drag" };

const eAPI = () =>
  (window as { electronAPI?: Record<string, (() => void) | undefined> })
    .electronAPI;

const PARTICLES = [
  { left: "12%", top: "22%", size: 1.5, dur: 9, delay: 0 },
  { left: "82%", top: "14%", size: 2, dur: 13, delay: 2.5 },
  { left: "75%", top: "72%", size: 1.5, dur: 11, delay: 5 },
  { left: "18%", top: "68%", size: 1, dur: 8, delay: 1.2 },
  { left: "48%", top: "8%", size: 2.5, dur: 15, delay: 3.5 },
  { left: "90%", top: "50%", size: 1, dur: 12, delay: 6.5 },
];

// ── Captured-Pieces-Logik ─────────────────────────────────────────────────────
const PIECE_VAL: Record<string, number> = { q: 9, r: 5, b: 3, n: 3, p: 1 };
const PIECE_ORDER = ["q", "r", "b", "n", "p"];
const W_SYM: Record<string, string> = {
  q: "♕",
  r: "♖",
  b: "♗",
  n: "♘",
  p: "♙",
};
const B_SYM: Record<string, string> = {
  q: "♛",
  r: "♜",
  b: "♝",
  n: "♞",
  p: "♟",
};

function computeCaptures(chess: ChessEngine) {
  const start: Record<string, number> = { p: 8, r: 2, n: 2, b: 2, q: 1 };
  const cur: Record<string, number> = {};
  for (const row of chess.board())
    for (const sq of row)
      if (sq) cur[sq.color + sq.type] = (cur[sq.color + sq.type] ?? 0) + 1;

  const capturedByBlack: string[] = []; // weiße Figuren, die ELLA genommen hat
  const capturedByWhite: string[] = []; // schwarze Figuren, die der Spieler genommen hat

  for (const [t, n] of Object.entries(start)) {
    const missW = n - (cur["w" + t] ?? 0);
    const missB = n - (cur["b" + t] ?? 0);
    for (let i = 0; i < missW; i++) capturedByBlack.push(t);
    for (let i = 0; i < missB; i++) capturedByWhite.push(t);
  }

  const materialAdv =
    capturedByWhite.reduce((s, t) => s + (PIECE_VAL[t] ?? 0), 0) -
    capturedByBlack.reduce((s, t) => s + (PIECE_VAL[t] ?? 0), 0);

  return { capturedByBlack, capturedByWhite, materialAdv };
}

// ── Spieler-Streifen ──────────────────────────────────────────────────────────
function PlayerStrip({
  label,
  pieces,
  showWhite,
  advantage,
  accent,
  glowColor,
  isActive,
}: {
  label: string;
  pieces: string[];
  showWhite: boolean;
  advantage: number;
  accent: string;
  glowColor: string;
  isActive: boolean;
}) {
  const sorted = [...pieces].sort(
    (a, b) => PIECE_ORDER.indexOf(a) - PIECE_ORDER.indexOf(b),
  );
  const syms = showWhite ? W_SYM : B_SYM;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        height: 24,
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {/* Figurenfarbe als Dot */}
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          flexShrink: 0,
          background: showWhite
            ? "linear-gradient(135deg, #f0edff, #a89ef0)"
            : "linear-gradient(135deg, #7a6ef0, #1a1648)",
          boxShadow: isActive ? `0 0 7px rgba(${glowColor},0.8)` : "none",
          transition: "box-shadow 0.3s",
        }}
      />
      {/* Name */}
      <span
        style={{
          fontSize: "0.68rem",
          fontWeight: 600,
          minWidth: 30,
          flexShrink: 0,
          color: isActive ? accent : C.muted,
          letterSpacing: "0.04em",
          transition: "color 0.3s",
        }}
      >
        {label}
      </span>
      {/* Geschlagene Figuren */}
      <div
        style={{
          display: "flex",
          gap: 1,
          alignItems: "center",
          flex: 1,
          overflow: "hidden",
        }}
      >
        {sorted.map((t, i) => (
          <span
            key={i}
            style={{
              fontSize: "0.88rem",
              lineHeight: 1,
              color: showWhite ? "#cec6ff" : "#7a6ef0",
              opacity: 0.88,
            }}
          >
            {syms[t] ?? ""}
          </span>
        ))}
      </div>
      {/* Materialvorteil */}
      {advantage > 0 && (
        <span
          style={{
            fontSize: "0.6rem",
            fontWeight: 700,
            color: accent,
            letterSpacing: "0.06em",
            flexShrink: 0,
          }}
        >
          +{advantage}
        </span>
      )}
    </div>
  );
}

// ── Gradient-Definitionen (geteilt, einmal pro Seite) ─────────────────────────
function ChessGradientDefs() {
  return (
    <svg
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
      aria-hidden="true"
    >
      <defs>
        <radialGradient
          id="cpgw"
          cx="14"
          cy="10"
          r="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="28%" stopColor="#edeaff" />
          <stop offset="65%" stopColor="#c8c1f8" />
          <stop offset="100%" stopColor="#8c82cc" />
        </radialGradient>
        <radialGradient
          id="cpgb"
          cx="14"
          cy="10"
          r="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#a090ff" />
          <stop offset="28%" stopColor="#342e82" />
          <stop offset="65%" stopColor="#1a1648" />
          <stop offset="100%" stopColor="#080618" />
        </radialGradient>
        <filter id="cpfw" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow
            dx="0.5"
            dy="2.5"
            stdDeviation="2.2"
            floodColor="rgba(40,15,90,0.55)"
          />
        </filter>
        <filter id="cpfb" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow
            dx="0.5"
            dy="2.5"
            stdDeviation="2.2"
            floodColor="rgba(0,0,0,0.7)"
          />
        </filter>
      </defs>
    </svg>
  );
}

// ── 3D-Figurenfabrik ──────────────────────────────────────────────────────────
function makePiece(isW: boolean, shape: React.ReactNode) {
  const gId = isW ? "cpgw" : "cpgb";
  const fId = isW ? "cpfw" : "cpfb";
  return function Piece3D({ squareWidth }: { squareWidth: number }) {
    return (
      <svg
        viewBox="0 0 45 45"
        width={squareWidth}
        height={squareWidth}
        style={{ display: "block", overflow: "visible" }}
      >
        <ellipse cx="22.5" cy="42.5" rx="10" ry="1.8" fill="rgba(0,0,0,0.22)" />
        <g fill={`url(#${gId})`} filter={`url(#${fId})`}>
          {shape}
        </g>
        <ellipse
          cx="16"
          cy="13"
          rx="3"
          ry="1.8"
          fill="white"
          opacity={isW ? 0.44 : 0.18}
          style={{ pointerEvents: "none" }}
          transform="rotate(-35 16 13)"
        />
      </svg>
    );
  };
}

// ── Figurenformen ─────────────────────────────────────────────────────────────
const PAWN = (
  <>
    <circle cx="22.5" cy="14" r="7" />
    <path d="M 19.5,21 Q 18,24 17,25.5 H 28 Q 27,24 25.5,21 Z" />
    <path d="M 12,39 Q 13,30 17,25.5 H 28 Q 32,30 33,39 Z" />
    <rect x="10" y="38.5" width="25" height="3" rx="1.5" />
  </>
);
const ROOK = (
  <>
    <rect x="11" y="8" width="6.5" height="8" rx="0.5" />
    <rect x="19.25" y="8" width="6.5" height="8" rx="0.5" />
    <rect x="27.5" y="8" width="6.5" height="8" rx="0.5" />
    <rect x="11" y="12" width="23" height="4" />
    <rect x="13" y="16" width="19" height="18" rx="0.5" />
    <rect x="9.5" y="34" width="26" height="2.5" rx="1.5" />
    <rect x="8" y="36.5" width="29" height="3" rx="1.5" />
  </>
);
const KNIGHT = (
  <>
    <path d="M 22,10 C 32.5,11 38.5,18 38,39 H 15 C 15,30 25,32.5 23,18 Z" />
    <path d="M 24,18 C 24.38,20.91 18,21 18,26.5 C 15.38,28.38 12.21,26.84 12,22 C 13.26,16.61 16.26,10.48 22,10 Z" />
  </>
);
const BISHOP = (
  <>
    <circle cx="22.5" cy="10" r="4.5" />
    <rect x="21.2" y="5.5" width="2.6" height="5" rx="1" />
    <path d="M 22.5,14.5 C 14.5,15 12,22 12,29 Q 11,34 12.5,37.5 H 32.5 Q 34,34 33,29 C 33,22 30.5,15 22.5,14.5 Z" />
    <rect x="8.5" y="37" width="28" height="3.5" rx="1.5" />
  </>
);
const QUEEN = (
  <>
    <circle cx="8.5" cy="13" r="3.5" />
    <circle cx="15.5" cy="9.5" r="3.5" />
    <circle cx="22.5" cy="8" r="3.5" />
    <circle cx="29.5" cy="9.5" r="3.5" />
    <circle cx="36.5" cy="13" r="3.5" />
    <path d="M 7.5,22 L 8.5,13 H 36.5 L 37.5,22 Z" />
    <path d="M 7.5,22 Q 9,30 10,36 H 35 Q 36,30 37.5,22 Z" />
    <rect x="8" y="36" width="29" height="2.5" rx="1.5" />
    <rect x="9.5" y="38.5" width="26" height="2.5" rx="1.5" />
  </>
);
const KING = (
  <>
    <rect x="20.5" y="4" width="4.5" height="15" rx="1.5" />
    <rect x="14.5" y="9" width="16" height="4.5" rx="1.5" />
    <path d="M 12,20 Q 10,23 10,26 H 35 Q 35,23 33,20 Z" />
    <path d="M 10,26 Q 10,33 11,36.5 H 34 Q 35,33 35,26 Z" />
    <rect x="8" y="36.5" width="29" height="2.5" rx="1.5" />
    <rect x="9.5" y="39" width="26" height="2" rx="1" />
  </>
);

const CUSTOM_PIECES = {
  wP: makePiece(true, PAWN),
  bP: makePiece(false, PAWN),
  wR: makePiece(true, ROOK),
  bR: makePiece(false, ROOK),
  wN: makePiece(true, KNIGHT),
  bN: makePiece(false, KNIGHT),
  wB: makePiece(true, BISHOP),
  bB: makePiece(false, BISHOP),
  wQ: makePiece(true, QUEEN),
  bQ: makePiece(false, QUEEN),
  wK: makePiece(true, KING),
  bK: makePiece(false, KING),
} as const;

// ── Spielstand speichern/laden ────────────────────────────────────────────────
const SAVE_KEY = "ella_chess_game";

interface SavedGame {
  gameId: number | null;
  fen: string;
  moves: string[];
  savedAt: string;
}

function loadSave(): SavedGame | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? (JSON.parse(raw) as SavedGame) : null;
  } catch {
    return null;
  }
}

function writeSave(gameId: number | null, fen: string, moves: string[]) {
  try {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({ gameId, fen, moves, savedAt: new Date().toISOString() }),
    );
  } catch {
    /* ok */
  }
}

function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* ok */
  }
}

function formatSavedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

// ── Hauptkomponente ───────────────────────────────────────────────────────────
export default function Chess() {
  const [chess] = useState(() => new ChessEngine());
  const [fen, setFen] = useState(chess.fen());
  const [gameId, setGameId] = useState<number | null>(null);
  const [moves, setMoves] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "active" | "paused" | "over">(
    "idle",
  );
  const [result, setResult] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(
    () => loadSave()?.savedAt ?? null,
  );
  const [theme, setTheme] = useState<ThemeName>("ella");
  const [thinking, setThinking] = useState(false);
  const [boardSize, setBoardSize] = useState(440);
  const boardAreaRef = useRef<HTMLDivElement>(null);

  // Responsiver Board-Bereich (nur der innere Brett-Container gemessen)
  useEffect(() => {
    const el = boardAreaRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setBoardSize(Math.floor(Math.min(width, height)) - 24);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Beim Öffnen: gespeichertes Spiel anzeigen oder neues starten
  useEffect(() => {
    const saved = loadSave();
    if (saved) {
      chess.load(saved.fen);
      setFen(saved.fen);
      setMoves(saved.moves);
      setGameId(saved.gameId);
      setSavedAt(saved.savedAt);
      setStatus("paused");
    } else {
      startGame();
    }
    // einmaliger Aufruf
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Geschlagene Figuren aus aktueller Stellung berechnen
  const { capturedByBlack, capturedByWhite, materialAdv } = useMemo(
    () => computeCaptures(chess),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fen],
  );

  const startGame = useCallback(async () => {
    clearSave();
    setSavedAt(null);
    chess.reset();
    setFen(chess.fen());
    setMoves([]);
    setGameId(null);
    setResult(null);
    setStatus("active");
    try {
      const r = await apiFetch("/api/chess/new", { method: "POST" });
      const d = (await r.json()) as { gameId: number };
      setGameId(d.gameId);
    } catch {
      /* lokal spielen */
    }
  }, [chess]);

  const resumeGame = useCallback(() => {
    setStatus("active");
  }, []);

  const pauseGame = useCallback(() => {
    if (status !== "active") return;
    writeSave(gameId, chess.fen(), moves);
    setSavedAt(new Date().toISOString());
    setStatus("paused");
  }, [status, gameId, chess, moves]);

  const resign = useCallback(async () => {
    if (status !== "active") return;
    clearSave();
    setSavedAt(null);
    setStatus("over");
    setResult("Aufgegeben");
    if (gameId) {
      try {
        await apiFetch("/api/chess/resign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameId }),
        });
      } catch {
        /* ok */
      }
    }
  }, [status, gameId]);

  const onDrop = useCallback(
    (sourceSquare: string, targetSquare: string): boolean => {
      if (status !== "active" || thinking) return false;
      const prevFen = chess.fen();
      const move = chess.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });
      if (!move) return false;
      setFen(chess.fen());
      setMoves((m) => [...m, move.san]);
      if (chess.isGameOver()) {
        clearSave();
        setSavedAt(null);
        setStatus("over");
        setResult(chess.isCheckmate() ? "Du gewinnst!" : "Remis");
        if (gameId) {
          void apiFetch("/api/chess/reflect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ gameId }),
          }).catch(() => {
            /* optional */
          });
        }
        return true;
      }
      setThinking(true);
      if (gameId) {
        apiFetch("/api/chess/move", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameId, move: move.lan }),
        })
          .then((r) => r.json())
          .then(
            (d: {
              ok: boolean;
              ellaFen?: string;
              ellaMove?: string;
              status: string;
              winner: string | null;
            }) => {
              if (!d.ok) {
                // Rollback: Board zurücksetzen auf Stand vor dem Zug
                chess.load(prevFen);
                setFen(prevFen);
                setMoves((m) => m.slice(0, -1));
                return;
              }
              if (d.ellaFen) {
                chess.load(d.ellaFen);
                setFen(d.ellaFen);
              }
              if (d.ellaMove) setMoves((m) => [...m, d.ellaMove!]);
              if (d.status !== "active") {
                clearSave();
                setSavedAt(null);
                setStatus("over");
                setResult(
                  d.winner === "ella"
                    ? "ELLA gewinnt"
                    : d.winner === "player"
                      ? "Du gewinnst!"
                      : "Remis",
                );
                void apiFetch("/api/chess/reflect", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ gameId }),
                }).catch(() => {
                  /* optional */
                });
              }
            },
          )
          .catch(() => {
            // Netzwerk-Fehler: Rollback
            chess.load(prevFen);
            setFen(prevFen);
            setMoves((m) => m.slice(0, -1));
          })
          .finally(() => setThinking(false));
      } else {
        setThinking(false);
      }
      return true;
    },
    [status, thinking, chess, gameId],
  );

  const t = THEMES[theme];

  return (
    <div
      style={{
        background: C.bg,
        color: C.text,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        userSelect: "none",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <ChessGradientDefs />

      {/* ── Ambient-Hintergrund ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 440,
            height: 440,
            transform: "translate(-50%, -50%)",
            background: `radial-gradient(ellipse, rgba(${t.glowColor},${thinking ? 0.13 : 0.06}) 0%, transparent 70%)`,
            transition: "background 0.8s ease",
            animation: thinking
              ? "ambient-breathe 1.8s ease-in-out infinite"
              : "none",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(0,0,0,0.65) 100%)",
          }}
        />
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: t.accent,
              opacity: 0.25,
              animation: `particle-float ${p.dur}s ease-in-out ${p.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* ── Titelleiste ── */}
      <div
        style={
          {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 14px",
            height: 36,
            background: "rgba(11,13,26,0.95)",
            backdropFilter: "blur(8px)",
            borderBottom: `1px solid ${C.border}`,
            flexShrink: 0,
            position: "relative",
            zIndex: 10,
            WebkitAppRegion: "drag",
          } as WCS
        }
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <svg
            width="13"
            height="13"
            viewBox="0 0 45 45"
            style={{ opacity: 0.75, fill: t.accent, flexShrink: 0 }}
          >
            <path d="M 22,10 C 32.5,11 38.5,18 38,39 H 15 C 15,30 25,32.5 23,18 Z" />
            <path d="M 24,18 C 24.38,20.91 18,21 18,26.5 C 15.38,28.38 12.21,26.84 12,22 C 13.26,16.61 16.26,10.48 22,10 Z" />
          </svg>
          <span
            style={{
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.12em",
              color: t.accent,
              textTransform: "uppercase",
            }}
          >
            E.L.L.A.
          </span>
          <span
            style={{
              fontSize: "0.7rem",
              letterSpacing: "0.06em",
              color: C.muted,
              textTransform: "uppercase",
            }}
          >
            Schach
          </span>
        </div>
        <div
          style={
            {
              display: "flex",
              alignItems: "center",
              gap: 14,
              WebkitAppRegion: "no-drag",
            } as WCS
          }
        >
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {(Object.keys(THEMES) as ThemeName[]).map((k) => (
              <button
                key={k}
                title={THEMES[k].label}
                onClick={() => setTheme(k)}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  border: "none",
                  cursor: "pointer",
                  background: THEMES[k].dot,
                  padding: 0,
                  flexShrink: 0,
                  boxShadow:
                    k === theme
                      ? `0 0 0 1.5px ${C.bg}, 0 0 0 3px ${THEMES[k].dot}, 0 0 8px ${THEMES[k].dot}`
                      : "none",
                  transition: "box-shadow 0.2s",
                }}
              />
            ))}
          </div>
          <button
            onClick={() => eAPI()?.minimizeChess?.()}
            style={{
              background: "transparent",
              border: "none",
              color: C.muted,
              cursor: "pointer",
              fontSize: "0.75rem",
              padding: "2px 6px",
              lineHeight: 1,
            }}
          >
            —
          </button>
          <button
            onClick={() => eAPI()?.closeChess?.()}
            style={{
              background: "transparent",
              border: "none",
              color: C.muted,
              cursor: "pointer",
              fontSize: "0.75rem",
              padding: "2px 6px",
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* ── Mittelteil: Spieler-Streifen + Brett ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          padding: "8px 16px",
          position: "relative",
          zIndex: 1,
          gap: 6,
        }}
      >
        {/* ELLA (oben) — zeigt weiße Figuren, die sie geschlagen hat */}
        <PlayerStrip
          label="ELLA"
          pieces={capturedByBlack}
          showWhite
          advantage={materialAdv < 0 ? -materialAdv : 0}
          accent={t.accent}
          glowColor={t.glowColor}
          isActive={thinking && status === "active"}
        />

        {/* Brett-Container — boardAreaRef misst nur diesen Bereich */}
        <div
          ref={boardAreaRef}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 0,
          }}
        >
          <div
            style={{
              borderRadius: 8,
              overflow: "hidden",
              flexShrink: 0,
              boxShadow: thinking
                ? `0 0 0 1px rgba(${t.glowColor},0.45), 0 0 35px rgba(${t.glowColor},0.38), 0 0 70px rgba(${t.glowColor},0.15), 0 4px 24px rgba(0,0,0,0.6)`
                : `0 0 0 1px rgba(${t.glowColor},0.22), 0 0 22px rgba(${t.glowColor},0.12), 0 4px 20px rgba(0,0,0,0.5)`,
              transition: "box-shadow 0.6s ease",
              animation: thinking
                ? "board-glow-pulse 1.8s ease-in-out infinite"
                : "none",
            }}
          >
            <Chessboard
              position={fen}
              onPieceDrop={onDrop}
              customDarkSquareStyle={t.dark}
              customLightSquareStyle={t.light}
              boardWidth={boardSize}
              customPieces={CUSTOM_PIECES}
              arePiecesDraggable={status === "active" && !thinking}
              isDraggablePiece={({ piece }: { piece: string }) =>
                piece.startsWith("w")
              }
              areArrowsAllowed
              animationDuration={180}
              showBoardNotation
            />
          </div>
        </div>

        {/* Du (unten) — zeigt schwarze Figuren, die der Spieler geschlagen hat */}
        <PlayerStrip
          label="Du"
          pieces={capturedByWhite}
          showWhite={false}
          advantage={materialAdv > 0 ? materialAdv : 0}
          accent={t.accent}
          glowColor={t.glowColor}
          isActive={!thinking && status === "active"}
        />
      </div>

      {/* ── Steuerleiste ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 14px",
          height: 46,
          background: "rgba(11,13,26,0.95)",
          backdropFilter: "blur(8px)",
          borderTop: `1px solid ${C.border}`,
          flexShrink: 0,
          gap: 10,
          position: "relative",
          zIndex: 10,
        }}
      >
        <div
          style={{
            flex: 1,
            fontSize: "0.75rem",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {status === "idle" && (
            <span style={{ color: C.muted, fontStyle: "italic" }}>
              Bereit für eine Partie
            </span>
          )}
          {status === "paused" && (
            <>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: C.amber,
                  display: "inline-block",
                  flexShrink: 0,
                  boxShadow: `0 0 6px ${C.amber}`,
                }}
              />
              <span style={{ color: C.amber, fontWeight: 500 }}>Pausiert</span>
              {savedAt && (
                <span style={{ color: C.muted, fontSize: "0.68rem" }}>
                  · {formatSavedAt(savedAt)}
                </span>
              )}
            </>
          )}
          {status === "active" && !thinking && (
            <>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: C.green,
                  display: "inline-block",
                  flexShrink: 0,
                  boxShadow: `0 0 6px ${C.green}`,
                }}
              />
              <span style={{ color: C.green, fontWeight: 500 }}>Dein Zug</span>
              {moves.length > 0 && (
                <span style={{ color: C.muted, fontSize: "0.68rem" }}>
                  · Zug {Math.floor(moves.length / 2) + 1}
                </span>
              )}
            </>
          )}
          {status === "active" && thinking && (
            <>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: t.accent,
                  display: "inline-block",
                  flexShrink: 0,
                  animation: "ella-pulse 1.4s ease-in-out infinite",
                  boxShadow: `0 0 8px ${t.accent}`,
                }}
              />
              <span style={{ color: t.accent, fontWeight: 500 }}>
                ELLA denkt…
              </span>
            </>
          )}
          {status === "over" && result && (
            <>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  display: "inline-block",
                  flexShrink: 0,
                  background: result.includes("ELLA")
                    ? C.red
                    : result.includes("Du")
                      ? C.green
                      : C.amber,
                  boxShadow: `0 0 6px ${result.includes("ELLA") ? C.red : result.includes("Du") ? C.green : C.amber}`,
                }}
              />
              <span
                style={{
                  color: result.includes("ELLA")
                    ? C.red
                    : result.includes("Du")
                      ? C.green
                      : C.amber,
                  fontWeight: 700,
                }}
              >
                {result}
              </span>
            </>
          )}
        </div>

        <div style={{ display: "flex", gap: 7 }}>
          {/* Weiter spielen — nur wenn Partie pausiert */}
          {status === "paused" && (
            <button
              onClick={resumeGame}
              style={{
                background: `linear-gradient(135deg, ${t.accent}, ${C.purpleMid})`,
                border: "none",
                borderRadius: 5,
                color: "#fff",
                cursor: "pointer",
                fontSize: "0.73rem",
                fontWeight: 600,
                padding: "5px 14px",
                letterSpacing: "0.04em",
                boxShadow: `0 2px 12px rgba(${t.glowColor},0.4)`,
              }}
            >
              ▶ Weiter
            </button>
          )}
          <button
            onClick={startGame}
            style={{
              background:
                status === "paused"
                  ? "transparent"
                  : `linear-gradient(135deg, ${t.accent}, ${C.purpleMid})`,
              border: status === "paused" ? `1px solid ${C.border}` : "none",
              borderRadius: 5,
              color: status === "paused" ? C.muted : "#fff",
              cursor: "pointer",
              fontSize: "0.73rem",
              fontWeight: 600,
              padding: "5px 14px",
              letterSpacing: "0.04em",
              boxShadow:
                status === "paused"
                  ? "none"
                  : `0 2px 12px rgba(${t.glowColor},0.4)`,
            }}
          >
            {status === "idle" ? "Neue Partie" : "Neu"}
          </button>
          {/* Pause — nur während aktiver Partie und wenn ELLA nicht denkt */}
          {status === "active" && !thinking && (
            <button
              onClick={pauseGame}
              style={{
                background: "transparent",
                border: `1px solid ${C.border}`,
                borderRadius: 5,
                color: C.muted,
                cursor: "pointer",
                fontSize: "0.73rem",
                padding: "4px 14px",
              }}
            >
              ⏸ Pause
            </button>
          )}
          {status === "active" && (
            <button
              onClick={resign}
              style={{
                background: "transparent",
                border: `1px solid ${C.border}`,
                borderRadius: 5,
                color: C.muted,
                cursor: "pointer",
                fontSize: "0.73rem",
                padding: "4px 14px",
              }}
            >
              Aufgeben
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes ella-pulse       { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.3;transform:scale(0.8)} }
        @keyframes board-glow-pulse { 0%,100%{filter:brightness(1)} 50%{filter:brightness(1.07)} }
        @keyframes ambient-breathe  { 0%,100%{opacity:1;transform:translate(-50%,-50%) scale(1)} 50%{opacity:0.6;transform:translate(-50%,-50%) scale(1.15)} }
        @keyframes particle-float   { 0%{transform:translateY(0px) translateX(0px);opacity:0.2} 33%{transform:translateY(-8px) translateX(5px);opacity:0.35} 66%{transform:translateY(4px) translateX(-4px);opacity:0.15} 100%{transform:translateY(0px) translateX(0px);opacity:0.2} }
        * { box-sizing: border-box; }
        button:active { transform: scale(0.96); }
      `}</style>
    </div>
  );
}
