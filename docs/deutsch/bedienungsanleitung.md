# E.L.L.A. -- Bedienungsanleitung

Version 1.5.7

---

## Was ist E.L.L.A.?

E.L.L.A. steht für _Embedded Local Logic Agent_ -- dein persönlicher KI-Assistent für Windows. ELLA läuft direkt auf deinem eigenen Rechner. Kein Abo, kein Datenschutz-Kleingedrucktes. Installieren und loslegen.

Die KI läuft lokal über Ollama -- deine Daten bleiben auf deinem Rechner. Für einige optionale Funktionen (deutsche Sprachausgabe, Multi-Agenten, Bilderkennung) kann ein eigener OpenAI-Key konfiguriert werden -- Details unter [Netzwerkverbindungen](netzwerk.md).

---

## 1. Erster Start

### Installation

1. Die Setup-Datei ausführen
2. Installationspfad wählen (Standard: `C:\Programme\E.L.L.A`)
3. Der Installer richtet alles automatisch ein -- nichts weiter installieren

### Onboarding

Beim ersten Start führt dich ELLA in sechs Schritten durch die Einrichtung:

1. **Sprache** -- Deutsch oder Englisch für die Oberfläche
2. **Nutzungsbedingungen** -- EULA und die ELLA-Direktive akzeptieren
3. **Hardware-Scan** -- ELLA erkennt deinen Rechner und schlägt ein passendes Sprachmodell vor. Du bestätigst die Auswahl -- kein Download ohne deine Zustimmung
4. **Stimme wählen** -- 4 weibliche Stimmen in Deutsch, Englisch, Spanisch und Französisch. Jede Stimme kann vorab angehört werden
5. **Standort** -- für Wetter und lokale Infos (optional, kann übersprungen werden)
6. **Lizenzaktivierung** -- deinen Lizenzschlüssel eingeben (`ELLA-XXXX-XXXX-XXXX-XXXX`)

Danach öffnet sich der Chat -- fertig.

---

## 2. Chat -- wie rede ich mit ELLA?

Schreib einfach in normalem Deutsch. Keine Befehle, keine Sondersyntax. ELLA versteht natürliche Sprache.

**Beispiele:**

- "Wie wird das Wetter morgen?"
- "Öffne Chrome und Spotify"
- "Fasse diese PDF zusammen"
- "Wie viel Speicherplatz ist noch frei?"

### Was du im Chat siehst

- **Tool-Chips:** Unter jeder Antwort zeigt ELLA kurz, welches Werkzeug sie benutzt hat -- volle Transparenz über jede Aktion
- **Provider-Chip:** Unten links im Chat zeigt ein grüner Chip ob gerade die lokale KI oder die Cloud aktiv ist
- **Directive-Banner:** Wenn ELLA eine Anfrage ablehnt, erscheint ein roter Banner mit der Begründung
- **Feedback-Buttons:** Daumen hoch oder Daumen runter unter jeder Antwort -- ELLA lernt aus deinem Feedback und passt sich dauerhaft an

### Gedächtnis

ELLA merkt sich Dinge über Gespräche hinweg. Du kannst ihr gezielt etwas beibringen:

- "Merk dir: ich trinke morgens keinen Kaffee"
- "Was weißt du über mich?"
- "Vergiss die Notiz über den Kaffee"

ELLA erkennt auch Zusammenhänge: Wenn du sagst "Mein Sohn heißt Max" und später "Max geht aufs Einstein-Gymnasium", kann ELLA die Frage "Auf welche Schule geht mein Sohn?" beantworten.

---

## 3. Sprachsteuerung

### Sprachmodi

In den Einstellungen unter "Sprache" findest du vier Modi:

| Modus        | Beschreibung                                        |
| ------------ | --------------------------------------------------- |
| **Aus**      | Kein automatisches Zuhören                          |
| **Manuell**  | Nur per Mikrofon-Button im Chat                     |
| **Wakeword** | Sag "Ella" -- ELLA hört dann zu und antwortet       |
| **Immer**    | Kontinuierliches Zuhören -- ELLA hört dauerhaft mit |

**Tipp:** Im Wakeword-Modus kannst du nach einer Antwort 8 Sekunden lang direkt weitersprechen, ohne erneut "Ella" zu sagen.

### Stopp-Befehl

Während ELLA spricht, kannst du sie jederzeit unterbrechen. Sag einfach "Stopp", "Halt", "Sei still" oder "Leise" -- die Sprachausgabe bricht sofort ab.

### Diktat-Modus

Im Diktat-Modus wird deine Sprache transkribiert und direkt ins aktive Fenster auf deinem Bildschirm getippt -- egal ob Word, Browser oder E-Mail-Programm.

**Aktivieren:**

- Einstellungen -> Sprache -> Modus auf "Diktat" stellen
- Oder: Tastenkürzel `Strg+Alt+Leertaste` (änderbar in den Einstellungen)

ELLA hört zu, wandelt Sprache in Text um und tippt ihn ins aktive Fenster. Optional kann eine Rechtschreibkorrektur vor dem Einfügen aktiviert werden. Deine Zwischenablage wird dabei nicht überschrieben.

### Sprachausgabe

ELLA spricht in vier Sprachen: Deutsch, Englisch, Spanisch und Französisch.

- **Englisch, Französisch und Spanisch** nutzen eine lokale Stimme (Kokoro); falls Kokoro nicht verfügbar ist, wird auf Edge TTS zurückgegriffen (Internetverbindung nötig)
- **Deutsch** nutzt Microsoft Edge TTS -- dabei wird der gesprochene Text an Microsoft-Server übertragen

Die Stimme wählst du im Onboarding oder später unter Einstellungen -> Sprache.

---

## 4. Einstellungen

Alle Einstellungen erreichst du über das Zahnrad-Symbol.

### KI-Anbieter

| Modus              | Beschreibung                                           |
| ------------------ | ------------------------------------------------------ |
| **Ollama (lokal)** | Alles läuft auf deinem Rechner. Standard-Einstellung   |
| **OpenAI**         | Cloud-basiert. Erfordert deinen eigenen OpenAI API-Key |
| **Auto**           | Lokal zuerst, OpenAI als Fallback wenn nötig           |

### Sprachmodell

ELLA schlägt beim Onboarding ein Modell passend zu deiner Hardware vor. Du kannst es jederzeit ändern:

- **Vordefinierte Modelle:** Klein, Standard oder Groß -- je nach Leistung deines Rechners
- **Eigenes Modell:** Jedes in Ollama installierte Modell erscheint als Auswahl. Du kannst auch einen beliebigen Modellnamen eingeben

### Stimme und Sprache

- **Gesprochene Sprache:** DE / EN / ES / FR -- bestimmt die Stimme und Aussprache
- **Stresserkennung:** Optional -- ELLA erkennt Anspannung in deiner Stimme und reagiert einfühlsamer (opt-in, standardmäßig aus)

### Erscheinungsbild

Drei visuelle Stile:

- **Calm** (Standard) -- Ruhiges, dunkles Design. Klassische Seitenleiste
- **HUD** -- Technisches Layout mit Daten-Panels, Top-Leiste statt Seitenleiste und einem zentralen Orb als Visualisierung
- **Show** -- Präsentationsmodus im Vollbild. Zeigt nur den Orb und die letzte Antwort. Sensible Daten (E-Mails, Dateipfade) werden automatisch ausgeblendet

**Akzentfarben im HUD-Modus:** Cyan, Violett oder Bernstein.

Wechsel: Einstellungen -> Erscheinungsbild.

Im Blind-Modus, Hausaufgaben-Modus oder bei Bewegungseinschränkungen im System schaltet ELLA automatisch auf Calm zurück.

### Programme

ELLA kann installierte Programme öffnen und steuern. Unter Einstellungen -> Programme siehst du alle erkannten Apps.

- **Programm nicht gefunden?** Suchfeld nutzen oder per "Durchsuchen"-Button manuell hinzufügen
- Neu installierte Programme erscheinen nach einem Scan automatisch

### Setups (App-Makros)

Ein Setup öffnet und schließt mehrere Programme auf einmal -- wie ein Knopfdruck.

- **Erstellen:** Einstellungen -> Setups -> Neu. Oder im Chat: "Erstell ein Setup namens Homeoffice: öffne Teams, Outlook und Chrome"
- **Ausführen:** "Lade mein Arbeits-Setup" oder "Jetzt"-Button in den Einstellungen
- **Aktionen:** Jedes Setup kann zusätzliche Aktionen enthalten (Lautstärke ändern, Dark Mode umschalten, Text übersetzen und mehr)

### Regeln

Du kannst ELLAs Verhalten mit eigenen Regeln steuern:

- "Erstell eine Regel: ELLA darf keine E-Mails versenden"
- "Regel: zwischen 22 und 7 Uhr keine Wecker stellen"

Regeln lassen sich in den Einstellungen verwalten.

### Cloud-Transparenz

Alle Anfragen an OpenAI werden gezählt und im Dashboard als Kachel angezeigt. Du siehst immer wie oft die Cloud heute genutzt wurde.

### Offline-Modus

Unter Einstellungen -> Offline-Modus kannst du die meisten Internetdienste sperren:

- Websuche, Wetter, Standort und Webseiten-Analyse gesperrt
- Kein OpenAI
- Lizenzprüfung nutzt den lokalen Cache
- Lokale Netzwerk-Funktionen (Geräte im WLAN, Verbindungen) bleiben verfügbar

Hinweis: Im Offline-Modus steht nur Kokoro-TTS zur Verfügung (Englisch, Französisch, Spanisch). Deutsche Sprachausgabe (Edge TTS) ist im Offline-Modus deaktiviert.

---

## 5. HUD-Modus

Der HUD-Modus verwandelt ELLA in ein technisches Dashboard mit Live-Daten.

### Aktivieren

Einstellungen -> Erscheinungsbild -> HUD wählen.

### Was ändert sich?

- **Top-Leiste** statt Seitenleiste -- mit Logo, Navigation und Status-Chips (LOKAL / OFFLINE / CLOUD)
- **Zentraler Orb** -- ein animierter Kreis, der ELLAs Zustand visualisiert (bereit, hört zu, denkt, spricht, Cloud, offline)
- **Widget-Spalten** -- links und rechts neben dem Chat zeigen konfigurierbare Panels Live-Daten

### Widgets

Du kannst in den Einstellungen (Tab Erscheinungsbild) auswählen, welche Widgets links und rechts erscheinen. Verfügbar sind:

| Widget        | Zeigt                                         |
| ------------- | --------------------------------------------- |
| **System**    | CPU, RAM, VRAM, Festplatte, Temperatur        |
| **Monitore**  | Angeschlossene Bildschirme                    |
| **Routinen**  | Deine Setups mit nächster Ausführungszeit     |
| **Direktive** | Die 4 Grundregeln der ELLA-Direktive          |
| **Uhr**       | Digitale Uhrzeit                              |
| **Aufgaben**  | Offene Aufgaben (max. 5) mit Prioritätsfarben |
| **E-Mail**    | Letzte 4 E-Mails mit Ungelesen-Zähler         |
| **Musik**     | Aktuell gespielter Titel                      |

### Performance

ELLA drosselt Animationen automatisch während sie nachdenkt -- damit dein Rechner nicht ausgebremst wird. Diese Drosselung lässt sich unter Einstellungen -> Erscheinungsbild ein- oder ausschalten.

---

## 6. Hausaufgaben-Modus

Der Hausaufgaben-Modus ist ein PIN-gesicherter Kioskmodus -- gedacht für Situationen, in denen nur bestimmte Programme erlaubt sein sollen.

### So funktioniert es

1. Sag: "Hausaufgaben-Modus aktivieren" oder geh in die Einstellungen
2. Lege eine PIN fest
3. Ab jetzt kann nur noch auf freigegebene Programme zugegriffen werden

### Beenden

Nur mit der PIN. Es gibt kein automatisches Ablaufdatum -- der Modus bleibt aktiv, bis die korrekte PIN eingegeben wird.

Falls die PIN verloren geht, gibt es einen Notfall-Reset.

---

## 7. Barrierefreiheit

### Blind-Modus

Optimiert für Screenreader und blinde Nutzer:

- Sprachausgabe ist immer aktiv -- jede Antwort wird vorgelesen
- Keine Markdown-Formatierung (Aufzählungszeichen, Fettschrift etc.) -- nur klarer, linearer Text
- Audio-Töne signalisieren Zustandswechsel (bereit, denkt, antwortet)
- Alle Buttons und Eingabefelder haben beschreibende Labels für Screenreader
- Begrüssung beim Laden der App

### Gehörlosenmodus

Optimiert für gehörlose Nutzer:

- Sprachausgabe und Mikrofon-Button sind komplett ausgeblendet
- Ein visueller Banner im Chat zeigt, dass der Modus aktiv ist
- ELLA erwähnt keine Sprachfunktionen in ihren Antworten

Beide Modi findest du unter Einstellungen -> Barrierefreiheit.

---

## 8. Proaktive Nachrichten

ELLA meldet sich manchmal von selbst -- ohne dass du etwas fragst. Das passiert zum Beispiel wenn:

- Ein Laufwerk unter 10 % freien Speicher fällt
- Der Arbeitsspeicher dauerhaft überlastet ist
- Ein USB-Gerät angesteckt oder entfernt wird
- Ein Wecker auslöst
- Eine IBAN, Paketnummer oder Telefonnummer in der Zwischenablage erkannt wird
- Ein Kalendertermin in 15 Minuten beginnt
- Am Abend noch offene Aufgaben bestehen
- Du lange ohne Pause arbeitest

### Stummschalten

Jede proaktive Nachricht hat zwei Buttons:

- **Wegdrücken** -- diese einzelne Nachricht schließen
- **Stummschalten** -- diese Art von Nachricht dauerhaft unterdrücken

Nach 5-maligem Wegdrücken derselben Kategorie schaltet ELLA sie automatisch stumm.

Systemkritische Benachrichtigungen (Wecker, geplante Setups) können nicht stummgeschaltet werden.

---

## 9. Schach spielen

ELLA kann Schach spielen -- in einem eigenen Fenster mit vier visuellen Themes.

```
"Lass uns Schach spielen"
"Öffne das Schachbrett"
```

- **4 Themes** -- Classic, Neon, Marble und Midnight. Jedes mit eigenem Farbschema, Leuchteffekt und Partikel-Hintergrund
- **KI-Gegnerin** -- ELLA wählt ihren Zug aus den legalen Optionen und kommentiert die Partie live
- **Pause und Fortsetzen** -- Partien jederzeit unterbrechen. Beim nächsten Öffnen erscheint ein "Weiter"-Button
- **Reflexion** -- Nach Spielende speichert ELLA Erkenntnisse und wird im nächsten Spiel besser
- **Geschlagene Figuren** -- Werden mit Materialvorteil über und unter dem Brett angezeigt

---

## 10. Dateien und Dokumente

### Dateien suchen

```
"Suche die Datei Angebot"
"Finde alle PDFs mit dem Wort Rechnung"
"Wo ist mein Lebenslauf?"
```

ELLA durchsucht alle Laufwerke -- über den Windows-Suchindex für schnelle Ergebnisse.

### Dateien öffnen, kopieren, umbenennen, löschen

```
"Öffne C:\Dokumente\Bericht.docx"
"Kopiere das Dokument Vertrag nach D:\Backup"
"Benenne die Datei Foto1.jpg um in Urlaub2024.jpg"
"Lösche die Datei temp_backup.zip"
```

### Dokumente lesen und verstehen

ELLA kann Word-Dokumente, PDFs, Excel-Tabellen, HTML und Textdateien lesen:

```
"Was steht in dieser PDF?"
"Fasse das Word-Dokument zusammen"
"Lies mir die Excel-Tabelle vor"
```

### Dokumente erstellen und diktieren

```
"Erstell ein neues Word-Dokument namens Protokoll"
"Diktiere in das Dokument Bericht: Sehr geehrte Damen und Herren..."
```

### Volltextsuche in deinen Dokumenten

ELLA kann Ordner indexieren und deren Inhalte durchsuchbar machen:

```
"Indexiere meinen Dokumente-Ordner"
"Durchsuche meine indexierten Dokumente nach Steuerbescheid"
```

### Doppelte Dateien finden

```
"Suche nach doppelten Dateien"
"Wie viel Platz verschwende ich durch Duplikate?"
```

---

## 11. E-Mail und Kalender

### Outlook

ELLA arbeitet direkt mit Outlook zusammen:

**E-Mails lesen:**

```
"Zeig mir meine ungelesenen Mails"
"Was hat Klaus geschrieben?"
```

**E-Mail verfassen:**

```
"Schreib einen Entwurf an Klaus: Treffen morgen 14 Uhr?"
```

ELLA öffnet einen Entwurf in Outlook -- die E-Mail wird nicht automatisch gesendet.

**Kalender:**

```
"Was steht diese Woche im Kalender?"
"Erstell einen Termin: Zahnarzt, Freitag 10 Uhr"
```

### Gmail und Google Calendar

ELLA unterstützt auch Gmail und Google Calendar über eine einmalige Anmeldung (OAuth):

```
"Zeig mir meine Gmail-Mails"
"Was steht im Google Kalender heute?"
"Termin in Google Calendar: Arzt, Montag 9 Uhr"
```

Die Einrichtung findest du in den Einstellungen.

---

## 12. Tastenkürzel

| Tastenkürzel         | Funktion                                                  |
| -------------------- | --------------------------------------------------------- |
| `Strg+Alt+Leertaste` | Diktat-Modus ein-/ausschalten (änderbar in Einstellungen) |
| `Esc`                | Präsentationsmodus (Show) beenden                         |

---

## Weitere Funktionen

### Texte schreiben und übersetzen

```
"Schreib mir ein professionelles Anschreiben für die Stelle als..."
"Übersetze das auf Englisch"
"Fasse diesen Text zusammen"
"Korrigiere diesen Text"
```

ELLA kann auch deinen persönlichen Schreibstil lernen und Texte in deinem Stil verfassen.

### System und Leistung

```
"Wie läuft mein System gerade?"
"Wie viel Speicherplatz ist noch auf C?"
"Wie heiß ist meine CPU?"
"Gib den RAM frei"
"Bereinige die Temp-Dateien"
```

### Musik und Medien

```
"Spiel etwas von Coldplay"
"Pause"
"Nächster Titel"
"Was spielt gerade?"
```

### Aufgaben und Erinnerungen

```
"Füge die Aufgabe 'Steuern erledigen' hinzu"
"Zeig mir meine offenen Aufgaben"
"Stell einen Wecker für 7:30 Uhr"
"Erinner mich morgen um 15 Uhr: Arzttermin anrufen"
```

### Netzwerk

```
"Wer ist in meinem Netzwerk?"
"Zeig mir aktive Verbindungen"
"Wie ist mein WLAN-Status?"
```

### Internet und Suche

```
"Suche nach dem aktuellen Bitcoin-Kurs"
"Wie wird das Wetter heute?"
```

Die Websuche läuft über DuckDuckGo -- ohne Tracking.

### Programme und Fenster steuern

```
"Öffne Chrome"
"Minimiere das aktuelle Fenster"
"Schließe alle Word-Fenster"
"Dark Mode einschalten"
"Fahr den Rechner herunter"
```

### Multi-Agenten

Die leistungsstärkste Funktion: Mehrere KI-Agenten arbeiten gleichzeitig an einer Aufgabe -- schneller und gründlicher.

Erfordert einen OpenAI-Key. Zwei vordefinierte Pipelines:

- **Morgenbriefing** -- Kalendertermine, offene Aufgaben und Wetter auf einen Blick
- **System-Report** -- Speicherplatz, RAM, Top-Prozesse und Netzwerkstatus

Du findest Multi-Agenten als eigene Seite in der Navigation.

### Hardware-Informationen

```
"Was für eine Grafikkarte habe ich?"
"Wie viel RAM ist verbaut?"
"Welche USB-Geräte sind angeschlossen?"
"Welche Monitore sind verbunden?"
```

### Drucker

```
"Welche Drucker habe ich?"
"Drucke das Dokument"
"Zeig mir aktive Druckaufträge"
```

### Kamera

```
"Welche Kameras sind angeschlossen?"
"Mach ein Foto"
```

### Desktop-Automation

ELLA kann deinen Bildschirm lesen, Maus und Tastatur steuern:

```
"Was steht auf meinem Bildschirm?"
"Klicke auf den OK-Button"
"Sende Strg+C an das aktive Fenster"
```

---

## Nutzerprofile

Mehrere Personen können ELLA auf demselben Rechner nutzen -- jedes Profil hat sein eigenes Gedächtnis und seinen eigenen Verlauf. Profile können optional mit einer PIN geschützt werden.

Einstellungen -> Profile.

---

## Die ELLA-Direktive

Vier unveränderliche Grundregeln -- in der Architektur verankert, nicht abschaltbar:

1. **Kein Schaden** -- physisch, finanziell, psychologisch oder datenbezogen
2. **Keine Verschleierung** -- alle Aktionen und Fähigkeiten sind transparent
3. **Keine Überwachung** -- ohne dein Wissen und deine Zustimmung
4. **Keine Datenweitergabe** -- ohne deine ausdrückliche Zustimmung

Wenn ELLA eine Anfrage aufgrund der Direktive ablehnt, erscheint ein roter Banner im Chat mit der Begründung.

---

## Datenschutz

- Alle Daten bleiben auf deinem Rechner -- keine Nutzungsdaten an Dritte
- Kein Telemetrie, kein Tracking
- Ollama und die Datenbank laufen lokal
- Deutsche Sprachausgabe über Edge TTS: Der gesprochene Text wird an Microsoft-Server gesendet (einzige Ausnahme im Standardbetrieb)
- OpenAI-Funktionen (Bilderkennung, Multi-Agenten, Spracherkennung) nur wenn du einen eigenen Key konfiguriert hast
- Vollständige Transparenz: [Netzwerkverbindungen](netzwerk.md)

---

## Häufige Fragen

**ELLA antwortet nicht?**
Ollama läuft möglicherweise nicht. Der orangene Banner oben im Chat zeigt es an. Warte kurz oder wechsle in den Einstellungen auf OpenAI.

**Kann ich ELLA offline nutzen?**
Ja, der Kern (Chat, Werkzeuge, Gedächtnis) läuft auf deinem Rechner. Nur deutsche Sprachausgabe (Edge TTS), Wetter, Gmail/Google Calendar und OpenAI-Funktionen brauchen Internet. Der Offline-Modus sperrt Websuche, Wetter, Cloud-KI (OpenAI) und deutsche Sprachausgabe. Gmail und Google Calendar bleiben im Offline-Modus verfügbar.

**Wie ändere ich das Sprachmodell?**
Einstellungen -> LLM -> Modell wählen oder eigenen Namen eingeben.

**Wie füge ich ein Programm hinzu, das ELLA nicht findet?**
Einstellungen -> Programme -> Suchfeld oder Durchsuchen-Button.

**ELLA lehnt etwas ab -- warum?**
Entweder greift eine deiner eigenen Regeln oder die ELLA-Direktive. Der rote Banner erklärt den Grund. Eigene Regeln kannst du in den Einstellungen anpassen.

**Gedächtnis löschen?**
"Vergiss alles über mich" -- oder einzelne Einträge: "Zeig mir dein Gedächtnis" und dann "Vergiss Eintrag Nr. X".

**Was kostet die Cloud-Nutzung?**
ELLA selbst ist ein Einmalkauf. Wenn du einen OpenAI-Key nutzt, fallen die üblichen OpenAI-API-Kosten an. Im Auto-Modus wird die Cloud nur als Fallback genutzt -- die meisten Anfragen laufen lokal.

---

_E.L.L.A. v1.5.7 -- Embedded Local Logic Agent_
_Entwickelt für Windows 10/11 (x64)_
