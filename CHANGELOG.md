# Changelog — E.L.L.A.

Entwicklungsverlauf seit der ersten öffentlichen Version. Neue Funktionen sind mit **(neu)** gekennzeichnet.

---

## [1.4.0] — September 2026

### Neue Funktionen

- **(neu) Schach-Fenster** — `open_chess_window`-Tool öffnet ein rahmenloses Electron-Fenster mit 4 Brett-Themes (ELLA/Holz/Nacht/Grün), Ambient-Glow und Partikel-Hintergrund
- **(neu) 3D-Schachfiguren** — alle 32 Figuren als SVG mit radialen Farbverläufen und Drop-Shadow; kein externes Asset-Bundle
- **(neu) Schach-KI** — chess.js liefert legale UCI-Züge → LLM wählt; Starter-Memories + strategische Reflexion nach Spielende in ELLAs Gedächtnis
- **(neu) Schach-Kommentar** — fire-and-forget nach jedem ELLA-Zug über `proactive_message` SSE + TTS
- **(neu) Geschlagene Figuren & Materialvorteil** — Unicode-Symbole über/unter dem Brett, `+N`-Anzeige
- **(neu) Pause/Resume** — Spielstand (FEN + Züge) in `localStorage`, "▶ Weiter"-Button beim nächsten Öffnen
- **(neu) Gedächtnis-Browser** — vollständige UI zum Durchsuchen, Filtern und Verwalten aller ELLA-Memories (Typ-Filter, Freitext-Suche, Paginierung)
- **(neu) Knowledge-Graph** — D3 Force-Directed Graph visualisiert semantische Verbindungen zwischen Erinnerungen (Cosinus-Ähnlichkeit aus Embeddings)
- **(neu) Hardware-Detail-Tools** — `get_gpu_info`, `get_ram_details`, `get_drive_details`, `get_audio_devices`, `get_usb_devices`; alle via Get-CimInstance, Windows 11 22H2+ kompatibel
- **(neu) Backup & Restore** — JSON-Export aller Daten (Memories, Regeln, Wecker, Aufgaben, Setups); Import mit Merge- oder Ersetzen-Modus; eigener Tab in den Einstellungen
- **(neu) i18n vollständig** — alle verbleibenden hardkodierten Strings in Chat.tsx, Dashboard.tsx und Memories.tsx durch `t()`-Aufrufe ersetzt; Memories-Sektion neu in de.json/en.json
- **(neu) Dokument-Wissens-Graph** — Knowledge-Graph zeigt optional Dokument-Knoten (hellblau) mit gestrichelten Kanten zu semantisch ähnlichen Memories; Toggle-Button "📄 Dokumente einblenden" im Graph; Hover/Klick zeigt Dateiname, Pfad, Typ und Chunk-Anzahl
- **(neu) `list_indexed_folders`-Tool** — zeigt alle bekannten Ordner mit Statistik (Dateien, Chunks, letztes Update); ELLA weiß was sie kennt
- **(neu) Auto-Re-Index** — Worker indiziert täglich um 03:00 Uhr alle gespeicherten Ordner neu; bei neuen Dateien proaktive Chat-Nachricht
- **(neu) Ordner-Persistenz** — `index_documents` merkt sich den Ordner automatisch in den Settings; kein erneutes Angeben nötig

### Technisch

- Neue DB-Tabelle `chess_games`
- Neue API-Routen: `/api/chess/*`, `/api/backup/*`, `/api/memories/*`
- `GET /api/memories/graph?docs=1` — erweiterter Graph mit `docNodes` + `crossEdges`
- Tool `open_chess_window` + Regel 90; Hardware-Detail-Tools Regeln 91–95; `list_indexed_folders` Regel 107
- `stress_server.py` korrekt in `extraResources` eingetragen (Bugfix Installer)
- Desktop-Version auf `1.4.0` gebumpt

---

## [1.3.0] — September 2026

### Neue Funktionen

- **(neu) Setup-Aktionen** — Setups unterstützen jetzt beliebige ELLA-Tool-Calls als geordnete Schritte mit optionalem `delay_ms`; 7 Action-Templates (App öffnen, Lautstärke, Dark Mode, RAM freigeben, Pause, Clipboard, Übersetzen)
- **(neu) "▶ Jetzt"-Button** im Setup-Editor — `POST /api/setup/run` startet ein Setup direkt aus den Einstellungen ohne den Chat
- **(neu) Port-Events im Dashboard** — neue Ports erscheinen live unter System-Events mit Prozessname; Orange bei unbekanntem Prozess, kein Chat-Spam

### Bugfixes

- **WiFi-Erkennung** — `getWifiInfo()` nutzt jetzt `Get-NetConnectionProfile` statt textbasiertem `netsh`-Parsing; sprachunabhängig, adapter-agnostisch
- **TCP-Verbindungen zeigten 0** — PowerShell 5.1 kennt `??`-Operator nicht; behoben durch `if/else`-Syntax und `[int]`-Cast auf beiden Seiten der Prozess-Hashtable
- **Prozessname immer "Unknown"** bei Netzwerkverbindungen — `uint32` vs. `int`-Typkonflikt in der Hashtable behoben
- **Pipeline-Analyse-Qualität** — Loopback-Adressen ausgeblendet, "unbekannter Prozess" kein Verdachtsindikator mehr; explizite Schwellwerte (RAM >85%, Temp >85°C, Akku <15%)

---

## [1.2.0] — August 2026

### Neue Funktionen

- **(neu) Multi-Agenten-Pipeline** — parallele und sequenzielle Pipelines über OpenAI; 2 vordefinierte Pipelines: Morgenbriefing (Kalender + Aufgaben + Wetter) und System-Report (Speicher + Performance + Prozesse + Netzwerk)
- **(neu) Live-Streaming** — SSE-Events pro Agent (`agent_start`, `agent_chunk`, `agent_tool`, `agent_done`, `pipeline_done`); Synthese-Call nach allen Agenten
- **(neu) Setup-Integration in Pipeline** — nach Pipeline-Abschluss optional ein Setup ausführen; `setup_executed`-Event mit Ergebnis-Card in der UI
- **(neu) Multi-Agenten-Seite** — dedizierte `/pipeline`-Seite mit Pipeline-Karten, Live-Agent-Karten, Setup-Dropdown und Zusammenfassung

---

## [1.1.0] — Juli 2026

### Neue Funktionen

- **(neu) Tool-Selector** — pro Anfrage nur ~12 statt 85 Tools; 8 CORE-Tools immer aktiv + 20 Lazy Groups mit DE/EN-Regex; bis zu 90 % weniger Input-Tokens
- **(neu) Token-Optimizer** — Tool-Ergebnisse werden vor Kontexteinbettung komprimiert: JSON minify, Base64-Strip, Array-Truncation (max 50 Einträge)
- **(neu) Smarter Tool-Loop** — ab Runde 1 nur kontextrelevante Tools; Ollama-Bug behoben (`toolCallsBuffer` außerhalb des `while(true)`-Loops)

---

## [1.0.0] — Juni 2026

### Erstveröffentlichung

#### Kern-System

- Dual-LLM: Ollama (llama3.1:8b, offline) + OpenAI GPT-4o (optional)
- SSE-Streaming, Tool-Loop (max. 5 Runden), 85 Tools mit Handlern + Audit-Log
- Rule Engine: Direktive → DIRECTIVE_DENY → Deny → Allow; Directive-Denial UI (roter Badge)
- Per-Session Mutex gegen Race-Conditions

#### Gedächtnis & Profile

- ML-Gedächtnis: nomic-embed-text, Cosinus-Ähnlichkeit, 3 Typen (user/system/note)
- Nutzerprofile mit PBKDF2+Salt PIN-Hash, profil-isoliertes Gedächtnis
- Gesprächskompression ab 15 Nachrichten (Ollama-only)
- Fenster-Kontext: aktive App im Chat-Kontext (opt-in, Ollama-only)

#### Stimme & TTS

- Wakeword "ella" (Python/ONNX + openWakeWord)
- Kokoro TTS: lokale neuronale Stimme via `kokoro-js` (Node.js, kein Python nötig)
- MsEdgeTTS als Fallback
- Mehrsprachige Stimmen DE/EN/ES/FR: `af_sarah` / `bf_emma` / `ef_dora` / `ff_siwis`
- Onboarding-Stimmenauswahl mit Vorschau
- Stress-Erkennung: `stress_server.py` (Port 3004, numpy-only), opt-in

#### Produktivität

- Dateien: suchen (Windows Search Index), öffnen, Ordner erkunden
- Dokumente: Word/TXT erstellen, .docx/.pdf/.xlsx/.html lesen, Diktat
- Aufgabenliste, Wecker (DB-basiert), Erinnerungen (Task Scheduler)
- Musik: Bibliothek durchsuchen, Media Player öffnen
- Prozesse und Windows-Dienste verwalten
- Systemsteuerung: Lautstärke, Zwischenablage (+ 20-Einträge-Historie)
- Screenshot + GPT-4o Vision Analyse
- Schreibstil lernen aus E-Mail-Historie
- Textverarbeitung: Übersetzen, Zusammenfassen, Korrigieren
- Duplikat-Scanner, Autostart-Liste

#### Kommunikation

- Outlook COM: Mail lesen/markieren + Kalender lesen/erstellen + Entwurf verfassen
- Gmail + Google Calendar via OAuth 2.0

#### Proaktives Monitoring

- Hintergrund-Worker (60s): Disk/RAM/Ollama-Alerts, PnP, ARP, TCP, Firewall/WiFi/DNS, Alarm-Check
- Clipboard-Polling (3s): History + Mustererkennung (IBAN, Paketnummer, Telefon, URL, E-Mail)
- Comeback-Briefing, Meeting-Prep, Tagesabschluss, Pause-Reminder
- Rhythmus-Analyse (12 Uhr täglich), Duplikat-Scan (So 10 Uhr)

#### Barrierefreiheit

- Blind-Modus: TTS erzwungen, kein Markdown, Audio-Töne, ARIA-Labels
- Gehörlosenmodus: TTS + Mikrofon vollständig ausgeblendet

#### Infrastruktur

- 6-Schritt-Onboarding (EULA, Direktive, Hardware-Scan, Stimme, Standort)
- Hausaufgaben-Modus: SHA-256 PIN, nur per PIN beendbar
- i18n: DE/EN vollständig (react-i18next)
- Modell-Auswahl vor Download (`ModelSelectOverlay`)
- 254 Tests — alle grün (Vitest Unit + Integration)
- 13 Smoke Tests (PowerShell End-to-End)
- GitHub Actions CI mit MariaDB Service Container
- Installer: NSIS, MariaDB + Ollama + Node.js portable gebündelt

---

_E.L.L.A. · Proprietär · Alle Rechte vorbehalten_
