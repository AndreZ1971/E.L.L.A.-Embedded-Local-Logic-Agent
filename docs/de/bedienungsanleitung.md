# E.L.L.A. â€” Bedienungsanleitung

Version 1.4.0

---

## Hallo â€” ich bin E.L.L.A.

E.L.L.A. steht fÃ¼r _Embedded Local Logic Agent_ â€” dein persÃ¶nlicher KI-Assistent fÃ¼r Windows. Immer bereit, immer lokal, immer bei dir.

Das Besondere: Ich laufe vollstÃ¤ndig auf deinem eigenen Rechner. Kein Cloud-Server, kein Abo, kein Datenschutz-Kleingedrucktes. Einfach starten und loslegen.

**Kein ChatGPT. Kein Groq. Kein versteckter API-Key der das Ganze erst mÃ¶glich macht.**
Ich brauche das alles nicht â€” Ollama lÃ¤uft lokal, die KI lÃ¤uft lokal, deine Daten bleiben lokal.

---

## Erste Schritte

### Installation

1. `E.L.L.A Setup 1.4.0.exe` ausfÃ¼hren
2. Installationspfad wÃ¤hlen (Standard: `C:\Programme\E.L.L.A`)
3. Der Installer richtet alles automatisch ein â€” MariaDB, Ollama, Node.js. Nichts weiter installieren.

### Erster Start

1. **Sprachauswahl** â€” Deutsch oder Englisch
2. **EULA** â€” Nutzungsbedingungen und ELLA-Direktive akzeptieren
3. **Hardware-Scan** â€” ELLA erkennt deinen Rechner und schlÃ¤gt das passende Sprachmodell vor
4. **Modell-Auswahl** â€” du wÃ¤hlst (kein Download ohne deine Zustimmung)
5. **Stimme wÃ¤hlen** â€” 4 weibliche Stimmen in DE/EN/ES/FR mit Vorschau
6. **Standort** â€” fÃ¼r Wetter und lokale Infos (optional)
7. **Lizenzaktivierung** â€” `ELLA-XXXX-XXXX-XXXX-XXXX` eingeben
8. **Chat** â€” los geht's

---

## Der Chat

### Wie du mit mir sprichst

Schreib in normalem Deutsch â€” keine Befehle, keine Syntax. Ich verstehe natÃ¼rliche Sprache.

### Spracheingabe

Klicke den **Mikrofon-Button** oder sag **â€žElla"** (Wakeword-Modus). Modi:

- **Aus** â€” kein automatisches ZuhÃ¶ren
- **Manuell** â€” nur Knopfdruck
- **Wakeword** â€” auf â€žElla" warten, dann zuhÃ¶ren
- **Immer** â€” kontinuierliches ZuhÃ¶ren

### Sprachausgabe (TTS)

- **Kokoro TTS** (Standard) â€” lokale neuronale Stimme, vollstÃ¤ndig offline
- **Microsoft Edge TTS** (Fallback) â€” benÃ¶tigt Internet

### Feedback-Loop

Daumen hoch / Daumen runter unter jeder Antwort â†’ ELLA lernt deine Vorlieben und passt sich dauerhaft an.

### Tool-Anzeige

Wenn ELLA etwas tut siehst du kurz welches Werkzeug sie verwendet hat â€” volle Transparenz Ã¼ber jede Aktion.

### Provider-Anzeige

Im Avatar-Panel unten links zeigt ein grÃ¼ner Chip ob gerade **Ollama** (lokal) oder **OpenAI** (cloud-optional) aktiv ist.

---

## Alle Tools im Ãœberblick

ELLA hat **85+ Werkzeuge**. Hier sind alle â€” mit Beispielen.

---

### Programme & Apps

#### `list_programs` â€” Programme auflisten

Zeigt alle auf deinem System installierten und freigegebenen Programme.

```
â€žWelche Programme habe ich installiert?"
â€žListe mir alle Apps auf"
â€žWelche Programme darf ELLA Ã¶ffnen?"
```

#### `open_app` â€” App Ã¶ffnen

Ã–ffnet eine installierte Anwendung.

```
â€žÃ–ffne Chrome"
â€žStarte Spotify"
â€žÃ–ffne Word"
â€žMach den Task-Manager auf"
```

#### `launch_app` â€” App mit Parametern starten

Startet eine Anwendung mit zusÃ¤tzlichen Argumenten oder Dateipfaden.

```
â€žÃ–ffne Notepad mit der Datei C:\config.txt"
â€žStarte VLC mit dem Video auf dem Desktop"
```

#### `load_setup` â€” Setup ausfÃ¼hren

FÃ¼hrt ein vordefiniertes Setup-Makro aus â€” Ã¶ffnet und schlieÃŸt Apps automatisch.

```
â€žLade mein Arbeits-Setup"
â€žStarte das Gaming-Setup"
â€žFÃ¼hre Setup Feierabend aus"
```

#### `create_setup` â€” Setup erstellen

Erstellt ein neues Setup-Makro aus dem Chat heraus.

```
â€žErstell ein Setup namens Homeoffice: Ã¶ffne Teams, Outlook und Chrome"
â€žNeues Setup: beim Abend schlieÃŸe alle Apps und Ã¶ffne Spotify"
```

#### `control_window` â€” Fenster steuern

Minimiert, maximiert, schlieÃŸt oder verschiebt Programmfenster.

```
â€žMinimiere Chrome"
â€žMaximiere das aktuelle Fenster"
â€žSchlieÃŸe alle Word-Fenster"
```

#### `pause_ella` â€” ELLA pausieren

Deaktiviert das Wakeword fÃ¼r eine bestimmte Zeit.

```
â€žPausiere ELLA fÃ¼r 30 Minuten"
â€žStummschalten fÃ¼r eine Stunde"
â€žELLA, kurz Ruhe bitte â€” 20 Minuten"
```

---

### Dateien & Ordner

#### `search_files` â€” Dateien suchen

Durchsucht alle Laufwerke nach Dateien (Windows Search Index + Fallback).

```
â€žSuche die Datei Angebot"
â€žFinde alle PDFs mit dem Wort Rechnung"
â€žWo ist mein Lebenslauf?"
```

#### `open_file` â€” Datei Ã¶ffnen

Ã–ffnet eine Datei mit dem Standard-Programm.

```
â€žÃ–ffne C:\Dokumente\Bericht.docx"
â€žMach die Datei auf die du gerade gefunden hast"
```

#### `explore_folder` â€” Ordner im Explorer Ã¶ffnen

Ã–ffnet einen Ordner im Windows-Explorer.

```
â€žÃ–ffne den Ordner Downloads"
â€žZeig mir den Desktop-Ordner"
â€žExplorer auf C:\Projekte"
```

#### `list_folder` â€” Ordnerinhalt auflisten

Listet den Inhalt eines Ordners auf.

```
â€žWas ist im Ordner Dokumente?"
â€žListe alle Dateien im Download-Verzeichnis"
```

#### `read_file_content` â€” Dateiinhalt lesen

Liest und versteht den Inhalt von Dokumenten (.docx, .pdf, .xlsx, .html, .txt).

```
â€žWas steht in dieser PDF?"
â€žLies mir die Excel-Tabelle Umsatz2024 vor"
â€žFasse das Word-Dokument zusammen"
â€žWas steht auf Seite 3 vom Bericht?"
```

#### `create_document` â€” Dokument erstellen

Erstellt ein neues Word- oder Textdokument.

```
â€žErstell ein neues Word-Dokument namens Protokoll"
â€žNeues Textdokument auf dem Desktop: Notizen"
```

#### `dictate_to_document` â€” In Dokument diktieren

Ã–ffnet ein Word-Dokument und fÃ¼gt diktierten Text mit KI-Korrektur ein.

```
â€žDiktiere in das Dokument Bericht: Sehr geehrte Damen und Herren..."
â€žSchreib das in mein aktuelles Word-Dokument"
```

#### `rename_file` â€” Datei umbenennen

Benennt eine Datei um.

```
â€žBenenne die Datei Foto1.jpg um in Urlaub2024.jpg"
â€žRename C:\alte_datei.txt zu neue_datei.txt"
```

#### `copy_file` â€” Datei kopieren

Kopiert eine Datei an einen neuen Ort.

```
â€žKopiere das Dokument Vertrag nach D:\Backup"
â€žKopiere alle JPGs vom Desktop nach E:\Fotos"
```

#### `delete_file` â€” Einzelne Datei lÃ¶schen

LÃ¶scht eine bestimmte Datei (mit BestÃ¤tigung).

```
â€žLÃ¶sche die Datei temp_backup.zip"
```

#### `delete_files` â€” Mehrere Dateien lÃ¶schen

LÃ¶scht mehrere Dateien auf einmal.

```
â€žLÃ¶sche alle .tmp-Dateien im Temp-Ordner"
â€žEntferne alle alten Log-Dateien aus C:\Logs"
```

#### `create_folder` â€” Ordner erstellen

Erstellt einen neuen Ordner.

```
â€žErstell den Ordner Projekte 2025 auf dem Desktop"
â€žNeuer Ordner: C:\Archiv\2024"
```

#### `find_duplicates` â€” Doppelte Dateien finden

Durchsucht Laufwerke nach doppelten Dateien und berechnet verschwendeten Speicher.

```
â€žSuche nach doppelten Dateien"
â€žWie viel Platz verschwende ich durch Duplikate?"
â€žFinde doppelte Fotos auf Laufwerk D"
```

---

### System & Leistung

#### `get_disk_usage` â€” Festplattenauslastung

Zeigt freien und belegten Speicherplatz pro Laufwerk.

```
â€žWie viel Platz ist noch auf Laufwerk C?"
â€žFestplattenauslastung anzeigen"
â€žBin ich auf D bald voll?"
```

#### `get_system_info` â€” Systeminformationen

Zeigt CPU, RAM, Betriebssystem und Hardware-Details.

```
â€žWas fÃ¼r einen Prozessor habe ich?"
â€žZeig mir meine Systemdaten"
â€žWie viel RAM ist verbaut?"
```

#### `get_system_status` â€” System-Status

Aktueller Status: CPU-Auslastung, RAM, Festplatten auf einen Blick.

```
â€žWie lÃ¤uft mein System gerade?"
â€žSystem-Check bitte"
â€žIst alles okay mit dem Rechner?"
```

#### `get_temperatures` â€” Temperaturen

Zeigt CPU- und GPU-Temperaturen an.

```
â€žWie heiÃŸ ist meine CPU?"
â€žTemperaturen anzeigen"
â€žIst mein Rechner Ã¼berhitzt?"
```

#### `get_battery_status` â€” Akkustand

Zeigt Akku-Status und Ladestand (Laptops).

```
â€žWie viel Akku habe ich noch?"
â€žWird mein Laptop gerade geladen?"
```

#### `free_ram` â€” RAM freigeben

Gibt ungenutzten Arbeitsspeicher frei.

```
â€žGib den RAM frei"
â€žArbeitsspeicher leeren"
â€žMein Rechner ist langsam, rÃ¤um den Speicher auf"
```

#### `clean_temp` â€” Temp-Dateien bereinigen

LÃ¶scht temporÃ¤re Dateien des Systems.

```
â€žBereinige die Temp-Dateien"
â€žLÃ¶sch den Cache"
â€žMach den Temp-Ordner leer"
```

#### `empty_recycle_bin` â€” Papierkorb leeren

Leert den Windows-Papierkorb.

```
â€žLeere den Papierkorb"
â€žPapierkorb leeren bitte"
```

#### `get_event_log` â€” Windows-Ereignisprotokoll

Liest Windows-Systemereignisse und -Fehler aus.

```
â€žWas steht im Windows-Ereignisprotokoll?"
â€žGab es heute Systemfehler?"
â€žZeig mir die letzten Fehlermeldungen von Windows"
```

#### `list_autostart` â€” Autostart-Programme

Zeigt alle Programme die beim Windows-Start automatisch starten.

```
â€žWelche Programme starten automatisch mit Windows?"
â€žAutostart-Liste anzeigen"
â€žWas lÃ¤dt beim Hochfahren alles?"
```

#### `toggle_dark_mode` â€” Dark Mode umschalten

Schaltet den Windows Dark Mode an oder aus.

```
â€žDark Mode einschalten"
â€žWechsel zu hellem Design"
â€žDark Mode umschalten"
```

#### `shutdown_system` â€” Herunterfahren / Neustart

FÃ¤hrt Windows herunter oder startet neu.

```
â€žFahr den Rechner herunter"
â€žWindows neu starten"
â€žShut down in 5 Minuten"
```

---

### Prozesse & Dienste

#### `list_processes` â€” Prozesse auflisten

Zeigt alle laufenden Prozesse, sortiert nach CPU- oder RAM-Verbrauch.

```
â€žWelche Prozesse laufen gerade?"
â€žWas frisst am meisten RAM?"
â€žZeig mir die Top 10 nach CPU-Auslastung"
```

#### `kill_process` â€” Prozess beenden

Beendet einen laufenden Prozess (systemkritische sind gesperrt).

```
â€žBeende den Prozess chrome.exe"
â€žKill den Firefox-Prozess"
â€žBeende alle hÃ¤ngenden Word-Instanzen"
```

#### `manage_service` â€” Windows-Dienste verwalten

Startet, stoppt oder zeigt Windows-Dienste an.

```
â€žListe alle Windows-Dienste auf"
â€žStarte den Druckspooler-Dienst"
â€žStoppe den Windows Update-Dienst"
```

#### `run_command` â€” Befehl ausfÃ¼hren

FÃ¼hrt einen Shell-Befehl aus und gibt das Ergebnis zurÃ¼ck.

```
â€žFÃ¼hre den Befehl ipconfig /all aus"
â€žStarte das Skript setup.bat"
```

---

### Laufwerke & Speichermedien

#### `format_drive` â€” Laufwerk formatieren

Formatiert ein Laufwerk (Systemlaufwerke und ELLA-Laufwerk gesperrt, BestÃ¤tigung erforderlich).

```
â€žFormatiere meinen USB-Stick"
â€žFormat Laufwerk F als NTFS"
```

#### `rename_drive` â€” Laufwerk umbenennen

Gibt einem Laufwerk einen neuen Namen (Bezeichnung).

```
â€žBenenne Laufwerk E in Daten um"
â€žBezeichnung von D: auf Backup Ã¤ndern"
```

---

### Netzwerk

#### `scan_network` â€” Netzwerk scannen

Scannt das lokale Netzwerk via ARP und zeigt alle verbundenen GerÃ¤te.

```
â€žWer ist in meinem Netzwerk?"
â€žZeig mir alle GerÃ¤te im WLAN"
â€žNetzwerk-Scan starten"
```

#### `list_connections` â€” TCP-Verbindungen

Zeigt aktive Netzwerkverbindungen und offene Ports.

```
â€žZeig mir aktive TCP-Verbindungen"
â€žWelche Ports sind offen?"
â€žWas verbindet sich gerade mit dem Internet?"
```

#### `list_devices` â€” Verbundene GerÃ¤te

Listet alle GerÃ¤te auf die aktuell erkannt werden (USB, Netzwerk, Bluetooth).

```
â€žWelche GerÃ¤te sind angeschlossen?"
â€žWas fÃ¼r USB-Sticks sind drin?"
```

#### `get_wifi_info` â€” WLAN-Status

Zeigt WLAN-Verbindungsdetails: SSID, Signal, IP-Adresse.

```
â€žWie ist mein WLAN-Status?"
â€žWie stark ist mein WLAN-Signal?"
â€žMit welchem Netzwerk bin ich verbunden?"
```

---

### Mail & Kalender

#### `read_emails` â€” Outlook-Mails lesen

Liest ungelesene oder gefilterte Outlook-Mails.

```
â€žZeig mir meine ungelesenen Mails"
â€žWas hat Klaus geschrieben?"
â€žNeue Mails von heute bitte"
```

#### `mark_email` â€” Outlook-Mail markieren

Markiert eine Mail als gelesen, Spam oder archiviert.

```
â€žMarkiere die Mail von Klaus als gelesen"
â€žDie letzte Mail als Spam markieren"
â€žArchiviere die Betreff-Mail"
```

#### `compose_email` â€” E-Mail verfassen

Ã–ffnet einen Outlook-Entwurf mit KI-formuliertem Text (sendet nicht automatisch).

```
â€žSchreib einen Entwurf an Klaus: Treffen morgen 14 Uhr?"
â€žMail an team@firma.de: das Meeting ist verschoben"
```

#### `read_gmail` â€” Gmail lesen

Liest Gmail-Mails via OAuth 2.0 (einmalige Einrichtung in Einstellungen).

```
â€žZeig mir meine Gmail-Mails"
â€žUngelesene Gmail von heute"
```

#### `mark_gmail` â€” Gmail-Mail markieren

Markiert Gmail-Mails als gelesen, Spam oder archiviert.

```
â€žGmail-Mail als gelesen markieren"
â€žSpam-Mail in Gmail ablegen"
```

#### `read_calendar` â€” Outlook-Kalender lesen

Liest Kalendertermine aus Outlook.

```
â€žWas steht diese Woche im Kalender?"
â€žWelche Termine habe ich morgen?"
â€žZeig mir den Kalender fÃ¼r nÃ¤chsten Montag"
```

#### `create_appointment` â€” Outlook-Termin erstellen

Legt einen neuen Termin in Outlook an.

```
â€žErstell einen Termin: Zahnarzt, Freitag 10 Uhr"
â€žMeeting mit Klaus: Donnerstag 14 Uhr, 1 Stunde"
```

#### `read_google_calendar` â€” Google Calendar lesen

Liest Google-Kalender via OAuth 2.0.

```
â€žWas steht im Google Kalender heute?"
â€žGoogle-Termine fÃ¼r diese Woche"
```

#### `create_google_appointment` â€” Google-Termin erstellen

Erstellt einen Termin im Google Calendar.

```
â€žTermin in Google Calendar: Arzt, Montag 9 Uhr"
```

---

### Aufgaben & Wecker

#### `add_task` â€” Aufgabe hinzufÃ¼gen

FÃ¼gt eine Aufgabe zur persistenten Todo-Liste hinzu (Ã¼berlebt Neustarts).

```
â€žFÃ¼ge die Aufgabe 'Steuern erledigen' hinzu"
â€žTodo: RÃ¼ckruf bei MÃ¼ller"
â€žNeues To-do: Angebot bis Freitag fertig"
```

#### `list_tasks` â€” Aufgaben anzeigen

Zeigt alle offenen oder erledigten Aufgaben.

```
â€žZeig mir meine offenen Aufgaben"
â€žWas steht noch auf meiner Todo-Liste?"
â€žErledigte Aufgaben anzeigen"
```

#### `complete_task` â€” Aufgabe erledigen

Markiert eine Aufgabe als erledigt.

```
â€žMarkiere 'Steuern erledigen' als erledigt"
â€žAufgabe 3 abhaken"
```

#### `delete_task` â€” Aufgabe lÃ¶schen

LÃ¶scht eine Aufgabe aus der Liste.

```
â€žLÃ¶sche die Aufgabe RÃ¼ckruf MÃ¼ller"
â€žAufgabe 5 entfernen"
```

#### `set_alarm` â€” Wecker stellen

Stellt einen Wecker â€” ELLA lÃ¶st ihn mit Sprachalert aus.

```
â€žStell einen Wecker fÃ¼r 7:30 Uhr"
â€žWecker morgen frÃ¼h 6 Uhr"
â€žWeck mich in 45 Minuten"
```

#### `list_alarms` â€” Wecker anzeigen

Zeigt alle aktiven Wecker.

```
â€žWelche Wecker sind aktiv?"
â€žMeine Wecker anzeigen"
```

#### `delete_alarm` â€” Wecker lÃ¶schen

LÃ¶scht einen gesetzten Wecker.

```
â€žLÃ¶sche den 7:30-Wecker"
â€žWecker fÃ¼r morgen entfernen"
```

#### `set_reminder` â€” Erinnerung setzen

Erstellt eine Erinnerung via Windows Task Scheduler â€” erscheint als Popup zur gesetzten Zeit.

```
â€žErinner mich morgen um 15 Uhr: Arzttermin anrufen"
â€žErinnerung: Freitag 9 Uhr â€” Rechnung bezahlen"
```

#### `list_reminders` â€” Erinnerungen anzeigen

Zeigt alle aktiven Erinnerungen.

```
â€žWelche Erinnerungen habe ich?"
â€žMeine Erinnerungen anzeigen"
```

#### `delete_reminder` â€” Erinnerung lÃ¶schen

LÃ¶scht eine geplante Erinnerung.

```
â€žLÃ¶sche die Erinnerung Arzttermin"
```

---

### Systemsteuerung

#### `set_volume` â€” LautstÃ¤rke regeln

Setzt die Windows-SystemlautstÃ¤rke.

```
â€žStell die LautstÃ¤rke auf 40 Prozent"
â€žLautloser bitte â€” auf 10"
â€žMaximale LautstÃ¤rke"
â€žStummschalten"
```

#### `get_clipboard` â€” Zwischenablage lesen

Liest den aktuellen Inhalt der Zwischenablage (inkl. der letzten 20 EintrÃ¤ge).

```
â€žWas ist in der Zwischenablage?"
â€žWas habe ich zuletzt kopiert?"
â€žZeig mir die Clipboard-Historie"
```

#### `set_clipboard` â€” Zwischenablage setzen

Schreibt Text in die Zwischenablage.

```
â€žKopiere 'Hallo Welt' in die Zwischenablage"
â€žSchreib meine E-Mail-Adresse in die Zwischenablage"
```

#### `send_keys` â€” Tasten simulieren

Sendet Tastenkombinationen an das aktive Fenster.

```
â€žSende Strg+C an das aktive Fenster"
â€žDrÃ¼cke Enter"
â€žTastenkombination Alt+F4 senden"
```

---

### Maus & Bildschirm-Automation

#### `move_mouse` â€” Maus bewegen

Bewegt den Mauszeiger zu bestimmten Koordinaten.

```
â€žBewege die Maus zu Position 500, 300"
```

#### `click_at` â€” Klick an Position

Klickt an bestimmten Bildschirmkoordinaten.

```
â€žKlicke auf Position 200, 400"
â€žRechtsklick auf 800, 600"
```

#### `drag_drop` â€” Drag & Drop

Zieht ein Element von einer Position zur anderen.

```
â€žZiehe von 100,200 nach 500,600"
```

#### `click_element` â€” Element anklicken

Klickt auf ein benanntes Element auf dem Bildschirm.

```
â€žKlicke auf den OK-Button"
â€žKlicke auf Speichern"
```

#### `read_screen` â€” Bildschirm lesen

Liest den Text vom aktuellen Bildschirm.

```
â€žWas steht auf meinem Bildschirm?"
â€žLies mir den Text im aktiven Fenster vor"
```

#### `watch_screen` â€” Bildschirm beobachten

Beobachtet den Bildschirm und wartet auf eine bestimmte VerÃ¤nderung.

```
â€žWarte bis der Download fertig ist und sag mir Bescheid"
â€žBeobachte den Bildschirm auf Fehlermeldungen"
```

#### `describe_screen` â€” Bildschirm beschreiben

Macht einen Screenshot und beschreibt was darauf zu sehen ist (OpenAI Vision).

```
â€žBeschreib mir was auf dem Bildschirm passiert"
â€žWas siehst du gerade auf meinem Monitor?"
```

#### `take_screenshot` â€” Screenshot aufnehmen

Macht einen Screenshot und speichert ihn.

```
â€žMach einen Screenshot"
â€žScreenshot vom Bildschirm"
â€žFoto vom aktuellen Fenster"
```

#### `describe_image` â€” Bild analysieren

Analysiert ein eingefÃ¼gtes Bild mit GPT-4o Vision (OpenAI-Key erforderlich).

```
â€žWas ist auf diesem Bild?" _(Bild einfÃ¼gen)_
â€žAnalysiere dieses Foto"
â€žBeschreib das Bild das ich gerade geschickt habe"
```

#### `describe_webpage` â€” Webseite analysieren

LÃ¤dt eine Webseite und fasst ihren Inhalt zusammen.

```
â€žWas steht auf dieser Webseite: https://..."
â€žFasse den Artikel auf dieser URL zusammen"
```

---

### Internet & Suche

#### `search_web` / `web_search` â€” Websuche

Sucht im Internet via DuckDuckGo ohne Tracking.

```
â€žSuche nach dem aktuellen Bitcoin-Kurs"
â€žWas ist das neue iPhone Modell?"
â€žWer hat die Champions League gewonnen?"
```

#### `fetch_url` â€” URL abrufen

LÃ¤dt den Inhalt einer URL und gibt ihn zurÃ¼ck.

```
â€žRuf diese URL auf und sag mir was dort steht"
â€žHol den Inhalt von https://..."
```

#### `get_weather` â€” Wetter

Holt das aktuelle Wetter fÃ¼r deinen Standort (Open-Meteo, kein API-Key nÃ¶tig).

```
â€žWie wird das Wetter heute?"
â€žWetter fÃ¼r morgen bitte"
â€žBrauche ich heute einen Regenschirm?"
```

#### `get_location` â€” Standort

Gibt deinen konfigurierten Standort zurÃ¼ck.

```
â€žWas ist mein aktueller Standort?"
â€žWo bin ich eingestellt?"
```

---

### Datum & Zeit

#### `get_datetime` â€” Datum und Uhrzeit

Gibt das aktuelle Datum und die Uhrzeit zurÃ¼ck.

```
â€žWie spÃ¤t ist es?"
â€žWelches Datum haben wir heute?"
â€žWie viele Tage noch bis Weihnachten?"
```

---

### Musik & Medien

#### `play_music` â€” Musik abspielen

Durchsucht deine Musikbibliothek und Ã¶ffnet Titel im Media Player.

```
â€žSpiel etwas von Coldplay"
â€žÃ–ffne das Album 'Brothers in Arms' von Dire Straits"
â€žSuche Metallica-Titel in meiner Bibliothek"
â€žSpiel meine Lieblingsplaylist"
```

#### `control_media` â€” Medienwiedergabe steuern

Steuert den aktuellen Mediaplayer (Play, Pause, NÃ¤chster, Vorheriger).

```
â€žPause"
â€žNÃ¤chster Titel"
â€žVorheriges Lied"
â€žWiedergabe starten"
```

#### `get_now_playing` â€” Aktueller Titel

Zeigt was gerade abgespielt wird.

```
â€žWas spielt gerade?"
â€žWelcher Titel lÃ¤uft?"
```

---

### Texte & Sprache

#### `write_for_me` â€” Text schreiben

Schreibt Texte beliebiger Art auf Wunsch.

```
â€žSchreib mir ein professionelles Anschreiben fÃ¼r die Stelle als ..."
â€žFormuliere eine Absage fÃ¼r die Einladung von Klaus"
â€žSchreib eine Instagram-Caption fÃ¼r dieses Foto"
```

#### `translate_text` â€” Text Ã¼bersetzen

Ãœbersetzt Text in eine beliebige Sprache.

```
â€žÃœbersetze das auf Englisch"
â€žWie heiÃŸt das auf Spanisch?"
â€žÃœbersetze diesen Absatz auf FranzÃ¶sisch"
```

#### `summarize_text` â€” Text zusammenfassen

Fasst langen Text kompakt zusammen.

```
â€žFasse diesen Text zusammen"
â€žKurze Version bitte"
â€žTLDR von diesem Artikel"
```

---

### GedÃ¤chtnis

#### `remember` â€” Merken

Speichert eine Information dauerhaft im Vektorspeicher.

```
â€žMerk dir: ich trinke morgens keinen Kaffee"
â€žSpeichere: meine Lieblingsfarbe ist Blau"
â€žMerk dir dass mein Auto ein VW Golf ist"
```

#### `forget` â€” Vergessen

LÃ¶scht eine gespeicherte Erinnerung.

```
â€žVergiss die Notiz Ã¼ber den Kaffee"
â€žLÃ¶sch den GedÃ¤chtniseintrag Nummer 3"
```

#### `list_memories` â€” GedÃ¤chtnis anzeigen

Zeigt alle gespeicherten Erinnerungen.

```
â€žWas weiÃŸt du Ã¼ber mich?"
â€žZeig mir dein GedÃ¤chtnis"
â€žMeine gespeicherten Notizen bitte"
```

---

### Konfiguration

#### `update_setting` â€” Einstellung Ã¤ndern

Ã„ndert eine ELLA-Einstellung per GesprÃ¤ch.

```
â€žWechsle zu OpenAI"
â€žStell den Anbieter auf Ollama"
â€žDeaktiviere die Sprachausgabe"
```

#### `create_rule` â€” Regel erstellen

Erstellt eine neue Verhaltensregel fÃ¼r ELLA.

```
â€žErstell eine Regel: ELLA darf keine E-Mails versenden"
â€žRegel: zwischen 22 und 7 Uhr keine Wecker stellen"
â€žVerbiete ELLA den Zugriff auf Laufwerk D"
```

#### `homework_mode` â€” Hausaufgaben-Modus

Aktiviert oder deaktiviert den PIN-gesicherten Kiosk-Modus.

```
â€žHausaufgaben-Modus aktivieren"
â€žKinder-Modus starten"
â€žHausaufgaben-Modus deaktivieren" _(PIN erforderlich)_
```

---

## Multi-Agenten

Die leistungsstÃ¤rkste Funktion: mehrere KI-Agenten arbeiten **parallel** â€” schneller, tiefer, mehr auf einmal.

> Erfordert OpenAI-Key. Ollama lÃ¤uft separat fÃ¼r den normalen Chat.

### Vordefinierte Pipelines

**ðŸŒ… Morgenbriefing** â€” 3 Agenten gleichzeitig:

- Kalendertermine des Tages
- Offene Aufgaben
- Aktuelles Wetter

**ðŸ–¥ï¸ System-Report** â€” 4 Agenten gleichzeitig:

- Speicherplatz aller Laufwerke
- RAM und CPU-Auslastung
- Top-Prozesse nach Ressourcenverbrauch
- Netzwerkstatus und Verbindungen

### Setup nach Abschluss

Pipeline verknÃ¼pfen mit einem Setup-Makro â€” nach Abschluss werden Apps automatisch geÃ¶ffnet oder geschlossen.

---

## Setups

Makros â€” einmal definieren, jederzeit per Wort abrufen.

**Anlegen:** Einstellungen â†’ Setups â†’ Neu
**Aufrufen:** â€žLade mein Arbeits-Setup"

---

## GedÃ¤chtnis

Vektorbasierter Langzeitspeicher (nomic-embed-text, lokal). Profil-isoliert â€” jeder Nutzer hat sein eigenes GedÃ¤chtnis.

---

## Proaktive Nachrichten

ELLA meldet sich von selbst wenn:

- Ein Laufwerk unter 10 % freien Platz fÃ¤llt
- RAM dauerhaft Ã¼berlastet ist
- Ein USB-GerÃ¤t angesteckt wird
- Ein Wecker auslÃ¶st
- Eine IBAN, Paketnummer oder Telefonnummer in der Zwischenablage erkannt wird
- Ein Kalendertermin in 15 Minuten beginnt
- Am Abend offene Aufgaben bestehen
- Eine lange Arbeitssession eine Pause empfiehlt

---

## Nutzerprofile

Mehrere Profile auf einem Rechner â€” jedes mit eigenem GedÃ¤chtnis, eigenem Verlauf, optionalem PIN.

**Einstellungen â†’ Profile**

---

## Hausaufgaben-Modus

PIN-gesicherter Kiosk: nur freigegebene Apps kÃ¶nnen geÃ¶ffnet werden.
Kein automatisches Ablaufdatum â€” nur der PIN beendet den Modus.

---

## Barrierefreiheit

### Blind-Modus

- TTS immer aktiv
- Keine Markdown-Formatierung
- Audio-TÃ¶ne als Zustandsfeedback
- Alle Elemente mit `aria-label`

### GehÃ¶rlosenmodus

- TTS und Mikrofon vollstÃ¤ndig ausgeblendet
- Visueller Banner im Chat

---

## Einstellungen

| Bereich              | Inhalt                                             |
| -------------------- | -------------------------------------------------- |
| **LLM**              | Modell-Tier (Klein/Standard/GroÃŸ) + Eigenes Modell |
| **Provider**         | Ollama (lokal) Â· OpenAI Â· Auto                     |
| **API-Key**          | OpenAI-Key fÃ¼r GPT-Funktionen und Multi-Agenten    |
| **Stimme**           | TTS-Engine, Sprachauswahl, Stressanalyse           |
| **Tools**            | Werkzeuge aktivieren / deaktivieren                |
| **Programme**        | Scan + Suche + manuelle Freigabe                   |
| **Setups**           | Makros fÃ¼r App-Kombinationen                       |
| **Regeln**           | Erlauben / Verbieten einzelner Aktionen            |
| **Profile**          | Nutzerprofile verwalten                            |
| **Hausaufgaben**     | Kinder-Modus konfigurieren                         |
| **Barrierefreiheit** | Blind- und GehÃ¶rlosenmodus                         |

### Eigenes Modell (neu in v1.3.0)

Du bist nicht auf die drei vordefinierten Modelle beschrÃ¤nkt. Unter **Einstellungen â†’ LLM â†’ Eigenes Modell**:

- Alle bereits in Ollama installierten Modelle erscheinen als anklickbare Auswahl
- Freitextfeld fÃ¼r beliebige Modellnamen nach `ollama pull`

Beispiel: `ollama pull qwen2.5:32b` im Terminal â†’ in ELLA sofort wÃ¤hlbar.

### Programme (verbessert in v1.3.0)

Wenn ein Programm nicht in der gescannten Liste erscheint:

1. **Suche:** Programmnamen eintippen â†’ ELLA sucht auf allen Laufwerken
2. **Durchsuchen:** Direkt zur .exe navigieren und hinzufÃ¼gen

Neu installierte Programme sind nach dem Scan automatisch freigeschaltet â€” du musst nur explizit sperren was ELLA nicht nutzen soll.

---

## Die ELLA-Direktive

Vier unverÃ¤nderliche Verbote â€” in der Architektur verankert, nicht deaktivierbar:

1. **harm** â€” kein Schaden: physisch, finanziell, psychologisch, datenbezogen
2. **conceal** â€” keine Verschleierung von Aktionen oder FÃ¤higkeiten
3. **surveil** â€” keine Ãœberwachung ohne Wissen und Zustimmung
4. **exfiltrate** â€” keine Datenweitergabe ohne ausdrÃ¼ckliche Zustimmung

Ablehnungen erscheinen als roter **DIRECTIVE**-Banner im Chat.

---

## Datenschutz

- Alle Daten bleiben auf dem Rechner
- Kein Telemetrie, kein Tracking
- Ollama lÃ¤uft vollstÃ¤ndig offline
- OpenAI-Funktionen (Vision, Multi-Agenten) nur wenn Key konfiguriert und aktiv genutzt
- OpenAI trainiert keine Modelle auf API-Daten

---

## HÃ¤ufige Fragen

**ELLA antwortet nicht?**
Ollama lÃ¤uft mÃ¶glicherweise nicht. Der orangene Banner oben im Chat zeigt es an. Ollama neu starten oder auf OpenAI wechseln.

**Kann ich ELLA offline nutzen?**
Ja â€” vollstÃ¤ndig. Nur Wetter (Open-Meteo), Gmail/Google Calendar und OpenAI-Funktionen benÃ¶tigen Internet.

**Wie Ã¤ndere ich das Sprachmodell?**
Einstellungen â†’ LLM â†’ gewÃ¼nschtes Modell wÃ¤hlen oder eigenen Namen eingeben.

**Wie fÃ¼ge ich ein Programm hinzu das ELLA nicht findet?**
Einstellungen â†’ Programme â†’ Suchfeld oder Durchsuchen-Button.

**Was ist der Unterschied zwischen Chat und Multi-Agenten?**
Chat: ein Agent, sequenziell. Multi-Agenten: mehrere OpenAI-Agenten parallel â€” schneller, mehr Tiefe.

**ELLA lehnt etwas ab?**
Eigene Regel greift oder ELLA-Direktive. Roter Banner erklÃ¤rt den Grund. Regeln in Einstellungen anpassen.

**GedÃ¤chtnis lÃ¶schen?**
â€žVergiss alles Ã¼ber mich" â€” oder einzelne EintrÃ¤ge: â€žZeig mir dein GedÃ¤chtnis" â†’ â€žVergiss Eintrag Nr. X".

---

_E.L.L.A. v1.3.0 â€” Embedded Local Logic Agent_
_Entwickelt fÃ¼r Windows 10/11 (x64)_

---

## Neu in v1.4.0

### Schach

ELLA oeffnet ein eigenstaendiges Schach-Fenster - 4 Brett-Themes, KI-Gegner, Zug-Kommentar per Stimme, Spielstand bleibt gespeichert.

`
Oeffne das Schach-Fenster
Spielen wir eine Partie Schach
`

### Gedaechtnis-Browser

Vollstaendige UI zum Durchsuchen und Verwalten aller gespeicherten Erinnerungen - Freitext-Suche, Typ-Filter, Paginierung.

`
Zeig mir alle Erinnerungen ueber Arbeit
Liste alle System-Notizen
`

### Knowledge-Graph

Visueller Graph der semantischen Verbindungen zwischen ELLAs Erinnerungen - D3 Force-Directed, interaktiv. Optional mit indizierten Dokumenten als Knoten.

Erreichbar ueber: **Einstellungen -> Gedaechtnis -> Graph anzeigen**

### Backup und Restore

JSON-Export aller Daten (Erinnerungen, Regeln, Wecker, Aufgaben, Setups) - Import mit Merge- oder Ersetzen-Modus.

Erreichbar ueber: **Einstellungen -> Backup**

### Hardware-Detail-Tools

Neue Tools: GPU-Info, RAM-Details, Laufwerks-Gesundheit, Audio-Geraete, USB-Geraete.

`
Zeig mir meine GPU-Details
Wie gesund ist meine Festplatte?
Welche Audiogeraete sind angeschlossen?
`

### Dokument-Indexierung und Auto-Re-Index

ELLA indiziert Ordner fuer semantische Suche und haelt sie taeglich automatisch aktuell. Neue Dateien werden proaktiv gemeldet.

`
Indexiere den Ordner Projekte
Welche Ordner kennst du?
Suche in meinen Dokumenten nach Datenschutz
`

---

_E.L.L.A. v1.4.0 - Embedded Local Logic Agent_
_Entwickelt fuer Windows 10/11 (x64)_
