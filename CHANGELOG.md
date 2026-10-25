# Changelog — E.L.L.A.

All notable changes to E.L.L.A. are documented here.

---

## [1.5.6] — October 2026

### New Features

- **HUD Mode** — new `appearance` setting with three modes: Calm (default dark), HUD (technical/Cyan), Show (presentation/fullscreen)
- **HUD Widget System** — configurable left/right widget columns with 8 widgets: Clock, System, Monitors, Setups, Directive, Tasks, Mail, Music
- **Orb Visualization** — 6 states (idle, listening, thinking, speaking, cloud, offline) with unique animations, OrbRings SVG overlay, countdown ring for follow-up window
- **Presentation Mode (Show)** — fullscreen via Electron IPC, shows only Orb + last assistant answer, privacy filter redacts sensitive tool results
- **Accent Colors** — 3 HUD accent options: Cyan, Violet, Amber
- **Local Fonts** — Chakra Petch + JetBrains Mono as woff2, no CDN required
- **About Tab** — "About E.L.L.A." settings tab with version info, update check (GitHub Releases API), license display, third-party licenses, support info
- **Performance Throttling** — `hudThrottle` setting reduces animation speed during LLM processing; Canvas FPS capped at 20fps
- **Telemetry API** — `GET /api/system/telemetry` (CPU/RAM/VRAM/Disk/Temp), `GET /api/system/monitors`
- **Self-Image** — system prompt block so E.L.L.A. understands its own nature as a local agent with Orb visualization
- **i18n HUD keys** — full DE/EN translation for HUD states, Directive texts, dictation mode

### Technical

- New settings: `appearance`, `hudAccent`, `hudThrottle`, `hudWidgets`
- New API routes: `/api/system/telemetry`, `/api/system/monitors`, `/api/system/version`, `/api/system/check-update`, `/api/system/support-info`, `/api/system/tasks`, `/api/system/mails`, `/api/system/now-playing`
- Tool count: 111 active
- Tests: 393 green

---

## [1.5.5] — October 2026

### Bug Fixes & Improvements

- **Clipboard Preservation** — `typeTextToActiveWindow()` saves clipboard before pasting and restores it 300ms after Ctrl+V
- **Configurable Dictation Hotkey** — `dictationHotkey` setting (default: `CommandOrControl+Alt+Space`); editable in Settings UI; Electron `globalShortcut` updated at runtime via IPC
- **Hotkey Conflict Resolved** — old default `Ctrl+Shift+D` collided with Word, Chrome/Edge, VS Code
- **Hotkey Registration Safety** — `globalShortcut.register()` return value checked; failed registration logged instead of silently failing
- **API Hotkey Sync** — after API start, Electron loads hotkey from settings; changes in Settings UI update immediately via IPC

### Technical

- Tests: 380 green

---

## [1.5.4] — October 2026

### New Features

- **Dictation Mode** — `VoiceMode "dictation"`: speech transcribed and typed directly into the active Windows window — system-wide, not just in E.L.L.A.
- **`POST /api/speech/dictate`** — audio → Whisper transcription → optional spell check → text into active window
- **Dictation Correction Setting** — optional spell correction via `correctText()` before typing; default: off
- **Amber Indicator** — dictation mode shows dedicated status display
- **Electron Global Hotkey** — configurable hotkey toggles dictation mode via IPC

### Technical

- New settings: `dictationCorrection`, `dictationHotkey`
- Tests: 380 green

---

## [1.5.3] — October 2026

### New Features

- **Stop-Interrupt** — during TTS playback, VAD segments continue to be transcribed; detects stop words (stopp, halt, sei still, quiet, stop it, shut up, etc.) and immediately stops TTS — works in wakeword and always-on modes
- **Follow-Up Window** — 8 seconds after TTS ends, user can speak without wakeword in wakeword mode; window closes after first use

### Technical

- Echo cancellation active via `getUserMedia({ echoCancellation: true })`
- Tests: 380 green

---

## [1.5.2] — October 2026

### New Features

- **Data Redaction** — regex-based scrubbing of sensitive data (API keys, Bearer tokens, GitHub PATs, passwords, IBANs, credit card numbers) before storing in memories or clipboard history
- **Result Transparency** — system prompt instruction forces E.L.L.A. to clearly communicate tool errors instead of saying "done"
- **Offline Mode** — `offlineMode` setting blocks all network tools; `cloudAllowed()` returns false; license verify uses cache; offline banner in UI

### Technical

- Local network tools (scan_network, list_connections, list_devices) unaffected by offline mode
- Tests: 380 green

---

## [1.5.1] — October 2026

### Security

- **Loopback Binding** — Express binds on `127.0.0.1` instead of `0.0.0.0` — API only locally reachable
- **Per-Start API Token** — `randomBytes(32)` in Electron main; `timingSafeEqual` check in `apiAuth` middleware
- **Cloud Governance** — all OpenAI calls through central `openaiRequest()` function; checks `cloudAllowed()`, throws `CloudBlockedError` for unauthorized cloud access; logs every call in `system_events` table
- **DuckDuckGo Web Search** — `search_web` uses DuckDuckGo as primary search engine (no API key required); OpenAI Web Search only as fallback
- **PIN-Protected Profiles** — time-limited `x-profile-token` session tokens

### Technical

- New DB table: `system_events`
- New middleware: `apiAuth` (host whitelist, CORS, token validation)
- Frontend: centralized `apiFetch()` / `eventStreamUrl()` with automatic token injection
- "Local First" pattern: all services try Ollama first, OpenAI only with explicit opt-in or as fallback
- Tests: 380 green

---

## [1.5.0] — October 2026

### New Features

- **Knowledge Graph Triples** — subject/predicate/object triples with hybrid recall; dashboard graph shows real relations as purple labeled edges
- **Self-Learning Loop** — positive feedback (thumbs up) creates golden Q&A pairs; few-shot injection into future conversations
- **Proactive Approval-Memory** — 14 categories for proactive messages; auto-mute after 5 dismissals; mute buttons on every proactive message
- **Gesture Control** — hand gesture recognition via MediaPipe Hands (Stage 1)
- **Time Awareness** — session duration, pause detection, last interaction tracking
- **Rule-Based Pre-Compression** — conversation compression without LLM (no tokens consumed)
- **Token Output Limits** — 3000 chars/tool, 500 chars/JSON string — reduced context bloat
- **Memory Deduplication** — duplicate prevention on write + periodic deduplication
- **Webcam Control** — camera capture and management
- **Printer Control** — list printers, print documents
- **Multi-Monitor Support** — `list_monitors` + `open_app_on_monitor`
- **Levenshtein Fuzzy Matching** — app names matched even with typos
- **Document Knowledge Graph** — auto re-index + document-to-memory graph edges
- **qwen2.5:7b** — added as balanced model tier

### Technical

- New DB tables: `knowledge_triples`, `proactive_preferences`, `learning_examples`
- New settings: `selfLearningEnabled`, `stressDetectionEnabled`, `indexedFolders`, `spokenLanguage`
- Tool count: 90 active (+ 1 Directive-blocked: `delete_files`)
- Tests: 261 green

---

## [1.4.0] — September 2026

### New Features

- **Chess Window** — frameless Electron window with 4 board themes (ELLA/Wood/Night/Green), ambient glow, and particle background
- **3D Chess Pieces** — all 32 pieces as SVG with radial gradients and drop shadows
- **Chess AI** — chess.js generates legal UCI moves → LLM selects; strategic reflection stored in memory after game
- **Chess Commentary** — proactive TTS comment after every E.L.L.A. move
- **Memory Browser** — full UI for searching, filtering, and managing all memories (type filter, full-text search, pagination)
- **Knowledge Graph** — D3 force-directed graph visualizing semantic connections between memories (cosine similarity from embeddings)
- **Document Knowledge Graph** — graph optionally shows document nodes (light blue) with dashed edges to semantically similar memories
- **Hardware Detail Tools** — `get_gpu_info`, `get_ram_details`, `get_drive_details`, `get_audio_devices`, `get_usb_devices`
- **Backup & Restore** — JSON export of all data (memories, rules, alarms, tasks, setups); import with merge or replace mode
- **Auto Re-Index** — worker re-indexes all stored folders daily at 03:00; proactive chat notification on new files
- **Full i18n** — all remaining hardcoded strings replaced with `t()` calls; complete DE/EN coverage

### Technical

- New DB table: `chess_games`
- New API routes: `/api/chess/*`, `/api/backup/*`, `/api/memories/*`
- Tool count: 85 active (+ 1 Directive-blocked: `delete_files`)
- Tests: 224 green

---

## [1.3.0] — September 2026

### New Features

- **Setup Actions** — setups now support arbitrary E.L.L.A. tool calls as ordered steps with optional `delay_ms`; 7 action templates
- **"▶ Now" Button** — `POST /api/setup/run` triggers a setup directly from settings without chat
- **Port Events in Dashboard** — new ports appear live under System Events with process name; orange for unknown process

### Bug Fixes

- WiFi detection now uses `Get-NetConnectionProfile` instead of text-based `netsh` parsing — language-independent
- TCP connections no longer show 0 — PowerShell 5.1 `??` operator incompatibility fixed
- Process name no longer always "Unknown" for network connections — `uint32` vs `int` type conflict fixed

---

## [1.2.0] — August 2026

### New Features

- **Multi-Agent Pipeline** — parallel and sequential pipelines via OpenAI; 2 built-in pipelines: Morning Briefing and System Report
- **Live Streaming** — SSE events per agent (`agent_start`, `agent_chunk`, `agent_tool`, `agent_done`, `pipeline_done`)
- **Multi-Agent Page** — dedicated `/pipeline` page with pipeline cards, live agent cards, setup dropdown, and summary

---

## [1.1.0] — July 2026

### New Features

- **Tool Selector** — ~12 of 85 tools per request; 8 CORE tools always active + 20 lazy groups with DE/EN regex; up to 90% fewer input tokens
- **Token Optimizer** — tool results compressed before context embedding: JSON minify, Base64 strip, array truncation (max 50 entries)
- **Smarter Tool Loop** — context-relevant tools only from round 1

---

## [1.0.0] — June 2026

### Initial Release

- Dual-LLM: Ollama (llama3.1:8b, offline) + OpenAI GPT-4o (optional)
- 85 tools with handlers + audit log
- Rule Engine: Directive → DIRECTIVE_DENY → Deny → Allow
- ML Memory: nomic-embed-text, cosine similarity, 3 types (user/system/note)
- Multi-profile system with PBKDF2+Salt PIN hash
- Wakeword "ella" (openWakeWord + ONNX)
- Kokoro TTS: local neural voice (Node.js, no Python required)
- Multilingual voices: DE/EN/ES/FR
- Outlook + Gmail + Google Calendar integration
- Proactive background worker (60s cycle)
- Clipboard history + pattern recognition
- 6-step onboarding (EULA, Directive, hardware scan, voice, location)
- Homework mode with SHA-256 PIN
- Accessibility: blind mode + deaf mode
- Full i18n DE/EN
- NSIS installer with bundled MariaDB + Ollama + Node.js

---

_E.L.L.A. · Proprietary · All rights reserved_
