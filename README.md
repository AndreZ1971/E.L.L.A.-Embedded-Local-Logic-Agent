# E.L.L.A. — Embedded Local Logic Agent

Lokaler KI-Assistent für Windows als native Desktop-App. LLM-gesteuerte Automatisierung mit konfigurierbarer Tool-Whitelist, dualem Provider (OpenAI / Ollama) und vollständiger Einstellungsverwaltung.

---

## Aktueller Stand — v0.1.0 (25.05.2026)

| Komponente                         | Status                                         |
| ---------------------------------- | ---------------------------------------------- |
| API (Express, Port 3002)           | Läuft — wird von Electron gestartet            |
| Frontend (Production Build)        | `apps/web/dist/` — Electron lädt direkt        |
| Chat + Tool-Loop + SSE-Streaming   | Funktionsfähig (OpenAI + Ollama)               |
| Session-Persistenz                 | MariaDB — Verlauf überlebt Neustart            |
| Ollama (`llama3.1:8b`, Port 11434) | Läuft auf E:\Ollama                            |
| MariaDB 12.2.2 (Port 3306)         | Windows-Dienst, Autostart aktiviert            |
| OpenAI GPT-4o                      | Key via Settings-UI oder `.env` konfigurierbar |
| Electron Desktop-App               | Frameless, Tray, Autostart                     |
| Dashboard                          | Status-Karten + Disk-Usage, Auto-Refresh 30s   |
| Settings                           | Provider, Modell, Tools, API-Key, Programme    |
| Programme-Verwaltung               | System-Scan, Checkbox-Liste erlaubt/verboten   |

---

## Desktop-App starten

```powershell
# Einmalig — alle Packages bauen:
npm run build --workspace=packages/shared
npm run build --workspace=packages/agent-tools
npm run build --workspace=apps/api
npm run build --workspace=apps/web
cd apps/desktop && node build-main.mjs

# Starten (Electron verwaltet API automatisch):
cd apps\desktop
.\node_modules\electron\dist\electron.exe .
```

> Electron startet die API als Child-Prozess, wartet auf Port 3002 und öffnet dann das Fenster.
> Minimieren legt das Fenster in den System-Tray. Autostart über Tray-Menü (Rechtsklick) aktivierbar.

---

## Entwicklungsmodus

```powershell
# API + Vite Dev-Server parallel starten:
npm run dev

# Electron mit Dev-Flag (lädt Vite statt Production-Build):
$env:ELLA_DEV = "1"
cd apps\desktop
.\node_modules\electron\dist\electron.exe .
```

---

## Schnellstart (nach Clone)

```bash
# Abhängigkeiten installieren
npm install

# Voraussetzungen:
#   - Ollama läuft:   ollama serve
#   - MariaDB läuft:  sc start MariaDB  (Windows-Dienst)
#   - apps/api/.env   mit DB-Zugangsdaten (siehe unten)

# Packages bauen
npm run build --workspace=packages/shared
npm run build --workspace=packages/agent-tools
npm run build --workspace=apps/api
npm run build --workspace=apps/web
cd apps/desktop && node build-main.mjs

# Starten
cd apps\desktop
.\node_modules\electron\dist\electron.exe .
```

### Umgebungsvariablen (`apps/api/.env`)

```env
PORT=3002
NODE_ENV=development

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
OPENAI_API_KEY=        # Optional — wenn gesetzt wird GPT-4o bevorzugt

DB_HOST=localhost
DB_PORT=3306
DB_NAME=ella
DB_USER=ella
DB_PASSWORD=ella_dev_2026
```

---

## Dokumentation

| Dokument                                     | Inhalt                                                                        |
| -------------------------------------------- | ----------------------------------------------------------------------------- |
| [docs/architecture.md](docs/architecture.md) | Systemübersicht, Chat-Flow, Ports, Stack, Projektstruktur, Sicherheitsprinzip |
| [docs/history.md](docs/history.md)           | Entwicklungshistorie — was wurde gebaut und warum (v0.0.1–v0.0.4)             |
| [docs/database.md](docs/database.md)         | MariaDB-Schema, Tabellenbeschreibungen, Admin-Befehle                         |
| [docs/roadmap.md](docs/roadmap.md)           | Geplante Features mit technischen Details und Prioritäten                     |
| [docs/hardware.md](docs/hardware.md)         | Hardware-Spezifikation Dante-Home, Laufwerk-Architektur, GPU-Potential        |
