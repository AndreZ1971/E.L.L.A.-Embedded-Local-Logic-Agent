import { pool } from "../config/database.js";
import { sendProactiveMessage } from "./proactive.js";
import { getSettings } from "./settings.js";

export async function analyzeRhythm(): Promise<void> {
  const { setups } = getSettings();

  const [rows] = await pool.execute<any[]>(`
    SELECT
      HOUR(executed_at) AS hour,
      tool_name,
      COUNT(*) AS cnt
    FROM tool_executions
    WHERE executed_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
      AND success = 1
      AND tool_name IN ('open_app', 'load_setup')
    GROUP BY hour, tool_name
    HAVING cnt >= 3
    ORDER BY hour, cnt DESC
  `);

  if (rows.length === 0) return;

  const morningRows = rows.filter((r) => r.hour >= 6 && r.hour <= 9);
  if (morningRows.length >= 3) {
    const alreadyHasMorning = setups.some((s) =>
      s.name.toLowerCase().includes("morgen")
    );
    if (!alreadyHasMorning) {
      sendProactiveMessage(
        `Ich habe gemerkt dass du jeden Morgen ähnliche Programme öffnest. ` +
          `Soll ich daraus ein "Morgen-Setup" erstellen das alles auf einmal startet?`,
        "suggestion"
      );
    }
  }
}
