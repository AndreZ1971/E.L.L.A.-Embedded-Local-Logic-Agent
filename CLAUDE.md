# E.L.L.A — Embedded Local Logic Agent

Lokaler Windows KI-Assistent als Electron-Desktop-App. Läuft vollständig offline via Ollama (llama3.1:8b), optional mit OpenAI GPT-4o.

**Aktueller Stand: v3.0.0**

> _ELLA passt sich dem Nutzer an und wächst mit ihren Herausforderungen._

---

## Arbeitsweise

- **Sparring-Partner:** Claude (claude.ai Chat) — Strategie, Architektur, Produktentscheidungen
- **Mitarbeiter:** Claude Code (dieses Tool) — führt Arbeitsanweisungen aus, schreibt Code, immer nach Best Practice
- **Grundregel:** Jede Phase wird nach Abschluss auf Fehler und Funktionalität geprüft. Alle Tests müssen grün sein. Erst dann: README aktualisieren, Tag setzen, committen, pushen.

---

## Stack

- **Backend**: Express, TypeScript, MariaDB (Port 3306, E:\MariaDB)
- **Frontend**: React 18, Vite (Port 5173)
- **Desktop**: Electron 33 + electron-builder
- **LLM**: Ollama (llama3.1:8b, Port 11434) + OpenAI GPT-4o (optional)
- **Mono-Repo**: npm workspaces

## Projektstruktur

```
apps/
  api/        Express-Server (Port 3002)
  web/        React-Frontend (Port 5173)
  desktop/    Electron-Wrapper
  landing/    Statische Landingpage
packages/
  shared/     Geteilte Typen + Interfaces
  agent-tools/ Windows-System-Tools (disk, temp, recycle, open_app)
scripts/
  wakeword_server.py  Python-Wakeword-Prozess (openWakeWord + ella.onnx)
database/
  schema.sql  MariaDB-Schema (idempotent)
```

---

## Was läuft (vollständig implementiert — v3.0.0)

### Kern

- Dual-LLM (Ollama/OpenAI), SSE-Streaming, Tool-Loop max. 5 Runden
- 53 Tools mit Handlern + Audit-Log (`tool_executions`)
- Rule Engine: Directive Layer → DIRECTIVE_DENY → Deny Rules → Allow Rules → allow
- **Directive-Denial UI:** roter Badge im Chat bei Regel-Ablehnung
- ML Memory: nomic-embed-text, cosine similarity, 3 Typen (user/system/note)

### Voice & UI

- Voice: Wakeword "ella" (Python/ONNX + openWakeWord), manuell, TTS (Edge/System, ohne Emojis/Markdown)
- Proaktive TTS: Alert/Device-Events und proaktive Nachrichten werden vorgelesen
- **Proaktive Nachrichten:** ELLA schreibt von sich aus in den Chat (SSE `proactive_message`)
- System Tray: typisierte Balloon-Alerts (warning/error/info/device) mit Schweregrad-Sound

### Produktivität

- **Dateien:** `search_files` (alle Laufwerke, Typ-Filter), `open_file` (inkl. Word-Cursor-Ende), `explore_folder`
- **Dokumente:** `create_document` (Word + TXT), `dictate_to_document` (KI-Korrektur via OpenAI/Ollama)
- **E-Mail verfassen:** `compose_email` → Outlook-Entwurf mit KI-korrigiertem Text
- **Musik:** `play_music` → Bibliothek durchsuchen (Künstler/Album/Titel), Media Player öffnen
- **Prozesse:** `list_processes`, `kill_process` (systemkritische gesperrt, Bestätigung für andere)
- **Systemsteuerung:** `set_volume` (Windows Audio COM API), `get_clipboard`/`set_clipboard` (+ Historie, 3s Polling)
- **Erinnerungen:** `set_reminder`/`list_reminders`/`delete_reminder` via Windows Task Scheduler
- **Vision:** `take_screenshot` → GDI+ Screenshot + GPT-4o Vision Analyse
- **Schreibstil:** `write_for_me` → Stilprofil aus E-Mail-Historie + Text im Nutzerstil
- **Duplikate:** `find_duplicates` (Größen+Name-Hash, Top-50)
- **Autostart:** `list_autostart` (HKLM + HKCU Registry)

### Kommunikation

- Outlook COM: Mail lesen/markieren + Kalender lesen/erstellen
- Gmail + Google Calendar via OAuth 2.0
- `compose_email` → Outlook-Entwurf (sendet nicht automatisch)

### Monitoring & Proaktiv

- Background Worker (60s): Disk/RAM/Ollama-Alerts, PnP Delta-Detection, ARP-LAN-Scan, TCP-Verbindungen, Firewall/WiFi/DNS
- Clipboard-Polling (3s), max. 20 Einträge History
- `recordActivity()` in Chat-Routen → Comeback-Briefing nach 30 Min Inaktivität
- Meeting-Vorbereitung (30 Min vor Termin, alle 5 Min gecheckt)
- Tagesabschluss (18 Uhr), Pause-Reminder (90 Min aktive Arbeit)
- Rhythmus-Analyse (täglich 12 Uhr) → Morgen-Setup vorschlagen
- Duplikat-Scan (sonntags 10 Uhr) bei > 500 MB Verschwendung

### Infrastruktur

- **Onboarding:** 6-Schritt-Flow — Name, Directive-Acceptance, Hardware-Scan, Stimme wählen, Standort
- **get_location:** Standort via Memory-first + IP-Geolocation Fallback
- Auto-Migration: schema.sql idempotent, 53 Default-Rules
- Homework Mode: SHA-256 PIN, Whitelist-Enforcement, Emergency-Reset Route
- Conversational Config: `create_setup`, `update_setting`, `create_rule`
- **Get-CimInstance:** alle wmic-Aufrufe ersetzt — Windows 11 22H2+ kompatibel
- **125 Tests — alle grün** (Vitest Unit + Integration)
- CI: GitHub Actions, Ubuntu + MariaDB Service Container

---

## Neue Tools — Checkliste

Jedes neue Tool braucht alle folgenden Schritte:

1. **`packages/shared/src/types/tool.ts`** — ToolName-Union ergänzen
2. **`apps/api/src/tools/definitions.ts`** — Tool-Definition (type, function, parameters)
3. **`apps/api/src/tools/executor.ts`** — Handler implementieren (Import + HANDLERS-Eintrag)
4. **`apps/api/src/config/migrate.ts`** — Default-Regel (nächste freie ID, `always`, `allow`)
5. **`apps/api/src/routes/settings.ts`** — Falls neue Settings-Felder: in PUT-Route Destructuring und `raw`-Objekt eintragen (sonst werden sie beim Speichern ignoriert!)
6. **`apps/api/src/services/settings.ts`** — Falls neue Settings-Felder: Interface, DEFAULT_SETTINGS, loadSettings-Migration
7. **Tests** — Unit-Test in `executor.test.ts` (Mock für externe Services)

---

## Die E.L.L.A. Direktive (Konzept)

Vier unveränderliche Verbote — architektonisch verankert, nicht konfigurierbar:

1. **harm** — kein physischer, finanzieller, psychologischer oder datenbezogener Schaden
2. **conceal** — keine Verschleierung von Aktionen, Fähigkeiten oder Systemzuständen
3. **surveil** — keine Überwachung ohne ausdrückliches Wissen und aktive Zustimmung
4. **exfiltrate** — keine Datenweitergabe an Dritte ohne ausdrückliche Zustimmung

Hierarchie: `Directive Layer → DIRECTIVE_DENY → Deny Rules → Allow Rules → Tool Execution`

Repo: `github.com/AndreZ1971/The-E.L.L.A.-Directive-` (privat, Tag v1.0.0)

---

## Wichtige Befehle

```powershell
# Alles starten (Root)
npm run dev                    # API + Web parallel (concurrently)

# Einzeln
npm run dev --workspace=apps/api     # API auf :3002
npm run dev --workspace=apps/web     # Web auf :5173

# Build-Reihenfolge (wichtig: shared → agent-tools → api → web)
npm run build

# Desktop
cd apps/desktop && node build-main.mjs && cd ../..
$env:ELLA_DEV = "1"; cd apps\desktop; .\node_modules\electron\dist\electron.exe .

# Tests
npm test                       # 125 Unit + Integration Tests (Vitest)
npm run lint

# Ollama prüfen
Invoke-RestMethod -Uri "http://localhost:11434/api/tags"
```

## MariaDB

- Server: `E:\MariaDB\server`, Daten: `E:\MariaDB\data`
- Windows-Service: `sc start MariaDB` / `sc stop MariaDB`
- Port: 3306

---

## Konventionen

- TypeScript ES2022, strict mode, NodeNext module resolution
- CommonJS-zu-ESM Bridge beachten — `import` vs `require` je nach Paket
- Änderungen an `packages/shared` immer zuerst builden, dann Consumer
- PowerShell-Scripts als Temp-Datei ausführen (nicht EncodedCommand) — vermeidet CMD-Zeilenlimit
- `execSync` mit `{ encoding: "utf-8" }` oder ohne `shell: true` — sonst TS-Overload-Fehler
- Neue Einstellungsfelder müssen in `settings.ts` UND `routes/settings.ts` eingetragen werden
- Jede neue Funktionalität bekommt Tests — Unit wenn isolierbar, Integration wenn DB nötig

## Was vermeiden

- `ELECTRON_RUN_AS_NODE` nicht setzen — bricht Desktop-Start
- MariaDB-Passwort nicht in Settings-Dateien (`.env` nutzen)
- `node_modules` in Electron nicht direkt editieren
- Ollama muss laufen bevor API gestartet wird (oder OpenAI-Fallback konfiguriert)
- Keine freien Shell-Commands aus dem LLM — nur strukturierte Tool-Calls durch den Executor
- `{ shell: true }` bei `execSync` vermeiden — TypeScript findet keinen Overload

## Git

```
https://github.com/AndreZ1971/E.L.L.A.git
```

<!-- cloude-code-toolbox:mcp-skills-awareness-begin -->

### MCP & Skills awareness (Cloude Code ToolBox)

_Last synced: 2026-06-05T08:52:39.375Z._

- **Full report:** `.claude/cloude-code-toolbox-mcp-skills-awareness.md` in this workspace (auto-overwritten on each scan). Use it as ground truth for configured servers and skill folders.
- **MCP:** For **live tools** in Claude Code, enable the matching server via `/mcp`. Servers are configured in `~/.claude.json` (user) and `.mcp.json` (project).
- **When the user's task matches a server** (e.g. Confluence work and a **Confluence** / **Atlassian** MCP is listed), **prefer that server id** and plan on tool use—not only file search.
- **Skills:** Folders below contain `SKILL.md`; attach or cite paths in chat when relevant.

#### Workspace MCP

- `z:\repos\E.L.L.A\.mcp.json` _(workspace: E.L.L.A)_ — _file missing_

_No active workspace servers in mcp.json._

#### User MCP

- `C:\Users\JannR\.claude.json` — _no servers defined_

_No active user-scoped servers in mcp.json._

#### Project skills

_None found (or no workspace open)._

#### User skills

_None found._

<!-- cloude-code-toolbox:mcp-skills-awareness-end -->
