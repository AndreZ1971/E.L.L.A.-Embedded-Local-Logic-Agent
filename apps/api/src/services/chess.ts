import { Chess } from "chess.js";
import { pool } from "../config/database.js";
import { getSettings, cloudAllowed, cloudFirst } from "./settings.js";
import { env } from "../config/env.js";
import { remember, listMemoriesPaged } from "./memory.js";
import { sendProactiveMessage } from "./proactive.js";
import { openaiRequest } from "./openai.js";
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

  // Spielerzug validieren — LAN (e2e4), SAN (e4) und Objekt-Form unterstützen
  let playerMove;
  try {
    const parsed = parseMoveInput(move);
    playerMove = chess.move(parsed);
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
    const winner = getWinner(status, game.playerColor, game.playerColor);
    await saveGameState(gameId, playerFen, newMoves, status, winner);
    return { ok: true, playerFen, status, winner };
  }

  // ELLAs Zug
  const ellaMove = await ellaThinks(chess, profileId, newMoves);
  if (!ellaMove) {
    await saveGameState(gameId, playerFen, newMoves, "active", null);
    return { ok: true, playerFen, status: "active", winner: null };
  }

  let ellaMoveResult;
  try {
    ellaMoveResult = chess.move(ellaMove);
  } catch {
    // ELLA-Zug ungültig trotz Validierung — Partie bleibt aktiv
    await saveGameState(gameId, playerFen, newMoves, "active", null);
    return { ok: true, playerFen, status: "active", winner: null };
  }
  if (!ellaMoveResult) {
    await saveGameState(gameId, playerFen, newMoves, "active", null);
    return { ok: true, playerFen, status: "active", winner: null };
  }

  const ellaFen = chess.fen();
  const allMoves = [...newMoves, ellaMoveResult.san];

  const ellaColor = game.playerColor === "white" ? "black" : "white";
  const status = chess.isGameOver() ? getGameStatus(chess) : "active";
  const winner =
    status !== "active" ? getWinner(status, ellaColor, game.playerColor) : null;

  await saveGameState(gameId, ellaFen, allMoves, status, winner);

  // Fire-and-forget: LLM-Kommentar async — Zug erscheint sofort, Sprache kommt kurz danach
  void generateChessComment(
    chess,
    ellaMoveResult,
    status,
    ellaMoveResult.san,
    allMoves,
  ).then((comment) => {
    sendProactiveMessage(comment, "info", "chess");
  });

  return {
    ok: true,
    playerFen,
    ellaMove: ellaMoveResult.san,
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
    if (cloudFirst()) {
      // OpenAI zuerst (nur Modus "openai")
      const resp = await openaiRequest(
        "/v1/chat/completions",
        {
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 120,
            temperature: 0.8,
          }),
        },
        "chess",
      );
      const data = (await resp.json()) as {
        choices: { message: { content: string } }[];
      };
      reflection = data.choices[0]?.message.content ?? "";
    } else {
      // Lokal (Ollama) zuerst
      try {
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
      } catch (err) {
        if (cloudAllowed()) {
          // Fallback auf OpenAI (nur Modus "auto" mit Key)
          const resp = await openaiRequest(
            "/v1/chat/completions",
            {
              body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 120,
                temperature: 0.8,
              }),
            },
            "chess",
          );
          const data = (await resp.json()) as {
            choices: { message: { content: string } }[];
          };
          reflection = data.choices[0]?.message.content ?? "";
        } else {
          throw err; // "ollama"-Modus: kein Cloud-Fallback
        }
      }
    }

    if (reflection.trim()) {
      await remember("system", `♟ Schach-Erkenntnis: ${reflection.trim()}`);
    }
  } catch {
    // Reflexion ist optional — Fehler still ignorieren
  }
}

// ── Interne Hilfsfunktionen ───────────────────────────────────────────────────

async function ellaThinks(
  chess: Chess,
  profileId: number | null,
  moveHistory: string[],
): Promise<string | null> {
  const legalMoves = chess.moves({ verbose: true }).map((m) => m.lan);
  if (!legalMoves.length) return null;

  // Schach-Erinnerungen laden (profil-isoliert)
  const { memories } = await listMemoriesPaged({
    type: "system",
    search: "♟ Schach-Erkenntnis",
    limit: 8,
    profileId,
  });
  const chessMemories = memories.map((m) => `- ${m.content}`).join("\n");

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

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (cloudFirst()) {
        // OpenAI zuerst (nur Modus "openai")
        const resp = await openaiRequest(
          "/v1/chat/completions",
          {
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [{ role: "user", content: systemPrompt }],
              max_tokens: 10,
              temperature: attempt === 0 ? 0.7 : 0.9,
            }),
          },
          "chess",
        );
        const data = (await resp.json()) as {
          choices: { message: { content: string } }[];
        };
        response = data.choices[0]?.message.content?.trim() ?? "";
      } else {
        // Lokal (Ollama) zuerst
        try {
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
          const data = (await resp.json()) as {
            message?: { content?: string };
          };
          response = data.message?.content?.trim() ?? "";
        } catch (err) {
          if (cloudAllowed()) {
            // Fallback auf OpenAI (nur Modus "auto" mit Key)
            const resp = await openaiRequest(
              "/v1/chat/completions",
              {
                body: JSON.stringify({
                  model: "gpt-4o-mini",
                  messages: [{ role: "user", content: systemPrompt }],
                  max_tokens: 10,
                  temperature: attempt === 0 ? 0.7 : 0.9,
                }),
              },
              "chess",
            );
            const data = (await resp.json()) as {
              choices: { message: { content: string } }[];
            };
            response = data.choices[0]?.message.content?.trim() ?? "";
          } else {
            throw err; // "ollama"-Modus: kein Cloud-Fallback
          }
        }
      }

      // Zug aus Antwort extrahieren: erstes Wort/Token
      // UCI-Format: nur a-h, 1-8, Promotion-Buchstaben (q/r/b/n)
      const candidate = response
        .split(/\s/)[0]
        .toLowerCase()
        .replace(/[^a-h1-8qrbn]/g, "");
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
  playerColor: "white" | "black",
): ChessGame["winner"] {
  if (status === "checkmate")
    return lastMoved === playerColor ? "player" : "ella";
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

  try {
    if (cloudFirst()) {
      // OpenAI zuerst (nur Modus "openai")
      const resp = await openaiRequest(
        "/v1/chat/completions",
        {
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 80,
            temperature: 0.9,
          }),
        },
        "chess",
      );
      const data = (await resp.json()) as {
        choices: { message: { content: string } }[];
      };
      return data.choices[0]?.message.content?.trim() || fallback;
    }
    // Lokal (Ollama) zuerst
    try {
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
    } catch (err) {
      if (cloudAllowed()) {
        // Fallback auf OpenAI (nur Modus "auto" mit Key)
        const resp = await openaiRequest(
          "/v1/chat/completions",
          {
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [{ role: "user", content: prompt }],
              max_tokens: 80,
              temperature: 0.9,
            }),
          },
          "chess",
        );
        const data = (await resp.json()) as {
          choices: { message: { content: string } }[];
        };
        return data.choices[0]?.message.content?.trim() || fallback;
      }
      throw err; // "ollama"-Modus: kein Cloud-Fallback
    }
  } catch {
    return fallback;
  }
}

// LAN-String (e2e4, e7e8q) in Objekt-Form umwandeln für chess.js
function parseMoveInput(
  move: string,
): string | { from: string; to: string; promotion?: string } {
  const lan = move.trim().toLowerCase();
  // UCI/LAN-Format: 4 oder 5 Zeichen (e2e4, e7e8q)
  if (/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(lan)) {
    const obj: { from: string; to: string; promotion?: string } = {
      from: lan.slice(0, 2),
      to: lan.slice(2, 4),
    };
    if (lan.length === 5) obj.promotion = lan[4];
    return obj;
  }
  // SAN oder anderes Format — chess.js direkt versuchen lassen
  return move;
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
