# Arbeitsplan — Installer + Lizenzierung

**Ziel:** E.L.L.A. von "läuft auf meinem Rechner" zu "kaufbar und installierbar für jeden Windows-Nutzer"

---

## Übersicht

```
Phase 1 — Lizenzierungs-Architektur     (Fundament, alles andere baut darauf)
Phase 2 — Aktivierungsserver            (Hetzner, Node.js, MariaDB)
Phase 3 — Zahlungsfluss                 (Stripe → Key → E-Mail)
Phase 4 — Installer Core                (NSIS + Lizenzscreen + Aktivierung)
Phase 5 — Installer Dependency-Manager  (Das eigentliche Werk)
Phase 6 — Installer E.L.L.A.-Setup      (Konfiguration + Erster Start)
Phase 7 — Installer Polish              (UI, Fehlerbehandlung, Uninstaller)
```

---

## Phase 1 — Lizenzierungs-Architektur

**Ziel:** Entscheidungen treffen und Datenstrukturen definieren. Kein Code der sich später rächt.

### 1.1 — Key-Format definieren

Strukturierter Lizenzschlüssel — nicht nur eine UUID.

```
Format:  ELLA-XXXX-XXXX-XXXX-XXXX
Encoding: Base32 (lesbar, kein I/O/0 Verwechslungsproblem)
Inhalt (intern kodiert):
  - Version (1 Byte)
  - Produkttyp: personal / home / arm (1 Byte)
  - Ausstellungsdatum (4 Bytes)
  - Max. Aktivierungen: 1 oder 2 (1 Byte)
  - Seriennummer (4 Bytes, unique per Key)
  - HMAC-Signatur (letzten 4 Bytes — Integrity-Check)
```

Vorteil: Installer kann Basis-Validierung offline durchführen (Format + HMAC) bevor er den Aktivierungsserver kontaktiert.

### 1.2 — Signatur-Mechanismus

- **Algorithmus:** ECDSA P-256 (schneller als RSA, kleinere Keys, gleiche Sicherheit)
- **Privater Schlüssel:** nur auf Hetzner-Aktivierungsserver — niemals im Installer
- **Öffentlicher Schlüssel:** im Installer eingebettet — für Offline-Verifikation des Aktivierungstokens

### 1.3 — Hardware-Fingerprint

Kombination aus drei Komponenten via WMI/PowerShell:

```powershell
Get-CimInstance Win32_Processor      | Select-Object -ExpandProperty ProcessorId
Get-CimInstance Win32_BaseBoard      | Select-Object -ExpandProperty SerialNumber
Get-CimInstance Win32_DiskDrive      | Select-Object -First 1 -ExpandProperty SerialNumber
```

SHA-256 der kombinierten Werte → 64-Zeichen-Fingerprint.

**Toleranz:** Wenn sich 1 von 3 Komponenten ändert (z.B. neue Festplatte) → Reaktivierung möglich. Wenn sich 2 von 3 ändern → Support-Prozess.

### 1.4 — Aktivierungstoken

Nach erfolgreicher Aktivierung wird ein signiertes Token lokal gespeichert:

```json
{
  "licenseKey": "ELLA-XXXX-XXXX-XXXX-XXXX",
  "hardwareFingerprint": "<sha256>",
  "activatedAt": "2026-06-07T...",
  "product": "personal",
  "signature": "<ecdsa-sig>"
}
```

E.L.L.A. prüft bei jedem Start: Token vorhanden? Signatur gültig? Fingerprint stimmt überein?

---

## Phase 2 — Aktivierungsserver

**Stack:** Node.js + Express + MariaDB — auf bestehendem Hetzner-Server.

### 2.1 — Datenbank-Schema

```sql
CREATE TABLE licenses (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  license_key   VARCHAR(50)  NOT NULL UNIQUE,
  product       ENUM('personal', 'home', 'arm') NOT NULL DEFAULT 'personal',
  max_activations INT NOT NULL DEFAULT 1,
  activations   INT NOT NULL DEFAULT 0,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at    DATETIME NULL  -- NULL = unbegrenzt (Einmalkauf)
);

CREATE TABLE activations (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  license_key       VARCHAR(50) NOT NULL,
  hardware_fingerprint VARCHAR(64) NOT NULL,
  activated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_address        VARCHAR(45),
  UNIQUE KEY uq_license_hardware (license_key, hardware_fingerprint)
);
```

### 2.2 — API-Endpunkte

```
POST /activate
  Body: { licenseKey, hardwareFingerprint, machineInfo }
  → Prüft: Key existiert, Aktivierungen < max_activations, Hardware noch nicht aktiviert
  → Erstellt Aktivierungseintrag
  → Gibt signiertes Token zurück
  Response: { token: "<signed-jwt>", activatedAt, product }

POST /validate
  Body: { licenseKey, hardwareFingerprint }
  → Prüft ob diese Kombination aktiviert ist
  → Für Reaktivierung nach Systemwechsel
  Response: { valid: boolean }

POST /transfer
  Body: { licenseKey, oldFingerprint, newFingerprint, transferCode }
  → Für Hardware-Wechsel (transferCode = einmaliger Code per E-Mail)
  Response: { token: "<signed-jwt>" }
```

### 2.3 — Rate Limiting + Sicherheit

- Max. 5 Aktivierungsversuche pro IP pro Stunde
- Max. 10 Validierungsversuche pro Key pro Tag
- Alle Anfragen geloggt

---

## Phase 3 — Zahlungsfluss

**Stack:** Stripe + Webhook → Key-Generierung → E-Mail.

### 3.1 — Stripe-Integration

```
Nutzer kauft auf der Website (Stripe Checkout, €199)
→ Stripe-Webhook: payment_intent.succeeded
→ Backend generiert Lizenzschlüssel (ECDSA-signiert)
→ Schlüssel in licenses-Tabelle gespeichert
→ E-Mail an Käufer: Key + Download-Link + Installationsanleitung
```

### 3.2 — E-Mail-Inhalt

- Lizenzschlüssel (klar dargestellt, kopierbar)
- Download-Link für Installer (direkt, kein Konto nötig)
- Kurzanleitung: Installer starten → Key eingeben → fertig
- Support-Kontakt

### 3.3 — Download-Link-Sicherheit

Der Installer-Download ist nicht öffentlich verlinkt. Der Download-Link enthält ein einmaliges Token:

```
https://download.ella-ai.de/install?token=<einmaliges-JWT>
```

Token gültig für 72h, max. 3 Downloads. Verhindert dass der Link breit geteilt wird.

---

## Phase 4 — Installer Core

**Basis:** Bestehender NSIS-Installer aus `apps/desktop/package.json`.

### 4.1 — Installer-Screens (Reihenfolge)

```
1. Willkommen     — E.L.L.A. Logo, Kurzbeschreibung, "Weiter"
2. Lizenzschlüssel — Eingabefeld, Offline-Format-Validierung, "Aktivieren"
3. Aktivierung    — Online-Check läuft, Fortschrittsanzeige
4. Installationspfad — Standard: C:\Program Files\ELLA, änderbar
5. Installation   — Dependency-Manager läuft (Phase 5)
6. Fertig         — "E.L.L.A. starten"
```

### 4.2 — Lizenzscreen-Logik

```
Nutzer gibt Key ein
→ Offline-Prüfung: Format korrekt? HMAC gültig?
  → Nein: "Ungültiger Lizenzschlüssel" (sofort, kein Server-Call)
→ Hardware-Fingerprint sammeln
→ POST /activate an Aktivierungsserver
  → Fehler "bereits aktiviert auf anderer Hardware":
     "Diese Lizenz ist bereits auf einem anderen Gerät aktiv.
      Kontakt: support@ella-ai.de"
  → Fehler "max. Aktivierungen erreicht":
     "Die maximale Anzahl an Aktivierungen wurde erreicht."
  → Erfolg: Token lokal speichern, weiter zu Schritt 4
```

### 4.3 — Token-Speicherort

```
C:\ProgramData\ELLA\license.token
```

Datei ist nicht im Installationsverzeichnis — überlebt Reinstallation.

---

## Phase 5 — Installer Dependency-Manager

**Das eigentliche Werk.** Jeder Schritt muss für jede realistische Windows-Konfiguration funktionieren.

### 5.1 — Prüf-Reihenfolge

```
[1] Node.js 20+
[2] Python 3.12
[3] Ollama
[4] llama3.1:8b (Modell)
[5] nomic-embed-text (Modell)
[6] MariaDB Service
[7] Datenbank + User
[8] Python-Pakete (Wakeword)
[9] Python-Pakete Kokoro TTS (optional, überspringbar)
[0] GPU-Erkennung (informativ, kein Blocker)
```

### 5.2 — Pro Dependency: Detect → Install → Verify

**Node.js:**

```
Detect:  node --version → >= 20.x.x
Install: winget install OpenJS.NodeJS.LTS (silent)
         ODER: eingebetteter Node.js-Installer im NSIS-Paket
Verify:  node --version erneut prüfen
```

**Python 3.12:**

```
Detect:  py -3.12 --version
Install: winget install Python.Python.3.12 (silent)
         ODER: eingebetteter Python-Installer
Verify:  py -3.12 --version
Hinweis: py-Launcher muss im PATH sein
```

**Ollama:**

```
Detect:  Invoke-RestMethod http://localhost:11434/api/tags → 200 OK
         ODER: Get-Command ollama
Install: Ollama-Installer aus dem Web herunterladen + silent install
         ODER: im NSIS-Paket eingebettet
Start:   ollama serve (als Hintergrundprozess, 10s warten)
Verify:  HTTP-Ping auf :11434
```

**Modelle (llama3.1:8b + nomic-embed-text):**

```
Detect:  ollama list → Modellname in Ausgabe
Install: ollama pull llama3.1:8b
         → Fortschrittsbalken im Installer (stdout parsen)
         → ~4.7 GB, kann 10-20 Minuten dauern
         → "Download läuft... X GB von 4.7 GB"
Verify:  ollama list → Modell vorhanden
```

**MariaDB:**

```
Detect:  Get-Service MariaDB → Running
         ODER: port 3306 offen
Install: MariaDB-MSI silent install nach E:\MariaDB
         Service konfigurieren: Autostart
         Root-Passwort setzen
Start:   sc start MariaDB
Verify:  TCP-Connect auf Port 3306
```

**Datenbank + User:**

```
mysql -u root -p<root-pw> -e "CREATE DATABASE IF NOT EXISTS ella;"
mysql -u root -p<root-pw> -e "CREATE USER IF NOT EXISTS 'ella'@'localhost' IDENTIFIED BY '<generated-pw>';"
mysql -u root -p<root-pw> -e "GRANT ALL PRIVILEGES ON ella.* TO 'ella'@'localhost';"
→ Passwort in .env schreiben
→ Schema-Migration läuft beim ersten API-Start automatisch
```

**Python-Pakete:**

```
py -3.12 -m pip install openwakeword onnxruntime soundfile
→ Fehler hier: Wakeword deaktiviert, Rest läuft trotzdem

py -3.12 -m pip install kokoro-onnx sounddevice numpy  (optional)
→ Scheitern: "Kokoro TTS nicht verfügbar — Windows-Stimme wird verwendet"
→ Kein Blocker für Installation
```

**GPU-Erkennung:**

```
Get-CimInstance Win32_VideoController → Name + AdapterRAM
→ NVIDIA erkannt: OLLAMA_MODELS-Pfad prüfen
→ Information für Nutzer: "GPU erkannt: GTX 1060 — E.L.L.A. nutzt GPU-Beschleunigung"
→ Kein GPU: "CPU-Modus — Antworten dauern 5-15 Sekunden"
```

### 5.3 — Fehlerbehandlung

Jede fehlgeschlagene Installation zeigt:

- Was schiefging (klar, keine Hex-Codes)
- Was der Nutzer tun kann
- "Überspringen" — wenn der Schritt nicht kritisch ist
- "Abbrechen" — mit Hinweis was noch fehlt

Kritische Fehler (Node.js, Ollama, MariaDB): kein Überspringen — ohne diese läuft E.L.L.A. nicht.
Optionale Fehler (Kokoro, Wakeword): überspringbar — E.L.L.A. startet trotzdem.

---

## Phase 6 — E.L.L.A. Konfiguration

### 6.1 — .env generieren

```
apps/api/.env automatisch erstellen:
  DB_HOST=localhost
  DB_PORT=3306
  DB_NAME=ella
  DB_USER=ella
  DB_PASSWORD=<generated-secure-password>
  PORT=3002
  OLLAMA_URL=http://localhost:11434
```

### 6.2 — Aktivierungstoken in E.L.L.A. einbinden

E.L.L.A. API prüft beim Start:

```typescript
// apps/api/src/config/license.ts
→ C:\ProgramData\ELLA\license.token lesen
→ ECDSA-Signatur prüfen (public key eingebettet)
→ Hardware-Fingerprint prüfen
→ Gültig: API startet normal
→ Ungültig: API antwortet nur mit { error: "license_invalid" }
→ Frontend zeigt Lizenz-Fehlerschirm
```

### 6.3 — Erster Start

```
API starten → warten bis Port 3002 antwortet
Electron starten → Onboarding-Flow
"E.L.L.A. ist bereit."
```

---

## Phase 7 — Polish

### 7.1 — Installer-UI

- E.L.L.A. Branding (violet, Logo)
- Klarer Fortschrittsbalken pro Schritt
- Zeitschätzung für Modell-Downloads ("noch ca. 12 Minuten")
- Kein Terminal-Fenster sichtbar — alle Prozesse im Hintergrund

### 7.2 — Uninstaller

```
Deinstallation entfernt:
  → E.L.L.A.-Binaries und App-Dateien
  → Ollama NICHT (gehört dem Nutzer, nicht E.L.L.A.)
  → MariaDB NICHT (könnte andere Daten enthalten)
  → C:\ProgramData\ELLA\ NICHT (Nutzerdaten, Gedächtnis)

Auf Wunsch (explizite Checkbox):
  → "Alle E.L.L.A.-Daten löschen" → ProgramData\ELLA\ entfernen
```

### 7.3 — Reinstallation

Wenn E.L.L.A. bereits installiert ist:

- Token vorhanden → Lizenzscreen überspringen, direkt zu Dependency-Check
- Token fehlt → Lizenzscreen zeigen

---

## Reihenfolge für morgen

| Schritt | Was                                    | Warum zuerst                   |
| ------- | -------------------------------------- | ------------------------------ |
| 1       | Key-Format + Signing festlegen         | Fundament — alles baut darauf  |
| 2       | Aktivierungsserver (DB + API)          | Muss vor Installer existieren  |
| 3       | Stripe-Webhook + Key-Generierung       | Zahlungsfluss schließen        |
| 4       | Installer Lizenzscreen                 | Erste sichtbare Integration    |
| 5       | Dependency-Manager Schritt für Schritt | Größte Arbeit, iterativ testen |
| 6       | License-Check in E.L.L.A. API          | Letzter Baustein               |
| 7       | End-to-End-Test auf frischer VM        | Bevor irgendwas rausgeht       |

---

## Offene Entscheidungen (für morgen klären)

- Installer-Größe: Ollama + Modelle einbetten (>5 GB) oder nur Installer + Online-Download?
  - **Empfehlung:** Installer klein halten, Modelle online pullen — einfachere Updates
- Max. Aktivierungen pro Key: 1 oder 2?
  - **Empfehlung:** 2 (Desktop + Laptop) — Nutzerfreundlich, wenig Missbrauch
- Preis für Reaktivierung bei Hardware-Wechsel: kostenlos oder kostenpflichtig?
  - **Empfehlung:** kostenlos per Self-Service (einmal pro Jahr) — kein Support-Ticket nötig
- MariaDB-Installationspfad: fest `E:\MariaDB` oder vom Nutzer wählbar?
  - **Empfehlung:** wählbar, Default `E:\MariaDB` wenn E: vorhanden, sonst `C:\MariaDB`
