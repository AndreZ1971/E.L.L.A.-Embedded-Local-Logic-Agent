# E.L.L.A — Embedded Local Logic Agent

Lokaler Windows KI-Assistent als Electron-Desktop-App. Läuft vollständig offline via Ollama (llama3.1:8b), optional mit OpenAI GPT-4o. Aktueller Stand: v0.0.2.

## Stack

- **Backend**: Express, TypeScript, MariaDB (Port 3306, E:\MariaDB)
- **Frontend**: React 18, Vite (Port 5173)
- **Desktop**: Electron 33 + electron-vite (WIP)
- **LLM**: Ollama (llama3.1:8b, Port 11434) + OpenAI GPT-4o (optional)
- **Mono-Repo**: npm workspaces

## Projektstruktur

```
apps/
  api/        Express-Server (Port 3002)
  web/        React-Frontend (Port 5173)
  desktop/    Electron-Wrapper (WIP)
packages/
  shared/     Geteilte Typen + Utilities
  agent-tools/ LLM Tool-Definitionen + Ausführung
```

## Wichtige Befehle

```bash
# Alles starten (Root)
npm run dev                    # API + Web parallel (concurrently)

# Einzeln
npm run dev --workspace=apps/api     # API auf :3002
npm run dev --workspace=apps/web     # Web auf :5173

# Build-Reihenfolge (wichtig: shared → agent-tools → api → web)
npm run build

# Desktop (separater Schritt)
cd apps/desktop && npm run build:main
cd apps/desktop && npm run dev

# Tests + Lint
npm test
npm run lint

# Ollama prüfen
Invoke-RestMethod -Uri "http://localhost:11434/api/tags"
```

## MariaDB

- Server: `E:\MariaDB\server`, Daten: `E:\MariaDB\data`
- Windows-Service: `sc start MariaDB` / `sc stop MariaDB`
- Port: 3306

## Konventionen

- TypeScript ES2022, strict mode, NodeNext module resolution
- CommonJS-zu-ESM Bridge beachten — `import` vs `require` je nach Paket
- Änderungen an `packages/shared` immer zuerst builden, dann Consumer
- Desktop noch WIP — electron-vite Build kann instabil sein

## Was vermeiden

- `ELECTRON_RUN_AS_NODE` nicht setzen — bricht Desktop-Start
- MariaDB-Passwort nicht in Settings-Dateien (`.env` nutzen)
- `node_modules` in Electron nicht direkt editieren
- Ollama muss laufen bevor API gestartet wird (oder OpenAI-Fallback konfiguriert)

## Git

```
https://github.com/AndreZ1971/E.L.L.A.git
```







<!-- cloude-code-toolbox:mcp-skills-awareness-begin -->

### MCP & Skills awareness (Cloude Code ToolBox)

_Last synced: 2026-05-28T04:46:47.851Z._

- **Full report:** `.claude/cloude-code-toolbox-mcp-skills-awareness.md` in this workspace (auto-overwritten on each scan). Use it as ground truth for configured servers and skill folders.
- **MCP:** For **live tools** in Claude Code, enable the matching server via `/mcp`. Servers are configured in `~/.claude.json` (user) and `.mcp.json` (project).
- **When the user’s task matches a server** (e.g. Confluence work and a **Confluence** / **Atlassian** MCP is listed), **prefer that server id** and plan on tool use—not only file search.
- **Skills:** Folders below contain `SKILL.md`; attach or cite paths in chat when relevant.

#### Workspace MCP

- `z:\repos\E.L.L.A\.mcp.json` _(workspace: E.L.L.A)_ — _file missing_

_No active workspace servers in mcp.json._

#### User MCP

- `C:\Users\JannR\.claude.json` — _no servers defined_

_No active user-scoped servers in mcp.json._

#### Project skills

_None found (or no workspace open)._

#### User skills

_None found._

<!-- cloude-code-toolbox:mcp-skills-awareness-end -->
