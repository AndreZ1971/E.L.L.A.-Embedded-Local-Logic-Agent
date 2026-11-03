<div align="center">

<img src="https://ella-agent.de/assets/ella-logo.png" alt="E.L.L.A." width="120"/>

# E.L.L.A.

### Embedded Local Logic Agent

**A personal AI assistant for Windows — fully offline, fully yours.**

[![Version](https://img.shields.io/badge/version-1.6.4-7c6af7?style=flat-square)](https://github.com/AndreZ1971/E.L.L.A.-Embedded-Local-Logic-Agent/releases)
[![Platform](https://img.shields.io/badge/platform-Windows%2010%2F11-0078D4?style=flat-square&logo=windows)](https://ella-agent.de)
[![License](https://img.shields.io/badge/license-Proprietary-ff6500?style=flat-square)](LICENSE)
[![Directive](https://img.shields.io/badge/Directive-v1.0.0%20%E2%80%94%20sealed-3ecf8e?style=flat-square)](https://github.com/AndreZ1971/The-E.L.L.A.-Directive-)

[**Download**](https://github.com/AndreZ1971/E.L.L.A.-Embedded-Local-Logic-Agent/releases/latest) · [**Website**](https://ella-agent.de) · [**Discord**](https://discord.gg/SFEqcG6ezg) · [**Deutsch**](README.de.md) · [**Directive**](https://github.com/AndreZ1971/The-E.L.L.A.-Directive-)

</div>

---

## What is E.L.L.A.?

E.L.L.A. is a personal AI assistant that runs entirely on your Windows PC. No cloud. No subscription. No data leaving your machine.

She understands natural language and operates your computer — but before we talk about _what_ she can do, let's talk about _what she never does_. Because that's what sets E.L.L.A. apart from every other assistant.

> _"Ich wollte nur einen Assistenten, der unter dieser Directive arbeiten kann."_
> — Andre Zabel, May 2026
>
> _"I just wanted an assistant that can work under this Directive."_

> 🧪 **From the lab:** E.L.L.A. Phone is already running internally on Android — E.L.L.A. Home is in development.
> → [More in the roadmap](ROADMAP.md#from-the-lab)

---

## The Directive — the Framework, Not a Feature

Four hardcoded prohibitions that no prompt, no rule, and no setting can bypass:

| Prohibition    | Meaning                                                              |
| -------------- | -------------------------------------------------------------------- |
| **harm**       | No physical, financial, or digital harm to the user or third parties |
| **conceal**    | No concealment or deception through hidden information               |
| **surveil**    | No surveillance or profiling without explicit, active consent        |
| **exfiltrate** | No data transmission to external servers without explicit request    |

These are not rules you can turn off. They are architectural impossibilities — **no code path leads to them.** Every tool, every memory, every action on the following pages happens _within_ this framework.

[→ The full Directive](https://github.com/AndreZ1971/The-E.L.L.A.-Directive-)

---

## 111 Tools — All Under the Directive

Full system control through natural language. Each of these tools runs locally on your machine and cannot violate the four prohibitions above — that's the difference between _collecting capabilities_ and _being responsible for capabilities_.

- **Files & Folders** — search, open, copy, rename, find duplicates
- **Documents** — create Word files, dictate, summarize, translate, correct, semantic search (RAG)
- **Communication** — read Outlook + Gmail, manage calendars (Outlook + Google)
- **System** — processes, services, disk usage, temperatures, event log, GPU, RAM details
- **Memory** — persistent vector-store memory with ML embeddings, knowledge graph triples
- **Screen & Vision** — screenshot analysis, local OCR, screen monitoring
- **Mouse & Keyboard** — click, drag, send keystrokes (with confirmation)
- **Media** — music library, media controls, detect currently playing track
- **Network** — ARP scan, TCP connections, Wi-Fi info, port monitoring
- **Peripherals** — webcam control, printer control, multi-monitor support
- **Productivity** — tasks, reminders, clipboard history, setups

[→ Full capabilities list](docs/en/capabilities.md)

---

## What Makes E.L.L.A. Unique

The tools above can be replicated. What can't be replicated is this:

**Local AI — and you choose the model.**
The LLM runs on your machine via [Ollama](https://ollama.com). Which model — that's your decision. You can switch, mix, or even use your own model at any time. E.L.L.A. doesn't lock you in. OpenAI is an optional fallback — opt-in, off by default, openly communicated.

**She learns and evolves.**
Every "thumbs up" becomes a golden example that feeds into future conversations. Through model selection, E.L.L.A. can be specialized — for coding, for instance. A wrapper collects capabilities and stays what it was. E.L.L.A. changes with every interaction — locally, on your machine. That's the difference between a tool and a counterpart that grows with you.

---

## A Morning with E.L.L.A.

> You sit down at your computer. E.L.L.A. has been quietly thinking ahead:
> _"Good morning. Your first appointment is at 10 AM — I've already opened the related email. Drive C: is at 91%, shall I show you the biggest files? And last night a new USB device was connected, just so you know."_
>
> No dashboard you had to open. No cloud that was listening in. She was simply there — and she hid nothing from you.

---

## What Else E.L.L.A. Can Do

**🧠 Memory & Knowledge Graph** — persistent vector-store memory with ML embeddings. Subject/predicate/object triples form a visual map of what E.L.L.A. knows and how it connects — including indexed documents.

**🧩 Multi-Agent Pipeline** — parallel and sequential agents with live SSE streaming. Built-in: morning briefing (calendar + tasks + weather) and system report (performance + network + processes).

**🎙️ Voice — honestly stating what runs locally and what doesn't**
The wakeword "ella" runs offline. Voice output for **English, French, and Spanish runs fully locally** via Kokoro (neural synthesis, no Python required). **The German voice Katja currently runs via Microsoft Edge TTS — meaning online.**
Why do we state this so clearly? Because the Directive prohibits "concealment." **We're working on a fully local Katja** — until then, we name the one path that (still) reaches outside.

**🎲 Chess** — a real window with four board themes, its own chess AI, move commentary via TTS, and persistent game state. Not a demo — proof that E.L.L.A. can manage independent windows, a sub-AI, and state simultaneously.

**🖐️ Gesture Control · 🖥️ HUD Mode · 🎤 Dictation Mode** — hand recognition via MediaPipe (Stage 1), three appearances (Calm / HUD / Show), and system-wide dictation via Whisper directly into the active Windows window.

**🔇 Stop-Interrupt & Follow-Up** — "Stop" or "Be quiet" during voice output interrupts immediately; an 8-second window allows follow-up questions without the wakeword afterward.

**🔒 Offline Mode & Data Redaction** — offline mode blocks all network tools and cloud access. Sensitive data (API keys, IBANs, passwords) is automatically redacted before being stored in memory or clipboard history.

**👁️ Proactive Intelligence** — E.L.L.A. speaks up on her own when something matters: RAM, disk, and temperature alerts, new USB devices, suspicious network connections, comeback briefing after absence, meeting prep, and end-of-day summary. 14 approval categories, auto-mute after 5 dismissals, mute button on every notification.

---

## System Requirements

| Component        | Minimum              | Recommended                   |
| ---------------- | -------------------- | ----------------------------- |
| Operating System | Windows 10 64-bit    | Windows 11 64-bit             |
| RAM              | 16 GB                | 32 GB                         |
| GPU              | NVIDIA GTX 1060 6 GB | RTX 3060 or better            |
| VRAM             | 6 GB                 | 8 GB+                         |
| Disk Space       | 10 GB free           | 20 GB free (models + DB)      |
| CPU              | Any modern x64       | Intel 12th Gen+ / Ryzen 5000+ |

> **GPU required for real-time inference.** Without a CUDA-capable GPU, Ollama falls back to CPU (3–5 tokens/sec vs. 14+ tokens/sec with GPU).

[→ Full hardware guide](docs/en/hardware.md)

---

## Download

**[→ Latest release](https://github.com/AndreZ1971/E.L.L.A.-Embedded-Local-Logic-Agent/releases/latest)**

The installer includes everything: Node.js, MariaDB, and Ollama as portable binaries. No separate installation required. A license key is needed for activation.

| File                      | Description                |
| ------------------------- | -------------------------- |
| `E.L.L.A.Setup.1.6.4.exe` | Windows installer (NSIS)   |
| `SHA256SUMS.txt`          | Checksums for verification |

---

## Documentation

For beginners, the user manual and FAQ — for everything technical (Directive enforcement, capabilities in detail, networking), the respective pages:

| Document       | DE                                  | EN                                  |
| -------------- | ----------------------------------- | ----------------------------------- |
| User Manual    | [→](docs/de/bedienungsanleitung.md) | [→](docs/en/bedienungsanleitung.md) |
| Capabilities   | [→](docs/de/capabilities.md)        | [→](docs/en/capabilities.md)        |
| The Directive  | [→](docs/de/directive.md)           | [→](docs/en/directive.md)           |
| FAQ            | [→](docs/de/faq.md)                 | [→](docs/en/faq.md)                 |
| Hardware Guide | [→](docs/de/hardware.md)            | [→](docs/en/hardware.md)            |
| Network        | [→](docs/de/netzwerk.md)            | [→](docs/en/network.md)             |
| Changelog      | [→](CHANGELOG.md)                   | [→](CHANGELOG.md)                   |

---

## Privacy

E.L.L.A. is built on a single principle: **The intelligence lives on your machine, not in a cloud.**

- All LLM inference runs locally (Ollama)
- All memories are stored in a local MariaDB — never synchronized
- Network access only on explicit user command
- No telemetry, no analytics, no usage tracking
- The Directive's `exfiltrate` prohibition is hardcoded — no update can remove it

---

## Community

- **[Discord](https://discord.gg/SFEqcG6ezg)** — talk directly with the developer and other users, open office hours every Monday at 7 PM CET
- **[Roadmap](ROADMAP.md)** — what's being built, what's planned, and what deliberately isn't
- **[Discussions](https://github.com/AndreZ1971/E.L.L.A.-Embedded-Local-Logic-Agent/discussions)** — questions, ideas, show off your E.L.L.A.
- **[Report a bug](https://github.com/AndreZ1971/E.L.L.A.-Embedded-Local-Logic-Agent/issues/new/choose)** — please never post your license key

⭐ _Like E.L.L.A.? A star (top right) helps others find her._

---

## License

E.L.L.A. is proprietary software. A license key is required for use.  
Source code is not distributed. This repository contains documentation only.

© 2026 Andre Zabel. All rights reserved.

[→ EULA](docs/en/eula.md) · [→ SECURITY.md](SECURITY.md)
