# Datenbank

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
import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: env.dbHost,
  port: env.dbPort,
  database: env.dbName,
  user: env.dbUser,
  password: env.dbPassword,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
```

**Warum Pool statt Einzelverbindung:** Ein Pool hält mehrere Verbindungen offen und verteilt parallele Anfragen. Bei Express mit async Request-Handling können mehrere Requests gleichzeitig DB-Abfragen machen — ohne Pool würden sie auf eine einzige Verbindung warten.

---

## Nutzer und Berechtigungen

| User | Host | Datenbank | Rechte |
| --- | --- | --- | --- |
| `root` | `localhost` | alle | Alle (Admin) |
| `ella` | `localhost` | `ella.*` | ALL PRIVILEGES |

**`root`-Passwort:** `EllaRoot2026` (nur für DB-Administration, nie in Code)  
**`ella`-Passwort:** `ella_dev_2026` (steht in `apps/api/.env`, nicht in Git)

```sql
CREATE USER 'ella'@'localhost' IDENTIFIED BY 'ella_dev_2026';
GRANT ALL PRIVILEGES ON ella.* TO 'ella'@'localhost';
FLUSH PRIVILEGES;
```

---

## Schema — Tabellen

Das vollständige Schema liegt in `database/schema.sql`. Alle Tabellen verwenden `InnoDB` (Transaktionen, Foreign Keys) und `utf8mb4` (voller Unicode inkl. Emoji).

---

### `rules` — Automatisierungsregeln

Definiert Wenn-Dann-Regeln: Wenn ein bestimmtes Systemereignis eintritt, führe eine Aktion aus.

```sql
CREATE TABLE rules (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  `trigger`    VARCHAR(255) NOT NULL,   -- Backticks: trigger ist reserviertes Keyword
  action       VARCHAR(255) NOT NULL,
  parameters   JSON,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

| Spalte | Typ | Beschreibung |
| --- | --- | --- |
| `name` | VARCHAR(255) | Menschenlesbarer Name der Regel |
| `` `trigger` `` | VARCHAR(255) | Auslösebedingung (z.B. `disk_usage_high`) |
| `action` | VARCHAR(255) | Auszuführendes Tool (muss in Registry stehen) |
| `parameters` | JSON | Parameter für das Tool als JSON-Objekt |
| `is_active` | BOOLEAN | Regel kann deaktiviert werden ohne sie zu löschen |

**Wichtig:** `` `trigger` `` muss mit Backticks geschrieben werden — `trigger` ist ein reserviertes SQL-Keyword für `CREATE TRIGGER`-Statements. MariaDB würde ohne Escaping einen Syntaxfehler werfen.

---

### `approvals` — Freigabe-Queue

Gefährliche Tool-Ausführungen landen hier zur manuellen Bestätigung bevor sie ausgeführt werden. (Implementierung: Phase 2)

```sql
CREATE TABLE approvals (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  tool_name    VARCHAR(255) NOT NULL,
  parameters   JSON,
  status       ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at  TIMESTAMP NULL,
  resolved_by  VARCHAR(255)
);
```

| Spalte | Typ | Beschreibung |
| --- | --- | --- |
| `tool_name` | VARCHAR(255) | Name des Tools das Freigabe braucht |
| `parameters` | JSON | Parameter mit denen es aufgerufen werden soll |
| `status` | ENUM | `pending` → wartet, `approved` → bestätigt, `rejected` → abgelehnt |
| `requested_at` | TIMESTAMP | Wann die Anfrage erstellt wurde |
| `resolved_at` | TIMESTAMP | Wann entschieden wurde (NULL wenn noch offen) |
| `resolved_by` | VARCHAR | Wer entschieden hat (für zukünftige Multi-User-Szenarien) |

**Geplante Nutzung:** `clean_temp` und `empty_recycle_bin` werden in Phase 2 eine Freigabe verlangen. Das LLM erzeugt den Tool-Call, der Executor legt einen `pending`-Eintrag an und wartet. Das Frontend zeigt die Anfrage an, der Nutzer bestätigt oder lehnt ab.

---

### `tool_executions` — Audit-Log

Jede Tool-Ausführung wird hier protokolliert — unabhängig davon ob sie erfolgreich war.

```sql
CREATE TABLE tool_executions (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  tool_name    VARCHAR(255) NOT NULL,
  parameters   JSON,
  result       JSON,
  status       ENUM('success', 'error') NOT NULL,
  error_message TEXT,
  duration_ms  INT,
  executed_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  session_id   VARCHAR(255)
);
```

| Spalte | Typ | Beschreibung |
| --- | --- | --- |
| `tool_name` | VARCHAR(255) | Welches Tool wurde aufgerufen |
| `parameters` | JSON | Mit welchen Parametern |
| `result` | JSON | Was das Tool zurückgegeben hat |
| `status` | ENUM | `success` oder `error` |
| `error_message` | TEXT | Fehlermeldung wenn `status = 'error'` |
| `duration_ms` | INT | Ausführungszeit in Millisekunden |
| `session_id` | VARCHAR | Welcher Chat-Session gehörte das zu |

**Zweck:** Vollständige Nachvollziehbarkeit — wann wurde was ausgeführt, mit welchen Parametern, was kam raus. Besonders wichtig für destruktive Tools (`clean_temp`, `empty_recycle_bin`).

---

### `system_events` — Systemereignisse

Append-only Eventlog für Systemzustände. Keine Updates, keine Deletes — nur Inserts.

```sql
CREATE TABLE system_events (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  event_type   VARCHAR(255) NOT NULL,
  payload      JSON,
  severity     ENUM('info', 'warning', 'error') DEFAULT 'info',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

| Spalte | Typ | Beschreibung |
| --- | --- | --- |
| `event_type` | VARCHAR(255) | Art des Ereignisses (z.B. `disk_usage_high`, `api_started`) |
| `payload` | JSON | Ereignis-Daten (z.B. `{ "drive": "C", "used_pct": 95 }`) |
| `severity` | ENUM | `info`, `warning`, `error` |

**Append-only:** Systemereignisse werden niemals verändert oder gelöscht. Der gesamte Verlauf bleibt erhalten. Das ist bewusste Design-Entscheidung — ein Event das passiert ist, ist passiert.

**Geplante Nutzung (Phase 2):** Hintergrund-Prozess überwacht Disk-Usage, RAM, etc. und schreibt Events. Diese triggern dann Regeln aus der `rules`-Tabelle.

---

### `settings` — Schlüssel-Wert-Konfiguration

Persistente Konfigurationspaare die über das Dashboard geändert werden können.

```sql
CREATE TABLE settings (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  key_name     VARCHAR(255) UNIQUE NOT NULL,
  value        TEXT,
  description  TEXT,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

| Spalte | Typ | Beschreibung |
| --- | --- | --- |
| `key_name` | VARCHAR(255) UNIQUE | Einzigartiger Schlüsselname |
| `value` | TEXT | Wert (JSON-String für komplexe Werte) |
| `description` | TEXT | Beschreibung für die Settings-UI |

**Geplante Nutzung (Phase 2):** Active LLM Provider, Modell-Auswahl, aktivierte/deaktivierte Tools — alles konfigurierbar über die Settings-Seite ohne `.env`-Änderung und API-Neustart.

---

## Schema vollständig anwenden

```bash
# MariaDB CLI (Admin-User)
"E:\MariaDB\server\bin\mysql.exe" -u root -p ella < database/schema.sql
```

Oder per Client (TablePlus, DBeaver, HeidiSQL):

```
Host:     localhost
Port:     3306
User:     ella
Password: ella_dev_2026
Database: ella
```

---

## Nützliche Admin-Befehle

```sql
-- Aktive Verbindungen anzeigen
SHOW PROCESSLIST;

-- Tabellen-Größen in ella
SELECT
  table_name,
  ROUND(data_length / 1024, 2) AS data_kb,
  ROUND(index_length / 1024, 2) AS index_kb
FROM information_schema.tables
WHERE table_schema = 'ella';

-- Alle Tool-Ausführungen der letzten Stunde
SELECT tool_name, status, duration_ms, executed_at
FROM tool_executions
WHERE executed_at > NOW() - INTERVAL 1 HOUR
ORDER BY executed_at DESC;

-- Offene Freigaben
SELECT id, tool_name, parameters, requested_at
FROM approvals
WHERE status = 'pending'
ORDER BY requested_at ASC;
```

---

## Windows-Dienst

MariaDB läuft als Windows-Dienst (`MariaDB`):

```powershell
# Status prüfen
Get-Service MariaDB

# Starten / Stoppen (Admin)
net start MariaDB
net stop MariaDB

# Autostart (ist standardmäßig aktiviert)
Set-Service -Name MariaDB -StartupType Automatic
```
