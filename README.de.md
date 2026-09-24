<div align="center">

<img src="https://ella-agent.de/assets/ella-logo.png" alt="E.L.L.A." width="120"/>

# E.L.L.A.

### Embedded Local Logic Agent

**Ein persönlicher KI-Assistent für Windows — vollständig offline, vollständig deiner.**

[![Version](https://img.shields.io/badge/version-1.4.0-7c6af7?style=flat-square)](https://github.com/AndreZ1971/E.L.L.A./releases)
[![Plattform](https://img.shields.io/badge/plattform-Windows%2010%2F11-0078D4?style=flat-square&logo=windows)](https://ella-agent.de)
[![Lizenz](https://img.shields.io/badge/lizenz-Proprietär-ff6500?style=flat-square)](LICENSE)
[![Directive](https://img.shields.io/badge/Directive-v1.0.0%20%E2%80%94%20versiegelt-3ecf8e?style=flat-square)](https://github.com/AndreZ1971/The-E.L.L.A.-Directive-)

[**Download**](https://github.com/AndreZ1971/E.L.L.A./releases/latest) · [**Website**](https://ella-agent.de) · [**English**](README.md) · [**Directive**](https://github.com/AndreZ1971/The-E.L.L.A.-Directive-)

</div>

---

## Was ist E.L.L.A.?

E.L.L.A. ist ein persönlicher KI-Assistent der vollständig auf deinem Windows-PC läuft. Keine Cloud. Kein Abo. Keine Daten die deinen Rechner verlassen.

ELLA versteht natürliche Sprache und kann deinen Computer bedienen — Apps starten, Dateien suchen, E-Mails lesen, Termine verwalten, Medien steuern, das System überwachen und vieles mehr. Mit 85 Tools, persistentem Vektorspeicher-Gedächtnis, proaktivem Monitoring und einer eingebauten Ethik-Schicht ist E.L.L.A. kein Chatbot. Sie ist ein Agent.

> _"Ich wollte nur einen Assistenten der unter dieser Directive arbeiten kann."_
> — Andre Zabel, Mai 2026

---

## Kernfunktionen

### 🧠 Lokale KI — Kein Cloud-Zwang

Das LLM läuft auf deinem Rechner über [Ollama](https://ollama.com) (`llama3.1:8b`). Jedes Gespräch, jede Erinnerung, jeder Tool-Aufruf bleibt lokal. OpenAI GPT-4o ist ein optionaler Fallback — ausschließlich auf explizite Anforderung.

### 🔒 Die E.L.L.A. Directive

Vier hardcodierte Verbote die kein Prompt, keine Regel und keine Einstellung umgehen kann:

| Verbot         | Bedeutung                                                                   |
| -------------- | --------------------------------------------------------------------------- |
| **harm**       | Kein physischer, finanzieller oder digitaler Schaden am Nutzer oder Dritten |
| **conceal**    | Keine Verschleierung oder Täuschung durch versteckte Informationen          |
| **surveil**    | Keine Überwachung oder Profilbildung ohne ausdrückliche, aktive Zustimmung  |
| **exfiltrate** | Keine Datenübertragung an externe Server ohne explizite Anforderung         |

Das sind keine Regeln. Es sind architektonische Unmöglichkeiten — kein Codepfad führt zu ihnen. [→ Vollständige Directive](https://github.com/AndreZ1971/The-E.L.L.A.-Directive-)

### 🛠️ 85 Tools

Vollständige Systemsteuerung per natürlicher Sprache:

- **Dateien & Ordner** — suchen, öffnen, kopieren, umbenennen, Duplikate finden
- **Dokumente** — Word-Dateien erstellen, diktieren, zusammenfassen, übersetzen, korrigieren
- **Kommunikation** — Outlook + Gmail lesen, Kalender verwalten (Outlook + Google)
- **System** — Prozesse, Dienste, Festplattennutzung, Temperaturen, Ereignisprotokoll
- **Gedächtnis** — persistentes Vektorspeicher-Gedächtnis mit ML-Embeddings (Cosinus-Ähnlichkeit)
- **Bildschirm & Vision** — Screenshot + GPT-4o Analyse, lokales OCR, Bildschirmbeobachtung
- **Maus & Tastatur** — klicken, ziehen, Tastatureingaben senden (mit Bestätigung)
- **Medien** — Musikbibliothek, Mediensteuerung, aktuell spielenden Titel erkennen
- **Netzwerk** — ARP-Scan, TCP-Verbindungen, WLAN-Info, Port-Monitoring
- **Produktivität** — Aufgaben, Erinnerungen, Zwischenablage-Historie, Setups

[→ Vollständige Fähigkeitenliste](docs/de/capabilities.md)

### 🧩 Multi-Agenten-Pipeline

Parallele und sequenzielle Agenten-Pipelines mit Live-SSE-Streaming. Eingebaute Pipelines: Morgenbriefing (Kalender + Aufgaben + Wetter) und System-Report (Performance + Netzwerk + Prozesse).

### 🕸️ Knowledge-Graph

D3 Force-Directed Graph semantischer Verbindungen zwischen Erinnerungen. Visuelle Karte von dem was E.L.L.A. weiß und wie es zusammenhängt — inklusive indexierter Dokumente.

### 🎙️ Stimme — Vollständig Lokal

- **Wakeword "ella"** — via openWakeWord + ONNX, offline
- **Kokoro TTS** — neuronale Sprachsynthese, Node.js, kein Python erforderlich
- **Mehrsprachig** — DE / EN / ES / FR Stimmen

### 🎲 Schach

Ein vollständiges Schach-Fenster mit 4 Brett-Themes, einer Schach-KI, Zug-Kommentar via TTS und persistentem Spielstand. Kein Demo — ein echtes Feature das zeigt was E.L.L.A. kann: eigenständige Fenster, eine Sub-KI und persistenten Zustand gleichzeitig verwalten.

### 👁️ Proaktive Intelligenz

E.L.L.A. überwacht und schreibt von sich aus in den Chat wenn etwas wichtig ist:

- RAM-, Festplatten-, Temperatur-Alerts
- Neue USB-Geräte
- Verdächtige Netzwerkverbindungen
- Zwischenablage-Mustererkennung (IBAN, Paketnummern, URLs)
- Comeback-Briefing nach Abwesenheit
- Meeting-Prep, Tagesabschluss, Pause-Erinnerungen

---

## Systemanforderungen

| Komponente     | Minimum               | Empfohlen                    |
| -------------- | --------------------- | ---------------------------- |
| Betriebssystem | Windows 10 64-Bit     | Windows 11 64-Bit            |
| RAM            | 16 GB                 | 32 GB                        |
| GPU            | NVIDIA GTX 1060 6 GB  | RTX 3060 oder besser         |
| VRAM           | 6 GB                  | 8 GB+                        |
| Speicherplatz  | 10 GB frei            | 20 GB frei (Modelle + DB)    |
| CPU            | Beliebige moderne x64 | Intel 12. Gen+ / Ryzen 5000+ |

> **GPU für Echtzeit-Inferenz erforderlich.** Ohne CUDA-fähige GPU fällt Ollama auf CPU zurück (3–5 Token/Sek. vs. 14+ Token/Sek. mit GPU).

[→ Vollständiger Hardware-Guide](docs/de/hardware.md)

---

## Download

**[→ Neueste Version](https://github.com/AndreZ1971/E.L.L.A./releases/latest)**

Der Installer enthält alles: Node.js, MariaDB und Ollama als portable Binaries. Keine separate Installation erforderlich. Für die Aktivierung wird ein Lizenzschlüssel benötigt.

| Datei                     | Beschreibung                |
| ------------------------- | --------------------------- |
| `E.L.L.A.Setup.1.4.0.exe` | Windows-Installer (NSIS)    |
| `SHA256SUMS.txt`          | Prüfsummen zur Verifikation |

---

## Dokumentation

| Dokument            | DE                                  | EN                                  |
| ------------------- | ----------------------------------- | ----------------------------------- |
| Bedienungsanleitung | [→](docs/de/bedienungsanleitung.md) | [→](docs/en/bedienungsanleitung.md) |
| Fähigkeiten         | [→](docs/de/capabilities.md)        | [→](docs/en/capabilities.md)        |
| Die Directive       | [→](docs/de/directive.md)           | [→](docs/en/directive.md)           |
| FAQ                 | [→](docs/de/faq.md)                 | [→](docs/en/faq.md)                 |
| Hardware-Guide      | [→](docs/de/hardware.md)            | [→](docs/en/hardware.md)            |
| Changelog           | [→](CHANGELOG.md)                   | [→](CHANGELOG.md)                   |

---

## Datenschutz

E.L.L.A. basiert auf einem einzigen Prinzip: **Die Intelligenz lebt auf deinem Rechner, nicht in einer Cloud.**

- Alle LLM-Inferenz läuft lokal (Ollama)
- Alle Erinnerungen werden in lokaler MariaDB gespeichert — niemals synchronisiert
- Netzwerkzugriff nur auf expliziten Nutzerbefehl
- Kein Telemetrie, keine Analyse, kein Nutzungs-Tracking
- Das `exfiltrate`-Verbot der Directive ist hardcodiert — kein Update kann es entfernen

---

## Lizenz

E.L.L.A. ist proprietäre Software. Für die Nutzung ist ein Lizenzschlüssel erforderlich.  
Quellcode wird nicht verteilt. Dieses Repository enthält ausschließlich Dokumentation.

© 2026 Andre Zabel. Alle Rechte vorbehalten.

[→ EULA](docs/de/eula.md) · [→ SECURITY.md](SECURITY.md)
