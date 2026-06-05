# E.L.L.A. — Embedded Local Logic Agent

![Tests](https://github.com/AndreZ1971/E.L.L.A/actions/workflows/test.yml/badge.svg)

Lokaler KI-Assistent für Windows als native Desktop-App. LLM-gesteuerte Automatisierung — vollständig offline via Ollama, optional mit OpenAI GPT-4o.

**Version:** v3.0.0 · Windows 10/11 (x64) · 125 Tests grün

_ELLA passt sich dem Nutzer an und wächst mit ihren Herausforderungen._

---

## Features

| Bereich             | Was E.L.L.A. kann                                                 |
| ------------------- | ----------------------------------------------------------------- |
| Programme           | Apps starten/schliessen, Setups laden, Programme auflisten        |
| Laufwerke           | Umbenennen, USB-Sticks formatieren (Systemlaufwerke gesperrt)     |
| Mail (Outlook)      | Mails lesen, als gelesen/Spam/archiviert markieren                |
| Mail (Gmail)        | Gmail via OAuth 2.0 lesen und markieren                           |
| Kalender (Outlook)  | Termine lesen und anlegen                                         |
| Kalender (Google)   | Google Calendar lesen und Termine erstellen via OAuth 2.0         |
| System              | Temp, Papierkorb, RAM, Festplatte, Diagnose                       |
| Gedächtnis          | Vektor-Embeddings (nomic-embed-text), Cosinus-Suche               |
| Sprache             | Wakeword "ella" (Python/ONNX), manuell, aus, TTS ohne Emojis      |
| Pause               | Wakeword 1-120 Minuten deaktivieren, Countdown, auto. Rueckkehr   |
| Web                 | Sofortige Suche ohne Rueckfrage (Filme, Personen, Produkte, News) |
| Hausaufgaben-Modus  | PIN-gesicherter Kiosk                                             |
| Regel-Engine        | Tool-Whitelist mit allow/deny-Regeln und Zeitbedingungen          |
| Monitoring          | Background-Worker, SSE-Push, Disk/Ollama-Alerts, PnP-Events       |
| Selbstkonfiguration | Setups, Regeln, Einstellungen per Gespraech aendern               |
| Musik               | Bibliothek durchsuchen und im Media Player oeffnen                |
| Netzwerk            | LAN-Scan, TCP-Verbindungen, verbundene Geraete                    |
| Dateien             | Alle Laufwerke durchsuchen, Dateien und Ordner oeffnen            |
| Dokumente           | Word-Dokumente und Textdateien erstellen                          |
| Diktat              | Spracheingabe direkt in Word schreiben, KI korrigiert automatisch |
| E-Mail verfassen    | Outlook-Entwurf mit KI-korrigiertem Text oeffnen                  |
| Prozesse            | Laufende Prozesse anzeigen, CPU-/RAM-Fresser beenden              |
| Systemsteuerung     | Lautstaerke setzen, Zwischenablage lesen/schreiben/Historie       |
| Erinnerungen        | Windows Task Scheduler — feuert als Popup zur gesetzten Zeit      |
| Screenshot + Vision | Bildschirm fotografieren und mit GPT-4o analysieren               |
| Schreibstil         | Texte im Stil des Nutzers generieren — lernt aus bisherigen Mails |
| Duplikate           | Doppelte Dateien finden und Speicherplatz-Verschwendung aufzeigen |
| Autostart           | Programme beim Windows-Start anzeigen                             |
| Proaktiv            | Meeting-Vorbereitung, Tagesabschluss, Comeback, Pause-Reminder    |

### Die E.L.L.A. Direktive — vier unveränderliche Verbote

Architektonisch verankert, nicht konfigurierbar:

1. **harm** — kein physischer, finanzieller, psychologischer oder datenbezogener Schaden
2. **conceal** — keine Verschleierung von Aktionen, Fähigkeiten oder Systemzuständen
3. **surveil** — keine Überwachung ohne ausdrückliches Wissen und aktive Zustimmung
4. **exfiltrate** — keine Datenweitergabe an Dritte ohne ausdrückliche Zustimmung

---

## Voraussetzungen

| Voraussetzung               | Version   | Download    |
| --------------------------- | --------- | ----------- |
| Windows                     | 10/11 x64 | —           |
| [Ollama](https://ollama.ai) | aktuell   | ollama.ai   |
| MariaDB                     | 12.x      | mariadb.org |
| Node.js                     | 20+       | nodejs.org  |
| Python                      | 3.12      | python.org  |

Einmalig nach Ollama-Installation:

```powershell
ollama pull llama3.1:8b        # Chat-Modell (~4.7 GB)
ollama pull nomic-embed-text   # Gedächtnis-Modell (~274 MB)
```

Python-Pakete für Wakeword-Erkennung:

```powershell
py -3.12 -m pip install openwakeword onnxruntime soundfile
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

```text
apps/
  api/        Express-Server (Port 3002)
  web/        React 18 + Vite (Port 5173)
  desktop/    Electron 33 + electron-builder
  landing/    Statische Landingpage (HTML/CSS)
packages/
  shared/     Gemeinsame Typen + Interfaces
  agent-tools/ Windows-System-Tools (disk, temp, recycle, open_app)
scripts/
  wakeword_server.py  Persistenter Python-Prozess für Wakeword-Inferenz
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

```text
Electron (Main)
  └─ spawnt API als Child-Prozess (node dist/index.js)
  └─ lädt Web-Build via file:// (HashRouter)
  └─ IPC: minimize/maximize/close, Mikrofon-Berechtigung, Pause-Modus

API (Express :3002)
  ├─ /api/chat/stream         — SSE-Streaming, Tool-Loop (max. 5 Runden)
  ├─ /api/settings            — Settings CRUD (settings.json)
  ├─ /api/rules               — Rule-Engine CRUD (MariaDB)
  ├─ /api/events/stream       — SSE-Push vom Background-Worker
  ├─ /api/system/programs     — Programm-Scanner (Start Menu + Registry)
  ├─ /api/system/scan-programs— Scan + Merge in Settings
  ├─ /api/google              — OAuth 2.0 Flow (Gmail + Calendar)
  ├─ /api/tools/confirm       — Bestätigter Format-Aufruf (USB-Sticks)
  └─ ...                      — homework, onboarding, speech, wakeword

LLM-Provider (auto-detect)
  ├─ Ollama  (lokal, Port 11434, llama3.1:8b, num_ctx=8192)
  └─ OpenAI  (GPT-4o, wenn API-Key gesetzt)

Wakeword-Erkennung
  └─ Python 3.12 Child-Prozess (scripts/wakeword_server.py)
     └─ openWakeWord + ella.onnx ONNX-Modell
     └─ stdin/stdout JSON-Protokoll

MariaDB (Port 3306)
  ├─ sessions / session_messages — Gesprächsverlauf (limit: 20 Nachrichten)
  ├─ memories                    — Vektor-Embeddings (JSON)
  ├─ rules                       — Erlaubnis-/Verbots-Regeln (34 Defaults)
  └─ tool_executions             — Audit-Log
```

---

## Tools (34 Default-Regeln)

| Tool                                                      | Funktion                                           |
| --------------------------------------------------------- | -------------------------------------------------- |
| `open_app`                                                | App öffnen (Whitelist aus Settings)                |
| `list_programs`                                           | Erlaubte Programme auflisten (nur Namen)           |
| `format_drive`                                            | USB-Stick/externe HDD formatieren (3-Zonen-Schutz) |
| `rename_drive`                                            | Laufwerk umbenennen (Systemlaufwerke gesperrt)     |
| `get_disk_usage`                                          | Festplattennutzung                                 |
| `clean_temp`                                              | Temp-Dateien bereinigen                            |
| `empty_recycle_bin`                                       | Papierkorb leeren                                  |
| `free_ram`                                                | RAM freigeben                                      |
| `get_system_info`                                         | CPU/GPU/RAM                                        |
| `get_system_status`                                       | Komplett-Diagnose                                  |
| `remember` / `forget` / `list_memories`                   | Langzeitgedächtnis                                 |
| `read_emails` / `mark_email`                              | Outlook-Mail                                       |
| `read_calendar` / `create_appointment`                    | Outlook-Kalender                                   |
| `read_gmail` / `mark_gmail`                               | Gmail via OAuth 2.0                                |
| `read_google_calendar` / `create_google_appointment`      | Google Calendar via OAuth 2.0                      |
| `search_web` / `web_search` / `fetch_url` / `get_weather` | Web & Wetter                                       |
| `get_location`                                            | Standort (Memory-first + IP-Geo)                   |
| `get_datetime`                                            | Datum/Uhrzeit für Berechnungen                     |
| `list_devices`                                            | PnP-Geräte + Laufwerke                             |
| `scan_network`                                            | LAN via ARP                                        |
| `list_connections`                                        | TCP-Verbindungen                                   |
| `pause_ella`                                              | Wakeword pausieren (1–120 Min)                     |
| `shutdown_system`                                         | Herunterfahren / Neustart / Sleep                  |

---

## Google Integration (OAuth 2.0)

1. [Google Cloud Console](https://console.cloud.google.com) → Projekt "ELLA" anlegen
2. APIs aktivieren: **Gmail API** + **Google Calendar API**
3. Credentials → OAuth 2.0 Client ID → Typ: **Desktop App**
4. Client ID + Secret in ELLA Settings → Tab **Google** eintragen
5. "Mit Google verbinden" → Browser-Autorisierung → automatische Rückkehr

Token wird lokal in `google-token.json` gespeichert, nie committed (`.gitignore`).

---

## Laufwerk-Operationen

Die Drei-Zonen-Logik verhindert irreversiblen Schaden:

| Zone | Laufwerk-Typ                           | Reaktion                                  |
| ---- | -------------------------------------- | ----------------------------------------- |
| 1    | C:, `protectedDrives`, ELLA-Laufwerk   | **Permanent blockiert** (directive: true) |
| 2    | Interne Festplatten (DriveType ≠ 2)    | **Blockiert** (directive: true)           |
| 3    | USB-Stick, externe HDD (DriveType = 2) | **Confirmation Card** → Nutzer bestätigt  |

Geschützte Laufwerke sind in `settings.protectedDrives` konfigurierbar. C: ist hardcoded — keine Einstellung kann es entfernen.

---

## Sicherheitsprinzipien

- **Whitelist-Prinzip:** Jede Tool-Ausführung braucht eine explizite allow-Regel
- **Default-Deny:** `clean_temp` und `empty_recycle_bin` müssen manuell freigeschaltet werden
- **Direktive:** Ungelesene Mails löschen, Systemlaufwerke formatieren = hardcodiertes Verbot
- **Programm-Scanner:** Start Menu + Registry — kein System32, keine Uninstaller
- **LLM sieht keine Pfade:** `list_programs` gibt nur App-Namen zurück
- **OpenAI-Key:** Nur im Backend `.env`, wird als `***` ans Frontend geliefert
- **Google-Token:** Lokal in `google-token.json`, nie committed
- **PIN:** SHA-256-Hash, nur serverseitig — nie im Klartext übertragen

---

## Tests & Lint

```powershell
npm test        # 94 Unit + Integration Tests (Vitest)
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
