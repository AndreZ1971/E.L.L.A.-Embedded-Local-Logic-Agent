# E.L.L.A. -- Embedded Local Logic Agent

> _ELLA passt sich dem Nutzer an und wächst mit ihren Herausforderungen._

**Version 1.5.7** | Windows 10/11 (x64) | [ella-agent.de](https://ella-agent.de) | [English version](README-en.md)

---

## Was ist E.L.L.A.?

E.L.L.A. ist ein persönlicher KI-Assistent, der als Desktop-App direkt auf deinem Windows-Rechner läuft. Die KI rechnet auf deiner Hardware -- kein Abo, keine Telemetrie. ELLA verwaltet dein System, lernt deine Gewohnheiten, erinnert sich an Gespräche und handelt proaktiv in deinem Sinne.

Im Kern arbeitet ELLA mit einem lokalen Sprachmodell (Ollama, Modell qwen2.5:14b). Wer möchte, kann optional einen eigenen OpenAI-Schlüssel hinterlegen -- für erweiterte Funktionen wie Bilderkennung, Schreibstil-Analyse oder die Multi-Agenten-Pipeline.

---

## Was kann ELLA?

### Produktivität

- **111 Werkzeuge:** Dateien suchen und öffnen, Dokumente erstellen und lesen (Word, PDF, Excel, HTML), Aufgaben verwalten, Wecker stellen, Erinnerungen setzen, Musik abspielen, Programme starten
- **E-Mail und Kalender:** Outlook und Gmail lesen, Termine verwalten, Entwürfe erstellen -- ELLA sendet nie automatisch
- **Diktat-Modus:** Sprache wird transkribiert und direkt ins aktive Fenster getippt -- systemweit, nicht nur in ELLA
- **Desktop-Automation:** Apps starten, Fenster steuern, Tastatureingaben senden, Maus bedienen
- **Persönliche Makros:** Häufig genutzte Abläufe als Setup-Aktionen speichern und per Knopfdruck ausführen

### Intelligentes Gedächtnis

- **Knowledge Graph:** ELLA extrahiert automatisch Zusammenhänge aus Gesprächen und versteht Verbindungen -- nicht nur Textehnlichkeit
- **Lernfähig:** Feedback (Daumen hoch/runter) verbessert künftige Antworten dauerhaft
- **Proaktives Lernen:** ELLA merkt sich, welche Hinweise du willst und welche nicht -- nach fünfmaligem Wegdrücken wird eine Kategorie automatisch stummgeschaltet

### Stimme und Spracheingabe

- **Wakeword:** Sag "ELLA" -- sie hört lokal zu, ohne Cloud-Dienst
- **Vier Sprachen:** Deutsch, Englisch, Französisch, Spanisch -- mit weiblichen Stimmen
- **Stress-Erkennung:** Analysiert optional deine Stimme und passt den Ton an (opt-in)
- **Follow-Up:** Nach einer Antwort kannst du 8 Sekunden lang direkt weitersprechen, ohne das Wakeword zu wiederholen

### Monitoring und Proaktivität

- **Hintergrund-Überwachung:** Speicherplatz, RAM, Netzwerk, USB-Geräte -- ELLA warnt, bevor Probleme entstehen
- **Zwischenablage-Erkennung:** IBAN, Paketnummern, Telefonnummern, URLs werden automatisch erkannt
- **Comeback-Briefing:** Was ist passiert, seit du weg warst?
- **Tagesabschluss:** Zusammenfassung mit fälligen Aufgaben

### Schach

- **Visuelles Schachbrett:** Eigenes Fenster mit vier Themes und 3D-Figuren
- **Lernende KI:** ELLA speichert Erkenntnisse aus jeder Partie und kommentiert live
- **Pause und Fortsetzen:** Partien können jederzeit unterbrochen und später weitergespielt werden

### Barrierefreiheit

- **Blind-Modus:** Sprachausgabe erzwungen, Audio-Feedback, vollständige Screenreader-Unterstützung
- **Gehörlosenmodus:** Rein visuell, keine Audio-Elemente

### HUD-Modus

- **Drei Erscheinungsbilder:** Standard (dunkel), HUD (technisch, mit Widgets) und Präsentationsmodus (Vollbild, nur Orb und letzte Antwort)
- **Widgets:** Systemstatus, Monitore, Aufgaben, E-Mails, Musik, Routinen -- frei konfigurierbar
- **Orb:** Animierte Visualisierung mit sechs Zuständen (bereit, hört zu, denkt, spricht, Cloud, offline)

---

## Systemvoraussetzungen

| Komponente     | Minimum                        | Empfohlen                             |
| -------------- | ------------------------------ | ------------------------------------- |
| Betriebssystem | Windows 10/11 (x64)            | Windows 11                            |
| RAM            | 8 GB                           | 16 GB                                 |
| Speicherplatz  | 15 GB frei                     | 20 GB frei                            |
| GPU            | Nicht zwingend erforderlich    | NVIDIA mit 8+ GB VRAM (z.B. RTX 3060) |
| Internet       | Für Ersteinrichtung und Lizenz | Danach optional (lokal nutzbar)       |

**Ohne GPU** läuft ELLA auf der CPU -- langsamer, aber funktional. Mit einer NVIDIA-Grafikkarte ab der RTX-20-Serie (CUDA 13) und mindestens 10 GB VRAM läuft das Sprachmodell deutlich schneller.

---

## Installation

**Voraussetzungen: keine.** Der Installer bringt alles mit.

1. Lade den Installer von [ella-agent.de](https://ella-agent.de) herunter
2. Starte die Installationsdatei und folge den Anweisungen
3. Beim ersten Start: Sprache wählen (DE/EN), EULA akzeptieren, Lizenz eingeben, Modell wählen, Onboarding durchlaufen -- fertig

Der Installer enthält alle benötigten Komponenten (Datenbank, Sprachmodell-Laufzeit, Server) -- du musst nichts separat installieren oder konfigurieren.

**Lizenzschlüssel:** Erhältlich auf [ella-agent.de](https://ella-agent.de). Einmalkauf, kein Abo.

---

## Netzwerk und Datenschutz

ELLA arbeitet im Kern lokal. Netzwerkverbindungen bestehen nur für:

1. **Lizenzprüfung beim Start** -- offline-tolerant, nutzt bei fehlendem Internet den Cache
2. **Deutsche Sprachausgabe** -- nutzt Microsoft Edge TTS (Internetverbindung nötig; Englisch, Französisch und Spanisch laufen lokal)
3. **Online-Funktionen** die du aktiv nutzt (Websuche, Wetter, E-Mail)
4. **OpenAI-API** nur mit deinem eigenen Schlüssel, wenn du ihn hinterlegst
5. **Einmalige Modell-Downloads** beim ersten Nutzen

Keine Telemetrie. Kein Tracking. Keine Nutzungsdaten an Dritte.

Details: [Netzwerk-Dokumentation](docs/deutsch/netzwerk.md)

---

## Die E.L.L.A. Directive

Die E.L.L.A. Directive ist ein ethisches Regelwerk, das fest in der Architektur verankert ist -- nicht konfigurierbar, nicht abschaltbar. Vier Verbote gelten immer:

1. **Kein Schaden** -- physisch, finanziell, psychologisch oder datenbezogen
2. **Keine Verschleierung** -- alle Aktionen werden protokolliert und sind nachvollziehbar
3. **Keine Überwachung** -- ohne dein Wissen und deine aktive Zustimmung
4. **Keine Datenweitergabe** -- ohne deine ausdrückliche Erlaubnis

Zusätzlich schützt eine Rule Engine mit über 100 Regeln vor unbeabsichtigten Aktionen. Kritische Operationen (z.B. Laufwerk formatieren, Prozesse beenden) erfordern immer eine Bestätigung.

Die Directive ist ein eigenständiges Open-Source-Projekt (MIT-Lizenz): [github.com/AndreZ1971/The-E.L.L.A.-Directive-](https://github.com/AndreZ1971/The-E.L.L.A.-Directive-)

---

## Dokumentation

| Dokument                                                        | Inhalt                            |
| --------------------------------------------------------------- | --------------------------------- |
| [Bedienungsanleitung (DE)](docs/deutsch/bedienungsanleitung.md) | Vollständige Anleitung für Nutzer |
| [User Manual (EN)](docs/english/bedienungsanleitung.md)         | Full user manual in English       |
| [Netzwerk (DE)](docs/deutsch/netzwerk.md)                       | Welche Verbindungen ELLA aufbaut  |
| [Network (EN)](docs/english/network.md)                         | Network connections explained     |
| [CHANGELOG](CHANGELOG.md)                                       | Alle Versionen im Überblick       |

---

## Lizenz und Kontakt

**Lizenz:** Proprietär. Einmalkauf, kein Abo. Lizenzschlüssel erforderlich.

**Website:** [ella-agent.de](https://ella-agent.de)

**Quellcode:** [github.com/AndreZ1971/E.L.L.A.-Embedded-Local-Logic-Agent](https://github.com/AndreZ1971/E.L.L.A.-Embedded-Local-Logic-Agent) (öffentlich, zur Einsicht)

---

_E.L.L.A. -- Alle Rechte vorbehalten._
