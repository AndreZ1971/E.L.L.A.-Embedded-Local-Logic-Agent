# E.L.L.A. — Embedded Local Logic Agent

Lokaler KI-Assistent für Windows als Web-Anwendung. LLM-gesteuerte Automatisierung mit strikter Tool-Whitelist, dualem Provider (OpenAI / Ollama) und vollständigem Audit-Log.

---

## Aktueller Stand — v0.0.3 (25.05.2026)

| Komponente | Status |
| --- | --- |
| API (Express, Port 3002) | Läuft |
| Frontend (React/Vite, Port 5173) | Läuft |
| Chat + Tool-Loop | Funktionsfähig (OpenAI + Ollama) |
| Ollama (`llama3.1:8b`, Port 11434) | Läuft auf E:\Ollama |
| MariaDB 12.2.2 (Port 3306) | Läuft auf E:\MariaDB |
| OpenAI GPT-4o | Aktiv wenn `OPENAI_API_KEY` gesetzt |
| Electron Desktop-App | In Entwicklung (`apps/desktop`) |

---

## Desktop-App starten (Electron)

```powershell
# Einmalig bauen:
cd apps/desktop
node build-main.mjs

# Starten (React-Dev-Server muss laufen):
node_modules\electron\dist\electron.exe .
```

> Die Electron-App öffnet ein natives Fenster statt eines Browser-Tabs.
> Minimieren legt das Fenster in den System-Tray (nicht in die Taskleiste).

---

## Schnellstart

```bash
# Abhängigkeiten installieren
npm install

# Packages einmalig bauen (nach Clone oder Änderungen)
npm run build --workspace=packages/shared
npm run build --workspace=packages/agent-tools

# Voraussetzungen:
#   - Ollama läuft:   ollama serve
#   - MariaDB läuft:  net start MariaDB  (Windows-Dienst)
#   - apps/api/.env   mit DB-Zugangsdaten

# Starten
npm run dev
# API:      http://localhost:3002
# Frontend: http://localhost:5173
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

| Dokument | Inhalt |
| --- | --- |
| [docs/architecture.md](docs/architecture.md) | Systemübersicht, Chat-Flow, Ports, Stack, Projektstruktur, Sicherheitsprinzip |
| [docs/history.md](docs/history.md) | Entwicklungshistorie — was wurde gebaut und warum (v0.0.1–v0.0.3) |
| [docs/database.md](docs/database.md) | MariaDB-Schema, Tabellenbeschreibungen, Admin-Befehle |
| [docs/roadmap.md](docs/roadmap.md) | Geplante Features mit technischen Details und Prioritäten |
| [docs/hardware.md](docs/hardware.md) | Hardware-Spezifikation Dante-Home, Laufwerk-Architektur, GPU-Potential |
