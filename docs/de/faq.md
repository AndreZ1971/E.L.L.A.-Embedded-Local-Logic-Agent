# E.L.L.A. — Häufig gestellte Fragen (FAQ)

Version 1.6.4 — Zuletzt aktualisiert: 2026-11-03

---

## Inhaltsverzeichnis

1. [Warum E.L.L.A.? Und ist das sicher?](#1-warum-ella--und-ist-das-sicher)
2. [„Ella beobachtet meinen Rechner — ist das nicht Überwachung?"](#2-ella-beobachtet-meinen-rechner--ist-das-nicht-überwachung)
3. [Hardware & Performance](#3-hardware--performance)
4. [Lizenz & Kosten](#4-lizenz--kosten)
5. [Installation & erster Start](#5-installation--erster-start)
6. [KI-Modelle & Anbieter](#6-ki-modelle--anbieter)
7. [Spracheingabe & Sprachausgabe](#7-spracheingabe--sprachausgabe)
8. [Wakeword & Freihand-Modus](#8-wakeword--freihand-modus)
9. [Musik & Medien](#9-musik--medien)
10. [Dateien & Laufwerke](#10-dateien--laufwerke)
11. [E-Mail & Kalender](#11-e-mail--kalender)
12. [Gedächtnis & Lernen](#12-gedächtnis--lernen)
13. [Nutzerprofile & PIN](#13-nutzerprofile--pin)
14. [Barrierefreiheit](#14-barrierefreiheit)
15. [Hausaufgaben-Modus](#15-hausaufgaben-modus)
16. [Einstellungen & Updates](#16-einstellungen--updates)
17. [Fehler & Fehlerbehebung](#17-fehler--fehlerbehebung)

---

## 1. Warum E.L.L.A.? Und ist das sicher?

### Was ist E.L.L.A.?

E.L.L.A. steht für **Embedded Local Logic Agent** — ein persönlicher KI-Assistent für Windows, der vollständig auf deinem eigenen Rechner läuft. Ella versteht natürliche Sprache und bedient deinen Computer für dich: Apps starten, Dateien suchen, Musik abspielen, E-Mails verfassen, Termine nachschlagen, Wecker stellen und vieles mehr.

### Was macht E.L.L.A. besonders?

- **Unveränderliche Ethik:** Vier fest eingebaute Verbote (Schaden, Verschleierung, Überwachung, Datenweitergabe) kann keine Einstellung umgehen — der Rahmen, in dem alles andere passiert
- **Läuft lokal:** Das KI-Modell läuft auf deinem Rechner — kein Cloud-Zwang. Deine Gespräche bleiben auf deinem PC
- **Transparent:** Ella zeigt jede Aktion an und fragt bei sensiblen Dingen nach
- **Lernt mit:** Ella merkt sich Gewohnheiten und Vorlieben über ein intelligentes Gedächtnis
- **Handelt proaktiv:** Ella meldet sich von sich aus, wenn etwas wichtig ist
- **Versteht natürliche Sprache:** Du sprichst mit Ella wie mit einem Menschen — kein Syntaxlernen nötig

### Was ist die E.L.L.A. Directive?

Vier unveränderliche Verbote, tief in der Architektur verankert. Keine Einstellung und keine Regel kann sie außer Kraft setzen:

| Verbot         | Bedeutung                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------- |
| **harm**       | Ella verursacht keinen physischen, finanziellen, psychologischen oder datenbezogenen Schaden  |
| **conceal**    | Ella verschleiert keine Aktionen, Fähigkeiten oder Systemzustände                             |
| **surveil**    | Ella überwacht nicht ohne ausdrückliches Wissen und aktive Zustimmung                          |
| **exfiltrate** | Ella gibt keine Daten an Dritte ohne ausdrückliche Zustimmung                                  |

### Was passiert, wenn Ella etwas blockiert?

Ella zeigt im Chat einen **roten Banner** mit der Erklärung, warum die Aktion blockiert wurde. Diese Blockaden sind unveränderlich und können nicht umgangen werden — auch nicht durch Umformulierung.

### Kann Ella meine Webcam oder mein Mikrofon ohne mein Wissen aktivieren?

**Nein.** Die Directive verbietet Überwachung ohne ausdrückliches Wissen und aktive Zustimmung. Das Mikrofon wird nur aktiviert, wenn du es explizit anforderst (Wakeword, Mikrofon-Button oder Freihand-Modus, den du selbst eingeschaltet hast).

### Kann Ella meine Passwörter lesen?

Nein — Fenster von Passwort-Managern und Banking-Apps (1Password, KeePass, Bitwarden, PayPal, Banking-URLs etc.) sind für alle Maus- und Fenster-Werkzeuge gesperrt.

### Werden sensible Daten aus dem Gedächtnis gefiltert?

Ja — Ella erkennt automatisch sensible Muster (API-Schlüssel, Passwörter, IBANs, Kreditkartennummern) und schwärzt sie, bevor sie im Gedächtnis oder der Zwischenablage-Historie gespeichert werden.

### Welche Daten gehen in die Cloud?

**Standardmäßig: keine.** Im reinen lokalen Modus (Ollama) verlassen keine Gesprächsdaten deinen Rechner.

**Ausnahme deutsche Sprachausgabe:** Der vorgelesene Text wird an Microsoft übertragen (Edge TTS). Für Englisch, Französisch und Spanisch wird die lokale Kokoro-Stimme verwendet (kein Internet nötig).

Wenn du einen eigenen **OpenAI-Key** einträgst, werden diese Daten an OpenAI gesendet:

- Der Gesprächsverlauf (Chat-Nachrichten)
- Audio-Dateien bei Nutzung der OpenAI-Spracherkennung
- Screenshots bei Nutzung der Bildanalyse
- Multi-Agenten-Abläufe (laufen ausschließlich über OpenAI)

**Nie** an externe Dienste gesendet (auch mit OpenAI-Key): Zwischenablage-Inhalte, Fenster-Kontext, Erinnerungen und Gedächtnis-Inhalte. Jede Cloud-Anfrage wird im Dashboard-Zähler protokolliert — du hast volle Transparenz.

### Wo werden meine Daten gespeichert?

Alle Daten bleiben lokal auf deinem Rechner — Gesprächsverlauf und Gedächtnis in einer lokalen Datenbank (MariaDB), Einstellungen und Tokens im ELLA-Ordner. Keine Cloud-Synchronisierung, keine Telemetrie, keine Nutzungsdaten an uns oder Dritte.

### Wie sicher sind meine Profil-PINs?

PINs werden mit **PBKDF2 + Salt und 100.000 Iterationen** gespeichert — ein Industriestandard für Passwort-Hashing. Selbst bei direktem Datenbankzugriff wäre das Knacken eines PINs sehr aufwendig.

### Brauche ich Internet?

Für den **Grundbetrieb mit englischer, französischer oder spanischer Sprachausgabe: nein.** Chat, lokale Spracheingabe, Musik, Dateisuche, Systemsteuerung — alles läuft offline.

Internet ist nötig für: deutsche Sprachausgabe (Edge TTS), Lizenzprüfung beim Start (geht dank Cache auch ohne), Web-Suche und Wetter, OpenAI-Funktionen (nur mit eigenem Key), Gmail und Google Calendar (nur wenn verbunden) sowie die einmaligen Downloads beim allerersten Start. Alle Verbindungen im Detail: [netzwerk.md](netzwerk.md)

### Auf welchen Systemen läuft E.L.L.A.?

Auf **Windows 10 und Windows 11 (64-Bit)**. Eine Mac- oder Linux-Version ist nicht geplant.

---

## 2. „Ella beobachtet meinen Rechner — ist das nicht Überwachung?"

Das ist die häufigste Sorge — und die Antwort steckt in der Directive. Ella beobachtet, aber sie beobachtet **für dich, lokal, und sie gibt nichts nach außen.**

### Schreibt Ella auch ohne Anfrage in den Chat?

Ja — das ist eine Kernfunktion. Ella beobachtet deinen Rechner und informiert dich proaktiv:

| Ereignis                         | Was Ella sagt                                        |
| -------------------------------- | ---------------------------------------------------- |
| 30 Min vor Termin                | Meeting-Vorbereitung, Dokumente anbieten             |
| 18:00 Uhr                        | Tagesabschluss mit Aktivitäten und morgigen Terminen |
| USB-Stick angeschlossen          | Laufwerk angesagt, Inhalt angeboten                  |
| RAM über 85 %                    | Warnung + Aufräum-Angebot                            |
| Festplatte über 90 % voll        | Warnung + Bereinigungsoptionen                       |
| 30 Min inaktiv + Rückkehr        | Comeback-Briefing: Was hat sich verändert?           |
| 90 Min ununterbrochen gearbeitet | Pause-Empfehlung                                     |
| IBAN in Zwischenablage           | Kontext-Angebot                                      |

### Und was davon verlässt meinen Rechner?

**Nichts.** Diese Beobachtung läuft komplett lokal:

- Das Lesen von RAM, Festplatte, USB-Geräten oder Zwischenablage passiert auf deinem Rechner und wird nirgendwohin gesendet — das verbietet das **exfiltrate**-Verbot.
- Ella profiliert dich nicht heimlich — das verbietet das **surveil**-Verbot. Jede proaktive Meldung ist sichtbar, keine stille Datensammlung im Hintergrund.
- Die Zwischenablage-Erkennung (IBAN, Paketnummer, Telefonnummer) ist reine Mustererkennung auf deinem Gerät, um dir ein Angebot zu machen — der Inhalt wandert nicht in die Cloud.

Kurz: Ella sieht viel, damit sie dir helfen kann — aber was sie sieht, bleibt bei dir.

### Kann ich die proaktiven Meldungen deaktivieren?

Ja — einzeln oder alle:

- **Einstellungen → Modus → Proaktive Intelligenz** ausschalten (alle)
- **Einstellungen → Modus → Zwischenablage-Muster erkennen** separat deaktivierbar
- Einzelne Kategorien per **Stummschalten-Button** an jeder Meldung. Nach 5-maligem Wegdrücken derselben Kategorie schaltet Ella sie automatisch stumm

---

## 3. Hardware & Performance

### Welche Hardware brauche ich?

Ella läuft auf den meisten Windows-Rechnern der letzten 5 Jahre. Für die beste Erfahrung empfehlen wir eine **NVIDIA-Grafikkarte mit mindestens 10 GB Videospeicher (VRAM)**.

> **Was ist VRAM?** Der Arbeitsspeicher deiner Grafikkarte. Das KI-Modell wird komplett dort hinein geladen. Je mehr VRAM, desto größere und bessere Modelle kann Ella nutzen.

| Anforderung     | Minimum                     | Empfohlen                   |
| --------------- | --------------------------- | --------------------------- |
| Prozessor       | Intel Core i3 / AMD Ryzen 3 | Intel Core i5 / AMD Ryzen 5 |
| Arbeitsspeicher | 16 GB RAM                   | 32 GB RAM                   |
| Grafikkarte     | Nicht zwingend nötig        | NVIDIA mit 10–12 GB VRAM    |
| Festplatte      | 20 GB frei                  | 40 GB frei (SSD empfohlen)  |

Ausführlich: [hardware.md](hardware.md)

### Funktioniert Ella auf meinem Laptop?

**Ja** — auf jedem Windows-Laptop mit mindestens 16 GB RAM. Die Geschwindigkeit hängt von der Grafikkarte ab:

- **Laptop mit NVIDIA-GPU (10+ GB VRAM):** sehr gut, wie ein Desktop
- **Laptop mit kleinerer GPU (4–8 GB):** funktioniert, aber langsamer
- **Laptop ohne Grafikkarte:** funktioniert, aber langsam — OpenAI-Key empfohlen

**Tipp:** Mit einem OpenAI-Key kann Ella die Berechnung in die Cloud auslagern. Dann ist die lokale Hardware weniger wichtig.

### Ella antwortet langsam — was tun?

| Ursache                       | Lösung                                                                 |
| ----------------------------- | ---------------------------------------------------------------------- |
| Keine oder kleine Grafikkarte | OpenAI-Key eintragen — Ella nutzt dann Cloud-Berechnung                |
| Zu wenig RAM (unter 16 GB)    | Andere Programme schließen oder RAM aufrüsten                          |
| Erstes Laden nach dem Start   | Das KI-Modell wird in den Speicher geladen — 10–30 Sekunden warten     |
| Kontextfenster voll           | Neues Gespräch starten (Ella komprimiert lange Gespräche automatisch)  |

Ella nutzt automatisch eine Beschleunigungs-Technik, die die Verarbeitung deutlich schneller macht — standardmäßig aktiv, keine Konfiguration nötig.

---

## 4. Lizenz & Kosten

### Was kostet Ella?

Ein Premium-Produkt mit Einmalkauf. Preis und aktuelle Angebote auf [ella-agent.de](https://ella-agent.de).

### Wie funktioniert die Lizenz?

Nach dem Kauf erhältst du einen Lizenzschlüssel im Format `ELLA-XXXX-XXXX-XXXX-XXXX`. Diesen gibst du beim ersten Start ein. Die Lizenz wird einmalig online geprüft und dann lokal zwischengespeichert — danach funktioniert Ella auch ohne Internet. Sie ist an deinen Rechner gebunden (anonymer Hardware-Fingerprint); beim Rechnerwechsel kannst du sie übertragen.

### Kommen laufende Kosten auf mich zu?

Die lokale Nutzung (Ollama) verursacht **keine laufenden Kosten** (Strom ausgenommen). Optional kannst du einen eigenen OpenAI-Key eintragen — OpenAI rechnet dann nach Nutzung ab (wenige Cent pro Gespräch). Das ist keine Voraussetzung, sondern eine Erweiterung.

---

## 5. Installation & erster Start

### Wie installiere ich Ella?

1. Installationsdatei von ella-agent.de herunterladen und ausführen
2. Standard-Installationspfad bestätigen
3. Installation abwarten — alle Komponenten werden automatisch eingerichtet
4. Ella über das Desktop-Symbol starten

Es ist nichts weiter nötig. Der Installer enthält alles.

### Was passiert beim allerersten Start?

Ella führt dich durch ein kurzes Onboarding: Nutzungsbedingungen, Lizenzaktivierung, dein Name, die Directive, Hardware-Scan (Ella wählt ein passendes Modell) sowie Stimme & Standort. Beim ersten Start lädt Ella außerdem das KI-Modell herunter — das dauert je nach Internetgeschwindigkeit einige Minuten.

### Ella startet, zeigt aber einen orangenen Banner. Was tun?

Der häufigste Grund: Das KI-Modell wird noch geladen. Kurz warten — beim ersten Start wird es automatisch heruntergeladen. Verschwindet der Banner nach 2 Minuten nicht, Ella neu starten (Tray-Symbol → Beenden → Symbol doppelklicken).

---

## 6. KI-Modelle & Anbieter

### Welches Modell nutzt Ella — und welches ist das beste?

Ella nutzt ein lokales Sprachmodell über Ollama plus ein lokales Modell für das Gedächtnis. **Welches Sprachmodell am besten läuft, hängt stark von deiner Hardware ab — und ist ehrlicherweise eine Sache des Ausprobierens.**

Als Orientierung:

- Ein **kompaktes Llama-3-Modell** ist ein guter, schneller Standard — solide auf Deutsch und zuverlässig bei den Werkzeug-Aufrufen.
- **Größere Modelle** können stärker sein, brauchen aber mehr VRAM und antworten langsamer.
- Es kommen ständig neue Modelle heraus. Deshalb legt Ella dich auf keins fest: Du kannst **jederzeit wechseln oder dein eigenes Modell einsetzen.**

Das Gedächtnis-Modell läuft immer vollständig lokal.

### Kann ich ein anderes Ollama-Modell verwenden?

Ja — unter **Einstellungen → LLM → Ollama-Modell** kannst du jedes Modell eintragen, das du in Ollama geladen hast. Kleinere Modelle antworten schneller, verstehen komplexe Anfragen aber weniger gut. Beim Onboarding schlägt Ella passend zu deiner Grafikkarte eine Auswahl vor.

### Brauche ich einen OpenAI-Key?

**Nein.** Ella funktioniert vollständig ohne OpenAI. Mit einem eigenen Key werden einige Funktionen besser oder überhaupt erst verfügbar: schnellere und präzisere Antworten, Screenshot- und Bildanalyse, Texte im persönlichen Schreibstil, hochwertigere Spracherkennung. Den Key trägst du unter **Einstellungen → LLM → OpenAI API-Key** ein.

### Was ist der Unterschied zwischen Ollama und OpenAI?

|                 | Ollama (lokal)                  | OpenAI (Cloud)                         |
| --------------- | ------------------------------- | -------------------------------------- |
| Kosten          | Kostenlos                       | Pay-per-Use (wenige Cent pro Gespräch) |
| Datenschutz     | Alles bleibt auf deinem Rechner | Daten gehen an OpenAI                  |
| Geschwindigkeit | Abhängig von deiner Hardware    | Schnell und gleichmäßig                |
| Bildanalyse     | Eingeschränkt                   | Immer verfügbar                        |

### Was bedeutet „Provider: Auto"?

Im Auto-Modus wählt Ella automatisch den besten verfügbaren Anbieter. Hat sie einen gültigen OpenAI-Key, nutzt sie OpenAI — sonst Ollama. Du kannst in den Einstellungen auch einen festen Anbieter erzwingen.

---

## 7. Spracheingabe & Sprachausgabe

### Wie spreche ich mit Ella?

Vier Wege:

1. **Text:** Nachricht tippen und Enter drücken
2. **Mikrofon-Button:** einmalige Aufnahme per Klick
3. **Wakeword:** „Ella" sagen — Ella hört dann auf deinen Befehl (muss aktiviert werden)
4. **Freihand (Always-On):** Ella hört permanent zu

### Brauche ich für die Spracheingabe Internet?

Die Standard-Spracherkennung braucht Internet. Wenn du komplett offline bleiben möchtest, kannst du in den Einstellungen auf die lokale Spracherkennung (Whisper) umstellen — kein Internet nötig, aber etwas langsamer.

### Filtert Ella Störgeräusche heraus?

Ja. Wenn du sprichst und im Hintergrund Musik läuft, der Fernseher an ist oder du dich verhaspelst, erkennt Ella das und filtert es heraus — nur dein eigentlicher Befehl wird verarbeitet.

**Beispiel:**

- Was du sagst: _„äh ella äh öffne öffne mal den Explorer is this the real life"_
- Was Ella versteht: _„Öffne den Explorer"_

### Wie aktiviere ich die Sprachausgabe?

**Einstellungen → Modus → TTS** auf „An". Ella liest dann Antworten, Warnungen und proaktive Nachrichten vor.

### Kann Ella auch ohne Internet sprechen?

Für **Englisch, Französisch und Spanisch ja** — über die lokale Stimme Kokoro, vollständig offline. Für **Deutsch (Katja)** wird derzeit noch Microsoft Edge TTS verwendet (Internet nötig, der Text wird an Microsoft übertragen). Eine vollständig lokale deutsche Stimme ist in Arbeit — und weil die Directive „keine Verschleierung" verlangt, sagen wir das offen.

### Kann ich die Stimme ändern?

Ja — unter **Einstellungen → Stimme → Gesprächssprache**:

| Sprache  | Online-Stimme | Offline-Stimme (Kokoro) |
| -------- | ------------- | ----------------------- |
| Deutsch  | Katja         | (in Arbeit)             |
| English  | Sonia         | Emma                    |
| Español  | Elvira        | Dora                    |
| Français | Denise        | Siwis                   |

### Kann Ella erkennen, ob ich gestresst bin?

Ja — mit der optionalen **Stress-Erkennung** (Einstellungen → Stimme → Stimmanalyse aktivieren). Ella analysiert Tonhöhe, Tempo und Lautstärke und passt bei Anspannung ihren Ton an. Die Analyse läuft vollständig lokal — keine Audiodaten verlassen das Gerät. Standardmäßig aus.

---

## 8. Wakeword & Freihand-Modus

### Was ist der Unterschied?

| Modus                    | Wie es funktioniert                                                            |
| ------------------------ | ------------------------------------------------------------------------------ |
| **Wakeword**             | Ella hört auf das Schlüsselwort „Ella" und reagiert dann auf den nächsten Satz |
| **Freihand (Always-On)** | Ella hört permanent zu und schickt alles Gesagte direkt in den Chat            |
| **Manuell**              | Du drückst den Mikrofon-Button — nur dann hört Ella zu                         |

### Wie aktiviere ich das Wakeword?

**Einstellungen → Modus → Stimme** auf „Wakeword". Das Wakeword läuft vollständig lokal — keine Audiodaten werden übertragen.

### Wie pausiere ich das Wakeword?

```
"Ella, mach 30 Minuten Pause"
"Pausiere für eine Stunde"
```

Ella deaktiviert das Wakeword und meldet sich nach Ablauf automatisch zurück.

### Hört Ella immer zu — auch wenn ich privat telefoniere?

Im **Freihand-Modus** ja. Möchtest du Privatsphäre: Nutze den **Wakeword-Modus** (Ella aktiviert sich nur nach dem Schlüsselwort) oder stelle auf **Manuell** oder **Aus**.

---

## 9. Musik & Medien

### Wie sage ich Ella, wo meine Musik liegt?

**Einstellungen → Programme → Musikbibliothek** — Pfad zur Sammlung eintragen (z. B. `H:\Musik`) und **Speichern**.

### Wie suche und steuere ich Musik?

```
"Spiel etwas von Rammstein"
"Öffne das Album Thriller von Michael Jackson"
"Nächster Titel"
"Pause"
"Was läuft gerade?"
```

### Ella findet meine Musik nicht — was tun?

1. Pfad korrekt? → Einstellungen → Programme → Musikbibliothek
2. Laufwerk in der Suchliste? → Einstellungen → Programme → Suchlaufwerke
3. Nach jeder Änderung auf **Speichern** geklickt?

---

## 10. Dateien & Laufwerke

### Kann Ella auf allen Laufwerken suchen?

Ja — standardmäßig sucht Ella auf `C:\`. Weitere Laufwerke: **Einstellungen → Programme → Suchlaufwerke**.

### Kann Ella Systemlaufwerke formatieren?

**Nein** — ein hartes, unveränderliches Verbot. Immer gesperrt: `C:`, das Laufwerk mit der Ella-Installation und alle unter Einstellungen → Laufwerke → Geschützte Laufwerke eingetragenen.

### Kann Ella Dateien löschen?

Ella verschiebt Dateien in den **Papierkorb** — ein permanentes Löschen ohne Papierkorb ist nicht möglich. Du kannst die Aktion immer rückgängig machen.

### Wie finde ich doppelte Dateien?

```
"Suche doppelte Dateien auf meinen Laufwerken"
"Welche Dateien habe ich doppelt auf E:?"
```

Ella vergleicht Dateien inhaltlich (nicht nur per Name) und zeigt, wie viel Platz du durch Löschen der Duplikate gewinnst.

---

## 11. E-Mail & Kalender

### Kann Ella meine E-Mails lesen? Ist das sicher?

Ja, aber nur wenn du es erlaubst. **Outlook** funktioniert automatisch, wenn installiert. **Gmail** verbindest du einmalig mit deinem Google-Konto (Einstellungen → Google).

**Sicherheit:**

- Ella liest E-Mails nur auf deinem Rechner — im lokalen Modus werden keine Inhalte übertragen
- Ella kann **keine E-Mails automatisch senden** — sie erstellt nur Entwürfe, die du selbst absendest
- E-Mail-Inhalte fließen nicht ins Gedächtnis (es sei denn, du sagst ausdrücklich „merk dir das")

### Welche Dienste werden unterstützt?

**Outlook** (automatisch, wenn installiert) und **Gmail** (einmalige Einrichtung über Google OAuth).

### Wie verbinde ich Gmail?

1. In der [Google Cloud Console](https://console.cloud.google.com) eine App anlegen (OAuth 2.0, Typ: Desktop-App)
2. Client-ID und Secret kopieren
3. In Ella: **Einstellungen → Google → Client-ID + Secret eintragen**
4. „Mit Google verbinden" klicken → Browser öffnet sich → Google-Konto wählen → Bestätigen

Der Token wird lokal gespeichert und nie weitergegeben.

### Kann Ella meinen Google Kalender bearbeiten?

Ja — lesen und Termine erstellen:

```
"Was steht heute im Google Kalender?"
"Erstelle einen Termin morgen um 14 Uhr: Zahnarzt"
```

---

## 12. Gedächtnis & Lernen

### Wie merkt sich Ella Dinge?

Ella speichert Informationen nicht wortwörtlich, sondern als bedeutungsmäßige Muster. Stellst du später eine ähnliche Frage, findet Ella die passende Erinnerung — ähnlich wie menschliche Assoziationen.

```
"Merk dir: Ich mag keine E-Mails am Freitagnachmittag"
"Was weißt du über mich?"
```

### Kann ich Erinnerungen löschen?

Ja:

```
"Was weißt du über mich?"   → Erinnerung identifizieren
"Vergiss Erinnerung 42"
"Vergiss alles über mich"
```

### Lernt Ella durch Feedback?

Ja — die **Daumen-Buttons** unter jeder Antwort geben Ella Feedback. Daumen hoch speichert die Frage-Antwort-Kombination als positives Beispiel, das Ella bei ähnlichen Fragen künftig nutzt.

### Lernt Ella meinen Schreibstil?

Ja — mit OpenAI-Key. Bittest du Ella, einen Text „in deinem Stil" zu schreiben, analysiert sie vorhandene E-Mails und übernimmt Tonalität, typische Formulierungen und Satzbau.

```
"Schreib eine Absage an Herrn Müller in meinem Stil"
```

---

## 13. Nutzerprofile & PIN

### Was sind Nutzerprofile?

Mehrere Personen können Ella mit getrennten Gedächtnissen und Verläufen nutzen. Jedes Profil ist vollständig isoliert — ein Profil kann nicht auf das Gedächtnis eines anderen zugreifen.

### Wie lege ich ein Profil an?

**Einstellungen → Profile → Neues Profil** — Name und Farbe wählen, optional PIN setzen.

### Was, wenn ich meinen Profil-PIN vergesse?

Für Nutzerprofile ist ein Zurücksetzen nur mit direktem Datenbankzugriff möglich — wende dich dann an den Entwickler. Für den Hausaufgaben-Modus gibt es einen Notfall-Reset.

---

## 14. Barrierefreiheit

### Welche Modi gibt es?

Unter **Einstellungen → Modus → Barrierefreiheit**:

| Modus              | Für wen        | Was sich ändert                                                                 |
| ------------------ | -------------- | ------------------------------------------------------------------------------- |
| **Blind-Modus**    | Sehbehinderte  | TTS immer aktiv, Audio-Feedback, Antworten ohne Formatierung, Bildanalyse aktiv |
| **Gehörlos-Modus** | Hörgeschädigte | Alle Audio-Ausgaben deaktiviert, nur Text                                       |

### Was kann Ella für blinde Nutzer tun?

Im Blind-Modus liest Ella alle Antworten automatisch vor, beschreibt den Bildschirminhalt, analysiert Bilder und liest Webseiten vor (dafür wird ein OpenAI-Key benötigt).

---

## 15. Hausaufgaben-Modus

### Was ist der Hausaufgaben-Modus?

Ein PIN-gesicherter Modus für Kinder. Ella kann dann nur Apps aus einer vorher definierten Liste öffnen und antwortet nur auf schulbezogene Anfragen.

### Wie aktiviere/deaktiviere ich ihn?

```
"Aktiviere den Hausaufgaben-Modus"    → Ella fragt nach dem PIN
"Deaktiviere den Hausaufgaben-Modus"  → Ella fragt nach dem PIN
```

Der PIN muss vorher in den Einstellungen gesetzt werden. Bei vergessenem PIN: Einstellungen → Modus → Hausaufgaben-Modus → Notfall-Reset.

---

## 16. Einstellungen & Updates

### Wie öffne ich die Einstellungen?

Über das **Zahnrad-Symbol** in der Navigation oder per „Öffne die Einstellungen".

### Kann ich Ella per Gespräch konfigurieren?

Ja — vieles lässt sich direkt im Chat ändern:

```
"Erstell ein Setup namens Büro mit Chrome, Word und Teams"
"Ändere die Stimme auf Englisch"
"Verbiete Musikwiedergabe zwischen 22 und 7 Uhr"
```

### Warum werden Änderungen nicht übernommen?

Du musst nach jeder Änderung auf **Speichern** klicken — Änderungen werden nicht automatisch gespeichert.

### Wie aktualisiere ich Ella?

Unter **Einstellungen → Über E.L.L.A.** prüft Ella, ob eine neue Version verfügbar ist, lädt den Installer und führt das Update durch — deine Einstellungen, Erinnerungen und Verläufe bleiben erhalten. Der Check sendet keine Nutzerdaten, nur die neueste Versionsnummer wird abgerufen.

---

## 17. Fehler & Fehlerbehebung

### Ella antwortet nicht

| Ursache                      | Lösung                                     |
| ---------------------------- | ------------------------------------------ |
| KI-Modell noch nicht geladen | Warten (orangener Banner zeigt Ladestatus) |
| Datenbank nicht gestartet    | Ella neu starten                           |
| OpenAI-Key ungültig          | Key in Einstellungen → LLM aktualisieren   |
| API abgestürzt               | Ella neu starten                           |

Diagnose: `"Ella, wie ist dein Status?"`

### Spracherkennung funktioniert nicht

1. Mikrofon-Berechtigung prüfen: Windows → Einstellungen → Datenschutz → Mikrofon → Ella erlauben
2. Sprachmodus prüfen: Einstellungen → Modus → Stimme auf „Wakeword" oder „Manuell"
3. Alternativ: Befehl tippen, um zu prüfen, ob das Problem an der Spracherkennung oder der KI liegt

### Kokoro-Stimme funktioniert nicht

Läuft direkt in Ella — kein separates Programm nötig. Mögliche Ursachen: Stimmmodell lädt noch (kurz warten), oder ein dauerhaftes Problem → Ella neu starten. Bei anhaltenden Problemen wechselt Ella automatisch auf die Online-Stimme (Edge TTS).

### Google-Verbindung schlägt fehl

- Client-ID und Secret korrekt eingegeben (keine Leerzeichen)?
- In der Google Cloud Console: Anwendungstyp „Desktop App" (nicht „Web App")
- Token löschen und neu verbinden (Einstellungen → Google → Verbindung trennen)

### Was bedeutet der rote „Directive"-Banner im Chat?

Ella hat eine Aktion blockiert, weil sie gegen die Directive verstößt. Die Meldung erklärt warum. Diese Blockaden sind unveränderlich und können nicht umgangen werden.

---

_E.L.L.A. v1.6.4 — Proprietär — Alle Rechte vorbehalten_

_Weitere Dokumentation: [Hardware-Leitfaden](hardware.md) — [Netzwerk](netzwerk.md) — [Bedienungsanleitung](bedienungsanleitung.md)_
