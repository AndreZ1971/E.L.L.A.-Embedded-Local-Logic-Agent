import { Router } from "express";
import { getSettings } from "../services/settings.js";
import {
  createGame,
  getGame,
  applyPlayerMove,
  resignGame,
  reflectOnGame,
} from "../services/chess.js";

export const chessRouter = Router();

function getProfileId(req: import("express").Request): number | null {
  const id = Number(req.headers["x-profile-id"] ?? req.query.profile_id);
  return isNaN(id) || id <= 0 ? null : id;
}

chessRouter.post("/new", async (req, res, next) => {
  try {
    const profileId = getProfileId(req);
    const game = await createGame(profileId);
    res.json({ gameId: game.id, fen: game.fen });
  } catch (err) {
    next(err);
  }
});

chessRouter.get("/game/:id", async (req, res, next) => {
  try {
    const game = await getGame(Number(req.params.id));
    if (!game) {
      res.status(404).json({ error: "Partie nicht gefunden." });
      return;
    }
    res.json(game);
  } catch (err) {
    next(err);
  }
});

chessRouter.post("/move", async (req, res, next) => {
  try {
    const { gameId, move } = req.body as { gameId?: number; move?: string };
    const profileId = getProfileId(req);
    if (!gameId || !move) {
      res.status(400).json({ error: "gameId und move erforderlich." });
      return;
    }
    const result = await applyPlayerMove(gameId, move, profileId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

chessRouter.post("/resign", async (req, res, next) => {
  try {
    const { gameId } = req.body as { gameId?: number };
    const profileId = getProfileId(req);
    if (!gameId) {
      res.status(400).json({ error: "gameId erforderlich." });
      return;
    }
    await resignGame(gameId);
    await reflectOnGame(gameId, profileId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

chessRouter.post("/reflect", async (req, res, next) => {
  try {
    const { gameId } = req.body as { gameId?: number };
    const profileId = getProfileId(req);
    if (!gameId) {
      res.status(400).json({ error: "gameId erforderlich." });
      return;
    }
    await reflectOnGame(gameId, profileId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});
