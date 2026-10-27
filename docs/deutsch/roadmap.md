# Roadmap — E.L.L.A. Entwicklungshistorie & offene Punkte

Stand: v1.5.6 (intern v3.10.0) · 2026-10-27

> **Hinweis:** Diese Datei nutzt interne Versionsnummern (v0.x–v3.x) aus der Entwicklungshistorie. Die öffentlichen Releases heißen v1.x (aktuell v1.5.6).

---

## Abgeschlossen

| Feature                         | Version   | Beschreibung                                                                             |
| ------------------------------- | --------- | ---------------------------------------------------------------------------------------- |
| Chat end-to-end                 | v0.0.3    | OpenAI + Ollama, Tool-Loop mit bis zu 5 Runden                                           |
| Tool-Call-Fix                   | v0.0.3    | `tool_call_id` korrekt weitergegeben, kein 400-Fehler mehr                               |
| Electron Desktop-App            | v0.0.3    | Natives Fenster, Minimize-to-Tray                                                        |
| SSE-Streaming                   | v0.0.4    | Text erscheint live während LLM antwortet, Tool-Status-Anzeige                           |
| MariaDB Session-Persistenz      | v0.0.4    | Verlauf in DB, überlebt API-Neustart, wird beim Start geladen                            |
| Frameless Window + Titlebar     | v0.0.5    | Eigenes Fenster ohne Browserchrome, violet Titelleiste, IPC                              |
| Production Build                | v0.0.5    | Vite baut nach dist/, Electron lädt ohne Dev-Server                                      |
| API als Child-Prozess           | v0.0.5    | Electron startet/stoppt API automatisch, wartet auf Port 3002                            |
| Autostart                       | v0.0.5    | app.setLoginItemSettings, Toggle im Tray-Menü, MariaDB auto                              |
| Dashboard                       | v0.1.0    | Status-Karten (LLM, Ollama, DB) + Disk-Balken, Auto-Refresh                              |
| Settings-Seite                  | v0.1.0    | Provider, Modell, Tools, Session-Limit, OpenAI API-Key                                   |
| Programme-Verwaltung            | v0.1.0    | System-Scan (Start-Menü), Checkbox-Liste erlaubt/verboten                                |
| Spracheingabe                   | v0.1.1    | 3 Modi: Aus / Manuell / Wakeword "ella", submit/cancel-Wörter                            |
| Setup-Shortcuts                 | v0.1.1    | load_setup-Tool, open[] + close[], dynamische Tool-Definitionen                          |
| Hausaufgaben-Modus              | v0.1.2    | PIN-Kiosk: aktivieren ohne PIN, deaktivieren mit PIN, SHA-256                            |
| ML-Gedächtnisebene              | v0.1.3    | nomic-embed-text, Cosinus-Suche, auto Extraktion, 3 Typen                                |
| GPU-Beschleunigung              | v0.1.4    | GTX 1060, CUDA 13.0, 14.6 t/s, Modell vollständig im VRAM                                |
| Sprachausgabe (TTS)             | v0.1.4    | window.speechSynthesis, Stimme einstellbar, MD-Stripping                                 |
| Bug-Sprint (10 Fixes)           | v0.1.5    | TS-Fehler, Tool-Registry, Settings-Persistenz, DB-Schema                                 |
| Code-Analyse Bug-Fixes          | v0.1.6    | HomeworkMode in loadSetup, Modell-Config, OpenAI tools[], fixes                          |
| enabledTools Migration Fix      | v0.1.7    | remember/forget/homework_mode in enabledTools nachgezogen                                |
| Stability Sprint                | v0.2.0    | Schema IF NOT EXISTS, Auto-Migration, list_running_processes weg                         |
| Rule Engine + Direktive         | v0.3.0    | Default-deny, Regeln-CRUD, Direktive hardcodiert, Regeln-Tab                             |
| Proaktives Monitoring           | v0.4.0    | Background-Worker, EventBus, SSE-Push, Dashboard-Feed, Toasts                            |
| Onboarding & Erster Start       | v0.4.1    | System-Scan, 3-Schritte-Flow, get_system_info Tool, App-Routing                          |
| Gesprächskonfiguration          | v0.5.0    | create_setup/update_setting/create_rule/free_ram + Notschalter                           |
| Mail & Kalender                 | v0.6.0    | read_emails/mark_email/read_calendar/create_appointment, Direktive unread-delete         |
| Installer & Deployment          | v1.0.0-rc | EULA-Screen, Setup-Check, nomic-Pull-SSE, electron-builder NSIS-Installer                |
| Datei-Ops + Diktat              | v2.9.0    | search_files, open_file, explore_folder, create_document, dictate_to_document            |
| WoW-Tools Sprint                | v3.0.0    | list_processes, kill_process, set_volume, clipboard, reminder, vision, write_for_me      |
| Gmail + Google Calendar         | v3.0.0    | OAuth 2.0, read_gmail/mark_gmail/read_google_calendar/create_google_appointment          |
| Musik + Duplikate               | v3.0.0    | play_music (Bibliothek-Suche), find_duplicates, list_autostart, compose_email            |
| Kokoro TTS + Nutzerprofile      | v3.1.0    | Lokale neuronale Stimme, PBKDF2+Salt, Profil-Isolation, Gedächtnis profilgebunden        |
| Aufgabenliste (MariaDB)         | v3.1.0    | add_task/list_tasks/complete_task/delete_task, persistente TODOs                         |
| Intelligenz-Features            | v3.1.0    | Gesprächskompression, Fenster-Kontext, Clipboard-Muster, Proaktive Nachrichten           |
| Feedback-Buttons                | v3.1.0    | Daumen hoch/runter, DB-only, nie in LLM-Kontext                                          |
| System Automation               | v3.2.0    | launch_app, control_window, send_keys, delete_file, manage_service, read_screen          |
| Confirm-Route generisch         | v3.2.0    | /api/confirm für beliebige \_confirmed-Tools, nicht nur format_drive                     |
| Mouse Control                   | v3.3.0    | move_mouse, click_at/confirmed, drag_drop/confirmed — BLOCKED_TITLES                     |
| Shell Runner                    | v3.3.0    | run_command/confirmed — 60+ gesperrte Muster, immer Bestätigung                          |
| Screen Monitor                  | v3.3.0    | watch_screen — OCR-Diff bis 30s, meldet Textänderungen                                   |
| Datei-Verwaltung                | v3.4.0    | read_file_content, rename_file, copy_file, create_folder — BLOCKED_PREFIXES              |
| System-Komfort                  | v3.4.0    | toggle_dark_mode, get_battery_status, get_temperatures, get_event_log, get_wifi_info     |
| Medien (WinRT)                  | v3.4.0    | control*media (VK_MEDIA*\*), get_now_playing (Windows.Media.Control)                     |
| KI-Textverarbeitung             | v3.4.0    | translate_text, summarize_text — Ollama/OpenAI, gleiche Provider-Logik                   |
| Semantischer OCR-Klick          | v3.4.0    | click_element — Screenshot → WinRT OCR → 3-Pass-Match → confirm                          |
| KI-Textkorrektur + Stil         | v3.5.0    | correct_text, write_in_style — Grammatikkorrektur und Schreibstil per Ollama/OpenAI      |
| Dienstverwaltung getrennt       | v3.5.0    | list_services + control_service als separate Tools (statt manage_service)                |
| Regeln auf IDs 1–85 erweit.     | v3.5.0    | Default-Regeln IDs 83–85 ergänzt; alarms-Tabelle + DB v3.5.0                             |
| Installer-Stabilität            | v1.1.0-rc | Worker-Tick vollständig async (psAsync), API crasht nicht mehr während Modell-Download   |
| ELLA App-Icon                   | v1.1.0-rc | Favicon als ICO (6 Größen, 16–256 px), Installer und Taskleiste konsistent               |
| Modell-Download-Banner          | v1.1.0-rc | Download läuft als Banner, blockiert nicht EULA; ELLA-Persönlichkeit während Pull        |
| API Auto-Restart                | v1.1.0-rc | Bis zu 5 Neustarts mit Exponential-Backoff (3–15s) bei API-Crash                         |
| Clipboard-Fehler unterdrückt    | v1.1.0-rc | PS try/catch + Fail-Counter (max 3), kein stderr-Spam mehr bei eingeschränktem Zugriff   |
| SSE Reconnect nach Sleep        | v1.1.0-rc | EventSource reconnectet automatisch nach Laptop-Sleep (onerror + visibilitychange)       |
| Mehrsprachige UI                | v1.1.0-rc | i18next DE/EN, Sprachauswahl als erster Onboarding-Screen vor EULA                       |
| ModelSelectOverlay              | v3.7.0    | Hardware-Tier-Auswahl vor erstem Modell-Download, kein Auto-Download mehr                |
| Vollständige i18n               | v3.7.0    | react-i18next, alle UI-Komponenten DE/EN (Chat, Settings, Dashboard, Onboarding)         |
| Mehrsprachige TTS-Stimmen       | v3.8.0    | spokenLanguage (de/en/es/fr), Kokoro + MsEdgeTTS, ausschließlich weibliche Stimmen       |
| Onboarding Stimmenauswahl       | v3.8.3    | 4 weibliche Stimmen im Onboarding wählbar mit Vorschau, speichert spokenLanguage         |
| Stress-Erkennung                | v3.9.0    | stress_server.py Port 3004, numpy RMS/ZCR/Pitch, low/medium/high, opt-in                 |
| Barrierefreiheit Blind          | v3.9.0    | TTS erzwungen, kein Markdown, Audio-Töne, aria-live, Begrüßungsansage                    |
| Barrierefreiheit Gehörlos       | v3.9.0    | TTS + Mic ausgeblendet, visueller Banner, System-Prompt ohne TTS-Erwähnung               |
| Kokoro TTS (Node.js)            | v3.9.1    | kokoro-js npm-Paket, kein Python mehr für TTS, lazy-load aus HuggingFace Hub             |
| LLM Non-Gatekeeper              | v3.9.1    | System-Prompt-Regel verhindert Text-Ablehnung statt Directive-Banner                     |
| Smoke-Tests                     | v3.9.1    | scripts/smoke-test.ps1, 13 End-to-End-Tests gegen laufende Instanz                       |
| Token-Optimierung               | v1.1.0    | Tool-Selector (8 CORE + 20 Lazy Groups), Token-Optimizer (JSON minify, Array-Truncation) |
| Multi-Agenten-Pipeline          | v1.2.0    | Parallele/sequenzielle Pipelines mit OpenAI, SSE-Live-Streaming pro Agent                |
| Setup-Aktionen + Netzwerk       | v1.3.0    | Tool-Calls als Setup-Schritte, Port-Events im Dashboard, WiFi/TCP-Fix                    |
| Schach & visuelles Brett        | v1.4.0    | Rahmenloses Electron-Fenster, 3D-SVG-Figuren, LLM-KI, Reflexion nach Spielende           |
| Knowledge Graph + Gedächtnis    | v1.5.0    | Wissens-Tripel, Hybrid-Recall (Cosine + Graph), proaktive Approval-Memory, Self-Learning |
| Sicherheitspatch + Cloud-Gov    | v1.5.1    | Loopback-Binding, Per-Start API-Token, apiAuth-Middleware, cloudAllowed()/cloudFirst()   |
| Directive-Härtung + Datenschutz | v1.5.2    | Schwärzen sensibler Daten (redact.ts), Offline-Modus, Ergebnis-Transparenz               |
| Natürliches Gespräch            | v1.5.3    | Stop-Interrupt (Stopp-Wörter bei TTS), Follow-Up-Fenster (8s), EchoCancellation          |
| Diktat überall                  | v1.5.4    | Systemweites Diktieren, Whisper-Transkription → aktives Fenster, konfigurierbarer Hotkey |
| Diktat-Qualität + Hotkey        | v1.5.5    | Clipboard-Sicherung bei Diktat, konfigurierbarer Hotkey ohne Konflikte                   |
| HUD-Modus + Widgets             | v1.5.6    | 3 Erscheinungsbilder (calm/hud/show), Widget-System, Orb 6 Zustände, Über E.L.L.A.       |
| Website ella-agent.de           | v3.10.0   | Interaktive Demo-Website live, Chat mit OpenAI, Edge-TTS Sprachausgabe, HUD-Design       |

---

## Geplant

| Feature                | Beschreibung                                                                                                                                                                                                                                         |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gedächtnis ohne Grenze | Vektor-Index direkt in der Datenbank (MariaDB 11.8 LTS). E.L.L.A. durchsucht beim Erinnern alle Erinnerungen und Dokumente statt nur der neuesten 500 bzw. 2000. Schneller bei großen Gedächtnissen, Duplikat-Erkennung über das gesamte Gedächtnis. |

---

## Offen — Priorität 1 (hoher Mehrwert, Directive-konform)

| Feature                   | Beschreibung                                                                    |
| ------------------------- | ------------------------------------------------------------------------------- |
| Browser-Steuerung         | Chrome/Edge via DevTools Protocol — Tabs, Navigation, DOM-Zugriff               |
| Lokale Websuche           | SearXNG selbst-gehostet als DuckDuckGo-Fallback ohne externe API                |
| ~~Spracherkennung lokal~~ | ✅ Erledigt — Xenova/whisper-small lokal, OpenAI Whisper als Fallback (v1.5.0+) |
| Plugin-Verzeichnis        | Tool-Manifest-Format damit Nutzer eigene Tools registrieren können              |

---

## Offen — Priorität 2 (Qualität & Stabilität)

| Feature                | Beschreibung                                                              |
| ---------------------- | ------------------------------------------------------------------------- |
| Session-Persistenz     | Gesprächskontext überlebt API-Neustarts (heute: in-session nur)           |
| Multilingual UI        | Weitere Sprachen (FR, ES, …) + TTS-Stimme folgt Sprachauswahl             |
| Installer-Verbesserung | Auto-Update-Kanal, Delta-Updates                                          |
| Test-Coverage Ausbau   | Integration-Tests für neue v3.x-Services (fileManager, mediaControl etc.) |

---

## Nicht geplant (bewusste Entscheidung)

| Feature                 | Warum nicht                                                                                                                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Cloud-Hosting           | Lokale Ausführung ist Designprinzip                                                                                                                                                                                      |
| Multi-User-Netzwerk     | Nutzerprofile sind gerätlokal, kein Netzwerk-Sharing                                                                                                                                                                     |
| Docker-Deployment       | Direkte Windows-Integration ist der Kern — Docker abstrahiert das weg                                                                                                                                                    |
| Freie Shell ohne Box    | run_command existiert — aber sandboxed (60+ Muster, immer Bestätigung)                                                                                                                                                   |
| Kamera-Dauerüberwachung | Surveillance-Risiko — würde Verbot III (surveil) strukturell gefährden. Hinweis: Kamera-Zugriff auf Anfrage existiert (`list_cameras`, `capture_photo`) — einzelne Fotos mit sichtbarer Aktivierung, keine Daueraufnahme |
