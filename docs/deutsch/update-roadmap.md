# E.L.L.A. — Update Roadmap

Stand: v1.5.6 · 2026-10-25

Post-Launch-Updates — was geplant war, was ausgeliefert wurde, was als Nächstes kommt.

---

## Ausgeliefert

Alle Updates die seit v1.0.0 erschienen sind, in chronologischer Reihenfolge.

| Geplant als                | Tatsächlich | Was ausgeliefert wurde                                                         |
| -------------------------- | ----------- | ------------------------------------------------------------------------------ |
| ~~Modell-Auswahl~~         | v1.0.0      | ModelSelectOverlay mit Hardware-Tier-Auswahl; Custom-Modelle ab v1.3.0         |
| ~~Mehrsprachige Stimmen~~  | v1.0.0      | `spokenLanguage` (DE/EN/ES/FR), Kokoro + Edge TTS, Onboarding-Stimmenauswahl   |
| ~~Stress-Erkennung~~       | v1.0.0      | `stress_server.py` Port 3004, numpy RMS/ZCR/Pitch, opt-in                      |
| ~~Kokoro TTS Node.js~~     | v1.0.0      | `services/kokoro.ts` via kokoro-js, ONNX q8, kein Python mehr                  |
| ~~Token-Optimierung~~      | v1.1.0      | Tool-Selector (8 Core + 20 Lazy Groups), Token-Optimizer                       |
| ~~Multi-Agenten-Pipeline~~ | v1.2.0      | Parallele/sequenzielle Pipelines mit OpenAI, Live-SSE pro Agent                |
| ~~Setup-Aktionen~~         | v1.3.0      | Tool-Calls als Makro-Schritte, 7 Action-Templates, "Jetzt"-Button              |
| ~~Schach~~                 | v1.4.0      | Rahmenloses Fenster, 4 Themes, 3D-SVG-Figuren, LLM-KI, Reflexion, Pause/Resume |
| ~~Knowledge Graph~~        | v1.5.0      | Tripel-Extraktion, Hybrid-Recall, Self-Learning, Proactive Approval-Memory     |
| ~~API-Sicherheit~~         | v1.5.1      | Loopback-Binding, Per-Start Token, CORS, Cloud-Governance (`openaiRequest()`)  |
| ~~Datenschutz~~            | v1.5.2      | Schwärzen sensibler Daten, Offline-Modus, Ergebnis-Transparenz                 |
| ~~Natürliches Gespräch~~   | v1.5.3      | Stop-Interrupt per Sprachbefehl, 8s Follow-Up-Fenster                          |
| ~~Diktat-Modus~~           | v1.5.4      | Sprache → aktives Windows-Fenster, systemweit, konfigurierbarer Hotkey         |
| ~~Diktat-Qualität~~        | v1.5.5      | Clipboard-Sicherung, Hotkey ohne Konflikte                                     |
| ~~HUD-Modus~~              | v1.5.6      | 3 Erscheinungsbilder (Calm/HUD/Show), Orb-Zustände, Telemetrie-Panels          |

---

## Produktpositionierung (aktualisiert)

**E.L.L.A. läuft lokal** — Wakeword, Gedächtnis, Tools und Regel-Engine verlassen das Gerät nie.

- **Lokal zuerst:** Ollama als primäres LLM, alle Kernfunktionen ohne Internet
- **OpenAI optional:** eigener API-Key, bewusst vom Nutzer aktiviert; `cloudFirst()` / `cloudAllowed()` steuern jeden externen Call
- **Netzwerkverbindungen:** Lizenzprüfung beim Start, Edge TTS für Deutsch (Text an Microsoft), MediaPipe-CDN bei Gestensteuerung — alles dokumentiert in [netzwerk.md](netzwerk.md)
- **Offline-Modus:** sperrt 6 Internet-Tools + alle OpenAI-Calls; Edge TTS und LAN-Tools funktionieren weiterhin
- **Die Direktive gilt immer** — unabhängig vom Provider

### Charakter-DNA

- **E.L.L.A.** — Genesis (Terminator Genisys) + Rachel (Blade Runner): adaptiv, lernend, fast menschlich
- **E.L.L.A. ARM** — Red Queen (Raccoon City): kalt, unverhandelbar, Direktive absolut _(geplant)_
- **E.L.L.A. HOME** — Mother (Alien): still, allgegenwärtig, eigene Protokolle _(geplant)_

---

## Geplante Updates

### v1.6.0 — LoRA Fine-Tuning Pipeline

- Periodisches Nachtraining mit gesammelten Feedback-Daten (positives Feedback aus Self-Learning)
- RTX 2060 12GB als Ziel-Hardware, unsloth/PEFT
- Trainingsdaten aus `learning_examples`-Tabelle

### Programme-Scan erweitern

Stufe 1 (Levenshtein-Fuzzy-Matching) ist ausgeliefert. Offen:

- **Stufe 2 — Manuell hinzufügen:** Settings-UI wo Nutzer Name + Pfad eintragen kann (für Portable Apps)
- **Stufe 3 — Favoriten pinnen:** 10–15 Programme als tägliche Favoriten markieren, kommen bei `open_app` zuerst

### Browser-Steuerung

- Chrome/Edge via DevTools Protocol — Tabs, Navigation, DOM-Zugriff
- Directive-konform: kein heimliches Surfen, Nutzer sieht was passiert

### Plugin-Verzeichnis

- Tool-Manifest-Format damit Nutzer eigene Tools registrieren können
- Erweiterbar ohne Code-Änderung

### Installer-Verbesserung

- Auto-Update-Kanal, Delta-Updates

---

## Ideen-Pool (noch nicht bewertet)

### Trivia-Spiel

- Open Trivia DB ([opentdb.com](https://opentdb.com)) als Datenquelle, LLM bewertet Freitext-Antworten
- Score-Tracking in MariaDB, Streak-System, adaptive Schwierigkeit
- Offline-Fallback: LLM generiert Fragen selbst

### Funktionales Bewusstsein (v1.7.0+)

- 3-Ebenen-Framework: Selbstwahrnehmung, Kognition, Soziales
- Empathie-Modell, Neugier-System, Werte-Reflexion
- Langfristiges Ziel — erfordert umfangreiche Forschung

### Emotion Recognition

- Vortrainiertes Modell via speechbrain (Upgrade von numpy-basierter Stress-Erkennung)
- Höhere Genauigkeit, mehr Emotionen als nur Stress-Level

### Lokale Websuche

- SearXNG selbst-gehostet als DuckDuckGo-Alternative ohne externe API

---

## Nicht geplant (bewusste Entscheidung)

| Feature                  | Warum nicht                                                                            |
| ------------------------ | -------------------------------------------------------------------------------------- |
| Cloud-Hosting            | Lokale Ausführung ist Designprinzip                                                    |
| Multi-User-Netzwerk      | Nutzerprofile sind gerätelokal, kein Netzwerk-Sharing                                  |
| Docker-Deployment        | Direkte Windows-Integration ist der Kern — Docker abstrahiert das weg                  |
| Freie Shell ohne Sandbox | `run_command` existiert — aber sandboxed (60+ Muster, immer Bestätigung)               |
| Kamera-Dauerüberwachung  | Surveillance-Risiko — Verbot III (surveil). Einzelfotos per `capture_photo` existieren |

---

> Dieses Dokument wächst mit. Jede neue Idee die nach dem Launch kommt landet hier zuerst.
