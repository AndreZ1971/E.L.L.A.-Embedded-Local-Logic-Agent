# Development History

This document describes chronologically what was built in each version and — more importantly — **why** it was built that way. Decisions should remain traceable when context fades.

---

## v3.9.1 — 28.06.2026 — Kokoro TTS as Node.js Service, LLM Non-Gatekeeper, Smoke Tests

**Goal:** Move Kokoro TTS entirely off Python — use the `kokoro-js` npm package directly inside the API. Also: an architecture fix that prevented the LLM from bypassing directive rejections with a plain text response.

**Kokoro TTS — Node.js port (`services/kokoro.ts`):**

The original `tts_server.py` (Python Flask, port 3003) is **deprecated** as a TTS service and replaced by `services/kokoro.ts`. The new implementation lazy-loads the ONNX model (q8) at API startup via the `kokoro-js` package from HuggingFace Hub into `%APPDATA%/ELLA/kokoro-cache/`. The installer bundles an offline fallback cache at `vendor/kokoro/`. No Python process is needed for TTS anymore — Node.js only.

Fallback chain: Kokoro (local, ONNX) → MsEdgeTTS (Edge Neural, online). `tts.ts` now returns `{ buffer, contentType }`; the content type is either `audio/wav` (Kokoro) or `audio/mpeg` (MsEdgeTTS) — chosen dynamically based on which engine is active.

Voice map (unchanged from v3.8.x):

| Language | Kokoro voice | MsEdgeTTS voice |
| -------- | ------------ | --------------- |
| German   | `af_sarah`   | Katja           |
| English  | `bf_emma`    | Sonia           |
| Spanish  | `ef_dora`    | Elvira          |
| French   | `ff_siwis`   | Denise          |

`GET /api/health` now includes the flag `kokoro_ready: boolean` — the frontend and smoke tests can check whether the local voice is ready.

**Python processes (as of v3.9.1):**

- `wakeword_server.py` — still active (wakeword detection via openWakeWord + ONNX)
- `stress_server.py` (port 3004) — still active (stress analysis, opt-in)
- `tts_server.py` — **deprecated**, no longer started

**Directive fix — LLM as non-gatekeeper:**

Previous problem: for requests that sound "dangerous" (e.g. "format C:"), the LLM sometimes refused in plain text instead of calling the tool and letting the directive handle the rejection. The red directive badge would then not appear.

Fix: system prompt rule `"CRITICAL — YOU ARE NOT THE GATEKEEPER"` — the LLM must always call the tool, even if its training considers the operation dangerous. Security lives in the handler and the rule engine, not in the LLM's judgment. Additionally, all security-related hints were removed from the `format_drive` tool description so the model does not refuse based on the description alone.

**Homework mode fixes:**

- SSE event `homework_status` is now also sent mid-stream when the mode is active — the frontend can react immediately
- System prompt explicitly instructs the LLM never to ask the user for their PIN in chat (PIN entry only via the dedicated UI field)

**Smoke tests (`scripts/smoke-test.ps1`):**

13 end-to-end tests that run automatically against a live ELLA instance:

- `/api/health` (including the `kokoro_ready` flag)
- Homework mode activation and status
- Ollama reachability
- Chat endpoint + tool call
- License status

**Tests:** 224 — all green.

---

## v3.9.0 — 20.06.2026 — Stress Detection, Accessibility, Mic Fix

**Goal:** Three independent areas: optional voice stress analysis, two accessibility modes, and a long-standing mic button bug.

**Stress detection (`scripts/stress_server.py`, port 3004):**

A separate Python process analyzes the raw data of each WAV recording in parallel with Whisper transcription:

- **RMS energy:** loudness proxy
- **Zero-crossing rate (ZCR):** frequency estimate without FFT
- **Pitch autocorrelation:** fundamental frequency extraction

Result: `low / medium / high`. On `medium`, a subtle hint is injected into the system prompt. On `high`, an explicit note appears in the memory context ("voice sounds severely stressed — respond with empathy and calm").

The feature is disabled by default. Enable it at: **Settings → Voice → Enable voice analysis**. When the server is not running, chat works normally (graceful degradation). No audio data leaves the device.

**Why numpy-only:** `librosa` would pull in native binaries (LLVM, SoundFile) and significantly increase the installer size. RMS + ZCR + autocorrelation are implementable with `numpy` alone and sufficiently accurate for this use case.

**Accessibility — blind mode (`accessibilityMode === "blind"`):**

- TTS is forced — cannot be toggled off manually
- System prompt without Markdown (no `**bold**`, no list syntax)
- Audio tones as state feedback: high tone (880 Hz) = microphone active, low tone (440 Hz) = response ready
- `aria-live="polite"` on the message container
- `aria-label` on all buttons and the input field
- Welcome announcement when the app loads

**Accessibility — deaf mode (`accessibilityMode === "deaf"`):**

- TTS button and microphone button fully hidden
- Visual deaf banner in the chat header
- System prompt without TTS mentions (no "I will read this aloud")

**Mic button fix:**

`startRecording` was implemented synchronously. `getUserMedia` returns a Promise — when permission was denied, the rejection was not caught and appeared as an unhandled rejection in the console with no user feedback. Fix: `async/await` + `try/catch`, error text now appears as a toast in the chat.

**Tests:** 224 — all green. Default rules IDs 1–85.

---

## v3.8.3 — June 2026 — Onboarding Voice Selection

**Goal:** Embed voice selection directly in onboarding — with preview in each language.

- Onboarding step "Voice": four female voices selectable with a preview button
- Preview plays a short sentence in the respective language (DE/EN/ES/FR)
- Selection is saved as the `spokenLanguage` setting when the step is confirmed
- Exclusively female voices in onboarding (af_sarah, bf_emma, ef_dora, ff_siwis)

---

## v3.8.2 — June 2026 — TTS Fixes

- Hardcoded voice removed from `Chat.tsx` — `ttsVoice` setting is now correctly read from settings
- Voice dropdown in Settings shows only the voices matching the selected `spokenLanguage`

---

## v3.8.1 — June 2026 — Documentation Update

Roadmap and positioning document updated. Multilingual TTS product positioning finalized.

---

## v3.8.0 — 19.06.2026 — Multilingual TTS Voices

**Goal:** ELLA speaks in the language the user selects — independently of the UI language.

**New setting `spokenLanguage`** (de/en/es/fr): automatically selects the matching female voice.

| Language | Kokoro (offline) | MsEdgeTTS (online) |
| -------- | ---------------- | ------------------ |
| German   | `af_sarah`       | Katja              |
| English  | `bf_emma`        | Sonia              |
| Spanish  | `ef_dora`        | Elvira             |
| French   | `ff_siwis`       | Denise             |

`synthesize()` in `tts.ts` reads `spokenLanguage` and selects the voice dynamically. UI language (DE/EN via i18n) and spoken language are intentionally separate — a user can have ELLA speak English while the UI stays in German.

---

## v3.7.1 — June 2026 — Documentation Update

Roadmap updated. Multilingual voices established as the next milestone.

---

## v3.7.0 — 18.06.2026 — ModelSelectOverlay, Full i18n, License Link

**Goal:** No unexpected 5 GB download on first start. Full translation of all UI components. License website linked.

**ModelSelectOverlay:**

Before the first Ollama model download, an overlay appears with a hardware tier selection:

- **Small** — 8B models (llama3.1:8b), recommended from 8 GB RAM
- **Standard** — 13B models, recommended from 16 GB RAM + GPU
- **Large** — 70B models, high-end hardware only

`main.ts` pauses `ensureOllamaModel()` via IPC until the user has made a selection. No model is downloaded without an explicit decision.

**Full i18n:**

`react-i18next` with `apps/web/src/i18n/de.json` and `en.json`. All UI components fully translated: App, Chat, Settings (all tabs including the Rules tab), Dashboard, Onboarding, Activation page. Language selection on the first onboarding screen.

**License link:**

`ella-agent.de` is linked on the activation page.

---

## v3.6.0 — June 2026 — Model Tier Selection, Always-On Voice

**Goal:** Hardware-appropriate model selection, continuous voice recognition.

- **Model tier selection** with download progress display in Settings
- **Always-on voice (VAD + Whisper):** Voice activity detection continuously enables recording; Whisper transcribes locally
- `ollamaService.ts` refactored: `pullModelIfNeeded()` and `modelPullProgress` as separate exports
- Navigation redirect loop in `App.tsx` fixed (multiple redirects on race condition)

---

## v3.5.4 — June 2026 — list_folder, TTS Fixes, Settings Layout

- New tool `list_folder` — list folder contents (name, type, size, date)
- TTS overlap fix: `currentAudioRef` stops active playback before a new TTS clip starts
- Settings layout fix: tabs scroll correctly on small windows

---

## v3.5.3 — June 2026 — Windows Search Index as Primary for Music

- `search_files` now uses the Windows Search Index as the primary path (very fast, no timeout)
- Falls back to `Get-ChildItem` when a drive is not indexed
- Resolves the timeout issue for large music libraries on non-indexed drives

---

## v3.5.2 — June 2026 — Per-Session Mutex

- Race condition on parallel chat requests resolved
- A mutex is held per session ID — a second request waits until the first is complete
- Prevents duplicate tool executions and inconsistent conversation histories

---

## v3.5.1 — June 2026 — Whisper Speech Recognition, Music Fix

- `whisper-small` via Ollama integrated as a local STT alternative
- OpenAI Whisper API available as a cloud option
- Music search: fix for incorrect path escaping with special characters in filenames

---

## v3.5.0 — 09.06.2026 — Favicon, TTS Overlap Fix, Markdown, Tool Log, Offline Banner, Comfort

**Goal:** Six independent improvements that together meaningfully improve the everyday workflow.

**Favicon:** SVG design "E." (violet, no background) as browser favicon. Electron icon: RGBA PNG with transparent corners — no white pixels in the tray or the Task Manager tab.

**TTS overlap fix:** When ELLA responded while a previous TTS output was still playing, the new response overlapped. Fix: `currentAudioRef.current?.pause()` + `currentAudioRef.current.src = ""` before each new `synthesize()` call.

**Markdown rendering:** Chat responses are rendered as HTML via `marked.js`. Code blocks, lists, bold text — all displayed correctly. TTS-aware system prompt: ELLA is instructed not to use Markdown in spoken responses.

**Tool-log chips:** Chips showing the tools used appear below each assistant response (63 labels). The user sees at a glance what ELLA did in the background.

**Ollama offline banner:** `GET /api/health` is polled every 30 seconds. When Ollama is unreachable, an orange banner appears in the chat header. The `OllamaBanner` component disappears automatically when Ollama responds again.

**`set_volume` DLL cache:** The first call took ~2 seconds because the audio DLL was cold-loaded. Fix: load the DLL once at API startup and cache it in a module variable — subsequent calls take ~0.5 seconds.

**`search_files` via Windows Search Index:** Primary search via `WHERE System.FileName LIKE '%query%'` in the Windows Search Index database. Drastically faster than `Get-ChildItem` on large drives.

**Feedback → memory:** Thumbs up/down → `POST /api/feedback` → Ollama extracts a user preference as a natural-language sentence → stored as a `user` memory. Example: thumbs down on a long response → ELLA notes "User prefers short responses".

**111-tool system prompt:** All 111 active tools are explained to the LLM in the system prompt. Prevents hallucinations on tool names.

**Tests:** 205 → 224 (19 new tests for v3.5.0 features). Default rules IDs 1–85 (IDs 83–85 added, `alarms` table).

---

## v3.4.0 — 07.06.2026 — File Management, System Comfort, Media, AI Text, OCR Click

**Goal:** 14 new tools in four categories — complete file management, system comfort functions, media control via WinRT, AI-assisted text processing, and semantic screen click.

**New services:** `fileManager.ts`, `mediaControl.ts`, `systemComfort.ts`, `textProcessing.ts` (new), `ocr.ts` (extended with `readScreenOcrElements()`).

**14 new tools:**

| Tool                 | Service            | Description                                                 |
| -------------------- | ------------------ | ----------------------------------------------------------- |
| `read_file_content`  | fileManager        | Read file content (BLOCKED_PREFIXES for system directories) |
| `rename_file`        | fileManager        | Rename with \_confirmed bypass                              |
| `copy_file`          | fileManager        | Copy with \_confirmed bypass                                |
| `create_folder`      | fileManager        | Create folder                                               |
| `toggle_dark_mode`   | systemComfort      | Dark mode via PowerShell registry key                       |
| `get_battery_status` | systemComfort      | Battery status via Get-CimInstance                          |
| `get_temperatures`   | systemComfort      | CPU/GPU temperatures via Get-CimInstance MSAcpi_ThermalZone |
| `get_event_log`      | systemComfort      | Windows error log (Application/System)                      |
| `get_wifi_info`      | systemComfort      | Network name, signal, IP via netsh/ipconfig                 |
| `control_media`      | mediaControl       | VK_MEDIA_PLAY_PAUSE / NEXT / PREV / VOLUME via P/Invoke     |
| `get_now_playing`    | mediaControl       | Windows.Media.Control WinRT API — title, artist, app        |
| `translate_text`     | textProcessing     | Ollama/OpenAI, same provider logic as chat                  |
| `summarize_text`     | textProcessing     | Ollama/OpenAI, same provider logic as chat                  |
| `click_element`      | ocr + mouseControl | Screenshot → WinRT OCR → 3-pass match → confirm → click     |

**BLOCKED_PREFIXES** (file access blocked): `c:\windows`, `c:\program files`, `c:\program files (x86)`, `c:\programdata\microsoft`, `c:\users\default`.

**click_element 3-pass matching:** Exact match → substring → lowercase fuzzy. If no match found: error message with "not found on screen".

**Tests:** 196 tests total (29 new suites for v3.4.0 tools) — all green. Default rules IDs 1–82.

---

## v3.3.0 — June 2026 — Mouse Control, Shell Runner, Screen Monitor

**Goal:** Three dangerous-but-necessary capabilities with maximum security constraints: mouse control, command line, and passive screen monitoring.

**Mouse Control (`mouseControl.ts`):**

- `move_mouse` — SetCursorPos via P/Invoke, coordinate validation against screen boundaries
- `click_at` / `click_at_confirmed` — mouse_event LEFT_DOWN + LEFT_UP, always requires confirmation
- `drag_drop` / `drag_drop_confirmed` — drag sequence with interpolation

**BLOCKED_TITLES:** Clicks in windows with titles containing 1Password, KeePass, Bitwarden, LastPass, DasHLane, "Passwort", "Password", "Bank", "Banking", "PayPal", "Kreditkarte" are blocked — directive surveil/exfiltrate.

**Shell Runner (`shellRunner.ts`):**

- `run_command` / `run_command_confirmed` — always `_confirmed`, no direct execution
- 60+ blocked patterns: format, del /s, Remove-Item -Recurse, net user add, reg delete, takeown, cipher, Invoke-WebRequest with -OutFile, Base64 decode execution, etc.
- Whitelist principle: anything not explicitly allowed → rejected

**Screen Monitor (`ocr.ts`):**

- `watch_screen` — screenshot diff loop up to 30s, WinRT OCR
- Reports new text content via proactive_message SSE event
- Always opt-in: user must explicitly request it

**Tests:** 167 tests — all green. Default rules IDs 1–73.

---

## v3.2.0 — June 2026 — System Automation

**Goal:** ELLA gains direct Windows automation capabilities — launching apps, controlling windows, sending keystrokes, managing services, reading the screen.

**10 new tools:**

| Tool                    | Description                                               |
| ----------------------- | --------------------------------------------------------- |
| `launch_app`            | Start app by process name or path                         |
| `control_window`        | Minimize / Maximize / Restore / Close via Windows API     |
| `send_keys`             | Send keystrokes to the active window (SendKeys)           |
| `delete_file`           | Move to recycle bin via VisualBasic.FileSystem.DeleteFile |
| `manage_service`        | Start/stop/status Windows services (sc.exe, whitelist)    |
| `read_screen`           | Screenshot → WinRT OCR offline → return text              |
| `find_window`           | Search running windows by title/process name              |
| `get_active_window`     | GetForegroundWindow → title + process name                |
| `list_services`         | List all running Windows services                         |
| `get_clipboard_history` | Clipboard history (last 20 entries)                       |

**Generic confirm route:** `/api/confirm` replaces the specific `format_drive` confirm — works for all `_confirmed` tools. `name.endsWith("_confirmed")` skips the `enabledTools` check.

**Tests:** 156 tests — all green. Default rules IDs 1–67.

---

## v3.1.0 — June 2026 — Kokoro TTS, User Profiles, Intelligence Features

**Goal:** Three major areas: better voice output, multi-user support, and intelligence features that make ELLA more autonomous.

**Kokoro TTS (`scripts/tts_server.py`):**

- Python Flask server, port 3003, exclusively 127.0.0.1 (no network access)
- `kokoro-onnx` — neural voice, local, fully offline (EN/FR/ES; German uses Edge TTS via internet)
- Fallback to Windows voice when Kokoro is unavailable
- Proactive alerts and device events are read aloud

**User profiles (`services/profiles.ts`, `routes/profiles.ts`):**

- PBKDF2 + Salt, 100,000 iterations, SHA-512
- Profile-bound memory: `memories.profile_id`, `sessions.profile_id`
- Default profile "Standard" created automatically on first start
- PIN-protected profiles: switching profiles requires PIN entry

**Task list:** `add_task`, `list_tasks`, `complete_task`, `delete_task` — persistent TODOs in MariaDB (`tasks` table), sorted by priority and due date.

**Intelligence features:**

- **Conversation compression** (`sessionCompressor.ts`): From 15 messages onward → the oldest 10 are summarized via Ollama. Ollama-only, no cloud contact.
- **Window context** (`windowContext.ts`): `GetForegroundWindow`, title filtered (password managers, banking), opt-in, Ollama-only.
- **Clipboard pattern recognition**: IBAN, tracking number, phone, URL, email → proactive suggestion.
- **Proactive messages**: SSE `proactive_message` event — ELLA writes into the chat on its own initiative.
- **Feedback buttons**: Thumbs up/down under each reply, DB-only (`user_feedback`), never in LLM context.

**DB changes:** New tables `profiles`, `tasks`, `user_feedback`. ALTER on `memories` and `sessions` (profile_id column).

**Tests:** 132 tests — all green.

---

## v3.0.0 — June 2026 — WoW Tools Sprint, Gmail, Music, Duplicates

**Goal:** E.L.L.A. becomes a fully-featured daily productivity assistant. All "World of Work" functions in one sprint.

**WoW tools (14 new tools):**

| Tool              | Description                                             |
| ----------------- | ------------------------------------------------------- |
| `list_processes`  | Process list sorted by RAM/CPU usage                    |
| `kill_process`    | Terminate process (system-critical processes blocked)   |
| `set_volume`      | System volume 0–100% via NirCmd                         |
| `get_clipboard`   | Read current clipboard content                          |
| `set_clipboard`   | Write text to clipboard                                 |
| `set_reminder`    | Windows Task Scheduler — `schtasks /Create`             |
| `list_reminders`  | All ELLA reminders from Task Scheduler                  |
| `delete_reminder` | Delete reminder by ID                                   |
| `take_screenshot` | GDI+ screenshot → GPT-4o vision analysis                |
| `write_for_me`    | Style profile from email history → text in user's style |
| `find_duplicates` | Hash-based duplicate search on configured drives        |
| `list_autostart`  | Autostart entries from registry + Task Scheduler        |
| `compose_email`   | Create Outlook draft (does not send automatically)      |
| `play_music`      | Search music library and open media player              |

**Gmail + Google Calendar via OAuth 2.0:** `read_gmail`, `mark_gmail`, `read_google_calendar`, `create_google_appointment` — token stored locally, never shared.

**Background worker extended:** PnP events (USB devices), ARP scan (new network devices), TCP connections, firewall status, WiFi DNS monitoring.

**Onboarding:** 6-step flow — EULA, name, directive, hardware scan, voice, location.

**System Tray:** Typed balloon alerts (`warning`/`error`/`info`/`device`) with severity sound.

---

## v2.9.0 — June 2026 — File Ops + Dictation + Directive UI

**Goal:** E.L.L.A. gains access to the file system and can dictate into open Word documents. Also: red badge in chat on directive denial.

**File tools:**

| Tool                  | Description                                               |
| --------------------- | --------------------------------------------------------- |
| `search_files`        | Recursive file search by name/extension/drive             |
| `open_file`           | Open file with default program (incl. Word cursor-to-end) |
| `explore_folder`      | Open folder in Explorer                                   |
| `create_document`     | Create new Word document (.docx) or TXT file              |
| `dictate_to_document` | Dictate text into open Word document + AI correction      |

**Directive Denial UI:** When the rule engine or directive rejects a tool call, a red badge with the rejection reason appears in the chat. The user sees immediately why ELLA did not act.

**`open_file` with Word cursor-to-end:** Opens `.docx` files via COM automation and automatically positions the cursor at the end of the document — immediately ready for dictation.

**`dictate_to_document`:** AI correction via Ollama/OpenAI — spelling, grammar, punctuation — before the text is inserted into Word.

---

## v1.0.0-rc — 28.05.2026 — Installer & Deployment

**Goal:** E.L.L.A. becomes installable. NSIS installer for Windows, EULA displayed on first start, automatic dependency check before first chat.

---

### EULA Screen (`pages/eula/Eula.tsx`)

**What:** Full-screen page on the very first start. Five points: local principle, OpenAI notice, system access, immutable boundary (unread emails), responsibility. Checkbox + "Confirm and continue →" button.

**Gate logic in `App.tsx`:** `GET /api/settings` on mount reads `eulaAccepted`. As long as `false` → hard redirect to `/eula` regardless of which route is called. Cannot be bypassed by entering a URL directly.

**Persistence:** `PUT /api/settings { eulaAccepted: true }` → `settings.json`. The value is written once and never reset (not even by emergency reset).

**API error fallback:** If the API is unreachable at startup, `App.tsx` sets both flags to `true` — the app starts normally. This prevents an API error from permanently blocking the app.

---

### Setup Screen (`pages/setup/Setup.tsx`)

**What:** After the EULA, a one-time check is performed to verify all dependencies are present. Three checks: MariaDB (implicitly OK if API is running), Ollama (HTTP ping on `/api/tags`), nomic-embed-text (model name in list).

**`GET /api/setup/status`:** 3-second timeout via `AbortController`. Returns `{ ollama, nomic, mariadb: true, allOk }`.

**nomic pull via SSE:** "Download now" button → `POST /api/setup/pull-nomic` → backend spawns `ollama pull nomic-embed-text` → stdout/stderr are streamed line by line as `{ text: "..." }` SSE events → frontend shows scrollable monospace log. On completion: `{ done: true, success: boolean }`. On client disconnect the `ollama` process is killed.

**"Continue anyway →":** The button is always active — setup never blocks. The user can download the embedding model later if they don't need offline memory immediately.

**Redirect after setup:** `GET /api/onboarding/status` → if `complete: true` go directly to chat, otherwise to onboarding. Cleanly separates setup logic from the onboarding flow.

---

### Routing Overhaul (`App.tsx`)

**Full-screen mode:** EULA, setup, and onboarding render without the sidebar. Detected via `isFullscreen` flag (`path === "/eula" || "/setup" || "/onboarding"`). Prevents a layout flash when the user is not yet in "normal" mode.

**Simplified boot check:** Instead of two separate fetches (`/api/settings` + `/api/onboarding/status`), only `GET /api/settings` is called on mount — delivers `eulaAccepted` and `onboardingComplete` in a single call.

---

### electron-builder NSIS Configuration (`apps/desktop/package.json`)

**What:** `electron-builder --win nsis` produces a Windows installer (`dist-installer/`).

**`asar: false`:** The app code is not packed into an `.asar` archive. Required because `extraResources` places the API and web builds alongside `app/` and the main process references them via `path.join(app.getAppPath(), "../api")` — this relative navigation only works with an unpacked directory structure.

**`extraResources` paths:** Resolved relative to `apps/desktop/` (`../../apps/api/dist` → repo root). In the installed package they land at `resources/api/dist` and `resources/web/dist`. Matches the path calculation in `main.ts`.

**NSIS options:** `oneClick: false` (no single-click install), `allowToChangeInstallationDirectory: true`, desktop and start menu shortcuts, `deleteAppDataOnUninstall: false` (user data is preserved on uninstall — `settings.json`, reminders, sessions).

**`dist` script:** `"dist": "node build-main.mjs && electron-builder --win nsis"` — builds the main process before packaging.

---

## v0.6.0 — 28.05.2026 — Mail & Calendar

**Goal:** E.L.L.A. gains access to local mail and calendar data. Local only. In the conversation only.

---

### Mail Integration (`services/mail.ts`)

**Outlook via COM automation:** PowerShell `New-Object -ComObject Outlook.Application` — no npm package, no external service. `Items.Sort('[ReceivedTime]', $true)` ensures the newest emails come first. Timeout 15 seconds, because Outlook does a cold start on first access.

**Thunderbird as readonly fallback:** Finds profiles under `%APPDATA%\Thunderbird\Profiles`, recursively searches for `Inbox` files (mbox format, max 5 MB from the end of each file — new messages are appended to the end). Reads `X-Mozilla-Status` header: bit 0 = read (0x0001), bit 3 = deleted (0x0008). MIME encoded words (`=?UTF-8?B?...?=`) are decoded.

**Fallback cascade:** Outlook available → Outlook. Thunderbird profiles present → Thunderbird. Both missing → clear error message.

**`markEmail(id, action)`:** Outlook only (COM write access). Actions: `read` (UnRead=false), `spam` (junk folder 23), `archive` (archive folder 46, fallback: deleted items 3), `delete`. Directive check directly in the PowerShell script: unread email + action=delete → JSON flag `directive:true` returned, no deletion.

---

### Directive — Deleting Unread Emails: NEVER

The directive is enforced at two levels:

1. **PowerShell script:** checks `$item.UnRead` before executing delete, returns `{"directive":true}`
2. **executor.ts `mark_email` handler:** checks `result.directive` and returns error with "Directive:" prefix — distinguishable from normal errors

No rule can override this — the check is placed before the rule engine.

---

### Calendar Integration (`services/calendar.ts`)

**Outlook COM:** `GetDefaultFolder(9)` = calendar. `IncludeRecurrences = $true` + `Restrict()` filter for time-based queries — otherwise recurring appointments only return the first entry.

**`readCalendar(days)`:** Appointments for the next N days (default: 2 = today + tomorrow), date filter via Outlook DASL syntax `[Start] >= 'MM/dd/yyyy HH:mm'`.

**`createAppointment(subject, start, end, location?)`:** `CreateItem(1)` = olAppointmentItem. `[DateTime]::Parse()` in PowerShell for flexible date input from the LLM.

---

### Four new tools

| Tool                 | Directive             | Seed rule |
| -------------------- | --------------------- | --------- |
| `read_emails`        | —                     | ID 13     |
| `mark_email`         | delete_unread = NEVER | ID 14     |
| `read_calendar`      | —                     | ID 15     |
| `create_appointment` | —                     | ID 16     |

**ML learning:** `trackToolUsage` after every successful tool call — E.L.L.A. learns which mail/calendar actions are used frequently.

---

## v0.5.0 — 27.05.2026 — Conversational Configuration

**Goal:** E.L.L.A. can configure itself through conversation — creating setups, changing settings, creating new rules, freeing RAM. Also: an emergency switch that safely resets all AI settings.

---

### Four new conversation tools

**`create_setup`** — The user can define a new setup by voice or text: "Create a setup called 'Evening' that opens Netflix and Spotify and closes Chrome." The tool checks the name for empty string, generates a UUID as ID, and saves the setup via `saveSettings`. Default allow rule ID 9 (INSERT IGNORE).

**`update_setting`** — Changes a setting directly in conversation: "Switch to the Ollama provider" or "Set the session limit to 60". Two security layers: an `ALLOWED` set (only `provider`, `ollamaModel`, `voiceMode`, `sessionLimit`, `ttsEnabled`, `ttsVoice`) and a `BLOCKED` set (everything security-relevant). Number and boolean values are converted from the string parameter. Default allow rule ID 10.

**`create_rule`** — Creates a new rule engine rule: "Allow clean_temp when the time is after 10 PM." Parameters: name, tool_name, trigger (default "always"), action (allow/deny). Calls `createRuleInDb()` from `services/rules.ts`. Default allow rule ID 11.

**`free_ram`** — Frees RAM via PowerShell `[System.GC]::Collect()`. Measures `os.freemem()` before and after the action and reports the difference in MB. Default allow rule ID 12.

---

### Emergency Reset

New endpoint `POST /api/settings/emergency-reset`. Resets: `provider`, `ollamaModel`, `enabledTools`, `voiceMode`, `ttsEnabled`, `sessionLimit`. Sets `emergencyResetAt` to the current timestamp (ISO 8601). Preserves: `apps`, `setups`, `homeworkMode`, `openaiApiKey`, `onboardingComplete`.

**Why deliberately not a full reset:** Apps and setups are configured manually by the user — they shouldn't be lost with a single click. PIN and homework mode apps relate to parental controls. Only the AI configuration (provider, model, tools) is reset — these are the fields that can end up in an unusable state through experimental self-configuration.

**Settings UI:** "Emergency reset" button in the settings header. Click shows confirmation dialog. After success, a yellow banner with a timestamp is shown until the next save.

---

### Technical Details

- `update_setting` tool parameter `value` has `type: "string"` — the LLM converts to string, the handler converts back
- `CONVERSATION_TOOLS` + `SYSTEM_INFO_TOOL` integrated into `buildToolDefinitions`
- `OllamaTool.parameters.properties` extended with `items?: { type: string }` (array parameter for `create_setup`)
- All four tools in `ToolName` union in `packages/shared`

---

## v0.4.1 — 27.05.2026 — Onboarding & First Start

**Goal:** E.L.L.A. learns about the system on first start and begins the dialogue.

---

### First-Run Detection

`onboardingComplete: boolean` in settings (default: `false`). `App.tsx` checks on start via `GET /api/onboarding/status` — if the value is `false`, immediately redirects to `/onboarding`. The onboarding page renders without sidebar as a full-screen overlay. After completion it navigates to `/chat`.

**Why checked client-side:** The status lives in `settings.json` — no separate DB state needed. API error during check → onboarding is skipped, app starts normally.

---

### System Scan (`services/systemScan.ts`)

PowerShell scan via `wmic`: CPU name, GPU name (VideoController), computer name. RAM from Node.js `os.totalmem()`. All four values are saved as `system` memories. The scan runs only once during onboarding — after that `get_system_info` reads from the stored memories.

---

### Onboarding Flow (3 steps)

- **Step 1:** Welcome with computer name, "Learn about system" button starts scan
- **Step 2:** Scan result (CPU/GPU/RAM) + name input ("What should I call you?")
- **Step 3:** Confirmation + "Let's go →" button → `POST /api/onboarding/complete`

"Skip" is visible on every step — onboarding never blocks.

---

### `get_system_info` Tool

New tool in `ToolName`, `definitions.ts`, `executor.ts`. Returns live-scanned hardware + all stored `system` memories. Default allow rule (ID 8) per `INSERT IGNORE` in the migration.

---

## v0.4.0 — 27.05.2026 — Proactive Monitoring

**Goal:** E.L.L.A. monitors the system in the background and reports issues without waiting for a chat command.

---

### Architecture Decision: EventBus + SSE instead of Polling

**Problem:** Dashboard and chat previously retrieved data manually (30s interval). Proactive alerts were not possible — the worker needs to push to the frontend, not the other way around.

**Solution:** Central `EventBus` (Node.js `EventEmitter`) as an internal broadcast channel. Worker writes events to DB and simultaneously pushes to the bus. SSE endpoint forwards bus events directly to connected HTTP clients. A single client connection is sufficient for true live data.

**Why EventEmitter instead of DB polling:** DB polling in the frontend would create latency and load. EventEmitter is synchronous within the process, zero overhead, no race conditions.

---

### Background Worker (`services/worker.ts`)

Runs every 60 seconds (configurable via `WORKER_INTERVAL_MS`). Collects:

- **Disk C:, E:, Z:** via `wmic` — writes `disk` event per drive
- **RAM:** via Node.js `os` module — writes `ram` event
- **Ollama:** HTTP ping with 3s timeout — writes `ollama` event

Additional alert logic:

- Disk usage ≥ `DISK_ALERT_THRESHOLD` (default 85%) → `alert` event with `severity: "warning"`
- Ollama failure (first tick after OK) → `alert` event with `severity: "error"`
- `ollamaWasDown` flag prevents alert spam during persistent outage

First tick runs immediately on start (`tick()` before `setInterval`).

---

### SSE Infrastructure (`services/eventBus.ts`, `routes/events.ts`)

`eventBus` is a singleton `EventEmitter`. Worker side: `eventBus.emit(EVENT_SYSTEM, event)`. Client side: `eventBus.on(EVENT_SYSTEM, send)` in the SSE handler, `eventBus.off()` on client disconnect.

Two endpoints:

- `GET /api/events/stream` — SSE stream (live, open indefinitely)
- `GET /api/events/recent` — last 50 events from DB (for initial load)

---

### Frontend Integration

**Dashboard:** Loads the last 20 events on mount via `GET /api/events/recent`, then subscribes to the SSE stream. On `disk` or `ollama` events, `load()` is triggered automatically — disk bars and status cards update live. Live feed shows type, value, and time of all worker events.

**Chat:** Subscribes to SSE stream, filters on `type === "alert"`. Alert toasts appear in the bottom right as a fixed-position overlay, disappear automatically after 8 seconds. Toasts do not block input (`pointer-events` restricted to individual toast).

---

## v0.3.0 — 27.05.2026 — Rule Engine + Supreme Directive

**Goal:** Replace the approval system with rule-based execution control. Every tool execution is checked against configurable rules — no tool runs without explicit permission.

---

### Architecture Decision: Rules instead of Approval Pause

**Problem:** The previous approval system paused the SSE stream and waited for a user click in the chat. This was fragile (stream timeout on inactivity), hard to extend, and created UI debt (confirmation cards in chat).

**Solution:** Synchronous rule evaluation before every tool execution. Order: `DIRECTIVE_DENY` (hardcoded, immutable) → `deny` rules → `allow` rules → `no_match` → rejected with explanation.

**Why default-deny:** Without a matching permission rule, no tool is executed. On a fresh install there are 7 default rules (via `INSERT IGNORE`). `clean_temp` and `empty_recycle_bin` deliberately have no default rule — the user must explicitly enable them.

---

### Supreme Directive

**What:** `DIRECTIVE_DENY` in `executor.ts` is a hardcoded `Set<ToolName>` — never in the DB, never configurable. Currently empty; architecture established for future immutable locks.

**Why hardcoded:** Rules in the DB can be deleted. The directive cannot. That is the difference between "user preference" and "system invariant".

---

### New Files

**`apps/api/src/services/rules.ts`:** CRUD + `evaluateRules(toolName)`. Trigger parser supports `always`, `hour > N`, `hour < N`, `disk_X > N` (via `wmic`). SQL ordering via `FIELD(action, 'deny', 'allow')` — deny rules always win.

**`apps/api/src/routes/rules.ts`:** REST endpoints `GET/POST /api/rules`, `PUT/DELETE/PATCH /:id` and `PATCH /:id/toggle`.

---

### Removed Components

- `apps/api/src/services/approvals.ts` — deleted
- `apps/api/src/routes/approvals.ts` — deleted
- `approvals` table removed from `schema.sql`
- `ConfirmRequest` interface, `confirms` state, confirmation cards JSX removed from `Chat.tsx`
- `confirm` event type removed from `StreamEvent` union

---

### Settings: Rules Tab

New tab in Settings.tsx with full rule management: create new rule (name, tool, trigger, allow/deny), enable/disable existing rules via toggle, delete. Rules are saved directly via API — no global "Save" button needed.

---

## v0.2.0 — 27.05.2026 — Stability Sprint

**Goal:** Automate schema evolution cleanly, enable fresh installation without manual DB steps, permanently remove `list_running_processes`.

---

### Idempotent Schema

All `CREATE TABLE` statements in `schema.sql` use `IF NOT EXISTS`. The schema can be executed any number of times without errors. Previously: a one-time manual setup step. Now: runs safely on every API start.

---

### Auto-Migration on Start

**`apps/api/src/config/migrate.ts`:** Reads `schema.sql`, executes each statement, ignores "already exists" and "Duplicate entry" errors, throws on real errors. Startup sequence in `index.ts`: `loadSettings().then(runMigrations).then(() => app.listen(...))`.

**Seed rules via `INSERT IGNORE`:** 7 default allow rules with fixed IDs (1–7). `INSERT IGNORE` is idempotent — on fresh install they are created, on existing systems they are skipped. `clean_temp` and `empty_recycle_bin` deliberately without default rule.

---

### `list_running_processes` Removed

The tool was never implemented (no handler, no definition). It was a placeholder for Phase 3 (Proactive Monitoring). Cleanly removed from `ToolName`, `enabledTools` migration, and all types — no dead code remains.

---

## v0.1.7 — 27.05.2026 — enabledTools Migration Fix

**Problem:** After upgrading to v0.1.5/v0.1.6, `remember`, `forget`, `homework_mode` were missing from `enabledTools` — `loadSettings()` did not migrate them. These tools were present in the code, but the LLM could not call them because they were not on the enabled list.

**Fix:** Migration added in `loadSettings()`: all known tools are checked, missing ones are added to the list and persisted.

---

## v0.1.6 — 26.05.2026 — Code Analysis Bug Fixes

**Goal:** Systematic code analysis of all backend services. Five bugs found and fixed.

---

### Bug 1 — `loadSetup` ignored homework mode

**Problem:** `loadSetup` opened apps from a setup without checking whether `homeworkMode.active` was set — the same class of bug as the already-fixed `open_app` issue. A child could start blocked programs via "Load leisure setup".

**Fix:** `homeworkMode` destructured from `getSettings()`, identical check to `openAppWithSettings` inserted into the app-map function.

---

### Bug 2 — `extractAndRemember` hardcoded model

**Problem:** The background extraction in `memory.ts` always called Ollama with `model: "llama3.1:8b"` — ignoring the configured `ollamaModel` setting. When switching the model via settings, only the chat logic addressed the new model; the memory extraction stayed on the old one.

**Fix:** `getSettings` imported, `model: getSettings().ollamaModel` instead of hardcode.

---

### Bug 3 — OpenAI sent empty `tools: []`

**Problem:** When no tools were enabled, `openai.ts` sent `tools: []` to the OpenAI API. OpenAI rejects empty tool arrays with HTTP 400 — Ollama already handled this correctly (no `tools` field when empty).

**Fix:** Both paths (non-streaming `chat` and `chatStream`) now use `...(tools.length > 0 && { tools: ... })` — the field is only set when tools actually exist.

---

### Bug 4 — `activateHomeworkMode` ignored `allowed` flag

**Problem:** `activateHomeworkMode` opened apps from `homeworkMode.apps` without checking whether `allowed: true` was set. An app explicitly marked as forbidden could still be opened by the homework mode startup.

**Fix:** `if (entry)` changed to `if (entry?.allowed)`.

---

### Bug 5 — Dead code `void duration`

**Problem:** In `executor.ts`, `Date.now()` was measured before and after tool execution, but `duration` was immediately discarded with `void duration` — no logging, no purpose. The `void` expression was only there to suppress the "unused variable" lint error.

**Fix:** `const start`, `const duration`, and `void duration` fully removed.

---

## v0.1.5 — 26.05.2026 — Bug Sprint (10 Fixes)

**Goal:** Systematic resolution of 10 known bugs before Phase 3 begins.

---

### Fixed Bugs

1. **[Critical] TS** — `list_memories` handler returned wrong type → wrapped in `{ success: true, output: rows }`
2. **[Critical] Logic** — `open_app` did not check `homeworkMode` → check on `homeworkMode.active` inserted
3. **[Medium] Tools** — `list_memories` missing from tool definitions → added to `MEMORY_TOOLS` in `definitions.ts`
4. **[Medium] Registry** — `load_setup` missing from `ENABLED_TOOLS` → added to `registry.ts`
5. **[Medium] Types** — `list_memories` missing from `ToolName` union → added to `packages/shared`
6. **[Medium] Logic** — `sessionLimit` hardcoded to 40 → now reads `getSettings().sessionLimit`
7. **[Medium] Safety** — Non-streaming path executed dangerous tools without confirmation → `onConfirm = async () => false` as fallback
8. **[Low] TTS** — `ttsVoiceRef` declared after `speak()` (stale ref) → order swapped
9. **[Low] Settings** — `ttsEnabled`/`ttsVoice` were not persisted → route handler updated
10. **[Low] Schema** — `sessions`, `session_messages`, `memories` missing from `schema.sql` → tables added

---

## v0.1.4 — 26.05.2026 — GPU Acceleration + Text-to-Speech (TTS)

**Goal:** Ollama uses the dedicated GPU for faster inference. E.L.L.A. speaks responses aloud.

---

### GPU Acceleration

**Initial problem:** `ollama list` showed no models even though the model (4.7 GB) was already on E:. Ollama was looking under `C:\Users\JannR\.ollama\models` (empty).

**Cause:** The `OLLAMA_MODELS` environment variable was not set. Ollama had the model in `E:\Ollama\blobs` without matching manifests.

**Fix:** `OLLAMA_MODELS=E:\Ollama` set in user scope, Ollama restarted — manifests were reconstructed from the existing blobs.

**Measured performance:** 14.6 tokens/sec, VRAM usage 5.8 of 6.0 GB — model runs fully on the GPU (GTX 1060 6GB, CUDA 13.0). CPU reference would be 3–5 t/s.

**Why VRAM is not permanently occupied:** Ollama loads the model into VRAM only on the first inference request and releases it again after `OLLAMA_KEEP_ALIVE` (default: 5 min inactivity). Between conversations VRAM is free for other applications.

---

### Text-to-Speech (TTS)

**Decision:** `window.speechSynthesis` (Web Speech API in Chromium renderer) instead of a separate TTS service.

**Why no external TTS service:** `speechSynthesis` is directly available in the Electron renderer, no latency through network requests, fully offline. Windows voices (e.g. Microsoft Hedda) are adequate for German texts.

**Implementation:**

- Markdown stripping before speaking: headings (`#`), emphasis (`*`, `_`, `` ` ``, `~`), links (`[text](url)` → `text`)
- On each new user message: `speechSynthesis.cancel()` to interrupt ongoing output
- `onvoiceschanged` event for asynchronous voice loading (Chromium returns empty array on first `getVoices()` call)
- Voice selection and on/off toggle persisted in `settings.json`
- Quick toggle in chat header (🔊/🔇) — saves immediately to backend

**Why Ref instead of State for TTS flag:** The `speak()` callback is called in `sendText`, which itself is registered as a `useCallback` with dependencies. Direct state access would produce stale closures — `useRef` always gives the current value without re-render dependency.

---

## v0.1.3 — 25.05.2026 — ML Memory Layer

**Goal:** E.L.L.A. builds a personal long-term memory — automatically through observation, explicitly through user command. Every conversation becomes more relevant than the previous one.

---

### Architecture: Local Embeddings + Cosine Search

**Embedding model:** `nomic-embed-text` via Ollama (274 MB, local, no cloud service). Produces 768-dimensional vectors per text.

**Why no external vector service (Pinecone, Weaviate, etc.):** E.L.L.A. is a local assistant — data does not leave the machine. All ML infrastructure runs in Ollama or the local MariaDB.

**Cosine similarity:** 10 lines of TypeScript in the memory service — no external library. For the current scale (up to ~10,000 memories), in-process computation is fast enough.

**Why no `sqlite-vss` or `pgvector`:** MariaDB is already the chosen database. A separate vector DB would add infrastructure overhead. Embeddings are stored as JSON (`MEDIUMTEXT`) and sorted in Node.js during recall.

---

### DB Schema — `memories`

```sql
CREATE TABLE memories (
  id         INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  type       ENUM('user', 'system', 'note') NOT NULL,
  content    TEXT         NOT NULL,
  embedding  MEDIUMTEXT   NOT NULL,
  source     VARCHAR(255),
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

Three memory types:

| Type     | Meaning                  | Source                              |
| -------- | ------------------------ | ----------------------------------- |
| `user`   | Facts about the user     | Automatic extraction + explicit     |
| `system` | App/setup usage behavior | After every `open_app`/`load_setup` |
| `note`   | Explicit notes           | User says "Remember…"               |

---

### `services/memory.ts`

**`remember(type, content, source?)`:** Embeds the text via Ollama API (`POST /api/embed`), stores vector + content in MariaDB. Returns `{ success: false }` if `nomic-embed-text` has not been pulled — no crash.

**`recall(query, limit=5)`:** Embeds the query, loads the last 500 memories from DB, computes cosine similarity, filters everything below 0.3, returns top 5.

**`extractAndRemember(userMsg, assistantMsg, sessionId)`:** Runs via `setImmediate` (fire-and-forget, does not block response). Sends the last conversation turn to the LLM asking: "Is there a fact worth learning?". On "NOTHING" nothing happens, otherwise the fact is saved as a `user` memory. Temperature 0.1 and `num_predict: 60` keep the extraction fast and focused.

**`trackToolUsage(tool, detail)`:** Also fire-and-forget. Called after `open_app` and `load_setup` and writes a `system` memory like "User used chrome (open_app)".

---

### System Prompt Injection

**Before:** `SYSTEM_PROMPT` was an immutable string in `ollama.ts`.

**After:** `buildSystemPrompt(memories: string[]): string` — exported function, shared by both LLM providers (Ollama + OpenAI). When memories are available, a section `Relevant memory (use this as context):` with bullet points is appended.

`openai.ts` imports `buildSystemPrompt` from `ollama.ts` — a single prompt, two providers, no drift.

**Why system prompt instead of a separate message:** A separate `system` message in the message history would cause validation problems with the OpenAI format (only one system message allowed). The prompt append is the cleanest solution.

---

### LLM Tools

`remember(type, content)` — ELLA stores on explicit command. The system prompt instructs the model to use this tool on "Remember" / "Keep in mind".

`forget(id)` — Deletes a memory by ID. For when stored information becomes outdated or incorrect.

---

### Flow per Chat Request

```text
User message received
  → recall(message)        — load top-5 relevant memories
  → buildSystemPrompt(…)   — embed memories in system prompt
  → LLM call               — with enriched context
  → Response to user
  → extractAndRemember()   — async, fire-and-forget
     → LLM checks if fact is worth learning
     → if yes: embed + save in DB
```

---

## v0.1.2 — 25.05.2026 — Homework Mode

**Goal:** PIN-secured kiosk mode that only allows defined apps — intended for children or controlled work environments.

---

### Concept: Asymmetric PIN Logic

**Decision:** Activate without PIN, deactivate requires PIN.

**Rationale:** A symmetric PIN system (both directions secured) would be unusable for voice commands — the user would have to speak their PIN aloud into the microphone to start the mode. Since activation needs no protection (anyone may turn the mode on), there is no reason to add a barrier there.

---

### Backend — `services/homework.ts`

**`activateHomeworkMode()`:**

1. All known apps that are **not** in `homeworkMode.apps` → `taskkill /F /IM`
2. Start allowed apps via `openApp()`
3. Persist `active: true` in `settings.json`

**`deactivateHomeworkMode(pin)`:**

1. Check SHA-256 of PIN against stored hash
2. On match: persist `active: false`

**Why SHA-256 instead of bcrypt:** SHA-256 has no external dependency (`crypto` is Node built-in). For a local, single-user PIN protection — no network access, no brute force over the network — SHA-256 is sufficient. bcrypt would introduce an npm dependency and longer hash time without real security benefit in this context.

**Why `active` is persisted in `settings.json`:** The mode must survive an API restart. A child must not be able to bypass the mode via `Ctrl+C` + restart.

---

### REST API — `routes/homework.ts`

| Route                      | Method | Auth         | Function                        |
| -------------------------- | ------ | ------------ | ------------------------------- |
| `/api/homework/status`     | GET    | —            | `{ active, configured }`        |
| `/api/homework/activate`   | POST   | no PIN       | Close/open apps, `active: true` |
| `/api/homework/deactivate` | POST   | PIN          | `active: false`                 |
| `/api/homework/config`     | PUT    | PIN (if set) | Set PIN hash, change app list   |

**Security of the config route:** If a PIN is already set, the current PIN must be provided to make changes. Setting a PIN for the first time is possible without authentication — that is the initial setup.

---

### LLM Tool — `homework_mode`

```typescript
homework_mode(action: "activate" | "deactivate", pin?: string)
```

ELLA knows the asymmetry: the tool description makes it explicit that `activate` requires no PIN and `deactivate` requires one. The model only asks the user for the PIN when it needs to deactivate.

---

### Settings Tab "Mode"

Two sections:

- **PIN:** Input + confirmation, separate "Set PIN" button → `/api/homework/config`
- **Allowed apps:** Checkboxes from all known apps (independent of `allowed` flag) — orange accent for visual distinction from the regular setup lists

The app selection is saved via the normal "Save" button. The settings PUT handler extracts only `homeworkMode.apps` — `pinHash` and `active` cannot be overwritten from outside.

---

### Chat Integration

- **🔓 button in header** (only visible when PIN is configured): click → activate immediately (no dialog)
- **🔒 button in header**: click → PIN dialog → deactivate
- **Orange banner** in chat when mode is active: `"🔒 Homework mode active — only allowed programs are running."`
- **PIN dialog** closes on click on the backdrop (escape equivalent)

---

## v0.1.1 — 25.05.2026 — Voice Input, Tool Confirmation, Setup Shortcuts

**Goal:** E.L.L.A. becomes voice-controllable, dangerous actions require confirmation, and the user can load configurable app sets by voice command.

---

### 3-Mode Voice Input

**Decision:** Three modes — `off`, `manual`, `wakeword`.

| Mode       | Behavior                                                         |
| ---------- | ---------------------------------------------------------------- |
| `off`      | No microphone button, keyboard only                              |
| `manual`   | Microphone button in chat — click starts/stops recording         |
| `wakeword` | Always active — "ella" activates, then command, then "ausführen" |

**Why Web Speech API instead of Whisper:** Web Speech API is directly available in the Chromium renderer, no separate service, no latency from model loading. For locally-running voice control that needs fast response, this is the right choice. Whisper would be better for transcribed archiving, not real-time commands.

**Microphone permission in Electron:** Chromium blocks microphone access without explicit authorization. In Electron this is handled via `session.defaultSession.setPermissionRequestHandler`:

```typescript
session.defaultSession.setPermissionRequestHandler(
  (_wc, permission, callback) => {
    callback(permission === "media");
  },
);
```

**Wakeword state machine:** `idle → wake → listen`. Stable refs (`startWakeRef`, `startCmdRef`, `sendFnRef`) prevent stale closures in the `onresult`/`onend` callbacks of the Web Speech API.

**Submit and cancel words:**

- Submit: `"ausführen"`, `"los"`, `"mach es"`, `"abschicken"`, `"sende"`
- Cancel: `"abbrechen"`, `"stopp"`, `"vergiss es"`

---

### Tool Confirmation via SSE Pause

**Problem:** Dangerous tools (`clean_temp`, `empty_recycle_bin`) were executed immediately without prompting.

**Architecture:** SSE streaming pauses the tool loop and waits for an external HTTP confirmation:

```text
LLM calls clean_temp
  → Backend emits { type: "confirm", id, label } via SSE
  → Frontend shows confirmation card in chat
  → User clicks "Confirm" or "Reject"
  → Frontend POST /api/approvals/:id/confirm (or /deny)
  → Backend promise resolves → tool is executed (or not)
  → Stream continues
```

**`services/approvals.ts`:** In-memory map of `id → resolve function`. 60-second auto-timeout prevents hanging streams when the user does not respond.

**Why in-memory instead of DB:** Approvals are transient — they only exist during an active request. A DB table would require additional cleanup logic and provide no benefit.

---

### Setup Shortcuts — `load_setup`

**What:** Configurable app sets that can be loaded by voice command or chat: "load my work setup".

**Dynamic tool definitions:** `buildToolDefinitions(setups)` generates the `load_setup` tool only when setups exist and embeds the setup names in the description:

```text
"Starts all apps of a defined setup. Available setups: "work", "leisure"."
```

This way the LLM knows which names are valid without seeing code.

**Open + close:** Each setup has `open: string[]` and `close: string[]`. On load, the `close` apps are terminated via `taskkill` first, then the `open` apps are started. The order prevents apps that appear in both lists from being opened and immediately closed again.

**Settings tab "Setups":** Two-column view in the editor — left "Open" (allowed apps only, violet accent), right "Close" (all known apps, red accent). Badge in the tab header shows `(2↑ 1↓)`.

---

### Settings Tabs — Overflow Fix

**Problem:** The original "General" tab contained 6 sections (provider, model, API key, tools, session limit, voice) — more than fit in the window height. Since the app fundamentally shows no scrollbars, the lower part was unreachable.

**Solution:** Split into 4 focused tabs: `LLM` | `Tools` | `Setups` | `Programs`. Each tab has at most 3 sections and fits in the window without scrolling.

---

### Bug Fix — `voiceMode` was not saved

**Symptom:** Voice mode selection was lost after reload. The microphone button did not appear in chat.

**Cause:** In `routes/settings.ts`, `voiceMode` was destructured from `req.body` but not included in the `patch` object — the value was read and immediately discarded.

**Fix:** `voiceMode` (and `setups`) explicitly added to `patch`.

---

## v0.1.0 — 25.05.2026 — Dashboard, Settings, Program Management

**Goal:** E.L.L.A. gets a complete configuration interface and displays system status in real time. The user can change all relevant settings without editing `.env`.

---

### Dashboard

**Decision:** Three status cards (LLM provider, Ollama, MariaDB) + disk usage bars for C:, E:, Z:. Auto-refresh every 30 seconds.

**New endpoints:**

- `GET /api/system/status` — Ollama and MariaDB via ping, returns `{ ok: boolean }`
- `GET /api/system/disk` — calls `getDiskUsage()` for three drives

**Why no WebSockets:** SSE is sufficient for unidirectional data, but 30-second polling is even simpler and completely adequate for system metrics that change slowly.

---

### Settings Page

**Decision:** Persistence in `settings.json` (server-side, not in DB). Two tabs: General + Programs.

**Why JSON file instead of DB table:** No migration needed, no schema lock-in. Settings are flat enough that a JSON object suffices. For more complex requirements (multi-user, audit log), MariaDB would be better.

**OpenAI API key:** Delivered to the frontend as `"***"` (never in plain text). Frontend only sends a new value when the user has typed something — `"***"` as sentinel prevents accidental overwriting.

**Provider selection:** `auto` | `openai` | `ollama` — `auto` corresponds to the previous behavior (OpenAI when available). With an explicit selection, the user can force Ollama even when an API key is stored.

---

### Program Management

**Decision:** Single list with checkboxes instead of separate allowed/blocked lists. System scan via Windows Start Menu (`.lnk` shortcuts).

**Why Start Menu instead of registry:** The registry delivers installed packages with installation path — but not the path to the executable. Start menu shortcuts are directly launchable and correspond exactly to what the user understands as a "program".

**Base64 `-EncodedCommand`:** The PowerShell script contains special characters and paths with spaces. Instead of fragile shell escaping, the script is encoded as UTF-16LE Base64 — this is the official PowerShell method for programmatic execution.

**Data model:** `apps: { name, command, allowed }[]` — a single list. `allowed: false` is equivalent to blocked. When scanning, new programs are merged with `allowed: false` — the user must explicitly enable them.

---

## v0.0.5 — 25.05.2026 — Complete Desktop App

**Goal:** E.L.L.A. runs fully as a native Windows application without a browser, starts automatically with Windows, and manages all its dependencies itself.

---

### Frameless Window + Custom Titlebar

**Decision:** `frame: false` in BrowserWindow, custom TitleBar component in React.

**Rationale:** A classic title bar looks like a browser. With `frame: false` and a custom title bar (violet, E.L.L.A. branding, SVG icons), the app looks like a native application. IPC bridges renderer and main for minimize/maximize/close.

**Technical trick:** `-webkit-app-region: drag` makes the title bar draggable. The buttons must explicitly have `drag: none` so that clicks work.

---

### Production Build + HashRouter

**Decision:** Vite builds to `apps/web/dist/`, Electron loads via `loadFile()` instead of `loadURL()`. HashRouter instead of BrowserRouter.

**Why HashRouter:** BrowserRouter uses the HTML5 History API (`/chat`, `/dashboard`). Under `file://` there is no server to resolve these paths — navigation does not work. HashRouter encodes the path as a URL fragment (`#/chat`) — works without a server.

**Why `base: './'` in Vite:** Without this option, Vite generates absolute asset paths (`/assets/index.js`). Under `file://`, `/` is interpreted as the filesystem root — assets are not found. With `base: './'`, relative paths (`./assets/index.js`) are generated.

**CORS for `file://`:** Requests from `file://` pages to `http://localhost:3002` have `Origin: null`. Without CORS headers, the browser rejects them. Solution: minimal CORS middleware in the API (`Access-Control-Allow-Origin: *`) — safe since the API only listens on localhost.

---

### API as Child Process

**Decision:** Electron spawns `node dist/index.js` in `apps/api/` and waits via port check on port 3002.

**Why child process instead of separate start:** The goal is a single click that starts everything. The user should not have to open three terminals. Electron is the natural orchestrator — it controls the app lifecycle and can cleanly kill the API process on exit.

**Port check instead of timeout:** `net.connect(3002)` in a loop is more reliable than a fixed `setTimeout`. The API can take varying amounts of time to start depending on load (MariaDB connection, Ollama initialization).

**isDev via `ELLA_DEV=1`:** Instead of `!app.isPackaged` (always false in dev mode), an explicit env variable controls the mode. `ELLA_DEV=1` → Vite dev server, no API spawn. No flag → production mode.

---

### Autostart

**Decision:** `app.setLoginItemSettings` with `path: process.execPath, args: [app.getAppPath()]`. Toggle in tray menu as checkbox.

**Why tray toggle instead of always-on:** The user should have control. The toggle is visible (tray menu), reversible (one click to disable), and requires no registry knowledge.

**MariaDB:** `sc.exe config MariaDB start=auto` — run once as admin. MariaDB is a Windows service and has native autostart support.

---

## v0.0.1 — 23.05.2026 — Foundation & Ollama Integration

**Goal:** A working foundation with real LLM communication and the first executable system tools.

---

### Monorepo Structure

**Decision:** npm workspaces with four packages.

```text
apps/api          — Express backend     (@ella/api)
apps/web          — React frontend      (@ella/web)
packages/shared   — Shared types        (@ella/shared)
packages/agent-tools — Windows tools    (@ella/agent-tools)
```

**Why monorepo:** Frontend and backend share types (`Message`, `ToolCall`, `ToolResult`). Without a monorepo, these types would have to be duplicated or managed as a separate npm package — both are unnecessary overhead for a one-person project. npm workspaces solves this without an additional tool like Turborepo or Nx.

**Why `packages/` separate from `apps/`:** `agent-tools` and `shared` are pure libraries with no server of their own. They are imported by the API, they start nothing themselves. The separation makes this clear and allows them to be published later as standalone npm packages.

---

### Backend — Express + TypeScript

**Decision:** Node.js with Express, fully in TypeScript.

**Why Express instead of Fastify/NestJS:** Express is minimal and has no magic. For a project that needs to control its own flow (tool loop, LLM communication, session management), explicit control is more important than framework features. NestJS would have imposed too much structure before it was clear how E.L.L.A. works internally.

**Why TypeScript:** The interfaces between LLM response, tool call, and session store are complex enough that type safety prevents real bugs. JavaScript would have produced subtle bugs when distinguishing `tool_call` formats between Ollama and OpenAI.

**Routes:**

| Route                   | Method | Function                          |
| ----------------------- | ------ | --------------------------------- |
| `/api/chat`             | POST   | Main chat endpoint with tool loop |
| `/api/chat/provider`    | GET    | Active LLM provider and model     |
| `/api/chat/history/:id` | GET    | Read session history              |
| `/api/chat/history/:id` | DELETE | Delete session                    |
| `/api/tools`            | GET    | List all registered tools         |

---

### Frontend — React + Vite

**Decision:** React 18, Vite 5, TypeScript, React Router v6.

**Why Vite instead of Create React App:** CRA is deprecated and slow. Vite has HMR in under 50 ms and builds in seconds. The dev proxy (`/api → localhost:3002`) is natively built in — no separate CORS setup needed.
