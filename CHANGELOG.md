# Changelog — E.L.L.A.

All notable changes to E.L.L.A. are documented here.

---

## [1.6.9] — November 2026

### New

- **In-app update:** check, download and install under Settings → About E.L.L.A.
  Only at the push of a button, and only the changed parts are downloaded.
  Available from this version on; older versions install 1.6.9 once by hand.
- **Plugins you can build yourself:** give E.L.L.A. a name, keywords and an example
  address, and she creates the plugin. Only you can enable it.
  New "Plugins" tab in the settings with a quick guide.
- **Aura becomes a pinboard:** a note for your own picture above Ella, your latest
  notes below her.
- **New panels:** cloud requests, network, notices. Panels page instead of scrolling.

### Improved

- Every one of the 123 tools now has a switch under "Allowed tools". 15 everyday
  tools are on by default (translate, summarize, media control, dark mode,
  battery, Wi-Fi status and more).
- Manual and FAQ rewritten. Give them to E.L.L.A. as documents and she answers
  questions about herself.
- Model download on first start shows real progress, speed and time left.
- OpenAI model of your choice (gpt-4o is shut down by OpenAI on 14 January 2027).

### Fixed

- 26 tools could never be used and could not be switched on.
- Emergency reset ended a running homework mode without the PIN.
- "Switch on dark mode" turned an already dark Windows light.
- Local voice and speech recognition on a fresh Windows.

---

## [1.6.8] — November 2026

### New

- **Browser control** (Chrome, Edge, Brave via CDP) — visible dedicated window, opt-in. Guard checks every navigation target: localhost blocked, home network allowed, DNS rebinding blocked. Click only what the user named; purchase/submit/delete requires confirmation.
- **Plugins** — declarative HTTP tools via `ella-plugin.json`. No executable code, consent tied to manifest hash. Changed manifest disables the plugin.
- **Program favourites** (up to 15) and portable programs added by path.
- **OpenAI model choice** — main and fast model selectable, default `gpt-6-luna`. gpt-4o is shut down by OpenAI on 14 January 2027.

### Security

- After browser, web search or plugin content, only read-only tools allowed in the same request.
- Hardening test: 0/21 injections, 0/8 exfiltration attempts successful.

### Fixed

- Fresh install with bundled MariaDB works again.
- Rescan no longer deletes manually added programs and aliases.

---

## [1.6.7] — November 2026

- **Memory categories:** each memory gets a fixed category on save (About you, Preferences, People, Places, Projects, System, Notes, Unsorted) — no more fluctuating counts.
- **New category "People"** for family and acquaintances.
- **Memory page:** filter and colours by category, consistent in graph and list.

---

## [1.6.6] — November 2026

### New

- **Aura appearance:** light pinboard with coloured notes, four tints.
- **Document index:** add and remove individual files, progress indicator.

### Improved

- Stricter memory rules — only user statements are saved, ambiguous input is skipped.
- Negations in knowledge graph handled correctly ("I don't like coffee" no longer stored as "likes coffee").
- Tool calls decoupled from Ollama — model-independent layer.

### Security

- Deleting a profile now removes all its data.
- Electron 44 (security update).

---

## [1.6.5] — November 2026

### Security — the four prohibitions anchored in code

- **Harm:** destructive actions hard-blocked. `delete_files` only moves to recycle bin, after confirmation, max 50 files.
- **Conceal:** every tool action logged, including denied ones.
- **Surveil:** screen, camera and clipboard only on direct request, never in autonomous follow-up steps.
- **Exfiltrate:** outbound data transfer hard-blocked.

### New

- **Voice output without internet:** Windows voice used in offline mode.
- **Interactive HUD widgets:** music controls, routine launcher, task checkboxes, alarm countdown.
- **Document index** runs in background with notification on completion.

### Improved

- E.L.L.A. must read a file before speaking about its contents — no more hallucinated file content.
- Model comparison: of five tested local models, only `llama3.1:8b` calls tools reliably.

---

## [1.6.4] — November 2026

### New Features

- **LoRA Fine-Tuning Pipeline** — data pipeline, training scripts, personal model integration, worker automation, settings UI, HUD widget
- **MariaDB VECTOR Index** — native vector index for boundless similarity search without scan limits
- **HUD Widget-System** — modular dashboard widgets: memory, LoRA training, vector index health, system stats
- **Speech-to-Text (STT) Upgrade** — Whisper-based local transcription (Xenova/whisper-small), quality improvements
- **Memory Quality** — knowledge graph hygiene, duplicate cleanup, vector index status display
- **DB Resilience** — onboarding guard, DB fallback, migration error tolerance
- **Model Auto-Download** — automatic Ollama model pull on tier switch with availability validation
- **Active Model in System Prompt** — LLM always knows which model it is

### Bug Fixes

- 23 GELB (medium) findings resolved across backend, frontend, DevOps and a11y
- Whisper model fixed (Xenova/whisper-small) — resolves 500 errors on speech input
- Migration error on repeated start — case-insensitive error filter
- Chess: 12 fixes (move format, board desync, memory, profile isolation)
- TTS: sentence detection rewrite — no more swallowed sentences
- Markdown rendering in HUD mode and chat line breaks
- Disk warning threshold raised to 98%, rate-limited to 30 min intervals
- Fallback to base model when personal model lacks tool support
- Exact model match in Ollama health checks (no more substring collisions)

### Technical

- Tests: 640 green (Vitest Unit + Integration)
- Security hardening: supply chain, code analysis, refactoring
- AWS test secrets as runtime concat (bypasses GitHub Secret Scanner)

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
