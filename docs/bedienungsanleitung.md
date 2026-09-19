# E.L.L.A. — Bedienungsanleitung

Version 1.3.0

---

## Inhaltsverzeichnis

1. [Was ist E.L.L.A.?](#1-was-ist-ella)
2. [Voraussetzungen](#2-voraussetzungen)
3. [Installation und erster Start](#3-installation-und-erster-start)
4. [Das Onboarding](#4-das-onboarding)
5. [Die Benutzeroberfläche](#5-die-benutzeroberfläche)
6. [Mit ELLA sprechen — Beispiele](#6-mit-ella-sprechen--beispiele)
7. [Aufgabenliste](#7-aufgabenliste)
8. [Sprache und Wakeword](#8-sprache-und-wakeword)
9. [Proaktive Intelligenz](#9-proaktive-intelligenz)
10. [Nutzerprofile](#10-nutzerprofile)
11. [Einstellungen](#11-einstellungen)
12. [Die E.L.L.A. Direktive](#12-die-ella-direktive)
13. [Hausaufgaben-Modus](#13-hausaufgaben-modus)
14. [Multi-Agenten-Pipeline](#14-multi-agenten-pipeline)
15. [Setup-Aktionen](#15-setup-aktionen)
16. [Token-Optimierung](#16-token-optimierung)
17. [Fehlerbehebung](#17-fehlerbehebung)

---

## 1. Was ist E.L.L.A.?

E.L.L.A. ist ein persönlicher KI-Assistent für Windows. Der Name steht für **Embedded Local Logic Agent** — ein Assistent der auf deinem eigenen Rechner läuft, ohne dass deine Daten in die Cloud gesendet werden müssen.

ELLA versteht natürliche Sprache und kann deinen Computer für dich bedienen: Apps starten, Dateien suchen, E-Mails verfassen, Termine nachschlagen, Erinnerungen setzen, Aufgaben verwalten, Musik abspielen — und vieles mehr. Statt Menüs zu klicken, sagst oder schreibst du einfach was du brauchst.

ELLA lernt mit der Zeit: Sie merkt sich deine Gewohnheiten, erkennt Muster in deiner Arbeit und meldet sich von sich aus wenn etwas wichtig ist — ohne dass du danach fragen musst.

### Betriebsmodi

| Modus                | Beschreibung                                              | Voraussetzung                           |
| -------------------- | --------------------------------------------------------- | --------------------------------------- |
| **Offline (Ollama)** | Alles bleibt auf deinem Rechner, kein Internet nötig      | Ollama installiert, llama3.1:8b geladen |
| **Online (OpenAI)**  | Schnellere, präzisere Antworten und erweiterte Funktionen | OpenAI API-Key in den Einstellungen     |

Im **Auto**-Modus verwendet ELLA automatisch OpenAI wenn ein API-Key vorhanden ist, sonst Ollama.

> **Hinweis zu Datenschutz:** Bestimmte Funktionen wie Fenster-Kontext und Gesprächskompression funktionieren ausschließlich im Ollama-Modus und senden niemals Daten an externe Dienste.

---

## 2. Voraussetzungen

| Programm        | Zweck                                          | Download    |
| --------------- | ---------------------------------------------- | ----------- |
| **Ollama**      | Lokales KI-Modell (Offline-Betrieb)            | ollama.ai   |
| **MariaDB**     | Datenbank für Gedächtnis, Aufgaben, Protokolle | mariadb.org |
| **Node.js 20+** | Laufzeitumgebung                               | nodejs.org  |
| **Python 3.12** | Wakeword-Erkennung, optional Kokoro TTS        | python.org  |

### Ollama-Modelle laden (einmalig)

```powershell
ollama pull llama3.1:8b        # Chat-Modell (ca. 4.7 GB)
ollama pull nomic-embed-text   # Gedächtnis-Modell (ca. 274 MB)
```

### Python-Pakete für Wakeword (einmalig)

```powershell
py -3.12 -m pip install openwakeword onnxruntime soundfile
```

### Optional: Kokoro TTS für bessere Sprachausgabe

```powershell
py -3.12 -m pip install kokoro-onnx sounddevice numpy
```

Kokoro ist eine lokale neuronale TTS-Engine die natürlicher klingt als die eingebauten Windows-Stimmen. Sie läuft vollständig offline und kann in den Einstellungen aktiviert werden.

> **Hinweis:** `numpy` ist bereits erforderlich und wird mit Kokoro mitinstalliert. Der Stress-Analyse-Server (`stress_server.py`) benötigt keine weiteren Pakete.

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

Falls etwas fehlt, zeigt ELLA einen Setup-Bildschirm mit genauen Anweisungen und Fortschrittsanzeige.

---

## 4. Das Onboarding

Beim allerersten Start führt dich ELLA durch einen kurzen Einrichtungsprozess:

**Schritt 1 — EULA**
Lies und akzeptiere die Nutzungsbedingungen.

**Schritt 2 — Dein Name**
Sag ELLA wie du heißt. Sie merkt sich das und spricht dich persönlich an.

**Schritt 3 — Die E.L.L.A. Direktive**
ELLA erklärt ihre vier unveränderlichen Verbote. Du bestätigst, dass du sie verstanden hast.

**Schritt 4 — Hardware-Scan**
ELLA scannt deinen Rechner und lernt deine Laufwerke und ihre Kapazitäten kennen.

**Schritt 5 — Stimme wählen**
Wähle ELLAs Stimme und Sprache für die Sprachausgabe. Vier weibliche Stimmen stehen zur Wahl:

| Sprache  | MsEdgeTTS (online) | Kokoro (offline) |
| -------- | ------------------ | ---------------- |
| Deutsch  | Katja              | af_sarah         |
| English  | Sonia              | bf_emma          |
| Español  | Elvira             | ef_dora          |
| Français | Denise             | ff_siwis         |

Klicke auf eine Stimme um eine Vorschau zu hören — ELLA spricht in der jeweiligen Sprache. Die Wahl gilt unabhängig von der App-Sprache (DE/EN).

**Schritt 6 — Standort**
Optional: Teile ELLA deinen Standort mit für Wetter und lokale Informationen.

Nach dem Onboarding startet der normale Chat.

---

## 5. Die Benutzeroberfläche

### Hauptfenster

**Links — Navigation**
Seitenleiste mit Chat, Einstellungen und Profil-Wechsler.

**Mitte — Chat**
Hier findet das Gespräch mit ELLA statt. Du siehst alle Nachrichten, Tool-Ausführungen und System-Benachrichtigungen. Proaktive Nachrichten von ELLA erscheinen hier von sich aus — ohne dass du etwas gefragt hast.

**Feedback-Buttons**
Unter jeder Antwort von ELLA erscheinen beim Hovern kleine Daumen-hoch/runter-Buttons. Damit kannst du ELLA Rückmeldung geben. Das Feedback wird gespeichert — aber niemals in den Gesprächs-Kontext eingebettet (kein Sicherheitsrisiko).

**Unten — Eingabe**
Textfeld für Nachrichten. Enter sendet, Shift+Enter macht einen Zeilenumbruch.

### System Tray

ELLA läuft im Hintergrund und ist über das Tray-Icon (Taskleiste rechts unten) erreichbar:

- Fenster öffnen/minimieren
- Autostart aktivieren/deaktivieren
- ELLA beenden

### Toast-Benachrichtigungen

Bei System-Ereignissen (volle Festplatte, RAM-Warnung, neues USB-Gerät, Clipboard-Muster) erscheinen kurze Meldungen im Chat. Diese werden vorgelesen wenn TTS aktiviert ist.

### Confirmation Card

Bei gefährlichen Aktionen (USB-Stick formatieren, Prozess beenden) zeigt ELLA eine Bestätigungskarte bevor sie handelt. Du musst explizit bestätigen.

---

## 6. Mit ELLA sprechen — Beispiele

Du kannst ELLA wie mit einem Menschen schreiben oder sprechen.

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
"Suche alle PDFs mit dem Namen Rechnung auf Laufwerk E"
"Öffne die Datei C:\Dokumente\Brief.docx und geh ans Ende"
"Zeig mir den Ordner E:\Projekte"
"Erstell ein neues Word-Dokument"
"Suche doppelte Dateien auf meinen Laufwerken"
```

### Diktat

ELLA tippt diktierten Text in ein offenes Word-Dokument und korrigiert automatisch Rechtschreibung, Grammatik und Zeichensetzung:

```
"Schreib auf: Sehr geehrte Damen und Herren ich wollte ihnen mitteilen
 das das Angebot noch gültigkeit hat"
```

ELLA schreibt: _"Sehr geehrte Damen und Herren, ich wollte Ihnen mitteilen, dass das Angebot noch Gültigkeit hat."_

### E-Mail verfassen

```
"Schreib eine E-Mail an mueller@firma.de"
"Betreff: Terminabsage, Text: Ich muss den Termin leider verschieben"
"Schreib mir eine Absage an Herrn Schmidt"
```

Das Outlook-Fenster öffnet sich mit dem vorbereiteten Entwurf. Du sendest selbst — ELLA sendet nie automatisch.

### Im eigenen Stil schreiben lassen

ELLA analysiert deinen Schreibstil aus früheren E-Mails und übernimmt Tonalität und typische Formulierungen:

```
"Schreib mir eine Absage an Herrn Müller wegen des Termins nächsten Dienstag"
"Verfasse eine freundliche Mahnung für Rechnung 2024-042"
"Schreib eine kurze Dankesnachricht an das Team"
```

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

Systemkritische Prozesse (Windows-Dienste) kann ELLA nicht beenden. Bei allen anderen fragt sie vorher nach.

### Lautstärke

```
"Stell die Lautstärke auf 40%"
"Schalte den Ton aus"
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

Die Erinnerungen erscheinen als Windows-Popup — auch wenn ELLA im Hintergrund läuft.

### Screenshot und Bildanalyse

```
"Was siehst du?"
"Was steht auf meinem Bildschirm?"
"Was bedeutet diese Fehlermeldung?"
```

Benötigt einen OpenAI API-Key.

### Netzwerk

```
"Welche Geräte sind in meinem Netzwerk?"
"Zeig mir alle aktiven Verbindungen"
```

### Autostart

```
"Welche Programme starten automatisch mit Windows?"
```

### Fenster-Automatisierung

```
"Öffne den Taschenrechner"
"Minimiere das aktive Fenster"
"Maximiere Chrome"
"Schreib 'Hallo Welt' ins aktive Fenster"
"Drück Enter im aktiven Fenster"
```

### Dienste

```
"Welche Windows-Dienste laufen gerade?"
"Starte den Drucker-Dienst"
"Stoppe den Spooler-Dienst"
```

### Bildschirm lesen und beobachten

```
"Was steht auf meinem Bildschirm?"
"Lies den Text aus dem aktiven Fenster"
"Beobachte den Bildschirm für 20 Sekunden und meld dich wenn sich etwas ändert"
```

`read_screen` liest den sichtbaren Text via Windows OCR (offline, WinRT). `watch_screen` überwacht Textänderungen bis zu 30 Sekunden und meldet neue Inhalte automatisch.

### Dateien verwalten

```
"Lies die Datei C:\Dokumente\Notizen.txt"
"Benenne C:\Dateien\Alt.txt in Neu.txt um"
"Kopiere C:\Quelle\Bericht.docx nach E:\Backup\"
"Erstelle den Ordner E:\Projekte\2026"
```

> **Hinweis:** Systemverzeichnisse (Windows, Programme, ProgramData) sind gesperrt und können nicht verändert werden.

### Maus und Klicks

```
"Bewege die Maus zur Mitte des Bildschirms"
"Klick auf die Schaltfläche 'Speichern'"
"Klick auf Position 400, 300"
"Ziehe von 100, 200 nach 500, 200"
```

`click_element` erkennt Schaltflächen und Text per OCR und klickt präzise — auch ohne genaue Koordinaten. Bei destruktiven Klicks erfolgt immer eine Bestätigung. Klicks in Passwort-Manager und Banking-Apps sind geblockt.

### Shell-Befehle

```
"Zeig mir alle Dateien in E:\Projekte"
"Führe ipconfig aus"
"Wie viel Speicher hat mein System?"
```

Shell-Befehle werden immer zuerst zur Bestätigung angezeigt. Über 60 gefährliche Befehle (format, rm -rf, Benutzer anlegen etc.) sind fest gesperrt.

### Systemkomfort

```
"Aktiviere den Dark Mode"
"Wie ist der Akkustand?"
"Wie heiß ist meine CPU gerade?"
"Zeig mir die letzten Windows-Fehler"
"Mit welchem WLAN bin ich verbunden?"
```

### Medien

```
"Nächster Titel"
"Pause"
"Lauter"
"Was läuft gerade?"
"Zeig mir den aktuellen Song"
```

`control_media` steuert den aktiven Mediaplayer über Systemtasten. `get_now_playing` liest den aktuell spielenden Titel via Windows Media Control (WinRT).

### Übersetzen und Zusammenfassen

```
"Übersetze diesen Text ins Englische: Guten Morgen"
"Fasse diesen Text zusammen: [langer Text]"
"Übersetze ins Spanische: Wie geht es dir?"
```

Übersetzung und Zusammenfassung laufen vollständig lokal über Ollama — oder optional über OpenAI wenn ein API-Key konfiguriert ist.

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
```

---

## 7. Aufgabenliste

ELLA verwaltet eine persistente Aufgabenliste — Aufgaben bleiben auch nach dem Neustart erhalten.

### Aufgaben anlegen

```
"Merk dir: Zahnarzt anrufen"
"Aufgabe: Präsentation vorbereiten, Priorität hoch, bis Freitag"
"Ich muss noch die Steuererklärung einreichen — bis 31. Juli"
```

### Aufgaben ansehen

```
"Welche Aufgaben habe ich?"
"Zeig mir meine offenen Aufgaben"
"Was steht noch aus?"
```

ELLA sortiert die Liste automatisch nach Priorität (hoch → normal → niedrig) und Fälligkeitsdatum.

### Aufgaben erledigen oder löschen

```
"Markiere Aufgabe 3 als erledigt"
"Erledigt: Zahnarzt anrufen"
"Lösche die Aufgabe 5"
```

### Integration im Tagesabschluss

Um 18 Uhr berichtet ELLA automatisch auch über fällige Aufgaben:

_"Du hast heute 14 Aktionen ausgeführt. Morgen hast du 2 Termine. Außerdem hast du 3 offene Aufgaben für morgen: 'Zahnarzt anrufen', 'Rechnung prüfen', 'Bericht abgeben'. Gute Nacht."_

---

## 8. Sprache und Wakeword

### Sprachmodi

In den Einstellungen unter **Modus** wählst du den Sprachmodus:

| Modus        | Beschreibung                                   |
| ------------ | ---------------------------------------------- |
| **Aus**      | Nur Texteingabe, keine Spracheingabe           |
| **Manuell**  | Mikrofon-Button im Chat drücken zum Sprechen   |
| **Wakeword** | ELLA hört permanent zu und reagiert auf "Ella" |

### Wakeword-Erkennung

Das Wakeword wird vollständig lokal ausgewertet — keine Audiodaten werden gesendet.

### ELLA pausieren

```
"Ella, mach 30 Minuten Pause"
"Pausiere für eine Stunde"
```

Das Wakeword wird deaktiviert, ELLA meldet sich automatisch zurück.

### Sprachausgabe (TTS)

ELLA liest Antworten, Alerts und proaktive Nachrichten automatisch vor wenn TTS aktiviert ist.

### Kokoro TTS — bessere Stimme

Wenn `kokoro-onnx` installiert ist, kann in den Einstellungen unter **Modus → TTS-Engine** auf "Kokoro" umgestellt werden. Kokoro klingt deutlich natürlicher als Windows-Standardstimmen und läuft vollständig lokal.

Wenn Kokoro nicht verfügbar ist, fällt ELLA automatisch auf die Windows-Stimme zurück.

### Gesprächssprache und Stimme

In den Einstellungen unter **Stimme → Gesprächssprache** wählst du welche Sprache ELLA sprechen soll — unabhängig davon in welcher Sprache du mit ihr schreibst:

- **Deutsch — Katja** (Standard)
- **English — Sonia**
- **Español — Elvira**
- **Français — Denise**

### Stress-Erkennung (opt-in)

Unter **Stimme → Stimmanalyse aktivieren** kann ELLA lernen wie du klingst. Wenn die Stimmanalyse aktiv ist:

- Jedes gesprochene Segment wird parallel zur Transkription ausgewertet
- Erkennt Anspannung in Tonhöhe, Sprechtempo und Energie
- Bei erhöhtem Stress antwortet ELLA ruhiger und mitfühlender
- Bei starkem Stress: _"Du klingst angespannt — alles in Ordnung?"_

Die Analyse läuft vollständig lokal (`stress_server.py`), keine Audiodaten verlassen das Gerät. Der Chat funktioniert normal wenn der Server nicht verfügbar ist.

---

## 9. Proaktive Intelligenz

ELLA handelt ohne Aufforderung und schreibt von sich aus in den Chat. Diese Nachrichten erscheinen als ELLA-Nachricht und werden vorgelesen wenn TTS aktiviert ist.

### Automatische Auslöser

| Wann                               | Was ELLA sagt                                                                                |
| ---------------------------------- | -------------------------------------------------------------------------------------------- |
| 30 Min vor einem Kalendertermin    | _"Du hast in 28 Minuten einen Termin: Projektmeeting. Soll ich relevante Dokumente suchen?"_ |
| 18:00 Uhr                          | Tagesabschluss mit Aktivitäten, morgigen Terminen und fälligen Aufgaben                      |
| Nach 30 Min Inaktivität + Rückkehr | _"Willkommen zurück. Während du weg warst: 2 System-Alerts."_                                |
| Nach 90 Min aktiver Arbeit         | _"Du arbeitest seit 92 Minuten ohne Pause. Kurze Unterbrechung empfohlen."_                  |
| Täglich 12 Uhr                     | Falls jeden Morgen dieselben Apps: _"Soll ich ein Morgen-Setup erstellen?"_                  |
| Sonntags 10 Uhr                    | Falls > 500 MB Duplikate: _"Ich habe 23 doppelte Dateigruppen gefunden."_                    |

### Clipboard-Mustererkennung

ELLA erkennt automatisch bekannte Muster wenn du etwas in die Zwischenablage kopierst — und bietet direkt Hilfe an:

| Erkanntes Muster   | Beispiel-Vorschlag                                                 |
| ------------------ | ------------------------------------------------------------------ |
| **IBAN**           | _"IBAN erkannt — soll ich sie in ein Dokument einfügen?"_          |
| **Paketnummer**    | _"Paketnummer erkannt — soll ich den Versandstatus nachschlagen?"_ |
| **Telefonnummer**  | _"Telefonnummer erkannt — soll ich eine Notiz dazu anlegen?"_      |
| **URL**            | _"URL erkannt — soll ich die Seite öffnen oder zusammenfassen?"_   |
| **E-Mail-Adresse** | _"E-Mail-Adresse erkannt — soll ich eine neue Mail vorbereiten?"_  |

Diese Erkennung läuft vollständig lokal. Clipboard-Inhalte werden nie an externe Dienste gesendet.

Die Funktion kann in den Einstellungen unter **Modus → Proaktive Intelligenz** deaktiviert werden.

### Fenster-Kontext

Wenn aktiviert (Einstellungen → Modus → Aktives Fenster als Kontext), weiß ELLA beim Chat welche Anwendung und welches Dokument du gerade geöffnet hast:

_"Ich sehe du arbeitest gerade in Word an 'Angebot_2024.docx' — soll ich den Text weiterschreiben?"_

> **Wichtig:** Diese Funktion ist standardmäßig **deaktiviert** und funktioniert ausschließlich im Ollama-Modus. Fenstertitel von Passwort-Managern und Banking-Apps werden nie weitergegeben.

### Gesprächskompression

Bei langen Gesprächen (ab 15 Nachrichten) fasst ELLA die ältesten Nachrichten automatisch zusammen, um den Kontext effizienter zu nutzen. Du bemerkst davon nichts — das Gespräch läuft normal weiter.

> Diese Funktion nutzt ausschließlich das lokale Ollama-Modell und sendet keine Gesprächsinhalte nach außen.

---

## 10. Nutzerprofile

ELLA unterstützt mehrere Nutzerprofile. Jedes Profil hat sein eigenes Gedächtnis und seinen eigenen Gesprächsverlauf.

### Profile anlegen

In den Einstellungen → **Profile** (oder via API) kann ein neues Profil mit Namen und Farbe erstellt werden. Optional kann ein PIN gesetzt werden.

### Profil wechseln

Der Profilwechsler ist in der Navigation erreichbar. Bei PIN-geschützten Profilen wird der PIN abgefragt.

### Profil-Isolation

- Gedächtnis-Einträge eines Profils sind für andere Profile nicht sichtbar
- Gesprächsverläufe sind profilgetrennt
- Aufgabenlisten können profilgebunden sein
- Globale Regeln (Erlaubnis/Verbots-Regeln) gelten für alle Profile

### Standard-Profil

Beim ersten Start wird automatisch das Profil **"Standard"** angelegt. Alle bisherigen Daten gehören zu diesem Profil.

### Profil-PINs

Profile können mit einem PIN gesichert werden. ELLA verwendet PBKDF2 mit Salt und 100.000 Iterationen — deutlich sicherer als ein einfaches Passwort-Hash.

---

## 11. Einstellungen

Öffne die Einstellungen über das Zahnrad-Symbol in der Navigation.

### Tab: LLM

| Einstellung        | Beschreibung                                 |
| ------------------ | -------------------------------------------- |
| **Provider**       | Auto / OpenAI / Ollama                       |
| **Ollama-Modell**  | Standardmäßig `llama3.1:8b`                  |
| **OpenAI API-Key** | Für GPT-4o, Vision und Schreibstil-Lernen    |
| **Gesprächslimit** | Anzahl Nachrichten im Kontext (Standard: 20) |

### Tab: Tools

Aktiviere oder deaktiviere einzelne ELLA-Fähigkeiten. Deaktivierte Tools werden dem LLM nicht angeboten — ELLA kann sie dann auch nicht nutzen wenn sie explizit danach gefragt wird.

### Tab: Setups

Setups sind Automatisierungs-Makros: ELLA startet oder schließt Apps — und kann danach beliebige weitere Aktionen ausführen.

Setups können per Gespräch erstellt werden:

```
"Erstell ein Setup namens Büro mit Chrome, Word und Teams"
```

#### Setup-Aktionen (ab v1.3.0)

Jedes Setup kann zusätzlich zu den App-Listen eine **Aktionsliste** enthalten. Aktionen werden sequenziell nach dem Öffnen/Schließen der Apps ausgeführt.

**Aktionen hinzufügen:**

1. Im Setup-Editor unter **Aktionen** das gewünschte Template aus dem Dropdown wählen
2. Parameter ausfüllen (z. B. Lautstärke 60)
3. Optionale **Bezeichnung** vergeben (erscheint in der Aktionsliste)
4. Optionale **Verzögerung** in Millisekunden eintragen — z. B. 2000 ms Pause bevor die Lautstärke gesetzt wird
5. **+ Aktion hinzufügen** klicken

**Verfügbare Aktions-Templates:**

| Template              | Parameter         | Beschreibung                                |
| --------------------- | ----------------- | ------------------------------------------- |
| App öffnen            | App-Name          | Öffnet eine konfigurierte App               |
| Lautstärke setzen     | 0–100             | Setzt die Systemlautstärke                  |
| Dark/Light Mode       | —                 | Schaltet zwischen Hell und Dunkel um        |
| RAM freigeben         | —                 | Bereinigt den Arbeitsspeicher               |
| ELLA pausieren        | Minuten (1–480)   | Deaktiviert das Wakeword für X Minuten      |
| Zwischenablage setzen | Text              | Befüllt die Zwischenablage mit einem Inhalt |
| Text übersetzen       | Text, Zielsprache | Übersetzt und gibt das Ergebnis aus         |

**"▶ Jetzt" ausführen:**

Der grüne Jetzt-Button im Setup-Editor führt das Setup sofort aus — ohne den Chat öffnen zu müssen. Während der Ausführung wechselt er auf ⏳.

### Tab: Programme

- **Scannen:** ELLA durchsucht Startmenü und Registry nach installierten Programmen
- **Erlauben/Sperren:** Nur erlaubte Programme kann ELLA öffnen
- **Musikbibliothek:** Pfad zu deiner Musiksammlung (z.B. `H:\Musik`)
- **Standard Media Player:** Der Player der für Musik genutzt wird

> **Wichtig:** Nach Änderungen immer auf **Speichern** klicken.

### Tab: Modus

Sprache, TTS und Proaktiv-Einstellungen:

| Einstellung                        | Beschreibung                                            |
| ---------------------------------- | ------------------------------------------------------- |
| **Stimme**                         | Wakeword / Manuell / Aus                                |
| **TTS**                            | Sprachausgabe ein/aus                                   |
| **TTS-Stimme**                     | Windows-Stimme auswählen                                |
| **TTS-Engine**                     | System (Windows) oder Kokoro (lokal, natürlicher)       |
| **Aktives Fenster als Kontext**    | ELLA kennt die aktive Anwendung beim Chat (Ollama-only) |
| **Zwischenablage-Muster erkennen** | IBAN, Paketnummern etc. proaktiv erkennen               |
| **Gesprächs-Kompression**          | Lange Sessions automatisch zusammenfassen (Ollama-only) |

### Tab: Regeln

Die Regel-Engine steuert wann ELLA welche Aktionen ausführen darf:

| Feld        | Beschreibung                                             |
| ----------- | -------------------------------------------------------- |
| **Tool**    | Welches Tool betroffen ist                               |
| **Aktion**  | `allow` (erlauben) oder `deny` (verbieten)               |
| **Trigger** | `always` — oder zeitbasiert (z.B. nur zwischen 9–17 Uhr) |

**Auswertungsreihenfolge:**

1. Direktive (unveränderliche Verbote — höchste Priorität)
2. Deny-Regeln
3. Allow-Regeln
4. Standard: erlaubt

ELLA zeigt im Chat einen roten Badge wenn eine Anfrage blockiert wird.

### Tab: Google

1. Google Client ID und Client Secret eintragen (aus der Google Cloud Console)
2. "Mit Google verbinden" klicken → Browser öffnet sich → Autorisieren
3. ELLA kehrt automatisch zurück

Der Token wird lokal gespeichert und nie weitergegeben.

---

## 12. Die E.L.L.A. Direktive

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
- Fenster-Kontext und Kompression funktionieren nie mit OpenAI
- Clipboard-Inhalte werden nie an externe Dienste gesendet
- ELLA sendet keine Daten ohne deine Genehmigung

---

## 13. Hausaufgaben-Modus

Sperrt ELLA auf bestimmte Apps ein — gedacht für Kinder die ungestört lernen sollen.

### Aktivieren

```
"Aktiviere den Hausaufgaben-Modus"
```

### Funktionsweise

- Nur Apps aus der konfigurierten Whitelist können geöffnet werden
- ELLA antwortet nur auf schulbezogene Anfragen
- Der Modus ist PIN-gesichert

### PIN einrichten

In den Einstellungen unter **Modus** → Hausaufgaben-Modus → Neuen PIN eingeben → Speichern.

### Deaktivieren

```
"Deaktiviere den Hausaufgaben-Modus"
```

ELLA fragt nach dem PIN.

### Notfall-Reset

Falls der PIN vergessen wurde: Einstellungen → Notfall-Reset deaktiviert den Hausaufgaben-Modus ohne PIN.

---

## 14. Multi-Agenten-Pipeline

Die Multi-Agenten-Pipeline lässt mehrere KI-Agenten parallel an einer Aufgabe arbeiten und fasst ihre Ergebnisse automatisch zusammen. Voraussetzung: OpenAI API-Key in den Einstellungen.

### Öffnen

Die Seite ist über **Multi-Agenten** in der Navigation erreichbar.

### Vordefinierte Pipelines

| Pipeline           | Agenten                                      | Ergebnis                                             |
| ------------------ | -------------------------------------------- | ---------------------------------------------------- |
| **Morgenbriefing** | Kalender · Aufgaben · Wetter                 | Zusammenfassung des Tages als strukturierter Bericht |
| **System-Report**  | Speicher · Performance · Prozesse · Netzwerk | Vollständiger Systemstatus auf einen Blick           |

### Ablauf

1. Pipeline auswählen
2. **Starten** klicken — jeder Agent arbeitet parallel, sein Streaming-Ergebnis erscheint live in seiner Kachel
3. Sobald alle Agenten fertig sind, erstellt ELLA automatisch eine **Synthese-Zusammenfassung**
4. Optional: nach Abschluss ein App-Setup ausführen (z. B. Arbeitsprogramme öffnen)

### Hinweis

Die Multi-Agenten-Pipeline nutzt OpenAI GPT-4o und erzeugt mehrere API-Aufrufe parallel. Bei häufiger Nutzung entstehen entsprechende API-Kosten.

---

## 15. Setup-Aktionen

Ab v1.3.0 sind Setups nicht mehr auf "Apps öffnen und schließen" beschränkt — sie können beliebige ELLA-Aktionen als geordnete Schritte enthalten.

### Beispiel: Arbeits-Setup

Ein Setup "Arbeiten" könnte folgendes tun:

1. Chrome, Word und Slack **öffnen**
2. Spotify **schließen**
3. **500 ms warten** (Apps brauchen einen Moment zum Starten)
4. **Lautstärke auf 30 %** setzen (kein ablenkendes Hintergrundgeräusch)
5. **Dark Mode aktivieren** (konzentriert auf dem Bildschirm)

Das alles passiert mit einem einzigen Befehl: `"Starte mein Arbeits-Setup"` — oder per Klick auf **▶ Jetzt** in den Einstellungen.

### Aktionen im Gespräch steuern

```
"Starte mein Morgen-Setup"
"Lade das Setup Zocken"
```

ELLA führt automatisch alle konfigurierten Aktionen in der richtigen Reihenfolge aus und berichtet das Ergebnis.

### Dashboard — Port-Ereignisse (v1.3.0)

Wenn eine Anwendung einen neuen Netzwerk-Port öffnet, erscheint ein Eintrag unter **System-Events (Live)** im Dashboard:

- Port-Nummer und Prozessname werden angezeigt
- Grau: normaler Vorgang
- Orange: Port ohne zuordenbaren Prozess (seltener Ausnahmefall)

Diese Transparenz ist stumm — sie belastet den Chat nicht mit technischen Details.

---

## 16. Token-Optimierung

Ab v1.1.0 enthält ELLA zwei Mechanismen die API-Kosten und Latenz deutlich reduzieren — ohne dass du etwas konfigurieren musst.

### Tool-Selector

Statt alle 85 Tools bei jeder Anfrage an das Modell zu schicken, analysiert ELLA die Anfrage zuerst und sendet nur die ~12 relevantesten Tools.

- **Bis zu 90 % weniger Input-Tokens** pro Anfrage
- Ab Runde 1 des Tool-Loops werden nur noch kontextrelevante Tools angeboten
- Wirkt sich auf Antwortgeschwindigkeit und OpenAI-Kosten aus
- Keine Konfiguration nötig — läuft automatisch

### Token-Optimizer

Tool-Ergebnisse können sehr groß sein (z. B. Dateilisten, Prozesslisten). Der Token-Optimizer komprimiert diese Ergebnisse bevor sie in den Gesprächskontext eingebettet werden:

- Base64-Daten werden herausgefiltert
- Große Arrays werden auf die wesentlichen Einträge gekürzt
- Der tatsächliche Inhalt bleibt vollständig erhalten

Beide Mechanismen arbeiten im Hintergrund und sind dauerhaft aktiv.

---

## 17. Fehlerbehebung

### ELLA antwortet nicht

- Ollama läuft nicht → `sc start Ollama` oder Ollama-App starten
- MariaDB läuft nicht → `sc start MariaDB`
- Kein API-Key und Ollama fehlt das Modell → `ollama pull llama3.1:8b`

Prüfen: `"Ella, wie ist dein Status?"`

### Wakeword reagiert nicht

- Mikrofon-Berechtigung prüfen (Windows → Datenschutz → Mikrofon)
- Python-Pakete prüfen: `py -3.12 -m pip list | findstr openwakeword`
- Wakeword-Modus in den Einstellungen auf "Wakeword" gestellt?

### Aufgaben verschwinden nach Neustart

- Das sollte nicht passieren — Aufgaben sind in MariaDB gespeichert
- MariaDB läuft? `sc query MariaDB` prüfen
- Profil-Wechsel: Aufgaben sind profilgebunden, nach Profilwechsel siehst du andere Aufgaben

### Musik wird nicht gefunden

- Musikbibliothek-Pfad in Einstellungen → Programme korrekt eingetragen?
- Media Player in der Programmliste erlaubt?
- Nach dem Eintragen auf **Speichern** geklickt?

### Clipboard-Muster erscheinen nicht

- Funktion in Einstellungen → Modus → "Zwischenablage-Muster erkennen" aktiviert?
- Muster werden nur bei neuen Inhalten erkannt (nicht wenn derselbe Text erneut kopiert wird)

### Fenster-Kontext funktioniert nicht

- In Einstellungen → Modus: "Aktives Fenster als Kontext" aktiviert?
- Nur im Ollama-Modus verfügbar — bei aktivem OpenAI-Provider bleibt der Kontext leer
- Sensible Fenstertitel (Passwort-Manager, Banking) werden absichtlich gefiltert

### Kokoro TTS funktioniert nicht

- Python-Pakete installiert? `py -3.12 -m pip list | findstr kokoro`
- Einstellungen → Modus → TTS-Engine auf "Kokoro" gestellt?
- ELLA fällt automatisch auf die Windows-Stimme zurück wenn Kokoro nicht startet
- ELLA neu starten damit der Kokoro-Prozess gestartet wird

### Google-Verbindung schlägt fehl

- Client ID und Secret korrekt eingetragen (keine Leerzeichen)?
- In der Google Cloud Console ist "Desktop App" als Anwendungstyp gewählt?
- Token-Datei löschen und neu verbinden: `google-token.json` im ELLA-Datenordner

### WLAN wird als "deaktiviert" angezeigt

Falls `"Mit welchem WLAN bin ich verbunden?"` trotz bestehender Verbindung "deaktiviert" zurückgibt:

- Ab v1.3.0 behoben: ELLA nutzt jetzt `Get-NetConnectionProfile` statt textbasiertes Parsing — funktioniert mit deutsch und englisch lokalisierten Windows-Versionen
- Funktioniert für alle Verbindungstypen: WLAN, Hotspot, USB-Tethering
- Falls weiterhin ein Problem: `Get-NetConnectionProfile` in PowerShell manuell ausführen und prüfen ob eine Verbindung gelistet wird

### Aktive Netzwerkverbindungen zeigen 0 Einträge

Ab v1.3.0 behoben: betraf alle Windows-Systeme mit PowerShell 5.1 (der Standard auf Windows 10/11). Ursache war ein Inkompatibilitäts-Problem mit dem `??`-Operator und einem Typenkonflikt bei Prozess-IDs. Kein Handlungsbedarf — das Update löst das automatisch.

### Einstellung wird nicht gespeichert

- Immer den **Speichern**-Button klicken — Änderungen werden nicht automatisch übernommen
- Bei der Musikbibliothek: Pfad vollständig eingeben z.B. `H:\Musik\`

### Profil-PIN vergessen

- Einstellungen → Modus → Hausaufgaben-Modus → Notfall-Reset (für Homework-Mode)
- Für Nutzerprofile: PIN-Hash in der Datenbank zurücksetzen (Entwickler-Zugriff nötig)

---

_E.L.L.A. v1.3.0 · Proprietär · Alle Rechte vorbehalten_
