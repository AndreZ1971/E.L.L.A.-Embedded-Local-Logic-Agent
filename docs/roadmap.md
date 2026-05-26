# Roadmap — E.L.L.A. Phase 2 und darüber hinaus

Dieses Dokument beschreibt geplante Features mit Begründung, Abhängigkeiten und technischen Hinweisen. Die Prioritäten spiegeln wider was E.L.L.A. vom aktuellen Entwicklungs-Prototypen zu einem brauchbaren täglichen Assistenten macht.

---

## Abgeschlossen

| Feature                     | Version | Beschreibung                                                    |
| --------------------------- | ------- | --------------------------------------------------------------- |
| Chat end-to-end             | v0.0.3  | OpenAI + Ollama, Tool-Loop mit bis zu 5 Runden                  |
| Tool-Call-Fix               | v0.0.3  | `tool_call_id` korrekt weitergegeben, kein 400-Fehler mehr      |
| Electron Desktop-App        | v0.0.3  | Natives Fenster, Minimize-to-Tray (Dev-Modus lauffähig)         |
| SSE-Streaming               | v0.0.4  | Text erscheint live während LLM antwortet, Tool-Status-Anzeige  |
| MariaDB Session-Persistenz  | v0.0.4  | Verlauf in DB, überlebt API-Neustart, wird beim Start geladen   |
| Frameless Window + Titlebar | v0.0.5  | Eigenes Fenster ohne Browserchrome, violet Titelleiste, IPC     |
| Production Build            | v0.0.5  | Vite baut nach dist/, Electron lädt ohne Dev-Server             |
| API als Child-Prozess       | v0.0.5  | Electron startet/stoppt API automatisch, wartet auf Port 3002   |
| Autostart                   | v0.0.5  | app.setLoginItemSettings, Toggle im Tray-Menü, MariaDB auto     |
| Dashboard                   | v0.1.0  | Status-Karten (LLM, Ollama, DB) + Disk-Balken, Auto-Refresh     |
| Settings-Seite              | v0.1.0  | Provider, Modell, Tools, Session-Limit, OpenAI API-Key          |
| Programme-Verwaltung        | v0.1.0  | System-Scan (Start-Menü), Checkbox-Liste erlaubt/verboten       |
| Spracheingabe               | v0.1.1  | 3 Modi: Aus / Manuell / Wakeword "ella", submit/cancel-Wörter   |
| Tool-Bestätigung            | v0.1.1  | SSE-Pause für clean_temp / empty_recycle_bin, Card im Chat      |
| Setup-Shortcuts             | v0.1.1  | load_setup-Tool, open[] + close[], dynamische Tool-Definitionen |
| Hausaufgaben-Modus          | v0.1.2  | PIN-Kiosk: aktivieren ohne PIN, deaktivieren mit PIN, SHA-256   |
| ML-Gedächtnisebene          | v0.1.3  | nomic-embed-text, Cosinus-Suche, auto Extraktion, 3 Typen       |
| GPU-Beschleunigung          | v0.1.4  | GTX 1060, CUDA 13.0, 14.6 t/s, Modell vollständig im VRAM       |
| Sprachausgabe (TTS)         | v0.1.4  | window.speechSynthesis, Stimme einstellbar, MD-Stripping        |
| Bug-Sprint (10 Fixes)       | v0.1.5  | TS-Fehler, Tool-Registry, Settings-Persistenz, DB-Schema        |
| Code-Analyse Bug-Fixes      | v0.1.6  | HomeworkMode in loadSetup, Modell-Config, OpenAI tools[], fixes |

---

## Priorität 1 — Kern-Features (unmittelbar nützlich)

### ~~Streaming-Antworten~~ ✓ v0.0.4

**Was:** Antworten des LLM werden Zeichen für Zeichen angezeigt statt erst wenn die vollständige Antwort vorliegt.

**Warum wichtig:** Ollama braucht auf CPU ca. 5-15 Sekunden für eine Antwort. GPT-4o 1-3 Sekunden. Ohne Streaming starrt der Nutzer auf einen leeren Chat und weiß nicht ob etwas passiert. Mit Streaming sieht er sofort die ersten Wörter — das macht die wahrgenommene Latenz drastisch besser.

**Technische Umsetzung:**

Backend:

```typescript
// Ollama Stream-API
const stream = await ollamaClient.chatStream(messages, tools, model);
res.setHeader("Content-Type", "text/event-stream");
res.setHeader("Cache-Control", "no-cache");

for await (const chunk of stream) {
  res.write(`data: ${JSON.stringify({ delta: chunk.message.content })}\n\n`);
}
res.write("data: [DONE]\n\n");
res.end();
```

Frontend:

```typescript
const eventSource = new EventSource("/api/chat/stream");
eventSource.onmessage = (e) => {
  if (e.data === "[DONE]") {
    eventSource.close();
    return;
  }
  const { delta } = JSON.parse(e.data);
  setCurrentResponse((prev) => prev + delta);
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

| Widget                   | Tool/Quelle               | Aktualisierung     |
| ------------------------ | ------------------------- | ------------------ |
| Disk-Usage (C:, E:, Z:)  | `get_disk_usage`          | Manuell / alle 60s |
| Aktiver LLM-Provider     | `GET /api/chat/provider`  | Beim Load          |
| Letzte Tool-Ausführungen | `tool_executions`-Tabelle | Live               |
| Offene Freigaben         | `approvals`-Tabelle       | Live               |
| System-Events            | `system_events`-Tabelle   | Live               |

**Abhängigkeiten:** `tool_executions`-Logging (Priorität 2) für die Ausführungs-Historie.

---

## Priorität 2 — Stabilität

### ~~MariaDB Session-Persistenz~~ ✓ v0.0.4

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
  [
    name,
    JSON.stringify(params),
    JSON.stringify(result),
    "success",
    duration,
    sessionId,
  ],
);
```

**Abhängigkeiten:** Keine — kann als erste DB-Integration implementiert werden.

---

### Settings-Seite

**Was:** Die Settings-Seite im Frontend erlaubt Konfiguration ohne `.env`-Änderung und API-Neustart.

**Geplante Einstellungen:**

| Setting              | Typ        | Beschreibung                       |
| -------------------- | ---------- | ---------------------------------- |
| Aktiver LLM-Provider | Radio      | OpenAI / Ollama / Auto             |
| Ollama-Modell        | Dropdown   | Liste aus `GET /api/ollama/models` |
| Aktivierte Tools     | Checkboxen | Welche Tools das LLM aufrufen darf |
| Session-Limit        | Number     | Max. Nachrichten im Verlauf        |

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

### ~~GPU-Beschleunigung für Ollama~~ ✓ v0.1.4

**Was:** Ollama nutzt die GTX 1060 (6 GB VRAM) für Inferenz.

**Gemessen:** 14.6 tokens/sec, Modell belegt 5.8 GB VRAM — läuft vollständig auf GPU.

**Setup:** `OLLAMA_MODELS=E:\Ollama` (User-Scope), Ollama erkennt CUDA 13.0 automatisch.

---

## Nicht geplant (bewusste Entscheidung)

| Feature           | Warum nicht                                                                                         |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| Multi-User        | E.L.L.A. ist ein persönlicher Assistent — ein User, ein System                                      |
| Docker-Deployment | Direkte Windows-Integration ist der Kern — Docker abstrahiert das weg                               |
| Cloud-Hosting     | Lokale Ausführung ist Designprinzip — API-Keys für externe LLMs sind die einzige Cloud-Abhängigkeit |
| Plugin-System     | Premature generalization — erst wenn klar ist was konkret gebraucht wird                            |
