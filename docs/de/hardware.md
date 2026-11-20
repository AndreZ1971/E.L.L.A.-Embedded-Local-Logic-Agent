# E.L.L.A. – Hardware-Leitfaden

Version 1.6.9

Verbindlich sind die Angaben auf [ella-agent.de](https://ella-agent.de). Dieser Leitfaden erklärt sie.

---

## Kurzfassung

E.L.L.A. läuft auf den meisten Windows-Rechnern der letzten Jahre. Am besten läuft sie mit einer NVIDIA-Grafikkarte, denn das Sprachmodell wird in den Speicher der Grafikkarte geladen. Ohne passende Grafikkarte rechnet der Prozessor – das funktioniert, ist aber langsamer.

> **Was ist VRAM?** VRAM ist der Arbeitsspeicher der Grafikkarte. Das Sprachmodell wird dorthin geladen. Je mehr VRAM, desto flüssiger antwortet E.L.L.A.

---

## Systemanforderungen

| Komponente      | Minimum                          | Empfohlen                     |
| --------------- | -------------------------------- | ----------------------------- |
| Betriebssystem  | Windows 10/11 (64 Bit)           | Windows 11                    |
| Prozessor       | Intel i3 (12. Gen) / AMD Ryzen 3 | Intel i5/i7 / AMD Ryzen 5/7   |
| Arbeitsspeicher | 8 GB                             | 16 GB                         |
| Grafikkarte     | NVIDIA GTX 1060 (6 GB VRAM)      | NVIDIA RTX 2060+ (12 GB VRAM) |
| Speicher        | 10 GB SSD                        | 20 GB SSD                     |

Mit der Minimal-Ausstattung läuft E.L.L.A., antwortet aber langsamer. Mit der empfohlenen Ausstattung antwortet sie flüssig.

Beim ersten Start prüft E.L.L.A. deine Hardware und schlägt ein passendes Sprachmodell vor. Du bestätigst die Auswahl, bevor etwas geladen wird.

---

## Mit und ohne Grafikkarte

### Mit NVIDIA-Grafikkarte

Hat dein Rechner eine NVIDIA-Grafikkarte mit genug VRAM, läuft das Sprachmodell direkt auf der Grafikkarte. Das ist die schnellste Variante.

Das Standardmodell ist `llama3.1:8b`. Auf einer Karte mit 12 GB VRAM passt es vollständig in den Grafikspeicher. Reicht der Grafikspeicher nicht ganz, rechnet der Prozessor einen Teil mit – dann antwortet E.L.L.A. langsamer.

| Grafikkarte               | VRAM     | Erfahrung mit E.L.L.A.                        |
| ------------------------- | -------- | --------------------------------------------- |
| RTX 2060 12 GB und mehr   | ab 12 GB | flüssig – empfohlene Ausstattung              |
| RTX 3060 8 GB und ähnlich | 8 GB     | gut                                           |
| GTX 1060 6 GB und ähnlich | 6 GB     | Minimum – läuft, je nach Auslastung langsamer |

> **Hinweis:** AMD-Grafikkarten werden von Ollama unter Windows nur eingeschränkt unterstützt. Funktioniert die Beschleunigung nicht, rechnet automatisch der Prozessor.

### Ohne Grafikkarte

Ohne passende Grafikkarte berechnet der Prozessor die Antworten. Das funktioniert, dauert aber spürbar länger.

**Tipp:** Mit einem eigenen **OpenAI-Key** kann E.L.L.A. die Antworten von OpenAI berechnen lassen. Dann ist die eigene Hardware weniger wichtig. Dafür gehen deine Nachrichten an OpenAI, und OpenAI rechnet die Nutzung mit dir ab.

| Einstellung    | Geschwindigkeit                             | Daten                      |
| -------------- | ------------------------------------------- | -------------------------- |
| Ollama (lokal) | mit Grafikkarte schnell, sonst langsamer    | bleiben auf deinem Rechner |
| OpenAI         | gleichmäßig schnell                         | gehen an OpenAI            |
| Auto           | zuerst lokal, OpenAI nur als Ausweichlösung | je nach Anfrage            |

---

## Funktioniert E.L.L.A. auf meinem Laptop?

Ja, ab 8 GB Arbeitsspeicher (16 GB empfohlen). Wie schnell sie antwortet, hängt von der Grafikkarte ab:

| Laptop                         | Erfahrung                                             |
| ------------------------------ | ----------------------------------------------------- |
| mit starker NVIDIA-Grafikkarte | wie ein Desktop-Rechner                               |
| mit kleiner NVIDIA-Grafikkarte | funktioniert, antwortet langsamer                     |
| ohne eigene Grafikkarte        | funktioniert, ist aber langsam – OpenAI-Key empfohlen |

**Akku:** Das Sprachmodell braucht viel Energie. Am Laptop empfiehlt sich der Netzbetrieb.

Reicht die Leistung für die aufwendigen Erscheinungsbilder HUD oder Aura nicht aus, bleibt E.L.L.A. von selbst beim schlichten Erscheinungsbild „Ruhig“.

---

## Automatische Beschleunigung

E.L.L.A. schaltet zwei Optimierungen von Ollama selbst ein: **Flash Attention** beschleunigt die Verarbeitung deiner Anfragen, und eine sparsame Ablage des Zwischenspeichers verringert den Bedarf an Grafikspeicher. Du musst nichts einstellen.

---

## Speicherplatz

| Bestandteil                      | Größe (ca.) | Hinweis                                         |
| -------------------------------- | ----------- | ----------------------------------------------- |
| Installer                        | 1 GB        | enthält Datenbank, Ollama und weitere Bausteine |
| Sprachmodell `llama3.1:8b`       | 5 GB        | wird beim ersten Start einmalig geladen         |
| Gedächtnis-Modell                | 0,3 GB      | für Erinnerungen und Dokument-Wissen            |
| Kopie des Installers für Updates | 1 GB        | Grundlage dafür, dass Updates klein bleiben     |
| Datenbank                        | wächst      | mit der Nutzung                                 |

Den größten Teil belegt das Sprachmodell. Sein Download zeigt Fortschritt, Geschwindigkeit und Restzeit an.

---

## Häufige Fragen zur Hardware

### Kann ich ein kleineres Sprachmodell wählen?

Ja. Unter **Einstellungen → LLM** wählst du ein anderes Hardware-Profil oder trägst den Namen eines eigenen Ollama-Modells ein. Kleinere Modelle brauchen weniger Grafikspeicher und antworten schneller, verstehen aber schwierige Anfragen schlechter. Nicht jedes Modell kann Werkzeuge benutzen – mit `llama3.1:8b` ist E.L.L.A. erprobt.

### Mein Rechner hat nur 8 GB Arbeitsspeicher – geht das?

Ja, 8 GB sind das Minimum. Schließe andere Programme, wenn E.L.L.A. langsam wird. Empfohlen sind 16 GB.

### Brauche ich eine SSD?

Empfohlen. Eine SSD beschleunigt den Start von E.L.L.A. und das Laden des Sprachmodells deutlich.

### Kann ich E.L.L.A. und Spiele gleichzeitig nutzen?

Belegt das Sprachmodell den Grafikspeicher, bleibt für Spiele wenig übrig. Beende E.L.L.A. vor dem Spielen über das Symbol im Infobereich.

---

_E.L.L.A. v1.6.9_

_Weitere Dokumentation: [FAQ](faq.md) – [Netzwerkverbindungen](netzwerk.md) – [Bedienungsanleitung](bedienungsanleitung.md)_
