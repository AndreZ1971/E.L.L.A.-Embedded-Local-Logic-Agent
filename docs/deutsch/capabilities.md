# E.L.L.A. -- Was kann ich für dich tun?

Stand: v1.5.7 -- 111 Fähigkeiten, 393 Tests bestanden

E.L.L.A. ist dein lokaler KI-Assistent für Windows. Sie läuft direkt auf deinem Rechner, versteht Sprache und Text, und hilft dir bei allem -- von einfachen Fragen bis zur Steuerung deines gesamten Desktops.

---

## 1. Gespräch & Sprache

ELLA versteht dich per Text und per Stimme. Du kannst einfach "Ella" sagen -- sie hört zu, antwortet und spricht zurück. In vier Sprachen.

**Was geht:**

- **Wakeword "Ella"** -- sag einfach ihren Namen, und sie hört zu. Läuft auf deinem Rechner, kein Server nötig.
- **Sprachsteuerung** -- stelle Fragen, gib Anweisungen, führe Gespräche. Per Mikrofon oder Textfeld.
- **Sprachausgabe (TTS)** -- ELLA liest ihre Antworten vor. Lokal per Kokoro (neuronale Stimme) oder Microsoft Edge TTS als Fallback.
- **Vier Stimmen** -- Deutsch, Englisch, Spanisch und Französisch. Wählbar im Onboarding oder in den Einstellungen.
- **Diktat-Modus** -- ELLA hört zu und tippt das Gesprochene direkt ins aktive Fenster. Funktioniert systemweit -- in Word, im Browser, überall. Per Hotkey aktivierbar.
- **Sofort unterbrechen** -- sag "Stopp", "Halt" oder "Sei still", und ELLA hört sofort auf zu sprechen.
- **Nachfrage ohne Wakeword** -- nach einer Antwort hast du 8 Sekunden Zeit, direkt weiterzusprechen, ohne erneut "Ella" sagen zu müssen.

> Probier's aus: "Ella, wie wird das Wetter morgen?" -- "Ella, schreib das auf Englisch."

---

## 2. Produktivität

Aufgaben, Erinnerungen, Wecker, Dokumente -- ELLA verwaltet deinen Alltag.

**Aufgaben:**

- Aufgaben anlegen, anzeigen, abhaken oder löschen. Alles bleibt in deiner lokalen Datenbank gespeichert.
- "Ella, erinnere mich morgen um 9 an den Zahnarzt." -- "Ella, was steht noch auf meiner Liste?"

**Wecker & Erinnerungen:**

- Wecker stellen und verwalten. Erinnerungen laufen über den Windows Aufgabenplaner -- sie kommen auch, wenn ELLA gerade nicht offen ist.
- "Ella, stelle einen Wecker für 7 Uhr." -- "Ella, welche Erinnerungen habe ich?"

**Dokumente:**

- Word-Dokumente und Textdateien erstellen lassen. ELLA kann auch bestehende Dateien lesen (.docx, .pdf, .xlsx, .html).
- In ein geöffnetes Word-Dokument diktieren -- ELLA korrigiert dabei Tippfehler automatisch.
- "Ella, erstelle ein Word-Dokument mit einer Einkaufsliste." -- "Ella, was steht in der Datei Vertrag.pdf?"

**App-Makros (Setups):**

- Definiere Gruppen von Apps, die zusammen gestartet werden. Zum Beispiel "Arbeit starten" öffnet Browser, Outlook und Word auf einen Schlag.
- Setups können auch Aktionen enthalten: Lautstärke setzen, Dunkel-Modus einschalten, Text in die Zwischenablage kopieren.
- "Ella, starte mein Arbeits-Setup."

---

## 3. Dateien & Ordner

ELLA findet, öffnet, kopiert und organisiert deine Dateien.

**Was geht:**

- **Suchen** -- alle Laufwerke nach Dateinamen durchsuchen. Nutzt den Windows Search Index für schnelle Ergebnisse.
- **Öffnen** -- Dateien und Ordner öffnen, optional mit einer bestimmten App.
- **Verwalten** -- umbenennen, kopieren, verschieben, Ordner anlegen, Dateien löschen (in den Papierkorb, nicht permanent).
- **Duplikate finden** -- doppelte Dateien erkennen und Speicherplatz sparen.
- **Dokumenten-Index** -- Ordner für die Volltextsuche indexieren. Danach kannst du nach Inhalten suchen, nicht nur nach Dateinamen.

> "Ella, finde alle PDFs mit 'Rechnung' im Namen." -- "Ella, zeig mir den Downloads-Ordner." -- "Ella, gibt es doppelte Dateien auf D:?"

---

## 4. E-Mail & Kalender

ELLA liest deine E-Mails, erstellt Entwürfe und verwaltet deinen Kalender -- für Outlook und Google.

**Was geht:**

- Ungelesene E-Mails abrufen und vorlesen lassen.
- E-Mails als gelesen markieren oder archivieren.
- E-Mail-Entwürfe in Outlook erstellen. ELLA sendet nie automatisch -- du hast immer die Kontrolle.
- Kalendertermine anzeigen und neue anlegen.
- Funktioniert mit **Microsoft Outlook** (lokal) und **Gmail / Google Calendar** (per OAuth-Anmeldung).

> "Ella, habe ich neue E-Mails?" -- "Ella, schreibe eine E-Mail an Max zum Thema Projektplan." -- "Ella, was steht morgen im Kalender?"

---

## 5. System & Hardware

Frag ELLA, wie es deinem Rechner geht -- oder lass sie aufraumen.

**Überblick:**

- Systemstatus abrufen: CPU, RAM, Festplatte, GPU, Netzwerk, Temperatur, Akku, Startzeit.
- Detailinfos zu GPU, RAM-Slots, Speichergeräten, Audio-Geräten und USB-Geräten.
- Installierte Programme und Autostart-Einträge auflisten.
- Windows-Ereignisprotokoll nach Fehlern und Warnungen durchsuchen.

**Aufraumen & Steuern:**

- Temporäre Dateien löschen, Papierkorb leeren, ungenutzten RAM freigeben.
- Lautstärke per Sprache setzen oder stummschalten.
- Dunkel-/Hellmodus umschalten.
- Zwischenablage lesen, beschreiben und Historie der letzten 20 Einträge einsehen.
- PC herunterfahren, neu starten oder in den Schlafmodus versetzen.
- USB-Laufwerke formatieren oder umbenennen (mit Sicherheitsabfrage, Systemlaufwerke gesperrt).

> "Ella, wie geht es meinem Rechner?" -- "Ella, stell die Lautstärke auf 30%." -- "Ella, räume mal auf."

---

## 6. Desktop-Automation

ELLA kann deinen Desktop fernsteuern -- Apps starten, Fenster verschieben, klicken und tippen.

**Was geht:**

- **Apps starten** -- per Name oder Pfad.
- **Fenster steuern** -- fokussieren, minimieren, maximieren, schließen.
- **Maus & Tastatur** -- an Koordinaten klicken, Text eintippen, Drag & Drop ausführen.
- **Elemente anklicken** -- ELLA liest den Bildschirm per OCR und klickt auf sichtbare Texte oder Buttons.
- **Bildschirm beobachten** -- bis zu 30 Sekunden lang den Bildschirm überwachen und Änderungen melden.
- **Multi-Monitor** -- Apps auf einem bestimmten Bildschirm öffnen.
- **Drucker** -- Drucker auflisten, Dokumente drucken, Druckaufträge verwalten.
- **Kameras** -- angeschlossene Kameras auflisten und Fotos aufnehmen.

> "Ella, öffne Chrome und Word nebeneinander." -- "Ella, klick auf den Button 'Speichern'." -- "Ella, öffne Excel auf dem zweiten Monitor."

---

## 7. Web & Wissen

ELLA durchsucht das Web, übersetzt, fasst zusammen und korrigiert Texte.

**Websuche:**

- Sucht über DuckDuckGo -- kein API-Key nötig, keine Nutzerdaten übertragen.
- Kann Webseiten abrufen und den Text extrahieren.
- Wetter für jeden Ort abfragen.

**Texte bearbeiten:**

- **Übersetzen** -- in jede Sprache, lokal per Ollama oder über OpenAI.
- **Zusammenfassen** -- kurz, mittel oder ausführlich.
- **Korrigieren** -- Grammatik und Zeichensetzung prüfen.
- **Im eigenen Stil schreiben** -- ELLA lernt deinen Schreibstil aus deiner E-Mail-Historie und formuliert Texte so, wie du es tun würdest.

> "Ella, suche nach den besten Rezepten für Kartoffelsuppe." -- "Ella, übersetze das ins Französische." -- "Ella, fasse diesen Text in 3 Sätzen zusammen."

---

## 8. Sicherheit & Privatsphäre

ELLA ist sicher gebaut. Deine Daten bleiben bei dir.

**Die E.L.L.A. Directive -- vier unumstößliche Regeln** (eigenständiges Open-Source-Projekt, MIT-Lizenz):

1. **Kein Schaden** -- ELLA darf keinen physischen, finanziellen, psychologischen oder datenbezogenen Schaden verursachen.
2. **Keine Verschleierung** -- ELLA versteckt nie, was sie tut, was sie kann oder wie der Systemstatus ist.
3. **Keine Überwachung** -- keine Überwachung ohne dein ausdrückliches Wissen und deine aktive Zustimmung.
4. **Keine Datenweitergabe** -- deine Daten werden nie an Dritte weitergegeben, es sei denn, du stimmst ausdrücklich zu.

**Weitere Schutzmaßnahmen:**

- **107 Sicherheitsregeln** -- automatisch beim Start aktiv. Schützen Systemdateien, Passwörter, kritische Prozesse.
- **Bestätigungspflicht** -- vor dem Löschen, Klicken, Ausführen von Befehlen oder Schließen von Fenstern fragt ELLA nach.
- **Passwort-Manager gesperrt** -- Maus-Tools funktionieren nicht in 1Password, KeePass, Bitwarden, PayPal oder Bank-Fenstern.
- **Sensible Daten schwärzen** -- API-Keys, IBANs, Passwörter und Kreditkartennummern werden vor dem Speichern automatisch entfernt.
- **Lokal zuerst** -- alle KI-Verarbeitung läuft bevorzugt auf deinem Rechner. OpenAI wird nur genutzt, wenn du es erlaubst und einen eigenen Key hinterlegst.
- **Offline-Modus** -- sperrt alle Netzwerk-Tools. Beachte: Die deutsche Sprachausgabe (Edge TTS) benötigt weiterhin eine Internetverbindung; Englisch, Spanisch und Französisch laufen lokal über Kokoro.
- **Eigene Regeln erstellen** -- du kannst Tools gezielt erlauben oder verbieten.

---

## 9. Lernen & Gedächtnis

ELLA merkt sich, was dir wichtig ist -- und wird mit der Zeit besser.

**Was geht:**

- **Langzeitgedächtnis** -- ELLA speichert wichtige Informationen dauerhaft. "Mein Lieblingsrestaurant ist die Trattoria Roma." -- das merkt sie sich.
- **Knowledge Graph** -- ELLA erkennt Zusammenhänge. Wenn du sagst "Max ist mein Bruder" und später "Max hat Geburtstag am 15. März", verknüpft sie beides.
- **Self-Learning** -- wenn du eine Antwort mit Daumen hoch bewertest, lernt ELLA daraus und gibt ähnliche Antworten künftig in diesem Stil.
- **Proaktive Nachrichten** -- ELLA meldet sich von selbst, wenn etwas Wichtiges passiert: Festplatte fast voll, neues Gerät verbunden, Termin in 15 Minuten.
- **Lernende Benachrichtigungen** -- wenn du eine proaktive Nachricht 5-mal wegklickst, stellt ELLA diese Kategorie automatisch stumm.
- **Tagesabschluss & Comeback** -- nach einer Pause fasst ELLA zusammen, was sich verändert hat. Am Ende des Tages erinnert sie an offene Aufgaben.
- **Reflexion** -- ELLA reflektiert regelmäßig über gesammelte Erfahrungen und erkennt Muster in deinem Verhalten.
- **Stresserkennung** -- optional: ELLA analysiert deine Stimme und gibt sanfte Hinweise, wenn du gestresst klingst.

> "Ella, was weißt du über mich?" -- "Ella, vergiss dass ich Kaffee mag." -- "Ella, was hat sich verändert, seit ich weg war?"

---

## 10. Unterhaltung

Auch zum Zeitvertreib ist ELLA da.

**Schach:**

- Spiele eine Partie gegen ELLA in einem eigenen Fenster mit vier visuellen Themes.
- ELLA kommentiert Züge, reflektiert nach dem Spiel und merkt sich deine Spielstärke.
- Unterbrochene Partien können fortgesetzt werden.

**Musik:**

- Musikbibliothek nach Künstler, Album oder Titel durchsuchen und abspielen.
- Wiedergabe steuern: Play, Pause, Nächster Titel, Vorheriger Titel, Stopp.
- Aktuell spielenden Titel anzeigen lassen.

> "Ella, lass uns Schach spielen." -- "Ella, spiel Musik von Beethoven." -- "Ella, nächster Titel."

---

## 11. Barrierefreiheit

ELLA passt sich an unterschiedliche Bedürfnisse an.

**Blind-Modus:**

- Sprachausgabe wird erzwungen -- jede Antwort wird vorgelesen.
- Antworten enthalten kein Markdown (keine Tabellen, Listen oder Formatierung, die ein Screenreader stört).
- Audio-Töne signalisieren Zustände (Laden, Fertig, Fehler).
- Begrüssung beim Starten wird automatisch vorgelesen.

**Gehörlosenmodus:**

- Sprachausgabe und Mikrofon-Button werden komplett ausgeblendet.
- Visueller Banner zeigt den aktiven Modus an.
- ELLA erwähnt in ihren Antworten keine Sprachfunktionen.

> Einstellbar unter Einstellungen -> Barrierefreiheit.

---

## 12. HUD & Erscheinungsbild

Drei visuelle Stile -- von dezent bis technisch.

**Calm (Standard):**

- Dunkles, ruhiges Design. Ideal für den täglichen Einsatz.

**HUD:**

- Technisches Heads-Up-Display mit Cyan-, Violett- oder Bernstein-Akzent.
- Zeigt konfigurierbare Widgets: Systemstatus, Monitore, Aufgaben, E-Mails, Musik, Uhr, Routinen und Directive-Regeln.
- Der Orb in der Mitte visualisiert ELLAs Zustand: bereit, hört zu, denkt nach, spricht, Cloud-Zugriff oder offline.
- Drei-Spalten-Layout mit Widgets links und rechts vom Orb.

**Show (Präsentation):**

- Vollbild-Modus mit nur dem Orb und der letzten Antwort.
- Sensible Inhalte (E-Mails, Dateien, Netzwerkdaten) werden automatisch als "[privat]" angezeigt.
- Ideal für Demos oder wenn jemand zuschaut.

**Weitere Details:**

- Widgets sind konfigurierbar -- ziehe per Einstellungen, welche Panels links und rechts erscheinen.
- Performance-Drosselung: Animationen werden während des Nachdenkens automatisch reduziert.
- Alle Stile respektieren "Reduzierte Bewegung" aus den Windows-Einstellungen.

> Einstellbar unter Einstellungen -> Aussehen.

---

## Kindermodus (Hausaufgaben-Modus)

Ein PIN-geschützter Modus, der den Zugriff auf bestimmte Funktionen einschränkt. Nur die PIN beendet den Modus -- kein automatisches Zeitlimit, keine Umgehung möglich.

> "Ella, aktiviere den Hausaufgaben-Modus."

---

## Netzwerk & lokales Heimnetz

ELLA kann dein lokales Netzwerk analysieren -- auch im Offline-Modus.

- Alle Geräte im Heimnetz auflisten (IP, MAC-Adresse).
- Aktive Verbindungen und offene Ports anzeigen.
- WLAN-Informationen abrufen (Name, Signalstärke).
- Angeschlossene Hardware auflisten.

> "Ella, welche Geräte sind in meinem Netzwerk?" -- "Ella, wie stark ist mein WLAN-Signal?"

---

## Shell-Befehle

Für fortgeschrittene Nutzer: ELLA kann PowerShell-Befehle ausführen. Vor jeder Ausführung wird eine Bestätigung eingeholt. Über 60 gefährliche Befehlsmuster sind gesperrt.

> "Ella, führe 'Get-Process | Sort-Object CPU -Descending | Select -First 10' aus."

---

## Wie ELLA denkt

ELLA läuft lokal über Ollama (qwen2.5:14b). Optional kannst du einen eigenen OpenAI-Key hinterlegen -- dann nutzt ELLA Cloud-KI als Ergänzung oder Fallback. Drei Modi stehen zur Wahl:

- **Automatisch** -- lokal zuerst, Cloud nur bei Bedarf.
- **Nur lokal (Ollama)** -- keine Internetverbindung für KI nötig.
- **Cloud bevorzugt (OpenAI)** -- schnellere Antworten, erfordert eigenen API-Key.

Deine Daten verlassen deinen Rechner nur, wenn du es ausdrücklich erlaubst.
