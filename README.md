# E.L.L.A

## Embedded Local Logic Agent

E.L.L.A. ist ein lokaler KI-Assistent für Windows, der als Web-Anwendung aufgebaut wird und kontrolliert mit dem Betriebssystem interagiert. Ziel ist ein pragmatischer, lokaler Assistent mit sauberer Architektur, Dashboard-Ebene, klaren Tool-Grenzen und optionaler Cloud-Anbindung.

---

## Aktueller Stand — v0.0.2 (24.05.2026)

### Was läuft

- **API** auf `localhost:3002` — Express + TypeScript
- **Frontend** auf `localhost:5173` — React + Vite
- **Ollama** mit `llama3.1:8b` auf `E:\Ollama\models`
- **MariaDB 12.2.2** auf `E:\MariaDB` — Datenbank `ella` mit vollständigem Schema
- **GPT-4o via OpenAI API** — wird automatisch bevorzugt wenn Key vorhanden
- **Dualer LLM-Provider** — OpenAI wenn Key gesetzt, Ollama als Fallback

---

## Entwicklungshistorie

### v0.0.1 — 23.05.2026 — Grundstruktur & Ollama-Anbindung

**Ziel:** Lauffähiges Fundament mit echter LLM-Kommunikation.

**Was gemacht wurde:**

- Monorepo-Struktur angelegt (`apps/api`, `apps/web`, `packages/shared`, `packages/agent-tools`)
- Backend mit Express + TypeScript — Chat-Route, Tool-Route, Error-Handler
- Frontend mit React + Vite — Chat-Seite, Dashboard, Settings
- Shared-Types für `Message`, `ToolCall`, `ToolResult`, `ToolName`
- 4 Windows-Tools implementiert: `open_app`, `get_disk_usage`, `clean_temp`, `empty_recycle_bin`
- Tool-Registry mit Whitelist-Prinzip — das Modell kann nur explizit freigegebene Tools aufrufen
- `OllamaClient` Service — kommuniziert mit der Ollama REST-API
- Tool-Definitionen als Ollama-Function-Schemas — das LLM weiß welche Tools es hat
- **Tool-Loop** in der Chat-Route — LLM kann bis zu 5 Runden Tools aufrufen bevor es antwortet
- Session-Verlauf im Speicher (max. 40 Nachrichten) — Kontext bleibt über mehrere Nachrichten erhalten
- Fehlerbehandlung wenn Ollama nicht erreichbar (HTTP 503)
- GitHub Repository als privates Repo erstellt und gepusht

**Warum Tool-Loop:** Ein einzelner LLM-Request reicht nicht wenn mehrere Tool-Calls nötig sind (z.B. erst Disk prüfen, dann Temp bereinigen). Der Loop gibt dem Modell die Möglichkeit die Ergebnisse zu verarbeiten und weiter zu denken.

---

### v0.0.2 — 24.05.2026 — Infrastruktur & OpenAI-Anbindung

**Ziel:** Stabile Infrastruktur auf dediziertem Laufwerk, dualer LLM-Provider.

**Was gemacht wurde und warum:**

#### Infrastruktur — Laufwerk E: als "Gehirn"

**Problem:** C: war vollständig voll (0 Byte frei), Ollama-Download schlug fehl.

**Lösung:** E: (238 GB, intern) als dediziertes KI-Laufwerk eingerichtet:

- `E:\Ollama\models` — Ollama-Modelle
- `E:\MariaDB` — Datenbankserver und Daten

**Umgebungsvariable** `OLLAMA_MODELS=E:\Ollama\models` als User-Variable gesetzt damit Ollama die Modelle auf E: sucht und speichert.

#### MySQL entfernt, MariaDB installiert

**Warum MariaDB statt MySQL:**

- MariaDB ist ein direkter Nachfolger von MySQL — vollständig kompatibel
- Aktiv weiterentwickelt, bessere Performance, Open Source
- MySQL Server 8.4 + Shell + Installer (~1,5 GB) von C: entfernt um Platz freizumachen
- MariaDB 12.2.2 auf `E:\MariaDB\server` installiert, Daten auf `E:\MariaDB\data`

**Root-Passwort Reset:** Beim MSI-Installer wurde Windows-SSPI-Authentifizierung aktiviert was das normale Passwort-Login blockierte. Gelöst durch Start mit `--skip-grant-tables`, Passwort-Reset auf `EllaRoot2026`, dann normaler Neustart.

**Datenbanknutzer und Schema:**

```sql
CREATE USER 'ella'@'localhost' IDENTIFIED BY 'ella_dev_2026';
GRANT ALL PRIVILEGES ON ella.* TO 'ella'@'localhost';
```

Schema-Fix: `trigger` ist ein reserviertes Schlüsselwort in MariaDB — wurde mit Backticks escaped `` `trigger` ``.

#### Dualer LLM-Provider (OpenAI + Ollama)

**Warum:** GPT-4o liefert deutlich bessere Antworten als lokale Modelle, ist aber kostenpflichtig. Ollama bleibt als kostenloser Fallback.

**Logik:** Wenn `OPENAI_API_KEY` in `.env` gesetzt ist, wird automatisch GPT-4o verwendet. Sonst Ollama mit konfiguriertem Modell.

```typescript
const useOpenAI = openaiClient.isAvailable(); // true wenn API-Key vorhanden
const response = useOpenAI
  ? await openaiClient.chat(messages, TOOL_DEFINITIONS)
  : await ollamaClient.chat(messages, TOOL_DEFINITIONS, activeModel);
```

**Provider-Status-Endpunkt:** `GET /api/chat/provider` zeigt welcher Provider aktiv ist:

```json
{ "provider": "openai", "model": "gpt-4o" }
```

#### Session-Fix: Tool-Nachrichten im Verlauf

**Problem:** Beim Tool-Loop werden interne `tool`-Nachrichten (Ergebnisse der Tool-Ausführungen) an das LLM gesendet. OpenAI lehnt `tool`-Nachrichten ab wenn ihnen keine `tool_calls` vom Assistenten vorausgehen. Nach einem Neustart oder Provider-Wechsel enthielt der Session-Verlauf verwaiste `tool`-Nachrichten.

**Lösung:** Session-Store filtert beim Speichern automatisch alle Nicht-User/Nicht-Assistent-Nachrichten heraus:

```typescript
const clean = messages.filter(m => m.role === 'user' || m.role === 'assistant');
```

#### Frontend-Fixes

**React Router Warnings** (`v7_startTransition`, `v7_relativeSplatPath`): Future-Flags im BrowserRouter gesetzt um Deprecation-Warnungen zu unterdrücken und auf React Router v7 vorzubereiten.

**`vite-env.d.ts`** hinzugefügt: TypeScript kannte ohne diese Datei keine CSS-Imports und Vite-spezifischen Features. Die Datei enthält `/// <reference types="vite/client" />` und ist Standard für alle Vite+TypeScript Projekte.

**`main.tsx` Refactor:** Von `React.StrictMode` auf `{ StrictMode }` Named-Import umgestellt — saubererer Code mit dem neuen JSX-Transform (`react-jsx`).

---

## Architektur

```text
Browser (React, Port 5173)
        │  Vite Proxy /api → 3002
        ▼
  apps/api  (Express, Port 3002)
   ├─ Provider-Auswahl
   │   ├─ OpenAI GPT-4o  ──────────────► api.openai.com
   │   └─ OllamaClient  ───────────────► Ollama (Port 11434)
   ├─ Tool-Registry + Executor (Whitelist)
   │   └─ open_app / get_disk_usage / clean_temp / empty_recycle_bin
   ├─ Session-Store (In-Memory, max. 40 Nachrichten)
   └─ MariaDB Pool (Port 3306) ────────► E:\MariaDB\data
```

### Chat-Flow mit Tool-Loop

```text
Nutzer-Eingabe
  → POST /api/chat
    → Provider-Auswahl (OpenAI wenn Key, sonst Ollama)
      → LLM antwortet mit tool_call
        → toolExecutor.execute() — prüft Whitelist
          → Tool-Ergebnis zurück ans LLM
            → LLM formuliert finale Antwort (max. 5 Runden)
              → Nur user+assistant in Session gespeichert
                → Response ans Frontend
```

### Wichtige Ports

| Service | Port | Hinweis |
| --- | --- | --- |
| Frontend (Vite) | 5173 | Proxy leitet /api weiter |
| Backend (Express) | 3002 | 3001 von Docker belegt |
| MariaDB | 3306 | Standard |
| Ollama | 11434 | Standard |

---

## Stack

| Schicht | Technologie | Version |
| --- | --- | --- |
| Frontend | React + Vite + TypeScript | 18 / 5 / 5 |
| Backend | Node.js + Express + TypeScript | 24 / 4 / 5 |
| Datenbank | MariaDB | 12.2.2 auf E: |
| LLM lokal | Ollama + llama3.1:8b | auf E:\Ollama |
| LLM cloud | OpenAI GPT-4o | optional, via API-Key |

---

## Projektstruktur

```text
ella/
├─ apps/
│  ├─ web/                      # React Frontend         (@ella/web)
│  │  └─ src/
│  │     ├─ pages/chat/         # Chat-Interface mit Verlauf
│  │     ├─ pages/dashboard/    # Systemübersicht (noch Stub)
│  │     ├─ pages/settings/     # Konfiguration (noch Stub)
│  │     ├─ vite-env.d.ts       # Vite TypeScript-Typen
│  │     └─ App.tsx             # Router + Layout
│  └─ api/                      # Express Backend         (@ella/api)
│     └─ src/
│        ├─ config/             # env.ts (Umgebungsvariablen), database.ts
│        ├─ middleware/         # errorHandler.ts
│        ├─ routes/             # chat.ts (mit Tool-Loop), tools.ts
│        ├─ services/           # ollama.ts, openai.ts, sessions.ts
│        └─ tools/              # registry.ts, executor.ts, definitions.ts
├─ packages/
│  ├─ shared/                   # Gemeinsame Typen        (@ella/shared)
│  └─ agent-tools/              # Windows-Tool-Implementierungen (@ella/agent-tools)
├─ database/
│  ├─ schema.sql                # Vollständiges MariaDB-Schema
│  ├─ migrations/               # (für spätere Schema-Änderungen)
│  └─ seeds/
├─ logs/
├─ .env.local                   # Nicht in Git — enthält API-Keys
└─ tsconfig.base.json
```

---

## Schnellstart (Entwicklung)

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. Packages bauen (einmalig nach Clone)
npm run build --workspace=packages/shared
npm run build --workspace=packages/agent-tools

# 3. Voraussetzungen sicherstellen
#    - Ollama läuft: ollama serve
#    - MariaDB-Dienst läuft (Windows-Dienst "MariaDB")
#    - .env in apps/api/ mit DB-Zugangsdaten und optionalem OPENAI_API_KEY

# 4. Entwicklungsmodus
npm run dev
# → API:      http://localhost:3002
# → Frontend: http://localhost:5173
```

### Umgebungsvariablen (apps/api/.env)

```env
PORT=3002
NODE_ENV=development

# LLM
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
OPENAI_API_KEY=          # Optional — wenn gesetzt wird GPT-4o verwendet

# Datenbank
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ella
DB_USER=ella
DB_PASSWORD=ella_dev_2026
```

---

## Datenbank-Schema

```sql
ella/
├─ rules            — Automatisierungsregeln (Trigger + Aktion)
├─ approvals        — Freigabe-Queue für gefährliche Tool-Ausführungen
├─ tool_executions  — Audit-Log jeder Tool-Ausführung
├─ system_events    — Systemereignisse (append-only)
└─ settings         — Schlüssel-Wert-Konfiguration
```

---

## Sicherheitsprinzip

E.L.L.A. trennt strikt **Verstehen** (LLM) von **Ausführen** (Backend):

- Das LLM interpretiert Anfragen und erzeugt strukturierte Tool-Calls
- Das Backend prüft **immer** gegen die Whitelist in der Tool-Registry
- Kein freier Shell-Zugriff — nur explizit definierte Tools können aufgerufen werden
- API-Keys leben ausschließlich im Backend (`.env`) — niemals im Frontend

---

## Nächste Schritte — Phase 2

### Priorität 1 — Kern-Features

- [ ] **Streaming** — Antworten Zeichen für Zeichen anzeigen (Ollama stream-API + EventSource im Frontend)
- [ ] **Tool-Bestätigung** — gefährliche Tools (`clean_temp`, `empty_recycle_bin`) im Frontend bestätigen lassen
- [ ] **Dashboard** — echte Daten anzeigen (Disk-Usage via `get_disk_usage`, aktive Tools)

### Priorität 2 — Stabilität

- [ ] **MariaDB Session-Persistenz** — Gesprächsverlauf in DB statt In-Memory
- [ ] **Tool-Ausführungen loggen** — jede Aktion in `tool_executions` schreiben
- [ ] **Settings-Seite** — Provider wechseln, Modell auswählen, Tools aktivieren/deaktivieren

### Priorität 3 — Ausbau

- [ ] Regel-Editor (automatische Aktionen bei Systemereignissen)
- [ ] Secrets-Verwaltung (API-Keys sicher über Dashboard verwalten)
- [ ] Systemstatus und Metriken in Echtzeit

---

## Hardware (Entwicklungsrechner "Dante-Home")

| Komponente | Spezifikation | Bemerkung |
| --- | --- | --- |
| CPU | Intel i3, 12. Gen | Backend + Services: problemlos |
| RAM | 32 GB | Gut fuer llama3.1:8b (5 GB Modell) |
| GPU | RTX 2080 (8 GB VRAM) | Ollama GPU-Beschleunigung moeglich |
| Laufwerk E: | 238 GB intern | "Gehirn" — Ollama + MariaDB |
| Laufwerk Z: | 34 GB | Projekte / Code |
