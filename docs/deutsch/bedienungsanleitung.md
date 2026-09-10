# E.L.L.A. — Bedienungsanleitung

Version 1.3.0

---

## Hallo — ich bin E.L.L.A.

E.L.L.A. steht für _Embedded Local Logic Agent_ — dein persönlicher KI-Assistent für Windows. Immer bereit, immer lokal, immer bei dir.

Das Besondere: Ich laufe vollständig auf deinem eigenen Rechner. Kein Cloud-Server, kein Abo, kein Datenschutz-Kleingedrucktes. Einfach starten und loslegen.

**Kein ChatGPT. Kein Groq. Kein versteckter API-Key der das Ganze erst möglich macht.**
Ich brauche das alles nicht — Ollama läuft lokal, die KI läuft lokal, deine Daten bleiben lokal.

---

## Erste Schritte

### Installation

1. `E.L.L.A Setup 1.3.0.exe` ausführen
2. Installationspfad wählen (Standard: `C:\Programme\E.L.L.A`)
3. Der Installer richtet alles automatisch ein — MariaDB, Ollama, Node.js. Nichts weiter installieren.

### Erster Start

1. **Sprachauswahl** — Deutsch oder Englisch
2. **EULA** — Nutzungsbedingungen und ELLA-Direktive akzeptieren
3. **Hardware-Scan** — ELLA erkennt deinen Rechner und schlägt das passende Sprachmodell vor
4. **Modell-Auswahl** — du wählst (kein Download ohne deine Zustimmung)
5. **Stimme wählen** — 4 weibliche Stimmen in DE/EN/ES/FR mit Vorschau
6. **Standort** — für Wetter und lokale Infos (optional)
7. **Lizenzaktivierung** — `ELLA-XXXX-XXXX-XXXX-XXXX` eingeben
8. **Chat** — los geht's

---

## Der Chat

### Wie du mit mir sprichst

Schreib in normalem Deutsch — keine Befehle, keine Syntax. Ich verstehe natürliche Sprache.

### Spracheingabe

Klicke den **Mikrofon-Button** oder sag **„Ella"** (Wakeword-Modus). Modi:

- **Aus** — kein automatisches Zuhören
- **Manuell** — nur Knopfdruck
- **Wakeword** — auf „Ella" warten, dann zuhören
- **Immer** — kontinuierliches Zuhören

### Sprachausgabe (TTS)

- **Kokoro TTS** (Standard) — lokale neuronale Stimme, vollständig offline
- **Microsoft Edge TTS** (Fallback) — benötigt Internet

### Feedback-Loop

Daumen hoch / Daumen runter unter jeder Antwort → ELLA lernt deine Vorlieben und passt sich dauerhaft an.

### Tool-Anzeige

Wenn ELLA etwas tut siehst du kurz welches Werkzeug sie verwendet hat — volle Transparenz über jede Aktion.

### Provider-Anzeige

Im Avatar-Panel unten links zeigt ein grüner Chip ob gerade **Ollama** (lokal) oder **OpenAI** (cloud-optional) aktiv ist.

---

## Alle Tools im Überblick

ELLA hat **85+ Werkzeuge**. Hier sind alle — mit Beispielen.

---

### Programme & Apps

#### `list_programs` — Programme auflisten

Zeigt alle auf deinem System installierten und freigegebenen Programme.

```
„Welche Programme habe ich installiert?"
„Liste mir alle Apps auf"
„Welche Programme darf ELLA öffnen?"
```

#### `open_app` — App öffnen

Öffnet eine installierte Anwendung.

```
„Öffne Chrome"
„Starte Spotify"
„Öffne Word"
„Mach den Task-Manager auf"
```

#### `launch_app` — App mit Parametern starten

Startet eine Anwendung mit zusätzlichen Argumenten oder Dateipfaden.

```
„Öffne Notepad mit der Datei C:\config.txt"
„Starte VLC mit dem Video auf dem Desktop"
```

#### `load_setup` — Setup ausführen

Führt ein vordefiniertes Setup-Makro aus — öffnet und schließt Apps automatisch.

```
„Lade mein Arbeits-Setup"
„Starte das Gaming-Setup"
„Führe Setup Feierabend aus"
```

#### `create_setup` — Setup erstellen

Erstellt ein neues Setup-Makro aus dem Chat heraus.

```
„Erstell ein Setup namens Homeoffice: öffne Teams, Outlook und Chrome"
„Neues Setup: beim Abend schließe alle Apps und öffne Spotify"
```

#### `control_window` — Fenster steuern

Minimiert, maximiert, schließt oder verschiebt Programmfenster.

```
„Minimiere Chrome"
„Maximiere das aktuelle Fenster"
„Schließe alle Word-Fenster"
```

#### `pause_ella` — ELLA pausieren

Deaktiviert das Wakeword für eine bestimmte Zeit.

```
„Pausiere ELLA für 30 Minuten"
„Stummschalten für eine Stunde"
„ELLA, kurz Ruhe bitte — 20 Minuten"
```

---

### Dateien & Ordner

#### `search_files` — Dateien suchen

Durchsucht alle Laufwerke nach Dateien (Windows Search Index + Fallback).

```
„Suche die Datei Angebot"
„Finde alle PDFs mit dem Wort Rechnung"
„Wo ist mein Lebenslauf?"
```

#### `open_file` — Datei öffnen

Öffnet eine Datei mit dem Standard-Programm.

```
„Öffne C:\Dokumente\Bericht.docx"
„Mach die Datei auf die du gerade gefunden hast"
```

#### `explore_folder` — Ordner im Explorer öffnen

Öffnet einen Ordner im Windows-Explorer.

```
„Öffne den Ordner Downloads"
„Zeig mir den Desktop-Ordner"
„Explorer auf C:\Projekte"
```

#### `list_folder` — Ordnerinhalt auflisten

Listet den Inhalt eines Ordners auf.

```
„Was ist im Ordner Dokumente?"
„Liste alle Dateien im Download-Verzeichnis"
```

#### `read_file_content` — Dateiinhalt lesen

Liest und versteht den Inhalt von Dokumenten (.docx, .pdf, .xlsx, .html, .txt).

```
„Was steht in dieser PDF?"
„Lies mir die Excel-Tabelle Umsatz2024 vor"
„Fasse das Word-Dokument zusammen"
„Was steht auf Seite 3 vom Bericht?"
```

#### `create_document` — Dokument erstellen

Erstellt ein neues Word- oder Textdokument.

```
„Erstell ein neues Word-Dokument namens Protokoll"
„Neues Textdokument auf dem Desktop: Notizen"
```

#### `dictate_to_document` — In Dokument diktieren

Öffnet ein Word-Dokument und fügt diktierten Text mit KI-Korrektur ein.

```
„Diktiere in das Dokument Bericht: Sehr geehrte Damen und Herren..."
„Schreib das in mein aktuelles Word-Dokument"
```

#### `rename_file` — Datei umbenennen

Benennt eine Datei um.

```
„Benenne die Datei Foto1.jpg um in Urlaub2024.jpg"
„Rename C:\alte_datei.txt zu neue_datei.txt"
```

#### `copy_file` — Datei kopieren

Kopiert eine Datei an einen neuen Ort.

```
„Kopiere das Dokument Vertrag nach D:\Backup"
„Kopiere alle JPGs vom Desktop nach E:\Fotos"
```

#### `delete_file` — Einzelne Datei löschen

Löscht eine bestimmte Datei (mit Bestätigung).

```
„Lösche die Datei temp_backup.zip"
```

#### `delete_files` — Mehrere Dateien löschen

Löscht mehrere Dateien auf einmal.

```
„Lösche alle .tmp-Dateien im Temp-Ordner"
„Entferne alle alten Log-Dateien aus C:\Logs"
```

#### `create_folder` — Ordner erstellen

Erstellt einen neuen Ordner.

```
„Erstell den Ordner Projekte 2025 auf dem Desktop"
„Neuer Ordner: C:\Archiv\2024"
```

#### `find_duplicates` — Doppelte Dateien finden

Durchsucht Laufwerke nach doppelten Dateien und berechnet verschwendeten Speicher.

```
„Suche nach doppelten Dateien"
„Wie viel Platz verschwende ich durch Duplikate?"
„Finde doppelte Fotos auf Laufwerk D"
```

---

### System & Leistung

#### `get_disk_usage` — Festplattenauslastung

Zeigt freien und belegten Speicherplatz pro Laufwerk.

```
„Wie viel Platz ist noch auf Laufwerk C?"
„Festplattenauslastung anzeigen"
„Bin ich auf D bald voll?"
```

#### `get_system_info` — Systeminformationen

Zeigt CPU, RAM, Betriebssystem und Hardware-Details.

```
„Was für einen Prozessor habe ich?"
„Zeig mir meine Systemdaten"
„Wie viel RAM ist verbaut?"
```

#### `get_system_status` — System-Status

Aktueller Status: CPU-Auslastung, RAM, Festplatten auf einen Blick.

```
„Wie läuft mein System gerade?"
„System-Check bitte"
„Ist alles okay mit dem Rechner?"
```

#### `get_temperatures` — Temperaturen

Zeigt CPU- und GPU-Temperaturen an.

```
„Wie heiß ist meine CPU?"
„Temperaturen anzeigen"
„Ist mein Rechner überhitzt?"
```

#### `get_battery_status` — Akkustand

Zeigt Akku-Status und Ladestand (Laptops).

```
„Wie viel Akku habe ich noch?"
„Wird mein Laptop gerade geladen?"
```

#### `free_ram` — RAM freigeben

Gibt ungenutzten Arbeitsspeicher frei.

```
„Gib den RAM frei"
„Arbeitsspeicher leeren"
„Mein Rechner ist langsam, räum den Speicher auf"
```

#### `clean_temp` — Temp-Dateien bereinigen

Löscht temporäre Dateien des Systems.

```
„Bereinige die Temp-Dateien"
„Lösch den Cache"
„Mach den Temp-Ordner leer"
```

#### `empty_recycle_bin` — Papierkorb leeren

Leert den Windows-Papierkorb.

```
„Leere den Papierkorb"
„Papierkorb leeren bitte"
```

#### `get_event_log` — Windows-Ereignisprotokoll

Liest Windows-Systemereignisse und -Fehler aus.

```
„Was steht im Windows-Ereignisprotokoll?"
„Gab es heute Systemfehler?"
„Zeig mir die letzten Fehlermeldungen von Windows"
```

#### `list_autostart` — Autostart-Programme

Zeigt alle Programme die beim Windows-Start automatisch starten.

```
„Welche Programme starten automatisch mit Windows?"
„Autostart-Liste anzeigen"
„Was lädt beim Hochfahren alles?"
```

#### `toggle_dark_mode` — Dark Mode umschalten

Schaltet den Windows Dark Mode an oder aus.

```
„Dark Mode einschalten"
„Wechsel zu hellem Design"
„Dark Mode umschalten"
```

#### `shutdown_system` — Herunterfahren / Neustart

Fährt Windows herunter oder startet neu.

```
„Fahr den Rechner herunter"
„Windows neu starten"
„Shut down in 5 Minuten"
```

---

### Prozesse & Dienste

#### `list_processes` — Prozesse auflisten

Zeigt alle laufenden Prozesse, sortiert nach CPU- oder RAM-Verbrauch.

```
„Welche Prozesse laufen gerade?"
„Was frisst am meisten RAM?"
„Zeig mir die Top 10 nach CPU-Auslastung"
```

#### `kill_process` — Prozess beenden

Beendet einen laufenden Prozess (systemkritische sind gesperrt).

```
„Beende den Prozess chrome.exe"
„Kill den Firefox-Prozess"
„Beende alle hängenden Word-Instanzen"
```

#### `manage_service` — Windows-Dienste verwalten

Startet, stoppt oder zeigt Windows-Dienste an.

```
„Liste alle Windows-Dienste auf"
„Starte den Druckspooler-Dienst"
„Stoppe den Windows Update-Dienst"
```

#### `run_command` — Befehl ausführen

Führt einen Shell-Befehl aus und gibt das Ergebnis zurück.

```
„Führe den Befehl ipconfig /all aus"
„Starte das Skript setup.bat"
```

---

### Laufwerke & Speichermedien

#### `format_drive` — Laufwerk formatieren

Formatiert ein Laufwerk (Systemlaufwerke und ELLA-Laufwerk gesperrt, Bestätigung erforderlich).

```
„Formatiere meinen USB-Stick"
„Format Laufwerk F als NTFS"
```

#### `rename_drive` — Laufwerk umbenennen

Gibt einem Laufwerk einen neuen Namen (Bezeichnung).

```
„Benenne Laufwerk E in Daten um"
„Bezeichnung von D: auf Backup ändern"
```

---

### Netzwerk

#### `scan_network` — Netzwerk scannen

Scannt das lokale Netzwerk via ARP und zeigt alle verbundenen Geräte.

```
„Wer ist in meinem Netzwerk?"
„Zeig mir alle Geräte im WLAN"
„Netzwerk-Scan starten"
```

#### `list_connections` — TCP-Verbindungen

Zeigt aktive Netzwerkverbindungen und offene Ports.

```
„Zeig mir aktive TCP-Verbindungen"
„Welche Ports sind offen?"
„Was verbindet sich gerade mit dem Internet?"
```

#### `list_devices` — Verbundene Geräte

Listet alle Geräte auf die aktuell erkannt werden (USB, Netzwerk, Bluetooth).

```
„Welche Geräte sind angeschlossen?"
„Was für USB-Sticks sind drin?"
```

#### `get_wifi_info` — WLAN-Status

Zeigt WLAN-Verbindungsdetails: SSID, Signal, IP-Adresse.

```
„Wie ist mein WLAN-Status?"
„Wie stark ist mein WLAN-Signal?"
„Mit welchem Netzwerk bin ich verbunden?"
```

---

### Mail & Kalender

#### `read_emails` — Outlook-Mails lesen

Liest ungelesene oder gefilterte Outlook-Mails.

```
„Zeig mir meine ungelesenen Mails"
„Was hat Klaus geschrieben?"
„Neue Mails von heute bitte"
```

#### `mark_email` — Outlook-Mail markieren

Markiert eine Mail als gelesen, Spam oder archiviert.

```
„Markiere die Mail von Klaus als gelesen"
„Die letzte Mail als Spam markieren"
„Archiviere die Betreff-Mail"
```

#### `compose_email` — E-Mail verfassen

Öffnet einen Outlook-Entwurf mit KI-formuliertem Text (sendet nicht automatisch).

```
„Schreib einen Entwurf an Klaus: Treffen morgen 14 Uhr?"
„Mail an team@firma.de: das Meeting ist verschoben"
```

#### `read_gmail` — Gmail lesen

Liest Gmail-Mails via OAuth 2.0 (einmalige Einrichtung in Einstellungen).

```
„Zeig mir meine Gmail-Mails"
„Ungelesene Gmail von heute"
```

#### `mark_gmail` — Gmail-Mail markieren

Markiert Gmail-Mails als gelesen, Spam oder archiviert.

```
„Gmail-Mail als gelesen markieren"
„Spam-Mail in Gmail ablegen"
```

#### `read_calendar` — Outlook-Kalender lesen

Liest Kalendertermine aus Outlook.

```
„Was steht diese Woche im Kalender?"
„Welche Termine habe ich morgen?"
„Zeig mir den Kalender für nächsten Montag"
```

#### `create_appointment` — Outlook-Termin erstellen

Legt einen neuen Termin in Outlook an.

```
„Erstell einen Termin: Zahnarzt, Freitag 10 Uhr"
„Meeting mit Klaus: Donnerstag 14 Uhr, 1 Stunde"
```

#### `read_google_calendar` — Google Calendar lesen

Liest Google-Kalender via OAuth 2.0.

```
„Was steht im Google Kalender heute?"
„Google-Termine für diese Woche"
```

#### `create_google_appointment` — Google-Termin erstellen

Erstellt einen Termin im Google Calendar.

```
„Termin in Google Calendar: Arzt, Montag 9 Uhr"
```

---

### Aufgaben & Wecker

#### `add_task` — Aufgabe hinzufügen

Fügt eine Aufgabe zur persistenten Todo-Liste hinzu (überlebt Neustarts).

```
„Füge die Aufgabe 'Steuern erledigen' hinzu"
„Todo: Rückruf bei Müller"
„Neues To-do: Angebot bis Freitag fertig"
```

#### `list_tasks` — Aufgaben anzeigen

Zeigt alle offenen oder erledigten Aufgaben.

```
„Zeig mir meine offenen Aufgaben"
„Was steht noch auf meiner Todo-Liste?"
„Erledigte Aufgaben anzeigen"
```

#### `complete_task` — Aufgabe erledigen

Markiert eine Aufgabe als erledigt.

```
„Markiere 'Steuern erledigen' als erledigt"
„Aufgabe 3 abhaken"
```

#### `delete_task` — Aufgabe löschen

Löscht eine Aufgabe aus der Liste.

```
„Lösche die Aufgabe Rückruf Müller"
„Aufgabe 5 entfernen"
```

#### `set_alarm` — Wecker stellen

Stellt einen Wecker — ELLA löst ihn mit Sprachalert aus.

```
„Stell einen Wecker für 7:30 Uhr"
„Wecker morgen früh 6 Uhr"
„Weck mich in 45 Minuten"
```

#### `list_alarms` — Wecker anzeigen

Zeigt alle aktiven Wecker.

```
„Welche Wecker sind aktiv?"
„Meine Wecker anzeigen"
```

#### `delete_alarm` — Wecker löschen

Löscht einen gesetzten Wecker.

```
„Lösche den 7:30-Wecker"
„Wecker für morgen entfernen"
```

#### `set_reminder` — Erinnerung setzen

Erstellt eine Erinnerung via Windows Task Scheduler — erscheint als Popup zur gesetzten Zeit.

```
„Erinner mich morgen um 15 Uhr: Arzttermin anrufen"
„Erinnerung: Freitag 9 Uhr — Rechnung bezahlen"
```

#### `list_reminders` — Erinnerungen anzeigen

Zeigt alle aktiven Erinnerungen.

```
„Welche Erinnerungen habe ich?"
„Meine Erinnerungen anzeigen"
```

#### `delete_reminder` — Erinnerung löschen

Löscht eine geplante Erinnerung.

```
„Lösche die Erinnerung Arzttermin"
```

---

### Systemsteuerung

#### `set_volume` — Lautstärke regeln

Setzt die Windows-Systemlautstärke.

```
„Stell die Lautstärke auf 40 Prozent"
„Lautloser bitte — auf 10"
„Maximale Lautstärke"
„Stummschalten"
```

#### `get_clipboard` — Zwischenablage lesen

Liest den aktuellen Inhalt der Zwischenablage (inkl. der letzten 20 Einträge).

```
„Was ist in der Zwischenablage?"
„Was habe ich zuletzt kopiert?"
„Zeig mir die Clipboard-Historie"
```

#### `set_clipboard` — Zwischenablage setzen

Schreibt Text in die Zwischenablage.

```
„Kopiere 'Hallo Welt' in die Zwischenablage"
„Schreib meine E-Mail-Adresse in die Zwischenablage"
```

#### `send_keys` — Tasten simulieren

Sendet Tastenkombinationen an das aktive Fenster.

```
„Sende Strg+C an das aktive Fenster"
„Drücke Enter"
„Tastenkombination Alt+F4 senden"
```

---

### Maus & Bildschirm-Automation

#### `move_mouse` — Maus bewegen

Bewegt den Mauszeiger zu bestimmten Koordinaten.

```
„Bewege die Maus zu Position 500, 300"
```

#### `click_at` — Klick an Position

Klickt an bestimmten Bildschirmkoordinaten.

```
„Klicke auf Position 200, 400"
„Rechtsklick auf 800, 600"
```

#### `drag_drop` — Drag & Drop

Zieht ein Element von einer Position zur anderen.

```
„Ziehe von 100,200 nach 500,600"
```

#### `click_element` — Element anklicken

Klickt auf ein benanntes Element auf dem Bildschirm.

```
„Klicke auf den OK-Button"
„Klicke auf Speichern"
```

#### `read_screen` — Bildschirm lesen

Liest den Text vom aktuellen Bildschirm.

```
„Was steht auf meinem Bildschirm?"
„Lies mir den Text im aktiven Fenster vor"
```

#### `watch_screen` — Bildschirm beobachten

Beobachtet den Bildschirm und wartet auf eine bestimmte Veränderung.

```
„Warte bis der Download fertig ist und sag mir Bescheid"
„Beobachte den Bildschirm auf Fehlermeldungen"
```

#### `describe_screen` — Bildschirm beschreiben

Macht einen Screenshot und beschreibt was darauf zu sehen ist (OpenAI Vision).

```
„Beschreib mir was auf dem Bildschirm passiert"
„Was siehst du gerade auf meinem Monitor?"
```

#### `take_screenshot` — Screenshot aufnehmen

Macht einen Screenshot und speichert ihn.

```
„Mach einen Screenshot"
„Screenshot vom Bildschirm"
„Foto vom aktuellen Fenster"
```

#### `describe_image` — Bild analysieren

Analysiert ein eingefügtes Bild mit GPT-4o Vision (OpenAI-Key erforderlich).

```
„Was ist auf diesem Bild?" _(Bild einfügen)_
„Analysiere dieses Foto"
„Beschreib das Bild das ich gerade geschickt habe"
```

#### `describe_webpage` — Webseite analysieren

Lädt eine Webseite und fasst ihren Inhalt zusammen.

```
„Was steht auf dieser Webseite: https://..."
„Fasse den Artikel auf dieser URL zusammen"
```

---

### Internet & Suche

#### `search_web` / `web_search` — Websuche

Sucht im Internet via DuckDuckGo ohne Tracking.

```
„Suche nach dem aktuellen Bitcoin-Kurs"
„Was ist das neue iPhone Modell?"
„Wer hat die Champions League gewonnen?"
```

#### `fetch_url` — URL abrufen

Lädt den Inhalt einer URL und gibt ihn zurück.

```
„Ruf diese URL auf und sag mir was dort steht"
„Hol den Inhalt von https://..."
```

#### `get_weather` — Wetter

Holt das aktuelle Wetter für deinen Standort (Open-Meteo, kein API-Key nötig).

```
„Wie wird das Wetter heute?"
„Wetter für morgen bitte"
„Brauche ich heute einen Regenschirm?"
```

#### `get_location` — Standort

Gibt deinen konfigurierten Standort zurück.

```
„Was ist mein aktueller Standort?"
„Wo bin ich eingestellt?"
```

---

### Datum & Zeit

#### `get_datetime` — Datum und Uhrzeit

Gibt das aktuelle Datum und die Uhrzeit zurück.

```
„Wie spät ist es?"
„Welches Datum haben wir heute?"
„Wie viele Tage noch bis Weihnachten?"
```

---

### Musik & Medien

#### `play_music` — Musik abspielen

Durchsucht deine Musikbibliothek und öffnet Titel im Media Player.

```
„Spiel etwas von Coldplay"
„Öffne das Album 'Brothers in Arms' von Dire Straits"
„Suche Metallica-Titel in meiner Bibliothek"
„Spiel meine Lieblingsplaylist"
```

#### `control_media` — Medienwiedergabe steuern

Steuert den aktuellen Mediaplayer (Play, Pause, Nächster, Vorheriger).

```
„Pause"
„Nächster Titel"
„Vorheriges Lied"
„Wiedergabe starten"
```

#### `get_now_playing` — Aktueller Titel

Zeigt was gerade abgespielt wird.

```
„Was spielt gerade?"
„Welcher Titel läuft?"
```

---

### Texte & Sprache

#### `write_for_me` — Text schreiben

Schreibt Texte beliebiger Art auf Wunsch.

```
„Schreib mir ein professionelles Anschreiben für die Stelle als ..."
„Formuliere eine Absage für die Einladung von Klaus"
„Schreib eine Instagram-Caption für dieses Foto"
```

#### `translate_text` — Text übersetzen

Übersetzt Text in eine beliebige Sprache.

```
„Übersetze das auf Englisch"
„Wie heißt das auf Spanisch?"
„Übersetze diesen Absatz auf Französisch"
```

#### `summarize_text` — Text zusammenfassen

Fasst langen Text kompakt zusammen.

```
„Fasse diesen Text zusammen"
„Kurze Version bitte"
„TLDR von diesem Artikel"
```

---

### Gedächtnis

#### `remember` — Merken

Speichert eine Information dauerhaft im Vektorspeicher.

```
„Merk dir: ich trinke morgens keinen Kaffee"
„Speichere: meine Lieblingsfarbe ist Blau"
„Merk dir dass mein Auto ein VW Golf ist"
```

#### `forget` — Vergessen

Löscht eine gespeicherte Erinnerung.

```
„Vergiss die Notiz über den Kaffee"
„Lösch den Gedächtniseintrag Nummer 3"
```

#### `list_memories` — Gedächtnis anzeigen

Zeigt alle gespeicherten Erinnerungen.

```
„Was weißt du über mich?"
„Zeig mir dein Gedächtnis"
„Meine gespeicherten Notizen bitte"
```

---

### Konfiguration

#### `update_setting` — Einstellung ändern

Ändert eine ELLA-Einstellung per Gespräch.

```
„Wechsle zu OpenAI"
„Stell den Anbieter auf Ollama"
„Deaktiviere die Sprachausgabe"
```

#### `create_rule` — Regel erstellen

Erstellt eine neue Verhaltensregel für ELLA.

```
„Erstell eine Regel: ELLA darf keine E-Mails versenden"
„Regel: zwischen 22 und 7 Uhr keine Wecker stellen"
„Verbiete ELLA den Zugriff auf Laufwerk D"
```

#### `homework_mode` — Hausaufgaben-Modus

Aktiviert oder deaktiviert den PIN-gesicherten Kiosk-Modus.

```
„Hausaufgaben-Modus aktivieren"
„Kinder-Modus starten"
„Hausaufgaben-Modus deaktivieren" _(PIN erforderlich)_
```

---

## Multi-Agenten

Die leistungsstärkste Funktion: mehrere KI-Agenten arbeiten **parallel** — schneller, tiefer, mehr auf einmal.

> Erfordert OpenAI-Key. Ollama läuft separat für den normalen Chat.

### Vordefinierte Pipelines

**🌅 Morgenbriefing** — 3 Agenten gleichzeitig:

- Kalendertermine des Tages
- Offene Aufgaben
- Aktuelles Wetter

**🖥️ System-Report** — 4 Agenten gleichzeitig:

- Speicherplatz aller Laufwerke
- RAM und CPU-Auslastung
- Top-Prozesse nach Ressourcenverbrauch
- Netzwerkstatus und Verbindungen

### Setup nach Abschluss

Pipeline verknüpfen mit einem Setup-Makro — nach Abschluss werden Apps automatisch geöffnet oder geschlossen.

---

## Setups

Makros — einmal definieren, jederzeit per Wort abrufen.

**Anlegen:** Einstellungen → Setups → Neu
**Aufrufen:** „Lade mein Arbeits-Setup"

---

## Gedächtnis

Vektorbasierter Langzeitspeicher (nomic-embed-text, lokal). Profil-isoliert — jeder Nutzer hat sein eigenes Gedächtnis.

---

## Proaktive Nachrichten

ELLA meldet sich von selbst wenn:

- Ein Laufwerk unter 10 % freien Platz fällt
- RAM dauerhaft überlastet ist
- Ein USB-Gerät angesteckt wird
- Ein Wecker auslöst
- Eine IBAN, Paketnummer oder Telefonnummer in der Zwischenablage erkannt wird
- Ein Kalendertermin in 15 Minuten beginnt
- Am Abend offene Aufgaben bestehen
- Eine lange Arbeitssession eine Pause empfiehlt

---

## Nutzerprofile

Mehrere Profile auf einem Rechner — jedes mit eigenem Gedächtnis, eigenem Verlauf, optionalem PIN.

**Einstellungen → Profile**

---

## Hausaufgaben-Modus

PIN-gesicherter Kiosk: nur freigegebene Apps können geöffnet werden.
Kein automatisches Ablaufdatum — nur der PIN beendet den Modus.

---

## Barrierefreiheit

### Blind-Modus

- TTS immer aktiv
- Keine Markdown-Formatierung
- Audio-Töne als Zustandsfeedback
- Alle Elemente mit `aria-label`

### Gehörlosenmodus

- TTS und Mikrofon vollständig ausgeblendet
- Visueller Banner im Chat

---

## Einstellungen

| Bereich              | Inhalt                                             |
| -------------------- | -------------------------------------------------- |
| **LLM**              | Modell-Tier (Klein/Standard/Groß) + Eigenes Modell |
| **Provider**         | Ollama (lokal) · OpenAI · Auto                     |
| **API-Key**          | OpenAI-Key für GPT-Funktionen und Multi-Agenten    |
| **Stimme**           | TTS-Engine, Sprachauswahl, Stressanalyse           |
| **Tools**            | Werkzeuge aktivieren / deaktivieren                |
| **Programme**        | Scan + Suche + manuelle Freigabe                   |
| **Setups**           | Makros für App-Kombinationen                       |
| **Regeln**           | Erlauben / Verbieten einzelner Aktionen            |
| **Profile**          | Nutzerprofile verwalten                            |
| **Hausaufgaben**     | Kinder-Modus konfigurieren                         |
| **Barrierefreiheit** | Blind- und Gehörlosenmodus                         |

### Eigenes Modell (neu in v1.3.0)

Du bist nicht auf die drei vordefinierten Modelle beschränkt. Unter **Einstellungen → LLM → Eigenes Modell**:

- Alle bereits in Ollama installierten Modelle erscheinen als anklickbare Auswahl
- Freitextfeld für beliebige Modellnamen nach `ollama pull`

Beispiel: `ollama pull qwen2.5:32b` im Terminal → in ELLA sofort wählbar.

### Programme (verbessert in v1.3.0)

Wenn ein Programm nicht in der gescannten Liste erscheint:

1. **Suche:** Programmnamen eintippen → ELLA sucht auf allen Laufwerken
2. **Durchsuchen:** Direkt zur .exe navigieren und hinzufügen

Neu installierte Programme sind nach dem Scan automatisch freigeschaltet — du musst nur explizit sperren was ELLA nicht nutzen soll.

---

## Die ELLA-Direktive

Vier unveränderliche Verbote — in der Architektur verankert, nicht deaktivierbar:

1. **harm** — kein Schaden: physisch, finanziell, psychologisch, datenbezogen
2. **conceal** — keine Verschleierung von Aktionen oder Fähigkeiten
3. **surveil** — keine Überwachung ohne Wissen und Zustimmung
4. **exfiltrate** — keine Datenweitergabe ohne ausdrückliche Zustimmung

Ablehnungen erscheinen als roter **DIRECTIVE**-Banner im Chat.

---

## Datenschutz

- Alle Daten bleiben auf dem Rechner
- Kein Telemetrie, kein Tracking
- Ollama läuft vollständig offline
- OpenAI-Funktionen (Vision, Multi-Agenten) nur wenn Key konfiguriert und aktiv genutzt
- OpenAI trainiert keine Modelle auf API-Daten

---

## Häufige Fragen

**ELLA antwortet nicht?**
Ollama läuft möglicherweise nicht. Der orangene Banner oben im Chat zeigt es an. Ollama neu starten oder auf OpenAI wechseln.

**Kann ich ELLA offline nutzen?**
Ja — vollständig. Nur Wetter (Open-Meteo), Gmail/Google Calendar und OpenAI-Funktionen benötigen Internet.

**Wie ändere ich das Sprachmodell?**
Einstellungen → LLM → gewünschtes Modell wählen oder eigenen Namen eingeben.

**Wie füge ich ein Programm hinzu das ELLA nicht findet?**
Einstellungen → Programme → Suchfeld oder Durchsuchen-Button.

**Was ist der Unterschied zwischen Chat und Multi-Agenten?**
Chat: ein Agent, sequenziell. Multi-Agenten: mehrere OpenAI-Agenten parallel — schneller, mehr Tiefe.

**ELLA lehnt etwas ab?**
Eigene Regel greift oder ELLA-Direktive. Roter Banner erklärt den Grund. Regeln in Einstellungen anpassen.

**Gedächtnis löschen?**
„Vergiss alles über mich" — oder einzelne Einträge: „Zeig mir dein Gedächtnis" → „Vergiss Eintrag Nr. X".

---

_E.L.L.A. v1.3.0 — Embedded Local Logic Agent_
_Entwickelt für Windows 10/11 (x64)_
