# E.L.L.A. — Update Roadmap

Post-Launch Updates um Nutzer langfristig zu binden.
Reihenfolge nach Priorität / Aufwand noch offen.

---

## v1.1 — Spiele

- **Schach** — Zugeingabe per natürlicher Sprache, E.L.L.A. verwaltet das Brett intern, kommentiert jeden Zug mit ihrer Persönlichkeit
- **Trivia** — Fragen generieren, Antwort prüfen, Punkte zählen
- Trigger-Satz auf Deutsch: _"Wollen wir ein Spiel spielen?"_
- Referenz: WarGames (1983) + Terminator — zwei ikonische Anlehnungen in einem Produkt

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

## Ideen-Pool (noch nicht bewertet)

_(Hier sammeln wir alles was uns einfällt)_

---

> Dieses Dokument wächst mit. Jede neue Idee die nach dem Launch kommt landet hier zuerst.
