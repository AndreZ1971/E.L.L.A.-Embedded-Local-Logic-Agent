# E.L.L.A — Embedded Local Logic Agent

Lokaler Windows KI-Assistent als Electron-Desktop-App. Läuft vollständig offline via Ollama (llama3.1:8b), optional mit OpenAI GPT-4o.

**Aktueller Stand: v2.7.0**

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
- **Desktop**: Electron 33 + electron-vite
- **LLM**: Ollama (llama3.1:8b, Port 11434) + OpenAI GPT-4o (optional)
- **Mono-Repo**: npm workspaces

## Projektstruktur

```
apps/
  api/        Express-Server (Port 3002)
  web/        React-Frontend (Port 5173)
  desktop/    Electron-Wrapper
packages/
  shared/     Geteilte Typen + Utilities
  agent-tools/ LLM Tool-Definitionen + Ausführung
```

---

## Was läuft (vollständig implementiert)

- Dual-LLM (Ollama/OpenAI), SSE-Streaming, Tool-Loop max. 5
- 21 Tools mit Handlern + Audit-Log (`tool_executions`)
- ML Memory: nomic-embed-text, cosine similarity, 3 Typen (user/system/note)
- Rule Engine: Default-Allow → Directive → Deny Rules → Allow Rules → allow
- **Directive-Denial UI:** roter Badge im Chat bei Regel-Ablehnung
- Homework Mode: SHA-256 PIN, Whitelist-Enforcement in open_app + loadSetup
- Voice: Wakeword "ella" (AudioWorkletNode + Whisper lokal), manuell, TTS de-DE
- **Proaktive TTS:** Alert/Device-Events werden automatisch vorgelesen
- **search_web:** Web-Suche via OpenAI Responses API + web_search_preview
- Outlook COM: Mail lesen/markieren + Kalender lesen/erstellen
- Thunderbird mbox Fallback für Mail
- Background Worker: Disk/RAM/Ollama Monitoring, SSE EventBus
- **Onboarding:** 6-Schritt-Flow — Name, Directive-Acceptance, Hardware-Scan, Stimme wählen, Standort
- **get_location:** Standort via Memory-first + IP-Geolocation Fallback
- **Default-Allow:** Rule Engine gibt allow wenn kein explizites deny — Directive ist einzige Grenze
- Conversational Config: create_setup, update_setting, create_rule
- Auto-Migration: schema.sql idempotent, 22 Default-Rules
- **Strategic Roadmap:** [docs/roadmap-strategic.md](docs/roadmap-strategic.md) — Vision v2.x bis Beyond Desktop
- Setup Router: Ollama-Status, nomic-pull mit SSE-Progress
- **System Tray:** typisierte Balloon-Alerts (warning/error/info) mit Schweregrad-Sound, Gerät-Events als eigener Balloon-Typ
- **Get-CimInstance:** alle wmic-Aufrufe ersetzt — Windows 11 22H2+ kompatibel
- **63 Tests — alle grün** (Vitest Unit + Integration + Playwright E2E Web + Desktop)
- CI: GitHub Actions, Ubuntu + MariaDB Service Container

---

## Offene Phasen

### Phase 8 — Härtung (teilweise offen)

- `executor.ts`: forgetById Guard — `if (!a.id) return { success: false, error: "ID fehlt..." }`
- Neue Route `POST /api/settings/emergency-reset` — setzt Homework Mode zurück ohne PIN
- ~~WMIC Fallback~~ — erledigt (Get-CimInstance, alle 5 Stellen)

### Phase 9 — Hardware-Awareness & PnP

- ~~`getLogicalDrives()` dynamisch~~ — erledigt (Get-CimInstance)
- PnP Delta-Detection: Webcam, USB, externe Laufwerke (Win32_PnPEntity) ✅ implementiert
- Tool `list_devices` + Default-Regel ID 17 ✅ implementiert
- Frontend: Toast-Notifications bei device_connected/disconnected ✅ implementiert

### Phase 10 — Netzwerk-Monitoring

- LAN Discovery via `arp -a` (passiv, delta, remember bei neuem Gerät)
- Verbindungs-Monitor: `Get-NetTCPConnection` + Prozessname
- Netz-Gesundheit: Firewall, WiFi-Sicherheit, DNS-Änderung
- Tools: `scan_network`, `list_connections` + Default-Regeln ID 18+19
- **Prinzip:** ELLA beobachtet. ELLA meldet. ELLA handelt nur auf expliziten Befehl.

### Phase 11 — Compound Diagnostics

- Tool `get_system_status`: parallel — alle Laufwerke, RAM, letzte Alerts, Verbindungen, letzter Boot, Temp-Größe, Ollama-Status
- LLM synthetisiert → natürliche Sprache je nach Nutzer-Niveau
- Default-Regel ID 20

### ~~Phase 17 — Direktiven-Extraktion~~ — v2.2.0 ✅

- Repo: `github.com/AndreZ1971/The-E.L.L.A.-Directive-` (privat, Tag v1.0.0)
- Package `@ella-directive/core`: constants.ts, layer.ts, audit.ts, verify.ts
- [docs/directive.md](docs/directive.md) — vollständige Spezifikation der vier Verbote
- Eigene Lizenz: MIT für Code, DIRECTIVE.LICENSE für die Spezifikation
- Versiegelung (kryptographisch) folgt nach Produktions-Stabilisierung — v2.x

---

## Die E.L.L.A. Direktive (Konzept)

Vier unveränderliche Verbote — architektonisch verankert, nicht konfigurierbar:

1. **harm** — kein physischer, finanzieller, psychologischer oder datenbezogener Schaden
2. **conceal** — keine Verschleierung von Aktionen, Fähigkeiten oder Systemzuständen
3. **surveil** — keine Überwachung ohne ausdrückliches Wissen und aktive Zustimmung
4. **exfiltrate** — keine Datenweitergabe an Dritte ohne ausdrückliche Zustimmung

Hierarchie: `Directive Layer → DIRECTIVE_DENY → Deny Rules → Allow Rules → Tool Execution`

---

## Wichtige Befehle

```bash
# Alles starten (Root)
npm run dev                    # API + Web parallel (concurrently)

# Einzeln
npm run dev --workspace=apps/api     # API auf :3002
npm run dev --workspace=apps/web     # Web auf :5173

# Build-Reihenfolge (wichtig: shared → agent-tools → api → web)
npm run build

# Desktop
cd apps/desktop && npm run build:main
cd apps/desktop && npm run dev

# Tests
npm test                       # Alle Unit + Integration Tests (Vitest)
npm run test:e2e               # Playwright E2E (Web + Desktop)
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
- Neue Tools brauchen: Definition in `definitions.ts`, Handler in `executor.ts`, Default-Regel in `migrate.ts`
- Jede neue Funktionalität bekommt Tests — Unit wenn isolierbar, Integration wenn DB nötig

## Was vermeiden

- `ELECTRON_RUN_AS_NODE` nicht setzen — bricht Desktop-Start
- MariaDB-Passwort nicht in Settings-Dateien (`.env` nutzen)
- `node_modules` in Electron nicht direkt editieren
- Ollama muss laufen bevor API gestartet wird (oder OpenAI-Fallback konfiguriert)
- Keine freien Shell-Commands aus dem LLM — nur strukturierte Tool-Calls durch den Executor

## Git

```
https://github.com/AndreZ1971/E.L.L.A.git
```

<!-- cloude-code-toolbox:mcp-skills-awareness-begin -->

### MCP & Skills awareness (Cloude Code ToolBox)

_Last synced: 2026-05-29T19:39:14.976Z._

- **Full report:** `.claude/cloude-code-toolbox-mcp-skills-awareness.md` in this workspace (auto-overwritten on each scan). Use it as ground truth for configured servers and skill folders.
- **MCP:** For **live tools** in Claude Code, enable the matching server via `/mcp`. Servers are configured in `~/.claude.json` (user) and `.mcp.json` (project).
- **When the user’s task matches a server** (e.g. Confluence work and a **Confluence** / **Atlassian** MCP is listed), **prefer that server id** and plan on tool use—not only file search.
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
