# Arbeitsanweisung: Wechselbares Erscheinungsbild – Ruhig, HUD, Präsentation

**Projekt:** E.L.L.A. — `Z:\repos\E.L.L.A`
**Vorlage:** Design-Muster „E.L.L.A. HUD-Modus" (4 Tafeln: Ruhig, HUD, Zustände der Kugel, Einstellungen)
**Ziel:** Ein Schalter wechselt zwischen drei Stilen. Funktionen und Daten bleiben in allen Stilen gleich.
**Version nach Abschluss:** v1.6.0

---

## Analyse — Was heute existiert

- Farben sind **hart codiert**: 400+ `style={{…}}` in `App.tsx`, `Chat.tsx`, `Dashboard.tsx`, `Settings.tsx` (allein 269), `AvatarPanel.tsx`, `TitleBar.tsx`. Die häufigsten Werte: `#64748b` (68×), `#2d3148` (62×), `#7c6af7` (51×), `#e2e8f0` (42×), `#94a3b8` (39×), `#f87171` (21×), `#1a1d27` (18×), `#475569` (17×), `#0f1117` (17×).
- Die Kugel ist ein 2D-Canvas-Partikelsystem in `components/AvatarPanel.tsx` mit `OrbMode = "idle" | "thinking" | "speaking"`, eingebunden in `Chat.tsx` (Z. ~1357).
- Das Nachfrage-Fenster (`followUpUntilRef`, `Chat.tsx`) ist nur eine Ref — die UI weiß nicht, wann E.L.L.A. zuhört.
- Vorhandene Datenquellen: `GET /api/system/status` (Ollama/DB), `GET /api/events/cloud-today` (Cloud-Zähler), `GET /api/homework/status`, Tool `list_monitors` (PowerShell in `executor.ts` Z. ~3265), Setups mit `schedule` in den Settings, `offline_mode` im Health-Endpoint, `provider_fallback`-SSE-Event.
- Blindmodus: `settings.accessibilityMode === "blind"`.

## Was diese Anweisung tut

1. **Phase A:** Farben in CSS-Variablen überführen — der Stil „Ruhig" sieht danach **pixelgleich** aus wie heute
2. **Phase B:** Neue Einstellungen `appearance`, `hudAccent`, `hudTelemetry`, `hudThrottle`
3. **Phase C:** Stil-Auflösung mit automatischem Rückfall auf „Ruhig"
4. **Phase D:** HUD-Layout mit Panels
5. **Phase E:** Kugel: neue Zustände + Ringe
6. **Phase F:** Präsentationsmodus
7. **Phase G:** Performance: Drosseln während E.L.L.A. rechnet
8. **Phase H:** Schriften lokal ausliefern

Jede Phase einzeln testen und committen. Nach Phase A muss die App unverändert aussehen.

---

# PHASE A — Farben als Variablen

## Schritt A1 — Theme-Datei

**Datei:** `apps/web/src/theme.css` (neu), in `main.tsx` importieren.

```css
:root,
:root[data-theme="calm"] {
  --ella-bg: #0f1117;
  --ella-surface: #1a1d27;
  --ella-surface-2: #2d3148; /* Rolle prüfen, s. A2 */
  --ella-border: #2d3148;
  --ella-border-strong: #475569;
  --ella-text: #e2e8f0;
  --ella-text-muted: #94a3b8;
  --ella-text-dim: #64748b;
  --ella-accent: #7c6af7;
  --ella-accent-soft: #a78bfa;
  --ella-danger: #f87171;
  --ella-danger-strong: #ef4444;
  --ella-danger-bg: #7f1d1d;
  --ella-warning: #f59e0b;
  --ella-success: #4ade80;
  --ella-success-strong: #22c55e;

  --ella-font-ui: Inter, system-ui, sans-serif;
  --ella-font-display: var(--ella-font-ui);
  --ella-font-data: ui-monospace, Consolas, monospace;
  --ella-radius: 8px;
  --ella-anim-speed: 1; /* Faktor für alle HUD-Animationen */
}

:root[data-theme="hud"],
:root[data-theme="show"] {
  --ella-bg: #04060c;
  --ella-surface: rgba(10, 20, 34, 0.72);
  --ella-surface-2: rgba(10, 20, 34, 0.9);
  --ella-border: rgba(79, 209, 255, 0.28);
  --ella-border-strong: rgba(79, 209, 255, 0.55);
  --ella-text: #d8f3ff;
  --ella-text-muted: #b6cddb;
  --ella-text-dim: #8fb3c9;
  --ella-accent: var(--ella-hud-accent, #4fd1ff);
  --ella-accent-soft: #7ee7ff;
  --ella-warning: #f5b14c;
  --ella-font-display: "Chakra Petch", var(--ella-font-ui);
  --ella-font-data: "JetBrains Mono", ui-monospace, monospace;
  --ella-radius: 0px;
}

:root[data-hud-accent="cyan"] {
  --ella-hud-accent: #4fd1ff;
}
:root[data-hud-accent="violett"] {
  --ella-hud-accent: #a78bfa;
}
:root[data-hud-accent="bernstein"] {
  --ella-hud-accent: #f5b14c;
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --ella-anim-speed: 0;
  }
}
```

## Schritt A2 — Hex-Werte ersetzen

In **allen** Dateien unter `apps/web/src` die hart codierten Farben durch `var(--ella-…)` ersetzen.

- Pro Vorkommen die **Rolle** prüfen (Hintergrund, Rahmen oder Text) — vor allem `#2d3148` wird für Rahmen UND Flächen genutzt → `--ella-border` bzw. `--ella-surface-2`.
- Werte, die selten vorkommen und keine klare Rolle haben, bleiben vorerst stehen; am Ende eine Liste der übrig gebliebenen Hex-Werte ausgeben.
- Inline-Styles akzeptieren `var()` direkt: `style={{ background: "var(--ella-surface)" }}`.
- Canvas-Code (`AvatarPanel.tsx`) liest Farben per `getComputedStyle(document.documentElement).getPropertyValue("--ella-accent")`.

**Abnahme Phase A:** Screenshots von Chat, Dashboard, Gedächtnis, Einstellungen vorher/nachher — **kein sichtbarer Unterschied**.

---

# PHASE B — Einstellungen

Nach der Checkliste „Neue Tools" in `CLAUDE.md` (Schritte 5, 6, 8):

**Datei:** `apps/api/src/services/settings.ts` — Interface, `DEFAULT_SETTINGS`, Migration in `loadSettings`:

```ts
appearance: "calm" | "hud" | "show"; // Standard: "calm"
hudAccent: "cyan" | "violett" | "bernstein"; // Standard: "cyan"
hudTelemetry: boolean; // Standard: true
hudThrottle: boolean; // Standard: true
```

**Datei:** `apps/api/src/routes/settings.ts` — alle vier Felder im Destructuring **und** im `raw`-Objekt (sonst werden sie ignoriert).

**Datei:** `apps/web/src/pages/settings/Settings.tsx` — neuer Abschnitt „Erscheinungsbild" nach Tafel 4 des Musters:

- Drei Stil-Karten als echte `<button aria-pressed>`: Ruhig / HUD / Präsentation mit je einer Zeile Beschreibung
- Drei Farbkreise (44 × 44 px, `aria-label`) für den Akzent
- Zwei Checkboxen mit `<label>`: „System-Anzeigen (CPU, RAM, VRAM)", „Animationen drosseln, während E.L.L.A. rechnet"
- Infokasten „Schaltet automatisch auf ‚Ruhig'": Blindmodus · Windows „Animationen reduzieren" · Hausaufgaben-Modus
- Kleine Live-Vorschau rechts (optional)

i18n: alle Texte in `de.json` / `en.json`.

---

# PHASE C — Stil-Auflösung

**Datei:** `apps/web/src/hooks/useAppearance.ts` (neu)

```ts
export type Appearance = "calm" | "hud" | "show";

export function resolveAppearance(input: {
  wanted: Appearance;
  accessibilityMode: "none" | "blind" | "deaf";
  homeworkActive: boolean;
  reducedMotion: boolean;
}): Appearance {
  if (input.accessibilityMode === "blind") return "calm";
  if (input.homeworkActive) return "calm";
  if (input.reducedMotion) return "calm";
  return input.wanted;
}
```

Der Hook:

- liest Settings + `GET /api/homework/status` + `matchMedia("(prefers-reduced-motion: reduce)")` (mit Listener auf Änderungen),
- setzt `document.documentElement.dataset.theme` und `dataset.hudAccent`,
- gibt `{ effective, wanted, forcedReason }` zurück. `forcedReason` (z. B. „Blindmodus aktiv") wird in den Einstellungen unter den Stil-Karten angezeigt, damit niemand rätselt, warum der HUD nicht erscheint.

Einbinden in `App.tsx` ganz oben.

---

# PHASE D — HUD-Layout

Nur aktiv bei `effective === "hud"`. Gemeinsame Basis in `theme.css`:

```css
:root[data-theme="hud"] body,
:root[data-theme="show"] body {
  background-color: var(--ella-bg);
  background-image:
    radial-gradient(
      ellipse at 50% 38%,
      rgba(56, 120, 255, 0.18) 0%,
      transparent 55%
    ),
    repeating-linear-gradient(
      0deg,
      rgba(79, 209, 255, 0.05) 0 1px,
      transparent 1px 40px
    ),
    repeating-linear-gradient(
      90deg,
      rgba(79, 209, 255, 0.05) 0 1px,
      transparent 1px 40px
    );
}
.hud-panel {
  background: var(--ella-surface);
  border: 1px solid var(--ella-border);
  clip-path: polygon(
    0 0,
    calc(100% - 14px) 0,
    100% 14px,
    100% 100%,
    14px 100%,
    0 calc(100% - 14px)
  );
}
.hud-label {
  font-family: var(--ella-font-display);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 2.5px;
  text-transform: uppercase;
  color: var(--ella-accent-soft);
}
```

## Schritt D1 — Navigation

`App.tsx`: Bei HUD wird die Seitenleiste zur **oberen Leiste** (Logo „E.L.L.A. // HUD" links, Menüpunkte in Großbuchstaben mittig, aktiver Punkt gefüllt in Akzentfarbe, rechts Status-Chips „● LOKAL" / „CLOUD n" / Uhrzeit). Die Chips nutzen vorhandene Daten (`/api/system/status`, `/api/events/cloud-today`, `offline_mode`). Bei Offline-Modus: Chip „OFFLINE" statt „LOKAL".

## Schritt D2 — Chat-Ansicht im HUD

`Chat.tsx`: Drei Spalten (bei schmalem Fenster untereinander):

- **Links:** `HudSystemPanel`, `HudMonitorPanel`
- **Mitte:** Kugel groß (Phase E) + Zustandstext darunter
- **Rechts:** `HudRoutinesPanel`, `HudDirectivePanel`
- **Unten:** Verlauf als Untertitel-Zeilen („DU ›" / „E.L.L.A. ›"), Tool-Chips als `[tool_name ✓]` bzw. rot `[tool_name ✗]`, Eingabezeile in Monospace

Alle Panels: `apps/web/src/components/hud/` (neu).

## Schritt D3 — Datenquellen der Panels

| Panel               | Daten                                   | Umsetzung                                                                                                                                                                                                                                                                                                                                                          |
| ------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `HudSystemPanel`    | CPU %, RAM, VRAM, Modell, Tokens/s      | **Neu:** `GET /api/system/telemetry`. CPU/RAM aus dem vorhandenen Worker-Sampling wiederverwenden, nicht neu messen. VRAM per `nvidia-smi --query-gpu=memory.used,memory.total --format=csv,noheader,nounits`; ohne NVIDIA-Karte Zeile ausblenden. Modell aus Settings. Tokens/s aus dem letzten Ollama-Response (`eval_count / eval_duration`), sonst ausblenden. |
| `HudMonitorPanel`   | Monitore + von E.L.L.A. platzierte Apps | **Neu:** `GET /api/system/monitors`. Das PowerShell-Skript aus `list_monitors` in eine Service-Funktion auslagern, die Tool **und** Route nutzen. Apps pro Monitor: aus `tool_executions` die `open_app_on_monitor`-Aufrufe der laufenden Sitzung. Keine Fenster-Überwachung darüber hinaus (`surveil`).                                                           |
| `HudRoutinesPanel`  | Setups mit Zeitplan                     | Vorhandene `settings.setups` mit `schedule`; laufende Routine mit ✓ markieren (`scheduled_setup`-Event)                                                                                                                                                                                                                                                            |
| `HudDirectivePanel` | 4 Verbote + Cloud-Zähler                | Statisch: `I · harm`, `II · conceal`, `III · surveil`, `IV · exfiltrate` (exakt diese vier — versiegelte Directive). Darunter `GET /api/events/cloud-today`.                                                                                                                                                                                                       |

Polling nur, solange der HUD sichtbar ist **und** `document.visibilityState === "visible"`; Intervall 5 s. Bei `hudTelemetry: false` wird `HudSystemPanel` nicht gerendert und nicht gepollt.

---

# PHASE E — Die Kugel

**Datei:** `apps/web/src/components/AvatarPanel.tsx`

## Schritt E1 — Zustände erweitern

```ts
type OrbMode =
  "idle" | "listening" | "thinking" | "speaking" | "cloud" | "offline";
```

Neue Props: `isListening`, `listenRemainingMs?`, `cloudActive`, `offline`.

| Zustand     | Ruhig                      | HUD (Tafel 3 des Musters)                                  |
| ----------- | -------------------------- | ---------------------------------------------------------- |
| `idle`      | wie heute                  | gedimmt, langsames Atmen                                   |
| `listening` | wie heute + Text „hört zu" | hell, **Countdown-Ring** läuft über `listenRemainingMs` ab |
| `thinking`  | wie heute                  | violett, Segment-Ringe drehen, darunter laufendes Tool     |
| `speaking`  | wie heute                  | Wellenform-Balken                                          |
| `cloud`     | Hinweis „via OpenAI"       | Bernstein-Ring + Wolken-Symbol                             |
| `offline`   | Hinweis „offline"          | eckiger Rahmen statt Ring, durchgestrichenes Funksymbol    |

Jeder Zustand unterscheidet sich in **Form**, nicht nur Farbe.

## Schritt E2 — Nachfrage-Fenster sichtbar machen

**Datei:** `Chat.tsx` — `followUpUntilRef` zusätzlich als State führen (`followUpUntil`), damit `AvatarPanel` `listening` + `listenRemainingMs` bekommt. (Offener Punkt aus v1.5.3.)

## Schritt E3 — Ringe

Im HUD liegt über dem Canvas ein `<svg aria-hidden="true">` mit:

- äußerem gepunktetem Ring + gestricheltem Ring (drehen langsam, 36 s/Umdrehung),
- zwei geneigten Ellipsen (gegenläufig, 22 s),
- Countdown-Ring (nur bei `listening`).

Drehgeschwindigkeit: `animation-duration: calc(36s / max(var(--ella-anim-speed), 0.01))`; bei `--ella-anim-speed: 0` → `animation: none`.

`cloud` wird aus dem `provider_fallback`-SSE-Event und aus `cloud_request`-Events abgeleitet (für die Dauer der jeweiligen Antwort).

---

# PHASE F — Präsentationsmodus (`show`)

Für Bildschirmaufnahmen (TikTok, Videos):

- Electron: `ipcMain.on("ella:fullscreen", (_e, on) => mainWindow?.setFullScreen(on))` + `preload.ts` → `setFullscreen(on)`. Beim Wechsel auf `show` Vollbild an, beim Verlassen aus; `Esc` verlässt `show` (lokaler Listener nur auf dem Präsentations-Container, kein globaler Keydown).
- Sichtbar: Kugel groß, Zustandstext, **nur die letzte E.L.L.A.-Antwort als Untertitel**, Tool-Chips.
- **Ausgeblendet:** gesamter Chatverlauf, eigene Nachrichten, Gedächtnis-Seite, Mail-/Kalenderinhalte in Antworten (Antworttext von Tools wie `read_emails`, `read_gmail`, `read_calendar`, `read_google_calendar` durch „[privat ausgeblendet]" ersetzen), Profilname, Pfade.
- Kleiner Hinweis oben rechts: „Präsentation · Esc beendet".

---

# PHASE G — Performance

- `hudThrottle: true` und E.L.L.A. rechnet (`isThinking`) → `document.documentElement.style.setProperty("--ella-anim-speed", "0.35")` und Canvas der Kugel auf **20 fps** begrenzen; danach zurück auf `1` / volle Rate.
- Fenster minimiert oder unsichtbar (`visibilitychange`) → alle Animationen und Polling pausieren.
- Kein `backdrop-filter: blur()` auf großen Flächen (teuer auf der GTX 1060).

---

# PHASE H — Schriften lokal

Das Muster lädt Chakra Petch und JetBrains Mono von Google Fonts. **In der App nicht** — das widerspräche dem Offline-Versprechen.

- Beide Schriften (SIL Open Font License) als `.woff2` nach `apps/web/public/fonts/`, Lizenzdateien daneben.
- `@font-face` in `theme.css` mit relativem Pfad, `font-display: swap`.
- Nur die benötigten Schnitte: Chakra Petch 600/700, JetBrains Mono 400/600.

---

# TESTS

**Web (`apps/web`, Vitest + Testing Library):**

- `resolveAppearance`: Blindmodus → `calm`; Hausaufgaben aktiv → `calm`; reduzierte Bewegung → `calm`; sonst gewünschter Stil (4 Tests)
- Präsentation: Chatverlauf und eigene Nachrichten nicht im DOM; Antwort von `read_emails` erscheint als „[privat ausgeblendet]" (2 Tests)
- `HudDirectivePanel` zeigt genau `harm`, `conceal`, `surveil`, `exfiltrate` (1 Test)
- Architektur-Test: kein `fonts.googleapis.com` und kein `fonts.gstatic.com` in `apps/web/src` und `apps/web/index.html`

**API:**

- `GET /api/system/telemetry` ohne `nvidia-smi` → kein Fehler, `vram: null`
- `GET /api/system/monitors` liefert dieselbe Liste wie das Tool `list_monitors`
- Settings: `appearance`, `hudAccent`, `hudTelemetry`, `hudThrottle` werden gespeichert und nach Neustart geladen

## Manuelle Abnahme

1. Nach Phase A: App sieht unverändert aus (Screenshots vorher/nachher)
2. HUD einschalten → obere Leiste, drei Spalten, Kugel mit Ringen; Akzentfarbe wechselt live
3. „Ella" sagen, Antwort abwarten → Countdown-Ring läuft 8 s ab
4. Blindmodus einschalten → Stil springt auf „Ruhig", Einstellungen zeigen den Grund
5. Windows: Einstellungen → Barrierefreiheit → Animationseffekte aus → Stil springt auf „Ruhig"
6. Präsentation → Vollbild, kein Verlauf sichtbar, „Lies meine Mails" zeigt „[privat ausgeblendet]", Esc beendet
7. Netzwerk trennen, App neu starten, HUD einschalten → Schriften korrekt (lokal geladen)
8. Während einer langen Antwort im Task-Manager GPU-Last beobachten: mit „Animationen drosseln" spürbar niedriger als ohne

Alle Tests grün → `CLAUDE.md` (neue Komponenten, Settings, Testzahl), README, CHANGELOG (v1.6.0) aktualisieren, Tag `v1.6.0`, commit, push.
