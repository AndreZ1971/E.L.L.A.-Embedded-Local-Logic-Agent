# Datenbank — v3.5.0

**System:** MariaDB 12.2.2
**Datenbankname:** `ella`
**Host:** `localhost:3306`
**Datenpfad:** `E:\MariaDB\data`
**Binaries:** `E:\MariaDB\server\bin\`

---

## Verbindung

Die API verbindet sich über einen Connection-Pool (`mysql2/promise`):

```typescript
// apps/api/src/config/database.ts
export const pool = mysql.createPool({
  host: env.dbHost,
  port: env.dbPort,
  database: env.dbName,
  user: env.dbUser,
  password: env.dbPassword,
  waitForConnections: true,
  connectionLimit: 10,
});
```

---

## Nutzer und Berechtigungen

| User   | Host        | Datenbank | Rechte         |
| ------ | ----------- | --------- | -------------- |
| `root` | `localhost` | alle      | Alle (Admin)   |
| `ella` | `localhost` | `ella.*`  | ALL PRIVILEGES |

**Passwörter** stehen ausschließlich in `apps/api/.env` — nie im Code oder Git.

```sql
CREATE USER 'ella'@'localhost' IDENTIFIED BY '<passwort>';
GRANT ALL PRIVILEGES ON ella.* TO 'ella'@'localhost';
FLUSH PRIVILEGES;
```

---

## Schema-Migration

Das Schema wird bei jedem API-Start automatisch ausgeführt (`runMigrations()` in `apps/api/src/config/migrate.ts`). Alle Statements nutzen `IF NOT EXISTS` bzw. `INSERT IGNORE` — vollständig idempotent. Manuell anwenden:

```powershell
"E:\MariaDB\server\bin\mysql.exe" -u root -p ella < database/schema.sql
```

---

## Tabellen

### `sessions` — Gesprächssitzungen

```sql
CREATE TABLE IF NOT EXISTS sessions (
  id         VARCHAR(255) PRIMARY KEY,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

| Spalte       | Typ          | Beschreibung                                |
| ------------ | ------------ | ------------------------------------------- |
| `id`         | VARCHAR(255) | Session-ID (UUID, vom Frontend generiert)   |
| `updated_at` | DATETIME     | Letzte Aktivität — automatisch aktualisiert |

---

### `session_messages` — Gesprächsverlauf

```sql
CREATE TABLE IF NOT EXISTS session_messages (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  role       ENUM('user', 'assistant') NOT NULL,
  content    TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);
```

| Spalte    | Typ  | Beschreibung                                                     |
| --------- | ---- | ---------------------------------------------------------------- |
| `role`    | ENUM | Nur `user` und `assistant` — `tool`-Nachrichten werden gefiltert |
| `content` | TEXT | Nachrichteninhalt im Klartext                                    |

**Strategie:** Bei `sessionStore.set()` wird die Session vollständig gelöscht und neu geschrieben (DELETE + Re-INSERT). Max. 40 Nachrichten pro Session. `tool`-Nachrichten werden herausgefiltert — sie sind nur während eines laufenden Requests gültig.

---

### `memories` — Vektor-Gedächtnis

```sql
CREATE TABLE IF NOT EXISTS memories (
  id         INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  type       ENUM('user', 'system', 'note') NOT NULL,
  content    TEXT NOT NULL,
  embedding  MEDIUMTEXT NOT NULL,
  source     VARCHAR(255),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_memories_type ON memories (type);
```

| Spalte      | Typ          | Beschreibung                                                                     |
| ----------- | ------------ | -------------------------------------------------------------------------------- |
| `type`      | ENUM         | `user` (Fakten über Nutzer), `system` (Tool-Nutzung), `note` (explizite Notizen) |
| `content`   | TEXT         | Originaltext der Erinnerung                                                      |
| `embedding` | MEDIUMTEXT   | JSON-Array mit 768 Float-Werten (nomic-embed-text)                               |
| `source`    | VARCHAR(255) | Woher die Erinnerung stammt (optional)                                           |

**Recall:** Die letzten 500 Einträge werden geladen, Cosinus-Ähnlichkeit in Node.js berechnet, alles unter 0.3 gefiltert, Top-5 zurückgegeben.

---

### `rules` — Erlaubnis-/Verbots-Regeln

```sql
CREATE TABLE IF NOT EXISTS rules (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  tool_name  VARCHAR(100) NOT NULL DEFAULT '*',
  `trigger`  VARCHAR(255) NOT NULL DEFAULT 'always',
  action     ENUM('allow', 'deny') NOT NULL DEFAULT 'allow',
  enabled    BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

| Spalte          | Typ          | Beschreibung                                              |
| --------------- | ------------ | --------------------------------------------------------- |
| `tool_name`     | VARCHAR(100) | `*` = gilt für alle Tools, sonst spezifischer Name        |
| `` `trigger` `` | VARCHAR(255) | `always` · `hour > 22` · `disk_c > 85`                    |
| `action`        | ENUM         | `allow` oder `deny` — Deny gewinnt immer (SQL-Sortierung) |
| `enabled`       | BOOLEAN      | Deaktivieren ohne Löschen                                 |

**Hinweis:** `` `trigger` `` muss mit Backticks geschrieben werden — `trigger` ist ein reserviertes SQL-Keyword.

**Default-Regeln (IDs 1–85):** Per `INSERT IGNORE` beim Start eingespielt. `clean_temp` und `empty_recycle_bin` haben bewusst keine Default-Regel — müssen explizit freigeschaltet werden.

---

### `tool_executions` — Audit-Log

```sql
CREATE TABLE IF NOT EXISTS tool_executions (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  tool_name   VARCHAR(100) NOT NULL,
  args        JSON         NOT NULL,
  result      JSON,
  success     BOOLEAN      NOT NULL,
  error       TEXT,
  executed_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

| Spalte    | Typ     | Beschreibung                                  |
| --------- | ------- | --------------------------------------------- |
| `args`    | JSON    | Parameter mit denen das Tool aufgerufen wurde |
| `result`  | JSON    | Rückgabewert (`output`-Feld des ToolResult)   |
| `success` | BOOLEAN | Erfolgreich oder Fehler                       |
| `error`   | TEXT    | Fehlermeldung bei `success = false`           |

Jeder `toolExecutor.execute()`-Aufruf schreibt via `setImmediate` einen Eintrag — fire-and-forget, blockiert keine Antwort.

---

### `system_events` — Worker-Eventlog

```sql
CREATE TABLE IF NOT EXISTS system_events (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  type       VARCHAR(100) NOT NULL,
  payload    JSON,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

| Spalte    | Typ          | Beschreibung                                            |
| --------- | ------------ | ------------------------------------------------------- |
| `type`    | VARCHAR(100) | `disk`, `ram`, `ollama`, `alert`                        |
| `payload` | JSON         | Ereignis-Daten (z.B. `{ "drive": "C", "usedPct": 62 }`) |

Append-only — kein UPDATE, kein DELETE. Der Background-Worker schreibt alle 60 s. `GET /api/events/recent` liefert die letzten 50 Einträge.

---

### `settings` — Key-Value-Store (Reserviert)

```sql
CREATE TABLE IF NOT EXISTS settings (
  key_name   VARCHAR(255) PRIMARY KEY,
  value      TEXT         NOT NULL,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

Aktuell nicht aktiv genutzt — E.L.L.A. speichert Einstellungen in `apps/api/settings.json` (einfachere Migration, kein Schema-Lock-in). Die Tabelle bleibt im Schema für zukünftige Nutzung reserviert.

---

### `profiles` — Nutzerprofile (v3.1.0)

```sql
CREATE TABLE IF NOT EXISTS profiles (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  color      VARCHAR(7)   NOT NULL DEFAULT '#7C3AED',
  pin_hash   VARCHAR(255),
  pin_salt   VARCHAR(255),
  is_default BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

| Spalte       | Typ          | Beschreibung                                             |
| ------------ | ------------ | -------------------------------------------------------- |
| `pin_hash`   | VARCHAR(255) | PBKDF2-Hash (100k Iterationen, SHA-512), NULL = kein PIN |
| `pin_salt`   | VARCHAR(255) | Zufälliger Salt, 32 Bytes als Hex                        |
| `is_default` | BOOLEAN      | Genau ein Profil ist Default (wird beim Start geladen)   |

`memories` und `sessions` haben eine `profile_id INT NULL`-Spalte — NULL bedeutet das Standard-Profil.

---

### `tasks` — Aufgabenliste (v3.1.0)

```sql
CREATE TABLE IF NOT EXISTS tasks (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  profile_id  INT          NULL,
  title       VARCHAR(500) NOT NULL,
  priority    ENUM('low', 'normal', 'high') NOT NULL DEFAULT 'normal',
  due_date    DATE         NULL,
  completed   BOOLEAN      NOT NULL DEFAULT FALSE,
  completed_at DATETIME    NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

| Spalte       | Typ  | Beschreibung                                                        |
| ------------ | ---- | ------------------------------------------------------------------- |
| `priority`   | ENUM | `high` → `normal` → `low` — Sortierreihenfolge in `list_tasks`      |
| `due_date`   | DATE | Optionales Fälligkeitsdatum — wird im Tagesabschluss berücksichtigt |
| `profile_id` | INT  | NULL = Profil-unabhängige Aufgabe                                   |

---

### `user_feedback` — Feedback-Buttons (v3.1.0)

```sql
CREATE TABLE IF NOT EXISTS user_feedback (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  session_id  VARCHAR(255) NOT NULL,
  message_idx INT          NOT NULL,
  feedback    ENUM('up', 'down') NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

| Spalte        | Typ  | Beschreibung                                   |
| ------------- | ---- | ---------------------------------------------- |
| `message_idx` | INT  | Index der Nachricht im Gesprächsverlauf        |
| `feedback`    | ENUM | `up` (Daumen hoch) oder `down` (Daumen runter) |

Feedback wird **nie** in den LLM-Kontext eingebettet — ausschließlich zur späteren Auswertung.

---

### `directive_audit` — Direktiven-Protokoll (v3.2.0)

```sql
CREATE TABLE IF NOT EXISTS directive_audit (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  tool_name   VARCHAR(100) NOT NULL,
  reason      VARCHAR(100) NOT NULL,
  session_id  VARCHAR(255),
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

| Spalte      | Typ          | Beschreibung                                             |
| ----------- | ------------ | -------------------------------------------------------- |
| `tool_name` | VARCHAR(100) | Das abgelehnte Tool                                      |
| `reason`    | VARCHAR(100) | Welches Verbot ausgelöst wurde (`harm`, `exfiltrate`, …) |

Jede Direktiven-Ablehnung wird hier protokolliert — unabhängig vom Tool-Execution-Audit-Log.

---

## Nützliche Admin-Befehle

```sql
-- Aktive Verbindungen
SHOW PROCESSLIST;

-- Tabellen-Größen
SELECT table_name,
       ROUND(data_length / 1024, 2) AS data_kb,
       ROUND(index_length / 1024, 2) AS index_kb
FROM information_schema.tables
WHERE table_schema = 'ella';

-- Tool-Ausführungen der letzten Stunde
SELECT tool_name, success, error, executed_at
FROM tool_executions
WHERE executed_at > NOW() - INTERVAL 1 HOUR
ORDER BY executed_at DESC;

-- Aktive Erlaubnis-Regeln
SELECT id, name, tool_name, `trigger`, action
FROM rules
WHERE enabled = 1
ORDER BY action DESC, id;

-- Letzte Erinnerungen
SELECT id, type, content, created_at
FROM memories
ORDER BY created_at DESC
LIMIT 20;

-- Sessions mit Nachrichtenanzahl
SELECT s.id, COUNT(m.id) AS messages, s.updated_at
FROM sessions s
LEFT JOIN session_messages m ON m.session_id = s.id
GROUP BY s.id
ORDER BY s.updated_at DESC;
```

---

## Windows-Dienst

```powershell
# Status
Get-Service MariaDB

# Starten / Stoppen (Admin)
net start MariaDB
net stop MariaDB

# Autostart sicherstellen
Set-Service -Name MariaDB -StartupType Automatic
```
