import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";
import { pool } from "./database.js";

const SCHEMA_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../database/schema.sql",
);

async function exec(sql: string): Promise<void> {
  try {
    await pool.execute(sql);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    // "already exists" und "Duplicate entry" sind bei idempotenten Migrationen erwartet
    if (
      !msg.includes("already exists") &&
      !msg.includes("Duplicate entry") &&
      !msg.includes("Can't DROP")
    ) {
      throw err;
    }
  }
}

export async function runMigrations(): Promise<void> {
  const raw = await fs.readFile(SCHEMA_PATH, "utf-8");

  // Schema in einzelne Statements splitten, USE/CREATE DATABASE überspringen
  const statements = raw
    .split(";")
    .map((s) => s.trim().replace(/--.*$/gm, "").trim())
    .filter(
      (s) =>
        s.length > 0 &&
        !s.toUpperCase().startsWith("USE ") &&
        !s.toUpperCase().startsWith("CREATE DATABASE"),
    );

  for (const stmt of statements) {
    await exec(stmt);
  }

  // Schema-Evolution: rules-Tabelle auf Phase-2-Format aktualisieren
  await exec(
    "ALTER TABLE rules ADD COLUMN IF NOT EXISTS tool_name VARCHAR(100) NOT NULL DEFAULT '*'",
  );
  await exec(
    "ALTER TABLE rules MODIFY COLUMN `trigger` VARCHAR(255) NOT NULL DEFAULT 'always'",
  );
  // Fix: action-Spalte auf ENUM zurücksetzen (war durch Migration auf longtext gerutscht)
  // DROP CONSTRAINT zuerst — sonst blockiert der CHECK die MODIFY
  await exec("ALTER TABLE rules DROP CONSTRAINT IF EXISTS `rules.action`");
  await exec(
    "ALTER TABLE rules MODIFY COLUMN action ENUM('allow','deny') NOT NULL DEFAULT 'allow'",
  );

  // Seed-Regeln erzwingen — ON DUPLICATE KEY UPDATE stellt sicher dass bestehende
  // Einträge korrekt gesetzt werden, auch wenn die DB bereits alte Daten hat.
  const standardTools = [
    [1, "App öffnen erlaubt", "open_app", "always", "allow"],
    [2, "Festplatteninfo erlaubt", "get_disk_usage", "always", "allow"],
    [3, "Erinnerungen speichern erlaubt", "remember", "always", "allow"],
    [4, "Erinnerungen löschen erlaubt", "forget", "always", "allow"],
    [5, "Erinnerungen auflisten erlaubt", "list_memories", "always", "allow"],
    [6, "Hausaufgaben-Modus erlaubt", "homework_mode", "always", "allow"],
    [7, "Setup laden erlaubt", "load_setup", "always", "allow"],
    [8, "Systeminfo erlaubt", "get_system_info", "always", "allow"],
    [9, "Setup erstellen erlaubt", "create_setup", "always", "allow"],
    [10, "Einstellung ändern erlaubt", "update_setting", "always", "allow"],
    [11, "Regel erstellen erlaubt", "create_rule", "always", "allow"],
    [12, "RAM freigeben erlaubt", "free_ram", "always", "allow"],
    [13, "E-Mails lesen erlaubt", "read_emails", "always", "allow"],
    [14, "E-Mail markieren erlaubt", "mark_email", "always", "allow"],
    [15, "Kalender lesen erlaubt", "read_calendar", "always", "allow"],
    [16, "Termin erstellen erlaubt", "create_appointment", "always", "allow"],
    [17, "Geräteliste erlaubt", "list_devices", "always", "allow"],
    [18, "Netzwerk scannen erlaubt", "scan_network", "always", "allow"],
    [
      19,
      "Verbindungen auflisten erlaubt",
      "list_connections",
      "always",
      "allow",
    ],
    [20, "System-Status erlaubt", "get_system_status", "always", "allow"],
    [21, "Web-Suche erlaubt", "search_web", "always", "allow"],
    [22, "Standort ermitteln erlaubt", "get_location", "always", "allow"],
    [23, "Web-Suche (DDG) erlaubt", "web_search", "always", "allow"],
    [24, "URL abrufen erlaubt", "fetch_url", "always", "allow"],
    [25, "Wetter abrufen erlaubt", "get_weather", "always", "allow"],
    [26, "PC herunterfahren erlaubt", "shutdown_system", "always", "allow"],
    [27, "Laufwerk formatieren erlaubt", "format_drive", "always", "allow"],
    [28, "Laufwerk umbenennen erlaubt", "rename_drive", "always", "allow"],
    [29, "Programme auflisten erlaubt", "list_programs", "always", "allow"],
    [30, "Pausenmodus erlaubt", "pause_ella", "always", "allow"],
    [31, "Gmail lesen erlaubt", "read_gmail", "always", "allow"],
    [32, "Gmail markieren erlaubt", "mark_gmail", "always", "allow"],
    [
      33,
      "Google Kalender lesen erlaubt",
      "read_google_calendar",
      "always",
      "allow",
    ],
    [
      34,
      "Google Termin erstellen erlaubt",
      "create_google_appointment",
      "always",
      "allow",
    ],
  ] as const;

  for (const [id, name, tool_name, trigger, action] of standardTools) {
    await exec(`
      INSERT INTO rules (id, name, tool_name, \`trigger\`, action, enabled)
      VALUES (${id}, '${name}', '${tool_name}', '${trigger}', '${action}', TRUE)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        action = VALUES(action),
        enabled = TRUE
    `);
  }
  // clean_temp + empty_recycle_bin intentionally ohne Default-Regel — Nutzer muss explizit erlauben

  // Directive Audit-Log Tabelle
  await exec(`
    CREATE TABLE IF NOT EXISTS directive_audit (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      timestamp   DATETIME NOT NULL,
      tool        VARCHAR(100) NOT NULL,
      decision    ENUM('allow','deny') NOT NULL,
      prohibition VARCHAR(100),
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}
