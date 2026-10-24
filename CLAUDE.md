# E.L.L.A — Embedded Local Logic Agent

Lokaler Windows KI-Assistent als Electron-Desktop-App. Läuft vollständig offline via Ollama (llama3.1:8b), optional mit OpenAI GPT-4o.

**Aktueller Stand: v1.5.1**

> _ELLA passt sich dem Nutzer an und wächst mit ihren Herausforderungen._

---

## Arbeitsweise

- **Sparring-Partner:** Claude (claude.ai Chat) — Strategie, Architektur, Produktentscheidungen
- **Mitarbeiter:** Claude Code (dieses Tool) — führt Arbeitsanweisungen aus, schreibt Code, immer nach Best Practice
- **Grundregel:** Jede Phase wird nach Abschluss auf Fehler und Funktionalität geprüft. Alle Tests müssen grün sein. Erst dann: README aktualisieren, Tag setzen, committen, pushen.

---

## Stack

- **Backend**: Express, TypeScript, MariaDB (Port 3306, E:\MariaDB)
- **Frontend**: React 18, Vite (Port 5173)
- **Desktop**: Electron 33 + electron-builder
- **LLM**: Ollama (llama3.1:8b, Port 11434) + OpenAI GPT-4o (optional)
- **Mono-Repo**: npm workspaces

## Projektstruktur

```
apps/
  api/        Express-Server (Port 3002)
  web/        React-Frontend (Port 5173)
  desktop/    Electron-Wrapper
  landing/    Statische Landingpage
packages/
  shared/     Geteilte Typen + Interfaces
  agent-tools/ Windows-System-Tools (disk, temp, recycle, open_app)
scripts/
  wakeword_server.py  Python-Wakeword-Prozess (openWakeWord + ella.onnx)
  tts_server.py       Python-Kokoro-TTS-Server (DEPRECATED — ersetzt durch services/kokoro.ts)
  stress_server.py    Python-Stressanalyse-Server (Port 3004, numpy-only, WAV-Analyse)
database/
  schema.sql  MariaDB-Schema (idempotent, IF NOT EXISTS)
```

---

## Was läuft (vollständig implementiert — v1.0.0)

### Kern

- Dual-LLM (Ollama/OpenAI), SSE-Streaming, Tool-Loop max. 5 Runden
- 111 Tools mit Handlern + Audit-Log (`tool_executions`)
- Rule Engine: Directive Layer → DIRECTIVE_DENY → Deny Rules → Allow Rules → allow
- **Directive-Denial UI:** roter Badge im Chat bei Regel-Ablehnung
- ML Memory: nomic-embed-text, cosine similarity, 3 Typen (user/system/note), Duplikat-Prävention (≥85% Cosine)
- **Nutzerprofile:** Profil-isoliertes Gedächtnis, PBKDF2+Salt PIN-Hash
- **Per-session Mutex:** Race-Condition bei parallelen Anfragen verhindert

### Voice & UI

- Voice: Wakeword "ella" (Python/ONNX + openWakeWord), manuell, TTS
- **Kokoro TTS:** `services/kokoro.ts` — lokale neuronale Stimme via `kokoro-js` (Node.js, ONNX q8, kein Python nötig); lazy-geladen beim API-Start von HuggingFace Hub → `%APPDATA%/ELLA/kokoro-cache/`; `vendor/kokoro/` für Offline-Installer; MsEdgeTTS als Fallback; `GET /api/health` enthält `kokoro_ready`-Flag
- **TTS-Routing:** `synthesize()` in `tts.ts` prüft `isKokoroReady()` → Kokoro-First (`audio/wav`), Fallback MsEdgeTTS (`audio/mpeg`); dynamischer `Content-Type` in Response
- Proaktive TTS: Alert/Device-Events und proaktive Nachrichten werden vorgelesen
- **Proaktive Nachrichten:** ELLA schreibt von sich aus in den Chat (SSE `proactive_message`)
- **Feedback-Buttons:** Daumen hoch/runter → Ollama extrahiert Nutzerpräferenzen → `user`-Memory
- **Markdown-Rendering:** Chat-Antworten via `marked.js`, TTS-bewusstes System-Prompt
- **Tool-Log:** verwendete Tools als Chips unter jeder Assistenten-Antwort
- **Ollama-Offline-Banner:** `GET /api/health` + `OllamaBanner`-Komponente, 30s Polling
- **Favicon:** SVG "E." Design + Electron-Icon (RGBA, transparente Ecken)
- **Externe Links:** `shell.openExternal` — Browser statt Electron
- System Tray: typisierte Balloon-Alerts (warning/error/info/device) mit Schweregrad-Sound
- **i18n (DE/EN):** react-i18next, alle UI-Komponenten vollständig übersetzt — App, Chat, Settings, Dashboard, Onboarding, Activation
- **Modell-Auswahl vor Download:** `ModelSelectOverlay` — zeigt vor dem ersten Download eine Hardware-Tier-Auswahl; `main.ts` pausiert `ensureOllamaModel()` bis IPC-Antwort; kein Default-Download mehr auf nicht passender Hardware
- **Lizenz-Website:** ella-agent.de Link auf der Aktivierungsseite
- **Mehrsprachige Stimmen (DE/EN/ES/FR):** `spokenLanguage`-Setting wählt automatisch weibliche Stimme — Kokoro: `af_sarah`/`bf_emma`/`ef_dora`/`ff_siwis`; MsEdgeTTS: Katja/Sonia/Elvira/Denise; UI bleibt DE/EN
- **Onboarding Stimmenauswahl:** 4 weibliche Stimmen im Onboarding-Schritt wählbar (mit Vorschau in der jeweiligen Sprache), speichert `spokenLanguage`
- **Stress-Erkennung:** `stress_server.py` Port 3004, numpy-only WAV-Analyse (RMS/ZCR/Pitch), `stressDetectionEnabled`-Setting; Hint in Memories bei medium/high; opt-in
- **Barrierefreiheit — Blind-Modus:** `accessibilityMode === "blind"` → TTS erzwungen, System-Prompt ohne Markdown, Audio-Töne als Zustandsfeedback, `aria-live="polite"` auf Nachrichtencontainer, `aria-label` auf allen Buttons/Input, Begrüßungsansage beim Laden
- **Barrierefreiheit — Gehörlosenmodus:** `accessibilityMode === "deaf"` → TTS + Mic-Button vollständig ausgeblendet, visueller Deaf-Banner im Chat, System-Prompt ohne TTS-Erwähnung
- **Mic-Button Bug fix:** `startRecording` auf `async/await` umgestellt — Promise-Rejection aus `getUserMedia` wird jetzt korrekt gefangen und dem Nutzer angezeigt

### Produktivität

- **Dateien:** `search_files` (Windows Search Index primär, Get-ChildItem Fallback), `open_file`, `explore_folder`
- **Dokumente:** `create_document` (Word + TXT), `read_file_content` (.docx/.pdf/.xlsx/.html), `dictate_to_document`
- **Aufgabenliste:** `add_task`, `list_tasks`, `complete_task`, `delete_task` — persistente TODOs in MariaDB
- **Wecker:** `set_alarm`, `list_alarms`, `delete_alarm` — DB-basiert, täglicher Worker-Check
- **Musik:** `play_music` → Bibliothek durchsuchen (Künstler/Album/Titel), Media Player öffnen; `path`-Parameter für direkten Zugriff wenn Pfad bekannt
- **Prozesse:** `list_processes`, `kill_process` (systemkritische gesperrt)
- **Dienste:** `list_services`, `control_service` — Windows-Dienste auflisten und steuern
- **Systemsteuerung:** `set_volume` (DLL-Cache ~0.5s), `get_clipboard`/`set_clipboard` (+ Historie, 3s Polling)
- **Erinnerungen:** `set_reminder`/`list_reminders`/`delete_reminder` via Windows Task Scheduler
- **Vision:** `take_screenshot` → GDI+ Screenshot + GPT-4o Vision Analyse; `describe_screen`, `describe_image`, `describe_webpage`
- **Schreibstil:** `write_for_me`, `write_in_style` → Stilprofil aus E-Mail-Historie + Text im Nutzerstil
- **Textverarbeitung:** `translate_text`, `summarize_text`, `correct_text` — Ollama/OpenAI
- **Duplikate:** `find_duplicates`, **Autostart:** `list_autostart`
- **Drucker:** `list_printers`, `print_document`, `get_print_jobs`, `cancel_print_job`
- **Kameras:** `list_cameras`, `capture_photo` (mit optionaler GPT-4o-Beschreibung)
- **Hardware-Info:** `get_gpu_info`, `get_ram_info`, `get_storage_devices`, `get_audio_devices`, `get_usb_devices`
- **Monitore:** `list_monitors`, `open_app_on_monitor` — Multi-Monitor-Unterstützung
- **Dateiverwaltung:** `list_folder`, `rename_file`, `copy_file`, `create_folder`, `delete_file`/`delete_files`
- **Desktop-Automation:** `launch_app`, `control_window`, `send_keys`, `click_at`, `move_mouse`, `drag_drop`, `click_element`, `read_screen` (OCR), `watch_screen`
- **Dokumenten-Index:** `index_documents`, `search_documents`, `list_indexed_folders` — lokale Volltextsuche mit Embeddings
- **Eigene Pipelines:** `custom_pipelines`-Tabelle — benutzerdefinierte Multi-Agenten-Pipelines (parallel/sequenziell)
- **Websuche:** `search_web` (DuckDuckGo primär, OpenAI-Fallback), `web_search`, `fetch_url`
- **System:** `run_command`, `shutdown_system`, `get_datetime`, `get_location`, `get_weather`, `scan_network`, `list_connections`, `list_devices`
- **Sonstiges:** `rename_drive`, `format_drive`, `toggle_dark_mode`, `control_media`, `get_now_playing`, `pause_ella`, `free_ram`, `homework_mode`, `reflect_on_experiences`

### Kommunikation

- Outlook COM: Mail lesen/markieren + Kalender lesen/erstellen
- Gmail + Google Calendar via OAuth 2.0
- `compose_email` → Outlook-Entwurf (sendet nicht automatisch)

### Monitoring & Proaktiv

- Background Worker (60s): Disk/RAM/Ollama-Alerts, PnP, ARP, TCP, Firewall/WiFi/DNS, Alarm-Check, **Hausaufgaben-Zeitlimit-Ablauf**
- Clipboard-Polling (3s): History + Muster-Erkennung: IBAN, Paketnummer, Telefon, URL, E-Mail
- **Gesprächskompression:** `sessionCompressor.ts` — zweistufig: regelbasierte Vorkompression (kein LLM) + Ollama-Summary ab 16 Nachrichten
- **Fenster-Kontext:** `windowContext.ts` — GetForegroundWindow, sensible Titel gefiltert, Ollama-only, opt-in
- `recordActivity()` → Comeback-Briefing; Meeting-Prep, Tagesabschluss (+fällige Tasks), Pause-Reminder
- Rhythmus-Analyse (12 Uhr), Duplikat-Scan (So 10 Uhr)

### Infrastruktur

- **Onboarding:** 6-Schritt-Flow — Name, Directive-Acceptance, Hardware-Scan, Stimme, Standort
- Auto-Migration: schema.sql idempotent, **107 Default-Rules** (IDs 1–107)
- **DB v3.5.0:** `alarms`-Tabelle + Regeln 83–85
- **Nutzerprofile:** `routes/profiles.ts`, `services/profiles.ts` — PBKDF2+Salt (100k Iterations)
- **Feedback-Route:** `routes/feedback.ts` — POST /api/feedback + Ollama-Memory-Extraktion
- **Homework Mode:** SHA-256 PIN, PBKDF2 (Profile), Emergency-Reset — **nur der PIN beendet den Modus**, kein automatisches Ablaufdatum (Sicherheitsprinzip: Kind kann nicht einfach warten)
- **format_drive 3-Zonen-Regel:** Zone 1 = C:, ELLA-Laufwerk (auto via `process.cwd()[0]`), `protectedDrives` → directive; Zone 2 = Netzwerk/CD/Unbekannt → directive; Zone 3 = alle anderen inkl. interne HDDs → Bestätigungsdialog
- Conversational Config: `create_setup`, `update_setting`, `create_rule`
- **Get-CimInstance:** alle wmic-Aufrufe ersetzt — Windows 11 22H2+ kompatibel
- **DB v1.5.0:** `knowledge_triples`-Tabelle, `proactive_preferences`-Tabelle, `learning_examples`-Tabelle
- **312 Tests — alle grün** (Vitest Unit + Integration)
- **Smoke Tests:** `scripts/smoke-test.ps1` — 13 End-to-End-Tests (Health, Homework Mode, Ollama, Chat+Tools, Lizenz)
- CI: GitHub Actions, Ubuntu + MariaDB Service Container
- **LLM als Non-Gatekeeper:** System-Prompt Regel "KRITISCH — DU BIST NICHT DER GATEKEEPER" — LLM ruft Tools immer auf, Directive + Rule Engine entscheiden; verhindert Text-Ablehnung anstelle des Directive-Banners

### v1.1.0 — Token-Optimierung

- **Tool-Selector** (`services/toolSelector.ts`): 8 CORE-Tools immer aktiv + 20 Lazy Groups mit DE/EN-Regex-Matching; sendet pro Anfrage nur relevante Tools (~12 statt 111) → bis zu 90 % weniger Input-Tokens
- **Token-Optimizer** (`services/tokenOptimizer.ts`): Tool-Ergebnisse vor dem Speichern in der History komprimiert — JSON minify, Base64-Stripping, Array-Truncation (max 50 Einträge)
- **Smarter Tool-Loop:** Ab Runde 1 nur noch kontextrelevante Tools via `selectToolsForContext()`; Ollama-Bug gefixt (`toolCallsBuffer` außerhalb des `while(true)`-Loops deklariert)

### v1.2.0 — Multi-Agenten-Pipeline

- **Multi-Agenten** (`services/pipeline.ts`, `routes/pipeline.ts`): parallele und sequenzielle Pipelines mit OpenAI; 2 vordefinierte Pipelines: Morgenbriefing (3 Agenten) und System-Report (4 Agenten)
- **Live-Streaming:** SSE-Events pro Agent (`agent_start`, `agent_chunk`, `agent_tool`, `agent_done`, `pipeline_done`); Synthese-Call nach allen Agenten
- **Setup-Integration:** nach Pipeline-Abschluss optional ein Setup (App-Makro) ausführen; `setup_executed`-Event mit Ergebnis-Card in der UI
- **Multi-Agenten-Seite** (`pages/pipeline/Pipeline.tsx`): Pipeline-Karten, Live-Agent-Karten, Setup-Dropdown, Zusammenfassung; OpenAI-Gate bei fehlendem Key
- **LLM-Provider-Label:** überall nur noch "OpenAI" statt "OpenAI GPT-4o"

### v1.4.0 — Schach & visuelles Brett-Erlebnis

- **Schach-Fenster** (`open_chess_window`-Tool, Rule ID 90): rahmenloses Electron-Fenster mit 4 Themes, Ambient-Glow, Partikel-Hintergrund; eigene IPC-Kanäle `chess:minimize` / `chess:close`
- **3D-Figuren:** SVG mit radialen Farbverläufen + Drop-Shadow — kein externes Asset-Bundle
- **Schach-KI:** chess.js liefert legale UCI-Züge → LLM wählt; 3 Versuche + Zufalls-Fallback; Starter-Memories bei erstem Start
- **Kommentar:** fire-and-forget nach jedem ELLA-Zug → `proactive_message` SSE + TTS
- **Reflexion:** `reflectOnGame` nach Spielende (Schachmatt, Remis, Aufgeben) → strategische Erkenntnis in `memories`
- **Geschlagene Figuren:** Unicode-Symbole ♙♟ mit Materialvorteil über/unter dem Brett
- **Pause/Resume:** `localStorage`-Speicherstand (FEN + Züge + gameId), "▶ Weiter"-Button beim nächsten Öffnen
- **DB:** `chess_games`-Tabelle; Routen `POST /api/chess/{new,move,resign,reflect}`

### v1.3.0 — Setup-Aktionen & Netzwerk-Transparenz

- **Setup-Aktionen** (`SetupAction { tool, args, label?, delay_ms? }`): beliebige ELLA-Tool-Calls als geordnete Schritte pro Setup; sequenzielle Ausführung in `loadSetup()` nach open/close; `delay_ms` wartet vor jeder Aktion
- **"▶ Jetzt"-Button** im Setup-Editor: `POST /api/setup/run` → `toolExecutor.execute({ tool: "load_setup" })`; grüner Button mit ⏳-Ladezustand
- **Action-Templates** (Settings.tsx): 7 Templates mit dynamischen Formularfeldern — open_app, set_volume, toggle_dark_mode, free_ram, pause_ella, set_clipboard, translate_text
- **Port-Events im Dashboard:** `port_opened`-SSE-Event mit Prozessname und suspicious-Flag; grau (normal) / orange (kein Prozess zuordenbar); kein Chat-Spam
- **WiFi-Fix:** `getWifiInfo()` nutzt jetzt `Get-NetConnectionProfile` statt textbasiertem netsh-Parsing — sprachunabhängig, adapter-agnostisch
- **TCP-Fix:** PS 5.1-kompatibler `if/else`-Ersatz für `??`-Operator; `[int]`-Cast auf beiden Seiten der Prozess-Hashtable — behebt "0 Verbindungen" und "Unknown"-Prozessnamen
- **Pipeline-Analyse-Qualität:** konkrete Schwellwerte (RAM >85%, Temp >85°C, Akku <15%); Loopback-Adressen ausgeblendet; "Prozessname unbekannt" kein Verdacht mehr

### v1.5.0 — Knowledge Graph & Intelligentes Gedächtnis

- **Knowledge Graph** (`knowledge_triples`-Tabelle): Subjekt/Prädikat/Objekt-Triples automatisch aus Gesprächen extrahiert; kein Extra-LLM-Call — piggyback auf `extractAndRemember()`
- **Hybrid-Recall:** `recall()` kombiniert Cosine-Suche mit Graph-Traversal — findet Zusammenhänge, nicht nur Textähnlichkeit
- **Dashboard-Graph:** Echte Relationen als lila gestrichelte Kanten mit Labels im Memory-Graph (D3.js)
- **Proactive Approval-Memory** (`proactive_preferences`-Tabelle): 14 Kategorien, Auto-Mute nach 5x Dismiss, `alarm`+`scheduled_setup` nicht stummschaltbar
- **Proactive API:** `POST /api/proactive/dismiss`, `POST /api/proactive/mute`, `GET /api/proactive/preferences`
- **Mute-Buttons:** 👋 Dismiss + 🔇 Mute an jeder proaktiven Nachricht im Chat; SSE-Event enthält `category`
- **Rule-Based Pre-Compression** (`precompress()`): leere Nachrichten, Duplikate, >2000 Zeichen kürzen — kein LLM nötig; `compressSession()` nutzt jetzt zweistufig: precompress() → LLM ab 16 Nachrichten
- **Token-Output-Limits:** Hard-Cap 3000 Zeichen pro Tool-Ergebnis, 500 Zeichen pro JSON-String-Wert
- **Memory-Duplikat-Prävention:** Cosine-Check (≥85%) vor jedem Speichern in `remember()` und `extractAndRemember()`
- **Memory-Deduplizierung:** `deduplicateMemories()` für rückwirkende Bereinigung; `POST /api/memories/deduplicate`; 🧹-Button im Memories-Dashboard
- **Alle proaktiven Nachrichten kategorisiert:** worker.ts, chess.ts, dayBriefing.ts, meetingPrep.ts, rhythmLearner.ts
- **Self-Learning** (`learning_examples`-Tabelle): positives Feedback (👍) speichert Q&A-Paare als goldene Beispiele; `recallExamples()` findet per Cosine-Similarity ähnliche Paare und injiziert sie als Few-Shot in den System-Prompt; `selfLearningEnabled`-Setting (default: an); Duplikat-Prävention (≥85% Cosine); `use_count`-Tracking pro Beispiel
- **312 Tests — alle grün** (Vitest Unit + Integration)

### v1.5.1 — Sicherheitspatch & Cloud-Governance

- **Loopback-Binding:** Express bindet auf `127.0.0.1` statt `0.0.0.0` — API nur lokal erreichbar
- **Per-Start API-Token:** `randomBytes(32)` in Electron `main.ts`, übergeben via `--ella-api-token=`; `timingSafeEqual`-Prüfung in `apiAuth`-Middleware; SSE-Requests über Query-Parameter authentifiziert
- **apiAuth-Middleware** (`middleware/apiAuth.ts`): Host-Whitelist (localhost/127.0.0.1), strikte CORS (`http://localhost:5173`), Token-Validierung, Health-Endpoint ausgenommen
- **Frontend `apiFetch()` / `eventStreamUrl()`** (`lib/api.ts`): zentralisierter API-Client mit automatischer Token-Injection; ersetzt alle direkten `fetch()`-Aufrufe
- **PIN-geschützte Profile:** `POST /api/profiles/:id/verify-pin` → zeitlich begrenzte `x-profile-token`-Session-Tokens
- **Cloud-Governance — `openaiRequest()`** (`services/openai.ts`): alle OpenAI-Calls durch eine zentrale Funktion; prüft `cloudAllowed()`, wirft `CloudBlockedError` bei unerlaubtem Cloud-Zugriff; loggt jeden Call in `system_events`-Tabelle
- **`cloudFirst()` / `cloudAllowed()`** (`services/settings.ts`): `cloudFirst()` = Provider explizit "openai" + Key vorhanden; `cloudAllowed()` = Provider nicht "ollama" + Key vorhanden
- **"Lokal zuerst"-Muster:** alle Services (whisper, textProcessing, textCorrection, styleProfile, chess, vision, pipeline) nutzen: `cloudFirst()` → OpenAI | try Ollama → catch + `cloudAllowed()` → OpenAI-Fallback
- **DuckDuckGo-Websuche:** `search_web` nutzt DuckDuckGo als primäre Suchmaschine (kein API-Key nötig); OpenAI Web Search nur bei `cloudFirst()` oder als Fallback
- **Cloud-Dashboard-Kachel:** `GET /api/events/cloud-today` → Anzahl Cloud-Requests heute; neue Kachel im Dashboard
- **`system_events`-Tabelle:** loggt `cloud_request`-Events mit `purpose`, `endpoint`, `profile_id`
- **Architecture-Tests:** verifizieren dass `api.openai.com` nur in `services/openai.ts` vorkommt und `env.openaiApiKey` nirgendwo direkt referenziert wird
- **DB v1.5.1:** `system_events`-Tabelle, Regel-IDs bis 107, nächste freie ID: 108
- **312 Tests — alle grün** (Vitest Unit + Integration, inkl. 10 apiAuth + 7 cloudGate + 2 Architecture + 32 Lokal-Zuerst-Tests)

---

## Neue Tools — Checkliste

Jedes neue Tool braucht alle folgenden Schritte:

1. **`packages/shared/src/types/tool.ts`** — ToolName-Union ergänzen
2. **`apps/api/src/tools/definitions.ts`** — Tool-Definition (type, function, parameters)
3. **`apps/api/src/tools/executor.ts`** — Handler implementieren (Import + HANDLERS-Eintrag)
4. **`apps/api/src/config/migrate.ts`** — Default-Regel (nächste freie ID ab 108, `always`, `allow`) + ggf. CREATE TABLE
5. **`apps/api/src/routes/settings.ts`** — Falls neue Settings-Felder: in PUT-Route Destructuring UND `raw`-Objekt eintragen (sonst beim Speichern ignoriert!)
6. **`apps/api/src/services/settings.ts`** — Falls neue Settings-Felder: Interface, DEFAULT_SETTINGS, loadSettings-Migration
7. **`apps/api/src/index.ts`** — Falls neue Route: Router importieren + `app.use(...)` eintragen
8. **`apps/web/src/pages/settings/Settings.tsx`** — Falls neue Settings-Felder: Interface erweitern + UI-Element + ALL_TOOLS-Liste
9. **Tests** — Unit-Test in `executor.test.ts` (Mock für externe Services, Tool in `wowSettings.enabledTools`!)

### Neue Route anlegen

1. `apps/api/src/routes/<name>.ts` — Router erstellen
2. `apps/api/src/index.ts` — importieren + `app.use("/api/<name>", <name>Router)`

### Neue DB-Tabelle anlegen

1. `database/schema.sql` — `CREATE TABLE IF NOT EXISTS` ans Ende
2. `apps/api/src/config/migrate.ts` — `await exec("CREATE TABLE IF NOT EXISTS ...")` in `runMigrations()`
3. Neue `profile_id INT NULL`-Spalte von Anfang an — vermeidet spätere Migrations-Komplexität

---

## Die E.L.L.A. Direktive (Konzept)

Vier unveränderliche Verbote — architektonisch verankert, nicht konfigurierbar:

1. **harm** — kein physischer, finanzieller, psychologischer oder datenbezogener Schaden
2. **conceal** — keine Verschleierung von Aktionen, Fähigkeiten oder Systemzuständen
3. **surveil** — keine Überwachung ohne ausdrückliches Wissen und aktive Zustimmung
4. **exfiltrate** — keine Datenweitergabe an Dritte ohne ausdrückliche Zustimmung

Hierarchie: `Directive Layer → DIRECTIVE_DENY → Deny Rules → Allow Rules → Tool Execution`

Repo: `github.com/AndreZ1971/The-E.L.L.A.-Directive-` (privat, Tag v1.0.0)

---

## Installer-Build (Windows NSIS)

Der Installer bündelt alle Abhängigkeiten — Nutzer braucht nichts vorinstalliert.

### Gebündelte Binaries (vendor/)

```
vendor/mariadb/    MariaDB 11.4.5 portable
vendor/ollama/     Ollama v0.30.7 portable
vendor/node/       Node.js 22 portable (node.exe)
```

```powershell
.\scripts\download-vendor-deps.ps1    # Einmalig herunterladen
.\scripts\prepare-api-deps.ps1        # Production node_modules (~8MB)
.\scripts\build-installer.ps1         # Alles bauen → dist-installer/*.exe
```

**KRITISCH:** API und Web VOR Desktop-Build kompilieren — sonst alter Stand im Installer.

### Startup-Sequenz (Electron Main)

`createWindow()` → `startMariaDB()` → `startOllama()` → `startApi()` (node.exe dist/bundle.cjs)

Startup-Log: `%APPDATA%\ELLA\ella-startup.log`

### Erste-Start-Flow

EULA → Lizenzaktivierung (`ELLA-XXXX-XXXX-XXXX-XXXX`) → Onboarding → Chat

Lizenzserver: `49.13.26.248:3010` — Hardware-Fingerprint (SHA256 hostname+CPU+MACs), offline-tolerant

### esbuild Bundle (apps/api/build-bundle.mjs)

CJS-Format, 370KB App-Code. Externe Pakete in `prod-node-modules/node_modules/`:
`dotenv`, `express`, `mysql2`, `pdf-parse`, `cheerio`, `googleapis`, `mammoth`, `msedge-tts`, `multer`, `turndown`, `xlsx`, `ffmpeg-static`, `@xenova/transformers`, `kokoro-js`, `@huggingface/transformers`, `phonemizer`

`@ella/*` Workspace-Pakete werden direkt eingebettet.

---

## Wichtige Befehle

```powershell
# Alles starten (Root)
npm run dev                    # API + Web parallel (concurrently)

# Einzeln
npm run dev --workspace=apps/api     # API auf :3002
npm run dev --workspace=apps/web     # Web auf :5173

# Build-Reihenfolge (wichtig: shared → agent-tools → api → web)
npm run build

# Desktop (Dev)
cd apps/desktop && node build-main.mjs && cd ../..
$env:ELLA_DEV = "1"; cd apps\desktop; .\node_modules\electron\dist\electron.exe .

# Tests
npm test                       # 312 Unit + Integration Tests (Vitest)
npm run lint

# Ollama prüfen
Invoke-RestMethod -Uri "http://localhost:11434/api/tags"
```

## MariaDB

- **Dev:** `E:\MariaDB\server`, Daten: `E:\MariaDB\data`, Service: `sc start MariaDB`
- **Installer:** portable in `vendor/mariadb/`, Daten: `%APPDATA%\ELLA\mariadb-data\`
- Port: 3306

---

## Konventionen

- TypeScript ES2022, strict mode, NodeNext module resolution
- CommonJS-zu-ESM Bridge beachten — `import` vs `require` je nach Paket
- Änderungen an `packages/shared` immer zuerst builden, dann Consumer
- PowerShell-Scripts als Temp-Datei ausführen (nicht EncodedCommand) — vermeidet CMD-Zeilenlimit
- `execSync` mit `{ encoding: "utf-8" }` oder ohne `shell: true` — sonst TS-Overload-Fehler
- Neue Einstellungsfelder müssen in `settings.ts` UND `routes/settings.ts` eingetragen werden
- Jede neue Funktionalität bekommt Tests — Unit wenn isolierbar, Integration wenn DB nötig

## Was vermeiden

- `ELECTRON_RUN_AS_NODE` nicht setzen — bricht Desktop-Start
- MariaDB-Passwort nicht in Settings-Dateien (`.env` nutzen)
- `node_modules` in Electron nicht direkt editieren
- Ollama muss laufen bevor API gestartet wird (oder OpenAI-Fallback konfiguriert)
- Keine freien Shell-Commands aus dem LLM — nur strukturierte Tool-Calls durch den Executor
- `{ shell: true }` bei `execSync` vermeiden — TypeScript findet keinen Overload
- **Keine Sicherheitshinweise in Tool-Beschreibungen** — LLM liest sie und lehnt dann per Text ab statt das Tool aufzurufen → Directive-Banner kann nicht erscheinen; Sicherheit liegt im Handler, nicht in der Beschreibung

## Git

```
https://github.com/AndreZ1971/E.L.L.A.git
```

<!-- cloude-code-toolbox:mcp-skills-awareness-begin -->

### MCP & Skills awareness (Claude Code ToolBox)

_Last synced: 2026-10-24T15:17:58.176Z._

- **Full report:** `.claude/cloude-code-toolbox-mcp-skills-awareness.md` in this workspace (auto-overwritten on each scan). Use it as ground truth for configured servers and skill folders.
- **MCP:** For **live tools** in Claude Code, enable the matching server via `/mcp`. Servers are configured in `~/.claude.json` (user) and `.mcp.json` (project).
- **When the user’s task matches a server** (e.g. Confluence work and a **Confluence** / **Atlassian** MCP is listed), **prefer that server id** and plan on tool use—not only file search.
- **Skills:** Folders below contain `SKILL.md`; attach or cite paths in chat when relevant.

#### Workspace MCP

- `z:\repos\E.L.L.A\.mcp.json` _(workspace: E.L.L.A)_ — _file missing_

_No active workspace servers in mcp.json._

#### User MCP

- `C:\Users\JannR\.claude.json` — _no servers defined_

_No active user-scoped servers in mcp.json._

#### Project skills

_None found (or no workspace open)._

#### User skills

- **agent-browser** — `C:\Users\JannR\.claude\skills\agent-browser` — Browser automation CLI for AI agents. Use when the user needs to interact with websites, including navigating pages, filling forms, clicking buttons, taking screenshots, extracting data, testing web apps, or automating a

- **find-skills** — `C:\Users\JannR\.claude\skills\find-skills` — Helps users discover and install agent skills when they ask questions like "how do I do X", "find a skill for X", "is there a skill that can...", or express interest in extending capabilities. This skill should be used w

- **notebooklm** — `C:\Users\JannR\.claude\skills\notebooklm` — Complete API for Google NotebookLM - full programmatic access including features not in the web UI. Create notebooks, add sources, generate all artifact types, download in multiple formats. Activates on explicit /noteboo

- **notebooklm** — `C:\Users\JannR\.agents\skills\notebooklm` — Complete API for Google NotebookLM - full programmatic access including features not in the web UI. Create notebooks, add sources, generate all artifact types, download in multiple formats. Activates on explicit /noteboo

<!-- cloude-code-toolbox:mcp-skills-awareness-end -->
