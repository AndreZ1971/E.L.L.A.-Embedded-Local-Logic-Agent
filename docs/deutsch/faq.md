# E.L.L.A. -- Häufig gestellte Fragen (FAQ)

Version 1.5.7 -- Zuletzt aktualisiert: 2026-10-28

---

## Inhaltsverzeichnis

1. [Allgemein -- Was ist ELLA?](#1-allgemein--was-ist-ella)
2. [Hardware & Performance](#2-hardware--performance)
3. [Lizenz & Kosten](#3-lizenz--kosten)
4. [Installation & erster Start](#4-installation--erster-start)
5. [KI-Modelle & Anbieter](#5-ki-modelle--anbieter)
6. [Spracheingabe & Sprachausgabe](#6-spracheingabe--sprachausgabe)
7. [Wakeword & Freihand-Modus](#7-wakeword--freihand-modus)
8. [Musik & Medien](#8-musik--medien)
9. [Dateien & Laufwerke](#9-dateien--laufwerke)
10. [E-Mail & Kalender](#10-e-mail--kalender)
11. [Gedächtnis & Lernen](#11-gedächtnis--lernen)
12. [Proaktive Intelligenz](#12-proaktive-intelligenz)
13. [Sicherheit & Datenschutz](#13-sicherheit--datenschutz)
14. [Die E.L.L.A. Direktive & Regeln](#14-die-ella-direktive--regeln)
15. [Nutzerprofile & PIN](#15-nutzerprofile--pin)
16. [Barrierefreiheit](#16-barrierefreiheit)
17. [Hausaufgaben-Modus](#17-hausaufgaben-modus)
18. [Einstellungen & Updates](#18-einstellungen--updates)
19. [Fehler & Fehlerbehebung](#19-fehler--fehlerbehebung)

---

## 1. Allgemein -- Was ist ELLA?

### Was ist E.L.L.A.?

E.L.L.A. steht für **Embedded Local Logic Agent** -- ein persönlicher KI-Assistent für Windows, der vollständig auf deinem eigenen Rechner läuft. ELLA versteht natürliche Sprache und kann deinen Computer für dich bedienen: Apps starten, Dateien suchen, Musik abspielen, E-Mails verfassen, Termine nachschlagen, Wecker stellen und vieles mehr.

> **Was ist ein KI-Assistent?** Ein Programm, das natürliche Sprache versteht (also deine Worte, keine speziellen Befehle) und darauf reagiert, indem es Aktionen auf deinem Computer ausführt oder dir Informationen gibt.

### Was macht ELLA besonders?

- **Läuft lokal:** Das KI-Modell läuft auf deinem Rechner -- kein Cloud-Zwang. Deine Gespräche bleiben auf deinem PC
- **Lernt mit:** ELLA merkt sich Gewohnheiten und Vorlieben über ein intelligentes Gedächtnis
- **Handelt proaktiv:** ELLA schreibt von sich aus in den Chat wenn etwas wichtig ist -- ohne dass du fragen musst
- **Versteht natürliche Sprache:** Du sprichst mit ELLA wie mit einem Menschen -- kein Syntaxlernen nötig
- **Transparent:** ELLA zeigt jede Aktion an und fragt bei sensiblen Dingen nach
- **Unveränderliche Ethik:** Vier fest eingebaute Verbote (Schaden, Verschleierung, Überwachung, Datenweitergabe) können durch keine Einstellung umgangen werden

### Brauche ich Internet?

Für den **Grundbetrieb mit englischer, französischer oder spanischer Sprachausgabe: nein.** Chat, lokale Spracheingabe, Musik, Dateisuche, Systemsteuerung -- alles läuft offline.

**Deutsche Sprachausgabe braucht Internet:** ELLA nutzt dafür Microsoft Edge TTS -- der vorgelesene Text wird an Microsoft-Server übertragen. Eine lokale deutsche Stimme ist in Arbeit.

Internet ist außerdem nötig für:

- Lizenzprüfung beim Start (funktioniert dank Cache auch ohne Internet)
- Web-Suche und Wetter
- OpenAI-Funktionen (Chat, Spracherkennung, Bildanalyse) -- nur wenn du einen eigenen Key einträgst
- Gmail und Google Calendar (nur wenn verbunden)
- Einmalige Downloads beim allerersten Start (KI-Modell, Stimmmodell)

Alle Netzwerkverbindungen im Detail: [netzwerk.md](netzwerk.md)

### Welche Daten gehen in die Cloud?

**Standardmäßig: keine.** Im reinen lokalen Modus (Ollama) verlassen keine Gesprächsdaten deinen Rechner.

**Ausnahme Deutsche Sprachausgabe:** Der vorgelesene Text wird an Microsoft übertragen. Für Englisch, Französisch und Spanisch wird die lokale Kokoro-Stimme verwendet (kein Internet nötig).

Wenn du einen **OpenAI-Key** einträgst, werden folgende Daten an OpenAI gesendet:

- Der Gesprächsverlauf (Chat-Nachrichten)
- Audio-Dateien bei Nutzung der OpenAI-Spracherkennung
- Screenshots bei Nutzung der Bildanalyse
- Multi-Agenten-Pipelines (laufen ausschließlich über OpenAI)

**Nie** an externe Dienste gesendet (auch mit OpenAI-Key):

- Zwischenablage-Inhalte
- Fenster-Kontext (welche App gerade aktiv ist)
- Erinnerungen und Gedächtnis-Inhalte
- Gesprächskompressionen

Jede Cloud-Anfrage wird im Dashboard-Zähler protokolliert -- du hast volle Transparenz.

### Auf welchen Systemen läuft ELLA?

ELLA läuft auf **Windows 10 und Windows 11 (64-Bit)**. Eine Mac- oder Linux-Version ist nicht geplant.

---

## 2. Hardware & Performance

### Welche Hardware brauche ich?

ELLA läuft auf den meisten Windows-Rechnern der letzten 5 Jahre. Für die beste Erfahrung empfehlen wir eine **NVIDIA-Grafikkarte mit mindestens 10 GB Videospeicher (VRAM)**.

> **Was ist VRAM?** Der Arbeitsspeicher deiner Grafikkarte. Das KI-Modell wird komplett dort hinein geladen. Je mehr VRAM, desto größere und bessere Modelle kann ELLA nutzen.

| Anforderung     | Minimum                     | Empfohlen                   |
| --------------- | --------------------------- | --------------------------- |
| Prozessor       | Intel Core i3 / AMD Ryzen 3 | Intel Core i5 / AMD Ryzen 5 |
| Arbeitsspeicher | 16 GB RAM                   | 32 GB RAM                   |
| Grafikkarte     | Nicht zwingend nötig        | NVIDIA mit 10-12 GB VRAM    |
| Festplatte      | 20 GB frei                  | 40 GB frei (SSD empfohlen)  |

Ausführliche Informationen: [hardware.md](hardware.md)

### Funktioniert ELLA auf meinem Laptop?

**Ja** -- ELLA läuft auf jedem Windows-Laptop mit mindestens 16 GB RAM. Die Geschwindigkeit hängt davon ab, ob dein Laptop eine dedizierte Grafikkarte hat:

- **Gaming-Laptop mit NVIDIA-GPU (10+ GB VRAM):** Sehr gut -- wie ein Desktop
- **Laptop mit kleinerer GPU (4-8 GB):** Funktioniert, aber langsamerer KI-Modus
- **Laptop ohne Grafikkarte:** Funktioniert, aber langsam -- OpenAI-Key empfohlen

**Tipp:** Mit einem **OpenAI-Key** kann ELLA die Berechnung in die Cloud auslagern. Dann ist die lokale Hardware weniger wichtig und selbst ein älterer Laptop liefert schnelle Antworten.

### ELLA antwortet langsam -- was tun?

| Ursache                       | Lösung                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------- |
| Keine oder kleine Grafikkarte | OpenAI-Key eintragen (Einstellungen -> LLM) -- ELLA nutzt dann Cloud-Berechnung |
| Zu wenig RAM (unter 16 GB)    | Andere Programme schließen oder RAM aufrüsten                                   |
| Erstes Laden nach dem Start   | Das KI-Modell wird beim Start in den Speicher geladen -- 10-30 Sekunden warten  |
| Kontextfenster voll           | Neues Gespräch starten (ELLA komprimiert lange Gespräche automatisch)           |

ELLA aktiviert automatisch **Flash Attention** -- eine Optimierung, die die Verarbeitung bis zu 12-mal schneller macht. Das ist standardmäßig aktiv und erfordert keine Konfiguration.

> **Was ist Flash Attention?** Eine Technik, die die Art optimiert, wie das KI-Modell deinen Text verarbeitet. Statt alles auf einmal im Speicher zu halten, wird in kleineren Stücken effizienter gearbeitet. Das spart Speicher und beschleunigt die Antwort.

---

## 3. Lizenz & Kosten

### Was kostet ELLA?

ELLA ist ein Premium-Produkt mit Einmalkauf. Der Preis und aktuelle Angebote sind auf [ella-agent.de](https://ella-agent.de) einsehbar.

### Wie funktioniert die Lizenz?

Nach dem Kauf erhältst du einen Lizenzschlüssel im Format `ELLA-XXXX-XXXX-XXXX-XXXX`. Diesen gibst du beim ersten Start ein. Die Lizenz wird einmalig online geprüft und dann lokal zwischengespeichert -- danach funktioniert ELLA auch ohne Internet.

Die Lizenz ist an deinen Rechner gebunden (über einen anonymen Hardware-Fingerprint). Wenn du den Rechner wechselst, kannst du die Lizenz übertragen.

### Kommen zusätzliche Kosten auf mich zu?

Die lokale Nutzung (Ollama-Modus) verursacht **keine laufenden Kosten**. Strom für deinen Rechner natürlich ausgenommen.

Optional kannst du einen **OpenAI-API-Key** eintragen. OpenAI rechnet nach Nutzung ab (Pay-per-Use) -- die Kosten sind gering (wenige Cent pro Gespräch). Das ist keine Voraussetzung, sondern eine Erweiterung.

---

## 4. Installation & erster Start

### Wie installiere ich ELLA?

1. Installationsdatei von ella-agent.de herunterladen und ausführen
2. Installationspfad wählen (Standard: `C:\Programme\E.L.L.A`)
3. Installation abwarten -- alle Abhängigkeiten werden automatisch eingerichtet
4. ELLA über das Desktop-Symbol starten

**Es ist nichts weiter nötig.** Der Installer enthält alle benötigten Komponenten.

### Was passiert beim allerersten Start?

ELLA führt dich durch ein 6-schrittiges Onboarding:

1. **Nutzungsbedingungen** -- lesen und akzeptieren
2. **Lizenzaktivierung** -- Lizenzschlüssel eingeben (Internetverbindung nötig)
3. **Dein Name** -- ELLA lernt wie sie dich ansprechen soll
4. **Die Direktive** -- ELLA erklärt ihre vier unveränderlichen Verbote
5. **Hardware-Scan** -- ELLA erkennt deine Laufwerke und wählt ein passendes KI-Modell
6. **Stimme & Standort** -- Sprachausgabe wählen, Standort optional eingeben

Beim ersten Start lädt ELLA außerdem das KI-Modell herunter (~8,4 GB). Das dauert je nach Internetgeschwindigkeit einige Minuten.

### ELLA startet, aber zeigt einen orangenen Banner. Was tun?

Der häufigste Grund ist, dass das KI-Modell noch geladen wird. Warte kurz -- beim ersten Start wird es automatisch heruntergeladen. Falls der Banner nach 2 Minuten nicht verschwindet, starte ELLA neu (Tray-Symbol -> Beenden -> ELLA-Symbol doppelklicken).

---

## 5. KI-Modelle & Anbieter

### Welche KI-Modelle nutzt ELLA?

> **Was ist ein LLM?** Ein "Large Language Model" (grosses Sprachmodell) -- ein KI-Programm das auf riesigen Textmengen trainiert wurde und dadurch natürliche Sprache versteht und generiert.

| Modell                    | Zweck                                      | Läuft auf deinem Rechner?      |
| ------------------------- | ------------------------------------------ | ------------------------------ |
| qwen2.5:14b (Ollama)      | Chat, Textverarbeitung, Werkzeug-Auswahl   | Ja -- vollständig lokal        |
| nomic-embed-text (Ollama) | Gedächtnis und Erinnerungen                | Ja -- vollständig lokal        |
| GPT-4o (OpenAI)           | Chat-Alternative, Bildanalyse, Schreibstil | Nein -- braucht Internet + Key |
| Whisper (OpenAI)          | Präizisere Spracherkennung                 | Nein -- braucht Internet + Key |

### Brauche ich einen OpenAI-Key?

**Nein.** ELLA funktioniert vollständig ohne OpenAI. Mit einem Key werden folgende Funktionen besser oder überhaupt erst verfügbar:

- Schnellere und präzisere Antworten
- Screenshot-Analyse und Bildanalyse
- Texte im persönlichen Schreibstil
- Hochwertigere Spracherkennung
- Geräusch- und Stotterfilter bei der Spracheingabe

Den Key trägst du unter **Einstellungen -> LLM -> OpenAI API-Key** ein.

### Was ist der Unterschied zwischen Ollama und OpenAI?

|                 | Ollama (lokal)                  | OpenAI (Cloud)                         |
| --------------- | ------------------------------- | -------------------------------------- |
| Kosten          | Kostenlos                       | Pay-per-Use (wenige Cent pro Gespräch) |
| Datenschutz     | Alles bleibt auf deinem Rechner | Daten gehen an OpenAI                  |
| Geschwindigkeit | Abhängig von deiner Hardware    | Schnell und gleichmäßig                |
| Bildanalyse     | Eingeschränkt                   | Immer verfügbar                        |

### Was bedeutet "Provider: Auto"?

Im Auto-Modus wählt ELLA automatisch den besten verfügbaren Anbieter. Hat sie einen gültigen OpenAI-Key, nutzt sie OpenAI -- sonst Ollama. Du kannst in den Einstellungen auch einen festen Anbieter erzwingen.

### Kann ich ein anderes Ollama-Modell verwenden?

Ja -- unter **Einstellungen -> LLM -> Ollama-Modell** kannst du jedes Modell eintragen, das du in Ollama geladen hast. Das Standard-Modell (qwen2.5:14b mit 14 Milliarden Parametern) bietet die beste Balance aus Geschwindigkeit und Qualität. Kleinere Modelle antworten schneller, verstehen aber komplexe Anfragen weniger gut.

---

## 6. Spracheingabe & Sprachausgabe

### Wie spreche ich mit ELLA?

Vier Wege stehen zur Verfügung:

1. **Text:** Tippe deine Nachricht und drücke Enter
2. **Mikrofon-Button:** Klicke das Mikrofon-Symbol im Chat für eine einmalige Aufnahme
3. **Wakeword:** Sage "Ella" -- ELLA hört dann auf deinen Befehl (muss aktiviert werden)
4. **Freihand (Always-On):** ELLA hört permanent zu und reagiert auf alles was du sagst

### Brauche ich für die Spracheingabe Internet?

Die Standard-Spracherkennung (Web Speech API) braucht eine Internetverbindung. Wenn du komplett offline bleiben möchtest, kannst du in den Einstellungen auf die lokale Spracherkennung (Whisper) umstellen -- kein Internet nötig, aber etwas langsamer.

### Was ist contextAlign und wozu ist es gut?

contextAlign ist ein Filter zwischen deiner Stimme und ELLA. Wenn du sprichst und im Hintergrund Musik läuft, der TV an ist oder du stotterst, erkennt ELLA das und filtert es heraus. Nur dein eigentlicher Befehl wird verarbeitet.

**Beispiel:**

- Was du sagst: _"äh ella äh öffne öffne mal den Explorer is this the real life"_
- Was ELLA hört: _"Öffne den Explorer"_
- TV-Ton im Hintergrund -> ELLA ignoriert es

### Wie aktiviere ich die Sprachausgabe (TTS)?

> **Was ist TTS?** "Text-to-Speech" -- die Umwandlung von Text in gesprochene Sprache. ELLA liest ihre Antworten laut vor.

**Einstellungen -> Modus -> TTS** auf "An" stellen. ELLA liest dann alle Antworten, Warnungen und proaktive Nachrichten automatisch vor.

### Kann ELLA auch ohne Internet sprechen?

Ja -- mit **Kokoro TTS**. Das ist eine lokale Stimme, die direkt auf deinem Rechner läuft und deutlich natürlicher klingt als Windows-Standardstimmen. Kokoro funktioniert für Englisch, Französisch und Spanisch vollständig offline. Für Deutsch wird derzeit noch Microsoft Edge TTS (Internet nötig) verwendet.

### Kann ich die Stimme ändern?

Ja -- unter **Einstellungen -> Stimme -> Gesprächssprache** wählst du aus 4 weiblichen Stimmen:

| Sprache  | Online-Stimme | Offline-Stimme (Kokoro) |
| -------- | ------------- | ----------------------- |
| Deutsch  | Katja         | (in Arbeit)             |
| English  | Sonia         | Emma                    |
| Espanol  | Elvira        | Dora                    |
| Francais | Denise        | Siwis                   |

### Kann ELLA erkennen ob ich gestresst bin?

Ja -- mit der optionalen **Stress-Erkennung** unter **Einstellungen -> Stimme -> Stimmanalyse aktivieren**.

ELLA analysiert Tonhöhe, Sprechtempo und Lautstärke und passt bei erkannter Anspannung ihren Ton an. Die Analyse läuft vollständig lokal -- keine Audiodaten verlassen das Gerät. Das Feature ist standardmäßig deaktiviert und muss bewusst eingeschaltet werden.

---

## 7. Wakeword & Freihand-Modus

### Was ist der Unterschied zwischen Wakeword und Freihand?

| Modus                    | Wie es funktioniert                                                            |
| ------------------------ | ------------------------------------------------------------------------------ |
| **Wakeword**             | ELLA hört auf das Schlüsselwort "Ella" und reagiert dann auf den nächsten Satz |
| **Freihand (Always-On)** | ELLA hört permanent zu und schickt alles was du sagst direkt in den Chat       |
| **Manuell**              | Du drückst den Mikrofon-Button -- nur dann hört ELLA zu                        |

### Wie aktiviere ich das Wakeword?

**Einstellungen -> Modus -> Stimme** auf "Wakeword" stellen. Das Wakeword läuft vollständig lokal -- keine Audiodaten werden übertragen.

### Wie pausiere ich das Wakeword?

```
"Ella, mach 30 Minuten Pause"
"Pausiere für eine Stunde"
```

ELLA deaktiviert das Wakeword und meldet sich nach Ablauf der Zeit automatisch zurück.

### Hört ELLA immer zu -- auch wenn ich privat telefoniere?

Im **Freihand-Modus (Always-On)** ja -- ELLA hört permanent zu und verarbeitet alles. Wenn du Privatsphäre möchtest: Nutze den **Wakeword-Modus** (ELLA aktiviert sich nur nach dem Schlüsselwort) oder stelle den Modus auf **Manuell** oder **Aus**.

---

## 8. Musik & Medien

### Wie sage ich ELLA wo meine Musik liegt?

**Einstellungen -> Programme -> Musikbibliothek** -- trage dort den Pfad zu deiner Musiksammlung ein (z.B. `H:\Musik`). Nach dem Eintragen auf **Speichern** klicken.

### Wie suche ich nach Musik?

```
"Spiel Musik"
"Spiel etwas von Rammstein"
"Öffne das Album Thriller von Michael Jackson"
```

ELLA sucht nach Ordnern und Dateien, die dem Suchbegriff entsprechen, und öffnet sie im eingestellten Media Player.

### ELLA findet meine Musik nicht -- was tun?

1. **Ist der Pfad korrekt?** -> Einstellungen -> Programme -> Musikbibliothek prüfen
2. **Ist das Laufwerk in der Suchliste?** -> Einstellungen -> Programme -> Suchlaufwerke (z.B. `C, D, E, H`)
3. **Wurde gespeichert?** -> Nach jeder Änderung auf **Speichern** klicken

### Kann ELLA den Media Player steuern?

Ja:

```
"Nächster Titel"
"Pause"
"Lauter"
"Was läuft gerade?"
```

---

## 9. Dateien & Laufwerke

### Kann ELLA Dateien auf allen Laufwerken suchen?

Ja -- aber standardmäßig sucht ELLA nur auf `C:\`. Um weitere Laufwerke einzubeziehen: **Einstellungen -> Programme -> Suchlaufwerke** -- trage alle gewünschten Laufwerksbuchstaben ein.

### Kann ELLA Systemlaufwerke formatieren?

**Nein** -- das ist ein hartes, unveränderliches Verbot (Direktive). Folgende Laufwerke sind immer gesperrt:

- **C:** (Systemlaufwerk)
- Das Laufwerk auf dem ELLA installiert ist
- Alle in **Einstellungen -> Laufwerke -> Geschützte Laufwerke** eingetragenen Laufwerke

### Kann ELLA Dateien löschen?

ELLA verschiebt Dateien in den **Papierkorb** -- ein permanentes Löschen ohne Papierkorb ist nicht möglich. Du kannst die Aktion immer rückgängig machen.

### Wie finde ich doppelte Dateien?

```
"Suche doppelte Dateien auf meinen Laufwerken"
"Welche Dateien habe ich doppelt auf E:?"
```

ELLA vergleicht Dateien per Hash-Wert (nicht nur Name) und zeigt dir, wie viel Speicherplatz du durch Löschen der Duplikate gewinnen würdest.

---

## 10. E-Mail & Kalender

### Kann ELLA meine E-Mails lesen? Ist das sicher?

Ja, ELLA kann deine E-Mails lesen -- aber nur, wenn du es ihr erlaubst. Für **Outlook** funktioniert das automatisch, wenn Outlook installiert ist. Für **Gmail** musst du ELLA einmalig mit deinem Google-Konto verbinden (Einstellungen -> Google).

**Sicherheit:**

- ELLA liest E-Mails nur auf deinem Rechner -- im lokalen Modus (Ollama) werden keine E-Mail-Inhalte übertragen
- ELLA kann **keine E-Mails automatisch senden**. Sie erstellt nur Entwürfe in Outlook, die du selbst absendest
- E-Mail-Inhalte fließen nicht ins Gedächtnis (es sei denn, du sagst ausdrücklich "merk dir das")
- Im Offline-Modus ist der E-Mail-Zugriff eingeschränkt (Gmail braucht Internet)

### Welche E-Mail-Dienste werden unterstützt?

- **Outlook** (automatisch, wenn installiert)
- **Gmail** (einmalige Einrichtung über Google OAuth)

### Wie verbinde ich Gmail?

1. In der [Google Cloud Console](https://console.cloud.google.com) eine App anlegen (OAuth 2.0, Typ: Desktop-App)
2. Client-ID und Secret kopieren
3. In ELLA: **Einstellungen -> Google -> Client-ID + Secret eintragen**
4. "Mit Google verbinden" klicken -> Browser öffnet sich -> Google-Konto wählen -> Bestätigen

Der Token wird lokal auf deinem Rechner gespeichert und nie weitergegeben.

### Kann ELLA meinen Google Kalender bearbeiten?

Ja -- sowohl lesen als auch Termine erstellen:

```
"Was steht heute im Google Kalender?"
"Erstelle einen Termin morgen um 14 Uhr: Zahnarzt"
```

---

## 11. Gedächtnis & Lernen

### Wie merkt sich ELLA Dinge?

ELLA nutzt ein intelligentes Gedächtnis mit sogenannten "Vektor-Embeddings". Das bedeutet: Informationen werden nicht wortwörtlich gespeichert, sondern als bedeutungsmäßige Muster. Wenn du später eine ähnliche Frage stellst, findet ELLA die passende Erinnerung -- ähnlich wie menschliche Assoziationen.

> **Was sind Tokens?** Die kleinsten Einheiten, in die ein KI-Modell Text zerlegt. Ein Wort besteht meist aus 1-3 Tokens. "Guten Morgen" sind z.B. 2-4 Tokens. Das Gedächtnis arbeitet mit diesen Token-Mustern.

```
"Merk dir: Meine Steuernummer ist 123/456/78901"
"Merk dir: Ich mag keine E-Mails am Freitagnachmittag"
"Was weißt du über mich?"
```

### Kann ich Erinnerungen löschen?

Ja:

```
"Vergiss meine Steuernummer"
"Was weißt du über mich?" -> Erinnerung identifizieren
"Vergiss Erinnerung 42"
```

### Lernt ELLA durch Feedback?

Ja -- die **Daumen-Buttons** unter jeder Antwort geben ELLA Feedback. Daumen hoch speichert die Frage-Antwort-Kombination als positives Beispiel. ELLA nutzt diese Beispiele, um ähnliche Fragen künftig besser zu beantworten.

### Lernt ELLA meinen Schreibstil?

Ja -- mit OpenAI-Key. Wenn du ELLA bittest, einen Text "in deinem Stil" zu schreiben, analysiert sie vorhandene E-Mails und übernimmt Tonalität, typische Formulierungen und Satzstruktur.

```
"Schreib eine Absage an Herrn Müller in meinem Stil"
```

---

## 12. Proaktive Intelligenz

### Schreibt ELLA auch ohne Anfrage in den Chat?

Ja -- das ist eine der Kernfunktionen. ELLA beobachtet deinen Rechner und informiert dich proaktiv:

| Ereignis                         | Was ELLA sagt                                        |
| -------------------------------- | ---------------------------------------------------- |
| 30 Min vor Termin                | Meeting-Vorbereitung, Dokumente anbieten             |
| 18:00 Uhr                        | Tagesabschluss mit Aktivitäten und morgigen Terminen |
| USB-Stick angeschlossen          | Laufwerk angesagt, Inhalt angeboten                  |
| RAM über 85%                     | Warnung + Aufräumungsangebot                         |
| Festplatte über 90% voll         | Warnung + Bereinigungsoptionen                       |
| 30 Min inaktiv + Rückkehr        | Comeback-Briefing: Was hat sich verändert?           |
| 90 Min ununterbrochen gearbeitet | Pause-Empfehlung                                     |
| IBAN in Zwischenablage           | Kontextangebot                                       |

### Kann ich die proaktiven Meldungen deaktivieren?

Ja -- einzeln oder alle:

- **Einstellungen -> Modus -> Proaktive Intelligenz** ausschalten (alle)
- **Einstellungen -> Modus -> Zwischenablage-Muster erkennen** separat deaktivierbar
- Einzelne Kategorien per **Stummschalten-Button** an jeder proaktiven Nachricht

---

## 13. Sicherheit & Datenschutz

### Wo werden meine Daten gespeichert?

Alle Daten bleiben auf deinem Rechner:

| Daten            | Speicherort                        |
| ---------------- | ---------------------------------- |
| Gesprächsverlauf | Lokale Datenbank (MariaDB)         |
| Gedächtnis       | Lokale Datenbank                   |
| Einstellungen    | `%APPDATA%\ELLA\settings.json`     |
| Google-Token     | `%APPDATA%\ELLA\google-token.json` |

Keine Cloud-Synchronisierung, keine Telemetrie, keine Nutzungsdaten an uns oder Dritte.

### Wie sicher sind meine Profil-PINs?

PINs werden mit **PBKDF2+Salt und 100.000 Iterationen** gespeichert -- ein Industriestandard für Passwort-Hashing. Selbst bei direktem Datenbankzugriff wäre das Knacken eines PINs sehr aufwendig.

### Kann ELLA meine Webcam oder mein Mikrofon ohne mein Wissen aktivieren?

**Nein.** Die E.L.L.A. Direktive verbietet Überwachung ohne ausdrückliches Wissen und aktive Zustimmung. Das Mikrofon wird nur aktiviert, wenn du es explizit anforderst (Wakeword, Mikrofon-Button oder Freihand-Modus, den du selbst aktiviert hast).

### Kann ELLA meine Passwörter lesen?

Nein -- Fenster von Passwort-Managern und Banking-Apps (1Password, KeePass, Bitwarden, PayPal, Banking-URLs etc.) sind für alle Maus- und Fenster-Werkzeuge gesperrt.

### Werden sensible Daten aus dem Gedächtnis gefiltert?

Ja -- ELLA erkennt automatisch sensible Muster (API-Schlüssel, Passwörter, IBANs, Kreditkartennummern) und schwärzt sie, bevor sie im Gedächtnis oder der Zwischenablage-Historie gespeichert werden.

---

## 14. Die E.L.L.A. Direktive & Regeln

### Was ist die E.L.L.A. Direktive?

Vier unveränderliche Verbote, die tief in der Architektur verankert sind. Keine Einstellung und keine Regel kann sie außer Kraft setzen:

| Verbot         | Bedeutung                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------- |
| **harm**       | ELLA verursacht keinen physischen, finanziellen, psychologischen oder datenbezogenen Schaden |
| **conceal**    | ELLA verschleiert keine Aktionen, Fähigkeiten oder Systemzustände                            |
| **surveil**    | ELLA überwacht nicht ohne ausdrückliches Wissen und aktive Zustimmung                        |
| **exfiltrate** | ELLA gibt keine Daten an Dritte ohne ausdrückliche Zustimmung                                |

### Was passiert, wenn ELLA etwas blockiert?

ELLA zeigt im Chat einen **roten Badge** mit der Erklärung, warum die Aktion blockiert wurde. Diese Blockaden sind unveränderlich und können nicht umgangen werden -- auch nicht durch Umformulierung.

### Kann ich ELLA Regeln geben?

Ja -- zusätzlich zur unveränderlichen Direktive kannst du eigene Regeln erstellen, die steuern, wann ELLA welche Aktionen ausführen darf:

```
"Erlaube das Werkzeug clean_temp"
"Verbiete Musikwiedergabe zwischen 22 und 7 Uhr"
"Erstell eine Regel: keine Formatierung von Laufwerken"
```

Die Auswertungsreihenfolge ist: Direktive (unveränderlich) -> Verbots-Regeln -> Erlaubnis-Regeln -> Ausführung.

Du kannst auch einzelne Werkzeuge in den Einstellungen deaktivieren (**Einstellungen -> Tools** -- An/Aus-Schalter für jedes Werkzeug).

---

## 15. Nutzerprofile & PIN

### Was sind Nutzerprofile?

Mehrere Personen können ELLA mit getrennten Gedächtnissen und Gesprächsverläufen nutzen. Jedes Profil ist vollständig isoliert -- ein Profil kann nicht auf das Gedächtnis eines anderen zugreifen.

### Wie lege ich ein neues Profil an?

**Einstellungen -> Profile -> Neues Profil** -- Name und Farbe wählen, optional PIN setzen.

### Was passiert, wenn ich meinen Profil-PIN vergesse?

Für **Nutzerprofile** ist ein Zurücksetzen nur mit direktem Datenbankzugriff möglich. Wende dich in diesem Fall an den Entwickler.

Für den **Hausaufgaben-Modus PIN** gibt es einen Notfall-Reset unter Einstellungen -> Hausaufgaben-Modus.

---

## 16. Barrierefreiheit

### Welche Barrierefreiheits-Modi gibt es?

ELLA unterstützt zwei spezielle Modi unter **Einstellungen -> Modus -> Barrierefreiheit**:

| Modus              | Für wen        | Was sich ändert                                                                 |
| ------------------ | -------------- | ------------------------------------------------------------------------------- |
| **Blind-Modus**    | Sehbehinderte  | TTS immer aktiv, Audio-Feedback, Antworten ohne Formatierung, Bildanalyse aktiv |
| **Gehörlos-Modus** | Hörgeschädigte | Alle Audio-Ausgaben deaktiviert, nur Text                                       |

### Was kann ELLA für blinde Nutzer tun?

Im Blind-Modus liest ELLA alle Antworten automatisch vor. Zusätzlich kann ELLA den Bildschirminhalt beschreiben, Bilder analysieren und Webseiten vorlesen -- dafür wird ein OpenAI-Key benötigt.

---

## 17. Hausaufgaben-Modus

### Was ist der Hausaufgaben-Modus?

Ein PIN-gesicherter Modus für Kinder. ELLA kann dann nur Apps aus einer vorher definierten Liste öffnen und antwortet nur auf schulbezogene Anfragen.

### Wie aktiviere/deaktiviere ich ihn?

```
"Aktiviere den Hausaufgaben-Modus"  -> ELLA fragt nach dem PIN
"Deaktiviere den Hausaufgaben-Modus" -> ELLA fragt nach dem PIN
```

Der PIN muss vorher in den Einstellungen gesetzt werden. Bei vergessenem PIN: **Einstellungen -> Modus -> Hausaufgaben-Modus -> Notfall-Reset**.

---

## 18. Einstellungen & Updates

### Wie öffne ich die Einstellungen?

Über das **Zahnrad-Symbol** in der linken Navigation oder durch Sagen von:

```
"Öffne die Einstellungen"
```

### Kann ich ELLA per Gespräch konfigurieren?

Ja -- viele Einstellungen lassen sich direkt im Chat ändern:

```
"Erstell ein Setup namens Büro mit Chrome, Word und Teams"
"Ändere die Stimme auf Englisch"
"Verbiete Musikwiedergabe zwischen 22 und 7 Uhr"
```

### Warum werden Einstellungsänderungen nicht übernommen?

Du musst nach jeder Änderung auf **Speichern** klicken. Änderungen werden nicht automatisch gespeichert.

### Wie aktualisiere ich ELLA?

ELLA prüft in den Einstellungen unter **Über E.L.L.A.** ob eine neue Version verfügbar ist. Wenn ja, lädt sie den Installer herunter und führt das Update durch -- deine Einstellungen, Erinnerungen und Gesprächsverläufe bleiben erhalten.

Du kannst den Update-Check auch manuell auslösen: **Einstellungen -> Über E.L.L.A. -> Nach Updates suchen**. Der Check sendet keine Nutzerdaten -- es wird lediglich die neueste Versionsnummer abgerufen.

---

## 19. Fehler & Fehlerbehebung

### ELLA antwortet nicht

Mögliche Ursachen und Lösungen:

| Ursache                      | Lösung                                     |
| ---------------------------- | ------------------------------------------ |
| KI-Modell noch nicht geladen | Warten (orangener Banner zeigt Ladestatus) |
| Datenbank nicht gestartet    | ELLA neu starten                           |
| OpenAI-Key ungültig          | Key in Einstellungen -> LLM aktualisieren  |
| API abgestürzt               | ELLA neu starten                           |

Diagnose: `"Ella, wie ist dein Status?"`

### Spracherkennung funktioniert nicht

1. **Mikrofon-Berechtigung prüfen:** Windows -> Einstellungen -> Datenschutz -> Mikrofon -> ELLA erlauben
2. **Sprachmodus prüfen:** Einstellungen -> Modus -> Stimme auf "Wakeword" oder "Manuell" stellen
3. Alternativ: Tippe deinen Befehl, um zu prüfen, ob das Problem an der Spracherkennung oder der KI liegt

### Kokoro TTS funktioniert nicht

Kokoro TTS läuft direkt in ELLA -- kein separates Programm nötig. Mögliche Ursachen:

| Ursache                      | Lösung                                                     |
| ---------------------------- | ---------------------------------------------------------- |
| Stimmmodell lädt noch        | Kurz warten -- erster Start lädt ~80 MB                    |
| Kein Internet beim Erststart | Im Installer ist das Modell offline enthalten              |
| Dauerhaftes Problem          | ELLA neu starten -- Kokoro lädt beim nächsten Start erneut |

Bei dauerhaften Problemen wechselt ELLA automatisch auf die Online-Stimme (Microsoft Edge TTS).

### Google-Verbindung schlägt fehl

- Client-ID und Secret korrekt eingegeben (keine Leerzeichen)?
- In der Google Cloud Console: Anwendungstyp "Desktop App" (nicht "Web App")
- Token löschen und neu verbinden: Datei `%APPDATA%\ELLA\google-token.json` löschen

### Was bedeutet der rote "Direktive"-Badge im Chat?

ELLA hat eine Aktion blockiert, weil sie gegen die E.L.L.A. Direktive verstößt. Die Meldung erklärt warum. Diese Blockaden sind unveränderlich und können nicht umgangen werden.

---

_E.L.L.A. v1.5.7 -- Proprietär -- Alle Rechte vorbehalten_

_Weitere Dokumentation: [Hardware-Leitfaden](hardware.md) -- [Netzwerk](netzwerk.md) -- [Bedienungsanleitung](bedienungsanleitung.md)_
