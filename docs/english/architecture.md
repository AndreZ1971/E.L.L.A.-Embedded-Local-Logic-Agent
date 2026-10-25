# Architecture — v1.5.6

---

## System Overview

```text
┌──────────────────────────────────────────────────────────────────┐
│  Electron (apps/desktop)                                         │
│                                                                  │
│  main.ts                                                         │
│    ├─ spawns API as child process (node resources/api/dist/...) │
│    ├─ waits via net.connect(:3002) until API is ready            │
│    ├─ loads resources/web/dist/index.html via loadFile()         │
│    ├─ microphone permission via setPermissionRequestHandler      │
│    └─ Tray icon: minimize-to-tray, autostart toggle, quit       │
│                                                                  │
│  React Frontend (HashRouter, file:// protocol)                   │
│    Boot flow: EULA → Setup check → Onboarding → App             │
│    HTTP → http://localhost:3002 (absolute, no proxy)             │
└─────────────────────────────┬────────────────────────────────────┘
                              │ HTTP / SSE
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  apps/api  (Express, Port 3002)                                  │
│                                                                  │
│  ┌─────────────────────┐   ┌────────────────────────────────┐   │
│  │  /api/chat/stream   │   │  Provider selection            │   │
│  │  POST               │──►│  setting: auto / openai /      │   │
│  │  SSE streaming      │   │  ollama                        │   │
│  │  Tool loop ≤5 rds.  │   │  auto → OpenAI if key is set  │   │
│  └─────────────────────┘   └───────────────┬────────────────┘   │
│                                            │                    │
│                             ┌──────────────┴──────────────┐     │
│                             │                             │     │
│                    ┌────────▼───────┐          ┌──────────▼──┐  │
│                    │  OpenAI GPT-4o │          │  Ollama     │  │
│                    │  (external)    │          │  :11434     │  │
│                    └────────────────┘          └─────────────┘  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Tool loop (111 active tools)                           │    │
│  │   1. recall(message)         — load memories            │    │
│  │   2. LLM stream              — with memories + tools    │    │
│  │   3. DirectiveLayer.check()  — harm/surveil/etc.        │    │
│  │   4. evaluateRules(toolName) — rule engine check        │    │
│  │   5. handler(args)           — execute tool             │    │
│  │   6. extractAndRemember()    — fire-and-forget          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────┐   ┌────────────────────────────────┐   │
│  │  Background worker  │   │  MariaDB pool (Port 3306)      │   │
│  │  every 60s: disk,   │──►│  sessions + session_messages   │   │
│  │  RAM, Ollama ping,  │   │  memories (vector embeddings)  │   │
│  │  PnP, ARP, TCP,     │   │  rules + tool_executions       │   │
│  │  firewall, WiFi,DNS │   │  profiles + tasks              │   │
│  │  EventBus push      │   │  user_feedback + directive_audit│  │
│  └─────────────────────┘   └────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────┐   ┌──────────────────────────────────────────┐  │
│  │  Clipboard polling  │   │  Python processes                        │  │
│  │  every 3s: history, │   │  wakeword_server.py :mic (wakeword)      │  │
│  │  pattern detection  │   │  stress_server.py :3004 (opt-in)         │  │
│  │  IBAN/URL/IBAN/...  │   │  tts_server.py — DEPRECATED              │  │
│  └─────────────────────┘   │    (replaced by kokoro.ts + kokoro-js)   │  │
│                             │  127.0.0.1-only, offline                 │  │
│                             └──────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Boot Flow (Frontend)

```text
App.tsx Mount
  └─ GET /api/settings → { eulaAccepted, onboardingComplete }

  eulaAccepted = false?
    └─ Fullscreen: /eula  →  user accepts
       └─ PUT /api/settings { eulaAccepted: true }
          └─ navigate("/setup")

  /setup: Dependency check
    └─ GET /api/setup/status → { ollama, nomic, mariadb, allOk }
       ├─ nomic missing + ollama OK → SSE pull (POST /api/setup/pull-nomic)
       └─ Continue button → GET /api/onboarding/status

  onboardingComplete = false?
    └─ Fullscreen: /onboarding  →  system scan, enter name
       └─ POST /api/onboarding/complete
          └─ navigate("/chat")

  Normal app mode: Sidebar + Chat / Dashboard / Settings
```

---

## Chat Flow — Detail

```text
POST /api/chat/stream  { sessionId, message }
  │
  ├─ await sessionStore.get(sessionId)        — session from MariaDB
  ├─ messages.push({ role: "user", ... })
  ├─ await recall(message)                    — top-5 memories via cosine search
  │
  └─ Tool loop (max. 5 rounds)
       │
       ├─ LLM stream (Ollama / OpenAI)
       │    Chunks  → SSE { type:"chunk", text }
       │    Done    → tool_calls? No → finished
       │
       ├─ for each tool_call:
       │    ├─ SSE { type:"tool", name }
       │    ├─ evaluateRules(name)
       │    │    DIRECTIVE_DENY → error (hardcoded)
       │    │    deny rule      → error
       │    │    allow rule     → execute
       │    │    no_match       → error (default-deny)
       │    └─ handler(args) → ToolResult
       │
       └─ Next round with tool results in context
  │
  ├─ SSE { type:"done" }
  ├─ sessionStore.set(sessionId, messages)    — user+assistant only, max. 40
  └─ extractAndRemember()                     — fire-and-forget, async
```

---

## Rule Engine

```text
evaluateRules(toolName)
  │
  1. DIRECTIVE_DENY (hardcoded Set in executor.ts)
  │    — never in DB, never configurable
  │    — currently: deleting unread emails (enforced via mail.ts)
  │
  2. DB query: SELECT … WHERE enabled=1 ORDER BY FIELD(action,'deny','allow')
  │    — deny rules always win (SQL order)
  │    — trigger evaluation: 'always', 'hour > N', 'disk_c > N'
  │
  3. First match: return 'deny' | 'allow'
  │
  4. No match: return 'no_match' → error in executor

Default rules (INSERT IGNORE, IDs 1–16):
  Allowed:  open_app, get_disk_usage, remember, forget, list_memories,
            homework_mode, load_setup, get_system_info, create_setup,
            update_setting, create_rule, free_ram,
            read_emails, mark_email, read_calendar, create_appointment
  Blocked:  clean_temp, empty_recycle_bin  (must be explicitly enabled)
```

---

## Memory System

```text
remember(type, content)
  └─ POST /api/embed (Ollama, nomic-embed-text)
     → 768-dimensional vector
     └─ INSERT INTO memories (type, content, embedding)

recall(query)
  └─ embed(query) → vector
     └─ SELECT last 500 FROM memories
        └─ cosine similarity (in-process, 10 lines TS)
           └─ filter ≥ 0.3, return top-5

Types:
  user   — facts about the user (automatic + explicit)
  system — app/tool usage behaviour (after open_app, load_setup)
  note   — explicit notes ("Remember that…")
```

---

## API Endpoints

| Route                           | Method       | Function                             |
| ------------------------------- | ------------ | ------------------------------------ |
| `/api/chat/stream`              | POST         | SSE streaming, tool loop             |
| `/api/chat`                     | POST         | Sync chat (non-streaming)            |
| `/api/chat/provider`            | GET          | Active provider + model              |
| `/api/chat/history/:id`         | GET / DELETE | Load / delete session                |
| `/api/settings`                 | GET / PUT    | Read / write settings                |
| `/api/settings/models`          | GET          | Available Ollama models              |
| `/api/settings/emergency-reset` | POST         | Reset AI settings                    |
| `/api/rules`                    | GET / POST   | List / create rules                  |
| `/api/rules/:id`                | PUT / DELETE | Edit / delete rule                   |
| `/api/rules/:id/toggle`         | PATCH        | Enable / disable rule                |
| `/api/tools`                    | GET          | Enabled tools (from settings)        |
| `/api/tools/execute`            | POST         | Execute tool directly                |
| `/api/confirm`                  | POST         | Confirmation for `_confirmed` tools  |
| `/api/system/status`            | GET          | Ollama + MariaDB reachability        |
| `/api/system/disk`              | GET          | Disk usage C:, E:, Z:                |
| `/api/system/programs`          | GET          | Installed programs (Start menu)      |
| `/api/events/stream`            | GET          | SSE push from background worker      |
| `/api/events/recent`            | GET          | Last 50 system events                |
| `/api/homework/status`          | GET          | Homework mode status                 |
| `/api/homework/activate`        | POST         | Activate mode (no PIN)               |
| `/api/homework/deactivate`      | POST         | Deactivate mode (PIN)                |
| `/api/homework/config`          | PUT          | Configure PIN + app list             |
| `/api/onboarding/status`        | GET          | Onboarding status + computer name    |
| `/api/onboarding/scan`          | POST         | Start hardware scan                  |
| `/api/onboarding/complete`      | POST         | Complete onboarding                  |
| `/api/setup/status`             | GET          | Dependency check (Ollama, nomic, DB) |
| `/api/setup/pull-nomic`         | POST         | Download nomic-embed-text via SSE    |
| `/api/profiles`                 | GET / POST   | List / create user profiles          |
| `/api/profiles/:id`             | PUT / DELETE | Edit / delete profile                |
| `/api/profiles/:id/activate`    | POST         | Activate profile (PIN if set)        |
| `/api/feedback`                 | POST         | Save thumbs up/down                  |
| `/api/google/auth`              | GET          | Start Google OAuth 2.0               |
| `/api/google/callback`          | GET          | OAuth callback (save token)          |

---

## Ports

| Service             | Port  | Notes                                                        |
| ------------------- | ----- | ------------------------------------------------------------ |
| Frontend (Vite Dev) | 5173  | Dev mode only — production via `file://`                     |
| Backend (Express)   | 3002  | Port 3001 occupied by Docker Desktop                         |
| Kokoro TTS          | —     | Node.js (`kokoro-js`), no port, runs in-process with the API |
| MariaDB             | 3306  | Windows service, E:\MariaDB\data                             |
| Ollama              | 11434 | Default port, runs as tray app                               |

---

## Stack

| Layer             | Technology           | Version | Reason                                                     |
| ----------------- | -------------------- | ------- | ---------------------------------------------------------- |
| Frontend          | React                | 18      | Stable, broad ecosystem                                    |
| Frontend build    | Vite                 | 5       | Fast, HMR < 50 ms                                          |
| Frontend routing  | React Router         | 6       | HashRouter for `file://` compatibility                     |
| Desktop shell     | Electron             | 33      | Native window, tray, autostart, child process              |
| Desktop build     | esbuild              | —       | Externalises `electron` correctly (electron-vite does not) |
| Desktop installer | electron-builder     | 24      | NSIS for Windows x64                                       |
| Backend           | Node.js + Express    | 20 / 4  | Minimal, explicit, async-first                             |
| Language          | TypeScript           | 5       | Type safety across all layers, strict mode                 |
| Database          | MariaDB              | 12.2.2  | Drop-in for MySQL, open source, on E:                      |
| Local LLM         | Ollama + llama3.1:8b | —       | Free, offline, GPU-capable                                 |
| Embeddings        | nomic-embed-text     | —       | 768-dim, via Ollama, local                                 |
| Cloud LLM         | OpenAI GPT-4o        | —       | Optional, best quality                                     |

---

## Project Structure

```text
z:\repos\E.L.L.A\
│
├─ apps/
│  ├─ api/                          — Express backend (@ella/api)
│  │  └─ src/
│  │     ├─ config/
│  │     │  ├─ env.ts               — environment variables (single source of truth)
│  │     │  ├─ database.ts          — MariaDB connection pool
│  │     │  └─ migrate.ts           — schema + seed rules on startup
│  │     ├─ middleware/
│  │     │  └─ errorHandler.ts      — centralised error handler
│  │     ├─ routes/
│  │     │  ├─ chat.ts              — chat + tool loop
│  │     │  ├─ confirm.ts           — generic confirmation (_confirmed tools)
│  │     │  ├─ events.ts            — SSE push + recent events
│  │     │  ├─ feedback.ts          — POST /api/feedback (thumbs up/down)
│  │     │  ├─ google.ts            — OAuth 2.0 callback
│  │     │  ├─ homework.ts          — homework mode REST
│  │     │  ├─ onboarding.ts        — onboarding flow REST
│  │     │  ├─ profiles.ts          — user profiles CRUD + activation
│  │     │  ├─ rules.ts             — rule engine CRUD
│  │     │  ├─ settings.ts          — settings CRUD + emergency reset
│  │     │  ├─ setup.ts             — dependency check + nomic pull SSE
│  │     │  ├─ system.ts            — status + disk + programs
│  │     │  └─ tools.ts             — tool listing + direct execute
│  │     ├─ services/
│  │     │  ├─ calendar.ts          — Outlook calendar via COM
│  │     │  ├─ clipboardHistory.ts  — polling (3s), history, pattern detection
│  │     │  ├─ duplicateFinder.ts   — hash-based duplicate search
│  │     │  ├─ eventBus.ts          — singleton EventEmitter (worker→SSE)
│  │     │  ├─ fileManager.ts       — readFileContent, renameFile, copyFile, createFolder
│  │     │  ├─ fileOps.ts           — deleteToRecycleBin (VisualBasic COM)
│  │     │  ├─ google.ts            — Gmail + Google Calendar OAuth
│  │     │  ├─ homework.ts          — activate/deactivate, SHA-256 PIN
│  │     │  ├─ mail.ts              — Outlook COM + Thunderbird mbox
│  │     │  ├─ mediaControl.ts      — VK_MEDIA_* keys + WinRT NowPlaying
│  │     │  ├─ memory.ts            — embeddings, recall(), extractAndRemember()
│  │     │  ├─ mouseControl.ts      — SetCursorPos, mouse_event (P/Invoke)
│  │     │  ├─ music.ts             — library search + player start
│  │     │  ├─ ocr.ts               — Windows.Media.Ocr WinRT (offline)
│  │     │  ├─ ollama.ts            — OllamaClient (chat, stream, embed)
│  │     │  ├─ openai.ts            — OpenAIClient (chat, stream)
│  │     │  ├─ processes.ts         — listProcesses, killProcess
│  │     │  ├─ profiles.ts          — PBKDF2+Salt, profile isolation
│  │     │  ├─ reminder.ts          — Windows Task Scheduler
│  │     │  ├─ rules.ts             — evaluateRules(), CRUD helpers
│  │     │  ├─ serviceManager.ts    — listServicesPs, controlService
│  │     │  ├─ sessionCompressor.ts — Ollama-only conversation compression
│  │     │  ├─ sessions.ts          — MariaDB-backed session store
│  │     │  ├─ settings.ts          — settings.json read/write
│  │     │  ├─ shellRunner.ts       — runSafeCommand (60+ blocked patterns)
│  │     │  ├─ styleProfile.ts      — email style profile + writeInUserStyle
│  │     │  ├─ systemComfort.ts     — dark mode, battery, temp, EventLog, WiFi
│  │     │  ├─ systemScan.ts        — Get-CimInstance: CPU/GPU/RAM/name
│  │     │  ├─ tasks.ts             — addTask, listTasks, completeTask, deleteTask
│  │     │  ├─ textCorrection.ts    — AI correction (Ollama/OpenAI)
│  │     │  ├─ textProcessing.ts    — translateText, summarizeText
│  │     │  ├─ vision.ts            — screenshot + GPT-4o vision analysis
│  │     │  ├─ windowContext.ts     — GetForegroundWindow, opt-in, filtered
│  │     │  ├─ windowManager.ts     — launchApp, controlWindow, sendKeys
│  │     │  └─ worker.ts            — background worker (60s: disk/RAM/PnP/ARP/TCP)
│  │     └─ tools/
│  │        ├─ definitions.ts       — tool schemas for LLM (111 active tools)
│  │        ├─ executor.ts          — directive + rule check + dispatch
│  │        └─ registry.ts          — legacy (listEnabled via settings)
│  │
│  ├─ desktop/                      — Electron desktop app (@ella/desktop)
│  │  ├─ src/
│  │  │  ├─ main.ts                 — BrowserWindow, tray, child process, IPC
│  │  │  └─ preload.ts              — IPC bridge
│  │  ├─ build-main.mjs             — esbuild script
│  │  └─ package.json               — electron-builder NSIS config
│  │
│  ├─ landing/                      — Static landing page
│  │  └─ index.html                 — HTML/CSS, Lemon Squeezy checkout
│  │
│  └─ web/                          — React frontend (@ella/web)
│     └─ src/
│        ├─ components/
│        │  └─ TitleBar.tsx         — frameless window title bar (IPC)
│        ├─ pages/
│        │  ├─ chat/                — chat interface, SSE streaming, TTS
│        │  ├─ dashboard/           — live feed, disk bars, SSE alerts
│        │  ├─ eula/                — EULA gate (fullscreen)
│        │  ├─ onboarding/          — system scan, name, 3 steps
│        │  ├─ settings/            — 5 tabs: LLM/Tools/Setups/Programs/Mode
│        │  └─ setup/               — dependency check, nomic pull SSE
│        └─ App.tsx                 — boot flow, EULA/onboarding routing
│
├─ packages/
│  ├─ shared/                       — shared types (@ella/shared)
│  │  └─ src/types/tool.ts          — ToolName (85+), ToolCall, ToolResult
│  └─ agent-tools/                  — Windows system tools (@ella/agent-tools)
│     └─ src/                       — open-app, get-disk-usage, clean-temp, empty-recycle-bin
│
├─ database/
│  └─ schema.sql                    — idempotent schema (IF NOT EXISTS, INSERT IGNORE)
│
├─ docs/                            — technical documentation
├─ apps/landing/index.html          — static landing page
├─ CHANGELOG.md                     — all versions at a glance
└─ README.md                        — prerequisites, quick start, architecture
```

---

## Security Principle

E.L.L.A. separates **understanding** (LLM) from **execution** (backend) with two independent gates:

```text
LLM (Ollama / OpenAI)
  │
  │  Produces structured tool call { name, args }
  ▼
toolExecutor.execute(name, args)
  │
  ├─ 1. Settings check: getSettings().enabledTools.includes(name)?
  │       No → error, nothing is executed
  │
  ├─ 2. Rule engine: evaluateRules(name)
  │       deny         → error
  │       no_match     → error (default-deny)
  │       allow        → continue
  │
  └─ 3. Handler(args)
          — no free shell access
          — no eval(), no exec() with user input
          — PowerShell via Base64-EncodedCommand (no special-character issues)
```

**Directive:** Deleting unread emails is blocked at two levels — the PS script checks `$item.UnRead` before `delete`, the executor checks `result.directive`. No rule can override this.

**API keys:** Exclusively in the backend (`.env`). The frontend sees `***` and makes no direct LLM calls.

**PIN:** SHA-256 hash in `settings.json`, never transmitted in plain text.

**DB user:** `ella` has only `ALL PRIVILEGES ON ella.*` — no access to other databases, no `SUPER`.
