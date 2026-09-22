import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";
import { pool } from "./database.js";

// Im Installer: ELLA_RESOURCES = process.resourcesPath (gesetzt von Electron main.ts)
// Im Dev-Modus: relativer Pfad vom Quellverzeichnis
const SCHEMA_PATH = process.env.ELLA_RESOURCES
  ? path.join(process.env.ELLA_RESOURCES, "database", "schema.sql")
  : path.join(
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
    [35, "Musik spielen erlaubt", "play_music", "always", "allow"],
    [36, "Dateien suchen erlaubt", "search_files", "always", "allow"],
    [37, "Datei öffnen erlaubt", "open_file", "always", "allow"],
    [38, "Ordner öffnen erlaubt", "explore_folder", "always", "allow"],
    [39, "Dokument erstellen erlaubt", "create_document", "always", "allow"],
    [40, "Diktat erlaubt", "dictate_to_document", "always", "allow"],
    [41, "E-Mail verfassen erlaubt", "compose_email", "always", "allow"],
    [42, "Prozesse auflisten erlaubt", "list_processes", "always", "allow"],
    [43, "Prozess beenden erlaubt", "kill_process", "always", "allow"],
    [44, "Lautstärke setzen erlaubt", "set_volume", "always", "allow"],
    [45, "Zwischenablage lesen erlaubt", "get_clipboard", "always", "allow"],
    [46, "Zwischenablage setzen erlaubt", "set_clipboard", "always", "allow"],
    [47, "Erinnerung setzen erlaubt", "set_reminder", "always", "allow"],
    [48, "Erinnerungen auflisten erlaubt", "list_reminders", "always", "allow"],
    [49, "Erinnerung löschen erlaubt", "delete_reminder", "always", "allow"],
    [50, "Screenshot erlaubt", "take_screenshot", "always", "allow"],
    [51, "Im Nutzerstil schreiben erlaubt", "write_for_me", "always", "allow"],
    [52, "Duplikate finden erlaubt", "find_duplicates", "always", "allow"],
    [53, "Autostart auflisten erlaubt", "list_autostart", "always", "allow"],
  ] as const;

  for (const [id, name, tool_name, trigger, action] of standardTools) {
    await exec(`
      INSERT INTO rules (id, name, tool_name, \`trigger\`, action, enabled)
      VALUES (${id}, '${name}', '${tool_name}', '${trigger}', '${action}', TRUE)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        tool_name = VALUES(tool_name),
        action = VALUES(action),
        enabled = TRUE
    `);
  }
  // clean_temp + empty_recycle_bin intentionally ohne Default-Regel — Nutzer muss explizit erlauben

  // ── v3.1.0 Tabellen ────────────────────────────────────────────────────────
  await exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      name       VARCHAR(100) NOT NULL,
      color      VARCHAR(20)  NOT NULL DEFAULT '#7c3aed',
      pin_hash   VARCHAR(60)  NULL,
      is_active  TINYINT(1)   NOT NULL DEFAULT 0,
      created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await exec(`
    INSERT IGNORE INTO profiles (id, name, color, is_active)
    VALUES (1, 'Standard', '#7c3aed', 1)
  `);

  await exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      profile_id INT          NULL,
      title      VARCHAR(500) NOT NULL,
      status     ENUM('pending','done','cancelled') NOT NULL DEFAULT 'pending',
      priority   ENUM('low','normal','high')        NOT NULL DEFAULT 'normal',
      due_date   DATETIME NULL,
      note       TEXT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await exec(`
    CREATE TABLE IF NOT EXISTS user_feedback (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      profile_id      INT          NULL,
      session_id      VARCHAR(255) NULL,
      tool_name       VARCHAR(100) NULL,
      message_excerpt TEXT         NOT NULL,
      feedback        ENUM('positive','negative') NOT NULL,
      category        VARCHAR(100) NULL,
      created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Spalten-Erweiterungen bestehender Tabellen (ALTER TABLE ... ADD COLUMN IF NOT EXISTS)
  await exec(
    `ALTER TABLE memories ADD COLUMN IF NOT EXISTS profile_id INT NULL`,
  );
  await exec(
    `ALTER TABLE sessions ADD COLUMN IF NOT EXISTS profile_id INT NULL`,
  );

  // Task-Regeln IDs 54–57 + System-Automation IDs 58–63
  for (const [id, name, tool_name] of [
    [54, "Aufgabe hinzufügen erlaubt", "add_task"],
    [55, "Aufgaben auflisten erlaubt", "list_tasks"],
    [56, "Aufgabe erledigen erlaubt", "complete_task"],
    [57, "Aufgabe löschen erlaubt", "delete_task"],
    [58, "Programm starten erlaubt", "launch_app"],
    [59, "Fenster steuern erlaubt", "control_window"],
    [60, "Tastatureingaben senden erlaubt", "send_keys"],
    [61, "Datei in Papierkorb erlaubt", "delete_file"],
    [62, "Dienste verwalten erlaubt", "manage_service"],
    [63, "Bildschirm lesen (OCR) erlaubt", "read_screen"],
    [64, "Mausklick erlaubt", "click_at"],
    [65, "Mausbewegung erlaubt", "move_mouse"],
    [66, "Drag and Drop erlaubt", "drag_drop"],
    [67, "Befehl ausfuehren erlaubt", "run_command"],
    [68, "Bildschirm beobachten erlaubt", "watch_screen"],
    [69, "Datei lesen erlaubt", "read_file_content"],
    [70, "Datei umbenennen erlaubt", "rename_file"],
    [71, "Datei kopieren erlaubt", "copy_file"],
    [72, "Ordner erstellen erlaubt", "create_folder"],
    [73, "Dark Mode umschalten erlaubt", "toggle_dark_mode"],
    [74, "Akkustatus abrufen erlaubt", "get_battery_status"],
    [75, "Temperaturen abrufen erlaubt", "get_temperatures"],
    [76, "Ereignisprotokoll abrufen erlaubt", "get_event_log"],
    [77, "WLAN-Info abrufen erlaubt", "get_wifi_info"],
    [78, "Medien steuern erlaubt", "control_media"],
    [79, "Aktuelle Wiedergabe abrufen erlaubt", "get_now_playing"],
    [80, "Text uebersetzen erlaubt", "translate_text"],
    [81, "Text zusammenfassen erlaubt", "summarize_text"],
    [82, "UI-Element klicken erlaubt", "click_element"],
    [83, "Wecker stellen erlaubt", "set_alarm"],
    [84, "Wecker auflisten erlaubt", "list_alarms"],
    [85, "Wecker loeschen erlaubt", "delete_alarm"],
    [86, "Ordner auflisten erlaubt", "list_folder"],
    [87, "Bildschirm beschreiben erlaubt", "describe_screen"],
    [88, "Bilddatei beschreiben erlaubt", "describe_image"],
    [89, "Webseite beschreiben erlaubt", "describe_webpage"],
  ] as const) {
    await exec(`
      INSERT INTO rules (id, name, tool_name, \`trigger\`, action, enabled)
      VALUES (${id}, '${name}', '${tool_name}', 'always', 'allow', TRUE)
      ON DUPLICATE KEY UPDATE name=VALUES(name), action=VALUES(action), enabled=TRUE
    `);
  }

  // Wecker-Tabelle
  await exec(`
    CREATE TABLE IF NOT EXISTS alarms (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      profile_id INT NULL,
      label      VARCHAR(255) NOT NULL DEFAULT 'Wecker',
      time_hhmm  CHAR(5) NOT NULL,
      active     BOOLEAN NOT NULL DEFAULT TRUE,
      last_fired DATE NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

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

  // ── Schach ────────────────────────────────────────────────────────────────────
  await exec(`
    CREATE TABLE IF NOT EXISTS chess_games (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      profile_id   INT NULL,
      fen          VARCHAR(120) NOT NULL DEFAULT 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      moves        JSON NULL,
      status       ENUM('active','checkmate','stalemate','draw','resigned') NOT NULL DEFAULT 'active',
      player_color ENUM('white','black') NOT NULL DEFAULT 'white',
      moves_count  INT NOT NULL DEFAULT 0,
      winner       ENUM('player','ella','draw') NULL,
      created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await exec(`
    INSERT INTO rules (id, name, tool_name, \`trigger\`, action, enabled)
    VALUES (90, 'Schach öffnen erlaubt', 'open_chess_window', 'always', 'allow', TRUE)
    ON DUPLICATE KEY UPDATE name=VALUES(name), action=VALUES(action), enabled=TRUE
  `);

  await exec(`
    INSERT INTO rules (id, name, tool_name, \`trigger\`, action, enabled)
    VALUES (91, 'Monitore auflisten erlaubt', 'list_monitors', 'always', 'allow', TRUE)
    ON DUPLICATE KEY UPDATE name=VALUES(name), action=VALUES(action), enabled=TRUE
  `);

  await exec(`
    INSERT INTO rules (id, name, tool_name, \`trigger\`, action, enabled)
    VALUES (92, 'App auf Monitor öffnen erlaubt', 'open_app_on_monitor', 'always', 'allow', TRUE)
    ON DUPLICATE KEY UPDATE name=VALUES(name), action=VALUES(action), enabled=TRUE
  `);

  // Schach-Starter-Memories (einmalig beim ersten Start)
  const chessMemories = [
    "♟ Schach-Grundregel: Figuren bewegen sich nach festen Regeln — Bauer vorwärts, Turm gerade, Läufer diagonal, Springer im L, Dame alles, König ein Feld.",
    "♟ Schach-Prinzip: Kontrolliere das Zentrum (d4, d5, e4, e5) mit Bauern und Figuren — wer das Zentrum hat, hat mehr Raum.",
    "♟ Schach-Prinzip: Entwickle alle Figuren früh — Springer und Läufer sollten in den ersten Zügen aus ihrer Startposition.",
    "♟ Schach-Prinzip: Bringe den König durch Rochade in Sicherheit, bevor du angreifst.",
    "♟ Schach-Selbstbild: Ich lerne Schach durch Erfahrung. Ich denke jeden Zug selbst durch und entwickle meinen eigenen Stil.",
  ];
  for (const content of chessMemories) {
    await exec(`
      INSERT IGNORE INTO memories (type, content, embedding, profile_id)
      SELECT 'system', '${content.replace(/'/g, "''")}', '[]', NULL
      WHERE NOT EXISTS (SELECT 1 FROM memories WHERE content LIKE '%${content.substring(2, 20).replace(/'/g, "''")}%' AND profile_id IS NULL)
    `);
  }

  await exec(`
    INSERT INTO rules (id, name, tool_name, \`trigger\`, action, enabled)
    VALUES (95, 'Erfahrungsreflexion erlaubt', 'reflect_on_experiences', 'always', 'allow', TRUE)
    ON DUPLICATE KEY UPDATE name=VALUES(name), action=VALUES(action), enabled=TRUE
  `);

  await exec(`
    INSERT INTO rules (id, name, tool_name, \`trigger\`, action, enabled)
    VALUES (93, 'Dokumente indizieren erlaubt', 'index_documents', 'always', 'allow', TRUE)
    ON DUPLICATE KEY UPDATE name=VALUES(name), action=VALUES(action), enabled=TRUE
  `);

  for (const [id, name, tool_name] of [
    [96, "Drucker auflisten erlaubt", "list_printers"],
    [97, "Dokument drucken erlaubt", "print_document"],
    [98, "Druckjobs anzeigen erlaubt", "get_print_jobs"],
    [99, "Druckjob abbrechen erlaubt", "cancel_print_job"],
    [100, "Kameras auflisten erlaubt", "list_cameras"],
    [101, "Foto aufnehmen erlaubt", "capture_photo"],
    [102, "GPU-Info abrufen erlaubt", "get_gpu_info"],
    [103, "RAM-Info abrufen erlaubt", "get_ram_info"],
    [104, "Speichergeraete auflisten erlaubt", "get_storage_devices"],
    [105, "Audiogeraete auflisten erlaubt", "get_audio_devices"],
    [106, "USB-Geraete auflisten erlaubt", "get_usb_devices"],
  ] as const) {
    await exec(`
      INSERT INTO rules (id, name, tool_name, \`trigger\`, action, enabled)
      VALUES (${id}, '${name}', '${tool_name}', 'always', 'allow', TRUE)
      ON DUPLICATE KEY UPDATE name=VALUES(name), action=VALUES(action), enabled=TRUE
    `);
  }

  await exec(`
    INSERT INTO rules (id, name, tool_name, \`trigger\`, action, enabled)
    VALUES (94, 'Dokumente durchsuchen erlaubt', 'search_documents', 'always', 'allow', TRUE)
    ON DUPLICATE KEY UPDATE name=VALUES(name), action=VALUES(action), enabled=TRUE
  `);

  await exec(`
    CREATE TABLE IF NOT EXISTS document_chunks (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      file_path   VARCHAR(1000) NOT NULL,
      filename    VARCHAR(255)  NOT NULL,
      file_type   VARCHAR(20)   NULL,
      chunk_index INT           NOT NULL,
      chunk_text  TEXT          NOT NULL,
      embedding   MEDIUMTEXT    NOT NULL,
      file_mtime  BIGINT        NOT NULL,
      indexed_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
      profile_id  INT           NULL,
      INDEX idx_doc_path    (file_path(255)),
      INDEX idx_doc_profile (profile_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Eigene Pipelines
  await exec(`
    CREATE TABLE IF NOT EXISTS custom_pipelines (
      id             VARCHAR(36)                   NOT NULL PRIMARY KEY,
      profile_id     INT                           NULL,
      name           VARCHAR(255)                  NOT NULL,
      description    TEXT                          NOT NULL DEFAULT '',
      icon           VARCHAR(20)                   NOT NULL DEFAULT '⚡',
      execution_mode ENUM('parallel','sequential') NOT NULL DEFAULT 'parallel',
      agents         JSON                          NOT NULL,
      created_at     DATETIME                      NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at     DATETIME                      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}
