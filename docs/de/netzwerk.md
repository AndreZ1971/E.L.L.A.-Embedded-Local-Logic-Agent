# Wann verbindet sich E.L.L.A. mit dem Internet?

Version 1.7.2

**Keine Telemetrie. Kein Tracking. Kein Cloud-Zwang.**
E.L.L.A. sendet keine Nutzungsdaten, keine Fehlerberichte und keine Auswertungen an uns oder Dritte.

Verbindungen gibt es nur für Funktionen, die du nutzt oder einschaltest – und für die Lizenzprüfung beim Start.

---

## Übersicht aller Verbindungen

### Immer beim Start

| Verbindung        | Ziel         | Was wird gesendet                                                                                     | Abschaltbar?                                                                    |
| ----------------- | ------------ | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **Lizenzprüfung** | Lizenzserver | Lizenzschlüssel und ein Fingerabdruck der Hardware (SHA-256 aus Rechnername, Prozessor, Netzadressen) | Nein. Ohne Internet oder im Offline-Modus gilt die zuletzt gespeicherte Prüfung |

### Deutsche Sprachausgabe

| Verbindung   | Ziel             | Was wird gesendet               | Abschaltbar?                                                                        |
| ------------ | ---------------- | ------------------------------- | ----------------------------------------------------------------------------------- |
| **Edge TTS** | Microsoft-Server | der Text, den E.L.L.A. vorliest | Ja: Sprachausgabe ausschalten, oder Offline-Modus – dann spricht die Windows-Stimme |

Englisch, Französisch und Spanisch spricht eine lokale Stimme (Kokoro) ohne Verbindung. Im Offline-Modus spricht E.L.L.A. Deutsch mit der in Windows eingebauten Stimme; es wird dann nichts gesendet.

### Einmalige Downloads

| Was                                                                  | Woher                                  | Größe ca.            | Wann                                                                                                                  |
| -------------------------------------------------------------------- | -------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Sprachmodell (Standard: `llama3.1:8b`)                               | Ollama-Registry (`registry.ollama.ai`) | 5 GB, je nach Modell | nach der Modellwahl beim ersten Start                                                                                 |
| Lokale Stimme Kokoro (EN/FR/ES)                                      | Hugging Face (`huggingface.co`)        | 80 MB                | beim ersten Start                                                                                                     |
| Modell für die lokale Spracherkennung (`onnx-community/whisper-medium-ONNX`) | Hugging Face (`huggingface.co`) | 0,9 GB               | bei der ersten Spracheingabe; ist die Spracheingabe eingeschaltet, schon beim Start. Mit Fortschrittsanzeige |

Das **Gedächtnis-Modell** `nomic-embed-text` liegt seit v1.7.1 im Installer und wird beim ersten Start ohne Verbindung übernommen. Nur wenn es trotzdem fehlt – etwa weil E.L.L.A. ein separat installiertes Ollama mitbenutzt –, lädt sie es einmalig aus der Ollama-Registry (`registry.ollama.ai`, 0,3 GB) nach.

Ohne Internet funktioniert die allererste lokale Spracheingabe nicht, weil das Modell dafür noch fehlt; ein gescheiterter Download wird bei der nächsten Aufnahme erneut versucht. Das Modell landet im Datenordner (`…\ELLA\whisper-cache`).

Das Modell für die Gestensteuerung und die Wakeword-Modelle liegen im Installer; dafür ist keine Verbindung nötig.

### Nur auf deine Anfrage

| Funktion                                    | Ziel                            | Was wird gesendet                                                 | Im Offline-Modus |
| ------------------------------------------- | ------------------------------- | ----------------------------------------------------------------- | ---------------- |
| Websuche                                    | DuckDuckGo                      | der Suchbegriff                                                   | gesperrt         |
| Wetter                                      | Open-Meteo                      | Ort bzw. Koordinaten                                              | gesperrt         |
| Standort                                    | ip-api.com                      | deine Internet-Adresse (IP), unverschlüsselt – nur nach Rückfrage | gesperrt         |
| Webseite abrufen oder beschreiben           | die genannte Adresse            | der Seitenaufruf                                                  | gesperrt         |
| Browser-Steuerung (falls eingeschaltet)     | die Seiten, die du öffnen lässt | was ein Browser beim Surfen sendet                                | gesperrt         |
| Gmail und Google Kalender (falls verbunden) | Google                          | die jeweilige Abfrage                                             | –                |

### Plugins (nur eingeschaltete)

Ein Plugin fragt genau die Adresse ab, der du auf der Zustimmungsseite zugestimmt hast, und sendet nur die dort genannten Werte. E.L.L.A. kann ein Plugin anlegen, aber nie selbst einschalten. Im Offline-Modus funktionieren nur Plugins für Geräte im Heimnetz, im Hausaufgaben-Modus keine.

### Updates (nur auf Knopfdruck)

| Wann                                 | Ziel   | Was wird gesendet                                                             |
| ------------------------------------ | ------ | ----------------------------------------------------------------------------- |
| „Jetzt prüfen“ unter „Über E.L.L.A.“ | GitHub | eine Abfrage der neuesten Version – keine Daten über dich oder deinen Rechner |
| „Herunterladen“                      | GitHub | der Abruf der Update-Dateien                                                  |

E.L.L.A. prüft nie von selbst. Im Offline-Modus wird weder geprüft noch geladen. Die Fassung aus dem Microsoft Store wird über den Store aktualisiert.

### OpenAI (nur mit eigenem Key)

| Wann                                                                         | Was wird gesendet                                                                                                                          |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Chat (Einstellung „OpenAI“ oder Ausweichlösung bei „Auto“)                   | deine Nachricht samt Verlauf und dem, was E.L.L.A. dafür heranzieht: passende Erinnerungen, gelesene Dokumente, im Browser gelesene Seiten |
| Bildanalyse                                                                  | das Bild oder Bildschirmfoto                                                                                                               |
| Spracherkennung (nur bei Einstellung „OpenAI“ oder wenn die lokale ausfällt) | die Tonaufnahme                                                                                                                            |
| Websuche als Ausweichlösung                                                  | der Suchbegriff                                                                                                                            |
| Seite „Multi-Agenten“                                                        | die Anfragen der Agenten (läuft nur über OpenAI)                                                                                           |
| Modell-Liste laden, Modell prüfen                                            | eine Abfrage mit deinem Key                                                                                                                |

Jede Anfrage an OpenAI wird gezählt und im Dashboard sowie im Feld „Cloud-Anfragen“ angezeigt. Die Einstellung unter **Einstellungen → LLM** bestimmt, wann OpenAI genutzt wird:

- **Auto** (Vorgabe): zuerst lokal, OpenAI nur als Ausweichlösung – und nur, wenn ein Key hinterlegt ist
- **OpenAI**: Antworten kommen von OpenAI
- **Ollama (lokal)**: nur lokal, OpenAI wird nie benutzt

Ohne hinterlegten Key gibt es keine Verbindung zu OpenAI.

---

## Was der Offline-Modus sperrt

Der Schalter unter **Einstellungen → Tools → Offline-Modus** sperrt:

- Websuche, Wetter, Standort und das Abrufen von Webseiten
- alle Anfragen an OpenAI
- die Browser-Steuerung
- Plugins für Dienste im Internet
- die Update-Prüfung und den Update-Download
- die deutsche Microsoft-Stimme – stattdessen spricht die Windows-Stimme
- die Lizenzprüfung beim Server – es gilt die gespeicherte Prüfung

Weiter verfügbar bleiben die Funktionen im eigenen Netz (Geräte im Netzwerk, Verbindungen) und Plugins für Geräte im Heimnetz.

---

## Zusammenfassung

E.L.L.A. arbeitet im Kern lokal. Verbindungen nach außen gibt es nur für:

1. die Lizenzprüfung beim Start
2. die deutsche Sprachausgabe (Microsoft), außer im Offline-Modus
3. Online-Funktionen, die du nutzt (Websuche, Wetter, Standort, Webseiten, Browser, E-Mail)
4. Plugins, denen du zugestimmt hast
5. OpenAI mit deinem eigenen Key
6. Updates auf Knopfdruck
7. einmalige Downloads der Modelle
