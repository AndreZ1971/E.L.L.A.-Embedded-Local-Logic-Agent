# E.L.L.A. — Update Roadmap

Post-launch updates to retain users long-term.
Order of priority / effort still to be determined.

---

## v1.1 — Games

- **Chess** — move input via natural language, E.L.L.A. manages the board internally, comments on every move with her personality
- Trigger phrase: _"Wollen wir ein Spiel spielen?"_ — ELLA then asks which game
- Reference: WarGames (1983) + Terminator — two iconic references in one product

---

### Trivia — Concept (Option B: Open Trivia DB + LLM evaluation)

**Data source:** [opentdb.com](https://opentdb.com) — free REST API, no registration required, thousands of curated questions in 24 categories, 3 difficulty levels (easy / medium / hard), DE + EN available.

**Game flow:**

```text
User:  "Wollen wir Trivia spielen?"
ELLA:  Offer category selection (history, science, sports, movies, music, geography …)
ELLA:  Ask for difficulty level — or ELLA chooses based on the current score
ELLA:  Ask the question — phrased in her personality, not read out flatly
User:  Answers in free text (no A/B/C/D forced choice)
ELLA:  LLM evaluates whether the answer is substantively correct — flexible, no exact match
ELLA:  Comments on the result with personality (praises, teases, explains the correct answer)
→ next question or end of game after X rounds
```

**Offline fallback:** If opentdb.com is unreachable → ELLA generates questions herself via LLM (topic + difficulty as prompt).

**Score & persistence (MariaDB):**

- Table `trivia_scores`: date, category, difficulty, correct/incorrect, total points
- Leaderboard per category retrievable: _"Was ist mein bester Trivia-Score?"_
- Streak tracking: how many correct answers in a row
- ELLA remembers: _"Letztes Mal hast du bei Geschichte 7 von 10 — wollen wir das toppen?"_

**New tools:**

- `start_trivia` — start a game, pass category + difficulty
- `answer_trivia` — submit an answer, LLM evaluates, update score
- `get_trivia_stats` — retrieve personal statistics

**ELLA's personality in the game:**

- Quick correct answer: _"Beeindruckend. Aber ich hab noch härtere Fragen."_
- Wrong answer: _"Knapp daneben. Die richtige Antwort wäre …"_ — never cold, always with character
- Long streak: ELLA automatically increases the difficulty level without asking
- End of game: brief summary + ranking (_"Top 3 deiner Geschichte-Sessions"_)

---

## v1.2 — Model Selection Unlock

- LLM selection in Settings is already visible but locked
- This update unlocks switching between available local models
- Shows users that E.L.L.A. is actively being developed

---

## ~~v1.3 — Multilingual Voices~~ ✓ Shipped in v3.8.0

- `spokenLanguage` setting (de/en/es/fr), independent of UI language
- Kokoro: `af_sarah` / `bf_emma` / `ef_dora` / `ff_siwis` — exclusively female voices
- MsEdgeTTS: Katja / Sonia / Elvira / Denise
- UI remains DE/EN

---

## Product Positioning (finalized)

**E.L.L.A. is 100% local** — voice, memory, tools, and wakeword never leave the device.

- **Fully offline:** qualified hardware (minimum: 8 GB RAM, dedicated GPU ≥4 GB VRAM) + Ollama
- **OpenAI mode:** on low-end hardware; only the chat prompt leaves the device, deliberately activated by the user
- **Ollama as offline fallback** (v3.8): when there is no internet connection, Ollama takes over automatically
- **The Directive always applies** — regardless of whether Ollama or OpenAI is running as the engine

E.L.L.A.'s character DNA:

- **E.L.L.A.** — Genesis (Terminator Genisys) + Rachel (Blade Runner): adaptive, learning, almost human
- **E.L.L.A. ARM** — Red Queen (Raccoon City): cold, non-negotiable, Directive absolute
- **E.L.L.A. HOME** — Mother (Alien): quiet, omnipresent, its own protocols

---

## v3.8 — Ollama as Offline Fallback

- OpenAI = default (better, faster, runs on any hardware)
- Ollama = automatic fallback when there is no internet
- Auto-detect internet connection in the API layer
- Subtle mode indicator in the chat (which engine is currently active)
- OllamaBanner in its current form becomes obsolete → replaced by engine status display

---

## v1.4 — Programs: Complete Scan + Manual Addition

The current scan finds only a fraction of installed programs. Three tiers:

**Tier 1 — Improve scan** (covers ~90%)

- Registry: all three uninstall paths (`HKLM\SOFTWARE`, `HKCU\SOFTWARE`, `HKLM\SOFTWARE\WOW6432Node`)
- Start menu: both folders (All Users + current user)
- Microsoft Store apps + Steam/Epic via their own registry paths

Tier 2 — Add manually:

- Settings: a list where the user can enter name + path/command
- For portable apps and games without a registry entry
- Use the existing `apps` list in Settings as a base

Tier 3 — Pin favorites:

- User marks 10–15 programs used daily
- Always shown first with `open_app`, reduces noise from a large scan

---

## ~~v1.5 — Stress Detection in the Voice~~ ✓ Shipped in v3.9.0

ELLA does not only hear WHAT the user says — but HOW they say it.

**Shipped:**

- `scripts/stress_server.py` (Port 3004) — Python/numpy, no additional dependencies (no librosa required)
- Analyzes RMS energy, zero-crossing rate, and pitch via autocorrelation
- Runs in parallel with Whisper transcription on the same WAV segment — no latency penalty
- Stress level `low / medium / high` as a context hint in ELLA's memories
- Opt-in: **Settings → Voice → Enable voice analysis**
- Graceful degradation: if the server is not running, chat functions normally

**ELLA's response (implemented):**

- `medium`: subtle hint → ELLA responds slightly more calmly
- `high`: _"[NOTE: The user's voice sounds severely stressed. Respond with empathy and calm.]"_ → LLM adjusts tone

**Open for future iteration:**

- Sustained stress (3+ messages) → memory entry + comeback briefing
- Pre-trained emotion recognition model via `speechbrain` for higher accuracy

---

## Ideas Pool (not yet evaluated)

Collecting everything that comes to mind.

---

> This document grows over time. Every new idea that emerges after launch lands here first.
