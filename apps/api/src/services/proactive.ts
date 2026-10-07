import { eventBus, EVENT_SYSTEM } from "./eventBus.js";
import { pool } from "../config/database.js";

export type ProactiveCategory =
  | "break_reminder"
  | "meeting_prep"
  | "day_briefing"
  | "rhythm_analysis"
  | "reflection"
  | "clipboard_pattern"
  | "comeback_briefing"
  | "disk_warning"
  | "duplicate_scan"
  | "document_reindex"
  | "alarm"
  | "scheduled_setup"
  | "chess"
  | "general";

const UNMUTABLE: Set<ProactiveCategory> = new Set(["alarm", "scheduled_setup"]);

export async function sendProactiveMessage(
  message: string,
  type: "info" | "warning" | "suggestion" | "alarm" = "info",
  category: ProactiveCategory = "general",
): Promise<boolean> {
  if (!UNMUTABLE.has(category)) {
    const muted = await isCategoryMuted(category);
    if (muted) return false;
  }

  eventBus.emit(EVENT_SYSTEM, {
    type: "proactive_message",
    payload: { message, messageType: type, category },
    created_at: new Date().toISOString(),
  });

  incrementShown(category).catch(() => {});
  return true;
}

async function isCategoryMuted(category: ProactiveCategory): Promise<boolean> {
  try {
    const [rows] = await pool.execute<any[]>(
      "SELECT muted FROM proactive_preferences WHERE category = ? AND (profile_id IS NULL OR profile_id = (SELECT id FROM profiles WHERE is_active = 1 LIMIT 1))",
      [category],
    );
    return rows.length > 0 && rows[0].muted === 1;
  } catch {
    return false;
  }
}

async function incrementShown(category: ProactiveCategory): Promise<void> {
  try {
    await pool.execute(
      `INSERT INTO proactive_preferences (category, shown_count, profile_id)
       VALUES (?, 1, (SELECT id FROM profiles WHERE is_active = 1 LIMIT 1))
       ON DUPLICATE KEY UPDATE shown_count = shown_count + 1`,
      [category],
    );
  } catch {
    // DB nicht verfügbar
  }
}

const AUTO_MUTE_THRESHOLD = 5;

export async function recordProactiveDismiss(
  category: ProactiveCategory,
): Promise<{ muted: boolean }> {
  if (UNMUTABLE.has(category)) return { muted: false };

  try {
    await pool.execute(
      `INSERT INTO proactive_preferences (category, dismissed_count, profile_id)
       VALUES (?, 1, (SELECT id FROM profiles WHERE is_active = 1 LIMIT 1))
       ON DUPLICATE KEY UPDATE dismissed_count = dismissed_count + 1`,
      [category],
    );

    const [rows] = await pool.execute<any[]>(
      `SELECT dismissed_count FROM proactive_preferences
       WHERE category = ? AND (profile_id IS NULL OR profile_id = (SELECT id FROM profiles WHERE is_active = 1 LIMIT 1))`,
      [category],
    );

    if (rows.length > 0 && rows[0].dismissed_count >= AUTO_MUTE_THRESHOLD) {
      await pool.execute(
        `UPDATE proactive_preferences SET muted = TRUE
         WHERE category = ? AND (profile_id IS NULL OR profile_id = (SELECT id FROM profiles WHERE is_active = 1 LIMIT 1))`,
        [category],
      );
      return { muted: true };
    }

    return { muted: false };
  } catch {
    return { muted: false };
  }
}

export async function setProactiveMuted(
  category: ProactiveCategory,
  muted: boolean,
): Promise<void> {
  if (UNMUTABLE.has(category) && muted) return;

  try {
    await pool.execute(
      `INSERT INTO proactive_preferences (category, muted, profile_id)
       VALUES (?, ?, (SELECT id FROM profiles WHERE is_active = 1 LIMIT 1))
       ON DUPLICATE KEY UPDATE muted = ?`,
      [category, muted, muted],
    );
  } catch {
    // DB nicht verfügbar
  }
}

export interface ProactivePreference {
  category: string;
  shown_count: number;
  dismissed_count: number;
  muted: boolean;
}

export async function getProactivePreferences(): Promise<
  ProactivePreference[]
> {
  try {
    const [rows] = await pool.execute<any[]>(
      `SELECT category, shown_count, dismissed_count, muted FROM proactive_preferences
       WHERE profile_id IS NULL OR profile_id = (SELECT id FROM profiles WHERE is_active = 1 LIMIT 1)
       ORDER BY category`,
    );
    return rows.map((r: any) => ({
      category: r.category,
      shown_count: r.shown_count,
      dismissed_count: r.dismissed_count,
      muted: Boolean(r.muted),
    }));
  } catch {
    return [];
  }
}
