# E.L.L.A. — Embedded Local Logic Agent

Lokaler KI-Assistent für Windows als native Desktop-App. LLM-gesteuerte Automatisierung — vollständig offline via Ollama, optional mit OpenAI GPT-4o.

**Version:** v1.0.0 · Windows 10/11 (x64)

---

## Features

| Bereich             | Was E.L.L.A. kann                                                                   |
| ------------------- | ----------------------------------------------------------------------------------- |
| Programme           | Apps starten/schließen, App-Setups laden                                            |
| Mail                | Ungelesene Mails lesen (Outlook/Thunderbird), als gelesen/Spam/archiviert markieren |
| Kalender            | Termine lesen, neue Termine in Outlook anlegen                                      |
| System              | Temp-Dateien bereinigen, Papierkorb leeren, RAM freigeben, Festplattenstatus        |
| Gedächtnis          | Lokale Vektor-Embeddings (nomic-embed-text), Cosinus-Suche, Langzeitgedächtnis      |
| Sprache             | Wakeword "ella" / manuell / aus, TTS mit Windows-Stimmen                            |
| Hausaufgaben-Modus  | PIN-gesicherter Kiosk — aktivieren ohne PIN, sperren mit PIN                        |
| Regel-Engine        | Tool-Whitelist mit konfigurierbaren allow/deny-Regeln und Zeitbedingungen           |
| Monitoring          | Background-Worker, SSE-Push, Dashboard-Alerts für Disk/Ollama                       |
| Selbstkonfiguration | Setups/Regeln/Einstellungen per Gespräch ändern, Notschalter im UI                  |

**Unveränderliche Direktive:** Ungelesene Mails werden niemals gelöscht — technisch verankert, nicht konfigurierbar.

---

## Voraussetzungen

| Voraussetzung               | Version   | Download    |
| --------------------------- | --------- | ----------- |
| Windows                     | 10/11 x64 | —           |
| [Ollama](https://ollama.ai) | aktuell   | ollama.ai   |
| MariaDB                     | 12.x      | mariadb.org |
| Node.js                     | 20+       | nodejs.org  |

Einmalig nach Ollama-Installation:

```powershell
ollama pull llama3.1:8b        # Chat-Modell (~4.7 GB)
ollama pull nomic-embed-text   # Gedächtnis-Modell (~274 MB)
```

---

## Installation (Installer)

1. Installer von der [Landingpage](apps/landing/index.html) herunterladen
2. `E.L.L.A.-Setup.exe` ausführen
3. Beim ersten Start: EULA lesen → System-Check → Onboarding

Der Installer enthält alle Node.js-Abhängigkeiten. Ollama und MariaDB müssen separat installiert sein.

---

## Entwicklungsmodus

### Schnellstart nach Clone

```powershell
# Abhängigkeiten installieren
npm install

# Packages bauen (Reihenfolge wichtig)
npm run build --workspace=packages/shared
npm run build --workspace=packages/agent-tools
npm run build --workspace=apps/api
npm run build --workspace=apps/web
cd apps/desktop && node build-main.mjs && cd ../..

# Electron starten (verwaltet API als Child-Prozess)
$env:ELLA_DEV = "1"
cd apps\desktop
.\node_modules\electron\dist\electron.exe .
```

### Voraussetzungen (Dev)

```env
# apps/api/.env
PORT=3002
NODE_ENV=development
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
OPENAI_API_KEY=        # Optional
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ella
DB_USER=ella
DB_PASSWORD=<dein-passwort>
```

MariaDB-Dienst starten:

```powershell
sc start MariaDB
```

### Parallel-Dev (API + Vite)

```powershell
# API + Web parallel (concurrently):
npm run dev

# Oder einzeln:
npm run dev --workspace=apps/api   # :3002
npm run dev --workspace=apps/web   # :5173
```

### Build für Installer

```powershell
# Alle Packages bauen
npm run build

# Electron + NSIS-Installer
cd apps/desktop
npm run dist
# → dist-installer/E.L.L.A.-Setup.exe
```

---

## Projektstruktur

```
apps/
  api/        Express-Server (Port 3002)
  web/        React 18 + Vite (Port 5173)
  desktop/    Electron 33 + electron-builder
  landing/    Statische Landingpage (HTML/CSS)
packages/
  shared/     Gemeinsame Typen + Interfaces
  agent-tools/ Windows-System-Tools (disk, temp, recycle, open_app)
database/
  schema.sql  MariaDB-Schema (idempotent, IF NOT EXISTS)
docs/
  architecture.md  Systemübersicht, Chat-Flow, Ports
  history.md       Entwicklungshistorie (warum wurde was gebaut)
  roadmap.md       Abgeschlossene und geplante Features
  database.md      Schema-Dokumentation, Admin-Befehle
  hardware.md      Hardware-Spezifikation
```

---

## Architektur-Überblick

```
Electron (Main)
  └─ spawnt API als Child-Prozess (node dist/index.js)
  └─ lädt Web-Build via file:// (HashRouter)
  └─ IPC: minimize/maximize/close, Mikrofon-Berechtigung

API (Express :3002)
  ├─ /api/chat/stream  — SSE-Streaming, Tool-Loop (max. 5 Runden)
  ├─ /api/settings     — Settings CRUD (settings.json)
  ├─ /api/rules        — Rule-Engine CRUD (MariaDB)
  ├─ /api/events/stream— SSE-Push vom Background-Worker
  ├─ /api/setup        — Dependency-Check + nomic-Pull-Stream
  └─ ...               — homework, onboarding, system, tools

LLM-Provider (auto-detect)
  ├─ Ollama  (lokal, Port 11434, llama3.1:8b)
  └─ OpenAI  (GPT-4o, wenn API-Key gesetzt)

MariaDB (Port 3306)
  ├─ sessions / session_messages — Gesprächsverlauf
  ├─ memories                    — Vektor-Embeddings (JSON)
  ├─ rules                       — Erlaubnis-/Verbots-Regeln
  └─ tool_executions             — Audit-Log
```

---

## Sicherheitsprinzipien

- **Whitelist-Prinzip:** Jede Tool-Ausführung braucht eine explizite allow-Regel
- **Default-Deny:** Kein Tool ohne passende Regel — `clean_temp` und `empty_recycle_bin` müssen manuell freigeschaltet werden
- **Direktive:** Ungelesene Mails löschen = hardcodiertes Verbot, keine Regel kann es überschreiben
- **OpenAI-Key:** Nur im Backend `.env`, wird als `***` ans Frontend geliefert
- **PIN:** SHA-256-Hash, nur serverseitig — nie im Klartext übertragen

---

## Tests & Lint

```powershell
npm test
npm run lint
```

---

## Dokumentation

| Dokument                                     | Inhalt                                                          |
| -------------------------------------------- | --------------------------------------------------------------- |
| [CHANGELOG.md](CHANGELOG.md)                 | Alle Versionen auf einen Blick                                  |
| [docs/history.md](docs/history.md)           | Detaillierte Entwicklungshistorie mit Entscheidungsbegründungen |
| [docs/architecture.md](docs/architecture.md) | Systemübersicht, Chat-Flow, Ports, Stack                        |
| [docs/database.md](docs/database.md)         | MariaDB-Schema, Tabellenbeschreibungen, Admin-Befehle           |
| [docs/roadmap.md](docs/roadmap.md)           | Abgeschlossene und geplante Features                            |
| [docs/hardware.md](docs/hardware.md)         | Hardware-Spezifikation und GPU-Setup                            |

---

## Lizenz

Proprietär. Alle Rechte vorbehalten. Quellcode-Einsicht auf GitHub zu Demonstrationszwecken.
