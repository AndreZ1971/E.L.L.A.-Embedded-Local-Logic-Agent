import { Router } from "express";
import { pool } from "../config/database.js";

export const feedbackRouter = Router();

feedbackRouter.post("/", async (req, res, next) => {
  try {
    const {
      sessionId,
      toolName,
      messageExcerpt,
      feedback,
      category,
      profileId,
    } = req.body as {
      sessionId?: string;
      toolName?: string;
      messageExcerpt: string;
      feedback: "positive" | "negative";
      category?: string;
      profileId?: number;
    };

    if (!messageExcerpt || !["positive", "negative"].includes(feedback)) {
      res
        .status(400)
        .json({
          error:
            "messageExcerpt und feedback (positive|negative) erforderlich.",
        });
      return;
    }

    const excerpt = String(messageExcerpt).slice(0, 500);

    await pool
      .execute(
        `INSERT INTO user_feedback (profile_id, session_id, tool_name, message_excerpt, feedback, category)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          profileId ?? null,
          sessionId ?? null,
          toolName ?? null,
          excerpt,
          feedback,
          category ?? null,
        ],
      )
      .catch(() => {});

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});
