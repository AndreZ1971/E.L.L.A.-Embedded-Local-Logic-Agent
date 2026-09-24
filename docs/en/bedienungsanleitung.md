# E.L.L.A. â€” User Manual

Version 1.4.0

---

## Hello â€” I'm E.L.L.A.

E.L.L.A. stands for _Embedded Local Logic Agent_ â€” your personal AI assistant for Windows. Always ready, always local, always yours.

What makes me different: I run entirely on your own machine. Your data stays with you â€” no cloud server, no subscription, no privacy fine print. Just install and go.

**No ChatGPT. No Groq. No hidden API key that makes it all possible.**
I don't need any of that â€” Ollama runs locally, the AI runs locally, your data stays local.

---

## Getting Started

### Installation

1. Run `E.L.L.A Setup 1.4.0.exe`
2. Choose an installation path (default: `C:\Program Files\E.L.L.A`)
3. The installer sets everything up automatically â€” MariaDB, Ollama, Node.js. Nothing else to install.

### First Launch

1. **Language selection** â€” German or English
2. **EULA** â€” accept the terms of use and the ELLA Directive
3. **Hardware scan** â€” ELLA detects your system and recommends a suitable language model
4. **Model selection** â€” you choose (no download without your consent)
5. **Voice selection** â€” 4 female voices in DE/EN/ES/FR with preview
6. **Location** â€” for weather and local information (optional)
7. **License activation** â€” enter your license key `ELLA-XXXX-XXXX-XXXX-XXXX`
8. **Chat** â€” you're ready

---

## The Chat

### How to Talk to Me

Just write what you need â€” in plain language, no commands, no special syntax.

### Voice Input

Click the **microphone button** or say **"Ella"** (wakeword mode). Modes:

- **Off** â€” no automatic listening
- **Manual** â€” microphone button only
- **Wakeword** â€” listen for "Ella", then record
- **Always** â€” continuous listening

### Voice Output (TTS)

- **Kokoro TTS** (default) â€” local neural voice, fully offline
- **Microsoft Edge TTS** (fallback) â€” requires internet

### Feedback Loop

Thumbs up / thumbs down below each response â†’ ELLA learns your preferences and adapts permanently.

### Tool Display

When ELLA does something you briefly see which tool she used â€” full transparency over every action.

### Provider Display

The avatar panel bottom-left shows a green chip indicating whether **Ollama** (local) or **OpenAI** (cloud-optional) is currently active.

---

## All Tools at a Glance

ELLA has **85+ tools**. Here are all of them â€” with examples.

---

### Programs & Apps

#### `list_programs` â€” List programs

Shows all installed and approved programs on your system.

```
"Which programs do I have installed?"
"List all apps"
"What programs can ELLA open?"
```

#### `open_app` â€” Open app

Opens an installed application.

```
"Open Chrome"
"Start Spotify"
"Open Word"
"Open Task Manager"
```

#### `launch_app` â€” Start app with parameters

Starts an application with additional arguments or file paths.

```
"Open Notepad with the file C:\config.txt"
"Start VLC with the video on the desktop"
```

#### `load_setup` â€” Run setup

Executes a predefined setup macro â€” automatically opens and closes apps.

```
"Load my work setup"
"Start the gaming setup"
"Run setup Evening"
```

#### `create_setup` â€” Create setup

Creates a new setup macro from within the chat.

```
"Create a setup called Home Office: open Teams, Outlook and Chrome"
"New setup: in the evening close all apps and open Spotify"
```

#### `control_window` â€” Control window

Minimizes, maximizes, closes, or moves application windows.

```
"Minimize Chrome"
"Maximize the current window"
"Close all Word windows"
```

#### `pause_ella` â€” Pause ELLA

Disables the wakeword for a set amount of time.

```
"Pause ELLA for 30 minutes"
"Mute for an hour"
"ELLA, quiet please â€” 20 minutes"
```

---

### Files & Folders

#### `search_files` â€” Search files

Searches all drives for files (Windows Search Index + fallback).

```
"Search for the file Proposal"
"Find all PDFs with the word Invoice"
"Where is my resume?"
```

#### `open_file` â€” Open file

Opens a file with the default program.

```
"Open C:\Documents\Report.docx"
"Open the file you just found"
```

#### `explore_folder` â€” Open folder in Explorer

Opens a folder in Windows Explorer.

```
"Open the Downloads folder"
"Show me the Desktop folder"
"Explorer on C:\Projects"
```

#### `list_folder` â€” List folder contents

Lists the contents of a folder.

```
"What's in the Documents folder?"
"List all files in the Downloads directory"
```

#### `read_file_content` â€” Read file content

Reads and understands the contents of documents (.docx, .pdf, .xlsx, .html, .txt).

```
"What does this PDF say?"
"Read me the Excel spreadsheet Revenue2024"
"Summarize the Word document"
"What's on page 3 of the report?"
```

#### `create_document` â€” Create document

Creates a new Word or text document.

```
"Create a new Word document called Minutes"
"New text file on the desktop: Notes"
```

#### `dictate_to_document` â€” Dictate to document

Opens a Word document and inserts dictated text with AI correction.

```
"Dictate into the document Report: Dear Sir or Madam..."
"Write that into my current Word document"
```

#### `rename_file` â€” Rename file

Renames a file.

```
"Rename the file Photo1.jpg to Vacation2024.jpg"
"Rename C:\old_file.txt to new_file.txt"
```

#### `copy_file` â€” Copy file

Copies a file to a new location.

```
"Copy the document Contract to D:\Backup"
"Copy all JPGs from the desktop to E:\Photos"
```

#### `delete_file` â€” Delete single file

Deletes a specific file (with confirmation).

```
"Delete the file temp_backup.zip"
```

#### `delete_files` â€” Delete multiple files

Deletes multiple files at once.

```
"Delete all .tmp files in the Temp folder"
"Remove all old log files from C:\Logs"
```

#### `create_folder` â€” Create folder

Creates a new folder.

```
"Create a folder called Projects 2025 on the desktop"
"New folder: C:\Archive\2024"
```

#### `find_duplicates` â€” Find duplicate files

Searches drives for duplicate files and calculates wasted storage.

```
"Find duplicate files"
"How much space am I wasting on duplicates?"
"Find duplicate photos on drive D"
```

---

### System & Performance

#### `get_disk_usage` â€” Disk usage

Shows free and used storage per drive.

```
"How much space is left on drive C?"
"Show disk usage"
"Am I running out of space on D?"
```

#### `get_system_info` â€” System information

Shows CPU, RAM, operating system and hardware details.

```
"What processor do I have?"
"Show me my system specs"
"How much RAM is installed?"
```

#### `get_system_status` â€” System status

Current status: CPU load, RAM, drives at a glance.

```
"How is my system running right now?"
"System check please"
"Is everything okay with the computer?"
```

#### `get_temperatures` â€” Temperatures

Shows CPU and GPU temperatures.

```
"How hot is my CPU?"
"Show temperatures"
"Is my computer overheating?"
```

#### `get_battery_status` â€” Battery status

Shows battery status and charge level (laptops).

```
"How much battery do I have left?"
"Is my laptop charging?"
```

#### `free_ram` â€” Free RAM

Releases unused RAM.

```
"Free the RAM"
"Clear memory"
"My computer is slow, clean up the memory"
```

#### `clean_temp` â€” Clean temp files

Deletes temporary system files.

```
"Clean up the temp files"
"Clear the cache"
"Empty the temp folder"
```

#### `empty_recycle_bin` â€” Empty recycle bin

Empties the Windows Recycle Bin.

```
"Empty the recycle bin"
"Clear the trash"
```

#### `get_event_log` â€” Windows event log

Reads Windows system events and errors.

```
"What's in the Windows event log?"
"Were there any system errors today?"
"Show me the latest Windows error messages"
```

#### `list_autostart` â€” Autostart programs

Shows all programs that start automatically with Windows.

```
"Which programs start automatically with Windows?"
"Show autostart list"
"What loads when I boot up?"
```

#### `toggle_dark_mode` â€” Toggle dark mode

Switches Windows Dark Mode on or off.

```
"Turn on dark mode"
"Switch to light theme"
"Toggle dark mode"
```

#### `shutdown_system` â€” Shutdown / restart

Shuts down or restarts Windows.

```
"Shut down the computer"
"Restart Windows"
"Shut down in 5 minutes"
```

---

### Processes & Services

#### `list_processes` â€” List processes

Shows all running processes, sorted by CPU or RAM usage.

```
"Which processes are running?"
"What's using the most RAM?"
"Show me the top 10 by CPU usage"
```

#### `kill_process` â€” End process

Ends a running process (system-critical processes are protected).

```
"End the process chrome.exe"
"Kill the Firefox process"
"End all frozen Word instances"
```

#### `manage_service` â€” Manage Windows services

Starts, stops or lists Windows services.

```
"List all Windows services"
"Start the print spooler service"
"Stop the Windows Update service"
```

#### `run_command` â€” Run command

Executes a shell command and returns the result.

```
"Run the command ipconfig /all"
"Start the script setup.bat"
```

---

### Drives & Storage Media

#### `format_drive` â€” Format drive

Formats a drive (system drives protected, confirmation required).

```
"Format my USB stick"
"Format drive F as NTFS"
```

#### `rename_drive` â€” Rename drive

Gives a drive a new label.

```
"Rename drive E to Data"
"Change the label of D: to Backup"
```

---

### Network

#### `scan_network` â€” Scan network

Scans the local network via ARP and shows all connected devices.

```
"Who's on my network?"
"Show me all devices on the WiFi"
"Start a network scan"
```

#### `list_connections` â€” TCP connections

Shows active network connections and open ports.

```
"Show me active TCP connections"
"Which ports are open?"
"What's currently connecting to the internet?"
```

#### `list_devices` â€” Connected devices

Lists all currently detected devices (USB, network, Bluetooth).

```
"What devices are connected?"
"What USB sticks are plugged in?"
```

#### `get_wifi_info` â€” WiFi status

Shows WiFi connection details: SSID, signal, IP address.

```
"What's my WiFi status?"
"How strong is my WiFi signal?"
"What network am I connected to?"
```

---

### Mail & Calendar

#### `read_emails` â€” Read Outlook emails

Reads unread or filtered Outlook emails.

```
"Show me my unread emails"
"What did Klaus write?"
"New emails from today please"
```

#### `mark_email` â€” Mark Outlook email

Marks an email as read, spam, or archived.

```
"Mark the email from Klaus as read"
"Mark the last email as spam"
"Archive the email with that subject"
```

#### `compose_email` â€” Compose email

Opens an Outlook draft with AI-formulated text (does not send automatically).

```
"Write a draft to Klaus: meeting tomorrow at 2pm?"
"Email to team@company.com: the meeting is postponed"
```

#### `read_gmail` â€” Read Gmail

Reads Gmail emails via OAuth 2.0 (one-time setup in Settings).

```
"Show me my Gmail emails"
"Unread Gmail from today"
```

#### `mark_gmail` â€” Mark Gmail email

Marks Gmail emails as read, spam, or archived.

```
"Mark Gmail email as read"
"Move spam email in Gmail"
```

#### `read_calendar` â€” Read Outlook calendar

Reads calendar appointments from Outlook.

```
"What's on my calendar this week?"
"What appointments do I have tomorrow?"
"Show me the calendar for next Monday"
```

#### `create_appointment` â€” Create Outlook appointment

Creates a new appointment in Outlook.

```
"Create an appointment: dentist, Friday at 10am"
"Meeting with Klaus: Thursday 2pm, 1 hour"
```

#### `read_google_calendar` â€” Read Google Calendar

Reads Google Calendar via OAuth 2.0.

```
"What's on my Google Calendar today?"
"Google appointments for this week"
```

#### `create_google_appointment` â€” Create Google appointment

Creates an appointment in Google Calendar.

```
"Appointment in Google Calendar: doctor, Monday 9am"
```

---

### Tasks & Alarms

#### `add_task` â€” Add task

Adds a task to the persistent todo list (survives restarts).

```
"Add the task 'File taxes'"
"Todo: call back Miller"
"New to-do: finish the proposal by Friday"
```

#### `list_tasks` â€” Show tasks

Shows all open or completed tasks.

```
"Show me my open tasks"
"What's still on my todo list?"
"Show completed tasks"
```

#### `complete_task` â€” Complete task

Marks a task as done.

```
"Mark 'File taxes' as done"
"Check off task 3"
```

#### `delete_task` â€” Delete task

Removes a task from the list.

```
"Delete the task call back Miller"
"Remove task 5"
```

#### `set_alarm` â€” Set alarm

Sets an alarm â€” ELLA triggers it with a voice alert.

```
"Set an alarm for 7:30"
"Alarm tomorrow morning at 6"
"Wake me up in 45 minutes"
```

#### `list_alarms` â€” Show alarms

Shows all active alarms.

```
"Which alarms are active?"
"Show my alarms"
```

#### `delete_alarm` â€” Delete alarm

Deletes a set alarm.

```
"Delete the 7:30 alarm"
"Remove the alarm for tomorrow"
```

#### `set_reminder` â€” Set reminder

Creates a reminder via Windows Task Scheduler â€” appears as a popup at the set time.

```
"Remind me tomorrow at 3pm: call the doctor's office"
"Reminder: Friday 9am â€” pay invoice"
```

#### `list_reminders` â€” Show reminders

Shows all active reminders.

```
"What reminders do I have?"
"Show my reminders"
```

#### `delete_reminder` â€” Delete reminder

Deletes a scheduled reminder.

```
"Delete the doctor reminder"
```

---

### System Control

#### `set_volume` â€” Control volume

Sets the Windows system volume.

```
"Set the volume to 40 percent"
"Quieter please â€” to 10"
"Maximum volume"
"Mute"
```

#### `get_clipboard` â€” Read clipboard

Reads the current clipboard contents (including the last 20 entries).

```
"What's in the clipboard?"
"What did I last copy?"
"Show me the clipboard history"
```

#### `set_clipboard` â€” Set clipboard

Writes text to the clipboard.

```
"Copy 'Hello World' to the clipboard"
"Write my email address to the clipboard"
```

#### `send_keys` â€” Simulate keys

Sends keyboard shortcuts to the active window.

```
"Send Ctrl+C to the active window"
"Press Enter"
"Send Alt+F4"
```

---

### Mouse & Screen Automation

#### `move_mouse` â€” Move mouse

Moves the mouse cursor to specific coordinates.

```
"Move the mouse to position 500, 300"
```

#### `click_at` â€” Click at position

Clicks at specific screen coordinates.

```
"Click at position 200, 400"
"Right-click at 800, 600"
```

#### `drag_drop` â€” Drag & drop

Drags an element from one position to another.

```
"Drag from 100,200 to 500,600"
```

#### `click_element` â€” Click element

Clicks on a named element on screen.

```
"Click the OK button"
"Click Save"
```

#### `read_screen` â€” Read screen

Reads text from the current screen.

```
"What does my screen say?"
"Read me the text in the active window"
```

#### `watch_screen` â€” Watch screen

Watches the screen and waits for a specific change.

```
"Wait until the download is done and let me know"
"Watch the screen for error messages"
```

#### `describe_screen` â€” Describe screen

Takes a screenshot and describes what's visible (OpenAI Vision).

```
"Describe what's happening on screen"
"What do you see on my monitor right now?"
```

#### `take_screenshot` â€” Take screenshot

Takes a screenshot and saves it.

```
"Take a screenshot"
"Screenshot of the screen"
"Photo of the current window"
```

#### `describe_image` â€” Analyze image

Analyzes a pasted image with GPT-4o Vision (OpenAI key required).

```
"What's in this image?" _(paste image)_
"Analyze this photo"
"Describe the image I just sent"
```

#### `describe_webpage` â€” Analyze webpage

Loads a webpage and summarizes its content.

```
"What does this website say: https://..."
"Summarize the article at this URL"
```

---

### Internet & Search

#### `search_web` / `web_search` â€” Web search

Searches the internet via DuckDuckGo, no tracking.

```
"Search for the current Bitcoin price"
"What's the new iPhone model?"
"Who won the Champions League?"
```

#### `fetch_url` â€” Fetch URL

Loads the content of a URL and returns it.

```
"Fetch this URL and tell me what's there"
"Get the content of https://..."
```

#### `get_weather` â€” Weather

Gets the current weather for your location (Open-Meteo, no API key needed).

```
"What's the weather like today?"
"Weather for tomorrow please"
"Do I need an umbrella today?"
```

#### `get_location` â€” Location

Returns your configured location.

```
"What's my current location?"
"Where am I set to?"
```

---

### Date & Time

#### `get_datetime` â€” Date and time

Returns the current date and time.

```
"What time is it?"
"What's today's date?"
"How many days until Christmas?"
```

---

### Music & Media

#### `play_music` â€” Play music

Searches your music library and opens tracks in the media player.

```
"Play something by Coldplay"
"Open the album 'Brothers in Arms' by Dire Straits"
"Search Metallica tracks in my library"
"Play my favorite playlist"
```

#### `control_media` â€” Control media playback

Controls the current media player (play, pause, next, previous).

```
"Pause"
"Next track"
"Previous song"
"Start playback"
```

#### `get_now_playing` â€” Now playing

Shows what's currently playing.

```
"What's playing right now?"
"Which track is on?"
```

---

### Text & Language

#### `write_for_me` â€” Write text

Writes texts of any kind on request.

```
"Write me a professional cover letter for the position of..."
"Draft a decline for Klaus's invitation"
"Write an Instagram caption for this photo"
```

#### `translate_text` â€” Translate text

Translates text into any language.

```
"Translate this to German"
"How do you say this in Spanish?"
"Translate this paragraph into French"
```

#### `summarize_text` â€” Summarize text

Summarizes long text concisely.

```
"Summarize this text"
"Short version please"
"TL;DR of this article"
```

---

### Memory

#### `remember` â€” Remember

Saves information permanently in the vector store.

```
"Remember: I don't drink coffee in the morning"
"Save: my favorite color is blue"
"Remember that my car is a VW Golf"
```

#### `forget` â€” Forget

Deletes a stored memory.

```
"Forget the note about coffee"
"Delete memory entry number 3"
```

#### `list_memories` â€” Show memory

Shows all stored memories.

```
"What do you know about me?"
"Show me your memory"
"My saved notes please"
```

---

### Configuration

#### `update_setting` â€” Change setting

Changes an ELLA setting through conversation.

```
"Switch to OpenAI"
"Set the provider to Ollama"
"Disable voice output"
```

#### `create_rule` â€” Create rule

Creates a new behavioral rule for ELLA.

```
"Create a rule: ELLA must not send emails"
"Rule: no alarms between 10pm and 7am"
"Block ELLA from accessing drive D"
```

#### `homework_mode` â€” Homework mode

Activates or deactivates the PIN-secured kiosk mode.

```
"Activate homework mode"
"Start children's mode"
"Deactivate homework mode" _(PIN required)_
```

---

## Multi-Agents

The most powerful feature: multiple AI agents work **in parallel** â€” faster, deeper, more at once.

> Requires OpenAI key. Ollama runs separately for normal chat.

### Predefined Pipelines

**ðŸŒ… Morning Briefing** â€” 3 agents simultaneously:

- Today's calendar appointments
- Open tasks
- Current weather

**ðŸ–¥ï¸ System Report** â€” 4 agents simultaneously:

- Storage space on all drives
- RAM and CPU usage
- Top processes by resource consumption
- Network status and connections

### Setup After Completion

Link a pipeline to a setup macro â€” after completion, apps are automatically opened or closed.

---

## Setups

Macros â€” define once, call at any time with a word.

**Create:** Settings â†’ Setups â†’ New
**Use:** "Load my work setup"

---

## Memory

Vector-based long-term storage (nomic-embed-text, local). Profile-isolated â€” each user has their own memory.

---

## Proactive Messages

ELLA reaches out proactively when:

- A drive drops below 10% free space
- RAM is sustained high
- A USB device is plugged in
- An alarm triggers
- An IBAN, tracking number, or phone number is detected in the clipboard
- A calendar appointment starts in 15 minutes
- Open tasks remain in the evening
- A long work session calls for a break

---

## User Profiles

Multiple profiles on one machine â€” each with its own memory, its own history, optional PIN.

**Settings â†’ Profiles**

---

## Homework Mode

PIN-secured kiosk: only approved apps can be opened.
No automatic expiry â€” only the PIN ends the mode.

---

## Accessibility

### Blind Mode

- TTS always active
- No markdown formatting
- Audio tones as status feedback
- All elements labeled with `aria-label`

### Deaf Mode

- TTS and microphone completely hidden
- Visual banner in chat

---

## Settings

| Area              | Content                                          |
| ----------------- | ------------------------------------------------ |
| **LLM**           | Model tier (Small/Standard/Large) + Custom Model |
| **Provider**      | Ollama (local) Â· OpenAI Â· Auto                 |
| **API Key**       | OpenAI key for GPT features and Multi-Agents     |
| **Voice**         | TTS engine, language, stress analysis            |
| **Tools**         | Enable / disable individual tools                |
| **Programs**      | Scan + search + manual approval                  |
| **Setups**        | Macros for app combinations                      |
| **Rules**         | Allow / deny individual actions                  |
| **Profiles**      | Manage user profiles                             |
| **Homework**      | Configure children's mode                        |
| **Accessibility** | Blind and deaf mode                              |

### Custom Model (new in v1.3.0)

You're not limited to the three predefined models. Under **Settings â†’ LLM â†’ Custom Model**:

- All models already installed in Ollama appear as clickable options
- Free text field for any model name after `ollama pull`

Example: `ollama pull qwen2.5:32b` in terminal â†’ immediately selectable in ELLA.

### Programs (improved in v1.3.0)

If a program doesn't appear in the scanned list:

1. **Search:** Type the program name â†’ ELLA searches all drives
2. **Browse:** Navigate directly to the .exe and add it

Newly installed programs are automatically approved after scanning â€” you only need to explicitly block what ELLA shouldn't use.

---

## The ELLA Directive

Four absolute prohibitions â€” anchored in the architecture, not disableable:

1. **harm** â€” no damage: physical, financial, psychological, data-related
2. **conceal** â€” no concealment of actions or capabilities
3. **surveil** â€” no monitoring without knowledge and consent
4. **exfiltrate** â€” no data sharing without explicit consent

Refusals appear as a red **DIRECTIVE** banner in chat.

---

## Privacy

- All data stays on your machine
- No telemetry, no tracking
- Ollama runs fully offline
- OpenAI features (Vision, Multi-Agents) only when a key is configured and actively used
- OpenAI does not train models on API data

---

## Frequently Asked Questions

**ELLA isn't responding?**
Ollama may not be running. The orange banner at the top of the chat indicates this. Restart Ollama or switch to OpenAI.

**Can I use ELLA offline?**
Yes â€” completely. Only weather (Open-Meteo), Gmail/Google Calendar, and OpenAI features need internet.

**How do I change the language model?**
Settings â†’ LLM â†’ choose a model or enter a custom name.

**How do I add a program ELLA can't find?**
Settings â†’ Programs â†’ search field or Browse button.

**What's the difference between Chat and Multi-Agents?**
Chat: one agent, sequential. Multi-Agents: multiple OpenAI agents in parallel â€” faster, more depth.

**ELLA declined something?**
Either one of your own rules is active or the ELLA Directive applies. The red banner explains why. Rules can be adjusted in Settings.

**How do I clear the memory?**
Say "Forget everything about me" â€” or individual entries: "Show me your memory" â†’ "Forget entry number X".

---

_E.L.L.A. v1.3.0 â€” Embedded Local Logic Agent_
_Built for Windows 10/11 (x64)_

---

## New in v1.4.0

### Chess

E.L.L.A. opens a standalone chess window - 4 board themes, AI opponent, move commentary via voice, game state saved automatically.

`
Open the chess window
Let's play a game of chess
`

### Memory Browser

Full UI for browsing and managing all stored memories - full-text search, type filter, pagination.

`
Show me all memories about work
List all system notes
`

### Knowledge Graph

Visual graph of semantic connections between E.L.L.A.'s memories - D3 Force-Directed, interactive. Optionally includes indexed documents as nodes.

Available via: **Settings -> Memory -> Show Graph**

### Backup and Restore

JSON export of all data (memories, rules, alarms, tasks, setups) - import with merge or replace mode.

Available via: **Settings -> Backup**

### Hardware Detail Tools

New tools: GPU info, RAM details, drive health, audio devices, USB devices.

`
Show me my GPU details
How healthy is my hard drive?
Which audio devices are connected?
`

### Document Indexing and Auto-Re-Index

E.L.L.A. indexes folders for semantic search and keeps them updated daily. New files are reported proactively.

`
Index the folder Projects
Which folders do you know?
Search my documents for privacy policy
`

---

_E.L.L.A. v1.4.0 - Embedded Local Logic Agent_
_Developed for Windows 10/11 (x64)_
