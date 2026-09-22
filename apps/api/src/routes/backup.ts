import { Router } from "express";
import { pool } from "../config/database.js";
import { getSettings, saveSettings } from "../services/settings.js";
import type { Setup } from "../services/settings.js";

export const backupRouter = Router();

interface BackupMemory {
  type: string;
  content: string;
  source: string | null;
  created_at: string;
  profile_id: number | null;
}

interface BackupRule {
  id: number;
  name: string;
  tool_name: string;
  trigger: string;
  action: string;
  enabled: boolean | number;
}

interface BackupAlarm {
  label: string;
  time_hhmm: string;
  active: boolean | number;
  profile_id: number | null;
}

interface BackupTask {
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  note: string | null;
  profile_id: number | null;
}

interface BackupData {
  version?: string;
  exportedAt?: string;
  memories?: BackupMemory[];
  rules?: BackupRule[];
  alarms?: BackupAlarm[];
  tasks?: BackupTask[];
  setups?: Setup[];
}

// GET /api/backup/export
backupRouter.get("/export", async (_req, res, next) => {
  try {
    const [memories] = await pool.execute(
      "SELECT type, content, source, created_at, profile_id FROM memories ORDER BY id",
    );
    const [rules] = await pool.execute(
      "SELECT id, name, tool_name, `trigger` AS `trigger`, action, enabled FROM rules ORDER BY id",
    );
    const [alarms] = await pool.execute(
      "SELECT profile_id, label, time_hhmm, active FROM alarms ORDER BY id",
    );
    const [tasks] = await pool.execute(
      "SELECT profile_id, title, status, priority, due_date, note FROM tasks WHERE status != 'cancelled' ORDER BY id",
    );

    const settings = getSettings();

    const backup: BackupData = {
      version: "1.4.0",
      exportedAt: new Date().toISOString(),
      memories: memories as BackupMemory[],
      rules: rules as BackupRule[],
      alarms: alarms as BackupAlarm[],
      tasks: tasks as BackupTask[],
      setups: settings.setups ?? [],
    };

    const filename = `ella-backup-${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "application/json");
    res.json(backup);
  } catch (err) {
    next(err);
  }
});

// POST /api/backup/import
backupRouter.post("/import", async (req, res, next) => {
  try {
    const { data, mode = "merge" } = req.body as {
      data: BackupData;
      mode?: "merge" | "replace";
    };

    if (!data || typeof data !== "object") {
      res.status(400).json({ error: "Ungültiges Backup-Format" });
      return;
    }

    const conn = await pool.getConnection();
    const stats = { memories: 0, rules: 0, alarms: 0, tasks: 0, setups: 0 };

    try {
      await conn.beginTransaction();

      if (mode === "replace") {
        await conn.execute("DELETE FROM memories");
        await conn.execute("DELETE FROM rules");
        await conn.execute("DELETE FROM alarms");
        await conn.execute("DELETE FROM tasks");
      }

      // Memories
      for (const m of data.memories ?? []) {
        if (!m.content || !m.type) continue;
        if (mode === "merge") {
          const [r] = await conn.execute(
            "INSERT IGNORE INTO memories (type, content, source, created_at, profile_id, embedding) SELECT ?, ?, ?, ?, ?, '[]' WHERE NOT EXISTS (SELECT 1 FROM memories WHERE content = ? AND profile_id <=> ?)",
            [
              m.type,
              m.content,
              m.source ?? null,
              m.created_at ?? new Date(),
              m.profile_id ?? null,
              m.content,
              m.profile_id ?? null,
            ],
          );
          stats.memories += (r as { affectedRows: number }).affectedRows;
        } else {
          await conn.execute(
            "INSERT INTO memories (type, content, source, created_at, profile_id, embedding) VALUES (?, ?, ?, ?, ?, '[]')",
            [
              m.type,
              m.content,
              m.source ?? null,
              m.created_at ?? new Date(),
              m.profile_id ?? null,
            ],
          );
          stats.memories++;
        }
      }

      // Rules
      for (const r of data.rules ?? []) {
        if (!r.id || !r.name || !r.action) continue;
        await conn.execute(
          "INSERT INTO rules (id, name, tool_name, `trigger`, action, enabled) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), tool_name=VALUES(tool_name), `trigger`=VALUES(`trigger`), action=VALUES(action), enabled=VALUES(enabled)",
          [
            r.id,
            r.name,
            r.tool_name ?? "*",
            r.trigger ?? "always",
            r.action,
            r.enabled ? 1 : 0,
          ],
        );
        stats.rules++;
      }

      // Alarms
      for (const a of data.alarms ?? []) {
        if (!a.label || !a.time_hhmm) continue;
        await conn.execute(
          "INSERT INTO alarms (profile_id, label, time_hhmm, active) VALUES (?, ?, ?, ?)",
          [a.profile_id ?? null, a.label, a.time_hhmm, a.active ? 1 : 0],
        );
        stats.alarms++;
      }

      // Tasks
      for (const t of data.tasks ?? []) {
        if (!t.title) continue;
        await conn.execute(
          "INSERT INTO tasks (profile_id, title, status, priority, due_date, note) VALUES (?, ?, ?, ?, ?, ?)",
          [
            t.profile_id ?? null,
            t.title,
            t.status ?? "pending",
            t.priority ?? "normal",
            t.due_date ?? null,
            t.note ?? null,
          ],
        );
        stats.tasks++;
      }

      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }

    // Setups in settings.json
    if (data.setups?.length) {
      const settings = getSettings();
      if (mode === "replace") {
        await saveSettings({ setups: data.setups });
        stats.setups = data.setups.length;
      } else {
        const existingIds = new Set((settings.setups ?? []).map((s) => s.id));
        const newSetups = data.setups.filter((s) => !existingIds.has(s.id));
        if (newSetups.length > 0) {
          await saveSettings({
            setups: [...(settings.setups ?? []), ...newSetups],
          });
          stats.setups = newSetups.length;
        }
      }
    }

    res.json({ success: true, stats });
  } catch (err) {
    next(err);
  }
});
