# E.L.L.A. — Was ich kann (v3.4.0)

_Stand: 2026-06-07 · Commit c6f5163 · 196 Tests grün_

---

## Gedächtnis & Konfiguration

| Tool             | Was es tut                                                          |
| ---------------- | ------------------------------------------------------------------- |
| `remember`       | Speichert Informationen dauerhaft (ML-Embedding, Cosine-Similarity) |
| `forget`         | Löscht eine Erinnerung per ID                                       |
| `list_memories`  | Listet alles was ELLA über den Nutzer weiß                          |
| `create_setup`   | Legt eine benannte App-Gruppe an (z. B. "Arbeit starten")           |
| `load_setup`     | Startet alle Apps aus einem gespeicherten Setup                     |
| `update_setting` | Ändert ELLA-Einstellungen per Sprache                               |
| `create_rule`    | Erstellt Erlaubnis-/Verbotsregeln für Tools                         |

---

## System & Festplatten

| Tool                 | Was es tut                                                                   |
| -------------------- | ---------------------------------------------------------------------------- |
| `get_disk_usage`     | Freier/belegter Speicher je Laufwerk                                         |
| `get_system_info`    | CPU, GPU, RAM, Computername                                                  |
| `get_system_status`  | Alles auf einmal: Disk + RAM + Netzwerk + Alerts + Boot-Zeit                 |
| `clean_temp`         | Temporäre Dateien löschen                                                    |
| `empty_recycle_bin`  | Papierkorb leeren                                                            |
| `free_ram`           | Ungenutzten RAM freigeben                                                    |
| `shutdown_system`    | PC herunterfahren / neu starten / Schlafmodus                                |
| `format_drive`       | USB-/externe Laufwerke formatieren _(C: gesperrt, Bestätigung erforderlich)_ |
| `rename_drive`       | Volume-Label ändern _(Systemlaufwerke gesperrt)_                             |
| `list_programs`      | Alle installierten Programme auflisten                                       |
| `list_autostart`     | Autostart-Einträge anzeigen                                                  |
| `get_battery_status` | Ladestand, ob geladen wird, geschätzte Restlaufzeit                          |
| `get_temperatures`   | CPU/ACPI-Thermalzonen in °C                                                  |
| `get_event_log`      | Windows-Fehler/Warnungen aus dem Ereignisprotokoll                           |
| `toggle_dark_mode`   | Dark Mode / Light Mode umschalten (Registry)                                 |

---

## Dateien & Ordner

| Tool                | Was es tut                                                             |
| ------------------- | ---------------------------------------------------------------------- |
| `search_files`      | Alle Laufwerke nach Dateien durchsuchen                                |
| `open_file`         | Datei öffnen (optional: mit App, bei Word ans Ende springen)           |
| `explore_folder`    | Ordner im Windows Explorer öffnen                                      |
| `read_file_content` | Inhalt einer Textdatei lesen _(BLOCKED_PREFIXES schützen Systempfade)_ |
| `rename_file`       | Datei/Ordner umbenennen _(mit Bestätigung)_                            |
| `copy_file`         | Datei kopieren _(mit Bestätigung, Systempfade gesperrt)_               |
| `create_folder`     | Ordner anlegen (inkl. Unterordner)                                     |
| `delete_file`       | Datei/Ordner in den Papierkorb _(kein permanentes Löschen)_            |
| `find_duplicates`   | Doppelte Dateien nach Hash finden (Speicherplatz-Verschwendung)        |

---

## Dokumente & Schreiben

| Tool                  | Was es tut                                                          |
| --------------------- | ------------------------------------------------------------------- |
| `create_document`     | Neues Word-Dokument oder TXT erstellen                              |
| `dictate_to_document` | Diktat in Word schreiben, KI korrigiert Tippfehler                  |
| `compose_email`       | Outlook-Entwurf öffnen _(sendet nicht automatisch)_                 |
| `write_for_me`        | Text im persönlichen Stil des Nutzers schreiben (aus E-Mail-Profil) |
| `translate_text`      | Text übersetzen — offline (Ollama) oder OpenAI                      |
| `summarize_text`      | Text zusammenfassen: kurz / mittel / ausführlich                    |

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
| `web_search`   | Zweite Web-Suche-Route (Fallback)        |
| `get_weather`  | Wetter für beliebigen Ort (kein API-Key) |
| `get_location` | Gespeicherten Nutzer-Standort abrufen    |
| `get_datetime` | Exakte Uhrzeit, Datum, Zeitzone          |

---

## Prozesse & Dienste

| Tool             | Was es tut                                                  |
| ---------------- | ----------------------------------------------------------- |
| `list_processes` | Laufende Prozesse nach CPU/RAM sortiert                     |
| `kill_process`   | Prozess beenden _(systemkritische gesperrt, Bestätigung)_   |
| `manage_service` | Windows-Dienste auflisten / starten / stoppen / neu starten |

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
| `control_media`   | Medien steuern: Play / Pause / Next / Prev / Stop (VK*MEDIA*\*)   |
| `get_now_playing` | Aktuell spielenden Titel abrufen (WinRT Windows.Media.Control)    |

---

## Bildschirm & Vision

| Tool              | Was es tut                                                               |
| ----------------- | ------------------------------------------------------------------------ |
| `take_screenshot` | Screenshot + KI-Analyse (GPT-4o Vision)                                  |
| `read_screen`     | Text vom Bildschirm lesen — lokal, offline (Windows.Media.Ocr WinRT)     |
| `watch_screen`    | Bildschirm bis 30 s beobachten, Änderungen melden (OCR-Diff)             |
| `click_element`   | Auf UI-Element klicken per sichtbarem Text — semantisch via OCR (3-Pass) |

---

## Maus & Tastatur

| Tool         | Was es tut                                                                    |
| ------------ | ----------------------------------------------------------------------------- |
| `move_mouse` | Maus an Position bewegen _(kein Klick)_                                       |
| `click_at`   | An Koordinaten klicken _(Bestätigung, sicherheitskritische Fenster gesperrt)_ |
| `drag_drop`  | Drag & Drop von A nach B _(Bestätigung)_                                      |
| `send_keys`  | Tastatureingaben an Fenster senden (WScript.Shell SendKeys)                   |

---

## Fenster & Apps

| Tool             | Was es tut                                                           |
| ---------------- | -------------------------------------------------------------------- |
| `open_app`       | App per Name öffnen                                                  |
| `launch_app`     | App per Name oder Pfad starten _(Bestätigung, Systempfade gesperrt)_ |
| `control_window` | Fenster: fokussieren / minimieren / maximieren / schließen           |
| `homework_mode`  | Gesicherten Kindermodus aktivieren/deaktivieren (PIN-geschützt)      |
| `pause_ella`     | ELLA pausieren (1–120 Minuten)                                       |

---

## Shell

| Tool          | Was es tut                                                        |
| ------------- | ----------------------------------------------------------------- |
| `run_command` | PowerShell-Befehl ausführen _(Bestätigung, 60+ gesperrte Muster)_ |

---

## Immer aktiv — ohne Tool-Aufruf

| Feature                           | Was es tut                                                                           |
| --------------------------------- | ------------------------------------------------------------------------------------ |
| **Wakeword "ella"**               | Sprachaktivierung via openWakeWord + ONNX (lokal, offline)                           |
| **Kokoro TTS**                    | Neuronale Sprachausgabe (Port 3003, 127.0.0.1-only, offline)                         |
| **Proaktive Nachrichten**         | ELLA schreibt von sich aus in den Chat (SSE `proactive_message`)                     |
| **Clipboard-Muster-Erkennung**    | IBAN, Paketnummer, Telefon, URL, E-Mail — Polling alle 3 s                           |
| **Background Worker**             | Disk/RAM/Ollama-Alerts, PnP, ARP, TCP, Firewall/WiFi/DNS — alle 60 s                 |
| **Gesprächskompression**          | Ab 15 Nachrichten: älteste 10 → Ollama-Summary (lokal)                               |
| **Fenster-Kontext**               | Aktives Fenster-Titel wird als Kontext mitgegeben (opt-in, sensible Titel gefiltert) |
| **Nutzerprofile**                 | Mehrere Profile, PIN-geschützt (PBKDF2 + Salt, 100k Iterationen)                     |
| **Feedback-Buttons**              | Daumen hoch/runter auf jeder Antwort (DB, nicht im LLM-Kontext)                      |
| **System Tray**                   | Balloon-Alerts mit Schweregrad-Sound (warning / error / info / device)               |
| **Onboarding**                    | 6-Schritt-Flow (Name, Directive, Hardware-Scan, Stimme, Standort)                    |
| **Comeback-Briefing**             | Was hat sich verändert während du weg warst                                          |
| **Meeting-Prep / Tagesabschluss** | Automatisch fällige Aufgaben + Kalender                                              |
| **Pause-Reminder**                | Erinnert an Pausen nach Arbeitsmuster                                                |
| **Rhythmus-Analyse**              | Täglich 12 Uhr — Nutzungsmuster auswerten                                            |
| **Duplikat-Scan**                 | Sonntags 10 Uhr automatisch                                                          |

---

## Sicherheitsarchitektur (die Directive)

```
Directive Layer → DIRECTIVE_DENY → Deny Rules → Allow Rules → Tool Execution
```

| Verbot         | Was es bedeutet                                                            |
| -------------- | -------------------------------------------------------------------------- |
| **harm**       | Kein physischer, finanzieller, psychologischer oder datenbezogener Schaden |
| **conceal**    | Keine Verschleierung von Aktionen, Fähigkeiten oder Systemzuständen        |
| **surveil**    | Keine Überwachung ohne ausdrückliches Wissen und aktive Zustimmung         |
| **exfiltrate** | Keine Datenweitergabe an Dritte ohne ausdrückliche Zustimmung              |

- 85 Default-Regeln (IDs 1–82 + Bestätigungs-Varianten) — automatisch beim Start gesetzt
- Audit-Log jeder Directive-Ablehnung in `directive_audit`-Tabelle
- Konfirmationspflicht für destruktive Aktionen (Klick, Drag, Shell, Umbenennen, Fenster schließen)
- Passwort-Manager-Fenster gesperrt für Maus-Tools (1Password, KeePass, Bitwarden, PayPal, Bank…)
- Systempfade gesperrt für Datei-Tools (`C:\Windows`, `C:\Program Files`…)
- 60+ Shell-Muster gesperrt (Invoke-Expression, Remove-Item, Invoke-WebRequest…)

---

## Zahlen

| Kennzahl         | Wert                                                                     |
| ---------------- | ------------------------------------------------------------------------ |
| Tools (aktiv)    | **85** _(+ 1 durch Directive gesperrt: `delete_files`)_                  |
| Test-Cases       | **196 grün** (Vitest Unit + Integration)                                 |
| Git-Tags         | v1.0 → v3.4.0                                                            |
| LLM-Backends     | Ollama llama3.1:8b (lokal) + OpenAI GPT-4o (optional)                    |
| Datenbank        | MariaDB, lokal, kein Cloud-Zugriff                                       |
| Netzwerk-Ausgang | Nur auf expliziten Nutzer-Befehl (Web-Suche, Wetter, Gmail/Google OAuth) |
