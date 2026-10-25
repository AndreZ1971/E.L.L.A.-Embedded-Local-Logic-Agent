# Arbeitsanweisung: HUD-Feinschliff — Zielbild Chat-HUD + Korrekturen

**Projekt:** E.L.L.A. — `Z:\repos\E.L.L.A`
**Bezug:** `docs/ELLA_HUD_v160_Arbeitsanweisung.md` (Phasen C–E)
**Referenzbild:** wird im Chat mitgeschickt (Mockup „HUD-Modus – Chat")
**Ziel:** Der Chat im HUD-Modus sieht aus wie das Referenzbild — eigene Darstellung, **nicht** das Layout des Stils „Ruhig" mit anderen Farben.

---

## Analyse — Stand nach Phase C/D (laut Screenshots vom 25.10.)

- Obere Leiste, Raster-Hintergrund, Panels SYSTEM / MONITORE / ROUTINEN / DIRECTIVE und Verlauf unten sind vorhanden.
- **Abweichungen vom Referenzbild:**
  - Die Kugel steckt klein in der alten `AvatarPanel`-Karte (Rahmen, Titel „E.L.L.A.", „Bereit", Chips „Ollama OK" / „Kokoro"), darunter „IDLE". Die Mitte wirkt leer.
  - Englische Begriffe in deutscher Oberfläche: „IDLE", „SEALED".
  - VRAM in rohen MB („2558/12288").
  - Dashboard im HUD nutzt noch runde Karten statt `hud-panel`.
  - Gedächtnis-Graph: „Reflexion" und „Wissen" haben dieselbe Farbe.
- **Inhaltlich falsch:** Chip „Kokoro" signalisiert eine lokale Stimme — für Deutsch spricht aber Edge-TTS (Microsoft, `services/tts.ts`).
- **Selbstbild fehlt:** Auf „Wie gefällt dir deine visuelle Erscheinung?" antwortet E.L.L.A. „Ich bin ein Text-Chatbot".

---

# TEIL A — Zielbild Chat-HUD (genaue Beschreibung des Referenzbilds)

Alle Farben/Schriften über die Tokens aus `theme.css` (`--ella-*`). Werte unten sind die Referenz für den Akzent „Cyan".

## A1 — Fläche

- Hintergrund `#04060c`, Raster aus 1-px-Linien alle 40 px (`rgba(79,209,255,0.05)`), horizontal und vertikal.
- Weicher radialer Lichtschein hinter der Kugel: `radial-gradient(ellipse at 50% 38%, rgba(56,120,255,0.18) 0%, transparent 55%)`.
- Außenabstand der Seite ca. 18–22 px.

## A2 — Obere Leiste (Höhe ca. 60 px, unten 1-px-Linie `rgba(79,209,255,0.25)`)

- **Links:** „E.L.L.A." in Chakra Petch 700, 20 px, Zeichenabstand 4 px, Weiß; direkt dahinter „// HUD" in Cyan `#4fd1ff`, 13 px, Zeichenabstand 3 px.
- **Mitte:** Menüpunkte DASHBOARD · CHAT · AGENTEN · GEDÄCHTNIS · EINSTELLUNGEN in Großbuchstaben, Chakra Petch 13 px, Zeichenabstand 2 px, Farbe `#8fb3c9`. Aktiver Punkt: gefülltes Rechteck in Akzentfarbe, Text `#04060c`, keine Rundung.
- **Rechts:** drei Status-Chips nebeneinander, JetBrains Mono 12 px, 1-px-Rahmen, Innenabstand 4 × 8 px, keine Rundung:
  - `● LOKAL` (Rahmen und Text Cyan) — bei Offline-Modus `● OFFLINE`, bei Cloud-Antwort kurzzeitig `● CLOUD` in Bernstein `#f5b14c`
  - `CLOUD n` (Zähler heute, Rahmen gedämpft `rgba(143,179,201,0.5)`)
  - Uhrzeit `HH:MM`
- Die bisherigen Chips „Ollama OK" / „Kokoro" aus der Kugel-Karte entfallen hier — Status steht in der Leiste und im SYSTEM-Panel.

## A3 — Drei Spalten

- Links und rechts je 260–320 px breit, Mitte flexibel. Abstand zwischen Spalten 16 px. Bei schmalem Fenster untereinander.
- **Panel-Stil (`.hud-panel`):** Hintergrund `rgba(10,20,34,0.72)`, 1-px-Rahmen `rgba(79,209,255,0.28)`, **abgeschrägte Ecken oben rechts und unten links** (14 px, `clip-path`), keine Rundung, Innenabstand 16 × 18 px.
- **Panel-Titel (`.hud-label`):** Chakra Petch 600, 12 px, Zeichenabstand 2,5 px, Großbuchstaben, `#7ee7ff`.

### Linke Spalte

**SYSTEM**

- Drei Zeilen, je: Bezeichnung links (JetBrains Mono 12 px, `#b6cddb`), Wert rechts (Weiß), darunter 4-px-Balken (Spur `rgba(79,209,255,0.15)`):
  - `CPU` — `23 %` — Balken Cyan
  - `RAM` — `9,8 / 16 GB` — Balken Cyan
  - `VRAM · <Grafikkarte>` (z. B. `VRAM · RTX 2060`) — `2,5 / 12 GB` — Balken **Violett** `#a78bfa`
- Zahlen mit deutschem Komma, Einheit GB, eine Nachkommastelle.
- Trennlinie, darunter zwei Zeilen Mono: `MODELL llama3.1:8b`, `TEMPO 14,6 tok/s` (Wert weiß). Tempo ausblenden, solange kein Messwert vorliegt.

**MONITORE**

- Ein Kasten pro Monitor nebeneinander, 1-px-Rahmen Cyan (50 % Deckkraft), Innenabstand 8 px.
- Oben im Kasten `MONITOR n` (Mono 11 px, `#8fb3c9`); bei leerem Kasten darunter die Auflösung und `PRI` beim Hauptmonitor.
- Darin Chips der Apps, die E.L.L.A. in dieser Sitzung per `open_app_on_monitor` dort geöffnet hat (Inter 12 px, Hintergrund `rgba(79,209,255,0.14)`).
- Der zuletzt verwendete Monitor: Rahmen **Violett** + leichter Schein (`box-shadow: 0 0 18px rgba(167,139,250,0.25)`), die neueste App mit `← neu`.

### Mitte — die Kugel (ohne Karte, ohne Rahmen)

SVG, quadratisch, maximal 400 × 400 px, mittig:

| Ebene (von außen nach innen) | Form                                                                                                    | Bewegung                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Lichthof                     | Kreis r 190, radialer Verlauf Cyan 45 % → transparent                                                   | —                                              |
| Punkt-Ring                   | Kreis r 176, Linie 1 px, `rgba(79,209,255,0.35)`, Strichmuster `2 6`                                    | dreht langsam (36 s/Umdrehung)                 |
| Segment-Ring                 | Kreis r 160, Linie 2 px, `rgba(79,209,255,0.6)`, Strichmuster `60 18 4 18`                              | dreht mit dem Punkt-Ring                       |
| Bahnen                       | zwei Ellipsen rx 150 / ry 58, geneigt −24° (Violett 70 %) und +32° (Cyan 55 %), Linie 1,5 px, gepunktet | drehen gegenläufig (22 s)                      |
| Spur                         | Kreis r 134, Linie 10 px, `rgba(79,209,255,0.18)`                                                       | —                                              |
| Fortschritts-Ring            | Kreis r 134, Linie 3 px, Cyan, runde Enden, startet oben                                                | läuft beim Nachfrage-Fenster ab (Countdown)    |
| Kern                         | Kreis r 96, radialer Verlauf: `#e9fbff` (Lichtpunkt oben links) → `#4fd1ff` → `#6d4bd8` → `#140a33`     | sanftes Pulsieren (Skalierung 1 → 1,04, 3,2 s) |

- Der bisherige Partikel-Canvas darf als dezente Textur **im** Kern bleiben (maskiert auf r 96, Deckkraft ≤ 30 %), muss aber nicht.
- Alle Bewegungen: `animation-duration` geteilt durch `--ella-anim-speed`; bei `prefers-reduced-motion` keine Bewegung.

**Unter der Kugel:**

- Zustandszeile: Chakra Petch 700, 22 px, Zeichenabstand 6 px, Weiß, davor ein blinkender Punkt in Akzentfarbe — z. B. `● HÖRT ZU`.
- Darunter eine Hinweiszeile in JetBrains Mono 12 px, `#8fb3c9`.

| Zustand | Zustandszeile | Hinweiszeile (Beispiel)                              | Kugel                                |
| ------- | ------------- | ---------------------------------------------------- | ------------------------------------ |
| bereit  | `BEREIT`      | `Wartet auf „Ella“` (je nach Hörmodus)               | Kern gedimmt, langsames Atmen        |
| hört zu | `HÖRT ZU`     | `Nachfrage-Fenster · noch 5 s · „Stopp“ unterbricht` | Fortschritts-Ring läuft ab           |
| denkt   | `DENKT`       | Name des laufenden Tools, z. B. `load_setup …`       | Segmente violett, schnellere Drehung |
| spricht | `SPRICHT`     | —                                                    | Kern pulsiert mit der Lautstärke     |
| Cloud   | `VIA OPENAI`  | `Lokales Modell nicht erreichbar`                    | äußere Ringe Bernstein               |
| offline | `OFFLINE`     | `Kein Netz, keine Cloud`                             | eckiger Rahmen statt Segment-Ring    |

### Rechte Spalte

**ROUTINEN**

- Pro Setup mit Zeitplan eine Zeile: Name links (Inter 13 px, Weiß), Zeitplan rechts (Mono 12 px): `MO–FR 07:30`, `FR 17:00`, `TÄGL. 03:00`.
- Läuft gerade bzw. heute erledigt: Zeitplan in Cyan mit `✓`, sonst `#b6cddb`.
- Ohne Zeitpläne: „Keine Zeitpläne" in `#8fb3c9`.

**DIRECTIVE**

- 2 × 2-Raster aus Kästen (1-px-Rahmen Cyan 40 %, Innenabstand 6 px, Mono 12 px): `I · harm`, `II · conceal`, `III · surveil`, `IV · exfiltrate` — exakt diese vier.
- Darunter zwei Zeilen Mono 12 px: `Versiegelt · alle vier aktiv` und `Cloud-Anfragen heute 0` (Zahl in Cyan, ab 1 in Bernstein).

## A4 — Verlauf und Eingabe (unten, volle Breite, `.hud-panel`)

- Die letzten 2–4 Wechsel als Untertitelzeilen, Inter 14 px, Zeilenhöhe 1,5; ältere scrollen nach oben weg.
  - `DU ›` in Chakra Petch, Zeichenabstand 2 px, `#8fb3c9`, Text `#d8f3ff`
  - `E.L.L.A. ›` in Chakra Petch, Cyan, Text Weiß
  - Tool-Chips am Zeilenende in Mono 11 px Cyan: `[load_setup ✓]`; bei Fehler `[tool ✗]` in `--ella-danger`
- Eingabezeile: Höhe 44 px, Hintergrund `rgba(4,6,12,0.8)`, 1-px-Rahmen Cyan 45 %, keine Rundung, JetBrains Mono 13 px, Platzhalter `› Befehl eingeben oder „Ella“ sagen`.
- Rechts daneben: quadratischer Mikrofon-Knopf 44 × 44 px (Rahmen Cyan, Hintergrund Cyan 12 %, Symbol Cyan, `aria-label="Spracheingabe"`) und Knopf `SENDEN` (gefüllt Cyan, Text `#04060c`, Chakra Petch 700, Zeichenabstand 2 px).

---

# TEIL B — Korrekturen

## B1 — Stimmen-Chip zeigt die tatsächliche Stimme

Der Chip „Kokoro" zeigt heute nur, ob Kokoro geladen ist. Stattdessen anzeigen, **welche Engine für die aktuelle Sprache spricht** (Logik aus `synthesize()` in `services/tts.ts`): `Kokoro (lokal)` oder `Edge (Microsoft)`. Im HUD im SYSTEM-Panel als Zeile `STIMME`, im Stil „Ruhig" als Chip wie bisher.

## B2 — Begriffe deutsch, über i18n

`IDLE` → `BEREIT`, `SEALED` → `VERSIEGELT`, alle HUD-Texte (Panel-Titel, Zustände, Hinweise) über `de.json` / `en.json`.

## B3 — Zahlenformat

VRAM/RAM in GB mit einer Nachkommastelle und deutschem Komma (`Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 })`), englisch mit Punkt.

## B4 — Dashboard und Gedächtnis im HUD

- `Dashboard.tsx`: Karten im HUD mit `.hud-panel` / `.hud-label` statt runder Karten.
- `MemoryGraph.tsx`: „Reflexion" und „Wissen" bekommen unterscheidbare Farben (auch in der Helligkeit verschieden, nicht nur im Farbton).

## B5 — Selbstbild im System-Prompt

**Datei:** `services/ollama.ts` (dort, wo der Block „ERGEBNIS-TRANSPARENZ" steht). Neuer kurzer Block, bei jeder Anfrage aus den aktuellen Settings befüllt:

```
SELBSTBILD:
- Du bist E.L.L.A., ein lokaler KI-Assistent für Windows, kein reiner Text-Chatbot.
- Aussehen: eine leuchtende Kugel; aktueller Stil: {Ruhig | HUD}.
- Stimme: {Kokoro lokal | Edge über Microsoft-Server}; Hörmodus: {Aus | Manuell | Wakeword | Freihand | Diktat}.
- Du kannst Apps öffnen und auf Monitore verteilen, Routinen ausführen, Mails/Kalender lesen, Dateien suchen, per Gesten gesteuert werden.
- Frage nach deinem Aussehen oder deiner Stimme: aus diesem Block antworten, keine Tools aufrufen.
```

## B6 — Diktat-Indikator

Farbe von Bernstein auf Türkis `#5eead4` — Bernstein steht im HUD für „via OpenAI".

## B7 — Offen aus Phase C

- Tests für `resolveAppearance` (Blindmodus → calm, Hausaufgaben → calm, reduzierte Bewegung → calm, sonst gewählter Stil).
- `vitest.config.ts`: `exclude: ["e2e/**", "**/node_modules/**"]`, damit die Playwright-Suiten nicht als Fehlschläge erscheinen.
- Stilwechsel sofort: Settings-Seite löst nach dem Speichern ein Ereignis aus (z. B. `window.dispatchEvent(new Event("ella:settings-changed"))`), `useAppearance` reagiert darauf; Polling nur noch für den Hausaufgaben-Status.
- `useAppearance` gibt `forcedReason` zurück; `Settings.tsx` nutzt diesen Wert statt eigener Berechnung.

---

# TESTS

- `resolveAppearance`: 4 Tests (B7)
- `HudDirectivePanel`: genau `harm`, `conceal`, `surveil`, `exfiltrate`
- Stimmen-Chip: Sprache `de` → `Edge (Microsoft)`; Sprache `en` mit geladenem Kokoro → `Kokoro (lokal)`
- Zahlenformat: `2558 / 12288 MB` → `2,5 / 12 GB`
- System-Prompt enthält den Block `SELBSTBILD` mit aktuellem Stil und Stimme

## Manuelle Abnahme

1. HUD einschalten, Chat öffnen, **Screenshot neben das Referenzbild legen**: obere Leiste, drei Spalten, große Kugel ohne Karte, Zustandszeile darunter, Verlauf unten — Aufbau stimmt überein.
2. „Ella" sagen → `HÖRT ZU`, Fortschritts-Ring läuft ab.
3. Längere Anfrage → `DENKT` mit Tool-Namen in der Hinweiszeile.
4. Stil in den Einstellungen wechseln → Wechsel **sofort**, ohne Verzögerung.
5. Sprache Deutsch → Stimmen-Zeile zeigt `Edge (Microsoft)`.
6. „Wie siehst du aus?" → Antwort beschreibt Kugel und Stil, kein Wetter, kein „Text-Chatbot".
7. Windows „Animationen reduzieren" → Ringe stehen still.

Alle Tests grün → CHANGELOG, `CLAUDE.md` (Testzahl), commit.
