import { execSync } from "child_process";
import { pool } from "../config/database.js";
import type { ToolName } from "@ella/shared";

const HARM_TOOLS = new Set([
  "delete_files",
  "format_drive",
  "run_script",
  "registry_edit",
  "disable_firewall",
  "uninstall_app",
  "kill_process",
  "wipe_disk",
]);
const EXFIL_TOOLS = new Set([
  "send_data_external",
  "upload_files",
  "sync_cloud",
]);

function getProhibition(tool: string): string {
  if (HARM_TOOLS.has(tool)) return "Prohibition I — harm";
  if (EXFIL_TOOLS.has(tool)) return "Prohibition IV — exfiltrate";
  return "Unknown";
}

async function auditDirectiveDeny(tool: string): Promise<void> {
  const entry = {
    timestamp: new Date().toISOString(),
    tool,
    decision: "deny",
    prohibition: getProhibition(tool),
  };
  console.log(`[DIRECTIVE AUDIT] ${JSON.stringify(entry)}`);
  try {
    await pool.execute(
      `INSERT IGNORE INTO directive_audit (timestamp, tool, decision, prohibition)
       VALUES (?, ?, ?, ?)`,
      [entry.timestamp, entry.tool, entry.decision, entry.prohibition],
    );
  } catch {
    // Nicht-kritisch — Konsolen-Log reicht als Fallback
  }
}

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
  // Prohibition I — harm: destruktive Systemoperationen
  "delete_files",
  "format_drive",
  "run_script",
  "registry_edit",
  "disable_firewall",
  "uninstall_app",
  "kill_process",
  "wipe_disk",

  // Prohibition IV — exfiltrate: Datenweitergabe ohne expliziten Nutzerauftrag
  "send_data_external",
  "upload_files",
  "sync_cloud",

  // clean_temp + empty_recycle_bin sind NICHT hier — sie sind regelgesteuert
]);

function psEncode(script: string): string {
  return Buffer.from(script, "utf16le").toString("base64");
}

function diskUsagePercent(drive: string): number {
  try {
    const script = `Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='${drive}:'" | Select-Object FreeSpace,Size | ConvertTo-Json -Compress`;
    const out = execSync(
      `powershell -NoProfile -NonInteractive -EncodedCommand ${psEncode(script)}`,
      { stdio: ["ignore", "pipe", "ignore"], encoding: "utf-8", timeout: 5000 },
    );
    const parsed = JSON.parse(out.trim()) as {
      FreeSpace: number;
      Size: number;
    };
    const free = Number(parsed.FreeSpace);
    const total = Number(parsed.Size);
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

// Evaluation-Reihenfolge:
//   1. DIRECTIVE_DENY — sofort deny, kein Override möglich
//   2. Explizite deny-Regeln aus DB — deny
//   3. Explizite allow-Regeln aus DB — allow
//   4. Kein Match — allow (Default-Allow)
//
// Die Directive prüft zusätzlich VOR dieser Funktion in executor.ts.
// Was die Directive erlaubt, darf die Rule Engine per Default durchlassen.
export async function evaluateRules(toolName: ToolName): Promise<RuleDecision> {
  if (DIRECTIVE_DENY.has(toolName)) {
    auditDirectiveDeny(toolName).catch(() => {});
    return "deny";
  }

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

  // Kein explizites deny gefunden — Default-Allow
  // Die Directive ist die einzige harte Grenze
  return "allow";
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
