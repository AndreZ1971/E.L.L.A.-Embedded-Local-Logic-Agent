# Dokumentations-Prüfliste — v1.5.6

Erstellt: 2026-10-25
Methode: Jede Aussage in der Doku wird gegen den Code geprüft.

---

## Zahlen & Versionen

| Aussage                        | Datei(en)                                              | Beleg im Code                                                             | Status |
| ------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------- | ------ |
| 111 Tools                      | capabilities.md, README.md, CLAUDE.md, architecture.md | `definitions.ts`: 111× `type: "function"`                                 | ✅     |
| 389 Tests grün                 | capabilities.md                                        | `npm test` Lauf 2026-10-25                                                | ✅     |
| 107 Default-Regeln             | capabilities.md, README-en.md                          | `migrate.ts`: IDs 1–107                                                   | ✅     |
| Version v1.5.6                 | Alle Doku-Header                                       | `git describe --tags`                                                     | ✅     |
| `package.json` Desktop = 1.5.5 | fakten.md                                              | `apps/desktop/package.json` — **muss noch auf 1.5.6 aktualisiert werden** | ⚠️     |

---

## LLM & Provider

| Aussage                                                     | Datei(en)                         | Beleg im Code                                           | Status |
| ----------------------------------------------------------- | --------------------------------- | ------------------------------------------------------- | ------ |
| 3 Modi: auto/openai/ollama                                  | fakten.md, bedienungsanleitung.md | `settings.ts:368–374`, `cloudFirst()`, `cloudAllowed()` | ✅     |
| `cloudAllowed()` = provider !== "ollama" && key && !offline | fakten.md                         | `services/settings.ts`                                  | ✅     |
| `cloudFirst()` = provider === "openai" && cloudAllowed()    | fakten.md                         | `services/settings.ts`                                  | ✅     |
| Alle OpenAI-Calls über `openaiRequest()`                    | netzwerk.md, capabilities.md      | `services/openai.ts`                                    | ✅     |
| Cloud-Zähler in `system_events`                             | capabilities.md                   | `services/openai.ts`, `routes/events.ts`                | ✅     |

---

## TTS / Sprachausgabe

| Aussage                                            | Datei(en)                                   | Beleg im Code                                             | Status |
| -------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------- | ------ |
| Kokoro nur für EN/FR/ES                            | Alle Doku-Dateien                           | `tts.ts:60`: `KOKORO_LANGS = new Set(["en", "fr", "es"])` | ✅     |
| Deutsch über Edge TTS (Microsoft-Server)           | netzwerk.md, faq.md, bedienungsanleitung.md | `tts.ts`: DE nicht in KOKORO_LANGS → Edge TTS Fallback    | ✅     |
| Text wird an Microsoft übertragen                  | netzwerk.md, faq.md                         | `@andresaya/edge-tts` — Netzwerkanfrage an MS-Server      | ✅     |
| `activeTtsEngine(lang)` als Single Source of Truth | fakten.md                                   | `tts.ts`                                                  | ✅     |
| 4 Stimmen: Katja/Sonia/Elvira/Denise (Edge)        | CLAUDE.md                                   | `tts.ts` Fallback-Stimmen                                 | ✅     |
| 4 Stimmen: sarah/emma/dora/siwis (Kokoro)          | CLAUDE.md                                   | `tts.ts` Kokoro-Stimmen                                   | ✅     |

---

## Sicherheit

| Aussage                           | Datei(en)                               | Beleg im Code                                                                                 | Status |
| --------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------- | ------ |
| API bindet auf 127.0.0.1          | capabilities.md, netzwerk.md            | `index.ts:115`                                                                                | ✅     |
| Per-Start Token `randomBytes(32)` | capabilities.md                         | `apps/desktop/src/main.ts`, `middleware/apiAuth.ts`                                           | ✅     |
| CORS nur localhost:5173           | capabilities.md                         | `middleware/apiAuth.ts`                                                                       | ✅     |
| Schwärzen vor dem Speichern       | capabilities.md                         | `services/redact.ts`, integriert in `remember()`, `extractAndRemember()`, `recordClipboard()` | ✅     |
| PBKDF2 + Salt, 100k Iterationen   | capabilities.md, bedienungsanleitung.md | `services/profiles.ts`                                                                        | ✅     |

---

## Directive

| Aussage                                                         | Datei(en)                     | Beleg im Code                                                                                             | Status |
| --------------------------------------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------- | ------ |
| Genau 4 Verbote: harm, conceal, surveil, exfiltrate             | Alle                          | `services/directive.ts`, `ella-directive` Repo                                                            | ✅     |
| Hierarchie: Directive → DIRECTIVE_DENY → Deny → Allow → Execute | capabilities.md, directive.md | `services/directive.ts`, `tools/executor.ts`                                                              | ✅     |
| Directive-Repo ist öffentlich                                   | CLAUDE.md                     | `github.com/AndreZ1971/The-E.L.L.A.-Directive-` — öffentlich                                              | ✅     |
| Kein "No Deception" / "User Supremacy" in aktueller Doku        | Validierung                   | grep bestätigt: nur in history.md (historisch) und architecture.md (Default-Deny = technisches Verhalten) | ✅     |

---

## Netzwerk

| Aussage                                     | Datei(en)              | Beleg im Code                                                               | Status |
| ------------------------------------------- | ---------------------- | --------------------------------------------------------------------------- | ------ |
| Lizenzprüfung bei Start → 49.13.26.248:3010 | netzwerk.md            | `services/license.ts`                                                       | ✅     |
| Offline-Modus sperrt 6 Tools                | netzwerk.md, fakten.md | `tools/executor.ts`: OFFLINE_BLOCKED_TOOLS                                  | ✅     |
| Offline-Modus: `cloudAllowed()` → false     | fakten.md              | `services/settings.ts`                                                      | ✅     |
| LAN-Tools weiterhin im Offline-Modus        | netzwerk.md            | `scan_network`, `list_connections`, `list_devices` nicht in OFFLINE_BLOCKED | ✅     |
| Edge TTS nicht vom Offline-Modus gesperrt   | netzwerk.md            | Edge TTS Aufruf in `tts.ts`, nicht über `cloudAllowed()`                    | ✅     |
| MediaPipe von CDN beim ersten Aktivieren    | netzwerk.md, fakten.md | `gestureEngine.ts:67,110`                                                   | ✅     |

---

## Features (v1.5.0–v1.5.6)

| Aussage                                  | Datei(en)                               | Beleg im Code                                         | Status |
| ---------------------------------------- | --------------------------------------- | ----------------------------------------------------- | ------ |
| Knowledge Graph: Tripel-Extraktion       | changelog.md, capabilities.md           | `knowledge_triples`-Tabelle, `services/memory.ts`     | ✅     |
| Self-Learning aus positivem Feedback     | changelog.md, capabilities.md           | `learning_examples`-Tabelle                           | ✅     |
| Proactive Approval-Memory, 14 Kategorien | changelog.md                            | `proactive_preferences`-Tabelle                       | ✅     |
| Auto-Mute nach 5× Dismiss                | capabilities.md                         | `services/proactive.ts`                               | ✅     |
| Stop-Interrupt mit DE/EN Stop-Wörtern    | changelog.md, capabilities.md           | `STOP_INTERRUPT_RE` in `Chat.tsx`                     | ✅     |
| Follow-Up-Fenster 8 Sekunden             | capabilities.md                         | `followUpUntilRef` in `Chat.tsx`                      | ✅     |
| Diktat-Modus, systemweites Tippen        | changelog.md, bedienungsanleitung.md    | `routes/speech.ts`, `typeTextToActiveWindow()`        | ✅     |
| Diktat-Hotkey: Ctrl+Alt+Space            | bedienungsanleitung.md                  | `settings.ts:85` Default `CommandOrControl+Alt+Space` | ✅     |
| 3 Erscheinungsbilder: calm/hud/show      | capabilities.md, bedienungsanleitung.md | `settings.ts:86`, `theme.css`                         | ✅     |
| HUD-Akzentfarben: cyan/violett/bernstein | capabilities.md                         | `hudAccent`-Setting                                   | ✅     |
| Präsentationsmodus mit Privat-Filter     | changelog.md                            | `redactForShow()`                                     | ✅     |
| Multi-Agenten nur OpenAI                 | changelog.md, netzwerk.md               | `pipeline.ts:122`: `if (!cloudAllowed()) throw`       | ✅     |
| Schach-Fenster, 4 Themes                 | changelog.md, bedienungsanleitung.md    | `open_chess_window` Tool, `ChessBoard.tsx`            | ✅     |

---

## Sprachliche Korrektheit

| Prüfung                                                 | Ergebnis                                                                              | Status |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------ |
| Kein "vollständig offline" als Gesamtaussage            | grep: nur in history.md (historisch) + roadmap (Wakeword, korrekt)                    | ✅     |
| Kein "ChatGPT" im Sinne von OpenAI-Nutzung              | grep: nur in Arbeitsanweisung (intern)                                                | ✅     |
| Kein "85 Werkzeuge" / "85 Tools" in aktueller Doku      | grep: nur in Arbeitsanweisung + ella-phone-konzept (intern) + history.md (historisch) | ✅     |
| Kein "90 Tools"                                         | grep: nur in Arbeitsanweisung (intern)                                                | ✅     |
| OpenAI korrekt benannt (nicht "GPT-4o" als Produktname) | Stichprobe: README, capabilities, faq                                                 | ✅     |
| DE/EN inhaltlich gleich                                 | capabilities, bedienungsanleitung, faq, netzwerk                                      | ✅     |
| Netzwerk-Seite existiert und verlinkt                   | deutsch/netzwerk.md, english/network.md                                               | ✅     |

---

## Offene Punkte

| Problem                                               | Datei                       | Handlung                              |
| ----------------------------------------------------- | --------------------------- | ------------------------------------- |
| `apps/desktop/package.json` Version 1.5.5 statt 1.5.6 | `apps/desktop/package.json` | Vor nächstem Release aktualisieren    |
| ~~`docs/` Root-Duplikate~~                            | —                           | ✅ 13 Duplikate entfernt (2026-10-25) |
| ~~PDFs nicht neu gebaut~~                             | `scripts/build_manuals.py`  | ✅ 4 PDFs gebaut (2026-10-25)         |
