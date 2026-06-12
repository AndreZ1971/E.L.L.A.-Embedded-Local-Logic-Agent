import { Router } from "express";
import * as os from "os";
import * as crypto from "crypto";
import { getSettings, saveSettings } from "../services/settings.js";

export const licenseRouter = Router();

const LICENSE_SERVER = "http://49.13.26.248:3010";

function getHardwareFingerprint(): string {
  const interfaces = os.networkInterfaces();
  const macs: string[] = [];
  for (const iface of Object.values(interfaces)) {
    for (const config of iface ?? []) {
      if (!config.internal && config.mac !== "00:00:00:00:00:00") {
        macs.push(config.mac);
      }
    }
  }
  const data = [
    os.hostname(),
    os.cpus()[0]?.model ?? "",
    os.platform(),
    macs.sort().join(","),
  ].join("|");
  return crypto.createHash("sha256").update(data).digest("hex").slice(0, 32);
}

// GET /api/license/info
licenseRouter.get("/info", (_req, res) => {
  const { licenseActivated, licenseProduct, licenseKey } = getSettings();
  res.json({
    activated: licenseActivated,
    product: licenseProduct,
    licenseKey: licenseKey ? licenseKey.slice(0, 9) + "***" : "",
    fingerprint: getHardwareFingerprint(),
  });
});

// POST /api/license/activate  — { licenseKey }
licenseRouter.post("/activate", async (req, res, next) => {
  try {
    const { licenseKey } = req.body as { licenseKey?: string };
    if (!licenseKey?.trim()) {
      res.status(400).json({ error: "missing_key" });
      return;
    }

    const fingerprint = getHardwareFingerprint();

    const response = await fetch(`${LICENSE_SERVER}/activate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        licenseKey: licenseKey.trim().toUpperCase(),
        hardwareFingerprint: fingerprint,
        machineInfo: { hostname: os.hostname(), platform: os.platform() },
      }),
      signal: AbortSignal.timeout(10_000),
    });

    const data = (await response.json()) as {
      token?: string;
      product?: string;
      error?: string;
    };

    if (!response.ok || !data.token) {
      res
        .status(response.status)
        .json({ error: data.error ?? "activation_failed" });
      return;
    }

    await saveSettings({
      licenseActivated: true,
      licenseKey: licenseKey.trim().toUpperCase(),
      licenseToken: data.token,
      licenseProduct: data.product ?? "personal",
    });

    res.json({ ok: true, product: data.product });
  } catch (err) {
    next(err);
  }
});

// POST /api/license/verify  — called on startup to recheck token
licenseRouter.post("/verify", async (_req, res) => {
  const { licenseToken, licenseKey } = getSettings();
  if (!licenseToken) {
    res.json({ valid: false });
    return;
  }

  const fingerprint = getHardwareFingerprint();

  try {
    const response = await fetch(`${LICENSE_SERVER}/verify-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: licenseToken,
        hardwareFingerprint: fingerprint,
      }),
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      res.json({ valid: false });
      return;
    }

    const data = (await response.json()) as {
      valid: boolean;
      product?: string;
      licenseKey?: string;
    };

    if (!data.valid) {
      await saveSettings({ licenseActivated: false, licenseToken: "" });
    }

    res.json({ valid: data.valid, product: data.product, licenseKey });
  } catch {
    // Offline — trust the stored token
    res.json({ valid: true, offline: true, licenseKey });
  }
});
