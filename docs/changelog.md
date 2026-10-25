# E.L.L.A. — Changelog

Alle nennenswerten Änderungen je Release. Neueste Version zuerst.

---

## v1.5.6 — HUD-Modus & Erscheinungsbild

**Veröffentlicht:** Oktober 2026

### Neue Funktionen

#### Drei Erscheinungsbilder

- **Ruhig** (`calm`, Standard): klassisches dunkles Design
- **HUD** (`hud`): technisches Interface mit Cyan-Akzent, Telemetrie-Panels, System-Infos
- **Präsentation** (`show`): Vollbild-Modus mit nur Orb und letzter Antwort, Privat-Filter für sensible Daten

#### HUD-Modus im Detail

- Top-Bar mit Status-Chips (LOKAL/OFFLINE/CLOUD) statt Sidebar
- Vier Info-Panels: System (CPU/RAM/VRAM/Temp), Monitore, Routinen, Direktive
- Großer Orb mit 6 animierten Zuständen: bereit, hört, denkt, spricht, cloud, offline
- SVG-Ring-Overlay mit Countdown-Anzeige für das Follow-Up-Fenster
- Akzentfarben wählbar: Cyan, Violett, Bernstein

#### Weitere Verbesserungen

- Automatischer Rückfall auf "Ruhig" bei Blindmodus, Hausaufgabenmodus oder `prefers-reduced-motion`
- Lokale Schriften (Chakra Petch + JetBrains Mono) — kein CDN nötig
- Performance-Drosselung: Animationen werden beim Denken verlangsamt, Canvas pausiert bei unsichtbarem Tab
- Sofortiger Stilwechsel über Custom Event (kein 10s-Polling nötig)
- Telemetrie-API: `GET /api/system/telemetry` (CPU/RAM/VRAM/Disk/Temp), `GET /api/system/monitors`
- TTS-Engine-Erkennung korrigiert: `activeTtsEngine()` als Single Source of Truth

---

## v1.5.5 — Diktat-Qualität & Hotkey-Sicherheit

**Veröffentlicht:** Oktober 2026

- Clipboard-Sicherung beim Diktieren: Zwischenablage wird vor dem Einfügen gesichert und wiederhergestellt
- Konfigurierbarer Diktat-Hotkey (Standard: `Ctrl+Alt+Space`, vorher `Ctrl+Shift+D` — kollidierte mit Word/Chrome/VS Code)
- Hotkey-Registrierung abgesichert: fehlgeschlagene Registrierung wird geloggt
- API-Hotkey-Sync: Hotkey-Änderungen im Settings-UI aktualisieren sofort per IPC

---

## v1.5.4 — Diktat überall

**Veröffentlicht:** Oktober 2026

### Neue Funktionen

#### Diktat-Modus

Sprache wird transkribiert und direkt ins aktive Windows-Fenster getippt — systemweit, nicht nur in ELLA.

- Neuer Hörmodus "Diktat" neben Aus/Manuell/Wakeword/Freihand
- `POST /api/speech/dictate`: Audio → Whisper → optionale Rechtschreibkorrektur → Text ins Fenster
- Amber-Statusanzeige im Chat bei aktivem Diktat
- Electron Global Hotkey zum Umschalten (konfigurierbar)
- Optionale Rechtschreibkorrektur via `correctText()` vor dem Tippen

---

## v1.5.3 — Natürliches Gespräch

**Veröffentlicht:** September 2026

- **Stop-Interrupt:** ELLA stoppt die Sprachausgabe sofort bei Stop-Wörtern (Stopp, Halt, Sei still, Leise, Quiet, Stop it, Shut up)
- **Follow-Up-Fenster:** 8 Sekunden nach TTS-Ende kann ohne erneutes Wakeword gesprochen werden
- Echo-Cancellation verhindert Fehlauslösung durch eigene Sprachausgabe

---

## v1.5.2 — Directive-Härtung & Datenschutz

**Veröffentlicht:** September 2026

- **Schwärzen vor dem Speichern:** API-Keys, Bearer-Tokens, IBANs, Kreditkartennummern werden per Regex entfernt bevor sie in Gedächtnis oder Clipboard-History landen
- **Ergebnis-Transparenz:** System-Prompt erzwingt dass ELLA Tool-Fehler klar kommuniziert statt "erledigt" zu sagen
- **Offline-Modus:** Sperrt alle Web-Tools und OpenAI; lokale Netzwerk-Tools funktionieren weiterhin; Offline-Banner in der UI

---

## v1.5.1 — Sicherheitspatch & Cloud-Governance

**Veröffentlicht:** August 2026

### Sicherheit

- **Loopback-Binding:** API bindet auf `127.0.0.1` — nur lokal erreichbar
- **Per-Start API-Token:** `randomBytes(32)` bei jedem Start, `timingSafeEqual`-Prüfung
- **CORS:** Nur `http://localhost:5173` erlaubt

### Cloud-Governance

- **`openaiRequest()`:** Zentrale Funktion für alle OpenAI-Calls, prüft `cloudAllowed()`
- **Cloud-Zähler:** Jeder OpenAI-Call wird in `system_events` protokolliert (Dashboard-Kachel)
- **Drei Provider-Modi:** `auto` (lokal zuerst), `openai` (Cloud bevorzugt), `ollama` (nur lokal)
- **DuckDuckGo-Websuche:** Primäre Suchmaschine ohne API-Key; OpenAI Web Search nur als Fallback

---

## v1.5.0 — Knowledge Graph & Intelligentes Gedächtnis

**Veröffentlicht:** August 2026

### Neue Funktionen

#### Knowledge Graph

ELLA extrahiert automatisch Zusammenhänge aus Gesprächen als Subjekt/Prädikat/Objekt-Triples — ohne Extra-LLM-Call.

- Hybrid-Recall: Cosine-Suche + Graph-Traversal für tieferen Kontext
- Dashboard-Graph: Echte Relationen als Kanten im Memory-Graph (D3.js)

#### Proaktives Gedächtnis

- 14 Kategorien für proaktive Nachrichten, Auto-Mute nach 5x Wegdrücken
- Dismiss- und Mute-Buttons direkt an jeder proaktiven Nachricht
- `alarm` und `scheduled_setup` nicht stummschaltbar

#### Self-Learning

- Positives Feedback (👍) speichert Q&A-Paare als Few-Shot-Beispiele
- `recallExamples()` findet ähnliche Paare und injiziert sie in den System-Prompt
- Duplikat-Prävention (≥85% Cosine)

#### Weitere Verbesserungen

- Regelbasierte Pre-Compression: leere Nachrichten, Duplikate, lange Texte kürzen — kein LLM nötig
- Token-Output-Limits: Hard-Cap 3000 Zeichen pro Tool-Ergebnis
- Memory-Deduplizierung: rückwirkende Bereinigung mit 🧹-Button im Dashboard

---

## v1.4.0 — Schach & visuelles Brett-Erlebnis

**Veröffentlicht:** September 2026

### Neue Funktionen

#### Schach-Fenster

ELLA spielt Schach in einem eigenen rahmenlosen Electron-Fenster, das über `open_chess_window` aus dem Chat geöffnet wird.

- Eigenes Electron-Fenster mit ELLA-Design (dunkler Hintergrund, lila Akzent)
- Vier Brett-Themes wählbar: **ELLA** (lila), **Holz** (klassisch), **Nacht** (blau), **Grün**
- Ambient-Glow pulsiert wenn ELLA denkt, Partikel-Hintergrund
- Eigene Titelleiste mit Minimieren/Schließen (getrennt vom Hauptfenster)

#### 3D-Schachfiguren

Alle 32 Figuren als selbstgezeichnete SVG mit 3D-Optik — keine externen Assets nötig.

- Radiale Farbverläufe simulieren Lichteinfall von links oben
- Drop-Shadow per SVG-Filter für Tiefe
- Spekulares Highlight auf jeder Figur
- Lila-Weiß für Spieler-Figuren, Tief-Lila für ELLA

#### ELLAs Schach-KI

ELLA spielt über das konfigurierte LLM (Ollama oder OpenAI). Keine illegalen Züge möglich.

- chess.js liefert alle legalen UCI-Züge — LLM wählt einen davon, kein Halluzinieren
- Bis zu 3 Versuche, danach Zufalls-Fallback aus der legalen Liste
- Schach-Starter-Memories werden beim ersten Start eingespielt (Grundregeln, Prinzipien)
- Nach jeder Partie: `reflectOnGame` schreibt eine strategische Erkenntnis in ELLAs Gedächtnis

#### Kommentar & Kommunikation

ELLA kommentiert ihre Züge direkt im Chat — fire-and-forget, blockiert das Spiel nicht.

- Charakter-getreue Kommentare: provoziert, neckt, zeigt Respekt oder Überraschung
- Geht über `proactive_message` SSE in den Chat und wird vorgelesen (TTS)

#### Geschlagene Figuren & Materialvorteil

Unter und über dem Brett werden die geschlagenen Figuren beider Seiten angezeigt.

- Unicode-Symbole (♙♘♗♖♕ / ♟♞♝♜♛), sortiert nach Wert
- Materialvorteil als `+N` wenn eine Seite führt
- Punkte-Dot leuchtet auf für die Seite die am Zug ist

#### Pause & Weiter spielen

Partien können pausiert und später fortgesetzt werden — auch nach App-Neustart.

- "⏸ Pause" speichert FEN, Züge und gameId in `localStorage`
- Beim nächsten Öffnen: gespeicherte Partie erkannt, "▶ Weiter"-Button prominent
- Spielende (Schachmatt, Remis, Aufgeben) löscht den Speicherstand automatisch

#### Gedächtnis-Browser

Neue Seite `/memories` zum Durchsuchen, Filtern und Verwalten aller ELLA-Erinnerungen.

- Volltext-Suche und Typ-Filter (user / system / note) gleichzeitig anwendbar
- Paginierung mit Hover-Vorschau des Vollinhalts
- Einzelne Erinnerungen direkt löschen

#### Knowledge-Graph

Semantischer Wissens-Graph als zweiter Tab auf der Memories-Seite — jetzt mit optionaler Dokument-Ebene.

- D3 Force-Directed Graph — Knoten = Memories, Kanten = semantische Ähnlichkeit (Cosinus-Ähnlichkeit aus Embeddings)
- Toggle-Button **"📄 Dokumente einblenden"** oben rechts lädt Dokument-Knoten (hellblau) zusätzlich
- Gestrichelte Kanten verbinden Memories mit semantisch ähnlichen Dokumenten (Cosinus ≥ 0.4)
- Hover/Klick auf Dokument-Knoten zeigt Dateiname, vollständigen Pfad, Dateityp und Chunk-Anzahl
- Hover zeigt Inhalt, Typ und Ähnlichkeitswert der Verbindung
- Graph aktualisiert sich beim Tab-Wechsel automatisch

#### Hardware-Detail-Tools

Fünf neue Tools für detaillierte Hardware-Informationen:

- `get_gpu_info` — Grafikkarten-Details (Modell, VRAM, Treiber, Status)
- `get_ram_details` — RAM-Sticks einzeln (Kapazität, Geschwindigkeit, Typ, Hersteller, Slot)
- `get_drive_details` — alle Laufwerke (Größe, Typ SSD/HDD, Schnittstelle, Seriennummer)
- `get_audio_devices` — Ein- und Ausgabegeräte mit Status
- `get_usb_devices` — angesteckte USB-Geräte mit DeviceID

Alle via `Get-CimInstance`, vollständig Windows 11 22H2+ kompatibel.

#### Backup & Restore

Vollständige Datensicherung und -wiederherstellung über einen neuen Tab in den Einstellungen.

- **Export**: JSON-Download mit allen Memories, Regeln, Weckern, Aufgaben und Setups
- **Import (Zusammenführen)**: neue Einträge werden hinzugefügt, bestehende bleiben erhalten; Memories werden anhand des Inhalts dedupliziert
- **Import (Ersetzen)**: alle vorhandenen Daten werden zuerst gelöscht, dann der Backup-Stand vollständig wiederhergestellt
- Transaktionssicherer Import über MariaDB-Connection mit Rollback bei Fehler

#### i18n vollständig

Alle verbleibenden hardkodierten Strings durch `t()`-Aufrufe ersetzt. Neue Key-Gruppe `memories` in de.json/en.json. Interpolation-Keys für Dashboard-Port-Events.

#### Dokument-RAG — Erweiterungen

Das Dokumenten-Indizierungssystem wurde um drei Funktionen ergänzt, die ELLA zur echten Projekt-Assistentin machen.

**`list_indexed_folders`-Tool** — ELLA zeigt auf Nachfrage alle indizierten Ordner mit vollständiger Statistik: Anzahl der Dateien, Anzahl der Chunks und wann der Ordner zuletzt aktualisiert wurde. Damit weiß der Nutzer jederzeit, was ELLA kennt.

**Auto-Re-Index** — Der Background-Worker prüft täglich um 03:00 Uhr alle gespeicherten Ordner auf neue oder geänderte Dateien und indiziert sie automatisch nach. Unveränderliche Dateien werden übersprungen. Bei neuen Funden sendet ELLA eine proaktive Chat-Nachricht mit der Anzahl neuer Dateien.

**Ordner-Persistenz** — `index_documents` speichert den Ordnerpfad ab sofort automatisch in den Settings. Der Nutzer muss den Pfad nicht erneut angeben — ELLA erinnert sich.

### Technisch

- Neue DB-Tabelle `chess_games` (FEN, Züge, Status, Gewinner, Zug-Zähler)
- Neue API-Routen: `POST /api/chess/*`, `/api/backup/*`, `/api/memories/*`
- `GET /api/memories/graph?docs=1` — erweiterter Graph-Endpunkt mit `docNodes` + `crossEdges`
- Tool `open_chess_window` + Default-Regel ID 90; Hardware-Detail-Tools Regeln 91–95; `list_indexed_folders` Regel 107
- Chess-IPC getrennt vom Hauptfenster: `chess:minimize`, `chess:close`
- `stress_server.py` korrekt in `extraResources` eingetragen (Installer-Bugfix)
- Desktop `package.json` Version auf `1.4.0` gebumpt

---

## v1.3.0 — Setup-Aktionen & Netzwerk-Transparenz

**Veröffentlicht:** September 2026

### Neue Funktionen

#### Setup-Aktionen — Workflow-Makros

Setups können jetzt beliebige ELLA-Tool-Calls als geordnete Schritte enthalten, nicht nur "Apps öffnen/schließen". Damit werden Setups zu echten Automatisierungs-Makros.

- Aktionen werden sequenziell nach dem Öffnen/Schließen der Apps ausgeführt
- Unterstützte Aktionen über Templates: App öffnen, Lautstärke setzen, Dark/Light Mode, RAM freigeben, ELLA pausieren, Zwischenablage setzen, Text übersetzen
- Jede Aktion kann mit einer optionalen **Verzögerung** (delay_ms) versehen werden — z. B. 3 Sekunden warten bevor die Lautstärke gesetzt wird
- Die Aktionsliste zeigt Tool-Name, Bezeichnung und Verzögerung auf einen Blick

#### "Jetzt ausführen"-Button im Setup-Editor

Setups können jetzt direkt aus den Einstellungen heraus gestartet werden — ohne den Chat öffnen zu müssen. Grüner "▶ Jetzt"-Button neben dem Löschen-Button im Setup-Editor. Während der Ausführung wechselt er auf ⏳.

#### Port-Ereignisse im Dashboard

Wenn ein neuer Port auf dem System geöffnet wird, erscheint ein Eintrag unter **System-Events (Live)** im Dashboard mit Port-Nummer und zugehörigem Prozessnamen — ohne den Chat zu belasten.

### Bugfixes

- **WiFi-Erkennung** komplett neu geschrieben: verwendet jetzt `Get-NetConnectionProfile` statt textbasiertem `netsh`-Parsing. Funktioniert sprachunabhängig (deutsch/englisch Windows) und für alle Verbindungstypen (WLAN, Hotspot, USB-Tethering).
- **TCP-Verbindungen zeigten immer 0**: PowerShell 5.1 kennt den `??`-Null-Coalescing-Operator nicht — `list_connections` gab deswegen immer eine leere Liste zurück. Behoben durch PS 5.1-kompatible `if/else`-Syntax und korrekten `[int]`-Cast bei Hashtable-Keys.
- **Prozessname immer "Unknown"** bei Netzwerkverbindungen: `Get-NetTCPConnection.OwningProcess` ist `[uint32]`, `Get-Process.Id` ist `[int]` — unterschiedliche Typen fanden keinen Eintrag in der Hashtable. Behoben durch einheitlichen Cast auf beiden Seiten.
- **Pipeline-Analyse**: Loopback-Adressen (127.x.x.x, ::1) werden nicht mehr gemeldet. "Prozessname unbekannt" wird nicht mehr als Verdachtshinweis gewertet. Schwellwerte für RAM (>85%), Temperatur (>85°C) und Akku (<15%) jetzt explizit definiert statt vager "auffällig"-Formulierungen.

---

## v1.2.0 — Multi-Agenten-Pipeline

**Veröffentlicht:** August 2026

### Neue Funktionen

#### Parallele KI-Agenten

Mehrere spezialisierte KI-Agenten arbeiten gleichzeitig an einer Aufgabe und liefern ihre Ergebnisse in einer gemeinsamen Synthese.

- Live-Streaming: jeder Agent zeigt seine Ausgabe in Echtzeit
- Zwei vordefinierte Pipelines: **Morgenbriefing** (Kalender, Aufgaben, Wetter) und **System-Report** (Speicher, Performance, Prozesse, Netzwerk)
- Optional: nach Pipeline-Abschluss ein App-Setup starten
- Voraussetzung: OpenAI API-Key

#### Setup-Integration in der Pipeline

Nach Abschluss einer Pipeline kann direkt ein konfiguriertes Setup ausgeführt werden. Ergebnis erscheint als Ergebnis-Card in der UI.

#### LLM-Provider-Label

In der gesamten UI heißt der Cloud-Provider jetzt einheitlich "OpenAI" statt "OpenAI GPT-4o".

---

## v1.1.0 — Token-Optimierung

**Veröffentlicht:** Juli 2026

### Neue Funktionen

#### Tool-Selector

Statt alle 111 Tools bei jeder Anfrage zu übertragen, analysiert ELLA die Anfrage und sendet nur die ~12 relevantesten Tools. Bis zu 90 % weniger Input-Tokens. 8 Kern-Tools sind immer aktiv, 20 Gruppen werden per DE/EN-Regex bedarfsweise zugeschaltet.

#### Token-Optimizer

Tool-Ergebnisse werden vor dem Einbetten in den Kontext komprimiert: JSON minifiziert, Base64 entfernt, Arrays auf maximal 50 Einträge gekürzt. Der inhaltliche Mehrwert bleibt vollständig erhalten.

#### Smarter Tool-Loop

Ab Runde 1 des Tool-Loops werden nur noch kontextrelevante Tools angeboten. Ollama-Bug behoben: `toolCallsBuffer` wurde falsch innerhalb der `while(true)`-Schleife deklariert und verlor pro Runde seinen Zustand.

---

## v1.0.0 — Erstes Release

**Veröffentlicht:** Juni 2026

### Kern-System

- Dual-LLM: Ollama (llama3.1:8b, offline) + OpenAI GPT-4o (optional)
- SSE-Streaming für Echtzeit-Antworten
- Tool-Loop mit maximal 5 Runden
- 111 Tools mit vollständigen Handlern und Audit-Log
- Rule Engine: Direktive → Deny → Allow → Standard-Allow
- Directive-Denial UI: roter Badge bei Regelablehnung
- Per-Session Mutex gegen Race-Conditions bei parallelen Anfragen

### Gedächtnis & Nutzerprofile

- ML-Gedächtnis: nomic-embed-text, Cosine-Similarity, 3 Typen (user/system/note)
- Nutzerprofile mit PBKDF2+Salt PIN-Hash (100.000 Iterationen)
- Profil-isoliertes Gedächtnis und Gesprächskontext

### Sprache & Stimme

- Wakeword "ella" (Python/ONNX + openWakeWord)
- Kokoro TTS: lokale neuronale Stimme via kokoro-js (kein Python nötig)
- MsEdgeTTS als Fallback
- Mehrsprachige Stimmen: DE/EN/ES/FR — af_sarah, bf_emma, ef_dora, ff_siwis
- Onboarding-Stimmenauswahl mit Vorschau

### Produktivität

- Dateiverwaltung: suchen, öffnen, umbenennen, kopieren, Ordner erstellen
- Dokumente: Word + TXT erstellen, .docx/.pdf/.xlsx/.html lesen, Diktat
- Aufgabenliste: persistente TODOs in MariaDB
- Wecker und Erinnerungen via Windows Task Scheduler
- Musik: Bibliothek durchsuchen, Media Player steuern
- Prozesse und Windows-Dienste verwalten
- Systemsteuerung: Lautstärke, Zwischenablage, Screenshot + GPT-4o Vision
- Schreibstil lernen aus E-Mail-Historie
- Textverarbeitung: Übersetzen, Zusammenfassen, Korrigieren
- Duplikat-Scanner, Autostart-Liste

### Kommunikation

- Outlook COM: Mail lesen/markieren, Kalender lesen/erstellen, Entwurf verfassen
- Gmail + Google Calendar via OAuth 2.0

### Proaktives Monitoring

- Hintergrund-Worker (60s): Disk/RAM/Ollama-Alerts, PnP, Netzwerk, Alarm-Check
- Clipboard-Polling (3s): History + Mustererkennung (IBAN, Paketnummer, Telefon, URL, E-Mail)
- Comeback-Briefing, Meeting-Prep, Tagesabschluss, Pause-Reminder
- Rhythmus-Analyse (täglich 12 Uhr), Duplikat-Scan (sonntags 10 Uhr)

### Barrierefreiheit

- Blind-Modus: TTS erzwungen, kein Markdown, Audio-Töne als Feedback, ARIA-Labels
- Gehörlosenmodus: TTS + Mikrofon-Button vollständig ausgeblendet

### Infrastruktur

- 6-Schritt-Onboarding mit EULA, Direktive, Hardware-Scan, Stimme, Standort
- Auto-Migration: schema.sql idempotent, 85 Default-Regeln
- Hausaufgaben-Modus: SHA-256 PIN, nur per PIN beendbar
- i18n: DE/EN vollständig übersetzt (react-i18next)
- GitHub Actions CI mit MariaDB Service Container
- 254 Tests — alle grün (Vitest Unit + Integration)
- Smoke Tests: 13 End-to-End-Tests

---

_E.L.L.A. · Proprietär · Alle Rechte vorbehalten_
