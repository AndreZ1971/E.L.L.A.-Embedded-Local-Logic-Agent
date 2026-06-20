# Work Plan — Installer + Licensing

**Goal:** Take E.L.L.A. from "runs on my machine" to "purchasable and installable for any Windows user"

---

## Overview

```
Phase 1 — Licensing Architecture      (Foundation — everything else builds on this)
Phase 2 — Activation Server           (Hetzner, Node.js, MariaDB)
Phase 3 — Payment Flow                (Stripe → Key → Email)
Phase 4 — Installer Core              (NSIS + license screen + activation)
Phase 5 — Installer Dependency Manager (The real work)
Phase 6 — Installer E.L.L.A. Setup   (Configuration + first start)
Phase 7 — Installer Polish            (UI, error handling, uninstaller)
```

---

## Phase 1 — Licensing Architecture

**Goal:** Make decisions and define data structures. No code that will come back to bite us later.

### 1.1 — Define Key Format

Structured license key — not just a UUID.

```
Format:  ELLA-XXXX-XXXX-XXXX-XXXX
Encoding: Base32 (readable, no I/O/0 confusion)
Content (internally encoded):
  - Version (1 byte)
  - Product type: personal / home / arm (1 byte)
  - Issue date (4 bytes)
  - Max. activations: 1 or 2 (1 byte)
  - Serial number (4 bytes, unique per key)
  - HMAC signature (last 4 bytes — integrity check)
```

Advantage: Installer can perform basic validation offline (format + HMAC) before contacting the activation server.

### 1.2 — Signature Mechanism

- **Algorithm:** ECDSA P-256 (faster than RSA, smaller keys, same security)
- **Private key:** only on Hetzner activation server — never in the installer
- **Public key:** embedded in the installer — for offline verification of the activation token

### 1.3 — Hardware Fingerprint

Combination of three components via WMI/PowerShell:

```powershell
Get-CimInstance Win32_Processor      | Select-Object -ExpandProperty ProcessorId
Get-CimInstance Win32_BaseBoard      | Select-Object -ExpandProperty SerialNumber
Get-CimInstance Win32_DiskDrive      | Select-Object -First 1 -ExpandProperty SerialNumber
```

SHA-256 of the combined values → 64-character fingerprint.

**Tolerance:** If 1 of 3 components changes (e.g. new hard drive) → reactivation possible. If 2 of 3 change → support process.

### 1.4 — Activation Token

After successful activation, a signed token is stored locally:

```json
{
  "licenseKey": "ELLA-XXXX-XXXX-XXXX-XXXX",
  "hardwareFingerprint": "<sha256>",
  "activatedAt": "2026-06-07T...",
  "product": "personal",
  "signature": "<ecdsa-sig>"
}
```

E.L.L.A. checks on every start: token present? Signature valid? Fingerprint matches?

---

## Phase 2 — Activation Server

**Stack:** Node.js + Express + MariaDB — on the existing Hetzner server.

### 2.1 — Database Schema

```sql
CREATE TABLE licenses (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  license_key   VARCHAR(50)  NOT NULL UNIQUE,
  product       ENUM('personal', 'home', 'arm') NOT NULL DEFAULT 'personal',
  max_activations INT NOT NULL DEFAULT 1,
  activations   INT NOT NULL DEFAULT 0,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at    DATETIME NULL  -- NULL = unlimited (one-time purchase)
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

### 2.2 — API Endpoints

```
POST /activate
  Body: { licenseKey, hardwareFingerprint, machineInfo }
  → Checks: key exists, activations < max_activations, hardware not yet activated
  → Creates activation entry
  → Returns signed token
  Response: { token: "<signed-jwt>", activatedAt, product }

POST /validate
  Body: { licenseKey, hardwareFingerprint }
  → Checks whether this combination is activated
  → For reactivation after system change
  Response: { valid: boolean }

POST /transfer
  Body: { licenseKey, oldFingerprint, newFingerprint, transferCode }
  → For hardware change (transferCode = one-time code via email)
  Response: { token: "<signed-jwt>" }
```

### 2.3 — Rate Limiting + Security

- Max. 5 activation attempts per IP per hour
- Max. 10 validation attempts per key per day
- All requests logged

---

## Phase 3 — Payment Flow

**Stack:** Stripe + Webhook → key generation → email.

### 3.1 — Stripe Integration

```
User purchases on the website (Stripe Checkout, €199)
→ Stripe webhook: payment_intent.succeeded
→ Backend generates license key (ECDSA-signed)
→ Key stored in licenses table
→ Email to buyer: key + download link + installation instructions
```

### 3.2 — Email Content

- License key (clearly displayed, copyable)
- Download link for installer (direct, no account required)
- Quick guide: run installer → enter key → done
- Support contact

### 3.3 — Download Link Security

The installer download is not publicly linked. The download link contains a one-time token:

```
https://download.ella-ai.de/install?token=<one-time-JWT>
```

Token valid for 72h, max. 3 downloads. Prevents the link from being widely shared.

---

## Phase 4 — Installer Core

**Base:** Existing NSIS installer from `apps/desktop/package.json`.

### 4.1 — Installer Screens (Order)

```
1. Welcome          — E.L.L.A. logo, brief description, "Next"
2. License key      — Input field, offline format validation, "Activate"
3. Activation       — Online check running, progress indicator
4. Installation path — Default: C:\Program Files\ELLA, changeable
5. Installation     — Dependency manager running (Phase 5)
6. Done             — "Launch E.L.L.A."
```

### 4.2 — License Screen Logic

```
User enters key
→ Offline check: format correct? HMAC valid?
  → No: "Invalid license key" (immediate, no server call)
→ Collect hardware fingerprint
→ POST /activate to activation server
  → Error "already activated on different hardware":
     "This license is already active on another device.
      Contact: support@ella-ai.de"
  → Error "max. activations reached":
     "The maximum number of activations has been reached."
  → Success: save token locally, proceed to step 4
```

### 4.3 — Token Storage Location

```
C:\ProgramData\ELLA\license.token
```

File is not in the installation directory — survives reinstallation.

---

## Phase 5 — Installer Dependency Manager

**The real work.** Every step must work for every realistic Windows configuration.

### 5.1 — Check Order

```
[1] Node.js 20+
[2] Python 3.12
[3] Ollama
[4] llama3.1:8b (model)
[5] nomic-embed-text (model)
[6] MariaDB service
[7] Database + user
[8] Python packages (wakeword)
[9] Python packages Kokoro TTS (optional, skippable)
[0] GPU detection (informational, not a blocker)
```

### 5.2 — Per Dependency: Detect → Install → Verify

**Node.js:**

```
Detect:  node --version → >= 20.x.x
Install: winget install OpenJS.NodeJS.LTS (silent)
         OR: embedded Node.js installer in NSIS package
Verify:  node --version check again
```

**Python 3.12:**

```
Detect:  py -3.12 --version
Install: winget install Python.Python.3.12 (silent)
         OR: embedded Python installer
Verify:  py -3.12 --version
Note: py launcher must be in PATH
```

**Ollama:**

```
Detect:  Invoke-RestMethod http://localhost:11434/api/tags → 200 OK
         OR: Get-Command ollama
Install: Download Ollama installer from web + silent install
         OR: embedded in NSIS package
Start:   ollama serve (as background process, wait 10s)
Verify:  HTTP ping on :11434
```

**Models (llama3.1:8b + nomic-embed-text):**

```
Detect:  ollama list → model name in output
Install: ollama pull llama3.1:8b
         → Progress bar in installer (parse stdout)
         → ~4.7 GB, can take 10-20 minutes
         → "Downloading... X GB of 4.7 GB"
Verify:  ollama list → model present
```

**MariaDB:**

```
Detect:  Get-Service MariaDB → Running
         OR: port 3306 open
Install: MariaDB MSI silent install to E:\MariaDB
         Configure service: autostart
         Set root password
Start:   sc start MariaDB
Verify:  TCP connect on port 3306
```

**Database + User:**

```
mysql -u root -p<root-pw> -e "CREATE DATABASE IF NOT EXISTS ella;"
mysql -u root -p<root-pw> -e "CREATE USER IF NOT EXISTS 'ella'@'localhost' IDENTIFIED BY '<generated-pw>';"
mysql -u root -p<root-pw> -e "GRANT ALL PRIVILEGES ON ella.* TO 'ella'@'localhost';"
→ Write password to .env
→ Schema migration runs automatically on first API start
```

**Python packages:**

```
py -3.12 -m pip install openwakeword onnxruntime soundfile
→ Failure here: wakeword disabled, rest still runs

py -3.12 -m pip install kokoro-onnx sounddevice numpy  (optional)
→ Failure: "Kokoro TTS not available — Windows voice will be used"
→ Not a blocker for installation
```

**GPU detection:**

```
Get-CimInstance Win32_VideoController → Name + AdapterRAM
→ NVIDIA detected: check OLLAMA_MODELS path
→ Information for user: "GPU detected: GTX 1060 — E.L.L.A. uses GPU acceleration"
→ No GPU: "CPU mode — responses take 5-15 seconds"
```

### 5.3 — Error Handling

Every failed installation shows:

- What went wrong (clear, no hex codes)
- What the user can do
- "Skip" — when the step is not critical
- "Cancel" — with a note about what is still missing

Critical failures (Node.js, Ollama, MariaDB): no skip — without these E.L.L.A. will not run.
Optional failures (Kokoro, wakeword): skippable — E.L.L.A. still starts.

---

## Phase 6 — E.L.L.A. Configuration

### 6.1 — Generate .env

```
Automatically create apps/api/.env:
  DB_HOST=localhost
  DB_PORT=3306
  DB_NAME=ella
  DB_USER=ella
  DB_PASSWORD=<generated-secure-password>
  PORT=3002
  OLLAMA_URL=http://localhost:11434
```

### 6.2 — Integrate Activation Token into E.L.L.A.

E.L.L.A. API checks on start:

```typescript
// apps/api/src/config/license.ts
→ Read C:\ProgramData\ELLA\license.token
→ Verify ECDSA signature (public key embedded)
→ Verify hardware fingerprint
→ Valid: API starts normally
→ Invalid: API responds only with { error: "license_invalid" }
→ Frontend shows license error screen
```

### 6.3 — First Start

```
Start API → wait until port 3002 responds
Start Electron → onboarding flow
"E.L.L.A. is ready."
```

---

## Phase 7 — Polish

### 7.1 — Installer UI

- E.L.L.A. branding (violet, logo)
- Clear progress bar per step
- Time estimate for model downloads ("approx. 12 minutes remaining")
- No terminal window visible — all processes in the background

### 7.2 — Uninstaller

```
Uninstallation removes:
  → E.L.L.A. binaries and app files
  → Ollama NOT (belongs to the user, not E.L.L.A.)
  → MariaDB NOT (may contain other data)
  → C:\ProgramData\ELLA\ NOT (user data, memory)

On request (explicit checkbox):
  → "Delete all E.L.L.A. data" → remove ProgramData\ELLA\
```

### 7.3 — Reinstallation

If E.L.L.A. is already installed:

- Token present → skip license screen, go directly to dependency check
- Token missing → show license screen

---

## Order for Tomorrow

| Step | What                            | Why first                            |
| ---- | ------------------------------- | ------------------------------------ |
| 1    | Define key format + signing     | Foundation — everything builds on it |
| 2    | Activation server (DB + API)    | Must exist before installer          |
| 3    | Stripe webhook + key generation | Close the payment flow               |
| 4    | Installer license screen        | First visible integration            |
| 5    | Dependency manager step by step | Largest work, test iteratively       |
| 6    | License check in E.L.L.A. API   | Last building block                  |
| 7    | End-to-end test on a fresh VM   | Before anything ships                |

---

## Open Decisions (to clarify tomorrow)

- Installer size: embed Ollama + models (>5 GB) or just installer + online download?
  - **Recommendation:** keep installer small, pull models online — simpler updates
- Max. activations per key: 1 or 2?
  - **Recommendation:** 2 (desktop + laptop) — user-friendly, low abuse risk
- Price for reactivation on hardware change: free or paid?
  - **Recommendation:** free via self-service (once per year) — no support ticket needed
- MariaDB installation path: fixed `E:\MariaDB` or user-selectable?
  - **Recommendation:** user-selectable, default `E:\MariaDB` if E: is present, otherwise `C:\MariaDB`
