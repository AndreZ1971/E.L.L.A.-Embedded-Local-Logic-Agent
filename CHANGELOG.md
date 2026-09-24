# Changelog — E.L.L.A.

All notable changes to E.L.L.A. are documented here.

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
