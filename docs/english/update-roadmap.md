# E.L.L.A. — Update Roadmap

As of: v1.5.6 · 2026-10-25

Post-launch updates — what was planned, what shipped, what's next.

---

## Shipped

All updates released since v1.0.0, in chronological order.

| Planned as               | Actually | What shipped                                                                  |
| ------------------------ | -------- | ----------------------------------------------------------------------------- |
| ~~Model Selection~~      | v1.0.0   | ModelSelectOverlay with hardware tier selection; custom models from v1.3.0    |
| ~~Multilingual Voices~~  | v1.0.0   | `spokenLanguage` (DE/EN/ES/FR), Kokoro + Edge TTS, onboarding voice selection |
| ~~Stress Detection~~     | v1.0.0   | `stress_server.py` port 3004, numpy RMS/ZCR/Pitch, opt-in                     |
| ~~Kokoro TTS Node.js~~   | v1.0.0   | `services/kokoro.ts` via kokoro-js, ONNX q8, no more Python                   |
| ~~Token Optimization~~   | v1.1.0   | Tool Selector (8 core + 20 lazy groups), Token Optimizer                      |
| ~~Multi-Agent Pipeline~~ | v1.2.0   | Parallel/sequential pipelines with OpenAI, live SSE per agent                 |
| ~~Setup Actions~~        | v1.3.0   | Tool calls as macro steps, 7 action templates, "Run now" button               |
| ~~Chess~~                | v1.4.0   | Frameless window, 4 themes, 3D SVG pieces, LLM AI, reflection, pause/resume   |
| ~~Knowledge Graph~~      | v1.5.0   | Triple extraction, hybrid recall, self-learning, proactive approval memory    |
| ~~API Security~~         | v1.5.1   | Loopback binding, per-start token, CORS, cloud governance (`openaiRequest()`) |
| ~~Privacy~~              | v1.5.2   | Sensitive data redaction, offline mode, result transparency                   |
| ~~Natural Conversation~~ | v1.5.3   | Stop-interrupt via voice command, 8s follow-up window                         |
| ~~Dictation Mode~~       | v1.5.4   | Speech → active Windows window, system-wide, configurable hotkey              |
| ~~Dictation Quality~~    | v1.5.5   | Clipboard preservation, conflict-free hotkey                                  |
| ~~HUD Mode~~             | v1.5.6   | 3 appearances (Calm/HUD/Show), orb states, telemetry panels                   |

---

## Product Positioning (updated)

**E.L.L.A. runs locally** — wakeword, memory, tools and rule engine never leave the device.

- **Local first:** Ollama as primary LLM, all core functions work without internet
- **OpenAI optional:** user's own API key, deliberately activated; `cloudFirst()` / `cloudAllowed()` govern every external call
- **Network connections:** License check at startup, Edge TTS for German (text sent to Microsoft), MediaPipe CDN for gesture control — all documented in [network.md](network.md)
- **Offline mode:** blocks 6 internet tools + all OpenAI calls; Edge TTS and LAN tools continue to work
- **The Directive always applies** — regardless of provider

### Character DNA

- **E.L.L.A.** — Genesis (Terminator Genisys) + Rachel (Blade Runner): adaptive, learning, almost human
- **E.L.L.A. ARM** — Red Queen (Raccoon City): cold, non-negotiable, Directive absolute _(planned)_
- **E.L.L.A. HOME** — Mother (Alien): quiet, omnipresent, its own protocols _(planned)_

---

## Planned Updates

### v1.6.0 — LoRA Fine-Tuning Pipeline

- Periodic retraining with collected feedback data (positive feedback from self-learning)
- RTX 2060 12GB as target hardware, unsloth/PEFT
- Training data from `learning_examples` table

### Expand Program Scanning

Tier 1 (Levenshtein fuzzy matching) is shipped. Open:

- **Tier 2 — Manual addition:** Settings UI where users can enter name + path (for portable apps)
- **Tier 3 — Pin favorites:** Mark 10–15 programs as daily favorites, shown first with `open_app`

### Browser Control

- Chrome/Edge via DevTools Protocol — tabs, navigation, DOM access
- Directive-compliant: no hidden browsing, user sees what happens

### Plugin Directory

- Tool manifest format so users can register custom tools
- Extensible without code changes

### Installer Improvements

- Auto-update channel, delta updates

---

## Ideas Pool (not yet evaluated)

### Trivia Game

- Open Trivia DB ([opentdb.com](https://opentdb.com)) as data source, LLM evaluates free-text answers
- Score tracking in MariaDB, streak system, adaptive difficulty
- Offline fallback: LLM generates questions itself

### Functional Consciousness (v1.7.0+)

- 3-layer framework: self-awareness, cognition, social
- Empathy model, curiosity system, value reflection
- Long-term goal — requires extensive research

### Emotion Recognition

- Pre-trained model via speechbrain (upgrade from numpy-based stress detection)
- Higher accuracy, more emotions beyond stress levels

### Local Web Search

- Self-hosted SearXNG as DuckDuckGo alternative without external API

---

## Not Planned (deliberate decision)

| Feature                      | Why not                                                                                |
| ---------------------------- | -------------------------------------------------------------------------------------- |
| Cloud Hosting                | Local execution is a design principle                                                  |
| Multi-User Network           | User profiles are device-local, no network sharing                                     |
| Docker Deployment            | Direct Windows integration is the core — Docker abstracts that away                    |
| Free Shell without Sandbox   | `run_command` exists — but sandboxed (60+ patterns, always requires confirmation)      |
| Continuous Camera Monitoring | Surveillance risk — Prohibition III (surveil). Single photos via `capture_photo` exist |

---

> This document grows over time. Every new idea that emerges after launch lands here first.
