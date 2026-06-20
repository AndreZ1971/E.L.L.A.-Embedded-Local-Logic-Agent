# E.L.L.A. — Häufig gestellte Fragen (FAQ)

Version 3.9.0 — Zuletzt aktualisiert: 2026-06-20

---

## Inhaltsverzeichnis

1. [Allgemein — Was ist ELLA?](#1-allgemein--was-ist-ella)
2. [Installation & erster Start](#2-installation--erster-start)
3. [KI-Modelle & LLM-Anbieter](#3-ki-modelle--llm-anbieter)
4. [Spracheingabe & Sprachausgabe](#4-spracheingabe--sprachausgabe)
5. [Wakeword & Freihand-Modus](#5-wakeword--freihand-modus)
6. [Musik & Medien](#6-musik--medien)
7. [Dateien & Laufwerke](#7-dateien--laufwerke)
8. [E-Mail & Kalender](#8-e-mail--kalender)
9. [Gedächtnis & Lernen](#9-gedächtnis--lernen)
10. [Proaktive Intelligenz](#10-proaktive-intelligenz)
11. [Sicherheit & Datenschutz](#11-sicherheit--datenschutz)
12. [Die E.L.L.A. Direktive](#12-die-ella-direktive)
13. [Nutzerprofile & PIN](#13-nutzerprofile--pin)
14. [Barrierefreiheit](#14-barrierefreiheit)
15. [Hausaufgaben-Modus](#15-hausaufgaben-modus)
16. [Einstellungen & Konfiguration](#16-einstellungen--konfiguration)
17. [Fehler & Fehlerbehebung](#17-fehler--fehlerbehebung)
18. [Technische Fragen (Entwickler)](#18-technische-fragen-entwickler)

---

## 1. Allgemein — Was ist ELLA?

### Was ist E.L.L.A.?

E.L.L.A. steht für **Embedded Local Logic Agent** — ein persönlicher KI-Assistent für Windows der vollständig auf deinem eigenen Rechner läuft. ELLA versteht natürliche Sprache und kann deinen Computer für dich bedienen: Apps starten, Dateien suchen, Musik abspielen, E-Mails verfassen, Termine nachschlagen, Wecker stellen und vieles mehr.

### Was macht ELLA besonders?

- **Läuft lokal:** Das KI-Modell läuft auf deinem Rechner — kein Cloud-Zwang, keine Datenübertragung
- **Lernt mit:** ELLA merkt sich Gewohnheiten und Präferenzen über ein Vektorspeicher-Gedächtnis
- **Handelt proaktiv:** ELLA schreibt von sich aus in den Chat wenn etwas wichtig ist — ohne dass du fragen musst
- **Versteht natürliche Sprache:** Du sprichst mit ELLA wie mit einem Menschen — kein Syntaxlernen nötig
- **Transparent:** ELLA zeigt jede Aktion an bevor sie ausgeführt wird und fragt bei gefährlichen Dingen nach
- **Unveränderliche Ethik:** Vier hardcodierte Verbote (Schaden, Verschleierung, Überwachung, Datenweitergabe) können durch keine Einstellung umgangen werden

### Brauche ich Internet?

Für den **Grundbetrieb: nein.** Chat, Spracheingabe, Musik, Dateisuche, Systemsteuerung — alles läuft offline.

Internet ist nur für folgendes nötig:

- Web-Suche und Wetter
- OpenAI-Funktionen (GPT-4o, Whisper, Vision)
- Gmail und Google Calendar (OAuth)
- Microsoft Edge TTS (Sprachausgabe — kann durch lokales Kokoro TTS ersetzt werden)

### Auf welchen Systemen läuft ELLA?

ELLA läuft auf **Windows 10 und Windows 11 (64-Bit)**. Eine Mac- oder Linux-Version ist nicht geplant.

### Ist ELLA kostenlos?

ELLA ist proprietäre Software. Der Installer erfordert einen Lizenzschlüssel (`ELLA-XXXX-XXXX-XXXX-XXXX`). Der Quellcode ist auf GitHub zu Demonstrationszwecken einsehbar.

---

## 2. Installation & erster Start

### Wie installiere ich ELLA?

1. `E.L.L.A Setup 1.0.0-rc.exe` herunterladen und ausführen
2. Installationspfad wählen (Standard: `C:\Programme\E.L.L.A`)
3. Installation abwarten — alle Abhängigkeiten werden automatisch eingerichtet
4. ELLA über das Desktop-Symbol starten

**Es ist nichts weiter nötig.** Der Installer enthält MariaDB, Ollama und Node.js als portable Binaries.

### Was passiert beim allerersten Start?

ELLA führt dich durch ein 6-schrittiges Onboarding:

1. **EULA** — Nutzungsbedingungen lesen und akzeptieren
2. **Lizenzaktivierung** — Lizenzschlüssel eingeben (Verbindung zum Lizenzserver nötig)
3. **Dein Name** — ELLA lernt wie sie dich ansprechen soll
4. **Die Direktive** — ELLA erklärt ihre vier unveränderlichen Verbote
5. **Hardware-Scan** — ELLA lernt deine Laufwerke kennen
6. **Stimme & Standort** — Sprachausgabe auswählen, Standort optional eingeben

### Muss ich Ollama separat installieren?

**Nein** — beim Installer-Build ist Ollama als portable Binary enthalten und wird automatisch gestartet. Im **Entwicklungsmodus** (Clone aus GitHub) musst du Ollama selbst installieren und das Modell laden:

```powershell
ollama pull llama3.1:8b        # Chat-Modell (~4,7 GB, einmalig)
ollama pull nomic-embed-text   # Gedächtnis-Modell (~274 MB, einmalig)
```

### ELLA startet aber zeigt einen Fehler-Banner. Was tun?

Der häufigste Grund ist, dass Ollama oder das KI-Modell noch nicht bereit ist. ELLA zeigt dazu einen orangenen Banner. Warte kurz — beim ersten Start wird das Modell automatisch geladen. Falls der Banner nach 2 Minuten nicht verschwindet:

- **Im Installer-Betrieb:** ELLA neu starten (Tray → Beenden → ELLA-Symbol doppelklicken)
- **Im Entwicklungsmodus:** `ollama list` prüfen ob `llama3.1:8b` geladen ist

---

## 3. KI-Modelle & LLM-Anbieter

### Welche KI-Modelle nutzt ELLA?

| Modell                      | Zweck                                  | Offline? |
| --------------------------- | -------------------------------------- | -------- |
| `llama3.1:8b` (Ollama)      | Chat, Textverarbeitung, Tool-Auswahl   | Ja       |
| `nomic-embed-text` (Ollama) | Gedächtnis (Vektor-Embeddings)         | Ja       |
| `GPT-4o` (OpenAI)           | Chat-Fallback, Vision, Schreibstil     | Nein     |
| `gpt-4o-mini` (OpenAI)      | Geräusch-/Stotterfilter (contextAlign) | Nein     |
| `whisper-1` (OpenAI)        | Präzisere Spracherkennung              | Nein     |

### Brauche ich einen OpenAI API-Key?

**Nein.** ELLA funktioniert vollständig ohne OpenAI. Mit einem Key werden folgende Funktionen besser oder überhaupt erst verfügbar:

- Schnellere und präzisere Antworten (GPT-4o statt llama3.1:8b)
- Screenshot-Analyse und Bildanalyse (GPT-4o Vision)
- Texte im persönlichen Schreibstil (nutzt E-Mail-Analyse mit GPT-4o)
- Hochwertigere Spracherkennung (OpenAI Whisper statt lokalem Modell)
- Geräusch- und Stotterfilter bei der Spracheingabe (gpt-4o-mini)

Den Key trägst du unter **Einstellungen → LLM → OpenAI API-Key** ein.

### Was ist der Unterschied zwischen Ollama und OpenAI bei ELLA?

|                      | Ollama                | OpenAI                                                      |
| -------------------- | --------------------- | ----------------------------------------------------------- |
| Kosten               | Kostenlos             | Pay-per-Use (~$0,006/min Whisper, GPT-4o-mini sehr günstig) |
| Datenschutz          | Alles bleibt lokal    | Daten gehen an OpenAI                                       |
| Geschwindigkeit      | Von Hardware abhängig | Schnell und konstant                                        |
| Fenster-Kontext      | Verfügbar             | Nicht verfügbar (Datenschutz)                               |
| Gesprächskompression | Verfügbar             | Nicht verfügbar                                             |
| Vision               | Nur mit LLaVA-Modell  | Immer verfügbar                                             |

### Was bedeutet "Provider: Auto"?

Im Auto-Modus wählt ELLA automatisch den besten verfügbaren Anbieter. Hat sie einen gültigen OpenAI-Key, nutzt sie OpenAI — sonst Ollama. Du kannst in den Einstellungen auch einen festen Anbieter erzwingen.

### ELLA antwortet nicht — was ist das KI-Modell-Problem?

Das häufigste Problem: `llama3.1:8b` ist nicht in Ollama geladen. Das erkennst du am orangenen Ollama-Banner.

**Lösung:**

```powershell
ollama pull llama3.1:8b
```

Das dauert einmalig ~20 Minuten (4,7 GB). Danach startest du ELLA neu.

### Kann ich ein anderes Ollama-Modell verwenden?

Ja — unter **Einstellungen → LLM → Ollama-Modell** kannst du jedes Modell eintragen das du in Ollama geladen hast (z.B. `mistral`, `phi3`, `gemma2`). Empfohlen wird `llama3.1:8b` — kleinere Modelle können bei komplexen Tool-Aufrufen Probleme machen.

---

## 4. Spracheingabe & Sprachausgabe

### Wie spreche ich mit ELLA?

Drei Wege stehen zur Verfügung:

1. **Text:** Tippe deine Nachricht und drücke Enter
2. **Mikrofon-Button:** Klicke das Mikrofon-Symbol im Chat für eine einmalige Aufnahme
3. **Wakeword:** Sage "Ella" — ELLA hört dann auf deinen Befehl (muss aktiviert werden)
4. **Freihand (Always-On):** ELLA hört permanent zu und reagiert auf alles was du sagst

### Brauche ich für die Spracheingabe Internet?

Die **Web Speech API** (Chromium built-in, Standard) braucht eine Internetverbindung da sie Microsoft/Google-Server nutzt.

Wenn du komplett offline bleiben möchtest: In den Einstellungen kannst du auf lokale Spracherkennung (Whisper-small, läuft auf deinem Rechner) umstellen — das braucht kein Internet, ist aber etwas langsamer.

### Was ist contextAlign und wozu ist es gut?

contextAlign ist ein Filter zwischen deiner Stimme und ELLA. Wenn du sprichst und im Hintergrund Musik läuft, der TV an ist oder du stotterst, erkennt ELLA das und filtert es heraus. Nur dein eigentlicher Befehl wird an ELLA gesendet.

**Beispiel:**

- Was du sagst: _"äh ella äh öffne öffne mal den Explorer is this the real life"_
- Was ELLA hört: _"Öffne den Explorer"_
- TV-Ton im Hintergrund → ELLA ignoriert es (KEIN_BEFEHL)

Dafür braucht ELLA entweder das Ollama-Modell oder einen OpenAI-Key.

### Wie aktiviere ich die Sprachausgabe (TTS)?

**Einstellungen → Modus → TTS** auf "An" stellen. ELLA liest dann alle Antworten, Alerts und proaktive Nachrichten automatisch vor.

Standard-Stimme: `de-DE-KatjaNeural` (Microsoft Edge Neural TTS, kostenlos, braucht Internet).

### Kann ELLA auch ohne Internet sprechen?

Ja — mit **Kokoro TTS**. Das ist eine lokale neuronale Stimme die deutlich natürlicher klingt als Windows-Standardstimmen.

Voraussetzung: Python 3.12 mit kokoro-onnx:

```powershell
py -3.12 -m pip install kokoro-onnx sounddevice numpy
```

Danach unter **Einstellungen → Modus → TTS-Engine** auf "Kokoro" umstellen.

### Kann ich die Stimme ändern?

Ja — unter **Einstellungen → Stimme → Gesprächssprache** wählst du aus 4 weiblichen Stimmen:

| Sprache  | Online (MsEdgeTTS) | Offline (Kokoro) |
| -------- | ------------------ | ---------------- |
| Deutsch  | Katja              | af_sarah         |
| English  | Sonia              | bf_emma          |
| Español  | Elvira             | ef_dora          |
| Français | Denise             | ff_siwis         |

Die Wahl gilt unabhängig davon in welcher Sprache du tippst oder sprichst.

### Kann ELLA erkennen ob ich gestresst bin?

Ja — mit der optionalen **Stress-Erkennung** unter **Einstellungen → Stimme → Stimmanalyse aktivieren**.

ELLA analysiert die Rohdaten deiner Stimme (Tonhöhe, Sprechtempo, Lautstärke) parallel zur Spracherkennung und passt bei erkannter Anspannung ihren Ton an. Bei starkem Stress fragt ELLA aktiv nach.

Die Analyse läuft vollständig lokal (`stress_server.py`, Port 3004) — keine Audiodaten verlassen das Gerät. Der Feature ist standardmäßig deaktiviert und muss bewusst eingeschaltet werden.

---

## 5. Wakeword & Freihand-Modus

### Was ist der Unterschied zwischen Wakeword und Freihand?

| Modus                    | Wie es funktioniert                                                            |
| ------------------------ | ------------------------------------------------------------------------------ |
| **Wakeword**             | ELLA hört auf das Schlüsselwort "Ella" und reagiert dann auf den nächsten Satz |
| **Freihand (Always-On)** | ELLA hört permanent zu und schickt alles was du sagst direkt in den Chat       |
| **Manuell**              | Du drückst den Mikrofon-Button — nur dann hört ELLA zu                         |

### Wie aktiviere ich das Wakeword?

**Einstellungen → Modus → Stimme** auf "Wakeword" stellen.

Das Wakeword läuft vollständig lokal (Python + openWakeWord + ONNX) — keine Audiodaten werden gesendet. Voraussetzung für den Entwicklungsmodus:

```powershell
py -3.12 -m pip install openwakeword onnxruntime soundfile
```

### Wie pausiere ich das Wakeword?

```
"Ella, mach 30 Minuten Pause"
"Pausiere für eine Stunde"
```

ELLA deaktiviert das Wakeword und meldet sich nach Ablauf der Zeit automatisch zurück.

### Hört ELLA immer zu — auch wenn ich privat telefoniere?

Im **Freihand-Modus (Always-On)** ja — ELLA hört permanent zu und verarbeitet alles. Der Freihand-Modus ist für Nutzer gedacht die ELLA ständig verfügbar haben wollen.

Wenn du Privatsphäre möchtest: Nutze den **Wakeword-Modus** (ELLA aktiviert sich nur nach dem Schlüsselwort) oder stelle den Modus auf **Manuell** oder **Aus**.

### Kann ich ELLA beibringen nur auf meine Stimme zu hören?

Derzeit erkennt ELLA keine individuelle Stimme — das Wakeword-Modell reagiert auf das Wort "Ella" unabhängig von der Stimme. Eine Sprecheridentifikation ist in der Roadmap.

---

## 6. Musik & Medien

### Wie sage ich ELLA wo meine Musik liegt?

**Einstellungen → Programme → Musikbibliothek** — trage dort den Pfad zu deiner Musiksammlung ein, z.B. `H:\Musik`. Nach dem Eintragen auf **Speichern** klicken.

Zusätzliche Pfade kannst du unter **Einstellungen → Programme → Zusätzliche Musikpfade** eintragen (mehrere Pfade mit Komma trennen).

### ELLA findet meine Musik nicht — was tun?

1. **Ist der Pfad korrekt?** → Einstellungen → Programme → Musikbibliothek prüfen
2. **Ist das Laufwerk in der Suchliste?** → Einstellungen → Programme → Suchlaufwerke (z.B. `C, D, E, H`)
3. **Wurde gespeichert?** → Nach jeder Änderung auf **Speichern** klicken
4. **Windows Search Index?** → Nicht alle Laufwerke sind indiziert. ELLA fällt automatisch auf eine direkte Suche zurück, die etwas länger dauert

### Wie suche ich nach Musik?

```
"Spiel Musik"
"Spiel etwas von Rammstein"
"Öffne das Album Thriller von Michael Jackson"
"Spiel meine Rock-Playlist"
```

ELLA sucht nach Ordnern und Dateien die dem Suchbegriff entsprechen und öffnet sie im konfigurierten Media Player.

### Welcher Media Player wird verwendet?

Der unter **Einstellungen → Programme → Standard Media Player** eingetragene Player. Standard: Windows Media Player. Du kannst jeden beliebigen Player eintragen (z.B. `vlc`, `wmplayer`, `foobar2000`).

### Kann ELLA den Media Player steuern (Play/Pause/Next)?

Ja — über Systemtasten:

```
"Nächster Titel"
"Pause"
"Lauter"
"Was läuft gerade?"
```

`control_media` sendet VK_MEDIA-Tasten an Windows. `get_now_playing` liest den aktuell spielenden Titel via Windows Media Control (WinRT) aus.

---

## 7. Dateien & Laufwerke

### Kann ELLA Dateien auf allen Laufwerken suchen?

Ja — aber standardmäßig sucht ELLA nur auf `C:\`. Um weitere Laufwerke einzubeziehen:

**Einstellungen → Programme → Suchlaufwerke** — trage alle gewünschten Laufwerksbuchstaben ein (z.B. `C, D, E, H, Z`).

ELLA nutzt zunächst den Windows Search Index (sehr schnell) und fällt auf eine direkte Suche zurück wenn ein Laufwerk nicht indiziert ist.

### Kann ELLA Systemlaufwerke formatieren?

**Nein** — das ist ein hartes, unveränderliches Verbot (Direktive). Folgende Laufwerke sind immer gesperrt:

- **C:** (Systemlaufwerk)
- Das Laufwerk auf dem ELLA installiert ist
- Alle in **Einstellungen → Laufwerke → Geschützte Laufwerke** eingetragenen Laufwerke

USB-Sticks (DriveType 2) können formatiert werden — aber nur nach expliziter Bestätigung.

### Kann ELLA Dateien löschen?

ELLA verschiebt Dateien in den **Papierkorb** — ein permanentes Löschen ohne Papierkorb ist nicht möglich. Der Papierkorb gibt dir immer die Möglichkeit die Aktion rückgängig zu machen.

### Kann ELLA Systempfade lesen oder bearbeiten?

Nein — folgende Verzeichnisse sind immer gesperrt:
`C:\Windows`, `C:\Program Files`, `C:\ProgramData`, `C:\Users\Default` und weitere Systempfade.

### Wie finde ich doppelte Dateien?

```
"Suche doppelte Dateien auf meinen Laufwerken"
"Welche Dateien habe ich doppelt auf E:?"
```

ELLA vergleicht Dateien per Hash-Wert (nicht nur Name) und zeigt dir wie viel Speicherplatz du durch Löschen der Duplikate gewinnen würdest.

---

## 8. E-Mail & Kalender

### Welche E-Mail-Dienste unterstützt ELLA?

- **Outlook** (via COM-Automatisierung, kein Setup nötig wenn Outlook installiert ist)
- **Gmail** (via Google OAuth 2.0 — einmalige Einrichtung in den Einstellungen)

### Kann ELLA E-Mails automatisch senden?

**Nein** — aus Sicherheitsgründen. ELLA öffnet einen Entwurf in Outlook mit dem vorbereiteten Text. Du sendest die Mail selbst. Das verhindert versehentliche oder böswillige automatische Sendungen.

### Wie verbinde ich Gmail?

1. In der [Google Cloud Console](https://console.cloud.google.com) eine App anlegen (OAuth 2.0, Desktop-Typ)
2. Client ID und Client Secret kopieren
3. In ELLA: **Einstellungen → Google → Client ID + Secret eintragen**
4. "Mit Google verbinden" klicken → Browser öffnet sich → Google-Konto auswählen → Bestätigen
5. ELLA kehrt automatisch zurück

Der Token wird lokal in `google-token.json` gespeichert und nie weitergegeben.

### Kann ELLA meinen Google Kalender bearbeiten?

Ja — sowohl lesen als auch Termine erstellen:

```
"Was steht heute im Google Kalender?"
"Erstelle einen Termin morgen um 14 Uhr: Zahnarzt"
```

---

## 9. Gedächtnis & Lernen

### Wie merkt sich ELLA Dinge?

ELLA nutzt **ML-Gedächtnis** mit Vektor-Embeddings (nomic-embed-text Modell). Informationen werden als semantische Vektoren gespeichert und bei relevanten Anfragen automatisch abgerufen — ähnlich wie menschliche Assoziationen.

```
"Merk dir: Meine Steuernummer ist 123/456/78901"
"Merk dir: Ich mag keine E-Mails am Freitagnachmittag"
"Was weißt du über mich?"
```

### Wie viele Dinge kann sich ELLA merken?

Es gibt kein festes Limit. ELLA ruft bei jeder Anfrage die **3 ähnlichsten Erinnerungen** ab (Cosine-Similarity). Sehr alte oder wenig genutzte Erinnerungen können durch neuere verdrängt werden.

### Kann ich Erinnerungen löschen?

Ja:

```
"Vergiss meine Steuernummer"
"Was weißt du über mich?" → ID der Erinnerung notieren
"Vergiss Erinnerung 42"
```

### Lernt ELLA durch Feedback?

Ja — die **Daumen-Buttons** unter jeder Antwort geben ELLA Feedback. Daumen hoch/runter wird gespeichert und ELLA extrahiert daraus Nutzerpräferenzen (z.B. "Nutzer bevorzugt kurze Antworten") die ins Gedächtnis fließen.

Das Feedback geht **nie** in den aktiven Gesprächskontext — kein Sicherheitsrisiko.

### Lernt ELLA meinen Schreibstil?

Ja — mit OpenAI-Key. Wenn du ELLA bittest einen Text "in deinem Stil" zu schreiben, analysiert sie vorhandene E-Mails und übernimmt Tonalität, typische Formulierungen und Satzstruktur.

```
"Schreib eine Absage an Herrn Müller in meinem Stil"
"Verfasse eine freundliche Mahnung für mich"
```

---

## 10. Proaktive Intelligenz

### Schreibt ELLA auch ohne Anfrage in den Chat?

Ja — das ist eine der Kernfunktionen. ELLA beobachtet deinen Rechner und schreibt von sich aus in den Chat wenn:

| Ereignis                         | Was ELLA sagt                                                        |
| -------------------------------- | -------------------------------------------------------------------- |
| 30 Min vor Termin                | Meeting-Vorbereitung, Dokumente anbieten                             |
| 18:00 Uhr                        | Tagesabschluss mit Aktivitäten, morgigen Terminen, fälligen Aufgaben |
| USB-Stick angeschlossen          | Laufwerk angesagt, Inhalt angeboten                                  |
| RAM über 85%                     | Warnung + Aufräum-Angebot                                            |
| Festplatte über 90% voll         | Warnung + Bereinigungsoptionen                                       |
| 30 Min inaktiv + Rückkehr        | Comeback-Briefing: Was hat sich verändert?                           |
| 90 Min ununterbrochen gearbeitet | Pause-Empfehlung                                                     |
| IBAN in Zwischenablage           | Kontextangebot                                                       |
| Paketnummer kopiert              | Sendungsverfolgung anbieten                                          |

### Kann ich die proaktiven Meldungen deaktivieren?

Ja — einzeln oder alle:

- **Einstellungen → Modus → Proaktive Intelligenz** ausschalten (alle proaktiven Nachrichten)
- **Einstellungen → Modus → Zwischenablage-Muster erkennen** separat deaktivierbar

### Was ist das Comeback-Briefing?

Wenn du mehr als 30 Minuten inaktiv warst und zurückkommst, fasst ELLA zusammen was in deiner Abwesenheit passiert ist — System-Alerts, neue Mails, Clipboard-Ereignisse.

---

## 11. Sicherheit & Datenschutz

### Sendet ELLA meine Daten in die Cloud?

Standardmäßig **nein** — im reinen Ollama-Modus verlassen keine Gesprächsdaten deinen Rechner.

Mit OpenAI-Key werden folgende Daten an OpenAI gesendet:

- Der Gesprächsverlauf (Chat-Nachrichten)
- Audio-Dateien wenn du die Whisper-Spracherkennung nutzt
- Screenshots wenn du Screenshot-Analyse nutzt

Niemals an externe Dienste gesendet (auch mit OpenAI):

- Zwischenablage-Inhalte
- Fenster-Kontext (aktive Anwendung)
- Gesprächskompressionen
- Gedächtnis-Inhalte

### Wo werden meine Daten gespeichert?

| Daten            | Speicherort                                   |
| ---------------- | --------------------------------------------- |
| Gesprächsverlauf | MariaDB lokal (`%APPDATA%\ELLA\mariadb-data`) |
| Gedächtnis       | MariaDB lokal (Vektor-Embeddings)             |
| Einstellungen    | `%APPDATA%\ELLA\settings.json`                |
| Google-Token     | `%APPDATA%\ELLA\google-token.json`            |
| Profil-PINs      | MariaDB (PBKDF2+Salt, 100.000 Iterationen)    |
| OpenAI-Key       | `%APPDATA%\ELLA\settings.json` (lokal)        |

Alles bleibt auf deinem Rechner. Keine Cloud-Sync, keine Telemetrie.

### Wie sicher sind meine Profil-PINs?

PINs werden mit **PBKDF2+Salt und 100.000 Iterationen** gespeichert — ein Industriestandard für Passwort-Hashing. Selbst wenn jemand Zugriff auf die Datenbank erhielte, wäre das Knacken eines PINs sehr aufwendig.

### Kann ELLA meine Webcam oder mein Mikrofon ohne mein Wissen aktivieren?

**Nein.** Die E.L.L.A. Direktive verbietet **surveil** — keine Überwachung ohne ausdrückliches Wissen und aktive Zustimmung. Das Mikrofon wird nur aktiviert wenn du es explizit anforderst (Wakeword, Mikrofon-Button oder Freihand-Modus den du selbst aktiviert hast).

### Kann ELLA meine Passwörter lesen?

Nein — Fenster von Passwort-Managern und Banking-Apps (1Password, KeePass, Bitwarden, PayPal, Banking-URLs etc.) sind für alle Maus- und Fenster-Tools gesperrt. Auch Systempfade die Passwörter enthalten könnten sind blockiert.

---

## 12. Die E.L.L.A. Direktive

### Was ist die E.L.L.A. Direktive?

Vier unveränderliche Verbote die tief in der Architektur verankert sind. Keine Einstellung und keine Regel kann sie außer Kraft setzen:

| Verbot         | Bedeutung                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------- |
| **harm**       | ELLA verursacht keinen physischen, finanziellen, psychologischen oder datenbezogenen Schaden |
| **conceal**    | ELLA verschleiert keine Aktionen, Fähigkeiten oder Systemzustände                            |
| **surveil**    | ELLA überwacht nicht ohne ausdrückliches Wissen und aktive Zustimmung                        |
| **exfiltrate** | ELLA gibt keine Daten an Dritte ohne ausdrückliche Zustimmung                                |

### Was passiert wenn ELLA etwas blockiert?

ELLA zeigt im Chat einen **roten Badge** mit der Erklärung warum die Aktion blockiert wurde. Du kannst die Entscheidung nicht umgehen — weder durch Umformulierung noch durch Einstellungen.

### Kann ich die Direktive ändern?

**Nein.** Die Direktive ist architektonisch verankert — nicht in der Datenbank, nicht in den Einstellungen. Sie existiert als Code-Konstanten die bei jedem Request ausgewertet werden.

---

## 13. Nutzerprofile & PIN

### Was sind Nutzerprofile?

Mehrere Personen können ELLA mit getrennten Gedächtnissen und Gesprächsverläufen nutzen. Jedes Profil ist vollständig isoliert — ein Profil kann nicht auf das Gedächtnis eines anderen zugreifen.

### Wie lege ich ein neues Profil an?

**Einstellungen → Profile → Neues Profil** — Name und Farbe wählen, optional PIN setzen.

### Wie wechsle ich das Profil?

Über den Profilwechsler in der Navigation. Bei PIN-geschützten Profilen wird der PIN abgefragt.

### Was passiert wenn ich meinen Profil-PIN vergesse?

Für **Nutzerprofile** ist ein Zurücksetzen nur mit direktem Datenbankzugriff möglich. Wende dich in diesem Fall an den Entwickler.

Für den **Hausaufgaben-Modus PIN** gibt es einen Notfall-Reset unter Einstellungen → Hausaufgaben-Modus.

### Teilen sich Profile die Einstellungen?

Globale Einstellungen (LLM-Provider, TTS, Regeln) gelten für alle Profile. Gedächtnis und Gesprächsverlauf sind profilgetrennt.

---

## 14. Barrierefreiheit

### Welche Barrierefreiheits-Modi gibt es?

ELLA unterstützt zwei spezielle Modi unter **Einstellungen → Modus → Barrierefreiheit**:

| Modus              | Für wen        | Was sich ändert                                                                                                     |
| ------------------ | -------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Blind-Modus**    | Sehbehinderte  | TTS immer aktiv, Audio-Feedback beim Mikrofon (Ton = bereit), Antworten ohne Markdown formatiert, Bildanalyse aktiv |
| **Gehörlos-Modus** | Hörgeschädigte | Alle Audio-Ausgaben deaktiviert (kein TTS, keine Töne), nur Text                                                    |

### Was kann ELLA für blinde Nutzer tun?

Im Blind-Modus liest ELLA alle Antworten automatisch vor. Zusätzlich kann ELLA:

```
"Was siehst du auf meinem Bildschirm?"
"Beschreibe dieses Bild: [Pfad]"
"Beschreibe die Webseite: example.com"
```

Die Bildanalyse nutzt GPT-4o Vision (OpenAI-Key erforderlich) oder ein lokal installiertes LLaVA-Modell.

### Gibt es Audio-Feedback für Sprachbefehle?

Im Blind-Modus: Ja. Ein kurzer Ton signalisiert:

- **Hoher Ton (880 Hz):** Mikrofon startet — ELLA hört jetzt zu
- **Tiefer Ton (440 Hz):** Antwort ist bereit — ELLA liest vor

---

## 15. Hausaufgaben-Modus

### Was ist der Hausaufgaben-Modus?

Ein PIN-gesicherter Kiosk-Modus für Kinder. Im Hausaufgaben-Modus kann ELLA nur Apps aus einer vorher definierten Whitelist öffnen und antwortet nur auf schulbezogene Anfragen.

### Wie aktiviere ich den Hausaufgaben-Modus?

```
"Aktiviere den Hausaufgaben-Modus"
```

ELLA fragt nach dem PIN (muss vorher in den Einstellungen gesetzt werden).

### Wie deaktiviere ich ihn?

```
"Deaktiviere den Hausaufgaben-Modus"
```

ELLA fragt nach dem PIN.

### Ich habe den Hausaufgaben-PIN vergessen

**Einstellungen → Modus → Hausaufgaben-Modus → Notfall-Reset** — deaktiviert den Modus ohne PIN.

---

## 16. Einstellungen & Konfiguration

### Wie öffne ich die Einstellungen?

Über das **Zahnrad-Symbol** in der linken Navigation oder durch Sagen von:

```
"Öffne die Einstellungen"
```

### Warum werden Einstellungsänderungen nicht übernommen?

Du musst nach jeder Änderung auf **Speichern** klicken. Änderungen werden nicht automatisch gespeichert.

### Kann ich ELLA per Gespräch konfigurieren?

Ja — viele Einstellungen lassen sich direkt im Chat ändern:

```
"Erstell ein Setup namens Büro mit Chrome, Word und Teams"
"Erlaube das Tool clean_temp"
"Verbiete das Tool format_drive zwischen 22 und 7 Uhr"
"Ändere die TTS-Stimme auf Stefan"
```

### Was sind Regeln und wie funktionieren sie?

Regeln steuern wann ELLA welche Aktionen ausführen darf. Die Auswertungsreihenfolge ist:

```
Direktive (unveränderlich) → DIRECTIVE_DENY → Deny-Regeln → Allow-Regeln → Ausführung
```

Beispiel-Regeln:

- `format_drive: deny, immer` → ELLA darf nie formatieren
- `clean_temp: allow, immer` → ELLA darf jederzeit Temp-Dateien löschen
- `play_music: deny, 22:00-07:00` → Keine Musik nachts

### Kann ich einzelne Tools deaktivieren?

Ja — **Einstellungen → Tools** zeigt alle verfügbaren Tools mit An/Aus-Schalter. Deaktivierte Tools werden dem LLM nicht angeboten — ELLA kann sie dann nicht nutzen.

### Wie richte ich Google Gmail und Calendar ein?

1. [Google Cloud Console](https://console.cloud.google.com) → Neues Projekt → OAuth 2.0 Client-ID erstellen (Typ: Desktop-App)
2. Client-ID und Secret in ELLA eintragen: **Einstellungen → Google**
3. "Mit Google verbinden" klicken und im Browser autorisieren
4. Nach erfolgreicher Verbindung kann ELLA auf Gmail und Google Calendar zugreifen

---

## 17. Fehler & Fehlerbehebung

### ELLA antwortet nicht

Mögliche Ursachen und Lösungen:

| Ursache             | Lösung                                    |
| ------------------- | ----------------------------------------- |
| Ollama läuft nicht  | `sc start Ollama` oder Ollama-App starten |
| llama3.1:8b fehlt   | `ollama pull llama3.1:8b`                 |
| MariaDB läuft nicht | `sc start MariaDB`                        |
| OpenAI-Key ungültig | Key in Einstellungen → LLM aktualisieren  |
| API abgestürzt      | ELLA neu starten                          |

Diagnose: `"Ella, wie ist dein Status?"`

### Der orangene Ollama-Banner verschwindet nicht

```powershell
# Ollama-Status prüfen:
Invoke-RestMethod http://localhost:11434/api/tags

# Modell laden falls fehlend:
ollama pull llama3.1:8b
```

Nach dem Laden ELLA neu starten.

### Spracherkennung funktioniert nicht

1. **Mikrofon-Berechtigung prüfen:** Windows → Einstellungen → Datenschutz → Mikrofon → ELLA erlauben
2. **Sprachmodus prüfen:** Einstellungen → Modus → Stimme auf "Wakeword" oder "Manuell" stellen
3. **Browser-Mikrofon:** Der Wakeword-Server braucht Mikrofon-Zugriff auf Python-Ebene

### ELLA versteht mich nicht richtig

- Bei starkem Akzent oder Hintergrundgeräuschen hilft ein **OpenAI-Key** für höhere Whisper-Qualität
- **contextAlign** filtert Stottern und Hintergrundgeräusche — braucht Ollama-Modell oder OpenAI-Key
- Tippe deinen Befehl statt zu sprechen um zu prüfen ob das Problem an der Spracherkennung oder der KI liegt

### Musik wird nicht gefunden

1. Musikbibliothek-Pfad korrekt? → Einstellungen → Programme → Musikbibliothek
2. Laufwerk in Suchlaufwerken? → Einstellungen → Programme → Suchlaufwerke
3. Auf **Speichern** geklickt?
4. Formatierung des Pfads: `H:\Musik\` (mit abschließendem Backslash)

### Einstellungen werden beim nächsten Start zurückgesetzt

Prüfe ob `%APPDATA%\ELLA\settings.json` Schreibrechte hat. Im Entwicklungsmodus: Stelle sicher dass die API nicht als Administrator läuft während die Settings als normaler Nutzer gespeichert wurden.

### Kokoro TTS funktioniert nicht

```powershell
# Python-Pakete prüfen:
py -3.12 -m pip list | findstr kokoro

# Falls fehlend:
py -3.12 -m pip install kokoro-onnx sounddevice numpy
```

Einstellungen → Modus → TTS-Engine auf "Kokoro" stellen und ELLA neu starten. Bei Problemen fällt ELLA automatisch auf Edge TTS zurück.

### Google-Verbindung schlägt fehl

- Client-ID und Secret korrekt eingegeben (keine Leerzeichen)?
- In der Google Cloud Console: Anwendungstyp "Desktop App" (nicht "Web App")
- Token löschen und neu verbinden: `%APPDATA%\ELLA\google-token.json` löschen

### Proaktive Meldungen erscheinen nicht

- **Einstellungen → Modus → Proaktive Intelligenz** aktiviert?
- Der Background-Worker läuft alle 60 Sekunden — kurz warten
- Bei Disk/RAM-Alerts: Schwellenwerte noch nicht erreicht (RAM > 85%, Disk > 90%)

### Was bedeutet der rote "Direktive"-Badge im Chat?

ELLA hat eine Aktion blockiert weil sie gegen die E.L.L.A. Direktive verstößt. Die Meldung erklärt warum. Diese Blockaden sind unveränderlich und können nicht umgangen werden — auch nicht durch Umformulierung.

---

## 18. Technische Fragen (Entwickler)

### Auf welchen Ports läuft ELLA?

| Dienst               | Port                  |
| -------------------- | --------------------- |
| Express API          | 3002                  |
| React-Frontend (Dev) | 5173                  |
| Ollama               | 11434                 |
| MariaDB              | 3306                  |
| Kokoro TTS           | 3003 (127.0.0.1 only) |

### Wie starte ich ELLA im Entwicklungsmodus?

```powershell
# Abhängigkeiten installieren:
npm install

# MariaDB starten:
sc start MariaDB

# Ollama starten und Modell prüfen:
ollama pull llama3.1:8b
ollama pull nomic-embed-text

# API + Web parallel starten:
npm run dev

# Oder einzeln:
npm run dev --workspace=apps/api   # API auf :3002
npm run dev --workspace=apps/web   # Web auf :5173
```

### Wie füge ich ein neues Tool hinzu?

Neue Tools brauchen Einträge in 5 Dateien — vollständige Checkliste in `CLAUDE.md`:

1. `packages/shared/src/types/tool.ts` — ToolName-Union
2. `apps/api/src/tools/definitions.ts` — Tool-Definition
3. `apps/api/src/tools/executor.ts` — Handler
4. `apps/api/src/config/migrate.ts` — Default-Regel
5. Test in `apps/api/src/__tests__/unit/executor.test.ts`

### Wie baue ich den Installer?

```powershell
# Vendor-Dependencies herunterladen (einmalig):
.\scripts\download-vendor-deps.ps1

# API und Web zuerst bauen:
npm run build --workspace=apps/api
npm run build --workspace=apps/web

# Production node_modules vorbereiten:
.\scripts\prepare-api-deps.ps1

# Installer bauen:
.\scripts\build-installer.ps1
# → dist-installer/E.L.L.A Setup 1.0.0-rc.exe
```

### Wie laufen die Tests?

```powershell
npm test        # Alle 215 Tests (Vitest Unit + Integration)
npm run lint    # ESLint
```

Alle Tests müssen grün sein bevor ein Commit erfolgt.

### Wo werden die Logs gespeichert?

| Log                     | Pfad                               |
| ----------------------- | ---------------------------------- |
| Startup-Log (Installer) | `%APPDATA%\ELLA\ella-startup.log`  |
| API-Log                 | Konsole (Dev) / stdout (Installer) |
| Audit-Log               | MariaDB `tool_executions`-Tabelle  |
| Directive-Audit         | MariaDB `directive_audit`-Tabelle  |

---

_E.L.L.A. v3.5.0 · Proprietär · Alle Rechte vorbehalten_

_Weitere Dokumentation: [Bedienungsanleitung](bedienungsanleitung.md) · [Architektur](architecture.md) · [Roadmap](roadmap.md)_
