# E.L.L.A. — Faktenblatt (aus dem Code ermittelt)

**Erstellt:** 2026-10-25
**Grundlage:** Codestand `master`, Tag `v1.5.6`

---

## Version

| Feld                     | Wert                                                                | Quelle                                                               |
| ------------------------ | ------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Release-Version          | **v1.5.6**                                                          | `git describe --tags`                                                |
| `package.json` (Desktop) | 1.5.5                                                               | `apps/desktop/package.json` — **muss auf 1.5.6 aktualisiert werden** |
| Interne Versionierung    | v3.x in `history.md` / `roadmap.md` — weicht von Release-Nummern ab |

---

## Tools

| Zahl          | Quelle                                                        |
| ------------- | ------------------------------------------------------------- |
| **111 Tools** | `apps/api/src/tools/definitions.ts` — 111× `type: "function"` |

### Tool-Kategorien (aus dem Code)

**System & Hardware:**
get_system_info, get_system_status, get_disk_usage, get_gpu_info, get_ram_info, get_storage_devices, get_audio_devices, get_usb_devices, get_datetime, shutdown_system, free_ram, toggle_dark_mode, set_volume, list_monitors, open_app_on_monitor

**Dateien & Dokumente:**
search_files, open_file, explore_folder, list_folder, rename_file, copy_file, create_folder, delete_file, delete_files, create_document, read_file_content, dictate_to_document, index_documents, search_documents, list_indexed_folders

**Prozesse & Dienste:**
list_processes, kill_process, list_services, control_service, list_autostart, launch_app, run_command

**Desktop-Automation:**
control_window, send_keys, click_at, move_mouse, drag_drop, click_element, read_screen, watch_screen

**Kommunikation:**
read_emails, mark_email, compose_email, read_calendar, create_appointment

**Aufgaben & Erinnerungen:**
add_task, list_tasks, complete_task, delete_task, set_alarm, list_alarms, delete_alarm, set_reminder, list_reminders, delete_reminder

**Gedächtnis & Lernen:**
remember, forget, list_memories, reflect_on_experiences

**Vision & Kamera:**
take_screenshot, describe_screen, describe_image, describe_webpage, list_cameras, capture_photo

**Text & Sprache:**
write_for_me, write_in_style, translate_text, summarize_text, correct_text

**Web & Netzwerk:**
search_web, web_search, fetch_url, get_weather, get_location, scan_network, list_connections, list_devices

**Medien:**
play_music, control_media, get_now_playing

**Drucker:**
list_printers, print_document, get_print_jobs, cancel_print_job

**Zwischenablage:**
get_clipboard, set_clipboard

**Konfiguration:**
create_setup, update_setting, create_rule, homework_mode, pause_ella

**Duplikate & Laufwerke:**
find_duplicates, rename_drive, format_drive

**Schach:**
open_chess_window

**Sonstiges:**
clean_temp, empty_recycle_bin

---

## Tests

| Zahl                      | Quelle                                |
| ------------------------- | ------------------------------------- |
| **389 Tests — alle grün** | `npm test` (Vitest), Stand 2026-10-25 |
| 6 Playwright-E2E-Suiten   | Separat, laufen nicht unter Vitest    |

---

## LLM-Modi (Provider-Setting)

| Wert               | Bedeutung                                                                    | Quelle                        |
| ------------------ | ---------------------------------------------------------------------------- | ----------------------------- |
| `"auto"` (Default) | Lokal zuerst (Ollama), OpenAI als Fallback bei Fehler — sofern Key vorhanden | `settings.ts:368–374`         |
| `"openai"`         | OpenAI bevorzugt, jeder Call über `openaiRequest()`                          | `cloudFirst()`                |
| `"ollama"`         | Nur lokal, kein OpenAI auch als Fallback                                     | `cloudAllowed()` gibt `false` |

**`cloudAllowed()`**: `provider !== "ollama" && Boolean(openaiApiKey) && !offlineMode`
**`cloudFirst()`**: `provider === "openai" && cloudAllowed()`

---

## Cloud-Gateway & Offline-Modus

- **Zentrale Funktion:** `openaiRequest()` in `services/openai.ts` — alle OpenAI-Calls laufen hierüber
- **Cloud-Zähler:** Jeder Call wird in `system_events` mit `purpose`, `endpoint`, `profile_id` geloggt
- **Dashboard:** `GET /api/events/cloud-today` → Kachel zeigt heutige Cloud-Anfragen
- **Offline-Modus** (`offlineMode`-Setting):
  - Sperrt: `search_web`, `web_search`, `fetch_url`, `get_weather`, `get_location`, `describe_webpage`
  - `cloudAllowed()` gibt `false` → kein OpenAI
  - Lizenz-Verify nutzt Cache
  - Nicht gesperrt: `scan_network`, `list_connections`, `list_devices` (lokal)

---

## Sprachausgabe (TTS)

| Sprache         | Engine                          | Stimme                                   | Quelle                                       |
| --------------- | ------------------------------- | ---------------------------------------- | -------------------------------------------- |
| **Deutsch**     | **Edge TTS** (Microsoft-Server) | de-DE-KatjaNeural                        | `tts.ts:60` — DE **nicht** in `KOKORO_LANGS` |
| **Englisch**    | Kokoro (lokal, ONNX)            | af_sarah / en-GB-SoniaNeural (Fallback)  | `tts.ts:60`, `kokoro.ts`                     |
| **Französisch** | Kokoro (lokal)                  | ff_siwis / fr-FR-DeniseNeural (Fallback) | `tts.ts:60`                                  |
| **Spanisch**    | Kokoro (lokal)                  | ef_dora / es-ES-ElviraNeural (Fallback)  | `tts.ts:60`                                  |

**`KOKORO_LANGS = new Set(["en", "fr", "es"])`** — Deutsch ausgeschlossen (Kokoro hat starken englischen Akzent für Deutsch)

**`activeTtsEngine(lang)`**: Single Source of Truth — prüft `isKokoroReady() && KOKORO_LANGS.has(lang)`

**Wichtig für Doku:** Deutsche Sprachausgabe ist NICHT lokal — der vorgelesene Text wird an Microsoft-Server übertragen (Edge TTS). Das muss in FAQ und Netzwerk-Seite transparent stehen.

---

## Spracherkennung (Whisper)

| Modus          | Engine                         | Modell                 | Quelle             |
| -------------- | ------------------------------ | ---------------------- | ------------------ |
| `cloudFirst()` | OpenAI Whisper API             | `whisper-1`            | `whisper.ts:60–78` |
| Lokal          | Xenova/transformers            | `Xenova/whisper-small` | `whisper.ts:29–56` |
| Fallback       | OpenAI (wenn `cloudAllowed()`) | `whisper-1`            | `whisper.ts:129`   |

---

## Hörmodi

| Wert         | Bedeutung                | Quelle           |
| ------------ | ------------------------ | ---------------- |
| `"off"`      | Kein Mikrofon            | `settings.ts:46` |
| `"manual"`   | Drücken zum Sprechen     | `settings.ts:46` |
| `"wakeword"` | Aktivierung durch "Ella" | `settings.ts:46` |
| `"always"`   | Freihand — immer aktiv   | `settings.ts:46` |

Zusätzlich in der UI (`Chat.tsx`):

- **Diktat-Modus** (`VoiceMode "dictation"`): Sprache → aktives Fenster
- **Stop-Wörter:** Stopp, Halt, Sei still, Ruhig, Leise, Quiet, Stop it, Shut up, Still
- **Follow-Up-Fenster:** 8 Sekunden nach TTS ohne erneutes Wakeword

---

## Diktat-Tastenkürzel

| Setting           | Default                      | Quelle                      |
| ----------------- | ---------------------------- | --------------------------- |
| `dictationHotkey` | `CommandOrControl+Alt+Space` | `settings.ts:85`, `main.ts` |

Registrierung in `main.ts` via `globalShortcut.register()`.

---

## Erscheinungsbilder

| Wert               | Beschreibung            | Quelle           |
| ------------------ | ----------------------- | ---------------- |
| `"calm"` (Default) | Standard-Dunkel         | `settings.ts:86` |
| `"hud"`            | Technisch / Cyan        | `settings.ts:86` |
| `"show"`           | Präsentation / Vollbild | `settings.ts:86` |

**Akzentfarben (nur HUD):** `cyan`, `violett`, `bernstein` (`hudAccent`-Setting)

**Automatischer Rückfall** (`resolveAppearance()` in `useAppearance.ts`):

- Blindmodus → `calm`
- Hausaufgabenmodus → `calm`
- `prefers-reduced-motion` → `calm`
- Priorität: blind > homework > reduced_motion > gewähltes Erscheinungsbild

---

## Sicherheit der lokalen API

| Maßnahme         | Detail                                  | Quelle                  |
| ---------------- | --------------------------------------- | ----------------------- |
| Loopback-Binding | `127.0.0.1` — nur lokal erreichbar      | `index.ts:115`          |
| Per-Start Token  | `randomBytes(32)` in Electron `main.ts` | `middleware/apiAuth.ts` |
| CORS             | Nur `http://localhost:5173`             | `middleware/apiAuth.ts` |
| Health-Ausnahme  | `GET /api/health` ohne Token            | `middleware/apiAuth.ts` |

---

## Schwärzen (`redact.ts`)

Regex-basiert vor dem Speichern: API-Keys, Bearer-Tokens, GitHub-PATs, Passwörter, IBANs, Kreditkartennummern.
Integriert in: `remember()`, `extractAndRemember()`, `recordClipboard()`.

---

## Profile & PIN

- PBKDF2 + Salt (100.000 Iterations) für PIN-Hash
- Session-Token via `POST /api/profiles/:id/verify-pin`
- Profil-isoliertes Gedächtnis

---

## Gestensteuerung

| Detail                                                      | Quelle                 |
| ----------------------------------------------------------- | ---------------------- |
| MediaPipe Tasks Vision                                      | `gestureEngine.ts:67`  |
| CDN: `cdn.jsdelivr.net/npm/@mediapipe/tasks-vision`         | `gestureEngine.ts:67`  |
| Modell: `hand_landmarker.task` von `storage.googleapis.com` | `gestureEngine.ts:110` |

**Netzwerk-Download:** Modell wird beim ersten Aktivieren von Google-Servern geladen — nicht offline verfügbar ohne Vorab-Download.

---

## Multi-Agenten-Pipeline

- **Nur OpenAI** — `pipeline.ts:122`: `if (!cloudAllowed()) throw new Error("Multi-Agenten benötigen den Cloud-Modus")`
- Alle Calls über `openaiRequest()` — kein Ollama-Support für Pipelines
- 2 vordefinierte: Morgenbriefing (3 Agenten), System-Report (4 Agenten)

---

## Gedächtnis

| Tabelle             | Zweck                                                            | Quelle               |
| ------------------- | ---------------------------------------------------------------- | -------------------- |
| `memories`          | Vektor-Suche (nomic-embed-text, cosine ≥85% Duplikat-Prävention) | `services/memory.ts` |
| `knowledge_triples` | Subjekt/Prädikat/Objekt-Graph                                    | `services/memory.ts` |
| `learning_examples` | Few-Shot aus positivem Feedback (👍)                             | `services/memory.ts` |

Hybrid-Recall: Cosine + Graph-Traversal.

---

## Backup / Export

- `GET /api/backup/export`: Memories, Rules, Alarms, Tasks, Setups als JSON
- `POST /api/backup/import`: Import mit Merge-Logik
- Quelle: `routes/backup.ts`

---

## Hardware-Tiers (Onboarding)

| Tier                   | Quelle                                     |
| ---------------------- | ------------------------------------------ |
| `"small"`              | `ModelSelectOverlay.tsx`, `settings.ts:73` |
| `"standard"` (Default) | `settings.ts:73`                           |
| `"balanced"`           | `settings.ts:73`                           |
| `"large"`              | `settings.ts:73`                           |

---

## Duplikat-Analyse: `docs/` vs `docs/deutsch/`

| Datei                  | Identisch?                                      | docs/deutsch/ Zeilen | docs/ Zeilen |
| ---------------------- | ----------------------------------------------- | -------------------- | ------------ |
| bedienungsanleitung.md | **NEIN**                                        | 1243                 | 1037         |
| capabilities.md        | **NEIN** (gleiche Zeilenzahl, Inhalt weicht ab) | 254                  | 254          |
| faq.md                 | **NEIN**                                        | 834                  | 836          |
| architecture.md        | **NEIN**                                        | —                    | —            |
| history.md             | **NEIN**                                        | —                    | —            |
| roadmap.md             | **NEIN**                                        | —                    | —            |
| update-roadmap.md      | **NEIN**                                        | —                    | —            |
| database.md            | identisch                                       | —                    | —            |
| directive.md           | identisch                                       | —                    | —            |
| hardware.md            | identisch                                       | —                    | —            |
| roadmap-strategic.md   | identisch                                       | —                    | —            |
| the-future-of-ella.md  | identisch                                       | —                    | —            |
| installer-workplan.md  | identisch                                       | —                    | —            |

**Entscheidung nötig (Andre):** `docs/deutsch/` ist laut Arbeitsanweisung führend. Die abweichenden Root-Duplikate sollten entweder entfernt oder durch einen Verweis ersetzt werden.

**Zusätzlich nur in `docs/`:** `changelog.md` (kein Pendant in `docs/deutsch/`)

---

## Netzwerkverbindungen (Zusammenfassung für Schritt 3)

| Verbindung                 | Wann                          | Wohin                     | Was wird gesendet                                                                                  | Abschaltbar                                     |
| -------------------------- | ----------------------------- | ------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Lizenzprüfung              | App-Start                     | `49.13.26.248:3010`       | SHA256(hostname+CPU+MACs), Lizenzkey                                                               | Offline-Cache                                   |
| Edge TTS (Deutsch)         | Bei Sprachausgabe auf Deutsch | Microsoft-Server          | Vorgelesener Text                                                                                  | Nein (kein lokales Deutsch-TTS)                 |
| Kokoro-Modell              | Erster Start                  | HuggingFace Hub           | Download ~80 MB                                                                                    | Offline-Installer hat Vorab-Bundle              |
| Whisper-Modell             | Erster lokaler STT-Aufruf     | HuggingFace               | `Xenova/whisper-small` ~150 MB                                                                     | Einmaliger Download                             |
| Ollama-Modelle             | Bei Modellwahl                | Ollama-Registry           | Modell-Download                                                                                    | Einmalig                                        |
| MediaPipe Hand             | Gesten-Aktivierung            | jsdelivr + Google Storage | `hand_landmarker.task` ~5 MB                                                                       | Einmalig                                        |
| OpenAI API                 | Nur mit eigenem Key + Modus   | `api.openai.com`          | Chat/Whisper/Vision-Anfragen                                                                       | Provider auf "ollama" setzen oder Key entfernen |
| DuckDuckGo                 | `search_web` Tool             | `duckduckgo.com`          | Suchbegriff                                                                                        | Tool nicht aufrufen                             |
| Wetter/Standort            | `get_weather`/`get_location`  | Diverse APIs              | Ort/IP                                                                                             | Tool nicht aufrufen                             |
| Google APIs                | Nur wenn verbunden            | `googleapis.com`          | Gmail/Kalender-Daten                                                                               | Google-Verbindung trennen                       |
| Offline-Modus sperrt       | —                             | —                         | search_web, web_search, fetch_url, get_weather, get_location, describe_webpage + alle OpenAI-Calls | `offlineMode`-Setting                           |
| Offline-Modus sperrt NICHT | —                             | —                         | Edge TTS (Deutsch), Lizenzprüfung (nutzt Cache), LAN-Tools                                         | —                                               |

---

## Directive

**Genau vier Verbote** (nicht fünf, nicht sechs):

1. **harm** — kein physischer, finanzieller, psychologischer oder datenbezogener Schaden
2. **conceal** — keine Verschleierung von Aktionen, Fähigkeiten oder Systemzuständen
3. **surveil** — keine Überwachung ohne ausdrückliches Wissen und aktive Zustimmung
4. **exfiltrate** — keine Datenweitergabe an Dritte ohne ausdrückliche Zustimmung

**Hierarchie:** Directive Layer → DIRECTIVE_DENY → Deny Rules → Allow Rules → Tool Execution

**Repo:** `github.com/AndreZ1971/The-E.L.L.A.-Directive-` — **öffentlich** (nicht privat!)

**Bisheriger Doku-Fehler:** Einige Dateien listen fünf Regeln (No Deception, Default-Deny, User Supremacy …) — das sind alte Entwürfe, nicht die aktuelle Architektur.
