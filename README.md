# E.L.L.A.

**Embedded Local Logic Agent**

E.L.L.A. ist ein lokaler KI-Agent für Windows, der als Websystem aufgebaut wird und kontrolliert mit dem Betriebssystem interagiert. Ziel ist ein pragmatischer, lokaler Assistent mit sauberer Architektur, Dashboard-Ebene, klaren Tool-Grenzen und optionaler Cloud-Anbindung.

---

## Projektidee

E.L.L.A. ist keine einzelne Chat-Anwendung, sondern eine lokale Assistenzschicht über dem Betriebssystem. Die Anwendung soll natürliche Sprache verstehen, lokale Regeln ausführen, Systemzustände beobachten und nur erlaubte Aktionen auf dem Rechner ausführen.

Beispiele:

- Programme per Befehl öffnen
- Festplattenspeicher prüfen
- Temporäre Dateien bereinigen
- Papierkorb leeren
- Optional: lokale Sprachsteuerung, ML-basierte Vorhersagen, Anomalieerkennung

## Leitprinzip

E.L.L.A. trennt strikt zwischen **Verstehen** und **Ausführen**. Das Modell interpretiert Anfragen oder erzeugt strukturierte Tool-Calls, aber das Backend validiert diese immer gegen feste Regeln, Berechtigungen und Freigaben, bevor eine Aktion auf Windows ausgeführt wird.

---

## Architektur

```text
Browser (React Dashboard)
        │
        ▼
  apps/api  (Express)
   ├─ LLM-Layer  (Ollama / OpenAI)
   ├─ Tool-Registry + Executor
   └─ MariaDB
        │
        ▼
packages/agent-tools  (PowerShell / WMI)
```

### Stack

| Schicht       | Technologie                    |
|---------------|--------------------------------|
| Frontend      | React + Vite + TypeScript      |
| Backend       | Node.js + Express + TypeScript |
| Datenbank     | MariaDB                        |
| LLM lokal     | Ollama                         |
| LLM extern    | OpenAI (optional, via Backend) |
| Windows Tools | PowerShell / WMI               |

### Sicherheitsprinzip

API-Schlüssel werden nur serverseitig im lokalen Backend gespeichert und verarbeitet — niemals im React-Frontend oder direkt aus dem Browser an externe Provider gesendet.

---

## Projektstruktur

```text
ella/
├─ apps/
│  ├─ web/                  # React Dashboard  (@ella/web)
│  └─ api/                  # Node.js Backend   (@ella/api)
├─ packages/
│  ├─ shared/               # Typen, Schemas    (@ella/shared)
│  └─ agent-tools/          # Windows Tools     (@ella/agent-tools)
├─ database/
│  ├─ migrations/
│  ├─ seeds/
│  └─ schema.sql
├─ docs/
├─ logs/
├─ .env.local
└─ tsconfig.base.json
```

---

## Schnellstart

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. MariaDB starten und Schema einrichten
mysql -u root < database/schema.sql

# 3. .env.local befüllen (DB-Passwort, optionaler OpenAI-Key)

# 4. Entwicklungsmodus starten
npm run dev
# → API:  http://localhost:3001
# → Web:  http://localhost:5173
```

---

## Tool-Layer

Das Modell darf niemals freie Shell-Kommandos ausführen. Nur vordefinierte Tools in der Whitelist werden ausgeführt:

```json
{
  "tool": "open_app",
  "args": { "name": "vscode" }
}
```

Aktive Tools (V1): `open_app` · `get_disk_usage` · `clean_temp` · `empty_recycle_bin`

---

## Dashboard-Bereiche

| Bereich  | Zweck                                      |
|----------|--------------------------------------------|
| Chat     | Kommandozentrale / Konversation            |
| Tools    | Aktive Tools und Berechtigungen            |
| Rules    | Trigger, Automationen, Freigaben           |
| Secrets  | API-Keys eingeben, maskiert anzeigen       |
| Audit    | Aktionen, Entscheidungen, Fehler           |
| System   | Agent-Status, Laufzeiten, Speicherstatus   |

---

## Datenbank (MariaDB)

Kernbereiche: `rules` · `approvals` · `tool_executions` · `system_events` · `settings`

Kritische Agentenereignisse werden append-only als Events erfasst.

---

## Roadmap

### Phase 1 – Fundament
- [x] Projektstruktur
- [ ] MariaDB-Schema
- [ ] Backend-Grundlagen
- [ ] Dashboard-Grundlayout
- [ ] Ollama-Anbindung
- [ ] Tool-Registry

### Phase 2 – Agentenfunktionen
- [ ] `open_app`, `get_disk_usage`, `clean_temp`, `empty_recycle_bin`
- [ ] Provider-Konfiguration im Dashboard
- [ ] Secrets-Verwaltung
- [ ] Freigabe-Flow + Audit-Logs

### Phase 3 – Ausbau
- [ ] Regel-Editor
- [ ] Systemstatus und Metriken
- [ ] ML-Layer für Anomalieerkennung (optional)

---

## Hardware (Entwicklungsrechner)

- CPU: Intel i3, 12. Gen — Backend + lokale Services: problemlos
- RAM: 32 GB — ausreichend für Datenbank, Logs, kleine Modelle
- GPU: RTX 2080 (geplant, 8 GB VRAM) — kleine bis mittlere Ollama-Modelle
- Betrieb: Hybrid lokal (Ollama) + Cloud (OpenAI) empfohlen
