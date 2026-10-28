# E.L.L.A. -- Frequently Asked Questions (FAQ)

Version 1.5.7 -- Last updated: 2026-10-28

---

## Table of Contents

1. [General -- What is ELLA?](#1-general--what-is-ella)
2. [Hardware & Performance](#2-hardware--performance)
3. [License & Cost](#3-license--cost)
4. [Installation & First Launch](#4-installation--first-launch)
5. [AI Models & Providers](#5-ai-models--providers)
6. [Voice Input & Voice Output](#6-voice-input--voice-output)
7. [Wakeword & Hands-Free Mode](#7-wakeword--hands-free-mode)
8. [Music & Media](#8-music--media)
9. [Files & Drives](#9-files--drives)
10. [Email & Calendar](#10-email--calendar)
11. [Memory & Learning](#11-memory--learning)
12. [Proactive Intelligence](#12-proactive-intelligence)
13. [Security & Privacy](#13-security--privacy)
14. [The E.L.L.A. Directive & Rules](#14-the-ella-directive--rules)
15. [User Profiles & PIN](#15-user-profiles--pin)
16. [Accessibility](#16-accessibility)
17. [Homework Mode](#17-homework-mode)
18. [Settings & Updates](#18-settings--updates)
19. [Errors & Troubleshooting](#19-errors--troubleshooting)

---

## 1. General -- What is ELLA?

### What is E.L.L.A.?

E.L.L.A. stands for **Embedded Local Logic Agent** -- a personal AI assistant for Windows that runs entirely on your own machine. ELLA understands natural language and can operate your computer on your behalf: launching apps, searching for files, playing music, composing emails, checking appointments, setting alarms, and much more.

> **What is an AI assistant?** A program that understands natural language (your own words, not special commands) and responds by performing actions on your computer or providing information.

### What makes ELLA special?

- **Runs locally:** The AI model runs on your machine -- no cloud dependency. Your conversations stay on your PC
- **Learns over time:** ELLA remembers habits and preferences through an intelligent memory system
- **Acts proactively:** ELLA writes to the chat on its own when something is important -- without you having to ask
- **Understands natural language:** You talk to ELLA like a person -- no syntax to learn
- **Transparent:** ELLA displays every action and asks for confirmation on sensitive operations
- **Immutable ethics:** Four hardcoded prohibitions (harm, concealment, surveillance, data exfiltration) cannot be bypassed by any setting

### Do I need an internet connection?

For **basic operation with English, French, or Spanish voice output: no.** Chat, local voice input, music, file search, system control -- everything works offline.

**German voice output requires internet:** ELLA uses Microsoft Edge TTS for German -- the spoken text is transmitted to Microsoft servers. A local German voice is in development.

Internet is also required for:

- License check on startup (works without internet thanks to caching)
- Web search and weather
- OpenAI features (chat, speech recognition, image analysis) -- only if you enter your own key
- Gmail and Google Calendar (only when connected)
- One-time downloads on first launch (AI model, voice model)

Full details on all network connections: [netzwerk.md](netzwerk.md)

### What data goes to the cloud?

**By default: none.** In pure local mode (Ollama), no conversation data leaves your machine.

**Exception -- German voice output:** The spoken text is transmitted to Microsoft. For English, French, and Spanish, the local Kokoro voice is used (no internet needed).

If you enter an **OpenAI key**, the following data is sent to OpenAI:

- The conversation history (chat messages)
- Audio files when using OpenAI speech recognition
- Screenshots when using image analysis
- Multi-agent pipelines (run exclusively via OpenAI)

**Never** sent to external services (even with an OpenAI key):

- Clipboard contents
- Window context (which app is currently active)
- Memories and memory contents
- Conversation compressions

Every cloud request is logged in the dashboard counter -- you have full transparency.

### Which systems does ELLA run on?

ELLA runs on **Windows 10 and Windows 11 (64-bit)**. A Mac or Linux version is not planned.

---

## 2. Hardware & Performance

### What hardware do I need?

ELLA runs on most Windows machines from the last 5 years. For the best experience, we recommend an **NVIDIA graphics card with at least 10 GB of video memory (VRAM)**.

> **What is VRAM?** The memory on your graphics card. The AI model is loaded entirely into this memory. The more VRAM available, the larger and better models ELLA can use.

| Requirement   | Minimum                     | Recommended                  |
| ------------- | --------------------------- | ---------------------------- |
| Processor     | Intel Core i3 / AMD Ryzen 3 | Intel Core i5 / AMD Ryzen 5  |
| Memory        | 16 GB RAM                   | 32 GB RAM                    |
| Graphics card | Not strictly required       | NVIDIA with 10-12 GB VRAM    |
| Disk space    | 20 GB free                  | 40 GB free (SSD recommended) |

Full details: [hardware.md](hardware.md)

### Does ELLA work on my laptop?

**Yes** -- ELLA runs on any Windows laptop with at least 16 GB of RAM. Speed depends on whether your laptop has a dedicated graphics card:

- **Gaming laptop with NVIDIA GPU (10+ GB VRAM):** Very good -- like a desktop
- **Laptop with smaller GPU (4-8 GB):** Works, but slower AI mode
- **Laptop without a graphics card:** Works, but slow -- OpenAI key recommended

**Tip:** With an **OpenAI key**, ELLA can offload computation to the cloud. Local hardware then matters less and even an older laptop delivers fast answers.

### ELLA responds slowly -- what can I do?

| Cause                        | Solution                                                                    |
| ---------------------------- | --------------------------------------------------------------------------- |
| No or small graphics card    | Enter an OpenAI key (Settings -> LLM) -- ELLA then uses cloud computation   |
| Too little RAM (under 16 GB) | Close other programs or upgrade RAM                                         |
| First load after startup     | The AI model is loaded into memory on startup -- wait 10-30 seconds         |
| Context window full          | Start a new conversation (ELLA compresses long conversations automatically) |

ELLA automatically enables **Flash Attention** -- an optimization that makes processing up to 12 times faster. This is active by default and requires no configuration.

> **What is Flash Attention?** A technique that optimizes how the AI model processes your text. Instead of holding everything in memory at once, it works in smaller chunks more efficiently. This saves memory and speeds up responses.

---

## 3. License & Cost

### What does ELLA cost?

ELLA is a premium product with a one-time purchase. The price and current offers are available at [ella-agent.de](https://ella-agent.de).

### How does the license work?

After purchase, you receive a license key in the format `ELLA-XXXX-XXXX-XXXX-XXXX`. You enter this on first launch. The license is verified online once and then cached locally -- after that, ELLA works without internet.

The license is tied to your machine (via an anonymous hardware fingerprint). If you switch machines, you can transfer the license.

### Are there additional costs?

Local usage (Ollama mode) incurs **no ongoing costs**. Electricity for your machine aside.

Optionally, you can enter an **OpenAI API key**. OpenAI charges per use (pay-per-use) -- costs are low (a few cents per conversation). This is not a requirement but an enhancement.

---

## 4. Installation & First Launch

### How do I install ELLA?

1. Download the installer from ella-agent.de and run it
2. Choose an installation path (default: `C:\Programme\E.L.L.A`)
3. Wait for the installation to complete -- all dependencies are set up automatically
4. Launch ELLA via the desktop shortcut

**Nothing else is required.** The installer includes all necessary components.

### What happens on the very first launch?

ELLA guides you through a 6-step onboarding process:

1. **Terms of use** -- read and accept
2. **License activation** -- enter your license key (internet connection required)
3. **Your name** -- ELLA learns how to address you
4. **The Directive** -- ELLA explains its four immutable prohibitions
5. **Hardware scan** -- ELLA detects your drives and selects an appropriate AI model
6. **Voice & location** -- choose voice output, optionally enter your location

On first launch, ELLA also downloads the AI model (~8.4 GB). This takes a few minutes depending on your internet speed.

### ELLA starts but shows an orange banner. What should I do?

The most common reason is that the AI model is still loading. Wait a moment -- on first launch it is downloaded automatically. If the banner does not disappear after 2 minutes, restart ELLA (tray icon -> Quit -> double-click the ELLA icon).

---

## 5. AI Models & Providers

### Which AI models does ELLA use?

> **What is an LLM?** A "Large Language Model" -- an AI program trained on vast amounts of text that can understand and generate natural language.

| Model                     | Purpose                                         | Runs on your machine?      |
| ------------------------- | ----------------------------------------------- | -------------------------- |
| qwen2.5:14b (Ollama)      | Chat, text processing, tool selection           | Yes -- fully local         |
| nomic-embed-text (Ollama) | Memory and recall                               | Yes -- fully local         |
| GPT-4o (OpenAI)           | Chat alternative, image analysis, writing style | No -- needs internet + key |
| Whisper (OpenAI)          | More accurate speech recognition                | No -- needs internet + key |

### Do I need an OpenAI API key?

**No.** ELLA works fully without OpenAI. With a key, the following features become better or available at all:

- Faster and more accurate responses
- Screenshot and image analysis
- Texts in your personal writing style
- Higher-quality speech recognition
- Noise and stutter filtering for voice input

Enter the key under **Settings -> LLM -> OpenAI API Key**.

### What is the difference between Ollama and OpenAI?

|                | Ollama (local)                   | OpenAI (cloud)                             |
| -------------- | -------------------------------- | ------------------------------------------ |
| Cost           | Free                             | Pay-per-use (a few cents per conversation) |
| Privacy        | Everything stays on your machine | Data is sent to OpenAI                     |
| Speed          | Depends on your hardware         | Fast and consistent                        |
| Image analysis | Limited                          | Always available                           |

### What does "Provider: Auto" mean?

In Auto mode, ELLA automatically selects the best available provider. If it has a valid OpenAI key, it uses OpenAI -- otherwise Ollama. You can also force a fixed provider in Settings.

### Can I use a different Ollama model?

Yes -- under **Settings -> LLM -> Ollama Model** you can enter any model you have loaded in Ollama. The default model (qwen2.5:14b with 14 billion parameters) offers the best balance of speed and quality. Smaller models respond faster but handle complex requests less well.

---

## 6. Voice Input & Voice Output

### How do I talk to ELLA?

Four ways are available:

1. **Text:** Type your message and press Enter
2. **Microphone button:** Click the microphone icon in the chat for a one-time recording
3. **Wakeword:** Say "Ella" -- ELLA then listens for your command (must be enabled)
4. **Hands-free (Always-On):** ELLA listens continuously and responds to everything you say

### Do I need internet for voice input?

The default speech recognition (Web Speech API) requires an internet connection. If you want to stay fully offline, you can switch to local speech recognition (Whisper) in Settings -- no internet needed, but slightly slower.

### What is contextAlign and what is it for?

contextAlign is a filter between your voice and ELLA. When you speak and there is music playing in the background, the TV is on, or you stutter, ELLA detects this and filters it out. Only your actual command is processed.

**Example:**

- What you say: _"uh ella uh open open the Explorer is this the real life"_
- What ELLA hears: _"Open Explorer"_
- TV audio in the background -> ELLA ignores it

### How do I enable voice output (TTS)?

> **What is TTS?** "Text-to-Speech" -- converting text into spoken language. ELLA reads its responses aloud.

Set **Settings -> Mode -> TTS** to "On". ELLA will then read all responses, alerts, and proactive messages aloud automatically.

### Can ELLA speak without an internet connection?

Yes -- with **Kokoro TTS**. This is a local voice that runs directly on your machine and sounds significantly more natural than standard Windows voices. Kokoro works fully offline for English, French, and Spanish. For German, Microsoft Edge TTS (internet required) is currently still used.

### Can I change the voice?

Yes -- under **Settings -> Voice -> Spoken Language** you can choose from 4 female voices:

| Language | Online voice | Offline voice (Kokoro) |
| -------- | ------------ | ---------------------- |
| German   | Katja        | (in development)       |
| English  | Sonia        | Emma                   |
| Spanish  | Elvira       | Dora                   |
| French   | Denise       | Siwis                  |

### Can ELLA detect whether I am stressed?

Yes -- with the optional **stress detection** under **Settings -> Voice -> Enable Voice Analysis**.

ELLA analyzes pitch, speech rate, and volume, and adjusts its tone when tension is detected. The analysis runs entirely locally -- no audio data leaves the device. This feature is disabled by default and must be deliberately switched on.

---

## 7. Wakeword & Hands-Free Mode

### What is the difference between Wakeword and Hands-Free?

| Mode                       | How it works                                                                |
| -------------------------- | --------------------------------------------------------------------------- |
| **Wakeword**               | ELLA listens for the keyword "Ella" and then responds to the next sentence  |
| **Hands-Free (Always-On)** | ELLA listens continuously and sends everything you say directly to the chat |
| **Manual**                 | You press the microphone button -- ELLA only listens then                   |

### How do I enable the Wakeword?

Set **Settings -> Mode -> Voice** to "Wakeword". The Wakeword runs entirely locally -- no audio data is transmitted.

### How do I pause the Wakeword?

```
"Ella, take a 30-minute break"
"Pause for an hour"
```

ELLA deactivates the Wakeword and automatically checks back in when the time has elapsed.

### Does ELLA always listen -- even during private phone calls?

In **Hands-Free Mode (Always-On)** yes -- ELLA listens continuously and processes everything. If you want privacy: use **Wakeword Mode** (ELLA only activates after the keyword) or set the mode to **Manual** or **Off**.

---

## 8. Music & Media

### How do I tell ELLA where my music is?

**Settings -> Programs -> Music Library** -- enter the path to your music collection (e.g. `H:\Music`). Click **Save** after entering.

### How do I search for music?

```
"Play music"
"Play something by Rammstein"
"Open the Thriller album by Michael Jackson"
```

ELLA searches for folders and files matching the search term and opens them in the configured media player.

### ELLA cannot find my music -- what should I do?

1. **Is the path correct?** -> Check Settings -> Programs -> Music Library
2. **Is the drive in the search list?** -> Settings -> Programs -> Search Drives (e.g. `C, D, E, H`)
3. **Was it saved?** -> Click **Save** after every change

### Can ELLA control the media player?

Yes:

```
"Next track"
"Pause"
"Volume up"
"What's playing right now?"
```

---

## 9. Files & Drives

### Can ELLA search for files on all drives?

Yes -- but by default ELLA only searches on `C:\`. To include additional drives: **Settings -> Programs -> Search Drives** -- enter all desired drive letters.

### Can ELLA format system drives?

**No** -- this is a hard, immutable prohibition (Directive). The following drives are always locked:

- **C:** (system drive)
- The drive on which ELLA is installed
- All drives listed under **Settings -> Drives -> Protected Drives**

### Can ELLA delete files?

ELLA moves files to the **Recycle Bin** -- permanent deletion without the Recycle Bin is not possible. You can always undo the action.

### How do I find duplicate files?

```
"Search for duplicate files on my drives"
"Which files do I have twice on E:?"
```

ELLA compares files by hash value (not just name) and shows you how much storage you would free up by deleting the duplicates.

---

## 10. Email & Calendar

### Can ELLA read my emails? Is that safe?

Yes, ELLA can read your emails -- but only if you allow it. For **Outlook**, this works automatically if Outlook is installed. For **Gmail**, you need to connect ELLA to your Google account once (Settings -> Google).

**Security:**

- ELLA reads emails only on your machine -- in local mode (Ollama), no email content is transmitted
- ELLA **cannot send emails automatically**. It only creates drafts in Outlook that you send yourself
- Email content does not flow into memory (unless you explicitly say "remember this")
- In offline mode, email access is limited (Gmail needs internet)

### Which email services are supported?

- **Outlook** (automatic, if installed)
- **Gmail** (one-time setup via Google OAuth)

### How do I connect Gmail?

1. Create an app in the [Google Cloud Console](https://console.cloud.google.com) (OAuth 2.0, type: Desktop App)
2. Copy the Client ID and Client Secret
3. In ELLA: **Settings -> Google -> enter Client ID + Secret**
4. Click "Connect with Google" -> browser opens -> select your Google account -> confirm

The token is stored locally on your machine and is never shared.

### Can ELLA edit my Google Calendar?

Yes -- both reading and creating events:

```
"What is on my Google Calendar today?"
"Create an appointment tomorrow at 2 PM: Dentist"
```

---

## 11. Memory & Learning

### How does ELLA remember things?

ELLA uses an intelligent memory system with so-called "vector embeddings." This means: information is not stored word-for-word but as meaning-based patterns. When you later ask a similar question, ELLA finds the matching memory -- similar to human associations.

> **What are tokens?** The smallest units into which an AI model splits text. A word typically consists of 1-3 tokens. "Good morning" is e.g. 2-3 tokens. The memory system works with these token patterns.

```
"Remember: My tax ID is 123/456/78901"
"Remember: I don't like emails on Friday afternoons"
"What do you know about me?"
```

### Can I delete memories?

Yes:

```
"Forget my tax ID"
"What do you know about me?" -> identify the memory
"Forget memory 42"
```

### Does ELLA learn from feedback?

Yes -- the **thumbs buttons** below each response give ELLA feedback. Thumbs up saves the question-answer pair as a positive example. ELLA uses these examples to answer similar questions better in the future.

### Does ELLA learn my writing style?

Yes -- with an OpenAI key. When you ask ELLA to write a text "in your style," it analyzes existing emails and adopts your tone, typical phrasing, and sentence structure.

```
"Write a rejection letter to Mr. Miller in my style"
```

---

## 12. Proactive Intelligence

### Does ELLA write to the chat without being asked?

Yes -- this is one of the core features. ELLA monitors your computer and proactively informs you:

| Event                        | What ELLA says                                                 |
| ---------------------------- | -------------------------------------------------------------- |
| 30 min before an appointment | Meeting preparation, offer to retrieve documents               |
| 6:00 PM                      | End-of-day summary with activities and tomorrow's appointments |
| USB stick connected          | Drive announced, contents offered                              |
| RAM above 85%                | Warning + offer to clean up                                    |
| Hard drive above 90% full    | Warning + cleanup options                                      |
| 30 min inactive + return     | Comeback briefing: what has changed?                           |
| 90 min of uninterrupted work | Break recommendation                                           |
| IBAN in clipboard            | Context offer                                                  |

### Can I disable the proactive messages?

Yes -- individually or all at once:

- **Settings -> Mode -> Proactive Intelligence** -- turn off (all)
- **Settings -> Mode -> Detect Clipboard Patterns** -- separately disableable
- Individual categories via the **Mute button** on each proactive message

---

## 13. Security & Privacy

### Where is my data stored?

All data stays on your machine:

| Data                 | Location                           |
| -------------------- | ---------------------------------- |
| Conversation history | Local database (MariaDB)           |
| Memory               | Local database                     |
| Settings             | `%APPDATA%\ELLA\settings.json`     |
| Google token         | `%APPDATA%\ELLA\google-token.json` |

No cloud synchronization, no telemetry, no usage data sent to us or third parties.

### How secure are my profile PINs?

PINs are stored with **PBKDF2+Salt and 100,000 iterations** -- an industry standard for password hashing. Even with direct database access, cracking a PIN would be very costly.

### Can ELLA activate my webcam or microphone without my knowledge?

**No.** The E.L.L.A. Directive prohibits surveillance without explicit knowledge and active consent. The microphone is only activated when you explicitly request it (Wakeword, microphone button, or Hands-Free Mode that you have enabled yourself).

### Can ELLA read my passwords?

No -- windows from password managers and banking apps (1Password, KeePass, Bitwarden, PayPal, banking URLs, etc.) are locked for all mouse and window tools.

### Is sensitive data filtered from memory?

Yes -- ELLA automatically detects sensitive patterns (API keys, passwords, IBANs, credit card numbers) and redacts them before they are stored in memory or clipboard history.

---

## 14. The E.L.L.A. Directive & Rules

### What is the E.L.L.A. Directive?

Four immutable prohibitions that are deeply embedded in the architecture. No setting and no rule can override them:

| Prohibition    | Meaning                                                                      |
| -------------- | ---------------------------------------------------------------------------- |
| **harm**       | ELLA does not cause physical, financial, psychological, or data-related harm |
| **conceal**    | ELLA does not conceal actions, capabilities, or system states                |
| **surveil**    | ELLA does not monitor without explicit knowledge and active consent          |
| **exfiltrate** | ELLA does not share data with third parties without explicit consent         |

### What happens when ELLA blocks something?

ELLA displays a **red badge** in the chat explaining why the action was blocked. These blocks are immutable and cannot be bypassed -- not even by rephrasing.

### Can I give ELLA rules?

Yes -- in addition to the immutable Directive, you can create your own rules that control when ELLA may perform which actions:

```
"Allow the tool clean_temp"
"Deny music playback between 10 PM and 7 AM"
"Create a rule: no drive formatting"
```

The evaluation order is: Directive (immutable) -> Deny rules -> Allow rules -> Execution.

You can also disable individual tools in Settings (**Settings -> Tools** -- on/off switch for each tool).

---

## 15. User Profiles & PIN

### What are user profiles?

Multiple people can use ELLA with separate memories and conversation histories. Each profile is fully isolated -- one profile cannot access the memory of another.

### How do I create a new profile?

**Settings -> Profiles -> New Profile** -- choose a name and color, optionally set a PIN.

### What happens if I forget my profile PIN?

For **user profiles**, resetting is only possible with direct database access. In this case, contact the developer.

For the **Homework Mode PIN**, there is an emergency reset under Settings -> Homework Mode.

---

## 16. Accessibility

### Which accessibility modes are available?

ELLA supports two special modes under **Settings -> Mode -> Accessibility**:

| Mode           | For whom          | What changes                                                                           |
| -------------- | ----------------- | -------------------------------------------------------------------------------------- |
| **Blind Mode** | Visually impaired | TTS always active, audio feedback, responses without formatting, image analysis active |
| **Deaf Mode**  | Hearing impaired  | All audio output disabled, text only                                                   |

### What can ELLA do for blind users?

In Blind Mode, ELLA reads all responses aloud automatically. Additionally, ELLA can describe screen contents, analyze images, and read web pages -- an OpenAI key is needed for this.

---

## 17. Homework Mode

### What is Homework Mode?

A PIN-secured mode for children. ELLA can then only open apps from a pre-defined list and only responds to school-related requests.

### How do I enable/disable it?

```
"Enable Homework Mode"  -> ELLA asks for the PIN
"Disable Homework Mode" -> ELLA asks for the PIN
```

The PIN must be set beforehand in Settings. If you forgot the PIN: **Settings -> Mode -> Homework Mode -> Emergency Reset**.

---

## 18. Settings & Updates

### How do I open Settings?

Via the **gear icon** in the left navigation or by saying:

```
"Open Settings"
```

### Can I configure ELLA through conversation?

Yes -- many settings can be changed directly in the chat:

```
"Create a setup called Office with Chrome, Word, and Teams"
"Change the voice to English"
"Deny music playback between 10 PM and 7 AM"
```

### Why are settings changes not applied?

You must click **Save** after every change. Changes are not saved automatically.

### How do I update ELLA?

ELLA checks in Settings under **About E.L.L.A.** whether a new version is available. If so, it downloads the installer and runs the update -- your settings, memories, and conversation histories are preserved.

You can also trigger the update check manually: **Settings -> About E.L.L.A. -> Check for Updates**. The check sends no user data -- it only retrieves the latest version number.

---

## 19. Errors & Troubleshooting

### ELLA is not responding

Possible causes and solutions:

| Cause                   | Solution                                  |
| ----------------------- | ----------------------------------------- |
| AI model not yet loaded | Wait (orange banner shows loading status) |
| Database not started    | Restart ELLA                              |
| OpenAI key invalid      | Update key in Settings -> LLM             |
| API crashed             | Restart ELLA                              |

Diagnostic: `"Ella, what is your status?"`

### Speech recognition is not working

1. **Check microphone permission:** Windows -> Settings -> Privacy -> Microphone -> Allow ELLA
2. **Check voice mode:** Settings -> Mode -> Voice -> set to "Wakeword" or "Manual"
3. Alternatively: type your command to check whether the problem is with speech recognition or the AI

### Kokoro TTS is not working

Kokoro TTS runs directly inside ELLA -- no separate program needed. Possible causes:

| Cause                       | Solution                                          |
| --------------------------- | ------------------------------------------------- |
| Voice model still loading   | Wait briefly -- first launch downloads ~80 MB     |
| No internet on first launch | The installer includes the model for offline use  |
| Persistent problem          | Restart ELLA -- Kokoro reloads on the next launch |

If problems persist, ELLA automatically falls back to the online voice (Microsoft Edge TTS).

### Google connection fails

- Client ID and Secret entered correctly (no spaces)?
- In the Google Cloud Console: application type "Desktop App" (not "Web App")
- Delete token and reconnect: delete the file `%APPDATA%\ELLA\google-token.json`

### What does the red "Directive" badge in the chat mean?

ELLA has blocked an action because it violates the E.L.L.A. Directive. The message explains why. These blocks are immutable and cannot be bypassed.

---

_E.L.L.A. v1.5.7 -- Proprietary -- All rights reserved_

_Further documentation: [Hardware Guide](hardware.md) -- [Network](netzwerk.md) -- [User Manual](bedienungsanleitung.md)_
