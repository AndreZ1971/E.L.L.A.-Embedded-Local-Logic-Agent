# Roadmap — E.L.L.A. Development History & Open Items

As of: v1.5.6 (internal v3.10.0) · 2026-10-27

---

## Completed

| Feature                       | Version   | Description                                                                                 |
| ----------------------------- | --------- | ------------------------------------------------------------------------------------------- |
| Chat end-to-end               | v0.0.3    | OpenAI + Ollama, tool loop with up to 5 rounds                                              |
| Tool-call fix                 | v0.0.3    | `tool_call_id` passed correctly, no more 400 errors                                         |
| Electron desktop app          | v0.0.3    | Native window, minimize to tray                                                             |
| SSE streaming                 | v0.0.4    | Text appears live while LLM responds, tool status display                                   |
| MariaDB session persistence   | v0.0.4    | History in DB, survives API restart, loaded on startup                                      |
| Frameless window + title bar  | v0.0.5    | Custom window without browser chrome, violet title bar, IPC                                 |
| Production build              | v0.0.5    | Vite builds to dist/, Electron loads without dev server                                     |
| API as child process          | v0.0.5    | Electron starts/stops the API automatically, waits for port 3002                            |
| Autostart                     | v0.0.5    | app.setLoginItemSettings, toggle in tray menu, MariaDB auto                                 |
| Dashboard                     | v0.1.0    | Status cards (LLM, Ollama, DB) + disk bars, auto-refresh                                    |
| Settings page                 | v0.1.0    | Provider, model, tools, session limit, OpenAI API key                                       |
| Program management            | v0.1.0    | System scan (Start menu), checkbox list allowed/blocked                                     |
| Voice input                   | v0.1.1    | 3 modes: off / manual / wakeword "ella", submit/cancel words                                |
| Setup shortcuts               | v0.1.1    | load_setup tool, open[] + close[], dynamic tool definitions                                 |
| Homework mode                 | v0.1.2    | PIN kiosk: activate without PIN, deactivate with PIN, SHA-256                               |
| ML memory layer               | v0.1.3    | nomic-embed-text, cosine search, auto extraction, 3 types                                   |
| GPU acceleration              | v0.1.4    | GTX 1060, CUDA 13.0, 14.6 t/s, model fully in VRAM                                          |
| Text-to-speech (TTS)          | v0.1.4    | window.speechSynthesis, configurable voice, MD stripping                                    |
| Bug sprint (10 fixes)         | v0.1.5    | TS errors, tool registry, settings persistence, DB schema                                   |
| Code analysis bug fixes       | v0.1.6    | HomeworkMode in loadSetup, model config, OpenAI tools[], fixes                              |
| enabledTools migration fix    | v0.1.7    | remember/forget/homework_mode added to enabledTools                                         |
| Stability sprint              | v0.2.0    | Schema IF NOT EXISTS, auto-migration, list_running_processes removed                        |
| Rule engine + Directive       | v0.3.0    | Default-deny, rules CRUD, Directive hardcoded, rules tab                                    |
| Proactive monitoring          | v0.4.0    | Background worker, EventBus, SSE push, dashboard feed, toasts                               |
| Onboarding & first start      | v0.4.1    | System scan, 3-step flow, get_system_info tool, app routing                                 |
| Conversational configuration  | v0.5.0    | create_setup/update_setting/create_rule/free_ram + kill switch                              |
| Mail & calendar               | v0.6.0    | read_emails/mark_email/read_calendar/create_appointment, Directive unread-delete            |
| Installer & deployment        | v1.0.0-rc | EULA screen, setup check, nomic pull SSE, electron-builder NSIS installer                   |
| File ops + dictation          | v2.9.0    | search_files, open_file, explore_folder, create_document, dictate_to_document               |
| WoW-tools sprint              | v3.0.0    | list_processes, kill_process, set_volume, clipboard, reminder, vision, write_for_me         |
| Gmail + Google Calendar       | v3.0.0    | OAuth 2.0, read_gmail/mark_gmail/read_google_calendar/create_google_appointment             |
| Music + duplicates            | v3.0.0    | play_music (library search), find_duplicates, list_autostart, compose_email                 |
| Kokoro TTS + user profiles    | v3.1.0    | Local neural voice, PBKDF2+Salt, profile isolation, profile-bound memory                    |
| Task list (MariaDB)           | v3.1.0    | add_task/list_tasks/complete_task/delete_task, persistent to-dos                            |
| Intelligence features         | v3.1.0    | Conversation compression, window context, clipboard patterns, proactive messages            |
| Feedback buttons              | v3.1.0    | Thumbs up/down, DB only, never in LLM context                                               |
| System automation             | v3.2.0    | launch_app, control_window, send_keys, delete_file, manage_service, read_screen             |
| Generic confirm route         | v3.2.0    | /api/confirm for any \_confirmed tools, not just format_drive                               |
| Mouse control                 | v3.3.0    | move_mouse, click_at/confirmed, drag_drop/confirmed — BLOCKED_TITLES                        |
| Shell runner                  | v3.3.0    | run_command/confirmed — 60+ locked patterns, always requires confirmation                   |
| Screen monitor                | v3.3.0    | watch_screen — OCR diff up to 30 s, reports text changes                                    |
| File management               | v3.4.0    | read_file_content, rename_file, copy_file, create_folder — BLOCKED_PREFIXES                 |
| System convenience            | v3.4.0    | toggle_dark_mode, get_battery_status, get_temperatures, get_event_log, get_wifi_info        |
| Media (WinRT)                 | v3.4.0    | control*media (VK_MEDIA*\*), get_now_playing (Windows.Media.Control)                        |
| AI text processing            | v3.4.0    | translate_text, summarize_text — Ollama/OpenAI, same provider logic                         |
| Semantic OCR click            | v3.4.0    | click_element — screenshot → WinRT OCR → 3-pass match → confirm                             |
| AI text correction + style    | v3.5.0    | correct_text, write_in_style — grammar correction and writing style via Ollama/OpenAI       |
| Service management split      | v3.5.0    | list_services + control_service as separate tools (instead of manage_service)               |
| Rules extended to IDs 1–85    | v3.5.0    | Default rules IDs 83–85 added; alarms table + DB v3.5.0                                     |
| Installer stability           | v1.1.0-rc | Worker tick fully async (psAsync), API no longer crashes during model download              |
| ELLA app icon                 | v1.1.0-rc | Favicon as ICO (6 sizes, 16–256 px), installer and taskbar consistent                       |
| Model download banner         | v1.1.0-rc | Download runs as a banner, does not block EULA; ELLA personality during pull                |
| API auto-restart              | v1.1.0-rc | Up to 5 restarts with exponential backoff (3–15 s) on API crash                             |
| Clipboard error suppression   | v1.1.0-rc | PS try/catch + fail counter (max 3), no more stderr spam on restricted access               |
| SSE reconnect after sleep     | v1.1.0-rc | EventSource reconnects automatically after laptop sleep (onerror + visibilitychange)        |
| Multilingual UI               | v1.1.0-rc | i18next DE/EN, language selection as first onboarding screen before EULA                    |
| ModelSelectOverlay            | v3.7.0    | Hardware tier selection before first model download, no more auto-download                  |
| Full i18n                     | v3.7.0    | react-i18next, all UI components DE/EN (Chat, Settings, Dashboard, Onboarding)              |
| Multilingual TTS voices       | v3.8.0    | spokenLanguage (de/en/es/fr), Kokoro + MsEdgeTTS, exclusively female voices                 |
| Onboarding voice selection    | v3.8.3    | 4 female voices selectable in onboarding with preview, saves spokenLanguage                 |
| Stress detection              | v3.9.0    | stress_server.py port 3004, numpy RMS/ZCR/pitch, low/medium/high, opt-in                    |
| Accessibility blind mode      | v3.9.0    | TTS forced, no Markdown, audio tones, aria-live, startup announcement                       |
| Accessibility deaf mode       | v3.9.0    | TTS + mic hidden, visual banner, system prompt without TTS mentions                         |
| Kokoro TTS (Node.js)          | v3.9.1    | kokoro-js npm package, no Python needed for TTS, lazy-loads from HuggingFace Hub            |
| LLM non-gatekeeper            | v3.9.1    | System prompt rule prevents plain-text refusal instead of directive banner                  |
| Smoke tests                   | v3.9.1    | scripts/smoke-test.ps1, 13 end-to-end tests against a live instance                         |
| Token optimization            | v1.1.0    | Tool selector (8 CORE + 20 lazy groups), token optimizer (JSON minify, array truncation)    |
| Multi-agent pipeline          | v1.2.0    | Parallel/sequential pipelines with OpenAI, SSE live streaming per agent                     |
| Setup actions + network       | v1.3.0    | Tool calls as setup steps, port events in dashboard, WiFi/TCP fix                           |
| Chess & visual board          | v1.4.0    | Frameless Electron window, 3D SVG pieces, LLM AI, reflection after game end                 |
| Knowledge graph + memory      | v1.5.0    | Knowledge triples, hybrid recall (cosine + graph), proactive approval memory, self-learning |
| Security patch + cloud gov    | v1.5.1    | Loopback binding, per-start API token, apiAuth middleware, cloudAllowed()/cloudFirst()      |
| Directive hardening + privacy | v1.5.2    | Redacting sensitive data (redact.ts), offline mode, result transparency                     |
| Natural conversation          | v1.5.3    | Stop interrupt (stop words during TTS), follow-up window (8s), echo cancellation            |
| Dictation everywhere          | v1.5.4    | System-wide dictation, Whisper transcription → active window, configurable hotkey           |
| Dictation quality + hotkey    | v1.5.5    | Clipboard preservation during dictation, configurable hotkey without conflicts              |
| HUD mode + widgets            | v1.5.6    | 3 appearances (calm/hud/show), widget system, orb 6 states, About E.L.L.A.                  |
| Website ella-agent.de         | v3.10.0   | Interactive demo website live, chat with OpenAI, Edge-TTS voice output, HUD design          |

---

## Planned

| Feature               | Description                                                                                                                                                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Memory without limits | Vector index directly in the database (MariaDB 11.8 LTS). E.L.L.A. searches all memories and documents during recall instead of only the latest 500 or 2000. Faster for large memories, duplicate detection across the entire memory. |

---

## Open — Priority 1 (high value, Directive-compliant)

| Feature                      | Description                                                             |
| ---------------------------- | ----------------------------------------------------------------------- |
| Browser control              | Chrome/Edge via DevTools Protocol — tabs, navigation, DOM access        |
| Local web search             | Self-hosted SearXNG as DuckDuckGo fallback without external API         |
| ~~Local speech recognition~~ | Done — Xenova/whisper-small local, OpenAI Whisper as fallback (v1.5.0+) |
| Plugin directory             | Tool manifest format so users can register their own tools              |

---

## Open — Priority 2 (quality & stability)

| Feature               | Description                                                               |
| --------------------- | ------------------------------------------------------------------------- |
| Session persistence   | Conversation context survives API restarts (currently: in-session only)   |
| Multilingual UI       | Additional languages (FR, ES, …) + TTS voice follows language selection   |
| Installer improvement | Auto-update channel, delta updates                                        |
| Test coverage         | Integration tests for new v3.x services (fileManager, mediaControl, etc.) |

---

## Not planned (deliberate decision)

| Feature            | Why not                                                                         |
| ------------------ | ------------------------------------------------------------------------------- |
| Cloud hosting      | Local execution is a design principle                                           |
| Multi-user network | User profiles are device-local, no network sharing                              |
| Docker deployment  | Direct Windows integration is the core — Docker abstracts that away             |
| Unrestricted shell | run_command exists — but sandboxed (60+ patterns, always requires confirmation) |
| Camera integration | Surveillance risk — would structurally compromise Prohibition III (surveil)     |
