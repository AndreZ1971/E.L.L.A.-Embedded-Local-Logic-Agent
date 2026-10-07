# E.L.L.A. — Embedded Local Logic Agent

> _ELLA passt sich dem Nutzer an und wächst mit ihren Herausforderungen._

Lokaler Windows KI-Assistent als Electron-Desktop-App. Läuft vollständig offline via Ollama, optional mit OpenAI GPT-4o.

**[English version below](#english)**

---

## Was ist ELLA?

ELLA ist ein persönlicher KI-Assistent, der vollständig auf deinem Windows-Rechner läuft — keine Cloud, kein Abo, keine Telemetrie. Sie verwaltet dein System, lernt deine Gewohnheiten, erinnert sich an Gespräche und handelt proaktiv.

## Highlights

### Intelligentes Gedächtnis

- **Knowledge Graph:** ELLA extrahiert automatisch Zusammenhänge aus Gesprächen (Subjekt/Prädikat/Objekt) und versteht Verbindungen — nicht nur Textähnlichkeit
- **Hybrid-Recall:** Cosine-Similarity + Graph-Traversal für tieferen Kontext
- **Duplikat-Prävention:** Automatische Erkennung und Bereinigung doppelter Erinnerungen
- **Proactive Approval-Memory:** ELLA lernt, welche Hinweise du willst — Auto-Mute nach 5x Wegdrücken

### Produktivität

- **85 Tools:** Dateien suchen, Dokumente erstellen/lesen, Aufgaben verwalten, Wecker, Musik, Prozesse, Dienste, Lautstärke, Zwischenablage, Erinnerungen, Screenshots, Textverarbeitung
- **Outlook & Gmail:** E-Mails lesen, Kalender verwalten, Entwürfe erstellen
- **Multi-Agenten-Pipeline:** Parallele KI-Agenten für komplexe Aufgaben (Morgenbriefing, System-Report)
- **Setup-Aktionen:** Automatisierte Tool-Chains als persönliche Makros

### Schach

- **Visuelles Brett:** Rahmenloses Electron-Fenster mit 4 Themes, 3D-Figuren, Partikel-Hintergrund
- **Lernende KI:** ELLA speichert Erkenntnisse aus jeder Partie und kommentiert live mit Persönlichkeit
- **Pause/Resume:** Partien können jederzeit unterbrochen und fortgesetzt werden

### Voice & Barrierefreiheit

- **Wakeword:** "ELLA" — immer bereit, lokal erkannt (OpenWakeWord + ONNX)
- **Kokoro TTS:** Lokale neuronale Stimme in 4 Sprachen (DE/EN/ES/FR)
- **Stress-Erkennung:** Analysiert Stimme auf Stresslevel, passt Antworten an
- **Blind-Modus:** TTS erzwungen, Audio-Feedback, vollständige ARIA-Labels
- **Gehörlosenmodus:** Rein visuell, keine Audio-Elemente

### Monitoring & Proaktivität

- **Background Worker:** Disk/RAM-Warnungen, Netzwerk-Überwachung, Alarm-Check
- **Clipboard-Erkennung:** IBAN, Paketnummern, Telefonnummern, URLs automatisch erkannt
- **Comeback-Briefing:** Was ist passiert, seit du weg warst?
- **Rhythmus-Analyse:** Erkennt tägliche Muster und schlägt Automatisierungen vor

### Sicherheit — Die E.L.L.A. Directive

Vier unveränderliche, architektonisch verankerte Verbote:

1. **Kein Schaden** — physisch, finanziell, psychologisch
2. **Keine Verschleierung** — alle Aktionen werden protokolliert
3. **Keine Überwachung** — ohne Wissen und Zustimmung
4. **Keine Datenweitergabe** — ohne ausdrückliche Erlaubnis

### Token-Optimierung

- **Tool-Selector:** Sendet nur relevante Tools (~12 statt 85) pro Anfrage
- **Pre-Compression:** Regelbasierte Vorkompression ohne LLM-Kosten
- **Output-Limits:** Hard-Cap auf Tool-Ergebnisse und JSON-Strings

## Tech-Stack

| Komponente | Technologie                                           |
| ---------- | ----------------------------------------------------- |
| Backend    | Express, TypeScript, MariaDB                          |
| Frontend   | React 18, Vite                                        |
| Desktop    | Electron 33 + electron-builder                        |
| LLM        | Ollama (offline) + OpenAI GPT-4o (optional)           |
| Voice      | Kokoro TTS (ONNX), MsEdgeTTS (Fallback), OpenWakeWord |
| Mono-Repo  | npm workspaces                                        |

## Schnellstart (Entwicklung)

```powershell
# Voraussetzungen: Node.js 22, MariaDB, Ollama
npm install
npm run dev          # API (Port 3002) + Web (Port 5173)
npm test             # 254 Tests (Vitest)
```

## Installer

Der Installer bündelt alles — Node.js, MariaDB, Ollama. Der Nutzer braucht nichts vorinstalliert.

```powershell
.\scripts\download-vendor-deps.ps1
.\scripts\prepare-api-deps.ps1
.\scripts\build-installer.ps1
```

## Versionen

| Version    | Highlights                                                                             |
| ---------- | -------------------------------------------------------------------------------------- |
| v1.0.0     | Kern: 85 Tools, Rule Engine, Voice, Directive, Onboarding                              |
| v1.1.0     | Token-Optimierung: Tool-Selector, Token-Optimizer                                      |
| v1.2.0     | Multi-Agenten-Pipeline mit Live-Streaming                                              |
| v1.3.0     | Setup-Aktionen, Netzwerk-Transparenz                                                   |
| v1.4.0     | Schach mit lernendem KI-Gegner                                                         |
| **v1.5.0** | **Knowledge Graph, Proactive Approval-Memory, Memory-Deduplizierung, Pre-Compression** |

## Lizenz

Proprietär. Lizenzschlüssel erforderlich.

---

<a id="english"></a>

# E.L.L.A. — Embedded Local Logic Agent

> _ELLA adapts to the user and grows with their challenges._

Local Windows AI assistant as an Electron desktop app. Runs fully offline via Ollama, optionally with OpenAI GPT-4o.

---

## What is ELLA?

ELLA is a personal AI assistant that runs entirely on your Windows machine — no cloud, no subscription, no telemetry. She manages your system, learns your habits, remembers conversations, and acts proactively.

## Highlights

### Intelligent Memory

- **Knowledge Graph:** ELLA automatically extracts relationships from conversations (subject/predicate/object) and understands connections — not just text similarity
- **Hybrid Recall:** Cosine similarity + graph traversal for deeper context
- **Duplicate Prevention:** Automatic detection and cleanup of duplicate memories
- **Proactive Approval-Memory:** ELLA learns which notifications you want — auto-mute after 5 dismissals

### Productivity

- **85 Tools:** Search files, create/read documents, manage tasks, alarms, music, processes, services, volume, clipboard, reminders, screenshots, text processing
- **Outlook & Gmail:** Read emails, manage calendar, create drafts
- **Multi-Agent Pipeline:** Parallel AI agents for complex tasks (morning briefing, system report)
- **Setup Actions:** Automated tool-chains as personal macros

### Chess

- **Visual Board:** Frameless Electron window with 4 themes, 3D pieces, particle background
- **Learning AI:** ELLA stores insights from every game and comments live with personality
- **Pause/Resume:** Games can be interrupted and continued at any time

### Voice & Accessibility

- **Wakeword:** "ELLA" — always ready, locally recognized (OpenWakeWord + ONNX)
- **Kokoro TTS:** Local neural voice in 4 languages (DE/EN/ES/FR)
- **Stress Detection:** Analyzes voice for stress levels, adapts responses
- **Blind Mode:** Forced TTS, audio feedback, complete ARIA labels
- **Deaf Mode:** Purely visual, no audio elements

### Monitoring & Proactivity

- **Background Worker:** Disk/RAM warnings, network monitoring, alarm check
- **Clipboard Detection:** IBAN, tracking numbers, phone numbers, URLs automatically recognized
- **Comeback Briefing:** What happened while you were away?
- **Rhythm Analysis:** Detects daily patterns and suggests automations

### Security — The E.L.L.A. Directive

Four immutable, architecturally anchored prohibitions:

1. **No harm** — physical, financial, psychological
2. **No concealment** — all actions are logged
3. **No surveillance** — without knowledge and consent
4. **No data exfiltration** — without explicit permission

### Token Optimization

- **Tool Selector:** Sends only relevant tools (~12 instead of 85) per request
- **Pre-Compression:** Rule-based pre-compression without LLM costs
- **Output Limits:** Hard cap on tool results and JSON strings

## Tech Stack

| Component | Technology                                            |
| --------- | ----------------------------------------------------- |
| Backend   | Express, TypeScript, MariaDB                          |
| Frontend  | React 18, Vite                                        |
| Desktop   | Electron 33 + electron-builder                        |
| LLM       | Ollama (offline) + OpenAI GPT-4o (optional)           |
| Voice     | Kokoro TTS (ONNX), MsEdgeTTS (fallback), OpenWakeWord |
| Mono-Repo | npm workspaces                                        |

## Quick Start (Development)

```powershell
# Prerequisites: Node.js 22, MariaDB, Ollama
npm install
npm run dev          # API (port 3002) + Web (port 5173)
npm test             # 254 tests (Vitest)
```

## Installer

The installer bundles everything — Node.js, MariaDB, Ollama. The user needs nothing pre-installed.

```powershell
.\scripts\download-vendor-deps.ps1
.\scripts\prepare-api-deps.ps1
.\scripts\build-installer.ps1
```

## Versions

| Version    | Highlights                                                                            |
| ---------- | ------------------------------------------------------------------------------------- |
| v1.0.0     | Core: 85 tools, rule engine, voice, directive, onboarding                             |
| v1.1.0     | Token optimization: tool selector, token optimizer                                    |
| v1.2.0     | Multi-agent pipeline with live streaming                                              |
| v1.3.0     | Setup actions, network transparency                                                   |
| v1.4.0     | Chess with learning AI opponent                                                       |
| **v1.5.0** | **Knowledge graph, proactive approval-memory, memory deduplication, pre-compression** |

## License

Proprietary. License key required.
