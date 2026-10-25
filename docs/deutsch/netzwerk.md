# Wann verbindet sich E.L.L.A. mit dem Internet?

**Keine Telemetrie. Kein Tracking. Kein Cloud-Zwang.**
ELLA sendet keine Nutzungsdaten, keine Fehlerberichte und keine Analysen an uns oder Dritte.

Netzwerkverbindungen bestehen nur für Funktionen, die du aktiv nutzt — und für die Lizenzprüfung beim Start.

---

## Übersicht aller Verbindungen

### Immer beim Start

| Verbindung        | Ziel                           | Was wird gesendet                                                                          | Abschaltbar?                                                                                              |
| ----------------- | ------------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| **Lizenzprüfung** | `ella-agent.de` (Lizenzserver) | Lizenzschlüssel + gehashter Hardware-Fingerprint (SHA-256 aus Hostname, CPU, MAC-Adressen) | Nein, aber offline-tolerant: bei fehlendem Internet wird der letzte gültige Stand aus dem Cache verwendet |

### Deutsche Sprachausgabe

| Verbindung   | Ziel             | Was wird gesendet                                     | Abschaltbar?                                                                                                                                                            |
| ------------ | ---------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Edge TTS** | Microsoft-Server | Der **vorgelesene Text** wird an Microsoft übertragen | Sprachausgabe (TTS) kann in den Einstellungen deaktiviert werden. Eine lokale deutsche Stimme ist in Arbeit — derzeit gibt es keine Alternative ohne Internetverbindung |

> **Wichtig:** Für Englisch, Französisch und Spanisch nutzt ELLA die lokale Kokoro-Stimme (kein Internet nötig). Nur für Deutsch wird Edge TTS (Microsoft) verwendet, weil die Kokoro-Qualität für Deutsch noch nicht ausreichend ist.

### Einmalige Downloads (beim ersten Nutzen)

| Was                                     | Woher                         | Größe ca.           | Wann                                                   |
| --------------------------------------- | ----------------------------- | ------------------- | ------------------------------------------------------ |
| Kokoro-Stimmmodell (EN/FR/ES)           | HuggingFace Hub               | ~80 MB              | Erster Start                                           |
| Whisper-Sprachmodell (lokale Erkennung) | HuggingFace Hub               | ~150 MB             | Erste Spracheingabe ohne OpenAI                        |
| Ollama-LLM-Modell                       | Ollama-Registry               | 4–8 GB je nach Tier | Bei Modellwahl im Onboarding oder in den Einstellungen |
| MediaPipe-Handmodell (Gesten)           | jsdelivr CDN + Google Storage | ~5 MB               | Beim ersten Aktivieren der Gestensteuerung             |

Der Offline-Installer (`vendor/`) enthält Kokoro und Ollama vorgebündelt — in diesem Fall entfallen die Downloads.

### Nur auf Anfrage (du löst die Verbindung aus)

| Funktion                                           | Ziel            | Abschaltbar?                      |
| -------------------------------------------------- | --------------- | --------------------------------- |
| Web-Suche (`search_web`)                           | DuckDuckGo      | Offline-Modus sperrt dieses Tool  |
| Wetter (`get_weather`)                             | Wetter-API      | Offline-Modus sperrt dieses Tool  |
| Standort (`get_location`)                          | Geolocation-API | Offline-Modus sperrt dieses Tool  |
| Webseite abrufen (`fetch_url`, `describe_webpage`) | Beliebige URL   | Offline-Modus sperrt diese Tools  |
| Gmail und Google Calendar                          | Google APIs     | Nur wenn du Google verbunden hast |

### OpenAI-API (nur mit eigenem Key)

| Wann                                                          | Was wird gesendet                             |
| ------------------------------------------------------------- | --------------------------------------------- |
| Chat (Provider „openai" oder Fallback im „auto"-Modus)        | Deine Nachricht + Kontext an `api.openai.com` |
| Whisper (Spracherkennung, wenn `cloudFirst`)                  | Audio-Aufnahme                                |
| Vision (`describe_image`, `describe_screen`, `capture_photo`) | Screenshot/Bild                               |
| Multi-Agenten-Pipeline                                        | Pipeline-Anfragen (nur über OpenAI möglich)   |

Jede OpenAI-Anfrage wird im **Cloud-Zähler** (Dashboard-Kachel) protokolliert. Der Provider-Modus steuert, wann OpenAI genutzt wird:

- **„auto"** (Standard): Ollama zuerst, OpenAI nur als Fallback bei Fehler
- **„openai"**: OpenAI bevorzugt
- **„ollama"**: Nur lokal, kein OpenAI auch als Fallback

---

## Was der Offline-Modus sperrt

Das Setting „Offline-Modus" in den Einstellungen deaktiviert:

- ✗ Alle Web-Tools (Suche, Wetter, Standort, Webseiten)
- ✗ Alle OpenAI-Anfragen (`cloudAllowed()` gibt `false`)
- ✗ Lizenzprüfung nutzt Cache statt Server

**Nicht gesperrt im Offline-Modus:**

- ✓ Edge TTS für deutsche Sprachausgabe (funktioniert nur mit Internet)
- ✓ Lokale Netzwerk-Tools (`scan_network`, `list_connections`, `list_devices`)

---

## Zusammenfassung

ELLA arbeitet im Kern lokal. Netzwerkzugriff erfolgt nur für:

1. Lizenzprüfung beim Start (offline-tolerant)
2. Deutsche Sprachausgabe (Edge TTS — Microsoft-Server)
3. Online-Funktionen die du aktiv nutzt (Websuche, Wetter, E-Mail)
4. OpenAI-API mit deinem eigenen Schlüssel (wenn konfiguriert)
5. Einmalige Modell-Downloads beim ersten Nutzen
