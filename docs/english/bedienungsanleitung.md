# E.L.L.A. — User Manual

Version 3.9.0

---

## Table of Contents

1. [What is E.L.L.A.?](#1-what-is-ella)
2. [Requirements](#2-requirements)
3. [Installation and First Launch](#3-installation-and-first-launch)
4. [Onboarding](#4-onboarding)
5. [The User Interface](#5-the-user-interface)
6. [Talking to ELLA — Examples](#6-talking-to-ella--examples)
7. [Task List](#7-task-list)
8. [Voice and Wakeword](#8-voice-and-wakeword)
9. [Proactive Intelligence](#9-proactive-intelligence)
10. [User Profiles](#10-user-profiles)
11. [Settings](#11-settings)
12. [The E.L.L.A. Directive](#12-the-ella-directive)
13. [Homework Mode](#13-homework-mode)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. What is E.L.L.A.?

E.L.L.A. is a personal AI assistant for Windows. The name stands for **Embedded Local Logic Agent** — an assistant that runs on your own machine without sending your data to the cloud.

ELLA understands natural language and can operate your computer for you: launch apps, search files, compose emails, look up appointments, set reminders, manage tasks, play music — and much more. Instead of clicking through menus, you simply say or type what you need.

ELLA learns over time: it remembers your habits, recognizes patterns in your work, and proactively reaches out when something is important — without you having to ask.

### Operating Modes

| Mode                 | Description                                              | Requirement                          |
| -------------------- | -------------------------------------------------------- | ------------------------------------ |
| **Offline (Ollama)** | Everything stays on your machine, no internet required   | Ollama installed, llama3.1:8b loaded |
| **Online (OpenAI)**  | Faster, more precise responses and extended capabilities | OpenAI API key in Settings           |

In **Auto** mode, ELLA automatically uses OpenAI when an API key is present, otherwise Ollama.

> **Privacy note:** Certain features such as window context and conversation compression work exclusively in Ollama mode and never send data to external services.

---

## 2. Requirements

| Program         | Purpose                                 | Download    |
| --------------- | --------------------------------------- | ----------- |
| **Ollama**      | Local AI model (offline operation)      | ollama.ai   |
| **MariaDB**     | Database for memory, tasks, and logs    | mariadb.org |
| **Node.js 20+** | Runtime environment                     | nodejs.org  |
| **Python 3.12** | Wakeword detection, optional Kokoro TTS | python.org  |

### Loading Ollama Models (one-time)

```powershell
ollama pull llama3.1:8b        # Chat model (approx. 4.7 GB)
ollama pull nomic-embed-text   # Memory model (approx. 274 MB)
```

### Python Packages for Wakeword (one-time)

```powershell
py -3.12 -m pip install openwakeword onnxruntime soundfile
```

### Optional: Kokoro TTS for Better Voice Output

```powershell
py -3.12 -m pip install kokoro-onnx sounddevice numpy
```

Kokoro is a local neural TTS engine that sounds more natural than the built-in Windows voices. It runs entirely offline and can be enabled in Settings.

> **Note:** `numpy` is already required and will be installed alongside Kokoro. The stress analysis server (`stress_server.py`) requires no additional packages.

---

## 3. Installation and First Launch

### Installation with the Installer

1. Download and run `E.L.L.A.-Setup.exe`
2. The installer sets up all necessary files
3. After installation, launch ELLA via the desktop shortcut

### On First Launch

ELLA automatically checks whether all requirements are met:

- Is Ollama running? Are the models loaded?
- Is MariaDB reachable?
- Has Onboarding been completed?

If anything is missing, ELLA shows a setup screen with precise instructions and a progress indicator.

---

## 4. Onboarding

On the very first launch, ELLA guides you through a brief setup process:

**Step 1 — EULA**
Read and accept the terms of use.

**Step 2 — Your Name**
Tell ELLA what your name is. It will remember this and address you personally.

**Step 3 — The E.L.L.A. Directive**
ELLA explains its four immutable prohibitions. You confirm that you have understood them.

**Step 4 — Hardware Scan**
ELLA scans your machine and learns about your drives and their capacities.

**Step 5 — Choose a Voice**
Choose ELLA's voice and language for voice output. Four female voices are available:

| Language | MsEdgeTTS (online) | Kokoro (offline) |
| -------- | ------------------ | ---------------- |
| Deutsch  | Katja              | af_sarah         |
| English  | Sonia              | bf_emma          |
| Español  | Elvira             | ef_dora          |
| Français | Denise             | ff_siwis         |

Click a voice to hear a preview — ELLA speaks in the respective language. This choice is independent of the app language (DE/EN).

**Step 6 — Location**
Optional: share your location with ELLA for weather and local information.

After Onboarding, the normal chat begins.

---

## 5. The User Interface

### Main Window

**Left — Navigation**
Sidebar with Chat, Settings, and the profile switcher.

**Center — Chat**
This is where your conversation with ELLA takes place. You see all messages, tool executions, and system notifications. Proactive messages from ELLA appear here on their own — without you having asked anything.

**Feedback Buttons**
Small thumbs-up/down buttons appear under each of ELLA's responses when you hover over them. You can use these to give ELLA feedback. The feedback is saved — but is never embedded in the conversation context (no security risk).

**Bottom — Input**
Text field for messages. Enter sends, Shift+Enter inserts a line break.

### System Tray

ELLA runs in the background and is accessible via the tray icon (bottom-right taskbar):

- Open/minimize the window
- Enable/disable autostart
- Quit ELLA

### Toast Notifications

For system events (full disk, RAM warning, new USB device, clipboard pattern) brief messages appear in the chat. These are read aloud when TTS is enabled.

### Confirmation Card

For dangerous actions (formatting a USB drive, terminating a process), ELLA shows a confirmation card before acting. You must explicitly confirm.

---

## 6. Talking to ELLA — Examples

You can write or speak to ELLA just as you would with a person.

### Programs and Setups

```
"Open Chrome"
"Start my morning setup"
"Which programs have I configured?"
"Close VLC"
```

### Files and Documents

```
"Search for the file Offer"
"Search all PDFs named Invoice on drive E"
"Open the file C:\Documents\Letter.docx and go to the end"
"Show me the folder E:\Projects"
"Create a new Word document"
"Search for duplicate files on my drives"
```

### Dictation

ELLA types dictated text into an open Word document and automatically corrects spelling, grammar, and punctuation:

```
"Write: Dear Sir or Madam I wanted to let you know
 that the offer is still valid"
```

ELLA writes: _"Dear Sir or Madam, I wanted to let you know that the offer is still valid."_

### Composing an Email

```
"Write an email to mueller@company.com"
"Subject: Appointment cancellation, Body: I unfortunately have to reschedule the appointment"
"Write me a cancellation to Mr Schmidt"
```

The Outlook window opens with the prepared draft. You send it yourself — ELLA never sends automatically.

### Writing in Your Own Style

ELLA analyzes your writing style from previous emails and adopts your tone and typical phrasing:

```
"Write me a cancellation to Mr Müller about the appointment next Tuesday"
"Draft a friendly payment reminder for invoice 2024-042"
"Write a short thank-you message to the team"
```

### Calendar and Appointments

```
"What's on the calendar today?"
"What appointments do I have this week?"
"Create an appointment tomorrow at 2 PM: Dentist"
"Show me my Google appointments for next week"
```

### Reading Emails

```
"Show me my unread emails"
"Read the last 10 emails"
"Mark the email from Müller as read"
"Show me my Gmail messages"
```

### Music

```
"Play music"
"Play something by AC/DC"
"Open my jazz playlist"
"Play the album Thriller"
```

### System and Hardware

```
"How much storage space is left?"
"How much RAM is currently in use?"
"Show me the system status"
"Shut down the computer"
"Hibernate"
```

### Processes

```
"Which programs are currently using the most RAM?"
"Show me the running processes"
"Terminate Notepad"
```

System-critical processes (Windows services) cannot be terminated by ELLA. For all others, it asks first.

### Volume

```
"Set the volume to 40%"
"Mute the sound"
```

### Clipboard

```
"What is in the clipboard?"
"Show me the last clipboard entries"
"Copy the text: Hello World"
```

ELLA automatically remembers the last 20 clipboard contents.

### Reminders

```
"Remind me tomorrow at 9 AM: Call the doctor"
"Set a reminder for Friday at 3 PM: Prepare for the meeting"
"What reminders do I have?"
"Delete reminder 1234567890"
```

Reminders appear as Windows pop-ups — even when ELLA is running in the background.

### Screenshot and Image Analysis

```
"What do you see?"
"What is on my screen?"
"What does this error message mean?"
```

Requires an OpenAI API key.

### Network

```
"Which devices are on my network?"
"Show me all active connections"
```

### Autostart

```
"Which programs start automatically with Windows?"
```

### Window Automation

```
"Open the calculator"
"Minimize the active window"
"Maximize Chrome"
"Type 'Hello World' into the active window"
"Press Enter in the active window"
```

### Services

```
"Which Windows services are currently running?"
"Start the printer service"
"Stop the Spooler service"
```

### Reading and Watching the Screen

```
"What is on my screen?"
"Read the text from the active window"
"Watch the screen for 20 seconds and notify me if something changes"
```

`read_screen` reads the visible text via Windows OCR (offline, WinRT). `watch_screen` monitors text changes for up to 30 seconds and automatically reports new content.

### Managing Files

```
"Read the file C:\Documents\Notes.txt"
"Rename C:\Files\Old.txt to New.txt"
"Copy C:\Source\Report.docx to E:\Backup\"
"Create the folder E:\Projects\2026"
```

> **Note:** System directories (Windows, Program Files, ProgramData) are locked and cannot be modified.

### Mouse and Clicks

```
"Move the mouse to the center of the screen"
"Click the 'Save' button"
"Click at position 400, 300"
"Drag from 100, 200 to 500, 200"
```

`click_element` detects buttons and text via OCR and clicks precisely — even without exact coordinates. Destructive clicks always require confirmation. Clicks in password managers and banking apps are blocked.

### Shell Commands

```
"Show me all files in E:\Projects"
"Run ipconfig"
"How much memory does my system have?"
```

Shell commands are always shown for confirmation first. Over 60 dangerous commands (format, rm -rf, creating users, etc.) are permanently blocked.

### System Convenience

```
"Enable dark mode"
"What is the battery level?"
"How hot is my CPU right now?"
"Show me the latest Windows errors"
"Which Wi-Fi am I connected to?"
```

### Media

```
"Next track"
"Pause"
"Volume up"
"What is playing right now?"
"Show me the current song"
```

`control_media` controls the active media player via system keys. `get_now_playing` reads the currently playing track via Windows Media Control (WinRT).

### Translating and Summarizing

```
"Translate this text into English: Guten Morgen"
"Summarize this text: [long text]"
"Translate into Spanish: How are you?"
```

Translation and summarization run entirely locally via Ollama — or optionally via OpenAI if an API key is configured.

### Memory

```
"Remember: My tax number is 123/456/78901"
"Forget the tax number"
"What do you know about me?"
```

### Changing Settings via Conversation

```
"Create a setup called Work with Chrome, Word and Slack"
"Allow the tool clean_temp"
"Deny the tool format_drive between 9 and 5 PM"
```

### Weather and Location

```
"What is the weather like today?"
"Will it rain tomorrow?"
```

---

## 7. Task List

ELLA manages a persistent task list — tasks are retained even after a restart.

### Creating Tasks

```
"Remember: Call the dentist"
"Task: Prepare the presentation, priority high, by Friday"
"I still need to file my tax return — by July 31st"
```

### Viewing Tasks

```
"What tasks do I have?"
"Show me my open tasks"
"What is still pending?"
```

ELLA automatically sorts the list by priority (high → normal → low) and due date.

### Completing or Deleting Tasks

```
"Mark task 3 as done"
"Done: Call the dentist"
"Delete task 5"
```

### Integration in the Daily Wrap-Up

At 6 PM, ELLA automatically reports on due tasks as well:

_"You completed 14 actions today. Tomorrow you have 2 appointments. You also have 3 open tasks for tomorrow: 'Call the dentist', 'Check the invoice', 'Submit the report'. Good night."_

---

## 8. Voice and Wakeword

### Voice Modes

In Settings under **Mode**, you choose the voice mode:

| Mode         | Description                                      |
| ------------ | ------------------------------------------------ |
| **Off**      | Text input only, no voice input                  |
| **Manual**   | Press the microphone button in the chat to speak |
| **Wakeword** | ELLA listens continuously and responds to "Ella" |

### Wakeword Detection

The Wakeword is processed entirely locally — no audio data is transmitted.

### Pausing ELLA

```
"Ella, take a 30-minute break"
"Pause for one hour"
```

The Wakeword is deactivated; ELLA will check back in automatically.

### Voice Output (TTS)

ELLA reads responses, alerts, and proactive messages aloud when TTS is enabled.

### Kokoro TTS — Better Voice

If `kokoro-onnx` is installed, the **TTS Engine** can be switched to "Kokoro" in Settings under **Mode**. Kokoro sounds considerably more natural than standard Windows voices and runs entirely locally.

If Kokoro is not available, ELLA automatically falls back to the Windows voice.

### Conversation Language and Voice

In Settings under **Voice → Conversation Language**, you choose which language ELLA should speak — regardless of which language you write to it in:

- **Deutsch — Katja** (default)
- **English — Sonia**
- **Español — Elvira**
- **Français — Denise**

### Stress Detection (opt-in)

Under **Voice → Enable Voice Analysis**, ELLA can learn how you sound. When voice analysis is active:

- Each spoken segment is evaluated in parallel with transcription
- Detects tension in pitch, speaking rate, and energy
- When elevated stress is detected, ELLA responds more calmly and empathetically
- At high stress: _"You sound tense — is everything okay?"_

The analysis runs entirely locally (`stress_server.py`); no audio data leaves the device. The chat works normally if the server is unavailable.

---

## 9. Proactive Intelligence

ELLA acts without being prompted and writes into the chat on its own. These messages appear as ELLA messages and are read aloud when TTS is enabled.

### Automatic Triggers

| When                                 | What ELLA says                                                                                     |
| ------------------------------------ | -------------------------------------------------------------------------------------------------- |
| 30 min before a calendar appointment | _"You have an appointment in 28 minutes: Project meeting. Shall I search for relevant documents?"_ |
| 6:00 PM                              | Daily wrap-up with activities, tomorrow's appointments, and due tasks                              |
| After 30 min of inactivity + return  | _"Welcome back. While you were away: 2 system alerts."_                                            |
| After 90 min of active work          | _"You have been working for 92 minutes without a break. A short pause is recommended."_            |
| Daily at noon                        | If the same apps are opened every morning: _"Shall I create a morning setup?"_                     |
| Sundays at 10 AM                     | If > 500 MB of duplicates found: _"I found 23 groups of duplicate files."_                         |

### Clipboard Pattern Recognition

ELLA automatically detects known patterns when you copy something to the clipboard — and immediately offers help:

| Detected Pattern  | Example Suggestion                                                |
| ----------------- | ----------------------------------------------------------------- |
| **IBAN**          | _"IBAN detected — shall I insert it into a document?"_            |
| **Parcel number** | _"Parcel number detected — shall I look up the shipping status?"_ |
| **Phone number**  | _"Phone number detected — shall I create a note for it?"_         |
| **URL**           | _"URL detected — shall I open the page or summarize it?"_         |
| **Email address** | _"Email address detected — shall I prepare a new email?"_         |

This detection runs entirely locally. Clipboard contents are never sent to external services.

The feature can be disabled in Settings under **Mode → Proactive Intelligence**.

### Window Context

When enabled (Settings → Mode → Use Active Window as Context), ELLA knows which application and document you currently have open when you chat:

_"I can see you are currently working in Word on 'Offer_2024.docx' — shall I continue writing the text?"_

> **Important:** This feature is **disabled** by default and works exclusively in Ollama mode. Window titles from password managers and banking apps are never shared.

### Conversation Compression

In long conversations (from 15 messages onward), ELLA automatically summarizes the oldest messages to use the context more efficiently. You won't notice — the conversation continues normally.

> This feature uses exclusively the local Ollama model and does not send any conversation content externally.

---

## 10. User Profiles

ELLA supports multiple user profiles. Each profile has its own memory and conversation history.

### Creating Profiles

In Settings → **Profiles** (or via API), a new profile can be created with a name and color. A PIN can optionally be set.

### Switching Profiles

The profile switcher is accessible in the navigation. PIN-protected profiles will prompt for the PIN.

### Profile Isolation

- Memory entries of one profile are not visible to other profiles
- Conversation histories are separated by profile
- Task lists can be bound to a specific profile
- Global rules (allow/deny rules) apply to all profiles

### Default Profile

On first launch, the **"Default"** profile is automatically created. All existing data belongs to this profile.

### Profile PINs

Profiles can be secured with a PIN. ELLA uses PBKDF2 with salt and 100,000 iterations — significantly more secure than a simple password hash.

---

## 11. Settings

Open Settings via the gear icon in the navigation.

### Tab: LLM

| Setting            | Description                                    |
| ------------------ | ---------------------------------------------- |
| **Provider**       | Auto / OpenAI / Ollama                         |
| **Ollama Model**   | Default: `llama3.1:8b`                         |
| **OpenAI API Key** | For GPT-4o, Vision, and writing style learning |
| **Context Limit**  | Number of messages in context (default: 20)    |

### Tab: Tools

Enable or disable individual ELLA capabilities. Disabled tools are not offered to the LLM — ELLA cannot use them even if explicitly asked.

### Tab: Setups

Setups are collections of apps that ELLA launches or closes with a single command.

Setups can also be created via conversation:

```
"Create a setup called Office with Chrome, Word and Teams"
```

### Tab: Programs

- **Scan:** ELLA searches the Start menu and registry for installed programs
- **Allow/Block:** Only allowed programs can be opened by ELLA
- **Music Library:** Path to your music collection (e.g. `H:\Music`)
- **Default Media Player:** The player used for music

> **Important:** Always click **Save** after making changes.

### Tab: Mode

Voice, TTS, and proactive settings:

| Setting                          | Description                                                 |
| -------------------------------- | ----------------------------------------------------------- |
| **Voice**                        | Wakeword / Manual / Off                                     |
| **TTS**                          | Voice output on/off                                         |
| **TTS Voice**                    | Select Windows voice                                        |
| **TTS Engine**                   | System (Windows) or Kokoro (local, more natural)            |
| **Use Active Window as Context** | ELLA knows the active application during chat (Ollama only) |
| **Detect Clipboard Patterns**    | Proactively detect IBANs, parcel numbers, etc.              |
| **Conversation Compression**     | Automatically summarize long sessions (Ollama only)         |

### Tab: Rules

The rule engine controls when ELLA is allowed to perform which actions:

| Field       | Description                                                |
| ----------- | ---------------------------------------------------------- |
| **Tool**    | Which tool is affected                                     |
| **Action**  | `allow` or `deny`                                          |
| **Trigger** | `always` — or time-based (e.g. only between 9 AM and 5 PM) |

**Evaluation order:**

1. Directive (immutable prohibitions — highest priority)
2. Deny rules
3. Allow rules
4. Default: allowed

ELLA displays a red badge in the chat when a request is blocked.

### Tab: Google

1. Enter your Google Client ID and Client Secret (from the Google Cloud Console)
2. Click "Connect with Google" → browser opens → authorize
3. ELLA returns automatically

The token is stored locally and never shared.

---

## 12. The E.L.L.A. Directive

The Directive consists of four immutable prohibitions that are deeply embedded in ELLA. No setting and no rule can override them:

| Prohibition    | Meaning                                                                 |
| -------------- | ----------------------------------------------------------------------- |
| **harm**       | ELLA causes no physical, financial, psychological, or data-related harm |
| **conceal**    | ELLA does not conceal any actions, capabilities, or system states       |
| **surveil**    | ELLA does not monitor without explicit knowledge and active consent     |
| **exfiltrate** | ELLA does not share data with third parties without explicit consent    |

**Practical implications:**

- The system drive C: can never be formatted
- Unread emails cannot be automatically deleted
- Window context and compression never work with OpenAI
- Clipboard contents are never sent to external services
- ELLA does not transmit any data without your approval

---

## 13. Homework Mode

Locks ELLA to specific apps — designed for children who need to study without distractions.

### Activating

```
"Activate Homework Mode"
```

### How It Works

- Only apps from the configured whitelist can be opened
- ELLA only responds to school-related requests
- The mode is PIN-protected

### Setting Up a PIN

In Settings under **Mode** → Homework Mode → Enter new PIN → Save.

### Deactivating

```
"Deactivate Homework Mode"
```

ELLA will ask for the PIN.

### Emergency Reset

If the PIN has been forgotten: Settings → Emergency Reset disables Homework Mode without a PIN.

---

## 14. Troubleshooting

### ELLA Does Not Respond

- Ollama is not running → `sc start Ollama` or launch the Ollama app
- MariaDB is not running → `sc start MariaDB`
- No API key and Ollama model is missing → `ollama pull llama3.1:8b`

Check: _"Ella, what is your status?"_

### Wakeword Not Responding

- Check microphone permission (Windows → Privacy → Microphone)
- Check Python packages: `py -3.12 -m pip list | findstr openwakeword`
- Is Wakeword mode set to "Wakeword" in Settings?

### Tasks Disappear After Restart

- This should not happen — tasks are stored in MariaDB
- Is MariaDB running? Check with `sc query MariaDB`
- Profile switch: tasks are profile-bound; after switching profiles you will see different tasks

### Music Not Found

- Is the music library path entered correctly in Settings → Programs?
- Is the media player allowed in the programs list?
- Did you click **Save** after entering the path?

### Clipboard Patterns Not Appearing

- Is the feature enabled in Settings → Mode → "Detect Clipboard Patterns"?
- Patterns are only detected for new content (not if the same text is copied again)

### Window Context Not Working

- Is "Use Active Window as Context" enabled in Settings → Mode?
- Only available in Ollama mode — when the OpenAI provider is active, the context remains empty
- Sensitive window titles (password managers, banking) are intentionally filtered

### Kokoro TTS Not Working

- Are the Python packages installed? `py -3.12 -m pip list | findstr kokoro`
- Is Settings → Mode → TTS Engine set to "Kokoro"?
- ELLA automatically falls back to the Windows voice if Kokoro fails to start
- Restart ELLA so that the Kokoro process is launched

### Google Connection Fails

- Are Client ID and Secret entered correctly (no spaces)?
- Is "Desktop App" selected as the application type in the Google Cloud Console?
- Delete the token file and reconnect: `google-token.json` in the ELLA data folder

### Setting Is Not Saved

- Always click the **Save** button — changes are not applied automatically
- For the music library: enter the path in full, e.g. `H:\Music\`

### Profile PIN Forgotten

- Settings → Mode → Homework Mode → Emergency Reset (for Homework Mode)
- For user profiles: reset the PIN hash in the database (developer access required)

---

_E.L.L.A. v3.4.0 · Proprietary · All rights reserved_
