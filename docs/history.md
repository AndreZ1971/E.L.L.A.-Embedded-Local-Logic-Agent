# Entwicklungshistorie

Dieses Dokument beschreibt chronologisch, was in jeder Version gebaut wurde und — wichtiger — **warum** es so gebaut wurde. Entscheidungen sollen nachvollziehbar bleiben wenn der Kontext verblasst.

---

## v0.0.1 — 23.05.2026 — Grundstruktur & Ollama-Anbindung

**Ziel:** Ein lauffähiges Fundament mit echter LLM-Kommunikation und ersten ausführbaren System-Tools.

---

### Monorepo-Struktur

**Entscheidung:** npm workspaces mit vier Paketen.

```text
apps/api          — Express Backend    (@ella/api)
apps/web          — React Frontend     (@ella/web)
packages/shared   — Gemeinsame Typen   (@ella/shared)
packages/agent-tools — Windows-Tools   (@ella/agent-tools)
```

**Warum Monorepo:** Frontend und Backend teilen Typen (`Message`, `ToolCall`, `ToolResult`). Ohne Monorepo müssten diese Typen dupliziert oder per separatem npm-Package verwaltet werden — beides ist bei einem Ein-Personen-Projekt unnötiger Overhead. npm workspaces löst das ohne ein zusätzliches Tool wie Turborepo oder Nx.

**Warum `packages/` getrennt von `apps/`:** `agent-tools` und `shared` sind reine Bibliotheken ohne eigenen Server. Sie werden von der API importiert, starten selbst nichts. Die Trennung macht das klar und erlaubt es, sie später als eigenständige npm-Packages zu veröffentlichen.

---

### Backend — Express + TypeScript

**Entscheidung:** Node.js mit Express, vollständig in TypeScript.

**Warum Express statt Fastify/NestJS:** Express ist minimal und hat keinerlei Magie. Für ein Projekt das seinen eigenen Ablauf kontrollieren muss (Tool-Loop, LLM-Kommunikation, Session-Management) ist explizite Kontrolle wichtiger als Framework-Features. NestJS hätte zu viel Struktur vorgegeben bevor klar ist wie E.L.L.A. intern funktioniert.

**Warum TypeScript:** Die Schnittstellen zwischen LLM-Antwort, Tool-Aufruf und Session-Store sind komplex genug dass Typsicherheit echte Fehler verhindert. JavaScript hätte subtile Bugs bei der Unterscheidung von `tool_call`-Formaten zwischen Ollama und OpenAI produziert.

**Routen:**

| Route | Methode | Funktion |
| --- | --- | --- |
| `/api/chat` | POST | Haupt-Chat-Endpunkt mit Tool-Loop |
| `/api/chat/provider` | GET | Aktiver LLM-Provider und Modell |
| `/api/chat/history/:id` | GET | Session-Verlauf lesen |
| `/api/chat/history/:id` | DELETE | Session löschen |
| `/api/tools` | GET | Liste aller registrierten Tools |

---

### Frontend — React + Vite

**Entscheidung:** React 18, Vite 5, TypeScript, React Router v6.

**Warum Vite statt Create React App:** CRA ist deprecated und langsam. Vite hat HMR in unter 50 ms und baut in Sekunden. Der Dev-Proxy (`/api → localhost:3002`) ist nativ eingebaut — kein separates CORS-Setup nötig.

**Warum React Router:** Drei Seiten geplant (Chat, Dashboard, Settings). Router ist die einfachste Lösung für clientseitiges Routing ohne serverseitigen Aufwand.

**Seiten (Stand v0.0.1):**

| Pfad | Seite | Status |
| --- | --- | --- |
| `/` | Chat | Funktionsfähig |
| `/dashboard` | Systemübersicht | Stub |
| `/settings` | Konfiguration | Stub |

**Vite-Proxy-Konfiguration** (`vite.config.ts`):

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3002',
      changeOrigin: true,
    },
  },
},
```

Das Frontend macht alle API-Calls gegen `/api/*` — Vite leitet sie im Dev-Modus weiter. Im Build landet eine statische App die direkt vom Express-Server ausgeliefert werden kann.

---

### Ollama-Integration

**Entscheidung:** Eigener `OllamaClient` Service, kein npm-Package.

**Warum kein `ollama` npm-Package:** Das offizielle Package kapselt zu viel. E.L.L.A. braucht direkte Kontrolle über das Message-Format weil es zwischen Ollama- und OpenAI-Format konvertieren muss. Ein eigener Client ist 80 Zeilen und vollständig transparent.

**OllamaClient API:**

```typescript
ollamaClient.chat(messages, toolDefinitions, model)
ollamaClient.listModels()
```

**Systemprompt (Deutsch):** Das Modell wird auf Deutsch instruiert damit es auf deutschen Nutzer-Input natürlich antwortet. Der Systemprompt erklärt welche Tools verfügbar sind und dass es strukturierte Tool-Calls verwenden soll wenn eine Anfrage ein Tool erfordert.

---

### Tool-Registry & Whitelist-Prinzip

**Entscheidung:** Alle Tools müssen explizit in einer Registry registriert sein. Das LLM kann nur Tools aufrufen die auf der Whitelist stehen.

**Warum Whitelist:** Das LLM könnte theoretisch jeden beliebigen Tool-Namen halluzinieren. Ohne Whitelist würde ein halluzinierter `delete_files`-Aufruf ins Leere laufen oder schlimmer — zufällig eine gleichnamige Funktion treffen. Die Registry ist die einzige Stelle wo neue Tool-Capabilities freigegeben werden.

**Registrierte Tools (v0.0.1):**

| Tool | Funktion | Risiko |
| --- | --- | --- |
| `open_app` | Startet eine Anwendung per Name | Niedrig |
| `get_disk_usage` | Liest Laufwerk-Belegung | Keines (read-only) |
| `clean_temp` | Löscht temporäre Dateien | Mittel |
| `empty_recycle_bin` | Leert den Papierkorb | Mittel |

**Tool-Definitionen** werden als Ollama-Function-Schema an das LLM übergeben. Das Modell weiß damit welche Tools existieren, welche Parameter sie erwarten und was sie tun — ohne Code zu sehen.

---

### Tool-Loop

**Entscheidung:** Das LLM kann in einer Chat-Anfrage bis zu 5 Mal Tools aufrufen bevor es die finale Antwort formuliert.

**Warum Tool-Loop:** Ein einzelner LLM-Request reicht nicht wenn mehrere aufeinanderfolgende Tool-Calls nötig sind. Beispiel: Der Nutzer fragt "Wie voll ist meine Festplatte und räum dann den Temp-Ordner auf." Das erfordert:

1. `get_disk_usage` aufrufen → Ergebnis ans Modell zurück
2. `clean_temp` aufrufen → Ergebnis ans Modell zurück
3. Finale Antwort formulieren

Ohne Loop würde das Modell nach dem ersten Tool-Call stoppen. Der Loop gibt dem Modell die Möglichkeit, Ergebnisse zu verarbeiten und weitere Entscheidungen zu treffen — wie ein Mensch der einen Plan Schritt für Schritt abarbeitet.

**Abbruchbedingungen:**
- Kein `tool_calls` in der Antwort → Modell ist fertig, Antwort an den Nutzer
- 5 Runden erreicht → Zwangsabbruch um Endlosschleifen zu verhindern

---

### Session-Store (In-Memory)

**Entscheidung:** Gesprächsverlauf im RAM, max. 40 Nachrichten, nur `user`- und `assistant`-Rollen.

**Warum In-Memory für v0.0.1:** Schnell zu implementieren, keine Abhängigkeiten. Für die Entwicklungsphase reicht es aus — der Verlauf überlebt keinen API-Neustart aber das ist akzeptabel solange keine Produktionsdaten anfallen.

**Warum max. 40 Nachrichten:** LLMs haben ein Kontextfenster. Bei langen Gesprächen würde der gesamte Verlauf zu teuer werden (Token-Kosten bei OpenAI, Verarbeitungszeit bei Ollama). 40 Nachrichten = 20 Austausche, was für die meisten Gespräche ausreicht.

**Warum nur `user`/`assistant`:** `tool`-Nachrichten (Ergebnisse der Tool-Ausführungen) sind interne Kommunikation zwischen dem Tool-Loop und dem LLM. Sie gehören nicht in den persistierten Verlauf weil sie ohne den zugehörigen `tool_calls`-Block des Assistenten ungültig sind. Beim Neuladen würde OpenAI diese verwaisten `tool`-Nachrichten ablehnen.

---

### Fehlerbehandlung

**`503 Service Unavailable`** wenn Ollama nicht läuft — explizit damit der Nutzer weiß, was das Problem ist und nicht eine generische 500-Meldung bekommt.

**Zentraler Error-Handler** in `apps/api/src/middleware/errorHandler.ts` — alle ungefangenen Fehler landen hier und werden einheitlich formatiert:

```json
{ "error": "...", "code": "..." }
```

---

## v0.0.2 — 24.05.2026 — Infrastruktur & OpenAI-Anbindung

**Ziel:** Stabile Infrastruktur auf dediziertem Laufwerk, dualer LLM-Provider, Produktionsreife der Basis-Architektur.

---

### Problem: C: vollständig voll

**Symptom:** Ollama-Download schlug fehl mit "insufficient disk space". `C:` hatte 0 Byte frei.

**Ursachen:**
- MySQL Server 8.4 + Shell + Router + Installer: ~1,5 GB
- Windows-Update-Cache
- Diverse Entwicklungs-Artefakte

**Lösung:** E: (238 GB, intern) als dediziertes KI-Laufwerk ("Gehirn") eingerichtet.

---

### Laufwerk E: als "Gehirn"

**Konzept:** Alles was mit KI-Infrastruktur zu tun hat — Modelle, Datenbank — lebt auf E:. Code bleibt auf Z:.

```text
E:\Ollama\models     — Ollama-Modelle (llama3.1:8b: ~4,7 GB)
E:\MariaDB\server    — MariaDB-Binaries
E:\MariaDB\data      — Datenbankdateien
```

**Umgebungsvariable `OLLAMA_MODELS`:**

Ollama sucht Modelle standardmäßig unter `C:\Users\<User>\.ollama\models`. Damit Ollama E: verwendet muss die Umgebungsvariable **vor** dem Start von Ollama gesetzt sein.

```powershell
# User-Scope (kein Admin nötig):
[System.Environment]::SetEnvironmentVariable("OLLAMA_MODELS", "E:\Ollama\models", "User")

# Machine-Scope (Admin nötig, gilt für alle User und Dienste):
[System.Environment]::SetEnvironmentVariable("OLLAMA_MODELS", "E:\Ollama\models", "Machine")
```

**Hinweis:** User-Scope reicht für interaktive Nutzung. Wenn Ollama als Windows-Dienst läuft (kein interaktiver User), muss Machine-Scope gesetzt sein — das erfordert Admin-Rechte.

---

### MySQL entfernt, MariaDB installiert

**Warum MariaDB statt MySQL:**

| Kriterium | MySQL 8.4 | MariaDB 12.2.2 |
| --- | --- | --- |
| Lizenz | GPL + kommerzielle Einschränkungen | GPL, vollständig Open Source |
| Performance | Gut | Tendenziell besser bei Reads |
| Kompatibilität | — | Drop-in-Replacement für MySQL |
| Entwicklung | Oracle-gesteuert | Community-gesteuert |
| Installationsgröße | ~1,5 GB (Server + Shell + Installer) | ~60 MB |

**Installationspfade:**

```text
E:\MariaDB\server    — MariaDB-Binaries (mariadbd.exe, mysql.exe, ...)
E:\MariaDB\data      — Datenbankdateien (InnoDB, Binlogs, ...)
```

**Root-Passwort-Problem und Reset:**

Der MSI-Installer aktivierte Windows-SSPI-Authentifizierung (Windows-Account statt Passwort). Das blockierte normale Passwort-Logins. Reset-Prozedur:

```powershell
# 1. Dienst stoppen
net stop MariaDB

# 2. MariaDB ohne Berechtigungsprüfung starten (als Admin)
"E:\MariaDB\server\bin\mariadbd.exe" --skip-grant-tables --skip-networking

# 3. In separatem Terminal einloggen (kein Passwort nötig)
"E:\MariaDB\server\bin\mysql.exe" -u root

# 4. Passwort zurücksetzen
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'EllaRoot2026';
EXIT;

# 5. Unsafe-Instanz beenden (Ctrl+C im ersten Terminal)
# 6. Dienst normal starten
net start MariaDB
```

**Datenbanknutzer:**

```sql
CREATE USER 'ella'@'localhost' IDENTIFIED BY 'ella_dev_2026';
GRANT ALL PRIVILEGES ON ella.* TO 'ella'@'localhost';
FLUSH PRIVILEGES;
```

Der `root`-User wird nur für Administration verwendet. Die API verbindet sich ausschließlich mit dem `ella`-User der nur Rechte auf die `ella`-Datenbank hat.

**Schema-Fix — reserviertes Keyword `trigger`:**

```sql
-- Falsch (MariaDB-Syntaxfehler):
CREATE TABLE rules (
  trigger VARCHAR(255) NOT NULL,
  ...
);

-- Richtig (Backtick-Escaping):
CREATE TABLE rules (
  `trigger` VARCHAR(255) NOT NULL,
  ...
);
```

`trigger` ist ein reserviertes SQL-Keyword (für `CREATE TRIGGER`). MariaDB akzeptiert es als Spaltenname nur mit Backticks.

---

### Port-Konflikt — Docker Desktop belegt 3001

**Problem:** Der Express-Server war auf Port 3001 konfiguriert. Docker Desktop belegt diesen Port systemintern.

**Lösung:** Port auf 3002 geändert — in `apps/api/.env`, `apps/api/src/config/env.ts` und `apps/web/vite.config.ts` (Proxy-Ziel).

**Warum kein dynamischer Port:** Ein fester Port macht die Konfiguration vorhersagbar. Kein Service-Discovery, kein Port-Raten — `.env` ist die einzige Quelle der Wahrheit.

---

### Dualer LLM-Provider — OpenAI + Ollama

**Entscheidung:** Wenn `OPENAI_API_KEY` in `.env` gesetzt ist, wird GPT-4o verwendet. Sonst Ollama.

**Warum dieser Ansatz:**

| | OpenAI GPT-4o | Ollama llama3.1:8b |
| --- | --- | --- |
| Qualität | Sehr hoch | Gut (für 8B) |
| Kosten | ~$0.005 / 1K Token | Kostenlos |
| Latenz | ~1-3 Sek. | ~5-15 Sek. (CPU) |
| Datenschutz | Daten an OpenAI | Vollständig lokal |
| Verfügbarkeit | Internet nötig | Offline-fähig |

Die automatische Umschaltung verhindert unnötige Konfiguration: Dev-Modus ohne Key → Ollama. Mit Key → GPT-4o. Kein Neustart, kein Code-Wechsel.

**Provider-Auswahl in `chat.ts`:**

```typescript
const useOpenAI = openaiClient.isAvailable(); // true wenn OPENAI_API_KEY gesetzt

const response = useOpenAI
  ? await openaiClient.chat(messages, TOOL_DEFINITIONS)
  : await ollamaClient.chat(messages, TOOL_DEFINITIONS, activeModel);
```

**`OpenAIClient` — Besonderheiten:**

OpenAI verwendet ein anderes Format für Tool-Calls als Ollama:

```typescript
// OpenAI-Format:
{
  tool_calls: [{
    id: "call_abc123",
    type: "function",
    function: { name: "get_disk_usage", arguments: '{"drive":"C"}' }
  }]
}

// Internes E.L.L.A.-Format:
{
  tool_calls: [{
    name: "get_disk_usage",
    parameters: { drive: "C" }
  }]
}
```

Der `openaiClient` konvertiert beim Empfang in das interne Format. Der Tool-Loop kennt kein OpenAI-Format direkt.

**Provider-Status-Endpunkt:**

```
GET /api/chat/provider
→ { "provider": "openai", "model": "gpt-4o" }
→ { "provider": "ollama", "model": "llama3.1:8b" }
```

---

### Session-Fix — Verwaiste Tool-Nachrichten

**Problem:** Der Tool-Loop fügt `tool`-Nachrichten in die Message-Liste ein:

```text
user: "Wie voll ist C:?"
assistant: [tool_call: get_disk_usage]    ← Assistent ruft Tool
tool: { "drive": "C", "used": "45 GB" }  ← Tool-Ergebnis
assistant: "C: ist zu 45 GB belegt."     ← Finale Antwort
```

Nach API-Neustart oder Provider-Wechsel enthielt der Session-Store noch die `tool`-Nachrichten. OpenAI lehnte diese ab weil kein `assistant`-Eintrag mit `tool_calls` mehr voranging — die Referenz war gebrochen.

**Lösung in `sessions.ts`:**

```typescript
set: (id: string, messages: HistoryMessage[]): void => {
  // Nur user/assistant persistieren — tool-Nachrichten sind flüchtig
  const clean = messages.filter(m => m.role === 'user' || m.role === 'assistant');
  store.set(id, clean.slice(-MAX_HISTORY));
},
```

**Warum das korrekt ist:** Der Nutzer braucht die Tool-Nachrichten nicht im Verlauf. Das LLM braucht sie nur während der laufenden Anfrage. Nach der Antwort sind sie wertlos.

---

### Frontend-Fixes

**React Router v7 Future-Flags:**

```typescript
<BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
```

React Router 6 zeigt Deprecation-Warnungen für Verhalten das in v7 geändert wird. Die Future-Flags aktivieren das neue Verhalten jetzt schon — der spätere Upgrade auf v7 wird trivial.

**`vite-env.d.ts`:**

```typescript
/// <reference types="vite/client" />
```

TypeScript kennt ohne diese Datei keine Vite-spezifischen Typen: CSS-Module-Imports (`import styles from './App.css'`), `import.meta.env`, `import.meta.hot`. Diese Datei ist Standard-Boilerplate für jedes Vite+TypeScript Projekt — sie fehlte im initialen Setup.

**`main.tsx` Named-Import:**

```typescript
// Vorher:
import React from 'react';
// <React.StrictMode>

// Nachher:
import { StrictMode } from 'react';
// <StrictMode>
```

Mit dem neuen JSX-Transform (`"jsx": "react-jsx"` in `tsconfig.json`) muss React nicht mehr global importiert werden. Named-Imports sind expliziter und vermeiden unnötige Bundle-Abhängigkeiten.

---

## v0.0.3 — 25.05.2026 — Chat-Fix & Electron Desktop-App

**Ziel:** Funktionsfähiger Chat end-to-end, natives Desktop-Fenster als Grundlage für Sprachsteuerung.

---

### Bug-Fix — OpenAI Tool-Call-Loop

**Problem:** Jeder Chat-Request der ein Tool auslöste schlug beim zweiten Loop-Durchgang mit HTTP 400 fehl:

```text
OpenAI error 400: "Invalid parameter: messages with role 'tool' must be a
response to a preceding message with 'tool_calls'."
```

**Ursache:** In `openai.ts` wurden alle Messages für den OpenAI-Request auf `{ role, content }` reduziert:

```typescript
// Vorher — stripped tool_calls und tool_call_id:
messages.map(m => ({ role: m.role, content: m.content }))
```

Damit fehlten im zweiten Durchgang:

1. Das `tool_calls`-Array im vorausgehenden `assistant`-Message
2. Die `tool_call_id` in der `tool`-Antwort

OpenAI verlangt diese IDs zur Zuordnung — ohne sie versteht es nicht welche Tool-Antwort zu welchem Tool-Aufruf gehört.

**Fix in drei Dateien:**

`ollama.ts` — Type um `id` und `tool_call_id` erweitert:

```typescript
export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  tool_calls?: Array<{
    id?: string;
    function: { name: string; arguments: Record<string, unknown> };
  }>;
}
```

`openai.ts` — Mapping behält jetzt alle relevanten Felder:

```typescript
messages.map((m): OpenAIMessage => {
  const msg: OpenAIMessage = { role: m.role, content: m.content || null };
  if (m.tool_call_id) msg.tool_call_id = m.tool_call_id;
  if (m.tool_calls?.length) {
    msg.tool_calls = m.tool_calls.map(tc => ({
      id: tc.id ?? 'call_unknown',
      type: 'function',
      function: { name: tc.function.name, arguments: JSON.stringify(tc.function.arguments) },
    }));
  }
  return msg;
})
```

`openai.ts` — Response-Mapping behält `id` aus OpenAI-Antwort:

```typescript
const toolCalls = choice.tool_calls?.map(tc => ({
  id: tc.id,  // War vorher weggefallen
  function: { name: tc.function.name, arguments: JSON.parse(tc.function.arguments) },
}));
```

`chat.ts` — Tool-Ergebnis bekommt `tool_call_id`:

```typescript
messages.push({
  role: 'tool',
  tool_call_id: call.id,  // Neu
  content: JSON.stringify(result),
});
```

**Warum dieser Ansatz korrekt ist:** OpenAI verlangt dass jede `tool`-Nachricht eine `tool_call_id` trägt die mit der `id` im vorausgehenden `assistant.tool_calls`-Eintrag übereinstimmt. Das ermöglicht es bei mehreren parallelen Tool-Calls eindeutig zuzuordnen welches Ergebnis zu welchem Aufruf gehört. Die IDs sind UUID-ähnliche Strings die OpenAI selbst generiert (`call_abc123...`).

---

### Electron Desktop-App

**Entscheidung:** E.L.L.A. öffnet sich in einem nativen Fenster statt im Browser. Minimieren legt das Fenster in den System-Tray.

**Warum Desktop statt Browser:** Der mittelfristige Plan ist Sprachsteuerung. Eine Browser-Erweiterung die permanent im Hintergrund auf Spracheingaben wartet wäre aufdringlich und technisch eingeschränkt. Ein nativer Prozess im System-Tray ist die sauberere Lösung — immer verfügbar, nie im Weg.

**Warum Electron:** React läuft ohne Änderungen als Electron-Renderer. Die gesamte Frontend-Codebasis bleibt unverändert. Electron hat direkte Windows-Integration (Tray-Icons, Native Notifications, zukünftig: GlobalShortcut für Push-to-Talk).

**Struktur:**

```text
apps/desktop/
├─ src/
│  ├─ main.ts      — BrowserWindow, Tray, Single-Instance-Lock
│  └─ preload.ts   — Leer (IPC-Bridge-Platzhalter für Sprachsteuerung)
├─ build-main.mjs  — esbuild-Build-Script
├─ package.json    — @ella/desktop
└─ tsconfig.json
```

**Warum esbuild statt electron-vite:**

`electron-vite` Version 5.0.0 verwendet Vite 8 mit `rolldown` als Bundler. In dieser Kombination wird das `electron`-Paket trotz korrekter `external`-Konfiguration gebündelt statt externalisiert. Das Resultat: `require('electron')` gibt den Binär-Pfad zurück (npm-Package) statt die Electron-API — `app.isPackaged` ist `undefined`.

`esbuild` externalisiert `'electron'` korrekt über die `external`-Option:

```javascript
// build-main.mjs
await build({
  entryPoints: ['src/main.ts'],
  bundle: true, platform: 'node', target: 'node20', format: 'cjs',
  outfile: 'dist/main/index.js',
  external: ['electron', ...builtinModules, ...builtinModules.map(m => `node:${m}`)],
});
```

**Tray-Verhalten:**

```typescript
// Minimize → Tray (nicht Taskleiste)
mainWindow.on('minimize', () => {
  mainWindow?.hide();
  mainWindow?.setSkipTaskbar(true);
});

// Close-Button → Tray (echter Beenden-Button nur im Tray-Menü)
mainWindow.on('close', (e) => {
  if (!isQuitting) { e.preventDefault(); mainWindow?.hide(); }
});
```

**Tray-Icon:** Programmatisch generiertes PNG (#7C3AED Violet) über manuelle CRC32/IHDR/IDAT/IEND-Konstruktion mit `zlib.deflateSync`. Keine externen Assets, kein Asset-Build-Step.

**Bekannte Einschränkung:** `ELECTRON_RUN_AS_NODE=1` deaktiviert alle Electron-APIs wenn es in der Shell-Umgebung gesetzt ist (electron-vite setzt es intern). Dev-Workflow: neue Terminal-Session öffnen oder `$env:ELECTRON_RUN_AS_NODE = $null` vor dem Start.

**Dev-Mode:** `isDev = !app.isPackaged` — lädt im Entwicklungs-Modus `http://localhost:5173` (React-Dev-Server), im Build `web/dist/index.html`.

---

### Ergebnis v0.0.3

- Chat funktioniert end-to-end (getestet: `status festplatte c` → Tool-Call → Antwort)
- Tool-Loop mit mehreren Runden stabil
- Natives Fenster vorhanden, Minimize-to-Tray funktioniert
