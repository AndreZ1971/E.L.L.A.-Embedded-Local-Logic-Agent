import { pool } from "../config/database.js";

// Session-Gap: 30 Minuten Pause → neue Session
const SESSION_GAP_MS = 30 * 60 * 1000;

interface ActiveSession {
  startedAt: Date;
  lastMessageAt: Date;
  messageCount: number;
  savedToDb: boolean;
}

// In-Memory: sessionId → aktive Session
const activeSessions = new Map<string, ActiveSession>();

function formatDuration(totalMinutes: number): string {
  if (totalMinutes < 60) return `${totalMinutes} Min.`;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m > 0 ? `${h} Std. ${m} Min.` : `${h} Std.`;
}

function formatTimeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `vor ${diffMin} Min.`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `vor ${diffH} Std.`;
  const diffDays = Math.floor(diffH / 24);
  if (diffDays === 1) return "gestern";
  if (diffDays < 7) return `vor ${diffDays} Tagen`;
  return date.toLocaleDateString("de-DE");
}

async function saveSessionToDb(
  sessionId: string,
  session: ActiveSession,
): Promise<void> {
  try {
    await pool.execute(
      `INSERT INTO chat_sessions (session_key, started_at, ended_at, message_count)
       VALUES (?, ?, ?, ?)`,
      [
        sessionId,
        session.startedAt,
        session.lastMessageAt,
        session.messageCount,
      ],
    );
  } catch {
    // Nicht kritisch — weiter ohne Fehler
  }
}

async function getLastCompletedSession(): Promise<{
  ended_at: Date;
  duration_min: number;
} | null> {
  try {
    const [rows] = await pool.execute(
      `SELECT ended_at,
              TIMESTAMPDIFF(MINUTE, started_at, ended_at) AS duration_min
       FROM chat_sessions
       ORDER BY ended_at DESC
       LIMIT 1`,
    );
    const row = (rows as { ended_at: Date; duration_min: number }[])[0];
    return row ?? null;
  } catch {
    return null;
  }
}

// Wird vor jeder Chat-Nachricht aufgerufen
export async function recordChatMessage(sessionId: string): Promise<void> {
  const now = new Date();
  const existing = activeSessions.get(sessionId);

  if (!existing) {
    activeSessions.set(sessionId, {
      startedAt: now,
      lastMessageAt: now,
      messageCount: 1,
      savedToDb: false,
    });
    return;
  }

  const gapMs = now.getTime() - existing.lastMessageAt.getTime();
  if (gapMs > SESSION_GAP_MS) {
    // Alte Session abschließen und in DB speichern
    await saveSessionToDb(sessionId, existing);
    activeSessions.set(sessionId, {
      startedAt: now,
      lastMessageAt: now,
      messageCount: 1,
      savedToDb: false,
    });
  } else {
    existing.lastMessageAt = now;
    existing.messageCount++;
  }
}

// Gibt formatierten Zeitkontext für den System-Prompt zurück
export async function getTemporalContext(sessionId: string): Promise<string> {
  const now = new Date();
  const session = activeSessions.get(sessionId);
  const parts: string[] = [];

  if (session) {
    const sessionMin = Math.floor(
      (now.getTime() - session.startedAt.getTime()) / 60000,
    );
    if (sessionMin >= 2) {
      parts.push(`Session läuft seit ${formatDuration(sessionMin)}`);
    }

    const pauseMin = Math.floor(
      (now.getTime() - session.lastMessageAt.getTime()) / 60000,
    );
    if (pauseMin >= 5) {
      parts.push(`Pause: ${formatDuration(pauseMin)}`);
    }
  }

  const lastSession = await getLastCompletedSession();
  if (lastSession) {
    const info = `Letzte Session: ${formatTimeAgo(new Date(lastSession.ended_at))}`;
    const dur =
      lastSession.duration_min > 0
        ? ` (${formatDuration(lastSession.duration_min)})`
        : "";
    parts.push(info + dur);
  }

  if (parts.length === 0) return "";
  return `[Zeitkontext: ${parts.join(" · ")}]`;
}
