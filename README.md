# E.L.L.A

## Embedded Local Logic Agent

E.L.L.A. ist ein lokaler KI-Agent für Windows, der als Websystem aufgebaut wird und kontrolliert mit dem Betriebssystem interagiert. Ziel ist ein pragmatischer, lokaler Assistent mit sauberer Architektur, Dashboard-Ebene, klaren Tool-Grenzen und optionaler Cloud-Anbindung.

---

## Aktueller Stand — v0.0.1 (23.05.2026)

Das Fundament steht. Beide Apps starten, kommunizieren miteinander und die Ollama-Integration ist vollständig implementiert.

### Fertiggestellt

- [x] Monorepo-Struktur (`apps/`, `packages/`, `database/`)
- [x] Backend (`@ella/api`) — Express + TypeScript, Port 3002
- [x] Frontend (`@ella/web`) — React + Vite, Port 5173 mit API-Proxy
- [x] Shared Types (`@ella/shared`) — `Message`, `ToolCall`, `ToolResult`, `ToolName`
- [x] Agent Tools (`@ella/agent-tools`) — `open_app`, `get_disk_usage`, `clean_temp`, `empty_recycle_bin`
- [x] Tool-Registry & Tool-Executor mit Whitelist-Prinzip
- [x] **Ollama-Client** (`services/ollama.ts`) — Chat-API mit Tool-Support
- [x] **Tool-Definitionen für LLM** (`tools/definitions.ts`) — alle 4 Tools als Ollama-Function-Schemas
- [x] **Chat-Route mit Tool-Loop** — LLM → Tool-Call → Ausführung → LLM → finale Antwort (max. 5 Runden)
- [x] **Session-Verlauf** (`services/sessions.ts`) — In-Memory, letzte 40 Nachrichten pro Session
- [x] **Chat-Frontend** — Verlaufsanzeige, Fehlerbehandlung, Verlauf löschen
- [x] System-Prompt auf Deutsch
- [x] Fehlerbehandlung für Ollama-Ausfall (HTTP 503 mit klarer Meldung)
- [x] GitHub Repository (privat): `AndreZ1971/E.L.L.A`

### Noch ausstehend (Ollama-Setup)

Ollama muss einmalig installiert und ein Modell geladen werden:

```bash
# 1. Installieren: https://ollama.com/download
# 2. Modell laden (32 GB RAM → llama3.1:8b empfohlen)
ollama pull llama3.1:8b
# 3. Starten
ollama serve
```

Danach ist E.L.L.A. vollständig funktionsfähig.

---

## Nächste Schritte — Phase 2

### Priorität 1 — Kern-Features

- [ ] **Streaming** — Antworten Zeichen für Zeichen anzeigen (Ollama stream-API + EventSource im Frontend)
- [ ] **Tool-Bestätigung** — gefährliche Tools (clean_temp, empty_recycle_bin) im Frontend erst bestätigen lassen
- [ ] **Dashboard** — echte Daten anzeigen (Disk-Usage, aktive Tools, letzte Aktionen)

### Priorität 2 — Stabilität

- [ ] **MariaDB-Anbindung** — Gesprächsverlauf und Tool-Ausführungen persistent speichern
- [ ] **Settings-Seite** — Modell wechseln, Tools aktivieren/deaktivieren
- [ ] **Audit-Log** — jede Tool-Ausführung mit Zeitstempel und Ergebnis festhalten

### Priorität 3 — Ausbau

- [ ] Regel-Editor (automatische Aktionen bei Systemereignissen)
- [ ] Secrets-Verwaltung (OpenAI-Key über Dashboard eintragen)
- [ ] Systemstatus und Metriken in Echtzeit

---

## Architektur

```text
Browser (React Dashboard)
        │
        ▼
  apps/api  (Express, Port 3002)
   ├─ OllamaClient  ──────────────────► Ollama (Port 11434)
   ├─ Tool-Registry + Executor
   │   └─ open_app / get_disk_usage / clean_temp / empty_recycle_bin
   └─ Session-Store (In-Memory)
        │  (später)
        ▼
      MariaDB
```

### Data-Flow: Chat mit Tool-Call

```text
Nutzer-Eingabe
  → POST /api/chat
    → OllamaClient.chat(verlauf, tool-definitionen)
      → Ollama gibt tool_call zurück
        → toolExecutor.execute(tool, args)
          → Ergebnis zurück an Ollama
            → Ollama formuliert finale Antwort
              → Response ans Frontend
```

### Stack

| Schicht       | Technologie                             |
|---------------|-----------------------------------------|
| Frontend      | React 18 + Vite 5 + TypeScript          |
| Backend       | Node.js 24 + Express 4 + TypeScript     |
| LLM lokal     | Ollama (llama3.1:8b empfohlen)          |
| LLM extern    | OpenAI (optional, vorbereitet)          |
| Datenbank     | MariaDB (vorbereitet, noch nicht aktiv) |
| Windows Tools | PowerShell / WMI                        |

---

## Projektstruktur

```text
ella/
├─ apps/
│  ├─ web/                  # React Dashboard         (@ella/web)
│  │  └─ src/pages/
│  │     ├─ chat/           # Chat-Interface
│  │     ├─ dashboard/      # Systemübersicht
│  │     └─ settings/       # Konfiguration
│  └─ api/                  # Node.js Backend          (@ella/api)
│     └─ src/
│        ├─ config/         # env.ts, database.ts
│        ├─ middleware/     # errorHandler.ts
│        ├─ routes/         # chat.ts, tools.ts
│        ├─ services/       # ollama.ts, sessions.ts
│        └─ tools/          # registry.ts, executor.ts, definitions.ts
├─ packages/
│  ├─ shared/               # Typen, Interfaces        (@ella/shared)
│  └─ agent-tools/          # Windows-Tool-Implementierungen (@ella/agent-tools)
├─ database/
│  ├─ migrations/
│  ├─ seeds/
│  └─ schema.sql
├─ logs/
├─ .env.local               # nicht in Git
└─ tsconfig.base.json
```

---

## Schnellstart

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. Packages bauen (einmalig)
npm run build --workspace=packages/shared
npm run build --workspace=packages/agent-tools

# 3. Ollama starten (muss installiert sein)
ollama serve

# 4. Entwicklungsmodus starten
npm run dev
# → API:  http://localhost:3002
# → Web:  http://localhost:5173
```

---

## Sicherheitsprinzip

E.L.L.A. trennt strikt zwischen **Verstehen** und **Ausführen**:

- Das LLM interpretiert Anfragen und erzeugt Tool-Calls als strukturiertes JSON
- Das Backend validiert **immer** gegen die Whitelist in der Tool-Registry
- Nur explizit freigegebene Tools können ausgeführt werden
- API-Schlüssel leben ausschließlich im Backend — niemals im Frontend

```json
{ "tool": "open_app", "args": { "name": "vscode" } }
```

Aktive Tools: `open_app` · `get_disk_usage` · `clean_temp` · `empty_recycle_bin`

---

## Hardware (Entwicklungsrechner)

| Komponente | Spezifikation        | Bemerkung                              |
|------------|----------------------|----------------------------------------|
| CPU        | Intel i3, 12. Gen    | Backend + Services: problemlos         |
| RAM        | 32 GB                | Gut fuer llama3.1:8b (5 GB Modell)    |
| GPU        | RTX 2080 (8 GB VRAM) | Ollama GPU-Beschleunigung möglich      |

Empfohlenes Modell: `llama3.1:8b` (CPU) oder `qwen2.5:14b` (GPU, 8 GB VRAM grenzwertig)
