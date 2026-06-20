# E.L.L.A. — What I Can Do (v3.9.0)

As of: 2026-06-20 — 224 tests passing

---

## Memory & Configuration

| Tool             | What it does                                                     |
| ---------------- | ---------------------------------------------------------------- |
| `remember`       | Stores information permanently (ML embedding, cosine similarity) |
| `forget`         | Deletes a memory entry by ID                                     |
| `list_memories`  | Lists everything ELLA knows about the user                       |
| `create_setup`   | Creates a named app group (e.g. "Start work")                    |
| `load_setup`     | Launches all apps from a saved setup                             |
| `update_setting` | Changes ELLA settings by voice                                   |
| `create_rule`    | Creates allow/deny rules for tools                               |

---

## System & Drives

| Tool                 | What it does                                                    |
| -------------------- | --------------------------------------------------------------- |
| `get_disk_usage`     | Free/used storage per drive                                     |
| `get_system_info`    | CPU, GPU, RAM, computer name                                    |
| `get_system_status`  | Everything at once: disk + RAM + network + alerts + boot time   |
| `clean_temp`         | Delete temporary files                                          |
| `empty_recycle_bin`  | Empty the recycle bin                                           |
| `free_ram`           | Release unused RAM                                              |
| `shutdown_system`    | Shut down / restart / sleep the PC                              |
| `format_drive`       | Format USB/external drives _(C: locked, confirmation required)_ |
| `rename_drive`       | Change volume label _(system drives locked)_                    |
| `list_programs`      | List all installed programs                                     |
| `list_autostart`     | Show startup entries                                            |
| `get_battery_status` | Charge level, whether charging, estimated remaining runtime     |
| `get_temperatures`   | CPU/ACPI thermal zones in °C                                    |
| `get_event_log`      | Windows errors/warnings from the event log                      |
| `toggle_dark_mode`   | Toggle dark mode / light mode (Registry)                        |

---

## Files & Folders

| Tool                | What it does                                                               |
| ------------------- | -------------------------------------------------------------------------- |
| `search_files`      | Search all drives for files                                                |
| `open_file`         | Open a file (optionally: with a specific app, jump to end for Word files)  |
| `explore_folder`    | Open a folder in Windows Explorer                                          |
| `read_file_content` | Read the contents of a text file _(BLOCKED_PREFIXES protect system paths)_ |
| `rename_file`       | Rename a file/folder _(with confirmation)_                                 |
| `copy_file`         | Copy a file _(with confirmation, system paths locked)_                     |
| `create_folder`     | Create a folder (including subfolders)                                     |
| `delete_file`       | Move a file/folder to the recycle bin _(no permanent deletion)_            |
| `find_duplicates`   | Find duplicate files by hash (storage waste detection)                     |

---

## Documents & Writing

| Tool                  | What it does                                                 |
| --------------------- | ------------------------------------------------------------ |
| `create_document`     | Create a new Word document or TXT file                       |
| `dictate_to_document` | Dictate into Word, AI corrects typos                         |
| `compose_email`       | Open an Outlook draft _(does not send automatically)_        |
| `write_for_me`        | Write text in the user's personal style (from email profile) |
| `translate_text`      | Translate text — offline (Ollama) or OpenAI                  |
| `summarize_text`      | Summarize text: brief / medium / detailed                    |
| `correct_text`        | Correct grammar and punctuation (Ollama/OpenAI)              |
| `write_in_style`      | Compose text in the user's personal writing style            |

---

## Communication & Calendar

| Tool                        | What it does                               |
| --------------------------- | ------------------------------------------ |
| `read_emails`               | Fetch unread Outlook emails                |
| `mark_email`                | Mark an Outlook email as read / archive it |
| `read_calendar`             | Read the Outlook calendar                  |
| `create_appointment`        | Create an Outlook appointment              |
| `read_gmail`                | Read Gmail (OAuth 2.0)                     |
| `mark_gmail`                | Mark/archive Gmail messages                |
| `read_google_calendar`      | Read Google Calendar                       |
| `create_google_appointment` | Create a Google Calendar appointment       |

---

## Network & Security

| Tool               | What it does                                            |
| ------------------ | ------------------------------------------------------- |
| `scan_network`     | ARP scan: all devices on the home network with IP + MAC |
| `list_connections` | Active TCP connections + listening ports + process name |
| `list_devices`     | Connected hardware (USB, cameras, drives)               |
| `get_wifi_info`    | Wi-Fi name, signal strength, transmission rate          |
| `fetch_url`        | Fetch a webpage and extract its text                    |

---

## Web & Knowledge

| Tool           | What it does                                   |
| -------------- | ---------------------------------------------- |
| `search_web`   | Web search (DuckDuckGo, no API key required)   |
| `web_search`   | Second web search route (fallback)             |
| `get_weather`  | Weather for any location (no API key required) |
| `get_location` | Retrieve the stored user location              |
| `get_datetime` | Exact time, date, and timezone                 |

---

## Processes & Services

| Tool              | What it does                                                           |
| ----------------- | ---------------------------------------------------------------------- |
| `list_processes`  | Running processes sorted by CPU/RAM                                    |
| `kill_process`    | Terminate a process _(system-critical processes locked, confirmation)_ |
| `list_services`   | List Windows services                                                  |
| `control_service` | Start / stop / restart a service                                       |

---

## Productivity & Tasks

| Tool              | What it does                              |
| ----------------- | ----------------------------------------- |
| `add_task`        | Add a task to the persistent to-do list   |
| `list_tasks`      | Show open or completed tasks              |
| `complete_task`   | Mark a task as completed                  |
| `delete_task`     | Delete a task                             |
| `set_reminder`    | Set a reminder via Windows Task Scheduler |
| `list_reminders`  | Show active reminders                     |
| `delete_reminder` | Delete a reminder                         |

---

## Clipboard & Volume

| Tool            | What it does                                      |
| --------------- | ------------------------------------------------- |
| `get_clipboard` | Read the clipboard (+ history of last 20 entries) |
| `set_clipboard` | Write text to the clipboard                       |
| `set_volume`    | Set system volume or mute                         |

---

## Music & Media

| Tool              | What it does                                                       |
| ----------------- | ------------------------------------------------------------------ |
| `play_music`      | Search music library (artist/album/title), open player             |
| `control_media`   | Control media: Play / Pause / Next / Prev / Stop (VK*MEDIA*\*)     |
| `get_now_playing` | Retrieve the currently playing track (WinRT Windows.Media.Control) |

---

## Screen & Vision

| Tool              | What it does                                                           |
| ----------------- | ---------------------------------------------------------------------- |
| `take_screenshot` | Screenshot + AI analysis (GPT-4o Vision)                               |
| `read_screen`     | Read text from the screen — locally, offline (Windows.Media.Ocr WinRT) |
| `watch_screen`    | Monitor the screen for up to 30 s, report changes (OCR diff)           |
| `click_element`   | Click a UI element by visible text — semantically via OCR (3-pass)     |

---

## Mouse & Keyboard

| Tool         | What it does                                                                      |
| ------------ | --------------------------------------------------------------------------------- |
| `move_mouse` | Move the mouse to a position _(no click)_                                         |
| `click_at`   | Click at coordinates _(confirmation required, security-sensitive windows locked)_ |
| `drag_drop`  | Drag & drop from A to B _(confirmation required)_                                 |
| `send_keys`  | Send keyboard input to a window (WScript.Shell SendKeys)                          |

---

## Windows & Apps

| Tool             | What it does                                                                 |
| ---------------- | ---------------------------------------------------------------------------- |
| `open_app`       | Open an app by name                                                          |
| `launch_app`     | Launch an app by name or path _(confirmation required, system paths locked)_ |
| `control_window` | Window: focus / minimize / maximize / close                                  |
| `homework_mode`  | Activate/deactivate secured child mode (PIN-protected)                       |
| `pause_ella`     | Pause ELLA (1–120 minutes)                                                   |

---

## Shell

| Tool          | What it does                                                                |
| ------------- | --------------------------------------------------------------------------- |
| `run_command` | Execute a PowerShell command _(confirmation required, 60+ locked patterns)_ |

---

## Always Active — Without a Tool Call

| Feature                         | What it does                                                                 |
| ------------------------------- | ---------------------------------------------------------------------------- |
| **Wakeword "ella"**             | Voice activation via openWakeWord + ONNX (local, offline)                    |
| **Kokoro TTS**                  | Neural speech output (Port 3003, 127.0.0.1-only, offline)                    |
| **Proactive messages**          | ELLA writes into the chat on her own initiative (SSE `proactive_message`)    |
| **Clipboard pattern detection** | IBAN, tracking number, phone, URL, email — polling every 3 s                 |
| **Background worker**           | Disk/RAM/Ollama alerts, PnP, ARP, TCP, firewall/Wi-Fi/DNS — every 60 s       |
| **Conversation compression**    | After 15 messages: oldest 10 → Ollama summary (local)                        |
| **Window context**              | Active window title is passed as context (opt-in, sensitive titles filtered) |
| **User profiles**               | Multiple profiles, PIN-protected (PBKDF2 + Salt, 100k iterations)            |
| **Feedback buttons**            | Thumbs up/down on each response (DB only, never in LLM context)              |
| **System tray**                 | Balloon alerts with severity sound (warning / error / info / device)         |
| **Onboarding**                  | 6-step flow (name, directive, hardware scan, voice, location)                |
| **Comeback briefing**           | What changed while you were away                                             |
| **Meeting prep / end of day**   | Automatically shows due tasks + calendar                                     |
| **Break reminder**              | Reminds the user to take breaks based on work patterns                       |
| **Rhythm analysis**             | Daily at 12:00 — evaluates usage patterns                                    |
| **Duplicate scan**              | Automatically every Sunday at 10:00                                          |

---

## Security Architecture (the Directive)

```text
Directive Layer → DIRECTIVE_DENY → Deny Rules → Allow Rules → Tool Execution
```

| Prohibition    | What it means                                                  |
| -------------- | -------------------------------------------------------------- |
| **harm**       | No physical, financial, psychological, or data-related harm    |
| **conceal**    | No concealment of actions, capabilities, or system states      |
| **surveil**    | No surveillance without explicit knowledge and active consent  |
| **exfiltrate** | No sharing of data with third parties without explicit consent |

- Up to 89 default rules possible (IDs 1–85 applied, additional ones via confirmation variants) — set automatically on startup
- Audit log of every Directive rejection in the `directive_audit` table
- Confirmation required for destructive actions (click, drag, shell, rename, close window)
- Password manager windows locked for mouse tools (1Password, KeePass, Bitwarden, PayPal, bank sites…)
- System paths locked for file tools (`C:\Windows`, `C:\Program Files`…)
- 60+ shell patterns locked (Invoke-Expression, Remove-Item, Invoke-WebRequest…)

---

## Numbers

| Metric         | Value                                                                   |
| -------------- | ----------------------------------------------------------------------- |
| Tools (active) | **85** _(+ 1 locked by Directive: `delete_files`)_                      |
| Test cases     | **196 passing** (Vitest unit + integration)                             |
| Git tags       | v1.0 → v3.4.0                                                           |
| LLM backends   | Ollama llama3.1:8b (local) + OpenAI GPT-4o (optional)                   |
| Database       | MariaDB, local, no cloud access                                         |
| Network egress | Only on explicit user command (web search, weather, Gmail/Google OAuth) |
