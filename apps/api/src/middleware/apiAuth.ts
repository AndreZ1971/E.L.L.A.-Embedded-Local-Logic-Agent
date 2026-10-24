import type { Request, Response, NextFunction } from "express";
import { randomBytes, timingSafeEqual } from "crypto";
import { env } from "../config/env.js";

const TOKEN = process.env.ELLA_API_TOKEN || randomBytes(32).toString("hex");
if (!process.env.ELLA_API_TOKEN) {
  console.warn(
    "[API] Kein ELLA_API_TOKEN gesetzt — API ist gesperrt (fail closed).",
  );
}

const ALLOWED_HOSTS = new Set([
  `127.0.0.1:${env.port}`,
  `localhost:${env.port}`,
]);
const ALLOWED_ORIGINS = new Set([
  "null",
  "http://127.0.0.1:5173",
  "http://localhost:5173",
]);

function tokenOk(given: string | undefined): boolean {
  if (!given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(TOKEN);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function apiAuth(req: Request, res: Response, next: NextFunction) {
  if (!ALLOWED_HOSTS.has(req.headers.host ?? "")) {
    res.status(403).json({ error: "Host nicht erlaubt" });
    return;
  }

  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    );
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-ELLA-Token");
  }
  if (req.method === "OPTIONS") {
    res.sendStatus(origin && ALLOWED_ORIGINS.has(origin) ? 204 : 403);
    return;
  }

  if (req.method === "GET" && req.path === "/api/health") return next();

  const given =
    (req.headers["x-ella-token"] as string | undefined) ??
    (req.path === "/api/events/stream"
      ? (req.query["token"] as string | undefined)
      : undefined);

  if (!tokenOk(given)) {
    res.status(401).json({ error: "Nicht autorisiert" });
    return;
  }
  next();
}

export { TOKEN as API_TOKEN };
