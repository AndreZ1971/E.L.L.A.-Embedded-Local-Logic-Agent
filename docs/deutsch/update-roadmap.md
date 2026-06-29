# E.L.L.A. — Update Roadmap

Post-Launch Updates um Nutzer langfristig zu binden.
Reihenfolge nach Priorität / Aufwand noch offen.

---

## v1.1 — Spiele

- **Schach** — Zugeingabe per natürlicher Sprache, E.L.L.A. verwaltet das Brett intern, kommentiert jeden Zug mit ihrer Persönlichkeit
- Trigger-Satz: _"Wollen wir ein Spiel spielen?"_ — ELLA fragt dann welches
- Referenz: WarGames (1983) + Terminator — zwei ikonische Anlehnungen in einem Produkt

---

### Trivia — Konzept (Option B: Open Trivia DB + LLM-Bewertung)

**Datenquelle:** [opentdb.com](https://opentdb.com) — kostenlose REST-API, keine Registrierung, tausende kuratierte Fragen in 24 Kategorien, 3 Schwierigkeitsgrade (easy / medium / hard), DE + EN verfügbar.

**Spielfluss:**

```text
Nutzer:  "Wollen wir Trivia spielen?"
ELLA:    Kategorie-Auswahl anbieten (Geschichte, Wissenschaft, Sport, Filme, Musik, Geographie …)
ELLA:    Schwierigkeitsgrad abfragen — oder ELLA wählt passend zum bisherigen Score
ELLA:    Frage stellen — in ihrer Persönlichkeit formuliert, nicht trocken vorgelesen
Nutzer:  antwortet im Freitext (kein A/B/C/D-Zwang)
ELLA:    LLM bewertet ob die Antwort inhaltlich korrekt ist — flexibel, kein Exact-Match
ELLA:    kommentiert Ergebnis mit Persönlichkeit (lobt, neckt, erklärt die richtige Antwort)
→ nächste Frage oder Spielende nach X Runden
```

**Offline-Fallback:** Wenn opentdb.com nicht erreichbar → ELLA generiert Fragen selbst via LLM (Thema + Schwierigkeit als Prompt).

**Score & Persistenz (MariaDB):**

- Tabelle `trivia_scores`: Datum, Kategorie, Schwierigkeit, richtig/falsch, Gesamtpunkte
- Bestenliste pro Kategorie abrufbar: _"Was ist mein bester Trivia-Score?"_
- Streak-Tracking: wie viele richtige Antworten in Folge
- ELLA erinnert sich: _"Letztes Mal hast du bei Geschichte 7 von 10 — wollen wir das toppen?"_

**Neue Tools:**

- `start_trivia` — Spiel starten, Kategorie + Schwierigkeit übergeben
- `answer_trivia` — Antwort einreichen, LLM bewertet, Score aktualisieren
- `get_trivia_stats` — persönliche Statistik abrufen

**ELLAs Persönlichkeit im Spiel:**

- Richtige Antwort schnell: _"Beeindruckend. Aber ich hab noch härtere Fragen."_
- Falsche Antwort: _"Knapp daneben. Die richtige Antwort wäre …"_ — niemals kalt, immer mit Charakter
- Langer Streak: ELLA steigert automatisch den Schwierigkeitsgrad ohne zu fragen
- Spielende: kurze Zusammenfassung + Einordnung (_"Top 3 deiner Geschichte-Sessions"_)

---

## v1.2 — Modell-Auswahl freischalten

- LLM-Auswahl in Settings ist bereits sichtbar aber gesperrt
- Update schaltet Wechsel zwischen verfügbaren lokalen Modellen frei
- Zeigt Nutzern dass E.L.L.A. weiterentwickelt wird

---

## ~~v1.3 — Mehrsprachige Stimmen~~ ✓ Ausgeliefert in v3.8.0

- `spokenLanguage`-Setting (de/en/es/fr), unabhängig von UI-Sprache
- Kokoro: `af_sarah` / `bf_emma` / `ef_dora` / `ff_siwis` — ausschließlich weiblich
- MsEdgeTTS: Katja / Sonia / Elvira / Denise
- UI bleibt DE/EN

---

## Produktpositionierung (festgelegt)

**E.L.L.A. ist 100% lokal** — Stimme, Gedächtnis, Tools, Wakeword verlassen das Gerät nie.

- **Vollständig offline:** qualifizierte Hardware (Minimum: 8 GB RAM, dedizierte GPU ≥4 GB VRAM) + Ollama
- **OpenAI-Modus:** auf schwacher Hardware; nur der Chat-Prompt verlässt das Gerät, bewusst vom Nutzer aktiviert
- **Ollama als Offline-Fallback** (v3.8): bei fehlendem Internet übernimmt Ollama automatisch
- **Die Direktive gilt immer** — unabhängig ob Ollama oder OpenAI als Engine läuft

E.L.L.A.s Charakter-DNA:

- **E.L.L.A.** — Genesis (Terminator Genisys) + Rachel (Blade Runner): adaptiv, lernend, fast menschlich
- **E.L.L.A. ARM** — Red Queen (Raccoon City): kalt, unverhandelbar, Direktive absolut
- **E.L.L.A. HOME** — Mother (Alien): still, allgegenwärtig, eigene Protokolle

---

## v3.8 — Ollama als Offline-Fallback

- OpenAI = Standard (besser, schneller, läuft auf jeder Hardware)
- Ollama = automatischer Fallback wenn kein Internet
- Auto-Detect Internetverbindung im API-Layer
- Dezenter Modus-Indikator im Chat (welche Engine gerade aktiv)
- OllamaBanner in dieser Form obsolet → ersetzt durch Engine-Statusanzeige

---

## v1.4 — Programme: vollständiger Scan + manuelle Ergänzung

Aktueller Scan findet nur einen Bruchteil der installierten Programme. Drei Stufen:

**Stufe 1 — Scan verbessern** (deckt ~90%)

- Registry: alle drei Uninstall-Pfade (`HKLM\SOFTWARE`, `HKCU\SOFTWARE`, `HKLM\SOFTWARE\WOW6432Node`)
- Start-Menü: beide Ordner (All Users + aktueller User)
- Microsoft Store Apps + Steam/Epic via eigene Registry-Pfade

Stufe 2 — Manuell hinzufügen:

- Settings: Liste wo Nutzer Name + Pfad/Befehl eintragen kann
- Für Portable Apps und Spiele ohne Registry-Eintrag
- Bereits vorhandene `apps`-Liste in Settings als Basis nutzen

Stufe 3 — Favoriten pinnen:

- Nutzer markiert 10–15 Programme die täglich gebraucht werden
- Kommen bei `open_app` immer zuerst, reduziert Rauschen aus großem Scan

---

## ~~v1.6 — Kokoro TTS als Node.js-Service~~ ✓ Ausgeliefert in v3.9.1

- `tts_server.py` deprecated — kein Python-Prozess mehr für TTS
- `services/kokoro.ts` via `kokoro-js` npm-Paket, ONNX q8, lazy-load aus HuggingFace Hub
- Offline-Cache in `vendor/kokoro/` für Installer-Builds
- `GET /api/health` enthält `kokoro_ready`-Flag

---

## ~~v1.5 — Stress-Erkennung in der Stimme~~ ✓ Ausgeliefert in v3.9.0

ELLA hört nicht nur WAS der Nutzer sagt — sondern WIE.

**Ausgeliefert:**

- `scripts/stress_server.py` (Port 3004) — Python/numpy, keine Zusatz-Abhängigkeiten (kein librosa nötig)
- Analysiert RMS-Energie, Zero-Crossing-Rate und Pitch via Autokorrelation
- Läuft parallel zur Whisper-Transkription auf demselben WAV-Segment — kein Latenzverlust
- Stress-Level `low / medium / high` als Kontext-Hint in ELLAs Memories
- Opt-in: **Einstellungen → Stimme → Stimmanalyse aktivieren**
- Graceful Degradation: wenn Server nicht läuft, funktioniert der Chat normal

**ELLAs Reaktion (implementiert):**

- `medium`: dezenter Hint → ELLA antwortet etwas ruhiger
- `high`: _"[HINWEIS: Die Stimme des Nutzers klingt stark angespannt. Reagiere mitfühlend und ruhig.]"_ → LLM passt Ton an

**Offen für spätere Iteration:**

- Anhaltender Stress (3+ Nachrichten) → Memory-Eintrag + Comeback-Briefing
- Vortrainiertes Emotion-Recognition-Modell via `speechbrain` für höhere Genauigkeit

---

## Ideen-Pool (noch nicht bewertet)

Hier sammeln wir alles was uns einfällt.

---

> Dieses Dokument wächst mit. Jede neue Idee die nach dem Launch kommt landet hier zuerst.
