# E.L.L.A. — Embedded Local Logic Agent

![Tests](https://github.com/AndreZ1971/E.L.L.A/actions/workflows/test.yml/badge.svg)

Lokaler KI-Assistent für Windows als native Desktop-App. LLM-gesteuerte Automatisierung — vollständig offline via Ollama, optional mit OpenAI GPT-4o.

**Version:** v3.7.0 · Windows 10/11 (x64)

_ELLA passt sich dem Nutzer an und wächst mit ihren Herausforderungen._

---

## Installation (Zero-Config Installer)

**Voraussetzungen: keine.** Der Installer bringt alles mit.

1. `E.L.L.A Setup 1.0.0-rc.exe` ausführen
2. Installationspfad wählen (Standard: `C:\Programme\E.L.L.A`)
3. Beim ersten Start: **Sprachauswahl** (DE/EN) → EULA → Lizenzaktivierung → **Modell-Auswahl** → Onboarding → Chat

Der Installer enthält als portable Vendored Binaries:

- **MariaDB 11.4** (initialisiert sich automatisch in `%APPDATA%\ELLA\mariadb-data`)
- **Ollama** (startet automatisch; Modell wird erst nach Nutzer-Auswahl beim ersten Start geladen)
- **Node.js 22** (API-Runtime)

Kein Python, kein separates MariaDB-Setup, keine PATH-Konfiguration.

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
| Spracheingabe        | Web Speech API (Chromium built-in, kein API-Key) · Freihand · Manuell · Wakeword   |
| Sprachausgabe        | Microsoft Edge TTS via msedge-tts (kein API-Key, kostenlos)                        |
| Pause                | Wakeword 1–120 Minuten deaktivieren, Countdown, automatische Rückkehr              |
| Web                  | Sofortige Suche ohne Rückfrage (Filme, Personen, Produkte, News)                   |
| Wetter               | Aktuelles Wetter via Open-Meteo                                                    |
| Hausaufgaben-Modus   | PIN-gesicherter Kiosk mit App-Whitelist                                            |
| Regel-Engine         | 57 Default-Regeln, allow/deny, Zeitbedingungen, Directive-Layer                    |
| Monitoring           | Background-Worker, SSE-Push, Disk/Ollama/RAM-Alerts, PnP-Events                    |
| USB-Erkennung        | USB-Laufwerke werden erkannt und angesagt (proaktive Nachricht + TTS)              |
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
| Screenshot + Vision  | Bildschirm fotografieren und mit GPT-4o Vision analysieren (OpenAI-Key nötig)      |
| Schreibstil          | Texte im persönlichen Stil generieren — lernt aus bisherigen E-Mails               |
| Duplikate            | Doppelte Dateien finden, Speicherplatz-Verschwendung berechnen                     |
| Autostart            | Programme beim Windows-Start auflisten                                             |
| Aufgabenliste        | Persistente TODOs mit Priorität und Fälligkeit, im Tagesabschluss integriert       |
| Proaktiv             | Meeting-Vorbereitung, Tagesabschluss, Comeback, Pause-Reminder, Clipboard-Muster   |
| Feedback-Loop        | Daumen hoch/runter → Ollama extrahiert Nutzerpräferenzen → Langzeitgedächtnis      |
| Fenster-Kontext      | ELLA kennt die aktive Anwendung beim Chat (opt-in, Ollama-only)                    |
| Gesprächskompression | Lange Sessions automatisch komprimieren (lokales Ollama)                           |
| Nutzerprofile        | Eigenes Gedächtnis und Gesprächsverlauf pro Profil, PBKDF2-gesicherter PIN-Wechsel |

### Die E.L.L.A. Direktive — vier unveränderliche Verbote

Architektonisch verankert, nicht konfigurierbar:

1. **harm** — kein physischer, finanzieller, psychologischer oder datenbezogener Schaden
2. **conceal** — keine Verschleierung von Aktionen, Fähigkeiten oder Systemzuständen
3. **surveil** — keine Überwachung ohne ausdrückliches Wissen und aktive Zustimmung
4. **exfiltrate** — keine Datenweitergabe an Dritte ohne ausdrückliche Zustimmung

Hierarchie: `Directive Layer → DIRECTIVE_DENY → Deny Rules → Allow Rules → Tool Execution`

---

## Sprache (ohne OpenAI-Key)

### Spracheingabe — Web Speech API

ELLA nutzt `window.SpeechRecognition` (Chromium built-in) direkt im Renderer:

- Kein API-Key erforderlich
- Verbindet sich mit Microsoft/Google-Spracherkennungsdienst (Internet erforderlich)
- Sprache: `de-DE`
- **Freihand-Modus** (`voiceMode: "always"`): kontinuierliches Zuhören, automatischer Neustart
- **Manuell**: Mikrofon-Button → einmalige Aufnahme → Text ins Eingabefeld

### Sprachausgabe — Microsoft Edge TTS

ELLA nutzt `msedge-tts` (Microsoft Edge Neural TTS):

- Kein API-Key erforderlich
- Kostenloser Microsoft-Dienst über WebSocket (`wss://speech.platform.bing.com`)
- Standard-Stimme: `de-DE-KatjaNeural`
- Internet erforderlich
- Aktiviert per Default (`ttsEnabled: true`)

### Optional: OpenAI Whisper (höhere Qualität)

Mit OpenAI-Key in Settings kann Whisper API als primäre STT-Engine genutzt werden (deutlich bessere Genauigkeit, ~0,006 $/min).

---

## Voraussetzungen (Installer)

Keine. Der Installer ist vollständig selbstenthaltend.

| Was              | Wie bereitgestellt                      |
| ---------------- | --------------------------------------- |
| MariaDB 11.4     | Portable in `resources/mariadb/`        |
| Ollama           | Portable in `resources/ollama/`         |
| Node.js 22       | Portable in `resources/node/`           |
| API              | `bundle.cjs` (42 MB, alle Deps inlined) |
| Datenbank-Schema | Auto-Migration beim ersten Start        |

---

## Voraussetzungen (Entwicklungsmodus)

| Voraussetzung               | Version   | Bezug       |
| --------------------------- | --------- | ----------- |
| Windows                     | 10/11 x64 | —           |
| Node.js                     | 22+       | nodejs.org  |
| [Ollama](https://ollama.ai) | aktuell   | ollama.ai   |
| MariaDB                     | 11.x      | mariadb.org |

Einmalig nach Ollama-Installation:

```powershell
ollama pull llama3.1:8b        # Chat-Modell (~4.7 GB)
ollama pull nomic-embed-text   # Gedächtnis-Modell (~274 MB)
```

---

## Entwicklungsmodus

### Schnellstart nach Clone

```powershell
npm install
cd apps/api && npm run build && cd ../..
cd apps/web && npm run build && cd ../..
cd apps/desktop && node build-main.mjs
$env:ELLA_DEV = "1"
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
net start MariaDB   # oder: sc start MariaDB
```

### Parallel-Dev (API + Vite)

```powershell
npm run dev --workspace=apps/api   # API :3002
npm run dev --workspace=apps/web   # Web :5173
```

### Build für Installer

```powershell
npm run build --workspace=apps/api
npm run build --workspace=apps/web
cd apps/desktop && npm run dist
# → dist-installer/E.L.L.A Setup 1.0.0-rc.exe
```

---

## Projektstruktur

```text
apps/
  api/        Express-Server (Port 3002) — bundle.cjs (esbuild, 42 MB)
  web/        React 18 + Vite (Port 5173)
  desktop/    Electron 33 + electron-builder (NSIS-Installer)
database/
  schema.sql  MariaDB-Schema (idempotent, IF NOT EXISTS)
vendor/
  mariadb/    Portable MariaDB 11.4 (wird in Installer gepackt)
  ollama/     Portable Ollama (wird in Installer gepackt)
  node/       Portable Node.js 22 (wird in Installer gepackt)
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
Electron (Main) — apps/desktop/src/main.ts
  ├─ spawnt portable MariaDB (mysqld.exe aus vendor/mariadb)
  │    └─ mysql_install_db.exe bei Erststart (kein Admin nötig)
  │    └─ Daten in %APPDATA%\ELLA\mariadb-data
  ├─ spawnt portable Ollama (ollama.exe aus vendor/ollama)
  ├─ spawnt API via portable Node.js (bundle.cjs)
  │    └─ ELLA_RESOURCES=process.resourcesPath
  │    └─ ELLA_USERDATA=app.getPath("userData")
  └─ lädt Web-Build via file:// (HashRouter)

API (Express :3002) — apps/api/dist/bundle.cjs
  ├─ /api/chat            — Sync + /stream SSE (Tool-Loop max. 5 Runden)
  ├─ /api/settings        — Settings CRUD (settings.json in %APPDATA%\ELLA)
  ├─ /api/rules           — Rule-Engine CRUD (MariaDB)
  ├─ /api/events/stream   — SSE-Push vom Background-Worker
  ├─ /api/system          — Programme, Scan, Diagnose
  ├─ /api/speech          — TTS (msedge-tts), STT (/transcribe mit OpenAI-Fallback)
  ├─ /api/license         — Lizenzaktivierung
  ├─ /api/onboarding      — 6-Schritt-Onboarding-Flow
  ├─ /api/profiles        — Nutzerprofile CRUD + Aktivierung
  └─ /api/google          — OAuth 2.0 Flow (Gmail + Calendar)

LLM-Provider (auto-detect)
  ├─ Ollama  (lokal, Port 11434, llama3.1:8b) — primär
  └─ OpenAI  (GPT-4o, wenn API-Key gesetzt — Vision, Schreibstil)

Spracheingabe (Frontend — Renderer)
  └─ window.SpeechRecognition (Chromium built-in)
       ├─ Freihand: continuous=true, auto-restart, de-DE
       └─ Manuell: continuous=false, Ergebnis → Eingabefeld

Sprachausgabe (API → msedge-tts)
  └─ Microsoft Edge Neural TTS (wss://speech.platform.bing.com)
       └─ Standard-Stimme: de-DE-KatjaNeural, kein API-Key

Background Worker (60s Interval)
  ├─ Disk/RAM/Ollama-Monitoring → SSE-Alerts
  ├─ PnP Delta-Detection (Webcam, USB, externe Laufwerke) + TTS-Ansage
  ├─ ARP-LAN-Scan, TCP-Verbindungen, Firewall/WiFi/DNS-Monitoring
  ├─ Clipboard-Polling (3s, deaktiviert sich nach 3 Fehlern) → History + Muster-Erkennung
  │    (IBAN, Paketnummer, Telefon, URL, E-Mail → proaktive Nachricht)
  ├─ Meeting-Prep (5 Min), Tagesabschluss (18 Uhr), Comeback (30 Min)
  └─ Pause-Reminder (90 Min), Rhythmus-Analyse (12 Uhr), Duplikat-Scan (So 10 Uhr)

MariaDB (Port 3306) — %APPDATA%\ELLA\mariadb-data
  ├─ sessions / session_messages  — Gesprächsverlauf (profile_id-isoliert)
  ├─ memories                     — Vektor-Embeddings (profile_id-isoliert)
  ├─ rules                        — 57 Default-Regeln (allow/deny)
  ├─ profiles                     — Nutzerprofile (PBKDF2+Salt PIN-Hash)
  ├─ tasks                        — Persistente Aufgabenliste
  ├─ alarms                       — DB-basierte Wecker
  ├─ user_feedback                — Daumen-Feedback
  └─ system_events                — Alert-Historie
```

---

## Sicherheitsprinzipien

- **Whitelist-Prinzip:** Jede Tool-Ausführung braucht eine explizite allow-Regel
- **Default-Deny für destruktive Tools:** `clean_temp` und `empty_recycle_bin` müssen manuell freigeschaltet werden
- **Direktive:** Systemlaufwerke formatieren, ungelesene Mails löschen = hardcodiertes Verbot
- **Bestätigungs-Karte:** Formatieren und Prozess-Beenden erfordern explizite Nutzer-Bestätigung
- **Systemkritische Prozesse:** `svchost`, `lsass`, `csrss` etc. können nicht beendet werden
- **Keine Daten-Exfiltration:** Fenster-Kontext und Gesprächskompression sind Ollama-only
- **OpenAI-Key:** Nur im Backend `.env` / `settings.json`, wird als `***` ans Frontend geliefert
- **Google-Token:** Lokal in `google-token.json`, nie committed (`.gitignore`)
- **MariaDB lokal:** Bindet auf `127.0.0.1`, kein LAN-Exposure
- **Profil-PINs:** PBKDF2+Salt, 100.000 Iterationen, timing-safe Compare

---

## Laufwerk-Operationen

| Zone | Laufwerk-Typ                                     | Reaktion                                  |
| ---- | ------------------------------------------------ | ----------------------------------------- |
| 1    | C:, `protectedDrives`, ELLA-Laufwerk             | **Permanent blockiert** (directive: true) |
| 2    | Netzwerk- und CD/DVD-Laufwerke, unbekannte Typen | **Blockiert** (directive: true)           |
| 3    | Alle anderen (auch interne HDDs)                 | **Confirmation Card** → Nutzer bestätigt  |

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
