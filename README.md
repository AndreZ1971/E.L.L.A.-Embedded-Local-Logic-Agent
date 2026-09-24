<div align="center">

<img src="https://ella-agent.de/assets/ella-logo.png" alt="E.L.L.A." width="120"/>

# E.L.L.A.

### Embedded Local Logic Agent

**A personal AI assistant for Windows — fully offline, fully yours.**

[![Version](https://img.shields.io/badge/version-1.4.0-7c6af7?style=flat-square)](https://github.com/AndreZ1971/E.L.L.A./releases)
[![Platform](https://img.shields.io/badge/platform-Windows%2010%2F11-0078D4?style=flat-square&logo=windows)](https://ella-agent.de)
[![License](https://img.shields.io/badge/license-Proprietary-ff6500?style=flat-square)](LICENSE)
[![Directive](https://img.shields.io/badge/Directive-v1.0.0%20%E2%80%94%20sealed-3ecf8e?style=flat-square)](https://github.com/AndreZ1971/The-E.L.L.A.-Directive-)

[**Download**](https://github.com/AndreZ1971/E.L.L.A./releases/latest) · [**Website**](https://ella-agent.de) · [**Deutsch**](README.de.md) · [**Directive**](https://github.com/AndreZ1971/The-E.L.L.A.-Directive-)

</div>

---

## What is E.L.L.A.?

E.L.L.A. is a personal AI assistant that runs entirely on your Windows PC. No cloud. No subscription. No data leaving your machine.

It understands natural language and can operate your computer — launch apps, search files, read emails, manage your calendar, control media, monitor your system, and much more. With 85 tools, a persistent vector memory, proactive monitoring, and a built-in ethics layer, E.L.L.A. is not a chatbot. It is an agent.

> _"I just wanted an assistant that works under this Directive."_
> — Andre Zabel, May 2026

---

## Key Features

### 🧠 Local AI — No Cloud Required

The LLM runs on your machine via [Ollama](https://ollama.com) (`llama3.1:8b`). Every conversation, every memory, every tool call stays local. OpenAI GPT-4o is an optional fallback — explicitly opt-in only.

### 🔒 The E.L.L.A. Directive

Four hardcoded prohibitions that no prompt, rule, or setting can override:

| Prohibition    | What it means                                                          |
| -------------- | ---------------------------------------------------------------------- |
| **harm**       | No physical, financial, or digital damage to the user or third parties |
| **conceal**    | No hiding, delaying, or distorting information to deceive              |
| **surveil**    | No tracking or profiling without explicit, active consent              |
| **exfiltrate** | No sending user data to external servers without explicit request      |

These are not rules. They are architectural impossibilities — no code path leads to them. [→ Full Directive](https://github.com/AndreZ1971/The-E.L.L.A.-Directive-)

### 🛠️ 85 Tools

Full system control through natural language:

- **Files & Folders** — search, open, copy, rename, find duplicates
- **Documents** — create Word files, dictate, summarize, translate, correct
- **Communication** — read Outlook + Gmail, manage calendar (Outlook + Google)
- **System** — processes, services, disk usage, temperatures, event log
- **Memory** — persistent vector memory with ML embeddings (Cosine similarity)
- **Screen & Vision** — screenshot + GPT-4o analysis, local OCR, screen watching
- **Mouse & Keyboard** — click, drag, send keystrokes (with confirmation)
- **Media** — music library, media controls, now-playing detection
- **Network** — ARP scan, TCP connections, WiFi info, port monitoring
- **Productivity** — tasks, reminders, clipboard history, setups

[→ Full capabilities list](docs/en/capabilities.md)

### 🧩 Multi-Agent Pipeline

Parallel and sequential agent pipelines with live SSE streaming. Built-in pipelines: Morning Briefing (calendar + tasks + weather) and System Report (performance + network + processes).

### 🕸️ Knowledge Graph

D3 force-directed graph of semantic connections between memories. Visual map of what E.L.L.A. knows and how it relates — including indexed documents.

### 🎙️ Voice — Fully Local

- **Wakeword "ella"** — via openWakeWord + ONNX, offline
- **Kokoro TTS** — neural voice synthesis, Node.js, no Python required
- **Multilingual** — DE / EN / ES / FR voices

### 🎲 Chess

A full chess window with 4 board themes, a chess AI, move commentary via TTS, and game state persistence. Not a demo — a real feature that demonstrates E.L.L.A.'s ability to manage independent windows, a sub-AI, and persistent state simultaneously.

### 👁️ Proactive Intelligence

E.L.L.A. monitors and writes to the chat unprompted when something matters:

- RAM, disk, temperature alerts
- New USB devices
- Suspicious network connections
- Clipboard pattern recognition (IBAN, tracking numbers, URLs)
- Comeback briefing after absence
- Meeting prep, end-of-day summary, break reminders

---

## System Requirements

| Component | Minimum              | Recommended                   |
| --------- | -------------------- | ----------------------------- |
| OS        | Windows 10 64-bit    | Windows 11 64-bit             |
| RAM       | 16 GB                | 32 GB                         |
| GPU       | NVIDIA GTX 1060 6 GB | RTX 3060 or better            |
| VRAM      | 6 GB                 | 8 GB+                         |
| Storage   | 10 GB free           | 20 GB free (models + DB)      |
| CPU       | Any modern x64       | Intel 12th Gen+ / Ryzen 5000+ |

> **GPU required for real-time inference.** Without a CUDA-capable GPU, Ollama falls back to CPU (3–5 tokens/sec vs. 14+ tokens/sec with GPU).

[→ Full hardware guide](docs/en/hardware.md)

---

## Download

**[→ Latest Release](https://github.com/AndreZ1971/E.L.L.A./releases/latest)**

The installer bundles everything: Node.js, MariaDB, and Ollama as portable binaries. No separate installation required. A license key is required for activation.

| File                      | Description                |
| ------------------------- | -------------------------- |
| `E.L.L.A.Setup.1.4.0.exe` | Windows installer (NSIS)   |
| `SHA256SUMS.txt`          | Checksums for verification |

---

## Documentation

| Document        | DE                                  | EN                                  |
| --------------- | ----------------------------------- | ----------------------------------- |
| Getting Started | [→](docs/de/bedienungsanleitung.md) | [→](docs/en/bedienungsanleitung.md) |
| Capabilities    | [→](docs/de/capabilities.md)        | [→](docs/en/capabilities.md)        |
| The Directive   | [→](docs/de/directive.md)           | [→](docs/en/directive.md)           |
| FAQ             | [→](docs/de/faq.md)                 | [→](docs/en/faq.md)                 |
| Hardware Guide  | [→](docs/de/hardware.md)            | [→](docs/en/hardware.md)            |
| Changelog       | [→](CHANGELOG.md)                   | [→](CHANGELOG.md)                   |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    E.L.L.A.                         │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐ │
│  │  Chat UI │  │  Voice   │  │  Proactive Worker  │ │
│  │ (React)  │  │ (Kokoro) │  │  (60s background)  │ │
│  └────┬─────┘  └────┬─────┘  └─────────┬──────────┘ │
│       └─────────────┴──────────────────┘            │
│                      │                              │
│         ┌────────────▼────────────┐                 │
│         │     Directive Layer     │  ← 4 prohibitions│
│         │  harm · conceal ·       │    hardcoded,    │
│         │  surveil · exfiltrate   │    no bypass     │
│         └────────────┬────────────┘                 │
│                      │                              │
│         ┌────────────▼────────────┐                 │
│         │      Tool Selector      │  ← 12 of 85     │
│         │   (token-optimized)     │    per request   │
│         └────────────┬────────────┘                 │
│                      │                              │
│    ┌─────────────────┼─────────────────┐            │
│    ▼                 ▼                 ▼            │
│ Ollama           OpenAI            85 Tools         │
│ (local, offline) (opt-in only)    (system control)  │
│                                                     │
│    ┌────────────────────────────────────────────┐   │
│    │  MariaDB (local) · Vector Memory · Audit   │   │
│    └────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## Privacy

E.L.L.A. is built on a single principle: **the intelligence lives on your machine, not in a cloud.**

- All LLM inference runs locally (Ollama)
- All memory stored in local MariaDB — never synced
- Network access only on explicit user command
- No telemetry, no analytics, no usage tracking
- The Directive's `exfiltrate` prohibition is hardcoded — no update can remove it

---

## License

E.L.L.A. is proprietary software. A license key is required for use.  
Source code is not distributed. This repository contains documentation only.

© 2026 Andre Zabel. All rights reserved.

[→ EULA](docs/en/eula.md) · [→ SECURITY.md](SECURITY.md)
