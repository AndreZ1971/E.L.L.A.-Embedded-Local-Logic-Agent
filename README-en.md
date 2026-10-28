# E.L.L.A. -- Embedded Local Logic Agent

> _ELLA adapts to the user and grows with her challenges._

**Version 1.5.7** | Windows 10/11 (x64) | [ella-agent.de](https://ella-agent.de) | [Deutsche Version](README.md)

---

## What is E.L.L.A.?

E.L.L.A. is a personal AI assistant that runs as a desktop app directly on your Windows machine. The AI runs on your hardware -- no subscription, no telemetry. ELLA manages your system, learns your habits, remembers conversations, and acts proactively on your behalf.

At its core, ELLA uses a local language model (Ollama, model qwen2.5:14b). Optionally, you can add your own OpenAI key for advanced features like image recognition, writing style analysis, or the multi-agent pipeline.

---

## What Can ELLA Do?

### Productivity

- **111 tools:** Search and open files, create and read documents (Word, PDF, Excel, HTML), manage tasks, set alarms, create reminders, play music, launch programs
- **Email and calendar:** Read Outlook and Gmail, manage appointments, create drafts -- ELLA never sends automatically
- **Dictation mode:** Speech is transcribed and typed directly into the active window -- system-wide, not just inside ELLA
- **Desktop automation:** Launch apps, control windows, send keystrokes, operate the mouse
- **Personal macros:** Save frequently used workflows as setup actions and run them with one click

### Intelligent Memory

- **Knowledge graph:** ELLA automatically extracts relationships from conversations and understands connections -- not just text similarity
- **Learning from feedback:** Thumbs up/down permanently improves future responses
- **Proactive learning:** ELLA remembers which notifications you want and which you don't -- after five dismissals, a category is automatically muted

### Voice and Speech Input

- **Wakeword:** Say "ELLA" -- she listens locally, no cloud service involved
- **Four languages:** German, English, French, Spanish -- with female voices
- **Stress detection:** Optionally analyzes your voice and adjusts her tone (opt-in)
- **Follow-up:** After a response, you can continue speaking for 8 seconds without repeating the wakeword

### Monitoring and Proactivity

- **Background monitoring:** Disk space, RAM, network, USB devices -- ELLA warns before problems arise
- **Clipboard detection:** IBANs, tracking numbers, phone numbers, URLs are automatically recognized
- **Comeback briefing:** What happened while you were away?
- **Daily summary:** End-of-day recap with due tasks

### Chess

- **Visual chessboard:** Dedicated window with four themes and 3D pieces
- **Learning AI:** ELLA stores insights from every game and comments live
- **Pause and resume:** Games can be interrupted and continued later

### Accessibility

- **Blind mode:** Text-to-speech enforced, audio feedback, full screen reader support
- **Deaf mode:** Purely visual, no audio elements

### HUD Mode

- **Three appearances:** Standard (dark), HUD (technical, with widgets), and presentation mode (fullscreen, showing only the orb and the last response)
- **Widgets:** System status, monitors, tasks, emails, music, routines -- freely configurable
- **Orb:** Animated visualization with six states (ready, listening, thinking, speaking, cloud, offline)

---

## System Requirements

| Component        | Minimum                     | Recommended                            |
| ---------------- | --------------------------- | -------------------------------------- |
| Operating system | Windows 10/11 (x64)         | Windows 11                             |
| RAM              | 8 GB                        | 16 GB                                  |
| Disk space       | 15 GB free                  | 20 GB free                             |
| GPU              | Not strictly required       | NVIDIA with 8+ GB VRAM (e.g. RTX 3060) |
| Internet         | For initial setup & license | Then optional (usable offline)         |

**Without a GPU,** ELLA runs on the CPU -- slower, but functional. With an NVIDIA graphics card from the RTX 20 series or newer (CUDA 13) and at least 10 GB VRAM, the language model runs significantly faster.

---

## Installation

**Prerequisites: none.** The installer includes everything.

1. Download the installer from [ella-agent.de](https://ella-agent.de)
2. Run the installer and follow the prompts
3. On first launch: choose language (DE/EN), accept EULA, enter license key, select model, complete onboarding -- done

The installer contains all required components (database, language model runtime, server) -- you don't need to install or configure anything separately.

**License key:** Available at [ella-agent.de](https://ella-agent.de). One-time purchase, no subscription.

---

## Network and Privacy

ELLA operates locally at its core. Network connections exist only for:

1. **License check at startup** -- offline-tolerant, uses cache when there is no internet
2. **German text-to-speech** -- uses Microsoft Edge TTS (internet required; English, French, and Spanish run locally)
3. **Online features** you actively use (web search, weather, email)
4. **OpenAI API** only with your own key, if you choose to set one up
5. **One-time model downloads** on first use

No telemetry. No tracking. No usage data sent to third parties.

Details: [Network documentation](docs/english/network.md)

---

## The E.L.L.A. Directive

The E.L.L.A. Directive is an ethical framework anchored in the architecture -- not configurable, not disableable. Four prohibitions always apply:

1. **No harm** -- physical, financial, psychological, or data-related
2. **No concealment** -- all actions are logged and traceable
3. **No surveillance** -- without your knowledge and active consent
4. **No data exfiltration** -- without your explicit permission

Additionally, a rule engine with over 100 rules protects against unintended actions. Critical operations (e.g. formatting a drive, terminating processes) always require confirmation.

The Directive is an independent open-source project (MIT license): [github.com/AndreZ1971/The-E.L.L.A.-Directive-](https://github.com/AndreZ1971/The-E.L.L.A.-Directive-)

---

## Documentation

| Document                                                        | Content                       |
| --------------------------------------------------------------- | ----------------------------- |
| [User Manual (EN)](docs/english/bedienungsanleitung.md)         | Full user manual in English   |
| [Bedienungsanleitung (DE)](docs/deutsch/bedienungsanleitung.md) | Full user manual in German    |
| [Network (EN)](docs/english/network.md)                         | Network connections explained |
| [Netzwerk (DE)](docs/deutsch/netzwerk.md)                       | Which connections ELLA makes  |
| [CHANGELOG](CHANGELOG.md)                                       | All versions at a glance      |

---

## License and Contact

**License:** Proprietary. One-time purchase, no subscription. License key required.

**Website:** [ella-agent.de](https://ella-agent.de)

**Source code:** [github.com/AndreZ1971/E.L.L.A.-Embedded-Local-Logic-Agent](https://github.com/AndreZ1971/E.L.L.A.-Embedded-Local-Logic-Agent) (public, for reference)

---

_E.L.L.A. -- All rights reserved._
