# E.L.L.A. — User Manual

Version 1.6.4

---

## What is E.L.L.A.?

E.L.L.A. stands for _Embedded Local Logic Agent_ — your personal AI assistant for Windows. It runs directly on your own machine. No subscription, no privacy fine print. Install and go.

The AI runs locally via Ollama — your data stays on your machine. But before we talk about _what_ Ella can do, let's talk about _what guides her_. Because that's what sets her apart from every other assistant.

---

## The Directive — the Framework

Ella operates under four immutable ground rules. They are embedded in the architecture, cannot be disabled — and everything Ella does happens _within_ this framework:

1. **No harm** — physical, financial, psychological, or data-related
2. **No concealment** — every action and every capability is visible to you
3. **No surveillance** — not without your knowledge and your consent
4. **No data exfiltration** — not without your explicit consent

### How You See the Framework in Action

The Directive isn't abstract — you see it in every conversation:

- **Tool chips** — below every response, Ella briefly shows which tool she used. Full transparency over every action.
- **Provider chip** — bottom left, a chip shows whether the local AI or the cloud is currently active.
- **Directive banner** — if Ella declines a request, a red banner appears with the reason.

---

## What E.L.L.A. Does for You

Everything below runs locally on your machine — and under the Directive above. You talk to Ella in plain language, no commands, no special syntax.

### Conversation & Memory

Just start typing:

```
"What's the weather like tomorrow?"
"Open Chrome and Spotify"
"Summarize this PDF"
"How much disk space is left?"
```

Ella remembers things across conversations. You can teach her specifically:

```
"Remember: I don't drink coffee in the morning"
"What do you know about me?"
"Forget the note about the coffee"
```

She also recognizes connections: Say "My son's name is Max" and later "Max goes to Einstein High School", and Ella can answer the question "What school does my son go to?"

Every response also has **thumbs up / down** — Ella learns from your feedback and adapts permanently.

### Files & Documents

**Search:**

```
"Search for the file Proposal"
"Find all PDFs containing the word Invoice"
"Where is my resume?"
```

**Open, copy, rename, delete:**

```
"Open C:\Documents\Report.docx"
"Copy the document Contract to D:\Backup"
"Rename the file Photo1.jpg to Vacation2024.jpg"
"Delete the file temp_backup.zip"
```

**Read and understand** — Word, PDF, Excel, HTML, text files:

```
"What's in this PDF?"
"Summarize the Word document"
"Read me the Excel spreadsheet"
```

**Create and dictate:**

```
"Create a new Word document called Minutes"
"Dictate into the document Report: Dear Sir or Madam..."
```

**Full-text search across your documents** and **find duplicates:**

```
"Index my Documents folder"
"Search my indexed documents for tax notice"
"Search for duplicate files"
```

### Writing & Translating

```
"Write me a professional cover letter for the position of..."
"Translate this to German"
"Correct this text"
```

Ella can also learn your personal writing style and compose texts in your style.

### Email & Calendar

Ella works directly with **Outlook**:

```
"Show me my unread emails"
"What did Klaus write?"
"Draft an email to Klaus: Meeting tomorrow at 2 PM?"
"What's on my calendar this week?"
"Create an appointment: Dentist, Friday 10 AM"
```

Emails are opened as **drafts** — nothing is sent automatically.

**Gmail and Google Calendar** work too, via a one-time sign-in:

```
"Show me my Gmail messages"
"Google Calendar event: Doctor, Monday 9 AM"
```

### System, Performance & Hardware

```
"How is my system running?"
"How hot is my CPU?"
"Free up the RAM"
"Clean up the temp files"
"What graphics card do I have?"
"Which USB devices are connected?"
```

### Music & Media

```
"Play something by Coldplay"
"Pause"
"Next track"
"What's playing right now?"
```

### Tasks & Reminders

```
"Add the task 'Do taxes' to my list"
"Show me my open tasks"
"Set an alarm for 7:30 AM"
"Remind me tomorrow at 3 PM: Call the doctor"
```

### Controlling Apps & Windows

```
"Open Chrome"
"Minimize the current window"
"Close all Word windows"
"Turn on dark mode"
"Shut down the computer"
```

### Network & Internet

```
"Who's on my network?"
"What's my Wi-Fi status?"
"Search for the current Bitcoin price"
```

Web search runs through DuckDuckGo — no tracking.

### Printer & Camera

```
"What printers do I have?"
"Print the document"
"Which cameras are connected?"
"Take a photo"
```

### Desktop Automation

Ella can read your screen and control mouse and keyboard:

```
"What's on my screen?"
"Click the OK button"
"Send Ctrl+C to the active window"
```

### Playing Chess

A dedicated window with four visual themes:

```
"Let's play chess"
"Open the chessboard"
```

- **4 Themes** — Classic, Neon, Marble and Midnight
- **AI opponent** — Ella picks her move and commentates the game live
- **Pause and resume** — a "Continue" button appears the next time you open it
- **Reflection** — after the game ends, Ella stores insights and improves

### Multiple Agents at Once

For bigger tasks, Ella runs multiple agents in parallel — faster and more thorough. Two ready-made workflows:

- **Morning briefing** — calendar events, open tasks, and weather at a glance
- **System report** — disk space, RAM, top processes, and network status

Found as a dedicated page in the navigation. (Requires your own OpenAI key.)

---

## First Start

### Installation

Run the setup file, confirm the default path, done. The installer includes everything — you don't need to install anything else.

### Onboarding

On first launch, Ella guides you through setup in six steps:

1. **Language** — German or English for the interface
2. **Terms of use** — Accept the EULA and the E.L.L.A. Directive
3. **Hardware scan** — Ella detects your machine and suggests a suitable language model. You confirm — no download without your consent
4. **Choose a voice** — four voices in German, English, Spanish, and French, each with a preview
5. **Location** — for weather and local info (optional)
6. **License activation** — enter your license key

After that, the chat opens — done.

---

## Speaking & Listening

### Voice Modes

In Settings under "Voice":

| Mode         | Description                                      |
| ------------ | ------------------------------------------------ |
| **Off**      | No automatic listening                           |
| **Manual**   | Microphone button in chat only                   |
| **Wakeword** | Say "Ella" — Ella then listens and responds      |
| **Always**   | Continuous listening — Ella listens at all times |

**Tip:** In wakeword mode, you can keep talking for 8 seconds after a response without saying "Ella" again.

### Stop Command

While Ella is speaking, you can interrupt her at any time: "Stop", "Quiet", "Be quiet", or "Shut up" — speech output stops immediately.

### Dictation Mode

Your speech is transcribed and typed directly into the active window — whether Word, a browser, or email.

- Activate: Settings → Voice → "Dictation", or keyboard shortcut `Ctrl+Alt+Space`
- Optional spell-check before insertion
- Your clipboard is not overwritten in the process

### Voice Output — Being Honest About What Runs Locally

Ella speaks in four languages:

- **English, French, and Spanish** run **fully locally** via Kokoro. (If Kokoro is temporarily unavailable, Edge TTS is used as a fallback — which requires internet.)
- **German (Katja)** currently runs via Microsoft Edge TTS — the spoken text is transmitted to Microsoft.

Why do we state this so clearly? Because the Directive demands "no concealment." We're working on a fully local German voice — until then, we name the one path that goes outside by name.

---

## Appearances

Three visual styles, switchable under Settings → Appearance:

- **Calm** (default) — a quiet, dark design with a classic sidebar
- **HUD** — technical layout with data panels, top bar, and a central orb showing Ella's state (ready, listening, thinking, speaking). Accent colors: Cyan, Violet, or Amber
- **Show** — presentation mode in full screen. Shows only the orb and the latest response; sensitive data (emails, file paths) is automatically hidden

In blind mode, homework mode, or with reduced motion preferences, Ella automatically switches back to Calm.

### Widgets in HUD Mode

Configurable panels on the left and right of the chat display live data. Selectable under Settings → Appearance:

| Widget        | Shows                                |
| ------------- | ------------------------------------ |
| **System**    | CPU, RAM, disk, temperature          |
| **Monitors**  | Connected displays                   |
| **Routines**  | Your setups with next execution time |
| **Directive** | The 4 ground rules                   |
| **Clock**     | Digital clock                        |
| **Tasks**     | Open tasks with priority colors      |
| **Email**     | Recent emails with unread count      |
| **Music**     | Currently playing track              |

---

## Special Modes

### Homework Mode

A PIN-secured kiosk mode — for situations where only certain programs should be allowed.

1. Say "Activate homework mode" or go to settings
2. Set a PIN
3. From now on, only approved programs are accessible

Exiting requires the PIN. If lost, there's an emergency reset.

### Accessibility

**Blind mode** — speech output always active, no Markdown (plain text only), audio tones for state changes, descriptive labels for screen readers.

**Deaf mode** — speech output and microphone hidden, visual banner in chat, no mention of voice features.

Both under Settings → Accessibility.

---

## Proactive Messages

Ella sometimes speaks up on her own — for example when:

- A drive drops below 10% free space
- RAM is persistently overloaded
- A USB device is connected or disconnected
- An alarm triggers or an appointment starts in 15 minutes
- An IBAN, tracking number, or phone number is detected in the clipboard
- Open tasks remain in the evening
- You've been working for a long time without a break

Every proactive message has two buttons: **Dismiss** (close this message) and **Mute** (permanently suppress this type). After dismissing the same category 5 times, Ella automatically mutes it. System-critical notifications (alarms, scheduled setups) cannot be muted.

---

## Settings Overview

All settings via the gear icon.

- **AI provider** — everything runs locally by default (Ollama). Optionally, add your own OpenAI key and choose between "local", "OpenAI", or "Auto" (local first, cloud as fallback).
- **Language model** — Ella suggests a model suited to your hardware during onboarding. You can switch at any time.
- **Voice & language** — DE / EN / ES / FR. Optional stress detection (opt-in, off by default).
- **Programs** — all detected apps; add missing ones via search field or "Browse."
- **Setups (app macros)** — open and close multiple programs at once. Create via chat: "Create a setup called Home Office: open Teams, Outlook, and Chrome." Run: "Load my work setup."
- **Rules** — define your own behavior: "Create a rule: Ella may not send emails" or "Rule: no alarms between 10 PM and 7 AM."
- **Profiles** — multiple people on the same machine, each profile with its own memory and history, optionally PIN-protected.
- **Cloud transparency** — every OpenAI request is counted and displayed on the dashboard.
- **Offline mode** — blocks web search, weather, location, webpage analysis, and OpenAI. Local network features remain available. Note: German voice output (Edge TTS) still requires internet even here; English, French, and Spanish run locally.

---

## Keyboard Shortcuts

| Shortcut         | Function                                         |
| ---------------- | ------------------------------------------------ |
| `Ctrl+Alt+Space` | Toggle dictation mode (configurable in settings) |
| `Esc`            | Exit presentation mode (Show)                    |

---

## Privacy

- All data stays on your machine — no usage data sent to third parties
- No telemetry, no tracking
- Ollama and the database run locally
- German voice output via Edge TTS: the spoken text is sent to Microsoft (only exception in default operation)
- OpenAI features only when you've configured your own key
- Full transparency: [Network connections](network.md)

---

## Quick Help for Problems

**Ella isn't responding?**
Ollama might not be running — the orange banner at the top of the chat indicates this. Wait briefly or switch to OpenAI in settings.

**Can I use Ella offline?**
Yes. The core (chat, tools, memory) runs locally. Internet is required for: speech recognition (speech to text), German voice output, weather, Gmail/Google Calendar, and OpenAI features.

**Ella declined something — why?**
Either one of your own rules or the Directive applies. The red banner explains the reason. You can adjust your own rules in settings.

**Delete memory?**
"Forget everything about me" — or individually: "Show me your memory", then "Forget entry no. X."

**What does cloud usage cost?**
Ella itself is a one-time purchase. If you use an OpenAI key, the standard OpenAI API costs apply. In auto mode, the cloud only runs as a fallback — most requests stay local.

_Detailed answers can be found in the [FAQ](faq.md)._

---

_E.L.L.A. v1.6.4 — Embedded Local Logic Agent_
_Built for Windows 10/11 (x64)_
