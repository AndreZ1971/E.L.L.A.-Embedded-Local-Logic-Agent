# E.L.L.A. -- Hardware-Leitfaden

Version 1.5.7 -- Zuletzt aktualisiert: 2026-10-28

---

## Kurzfassung

ELLA läuft auf den meisten Windows-Rechnern der letzten 5 Jahre. Für die beste Erfahrung empfehlen wir eine **dedizierte Grafikkarte mit mindestens 10 GB Videospeicher (VRAM)**. Ohne Grafikkarte funktioniert ELLA ebenfalls -- dann übernimmt der Prozessor die KI-Berechnung, was langsamer ist.

> **Was ist VRAM?** VRAM (Video RAM) ist der Arbeitsspeicher deiner Grafikkarte. Das KI-Modell wird komplett in diesen Speicher geladen. Je mehr VRAM vorhanden ist, desto größere und bessere Modelle kann ELLA nutzen.

---

## Systemanforderungen

### Minimum (funktioniert, aber langsam)

| Komponente      | Anforderung                                     |
| --------------- | ----------------------------------------------- |
| Betriebssystem  | Windows 10/11 (64-Bit)                          |
| Prozessor       | Intel Core i3 / AMD Ryzen 3 (oder vergleichbar) |
| Arbeitsspeicher | 16 GB RAM                                       |
| Grafikkarte     | Nicht zwingend nötig (siehe unten)              |
| Festplatte      | 20 GB freier Speicherplatz                      |

Mit dieser Konfiguration läuft ELLA, aber die KI antwortet spürbar langsamer -- besonders ohne Grafikkarte. Ein OpenAI-Key (optional, kostenpflichtig) kann die Antwortgeschwindigkeit deutlich verbessern, weil die Berechnung dann in der Cloud stattfindet.

### Empfohlen (flüssige Nutzung)

| Komponente      | Anforderung                                                  |
| --------------- | ------------------------------------------------------------ |
| Betriebssystem  | Windows 10/11 (64-Bit)                                       |
| Prozessor       | Intel Core i5 / AMD Ryzen 5 (oder besser)                    |
| Arbeitsspeicher | 32 GB RAM                                                    |
| Grafikkarte     | NVIDIA mit 10-12 GB VRAM (z.B. RTX 3060 12GB, RTX 2060 12GB) |
| Festplatte      | 40 GB freier Speicherplatz (SSD empfohlen)                   |

Mit dieser Konfiguration antwortet ELLA flüssig und alle lokalen Funktionen arbeiten ohne Verzögerung.

---

## Mit und ohne Grafikkarte

### Mit NVIDIA-Grafikkarte (GPU-Modus)

Wenn dein Rechner eine NVIDIA-Grafikkarte mit genügend VRAM hat, läuft das KI-Modell direkt auf der Grafikkarte. Das ist die schnellste Variante -- ELLA antwortet in wenigen Sekunden.

**Deine Grafikkarte braucht mindestens 10 GB VRAM**, um das Standard-Modell (qwen2.5:14b, 14 Milliarden Parameter) vollständig laden zu können. Mit weniger VRAM wird ein Teil der Berechnung auf den Prozessor ausgelagert, was langsamer ist.

> **Was sind Parameter?** Ein KI-Modell besteht aus Milliarden gelernter Zahlenwerte -- den "Parametern". Mehr Parameter bedeuten in der Regel besseres Sprachverständnis und präzisere Antworten, brauchen aber auch mehr Speicherplatz.

**VRAM-Richtwerte:**

| Grafikkarte                   | VRAM   | Erfahrung mit ELLA                                                  |
| ----------------------------- | ------ | ------------------------------------------------------------------- |
| RTX 4060 Ti 16GB              | 16 GB  | Hervorragend -- viel Spielraum                                      |
| RTX 3060 12GB / RTX 2060 12GB | 12 GB  | Sehr gut -- empfohlene Konfiguration                                |
| RTX 3060 8GB / RTX 2060 6GB   | 6-8 GB | Eingeschränkt -- kleineres Modell nötig oder Prozessor-Mischbetrieb |
| GTX 1060 6GB                  | 6 GB   | Nur mit kleinerem Modell nutzbar                                    |

> **Hinweis:** AMD-Grafikkarten (Radeon) werden von Ollama unter Windows experimentell über Vulkan unterstützt. Die Ergebnisse können je nach Modell variieren. Ohne funktionierende GPU-Beschleunigung übernimmt automatisch der Prozessor.

### Ohne Grafikkarte (CPU-Modus)

Ohne passende Grafikkarte berechnet der Prozessor (CPU) die KI-Antworten. Das funktioniert, ist aber deutlich langsamer -- je nach Prozessor etwa 3-10 Sekunden pro Antwortbeginn statt unter 2 Sekunden mit GPU.

**Tipp:** Mit einem **OpenAI-Key** (optional, eigener Schlüssel) kann ELLA die Antworten über das Internet berechnen lassen. Die Berechnung findet dann auf OpenAI-Servern statt und ist unabhängig von deiner Hardware sehr schnell. Dafür werden Gesprächsdaten an OpenAI übertragen.

### Mit OpenAI-Key (Cloud-Modus)

Wenn du einen eigenen OpenAI-API-Key einträgst, nutzt ELLA wahlweise oder zusätzlich OpenAI für Chat-Antworten. In diesem Fall ist die lokale Hardware weniger wichtig -- selbst ein älterer Laptop ohne Grafikkarte liefert dann schnelle Antworten.

| Modus          | Geschwindigkeit              | Datenschutz                     | Hardware-Anforderung |
| -------------- | ---------------------------- | ------------------------------- | -------------------- |
| Lokal (Ollama) | GPU: schnell, CPU: langsamer | Alles bleibt auf deinem Rechner | GPU empfohlen        |
| Cloud (OpenAI) | Immer schnell                | Daten gehen an OpenAI           | Gering               |
| Auto           | Automatisch der beste        | Mischung                        | GPU empfohlen        |

---

## Funktioniert ELLA auf meinem Laptop?

**Ja** -- ELLA läuft auf jedem Windows-Laptop mit mindestens 16 GB RAM. Die Erfahrung hängt davon ab, ob dein Laptop eine dedizierte Grafikkarte hat:

| Laptop-Typ                                 | Erfahrung                                          |
| ------------------------------------------ | -------------------------------------------------- |
| Gaming-Laptop mit NVIDIA-GPU (10+ GB VRAM) | Sehr gut -- wie ein Desktop                        |
| Laptop mit kleinerer NVIDIA-GPU (4-8 GB)   | OK -- langsamerer KI-Modus oder kleineres Modell   |
| Laptop ohne dedizierte Grafikkarte         | Funktioniert, aber langsam -- OpenAI-Key empfohlen |

**Akku-Hinweis:** Die KI-Berechnung verbraucht viel Energie. Am Laptop empfehlen wir den Netzbetrieb während der ELLA-Nutzung.

---

## Flash Attention -- Automatische Beschleunigung

ELLA aktiviert automatisch **Flash Attention** -- eine Optimierung, die die Verarbeitung deiner Anfragen bis zu 12-mal schneller macht. Du musst nichts konfigurieren; die Funktion ist standardmäßig aktiv.

> **Was ist Flash Attention?** Eine Technik, die die Art und Weise optimiert, wie das KI-Modell deinen Text verarbeitet. Statt den gesamten Text auf einmal im Speicher zu halten, wird er in kleineren Stücken effizienter verarbeitet. Das spart Speicher und beschleunigt die Antwort.

Zusätzlich nutzt ELLA eine **KV-Cache-Optimierung**, die den Videospeicher-Verbrauch reduziert, ohne die Antwortqualität merklich zu beeinträchtigen.

---

## Speicherplatz

ELLA benötigt Speicherplatz für folgende Komponenten:

| Komponente              | Größe (ca.) | Hinweis                              |
| ----------------------- | ----------- | ------------------------------------ |
| ELLA-Installation       | 300 MB      | Programmdateien + gebundelte Dienste |
| KI-Modell (qwen2.5:14b) | 8,4 GB      | Wird beim ersten Start geladen       |
| Gedächtnis-Modell       | 274 MB      | Für Erinnerungen und Suche           |
| Sprachmodell (Kokoro)   | 80 MB       | Für lokale Sprachausgabe             |
| Datenbank               | 50-500 MB   | Wächst mit der Nutzung               |
| **Gesamt (Start)**      | **~10 GB**  |                                      |

Der größte Anteil ist das KI-Modell. Es wird einmalig beim ersten Start heruntergeladen.

---

## Häufige Fragen zur Hardware

### Kann ich ein kleineres KI-Modell wählen?

Ja. In den Einstellungen unter **LLM** kannst du ein anderes Modell eintragen, das du in Ollama geladen hast. Kleinere Modelle (z.B. mit 3 oder 7 Milliarden Parametern) brauchen weniger VRAM und antworten schneller, verstehen aber komplexe Anfragen weniger gut.

### Mein Rechner hat nur 8 GB RAM -- geht das?

Nicht empfohlen. Das KI-Modell allein braucht mehrere GB Arbeitsspeicher. Mit 8 GB RAM bleibt zu wenig Platz für Windows und ELLA gleichzeitig. 16 GB sind das Minimum, 32 GB sind empfohlen.

### Brauche ich eine SSD?

Nicht zwingend, aber empfohlen. Eine SSD beschleunigt den Start von ELLA und das Laden des KI-Modells erheblich.

### Kann ich ELLA und Spiele gleichzeitig nutzen?

Wenn die GPU vollständig vom KI-Modell belegt ist, bleibt kein VRAM für Spiele. Bei Grafikkarten mit viel VRAM (16+ GB) ist parallele Nutzung möglich. Ansonsten empfehlen wir, ELLA über das Tray-Symbol zu beenden, bevor du spielst.

---

_E.L.L.A. v1.5.7 -- Proprietär -- Alle Rechte vorbehalten_

_Weitere Dokumentation: [FAQ](faq.md) -- [Netzwerk](netzwerk.md) -- [Bedienungsanleitung](bedienungsanleitung.md)_
