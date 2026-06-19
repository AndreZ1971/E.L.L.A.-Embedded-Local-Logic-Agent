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

```
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

**Stufe 2 — Manuell hinzufügen**

- Settings: Liste wo Nutzer Name + Pfad/Befehl eintragen kann
- Für Portable Apps und Spiele ohne Registry-Eintrag
- Bereits vorhandene `apps`-Liste in Settings als Basis nutzen

**Stufe 3 — Favoriten pinnen**

- Nutzer markiert 10–15 Programme die täglich gebraucht werden
- Kommen bei `open_app` immer zuerst, reduziert Rauschen aus großem Scan

---

## v1.5 — Stress-Erkennung in der Stimme

ELLA hört nicht nur WAS der Nutzer sagt — sondern WIE. Stress in der Stimme steckt in den Audio-Rohdaten, nicht im transkribierten Text.

**Signale die auf Stress hindeuten:**

- Erhöhte Tonhöhe (Grundfrequenz / Pitch steigt)
- Schnelleres Sprechtempo, kürzere Pausen
- Erhöhte Lautstärke / Energie im Signal
- Stimmzittern (unregelmäßiger Pitch-Verlauf)

**Technische Umsetzung:**

- Python-Bibliothek `librosa` — extrahiert Pitch, Tempo, MFCCs aus Rohsignal
- Parallel zum STT-Prozess, kein Eingriff in bestehende Spracherkennung
- Optional: vortrainiertes Emotion-Recognition-Modell via `speechbrain`
- Stress-Level (niedrig / mittel / hoch) als Kontext-Variable an den LLM

**ELLAs Reaktion:**

- Stress erkannt → sanftere Antwort, ruhigeres TTS-Tempo
- Deutlich erhöhter Stress → proaktiv: _"Du klingst angespannt — alles in Ordnung?"_
- Anhaltender Stress über mehrere Nachrichten → ins Gedächtnis schreiben
- Comeback-Briefing: _"Gestern Abend klang es stressig — wie geht's dir heute?"_

**Warum das zu ELLA passt:**
Genesis/Rachel nehmen den Menschen wahr — nicht nur seine Worte. ELLA die merkt wie es dem Nutzer geht bevor er es sagt ist ein fundamentaler Unterschied zu jedem anderen Assistenten.

---

## Ideen-Pool (noch nicht bewertet)

_(Hier sammeln wir alles was uns einfällt)_

---

> Dieses Dokument wächst mit. Jede neue Idee die nach dem Launch kommt landet hier zuerst.
