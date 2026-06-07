# E.L.L.A. — Strategic Roadmap

**Stand:** Juni 2026
**Aktuell:** v3.4.0 — produktionsreif, lokal, direktive-gesichert, 85 Tools

> _E.L.L.A. passt sich dem Nutzer an und wächst mit ihren Herausforderungen._

---

## Wo E.L.L.A. heute steht

E.L.L.A. läuft auf einem i3 12th Gen mit GTX 1060 — Consumer-Hardware unterhalb des Marktdurchschnitts. Das ist kein Zufall. Es ist der Beweis: was auf dieser Hardware läuft, läuft auf jedem modernen Windows-Gerät.

**Heute produktiv (v3.4.0):**

- Lokale KI-Inferenz (llama3.1:8b, 14.6 t/s GPU, vollständig offline)
- 85 aktive Tools — Systemsteuerung, Dateien, Medien, Netzwerk, Kommunikation, UI-Automation
- Wakeword-Aktivierung ("ella") via openWakeWord + ONNX, vollständig offline
- Kokoro TTS — neuronale lokale Sprachausgabe (Port 3003, 127.0.0.1-only)
- Mail & Kalender (Outlook COM + Gmail/Google Calendar via OAuth 2.0)
- Proaktives Monitoring — Firewall, DNS, neue Geräte, Speicher, Clipboard-Muster
- Vollständiges Gedächtnissystem (768-dim Embeddings, MariaDB, Cosinus-Suche)
- Nutzerprofile — profilgebundenes Gedächtnis, PBKDF2+Salt PIN-Hash
- Gesprächskompression — Ollama-only, lokaler Kontext-Schutz
- Semantischer Bildschirm-Klick — OCR → 3-Pass-Matching → confirm
- Maus, Tastatur, Fenster, Dienste, Shell (sandboxed, Bestätigungspflicht)
- The E.L.L.A. Directive — vier unveränderliche Verbote, 82 Default-Regeln, Audit-Log

---

## v2.x / v3.x — Produktivitäts-Sprint (abgeschlossen)

Alles was E.L.L.A. zur täglichen Gewohnheit macht — vollständig umgesetzt.

| Feature                    | Version | Status |
| -------------------------- | ------- | ------ |
| Onboarding 6-Schritt-Flow  | v2.x    | ✅     |
| Proaktive Sprache (SSE)    | v2.x    | ✅     |
| Standort-Awareness         | v2.x    | ✅     |
| Directive UI (roter Badge) | v2.x    | ✅     |
| wmic → CimInstance         | v2.x    | ✅     |
| Vision (Screenshot + GPT)  | v3.0.0  | ✅     |
| Nutzerprofile              | v3.1.0  | ✅     |
| Kokoro TTS (lokal)         | v3.1.0  | ✅     |
| Aufgabenliste (MariaDB)    | v3.1.0  | ✅     |
| Gesprächskompression       | v3.1.0  | ✅     |
| Fenster-Kontext (opt-in)   | v3.1.0  | ✅     |
| System Automation (10)     | v3.2.0  | ✅     |
| Mouse Control + Shell      | v3.3.0  | ✅     |
| Screen Monitor (OCR-Diff)  | v3.3.0  | ✅     |
| Datei-Operationen (4)      | v3.4.0  | ✅     |
| System-Komfort (5)         | v3.4.0  | ✅     |
| Medien-Steuerung (WinRT)   | v3.4.0  | ✅     |
| KI-Textverarbeitung (2)    | v3.4.0  | ✅     |
| Semantischer OCR-Klick     | v3.4.0  | ✅     |

Nicht umgesetzt (bewusst zurückgestellt): Multilingual UI, Kamera-Integration, Session-Persistenz über Neustarts.

---

## v4.0 — Platform

The E.L.L.A. Directive als offener Standard. E.L.L.A. als Plattform.

| Feature                  | Beschreibung                                                             |
| ------------------------ | ------------------------------------------------------------------------ |
| Directive Public Release | ella-directive wird öffentlich — offener Standard für lokale KI-Agenten  |
| Conformance Badge        | Andere Projekte können "Directive-konform" zertifiziert werden           |
| Plugin API               | Drittanbieter können Tools registrieren — unter Directive-Kontrolle      |
| Hardware Abstraction     | Abstraktionsschicht für verschiedene Windows-Geräte (ARM, x64, Copilot+) |
| Multilingual UI          | i18n-System — Interface in Systemsprache des Nutzers                     |
| Enterprise Edition       | Zentrale Policy-Verwaltung, Audit-Export, AD-Integration                 |

---

## Langfristig — Beyond Desktop

Die Directive ist nicht auf Desktop-KI beschränkt.

Die architektonischen Prinzipien der E.L.L.A. Directive — Verbote als strukturelle Unmöglichkeit statt interpretierbarer Regeln — sind auf jedes autonome System anwendbar:

| Bereich              | Anwendung                                                     |
| -------------------- | ------------------------------------------------------------- |
| Autonome Web-Agenten | Browser-Automatisierung mit Directive-Schutz                  |
| IoT & Smart Home     | Gerätesteuerung unter garantierten Grenzen                    |
| Industrieroboter     | Physische Systeme mit vertrauenswürdiger Autonomie            |
| Humanoide Roboter    | Die eigentliche Domäne — physische Sicherheit als Architektur |

---

## Was bewusst nicht geplant ist

| Feature             | Warum nicht                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------- |
| Cloud-Hosting       | Lokale Ausführung ist Designprinzip — keine Kompromisse                                  |
| Multi-User-Netzwerk | E.L.L.A. ist ein persönlicher Assistent — Nutzerprofile sind gerätlokal, kein Netzwerk   |
| Subscription        | Einmalkauf — €99 Consumer, €299 Enterprise. Keine monatlichen Kosten.                    |
| Freie Shell         | `run_command` existiert — aber sandboxed (60+ gesperrte Muster, immer Bestätigung nötig) |
| Unkontrollierte KI  | Die Directive verhindert Ausführung ohne Nutzerkenntnis — by design                      |

---

## OEM-Integration

E.L.L.A. ist für OEM-Vorinstallation ausgelegt:

- **Installer:** NSIS-basiert, silent install, kein technisches Setup für den Nutzer
- **Aktivierungsmodell:** Pre-install kostenlos + €99 Aktivierung — oder $2/Gerät OEM-Lizenz
- **Support:** E.L.L.A. ist ihr eigener Support. Kein FAQ nötig. Kein Techniker nötig.
- **DSGVO/EU AI Act:** Keine Daten verlassen das Gerät — Limited Risk, keine Registrierungspflicht

---

> E.L.L.A. ist kein Chatbot der zufällig auf dem Desktop läuft.
> Sie ist ein Assistent der das Gerät kennt, den Nutzer kennt, und weiß was sie niemals tun wird.
