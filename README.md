# E.L.L.A. — Embedded Local Logic Agent

![Tests](https://github.com/AndreZ1971/E.L.L.A/actions/workflows/test.yml/badge.svg)

Lokaler KI-Assistent für Windows als native Desktop-App. LLM-gesteuerte Automatisierung — vollständig offline via Ollama, optional mit OpenAI GPT-4o.

**Version:** v3.5.0 · Windows 10/11 (x64) · 205 Tests grün

_ELLA passt sich dem Nutzer an und wächst mit ihren Herausforderungen._

---

## Features

| Bereich              | Was E.L.L.A. kann                                                                  |
| -------------------- | ---------------------------------------------------------------------------------- |
| Programme            | Apps starten/schließen, Setups laden, Programme auflisten                          |
| Laufwerke            | Umbenennen, USB-Sticks formatieren (Systemlaufwerke gesperrt)                      |
| Mail (Outlook)       | Mails lesen, als gelesen/Spam/archiviert markieren                                 |
| Mail (Gmail)         | Gmail via OAuth 2.0 lesen und markieren                                            |
| Kalender (Outlook)   | Termine lesen und anlegen                                                          |
| Kalender (Google)    | Google Calendar lesen und Termine erstellen via OAuth 2.0                          |
| System               | Temp, Papierkorb, RAM, Festplatte, Diagnose, Herunterfahren                        |
| Gedächtnis           | Vektor-Embeddings (nomic-embed-text), Cosinus-Suche, 3 Typen, Profil-isoliert      |
| Sprache              | Wakeword "ella" (Python/ONNX), manuell, aus, TTS — System oder Kokoro (lokal)      |
| Pause                | Wakeword 1–120 Minuten deaktivieren, Countdown, automatische Rückkehr              |
| Web                  | Sofortige Suche ohne Rückfrage (Filme, Personen, Produkte, News)                   |
| Wetter               | Aktuelles Wetter via Open-Meteo                                                    |
| Hausaufgaben-Modus   | PIN-gesicherter Kiosk mit App-Whitelist                                            |
| Regel-Engine         | 57 Default-Regeln, allow/deny, Zeitbedingungen, Directive-Layer                    |
| Monitoring           | Background-Worker, SSE-Push, Disk/Ollama/RAM-Alerts, PnP-Events                    |
| Netzwerk             | LAN-Scan via ARP, TCP-Verbindungen, DNS/Firewall/WiFi-Überwachung                  |
| Selbstkonfiguration  | Setups, Regeln, Einstellungen per Gespräch ändern                                  |
| Musik                | Bibliothek durchsuchen (Künstler/Album/Titel) im Media Player öffnen               |
| Dateien              | Alle Laufwerke durchsuchen (Windows Search Index, ms-schnell), Dateien öffnen      |
| Dokumente            | Word/TXT erstellen, .docx/.pdf/.xlsx/.html lesen (mammoth/pdf-parse/SheetJS)       |
| Wecker               | DB-basierte Wecker mit täglichem Check, proaktive Auslösung im Background-Worker   |
| Diktat               | Spracheingabe direkt in Word, KI korrigiert Grammatik und Zeichensetzung           |
| E-Mail verfassen     | Outlook-Entwurf mit KI-korrigiertem Text öffnen (sendet nicht automatisch)         |
| Prozesse             | Laufende Prozesse anzeigen, CPU-/RAM-Fresser beenden (systemkritische geschützt)   |
| Systemsteuerung      | Lautstärke setzen/muten, Zwischenablage lesen/schreiben mit 20-Einträge-Historie   |
| Erinnerungen         | Windows Task Scheduler — feuert als Popup zur gesetzten Zeit                       |
| Screenshot + Vision  | Bildschirm fotografieren und mit GPT-4o Vision analysieren                         |
| Schreibstil          | Texte im persönlichen Stil generieren — lernt aus bisherigen E-Mails               |
| Duplikate            | Doppelte Dateien finden, Speicherplatz-Verschwendung berechnen                     |
| Autostart            | Programme beim Windows-Start auflisten                                             |
| Aufgabenliste        | Persistente TODOs mit Priorität und Fälligkeit, im Tagesabschluss integriert       |
| Proaktiv             | Meeting-Vorbereitung, Tagesabschluss, Comeback, Pause-Reminder, Clipboard-Muster   |
| Feedback-Loop        | Daumen hoch/runter → Ollama extrahiert Nutzerpräferenzen → Langzeitgedächtnis      |
| Fenster-Kontext      | ELLA kennt die aktive Anwendung beim Chat (opt-in, Ollama-only)                    |
| Gesprächskompression | Lange Sessions automatisch komprimieren (lokales Ollama)                           |
| Nutzerprofile        | Eigenes Gedächtnis und Gesprächsverlauf pro Profil, PBKDF2-gesicherter PIN-Wechsel |
| Kokoro TTS           | Lokale neuronale Stimme via Python — natürlicher als Windows-Standardstimmen       |

### Die E.L.L.A. Direktive — vier unveränderliche Verbote

Architektonisch verankert, nicht konfigurierbar:

1. **harm** — kein physischer, finanzieller, psychologischer oder datenbezogener Schaden
2. **conceal** — keine Verschleierung von Aktionen, Fähigkeiten oder Systemzuständen
3. **surveil** — keine Überwachung ohne ausdrückliches Wissen und aktive Zustimmung
4. **exfiltrate** — keine Datenweitergabe an Dritte ohne ausdrückliche Zustimmung

Hierarchie: `Directive Layer → DIRECTIVE_DENY → Deny Rules → Allow Rules → Tool Execution`

---

## Voraussetzungen

| Voraussetzung               | Version   | Bezug       |
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

Python-Pakete für Wakeword:

```powershell
py -3.12 -m pip install openwakeword onnxruntime soundfile
```

Optional — für Kokoro TTS (bessere Sprachausgabe):

```powershell
py -3.12 -m pip install kokoro-onnx sounddevice numpy
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
npm install

npm run build --workspace=packages/shared
npm run build --workspace=packages/agent-tools
npm run build --workspace=apps/api
npm run build --workspace=apps/web
cd apps/desktop && node build-main.mjs && cd ../..

$env:ELLA_DEV = "1"
cd apps\desktop
.\node_modules\electron\dist\electron.exe .
```

### Umgebungsvariablen (Dev)

```env
# apps/api/.env
PORT=3002
NODE_ENV=development
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
OPENAI_API_KEY=        # Optional — für GPT-4o, Vision und Schreibstil
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ella
DB_USER=ella
DB_PASSWORD=<dein-passwort>
```

```powershell
sc start MariaDB
```

### Parallel-Dev (API + Vite)

```powershell
npm run dev                        # API + Web parallel
npm run dev --workspace=apps/api   # nur API :3002
npm run dev --workspace=apps/web   # nur Web :5173
```

### Build für Installer

```powershell
npm run build
cd apps/desktop && npm run dist
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
  wakeword_server.py  Python-Wakeword-Prozess (openWakeWord + ella.onnx)
  tts_server.py       Python-Kokoro-TTS-Server (Port 3003, 127.0.0.1)
database/
  schema.sql  MariaDB-Schema (idempotent, IF NOT EXISTS)
docs/
  bedienungsanleitung.md  Vollständige Nutzerdokumentation
  architecture.md         Systemübersicht, Chat-Flow, Ports
  history.md              Entwicklungshistorie
  roadmap.md              Abgeschlossene und geplante Features
  database.md             Schema-Dokumentation, Admin-Befehle
  hardware.md             Hardware-Spezifikation
```

---

## Architektur-Überblick

```text
Electron (Main)
  └─ spawnt API als Child-Prozess (node dist/index.js)
  └─ spawnt Kokoro-TTS-Server wenn ttsEngine="kokoro" (python tts_server.py)
  └─ lädt Web-Build via file:// (HashRouter)
  └─ IPC: minimize/maximize/close, Mikrofon-Berechtigung, Pause-Modus
  └─ System Tray: Balloon-Alerts (warning/error/info/device), Schweregrad-Sound

API (Express :3002)
  ├─ /api/chat            — Sync + /stream SSE (Tool-Loop max. 5 Runden)
  ├─ /api/settings        — Settings CRUD (settings.json)
  ├─ /api/settings/emergency-reset
  ├─ /api/rules           — Rule-Engine CRUD (MariaDB)
  ├─ /api/events/stream   — SSE-Push vom Background-Worker
  ├─ /api/system          — Programme, Scan, Diagnose
  ├─ /api/google          — OAuth 2.0 Flow (Gmail + Calendar)
  ├─ /api/tools/confirm   — Bestätigter Format-Aufruf
  ├─ /api/homework        — PIN-Verwaltung, Homework-Mode
  ├─ /api/onboarding      — 6-Schritt-Onboarding-Flow
  ├─ /api/speech          — TTS, Whisper, /kokoro Proxy → Port 3003
  ├─ /api/feedback        — POST Daumen-Feedback (DB-only, kein LLM-Kontext)
  ├─ /api/profiles        — Nutzerprofile CRUD + Aktivierung
  └─ /api/setup           — Ollama-Status, nomic-pull (SSE-Progress)

LLM-Provider (auto-detect)
  ├─ Ollama  (lokal, Port 11434, llama3.1:8b)
  │    └─ Fenster-Kontext, Kompression, proaktive Aktionen
  └─ OpenAI  (GPT-4o, wenn API-Key gesetzt — Vision, Schreibstil, Diktat-Korrektur)

Wakeword-Erkennung
  └─ Python 3.12 Child-Prozess (scripts/wakeword_server.py)

Kokoro TTS (optional)
  └─ Python 3.12 Child-Prozess (scripts/tts_server.py)
     └─ HTTP-Server 127.0.0.1:3003
     └─ Fallback: Windows SAPI wenn kokoro-onnx fehlt

Background Worker (60s Interval)
  ├─ Disk/RAM/Ollama-Monitoring → SSE-Alerts
  ├─ PnP Delta-Detection (Webcam, USB, externe Laufwerke)
  ├─ ARP-LAN-Scan, TCP-Verbindungen, Firewall/WiFi/DNS-Monitoring
  ├─ Clipboard-Polling (3s) → History + Muster-Erkennung
  │    (IBAN, Paketnummer, Telefon, URL, E-Mail → proaktive Nachricht)
  ├─ Meeting-Prep (5 Min), Tagesabschluss (18 Uhr), Comeback (30 Min)
  ├─ Pause-Reminder (90 Min), Rhythmus-Analyse (12 Uhr), Duplikat-Scan (So 10 Uhr)
  └─ recordActivity() — Inaktivitätserkennung

MariaDB (Port 3306)
  ├─ sessions / session_messages  — Gesprächsverlauf (profile_id-isoliert)
  ├─ memories                     — Vektor-Embeddings (profile_id-isoliert)
  ├─ rules                        — 57 Default-Regeln (allow/deny)
  ├─ profiles                     — Nutzerprofile (PBKDF2+Salt PIN-Hash)
  ├─ tasks                        — Persistente Aufgabenliste (profile_id)
  ├─ user_feedback                — Daumen-Feedback (DB-only)
  ├─ system_events                — Alert-Historie
  ├─ directive_audit              — Direktiven-Auswertungs-Log
  └─ tool_executions              — Audit-Log
```

---

## Tools (85 Default-Regeln)

### System & Hardware

| Tool                | Funktion                                            |
| ------------------- | --------------------------------------------------- |
| `open_app`          | App öffnen (Whitelist aus Settings)                 |
| `list_programs`     | Erlaubte Programme auflisten (nur Namen)            |
| `load_setup`        | App-Setup starten (mehrere Apps auf einmal)         |
| `get_disk_usage`    | Festplattennutzung aller Laufwerke                  |
| `clean_temp`        | Temp-Dateien bereinigen                             |
| `empty_recycle_bin` | Papierkorb leeren                                   |
| `free_ram`          | RAM freigeben (leere Standby-Liste)                 |
| `get_system_info`   | CPU, GPU, RAM, Betriebssystem                       |
| `get_system_status` | Komplett-Diagnose (Disk, RAM, Alerts, Verbindungen) |
| `shutdown_system`   | Herunterfahren / Neustart / Sleep                   |
| `format_drive`      | USB-Stick/externe HDD formatieren (3-Zonen-Schutz)  |
| `rename_drive`      | Laufwerk umbenennen (Systemlaufwerke gesperrt)      |
| `list_devices`      | PnP-Geräte + Laufwerke auflisten                    |
| `list_processes`    | Laufende Prozesse (sortiert nach CPU/RAM)           |
| `kill_process`      | Prozess beenden (systemkritische gesperrt)          |
| `set_volume`        | Systemlautstärke setzen oder stumm schalten         |
| `list_autostart`    | Autostart-Programme (HKLM + HKCU Registry)          |

### Aufgaben & Produktivität

| Tool            | Funktion                                                |
| --------------- | ------------------------------------------------------- |
| `add_task`      | Aufgabe anlegen (Priorität low/normal/high, Fälligkeit) |
| `list_tasks`    | Offene oder erledigte Aufgaben anzeigen                 |
| `complete_task` | Aufgabe als erledigt markieren                          |
| `delete_task`   | Aufgabe abbrechen                                       |

### Netzwerk

| Tool               | Funktion                             |
| ------------------ | ------------------------------------ |
| `scan_network`     | LAN-Scan via ARP (passive Erkennung) |
| `list_connections` | TCP-Verbindungen + Prozessname       |

### Kommunikation

| Tool                        | Funktion                                         |
| --------------------------- | ------------------------------------------------ |
| `read_emails`               | Outlook-Mails lesen                              |
| `mark_email`                | Outlook-Mail markieren (gelesen/Spam/archiviert) |
| `read_calendar`             | Outlook-Termine lesen                            |
| `create_appointment`        | Outlook-Termin anlegen                           |
| `read_gmail`                | Gmail via OAuth 2.0 lesen                        |
| `mark_gmail`                | Gmail-Mail markieren                             |
| `read_google_calendar`      | Google Calendar lesen                            |
| `create_google_appointment` | Google Calendar Termin erstellen                 |
| `compose_email`             | Outlook-Entwurf öffnen (KI-korrigiert)           |

### Web & Suche

| Tool           | Funktion                                          |
| -------------- | ------------------------------------------------- |
| `search_web`   | Web-Suche via OpenAI Responses API                |
| `web_search`   | DDG-Suche (Fallback / Ollama-Modus)               |
| `fetch_url`    | URL abrufen und Inhalt extrahieren                |
| `get_weather`  | Aktuelles Wetter via Open-Meteo                   |
| `get_location` | Standort (Memory-first + IP-Geolocation Fallback) |
| `get_datetime` | Datum/Uhrzeit für Berechnungen                    |

### Gedächtnis & Konfiguration

| Tool             | Funktion                                   |
| ---------------- | ------------------------------------------ |
| `remember`       | Eintrag ins Langzeitgedächtnis speichern   |
| `forget`         | Gedächtniseintrag löschen                  |
| `list_memories`  | Alle Gedächtniseinträge anzeigen           |
| `create_setup`   | Neues App-Setup per Gespräch erstellen     |
| `update_setting` | Einstellung per Gespräch ändern            |
| `create_rule`    | Neue Erlaubnis-/Verbots-Regel anlegen      |
| `homework_mode`  | Hausaufgaben-Modus aktivieren/deaktivieren |
| `pause_ella`     | Wakeword pausieren (1–120 Minuten)         |

### Dateien & Dokumente

| Tool                  | Funktion                                                                |
| --------------------- | ----------------------------------------------------------------------- |
| `search_files`        | Dateien suchen (Windows Search Index, ms-schnell + Fallback)            |
| `open_file`           | Datei öffnen (optional: Word mit Cursor ans Ende)                       |
| `explore_folder`      | Ordner im Windows Explorer öffnen                                       |
| `create_document`     | Neues Word-Dokument oder Textdatei erstellen                            |
| `read_file_content`   | .docx/.pdf/.xlsx/.html lesen (mammoth / pdf-parse / SheetJS / Turndown) |
| `dictate_to_document` | Text in Word diktieren (KI-Korrektur automatisch)                       |
| `find_duplicates`     | Doppelte Dateien nach Größe+Name finden                                 |

### Zwischenablage & Erinnerungen

| Tool              | Funktion                                          |
| ----------------- | ------------------------------------------------- |
| `get_clipboard`   | Zwischenablage lesen (inkl. 20-Einträge-Historie) |
| `set_clipboard`   | Text in Zwischenablage kopieren                   |
| `set_reminder`    | Erinnerung via Windows Task Scheduler setzen      |
| `list_reminders`  | Alle ELLA-Erinnerungen anzeigen                   |
| `delete_reminder` | Erinnerung löschen                                |
| `set_alarm`       | Täglichen Wecker stellen (DB-basiert, HH:MM)      |
| `list_alarms`     | Alle aktiven Wecker anzeigen                      |
| `delete_alarm`    | Wecker löschen                                    |

### KI-gestützte Funktionen

| Tool              | Funktion                                          |
| ----------------- | ------------------------------------------------- |
| `play_music`      | Musikbibliothek durchsuchen und im Player öffnen  |
| `take_screenshot` | Screenshot machen + mit GPT-4o Vision analysieren |
| `write_for_me`    | Text im persönlichen Stil des Nutzers generieren  |

---

## Proaktive Intelligenz

ELLA handelt ohne Aufforderung — erscheint als Nachricht im Chat und wird vorgelesen:

| Trigger                           | Aktion                                                        |
| --------------------------------- | ------------------------------------------------------------- |
| 30 Min vor einem Kalendertermin   | Meeting-Vorbereitung + Dokument-Suche anbieten                |
| 18:00 Uhr                         | Tagesabschluss: Aktionen + Termine morgen + fällige Aufgaben  |
| 30 Min Inaktivität → Rückkehr     | Comeback-Briefing mit verpassten System-Alerts                |
| 90 Min aktive Arbeit              | Pause-Erinnerung                                              |
| Täglich 12 Uhr                    | Rhythmus-Analyse → Morgen-Setup vorschlagen                   |
| Sonntags 10 Uhr                   | Duplikat-Scan → Speicherplatz-Report bei > 500 MB             |
| Neuer Clipboard-Inhalt mit Muster | IBAN / Paketnummer / E-Mail / URL / Telefon erkannt → Angebot |

---

## Sicherheitsprinzipien

- **Whitelist-Prinzip:** Jede Tool-Ausführung braucht eine explizite allow-Regel
- **Default-Deny für destruktive Tools:** `clean_temp` und `empty_recycle_bin` müssen manuell freigeschaltet werden
- **Direktive:** Systemlaufwerke formatieren, ungelesene Mails löschen = hardcodiertes Verbot
- **Bestätigungs-Karte:** Formatieren und Prozess-Beenden erfordern explizite Nutzer-Bestätigung
- **Systemkritische Prozesse:** `svchost`, `lsass`, `csrss` etc. können nicht beendet werden
- **Keine Daten-Exfiltration:** Fenster-Kontext und Gesprächskompression sind Ollama-only (kein OpenAI)
- **Feedback nie im LLM-Kontext:** Daumen-Feedback landet in DB, nicht im System-Prompt (Prompt-Injection-Schutz)
- **Sensible Fenstertitel gefiltert:** Passwort-Manager, Banking-Apps werden nie als Kontext weitergegeben
- **Profil-PINs mit PBKDF2+Salt:** 100.000 Iterationen, timing-safe Compare — kein einfaches SHA-256
- **Kokoro TTS:** Bindet auf 127.0.0.1 — kein LAN-Exposure
- **OpenAI-Key:** Nur im Backend `.env`, wird als `***` ans Frontend geliefert
- **Google-Token:** Lokal in `google-token.json`, nie committed (`.gitignore`)

---

## Google Integration (OAuth 2.0)

1. [Google Cloud Console](https://console.cloud.google.com) → Projekt anlegen
2. APIs aktivieren: **Gmail API** + **Google Calendar API**
3. Credentials → OAuth 2.0 Client ID → Typ: **Desktop App**
4. Client ID + Secret in ELLA Settings → Tab **Google** eintragen
5. "Mit Google verbinden" → Browser-Autorisierung → automatische Rückkehr

Token wird lokal in `google-token.json` gespeichert, nie committed.

---

## Laufwerk-Operationen

Die Drei-Zonen-Logik verhindert irreversiblen Schaden:

| Zone | Laufwerk-Typ                           | Reaktion                                  |
| ---- | -------------------------------------- | ----------------------------------------- |
| 1    | C:, `protectedDrives`, ELLA-Laufwerk   | **Permanent blockiert** (directive: true) |
| 2    | Interne Festplatten (DriveType ≠ 2)    | **Blockiert** (directive: true)           |
| 3    | USB-Stick, externe HDD (DriveType = 2) | **Confirmation Card** → Nutzer bestätigt  |

Geschützte Laufwerke sind in `settings.protectedDrives` konfigurierbar. C: ist hardcoded.

---

## Tests & Lint

```powershell
npm test            # 132 Unit + Integration Tests (Vitest)
npm run test:e2e    # Playwright E2E (Web + Desktop)
npm run lint
```

---

## Dokumentation

| Dokument                                                   | Inhalt                                             |
| ---------------------------------------------------------- | -------------------------------------------------- |
| [docs/bedienungsanleitung.md](docs/bedienungsanleitung.md) | Vollständige Nutzerdokumentation (Deutsch)         |
| [CHANGELOG.md](CHANGELOG.md)                               | Alle Versionen auf einen Blick                     |
| [docs/history.md](docs/history.md)                         | Entwicklungshistorie mit Entscheidungsbegründungen |
| [docs/architecture.md](docs/architecture.md)               | Systemübersicht, Chat-Flow, Ports, Stack           |
| [docs/database.md](docs/database.md)                       | MariaDB-Schema, Tabellenbeschreibungen             |
| [docs/roadmap.md](docs/roadmap.md)                         | Abgeschlossene und geplante Features               |
| [docs/hardware.md](docs/hardware.md)                       | Hardware-Spezifikation und GPU-Setup               |

---

## Lizenz

Proprietär. Alle Rechte vorbehalten. Quellcode-Einsicht auf GitHub zu Demonstrationszwecken.
