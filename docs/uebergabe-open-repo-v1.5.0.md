# Übergabe: ELLA Open Repo auf v1.5.6 aktualisieren

**Datum:** 2026-10-25
**Quell-Repo:** `github.com/AndreZ1971/E.L.L.A.git` (privat, Branch: master)
**Ziel:** ELLA Open Repo auf den aktuellen Stand v1.5.6 bringen

---

## Aktueller Stand im Haupt-Repo

- **HEAD:** `022bf44` — HUD Feinschliff
- **Letzter Tag:** `v1.5.6`
- **App-Version:** 1.5.6 (Desktop package.json noch auf 1.5.5 — **vor Release aktualisieren**)
- **Installer:** noch nicht gebaut für v1.5.6
- **Tests:** 389 Tests — alle grün
- **Build-Script:** auf v1.5.6 aktualisiert

---

## Was seit dem letzten Open-Repo-Update dazugekommen ist

### v1.3.0 — Setup-Aktionen & Netzwerk-Transparenz

- Setup-Aktionen: beliebige Tool-Calls als Makro-Schritte pro Setup
- "Jetzt ausführen"-Button im Setup-Editor
- 7 Action-Templates (open_app, set_volume, toggle_dark_mode, etc.)
- Port-Events im Dashboard (SSE, suspicious-Flag)
- WiFi-Fix (sprachunabhängig via `Get-NetConnectionProfile`)
- TCP-Fix (PS 5.1-kompatibel)
- Programm-Erkennung, Custom-Modelle, Provider-Fix
- Pipeline-Analyse mit konkreten Schwellwerten

### v1.4.0 — Schach & visuelles Brett-Erlebnis

- Schach-Fenster: rahmenloses Electron-Fenster, 4 Themes, Ambient-Glow, Partikel
- 3D-SVG-Figuren mit radialen Farbverläufen + Drop-Shadow
- Schach-KI: chess.js → LLM-Auswahl, 3 Versuche + Zufalls-Fallback
- Kommentar + Reflexion nach jedem Zug / Spielende
- Pause/Resume via localStorage
- Gedächtnis-Browser: vollständige UI zum Durchsuchen und Verwalten
- Knowledge-Graph-Visualisierung (D3 Force-Directed)
- Hardware-Detail-Tools (GPU, RAM, Laufwerke, Audio, USB)
- Webcam-Steuerung, Drucker-Steuerung
- Lokales Dokument-RAG (index_documents + search_documents)
- Multi-Monitor-Support (list_monitors + open_app_on_monitor)
- Levenshtein-Fuzzy-Matching für App-Namen

### v1.5.0 — Knowledge Graph & Intelligentes Gedächtnis

- Knowledge Graph: Subjekt/Prädikat/Objekt-Triples, Hybrid-Recall
- Dashboard-Graph: echte Relationen als lila Kanten mit Labels
- Proactive Approval-Memory: 14 Kategorien, Auto-Mute nach 5x Dismiss
- Mute-Buttons an proaktiven Nachrichten
- Rule-Based Pre-Compression (kein LLM nötig)
- Token-Output-Limits (3000 Zeichen/Tool, 500 Zeichen/JSON-String)
- Memory-Duplikat-Prävention + Deduplizierung
- Self-Learning Loop: positives Feedback → Few-Shot-Injection
- Gestensteuerung via MediaPipe Hands (Stufe 1)
- Zeitbewusstsein (Session-Dauer, Pausen, letzte Interaktion)
- qwen2.5:7b als Balanced-Tier

### v1.5.1 — Sicherheitspatch & Cloud-Governance

- Loopback-Binding (127.0.0.1), Per-Start API-Token, CORS
- `openaiRequest()` als zentrale Cloud-Funktion, Cloud-Zähler
- `cloudFirst()` / `cloudAllowed()` Pattern
- DuckDuckGo als primäre Websuche
- Cloud-Dashboard-Kachel

### v1.5.2 — Directive-Härtung & Datenschutz

- Schwärzen sensibler Daten vor dem Speichern (redact.ts)
- Ergebnis-Transparenz im System-Prompt
- Offline-Modus (offlineMode-Setting)

### v1.5.3 — Natürliches Gespräch

- Stop-Interrupt: TTS abbrechen per Sprachbefehl
- Follow-Up-Fenster: 8s nach TTS ohne Wakeword sprechen

### v1.5.4 — Diktat überall

- Diktat-Modus: Sprache → aktives Windows-Fenster (systemweit)
- Konfigurierbarer Hotkey (Ctrl+Alt+Space)

### v1.5.5 — Diktat-Qualität & Hotkey-Sicherheit

- Clipboard-Sicherung bei Diktat
- Konfigurierbarer Hotkey ohne Konflikte

### v1.5.6 — HUD-Modus & Erscheinungsbild

- 3 Erscheinungsbilder: Calm, HUD, Show (Präsentation)
- HUD-Akzentfarben, Telemetrie-Panels, Orb-Zustände
- Lokale Schriften (Chakra Petch, JetBrains Mono)
- Performance-Drosselung bei LLM-Arbeit

---

## Commits (chronologisch, älteste zuerst)

```
b03714e release(v1.0.0): Offizielle Erstveroeffentlichung
f25278d release(v1.2.0): Multi-Agenten-Pipeline + Token-Optimierung
538eb89 feat(v1.3.0): Programm-Erkennung, Custom-Modelle, Provider-Fix
67028a0 feat(setups): Setup-Actions
aa10501 feat(setups): Actions-UI in Settings
48db914 feat(setups): Jetzt-ausfuehren-Button, delay_ms, open_app-Template
4126faf docs: v1.3.0 Changelog + Bedienungsanleitung
5ffc170 feat(chess): v1.4.0 -- Schach-Fenster mit 3D-Figuren
2a8a5df feat(monitors): list_monitors + open_app_on_monitor
bc5930e feat(rag): lokales Dokument-RAG
8a0cc0d feat(apps): Levenshtein-Fuzzy-Matching
b322f7f feat(memory): Erfahrungsreflexion
034b795 feat(periphery): Drucker-Steuerung
5297656 feat(periphery): Webcam-Steuerung
97fea92 feat(hardware): Hardware-Detail-Tools
e5e16c7 feat(memories): Gedächtnis-Browser
07ff29b feat(memories): Knowledge-Graph-Visualisierung
cd71c91 feat(memories): semantischer Wissens-Graph
d4eceb8 feat(release): v1.4.0
e8c0c54 feat(rag): Dokument-Wissens-Graph & Auto-Re-Index
859ab0d feat(temporal): ELLA Zeitbewusstsein
c355c99 feat(model): qwen2.5:7b als Balanced-Tier
e37d1e8 feat(v1.5.0): Knowledge Graph, Proactive Approval-Memory, Token-Optimierung
bcb95be feat(gesture): Gestensteuerung via MediaPipe Hands
b76b39d docs: vollständige Dokumentation DE/EN für v1.5.0
aa6a433 docs: Bedienungsanleitung auf v1.5.0 aktualisiert
efca81e feat: Self-Learning Loop
```

---

## Neue DB-Tabellen (seit letztem Sync)

- `chess_games` — Schachpartien
- `knowledge_triples` — Knowledge-Graph-Triples
- `proactive_preferences` — Proaktive Nachrichten Approval/Mute
- `learning_examples` — Self-Learning goldene Q&A-Paare
- `indexed_documents` / `document_chunks` — Dokument-RAG
- `system_events` — Cloud-Request-Logging (v1.5.1)

Alle in `database/schema.sql` als `CREATE TABLE IF NOT EXISTS` — idempotent.

---

## Neue Settings-Felder

- `selfLearningEnabled` (boolean, default: true)
- `stressDetectionEnabled` (boolean, default: false)
- `indexedFolders` (string[], default: [])
- `spokenLanguage` ("de" | "en" | "es" | "fr")
- `offlineMode` (boolean, default: false)
- `dictationCorrection` (boolean, default: false)
- `dictationHotkey` (string, default: "CommandOrControl+Alt+Space")
- `appearance` ("calm" | "hud" | "show", default: "calm")
- `hudAccent` ("cyan" | "violett" | "bernstein", default: "cyan")
- `hudThrottle` (boolean, default: true)

---

## Dateien die NICHT ins Open Repo gehören

- `.env` (API-Keys, DB-Passwörter)
- `vendor/` (Binaries: MariaDB, Ollama, Node.js)
- `apps/desktop/dist-installer/` (gebaute .exe)
- `prod-node-modules/` (Production Dependencies)
- Lizenz-Server-Code / Aktivierungs-Logik (falls separat)
- `docs/tiktok-posts.md` (Marketing-intern)

---

## Checkliste für das Open Repo Update

- [ ] Alle neuen Source-Dateien kopieren / synchronisieren
- [ ] `database/schema.sql` abgleichen (neue Tabellen)
- [ ] `package.json` Versionen prüfen (Desktop → 1.5.6)
- [ ] `CLAUDE.md` aktualisieren (Feature-Stand v1.5.6)
- [ ] README.md / Dokumentation aktualisieren
- [ ] `.gitignore` prüfen (keine Secrets, keine vendor-Binaries)
- [ ] Tests laufen lassen (`npm test` → 389 grün)
- [ ] Tag setzen (`v1.5.6`)
- [ ] Push + Release erstellen

---

## Geplante nächste Schritte (nicht Teil dieses Updates)

- **v1.6.0:** LoRA Fine-Tuning Pipeline (Plan steht, noch nicht implementiert)
- **Landingpage:** Cinematische Scroll-Seite mit Videos (vorbereitet)
- **Abo-Modell:** Einmalkauf wird durch Abo ersetzt (vorbereitet)
