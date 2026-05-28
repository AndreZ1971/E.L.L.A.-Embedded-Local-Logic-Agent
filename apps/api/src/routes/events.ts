import { Router } from "express";
import { pool } from "../config/database.js";
import {
  eventBus,
  EVENT_SYSTEM,
  type SystemEvent,
} from "../services/eventBus.js";

export const eventsRouter = Router();

eventsRouter.get("/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const send = (event: SystemEvent) =>
    res.write(`data: ${JSON.stringify(event)}\n\n`);

  eventBus.on(EVENT_SYSTEM, send);

  req.on("close", () => {
    eventBus.off(EVENT_SYSTEM, send);
  });
});

eventsRouter.get("/recent", async (_req, res, next) => {
  try {
    const [rows] = await pool.execute<any[]>(
      "SELECT id, type, payload, created_at FROM system_events ORDER BY id DESC LIMIT 50",
    );
    res.json(
      rows.map((r) => ({
        ...r,
        payload:
          typeof r.payload === "string" ? JSON.parse(r.payload) : r.payload,
      })),
    );
  } catch (err) {
    next(err);
  }
});
