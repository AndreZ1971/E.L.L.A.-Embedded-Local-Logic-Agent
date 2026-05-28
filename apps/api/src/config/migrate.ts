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

  // Standard-Erlaubnis-Regeln für sichere Tools (INSERT IGNORE = überspringen wenn ID schon existiert)
  await exec(`
    INSERT IGNORE INTO rules (id, name, tool_name, \`trigger\`, action, enabled) VALUES
      (1, 'App öffnen erlaubt',            'open_app',       'always', 'allow', TRUE),
      (2, 'Festplatteninfo erlaubt',        'get_disk_usage', 'always', 'allow', TRUE),
      (3, 'Erinnerungen speichern erlaubt', 'remember',       'always', 'allow', TRUE),
      (4, 'Erinnerungen löschen erlaubt',   'forget',         'always', 'allow', TRUE),
      (5, 'Erinnerungen auflisten erlaubt', 'list_memories',  'always', 'allow', TRUE),
      (6, 'Hausaufgaben-Modus erlaubt',     'homework_mode',  'always', 'allow', TRUE),
      (7, 'Setup laden erlaubt',            'load_setup',        'always', 'allow', TRUE),
      (8,  'Systeminfo erlaubt',             'get_system_info',  'always', 'allow', TRUE),
      (9,  'Setup erstellen erlaubt',        'create_setup',     'always', 'allow', TRUE),
      (10, 'Einstellung ändern erlaubt',     'update_setting',   'always', 'allow', TRUE),
      (11, 'Regel erstellen erlaubt',        'create_rule',      'always', 'allow', TRUE),
      (12, 'RAM freigeben erlaubt',          'free_ram',            'always', 'allow', TRUE),
      (13, 'E-Mails lesen erlaubt',          'read_emails',         'always', 'allow', TRUE),
      (14, 'E-Mail markieren erlaubt',       'mark_email',          'always', 'allow', TRUE),
      (15, 'Kalender lesen erlaubt',         'read_calendar',       'always', 'allow', TRUE),
      (16, 'Termin erstellen erlaubt',       'create_appointment',  'always', 'allow', TRUE),
      (17, 'Geräteliste erlaubt',            'list_devices',        'always', 'allow', TRUE)
  `);
  // clean_temp + empty_recycle_bin intentionally ohne Default-Regel — Nutzer muss explizit erlauben
}
