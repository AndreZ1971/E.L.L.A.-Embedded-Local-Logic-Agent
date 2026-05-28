import { execSync } from "child_process";
import { pool } from "../config/database.js";
import type { ToolName } from "@ella/shared";

export type RuleDecision = "allow" | "deny" | "no_match";

export interface Rule {
  id: number;
  name: string;
  tool_name: string;
  trigger: string;
  action: "allow" | "deny";
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Unveränderliche Direktive — nie in DB, nie konfigurierbar.
// Diese Tools darf E.L.L.A. grundsätzlich nicht ausführen, unabhängig von Regeln.
// Erweiterbar wenn neue destruktive Tool-Kategorien entstehen.
export const DIRECTIVE_DENY = new Set<string>([
  // Platzhalter für zukünftige destruktive Tools (z.B. delete_files, run_script)
  // clean_temp und empty_recycle_bin sind NICHT hier — sie sind regelgesteuert
]);

function diskUsagePercent(drive: string): number {
  try {
    // TODO: Get-CimInstance Fallback für Windows 11 22H2+
    const out = execSync(
      `wmic logicaldisk where "DeviceID='${drive}:'" get FreeSpace,Size /format:csv`,
      { stdio: ["ignore", "pipe", "ignore"], encoding: "utf-8" },
    );
    const lines = out.trim().split("\n").filter(Boolean);
    const data = lines[lines.length - 1].split(",");
    if (data.length < 3) return 0;
    const free = Number(data[1]);
    const total = Number(data[2]);
    if (!total) return 0;
    return Math.round(((total - free) / total) * 100);
  } catch {
    return 0;
  }
}

async function evalTrigger(trigger: string): Promise<boolean> {
  const t = trigger.trim().toLowerCase();
  if (t === "always") return true;

  const hourGt = t.match(/^hour\s*>\s*(\d+)$/);
  if (hourGt) return new Date().getHours() > Number(hourGt[1]);

  const hourLt = t.match(/^hour\s*<\s*(\d+)$/);
  if (hourLt) return new Date().getHours() < Number(hourLt[1]);

  const diskGt = t.match(/^disk_([a-z])\s*>\s*(\d+)$/);
  if (diskGt)
    return diskUsagePercent(diskGt[1].toUpperCase()) > Number(diskGt[2]);

  return false;
}

// Evaluation-Reihenfolge: deny-Regeln zuerst (FIELD-Sortierung), dann allow.
// Erste passende Regel gewinnt.
export async function evaluateRules(toolName: ToolName): Promise<RuleDecision> {
  if (DIRECTIVE_DENY.has(toolName)) return "deny";

  const [rows] = await pool.execute<any[]>(
    `SELECT tool_name, \`trigger\`, action
     FROM rules
     WHERE enabled = TRUE
     ORDER BY FIELD(action, 'deny', 'allow')`,
  );

  for (const row of rows as Rule[]) {
    if (row.tool_name !== "*" && row.tool_name !== toolName) continue;
    if (await evalTrigger(row.trigger)) {
      return row.action;
    }
  }

  return "no_match";
}

export async function listRules(): Promise<Rule[]> {
  const [rows] = await pool.execute<any[]>(
    "SELECT * FROM rules ORDER BY action DESC, id ASC",
  );
  return rows as Rule[];
}

export async function createRule(
  data: Omit<Rule, "id" | "created_at" | "updated_at">,
): Promise<number> {
  const [result] = await pool.execute<any>(
    "INSERT INTO rules (name, tool_name, `trigger`, action, enabled) VALUES (?, ?, ?, ?, ?)",
    [data.name, data.tool_name, data.trigger, data.action, data.enabled],
  );
  return result.insertId as number;
}

export async function updateRule(
  id: number,
  data: Partial<Omit<Rule, "id" | "created_at" | "updated_at">>,
): Promise<void> {
  const fields = Object.keys(data)
    .map((k) => `\`${k}\` = ?`)
    .join(", ");
  if (!fields) return;
  await pool.execute(`UPDATE rules SET ${fields} WHERE id = ?`, [
    ...Object.values(data),
    id,
  ]);
}

export async function deleteRule(id: number): Promise<void> {
  await pool.execute("DELETE FROM rules WHERE id = ?", [id]);
}

export async function toggleRule(id: number): Promise<void> {
  await pool.execute("UPDATE rules SET enabled = NOT enabled WHERE id = ?", [
    id,
  ]);
}
