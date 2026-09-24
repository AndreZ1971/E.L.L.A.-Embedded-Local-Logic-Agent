# E.L.L.A. — Fähigkeiten (v1.4.0)

85 aktive Tools. Alles per natürlicher Sprache.

---

## Gedächtnis & Konfiguration

| Tool             | Was es tut                                                            |
| ---------------- | --------------------------------------------------------------------- |
| `remember`       | Informationen dauerhaft speichern (ML-Embedding, Cosinus-Ähnlichkeit) |
| `forget`         | Eine Erinnerung per ID löschen                                        |
| `list_memories`  | Alles anzeigen was ELLA über den Nutzer weiß                          |
| `create_setup`   | Eine benannte App-Gruppe anlegen (z.B. "Arbeit starten")              |
| `load_setup`     | Alle Apps aus einem gespeicherten Setup starten                       |
| `update_setting` | ELLA-Einstellungen per Sprache ändern                                 |
| `create_rule`    | Erlaubnis-/Verbotsregeln für Tools erstellen                          |

---

## System & Festplatten

| Tool                 | Was es tut                                                      |
| -------------------- | --------------------------------------------------------------- |
| `get_disk_usage`     | Freier/belegter Speicher je Laufwerk                            |
| `get_system_info`    | CPU, GPU, RAM, Computername                                     |
| `get_system_status`  | Alles auf einmal: Disk + RAM + Netzwerk + Alerts + Boot-Zeit    |
| `clean_temp`         | Temporäre Dateien löschen                                       |
| `empty_recycle_bin`  | Papierkorb leeren                                               |
| `free_ram`           | Ungenutzten RAM freigeben                                       |
| `shutdown_system`    | PC herunterfahren / neu starten / Schlafmodus                   |
| `format_drive`       | USB-/externe Laufwerke formatieren _(Bestätigung erforderlich)_ |
| `rename_drive`       | Volume-Label ändern _(Systemlaufwerke gesperrt)_                |
| `list_programs`      | Alle installierten Programme auflisten                          |
| `list_autostart`     | Autostart-Einträge anzeigen                                     |
| `get_battery_status` | Ladestand, ob geladen wird, geschätzte Restlaufzeit             |
| `get_temperatures`   | CPU/ACPI-Thermalzonen in °C                                     |
| `get_event_log`      | Windows-Fehler/Warnungen aus dem Ereignisprotokoll              |
| `toggle_dark_mode`   | Dark Mode / Light Mode umschalten                               |
| `get_gpu_info`       | GPU-Modell, VRAM, Auslastung                                    |
| `get_ram_details`    | RAM-Slots, Typ, Taktrate                                        |
| `get_drive_details`  | Laufwerkstyp, Gesundheit, S.M.A.R.T.                            |
| `get_audio_devices`  | Angeschlossene Audiogeräte                                      |
| `get_usb_devices`    | Angeschlossene USB-Geräte                                       |

---

## Dateien & Ordner

| Tool                   | Was es tut                                                  |
| ---------------------- | ----------------------------------------------------------- |
| `search_files`         | Alle Laufwerke nach Dateien durchsuchen                     |
| `open_file`            | Datei öffnen (optional: mit App)                            |
| `explore_folder`       | Ordner im Windows Explorer öffnen                           |
| `read_file_content`    | Inhalt einer Textdatei lesen                                |
| `rename_file`          | Datei/Ordner umbenennen _(mit Bestätigung)_                 |
| `copy_file`            | Datei kopieren _(mit Bestätigung, Systempfade gesperrt)_    |
| `create_folder`        | Ordner anlegen (inkl. Unterordner)                          |
| `delete_file`          | Datei/Ordner in den Papierkorb _(kein permanentes Löschen)_ |
| `find_duplicates`      | Doppelte Dateien nach Hash finden                           |
| `index_documents`      | Ordner für semantische Suche indizieren                     |
| `list_indexed_folders` | Alle indizierten Ordner mit Statistik anzeigen              |

---

## Dokumente & Schreiben

| Tool                  | Was es tut                                               |
| --------------------- | -------------------------------------------------------- |
| `create_document`     | Neues Word-Dokument oder TXT erstellen                   |
| `dictate_to_document` | Diktat in Word schreiben, KI korrigiert Tippfehler       |
| `compose_email`       | Outlook-Entwurf öffnen _(sendet nicht automatisch)_      |
| `write_for_me`        | Text im persönlichen Stil des Nutzers schreiben          |
| `translate_text`      | Text übersetzen — offline (Ollama) oder OpenAI           |
| `summarize_text`      | Text zusammenfassen: kurz / mittel / ausführlich         |
| `correct_text`        | Grammatik und Zeichensetzung korrigieren                 |
| `write_in_style`      | Text im persönlichen Schreibstil des Nutzers formulieren |

---

## Kommunikation & Kalender

| Tool                        | Was es tut                                         |
| --------------------------- | -------------------------------------------------- |
| `read_emails`               | Ungelesene Outlook-E-Mails abrufen                 |
| `mark_email`                | Outlook-E-Mail als gelesen markieren / archivieren |
| `read_calendar`             | Outlook-Kalender lesen                             |
| `create_appointment`        | Outlook-Termin anlegen                             |
| `read_gmail`                | Gmail (OAuth 2.0) lesen                            |
| `mark_gmail`                | Gmail markieren / archivieren                      |
| `read_google_calendar`      | Google Kalender lesen                              |
| `create_google_appointment` | Google Kalender-Termin anlegen                     |

---

## Netzwerk & Sicherheit

| Tool               | Was es tut                                               |
| ------------------ | -------------------------------------------------------- |
| `scan_network`     | ARP-Scan: alle Geräte im Heimnetz mit IP + MAC           |
| `list_connections` | Aktive TCP-Verbindungen + lauschende Ports + Prozessname |
| `list_devices`     | Angeschlossene Hardware (USB, Kameras, Laufwerke)        |
| `get_wifi_info`    | WLAN-Name, Signalstärke, Übertragungsrate                |
| `fetch_url`        | Webseite abrufen und Text extrahieren                    |

---

## Web & Wissen

| Tool           | Was es tut                               |
| -------------- | ---------------------------------------- |
| `search_web`   | Web-Suche (DuckDuckGo, kein API-Key)     |
| `get_weather`  | Wetter für beliebigen Ort (kein API-Key) |
| `get_location` | Gespeicherten Nutzer-Standort abrufen    |
| `get_datetime` | Exakte Uhrzeit, Datum, Zeitzone          |

---

## Prozesse & Dienste

| Tool              | Was es tut                                                |
| ----------------- | --------------------------------------------------------- |
| `list_processes`  | Laufende Prozesse nach CPU/RAM sortiert                   |
| `kill_process`    | Prozess beenden _(systemkritische gesperrt, Bestätigung)_ |
| `list_services`   | Windows-Dienste auflisten                                 |
| `control_service` | Dienst starten / stoppen / neu starten                    |

---

## Produktivität & Aufgaben

| Tool              | Was es tut                                      |
| ----------------- | ----------------------------------------------- |
| `add_task`        | Aufgabe zur persistenten To-do-Liste hinzufügen |
| `list_tasks`      | Offene oder erledigte Aufgaben anzeigen         |
| `complete_task`   | Aufgabe als erledigt markieren                  |
| `delete_task`     | Aufgabe löschen                                 |
| `set_reminder`    | Erinnerung per Windows Task Scheduler setzen    |
| `list_reminders`  | Aktive Erinnerungen anzeigen                    |
| `delete_reminder` | Erinnerung löschen                              |

---

## Zwischenablage & Lautstärke

| Tool            | Was es tut                                            |
| --------------- | ----------------------------------------------------- |
| `get_clipboard` | Zwischenablage lesen (+ Historie letzter 20 Einträge) |
| `set_clipboard` | Text in Zwischenablage schreiben                      |
| `set_volume`    | Systemlautstärke setzen oder stumm schalten           |

---

## Musik & Medien

| Tool              | Was es tut                                                        |
| ----------------- | ----------------------------------------------------------------- |
| `play_music`      | Musikbibliothek durchsuchen (Künstler/Album/Titel), Player öffnen |
| `control_media`   | Medien steuern: Play / Pause / Next / Prev / Stop                 |
| `get_now_playing` | Aktuell spielenden Titel abrufen                                  |

---

## Bildschirm & Vision

| Tool              | Was es tut                                               |
| ----------------- | -------------------------------------------------------- |
| `take_screenshot` | Screenshot + KI-Analyse (GPT-4o Vision)                  |
| `read_screen`     | Text vom Bildschirm lesen — lokal, offline (Windows OCR) |
| `watch_screen`    | Bildschirm bis 30 s beobachten, Änderungen melden        |
| `click_element`   | Auf UI-Element klicken per sichtbarem Text (OCR)         |

---

## Maus & Tastatur

| Tool         | Was es tut                                          |
| ------------ | --------------------------------------------------- |
| `move_mouse` | Maus an Position bewegen _(kein Klick)_             |
| `click_at`   | An Koordinaten klicken _(Bestätigung erforderlich)_ |
| `drag_drop`  | Drag & Drop von A nach B _(Bestätigung)_            |
| `send_keys`  | Tastatureingaben an Fenster senden                  |

---

## Fenster & Apps

| Tool                | Was es tut                                                      |
| ------------------- | --------------------------------------------------------------- |
| `open_app`          | App per Name öffnen                                             |
| `launch_app`        | App per Name oder Pfad starten _(Systempfade gesperrt)_         |
| `control_window`    | Fenster: fokussieren / minimieren / maximieren / schließen      |
| `homework_mode`     | Gesicherten Kindermodus aktivieren/deaktivieren (PIN-geschützt) |
| `pause_ella`        | ELLA pausieren (1–120 Minuten)                                  |
| `open_chess_window` | Schach-Fenster öffnen                                           |

---

## Shell

| Tool          | Was es tut                                                        |
| ------------- | ----------------------------------------------------------------- |
| `run_command` | PowerShell-Befehl ausführen _(Bestätigung, 60+ gesperrte Muster)_ |

---

## Immer aktiv — ohne Tool-Aufruf

| Feature                           | Was es tut                                                     |
| --------------------------------- | -------------------------------------------------------------- |
| **Wakeword "ella"**               | Sprachaktivierung via openWakeWord + ONNX (lokal, offline)     |
| **Kokoro TTS**                    | Neuronale Sprachausgabe (offline, kein Python)                 |
| **Proaktive Nachrichten**         | ELLA schreibt von sich aus in den Chat                         |
| **Clipboard-Mustererkennung**     | IBAN, Paketnummer, Telefon, URL, E-Mail — Polling alle 3 s     |
| **Background Worker**             | Disk/RAM/Alerts, USB, Netzwerk — alle 60 s                     |
| **Gesprächskompression**          | Ab 15 Nachrichten: älteste 10 → lokale Zusammenfassung         |
| **Fenster-Kontext**               | Aktives Fenster als Kontext (opt-in, sensible Titel gefiltert) |
| **Nutzerprofile**                 | Mehrere Profile, PIN-geschützt                                 |
| **Knowledge-Graph**               | D3-Visualisierung semantischer Gedächtnis-Verbindungen         |
| **Multi-Agenten-Pipeline**        | Parallele Agenten mit Live-Streaming                           |
| **Comeback-Briefing**             | Was hat sich verändert während du weg warst                    |
| **Meeting-Prep / Tagesabschluss** | Automatisch fällige Aufgaben + Kalender                        |

---

## Zahlen

| Kennzahl         | Wert                                                  |
| ---------------- | ----------------------------------------------------- |
| Tools (aktiv)    | **85**                                                |
| Tests            | **224 grün**                                          |
| LLM-Backends     | Ollama llama3.1:8b (lokal) + OpenAI GPT-4o (optional) |
| Datenbank        | MariaDB, lokal, kein Cloud-Zugriff                    |
| Netzwerk-Ausgang | Nur auf expliziten Nutzer-Befehl                      |
