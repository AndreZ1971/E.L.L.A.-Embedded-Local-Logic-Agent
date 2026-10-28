# Changelog -- E.L.L.A.

Entwicklungsverlauf seit der ersten öffentlichen Version. Neue Funktionen sind mit **(neu)** gekennzeichnet.

---

## [1.5.7] -- Oktober 2026

### Verbesserungen

- **Ollama 0.40.12** -- Upgrade von 0.24.0; verbessertes Tool-Calling, schnellere Inferenz
- **Modellwechsel qwen2.5:14b** -- ersetzt llama3.1:8b als Standard-Modell; besseres Deutsch, zuverlässigere Tool-Aufrufe
- **Flash Attention** -- bis zu 12x schnellere Prompt-Verarbeitung
- **KV-Cache-Quantisierung** -- reduzierter VRAM-Verbrauch bei minimalem Qualitätsverlust
- **Tool-Call-Robustheit** -- Fallback-Parser erkennt JSON-Tool-Calls im Textoutput und konvertiert sie in echte Aufrufe; Streaming-Buffer verhindert JSON-Flackern im Chat
- **Tool-Selector erweitert** -- Systemstatus-Anfragen ("PC status", "Rechner check") werden zuverlässig erkannt

---

## [1.5.6] -- Oktober 2026

### Neue Funktionen

- **(neu) HUD-Modus** -- technisches Erscheinungsbild mit Cyan/Violett/Bernstein-Akzent; Top Bar, Drei-Spalten-Layout, 8 konfigurierbare Widgets (System, Monitore, Aufgaben, E-Mails, Musik, Routinen, Directive, Uhr)
- **(neu) Präsentationsmodus** -- Vollbild mit Orb und letzter Antwort; sensible Daten automatisch ausgeblendet
- **(neu) Orb-Visualisierung** -- animierte Kugel mit 6 Zuständen (bereit, hört zu, denkt, spricht, Cloud, offline); Countdown-Ring für Follow-Up-Fenster
- **(neu) Über E.L.L.A. (Einstellungen)** -- Version, Update-Check, Lizenzstatus, Kontakt, Directive-Info, Support-Infos, Drittanbieter-Lizenzen
- **(neu) Drei Erscheinungsbilder** -- Standard (dunkel), HUD (technisch), Präsentationsmodus; umschaltbar in den Einstellungen
- **(neu) Performance-Drosselung** -- Animationen werden während LLM-Berechnungen reduziert; Canvas-FPS auf 20 limitiert
- **(neu) Lokale Schriften** -- Chakra Petch und JetBrains Mono als lokale Dateien, kein CDN nötig

---

## [1.5.5] -- Oktober 2026

### Verbesserungen

- **Diktat: Clipboard-Sicherung** -- Zwischenablage wird vor dem Einfügen gesichert und danach wiederhergestellt
- **Konfigurierbarer Diktat-Hotkey** -- Standard geändert auf Strg+Alt+Leertaste (vermeidet Konflikte mit Word, Chrome, VS Code)
- **Hotkey-Registrierung abgesichert** -- fehlgeschlagene Registrierung wird geloggt statt still zu scheitern
- **Diktat-Text nicht in Clipboard-Historie** -- Diktat-Einfügungen werden automatisch übersprungen

---

## [1.5.4] -- Oktober 2026

### Neue Funktionen

- **(neu) Diktat-Modus** -- Sprache wird transkribiert und direkt ins aktive Windows-Fenster getippt; systemweit, nicht nur in ELLA
- **(neu) Diktat-Rechtschreibkorrektur** -- optionale automatische Korrektur vor dem Tippen
- **(neu) Diktat-Hotkey** -- konfigurierbarer globaler Hotkey zum Umschalten des Diktat-Modus

---

## [1.5.3] -- Oktober 2026

### Neue Funktionen

- **(neu) Stop-Interrupt** -- Stopp-Wörter ("stopp", "halt", "sei still", "quiet", "shut up") brechen die Sprachausgabe sofort ab; funktioniert in Wakeword- und Always-Modus
- **(neu) Follow-Up-Fenster** -- 8 Sekunden nach einer Antwort kann ohne Wakeword direkt weitergesprochen werden

---

## [1.5.2] -- Oktober 2026

### Verbesserungen

- **Datenschutz: Schwärzen** -- sensible Daten (API-Keys, Passwörter, IBANs, Kreditkartennummern) werden vor dem Speichern in Memories und Clipboard-Historie automatisch entfernt
- **Ergebnis-Transparenz** -- ELLA kommuniziert Tool-Fehler klar statt "erledigt" zu sagen
- **(neu) Offline-Modus** -- sperrt alle Netzwerk-Funktionen, Cloud-Zugriff und nutzt Lizenz-Cache; lokale Netzwerk-Tools (LAN-Scan, Verbindungen) bleiben aktiv

---

## [1.5.1] -- September 2026

### Sicherheit

- **Loopback-Binding** -- API nur über localhost erreichbar, nicht im Netzwerk
- **Per-Start API-Token** -- zufälliger Token bei jedem Start, timing-safe Prüfung
- **PIN-geschützte Profile** -- zeitlich begrenzte Session-Tokens nach PIN-Eingabe
- **Cloud-Governance** -- alle OpenAI-Aufrufe über zentrale Funktion mit Prüfung und Protokollierung
- **Lokal-Zuerst-Muster** -- alle Dienste versuchen zuerst Ollama, dann OpenAI als Fallback
- **DuckDuckGo-Websuche** -- primäre Suchmaschine ohne API-Key; OpenAI nur als Fallback
- **Cloud-Zähler im Dashboard** -- zeigt Anzahl der Cloud-Anfragen pro Tag

---

## [1.5.0] -- September 2026

### Neue Funktionen

- **(neu) Knowledge Graph** -- Subjekt/Prädikat/Objekt-Triples automatisch aus Gesprächen extrahiert; kein zusätzlicher LLM-Aufruf
- **(neu) Hybrid-Recall** -- Cosinus-Suche kombiniert mit Graph-Traversal für tieferen Kontext
- **(neu) Dashboard-Graph** -- Relationen als lila gestrichelte Kanten mit Labels im Memory-Graph
- **(neu) Proactive Approval-Memory** -- 14 Kategorien; Auto-Mute nach 5x Wegdrücken; Dismiss- und Mute-Buttons an jeder proaktiven Nachricht
- **(neu) Memory-Deduplizierung** -- rückwirkende Bereinigung doppelter Erinnerungen; Button im Dashboard
- **(neu) Self-Learning** -- positives Feedback speichert Frage-Antwort-Paare als Beispiele für künftige Antworten
- **Regelbasierte Vorkompression** -- leere Nachrichten, Duplikate und lange Texte werden ohne LLM gekürzt
- **Token-Output-Limits** -- maximal 3000 Zeichen pro Tool-Ergebnis, 500 Zeichen pro JSON-String

---

## [1.4.0] -- September 2026

### Neue Funktionen

- **(neu) Schach-Fenster** -- rahmenloses Electron-Fenster mit 4 Brett-Themes, Ambient-Glow und Partikel-Hintergrund
- **(neu) 3D-Schachfiguren** -- alle 32 Figuren als SVG mit radialen Farbverläufen und Drop-Shadow
- **(neu) Schach-KI** -- LLM wählt aus legalen Zügen; Starter-Memories und strategische Reflexion nach Spielende
- **(neu) Schach-Kommentar** -- ELLA kommentiert live nach jedem eigenen Zug mit Persönlichkeit
- **(neu) Geschlagene Figuren und Materialvorteil** -- Anzeige über und unter dem Brett
- **(neu) Pause/Resume** -- Spielstand wird gespeichert, "Weiter"-Button beim nächsten Öffnen
- **(neu) Gedächtnis-Browser** -- UI zum Durchsuchen, Filtern und Verwalten aller Erinnerungen
- **(neu) Knowledge-Graph-Visualisierung** -- D3 Force-Directed Graph zeigt semantische Verbindungen
- **(neu) Hardware-Detail-Tools** -- GPU, RAM, Laufwerke, Audio-Geräte, USB-Geräte abfragen
- **(neu) Backup und Restore** -- JSON-Export und -Import aller Daten
- **(neu) Dokument-Wissens-Graph** -- Dokumente als Knoten im Knowledge-Graph
- **(neu) Auto-Re-Index** -- tägliche Neuindizierung gespeicherter Ordner um 03:00 Uhr

---

## [1.3.0] -- September 2026

### Neue Funktionen

- **(neu) Setup-Aktionen** -- beliebige ELLA-Werkzeuge als geordnete Schritte in Setups; 7 Action-Templates
- **(neu) "Jetzt"-Button** im Setup-Editor -- Setups direkt aus den Einstellungen starten
- **(neu) Port-Events im Dashboard** -- neue Netzwerk-Ports live angezeigt mit Prozessname

### Bugfixes

- WiFi-Erkennung sprachunabhängig gemacht
- TCP-Verbindungsanzeige unter PowerShell 5.1 repariert
- Prozessnamen bei Netzwerkverbindungen korrekt aufgelöst

---

## [1.2.0] -- August 2026

### Neue Funktionen

- **(neu) Multi-Agenten-Pipeline** -- parallele und sequenzielle Pipelines über OpenAI; Morgenbriefing und System-Report vordefiniert
- **(neu) Live-Streaming** -- Echtzeit-Events pro Agent im Chat
- **(neu) Setup-Integration** -- nach Pipeline-Abschluss optional ein Setup ausführen
- **(neu) Multi-Agenten-Seite** -- eigene Seite mit Pipeline-Karten und Live-Ansicht

---

## [1.1.0] -- Juli 2026

### Neue Funktionen

- **(neu) Tool-Selector** -- pro Anfrage nur ~12 statt 85 Werkzeuge; bis zu 90% weniger Token-Verbrauch
- **(neu) Token-Optimizer** -- Tool-Ergebnisse werden vor der Einbettung komprimiert
- **(neu) Smarter Tool-Loop** -- ab Runde 1 nur kontextrelevante Werkzeuge

---

## [1.0.0] -- Juni 2026

### Erstveröffentlichung

- Dual-LLM: Ollama (offline) + OpenAI (optional)
- 85 Werkzeuge mit Audit-Log
- Rule Engine mit Directive Layer
- ML-Gedächtnis mit Vektor-Embeddings und Nutzerprofilen
- Wakeword "ELLA", Kokoro TTS (EN/ES/FR lokal), Edge TTS (DE)
- Stress-Erkennung (opt-in)
- Dateien, Dokumente, Aufgaben, Wecker, Erinnerungen, Musik
- Outlook und Gmail Integration
- Hintergrund-Monitoring mit proaktiven Hinweisen
- Blind-Modus und Gehörlosenmodus
- 6-Schritt-Onboarding, Hausaufgaben-Modus, i18n (DE/EN)
- Windows NSIS-Installer mit allen Abhängigkeiten gebündelt

---

_E.L.L.A. -- Proprietär -- Alle Rechte vorbehalten_
