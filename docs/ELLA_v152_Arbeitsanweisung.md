# E.L.L.A. v1.5.2 — Arbeitsanweisung

**Datum:** 2026-10-24
**Ziel:** Drei kleine Directive-Härtungen — rein defensiv, kein neues Feature, kein Einfluss auf die Roadmap (v1.6.0 LoRA, v1.7.0 Bewusstsein).

**Quelle:** Jarvis-Analyse → Punkte 3, 4, 7

---

## Übersicht

| #   | Erweiterung                 | Directive                    | Aufwand |
| --- | --------------------------- | ---------------------------- | ------- |
| 1   | Schwärzen vor dem Speichern | `harm` (datenbezogen)        | klein   |
| 2   | Erfolg pro Aktion belegen   | `conceal`                    | klein   |
| 3   | Offline-Schalter            | `exfiltrate` sichtbar machen | klein   |

---

## 1. Schwärzen vor dem Speichern

### Problem

Passwörter, API-Tokens, IBANs und Kartennummern können heute ungeschwärzt ins Gedächtnis oder in die Clipboard-History gelangen. Die IBAN-Erkennung in `clipboardHistory.ts` erkennt das Muster zwar, speichert es aber trotzdem.

### Lösung

Neuer Service `services/redact.ts` mit einer Funktion `redact(text: string): string`, die sensible Muster durch Platzhalter ersetzt.

#### Muster (Regex)

| Typ                  | Regex                                                   | Ersatz           |
| -------------------- | ------------------------------------------------------- | ---------------- |
| API-Key / Token      | `/\b(sk-[a-zA-Z0-9]{20,})\b/g`                          | `[API-KEY]`      |
| Bearer-Token         | `/\b(Bearer\s+[A-Za-z0-9\-._~+\/]+=*)\b/g`              | `[TOKEN]`        |
| Generischer Token    | `/\b(token                                              | key              | secret | password      | passwort | passwd | pwd)\s*[:=]\s*\S+/gi` | `$1: [GESCHWÄRZT]`      |
| IBAN (DE)            | `/\bDE\d{20}\b/g`                                       | `[IBAN]`         |
| IBAN (international) | `/\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}\b/g` | `[IBAN]`         |
| Kreditkarte          | `/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g`         | `[KARTENNUMMER]` |
| Passwort-Kontext     | `/(?:passwort                                           | password         | pwd    | pin)\s*(?:ist | is       | =      | :)\s*\S+/gi`          | `[PASSWORT GESCHWÄRZT]` |

#### Einsatzstellen

1. **`services/memory.ts` → `remember()`** — `content = redact(content)` vor dem Embedding (Zeile ~46)
2. **`services/memory.ts` → `extractAndRemember()`** — `fact = redact(fact)` vor dem INSERT (Zeile ~277)
3. **`services/clipboardHistory.ts` → `recordClipboard()`** — `content = redact(content)` vor dem Speichern in der History (Zeile ~5)

#### Nicht schwärzen

- Toolargumente in `tool_executions` — die sind intern und werden nicht ins Gedächtnis übernommen
- Chat-History — der Nutzer sieht seinen eigenen Text, Schwärzung wäre verwirrend

#### Tests

- `redact.test.ts`: jedes Muster einzeln testen, Negativ-Tests (normale Texte bleiben unverändert)
- `memory.test.ts`: verifizieren dass `remember("Mein Passwort ist geheim123")` den geschwärzten Text speichert
- Clipboard-Test: `recordClipboard("DE89370400440532013000")` → History enthält `[IBAN]`

---

## 2. Erfolg pro Aktion belegen

### Problem

ELLA meldet „erledigt" auch wenn ein Tool fehlgeschlagen ist. Das Modell sieht `success: false` im Tool-Ergebnis, ignoriert es aber manchmal und formuliert es als Erfolg.

### Lösung

System-Prompt-Instruktion in `BASE_PROMPT` (`services/ollama.ts`), die das Verhalten erzwingt.

#### Neue Instruktion (einfügen nach dem GATEKEEPER-Block, ca. Zeile 108)

```
ERGEBNIS-TRANSPARENZ — PFLICHT:
Wenn ein Tool success: false zurückgibt, MUSST du das dem Nutzer klar sagen.
Sag NIEMALS "erledigt", "gemacht" oder "fertig" wenn das Tool einen Fehler gemeldet hat.
Bei Erfolg: kurz bestätigen. Bei Fehler: Fehler nennen, einmal, direkt.
Wenn du mehrere Tools hintereinander aufrufst und eines davon fehlschlägt,
melde sowohl die Erfolge als auch den Fehlschlag — nichts weglassen.
```

#### Kein Code-Umbau nötig

Die Tool-Ergebnisse enthalten bereits `success: true/false` und `error`. Das Modell sieht sie. Das Problem ist die Tendenz des Modells, Fehler zu beschönigen. Die System-Prompt-Instruktion reicht — kein Code-Eingriff im Executor.

#### Tests

- Kein Unit-Test nötig (Prompt-Änderung). Manueller Test:
  - Tool mit `success: false` provozieren (z.B. `open_app` mit nicht-existierender App)
  - Prüfen ob ELLA den Fehler klar benennt statt "erledigt" zu sagen

---

## 3. Offline-Schalter

### Problem

Es gibt keinen Weg mit einem Klick alle Netzwerk-Aufrufe zu sperren. `exfiltrate` ist architektonisch vorhanden, aber nicht sichtbar für den Nutzer.

### Lösung

Neues Setting `offlineMode: boolean` (Default: `false`). Wenn aktiviert, werden alle Tools mit Netzwerkzugriff blockiert — auf der gleichen Ebene wie die Directive.

#### Betroffene Stellen

##### A. Settings-Interface + Default

- `services/settings.ts` → `Settings`-Interface: `offlineMode: boolean` hinzufügen
- `DEFAULT_SETTINGS`: `offlineMode: false`
- `loadSettings()`: Migration für bestehende Settings

##### B. Settings-Route

- `routes/settings.ts` → PUT-Route: `offlineMode` im Destructuring UND im `raw`-Objekt

##### C. Enforcement im Executor

Neue Hilfsfunktion `isNetworkTool(name: string): boolean` die prüft ob ein Tool Netzwerkzugriff braucht.

**Netzwerk-Tools:**

- `search_web`, `web_search`, `fetch_url`
- `get_weather`, `get_location` (nutzen Online-APIs)
- `search_documents` (nur wenn Web-Quellen, nicht lokal — **prüfen**)
- `describe_webpage` (fetcht URL)

**Nicht blockieren (lokal trotz Netzwerk-Namens):**

- `scan_network`, `list_connections`, `list_devices` — lokales Netzwerk, kein Internet
- Ollama-Calls — lokaler Port 11434

Im Executor-Wrapper (`execute()`), vor dem Handler-Aufruf:

```typescript
if (getSettings().offlineMode && isNetworkTool(name)) {
  return {
    success: false,
    error: "Offline-Modus aktiv — Netzwerkzugriff gesperrt.",
  };
}
```

##### D. Cloud-Governance Integration

- `cloudAllowed()` in `settings.ts` muss `offlineMode` berücksichtigen:
  - Wenn `offlineMode === true` → `cloudAllowed()` gibt immer `false` zurück
  - Damit sind automatisch alle OpenAI-Fallbacks gesperrt

##### E. Lizenz-Check Suppression

- `routes/license.ts`: Wenn `offlineMode === true`, Startup-Verify überspringen
- Electron `main.ts`: Lizenz-Status aus Cache nutzen wenn offline

##### F. Frontend — UI

**Settings.tsx:**

- Neuer Toggle "Offline-Modus" in der Settings-Seite (Kategorie: Datenschutz)
- Beschreibung: "Sperrt alle Netzwerkzugriffe — Websuche, Wetter, Cloud und Lizenzprüfung. ELLA arbeitet vollständig offline."

**App.tsx / Titelleiste:**

- Wenn `offlineMode === true`: kleines Icon (z.B. ✈️ oder 🔒) in der Titelleiste
- Via Health-Endpoint: `GET /api/health` liefert `offline_mode: true/false`

##### G. Health-Endpoint erweitern

- `routes/health.ts` oder wo immer `/api/health` definiert ist: `offline_mode`-Flag hinzufügen

#### Tests

- `offlineMode.test.ts`:
  - `offlineMode: true` → `search_web` gibt Fehler zurück
  - `offlineMode: true` → `get_weather` gibt Fehler zurück
  - `offlineMode: true` → `cloudAllowed()` gibt `false` zurück
  - `offlineMode: true` → `list_connections` funktioniert weiterhin (lokal)
  - `offlineMode: false` → alles normal

---

## Reihenfolge der Umsetzung

1. **Schwärzen** — `redact.ts` + Einbau in `memory.ts` + `clipboardHistory.ts` + Tests
2. **Erfolg belegen** — System-Prompt-Instruktion in `ollama.ts`
3. **Offline-Schalter** — Setting + Executor-Guard + `cloudAllowed()`-Erweiterung + UI + Tests

## Abschluss-Checkliste

- [ ] Alle Tests grün (Zielzahl: ~325+)
- [ ] CLAUDE.md aktualisieren (v1.5.2 Sektion, Testzahl)
- [ ] Manuelle Tests: Schwärzung im Chat überprüfen, Offline-Toggle testen
- [ ] Tag `v1.5.2` setzen
- [ ] Committen + Pushen
