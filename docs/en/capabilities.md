# E.L.L.A. — Capabilities (v1.4.0)

85 active tools. Everything through natural language.

---

## Memory & Configuration

| Tool             | What it does                                                    |
| ---------------- | --------------------------------------------------------------- |
| `remember`       | Store information permanently (ML embedding, cosine similarity) |
| `forget`         | Delete a memory by ID                                           |
| `list_memories`  | List everything E.L.L.A. knows about the user                   |
| `create_setup`   | Create a named app group (e.g. "Start Work")                    |
| `load_setup`     | Launch all apps from a saved setup                              |
| `update_setting` | Change E.L.L.A. settings via natural language                   |
| `create_rule`    | Create allow/deny rules for tools                               |

---

## System & Drives

| Tool                 | What it does                                                  |
| -------------------- | ------------------------------------------------------------- |
| `get_disk_usage`     | Free/used storage per drive                                   |
| `get_system_info`    | CPU, GPU, RAM, computer name                                  |
| `get_system_status`  | Everything at once: disk + RAM + network + alerts + boot time |
| `clean_temp`         | Delete temporary files                                        |
| `empty_recycle_bin`  | Empty the recycle bin                                         |
| `free_ram`           | Release unused RAM                                            |
| `shutdown_system`    | Shut down / restart / sleep                                   |
| `format_drive`       | Format USB/external drives _(confirmation required)_          |
| `rename_drive`       | Change volume label _(system drives locked)_                  |
| `list_programs`      | List all installed programs                                   |
| `list_autostart`     | Show autostart entries                                        |
| `get_battery_status` | Charge level, charging status, estimated runtime              |
| `get_temperatures`   | CPU/ACPI thermal zones in °C                                  |
| `get_event_log`      | Windows errors/warnings from the event log                    |
| `toggle_dark_mode`   | Switch dark mode / light mode                                 |
| `get_gpu_info`       | GPU model, VRAM, utilization                                  |
| `get_ram_details`    | RAM slots, type, clock speed                                  |
| `get_drive_details`  | Drive type, health, S.M.A.R.T.                                |
| `get_audio_devices`  | Connected audio devices                                       |
| `get_usb_devices`    | Connected USB devices                                         |

---

## Files & Folders

| Tool                   | What it does                                              |
| ---------------------- | --------------------------------------------------------- |
| `search_files`         | Search all drives for files                               |
| `open_file`            | Open a file (optionally with a specific app)              |
| `explore_folder`       | Open folder in Windows Explorer                           |
| `read_file_content`    | Read the content of a text file                           |
| `rename_file`          | Rename file/folder _(with confirmation)_                  |
| `copy_file`            | Copy file _(with confirmation, system paths locked)_      |
| `create_folder`        | Create folder (including subfolders)                      |
| `delete_file`          | Move file/folder to recycle bin _(no permanent deletion)_ |
| `find_duplicates`      | Find duplicate files by hash                              |
| `index_documents`      | Index a folder for semantic search                        |
| `list_indexed_folders` | Show all indexed folders with statistics                  |

---

## Documents & Writing

| Tool                  | What it does                                        |
| --------------------- | --------------------------------------------------- |
| `create_document`     | Create a new Word document or TXT file              |
| `dictate_to_document` | Dictate into Word, AI corrects typos                |
| `compose_email`       | Open Outlook draft _(does not send automatically)_  |
| `write_for_me`        | Write text in the user's personal style             |
| `translate_text`      | Translate text — offline (Ollama) or OpenAI         |
| `summarize_text`      | Summarize text: short / medium / detailed           |
| `correct_text`        | Correct grammar and punctuation                     |
| `write_in_style`      | Formulate text in the user's personal writing style |

---

## Communication & Calendar

| Tool                        | What it does                         |
| --------------------------- | ------------------------------------ |
| `read_emails`               | Retrieve unread Outlook emails       |
| `mark_email`                | Mark Outlook email as read / archive |
| `read_calendar`             | Read Outlook calendar                |
| `create_appointment`        | Create Outlook appointment           |
| `read_gmail`                | Read Gmail (OAuth 2.0)               |
| `mark_gmail`                | Mark/archive Gmail                   |
| `read_google_calendar`      | Read Google Calendar                 |
| `create_google_appointment` | Create Google Calendar appointment   |

---

## Network & Security

| Tool               | What it does                                            |
| ------------------ | ------------------------------------------------------- |
| `scan_network`     | ARP scan: all devices on the home network with IP + MAC |
| `list_connections` | Active TCP connections + listening ports + process name |
| `list_devices`     | Connected hardware (USB, cameras, drives)               |
| `get_wifi_info`    | Wi-Fi name, signal strength, transfer rate              |
| `fetch_url`        | Fetch a website and extract text                        |

---

## Web & Knowledge

| Tool           | What it does                          |
| -------------- | ------------------------------------- |
| `search_web`   | Web search (DuckDuckGo, no API key)   |
| `get_weather`  | Weather for any location (no API key) |
| `get_location` | Retrieve stored user location         |
| `get_datetime` | Exact time, date, timezone            |

---

## Processes & Services

| Tool              | What it does                                               |
| ----------------- | ---------------------------------------------------------- |
| `list_processes`  | Running processes sorted by CPU/RAM                        |
| `kill_process`    | Terminate process _(system-critical locked, confirmation)_ |
| `list_services`   | List Windows services                                      |
| `control_service` | Start / stop / restart a service                           |

---

## Productivity & Tasks

| Tool              | What it does                            |
| ----------------- | --------------------------------------- |
| `add_task`        | Add task to persistent to-do list       |
| `list_tasks`      | Show open or completed tasks            |
| `complete_task`   | Mark task as completed                  |
| `delete_task`     | Delete task                             |
| `set_reminder`    | Set reminder via Windows Task Scheduler |
| `list_reminders`  | Show active reminders                   |
| `delete_reminder` | Delete reminder                         |

---

## Clipboard & Volume

| Tool            | What it does                               |
| --------------- | ------------------------------------------ |
| `get_clipboard` | Read clipboard (+ last 20 entries history) |
| `set_clipboard` | Write text to clipboard                    |
| `set_volume`    | Set system volume or mute                  |

---

## Music & Media

| Tool              | What it does                                           |
| ----------------- | ------------------------------------------------------ |
| `play_music`      | Search music library (artist/album/title), open player |
| `control_media`   | Control media: Play / Pause / Next / Prev / Stop       |
| `get_now_playing` | Get currently playing track                            |

---

## Screen & Vision

| Tool              | What it does                                         |
| ----------------- | ---------------------------------------------------- |
| `take_screenshot` | Screenshot + AI analysis (GPT-4o Vision)             |
| `read_screen`     | Read text from screen — local, offline (Windows OCR) |
| `watch_screen`    | Watch screen up to 30s, report changes               |
| `click_element`   | Click UI element by visible text (OCR)               |

---

## Mouse & Keyboard

| Tool         | What it does                                   |
| ------------ | ---------------------------------------------- |
| `move_mouse` | Move mouse to position _(no click)_            |
| `click_at`   | Click at coordinates _(confirmation required)_ |
| `drag_drop`  | Drag and drop from A to B _(confirmation)_     |
| `send_keys`  | Send keystrokes to window                      |

---

## Windows & Apps

| Tool                | What it does                                       |
| ------------------- | -------------------------------------------------- |
| `open_app`          | Open app by name                                   |
| `launch_app`        | Launch app by name or path _(system paths locked)_ |
| `control_window`    | Window: focus / minimize / maximize / close        |
| `homework_mode`     | Enable/disable secured child mode (PIN-protected)  |
| `pause_ella`        | Pause E.L.L.A. (1–120 minutes)                     |
| `open_chess_window` | Open chess window                                  |

---

## Shell

| Tool          | What it does                                                      |
| ------------- | ----------------------------------------------------------------- |
| `run_command` | Execute PowerShell command _(confirmation, 60+ blocked patterns)_ |

---

## Always Active — No Tool Call Required

| Feature                           | What it does                                                 |
| --------------------------------- | ------------------------------------------------------------ |
| **Wakeword "ella"**               | Voice activation via openWakeWord + ONNX (local, offline)    |
| **Kokoro TTS**                    | Neural voice synthesis (offline, no Python)                  |
| **Proactive messages**            | E.L.L.A. writes to chat on its own initiative                |
| **Clipboard pattern recognition** | IBAN, tracking numbers, phone, URL, email — polling every 3s |
| **Background worker**             | Disk/RAM/alerts, USB, network — every 60s                    |
| **Conversation compression**      | After 15 messages: oldest 10 → local summary                 |
| **Window context**                | Active window as context (opt-in, sensitive titles filtered) |
| **User profiles**                 | Multiple profiles, PIN-protected                             |
| **Knowledge Graph**               | D3 visualization of semantic memory connections              |
| **Multi-agent pipeline**          | Parallel agents with live streaming                          |
| **Comeback briefing**             | What changed while you were away                             |
| **Meeting prep / end-of-day**     | Automatically due tasks + calendar                           |

---

## By the Numbers

| Metric           | Value                                                 |
| ---------------- | ----------------------------------------------------- |
| Tools (active)   | **85**                                                |
| Tests            | **224 passing**                                       |
| LLM backends     | Ollama llama3.1:8b (local) + OpenAI GPT-4o (optional) |
| Database         | MariaDB, local, no cloud access                       |
| Network outbound | Only on explicit user command                         |
