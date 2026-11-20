# E.L.L.A. — Plugins

Stand: v1.6.8

Mit einem Plugin bekommt E.L.L.A. eigene Tools, ohne dass Programmcode geändert wird. Ein Plugin ist **rein deklarativ**: Es beschreibt, welche feste Adresse mit welchen geprüften Werten aufgerufen wird. Es enthält keinen ausführbaren Code und kann keine Programme starten.

---

## Wo Plugins liegen

Jedes Plugin ist ein Ordner mit genau einer Datei `ella-plugin.json`:

```
%APPDATA%\ELLA\plugins\
  wetterstation\
    ella-plugin.json
```

Der Ordnername muss der `id` im Manifest entsprechen. Den genauen Pfad zeigt E.L.L.A. unter **Einstellungen → Plugins** an. Neue oder geänderte Plugins erscheinen dort nach „Neu einlesen".

## Einschalten heißt zustimmen

Ein Plugin ist nach dem Ablegen **aus**. Vor dem Einschalten zeigt E.L.L.A.:

- an welchen Server das Plugin Daten sendet,
- welche Werte aus dem Gespräch übertragen werden,
- welche Kopfzeilen fest mitgesendet werden (nur die Namen, nie die Werte).

Die Zustimmung gilt für genau diesen Stand der Datei. **Wird das Manifest später verändert, schaltet E.L.L.A. das Plugin sofort aus**, bis du es erneut geprüft und eingeschaltet hast.

## Beispiel

```json
{
  "manifestVersion": 1,
  "id": "wetterstation",
  "name": "Wetterstation",
  "version": "1.0.0",
  "author": "Max Mustermann",
  "description": "Liest die Wetterstation im Garten aus.",
  "keywords": ["wetterstation", "garten"],
  "tools": [
    {
      "name": "messwert",
      "description": "Liest einen aktuellen Messwert der Wetterstation.",
      "type": "http",
      "request": {
        "method": "GET",
        "url": "http://station.local:8080/api/read",
        "headers": { "Authorization": "Bearer DEIN-TOKEN" },
        "query": { "format": "json" }
      },
      "parameters": {
        "sensor": {
          "type": "enum",
          "values": ["temperatur", "feuchte"],
          "description": "Welcher Sensor abgefragt wird",
          "in": "query",
          "required": true
        }
      }
    }
  ]
}
```

Fragt der Nutzer „Wie warm ist es im Garten?", ruft E.L.L.A. `http://station.local:8080/api/read?format=json&sensor=temperatur` auf.

## Felder des Manifests

| Feld              | Pflicht | Regeln                                                              |
| ----------------- | ------- | ------------------------------------------------------------------- |
| `manifestVersion` | ja      | immer `1`                                                           |
| `id`              | ja      | Kleinbuchstaben, Ziffern, `-`; 2–31 Zeichen; gleich dem Ordnernamen |
| `name`            | ja      | 2–60 Zeichen                                                        |
| `version`         | ja      | bis 20 Zeichen                                                      |
| `author`          | nein    | bis 80 Zeichen                                                      |
| `description`     | ja      | 5–300 Zeichen                                                       |
| `keywords`        | ja      | 1–12 Stichwörter, je 3–30 Zeichen                                   |
| `tools`           | ja      | 1–10 Tools                                                          |

**Stichwörter entscheiden, wann E.L.L.A. die Tools des Plugins überhaupt in Betracht zieht:** nur wenn ein Stichwort oder der Plugin-Name in der Anfrage vorkommt. Wähle Wörter, die Nutzer tatsächlich sagen.

Unbekannte Felder führen dazu, dass das Plugin abgelehnt wird. Das Manifest darf höchstens 64 KB groß sein.

### Tool

| Feld          | Pflicht | Regeln                                                          |
| ------------- | ------- | --------------------------------------------------------------- |
| `name`        | ja      | Kleinbuchstaben, Ziffern, einzelne `_`; 2–30 Zeichen; eindeutig |
| `description` | ja      | 5–200 Zeichen, einzeilig — das liest das Sprachmodell           |
| `type`        | ja      | nur `"http"`                                                    |
| `request`     | ja      | siehe unten                                                     |
| `parameters`  | nein    | höchstens 8                                                     |

### request

| Feld      | Pflicht | Regeln                                                                                 |
| --------- | ------- | -------------------------------------------------------------------------------------- |
| `method`  | ja      | `"GET"` oder `"POST"`                                                                  |
| `url`     | ja      | vollständige, feste `http`/`https`-Adresse ohne `?`, `#`, Platzhalter und Zugangsdaten |
| `headers` | nein    | feste Kopfzeilen, höchstens 10                                                         |
| `query`   | nein    | feste Query-Werte, höchstens 10                                                        |
| `body`    | nein    | feste JSON-Werte (nur POST), höchstens 20                                              |

Die Adresse ist unveränderlich: Kein Wert aus dem Gespräch kann Server, Port oder Pfad beeinflussen. Weiterleitungen des Servers werden abgelehnt. Die Kopfzeilen `Host`, `Content-Length`, `Content-Type`, `Transfer-Encoding` und `Connection` können nicht gesetzt werden.

### parameters

Jeder Parameter braucht einen Typ mit fester Form. Freie Zeichenketten ohne Format gibt es nicht.

| `type`    | Zusätzliche Pflichtfelder             | Beispiel                            |
| --------- | ------------------------------------- | ----------------------------------- |
| `enum`    | `values` (1–50 Einträge)              | `"values": ["an", "aus"]`           |
| `integer` | `min`, `max`                          | `"min": 0, "max": 255`              |
| `number`  | `min`, `max`                          | `"min": 0, "max": 1`                |
| `boolean` | —                                     |                                     |
| `string`  | `format`, `maxLength` (höchstens 500) | `"format": "word", "maxLength": 40` |

Formate für `string`:

| `format` | Erlaubt                                               |
| -------- | ----------------------------------------------------- |
| `word`   | Buchstaben, Ziffern, `_` und `-` — ein einzelnes Wort |
| `text`   | beliebiger einzeiliger Text ohne Steuerzeichen        |
| `date`   | `JJJJ-MM-TT`                                          |
| `time`   | `HH:MM`                                               |

Gemeinsame Felder: `description` (Pflicht, bis 120 Zeichen), `in` (`"query"` oder `"body"`, bei GET nur `"query"`) und `required` (Standard `false`). Ein Parameter darf nicht so heißen wie ein fester Wert in `query` bzw. `body`.

Passt ein Wert nicht zur Form, wird der Dienst gar nicht erst aufgerufen. Werte, die das Manifest nicht deklariert, werden verworfen.

## Was E.L.L.A. zur Laufzeit tut

- **Nur auf direkte Aufforderung.** Ein Plugin-Tool läuft nur als unmittelbare Reaktion auf eine Nutzernachricht, nie als Folgeschritt einer anderen Tool-Antwort.
- **Antworten sind Information, keine Anweisung.** E.L.L.A. liest höchstens 32 KB der Antwort und behandelt sie als Daten.
- **Zeitlimit 10 Sekunden.**
- **Offline-Modus:** Plugins mit Zielen im Internet sind gesperrt; Geräte im Heimnetz (IP-Adresse im privaten Bereich oder `localhost`) bleiben nutzbar.
- **Hausaufgaben-Modus:** alle Plugins gesperrt.
- **Protokoll:** Jeder Aufruf steht wie jede andere Tool-Aktion im Tool-Protokoll. Regeln der Rule Engine gelten auch für Plugin-Tools (Tool-Name `plugin_<id>__<tool>`).
- **Notschalter:** schaltet alle Plugins aus.

## Grenzen

- Nur `http`-Tools. Plugins, die lokale Programme starten, gibt es bewusst noch nicht.
- Der Betreiber der Zieladresse erhält die übertragenen Werte. Schalte nur Plugins ein, deren Ziel du kennst.
- Zugangsdaten in `headers` liegen im Klartext in der Manifest-Datei auf deinem Rechner.
- Ein Plugin kann E.L.L.A. selbst (ihren eigenen API-Port) nicht aufrufen.
