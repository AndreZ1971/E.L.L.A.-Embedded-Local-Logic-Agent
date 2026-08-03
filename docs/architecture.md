# Architektur — v1.0.0

---

## Systemübersicht

```text
┌──────────────────────────────────────────────────────────────────┐
│  Electron (apps/desktop)                                         │
│                                                                  │
│  main.ts                                                         │
│    ├─ spawnt API als Child-Prozess (node resources/api/dist/...) │
│    ├─ wartet via net.connect(:3002) bis API bereit               │
│    ├─ lädt resources/web/dist/index.html via loadFile()          │
│    ├─ Mikrofon-Berechtigung via setPermissionRequestHandler      │
│    └─ Tray-Icon: Minimize-to-Tray, Autostart-Toggle, Beenden    │
│                                                                  │
│  React Frontend (HashRouter, file:// Protokoll)                  │
│    Boot-Flow: EULA → Setup-Check → Onboarding → App             │
│    HTTP → http://localhost:3002 (absolut, kein Proxy)            │
└─────────────────────────────┬────────────────────────────────────┘
                              │ HTTP / SSE
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  apps/api  (Express, Port 3002)                                  │
│                                                                  │
│  ┌─────────────────────┐   ┌────────────────────────────────┐   │
│  │  /api/chat/stream   │   │  Provider-Auswahl              │   │
│  │  POST               │──►│  setting: auto / openai /      │   │
│  │  SSE-Streaming      │   │  ollama                        │   │
│  │  Tool-Loop ≤5 Rdn.  │   │  auto → OpenAI wenn Key gesetzt│   │
│  └─────────────────────┘   └───────────────┬────────────────┘   │
│                                            │                    │
│                             ┌──────────────┴──────────────┐     │
│                             │                             │     │
│                    ┌────────▼───────┐          ┌──────────▼──┐  │
│                    │  OpenAI GPT-4o │          │  Ollama     │  │
│                    │  (extern)      │          │  :11434     │  │
│                    └────────────────┘          └─────────────┘  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Tool-Loop (85 aktive Tools)                            │    │
│  │   1. recall(message)         — Gedächtnis laden         │    │
│  │   2. LLM-Stream              — mit Memories + Tools     │    │
│  │   3. DirectiveLayer.check()  — harm/surveil/etc.        │    │
│  │   4. evaluateRules(toolName) — Rule-Engine-Check        │    │
│  │   5. handler(args)           — Tool ausführen           │    │
│  │   6. extractAndRemember()    — fire-and-forget          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────┐   ┌────────────────────────────────┐   │
│  │  Background-Worker  │   │  MariaDB Pool (Port 3306)      │   │
│  │  alle 60s: Disk,    │──►│  sessions + session_messages   │   │
│  │  RAM, Ollama-Ping,  │   │  memories (Vektor-Embeddings)  │   │
│  │  PnP, ARP, TCP,     │   │  rules + tool_executions       │   │
│  │  Firewall, WiFi,DNS │   │  profiles + tasks              │   │
│  │  EventBus-Push      │   │  user_feedback + directive_audit│  │
│  └─────────────────────┘   └────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────┐   ┌─────────────────────────────────────┐  │
│  │  Clipboard-Polling  │   │  Python-Prozesse                    │  │
│  │  alle 3s: History,  │   │  wakeword_server.py :mic            │  │
│  │  Muster-Erkennung   │   │  tts_server.py :3003 (Kokoro TTS)   │  │
│  │  IBAN/URL/IBAN/...  │   │  stress_server.py :3004 (Analyse)   │  │
│  └─────────────────────┘   │  127.0.0.1-only, offline            │  │
│                             └─────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Boot-Flow (Frontend)

```text
App.tsx Mount
  └─ GET /api/settings → { eulaAccepted, onboardingComplete }

  eulaAccepted = false?
    └─ Fullscreen: /eula  →  Nutzer akzeptiert
       └─ PUT /api/settings { eulaAccepted: true }
          └─ navigate("/setup")

  /setup: Dependency-Check
    └─ GET /api/setup/status → { ollama, nomic, mariadb, allOk }
       ├─ nomic fehlt + ollama OK → SSE-Pull (POST /api/setup/pull-nomic)
       └─ Weiter-Button → GET /api/onboarding/status

  onboardingComplete = false?
    └─ Fullscreen: /onboarding  →  System-Scan, Name eingeben
       └─ POST /api/onboarding/complete
          └─ navigate("/chat")

  Normaler App-Modus: Sidebar + Chat / Dashboard / Settings
```

---

## Chat-Flow — Detail

```text
POST /api/chat/stream  { sessionId, message }
  │
  ├─ await sessionStore.get(sessionId)        — Session aus MariaDB
  ├─ messages.push({ role: "user", ... })
  ├─ await recall(message)                    — Top-5 Memories via Cosinus-Suche
  │
  └─ Tool-Loop (max. 5 Runden)
       │
       ├─ LLM-Stream (Ollama / OpenAI)
       │    Chunks  → SSE { type:"chunk", text }
       │    Done    → tool_calls? Nein → fertig
       │
       ├─ für jeden tool_call:
       │    ├─ SSE { type:"tool", name }
       │    ├─ evaluateRules(name)
       │    │    DIRECTIVE_DENY → Error (hardcodiert)
       │    │    deny-Regel     → Error
       │    │    allow-Regel    → ausführen
       │    │    no_match       → Error (Default-Deny)
       │    └─ handler(args) → ToolResult
       │
       └─ Nächste Runde mit Tool-Ergebnissen im Context
  │
  ├─ SSE { type:"done" }
  ├─ sessionStore.set(sessionId, messages)    — Nur user+assistant, max. 40
  └─ extractAndRemember()                     — fire-and-forget, async
```

---

## Rule-Engine

```text
evaluateRules(toolName)
  │
  1. DIRECTIVE_DENY (hardcoded Set in executor.ts)
  │    — niemals in DB, niemals konfigurierbar
  │    — aktuell: ungelesene Mails löschen (enforced via mail.ts)
  │
  2. DB-Abfrage: SELECT … WHERE enabled=1 ORDER BY FIELD(action,'deny','allow')
  │    — Deny-Regeln gewinnen immer (SQL-Reihenfolge)
  │    — Trigger-Auswertung: 'always', 'hour > N', 'disk_c > N'
  │
  3. Erste match: return 'deny' | 'allow'
  │
  4. Kein Match: return 'no_match' → Error im Executor

Default-Regeln (INSERT IGNORE, IDs 1–16):
  Sicher:   open_app, get_disk_usage, remember, forget, list_memories,
            homework_mode, load_setup, get_system_info, create_setup,
            update_setting, create_rule, free_ram,
            read_emails, mark_email, read_calendar, create_appointment
  Gesperrt: clean_temp, empty_recycle_bin  (explizit freischalten)
```

---

## Gedächtnis-System

```text
remember(type, content)
  └─ POST /api/embed (Ollama, nomic-embed-text)
     → 768-dimensionaler Vektor
     └─ INSERT INTO memories (type, content, embedding)

recall(query)
  └─ embed(query) → Vektor
     └─ SELECT last 500 FROM memories
        └─ Cosinus-Ähnlichkeit (in-process, 10 Zeilen TS)
           └─ filter ≥ 0.3, Top-5 zurück

Typen:
  user   — Fakten über den Nutzer (automatisch + explizit)
  system — App/Tool-Nutzungsverhalten (nach open_app, load_setup)
  note   — Explizite Notizen ("Merk dir…")
```

---

## API-Endpunkte

| Route                           | Methode      | Funktion                               |
| ------------------------------- | ------------ | -------------------------------------- |
| `/api/chat/stream`              | POST         | SSE-Streaming, Tool-Loop               |
| `/api/chat`                     | POST         | Sync-Chat (non-streaming)              |
| `/api/chat/provider`            | GET          | Aktiver Provider + Modell              |
| `/api/chat/history/:id`         | GET / DELETE | Session laden / löschen                |
| `/api/settings`                 | GET / PUT    | Einstellungen lesen / schreiben        |
| `/api/settings/models`          | GET          | Verfügbare Ollama-Modelle              |
| `/api/settings/emergency-reset` | POST         | KI-Einstellungen zurücksetzen          |
| `/api/rules`                    | GET / POST   | Regeln auflisten / anlegen             |
| `/api/rules/:id`                | PUT / DELETE | Regel bearbeiten / löschen             |
| `/api/rules/:id/toggle`         | PATCH        | Regel aktivieren / deaktivieren        |
| `/api/tools`                    | GET          | Aktivierte Tools (aus Settings)        |
| `/api/tools/execute`            | POST         | Tool direkt ausführen                  |
| `/api/confirm`                  | POST         | Bestätigung für `_confirmed`-Tools     |
| `/api/system/status`            | GET          | Ollama + MariaDB Erreichbarkeit        |
| `/api/system/disk`              | GET          | Disk-Usage C:, E:, Z:                  |
| `/api/system/programs`          | GET          | Installierte Programme (Start-Menü)    |
| `/api/events/stream`            | GET          | SSE-Push vom Background-Worker         |
| `/api/events/recent`            | GET          | Letzte 50 System-Events                |
| `/api/homework/status`          | GET          | Hausaufgaben-Modus Status              |
| `/api/homework/activate`        | POST         | Modus aktivieren (kein PIN)            |
| `/api/homework/deactivate`      | POST         | Modus deaktivieren (PIN)               |
| `/api/homework/config`          | PUT          | PIN + App-Liste konfigurieren          |
| `/api/onboarding/status`        | GET          | Onboarding-Status + Computername       |
| `/api/onboarding/scan`          | POST         | Hardware-Scan starten                  |
| `/api/onboarding/complete`      | POST         | Onboarding abschließen                 |
| `/api/setup/status`             | GET          | Dependency-Check (Ollama, nomic, DB)   |
| `/api/setup/pull-nomic`         | POST         | nomic-embed-text via SSE herunterladen |
| `/api/profiles`                 | GET / POST   | Nutzerprofile auflisten / anlegen      |
| `/api/profiles/:id`             | PUT / DELETE | Profil bearbeiten / löschen            |
| `/api/profiles/:id/activate`    | POST         | Profil aktivieren (PIN falls gesetzt)  |
| `/api/feedback`                 | POST         | Daumen hoch/runter speichern           |
| `/api/google/auth`              | GET          | Google OAuth 2.0 starten               |
| `/api/google/callback`          | GET          | OAuth Callback (Token speichern)       |

---

## Ports

| Service             | Port  | Hinweis                                  |
| ------------------- | ----- | ---------------------------------------- |
| Frontend (Vite Dev) | 5173  | Nur Dev-Modus — Production via `file://` |
| Backend (Express)   | 3002  | Port 3001 von Docker Desktop belegt      |
| Kokoro TTS-Server   | 3003  | Python, 127.0.0.1-only, lokal, offline   |
| MariaDB             | 3306  | Windows-Dienst, E:\MariaDB\data          |
| Ollama              | 11434 | Standard-Port, läuft als Tray-App        |

---

## Stack

| Schicht           | Technologie          | Version | Warum                                                          |
| ----------------- | -------------------- | ------- | -------------------------------------------------------------- |
| Frontend          | React                | 18      | Stable, breites Ökosystem                                      |
| Frontend Build    | Vite                 | 5       | Schnell, HMR < 50 ms                                           |
| Frontend Routing  | React Router         | 6       | HashRouter für `file://`-Kompatibilität                        |
| Desktop-Shell     | Electron             | 33      | Natives Fenster, Tray, Autostart, Child-Proc                   |
| Desktop Build     | esbuild              | —       | Externalisiert `electron` korrekt (electron-vite tut es nicht) |
| Desktop Installer | electron-builder     | 24      | NSIS für Windows x64                                           |
| Backend           | Node.js + Express    | 20 / 4  | Minimal, explizit, async-first                                 |
| Sprache           | TypeScript           | 5       | Typsicherheit über alle Schichten, strict mode                 |
| Datenbank         | MariaDB              | 12.2.2  | Drop-in für MySQL, Open Source, auf E:                         |
| LLM lokal         | Ollama + llama3.1:8b | —       | Kostenlos, offline, GPU-fähig                                  |
| Embeddings        | nomic-embed-text     | —       | 768-dim, via Ollama, lokal                                     |
| LLM cloud         | OpenAI GPT-4o        | —       | Optional, beste Qualität                                       |

---

## Projektstruktur

```text
z:\repos\E.L.L.A\
│
├─ apps/
│  ├─ api/                          — Express Backend (@ella/api)
│  │  └─ src/
│  │     ├─ config/
│  │     │  ├─ env.ts               — Umgebungsvariablen (einzige Quelle)
│  │     │  ├─ database.ts          — MariaDB Connection-Pool
│  │     │  └─ migrate.ts           — Schema + Seed-Regeln beim Start
│  │     ├─ middleware/
│  │     │  └─ errorHandler.ts      — Zentraler Fehler-Handler
│  │     ├─ routes/
│  │     │  ├─ chat.ts              — Chat + Tool-Loop
│  │     │  ├─ confirm.ts           — Generische Bestätigung (_confirmed-Tools)
│  │     │  ├─ events.ts            — SSE-Push + recent Events
│  │     │  ├─ feedback.ts          — POST /api/feedback (Daumen hoch/runter)
│  │     │  ├─ google.ts            — OAuth 2.0 Callback
│  │     │  ├─ homework.ts          — Hausaufgaben-Modus REST
│  │     │  ├─ onboarding.ts        — Onboarding-Flow REST
│  │     │  ├─ profiles.ts          — Nutzerprofile CRUD + Aktivierung
│  │     │  ├─ rules.ts             — Rule-Engine CRUD
│  │     │  ├─ settings.ts          — Settings CRUD + Emergency-Reset
│  │     │  ├─ setup.ts             — Dependency-Check + nomic-Pull-SSE
│  │     │  ├─ system.ts            — Status + Disk + Programme
│  │     │  └─ tools.ts             — Tool-Listing + direktes Execute
│  │     ├─ services/
│  │     │  ├─ calendar.ts          — Outlook-Kalender via COM
│  │     │  ├─ clipboardHistory.ts  — Polling (3s), History, Muster-Erkennung
│  │     │  ├─ duplicateFinder.ts   — Hash-basierte Duplikat-Suche
│  │     │  ├─ eventBus.ts          — Singleton EventEmitter (Worker→SSE)
│  │     │  ├─ fileManager.ts       — readFileContent, renameFile, copyFile, createFolder
│  │     │  ├─ fileOps.ts           — deleteToRecycleBin (VisualBasic COM)
│  │     │  ├─ google.ts            — Gmail + Google Calendar OAuth
│  │     │  ├─ homework.ts          — Aktivieren/Deaktivieren, SHA-256-PIN
│  │     │  ├─ mail.ts              — Outlook COM + Thunderbird mbox
│  │     │  ├─ mediaControl.ts      — VK_MEDIA_* Tasten + WinRT NowPlaying
│  │     │  ├─ memory.ts            — Embeddings, recall(), extractAndRemember()
│  │     │  ├─ mouseControl.ts      — SetCursorPos, mouse_event (P/Invoke)
│  │     │  ├─ music.ts             — Bibliothekssuche + Player-Start
│  │     │  ├─ ocr.ts               — Windows.Media.Ocr WinRT (offline)
│  │     │  ├─ ollama.ts            — OllamaClient (chat, stream, embed)
│  │     │  ├─ openai.ts            — OpenAIClient (chat, stream)
│  │     │  ├─ processes.ts         — listProcesses, killProcess
│  │     │  ├─ profiles.ts          — PBKDF2+Salt, Profil-Isolation
│  │     │  ├─ reminder.ts          — Windows Task Scheduler
│  │     │  ├─ rules.ts             — evaluateRules(), CRUD-Helpers
│  │     │  ├─ serviceManager.ts    — listServicesPs, controlService
│  │     │  ├─ sessionCompressor.ts — Ollama-only Gesprächskompression
│  │     │  ├─ sessions.ts          — MariaDB-backed Session-Store
│  │     │  ├─ settings.ts          — settings.json lesen/schreiben
│  │     │  ├─ shellRunner.ts       — runSafeCommand (60+ gesperrte Muster)
│  │     │  ├─ styleProfile.ts      — E-Mail-Stil-Profil + writeInUserStyle
│  │     │  ├─ systemComfort.ts     — Dark Mode, Akku, Temp, EventLog, WiFi
│  │     │  ├─ systemScan.ts        — Get-CimInstance: CPU/GPU/RAM/Name
│  │     │  ├─ tasks.ts             — addTask, listTasks, completeTask, deleteTask
│  │     │  ├─ textCorrection.ts    — KI-Korrektur (Ollama/OpenAI)
│  │     │  ├─ textProcessing.ts    — translateText, summarizeText
│  │     │  ├─ vision.ts            — Screenshot + GPT-4o Vision-Analyse
│  │     │  ├─ windowContext.ts     — GetForegroundWindow, opt-in, gefiltert
│  │     │  ├─ windowManager.ts     — launchApp, controlWindow, sendKeys
│  │     │  └─ worker.ts            — Background-Worker (60s: Disk/RAM/PnP/ARP/TCP)
│  │     └─ tools/
│  │        ├─ definitions.ts       — Tool-Schemas für LLM (85 aktive Tools)
│  │        ├─ executor.ts          — Directive + Rule-Check + Dispatch
│  │        └─ registry.ts          — Legacy (listEnabled via settings)
│  │
│  ├─ desktop/                      — Electron Desktop-App (@ella/desktop)
│  │  ├─ src/
│  │  │  ├─ main.ts                 — BrowserWindow, Tray, Child-Proc, IPC
│  │  │  └─ preload.ts              — IPC-Bridge
│  │  ├─ build-main.mjs             — esbuild-Script
│  │  └─ package.json               — electron-builder NSIS-Config
│  │
│  ├─ landing/                      — Statische Landingpage
│  │  └─ index.html                 — HTML/CSS, Lemon-Squeezy-Checkout
│  │
│  └─ web/                          — React Frontend (@ella/web)
│     └─ src/
│        ├─ components/
│        │  └─ TitleBar.tsx         — Frameless Window Titelleiste (IPC)
│        ├─ pages/
│        │  ├─ chat/                — Chat-Interface, SSE-Streaming, TTS
│        │  ├─ dashboard/           — Live-Feed, Disk-Balken, SSE-Alerts
│        │  ├─ eula/                — EULA-Gate (Vollbild)
│        │  ├─ onboarding/          — System-Scan, Name, 3 Schritte
│        │  ├─ settings/            — 5 Tabs: LLM/Tools/Setups/Programme/Modus
│        │  └─ setup/               — Dependency-Check, nomic-Pull-SSE
│        └─ App.tsx                 — Boot-Flow, EULA/Onboarding-Routing
│
├─ packages/
│  ├─ shared/                       — Gemeinsame Typen (@ella/shared)
│  │  └─ src/types/tool.ts          — ToolName (85+), ToolCall, ToolResult
│  └─ agent-tools/                  — Windows-System-Tools (@ella/agent-tools)
│     └─ src/                       — open-app, get-disk-usage, clean-temp, empty-recycle-bin
│
├─ database/
│  └─ schema.sql                    — Idempotentes Schema (IF NOT EXISTS, INSERT IGNORE)
│
├─ docs/                            — Technische Dokumentation
├─ apps/landing/index.html          — Statische Landingpage
├─ CHANGELOG.md                     — Alle Versionen auf einen Blick
└─ README.md                        — Voraussetzungen, Schnellstart, Architektur
```

---

## Sicherheitsprinzip

E.L.L.A. trennt **Verstehen** (LLM) von **Ausführen** (Backend) mit zwei unabhängigen Gates:

```text
LLM (Ollama / OpenAI)
  │
  │  Erzeugt strukturierten Tool-Call { name, args }
  ▼
toolExecutor.execute(name, args)
  │
  ├─ 1. Settings-Check: getSettings().enabledTools.includes(name)?
  │       Nein → Error, nichts wird ausgeführt
  │
  ├─ 2. Rule-Engine: evaluateRules(name)
  │       deny         → Error
  │       no_match     → Error (Default-Deny)
  │       allow        → weiter
  │
  └─ 3. Handler(args)
          — kein freier Shell-Zugriff
          — kein eval(), kein exec() mit User-Input
          — PowerShell via Base64-EncodedCommand (keine Sonderzeichen-Probleme)
```

**Direktive:** Ungelesene Mails löschen ist zweifach gesperrt — PS-Script prüft `$item.UnRead` vor `delete`, Executor prüft `result.directive`. Keine Regel kann das überschreiben.

**API-Keys:** Ausschließlich im Backend (`.env`). Frontend sieht `***`, macht keine direkten LLM-Calls.

**PIN:** SHA-256-Hash in `settings.json`, nie im Klartext übertragen.

**DB-Nutzer:** `ella` hat nur `ALL PRIVILEGES ON ella.*` — kein Zugriff auf andere DBs, kein `SUPER`.
