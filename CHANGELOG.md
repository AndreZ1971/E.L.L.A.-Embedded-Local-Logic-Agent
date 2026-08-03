# Changelog

Alle wesentlichen Änderungen an E.L.L.A. Detaillierte Entscheidungsbegründungen in [docs/history.md](docs/history.md).

---

## [1.0.0] — 03.08.2026

### Veröffentlichung

- Offizielle Erstveröffentlichung als E.L.L.A. v1.0.0 (Public Release)
- Paketname und Installerdatei vereinheitlicht auf `E.L.L.A Setup 1.0.0.exe`
- Release-Candidate-Status entfernt

---

## [3.9.0] — 20.06.2026

### Hinzugefügt

- **Stress-Erkennung in der Stimme** — `scripts/stress_server.py` (Port 3004): Python-Server analysiert WAV-Audio mit reinem numpy (kein librosa nötig); extrahiert RMS-Energie, Zero-Crossing-Rate und Pitch per Autokorrelation → gibt `low/medium/high` zurück
- **Parallele Stress-Analyse** — läuft gleichzeitig mit Whisper-Transkription auf demselben WAV-Segment, kein Latenzverlust
- **Stress-Kontext im LLM** — bei `medium/high` wird ein Hinweis vorne in die Memories injiziert; LLM antwortet mitfühlender und ruhiger
- **Settings-Toggle** — "Stimmanalyse aktivieren" in Einstellungen → Stimme (opt-in, default: aus)
- **Graceful Degradation** — wenn stress_server.py nicht läuft, fällt der Chat lautlos auf normales Verhalten zurück
- **224 Tests** — 9 neue Unit-Tests für Stress-Fallback, Hint-Aufbau und Einstellungs-Patch

---

## [3.8.3] — 20.06.2026

### Hinzugefügt

- **Stimmen im Onboarding** — Voice-Schritt zeigt jetzt alle 4 weiblichen Stimmen (DE/EN/ES/FR) mit freundlichen Labels ("Deutsch — Katja" etc.)
- **Vorschau-Text mehrsprachig** — Klick auf eine Stimme spielt "Hello André. I am E.L.L.A." (bzw. in der gewählten Sprache)
- **Kein männlicher Fallback mehr** — `de-DE-ConradNeural` aus dem Onboarding-Fallback entfernt

### Geändert

- `listVoices()` in `tts.ts` gibt jetzt die 4 fixen weiblichen Stimmen zurück (kein MsEdgeTTS-API-Call mehr)
- Onboarding speichert Wahl als `spokenLanguage` statt `ttsVoice`
- `/voices`-Route nicht mehr async (kein I/O mehr nötig)

---

## [3.8.2] — 19.06.2026 (Bugfix)

### Behoben

- **Chat.tsx überschrieb Stimme** — `ttsVoice`-Ref sendete immer `de-DE-KatjaNeural` im Request-Body und überschrieb die API-seitige `spokenLanguage`-Logik; `voice`-Feld aus beiden TTS-Fetch-Calls entfernt
- **Settings-Dropdown** — altes `ttsVoice`-Dropdown (DE-only, gemischt) durch `spokenLanguage`-Selektor ersetzt

---

## [3.8.1] — 19.06.2026

- README + CHANGELOG + CLAUDE.md auf v3.8.0-Stand gebracht
- Roadmap v1.3 als ✓ abgehakt (ausgeliefert)

---

## [3.8.0] — 19.06.2026

### Hinzugefügt

- **Mehrsprachige Stimmen** — `spokenLanguage`-Setting (de/en/es/fr), unabhängig von UI-Sprache
- **Kokoro Voice-Map** — ausschließlich weibliche Stimmen: `af_sarah` (DE), `bf_emma` (EN), `ef_dora` (ES), `ff_siwis` (FR); `lang`-Parameter im `/synthesize`-Endpunkt
- **MsEdgeTTS Voice-Map** — `getVoiceForLanguage()`: Katja (DE), Sonia (EN), Elvira (ES), Denise (FR)
- **Settings UI** — Dropdown "Gesprächssprache (Stimme)" in Einstellungen → Stimme
- **i18n** — `settings.spoken_language` Key in de.json + en.json

---

## [3.7.1] — 19.06.2026

### Dokumentation

- **Roadmap v1.3** — Multilingual TTS geplant: DE/EN/ES/FR, ausschließlich weibliche Stimmen (Kokoro `af_sarah`/`bf_emma`/`ef_dora`/`ff_siwis`)
- **Roadmap v3.8** — Ollama als automatischer Offline-Fallback wenn kein Internet; OpenAI wird Standard-Engine
- **Produktpositionierung** festgelegt: E.L.L.A. 100% lokal (Stimme, Gedächtnis, Tools); LLM-Reasoning hardwareabhängig; Direktive gilt unabhängig von der Engine
- **Charakter-DNA** dokumentiert: E.L.L.A. = Genesis + Rachel; ARM = Red Queen; HOME = Mother
- Minimum-Hardware für vollständig offline: 8 GB RAM + dedizierte GPU ≥4 GB VRAM

---

## [3.7.0] — 18.06.2026

### Hinzugefügt

- **Modell-Auswahl vor Download** — neues `ModelSelectOverlay` zeigt beim Erststart eine Hardware-Tier-Auswahl (Klein/Standard/Groß); `ensureOllamaModel()` pausiert per IPC bis der Nutzer gewählt hat — kein Default-Download mehr auf falscher Hardware
- **i18n DE/EN komplett** — alle UI-Komponenten vollständig via react-i18next übersetzt: App, Chat, Settings, Dashboard, Onboarding, Activation; 200+ neue Keys in beiden Sprachdateien
- **Lizenz-Website-Link** — ELLA-style Hinweis auf der Aktivierungsseite: ella-agent.de
- **OpenAI-Fallback-Hinweis** — unter der "Klein"-Tier-Option steht nun ein Hinweis dass ELLA auch ohne GPU mit einem OpenAI-Key funktioniert
- **Update-Teaser Settings** — dezenter Hinweis in Einstellungen → LLM dass Modellwechsel nach Installation folgt

### Geändert

- `preload.ts`: `onChooseModel` + `modelChosen` IPC-Methoden hinzugefügt
- `TIER_OPTIONS` von Modul-Level in Settings-Komponente verschoben (für i18n-Zugriff)
- `TOOL_LABELS` aus Chat.tsx entfernt, durch dynamisches `t('tools.${name}')` ersetzt
- `ELLA_QUIPS` aus App.tsx entfernt, durch JSON-Array `splash.quips` ersetzt

---

## [1.0.0-rc] — 14.06.2026

### Hinzugefügt

- **Zero-Config Windows Installer** — NSIS-Installer bündelt MariaDB 11.4, Ollama und Node.js 22 als portable Vendored Binaries; keine externen Abhängigkeiten nötig
- **Portable MariaDB** — `mysql_install_db.exe` initialisiert Datenverzeichnis bei Erststart in `%APPDATA%\ELLA\mariadb-data` (kein Admin, kein Windows-Dienst)
- **API-Bundle** — esbuild CJS-Bundle (`bundle.cjs`, ~42 MB) mit allen npm-Abhängigkeiten inline; läuft via portable Node.js
- **Web Speech API STT** — Freihand- und Manuell-Modus nutzen `window.SpeechRecognition` (Chromium built-in, kein API-Key, de-DE)
- **Microsoft Edge TTS** — `msedge-tts` als primäre Sprachausgabe (kein API-Key, kostenloser Microsoft-Dienst, `de-DE-KatjaNeural`); `ttsEnabled: true` als Default
- **USB-Erkennung mit TTS-Ansage** — PnP-Worker meldet USB-Laufwerke proaktiv im Chat und liest sie vor
- **Lizenzaktivierungs-Flow** — EULA → Aktivierung → Onboarding → Chat

### Geändert

- **Electron → API**: übergibt `ELLA_RESOURCES` und `ELLA_USERDATA` als Umgebungsvariablen; API schreibt Settings/Logs in `%APPDATA%\ELLA` statt in Program Files
- **`ttsEnabled` Default**: `false` → `true`
- **PowerShell-Worker**: `$ProgressPreference='SilentlyContinue'` in allen PS-Aufrufen — unterdrückt CLIXML-Spam in Logs

### Behoben

- **`mysql_install_db.exe --service`** — `--service=ELLA_MariaDB` entfernt (erforderte Admin/OpenSCManager, schlug mit exit 5 fehl)
- **`mysqld --initialize-insecure`** — MariaDB kennt diesen MySQL-Flag nicht; auf `mysql_install_db.exe` gewechselt
- **`Cannot find module 'mysql2/promise'`** — alle npm-Pakete in bundle.cjs inline (electron-builder `!**/node_modules` schließt extraResources node_modules aus)
- **`Cannot find module 'pdf-parse'`** — `_require("pdf-parse")` auf statischen Import umgestellt
- **`ReferenceError: DOMMatrix`** — Browser-Globals als Stub im esbuild-Banner
- **`Cannot find module '@xenova/transformers'`** — lazy `import()` statt Top-Level-Import; 503-Fallback statt 500-Crash
- **`ENOENT schema.sql`** — Pfad-Auflösung via `ELLA_RESOURCES` statt `fileURLToPath(import.meta.url)`
- **`EPERM settings.json`** — Settings in `%APPDATA%\ELLA` statt read-only Program Files
- **Whisper-Loop** — Frontend wiederholt Transcribe-Request nicht mehr bei 503; zeigt Fehlermeldung und stoppt VAD
- **MariaDB-Logs** — stdout/stderr jetzt in `ella-startup.log` sichtbar (war `console.log`, unsichtbar)
- **errorHandler** — respektiert `err.status`; loggt nur 5xx-Fehler auf Konsole

---

## [3.5.4] — 09.06.2026

### Hinzugefügt

- **`list_folder`** — neues Tool: listet Inhalt eines Laufwerks oder Ordners auf (nicht rekursiv, schnell auch auf großen Laufwerken wie H:\); System-Prompt weist LLM an, dieses Tool statt `search_files` für "was ist auf Laufwerk X" zu verwenden

### Behoben

- **TTS Stummschalten** — Mute-Button und neuer Chat-Input rufen jetzt `stopCurrentAudio()` auf statt nur `speechSynthesis.cancel()`; ELLA stoppt sofort
- **TTS 2 Stimmen / Race Condition** — `AbortController` bricht laufenden TTS-Fetch ab wenn ein neuer Aufruf kommt; zwei gleichzeitige Antworten spielen nie mehr parallel
- **`create_document` (leeres Word)** — Word-Exe wird jetzt an bekannten Installationspfaden gesucht bevor Fallback auf `WINWORD.EXE` im PATH
- **Settings → Modus-Tab** — "Proaktive Intelligenz"-Block war als separater zweiter `{tab === "modus"}` Block implementiert, was zu Überlappung führte; in einzige Section zusammengeführt
- **`search_files` Timeout** — `CommandTimeout = 20` auf OleDb-Command; GCI-Fallback auf `-Depth 4` begrenzt; execSync-Timeout 30s → 60s

---

## [3.5.1] — 09.06.2026

### Verbessert

- **Spracheingabe** — `whisper-base` → `whisper-small` (244 MB, lokal, deutlich bessere Genauigkeit bei Deutsch); OpenAI `whisper-1` wenn API-Key gesetzt (cloud, beste Qualität, ~0.006$/min) mit automatischem Fallback auf lokal

### Behoben

- **`play_music`** — `Get-ChildItem "$lib\*" -Recurse -Include` statt `$lib`: PS-Bug der Dateien im Root-Ordner der Musikbibliothek übersprang; Timeout 15s → 45s für große Bibliotheken

---

## [3.5.0] — 09.06.2026

### Hinzugefügt

- **Wecker** — `set_alarm`, `list_alarms`, `delete_alarm`: DB-basierte Wecker in MariaDB (`alarms`-Tabelle), täglicher Check im Background-Worker (60s), `last_fired` verhindert doppeltes Auslösen
- **Dokument-Konvertierung** — `read_file_content` versteht strukturierte Formate: `.docx/.doc` → mammoth → Markdown, `.pdf` → pdf-parse, `.xlsx/.xls` → SheetJS → Markdown-Tabellen, `.html/.htm` → Turndown
- **Favicon** — SVG "E." Design (lila `#7c6af7` + weißes E-Letterform + Punkt), Electron-Icon auf RGBA aktualisiert (transparente Ecken, pixelgetreues E.-Design)
- **Externe Links** — `shell.openExternal` in Electron-Main: alle externen URLs öffnen im System-Browser statt in der App
- **Ollama-Offline-Banner** — `GET /api/health` Endpoint + `OllamaBanner`-Komponente im Chat-Header (30s Polling, Retry-Button)
- **Markdown-Rendering** — Assistenten-Antworten werden via `marked.js` als Markdown gerendert
- **TTS-bewusstes System-Prompt** — `buildSystemPrompt()` liest `ttsEnabled`, wählt zwischen Markdown- und Plaintext-Formatierungsanweisung
- **Tool-Log im Chat** — verwendete Tools werden als Chips unter jeder Assistenten-Antwort angezeigt (63 Labels)
- **Feedback→Memory** — Daumen-Feedback extrahiert via Ollama Nutzerpräferenzen und speichert als `user`-Memory (`source: "feedback"`)
- **System-Prompt** — vollständige Beschreibung aller 57+ Tools mit proaktiven Hinweisen

### Verbessert

- **`set_volume`** — C#-DLL-Cache in `%TEMP%\ella-volume-ctrl.dll`: einmalige Kompilierung, Folgeaufrufe ~0.5s statt 8s
- **`search_files`** — Windows Search Index (OleDb/SystemIndex) als primärer Pfad (Millisekunden), Get-ChildItem-Rekursion als Fallback
- **Per-session Mutex** — Race-Condition bei überlappenden Chat-Anfragen verhindert
- **Stimmenauswahl** — nutzt `/api/speech/voices` statt Browser-API

### Behoben

- **TTS-Überlappung** — `currentAudioRef` stoppt laufende Wiedergabe bevor neue startet
- **TTS-Stimme** — kein Fallback auf Browser-Web-Speech-API (erklärt die "andere Stimme")
- **`create_document` Word** — COM-Timeout behoben: leere Docs via `Start-Process WINWORD.EXE /w` (fire-and-forget), Docs mit Inhalt via `$doc.Saved=$true` vor COM-Release
- **`migrate.ts`** — `ON DUPLICATE KEY UPDATE tool_name = VALUES(tool_name)` korrigiert Tool-Namen in Regeln 31+32 in bestehenden DBs
- **`search_files`** — `searchPath`-Parameter wurde ignoriert, jetzt als `SCOPE`-Clause in SQL übergeben
- **`fetch_url`** — JSON, XML und Plain-Text Content-Types werden unterstützt (statt nur HTML)
- **Build** — Test-Dateien aus `tsc`-Produktions-Check und Vitest-Durchlauf excludiert

---

## [1.0.0] — 28.05.2026

### Hinzugefügt

- **EULA-Screen** — Vollbild-Gate beim ersten Start, 5 Nutzungshinweise, Persistenz in `settings.json`
- **Setup-Screen** — Automatische Abhängigkeitsprüfung (Ollama, nomic-embed-text, MariaDB)
- **nomic-Pull via SSE** — "Jetzt herunterladen"-Button streamt `ollama pull` live ins Frontend
- **electron-builder NSIS-Installer** — `npm run dist` erzeugt `E.L.L.A.-Setup.exe`
- **Landingpage** — Statisches `apps/landing/index.html` mit drei Säulen, Features, Lemon-Squeezy-Checkout
- **Vollständiges README** — Voraussetzungen, Schnellstart, Architekturübersicht, Sicherheitsprinzipien

### Behoben

- Tool-Registry gab alle Phase-4/5-Tools als "not enabled" zurück — `executor.ts` liest jetzt `getSettings().enabledTools` statt hardcoded Set
- EULA-Gate blockierte Navigation zu `/setup` nach Bestätigung — Gate gilt nicht mehr für Fullscreen-Seiten
- Doppeltes "Direktive:"-Prefix bei `mark_email`-Direktive-Fehler
- `readCalendar`: `IncludeRecurrences` wurde nach `Sort` gesetzt — Reihenfolge korrigiert

---

## [0.6.0] — 28.05.2026

### Hinzugefügt

- **`read_emails`** — Ungelesene Mails aus Outlook (COM) oder Thunderbird (mbox, read-only)
- **`mark_email`** — Outlook-Mails als gelesen / Spam / archiviert markieren oder löschen
- **`read_calendar`** — Termine der nächsten N Tage aus Outlook (IncludeRecurrences)
- **`create_appointment`** — Neuen Termin in Outlook-Kalender anlegen
- **Direktive: Ungelesene Mails löschen = NIEMALS** — Zweifach abgesichert (PS-Script + Executor)
- Seed-Regeln 13–16 für alle vier Mail/Kalender-Tools
- Thunderbird-Fallback: MIME-Decoded-Words, X-Mozilla-Status-Flags, letzte 5 MB der mbox

---

## [0.5.0] — 27.05.2026

### Hinzugefügt

- **`create_setup`** — App-Setup per Gespräch anlegen
- **`update_setting`** — Einstellungen per Gespräch ändern (Whitelist: provider, ollamaModel, voiceMode, sessionLimit, tts\*)
- **`create_rule`** — Neue Regel-Engine-Regel per Gespräch erstellen
- **`free_ram`** — RAM via `[System.GC]::Collect()` freigeben
- **Notschalter** — `POST /api/settings/emergency-reset` setzt KI-Einstellungen zurück, behält User-Daten

### Behoben

- `update_setting`-Tool: fehlendes `type: "string"` auf `value`-Parameter (TS-Fehler)

---

## [0.4.1] — 27.05.2026

### Hinzugefügt

- **Onboarding-Flow** — 3 Schritte: Willkommen → System-Scan → Name eingeben
- **`get_system_info`** Tool — CPU, GPU, RAM, Computername aus gespeicherten Memories
- **`onboardingComplete`** Flag — App-Routing prüft beim Start, leitet bei `false` zu `/onboarding`
- System-Scan via `wmic` — speichert Hardware-Info als `system`-Memories (einmalig)

---

## [0.4.0] — 27.05.2026

### Hinzugefügt

- **Background-Worker** — Läuft alle 60 s, sammelt Disk/RAM/Ollama-Metriken
- **EventBus** — Singleton `EventEmitter` als interner Broadcast-Kanal
- **SSE-Push** — `GET /api/events/stream` leitet Worker-Events direkt an Clients
- **Dashboard Live-Feed** — Echtzeit-Updates via SSE, keine Polling-Abhängigkeit mehr
- **Alert-Toasts im Chat** — Erscheinen automatisch bei `type: "alert"`, verschwinden nach 8 s
- `GET /api/events/recent` — Letzte 50 Events für initiales Laden

---

## [0.3.0] — 27.05.2026

### Hinzugefügt

- **Rule-Engine** — `evaluateRules(toolName)` vor jeder Ausführung: DIRECTIVE_DENY → deny → allow → no_match
- **Default-Deny** — Kein Tool ohne passende Erlaubnis-Regel (7 Default-Allow-Regeln per `INSERT IGNORE`)
- **Regeln-Tab in Settings** — CRUD-UI, Toggle, Filter
- REST-API `GET/POST /api/rules`, `PUT/DELETE/PATCH /:id`, `PATCH /:id/toggle`

### Entfernt

- `services/approvals.ts` und `routes/approvals.ts` — ersetzt durch Rule-Engine
- `approvals`-Tabelle aus Schema
- Bestätigungs-Cards aus `Chat.tsx`

---

## [0.2.0] — 27.05.2026

### Hinzugefügt

- **Auto-Migration** — Schema wird bei jedem Start idempotent ausgeführt (`IF NOT EXISTS`, `INSERT IGNORE`)
- `migrate.ts` — Liest `schema.sql`, führt Statements aus, ignoriert erwartete Duplikat-Fehler

### Entfernt

- `list_running_processes` — nie implementiert, sauber aus allen Typen entfernt

---

## [0.1.7] — 27.05.2026

### Behoben

- `remember`, `forget`, `homework_mode` fehlten nach Upgrade in `enabledTools` — Migration in `loadSettings()` ergänzt

---

## [0.1.6] — 26.05.2026

### Behoben

- `loadSetup` prüfte `homeworkMode` nicht — erlaubte gesperrte Apps über Setup zu starten
- `extractAndRemember` nutzte hardcodiertes `llama3.1:8b` statt konfigurierten Modell-Namen
- OpenAI sendete leeres `tools: []` → HTTP 400 — Feld wird nur gesetzt wenn Tools vorhanden
- `activateHomeworkMode` ignorierte `allowed`-Flag auf App-Einträgen
- Toter Code `void duration` in `executor.ts` entfernt

---

## [0.1.5] — 26.05.2026

### Behoben (10 Fixes)

- `list_memories` Handler: falscher Rückgabetyp, fehlte in Tool-Definitionen und `ToolName`-Union
- `load_setup` fehlte in `ENABLED_TOOLS` (registry.ts)
- `sessionLimit` hardcodiert auf 40 — liest jetzt `getSettings().sessionLimit`
- Non-Streaming-Path führte gefährliche Tools ohne Bestätigung aus
- `ttsVoiceRef` nach `speak()` deklariert (stale Ref) — Reihenfolge getauscht
- `ttsEnabled`/`ttsVoice` wurden nicht persistiert
- `sessions`, `session_messages`, `memories` fehlten in `schema.sql`

---

## [0.1.4] — 26.05.2026

### Hinzugefügt

- **GPU-Beschleunigung** — Ollama nutzt GTX 1060 (CUDA), 14.6 t/s, 5.8 GB VRAM
- **TTS (Sprachausgabe)** — `window.speechSynthesis`, Markdown-Stripping, Schnell-Toggle im Chat-Header
- `OLLAMA_MODELS=E:\Ollama` — Modelle auf E: ausgelagert

---

## [0.1.3] — 25.05.2026

### Hinzugefügt

- **ML-Gedächtnisebene** — `nomic-embed-text` via Ollama, 768-dimensionale Embeddings, Cosinus-Suche
- **`remember` / `forget`** — Explizite Gedächtnis-Tools
- **`extractAndRemember`** — Fire-and-forget nach jedem Gespräch, LLM extrahiert lernwürdige Fakten
- **`trackToolUsage`** — `system`-Memory nach `open_app`/`load_setup`
- `buildSystemPrompt(memories)` — Gedächtnis-Kontext in System-Prompt injiziert (Ollama + OpenAI geteilt)
- Drei Speichertypen: `user` · `system` · `note`

---

## [0.1.2] — 25.05.2026

### Hinzugefügt

- **Hausaufgaben-Modus** — PIN-Kiosk: aktivieren ohne PIN, deaktivieren mit SHA-256-PIN
- `activateHomeworkMode()` — schließt unerlaubte Apps, öffnet erlaubte
- Settings-Tab "Modus" — PIN setzen, erlaubte Apps konfigurieren
- Chat-Header-Buttons für Aktivieren/Deaktivieren, orangefarbener Aktiv-Banner

---

## [0.1.1] — 25.05.2026

### Hinzugefügt

- **3-Modi Spracheingabe** — `off` / `manual` / `wakeword "ella"`
- Submit-Wörter: "ausführen", "los", "mach es" — Cancel: "abbrechen", "stopp"
- **`load_setup`** — Konfigurierbare App-Sets per Befehl laden (open[] + close[])
- Settings aufgeteilt in 4 Tabs: LLM · Tools · Setups · Programme

### Behoben

- `voiceMode` und `setups` wurden in Settings-Route nicht persistiert

---

## [0.1.0] — 25.05.2026

### Hinzugefügt

- **Dashboard** — Status-Karten (LLM, Ollama, MariaDB), Disk-Usage-Balken (C:/E:/Z:)
- **Settings-Seite** — Provider, Modell, API-Key, Tools, Session-Limit
- **Programme-Verwaltung** — System-Scan via Start-Menü-Shortcuts, Whitelist mit `allowed`-Flag
- `GET /api/system/status` und `GET /api/system/disk`

---

## [0.0.5] — 25.05.2026

### Hinzugefügt

- **Frameless Window** — `frame: false`, eigene TitleBar-Komponente (violet, IPC für Minimize/Maximize/Close)
- **Production Build** — Vite → `web/dist/`, Electron lädt via `loadFile()`
- **API als Child-Prozess** — Electron spawnt und überwacht API, Port-Check via `net.connect`
- **Autostart** — `app.setLoginItemSettings`, Toggle im Tray-Menü
- `isDev` via `ELLA_DEV=1` Umgebungsvariable

---

## [0.0.4] — 25.05.2026

### Hinzugefügt

- **SSE-Streaming** — `POST /api/chat/stream`, Text erscheint live während LLM antwortet
- **MariaDB Session-Persistenz** — Gesprächsverlauf überlebt API-Neustart
- Tool-Status-Anzeige im Chat während Ausführung
- Session-Verlauf beim Frontend-Mount laden (`GET /api/chat/history/:id`)

---

## [0.0.3] — 25.05.2026

### Hinzugefügt

- **Electron Desktop-App** — Natives Fenster, Minimize-to-Tray, programmatisches Tray-Icon
- `esbuild` statt `electron-vite` (electron-vite bundelte `electron` trotz external-Config)

### Behoben

- OpenAI Tool-Call-Loop: `tool_call_id` und `tool_calls` fehlten im Message-Mapping → HTTP 400

---

## [0.0.2] — 24.05.2026

### Hinzugefügt

- **Dualer LLM-Provider** — OpenAI GPT-4o (wenn API-Key gesetzt) + Ollama (Fallback)
- MariaDB auf E: eingerichtet (MySQL entfernt — zu groß, zu restriktiv)
- Port von 3001 auf 3002 (Docker Desktop-Konflikt)
- `HashRouter` + `base: './'` für Electron `file://`-Kompatibilität

---

## [0.0.1] — 23.05.2026

### Hinzugefügt

- Monorepo-Grundstruktur (`apps/api`, `apps/web`, `packages/shared`, `packages/agent-tools`)
- Express-API mit Tool-Loop (max. 5 Runden), Ollama-Client, Session-Store (In-Memory)
- React 18 + Vite + React Router v6, Chat-UI mit SSE-Stub
- Erste Tools: `open_app`, `get_disk_usage`, `clean_temp`, `empty_recycle_bin`
- Whitelist-Prinzip: Tool-Registry als einzige Freigabe-Stelle
