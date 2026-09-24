# Hardware-Anforderungen — E.L.L.A.

---

## Systemanforderungen

| Komponente     | Minimum                   | Empfohlen                    |
| -------------- | ------------------------- | ---------------------------- |
| Betriebssystem | Windows 10 64-Bit         | Windows 11 64-Bit            |
| RAM            | 16 GB                     | 32 GB                        |
| GPU            | NVIDIA GTX 1060 6 GB VRAM | RTX 3060 8 GB+ VRAM          |
| VRAM           | 6 GB                      | 8 GB+                        |
| Speicherplatz  | 10 GB frei                | 20 GB frei                   |
| CPU            | Beliebige moderne x64     | Intel 12. Gen+ / Ryzen 5000+ |
| Netzwerk       | Nicht erforderlich        | —                            |

---

## Warum ist eine GPU erforderlich?

E.L.L.A. betreibt ein lokales Sprachmodell (`llama3.1:8b`, ~4,7 GB) über Ollama. Dieses Modell muss vollständig in den GPU-VRAM passen, um in Echtzeit zu antworten.

| Modus                     | Geschwindigkeit | Anforderung  |
| ------------------------- | --------------- | ------------ |
| GPU (GTX 1060, 6 GB VRAM) | ~14 Token/Sek.  | CUDA-Treiber |
| CPU (Fallback)            | 3–5 Token/Sek.  | —            |

> Mit CPU-Inferenz ist ELLA nutzbar, aber spürbar langsamer. Für eine flüssige Unterhaltung wird eine CUDA-fähige NVIDIA-GPU empfohlen.

---

## Speicherplatz

| Komponente                           | Größe         |
| ------------------------------------ | ------------- |
| E.L.L.A. App                         | ~500 MB       |
| LLM `llama3.1:8b`                    | ~4,7 GB       |
| Gedächtnis-Modell `nomic-embed-text` | ~274 MB       |
| MariaDB (wächst mit Nutzung)         | 100 MB – 2 GB |
| **Gesamt**                           | **~6–8 GB**   |

---

## Laufwerk-Empfehlung

E.L.L.A. trennt bewusst App, Modelle und Datenbank:

```
C:\Programme\E.L.L.A\    — App-Binaries
[Modell-Laufwerk]\Ollama\ — LLM-Modelle (wachsen mit jedem neuen Modell)
[Daten-Laufwerk]\MariaDB\ — Datenbank (wächst mit Nutzung)
```

Falls `C:` knapp ist: Ollama-Modelle und MariaDB können auf einem separaten Laufwerk abgelegt werden. Der Installer fragt nach dem Zielpfad.

---

## GPU-Kompatibilität

E.L.L.A. nutzt Ollama für LLM-Inferenz. Ollama unterstützt:

- **NVIDIA** — CUDA 11.8+ (empfohlen)
- **AMD** — ROCm (experimentell, Linux-only)
- **Intel** — keine GPU-Beschleunigung

Für Windows ist eine NVIDIA-GPU mit aktuellen CUDA-Treibern der empfohlene Weg.

---

## Häufige Fragen zur Hardware

**Kann ich E.L.L.A. ohne GPU nutzen?**  
Ja — Ollama fällt automatisch auf CPU zurück. Die Antworten dauern länger (5–15 Sekunden statt 1–3 Sekunden), aber alle Funktionen sind verfügbar.

**Reichen 8 GB RAM?**  
Technisch möglich, aber nicht empfohlen. `llama3.1:8b` belegt ~5 GB VRAM und ~500 MB RAM. Windows + Browser + E.L.L.A. selbst brauchen weitere 4–6 GB RAM. Mit 8 GB RAM kann es zu Engpässen kommen.

**Welche GPU-VRAM-Größe brauche ich mindestens?**  
6 GB VRAM für `llama3.1:8b`. Mit 4 GB VRAM läuft das Modell nicht vollständig im VRAM und fällt auf CPU zurück.

**Funktioniert E.L.L.A. auf einem Laptop?**  
Ja, wenn der Laptop eine NVIDIA-GPU mit 6 GB VRAM hat (z.B. RTX 3060 Mobile). Auf reinen CPU-Laptops ist E.L.L.A. funktionsfähig aber langsamer.
