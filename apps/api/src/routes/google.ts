import { Router } from "express";
import {
  getAuthUrl,
  exchangeCode,
  revokeAccess,
  isConfigured,
} from "../services/google/auth.js";
import { getSettings } from "../services/settings.js";

export const googleRouter = Router();

googleRouter.get("/auth-url", (_req, res) => {
  if (!isConfigured()) {
    res
      .status(400)
      .json({ error: "Google Client ID und Secret nicht konfiguriert." });
    return;
  }
  res.json({ url: getAuthUrl() });
});

googleRouter.get("/callback", async (req, res) => {
  const code = req.query.code as string;
  if (!code) {
    res.status(400).send("Kein Code erhalten.");
    return;
  }
  try {
    const email = await exchangeCode(code);
    res.send(`
      <html><body style="font-family:sans-serif;text-align:center;padding:40px;background:#0f1117;color:#e2e8f0">
        <h2 style="color:#7c6af7">✓ Verbunden</h2>
        <p>E.L.L.A. ist mit <strong>${email}</strong> verbunden.</p>
        <p style="color:#64748b">Du kannst dieses Fenster schließen.</p>
        <script>setTimeout(() => window.close(), 2000)</script>
      </body></html>
    `);
  } catch (err) {
    res
      .status(500)
      .send(`Fehler: ${err instanceof Error ? err.message : String(err)}`);
  }
});

googleRouter.get("/status", (_req, res) => {
  const { googleConnected, googleUserEmail } = getSettings();
  res.json({
    connected: googleConnected,
    email: googleUserEmail,
    configured: isConfigured(),
  });
});

googleRouter.post("/disconnect", async (_req, res, next) => {
  try {
    await revokeAccess();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
