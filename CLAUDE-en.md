# E.L.L.A — Embedded Local Logic Agent

Local Windows AI assistant as an Electron desktop app. Runs fully offline via Ollama (llama3.1:8b), optionally with OpenAI GPT-4o.

**Current version: v3.9.0**

> _ELLA adapts to the user and grows with her challenges._

---

## Working method

- **Sparring partner:** Claude (claude.ai Chat) — strategy, architecture, product decisions
- **Implementer:** Claude Code (this tool) — executes work instructions, writes code, always following best practices
- **Ground rule:** Each phase is reviewed for errors and functionality after completion. All tests must be green. Only then: update README, set tag, commit, push.

---

## Stack

- **Backend**: Express, TypeScript, MariaDB (Port 3306, E:\MariaDB)
- **Frontend**: React 18, Vite (Port 5173)
- **Desktop**: Electron 33 + electron-builder
- **LLM**: Ollama (llama3.1:8b, Port 11434) + OpenAI GPT-4o (optional)
- **Mono-Repo**: npm workspaces

## Project structure

```
apps/
  api/        Express server (Port 3002)
  web/        React frontend (Port 5173)
  desktop/    Electron wrapper
  landing/    Static landing page
packages/
  shared/     Shared types + interfaces
  agent-tools/ Windows system tools (disk, temp, recycle, open_app)
scripts/
  wakeword_server.py  Python wakeword process (openWakeWord + ella.onnx)
  tts_server.py       Python Kokoro TTS server (Port 3003, 127.0.0.1-only)
  stress_server.py    Python voice stress analysis (Port 3004, numpy-only, WAV analysis)
database/
  schema.sql  MariaDB schema (idempotent, IF NOT EXISTS)
```

---

## What's running (fully implemented — v3.9.0)

### Core

- Dual-LLM (Ollama/OpenAI), SSE streaming, tool loop max. 5 rounds
- 85 tools with handlers + audit log (`tool_executions`)
- Rule engine: Directive Layer → DIRECTIVE_DENY → Deny Rules → Allow Rules → allow
- **Directive-denial UI:** red badge in chat on rule rejection
- ML memory: nomic-embed-text, cosine similarity, 3 types (user/system/note)
- **User profiles:** profile-isolated memory, PBKDF2+Salt PIN hash
- **Per-session mutex:** prevents race condition on parallel requests

### Voice & UI

- Voice: wakeword "ella" (Python/ONNX + openWakeWord), manual, TTS
- **Kokoro TTS:** `scripts/tts_server.py` — local neural voice, Port 3003, 127.0.0.1-only
- **TTS control:** `currentAudioRef` stops current playback before new; no Web Speech fallback
- Proactive TTS: alert/device events and proactive messages are read aloud
- **Proactive messages:** ELLA writes to chat on her own (SSE `proactive_message`)
- **Feedback buttons:** thumbs up/down → Ollama extracts user preferences → `user` memory
- **Markdown rendering:** chat responses via `marked.js`, TTS-aware system prompt
- **Tool log:** tools used shown as chips under each assistant response (63 labels)
- **Ollama offline banner:** `GET /api/health` + `OllamaBanner` component, 30s polling
- **Favicon:** SVG "E." design + Electron icon (RGBA, transparent corners)
- **External links:** `shell.openExternal` — browser instead of Electron
- System tray: typed balloon alerts (warning/error/info/device) with severity sound
- **i18n (DE/EN):** react-i18next, all UI components fully translated — App, Chat, Settings, Dashboard, Onboarding, Activation
- **Model selection before download:** `ModelSelectOverlay` — shows hardware tier selection before first download; `main.ts` pauses `ensureOllamaModel()` until IPC reply; no default download on mismatched hardware
- **License website:** ella-agent.de link on the activation page
- **Multilingual voices (DE/EN/ES/FR):** `spokenLanguage` setting automatically selects female voice — Kokoro: `af_sarah`/`bf_emma`/`ef_dora`/`ff_siwis`; MsEdgeTTS: Katja/Sonia/Elvira/Denise; UI stays DE/EN
- **Onboarding voice selection:** 4 female voices selectable in onboarding step (with preview in the respective language), saves `spokenLanguage`
- **Stress detection:** `stress_server.py` Port 3004, numpy-only WAV analysis (RMS/ZCR/Pitch), `stressDetectionEnabled` setting; hint in memories at medium/high; opt-in

### Productivity

- **Files:** `search_files` (Windows Search Index primary, Get-ChildItem fallback), `open_file`, `explore_folder`
- **Documents:** `create_document` (Word + TXT), `read_file_content` (.docx/.pdf/.xlsx/.html), `dictate_to_document`
- **Task list:** `add_task`, `list_tasks`, `complete_task`, `delete_task` — persistent TODOs in MariaDB
- **Alarms:** `set_alarm`, `list_alarms`, `delete_alarm` — DB-based, daily worker check
- **Music:** `play_music` → search library (artist/album/title), open media player; `path` parameter for direct access when path is known
- **Processes:** `list_processes`, `kill_process` (system-critical locked)
- **Services:** `list_services`, `control_service` — list and control Windows services
- **System control:** `set_volume` (DLL cache ~0.5s), `get_clipboard`/`set_clipboard` (+ history, 3s polling)
- **Reminders:** `set_reminder`/`list_reminders`/`delete_reminder` via Windows Task Scheduler
- **Vision:** `take_screenshot` → GDI+ screenshot + GPT-4o Vision analysis; `describe_screen`, `describe_image`, `describe_webpage`
- **Writing style:** `write_for_me`, `write_in_style` → style profile from email history + text in user's style
- **Text processing:** `translate_text`, `summarize_text`, `correct_text` — Ollama/OpenAI
- **Duplicates:** `find_duplicates`, **Autostart:** `list_autostart`

### Communication

- Outlook COM: read/label mail + read/create calendar
- Gmail + Google Calendar via OAuth 2.0
- `compose_email` → Outlook draft (does not send automatically)

### Monitoring & Proactive

- Background worker (60s): Disk/RAM/Ollama alerts, PnP, ARP, TCP, Firewall/WiFi/DNS, alarm check
- Clipboard polling (3s): history + pattern detection: IBAN, tracking number, phone, URL, email
- **Conversation compression:** `sessionCompressor.ts` — Ollama-only, oldest 10 messages → summary from 15 messages onwards
- **Window context:** `windowContext.ts` — GetForegroundWindow, sensitive titles filtered, Ollama-only, opt-in
- `recordActivity()` → comeback briefing; meeting prep, daily summary (+overdue tasks), break reminder
- Rhythm analysis (12pm), duplicate scan (Sun 10am)

### Infrastructure

- **Onboarding:** 6-step flow — name, directive acceptance, hardware scan, voice, location
- Auto-migration: schema.sql idempotent, **85 default rules** (IDs 1–85)
- **DB v3.5.0:** `alarms` table + rules 83–85
- **User profiles:** `routes/profiles.ts`, `services/profiles.ts` — PBKDF2+Salt (100k iterations)
- **Feedback route:** `routes/feedback.ts` — POST /api/feedback + Ollama memory extraction
- Homework mode: SHA-256 PIN (homework), PBKDF2 (profile), emergency reset
- **format_drive 3-zone rule:** Zone 1 = C:, ELLA drive (auto via `process.cwd()[0]`), `protectedDrives` → directive; Zone 2 = network/CD/unknown → directive; Zone 3 = all others incl. internal HDDs → confirmation dialog
- Conversational config: `create_setup`, `update_setting`, `create_rule`
- **Get-CimInstance:** all wmic calls replaced — Windows 11 22H2+ compatible
- **224 tests — all green** (Vitest unit + integration)
- CI: GitHub Actions, Ubuntu + MariaDB service container

---

## New tools — checklist

Every new tool requires all of the following steps:

1. **`packages/shared/src/types/tool.ts`** — add to ToolName union
2. **`apps/api/src/tools/definitions.ts`** — tool definition (type, function, parameters)
3. **`apps/api/src/tools/executor.ts`** — implement handler (import + HANDLERS entry)
4. **`apps/api/src/config/migrate.ts`** — default rule (next free ID from 86, `always`, `allow`) + CREATE TABLE if needed
5. **`apps/api/src/routes/settings.ts`** — if new settings fields: add to PUT route destructuring AND `raw` object (otherwise ignored on save!)
6. **`apps/api/src/services/settings.ts`** — if new settings fields: interface, DEFAULT_SETTINGS, loadSettings migration
7. **`apps/api/src/index.ts`** — if new route: import router + `app.use(...)`
8. **`apps/web/src/pages/settings/Settings.tsx`** — if new settings fields: extend interface + UI element + ALL_TOOLS list
9. **Tests** — unit test in `executor.test.ts` (mock for external services, tool in `wowSettings.enabledTools`!)

### Adding a new route

1. `apps/api/src/routes/<name>.ts` — create router
2. `apps/api/src/index.ts` — import + `app.use("/api/<name>", <name>Router)`

### Adding a new DB table

1. `database/schema.sql` — `CREATE TABLE IF NOT EXISTS` at the end
2. `apps/api/src/config/migrate.ts` — `await exec("CREATE TABLE IF NOT EXISTS ...")` in `runMigrations()`
3. Add `profile_id INT NULL` column from the start — avoids later migration complexity

---

## The E.L.L.A. Directive (concept)

Four immovable prohibitions — architecturally anchored, not configurable:

1. **harm** — no physical, financial, psychological, or data-related harm
2. **conceal** — no concealment of actions, capabilities, or system states
3. **surveil** — no monitoring without explicit knowledge and active consent
4. **exfiltrate** — no data transfer to third parties without explicit consent

Hierarchy: `Directive Layer → DIRECTIVE_DENY → Deny Rules → Allow Rules → Tool Execution`

Repo: `github.com/AndreZ1971/The-E.L.L.A.-Directive-` (private, tag v1.0.0)

---

## Installer build (Windows NSIS)

The installer bundles all dependencies — user needs nothing pre-installed.

### Bundled binaries (vendor/)

```
vendor/mariadb/    MariaDB 11.4.5 portable
vendor/ollama/     Ollama v0.30.7 portable
vendor/node/       Node.js 22 portable (node.exe)
```

```powershell
.\scripts\download-vendor-deps.ps1    # Download once
.\scripts\prepare-api-deps.ps1        # Production node_modules (~8MB)
.\scripts\build-installer.ps1         # Build everything → dist-installer/*.exe
```

**CRITICAL:** Compile API and web BEFORE desktop build — otherwise the installer contains stale output.

### Startup sequence (Electron main)

`createWindow()` → `startMariaDB()` → `startOllama()` → `startApi()` (node.exe dist/bundle.cjs)

Startup log: `%APPDATA%\ELLA\ella-startup.log`

### First-launch flow

EULA → License activation (`ELLA-XXXX-XXXX-XXXX-XXXX`) → Onboarding → Chat

License server: `49.13.26.248:3010` — hardware fingerprint (SHA256 hostname+CPU+MACs), offline-tolerant

### esbuild bundle (apps/api/build-bundle.mjs)

CJS format, 370KB app code. External packages in `prod-node-modules/node_modules/`:
`dotenv`, `express`, `mysql2`, `pdf-parse`, `cheerio`, `googleapis`, `mammoth`, `msedge-tts`, `multer`, `turndown`, `xlsx`, `ffmpeg-static`, `@xenova/transformers`

`@ella/*` workspace packages are embedded directly.

---

## Key commands

```powershell
# Start everything (root)
npm run dev                    # API + Web in parallel (concurrently)

# Individually
npm run dev --workspace=apps/api     # API on :3002
npm run dev --workspace=apps/web     # Web on :5173

# Build order (important: shared → agent-tools → api → web)
npm run build

# Desktop (dev)
cd apps/desktop && node build-main.mjs && cd ../..
$env:ELLA_DEV = "1"; cd apps\desktop; .\node_modules\electron\dist\electron.exe .

# Tests
npm test                       # 224 unit + integration tests (Vitest)
npm run lint

# Check Ollama
Invoke-RestMethod -Uri "http://localhost:11434/api/tags"
```

## MariaDB

- **Dev:** `E:\MariaDB\server`, data: `E:\MariaDB\data`, service: `sc start MariaDB`
- **Installer:** portable in `vendor/mariadb/`, data: `%APPDATA%\ELLA\mariadb-data\`
- Port: 3306

---

## Conventions

- TypeScript ES2022, strict mode, NodeNext module resolution
- Mind CommonJS-to-ESM bridge — `import` vs `require` depending on the package
- Always build `packages/shared` changes first, then consumers
- Run PowerShell scripts as temp file (not EncodedCommand) — avoids CMD line length limit
- `execSync` with `{ encoding: "utf-8" }` or without `shell: true` — otherwise TS overload error
- New settings fields must be registered in `settings.ts` AND `routes/settings.ts`
- Every new feature gets tests — unit if isolatable, integration if DB is needed

## What to avoid

- Do not set `ELECTRON_RUN_AS_NODE` — breaks desktop startup
- Do not put MariaDB password in settings files (use `.env`)
- Do not edit `node_modules` in Electron directly
- Ollama must be running before API starts (or OpenAI fallback configured)
- No free shell commands from the LLM — only structured tool calls through the executor
- Avoid `{ shell: true }` with `execSync` — TypeScript finds no overload

## Git

```
https://github.com/AndreZ1971/E.L.L.A.git
```
