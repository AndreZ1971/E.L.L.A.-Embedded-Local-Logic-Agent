import { pool } from "../config/database.js";
import { readCalendar } from "./calendar.js";
import { sendProactiveMessage } from "./proactive.js";
import { getDueTasks } from "./tasks.js";

let lastBriefingDate = "";

export async function checkDayBriefing(): Promise<void> {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const hour = now.getHours();

  if (hour !== 18 || lastBriefingDate === today) return;
  lastBriefingDate = today;

  const [rows] = await pool.execute<any[]>(`
    SELECT tool_name, COUNT(*) AS cnt
    FROM tool_executions
    WHERE DATE(executed_at) = CURDATE() AND success = 1
    GROUP BY tool_name
  `);

  const totalActions = rows.reduce((s: number, r) => s + Number(r.cnt), 0);

  let tomorrowEvents: Array<{ start: string; subject: string }> = [];
  try {
    tomorrowEvents = readCalendar(2).filter((e) => !e.start.startsWith(today));
  } catch {
    // Outlook nicht verfügbar
  }

  const dueTasks = await getDueTasks().catch(() => []);

  let msg = `Tagesabschluss: Du hast heute ${totalActions} Aktionen ausgeführt.`;
  if (tomorrowEvents.length > 0) {
    msg += ` Morgen hast du ${tomorrowEvents.length} Termin${
      tomorrowEvents.length > 1 ? "e" : ""
    }, `;
    msg += `der erste um ${tomorrowEvents[0]!.start.slice(11, 16)} Uhr: "${
      tomorrowEvents[0]!.subject
    }".`;
  }
  if (dueTasks.length > 0) {
    msg += ` Du hast ${dueTasks.length} offene Aufgabe${
      dueTasks.length > 1 ? "n" : ""
    } für morgen: ${dueTasks
      .slice(0, 3)
      .map((t) => `"${t.title}"`)
      .join(", ")}.`;
  }
  msg += ` Gute Nacht.`;

  sendProactiveMessage(msg, "info", "day_briefing");
}
