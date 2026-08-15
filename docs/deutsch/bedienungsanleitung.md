# E.L.L.A. — Bedienungsanleitung

Version 1.2.0

---

## Hallo — ich bin E.L.L.A.

E.L.L.A. steht für _Embedded Local Logic Agent_ — und ich bin dein persönlicher KI-Assistent für Windows. Immer bereit, immer lokal, immer bei dir.

Das Besondere: Ich laufe vollständig auf deinem eigenen Rechner. Deine Daten bleiben bei dir — kein Cloud-Server, kein Abo, kein Datenschutz-Kleingedrucktes. Einfach starten und loslegen.

---

## Erste Schritte

### Installation

1. `E.L.L.A Setup 1.2.0.exe` ausführen
2. Installationspfad wählen (Standard: `C:\Programme\E.L.L.A`)
3. Der Installer richtet alles automatisch ein — MariaDB, Ollama, Node.js. Du musst nichts weiter installieren.

### Erster Start

Beim ersten Start führt dich ELLA durch ein kurzes Onboarding:

1. **Sprachauswahl** — Deutsch oder Englisch
2. **EULA** — die Nutzungsbedingungen und die ELLA-Direktive akzeptieren
3. **Hardware-Scan** — ELLA erkennt deinen Rechner und schlägt das passende Sprachmodell vor
4. **Modell-Auswahl** — du wählst das Modell das zu deiner Hardware passt (kein automatischer Download ohne deine Zustimmung)
5. **Stimme wählen** — 4 weibliche Stimmen in DE/EN/ES/FR mit Vorschau
6. **Standort** — für Wetter und lokale Informationen (optional)
7. **Lizenzaktivierung** — deinen Lizenzschlüssel `ELLA-XXXX-XXXX-XXXX-XXXX` eingeben
8. **Chat** — los geht's

---

## Der Chat

### Wie du mit mir sprichst

Schreib einfach was du brauchst — in normalem Deutsch, keine Befehle, keine Syntax. Ich verstehe natürliche Sprache.

- „Wie viel Speicherplatz ist noch frei?"
- „Schreib eine E-Mail an Klaus und sag ihm, dass ich morgen nicht kann"
- „Was steht diese Woche im Kalender?"
- „Öffne Spotify"

### Spracheingabe

Klicke auf den **Mikrofon-Button** in der Eingabezeile — oder sag einfach **„Ella"** wenn Wakeword aktiviert ist. ELLA hört zu, wandelt deine Sprache in Text um und antwortet.

Wakeword-Modi:

- **Aus** — kein automatisches Zuhören
- **Manuell** — nur auf Knopfdruck
- **Wakeword** — auf „Ella" warten, dann zuhören
- **Immer** — kontinuierliches Zuhören

### Sprachausgabe (TTS)

ELLA antwortet auch mit Stimme. Zwei Engines stehen zur Verfügung:

- **Kokoro TTS** (Standard) — lokale neuronale Stimme, vollständig offline, natürlicher Klang
- **Microsoft Edge TTS** (Fallback) — benötigt Internetverbindung, sehr zuverlässig

Die Sprache der Stimme kannst du unabhängig von der App-Sprache wählen: Deutsch, Englisch, Spanisch oder Französisch.

### Feedback

Unter jeder Antwort findest du **Daumen hoch / Daumen runter**. Wenn du positives oder negatives Feedback gibst, lernt ELLA daraus und passt ihre Antworten an deine Vorlieben an.

### Tool-Anzeige

Wenn ELLA etwas tut — eine Datei sucht, eine App öffnet, den Kalender liest — siehst du kurz welches Werkzeug sie verwendet hat. Das gibt dir Einblick in was gerade passiert.

---

## Was ich für dich tun kann

### PC & System

Ich kenne mich mit Windows aus. Frag mich alles rund um deinen Rechner.

Sag einfach:

- „Öffne den Chrome-Browser"
- „Wie viel RAM nutze ich gerade?"
- „Zeig mir alle laufenden Prozesse"
- „Beende den Prozess XY"
- „Stell die Lautstärke auf 40 Prozent"
- „Was ist in der Zwischenablage?"
- „Fahr den Rechner herunter / neu starten"
- „Welche Programme starten automatisch mit Windows?"

### Laufwerke & Speicher

Sag einfach:

- „Wie viel Platz ist noch auf Laufwerk C?"
- „Suche doppelte Dateien auf meinen Laufwerken"
- „Formatiere meinen USB-Stick" _(Bestätigung erforderlich)_
- „Benenne Laufwerk E in Daten um"
- „Leere den Papierkorb"

### Dateien & Dokumente

Ich finde, öffne und erstelle Dateien auf allen deinen Laufwerken.

Sag einfach:

- „Suche die Datei Angebot"
- „Öffne den Ordner Projekte"
- „Erstell ein neues Word-Dokument"
- „Was steht in dieser PDF?" _(Datei anhängen oder Pfad nennen)_
- „Lies mir die Excel-Tabelle vor"
- „Fasse dieses Dokument zusammen"

### Diktat & Schreiben

Sag einfach:

- „Diktier mir einen Brief an Frau Müller"
- „Schreib das im Stil meiner E-Mails"
- „Korrigiere diesen Text"
- „Übersetze das auf Englisch"

### Mail & Kalender

**Outlook:**

- „Zeig mir meine ungelesenen Mails"
- „Markiere die Mail als gelesen / als Spam / archivieren"
- „Schreib einen Entwurf an Klaus: Treffen morgen um 14 Uhr?"
- „Was steht diese Woche im Kalender?"
- „Erstell einen Termin: Zahnarzt, Freitag 10 Uhr"

**Gmail & Google Calendar** (OAuth erforderlich, einmalig in Einstellungen einrichten):

- „Zeig mir meine Gmail-Mails"
- „Was steht im Google Kalender heute?"

### Aufgaben

ELLA führt eine persistente Aufgabenliste. Die Aufgaben bleiben auch nach einem Neustart erhalten.

Sag einfach:

- „Füge die Aufgabe 'Steuern erledigen' hinzu"
- „Zeig mir meine offenen Aufgaben"
- „Markiere 'Steuern erledigen' als erledigt"
- „Lösche die Aufgabe XY"

### Wecker

Sag einfach:

- „Stell einen Wecker für 7:30 Uhr"
- „Stell einen Wecker für morgen früh 6 Uhr"
- „Welche Wecker sind aktiv?"
- „Lösche den 7:30-Wecker"

Wecker werden täglich geprüft und lösen eine Benachrichtigung plus TTS-Ansage aus.

### Erinnerungen

Erinnerungen werden über den Windows Task Scheduler gesetzt und erscheinen als Popup zur gesetzten Zeit.

Sag einfach:

- „Erinner mich morgen um 15 Uhr: Arzttermin anrufen"
- „Welche Erinnerungen habe ich?"
- „Lösche die Erinnerung XY"

### Musik & Unterhaltung

Sag einfach:

- „Spiel etwas von Coldplay"
- „Öffne meinen Media Player mit dem Album 'Brothers in Arms'"
- „Suche Titel von Metallica in meiner Bibliothek"

### Netzwerk & Überwachung

Sag einfach:

- „Wer ist in meinem Netzwerk?"
- „Zeig mir aktive TCP-Verbindungen"
- „Wie ist mein WLAN-Status?"
- „Zeig mir die Firewall-Regeln"

### Screenshot & Bildschirmanalyse

_(Erfordert OpenAI-Key)_

Sag einfach:

- „Mach einen Screenshot und analysiere was du siehst"
- „Beschreib mir was auf dem Bildschirm passiert"
- „Analysiere dieses Bild" _(Bild einfügen)_

---

## Multi-Agenten

Die Multi-Agenten-Funktion ist ELLAs leistungsstärkster Modus. Mehrere spezialisierte KI-Agenten arbeiten **parallel** und liefern in kürzerer Zeit mehr als ein einzelner Agent könnte.

> **Hinweis:** Multi-Agenten erfordert einen konfigurierten OpenAI-Key (Einstellungen → API-Key). Ollama wird für diese Funktion nicht genutzt.

### So rufst du sie auf

Navigiere in der Seitenleiste zu **Multi-Agenten**.

### Vordefinierte Pipelines

**🌅 Morgenbriefing**
Drei Agenten arbeiten gleichzeitig:

- Agent 1 liest deine heutigen Kalendertermine
- Agent 2 ruft deine offenen Aufgaben ab
- Agent 3 holt das aktuelle Wetter für deinen Standort

Das Ergebnis: ein kompaktes Tagesstart-Briefing, das alle drei Infos zusammenfasst.

**🖥️ System-Report**
Vier Agenten analysieren gleichzeitig:

- Agent 1: Speicherplatz aller Laufwerke
- Agent 2: RAM und CPU-Auslastung
- Agent 3: Laufende Prozesse (Top 10 nach Ressourcenverbrauch)
- Agent 4: Netzwerkstatus und offene Verbindungen

Das Ergebnis: ein vollständiger System-Gesundheitsbericht.

### Live-Ansicht

Während die Pipeline läuft siehst du für jeden Agenten eine eigene Karte mit:

- Echtzeit-Statusanzeige (läuft / fertig / Fehler)
- Live-Streaming des Agenten-Texts
- Welche Tools der Agent gerade nutzt

### Setup nach Abschluss _(optional)_

Du kannst eine Pipeline mit einem **Setup** verknüpfen. Nach Abschluss aller Agenten führt ELLA das Setup automatisch aus — zum Beispiel bestimmte Apps öffnen oder schließen.

Wähle das gewünschte Setup im Dropdown-Menü bevor du die Pipeline startest.

### Die Daten sind echt

Was du in der Multi-Agenten-Ansicht siehst sind keine Beispieldaten — es sind echte Informationen von deinem System, deinem Kalender und deinen Laufwerken. Genau wie im normalen Chat, nur schneller und parallelisiert.

---

## Setups

Setups sind Makros — du definierst einmal welche Apps geöffnet und welche geschlossen werden sollen, und rufst das Setup dann mit einem Wort ab.

Sag einfach:

- „Lade mein Arbeits-Setup"
- „Starte das Gaming-Setup"

Setups anlegen: **Einstellungen → Setups → Neu**.

---

## Gedächtnis

ELLA merkt sich Informationen über dich — Vorlieben, Gewohnheiten, Notizen. Das Gedächtnis ist nach Profilen getrennt und bleibt dauerhaft erhalten.

Sag einfach:

- „Merk dir: ich mag keine Meetings vor 9 Uhr"
- „Was weißt du über mich?"
- „Vergiss die Notiz über XY"

---

## Proaktive Nachrichten

ELLA meldet sich von sich aus wenn etwas Wichtiges passiert:

- **Datenträger fast voll** — wenn ein Laufwerk unter 10 % freien Platz fällt
- **Hohe RAM-Auslastung** — bei anhaltender Überlastung
- **USB-Gerät angeschlossen** — Erkennung und Ansage neuer Laufwerke
- **Wecker ausgelöst** — Sprachalert zur gesetzten Zeit
- **Clipboard-Muster** — IBAN, Paketnummer, URL, Telefonnummer erkannt → ELLA fragt ob sie helfen soll
- **Meeting-Vorbereitung** — 15 Minuten vor einem Kalendertermin
- **Tagesabschluss** — am Abend: offene Aufgaben und Zusammenfassung
- **Pause-Reminder** — nach langer Arbeitssession

---

## Nutzerprofile

ELLA unterstützt mehrere Nutzerprofile auf demselben Rechner. Jedes Profil hat:

- Ein eigenes Gedächtnis
- Einen eigenen Gesprächsverlauf
- Einen eigenen PIN-Schutz (optional)

Profile verwalten: **Einstellungen → Profile**.

---

## Hausaufgaben-Modus

Der Hausaufgaben-Modus sperrt den Rechner auf eine definierte App-Whitelist. Nur erlaubte Programme können geöffnet werden — ideal für Kinder beim Lernen.

**Wichtig:** Nur der korrekte PIN beendet den Modus. Es gibt kein automatisches Ablaufdatum — das ist bewusst so, damit Kinder nicht einfach warten können.

Aktivieren: Sag „Hausaufgaben-Modus aktivieren" oder gehe zu **Einstellungen → Hausaufgaben-Modus**.

---

## Barrierefreiheit

### Blind-Modus

Aktivierbar unter **Einstellungen → Barrierefreiheit → Blind-Modus**:

- TTS immer aktiv — jede Antwort wird vorgelesen
- Antworten ohne Markdown-Formatierung (besser für Screenreader)
- Audio-Töne als Zustandsfeedback (Laden, Fehler, Erfolg)
- Begrüßungsansage beim Start
- Alle Buttons und Eingabefelder mit `aria-label` beschriftet

### Gehörlosenmodus

Aktivierbar unter **Einstellungen → Barrierefreiheit → Gehörlosenmodus**:

- TTS und Mikrofon-Button vollständig ausgeblendet
- Visueller Banner im Chat
- Kein Hinweis auf Sprachfunktionen im System-Prompt

---

## Einstellungen

Öffne die Einstellungen über die Seitenleiste oder sag „Öffne die Einstellungen".

### Wichtige Bereiche

| Bereich              | Was du dort findest                             |
| -------------------- | ----------------------------------------------- |
| **Allgemein**        | Sprache, Name, Standort                         |
| **LLM-Provider**     | Ollama (lokal) oder OpenAI — oder Auto          |
| **API-Key**          | OpenAI-Key für GPT-Funktionen und Multi-Agenten |
| **Stimme**           | TTS-Engine, Sprachauswahl, Stimmanalyse         |
| **Tools**            | Welche Werkzeuge ELLA verwenden darf            |
| **Apps**             | Liste deiner installierten Programme            |
| **Setups**           | Makros für Programm-Kombinationen               |
| **Regeln**           | Erlauben / Verbieten einzelner Aktionen         |
| **Profile**          | Nutzerprofile verwalten                         |
| **Hausaufgaben**     | Kinder-Modus konfigurieren                      |
| **Barrierefreiheit** | Blind- und Gehörlosenmodus                      |

### Regeln

Du kannst ELLAs Verhalten mit Regeln feinjustieren — ohne Code:

- „Erstell eine Regel: ELLA darf keine E-Mails versenden"
- „Erstell eine Regel: ELLA darf zwischen 22 und 7 Uhr keine Wecker stellen"

Regeln können zeitbasiert sein und werden über die Regel-Engine ausgewertet.

---

## Die ELLA-Direktive

ELLA hat vier unveränderliche Verbote — sie sind tief in der Architektur verankert und können nicht durch Einstellungen oder Regeln außer Kraft gesetzt werden:

1. **harm** — ELLA schadet nie: kein physischer, finanzieller, psychologischer oder datenbezogener Schaden
2. **conceal** — ELLA verschleiert nie: keine versteckten Aktionen, keine falschen Angaben über Fähigkeiten
3. **surveil** — ELLA überwacht nie ohne Wissen und ausdrückliche Zustimmung
4. **exfiltrate** — ELLA gibt keine Daten ohne ausdrückliche Zustimmung weiter

Wenn ELLA eine Anfrage ablehnt, siehst du im Chat einen roten **DIRECTIVE**-Banner mit dem Grund.

---

## Datenschutz

- Alle Daten bleiben auf deinem Rechner
- Kein Telemetrie, kein Tracking, keine Analysedaten
- Das KI-Modell (Ollama) läuft vollständig offline
- OpenAI-Funktionen (Screenshot-Analyse, Multi-Agenten) senden Daten an OpenAI — nur wenn du einen Key konfiguriert hast und die Funktion aktiv verwendest
- OpenAI trainiert keine Modelle auf API-Daten

---

## Häufige Fragen

**ELLA antwortet nicht — was tun?**
Prüfe ob Ollama läuft. Der orangene Banner oben im Chat zeigt an wenn Ollama nicht erreichbar ist. Starte Ollama neu oder wechsle in den OpenAI-Modus.

**Kann ich ELLA offline nutzen?**
Ja — vollständig. Alle Grundfunktionen laufen ohne Internet. Nur Wetter (Open-Meteo), Gmail/Google Calendar (OAuth) und OpenAI-Funktionen benötigen eine Verbindung.

**Wie ändere ich die Stimme?**
Einstellungen → Stimme → Sprachauswahl. Wähle zwischen Deutsch, Englisch, Spanisch und Französisch. Die App-Sprache ändert sich dadurch nicht.

**Kann ELLA mehrere Nutzer auf einem Rechner?**
Ja — über Nutzerprofile. Jedes Profil hat eigenes Gedächtnis und Verlauf. Optional mit PIN absichern.

**Was ist der Unterschied zwischen Chat und Multi-Agenten?**
Im Chat arbeitet ein einzelner Agent (Ollama oder OpenAI) sequenziell. Bei Multi-Agenten arbeiten mehrere spezialisierte OpenAI-Agenten gleichzeitig — schneller und mit mehr Tiefe für komplexe Abfragen.

**ELLA lehnt etwas ab — warum?**
Entweder greift eine deiner eigenen Regeln, oder die ELLA-Direktive. Der rote Banner erklärt den Grund. Regeln kannst du in den Einstellungen anpassen.

**Wie lösche ich das Gedächtnis?**
Sag „Vergiss alles über mich" — oder lösche einzelne Einträge mit „Zeig mir dein Gedächtnis" und dann „Vergiss Eintrag Nr. X".

---

_E.L.L.A. v1.2.0 — Embedded Local Logic Agent_
_Entwickelt für Windows 10/11 (x64)_
