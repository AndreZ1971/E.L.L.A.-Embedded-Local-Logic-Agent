# Architektur

---

## Systemübersicht

```text
┌─────────────────────────────────────────────────────────────┐
│  Browser (React, Port 5173)                                 │
│  Vite Dev-Proxy: /api/* → http://localhost:3002             │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  apps/api  (Express, Port 3002)                             │
│                                                             │
│  ┌──────────────┐   ┌─────────────────────────────────┐    │
│  │ POST /api/chat│   │ Provider-Auswahl                │    │
│  │              │──►│  openaiClient.isAvailable()      │    │
│  │              │   │  true  → OpenAI GPT-4o           │    │
│  │              │   │  false → Ollama llama3.1:8b      │    │
│  └──────────────┘   └──────────────┬────────────────┬─┘    │
│                                    │                │       │
│                          ┌─────────▼──┐    ┌───────▼──┐    │
│                          │ OpenAI API │    │  Ollama  │    │
│                          │ (extern)   │    │ (lokal)  │    │
│                          └─────────┬──┘    └───────┬──┘    │
│                                    └───────┬────────┘       │
│                                            │                │
│  ┌─────────────────────────────────────────▼────────────┐   │
│  │ Tool-Loop (max. 5 Runden)                            │   │
│  │  LLM antwortet mit tool_call                        │   │
│  │    → toolExecutor.execute()  [Whitelist-Check]      │   │
│  │      → Tool-Ergebnis zurück ans LLM                 │   │
│  │        → Nächste Runde oder finale Antwort          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────┐   ┌────────────────────────────────┐  │
│  │ Session-Store    │   │ MariaDB Pool (Port 3306)       │  │
│  │ In-Memory        │   │ E:\MariaDB\data                │  │
│  │ max. 40 Messages │   │ Datenbank: ella                │  │
│  │ user+assistant   │   │                                │  │
│  └──────────────────┘   └────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                                    │
              ┌─────────────────────┴───────────────────┐
              │                                         │
    ┌─────────▼─────────┐                   ┌──────────▼──────────┐
    │  api.openai.com   │                   │  Ollama             │
    │  GPT-4o           │                   │  Port 11434         │
    │  (kostenpflichtig)│                   │  llama3.1:8b        │
    └───────────────────┘                   │  E:\Ollama\models   │
                                            └─────────────────────┘
```

---

## Chat-Flow — Detail

Der zentrale Ablauf für jede Nutzeranfrage:

```text
1. POST /api/chat  { sessionId, message }
   │
2. Session laden
   │  sessionStore.get(sessionId)
   │  → [ {role:"user", content:"..."}, {role:"assistant", content:"..."}, ... ]
   │
3. Neue User-Message anhängen
   │  messages.push({ role: "user", content: message })
   │
4. Provider-Auswahl
   │  openaiClient.isAvailable()  →  true / false
   │
5. Tool-Loop (max. 5 Iterationen)
   │
   │  ┌─ Iteration ─────────────────────────────────────────┐
   │  │                                                      │
   │  │  LLM-Request mit:                                   │
   │  │    - messages (gesamter Verlauf)                    │
   │  │    - TOOL_DEFINITIONS (Whitelist als Schema)        │
   │  │                                                      │
   │  │  LLM-Antwort enthält tool_calls?                    │
   │  │    Nein → weiter zu Schritt 6 (fertig)              │
   │  │    Ja  → für jeden tool_call:                       │
   │  │            toolExecutor.execute(name, params)       │
   │  │              → Whitelist-Check (unknown → Error)    │
   │  │              → Tool-Funktion ausführen              │
   │  │              → Ergebnis als tool-Message anhängen   │
   │  │          → Nächste Iteration                        │
   │  └──────────────────────────────────────────────────────┘
   │
6. Session speichern
   │  sessionStore.set(sessionId, messages)
   │  → filtert tool-Nachrichten heraus
   │  → begrenzt auf 40 Einträge (FIFO)
   │
7. Response ans Frontend
   { reply: "...", sessionId: "..." }
```

---

## Ports

| Service | Port | Hinweis |
| --- | --- | --- |
| Frontend (Vite Dev) | 5173 | Proxy leitet `/api/*` nach 3002 weiter |
| Backend (Express) | 3002 | Port 3001 von Docker Desktop belegt |
| MariaDB | 3306 | Standard-Port, Windows-Dienst |
| Ollama | 11434 | Standard-Port, läuft als Tray-App |

---

## Stack

| Schicht | Technologie | Version | Warum |
| --- | --- | --- | --- |
| Frontend | React | 18 | Stable, breites Ökosystem |
| Frontend Build | Vite | 5 | Schnell, guter Proxy, kein CRA |
| Frontend Routing | React Router | 6 | Standard für React SPAs |
| Backend Runtime | Node.js | 24 | LTS, async-first |
| Backend Framework | Express | 4 | Minimal, explizit, keine Magie |
| Sprache | TypeScript | 5 | Typsicherheit über alle Schichten |
| Datenbank | MariaDB | 12.2.2 | Drop-in für MySQL, OS, auf E: |
| LLM lokal | Ollama + llama3.1:8b | — | Kostenlos, offline, GPU-fähig |
| LLM cloud | OpenAI GPT-4o | — | Beste Qualität, API-Key optional |

---

## Projektstruktur

```text
z:\repos\E.L.L.A\
│
├─ apps/
│  │
│  ├─ api/                          — Express Backend (@ella/api)
│  │  ├─ src/
│  │  │  ├─ config/
│  │  │  │  ├─ env.ts               — Alle Umgebungsvariablen (einzige Quelle)
│  │  │  │  └─ database.ts          — MariaDB Connection Pool
│  │  │  ├─ middleware/
│  │  │  │  └─ errorHandler.ts      — Zentraler Fehler-Handler (Express)
│  │  │  ├─ routes/
│  │  │  │  ├─ chat.ts              — POST /api/chat + Hilfrouten, Tool-Loop
│  │  │  │  └─ tools.ts             — GET /api/tools (Registry-Listing)
│  │  │  ├─ services/
│  │  │  │  ├─ ollama.ts            — OllamaClient (REST-Wrapper)
│  │  │  │  ├─ openai.ts            — OpenAIClient (REST-Wrapper)
│  │  │  │  └─ sessions.ts          — In-Memory Session-Store
│  │  │  └─ tools/
│  │  │     ├─ definitions.ts       — Tool-Schemas für LLM (Ollama-Format)
│  │  │     ├─ executor.ts          — Whitelist-Check + Tool-Dispatch
│  │  │     └─ registry.ts          — Registrierte Tool-Implementierungen
│  │  ├─ .env                       — Lokale Konfiguration (nicht in Git)
│  │  ├─ package.json
│  │  └─ tsconfig.json
│  │
│  └─ web/                          — React Frontend (@ella/web)
│     ├─ src/
│     │  ├─ pages/
│     │  │  ├─ chat/                — Chat-Interface mit Verlaufsanzeige
│     │  │  ├─ dashboard/           — Systemübersicht (Stub — Phase 2)
│     │  │  └─ settings/            — Konfiguration (Stub — Phase 2)
│     │  ├─ App.tsx                 — Router-Konfiguration + Layout
│     │  ├─ App.css                 — Globale Styles
│     │  ├─ main.tsx                — React-Einstiegspunkt
│     │  └─ vite-env.d.ts           — Vite TypeScript-Typen (CSS, import.meta)
│     ├─ index.html
│     ├─ package.json
│     ├─ tsconfig.json
│     └─ vite.config.ts
│
├─ packages/
│  │
│  ├─ shared/                       — Gemeinsame Typen (@ella/shared)
│  │  └─ src/
│  │     └─ types.ts                — Message, ToolCall, ToolResult, ToolName
│  │
│  └─ agent-tools/                  — Windows-Tool-Implementierungen (@ella/agent-tools)
│     └─ src/
│        ├─ open-app.ts
│        ├─ get-disk-usage.ts
│        ├─ clean-temp.ts
│        └─ empty-recycle-bin.ts
│
├─ database/
│  ├─ schema.sql                    — Vollständiges MariaDB-Schema
│  ├─ migrations/                   — Zukünftige Schema-Änderungen
│  └─ seeds/                        — Testdaten (leer)
│
├─ docs/                            — Technische Dokumentation
│  ├─ architecture.md               — Dieses Dokument
│  ├─ history.md                    — Entwicklungshistorie mit Begründungen
│  ├─ database.md                   — Datenbankschema-Dokumentation
│  ├─ roadmap.md                    — Geplante Features & Prioritäten
│  └─ hardware.md                   — Hardware-Spezifikation Dante-Home
│
├─ logs/                            — Laufzeit-Logs (nicht in Git)
├─ .env.local                       — Beispiel-Env (API-Keys redacted)
├─ .gitignore
├─ package.json                     — Workspace-Root
├─ tsconfig.base.json               — Gemeinsame TS-Konfiguration
└─ README.md                        — Kurzübersicht + Schnellstart
```

---

## Sicherheitsprinzip

E.L.L.A. trennt strikt **Verstehen** (LLM) von **Ausführen** (Backend):

```text
LLM (Ollama / OpenAI)
  │
  │  Erzeugt strukturierte Tool-Calls
  │  — kennt keine Shell-Kommandos
  │  — kann nur explizit definierte Tools benennen
  ▼
toolExecutor.execute(name, params)
  │
  ├─ name in Registry?  Nein → Error, nichts wird ausgeführt
  │
  └─ Ja → Tool-Funktion mit validierten Parametern
            — kein freier Shell-Zugriff
            — kein eval(), kein exec() mit User-Input
```

**API-Keys:** Leben ausschließlich im Backend (`.env`). Das Frontend sieht keine Keys, macht keine direkten LLM-Calls, kommuniziert nur mit dem eigenen Backend.

**Prinzip der minimalen Rechte:** Der Datenbanknutzer `ella` hat nur `ALL PRIVILEGES ON ella.*` — kein Zugriff auf andere Datenbanken, kein `GRANT OPTION`, kein `SUPER`.
