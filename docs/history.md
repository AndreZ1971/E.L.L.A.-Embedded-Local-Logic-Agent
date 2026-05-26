# Entwicklungshistorie

Dieses Dokument beschreibt chronologisch, was in jeder Version gebaut wurde und — wichtiger — **warum** es so gebaut wurde. Entscheidungen sollen nachvollziehbar bleiben wenn der Kontext verblasst.

---

## v0.1.6 — 26.05.2026 — Code-Analyse Bug-Fixes

**Ziel:** Systematische Code-Analyse aller Backend-Services. Fünf Bugs gefunden und behoben.

---

### Bug 1 — `loadSetup` ignorierte Hausaufgaben-Modus

**Problem:** `loadSetup` öffnete Apps aus einem Setup ohne zu prüfen ob `homeworkMode.active` gesetzt ist — dieselbe Klasse wie der bereits behobene `open_app`-Bug. Ein Kind konnte über "Lade Freizeit-Setup" gesperrte Programme starten.

**Fix:** `homeworkMode` aus `getSettings()` destrukturiert, Check identisch zu `openAppWithSettings` in die App-Map-Funktion eingefügt.

---

### Bug 2 — `extractAndRemember` hardcodiertes Modell

**Problem:** Die Hintergrund-Extraktion in `memory.ts` rief Ollama immer mit `model: "llama3.1:8b"` auf — ignorierte die konfigurierte `ollamaModel`-Einstellung. Bei Modellwechsel über Settings sprach nur die Chat-Logik das neue Modell an, die Gedächtnis-Extraktion blieb auf dem alten.

**Fix:** `getSettings` importiert, `model: getSettings().ollamaModel` statt Hardcode.

---

### Bug 3 — OpenAI sendete leeres `tools: []`

**Problem:** Wenn keine Tools aktiviert waren, sendete `openai.ts` `tools: []` an die OpenAI API. OpenAI lehnt leere Tool-Arrays mit HTTP 400 ab — Ollama machte das bereits korrekt (kein `tools`-Feld wenn leer).

**Fix:** Beide Paths (non-streaming `chat` und `chatStream`) nutzen jetzt `...(tools.length > 0 && { tools: ... })` — das Feld wird nur gesetzt wenn tatsächlich Tools existieren.

---

### Bug 4 — `activateHomeworkMode` ignorierte `allowed`-Flag

**Problem:** `activateHomeworkMode` öffnete Apps aus `homeworkMode.apps` ohne zu prüfen ob `allowed: true`. Eine App die explizit auf verboten gesetzt wurde konnte trotzdem durch den Hausaufgaben-Modus-Start geöffnet werden.

**Fix:** `if (entry)` zu `if (entry?.allowed)` geändert.

---

### Bug 5 — Toter Code `void duration`

**Problem:** In `executor.ts` wurde `Date.now()` vor und nach der Tool-Ausführung gemessen, die `duration` aber sofort mit `void duration` verworfen — kein Logging, kein Nutzen. Der `void`-Ausdruck war nur da um den Lint-Fehler "unused variable" zu unterdrücken.

**Fix:** `const start`, `const duration` und `void duration` vollständig entfernt.

---

## v0.1.5 — 26.05.2026 — Bug-Sprint (10 Fixes)

**Ziel:** Systematische Behebung von 10 bekannten Bugs bevor Phase 3 beginnt.

---

### Behobene Bugs

1. **\[Kritisch\] TS** — `list_memories` Handler gab falschen Typ zurück → in `{ success: true, output: rows }` gewrappt
2. **\[Kritisch\] Logik** — `open_app` prüfte `homeworkMode` nicht → Check auf `homeworkMode.active` eingefügt
3. **\[Mittel\] Tools** — `list_memories` fehlte in Tool-Definitionen → zu `MEMORY_TOOLS` in `definitions.ts` hinzugefügt
4. **\[Mittel\] Registry** — `load_setup` fehlte in `ENABLED_TOOLS` → zu `registry.ts` hinzugefügt
5. **\[Mittel\] Typen** — `list_memories` fehlte in `ToolName` Union → zu `packages/shared` hinzugefügt
6. **\[Mittel\] Logik** — `sessionLimit` hardcodiert auf 40 → liest jetzt `getSettings().sessionLimit`
7. **\[Mittel\] Safety** — Non-Streaming Path führte gefährliche Tools ohne Bestätigung aus → `onConfirm = async () => false` als Fallback
8. **\[Niedrig\] TTS** — `ttsVoiceRef` nach `speak()` deklariert (stale Ref) → Reihenfolge getauscht
9. **\[Niedrig\] Settings** — `ttsEnabled`/`ttsVoice` wurden nicht persistiert → Route-Handler aktualisiert
10. **\[Niedrig\] Schema** — `sessions`, `session_messages`, `memories` fehlten in `schema.sql` → Tabellen nachgetragen

---

## v0.1.4 — 26.05.2026 — GPU-Beschleunigung + Sprachausgabe (TTS)

**Ziel:** Ollama nutzt die dedizierte GPU für schnellere Inferenz. E.L.L.A. spricht Antworten laut aus.

---

### GPU-Beschleunigung

**Ausgangsproblem:** `ollama list` zeigte keine Modelle obwohl das Modell (4.7 GB) bereits auf E: lag. Ollama suchte unter `C:\Users\JannR\.ollama\models` (leer).

**Ursache:** `OLLAMA_MODELS`-Umgebungsvariable war nicht gesetzt. Ollama hatte das Modell in `E:\Ollama\blobs` ohne passende Manifests.

**Fix:** `OLLAMA_MODELS=E:\Ollama` im User-Scope gesetzt, Ollama neugestartet — Manifests wurden aus den vorhandenen Blobs rekonstruiert.

**Gemessene Performance:** 14.6 tokens/sec, VRAM-Auslastung 5.8 von 6.0 GB — Modell läuft vollständig auf der GPU (GTX 1060 6GB, CUDA 13.0). CPU-Referenz wäre 3–5 t/s.

**Warum VRAM nicht dauerhaft belegt:** Ollama lädt das Modell erst beim ersten Inferenz-Request in den VRAM und gibt ihn nach `OLLAMA_KEEP_ALIVE` (Standard: 5 Min. Inaktivität) wieder frei. Zwischen Gesprächen ist der VRAM frei für andere Anwendungen.

---

### Sprachausgabe (TTS)

**Entscheidung:** `window.speechSynthesis` (Web Speech API im Chromium-Renderer) statt separatem TTS-Service.

**Warum kein externen TTS-Dienst:** `speechSynthesis` ist im Electron-Renderer direkt verfügbar, keine Latenz durch Netzwerkanfragen, vollständig offline. Windows-Stimmen (z.B. Microsoft Hedda) sind für deutsche Texte brauchbar.

**Implementierung:**

- Markdown-Stripping vor dem Sprechen: Überschriften (`#`), Betonungen (`*`, `_`, `` ` ``, `~`), Links (`[text](url)` → `text`)
- Beim Start jeder neuen Nutzer-Sendung: `speechSynthesis.cancel()` um laufende Ausgabe zu unterbrechen
- `onvoiceschanged`-Event für asynchrones Voice-Loading (Chromium gibt auf erstem `getVoices()`-Aufruf leeres Array zurück)
- Sprachauswahl und Ein/Aus-Toggle persistent in `settings.json` gespeichert
- Schnell-Toggle im Chat-Header (🔊/🔇) — speichert sofort ans Backend

**Warum Ref statt State für TTS-Flag:** Der `speak()`-Callback wird in `sendText` aufgerufen, das selbst als `useCallback` mit Dependencies registriert ist. Ein direkter State-Zugriff würde stale Closures produzieren — `useRef` gibt immer den aktuellen Wert ohne Re-Render-Abhängigkeit.

---

## v0.1.3 — 25.05.2026 — ML-Gedächtnisebene

**Ziel:** E.L.L.A. baut ein persönliches Langzeitgedächtnis auf — automatisch durch Beobachtung, explizit durch Nutzerbefehl. Jedes Gespräch wird relevanter als das vorherige.

---

### Architektur: Lokale Embeddings + Cosinus-Suche

**Embedding-Modell:** `nomic-embed-text` via Ollama (274 MB, lokal, kein Cloud-Dienst). Produziert 768-dimensionale Vektoren pro Text.

**Warum kein externer Vektor-Dienst (Pinecone, Weaviate etc.):** E.L.L.A. ist ein lokaler Assistent — Daten verlassen den Rechner nicht. Alle ML-Infrastruktur läuft in Ollama oder der eigenen MariaDB.

**Cosinus-Ähnlichkeit:** 10 Zeilen TypeScript im Memory-Service — keine externe Bibliothek. Für den aktuellen Umfang (bis ~10.000 Erinnerungen) ist In-Process-Berechnung schnell genug.

**Warum kein `sqlite-vss` oder `pgvector`:** MariaDB ist bereits die Datenbank der Wahl. Eine separate Vektor-DB würde Infrastruktur-Overhead erzeugen. Die Embeddings werden als JSON (`MEDIUMTEXT`) gespeichert und beim Recall in Node.js sortiert.

---

### DB-Schema — `memories`

```sql
CREATE TABLE memories (
  id         INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  type       ENUM('user', 'system', 'note') NOT NULL,
  content    TEXT         NOT NULL,
  embedding  MEDIUMTEXT   NOT NULL,
  source     VARCHAR(255),
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

Drei Speichertypen:

| Typ      | Bedeutung                   | Quelle                             |
| -------- | --------------------------- | ---------------------------------- |
| `user`   | Fakten über den Nutzer      | Automatische Extraktion + explizit |
| `system` | App/Setup-Nutzungsverhalten | Nach jedem `open_app`/`load_setup` |
| `note`   | Explizite Notizen           | Nutzer sagt "Merk dir…"            |

---

### `services/memory.ts`

**`remember(type, content, source?)`:** Embedded den Text via Ollama API (`POST /api/embed`), speichert Vektor + Inhalt in MariaDB. Gibt `{ success: false }` wenn `nomic-embed-text` nicht gezogen wurde — kein Crash.

**`recall(query, limit=5)`:** Embedded die Anfrage, lädt die letzten 500 Erinnerungen aus der DB, berechnet Cosinus-Ähnlichkeit, filtert alles unter 0.3, gibt Top-5 zurück.

**`extractAndRemember(userMsg, assistantMsg, sessionId)`:** Läuft via `setImmediate` (fire-and-forget, blockiert keine Antwort). Schickt den letzten Gesprächsturn an das LLM mit der Frage: "Gibt es einen lernwürdigen Fakt?". Bei "NICHTS" passiert nichts, sonst wird der Fakt als `user`-Memory gespeichert. Temperatur 0.1 und `num_predict: 60` halten die Extraktion schnell und fokussiert.

**`trackToolUsage(tool, detail)`:** Ebenfalls fire-and-forget. Wird nach `open_app` und `load_setup` aufgerufen und schreibt ein `system`-Memory wie "Nutzer hat chrome verwendet (open_app)".

---

### System-Prompt Injektion

**Vorher:** `SYSTEM_PROMPT` war ein unveränderlicher String in `ollama.ts`.

**Nachher:** `buildSystemPrompt(memories: string[]): string` — exportierte Funktion, teilt sich beide LLM-Provider (Ollama + OpenAI). Wenn Erinnerungen vorhanden, wird ein Abschnitt `Relevantes Gedächtnis (nutze dies als Kontext):` mit Bullet-Points angehängt.

`openai.ts` importiert `buildSystemPrompt` aus `ollama.ts` — ein einziger Prompt, zwei Provider, kein Drift.

**Warum System-Prompt statt eigene Message:** Eine separate `system`-Nachricht in der Message-History würde beim OpenAI-Format zu Validierungsproblemen führen (nur eine System-Message erlaubt). Der Prompt-Anhang ist die sauberste Lösung.

---

### LLM-Tools

`remember(type, content)` — ELLA speichert auf expliziten Befehl. Der System-Prompt instruiert das Modell, dieses Tool bei "Merk dir" / "Denk daran" zu verwenden.

`forget(id)` — Löscht eine Erinnerung per ID. Für den Fall dass gespeichertes veraltet oder falsch ist.

---

### Ablauf pro Chat-Request

```text
User-Nachricht eingetroffen
  → recall(message)        — Top-5 relevante Erinnerungen laden
  → buildSystemPrompt(…)   — Memories in System-Prompt einbetten
  → LLM-Call               — mit angereichtem Kontext
  → Antwort an Nutzer
  → extractAndRemember()   — async, fire-and-forget
     → LLM prüft ob Fakt lernwürdig
     → wenn ja: embed + in DB speichern
```

---

## v0.1.2 — 25.05.2026 — Hausaufgaben-Modus

**Ziel:** PIN-gesicherter Kiosk-Modus der nur definierte Apps erlaubt — gedacht für Kinder oder kontrollierte Arbeitsumgebungen.

---

### Konzept: Asymmetrische PIN-Logik

**Entscheidung:** Aktivieren ohne PIN, Deaktivieren erfordert PIN.

**Warum:** Ein symmetrisches PIN-System (beide Richtungen gesichert) wäre für den Sprachbefehlsfall unbrauchbar — der Nutzer müsste seinen PIN laut ins Mikrofon sprechen um den Modus zu starten. Da das Aktivieren keinen Schutz braucht (jeder darf den Modus einschalten), gibt es keinen Grund dafür eine Hürde einzubauen.

---

### Backend — `services/homework.ts`

**`activateHomeworkMode()`:**

1. Alle bekannten Apps die **nicht** in `homeworkMode.apps` stehen → `taskkill /F /IM`
2. Erlaubte Apps starten via `openApp()`
3. `active: true` in `settings.json` persistieren

**`deactivateHomeworkMode(pin)`:**

1. SHA-256 des PIN gegen gespeicherten Hash prüfen
2. Bei Übereinstimmung: `active: false` persistieren

**Warum SHA-256 statt bcrypt:** SHA-256 hat keine externe Abhängigkeit (`crypto` ist Node-built-in). Für einen lokalen, single-user PIN-Schutz — kein Netzwerkzugang, kein Brute-Force über das Netz — ist SHA-256 ausreichend. bcrypt würde eine npm-Dependency und längere Hash-Zeit einführen ohne echten Sicherheitsgewinn in diesem Kontext.

**Warum `active` in `settings.json` persistiert:** Der Modus muss einen API-Neustart überleben. Ein Kind darf den Modus nicht durch `Ctrl+C` + Neustart umgehen können.

---

### REST-API — `routes/homework.ts`

| Route                      | Methode | Auth               | Funktion                              |
| -------------------------- | ------- | ------------------ | ------------------------------------- |
| `/api/homework/status`     | GET     | —                  | `{ active, configured }`              |
| `/api/homework/activate`   | POST    | kein PIN           | Apps schließen/öffnen, `active: true` |
| `/api/homework/deactivate` | POST    | PIN                | `active: false`                       |
| `/api/homework/config`     | PUT     | PIN (wenn gesetzt) | PIN-Hash setzen, App-Liste ändern     |

**Sicherheit der Config-Route:** Wenn ein PIN bereits gesetzt ist, muss der aktuelle PIN zur Änderung angegeben werden. Erstmaliges Setzen eines PINs ist ohne Authentifizierung möglich — das ist das initiale Setup.

---

### LLM-Tool — `homework_mode`

```typescript
homework_mode(action: "activate" | "deactivate", pin?: string)
```

ELLA kennt die Asymmetrie: Die Tool-Beschreibung macht explizit, dass `activate` keinen PIN braucht und `deactivate` einen. Das Modell fragt beim Nutzer nach dem PIN nur wenn es deaktivieren soll.

---

### Settings-Tab "Modus"

Zwei Sektionen:

- **PIN:** Eingabe + Bestätigung, separater "PIN setzen"-Button → `/api/homework/config`
- **Erlaubte Apps:** Checkboxen aus allen bekannten Apps (unabhängig von `allowed`-Flag) — orangefarbener Accent zur visuellen Unterscheidung von den regulären Setup-Listen

Die App-Auswahl wird über den normalen "Speichern"-Button gesichert. Der Settings-PUT-Handler extrahiert nur `homeworkMode.apps` — `pinHash` und `active` sind von außen nicht überschreibbar.

---

### Chat-Integration

- **🔓-Button im Header** (nur sichtbar wenn PIN konfiguriert): Klick → sofort aktivieren (kein Dialog)
- **🔒-Button im Header**: Klick → PIN-Dialog → Deaktivieren
- **Orangefarbener Banner** im Chat wenn Modus aktiv: `"🔒 Hausaufgaben-Modus aktiv — nur erlaubte Programme laufen."`
- **PIN-Dialog** schließt bei Klick auf den Backdrop (Escape-Äquivalent)

---

## v0.1.1 — 25.05.2026 — Spracheingabe, Tool-Bestätigung, Setup-Shortcuts

**Ziel:** E.L.L.A. wird sprachsteuerbar, gefährliche Aktionen erfordern Bestätigung, und der Nutzer kann konfigurierbare App-Sets per Sprachbefehl laden.

---

### 3-Modi Spracheingabe

**Entscheidung:** Drei Modi — `off`, `manual`, `wakeword`.

| Modus      | Verhalten                                                         |
| ---------- | ----------------------------------------------------------------- |
| `off`      | Kein Mikrofon-Button, nur Tastatur                                |
| `manual`   | Mikrofon-Button im Chat — Klick startet/stoppt Aufnahme           |
| `wakeword` | Dauerhaft aktiv — "ella" aktiviert, dann Befehl, dann "ausführen" |

**Warum Web Speech API statt Whisper:** Web Speech API ist im Chromium-Renderer direkt verfügbar, kein separater Dienst, keine Latenz durch Modell-Laden. Für lokal-laufende Sprachsteuerung die schnell reagieren soll ist das die richtige Wahl. Whisper wäre besser für transkribierte Archivierung, nicht für Echtzeit-Kommandos.

**Mikrofon-Berechtigung in Electron:** Chromium blockiert Mikrofon-Zugriff ohne explizite Genehmigung. In Electron wird das über `session.defaultSession.setPermissionRequestHandler` gelöst:

```typescript
session.defaultSession.setPermissionRequestHandler(
  (_wc, permission, callback) => {
    callback(permission === "media");
  },
);
```

**Wakeword-Zustandsmaschine:** `idle → wake → listen`. Stabile Refs (`startWakeRef`, `startCmdRef`, `sendFnRef`) verhindern stale-Closures in den `onresult`/`onend`-Callbacks der Web Speech API.

**Submit- und Cancel-Worte:**

- Absenden: `"ausführen"`, `"los"`, `"mach es"`, `"abschicken"`, `"sende"`
- Abbrechen: `"abbrechen"`, `"stopp"`, `"vergiss es"`

---

### Tool-Bestätigung via SSE-Pause

**Problem:** Gefährliche Tools (`clean_temp`, `empty_recycle_bin`) wurden sofort ausgeführt ohne Rückfrage.

**Architektur:** Das SSE-Streaming pausiert den Tool-Loop und wartet auf eine externe HTTP-Bestätigung:

```text
LLM ruft clean_temp auf
  → Backend emittiert { type: "confirm", id, label } via SSE
  → Frontend zeigt Bestätigungs-Card im Chat
  → Nutzer klickt "Bestätigen" oder "Ablehnen"
  → Frontend POST /api/approvals/:id/confirm (oder /deny)
  → Backend-Promise resolved → Tool wird ausgeführt (oder nicht)
  → Stream geht weiter
```

**`services/approvals.ts`:** In-Memory Map von `id → resolve-Funktion`. 60-Sekunden-Auto-Timeout verhindert hängende Streams wenn der Nutzer nicht antwortet.

**Warum In-Memory statt DB:** Approvals sind flüchtig — sie existieren nur während einer laufenden Anfrage. Eine DB-Tabelle würde zusätzliche Cleanup-Logik erfordern und keinen Nutzen bringen.

---

### Setup-Shortcuts — `load_setup`

**Was:** Konfigurierbare App-Sets die per Sprachbefehl oder Chat geladen werden: "lade mein Arbeitssetup".

**Dynamische Tool-Definitionen:** `buildToolDefinitions(setups)` generiert das `load_setup`-Tool nur wenn Setups existieren und bettet die Setup-Namen in die Beschreibung ein:

```text
"Startet alle Apps eines definierten Setups. Verfügbare Setups: "arbeit", "freizeit"."
```

Damit weiß das LLM welche Namen gültig sind ohne Code zu sehen.

**Öffnen + Schließen:** Jedes Setup hat `open: string[]` und `close: string[]`. Beim Laden werden zuerst die `close`-Apps via `taskkill` beendet, dann die `open`-Apps gestartet. Die Reihenfolge verhindert dass Apps die in beiden Listen stehen erst geöffnet und sofort wieder geschlossen werden.

**Settings-Tab "Setups":** Zweispaltige Ansicht im Editor — links "Öffnen" (nur erlaubte Apps, violet Accent), rechts "Schließen" (alle bekannten Apps, roter Accent). Badge im Tab-Header zeigt `(2↑ 1↓)`.

---

### Settings-Tabs — Overflow-Fix

**Problem:** Der ursprüngliche "Allgemein"-Tab enthielt 6 Sektionen (Provider, Modell, API-Key, Tools, Session-Limit, Voice) — mehr als in die Fensterhöhe passte. Da die App grundsätzlich keine Scrollbars zeigt war der untere Teil nicht erreichbar.

**Lösung:** Aufteilung in 4 fokussierte Tabs: `LLM` | `Tools` | `Setups` | `Programme`. Jeder Tab hat max. 3 Sektionen und passt ohne Scrollbedarf in das Fenster.

---

### Bug-Fix — `voiceMode` wurde nicht gespeichert

**Symptom:** Voice-Modus-Auswahl ging nach dem Neuladen verloren. Der Mikrofon-Button tauchte nicht im Chat auf.

**Ursache:** In `routes/settings.ts` wurde `voiceMode` aus `req.body` destrukturiert aber nicht in das `patch`-Objekt aufgenommen — der Wert wurde gelesen und sofort verworfen.

**Fix:** `voiceMode` (und `setups`) explizit in den `patch` aufnehmen.

---

## v0.1.0 — 25.05.2026 — Dashboard, Settings, Programme-Verwaltung

**Ziel:** E.L.L.A. bekommt eine vollständige Konfigurationsoberfläche und zeigt Systemstatus in Echtzeit. Der Nutzer kann alle relevanten Einstellungen ohne `.env`-Bearbeitung vornehmen.

---

### Dashboard

**Entscheidung:** Drei Status-Karten (LLM-Provider, Ollama, MariaDB) + Disk-Usage-Balken für C:, E:, Z:. Auto-Refresh alle 30 Sekunden.

**Neue Endpunkte:**

- `GET /api/system/status` — Ollama und MariaDB per Ping, gibt `{ ok: boolean }` zurück
- `GET /api/system/disk` — ruft `getDiskUsage()` für drei Laufwerke auf

**Warum keine WebSockets:** SSE reicht für unidirektionale Daten, aber 30-Sekunden-Polling ist noch einfacher und völlig ausreichend für Systemmetriken die sich langsam ändern.

---

### Settings-Seite

**Entscheidung:** Persistenz in `settings.json` (serverseitig, nicht in DB). Zwei Tabs: Allgemein + Programme.

**Warum JSON-Datei statt DB-Tabelle:** Keine Migration nötig, kein Schema-Lock-in. Settings sind flach genug dass ein JSON-Objekt ausreicht. Bei komplexeren Anforderungen (Mehrnutzer, Audit-Log) wäre MariaDB besser.

**OpenAI API-Key:** Wird als `"***"` ans Frontend geliefert (nie im Klartext). Frontend sendet nur dann einen neuen Wert, wenn der Nutzer etwas eingetippt hat — `"***"` als Sentinel verhindert versehentliches Überschreiben.

**Provider-Auswahl:** `auto` | `openai` | `ollama` — `auto` entspricht dem bisherigen Verhalten (OpenAI wenn verfügbar). Durch explizite Auswahl kann der Nutzer Ollama erzwingen auch wenn ein API-Key hinterlegt ist.

---

### Programme-Verwaltung

**Entscheidung:** Einzelne Liste mit Checkboxen statt getrennter Erlaubt/Verboten-Listen. System-Scan über Windows Start-Menü (`.lnk`-Shortcuts).

**Warum Start-Menü statt Registry:** Die Registry liefert installierte Pakete mit Installationspfad — aber nicht den Pfad zum ausführbaren Programm. Start-Menü-Shortcuts sind direkt launchbar und entsprechen genau dem was der Nutzer als "Programm" versteht.

**Base64 `-EncodedCommand`:** Das PowerShell-Skript enthält Sonderzeichen und Pfade mit Leerzeichen. Statt fragiler Shell-Escaping wird das Skript als UTF-16LE Base64 kodiert — das ist die offizielle PowerShell-Methode für programmgesteuerte Ausführung.

**Datenmodell:** `apps: { name, command, allowed }[]` — eine einzige Liste. `allowed: false` ist gleichbedeutend mit verboten. Beim Scan werden neue Programme mit `allowed: false` gemergt — der Nutzer muss explizit freigeben.

---

## v0.0.5 — 25.05.2026 — Vollständige Desktop-App

**Ziel:** E.L.L.A. läuft vollständig als native Windows-Anwendung ohne Browser, startet automatisch mit Windows und verwaltet alle Abhängigkeiten selbst.

---

### Frameless Window + Custom Titlebar

**Entscheidung:** `frame: false` in BrowserWindow, eigene TitleBar-Komponente in React.

**Warum:** Eine klassische Fensterleiste sieht nach Browser aus. Mit `frame: false` und einer eigenen Titelleiste (violet, E.L.L.A.-Branding, SVG-Icons) wirkt die App wie eine native Anwendung. IPC überbrückt Renderer und Main für Minimize/Maximize/Close.

**Technischer Kniff:** `-webkit-app-region: drag` macht die Titelleiste ziehbar. Die Buttons müssen explizit `drag: none` erhalten damit Klicks funktionieren.

---

### Production Build + HashRouter

**Entscheidung:** Vite baut nach `apps/web/dist/`, Electron lädt via `loadFile()` statt `loadURL()`. HashRouter statt BrowserRouter.

**Warum HashRouter:** BrowserRouter nutzt die HTML5 History API (`/chat`, `/dashboard`). Unter `file://` gibt es keinen Server der diese Pfade auflöst — Navigation funktioniert nicht. HashRouter kodiert den Pfad als URL-Fragment (`#/chat`) — funktioniert ohne Server.

**Warum `base: './'` in Vite:** Ohne diese Option generiert Vite absolute Asset-Pfade (`/assets/index.js`). Unter `file://` wird `/` als Dateisystem-Root interpretiert — die Assets werden nicht gefunden. Mit `base: './'` werden relative Pfade (`./assets/index.js`) generiert.

**CORS für `file://`:** Requests von `file://`-Seiten zu `http://localhost:3002` haben `Origin: null`. Ohne CORS-Header lehnt der Browser sie ab. Lösung: minimales CORS-Middleware in der API (`Access-Control-Allow-Origin: *`) — sicher da die API nur auf localhost lauscht.

---

### API als Child-Prozess

**Entscheidung:** Electron spawnt `node dist/index.js` in `apps/api/` und wartet via Port-Check auf Port 3002.

**Warum Child-Prozess statt separatem Start:** Ziel ist ein einzelner Klick der alles startet. Der Nutzer soll nicht drei Terminals öffnen. Electron ist der natürliche Orchestrator — es hat den Lifecycle der App im Griff und kann den API-Prozess beim Beenden sauber killen.

**Port-Check statt Timeout:** `net.connect(3002)` in einer Schleife ist zuverlässiger als ein festes `setTimeout`. Die API kann je nach Last unterschiedlich lange zum Start brauchen (MariaDB-Verbindung, Ollama-Initialisierung).

**isDev via `ELLA_DEV=1`:** Statt `!app.isPackaged` (immer false im Dev-Modus) kontrolliert eine explizite Env-Variable den Modus. `ELLA_DEV=1` → Vite-Dev-Server, kein API-Spawn. Kein Flag → Production-Modus.

---

### Autostart

**Entscheidung:** `app.setLoginItemSettings` mit `path: process.execPath, args: [app.getAppPath()]`. Toggle im Tray-Menü als Checkbox.

**Warum Tray-Toggle statt immer-an:** Der Nutzer soll Kontrolle haben. Der Toggle ist sichtbar (Tray-Menü), reversibel (einmal klicken deaktiviert) und erfordert keine Registry-Kenntnisse.

**MariaDB:** `sc.exe config MariaDB start=auto` — einmalig als Admin ausgeführt. MariaDB ist ein Windows-Service und hat native Autostart-Unterstützung.

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

| Route                   | Methode | Funktion                          |
| ----------------------- | ------- | --------------------------------- |
| `/api/chat`             | POST    | Haupt-Chat-Endpunkt mit Tool-Loop |
| `/api/chat/provider`    | GET     | Aktiver LLM-Provider und Modell   |
| `/api/chat/history/:id` | GET     | Session-Verlauf lesen             |
| `/api/chat/history/:id` | DELETE  | Session löschen                   |
| `/api/tools`            | GET     | Liste aller registrierten Tools   |

---

### Frontend — React + Vite

**Entscheidung:** React 18, Vite 5, TypeScript, React Router v6.

**Warum Vite statt Create React App:** CRA ist deprecated und langsam. Vite hat HMR in unter 50 ms und baut in Sekunden. Der Dev-Proxy (`/api → localhost:3002`) ist nativ eingebaut — kein separates CORS-Setup nötig.

**Warum React Router:** Drei Seiten geplant (Chat, Dashboard, Settings). Router ist die einfachste Lösung für clientseitiges Routing ohne serverseitigen Aufwand.

**Seiten (Stand v0.0.1):**

| Pfad         | Seite           | Status         |
| ------------ | --------------- | -------------- |
| `/`          | Chat            | Funktionsfähig |
| `/dashboard` | Systemübersicht | Stub           |
| `/settings`  | Konfiguration   | Stub           |

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
ollamaClient.chat(messages, toolDefinitions, model);
ollamaClient.listModels();
```

**Systemprompt (Deutsch):** Das Modell wird auf Deutsch instruiert damit es auf deutschen Nutzer-Input natürlich antwortet. Der Systemprompt erklärt welche Tools verfügbar sind und dass es strukturierte Tool-Calls verwenden soll wenn eine Anfrage ein Tool erfordert.

---

### Tool-Registry & Whitelist-Prinzip

**Entscheidung:** Alle Tools müssen explizit in einer Registry registriert sein. Das LLM kann nur Tools aufrufen die auf der Whitelist stehen.

**Warum Whitelist:** Das LLM könnte theoretisch jeden beliebigen Tool-Namen halluzinieren. Ohne Whitelist würde ein halluzinierter `delete_files`-Aufruf ins Leere laufen oder schlimmer — zufällig eine gleichnamige Funktion treffen. Die Registry ist die einzige Stelle wo neue Tool-Capabilities freigegeben werden.

**Registrierte Tools (v0.0.1):**

| Tool                | Funktion                        | Risiko             |
| ------------------- | ------------------------------- | ------------------ |
| `open_app`          | Startet eine Anwendung per Name | Niedrig            |
| `get_disk_usage`    | Liest Laufwerk-Belegung         | Keines (read-only) |
| `clean_temp`        | Löscht temporäre Dateien        | Mittel             |
| `empty_recycle_bin` | Leert den Papierkorb            | Mittel             |

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

| Kriterium          | MySQL 8.4                            | MariaDB 12.2.2                |
| ------------------ | ------------------------------------ | ----------------------------- |
| Lizenz             | GPL + kommerzielle Einschränkungen   | GPL, vollständig Open Source  |
| Performance        | Gut                                  | Tendenziell besser bei Reads  |
| Kompatibilität     | —                                    | Drop-in-Replacement für MySQL |
| Entwicklung        | Oracle-gesteuert                     | Community-gesteuert           |
| Installationsgröße | ~1,5 GB (Server + Shell + Installer) | ~60 MB                        |

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

|               | OpenAI GPT-4o      | Ollama llama3.1:8b |
| ------------- | ------------------ | ------------------ |
| Qualität      | Sehr hoch          | Gut (für 8B)       |
| Kosten        | ~$0.005 / 1K Token | Kostenlos          |
| Latenz        | ~1-3 Sek.          | ~5-15 Sek. (CPU)   |
| Datenschutz   | Daten an OpenAI    | Vollständig lokal  |
| Verfügbarkeit | Internet nötig     | Offline-fähig      |

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
  tool_calls: [
    {
      id: "call_abc123",
      type: "function",
      function: { name: "get_disk_usage", arguments: '{"drive":"C"}' },
    },
  ];
}

// Internes E.L.L.A.-Format:
{
  tool_calls: [
    {
      name: "get_disk_usage",
      parameters: { drive: "C" },
    },
  ];
}
```

Der `openaiClient` konvertiert beim Empfang in das interne Format. Der Tool-Loop kennt kein OpenAI-Format direkt.

**Provider-Status-Endpunkt:**

```text
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
import React from "react";
// <React.StrictMode>

// Nachher:
import { StrictMode } from "react";
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
messages.map((m) => ({ role: m.role, content: m.content }));
```

Damit fehlten im zweiten Durchgang:

1. Das `tool_calls`-Array im vorausgehenden `assistant`-Message
2. Die `tool_call_id` in der `tool`-Antwort

OpenAI verlangt diese IDs zur Zuordnung — ohne sie versteht es nicht welche Tool-Antwort zu welchem Tool-Aufruf gehört.

**Fix in drei Dateien:**

`ollama.ts` — Type um `id` und `tool_call_id` erweitert:

```typescript
export interface OllamaMessage {
  role: "system" | "user" | "assistant" | "tool";
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
    msg.tool_calls = m.tool_calls.map((tc) => ({
      id: tc.id ?? "call_unknown",
      type: "function",
      function: {
        name: tc.function.name,
        arguments: JSON.stringify(tc.function.arguments),
      },
    }));
  }
  return msg;
});
```

`openai.ts` — Response-Mapping behält `id` aus OpenAI-Antwort:

```typescript
const toolCalls = choice.tool_calls?.map((tc) => ({
  id: tc.id, // War vorher weggefallen
  function: {
    name: tc.function.name,
    arguments: JSON.parse(tc.function.arguments),
  },
}));
```

`chat.ts` — Tool-Ergebnis bekommt `tool_call_id`:

```typescript
messages.push({
  role: "tool",
  tool_call_id: call.id, // Neu
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
  entryPoints: ["src/main.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  outfile: "dist/main/index.js",
  external: [
    "electron",
    ...builtinModules,
    ...builtinModules.map((m) => `node:${m}`),
  ],
});
```

**Tray-Verhalten:**

```typescript
// Minimize → Tray (nicht Taskleiste)
mainWindow.on("minimize", () => {
  mainWindow?.hide();
  mainWindow?.setSkipTaskbar(true);
});

// Close-Button → Tray (echter Beenden-Button nur im Tray-Menü)
mainWindow.on("close", (e) => {
  if (!isQuitting) {
    e.preventDefault();
    mainWindow?.hide();
  }
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

---

## v0.0.4 — 25.05.2026 — SSE-Streaming & MariaDB Session-Persistenz

**Ziel:** Wahrnehmbare Antwortzeit drastisch reduzieren, Gesprächsverlauf dauerhaft speichern.

---

### SSE-Streaming

**Problem:** Ollama benötigt auf CPU 5–15 Sekunden für eine Antwort. Der Nutzer starrte auf einen leeren Chat ohne Feedback ob überhaupt etwas passiert.

**Entscheidung:** Server-Sent Events (SSE) über einen neuen Endpunkt `POST /api/chat/stream`. Der Tool-Loop läuft weiterhin synchron — nur die finale LLM-Antwort wird als Stream an den Client geschickt.

**Warum SSE statt WebSocket:** SSE ist unidirektional (Server → Client) und reicht für diesen Anwendungsfall vollständig aus. Kein Handshake-Overhead, nativ im Browser unterstützt. WebSocket wäre Overengineering.

**Warum `fetch` + `ReadableStream` statt `EventSource`:** `EventSource` unterstützt nur GET-Requests. Der Chat-Endpunkt braucht einen POST-Body (`message`, `sessionId`). `fetch` mit `ReadableStream` gibt die gleiche SSE-Funktionalität mit voller Kontrolle über den Request-Body.

**Event-Format:**

```text
data: {"type":"tool","name":"get_disk_usage"}\n\n   ← Tool wird ausgeführt
data: {"type":"chunk","text":"Hier "}\n\n           ← Textchunk
data: {"type":"chunk","text":"sind "}\n\n
data: {"type":"done"}\n\n                          ← Fertig
data: {"type":"error","message":"..."}\n\n         ← Fehlerfall
```

**`chatStream()` für Ollama:** Ollama liefert bei `stream: true` Zeilenweise JSON. Textchunks werden sofort weitergeleitet. Tool-Calls kommen gebündelt im finalen `done: true`-Chunk — sie werden nicht selbst gestreamt.

**`chatStream()` für OpenAI:** OpenAI streamt Tool-Calls über mehrere Chunks aufgeteilt (Index, ID, Name und Arguments kommen separat). Ein Akkumulator (`Map<index, {id, name, args}>`) sammelt die Fragmente bis `[DONE]` signalisiert dass der Call vollständig ist.

**Frontend-Änderungen in `Chat.tsx`:**

- `streaming`-State hält den laufenden Text für die Live-Bubble
- `toolStatus`-State zeigt während Tool-Ausführung einen lesbaren Status (`"Festplattennutzung abrufen…"`)
- Blinkender Cursor (CSS `@keyframes blink`) während der Text aufgebaut wird
- Nach `done`-Event: Streaming-Bubble wird zur permanenten Nachricht in `messages`

---

### MariaDB Session-Persistenz

**Problem:** Der In-Memory Session-Store verlor den gesamten Gesprächsverlauf bei jedem API-Neustart. Für einen täglichen Assistenten nicht akzeptabel.

**Entscheidung:** `sessions.ts` wird auf MariaDB umgestellt. Das Interface (`get`, `set`, `clear`) bleibt identisch — nur die Implementierung ändert sich. `chat.ts` benötigt keine Änderungen außer `await` vor den Aufrufen.

**Neue Tabellen (Migration `001_sessions.sql`):**

```sql
CREATE TABLE sessions (
  id         VARCHAR(36)  NOT NULL PRIMARY KEY,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE session_messages (
  id         INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(36)  NOT NULL,
  role       ENUM('user', 'assistant') NOT NULL,
  content    TEXT         NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);
```

**`set()`-Strategie — Delete + Re-Insert:** Statt einzelne neue Nachrichten einzufügen, wird bei jedem `set()`-Aufruf die gesamte Session neu geschrieben. Das vereinfacht die Logik erheblich: kein Tracking welche Nachrichten neu sind, kein Diff. Der Overhead ist vernachlässigbar weil Sessions max. 40 Nachrichten enthalten.

**Frontend lädt Verlauf beim Start:** Ein `useEffect` in `Chat.tsx` ruft beim Mount `GET /api/chat/history/:sessionId` auf und befüllt den `messages`-State. Ohne diesen Schritt wäre die Persistenz zwar vorhanden aber für den Nutzer unsichtbar.

---

### Ergebnis v0.0.4

- Text erscheint live während das LLM antwortet (GPT-4o: sehr schnell, Ollama: sichtbar Wort für Wort)
- Tool-Status wird während der Ausführung angezeigt ("Festplattennutzung abrufen…")
- Gesprächsverlauf überlebt API-Neustart und wird beim Seitenaufruf wiederhergestellt
