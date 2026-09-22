import { Router } from "express";
import {
  listMemoriesPaged,
  getMemoryStats,
  remember,
  forgetById,
} from "../services/memory.js";
import { getSettings } from "../services/settings.js";

const router = Router();

// GET /api/memories?type=user&search=text&limit=50&offset=0
router.get("/", async (req, res) => {
  try {
    const { type, search, limit, offset } = req.query as Record<string, string>;
    const { activeProfileId } = getSettings();
    const result = await listMemoriesPaged({
      type: type || undefined,
      search: search || undefined,
      limit: limit ? Math.min(200, Math.max(1, Number(limit))) : 50,
      offset: offset ? Math.max(0, Number(offset)) : 0,
      profileId: activeProfileId,
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/memories/stats
router.get("/stats", async (_req, res) => {
  try {
    const { activeProfileId } = getSettings();
    const stats = await getMemoryStats(activeProfileId);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/memories  { type, content }
router.post("/", async (req, res) => {
  try {
    const { type, content } = req.body as { type?: string; content?: string };
    if (!content?.trim())
      return res.status(400).json({ error: "content fehlt" });
    const validType = (["user", "system", "note"] as const).includes(
      type as "user" | "system" | "note",
    )
      ? (type as "user" | "system" | "note")
      : "note";
    const result = await remember(validType, content.trim(), "manual");
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// DELETE /api/memories/:id
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    if (!Number.isFinite(id) || id <= 0)
      return res.status(400).json({ error: "Ungültige ID" });
    const result = await forgetById(id);
    if (!result.success) return res.status(404).json(result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
