import { Chess } from "chess.js";
import { pool } from "../config/database.js";
import { getSettings, getActiveApiKey } from "./settings.js";
import { env } from "../config/env.js";
import { listMemories } from "./memory.js";
import { eventBus, EVENT_SYSTEM } from "./eventBus.js";
import type { ResultSetHeader } from "mysql2";

export interface ChessGame {
  id: number;
  fen: string;
  moves: string[];
  status: "active" | "checkmate" | "stalemate" | "draw" | "resigned";
  playerColor: "white" | "black";
  winner: "player" | "ella" | "draw" | null;
}

const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export async function createGame(profileId: number | null): Promise<ChessGame> {
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO chess_games (profile_id, fen, moves, status, player_color)
     VALUES (?, ?, '[]', 'active', 'white')`,
    [profileId, STARTING_FEN],
  );
  return {
    id: (result as ResultSetHeader).insertId,
    fen: STARTING_FEN,
    moves: [],
    status: "active",
    playerColor: "white",
    winner: null,
  };
}

export async function getGame(gameId: number): Promise<ChessGame | null> {
  const [rows] = await pool.execute<any[]>(
    `SELECT id, fen, moves, status, player_color, winner FROM chess_games WHERE id = ?`,
    [gameId],
  );
  if (!rows.length) return null;
  const r = rows[0];
  return {
    id: r.id,
    fen: r.fen,
    moves: typeof r.moves === "string" ? JSON.parse(r.moves) : (r.moves ?? []),
    status: r.status,
    playerColor: r.player_color,
    winner: r.winner,
  };
}

export async function applyPlayerMove(
  gameId: number,
  move: string,
  profileId: number | null,
): Promise<{
  ok: boolean;
  error?: string;
  playerFen: string;
  ellaMove?: string;
  ellaFen?: string;
  status: ChessGame["status"];
  winner: ChessGame["winner"];
}> {
  const game = await getGame(gameId);
  if (!game)
    return {
      ok: false,
      error: "Partie nicht gefunden.",
      playerFen: STARTING_FEN,
      status: "active",
      winner: null,
    };
  if (game.status !== "active")
    return {
      ok: false,
      error: "Partie beendet.",
      playerFen: game.fen,
      status: game.status,
      winner: game.winner,
    };

  const chess = new Chess(game.fen);

  // Spielerzug validieren
  let playerMove;
  try {
    playerMove = chess.move(move);
  } catch {
    return {
      ok: false,
      error: "Ungültiger Zug.",
      playerFen: game.fen,
      status: "active",
      winner: null,
    };
  }
  if (!playerMove)
    return {
      ok: false,
      error: "Ungültiger Zug.",
      playerFen: game.fen,
      status: "active",
      winner: null,
    };

  const playerFen = chess.fen();
  const newMoves = [...game.moves, playerMove.san];

  // Spielende nach Spielerzug prüfen
  if (chess.isGameOver()) {
    const status = getGameStatus(chess);
    const winner = getWinner(status, "white");
    await saveGameState(gameId, playerFen, newMoves, status, winner);
    return { ok: true, playerFen, status, winner };
  }

  // ELLAs Zug
  const ellaMove = await ellaThinks(chess, profileId, newMoves);
  if (!ellaMove) {
    await saveGameState(gameId, playerFen, newMoves, "active", null);
    return { ok: true, playerFen, status: "active", winner: null };
  }

  const ellaMoveResult = chess.move(ellaMove);
  const ellaFen = chess.fen();
  const allMoves = [...newMoves, chess.history().at(-1) ?? ellaMove];

  const status = chess.isGameOver() ? getGameStatus(chess) : "active";
  const winner = status !== "active" ? getWinner(status, "black") : null;

  await saveGameState(gameId, ellaFen, allMoves, status, winner);

  // Fire-and-forget: LLM-Kommentar async — Zug erscheint sofort, Sprache kommt kurz danach
  void generateChessComment(
    chess,
    ellaMoveResult,
    status,
    chess.history().at(-1) ?? ellaMove,
    allMoves,
  ).then((comment) => {
    eventBus.emit(EVENT_SYSTEM, {
      type: "proactive_message",
      payload: { message: comment },
      created_at: new Date().toISOString(),
    });
  });

  return {
    ok: true,
    playerFen,
    ellaMove: chess.history().at(-1) ?? ellaMove,
    ellaFen,
    status,
    winner,
  };
}

export async function resignGame(gameId: number): Promise<void> {
  await pool.execute(
    `UPDATE chess_games SET status='resigned', winner='ella' WHERE id=?`,
    [gameId],
  );
}

export async function reflectOnGame(
  gameId: number,
  profileId: number | null,
): Promise<void> {
  const game = await getGame(gameId);
  if (!game || game.status === "active") return;

  const settings = getSettings();
  const moveSummary = game.moves.slice(-10).join(", ");
  const outcome =
    game.winner === "player"
      ? "Ich habe verloren"
      : game.winner === "ella"
        ? "Ich habe gewonnen"
        : "Remis";

  const prompt = `Du bist ELLA und hast gerade eine Schachpartie beendet (${outcome}).
Letzte Züge: ${moveSummary}

Schreibe einen kurzen Lernhinweis (1-2 Sätze) was du in dieser Partie gelernt oder beobachtet hast.
Formuliere es als persönliche Erkenntnis über Schach-Strategie oder -Taktik.
Kein Ergebnis-Kommentar — nur eine strategische Beobachtung.`;

  let reflection = "";
  try {
    const apiKey = getActiveApiKey(env.openaiApiKey ?? "");
    if (settings.provider === "openai" && apiKey) {
      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 120,
          temperature: 0.8,
        }),
      });
      const data = (await resp.json()) as {
        choices: { message: { content: string } }[];
      };
      reflection = data.choices[0]?.message.content ?? "";
    } else {
      const resp = await fetch(`${env.ollamaBaseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: settings.ollamaModel ?? "llama3.1:8b",
          messages: [{ role: "user", content: prompt }],
          stream: false,
          options: { temperature: 0.8, num_predict: 120 },
        }),
      });
      const data = (await resp.json()) as { message?: { content?: string } };
      reflection = data.message?.content ?? "";
    }

    if (reflection.trim()) {
      await pool.execute(
        `INSERT INTO memories (profile_id, type, content, embedding)
         VALUES (?, 'system', ?, '')`,
        [profileId, `♟ Schach-Erkenntnis: ${reflection.trim()}`],
      );
    }
  } catch {
    // Reflexion ist optional — Fehler still ignorieren
  }
}

// ── Interne Hilfsfunktionen ───────────────────────────────────────────────────

async function ellaThinks(
  chess: Chess,
  _profileId: number | null,
  moveHistory: string[],
): Promise<string | null> {
  const legalMoves = chess.moves({ verbose: true }).map((m) => m.lan);
  if (!legalMoves.length) return null;

  // Schach-Erinnerungen laden
  const memories = await listMemories("system", 50);
  const chessMemories = memories
    .filter(
      (m) =>
        m.content.toLowerCase().includes("schach") ||
        m.content.toLowerCase().includes("chess") ||
        m.content.includes("♟"),
    )
    .slice(0, 8)
    .map((m) => `- ${m.content}`)
    .join("\n");

  const boardAscii = chess.ascii();
  const lastMoves = moveHistory.slice(-6).join(", ");

  const systemPrompt = `Du bist ELLA, eine lernende Schachspielerin. Du spielst Schwarz.

Aktuelle Stellung:
${boardAscii}

FEN: ${chess.fen()}
Bisherige Züge: ${lastMoves || "—"}

Dein Schach-Gedächtnis:
${chessMemories || "Ich lerne noch — denke selbst nach."}

Erlaubte Züge (UCI-Format): ${legalMoves.join(", ")}

Antworte mit GENAU EINEM Zug aus der Liste. Nur der Zug, nichts anderes.`;

  const settings = getSettings();
  let response = "";

  const apiKey = getActiveApiKey(env.openaiApiKey ?? "");

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (settings.provider === "openai" && apiKey) {
        const resp = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: systemPrompt }],
            max_tokens: 10,
            temperature: attempt === 0 ? 0.7 : 0.9,
          }),
        });
        const data = (await resp.json()) as {
          choices: { message: { content: string } }[];
        };
        response = data.choices[0]?.message.content?.trim() ?? "";
      } else {
        const resp = await fetch(`${env.ollamaBaseUrl}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: settings.ollamaModel ?? "llama3.1:8b",
            messages: [{ role: "user", content: systemPrompt }],
            stream: false,
            options: {
              temperature: attempt === 0 ? 0.7 : 0.9,
              num_predict: 10,
            },
          }),
        });
        const data = (await resp.json()) as { message?: { content?: string } };
        response = data.message?.content?.trim() ?? "";
      }

      // Zug aus Antwort extrahieren: erstes Wort/Token
      const candidate = response
        .split(/\s/)[0]
        .toLowerCase()
        .replace(/[^a-h1-8qrkbnpx+=#-]/g, "");
      if (legalMoves.includes(candidate)) return candidate;

      // Auch in der Volltext-Antwort nach einem legalen Zug suchen
      for (const m of legalMoves) {
        if (response.toLowerCase().includes(m)) return m;
      }
    } catch {
      // Nächster Versuch
    }
  }

  // Fallback: zufälliger Zug aus der legalen Liste
  return legalMoves[Math.floor(Math.random() * legalMoves.length)];
}

function getGameStatus(chess: Chess): ChessGame["status"] {
  if (chess.isCheckmate()) return "checkmate";
  if (chess.isStalemate()) return "stalemate";
  if (chess.isDraw()) return "draw";
  return "active";
}

function getWinner(
  status: ChessGame["status"],
  lastMoved: "white" | "black",
): ChessGame["winner"] {
  if (status === "checkmate") return lastMoved === "white" ? "player" : "ella";
  if (status === "stalemate" || status === "draw") return "draw";
  return null;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildFallbackComment(
  chess: Chess,
  moveResult: ReturnType<Chess["move"]>,
  status: ChessGame["status"],
  san: string,
): string {
  if (status === "checkmate") return `${san} — Schachmatt.`;
  if (status === "stalemate" || status === "draw") return "Remis.";
  if (chess.isCheck()) return `${san} — Schach!`;
  if (moveResult?.captured)
    return pick([`Ich nehme — ${san}.`, "Das nehme ich."]);
  return pick([`${san}.`, "Dein Zug.", "Mal sehen."]);
}

async function generateChessComment(
  chess: Chess,
  moveResult: ReturnType<Chess["move"]>,
  status: ChessGame["status"],
  san: string,
  allMoves: string[],
): Promise<string> {
  const fallback = buildFallbackComment(chess, moveResult, status, san);

  const situation =
    status === "checkmate"
      ? "Du hast Schachmatt gesetzt."
      : status === "stalemate" || status === "draw"
        ? "Das Spiel endet Remis."
        : chess.isCheck()
          ? `Du hast den Gegner in Schach gesetzt (${san}).`
          : moveResult?.captured
            ? `Du hast eine Figur geschlagen — ${san}.`
            : `Du hast ${san} gespielt.`;

  const lastMoves = allMoves.slice(-6).join(", ") || "—";
  const moveNo = Math.ceil(allMoves.length / 2);

  const prompt = `Du bist ELLA — eine lernende, charakterstarke Schachspielerin. Du spielst Schwarz, dein Gegner Weiß.

Zug ${moveNo}: ${situation}
Bisherige Partie (SAN): ${lastMoves}

Schreib eine kurze, direkte Reaktion — 1 bis 2 Sätze. Du kannst:
- Deinen Zug kommentieren (ohne deinen Plan zu verraten)
- Den Gegner freundlich provozieren oder necken
- Die Spannung oder Freude am Spiel ausdrücken
- Überraschung oder Respekt zeigen
- Etwas Schlagfertiges über die Situation sagen

Kein Rat an den Gegner, kein Hinweis auf deine nächsten Züge. Frisch, lebendig, persönlich. Auf Deutsch.`;

  const settings = getSettings();
  const apiKey = getActiveApiKey(env.openaiApiKey ?? "");

  try {
    if (settings.provider === "openai" && apiKey) {
      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 80,
          temperature: 0.9,
        }),
      });
      const data = (await resp.json()) as {
        choices: { message: { content: string } }[];
      };
      return data.choices[0]?.message.content?.trim() || fallback;
    } else {
      const resp = await fetch(`${env.ollamaBaseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: settings.ollamaModel ?? "llama3.1:8b",
          messages: [{ role: "user", content: prompt }],
          stream: false,
          options: { temperature: 0.9, num_predict: 80 },
        }),
      });
      const data = (await resp.json()) as { message?: { content?: string } };
      return data.message?.content?.trim() || fallback;
    }
  } catch {
    return fallback;
  }
}

async function saveGameState(
  gameId: number,
  fen: string,
  moves: string[],
  status: ChessGame["status"],
  winner: ChessGame["winner"],
): Promise<void> {
  await pool.execute(
    `UPDATE chess_games SET fen=?, moves=?, status=?, winner=?, moves_count=?, updated_at=NOW() WHERE id=?`,
    [fen, JSON.stringify(moves), status, winner, moves.length, gameId],
  );
}
