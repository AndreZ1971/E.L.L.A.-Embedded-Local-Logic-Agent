# E.L.L.A. — Embedded Local Logic Agent

![Tests](https://github.com/AndreZ1971/E.L.L.A/actions/workflows/test.yml/badge.svg)

Local AI assistant for Windows as a native desktop app. LLM-driven automation — runs locally via Ollama, optionally with OpenAI API. No telemetry — network only for license check and online features you use ([details](docs/english/network.md)).

**Version:** v1.5.6 · Windows 10/11 (x64)

_ELLA adapts to the user and grows with her challenges._

---

## Installation (Zero-Config Installer)

**Prerequisites: none.** The installer brings everything.

1. Run `E.L.L.A Setup 1.0.0.exe`
2. Choose installation path (default: `C:\Program Files\E.L.L.A`)
3. On first launch: **Language selection** (DE/EN) → EULA → License activation → **Model selection** → Onboarding → Chat

The installer includes portable vendored binaries:

- **MariaDB 11.4** (initializes automatically in `%APPDATA%\ELLA\mariadb-data`)
- **Ollama** (starts automatically; model is only downloaded after user selection on first launch)
- **Node.js 22** (API runtime)

No Python, no separate MariaDB setup, no PATH configuration required.

---

## Features

| Area                  | What E.L.L.A. can do                                                                 |
| --------------------- | ------------------------------------------------------------------------------------ |
| Programs              | Launch/close apps, load setups, list installed programs                              |
| Drives                | Rename, format USB sticks (system drives locked)                                     |
| Mail (Outlook)        | Read emails, mark as read/spam/archived                                              |
| Mail (Gmail)          | Read and label Gmail via OAuth 2.0                                                   |
| Calendar (Outlook)    | Read and create Outlook appointments                                                 |
| Calendar (Google)     | Read Google Calendar and create events via OAuth 2.0                                 |
| System                | Temp files, recycle bin, RAM, disk, diagnostics, shutdown                            |
| Memory                | Vector embeddings (nomic-embed-text), cosine search, 3 types, profile-isolated       |
| Voice input           | Web Speech API (Chromium built-in, no API key) - Hands-free / Manual / Wakeword      |
| Voice output          | Kokoro TTS local (EN/ES/FR), Edge TTS for German (internet required) — female voices |
| Stress detection      | Voice analysis (Python/numpy) — adapts ELLA's tone under tension (opt-in)            |
| Pause                 | Disable wakeword 1–120 minutes, countdown, automatic resume                          |
| Web                   | Instant search without confirmation (movies, people, products, news)                 |
| Weather               | Current weather via Open-Meteo                                                       |
| Homework mode         | PIN-secured kiosk with app whitelist                                                 |
| Rule engine           | 107 default rules, allow/deny, time conditions, Directive Layer                      |
| Monitoring            | Background worker, SSE push, Disk/Ollama/RAM alerts, PnP events                      |
| USB detection         | USB drives are detected and announced (proactive message + TTS)                      |
| Network               | LAN scan via ARP, TCP connections, DNS/Firewall/WiFi monitoring                      |
| Self-configuration    | Change setups, rules, and settings via conversation                                  |
| Music                 | Search library (artist/album/title), open in Media Player                            |
| Files                 | Search all drives (Windows Search Index, fast), open files                           |
| Documents             | Create Word/TXT, read .docx/.pdf/.xlsx/.html (mammoth/pdf-parse/SheetJS)             |
| Alarms                | DB-based alarms with daily check, proactive trigger in background worker             |
| Dictation             | Voice input directly into Word, AI corrects grammar and punctuation                  |
| Compose email         | Open Outlook draft with AI-corrected text (does not send automatically)              |
| Processes             | Show running processes, kill CPU/RAM hogs (system-critical protected)                |
| System control        | Set/mute volume, read/write clipboard with 20-entry history                          |
| Reminders             | Windows Task Scheduler — fires as popup at the set time                              |
| Screenshot + Vision   | Capture screen and analyze with GPT-4o Vision (OpenAI key required)                  |
| Writing style         | Generate text in the user's personal style — learns from existing emails             |
| Duplicates            | Find duplicate files, calculate wasted storage                                       |
| Autostart             | List programs that start with Windows                                                |
| Task list             | Persistent TODOs with priority and due date, integrated into daily summary           |
| Proactive             | Meeting prep, daily summary, comeback briefing, break reminder, clipboard patterns   |
| Feedback loop         | Thumbs up/down → Ollama extracts user preferences → long-term memory                 |
| Window context        | ELLA knows the active application during chat (opt-in, Ollama only)                  |
| Conversation compress | Automatically compress long sessions (local Ollama)                                  |
| User profiles         | Separate memory and chat history per profile, PBKDF2-secured PIN                     |

### The E.L.L.A. Directive — four immovable prohibitions

Architecturally anchored, not configurable:

1. **harm** — no physical, financial, psychological, or data-related harm
2. **conceal** — no concealment of actions, capabilities, or system states
3. **surveil** — no monitoring without explicit knowledge and active consent
4. **exfiltrate** — no data transfer to third parties without explicit consent

Hierarchy: `Directive Layer → DIRECTIVE_DENY → Deny Rules → Allow Rules → Tool Execution`

---

## Voice (without OpenAI key)

### Voice input — Web Speech API

ELLA uses `window.SpeechRecognition` (Chromium built-in) directly in the renderer:

- No API key required
- Connects to Microsoft/Google speech recognition service (internet required)
- Language: configurable (default `de-DE`)
- **Hands-free mode** (`voiceMode: "always"`): continuous listening, automatic restart
- **Manual**: microphone button → single recording → text into input field

### Voice output — two engines

**Microsoft Edge TTS** (`msedge-tts`, online):

- No API key, free Microsoft service
- 4 female voices: Katja (DE), Sonia (EN), Elvira (ES), Denise (FR)
- Selectable via `spokenLanguage` setting (independent of UI language)

**Kokoro TTS** (`scripts/tts_server.py`, Port 3003, fully offline for EN/FR/ES; German uses Edge TTS via internet):

- Local neural voice, no internet required
- Same 4 languages: `af_sarah` / `bf_emma` / `ef_dora` / `ff_siwis`
- Activatable in Settings (`ttsEngine: "kokoro"`)

### Voice stress detection (opt-in)

`scripts/stress_server.py` (Port 3004) — Python/numpy, no additional dependencies:

- Runs in parallel with Whisper transcription on the same WAV segment
- Analyzes RMS energy, Zero-Crossing Rate, and pitch → `low / medium / high`
- On `medium/high`: context hint in ELLA's memories → calmer, more empathetic response
- Enable in Settings → Voice → "Enable voice analysis"

### Optional: OpenAI Whisper (higher quality)

With an OpenAI key in Settings, the Whisper API can be used as the primary STT engine (significantly better accuracy, ~$0.006/min).

---

## Prerequisites (Installer)

None. The installer is fully self-contained.

| What            | How provided                           |
| --------------- | -------------------------------------- |
| MariaDB 11.4    | Portable in `resources/mariadb/`       |
| Ollama          | Portable in `resources/ollama/`        |
| Node.js 22      | Portable in `resources/node/`          |
| API             | `bundle.cjs` (42 MB, all deps inlined) |
| Database schema | Auto-migration on first launch         |

---

## Prerequisites (Development mode)

| Prerequisite                | Version   | Source      |
| --------------------------- | --------- | ----------- |
| Windows                     | 10/11 x64 | —           |
| Node.js                     | 22+       | nodejs.org  |
| [Ollama](https://ollama.ai) | current   | ollama.ai   |
| MariaDB                     | 11.x      | mariadb.org |

Once after Ollama installation:

```powershell
ollama pull llama3.1:8b        # Chat model (~4.7 GB)
ollama pull nomic-embed-text   # Memory model (~274 MB)
```

---

## Development mode

### Quick start after clone

```powershell
npm install
cd apps/api && npm run build && cd ../..
cd apps/web && npm run build && cd ../..
cd apps/desktop && node build-main.mjs
$env:ELLA_DEV = "1"
.\node_modules\electron\dist\electron.exe .
```

### Environment variables (dev)

```env
# apps/api/.env
PORT=3002
NODE_ENV=development
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
OPENAI_API_KEY=        # Optional — for GPT-4o, Vision and writing style
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ella
DB_USER=ella
DB_PASSWORD=<your-password>
```

```powershell
net start MariaDB   # or: sc start MariaDB
```

### Parallel dev (API + Vite)

```powershell
npm run dev --workspace=apps/api   # API :3002
npm run dev --workspace=apps/web   # Web :5173
```

### Build for installer

```powershell
npm run build --workspace=apps/api
npm run build --workspace=apps/web
cd apps/desktop && npm run dist
# → dist-installer/E.L.L.A Setup 1.0.0.exe
```

---

## Project structure

```text
apps/
  api/        Express server (Port 3002) — bundle.cjs (esbuild, 42 MB)
  web/        React 18 + Vite (Port 5173)
  desktop/    Electron 33 + electron-builder (NSIS installer)
database/
  schema.sql  MariaDB schema (idempotent, IF NOT EXISTS)
vendor/
  mariadb/    Portable MariaDB 11.4 (bundled in installer)
  ollama/     Portable Ollama (bundled in installer)
  node/       Portable Node.js 22 (bundled in installer)
docs/
  deutsch/                    German documentation
  english/                    English documentation
  bedienungsanleitung.md      Full user documentation
  architecture.md             System overview, chat flow, ports
  history.md                  Development history
  roadmap.md                  Completed and planned features
  database.md                 Schema documentation, admin commands
  hardware.md                 Hardware specification
```

---

## Architecture overview

```text
Electron (Main) — apps/desktop/src/main.ts
  ├─ spawns portable MariaDB (mysqld.exe from vendor/mariadb)
  │    └─ mysql_install_db.exe on first launch (no admin required)
  │    └─ Data in %APPDATA%\ELLA\mariadb-data
  ├─ spawns portable Ollama (ollama.exe from vendor/ollama)
  ├─ spawns API via portable Node.js (bundle.cjs)
  │    └─ ELLA_RESOURCES=process.resourcesPath
  │    └─ ELLA_USERDATA=app.getPath("userData")
  └─ loads web build via file:// (HashRouter)

API (Express :3002) — apps/api/dist/bundle.cjs
  ├─ /api/chat            — Sync + /stream SSE (tool loop max. 5 rounds)
  ├─ /api/settings        — Settings CRUD (settings.json in %APPDATA%\ELLA)
  ├─ /api/rules           — Rule engine CRUD (MariaDB)
  ├─ /api/events/stream   — SSE push from background worker
  ├─ /api/system          — Programs, scan, diagnostics
  ├─ /api/speech          — TTS (msedge-tts), STT (/transcribe with OpenAI fallback)
  ├─ /api/license         — License activation
  ├─ /api/onboarding      — 6-step onboarding flow
  ├─ /api/profiles        — User profiles CRUD + activation
  └─ /api/google          — OAuth 2.0 flow (Gmail + Calendar)

LLM provider (auto-detect)
  ├─ Ollama  (local, Port 11434, llama3.1:8b) — primary
  └─ OpenAI  (GPT-4o, when API key set — Vision, writing style)

Voice input (Frontend — Renderer)
  └─ window.SpeechRecognition (Chromium built-in)
       ├─ Hands-free: continuous=true, auto-restart, de-DE
       └─ Manual: continuous=false, result → input field

Voice output (API → msedge-tts)
  └─ Microsoft Edge Neural TTS (wss://speech.platform.bing.com)
       └─ Default voice: de-DE-KatjaNeural, no API key

Background Worker (60s interval)
  ├─ Disk/RAM/Ollama monitoring → SSE alerts
  ├─ PnP delta detection (webcam, USB, external drives) + TTS announcement
  ├─ ARP LAN scan, TCP connections, Firewall/WiFi/DNS monitoring
  ├─ Clipboard polling (3s, disables after 3 errors) → history + pattern detection
  │    (IBAN, tracking number, phone, URL, email → proactive message)
  ├─ Meeting prep (5 min), daily summary (6pm), comeback (30 min)
  └─ Break reminder (90 min), rhythm analysis (12pm), duplicate scan (Sun 10am)

MariaDB (Port 3306) — %APPDATA%\ELLA\mariadb-data
  ├─ sessions / session_messages  — Conversation history (profile_id-isolated)
  ├─ memories                     — Vector embeddings (profile_id-isolated)
  ├─ rules                        — 57 default rules (allow/deny)
  ├─ profiles                     — User profiles (PBKDF2+Salt PIN hash)
  ├─ tasks                        — Persistent task list
  ├─ alarms                       — DB-based alarms
  ├─ user_feedback                — Thumbs feedback
  └─ system_events                — Alert history
```

---

## Security principles

- **Whitelist principle:** every tool execution requires an explicit allow rule
- **Default-deny for destructive tools:** `clean_temp` and `empty_recycle_bin` must be explicitly enabled
- **Directive:** formatting system drives, deleting unread emails = hardcoded prohibition
- **Confirmation card:** formatting and killing processes require explicit user confirmation
- **System-critical processes:** `svchost`, `lsass`, `csrss` etc. cannot be terminated
- **No data exfiltration:** window context and conversation compression are Ollama-only
- **OpenAI key:** only in backend `.env` / `settings.json`, delivered to frontend as `***`
- **Google token:** local in `google-token.json`, never committed (`.gitignore`)
- **MariaDB local:** binds to `127.0.0.1`, no LAN exposure
- **Profile PINs:** PBKDF2+Salt, 100,000 iterations, timing-safe compare

---

## Drive operations

| Zone | Drive type                               | Response                                  |
| ---- | ---------------------------------------- | ----------------------------------------- |
| 1    | C:, `protectedDrives`, ELLA's own drive  | **Permanently blocked** (directive: true) |
| 2    | Network and CD/DVD drives, unknown types | **Blocked** (directive: true)             |
| 3    | All others (including internal HDDs)     | **Confirmation card** → user confirms     |

---

## Documentation

| Document                                                                   | Content                                  |
| -------------------------------------------------------------------------- | ---------------------------------------- |
| [docs/english/bedienungsanleitung.md](docs/english/bedienungsanleitung.md) | Full user manual (English)               |
| [docs/deutsch/bedienungsanleitung.md](docs/deutsch/bedienungsanleitung.md) | Full user manual (German)                |
| [CHANGELOG.md](CHANGELOG.md)                                               | All versions at a glance                 |
| [docs/english/history.md](docs/english/history.md)                         | Development history with rationale       |
| [docs/english/architecture.md](docs/english/architecture.md)               | System overview, chat flow, ports, stack |
| [docs/english/database.md](docs/english/database.md)                       | MariaDB schema, table descriptions       |
| [docs/english/roadmap.md](docs/english/roadmap.md)                         | Completed and planned features           |
| [docs/english/hardware.md](docs/english/hardware.md)                       | Hardware specification and GPU setup     |

---

## License

Proprietary. All rights reserved. Source code visible on GitHub for demonstration purposes.
