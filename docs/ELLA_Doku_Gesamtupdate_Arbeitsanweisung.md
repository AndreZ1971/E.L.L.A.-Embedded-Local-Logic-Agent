# Arbeitsanweisung: Dokumentation komplett auf den aktuellen Stand

**Projekt:** E.L.L.A. — `Z:\repos\E.L.L.A`
**Ziel:** Jede Aussage in der Dokumentation stimmt mit dem Code überein. Überzogen formulieren ist erlaubt, falsche Fakten nicht.
**Version nach Abschluss:** keine eigene Version — Doku-Commit auf den aktuellen Stand

---

## Grundregeln (gelten für jede Datei)

1. **Der Code ist die Quelle.** Zahlen, Funktionsnamen, Modi und Grenzen werden aus dem Code ermittelt, nicht aus älteren Dokus übernommen.
2. **Zahlen nicht schätzen, zählen:** Tools aus `apps/api/src/tools/definitions.ts`, Tests aus dem letzten `npm test`-Lauf, Version aus `apps/desktop/package.json` und dem letzten Git-Tag.
3. **Deutsch zuerst, Englisch spiegeln.** `docs/deutsch/` ist führend, `docs/english/` wird inhaltsgleich nachgezogen. README.md / README-en.md und CLAUDE.md / CLAUDE-en.md ebenso.
4. **Directive und E.L.L.A. nie vermischen.** Die Directive ist ein eigenes, MIT-lizenziertes, versiegeltes Regelwerk (eigenes Repo `AndreZ1971/The-E.L.L.A.-Directive-`, öffentlich). E.L.L.A. ist das proprietäre Produkt, das die Directive als festen Bestandteil nutzt.
5. **OpenAI korrekt benennen:** „OpenAI-API mit eigenem Key (optional)". Nie „ChatGPT".
6. **Rechtstexte nicht inhaltlich ändern** (EULA, Nutzungsbedingungen, Datenschutz). Abweichungen nur in der Prüfliste melden, Andre entscheidet.
7. **Keine Behauptung ohne Beleg:** Für jede Fakten-Aussage in README, FAQ und Funktionsübersicht einen Eintrag in der Prüfliste (Schritt 6).

---

## Schritt 1 — Bestandsaufnahme

Liste aller Doku-Dateien mit Stand-Angabe erstellen (nur als Arbeitsliste, nicht committen):

- Root: `README.md`, `README-en.md`, `CHANGELOG.md`, `CLAUDE.md`, `CLAUDE-en.md`
- `docs/` (Root-Ebene): prüfen, ob die Dateien Duplikate von `docs/deutsch/` sind (z. B. `bedienungsanleitung.md` existiert in beiden mit unterschiedlicher Größe). **Ergebnis festhalten:** Welche Fassung ist führend? Veraltete Duplikate nach Rücksprache entfernen oder als Weiterleitung („siehe docs/deutsch/…") kürzen.
- `docs/deutsch/`, `docs/english/`, `docs/intern/`
- PDFs: `ELLA-Bedienungsanleitung.pdf`, `ELLA-User-Manual.pdf`, EULA-PDFs (werden über `scripts/build_manuals.py` erzeugt)
- `apps/landing/index.html` (nur Fakten prüfen, Neubau der Website ist separat)

## Schritt 2 — Faktenblatt aus dem Code

Neue Datei `docs/intern/fakten.md` — eine Seite, aus dem Code ermittelt, Grundlage für alle anderen Dateien:

| Thema                                                    | Wo im Code nachsehen                                                                                 |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Version                                                  | `apps/desktop/package.json`, `git describe --tags`                                                   |
| Anzahl Tools + Liste nach Kategorien                     | `apps/api/src/tools/definitions.ts`                                                                  |
| Anzahl Tests                                             | letzter `npm test`-Lauf (Vitest, ohne Playwright-E2E)                                                |
| LLM-Modi `ollama` / `auto` / `openai` und ihre Bedeutung | `routes/chat.ts`, `services/settings.ts` (`cloudAllowed`, `cloudFirst`)                              |
| Cloud-Gateway, Cloud-Zähler, Offline-Modus               | `services/openai.ts` (`openaiRequest`), `routes/events.ts`, `tools/executor.ts` (`NETWORK_TOOLS`)    |
| Sprachausgabe: welche Engine für welche Sprache          | `services/tts.ts` (`KOKORO_LANGS`, `synthesize`)                                                     |
| Spracherkennung                                          | `services/whisper.ts`                                                                                |
| Hörmodi                                                  | Settings `voiceMode`, `Chat.tsx` (Stopp-Wörter, Nachfrage-Fenster, Diktat)                           |
| Diktat-Tastenkürzel                                      | `apps/desktop/src/main.ts` (`globalShortcut`)                                                        |
| Erscheinungsbild-Stile + automatischer Rückfall          | `services/settings.ts` (`appearance`), `hooks/useAppearance.ts`                                      |
| Sicherheit der lokalen API                               | `middleware/apiAuth.ts`, `index.ts` (`127.0.0.1`)                                                    |
| Schwärzen                                                | `services/redact.ts`                                                                                 |
| Profile, PIN                                             | `services/profiles.ts`                                                                               |
| Gestensteuerung                                          | `web/src/services/gestureEngine.ts`                                                                  |
| Monitore                                                 | Tools `list_monitors`, `open_app_on_monitor`                                                         |
| Routinen                                                 | Setups mit `schedule`, Worker                                                                        |
| Multi-Agenten                                            | `services/pipeline.ts` — **Hinweis: läuft derzeit nur über OpenAI** (prüfen, ob inzwischen geändert) |
| Gedächtnis                                               | `services/memory.ts`, Tabellen `memories`, `knowledge_triples`, `learning_examples`                  |
| Backup / Export                                          | `routes/backup.ts`                                                                                   |
| Mindest-/Empfohlene Hardware                             | `docs/deutsch/hardware.md` + Modell-Tiers im Onboarding                                              |

## Schritt 3 — Netzwerkverbindungen ehrlich dokumentieren

Neuer Abschnitt in `docs/deutsch/faq.md` (bzw. eigene Seite `docs/deutsch/netzwerk.md`, in FAQ und README verlinkt): **„Wann verbindet sich E.L.L.A. mit dem Internet?"**

Alle Verbindungen aus dem Code auflisten, je mit: wann, wohin, was wird gesendet, wie abschaltbar. Mindestens prüfen:

- Lizenzprüfung beim Start (Lizenzserver, gehashter Hardware-Fingerprint; offline-tolerant)
- **Deutsche Sprachausgabe über Edge-TTS (Microsoft-Server)** — der vorgelesene Text wird übertragen; lokale Stimme für Deutsch in Arbeit
- Kokoro-Stimmmodell und Whisper-Modell: einmaliger Download beim ersten Start (HuggingFace)
- Ollama-Modelle: Download bei Modellwahl
- Gestensteuerung: Modell-Download von jsdelivr / Google beim Aktivieren (falls noch nicht lokal ausgeliefert — im Code prüfen)
- Websuche (DuckDuckGo), Wetter, Standort, Webseiten abrufen — nur auf Anfrage
- Google (Gmail, Kalender) — nur wenn verbunden
- OpenAI-API — nur mit eigenem Key und gewähltem Modus; jede Anfrage im Cloud-Zähler
- Was der Offline-Modus sperrt — und was (noch) nicht

Formulierung README danach: „Keine Telemetrie. Netzwerk nur für Lizenzprüfung und für Online-Funktionen, die du nutzt." — nicht mehr „Netzwerkzugriff nur auf ausdrücklichen Befehl" oder „vollständig offline".

## Schritt 4 — Bekannte Fehler in der bestehenden Doku korrigieren

Mindestens diese Stellen (in allen Sprachen und Duplikaten):

- „85 Werkzeuge" / „90 Tools" → Zahl aus Schritt 2
- Directive mit fünf Regeln (No Deception, Default-Deny, User Supremacy …) → **genau vier**: harm, conceal, surveil, exfiltrate
- „Default-Deny: E.L.L.A. fragt vor jeder Aktion" → korrekt: Directive-Verbote sind gesperrt, kritische Aktionen brauchen Bestätigung, übrige Tools sind per Regel erlaubt
- „Vollständig lokale Sprache" → Englisch/Französisch/Spanisch lokal (Kokoro), Deutsch derzeit über Microsoft (Edge-TTS)
- `auto`-Modus = „lokal zuerst, OpenAI nur bei Ausfall des lokalen Modells"
- `CLAUDE.md`: Directive-Repo als „privat" bezeichnet → öffentlich
- `docs/deutsch/roadmap.md`: Stand „v3.9.1 · 2026-06-28" → aktualisieren; „Kamera-Integration: nicht geplant" widerspricht Gestensteuerung und `capture_photo` → Eintrag anpassen (Kamera nur lokal, keine Aufnahme, sichtbar aktiv); „Spracherkennung lokal" als offen geführt → erledigt
- **Versionsnummern:** `history.md` / `roadmap.md` nutzen interne Nummern (v3.x), die Releases heißen v1.x. Am Anfang beider Dateien einen Satz ergänzen, der das erklärt — oder auf Release-Nummern umstellen.
- Mindestanforderungen in README, `hardware.md` und Landingpage vereinheitlichen
- Öffentliches Audit-Log → das Protokoll ist lokal

## Schritt 5 — Neue Funktionen seit v1.5.0 aufnehmen

In Funktionsübersicht (`capabilities.md`), Bedienungsanleitung und CHANGELOG — Details aus dem Code:

- Sicherheit v1.5.1: lokale API nur auf 127.0.0.1 mit Token, Cloud-Gateway, Cloud-Zähler, Modi neu definiert
- v1.5.2: Schwärzen sensibler Daten, Ergebnis-Transparenz, Offline-Modus
- v1.5.3: Stopp-Wörter, Nachfrage-Fenster ohne erneutes „Ella"
- v1.5.4: Diktat in jedes Fenster (Tastenkürzel aus `main.ts`)
- v1.5.5 / v1.5.6 / v1.6: Erscheinungsbild „Ruhig" und „HUD" (+ ggf. weitere im Code vorhandene Stile), automatischer Rückfall, HUD-Panels, Selbstbild
- Hörmodi: Aus · Manuell · Wakeword · Freihand · Diktat — und dass „Pause" in jedem Modus funktioniert
- Gestensteuerung, Monitore erkennen und Apps gezielt öffnen
- Gedächtnis: Browser, Graph, Bearbeiten, Duplikate löschen, Export/Import

Bedienungsanleitung: neue Screenshots für beide Stile vormerken (Platzhalter `[Screenshot: …]`, Andre liefert die Bilder).

## Schritt 6 — Prüfliste

Neue Datei `docs/intern/doku-pruefliste.md`: Tabelle **Aussage · Datei der Doku · Beleg im Code · Status (✓ / geändert / offen)**. Alle Fakten-Aussagen aus README, FAQ, `capabilities.md`, `hardware.md`, Landingpage. Offene Punkte (z. B. Rechtstexte) am Ende gesondert für Andre.

## Schritt 7 — PDFs und öffentliches Repo

- PDFs mit `scripts/build_manuals.py` neu erzeugen, Ergebnis prüfen (Umlaute, Tabellen).
- Öffentliches Doku-Repo `AndreZ1971/E.L.L.A.-Embedded-Local-Logic-Agent`: Liste der Dateien, die nach dem Update dorthin gehören (README, README.de, `docs/`, CHANGELOG, SECURITY) — **nicht selbst pushen**, Andre gibt frei. Ablauf nach `docs/uebergabe-open-repo-v1.5.0.md`. Dort steht noch Release 1.5.0 — vermerken.

---

## Abnahme

1. `grep` über alle Doku-Dateien: kein „85 Werkzeuge", kein „90 Tools", kein „No Deception", kein „User Supremacy", kein „vollständig offline", kein „ChatGPT" im Sinne von E.L.L.A.s OpenAI-Nutzung.
2. Directive überall mit genau vier Verboten.
3. Netzwerk-Seite vorhanden, aus FAQ und README verlinkt, Edge-TTS ausdrücklich genannt.
4. Deutsch und Englisch inhaltsgleich (Abschnittsüberschriften gegeneinander prüfen).
5. Prüfliste vollständig, offene Punkte für Andre markiert.
6. PDFs neu erzeugt.

Dann committen (`docs: Gesamtupdate auf <Version>`), kein Tag nötig.
