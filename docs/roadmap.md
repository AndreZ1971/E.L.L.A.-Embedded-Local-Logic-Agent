# Roadmap — E.L.L.A. Phase 2 und darüber hinaus

Dieses Dokument beschreibt geplante Features mit Begründung, Abhängigkeiten und technischen Hinweisen. Die Prioritäten spiegeln wider was E.L.L.A. vom aktuellen Entwicklungs-Prototypen zu einem brauchbaren täglichen Assistenten macht.

---

## Abgeschlossen

| Feature | Version | Beschreibung |
| --- | --- | --- |
| Chat end-to-end | v0.0.3 | OpenAI + Ollama, Tool-Loop mit bis zu 5 Runden |
| Tool-Call-Fix | v0.0.3 | `tool_call_id` korrekt weitergegeben, kein 400-Fehler mehr |
| Electron Desktop-App | v0.0.3 | Natives Fenster, Minimize-to-Tray (Dev-Modus lauffähig) |

---

## Priorität 1 — Kern-Features (unmittelbar nützlich)

### Streaming-Antworten

**Was:** Antworten des LLM werden Zeichen für Zeichen angezeigt statt erst wenn die vollständige Antwort vorliegt.

**Warum wichtig:** Ollama braucht auf CPU ca. 5-15 Sekunden für eine Antwort. GPT-4o 1-3 Sekunden. Ohne Streaming starrt der Nutzer auf einen leeren Chat und weiß nicht ob etwas passiert. Mit Streaming sieht er sofort die ersten Wörter — das macht die wahrgenommene Latenz drastisch besser.

**Technische Umsetzung:**

Backend:
```typescript
// Ollama Stream-API
const stream = await ollamaClient.chatStream(messages, tools, model);
res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache');

for await (const chunk of stream) {
  res.write(`data: ${JSON.stringify({ delta: chunk.message.content })}\n\n`);
}
res.write('data: [DONE]\n\n');
res.end();
```

Frontend:
```typescript
const eventSource = new EventSource('/api/chat/stream');
eventSource.onmessage = (e) => {
  if (e.data === '[DONE]') { eventSource.close(); return; }
  const { delta } = JSON.parse(e.data);
  setCurrentResponse(prev => prev + delta);
};
```

**Abhängigkeiten:** Keine — kann unabhängig von anderen Features gebaut werden.

**Komplexität:** Mittel. Tool-Loop-Nachrichten müssen extra behandelt werden (Tool-Ausführungen sind synchron, kein Stream).

---

### Tool-Bestätigung im Frontend

**Was:** Gefährliche Tools (`clean_temp`, `empty_recycle_bin`) werden nicht sofort ausgeführt. Das Frontend zeigt einen Bestätigungs-Dialog bevor die Aktion passiert.

**Warum wichtig:** Das LLM könnte missverstehen was der Nutzer meint. "Mach den PC sauber" sollte keine sofortige Temp-Löschung auslösen. Explizite Bestätigung verhindert unerwünschte Aktionen.

**Geplante Architektur:**

```text
LLM ruft clean_temp auf
  → toolExecutor erkennt "gefährliches" Tool
  → Eintrag in approvals-Tabelle (status: 'pending')
  → Frontend zeigt Bestätigungs-Card:
      "ELLA möchte temporäre Dateien löschen. Fortfahren?"
      [Bestätigen] [Ablehnen]
  → Nach Bestätigung: approvals-Status auf 'approved'
  → Tool wird ausgeführt, Ergebnis ans LLM
```

**Abhängigkeiten:** `approvals`-Tabelle ist bereits im Schema. Executor-Logik muss erweitert werden.

---

### Dashboard — echte Daten

**Was:** Die Dashboard-Seite zeigt echte Systemdaten statt dem aktuellen Stub.

**Geplante Widgets:**

| Widget | Tool/Quelle | Aktualisierung |
| --- | --- | --- |
| Disk-Usage (C:, E:, Z:) | `get_disk_usage` | Manuell / alle 60s |
| Aktiver LLM-Provider | `GET /api/chat/provider` | Beim Load |
| Letzte Tool-Ausführungen | `tool_executions`-Tabelle | Live |
| Offene Freigaben | `approvals`-Tabelle | Live |
| System-Events | `system_events`-Tabelle | Live |

**Abhängigkeiten:** `tool_executions`-Logging (Priorität 2) für die Ausführungs-Historie.

---

## Priorität 2 — Stabilität

### MariaDB Session-Persistenz

**Was:** Der Gesprächsverlauf wird in MariaDB gespeichert statt nur im RAM.

**Warum:** Aktuell geht der gesamte Chat-Verlauf verloren wenn die API neustartet. Für einen täglichen Assistenten ist das inakzeptabel.

**Geplante Tabelle:**

```sql
CREATE TABLE sessions (
  id           VARCHAR(255) PRIMARY KEY,      -- z.B. UUID
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE session_messages (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  session_id   VARCHAR(255) NOT NULL,
  role         ENUM('user', 'assistant') NOT NULL,
  content      TEXT NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);
```

**Migration von In-Memory:** `sessions.ts` bekommt eine DB-Implementierung. Interface bleibt gleich — `get()`, `set()`, `clear()`. Kein anderer Code ändert sich.

---

### Tool-Ausführungen loggen

**Was:** Jeder `toolExecutor.execute()`-Aufruf schreibt einen Eintrag in `tool_executions`.

**Warum:** Vollständige Nachvollziehbarkeit — was hat E.L.L.A. wann getan? Besonders für destruktive Aktionen wichtig.

**Implementierung:** Im `executor.ts` nach der Tool-Ausführung:

```typescript
await pool.execute(
  `INSERT INTO tool_executions
   (tool_name, parameters, result, status, duration_ms, session_id)
   VALUES (?, ?, ?, ?, ?, ?)`,
  [name, JSON.stringify(params), JSON.stringify(result), 'success', duration, sessionId]
);
```

**Abhängigkeiten:** Keine — kann als erste DB-Integration implementiert werden.

---

### Settings-Seite

**Was:** Die Settings-Seite im Frontend erlaubt Konfiguration ohne `.env`-Änderung und API-Neustart.

**Geplante Einstellungen:**

| Setting | Typ | Beschreibung |
| --- | --- | --- |
| Aktiver LLM-Provider | Radio | OpenAI / Ollama / Auto |
| Ollama-Modell | Dropdown | Liste aus `GET /api/ollama/models` |
| Aktivierte Tools | Checkboxen | Welche Tools das LLM aufrufen darf |
| Session-Limit | Number | Max. Nachrichten im Verlauf |

**Abhängigkeiten:** `settings`-Tabelle ist bereits im Schema. Backend braucht `GET/PUT /api/settings`-Endpunkte.

---

## Priorität 3 — Ausbau

### Regel-Editor

**Was:** Nutzer kann Automatisierungsregeln definieren: "Wenn Disk-Nutzung > 90%, räume Temp-Ordner auf."

**Geplante Architektur:**

```text
Hintergrund-Worker (alle 5 Min.)
  → System-Metriken sammeln (Disk, RAM, ...)
  → system_events schreiben
  → rules-Tabelle prüfen: Welche Trigger matchen?
  → Matching rules: approval anlegen oder direkt ausführen
```

**Abhängigkeiten:** Tool-Bestätigung, Tool-Logging, Settings-Seite.

---

### Secrets-Verwaltung

**Was:** API-Keys (OpenAI, zukünftige Services) über das Dashboard verwalten statt per `.env`-Datei.

**Sicherheits-Anforderungen:**
- Keys werden verschlüsselt in MariaDB gespeichert (AES-256)
- Master-Passwort oder Windows DPAPI zum Entschlüsseln
- Niemals im Klartext in Logs oder API-Responses

**Warum noch nicht:** Verschlüsselungs-Implementierung erfordert sorgfältige Planung. Falsch gemacht ist sie schlimmer als `.env` — da `.env` wenigstens nicht in der DB liegt und nur lokal existiert.

---

### Echtzeit-Systemstatus

**Was:** Dashboard zeigt Live-Metriken via WebSocket oder Server-Sent Events.

**Geplante Metriken:**
- CPU-Auslastung (prozentsatz)
- RAM-Nutzung (gesamt / verfügbar)
- Disk-I/O
- Aktive MariaDB-Verbindungen
- Ollama-Status (läuft / läuft nicht)
- Letzter LLM-Request (wann, welcher Provider)

**Technologie:** Server-Sent Events (SSE) — einfacher als WebSocket, ausreichend für unidirektionale Daten.

---

### GPU-Beschleunigung für Ollama

**Was:** Ollama nutzt die RTX 2080 (8 GB VRAM) für Inferenz statt der CPU.

**Aktueller Stand:** GPU-Beschleunigung ist möglich aber nicht aktiv. llama3.1:8b benötigt ~5 GB VRAM — passt in die 8 GB.

**Setup:**

```powershell
# CUDA-Toolkit installieren (falls nicht vorhanden)
# Ollama erkennt CUDA automatisch wenn Treiber korrekt sind

# Test ob GPU genutzt wird:
ollama run llama3.1:8b "Hallo"
# → Logs zeigen ob CUDA oder CPU

# GPU-Speicher in Ollama-Logs prüfen:
# "llm server loaded in X.XXs" mit GPU-Angabe
```

**Erwarteter Speedup:** 5-15 Sek. (CPU) → 0.5-2 Sek. (GPU) für eine typische Antwort.

---

## Nicht geplant (bewusste Entscheidung)

| Feature | Warum nicht |
| --- | --- |
| Multi-User | E.L.L.A. ist ein persönlicher Assistent — ein User, ein System |
| Docker-Deployment | Direkte Windows-Integration ist der Kern — Docker abstrahiert das weg |
| Cloud-Hosting | Lokale Ausführung ist Designprinzip — API-Keys für externe LLMs sind die einzige Cloud-Abhängigkeit |
| Plugin-System | Premature generalization — erst wenn klar ist was konkret gebraucht wird |
