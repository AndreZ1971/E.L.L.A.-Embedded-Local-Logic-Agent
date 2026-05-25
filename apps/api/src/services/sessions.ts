import { pool } from "../config/database.js";

export interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
}

const MAX_HISTORY = 40;

export const sessionStore = {
  get: async (id: string): Promise<HistoryMessage[]> => {
    await pool.execute("INSERT IGNORE INTO sessions (id) VALUES (?)", [id]);
    const [rows] = await pool.execute<any[]>(
      "SELECT role, content FROM session_messages WHERE session_id = ? ORDER BY created_at ASC",
      [id],
    );
    return rows as HistoryMessage[];
  },

  set: async (id: string, messages: HistoryMessage[]): Promise<void> => {
    const clean = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-MAX_HISTORY);

    await pool.execute("DELETE FROM session_messages WHERE session_id = ?", [
      id,
    ]);

    if (clean.length === 0) return;

    const values = clean.map((m) => [id, m.role, m.content]);
    await pool.query(
      "INSERT INTO session_messages (session_id, role, content) VALUES ?",
      [values],
    );
  },

  clear: async (id: string): Promise<void> => {
    await pool.execute("DELETE FROM sessions WHERE id = ?", [id]);
  },
};
