# E.L.L.A. — Strategic Roadmap

**As of:** June 2026
**Current:** v3.4.0 — production-ready, local, Directive-secured, 85 tools

> _E.L.L.A. adapts to the user and grows with her challenges._

---

## Where E.L.L.A. Stands Today

E.L.L.A. runs on an i3 12th Gen with a GTX 1060 — consumer hardware below the market average. This is no accident. It is the proof: what runs on this hardware runs on any modern Windows device.

**Productive today (v3.4.0):**

- Local AI inference (llama3.1:8b, 14.6 t/s GPU, fully offline)
- 85 active tools — system control, files, media, network, communication, UI automation
- Wakeword activation ("ella") via openWakeWord + ONNX, fully offline
- Kokoro TTS — neural local speech output (Port 3003, 127.0.0.1-only)
- Mail & calendar (Outlook COM + Gmail/Google Calendar via OAuth 2.0)
- Proactive monitoring — firewall, DNS, new devices, storage, clipboard patterns
- Complete memory system (768-dim embeddings, MariaDB, cosine search)
- User profiles — profile-bound memory, PBKDF2+Salt PIN hash
- Conversation compression — Ollama-only, local context protection
- Semantic screen click — OCR → 3-pass matching → confirm
- Mouse, keyboard, windows, services, shell (sandboxed, confirmation required)
- The E.L.L.A. Directive — four immutable prohibitions, 82 default rules, audit log

---

## v2.x / v3.x — Productivity Sprint (completed)

Everything that makes E.L.L.A. a daily habit — fully implemented.

| Feature                   | Version | Status |
| ------------------------- | ------- | ------ |
| Onboarding 6-step flow    | v2.x    | ✅     |
| Proactive speech (SSE)    | v2.x    | ✅     |
| Location awareness        | v2.x    | ✅     |
| Directive UI (red badge)  | v2.x    | ✅     |
| wmic → CimInstance        | v2.x    | ✅     |
| Vision (screenshot + GPT) | v3.0.0  | ✅     |
| User profiles             | v3.1.0  | ✅     |
| Kokoro TTS (local)        | v3.1.0  | ✅     |
| Task list (MariaDB)       | v3.1.0  | ✅     |
| Conversation compression  | v3.1.0  | ✅     |
| Window context (opt-in)   | v3.1.0  | ✅     |
| System automation (10)    | v3.2.0  | ✅     |
| Mouse control + shell     | v3.3.0  | ✅     |
| Screen monitor (OCR diff) | v3.3.0  | ✅     |
| File operations (4)       | v3.4.0  | ✅     |
| System convenience (5)    | v3.4.0  | ✅     |
| Media control (WinRT)     | v3.4.0  | ✅     |
| AI text processing (2)    | v3.4.0  | ✅     |
| Semantic OCR click        | v3.4.0  | ✅     |

Not implemented (deliberately deferred): multilingual UI, camera integration, session persistence across restarts.

---

## v4.0 — Platform

The E.L.L.A. Directive as an open standard. E.L.L.A. as a platform.

| Feature                  | Description                                                          |
| ------------------------ | -------------------------------------------------------------------- |
| Directive public release | ella-directive goes public — open standard for local AI agents       |
| Conformance badge        | Other projects can be certified as "Directive-compliant"             |
| Plugin API               | Third parties can register tools — under Directive control           |
| Hardware abstraction     | Abstraction layer for different Windows devices (ARM, x64, Copilot+) |
| Multilingual UI          | i18n system — interface in the user's system language                |
| Enterprise edition       | Central policy management, audit export, AD integration              |

---

## Long-term — Beyond Desktop

The Directive is not limited to desktop AI.

The architectural principles of the E.L.L.A. Directive — prohibitions as structural impossibilities rather than interpretable rules — are applicable to any autonomous system:

| Domain                | Application                                          |
| --------------------- | ---------------------------------------------------- |
| Autonomous web agents | Browser automation with Directive protection         |
| IoT & smart home      | Device control within guaranteed limits              |
| Industrial robots     | Physical systems with trustworthy autonomy           |
| Humanoid robots       | The primary domain — physical safety as architecture |

---

## What Is Deliberately Not Planned

| Feature            | Why not                                                                                  |
| ------------------ | ---------------------------------------------------------------------------------------- |
| Cloud hosting      | Local execution is a design principle — no compromises                                   |
| Multi-user network | E.L.L.A. is a personal assistant — user profiles are device-local, no network sharing    |
| Subscription       | One-time purchase — €99 consumer, €299 enterprise. No monthly costs.                     |
| Unrestricted shell | `run_command` exists — but sandboxed (60+ locked patterns, confirmation always required) |
| Uncontrolled AI    | The Directive prevents execution without user knowledge — by design                      |

---

## OEM Integration

E.L.L.A. is designed for OEM pre-installation:

- **Installer:** NSIS-based, silent install, no technical setup required for the user
- **Activation model:** Pre-install free + €99 activation — or $2/device OEM license
- **Support:** E.L.L.A. is her own support. No FAQ needed. No technician needed.
- **GDPR/EU AI Act:** No data leaves the device — Limited Risk, no registration obligation

---

> E.L.L.A. is not a chatbot that happens to run on the desktop.
> She is an assistant who knows the device, knows the user, and knows what she will never do.
