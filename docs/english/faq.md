# E.L.L.A. — Frequently Asked Questions (FAQ)

Version 3.9.0 — Last updated: 2026-06-20

---

## Table of Contents

1. [General — What is ELLA?](#1-general--what-is-ella)
2. [Installation & First Launch](#2-installation--first-launch)
3. [AI Models & LLM Providers](#3-ai-models--llm-providers)
4. [Voice Input & Voice Output](#4-voice-input--voice-output)
5. [Wakeword & Hands-Free Mode](#5-wakeword--hands-free-mode)
6. [Music & Media](#6-music--media)
7. [Files & Drives](#7-files--drives)
8. [Email & Calendar](#8-email--calendar)
9. [Memory & Learning](#9-memory--learning)
10. [Proactive Intelligence](#10-proactive-intelligence)
11. [Security & Privacy](#11-security--privacy)
12. [The E.L.L.A. Directive](#12-the-ella-directive)
13. [User Profiles & PIN](#13-user-profiles--pin)
14. [Accessibility](#14-accessibility)
15. [Homework Mode](#15-homework-mode)
16. [Settings & Configuration](#16-settings--configuration)
17. [Errors & Troubleshooting](#17-errors--troubleshooting)
18. [Technical Questions (Developers)](#18-technical-questions-developers)

---

## 1. General — What is ELLA?

### What is E.L.L.A.?

E.L.L.A. stands for **Embedded Local Logic Agent** — a personal AI assistant for Windows that runs entirely on your own machine. ELLA understands natural language and can operate your computer on your behalf: launching apps, searching for files, playing music, composing emails, checking appointments, setting alarms, and much more.

### What makes ELLA special?

- **Runs locally:** The AI model runs on your machine — no cloud dependency, no data transmission
- **Learns over time:** ELLA remembers habits and preferences via a vector-store memory
- **Acts proactively:** ELLA writes to the chat on its own when something is important — without you having to ask
- **Understands natural language:** You talk to ELLA like a person — no syntax to learn
- **Transparent:** ELLA displays every action before it is executed and asks for confirmation on dangerous operations
- **Immutable ethics:** Four hardcoded prohibitions (harm, concealment, surveillance, data exfiltration) cannot be bypassed by any setting

### Do I need an internet connection?

For **basic operation: no.** Chat, voice input, music, file search, system control — everything works offline.

Internet is only required for:

- Web search and weather
- OpenAI features (GPT-4o, Whisper, Vision)
- Gmail and Google Calendar (OAuth)
- Microsoft Edge TTS (voice output — can be replaced by local Kokoro TTS)

### Which systems does ELLA run on?

ELLA runs on **Windows 10 and Windows 11 (64-bit)**. A Mac or Linux version is not planned.

### Is ELLA free?

ELLA is proprietary software. The installer requires a license key (`ELLA-XXXX-XXXX-XXXX-XXXX`). The source code is publicly visible on GitHub for demonstration purposes.

---

## 2. Installation & First Launch

### How do I install ELLA?

1. Download and run `E.L.L.A Setup 1.0.0-rc.exe`
2. Choose an installation path (default: `C:\Programme\E.L.L.A`)
3. Wait for the installation to complete — all dependencies are set up automatically
4. Launch ELLA via the desktop shortcut

**Nothing else is required.** The installer includes MariaDB, Ollama, and Node.js as portable binaries.

### What happens on the very first launch?

ELLA guides you through a 6-step onboarding process:

1. **EULA** — read and accept the terms of use
2. **License activation** — enter your license key (internet connection to the license server required)
3. **Your name** — ELLA learns how to address you
4. **The Directive** — ELLA explains its four immutable prohibitions
5. **Hardware scan** — ELLA learns about your drives
6. **Voice & location** — choose voice output, optionally enter your location

### Do I need to install Ollama separately?

**No** — the installer build includes Ollama as a portable binary and starts it automatically. In **development mode** (cloned from GitHub) you need to install Ollama yourself and pull the model:

```powershell
ollama pull llama3.1:8b        # Chat model (~4.7 GB, one-time)
ollama pull nomic-embed-text   # Memory model (~274 MB, one-time)
```

### ELLA starts but shows an error banner. What should I do?

The most common reason is that Ollama or the AI model is not yet ready. ELLA displays an orange banner for this. Wait a moment — on first launch the model is loaded automatically. If the banner does not disappear after 2 minutes:

- **Installer build:** Restart ELLA (tray → Quit → double-click the ELLA icon)
- **Development mode:** Run `ollama list` to check whether `llama3.1:8b` is loaded

---

## 3. AI Models & LLM Providers

### Which AI models does ELLA use?

| Model                       | Purpose                               | Offline? |
| --------------------------- | ------------------------------------- | -------- |
| `llama3.1:8b` (Ollama)      | Chat, text processing, tool selection | Yes      |
| `nomic-embed-text` (Ollama) | Memory (vector embeddings)            | Yes      |
| `GPT-4o` (OpenAI)           | Chat fallback, Vision, writing style  | No       |
| `gpt-4o-mini` (OpenAI)      | Noise/stutter filter (contextAlign)   | No       |
| `whisper-1` (OpenAI)        | Higher-accuracy speech recognition    | No       |

### Do I need an OpenAI API key?

**No.** ELLA works fully without OpenAI. With a key, the following features become better or available at all:

- Faster and more accurate responses (GPT-4o instead of llama3.1:8b)
- Screenshot analysis and image analysis (GPT-4o Vision)
- Texts in your personal writing style (uses email analysis with GPT-4o)
- Higher-quality speech recognition (OpenAI Whisper instead of local model)
- Noise and stutter filtering for voice input (gpt-4o-mini)

Enter the key under **Settings → LLM → OpenAI API Key**.

### What is the difference between Ollama and OpenAI in ELLA?

|                          | Ollama                 | OpenAI                                                    |
| ------------------------ | ---------------------- | --------------------------------------------------------- |
| Cost                     | Free                   | Pay-per-use (~$0.006/min Whisper, gpt-4o-mini very cheap) |
| Privacy                  | Everything stays local | Data is sent to OpenAI                                    |
| Speed                    | Depends on hardware    | Fast and consistent                                       |
| Window context           | Available              | Not available (privacy)                                   |
| Conversation compression | Available              | Not available                                             |
| Vision                   | Only with LLaVA model  | Always available                                          |

### What does "Provider: Auto" mean?

In Auto mode, ELLA automatically selects the best available provider. If it has a valid OpenAI key, it uses OpenAI — otherwise Ollama. You can also force a fixed provider in Settings.

### ELLA is not responding — what is the AI model problem?

The most common issue: `llama3.1:8b` is not loaded in Ollama. You can tell by the orange Ollama banner.

**Solution:**

```powershell
ollama pull llama3.1:8b
```

This takes approximately 20 minutes the first time (4.7 GB). Then restart ELLA.

### Can I use a different Ollama model?

Yes — under **Settings → LLM → Ollama Model** you can enter any model you have loaded in Ollama (e.g. `mistral`, `phi3`, `gemma2`). The recommended model is `llama3.1:8b` — smaller models may have trouble with complex tool calls.

---

## 4. Voice Input & Voice Output

### How do I talk to ELLA?

Three ways are available:

1. **Text:** Type your message and press Enter
2. **Microphone button:** Click the microphone icon in the chat for a one-time recording
3. **Wakeword:** Say "Ella" — ELLA then listens for your command (must be enabled)
4. **Hands-free (Always-On):** ELLA listens continuously and responds to everything you say

### Do I need internet for voice input?

The **Web Speech API** (Chromium built-in, default) requires an internet connection because it uses Microsoft/Google servers.

If you want to stay completely offline: in Settings you can switch to local speech recognition (Whisper-small, runs on your machine) — no internet needed, but slightly slower.

### What is contextAlign and what is it for?

contextAlign is a filter between your voice and ELLA. When you speak and there is music playing in the background, the TV is on, or you stutter, ELLA detects this and filters it out. Only your actual command is sent to ELLA.

**Example:**

- What you say: _"uh ella uh open open the Explorer is this the real life"_
- What ELLA hears: _"Open Explorer"_
- TV audio in the background → ELLA ignores it (NO_COMMAND)

For this, ELLA needs either the Ollama model or an OpenAI key.

### How do I enable voice output (TTS)?

Set **Settings → Mode → TTS** to "On". ELLA will then read all responses, alerts, and proactive messages aloud automatically.

Default voice: `de-DE-KatjaNeural` (Microsoft Edge Neural TTS, free, requires internet).

### Can ELLA speak without an internet connection?

Yes — with **Kokoro TTS**. This is a local neural voice that sounds significantly more natural than standard Windows voices.

Prerequisite: Python 3.12 with kokoro-onnx:

```powershell
py -3.12 -m pip install kokoro-onnx sounddevice numpy
```

Then set **Settings → Mode → TTS Engine** to "Kokoro".

### Can I change the voice?

Yes — under **Settings → Voice → Spoken Language** you can choose from 4 female voices:

| Language | Online (MsEdgeTTS) | Offline (Kokoro) |
| -------- | ------------------ | ---------------- |
| German   | Katja              | af_sarah         |
| English  | Sonia              | bf_emma          |
| Spanish  | Elvira             | ef_dora          |
| French   | Denise             | ff_siwis         |

The choice applies regardless of the language you type or speak in.

### Can ELLA detect whether I am stressed?

Yes — with the optional **stress detection** under **Settings → Voice → Enable Voice Analysis**.

ELLA analyzes the raw data of your voice (pitch, speech rate, volume) in parallel with speech recognition and adjusts its tone when tension is detected. Under high stress, ELLA actively asks how you are doing.

The analysis runs entirely locally (`stress_server.py`, port 3004) — no audio data leaves the device. This feature is disabled by default and must be deliberately switched on.

---

## 5. Wakeword & Hands-Free Mode

### What is the difference between Wakeword and Hands-Free?

| Mode                       | How it works                                                                |
| -------------------------- | --------------------------------------------------------------------------- |
| **Wakeword**               | ELLA listens for the keyword "Ella" and then responds to the next sentence  |
| **Hands-Free (Always-On)** | ELLA listens continuously and sends everything you say directly to the chat |
| **Manual**                 | You press the microphone button — ELLA only listens then                    |

### How do I enable the Wakeword?

Set **Settings → Mode → Voice** to "Wakeword".

The Wakeword runs entirely locally (Python + openWakeWord + ONNX) — no audio data is transmitted. Prerequisites for development mode:

```powershell
py -3.12 -m pip install openwakeword onnxruntime soundfile
```

### How do I pause the Wakeword?

```
"Ella, take a 30-minute break"
"Pause for an hour"
```

ELLA deactivates the Wakeword and automatically checks back in when the time has elapsed.

### Does ELLA always listen — even when I make a private phone call?

In **Hands-Free Mode (Always-On)** yes — ELLA listens continuously and processes everything. Hands-Free Mode is intended for users who want ELLA to be available at all times.

If you want privacy: use **Wakeword Mode** (ELLA only activates after the keyword) or set the mode to **Manual** or **Off**.

### Can I teach ELLA to only listen to my voice?

ELLA does not currently recognize individual voices — the Wakeword model responds to the word "Ella" regardless of who says it. Speaker identification is on the roadmap.

---

## 6. Music & Media

### How do I tell ELLA where my music is?

**Settings → Programs → Music Library** — enter the path to your music collection there, e.g. `H:\Music`. Click **Save** after entering.

Additional paths can be added under **Settings → Programs → Additional Music Paths** (separate multiple paths with a comma).

### ELLA cannot find my music — what should I do?

1. **Is the path correct?** → Check Settings → Programs → Music Library
2. **Is the drive in the search list?** → Settings → Programs → Search Drives (e.g. `C, D, E, H`)
3. **Was it saved?** → Click **Save** after every change
4. **Windows Search Index?** → Not all drives are indexed. ELLA automatically falls back to a direct search, which takes a bit longer

### How do I search for music?

```
"Play music"
"Play something by Rammstein"
"Open the Thriller album by Michael Jackson"
"Play my rock playlist"
```

ELLA searches for folders and files matching the search term and opens them in the configured media player.

### Which media player is used?

The player entered under **Settings → Programs → Default Media Player**. Default: Windows Media Player. You can enter any player you like (e.g. `vlc`, `wmplayer`, `foobar2000`).

### Can ELLA control the media player (Play/Pause/Next)?

Yes — via system keys:

```
"Next track"
"Pause"
"Volume up"
"What's playing right now?"
```

`control_media` sends VK_MEDIA keys to Windows. `get_now_playing` reads the currently playing track via Windows Media Control (WinRT).

---

## 7. Files & Drives

### Can ELLA search for files on all drives?

Yes — but by default ELLA only searches on `C:\`. To include additional drives:

**Settings → Programs → Search Drives** — enter all desired drive letters (e.g. `C, D, E, H, Z`).

ELLA first uses the Windows Search Index (very fast) and falls back to a direct search if a drive is not indexed.

### Can ELLA format system drives?

**No** — this is a hard, immutable prohibition (Directive). The following drives are always locked:

- **C:** (system drive)
- The drive on which ELLA is installed
- All drives listed under **Settings → Drives → Protected Drives**

USB sticks (DriveType 2) can be formatted — but only after explicit confirmation.

### Can ELLA delete files?

ELLA moves files to the **Recycle Bin** — permanent deletion without the Recycle Bin is not possible. The Recycle Bin always gives you the opportunity to undo the action.

### Can ELLA read or edit system paths?

No — the following directories are always locked:
`C:\Windows`, `C:\Program Files`, `C:\ProgramData`, `C:\Users\Default`, and other system paths.

### How do I find duplicate files?

```
"Search for duplicate files on my drives"
"Which files do I have twice on E:?"
```

ELLA compares files by hash value (not just name) and shows you how much storage you would free up by deleting the duplicates.

---

## 8. Email & Calendar

### Which email services does ELLA support?

- **Outlook** (via COM automation, no setup needed if Outlook is installed)
- **Gmail** (via Google OAuth 2.0 — one-time setup in Settings)

### Can ELLA send emails automatically?

**No** — for security reasons. ELLA opens a draft in Outlook with the prepared text. You send the email yourself. This prevents accidental or malicious automatic sends.

### How do I connect Gmail?

1. Create an app in the [Google Cloud Console](https://console.cloud.google.com) (OAuth 2.0, Desktop type)
2. Copy the Client ID and Client Secret
3. In ELLA: **Settings → Google → enter Client ID + Secret**
4. Click "Connect with Google" → browser opens → select your Google account → confirm
5. ELLA returns automatically

The token is stored locally in `google-token.json` and is never shared.

### Can ELLA edit my Google Calendar?

Yes — both reading and creating events:

```
"What is on my Google Calendar today?"
"Create an appointment tomorrow at 2 PM: Dentist"
```

---

## 9. Memory & Learning

### How does ELLA remember things?

ELLA uses **ML memory** with vector embeddings (nomic-embed-text model). Information is stored as semantic vectors and retrieved automatically for relevant queries — similar to human associations.

```
"Remember: My tax ID is 123/456/78901"
"Remember: I don't like emails on Friday afternoons"
"What do you know about me?"
```

### How many things can ELLA remember?

There is no fixed limit. ELLA retrieves the **3 most similar memories** (cosine similarity) for each query. Very old or rarely used memories may be displaced by newer ones.

### Can I delete memories?

Yes:

```
"Forget my tax ID"
"What do you know about me?" → note the memory ID
"Forget memory 42"
```

### Does ELLA learn from feedback?

Yes — the **thumbs buttons** below each response give ELLA feedback. Thumbs up/down is saved and ELLA extracts user preferences from it (e.g. "user prefers short answers") which flow into memory.

The feedback **never** enters the active conversation context — no security risk.

### Does ELLA learn my writing style?

Yes — with an OpenAI key. When you ask ELLA to write a text "in your style", it analyzes existing emails and adopts your tone, typical phrasing, and sentence structure.

```
"Write a rejection letter to Mr. Miller in my style"
"Draft a friendly payment reminder for me"
```

---

## 10. Proactive Intelligence

### Does ELLA write to the chat without being asked?

Yes — this is one of the core features. ELLA monitors your computer and writes to the chat on its own when:

| Event                         | What ELLA says                                                         |
| ----------------------------- | ---------------------------------------------------------------------- |
| 30 min before an appointment  | Meeting preparation, offer to retrieve documents                       |
| 6:00 PM                       | End-of-day summary with activities, tomorrow's appointments, due tasks |
| USB stick connected           | Drive announced, contents offered                                      |
| RAM above 85%                 | Warning + offer to clean up                                            |
| Hard drive above 90% full     | Warning + cleanup options                                              |
| 30 min inactive + return      | Comeback briefing: what has changed?                                   |
| 90 min of uninterrupted work  | Break recommendation                                                   |
| IBAN in clipboard             | Context offer                                                          |
| Parcel tracking number copied | Offer to track shipment                                                |

### Can I disable the proactive messages?

Yes — individually or all at once:

- **Settings → Mode → Proactive Intelligence** — turn off (all proactive messages)
- **Settings → Mode → Detect Clipboard Patterns** — separately disableable

### What is the Comeback Briefing?

When you have been inactive for more than 30 minutes and return, ELLA summarizes what happened in your absence — system alerts, new emails, clipboard events.

---

## 11. Security & Privacy

### Does ELLA send my data to the cloud?

By default **no** — in pure Ollama mode, no conversation data leaves your machine.

With an OpenAI key, the following data is sent to OpenAI:

- The conversation history (chat messages)
- Audio files when you use Whisper speech recognition
- Screenshots when you use screenshot analysis

Never sent to external services (even with OpenAI):

- Clipboard contents
- Window context (active application)
- Conversation compressions
- Memory contents

### Where is my data stored?

| Data                 | Location                                      |
| -------------------- | --------------------------------------------- |
| Conversation history | MariaDB local (`%APPDATA%\ELLA\mariadb-data`) |
| Memory               | MariaDB local (vector embeddings)             |
| Settings             | `%APPDATA%\ELLA\settings.json`                |
| Google token         | `%APPDATA%\ELLA\google-token.json`            |
| Profile PINs         | MariaDB (PBKDF2+Salt, 100,000 iterations)     |
| OpenAI key           | `%APPDATA%\ELLA\settings.json` (local)        |

Everything stays on your machine. No cloud sync, no telemetry.

### How secure are my profile PINs?

PINs are stored with **PBKDF2+Salt and 100,000 iterations** — an industry standard for password hashing. Even if someone gained access to the database, cracking a PIN would be very costly.

### Can ELLA activate my webcam or microphone without my knowledge?

**No.** The E.L.L.A. Directive prohibits **surveil** — no surveillance without explicit knowledge and active consent. The microphone is only activated when you explicitly request it (Wakeword, microphone button, or Hands-Free Mode that you have enabled yourself).

### Can ELLA read my passwords?

No — windows from password managers and banking apps (1Password, KeePass, Bitwarden, PayPal, banking URLs, etc.) are locked for all mouse and window tools. System paths that could contain passwords are also blocked.

---

## 12. The E.L.L.A. Directive

### What is the E.L.L.A. Directive?

Four immutable prohibitions that are deeply embedded in the architecture. No setting and no rule can override them:

| Prohibition    | Meaning                                                                      |
| -------------- | ---------------------------------------------------------------------------- |
| **harm**       | ELLA does not cause physical, financial, psychological, or data-related harm |
| **conceal**    | ELLA does not conceal actions, capabilities, or system states                |
| **surveil**    | ELLA does not monitor without explicit knowledge and active consent          |
| **exfiltrate** | ELLA does not share data with third parties without explicit consent         |

### What happens when ELLA blocks something?

ELLA displays a **red badge** in the chat with an explanation of why the action was blocked. You cannot bypass the decision — neither by rephrasing nor through settings.

### Can I change the Directive?

**No.** The Directive is architecturally embedded — not in the database, not in settings. It exists as code constants that are evaluated on every request.

---

## 13. User Profiles & PIN

### What are user profiles?

Multiple people can use ELLA with separate memories and conversation histories. Each profile is fully isolated — one profile cannot access the memory of another.

### How do I create a new profile?

**Settings → Profiles → New Profile** — choose a name and color, optionally set a PIN.

### How do I switch profiles?

Via the profile switcher in the navigation. PIN-protected profiles will prompt for the PIN.

### What happens if I forget my profile PIN?

For **user profiles**, resetting is only possible with direct database access. In this case, contact the developer.

For the **Homework Mode PIN**, there is an emergency reset under Settings → Homework Mode.

### Do profiles share settings?

Global settings (LLM provider, TTS, rules) apply to all profiles. Memory and conversation history are profile-specific.

---

## 14. Accessibility

### Which accessibility modes are available?

ELLA supports two special modes under **Settings → Mode → Accessibility**:

| Mode           | For whom          | What changes                                                                                                                |
| -------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Blind Mode** | Visually impaired | TTS always active, audio feedback on microphone (tone = ready), responses formatted without Markdown, image analysis active |
| **Deaf Mode**  | Hearing impaired  | All audio output disabled (no TTS, no sounds), text only                                                                    |

### What can ELLA do for blind users?

In Blind Mode, ELLA reads all responses aloud automatically. Additionally, ELLA can:

```
"What do you see on my screen?"
"Describe this image: [path]"
"Describe the website: example.com"
```

Image analysis uses GPT-4o Vision (OpenAI key required) or a locally installed LLaVA model.

### Is there audio feedback for voice commands?

In Blind Mode: yes. A short tone signals:

- **High tone (880 Hz):** Microphone starts — ELLA is now listening
- **Low tone (440 Hz):** Response is ready — ELLA reads it aloud

---

## 15. Homework Mode

### What is Homework Mode?

A PIN-secured kiosk mode for children. In Homework Mode, ELLA can only open apps from a pre-defined whitelist and only responds to school-related requests.

### How do I enable Homework Mode?

```
"Enable Homework Mode"
```

ELLA asks for the PIN (must be set beforehand in Settings).

### How do I disable it?

```
"Disable Homework Mode"
```

ELLA asks for the PIN.

### I forgot the Homework PIN

**Settings → Mode → Homework Mode → Emergency Reset** — disables the mode without a PIN.

---

## 16. Settings & Configuration

### How do I open Settings?

Via the **gear icon** in the left navigation or by saying:

```
"Open Settings"
```

### Why are Settings changes not applied?

You must click **Save** after every change. Changes are not saved automatically.

### Can I configure ELLA through conversation?

Yes — many settings can be changed directly in the chat:

```
"Create a setup called Office with Chrome, Word, and Teams"
"Allow the tool clean_temp"
"Deny the tool format_drive between 10 PM and 7 AM"
"Change the TTS voice to Stefan"
```

### What are rules and how do they work?

Rules control when ELLA is allowed to perform which actions. The evaluation order is:

```
Directive (immutable) → DIRECTIVE_DENY → Deny rules → Allow rules → Execution
```

Example rules:

- `format_drive: deny, always` → ELLA may never format
- `clean_temp: allow, always` → ELLA may clean temp files at any time
- `play_music: deny, 22:00-07:00` → No music at night

### Can I disable individual tools?

Yes — **Settings → Tools** shows all available tools with an on/off switch. Disabled tools are not offered to the LLM — ELLA cannot then use them.

### How do I set up Google Gmail and Calendar?

1. [Google Cloud Console](https://console.cloud.google.com) → New Project → Create OAuth 2.0 Client ID (type: Desktop App)
2. Enter the Client ID and Secret in ELLA: **Settings → Google**
3. Click "Connect with Google" and authorize in the browser
4. After a successful connection, ELLA can access Gmail and Google Calendar

---

## 17. Errors & Troubleshooting

### ELLA is not responding

Possible causes and solutions:

| Cause               | Solution                                  |
| ------------------- | ----------------------------------------- |
| Ollama not running  | `sc start Ollama` or start the Ollama app |
| llama3.1:8b missing | `ollama pull llama3.1:8b`                 |
| MariaDB not running | `sc start MariaDB`                        |
| OpenAI key invalid  | Update key in Settings → LLM              |
| API crashed         | Restart ELLA                              |

Diagnostic: `"Ella, what is your status?"`

### The orange Ollama banner does not disappear

```powershell
# Check Ollama status:
Invoke-RestMethod http://localhost:11434/api/tags

# Pull model if missing:
ollama pull llama3.1:8b
```

Restart ELLA after the model has loaded.

### Speech recognition is not working

1. **Check microphone permission:** Windows → Settings → Privacy → Microphone → Allow ELLA
2. **Check voice mode:** Settings → Mode → Voice → set to "Wakeword" or "Manual"
3. **Browser microphone:** The Wakeword server requires microphone access at the Python level

### ELLA does not understand me correctly

- With a strong accent or background noise, an **OpenAI key** helps for higher Whisper quality
- **contextAlign** filters stuttering and background noise — requires Ollama model or OpenAI key
- Type your command instead of speaking to check whether the problem is with speech recognition or the AI

### Music is not found

1. Is the music library path correct? → Settings → Programs → Music Library
2. Is the drive in the search drives? → Settings → Programs → Search Drives
3. Did you click **Save**?
4. Path formatting: `H:\Music\` (with trailing backslash)

### Settings are reset on the next launch

Check whether `%APPDATA%\ELLA\settings.json` has write permissions. In development mode: make sure the API is not running as Administrator while the settings were saved as a regular user.

### Kokoro TTS is not working

```powershell
# Check Python packages:
py -3.12 -m pip list | findstr kokoro

# If missing:
py -3.12 -m pip install kokoro-onnx sounddevice numpy
```

Set Settings → Mode → TTS Engine to "Kokoro" and restart ELLA. If issues persist, ELLA automatically falls back to Edge TTS.

### Google connection fails

- Client ID and Secret entered correctly (no spaces)?
- In the Google Cloud Console: Application type "Desktop App" (not "Web App")
- Delete token and reconnect: delete `%APPDATA%\ELLA\google-token.json`

### Proactive messages are not appearing

- **Settings → Mode → Proactive Intelligence** enabled?
- The background worker runs every 60 seconds — wait a moment
- For disk/RAM alerts: thresholds not yet reached (RAM > 85%, disk > 90%)

### What does the red "Directive" badge in the chat mean?

ELLA has blocked an action because it violates the E.L.L.A. Directive. The message explains why. These blocks are immutable and cannot be bypassed — not even by rephrasing.

---

## 18. Technical Questions (Developers)

### Which ports does ELLA run on?

| Service              | Port                  |
| -------------------- | --------------------- |
| Express API          | 3002                  |
| React frontend (Dev) | 5173                  |
| Ollama               | 11434                 |
| MariaDB              | 3306                  |
| Kokoro TTS           | 3003 (127.0.0.1 only) |

### How do I start ELLA in development mode?

```powershell
# Install dependencies:
npm install

# Start MariaDB:
sc start MariaDB

# Start Ollama and check model:
ollama pull llama3.1:8b
ollama pull nomic-embed-text

# Start API + Web in parallel:
npm run dev

# Or individually:
npm run dev --workspace=apps/api   # API on :3002
npm run dev --workspace=apps/web   # Web on :5173
```

### How do I add a new tool?

New tools require entries in 5 files — full checklist in `CLAUDE.md`:

1. `packages/shared/src/types/tool.ts` — ToolName union
2. `apps/api/src/tools/definitions.ts` — tool definition
3. `apps/api/src/tools/executor.ts` — handler
4. `apps/api/src/config/migrate.ts` — default rule
5. Test in `apps/api/src/__tests__/unit/executor.test.ts`

### How do I build the installer?

```powershell
# Download vendor dependencies (one-time):
.\scripts\download-vendor-deps.ps1

# Build API and Web first:
npm run build --workspace=apps/api
npm run build --workspace=apps/web

# Prepare production node_modules:
.\scripts\prepare-api-deps.ps1

# Build installer:
.\scripts\build-installer.ps1
# → dist-installer/E.L.L.A Setup 1.0.0-rc.exe
```

### How do I run the tests?

```powershell
npm test        # All 215 tests (Vitest Unit + Integration)
npm run lint    # ESLint
```

All tests must be green before a commit.

### Where are the logs stored?

| Log                     | Path                               |
| ----------------------- | ---------------------------------- |
| Startup log (installer) | `%APPDATA%\ELLA\ella-startup.log`  |
| API log                 | Console (Dev) / stdout (installer) |
| Audit log               | MariaDB `tool_executions` table    |
| Directive audit         | MariaDB `directive_audit` table    |

---

_E.L.L.A. v3.5.0 · Proprietary · All rights reserved_

_Further documentation: [User Manual](bedienungsanleitung.md) · [Architecture](architecture.md) · [Roadmap](roadmap.md)_
