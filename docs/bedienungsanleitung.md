# E.L.L.A. — Bedienungsanleitung

_Version 3.0.0_

---

## Inhaltsverzeichnis

1. [Was ist E.L.L.A.?](#1-was-ist-ella)
2. [Voraussetzungen](#2-voraussetzungen)
3. [Installation und erster Start](#3-installation-und-erster-start)
4. [Das Onboarding](#4-das-onboarding)
5. [Die Benutzeroberfläche](#5-die-benutzeroberfläche)
6. [Mit ELLA sprechen — Beispiele](#6-mit-ella-sprechen--beispiele)
7. [Sprache und Wakeword](#7-sprache-und-wakeword)
8. [Proaktive Nachrichten](#8-proaktive-nachrichten)
9. [Einstellungen](#9-einstellungen)
10. [Die E.L.L.A. Direktive](#10-die-ella-direktive)
11. [Hausaufgaben-Modus](#11-hausaufgaben-modus)
12. [Fehlerbehebung](#12-fehlerbehebung)

---

## 1. Was ist E.L.L.A.?

E.L.L.A. ist ein persönlicher KI-Assistent für Windows. Der Name steht für **Embedded Local Logic Agent** — ein Assistent der auf deinem eigenen Rechner läuft, ohne dass deine Daten in die Cloud gesendet werden müssen.

ELLA versteht natürliche Sprache und kann deinen Computer für dich bedienen: Apps starten, Dateien suchen, E-Mails verfassen, Termine nachschlagen, Erinnerungen setzen, Musik abspielen, und vieles mehr. Statt Menüs zu klicken, sagst oder schreibst du einfach was du brauchst.

### Zwei Betriebsmodi

| Modus                | Beschreibung                                         | Voraussetzung                           |
| -------------------- | ---------------------------------------------------- | --------------------------------------- |
| **Offline (Ollama)** | Alles bleibt auf deinem Rechner, kein Internet nötig | Ollama installiert, llama3.1:8b geladen |
| **Online (OpenAI)**  | Schnellere und präzisere Antworten via GPT-4o        | OpenAI API-Key in den Einstellungen     |

Im **Auto**-Modus verwendet ELLA automatisch OpenAI wenn ein API-Key vorhanden ist, sonst Ollama.

---

## 2. Voraussetzungen

Folgende Programme müssen installiert sein bevor du ELLA startest:

| Programm        | Zweck                                   | Download    |
| --------------- | --------------------------------------- | ----------- |
| **Ollama**      | Lokales KI-Modell (Offline-Betrieb)     | ollama.ai   |
| **MariaDB**     | Datenbank für Gedächtnis und Protokolle | mariadb.org |
| **Node.js 20+** | Laufzeitumgebung                        | nodejs.org  |
| **Python 3.12** | Wakeword-Erkennung                      | python.org  |

### Ollama-Modelle laden

Nach der Ollama-Installation diese beiden Modelle einmalig herunterladen:

```powershell
ollama pull llama3.1:8b        # Das Chat-Modell (ca. 4.7 GB)
ollama pull nomic-embed-text   # Für das Gedächtnis (ca. 274 MB)
```

### Python-Pakete für Wakeword

```powershell
py -3.12 -m pip install openwakeword onnxruntime soundfile
```

---

## 3. Installation und erster Start

### Installation mit dem Installer

1. `E.L.L.A.-Setup.exe` herunterladen und ausführen
2. Die Installation richtet alle notwendigen Dateien ein
3. Nach der Installation ELLA über das Desktop-Symbol starten

### Beim ersten Start

ELLA prüft automatisch ob alle Voraussetzungen erfüllt sind:

- Läuft Ollama? Sind die Modelle geladen?
- Ist MariaDB erreichbar?
- Ist das Onboarding abgeschlossen?

Falls etwas fehlt, zeigt ELLA einen Setup-Bildschirm mit genauen Anweisungen.

---

## 4. Das Onboarding

Beim allerersten Start führt dich ELLA durch einen kurzen Einrichtungsprozess:

**Schritt 1 — EULA**
Lies und akzeptiere die Nutzungsbedingungen.

**Schritt 2 — Dein Name**
Sag ELLA wie du heißt. Sie merkt sich das und spricht dich persönlich an.

**Schritt 3 — Die E.L.L.A. Direktive**
ELLA erklärt ihre vier unveränderlichen Verbote (kein Schaden, keine Täuschung, keine Überwachung, keine Datenweitergabe). Du bestätigst, dass du sie verstanden hast.

**Schritt 4 — Hardware-Scan**
ELLA scannt deinen Rechner und lernt deine Laufwerke und ihre Kapazitäten kennen.

**Schritt 5 — Stimme wählen**
Wähle aus verfügbaren Windows-Stimmen für die Sprachausgabe.

**Schritt 6 — Standort**
Optional: Teile ELLA deinen Standort mit, damit sie Wetter und lokale Informationen abrufen kann.

Nach dem Onboarding startet der normale Chat.

---

## 5. Die Benutzeroberfläche

### Hauptfenster

Das Fenster besteht aus drei Bereichen:

**Links — Navigation**
Über die Seitenleiste erreichst du Chat, Einstellungen und andere Bereiche.

**Mitte — Chat**
Hier findet das Gespräch mit ELLA statt. Du siehst alle Nachrichten, Tool-Ausführungen und Systembenachrichtigungen. Proaktive Nachrichten von ELLA erscheiben hier ebenfalls — ohne dass du etwas gefragt hast.

**Unten — Eingabe**
Das Textfeld für deine Nachrichten. Mit Enter sendest du, mit Shift+Enter machst du einen Zeilenumbruch.

### System Tray

ELLA läuft im Hintergrund und ist über das Tray-Icon (Taskleiste unten rechts) erreichbar. Rechtsklick öffnet ein Menü mit:

- Fenster öffnen/minimieren
- Autostart aktivieren/deaktivieren
- ELLA beenden

### Toast-Benachrichtigungen

Bei System-Ereignissen (volle Festplatte, RAM-Warnung, neues USB-Gerät) erscheinen kurze Meldungen oben im Chat. Diese werden auch vorgelesen wenn TTS aktiviert ist.

### Confirmation Card

Bei gefährlichen Aktionen (USB-Stick formatieren, Prozess beenden) zeigt ELLA eine Bestätigungskarte bevor sie handelt. Du musst explizit bestätigen — ELLA handelt nie eigenständig bei solchen Aktionen.

---

## 6. Mit ELLA sprechen — Beispiele

Du kannst mit ELLA wie mit einem Menschen schreiben oder sprechen. Du musst keine speziellen Befehle kennen.

### Programme und Setups

```
"Öffne Chrome"
"Starte mein Morgen-Setup"
"Welche Programme habe ich konfiguriert?"
"Schließe VLC"
```

### Dateien und Dokumente

```
"Suche die Datei Angebot"
"Suche alle PDFs mit dem Namen Rechnung"
"Öffne die Datei C:\Dokumente\Brief.docx und geh ans Ende"
"Zeig mir den Ordner E:\Projekte"
"Erstell ein neues Word-Dokument"
```

### Diktat

Sage ELLA was du schreiben willst. Sie tippt den Text in ein offenes Word-Dokument und korrigiert dabei automatisch Rechtschreibung, Grammatik und Zeichensetzung:

```
"Schreib auf: Sehr geehrte Damen und Herren ich wollte ihnen mitteilen das
 das Angebot noch gültigkeit hat"
```

ELLA schreibt: _"Sehr geehrte Damen und Herren, ich wollte Ihnen mitteilen, dass das Angebot noch Gültigkeit hat."_

### E-Mail verfassen

```
"Schreib eine E-Mail an mueller@firma.de"
"Betreff: Terminabsage, Text: Ich muss den Termin leider verschieben"
"Schreib mir eine Absage an Herrn Schmidt"
```

Das Outlook-Fenster öffnet sich mit dem vorbereiteten Entwurf. Du sendest selbst.

### Kalender und Termine

```
"Was steht heute im Kalender?"
"Welche Termine habe ich diese Woche?"
"Erstelle einen Termin morgen um 14 Uhr: Zahnarzt"
"Zeig mir meine Google-Termine für nächste Woche"
```

### E-Mails lesen

```
"Zeig mir meine ungelesenen Mails"
"Lies die letzten 10 E-Mails"
"Markiere die Mail von Müller als gelesen"
"Zeig mir meine Gmail-Nachrichten"
```

### Musik

```
"Spiel Musik"
"Spiel etwas von AC/DC"
"Öffne meine Jazz-Playlist"
"Spiel das Album Thriller"
```

ELLA durchsucht die konfigurierte Musikbibliothek und öffnet den Treffer im eingestellten Media Player.

### System und Hardware

```
"Wie viel Speicherplatz ist noch frei?"
"Wie viel RAM wird gerade genutzt?"
"Zeig mir den System-Status"
"Fahr den Rechner herunter"
"Ruhezustand"
```

### Prozesse

```
"Welche Programme fressen gerade am meisten RAM?"
"Zeig mir die laufenden Prozesse"
"Beende Notepad"
```

Systemkritische Prozesse (Windows-Dienste) kann ELLA grundsätzlich nicht beenden. Bei allen anderen fragt sie vorher nach.

### Lautstärke

```
"Stell die Lautstärke auf 40%"
"Schalte den Ton aus"
"Mach lauter"
```

### Zwischenablage

```
"Was steht in der Zwischenablage?"
"Zeig mir die letzten Einträge der Zwischenablage"
"Kopiere den Text: Hallo Welt"
```

ELLA merkt sich automatisch die letzten 20 Inhalte der Zwischenablage.

### Erinnerungen

```
"Erinnere mich morgen um 9 Uhr: Arzt anrufen"
"Setz eine Erinnerung für Freitag 15:00: Meeting vorbereiten"
"Welche Erinnerungen habe ich?"
"Lösche die Erinnerung 1234567890"
```

Die Erinnerungen erscheinen zum gesetzten Zeitpunkt als Windows-Popup — auch wenn ELLA im Hintergrund läuft.

### Screenshot und Bildanalyse

```
"Was siehst du?"
"Was steht auf meinem Bildschirm?"
"Analysiere den Bildschirm"
"Was bedeutet diese Fehlermeldung?" (dann macht ELLA einen Screenshot)
```

Diese Funktion benötigt einen OpenAI API-Key.

### Im eigenen Stil schreiben lassen

```
"Schreib mir eine Absage an Herrn Müller wegen des Termins nächsten Dienstag"
"Verfasse eine freundliche Mahnung für Rechnung 2024-042"
"Schreib eine kurze Dankesnachricht an das Team"
```

ELLA analysiert deinen bisherigen Schreibstil aus früheren E-Mails und übernimmt Tonalität, Anrede und typische Formulierungen.

### Netzwerk

```
"Welche Geräte sind in meinem Netzwerk?"
"Zeig mir alle aktiven Verbindungen"
"Welche Programme haben gerade eine Netzwerkverbindung?"
```

### Duplikate und Speicher

```
"Suche doppelte Dateien auf meinen Laufwerken"
"Welche Dateien verschwenden Speicherplatz?"
```

### Gedächtnis

```
"Merk dir: Meine Steuernummer ist 123/456/78901"
"Vergiss die Steuernummer"
"Was weißt du über mich?"
```

### Einstellungen per Gespräch ändern

```
"Erstell ein Setup namens Arbeiten mit Chrome, Word und Slack"
"Erlaube das Tool clean_temp"
"Verbiete das Tool format_drive zwischen 9 und 17 Uhr"
```

### Wetter und Standort

```
"Wie ist das Wetter heute?"
"Wird es morgen regnen?"
"Wo bin ich gerade?"
```

### Autostart

```
"Welche Programme starten automatisch mit Windows?"
"Was läuft alles beim Start?"
```

---

## 7. Sprache und Wakeword

### Sprachmodi

In den Einstellungen unter **Stimme** wählst du den Modus:

| Modus        | Beschreibung                                   |
| ------------ | ---------------------------------------------- |
| **Aus**      | Nur Texteingabe, keine Spracheingabe           |
| **Manuell**  | Mikrofon-Button im Chat drücken zum Sprechen   |
| **Wakeword** | ELLA hört permanent zu und reagiert auf "Ella" |

### Wakeword-Erkennung

Wenn du "Wakeword" aktivierst, läuft im Hintergrund ein Python-Prozess der auf das Wort **"Ella"** lauscht. Sobald du es sagst, öffnet ELLA automatisch das Mikrofon und wartet auf deine Frage.

> **Hinweis:** Das Wakeword wird vollständig lokal ausgewertet — es werden keine Audiodaten gesendet.

### ELLA pausieren

Wenn du ungestört arbeiten willst:

```
"Ella, mach 30 Minuten Pause"
"Pausiere für eine Stunde"
```

Das Wakeword wird für die angegebene Zeit deaktiviert. ELLA meldet sich automatisch zurück.

### Sprachausgabe (TTS)

In den Einstellungen unter **Stimme** aktivierst du die Sprachausgabe. Wähle aus den auf deinem System verfügbaren Windows-Stimmen. ELLA liest Antworten, Alerts und proaktive Nachrichten automatisch vor.

---

## 8. Proaktive Nachrichten

ELLA handelt ohne Aufforderung und schreibt von sich aus in den Chat:

| Wann                               | Was ELLA sagt                                                                                                           |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 30 Min vor einem Kalendertermin    | _"Du hast in 28 Minuten einen Termin: Projektmeeting. Soll ich relevante Dokumente suchen?"_                            |
| 18:00 Uhr                          | Tagesabschluss mit Anzahl erledigter Aktionen und morgigen Terminen                                                     |
| Nach 30 Min Inaktivität + Rückkehr | _"Willkommen zurück. Während du weg warst: 2 System-Alerts."_                                                           |
| Nach 90 Min aktiver Arbeit         | _"Du arbeitest seit 92 Minuten ohne Pause. Kurze Unterbrechung empfohlen."_                                             |
| Täglich 12 Uhr                     | Falls jeden Morgen dieselben Apps geöffnet werden: _"Soll ich ein Morgen-Setup erstellen?"_                             |
| Sonntags 10 Uhr                    | Falls > 500 MB durch Duplikate verschwendet: _"Ich habe 23 doppelte Dateigruppen gefunden. Soll ich die Liste zeigen?"_ |

Proaktive Nachrichten werden auch vorgelesen wenn TTS aktiviert ist.

---

## 9. Einstellungen

Öffne die Einstellungen über das Zahnrad-Symbol in der Navigation.

### Tab: LLM

Hier konfigurierst du das KI-Modell:

| Einstellung        | Beschreibung                                 |
| ------------------ | -------------------------------------------- |
| **Provider**       | Auto / OpenAI / Ollama                       |
| **Ollama-Modell**  | Standardmäßig `llama3.1:8b`                  |
| **OpenAI API-Key** | Für GPT-4o, Vision und Schreibstil-Lernen    |
| **Gesprächslimit** | Anzahl Nachrichten im Kontext (Standard: 20) |

### Tab: Tools

Aktiviere oder deaktiviere einzelne ELLA-Fähigkeiten. Deaktivierte Tools werden dem LLM nicht angeboten — ELLA kann sie dann nicht nutzen auch wenn sie danach gefragt wird.

### Tab: Setups

Setups sind Sammlungen von Apps die ELLA mit einem Befehl startet oder schließt.

**Beispiel:** Setup "Arbeiten" startet Chrome, Word und Slack gleichzeitig.

Setups können auch per Gespräch erstellt werden:

```
"Erstell ein Setup namens Büro mit Chrome, Word und Teams"
```

### Tab: Programme

Hier verwaltest du die Liste erlaubter Anwendungen:

- **Scannen:** ELLA durchsucht Startmenü und Registry nach installierten Programmen
- **Erlauben/Sperren:** Nur erlaubte Programme kann ELLA öffnen
- **Musikbibliothek:** Pfad zu deiner Musiksammlung (z.B. `H:\Musik`)
- **Standard Media Player:** Der Player der für Musik genutzt wird (muss in der Programmliste erlaubt sein)

> **Wichtig:** Nach Änderungen im Programme-Tab auf **Speichern** klicken.

### Tab: Modus

Konfiguriere Sprache und Stimme:

- **Stimme:** Wakeword / Manuell / Aus
- **TTS:** Sprachausgabe ein/aus, Stimme auswählen
- **Weckwort-Empfindlichkeit:** Wie sensibel das Wakeword reagiert

### Tab: Regeln

Die Regel-Engine steuert wann ELLA welche Aktionen ausführen darf. Jede Regel hat:

| Feld        | Beschreibung                                             |
| ----------- | -------------------------------------------------------- |
| **Tool**    | Welches Tool betroffen ist                               |
| **Aktion**  | `allow` (erlauben) oder `deny` (verbieten)               |
| **Trigger** | `always` — oder zeitbasiert (z.B. nur zwischen 9–17 Uhr) |

**Reihenfolge der Auswertung:**

1. Direktive (unveränderliche Verbote — höchste Priorität)
2. Deny-Regeln
3. Allow-Regeln
4. Standard: erlaubt

> ELLA zeigt im Chat einen roten Badge wenn eine Anfrage durch die Direktive oder eine Deny-Regel blockiert wird.

### Tab: Google

Verbinde ELLA mit deinem Google-Konto für Gmail und Google Calendar:

1. Google Client ID und Client Secret eintragen (aus der Google Cloud Console)
2. "Mit Google verbinden" klicken
3. Browser öffnet sich → Google-Konto autorisieren
4. Nach der Autorisierung kehrt ELLA automatisch zurück

Der Token wird lokal gespeichert und nie weitergegeben.

---

## 10. Die E.L.L.A. Direktive

Die Direktive sind vier unveränderliche Verbote die tief in ELLA verankert sind. Keine Einstellung und keine Regel kann sie außer Kraft setzen:

| Verbot         | Bedeutung                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------- |
| **harm**       | ELLA verursacht keinen physischen, finanziellen, psychologischen oder datenbezogenen Schaden |
| **conceal**    | ELLA verschleiert keine Aktionen, Fähigkeiten oder Systemzustände                            |
| **surveil**    | ELLA überwacht nicht ohne ausdrückliches Wissen und aktive Zustimmung                        |
| **exfiltrate** | ELLA gibt keine Daten an Dritte weiter ohne ausdrückliche Zustimmung                         |

**Praktische Auswirkungen:**

- Systemlaufwerk C: kann niemals formatiert werden
- Ungelesene Mails können nicht automatisch gelöscht werden
- ELLA kann keine Screenshot-Überwachung ohne dein Wissen einrichten
- ELLA sendet keine Daten ohne deine Genehmigung

---

## 11. Hausaufgaben-Modus

Der Hausaufgaben-Modus sperrt ELLA auf bestimmte Apps ein — gedacht für Kinder die ungestört lernen sollen.

### Aktivieren

```
"Aktiviere den Hausaufgaben-Modus"
```

oder in den Einstellungen unter **Sicherheit**.

### Funktionsweise

- Nur Apps aus der konfigurierten Whitelist können geöffnet werden
- ELLA antwortet nur auf schulbezogene Anfragen
- Der Modus ist mit einem SHA-256-PIN gesichert

### PIN einrichten

In den Einstellungen unter **Modus** → Hausaufgaben-Modus:

1. Neuen PIN eingeben und bestätigen
2. Speichern

### Deaktivieren

```
"Deaktiviere den Hausaufgaben-Modus"
```

ELLA fragt nach dem PIN.

### Notfall-Reset

Falls der PIN vergessen wurde, gibt es eine Notfall-Reset-Funktion in den Einstellungen die den Hausaufgaben-Modus ohne PIN deaktiviert.

---

## 12. Fehlerbehebung

### ELLA antwortet nicht

**Mögliche Ursachen:**

- Ollama läuft nicht → `sc start Ollama` in PowerShell oder Ollama-App starten
- MariaDB läuft nicht → `sc start MariaDB`
- Kein API-Key für OpenAI gesetzt und Ollama fehlt das Modell

**Prüfen:**

```
"Ella, wie ist dein Status?"
```

### Wakeword reagiert nicht

- Mikrofon-Berechtigung prüfen (Windows Einstellungen → Datenschutz → Mikrofon)
- Python-Pakete prüfen: `py -3.12 -m pip list | findstr openwakeword`
- Wakeword-Modus in den Einstellungen auf "Wakeword" gestellt?

### Musik wird nicht gefunden

- Musikbibliothek-Pfad in Einstellungen → Programme korrekt eingetragen?
- Media Player in der Programmliste erlaubt?
- Nach dem Eintragen auf **Speichern** geklickt?

### Google-Verbindung schlägt fehl

- Client ID und Secret korrekt eingetragen (keine Leerzeichen)?
- In der Google Cloud Console ist "Desktop App" als Anwendungstyp gewählt?
- Token-Datei löschen und neu verbinden: `google-token.json` im ELLA-Datenordner

### TTS funktioniert nicht

- In Einstellungen → Modus: TTS eingeschaltet?
- Eine Stimme ausgewählt?
- Windows-Sprachpakete installiert? (Windows Einstellungen → Zeit & Sprache → Sprache)

### Einstellung wird nicht gespeichert

- Immer den **Speichern**-Button klicken — Änderungen im Tab werden nicht automatisch übernommen
- Bei der Musikbibliothek: Pfad vollständig eingeben inkl. abschließendem Backslash (z.B. `H:\Musik\`)

---

_E.L.L.A. v3.0.0 · Proprietär · Alle Rechte vorbehalten_
