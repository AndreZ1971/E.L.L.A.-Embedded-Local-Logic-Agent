# E.L.L.A. — Changelog

Alle nennenswerten Änderungen je Release. Neueste Version zuerst.

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

Statt alle 85 Tools bei jeder Anfrage zu übertragen, analysiert ELLA die Anfrage und sendet nur die ~12 relevantesten Tools. Bis zu 90 % weniger Input-Tokens. 8 Kern-Tools sind immer aktiv, 20 Gruppen werden per DE/EN-Regex bedarfsweise zugeschaltet.

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
- 85 Tools mit vollständigen Handlern und Audit-Log
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
