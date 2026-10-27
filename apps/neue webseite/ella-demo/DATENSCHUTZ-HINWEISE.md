# Datenschutz-Hinweise — E.L.L.A. Website-Demo

> Diese Datei enthält Fakten für Andres Datenschutzerklärung auf ella-agent.de.
> Kein juristischer Text — nur technische Fakten, die der Anwalt formulieren kann.

---

## Was die Demo tut

- Besucher können E.L.L.A. Fragen stellen (max. 15 pro Sitzung, 40 pro IP/Tag).
- Eingaben werden an die OpenAI-API (Modell: gpt-4o-mini) gesendet und gestreamt zurück.
- Die Demo läuft auf einem eigenen Server (Express.js, Port 3333).

## Was gespeichert wird

| Datum                                    | Wo        | Wie lange                                                                            |
| ---------------------------------------- | --------- | ------------------------------------------------------------------------------------ |
| Session-UUID                             | RAM (Map) | max. 30 Min. nach letzter Aktivität, dann gelöscht                                   |
| Gesprächsverlauf                         | RAM (Map) | Nur innerhalb der Session, max. 10 Nachrichten; wird mit Session gelöscht            |
| IP-Adresse (gehasht: nein, plain im RAM) | RAM (Map) | Nur für Rate-Limiting; wird bei Tageswechsel (Europe/Berlin Mitternacht) gelöscht    |
| Server-Logs                              | stdout    | Nur Zeitstempel, HTTP-Status, Dauer (ms), Zeichenanzahl — **kein Nachrichteninhalt** |

## Was NICHT gespeichert wird

- **Kein Nachrichteninhalt** in Logs, Dateien oder Datenbanken.
- **Keine Cookies** — Session-ID liegt in `sessionStorage` (browserseitig, verschwindet beim Tab-Schließen).
- **Keine Tracking-Pixel, Analytics oder externe Ressourcen** — kein Google Analytics, kein Facebook Pixel, keine CDN-Fonts.
- **Keine Datenbank** — alles nur im Arbeitsspeicher.
- **localStorage:** `ella-lang` (Sprachauswahl DE/EN), `ella-hud-widgets` (Widget-Konfiguration) — rein funktional, keine persönlichen Daten, kein Tracking. Bleibt bis der Nutzer Browserdaten löscht.

## Was an Dritte geht

| Empfänger                                     | Was wird gesendet                                                                                            | Rechtsgrundlage (Vorschlag)           |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------- |
| OpenAI (api.openai.com)                       | Nutzereingabe + Gesprächsverlauf (max. 10 Nachrichten)                                                       | Berechtigtes Interesse / Einwilligung |
| Stripe (js.stripe.com)                        | Pricing-Table-Skript wird im Kaufen-Abschnitt geladen; Stripe setzt eigene Cookies/localStorage              | Berechtigtes Interesse / Einwilligung |
| Microsoft Edge TTS (speech.platform.bing.com) | E.L.L.A.s Antworttext bei Sprachausgabe (nur Antworttext, keine Nutzereingabe); Synthese-Anfrage pro Antwort | Berechtigtes Interesse / Einwilligung |

- OpenAI erhält `store: false` — laut OpenAI-Dokumentation werden Daten mit diesem Flag nicht für Training verwendet und nicht länger als 30 Tage gespeichert.
- Stripe-Skript wird erst geladen, wenn der Kaufen-Abschnitt in den Viewport scrollt (Intersection Observer). Stripe unterliegt eigenem DPA.
- Edge TTS: Der Server sendet E.L.L.A.s Antworttext (nicht die Nutzereingabe) an Microsofts Edge-TTS-Dienst zur Sprachsynthese. Die Verbindung läuft über WebSocket an speech.platform.bing.com.

## Technische Schutzmaßnahmen

- **Rate-Limiting:** 15/Session, 40/IP/Tag, 1500 global/Tag — verhindert Missbrauch.
- **Concurrent-Lock:** Nur eine Anfrage pro Session gleichzeitig.
- **Max. 500 Zeichen** pro Nachricht (clientseitig + serverseitig).
- **Max. 300 Tokens** pro Antwort (OpenAI `max_tokens`).
- **Kein API-Key im Frontend** — Key liegt nur serverseitig in `.env`.
- **Session-IDs sind UUIDs** — nicht erratbar, nicht sequenziell.
- **AbortController:** Bei Client-Disconnect wird der OpenAI-Request abgebrochen.

## Hinweis im UI

Unter dem Eingabefeld steht permanent:

> „Du sprichst mit einer KI. Diese Website-Demo läuft über die OpenAI-API – die echte E.L.L.A. läuft lokal auf deinem PC. Bitte keine persönlichen Daten eingeben. Antworten können Fehler enthalten."

## Empfehlung für die Datenschutzerklärung

1. Abschnitt „Live-Demo" in bestehende DSE aufnehmen.
2. OpenAI als Auftragsverarbeiter / Drittanbieter nennen (Sitz: USA, DPA vorhanden).
3. Hinweis dass `store: false` gesetzt ist (keine Trainingsnutzung laut OpenAI).
4. Rechtsgrundlage klären: Einwilligung (Banner vor erster Nachricht) oder berechtigtes Interesse.
5. Aufbewahrungsfrist: 0 — alles nur im RAM, kein Persistieren.
