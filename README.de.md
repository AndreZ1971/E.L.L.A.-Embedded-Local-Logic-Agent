<div align="center">

<img src="https://ella-agent.de/assets/ella-logo.png" alt="E.L.L.A." width="120"/>

# E.L.L.A.

### Embedded Local Logic Agent

**Ein persönlicher KI-Assistent für Windows — vollständig offline, vollständig deiner.**

[![Version](https://img.shields.io/badge/version-1.6.4-7c6af7?style=flat-square)](https://github.com/AndreZ1971/E.L.L.A.-Embedded-Local-Logic-Agent/releases)
[![Plattform](https://img.shields.io/badge/plattform-Windows%2010%2F11-0078D4?style=flat-square&logo=windows)](https://ella-agent.de)
[![Lizenz](https://img.shields.io/badge/lizenz-Proprietär-ff6500?style=flat-square)](LICENSE)
[![Directive](https://img.shields.io/badge/Directive-v1.0.0%20%E2%80%94%20versiegelt-3ecf8e?style=flat-square)](https://github.com/AndreZ1971/The-E.L.L.A.-Directive-)

[**Download**](https://github.com/AndreZ1971/E.L.L.A.-Embedded-Local-Logic-Agent/releases/latest) · [**Website**](https://ella-agent.de) · [**Discord**](https://discord.gg/SFEqcG6ezg) · [**English**](README.md) · [**Directive**](https://github.com/AndreZ1971/The-E.L.L.A.-Directive-)

</div>

---

## Was ist E.L.L.A.?

E.L.L.A. ist ein persönlicher KI-Assistent, der vollständig auf deinem Windows-PC läuft. Keine Cloud. Kein Abo. Keine Daten, die deinen Rechner verlassen.

Sie versteht natürliche Sprache und bedient deinen Computer — doch bevor wir darüber reden, _was_ sie kann, reden wir darüber, _was sie niemals tut_. Denn das ist es, was E.L.L.A. von jedem anderen Assistenten unterscheidet.

> _"Ich wollte nur einen Assistenten, der unter dieser Directive arbeiten kann."_
> — Andre Zabel, Mai 2026

> 🧪 **Aus dem Labor:** E.L.L.A. Phone läuft intern bereits auf Android – E.L.L.A. Home ist in Entwicklung.
> → [Mehr in der Roadmap](ROADMAP.md#aus-dem-labor)

---

## Die Directive — der Rahmen, nicht ein Feature

Vier hardcodierte Verbote, die kein Prompt, keine Regel und keine Einstellung umgehen kann:

| Verbot         | Bedeutung                                                                   |
| -------------- | --------------------------------------------------------------------------- |
| **harm**       | Kein physischer, finanzieller oder digitaler Schaden am Nutzer oder Dritten |
| **conceal**    | Keine Verschleierung oder Täuschung durch versteckte Informationen          |
| **surveil**    | Keine Überwachung oder Profilbildung ohne ausdrückliche, aktive Zustimmung  |
| **exfiltrate** | Keine Datenübertragung an externe Server ohne explizite Anforderung         |

Das sind keine Regeln, die man abschaltet. Es sind architektonische Unmöglichkeiten — **kein Codepfad führt zu ihnen.** Jedes Werkzeug, jede Erinnerung, jede Aktion auf den folgenden Seiten passiert _innerhalb_ dieses Rahmens.

[→ Die vollständige Directive](https://github.com/AndreZ1971/The-E.L.L.A.-Directive-)

---

## 111 Werkzeuge — alle unter der Directive

Vollständige Systemsteuerung per natürlicher Sprache. Jedes dieser Werkzeuge läuft lokal auf deinem Rechner und kann die vier Verbote oben nicht verletzen — das ist der Unterschied zwischen _Fähigkeiten sammeln_ und _Fähigkeiten verantworten_.

- **Dateien & Ordner** — suchen, öffnen, kopieren, umbenennen, Duplikate finden
- **Dokumente** — Word-Dateien erstellen, diktieren, zusammenfassen, übersetzen, korrigieren, semantische Suche (RAG)
- **Kommunikation** — Outlook + Gmail lesen, Kalender verwalten (Outlook + Google)
- **System** — Prozesse, Dienste, Festplattennutzung, Temperaturen, Ereignisprotokoll, GPU, RAM-Details
- **Gedächtnis** — persistentes Vektorspeicher-Gedächtnis mit ML-Embeddings, Knowledge-Graph-Triples
- **Bildschirm & Vision** — Screenshot-Analyse, lokales OCR, Bildschirmbeobachtung
- **Maus & Tastatur** — klicken, ziehen, Tastatureingaben senden (mit Bestätigung)
- **Medien** — Musikbibliothek, Mediensteuerung, aktuell spielenden Titel erkennen
- **Netzwerk** — ARP-Scan, TCP-Verbindungen, WLAN-Info, Port-Monitoring
- **Peripherie** — Webcam-Steuerung, Drucker-Steuerung, Multi-Monitor-Support
- **Produktivität** — Aufgaben, Erinnerungen, Zwischenablage-Historie, Setups

[→ Vollständige Fähigkeitenliste](docs/de/capabilities.md)

---

## Was E.L.L.A. einzigartig macht

Die Werkzeuge oben kann man nachbauen. Was man nicht nachbauen kann, ist das hier:

**Lokale KI — und du wählst das Modell.**
Das LLM läuft auf deinem Rechner über [Ollama](https://ollama.com). Welches Modell — ist deine Entscheidung. Du kannst jederzeit wechseln, mischen oder sogar dein eigenes Modell einsetzen. E.L.L.A. legt dich auf nichts fest. OpenAI ist ein optionaler Fallback — Opt-in, standardmäßig aus, offen kommuniziert.

**Sie lernt und verändert sich.**
Jedes „Daumen hoch" wird zu einem goldenen Beispiel, das in künftige Gespräche einfließt. Über die Modellwahl lässt sich E.L.L.A. spezialisieren — etwa aufs Programmieren. Ein Wrapper sammelt Fähigkeiten und bleibt, was er war. E.L.L.A. verändert sich mit jeder Nutzung — lokal, auf deinem Rechner. Das ist der Unterschied zwischen einem Werkzeug und einem Gegenüber, das mit dir wächst.

---

## Ein Morgen mit E.L.L.A.

> Du setzt dich an den Rechner. E.L.L.A. hat still mitgedacht:
> _„Guten Morgen. Dein erster Termin ist um 10 Uhr — ich hab die Mail dazu schon geöffnet. Die Festplatte C: ist bei 91 %, soll ich dir die größten Brocken zeigen? Und gestern Abend kam ein neues USB-Gerät dazu, nur zur Info."_
>
> Kein Dashboard, das du öffnen musstest. Keine Cloud, die mitgelesen hat. Sie war einfach da — und hat dir nichts verschwiegen.

---

## Was E.L.L.A. sonst noch kann

**🧠 Gedächtnis & Knowledge-Graph** — persistentes Vektorspeicher-Gedächtnis mit ML-Embeddings. Subjekt/Prädikat/Objekt-Triples bilden eine visuelle Karte dessen, was E.L.L.A. weiß und wie es zusammenhängt — inklusive indexierter Dokumente.

**🧩 Multi-Agenten-Pipeline** — parallele und sequenzielle Agenten mit Live-SSE-Streaming. Eingebaut: Morgenbriefing (Kalender + Aufgaben + Wetter) und System-Report (Performance + Netzwerk + Prozesse).

**🎙️ Stimme — offen gesagt, was lokal läuft und was nicht**
Das Wakeword „ella" läuft offline. Die Sprachausgabe für **Englisch, Französisch und Spanisch erfolgt vollständig lokal** über Kokoro (neuronale Synthese, kein Python nötig). Die **deutsche Stimme Katja läuft derzeit über Microsoft Edge TTS — also online.**
Warum sagen wir das so deutlich? Weil die Directive „conceal" verbietet. **Wir arbeiten an einer vollständig lokalen Katja** — bis dahin nennen wir den einen Weg, der (noch) nach außen führt, beim Namen.

**🎲 Schach** — ein echtes Fenster mit vier Brett-Themes, eigener Schach-KI, Zug-Kommentar via TTS und persistentem Spielstand. Kein Demo — ein Beweis, dass E.L.L.A. eigenständige Fenster, eine Sub-KI und Zustand gleichzeitig verwaltet.

**🖐️ Gestensteuerung · 🖥️ HUD-Modus · 🎤 Diktat-Modus** — Handerkennung via MediaPipe (Stufe 1), drei Erscheinungsbilder (Calm / HUD / Show) und systemweites Diktat per Whisper direkt ins aktive Windows-Fenster.

**🔇 Stop-Interrupt & Follow-Up** — „Stopp" oder „Sei still" während der Sprachausgabe unterbricht sofort; ein 8-Sekunden-Fenster erlaubt danach Rückfragen ohne Wakeword.

**🔒 Offline-Modus & Datenschwärzung** — der Offline-Modus sperrt alle Netzwerk-Tools und Cloud-Zugriffe. Sensible Daten (API-Keys, IBANs, Passwörter) werden automatisch geschwärzt, bevor sie in Erinnerungen oder Zwischenablage-Historie gespeichert werden.

**👁️ Proaktive Intelligenz** — E.L.L.A. meldet sich von sich aus, wenn etwas wichtig ist: RAM-, Festplatten- und Temperatur-Alerts, neue USB-Geräte, verdächtige Netzwerkverbindungen, Comeback-Briefing nach Abwesenheit, Meeting-Prep und Tagesabschluss. 14 Approval-Kategorien, Auto-Mute nach 5× Wegwischen, Mute-Button an jeder Meldung.

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

**[→ Neueste Version](https://github.com/AndreZ1971/E.L.L.A.-Embedded-Local-Logic-Agent/releases/latest)**

Der Installer enthält alles: Node.js, MariaDB und Ollama als portable Binaries. Keine separate Installation erforderlich. Für die Aktivierung wird ein Lizenzschlüssel benötigt.

| Datei                     | Beschreibung                |
| ------------------------- | --------------------------- |
| `E.L.L.A.Setup.1.6.4.exe`  | Windows-Installer (NSIS)    |
| `SHA256SUMS.txt`          | Prüfsummen zur Verifikation |

---

## Dokumentation

Für Einsteiger die Bedienungsanleitung und die FAQ — für alles Technische (Directive-Durchsetzung, Fähigkeiten im Detail, Netzwerk) die entsprechenden Seiten:

| Dokument            | DE                                  | EN                                  |
| ------------------- | ----------------------------------- | ----------------------------------- |
| Bedienungsanleitung | [→](docs/de/bedienungsanleitung.md) | [→](docs/en/bedienungsanleitung.md) |
| Fähigkeiten         | [→](docs/de/capabilities.md)        | [→](docs/en/capabilities.md)        |
| Die Directive       | [→](docs/de/directive.md)           | [→](docs/en/directive.md)           |
| FAQ                 | [→](docs/de/faq.md)                 | [→](docs/en/faq.md)                 |
| Hardware-Guide      | [→](docs/de/hardware.md)            | [→](docs/en/hardware.md)            |
| Netzwerk            | [→](docs/de/netzwerk.md)            | [→](docs/en/network.md)             |
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

## Community

- **[Discord](https://discord.gg/SFEqcG6ezg)** – direkt mit dem Entwickler und anderen Nutzern reden, offene Sprechstunde jeden Montag um 19 Uhr
- **[Roadmap](ROADMAP.md)** – was gerade entsteht, was geplant ist und was bewusst nicht kommt
- **[Diskussionen](https://github.com/AndreZ1971/E.L.L.A.-Embedded-Local-Logic-Agent/discussions)** – Fragen, Ideen, zeig deine E.L.L.A.
- **[Fehler melden](https://github.com/AndreZ1971/E.L.L.A.-Embedded-Local-Logic-Agent/issues/new/choose)** – bitte niemals deinen Lizenzschlüssel posten

⭐ _Gefällt dir E.L.L.A.? Ein Stern (oben rechts) hilft, dass andere sie finden._

---

## Lizenz

E.L.L.A. ist proprietäre Software. Für die Nutzung ist ein Lizenzschlüssel erforderlich.  
Quellcode wird nicht verteilt. Dieses Repository enthält ausschließlich Dokumentation.

© 2026 Andre Zabel. Alle Rechte vorbehalten.

[→ EULA](docs/de/eula.md) · [→ SECURITY.md](SECURITY.md)
