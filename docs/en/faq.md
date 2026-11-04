# E.L.L.A. — Frequently Asked Questions (FAQ)

Version 1.6.4 — Last updated: 2026-11-03

---

## Table of Contents

1. [Why E.L.L.A.? And is it safe?](#1-why-ella--and-is-it-safe)
2. ["Ella monitors my computer — isn't that surveillance?"](#2-ella-monitors-my-computer--isnt-that-surveillance)
3. [Hardware & Performance](#3-hardware--performance)
4. [License & Cost](#4-license--cost)
5. [Installation & First Launch](#5-installation--first-launch)
6. [AI Models & Providers](#6-ai-models--providers)
7. [Voice Input & Voice Output](#7-voice-input--voice-output)
8. [Wakeword & Hands-Free Mode](#8-wakeword--hands-free-mode)
9. [Music & Media](#9-music--media)
10. [Files & Drives](#10-files--drives)
11. [Email & Calendar](#11-email--calendar)
12. [Memory & Learning](#12-memory--learning)
13. [User Profiles & PIN](#13-user-profiles--pin)
14. [Accessibility](#14-accessibility)
15. [Homework Mode](#15-homework-mode)
16. [Settings & Updates](#16-settings--updates)
17. [Errors & Troubleshooting](#17-errors--troubleshooting)

---

## 1. Why E.L.L.A.? And is it safe?

### What is E.L.L.A.?

E.L.L.A. stands for **Embedded Local Logic Agent** — a personal AI assistant for Windows that runs entirely on your own computer. Ella understands natural language and operates your computer for you: launching apps, searching files, playing music, composing emails, looking up appointments, setting alarms and much more.

### What makes E.L.L.A. special?

- **Immutable ethics:** Four hardcoded prohibitions (harm, concealment, surveillance, data exfiltration) that no setting can bypass — the framework within which everything else happens
- **Runs locally:** The AI model runs on your machine — no cloud dependency. Your conversations stay on your PC
- **Transparent:** Ella shows every action and asks before doing anything sensitive
- **Learns along:** Ella remembers habits and preferences through an intelligent memory
- **Acts proactively:** Ella reaches out on its own when something important comes up
- **Understands natural language:** You talk to Ella like a person — no syntax to learn

### What is the E.L.L.A. Directive?

Four immutable prohibitions, deeply embedded in the architecture. No setting and no rule can override them:

| Prohibition    | Meaning                                                                |
| -------------- | ---------------------------------------------------------------------- |
| **harm**       | Ella causes no physical, financial, psychological or data-related harm |
| **conceal**    | Ella does not conceal actions, capabilities or system states           |
| **surveil**    | Ella does not surveil without explicit knowledge and active consent    |
| **exfiltrate** | Ella does not transfer data to third parties without explicit consent  |

### What happens when Ella blocks something?

Ella shows a **red banner** in the chat explaining why the action was blocked. These blocks are immutable and cannot be circumvented — not even by rephrasing.

### Can Ella activate my webcam or microphone without my knowledge?

**No.** The Directive prohibits surveillance without explicit knowledge and active consent. The microphone is only activated when you explicitly request it (wakeword, microphone button or hands-free mode that you turned on yourself).

### Can Ella read my passwords?

No — windows from password managers and banking apps (1Password, KeePass, Bitwarden, PayPal, banking URLs etc.) are locked for all mouse and window tools.

### Are sensitive data filtered from memory?

Yes — Ella automatically detects sensitive patterns (API keys, passwords, IBANs, credit card numbers) and redacts them before they are stored in memory or clipboard history.

### What data goes to the cloud?

**By default: none.** In pure local mode (Ollama) no conversation data leaves your computer.

**Exception — German voice output:** The spoken text is transmitted to Microsoft (Edge TTS). For English, French and Spanish the local Kokoro voice is used (no internet required).

If you enter your own **OpenAI key**, the following data is sent to OpenAI:

- The conversation history (chat messages)
- Audio files when using OpenAI speech recognition
- Screenshots when using image analysis
- Multi-agent workflows (run exclusively via OpenAI)

**Never** sent to external services (even with an OpenAI key): clipboard contents, window context, memories and memory contents. Every cloud request is logged in the dashboard counter — you have full transparency.

### Where is my data stored?

All data stays locally on your computer — conversation history and memory in a local database (MariaDB), settings and tokens in the ELLA folder. No cloud synchronization, no telemetry, no usage data sent to us or third parties.

### How secure are my profile PINs?

PINs are stored with **PBKDF2 + Salt and 100,000 iterations** — an industry standard for password hashing. Even with direct database access, cracking a PIN would be very costly.

### Do I need internet?

For **basic operation with English, French or Spanish voice output: no.** Chat, music, file search and system control run offline. The wakeword "ella" as well — but the actual speech recognition (speech to text) requires internet.

Internet is required for: German voice output (Edge TTS), license verification at startup (works without thanks to caching), web search and weather, OpenAI features (only with your own key), Gmail and Google Calendar (only when connected) and the one-time downloads on first launch. All connections in detail: [network.md](network.md)

### What systems does E.L.L.A. run on?

On **Windows 10 and Windows 11 (64-bit)**. A Mac or Linux version is not planned.

---

## 2. "Ella monitors my computer — isn't that surveillance?"

This is the most common concern — and the answer lies in the Directive. Ella observes, but she observes **for you, locally, and she sends nothing out.**

### Does Ella write to the chat without being asked?

Yes — this is a core feature. Ella monitors your computer and informs you proactively:

| Event                     | What Ella says                                          |
| ------------------------- | ------------------------------------------------------- |
| 30 min before appointment | Meeting preparation, offer documents                    |
| 6:00 PM                   | End-of-day summary with activities and tomorrow's tasks |
| USB drive connected       | Drive announced, contents offered                       |
| RAM above 85%             | Warning + cleanup offer                                 |
| Disk above 90% full       | Warning + cleanup options                               |
| 30 min inactive + return  | Comeback briefing: What changed?                        |
| 90 min continuous work    | Break recommendation                                    |
| IBAN in clipboard         | Context offer                                           |

### And what of that leaves my computer?

**Nothing.** This monitoring runs entirely locally:

- Reading RAM, disk, USB devices or clipboard happens on your computer and is never sent anywhere — the **exfiltrate** prohibition forbids it.
- Ella does not profile you secretly — the **surveil** prohibition forbids it. Every proactive message is visible, no silent data collection in the background.
- Clipboard detection (IBAN, tracking numbers, phone numbers) is pure pattern recognition on your device to make you an offer — the content does not travel to the cloud.

In short: Ella sees a lot so she can help you — but what she sees stays with you.

### Can I disable proactive messages?

Yes — individually or all at once:

- **Settings → Mode → Proactive Intelligence** turn off (all)
- **Settings → Mode → Clipboard pattern recognition** can be disabled separately
- Individual categories via the **Mute button** on each message. After dismissing the same category 5 times, Ella automatically mutes it

---

## 3. Hardware & Performance

### What hardware do I need?

Ella runs on most Windows computers from the last 5 years. For the best experience we recommend an **NVIDIA graphics card with at least 10 GB video memory (VRAM)**.

> **What is VRAM?** The memory on your graphics card. The AI model is loaded entirely into it. The more VRAM, the larger and better models Ella can use.

| Requirement   | Minimum                     | Recommended                  |
| ------------- | --------------------------- | ---------------------------- |
| Processor     | Intel Core i3 / AMD Ryzen 3 | Intel Core i5 / AMD Ryzen 5  |
| RAM           | 16 GB RAM                   | 32 GB RAM                    |
| Graphics card | Not strictly required       | NVIDIA with 10–12 GB VRAM    |
| Storage       | 20 GB free                  | 40 GB free (SSD recommended) |

Details: [hardware.md](hardware.md)

### Does Ella work on my laptop?

**Yes** — on any Windows laptop with at least 16 GB RAM. Speed depends on the graphics card:

- **Laptop with NVIDIA GPU (10+ GB VRAM):** very good, like a desktop
- **Laptop with smaller GPU (4–8 GB):** works, but slower
- **Laptop without a graphics card:** works, but slow — OpenAI key recommended

**Tip:** With an OpenAI key, Ella can offload computation to the cloud. Then the local hardware matters less.

### Ella responds slowly — what to do?

| Cause                        | Solution                                                                    |
| ---------------------------- | --------------------------------------------------------------------------- |
| No or small graphics card    | Enter an OpenAI key — Ella then uses cloud computation                      |
| Too little RAM (under 16 GB) | Close other programs or upgrade RAM                                         |
| First load after startup     | The AI model is being loaded into memory — wait 10–30 seconds               |
| Context window full          | Start a new conversation (Ella compresses long conversations automatically) |

Ella automatically uses an acceleration technique that significantly speeds up processing — active by default, no configuration needed.

---

## 4. License & Cost

### How much does Ella cost?

A premium product with a one-time purchase. Price and current offers at [ella-agent.de](https://ella-agent.de).

### How does the license work?

After purchase you receive a license key in the format `ELLA-XXXX-XXXX-XXXX-XXXX`. You enter it on first launch. The license is verified online once and then cached locally — after that Ella works without internet too. It is tied to your computer (anonymous hardware fingerprint); when switching computers you can transfer it.

### Are there ongoing costs?

Local usage (Ollama) incurs **no ongoing costs** (apart from electricity). Optionally you can enter your own OpenAI key — OpenAI then charges per use (a few cents per conversation). This is not a requirement, but an extension.

---

## 5. Installation & First Launch

### How do I install Ella?

1. Download the installer from ella-agent.de and run it
2. Confirm the default installation path
3. Wait for installation — all components are set up automatically
4. Launch Ella via the desktop icon

Nothing else is needed. The installer includes everything.

### What happens on the very first launch?

Ella guides you through a short onboarding: terms of use, license activation, your name, the Directive, hardware scan (Ella selects a suitable model) and voice & location. On first launch Ella also downloads the AI model — this takes a few minutes depending on your internet speed.

### Ella starts but shows an orange banner. What to do?

The most common reason: the AI model is still loading. Wait a moment — on first launch it is downloaded automatically. If the banner doesn't disappear after 2 minutes, restart Ella (tray icon → Quit → double-click icon).

---

## 6. AI Models & Providers

### Which model does Ella use — and which is best?

Ella uses a local language model via Ollama plus a local model for memory. **Which language model works best depends heavily on your hardware — and honestly, it's a matter of trying things out.**

As a guide:

- A **compact Llama 3 model** is a good, fast default — solid in German and reliable with tool calls.
- **Larger models** can be more capable but need more VRAM and respond more slowly.
- New models are released constantly. That's why Ella doesn't lock you in: You can **switch at any time or use your own model.**

The memory model always runs fully locally.

### Can I use a different Ollama model?

Yes — under **Settings → LLM → Ollama model** you can enter any model you have loaded in Ollama. Smaller models respond faster but understand complex requests less well. During onboarding Ella suggests a selection matched to your graphics card.

### Do I need an OpenAI key?

**No.** Ella works fully without OpenAI. With your own key some features become better or available for the first time: faster and more precise answers, screenshot and image analysis, texts in your personal writing style, higher-quality speech recognition. Enter the key under **Settings → LLM → OpenAI API Key**.

### What is the difference between Ollama and OpenAI?

|                | Ollama (local)              | OpenAI (Cloud)                             |
| -------------- | --------------------------- | ------------------------------------------ |
| Cost           | Free                        | Pay-per-use (a few cents per conversation) |
| Privacy        | Everything stays on your PC | Data goes to OpenAI                        |
| Speed          | Depends on your hardware    | Fast and consistent                        |
| Image analysis | Limited                     | Always available                           |

### What does "Provider: Auto" mean?

In auto mode Ella automatically selects the best available provider. If she has a valid OpenAI key, she uses OpenAI — otherwise Ollama. You can also force a specific provider in the settings.

---

## 7. Voice Input & Voice Output

### How do I talk to Ella?

Four ways:

1. **Text:** Type a message and press Enter
2. **Microphone button:** One-time recording by clicking
3. **Wakeword:** Say "Ella" — Ella then listens for your command (must be enabled)
4. **Hands-free (Always-On):** Ella listens continuously

### Do I need internet for voice input?

Yes — speech recognition runs online. The default recognition requires internet but no OpenAI key. With your own OpenAI key, a higher-quality recognition is available. A fully offline voice input does not currently exist. The wakeword "ella" itself runs locally.

### Does Ella filter out background noise?

Yes. If you're talking with music playing in the background, the TV on, or you stumble over your words, Ella detects this and filters it out — only your actual command is processed.

**Example:**

- What you say: _"uh Ella uh open open the Explorer is this the real life"_
- What Ella understands: _"Open the Explorer"_

### How do I enable voice output?

**Settings → Mode → TTS** to "On". Ella then reads out answers, warnings and proactive messages.

### Can Ella speak without internet?

For **English, French and Spanish yes** — via the local Kokoro voice, fully offline. For **German (Katja)** Microsoft Edge TTS is currently used (internet required, the text is transmitted to Microsoft). A fully local German voice is in development — and because the Directive demands "no concealment", we say so openly.

### Can I change the voice?

Yes — under **Settings → Voice → Conversation language**:

| Language | Online voice | Offline voice (Kokoro) |
| -------- | ------------ | ---------------------- |
| Deutsch  | Katja        | (in development)       |
| English  | Sonia        | Emma                   |
| Español  | Elvira       | Dora                   |
| Français | Denise       | Siwis                  |

### Can Ella detect if I'm stressed?

Yes — with the optional **stress detection** (Settings → Voice → Enable voice analysis). Ella analyzes pitch, tempo and volume and adjusts her tone when you're tense. The analysis runs fully locally — no audio data leaves the device. Off by default.

---

## 8. Wakeword & Hands-Free Mode

### What is the difference?

| Mode                       | How it works                                                               |
| -------------------------- | -------------------------------------------------------------------------- |
| **Wakeword**               | Ella listens for the keyword "Ella" and then responds to the next sentence |
| **Hands-free (Always-On)** | Ella listens continuously and sends everything said directly to the chat   |
| **Manual**                 | You press the microphone button — only then does Ella listen               |

### How do I enable the wakeword?

**Settings → Mode → Voice** to "Wakeword". The wakeword runs fully locally — no audio data is transmitted.

### How do I pause the wakeword?

```
"Ella, take a 30-minute break"
"Pause for an hour"
```

Ella deactivates the wakeword and checks back in automatically when the time is up.

### Does Ella always listen — even during private phone calls?

In **hands-free mode** yes. If you want privacy: Use **wakeword mode** (Ella only activates after the keyword) or switch to **Manual** or **Off**.

---

## 9. Music & Media

### How do I tell Ella where my music is?

**Settings → Programs → Music library** — enter the path to your collection (e.g. `H:\Music`) and click **Save**.

### How do I search and control music?

```
"Play something by Rammstein"
"Open the album Thriller by Michael Jackson"
"Next track"
"Pause"
"What's playing right now?"
```

### Ella can't find my music — what to do?

1. Path correct? → Settings → Programs → Music library
2. Drive in the search list? → Settings → Programs → Search drives
3. Clicked **Save** after each change?

---

## 10. Files & Drives

### Can Ella search all drives?

Yes — by default Ella searches `C:\`. Additional drives: **Settings → Programs → Search drives**.

### Can Ella format system drives?

**No** — a hard, immutable prohibition. Always locked: `C:`, the drive with the Ella installation and all drives listed under Settings → Drives → Protected drives.

### Can Ella delete files?

Ella moves files to the **Recycle Bin** — permanent deletion without the Recycle Bin is not possible. You can always undo the action.

### How do I find duplicate files?

```
"Search for duplicate files on my drives"
"Which files do I have duplicated on E:?"
```

Ella compares files by content (not just by name) and shows how much space you would gain by deleting the duplicates.

---

## 11. Email & Calendar

### Can Ella read my emails? Is that safe?

Yes, but only if you allow it. **Outlook** works automatically when installed. **Gmail** requires a one-time connection with your Google account (Settings → Google).

**Security:**

- Ella reads emails only on your computer — in local mode no content is transmitted
- Ella **cannot send emails automatically** — she only creates drafts that you send yourself
- Email contents do not flow into memory (unless you explicitly say "remember this")

### Which services are supported?

**Outlook** (automatically when installed) and **Gmail** (one-time setup via Google OAuth).

### How do I connect Gmail?

1. In the [Google Cloud Console](https://console.cloud.google.com) create an app (OAuth 2.0, type: Desktop App)
2. Copy the Client ID and Secret
3. In Ella: **Settings → Google → Enter Client ID + Secret**
4. Click "Connect with Google" → Browser opens → Select Google account → Confirm

The token is stored locally and never shared.

### Can Ella edit my Google Calendar?

Yes — read and create events:

```
"What's in my Google Calendar today?"
"Create an appointment tomorrow at 2 PM: Dentist"
```

---

## 12. Memory & Learning

### How does Ella remember things?

Ella does not store information verbatim, but as semantic patterns. When you ask a similar question later, Ella finds the matching memory — similar to human associations.

```
"Remember: I don't like emails on Friday afternoons"
"What do you know about me?"
```

### Can I delete memories?

Yes:

```
"What do you know about me?"   → Identify the memory
"Forget memory 42"
"Forget everything about me"
```

### Does Ella learn from feedback?

Yes — the **thumbs buttons** under each response give Ella feedback. Thumbs up saves the question-answer combination as a positive example that Ella uses for similar questions in the future.

### Does Ella learn my writing style?

Yes — with an OpenAI key. When you ask Ella to write a text "in your style", she analyzes existing emails and adopts your tonality, typical phrasings and sentence structure.

```
"Write a decline to Mr. Miller in my style"
```

---

## 13. User Profiles & PIN

### What are user profiles?

Multiple people can use Ella with separate memories and histories. Each profile is fully isolated — one profile cannot access another's memory.

### How do I create a profile?

**Settings → Profiles → New Profile** — choose a name and color, optionally set a PIN.

### What if I forget my profile PIN?

For user profiles, resetting is only possible with direct database access — contact the developer. For homework mode there is an emergency reset.

---

## 14. Accessibility

### What modes are available?

Under **Settings → Mode → Accessibility**:

| Mode           | For whom          | What changes                                                                           |
| -------------- | ----------------- | -------------------------------------------------------------------------------------- |
| **Blind mode** | Visually impaired | TTS always active, audio feedback, responses without formatting, image analysis active |
| **Deaf mode**  | Hearing impaired  | All audio outputs disabled, text only                                                  |

### What can Ella do for blind users?

In blind mode Ella automatically reads all responses aloud, describes screen content, analyzes images and reads web pages aloud (an OpenAI key is required for this).

---

## 15. Homework Mode

### What is homework mode?

A PIN-secured mode for children. Ella can then only open apps from a predefined list and only responds to school-related queries.

### How do I enable/disable it?

```
"Enable homework mode"    → Ella asks for the PIN
"Disable homework mode"   → Ella asks for the PIN
```

The PIN must be set in the settings beforehand. If you forget the PIN: Settings → Mode → Homework Mode → Emergency Reset.

---

## 16. Settings & Updates

### How do I open the settings?

Via the **gear icon** in the navigation or by saying "Open the settings".

### Can I configure Ella by conversation?

Yes — many things can be changed directly in the chat:

```
"Create a setup called Office with Chrome, Word and Teams"
"Change the voice to English"
"Prohibit music playback between 10 PM and 7 AM"
```

### Why aren't my changes being applied?

You need to click **Save** after every change — changes are not saved automatically.

### How do I update Ella?

Under **Settings → About E.L.L.A.** Ella checks whether a new version is available, downloads the installer and performs the update — your settings, memories and histories are preserved. The check sends no user data, only the latest version number is retrieved.

---

## 17. Errors & Troubleshooting

### Ella doesn't respond

| Cause                   | Solution                                  |
| ----------------------- | ----------------------------------------- |
| AI model not yet loaded | Wait (orange banner shows loading status) |
| Database not started    | Restart Ella                              |
| OpenAI key invalid      | Update key in Settings → LLM              |
| API crashed             | Restart Ella                              |

Diagnosis: `"Ella, what's your status?"`

### Speech recognition doesn't work

1. Check internet connection — speech recognition requires internet.
2. Check microphone permission: Windows → Settings → Privacy → Microphone → Allow Ella
3. Check voice mode: Settings → Mode → Voice set to "Wakeword" or "Manual"
4. Alternatively: Type a command to check whether the issue is with speech recognition or the AI

### Kokoro voice doesn't work

Runs directly in Ella — no separate program needed. Possible causes: voice model still loading (wait a moment), or a persistent issue → restart Ella. With ongoing problems Ella automatically switches to the online voice (Edge TTS).

### Google connection fails

- Client ID and Secret entered correctly (no spaces)?
- In the Google Cloud Console: Application type "Desktop App" (not "Web App")
- Delete token and reconnect (Settings → Google → Disconnect)

### What does the red "Directive" banner in the chat mean?

Ella blocked an action because it violates the Directive. The message explains why. These blocks are immutable and cannot be circumvented.

---

_E.L.L.A. v1.6.4 — Proprietary — All rights reserved_

_Further documentation: [Hardware Guide](hardware.md) — [Network](network.md) — [User Manual](bedienungsanleitung.md)_
