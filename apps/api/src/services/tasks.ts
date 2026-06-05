import { pool } from "../config/database.js";

export interface Task {
  id: number;
  profileId: number | null;
  title: string;
  status: "pending" | "done" | "cancelled";
  priority: "low" | "normal" | "high";
  dueDate: string | null;
  note: string | null;
  createdAt: string;
}

export async function addTask(
  title: string,
  opts: {
    priority?: Task["priority"];
    dueDate?: string;
    note?: string;
    profileId?: number;
  } = {},
): Promise<Task> {
  const {
    priority = "normal",
    dueDate = null,
    note = null,
    profileId = null,
  } = opts;

  const [result] = await pool.execute<any>(
    `INSERT INTO tasks (profile_id, title, priority, due_date, note)
     VALUES (?, ?, ?, ?, ?)`,
    [profileId, title, priority, dueDate, note],
  );

  return {
    id: result.insertId as number,
    profileId,
    title,
    status: "pending",
    priority,
    dueDate,
    note,
    createdAt: new Date().toISOString(),
  };
}

export async function listTasks(
  profileId?: number,
  status: Task["status"] = "pending",
): Promise<Task[]> {
  const [rows] = await pool.execute<any[]>(
    `SELECT id, profile_id, title, status, priority, due_date, note, created_at
     FROM tasks
     WHERE status = ?
       AND (profile_id = ? OR profile_id IS NULL OR ? IS NULL)
     ORDER BY
       FIELD(priority, 'high', 'normal', 'low'),
       due_date ASC,
       created_at ASC`,
    [status, profileId ?? null, profileId ?? null],
  );

  return rows.map((r) => ({
    id: r.id,
    profileId: r.profile_id,
    title: r.title,
    status: r.status,
    priority: r.priority,
    dueDate: r.due_date ? String(r.due_date).slice(0, 10) : null,
    note: r.note,
    createdAt: String(r.created_at),
  }));
}

export async function completeTask(id: number): Promise<boolean> {
  const [result] = await pool.execute<any>(
    `UPDATE tasks SET status = 'done', updated_at = NOW() WHERE id = ? AND status = 'pending'`,
    [id],
  );
  return (result.affectedRows as number) > 0;
}

export async function deleteTask(id: number): Promise<boolean> {
  const [result] = await pool.execute<any>(
    `UPDATE tasks SET status = 'cancelled', updated_at = NOW() WHERE id = ?`,
    [id],
  );
  return (result.affectedRows as number) > 0;
}

export async function getDueTasks(profileId?: number): Promise<Task[]> {
  const [rows] = await pool.execute<any[]>(
    `SELECT id, profile_id, title, status, priority, due_date, note, created_at
     FROM tasks
     WHERE status = 'pending'
       AND due_date <= DATE_ADD(CURDATE(), INTERVAL 1 DAY)
       AND (profile_id = ? OR profile_id IS NULL OR ? IS NULL)
     ORDER BY due_date ASC, FIELD(priority, 'high', 'normal', 'low')`,
    [profileId ?? null, profileId ?? null],
  );

  return rows.map((r) => ({
    id: r.id,
    profileId: r.profile_id,
    title: r.title,
    status: r.status,
    priority: r.priority,
    dueDate: r.due_date ? String(r.due_date).slice(0, 10) : null,
    note: r.note,
    createdAt: String(r.created_at),
  }));
}
