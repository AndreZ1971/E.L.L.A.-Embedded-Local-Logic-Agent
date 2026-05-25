import { Router } from "express";
import { execSync } from "child_process";
import { pool } from "../config/database.js";
import { env } from "../config/env.js";
import { getDiskUsage } from "@ella/agent-tools";

export const systemRouter = Router();

systemRouter.get("/status", async (_req, res) => {
  const [ollama, db] = await Promise.all([
    fetch(`${env.ollamaBaseUrl}/api/tags`)
      .then((r) => r.ok)
      .catch(() => false),
    pool
      .execute("SELECT 1")
      .then(() => true)
      .catch(() => false),
  ]);

  res.json({
    ollama: { ok: ollama, url: env.ollamaBaseUrl },
    db: { ok: db },
  });
});

systemRouter.get("/disk", async (_req, res) => {
  const drives = ["C", "E", "Z"];
  const results = await Promise.all(
    drives.map((d) => getDiskUsage({ drive: d })),
  );
  res.json(Object.fromEntries(drives.map((d, i) => [d, results[i]])));
});

systemRouter.get("/programs", (_req, res) => {
  const ps = `
    $shell = New-Object -ComObject WScript.Shell
    $paths = @(
      "$env:ProgramData\\Microsoft\\Windows\\Start Menu\\Programs",
      "$env:APPDATA\\Microsoft\\Windows\\Start Menu\\Programs"
    )
    $results = @()
    foreach ($p in $paths) {
      if (Test-Path $p) {
        Get-ChildItem $p -Recurse -Filter "*.lnk" | ForEach-Object {
          try {
            $lnk = $shell.CreateShortcut($_.FullName)
            $target = $lnk.TargetPath
            if ($target -like "*.exe") {
              $results += [PSCustomObject]@{
                name    = $_.BaseName
                command = $target
              }
            }
          } catch {}
        }
      }
    }
    $results | Sort-Object name -Unique | ConvertTo-Json -Compress
  `.trim();

  try {
    const encoded = Buffer.from(ps, "utf16le").toString("base64");
    const raw = execSync(`powershell -NoProfile -EncodedCommand ${encoded}`, {
      timeout: 15000,
    }).toString();
    const parsed = JSON.parse(raw || "[]");
    const list = Array.isArray(parsed) ? parsed : [parsed];
    res.json({ programs: list });
  } catch {
    res.json({ programs: [] });
  }
});
