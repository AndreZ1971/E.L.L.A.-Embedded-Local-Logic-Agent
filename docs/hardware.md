# Hardware — Entwicklungsrechner "Dante-Home"

---

## Spezifikation

| Komponente | Spezifikation | Relevanz für E.L.L.A. |
| --- | --- | --- |
| CPU | Intel Core i3, 12. Generation | Ausreichend für Node.js + Express. Ollama auf CPU: 5-15 Sek./Antwort |
| RAM | 32 GB DDR4/5 | llama3.1:8b braucht ~5 GB — genug Puffer für OS + Browser + Node.js |
| GPU | NVIDIA RTX 2080 (8 GB VRAM) | GPU-Inferenz möglich: llama3.1:8b passt mit ~5 GB in den VRAM |
| Laufwerk C: | (Primär, Windows) | Betriebssystem, Code-Editor, Node.js, npm — kein KI-Ballast |
| Laufwerk E: | 238 GB, intern | "Gehirn" — Ollama-Modelle + MariaDB |
| Laufwerk Z: | 34 GB, intern | Code & Projekte (inkl. E.L.L.A.) |
| Laufwerk H: | Extern | Medien — nicht für KI-Infrastruktur geeignet |

---

## Laufwerk-Architektur

### Warum dediziertes E: für KI?

**Problem:** C: war vollständig voll (0 Byte frei). Ollama-Downloads schlugen fehl. Windows kann keine temporären Dateien anlegen.

**Lösung:** E: (238 GB, intern) wird dediziert für alles genutzt was mit KI-Infrastruktur zu tun hat.

**Prinzip:** Klare physische Trennung von Concerns.

```text
C: — Betriebssystem, Apps, Entwicklungstools
     Nichts das wächst oder schwer zu entfernen ist

E: — "Gehirn" — alles was Speicher verbraucht und wächst
     ├─ E:\Ollama\models\   — LLM-Modelle (wachsen mit jedem neuen Modell)
     └─ E:\MariaDB\         — Datenbankserver + Daten (wachsen mit Nutzung)

Z: — Code & Projekte
     Klein, kein Binär-Ballast
```

---

## Ollama auf E:

### Konfiguration

Ollama speichert Modelle standardmäßig unter `C:\Users\<User>\.ollama\models`. Die Umgebungsvariable `OLLAMA_MODELS` überschreibt diesen Pfad.

```powershell
# User-Scope (kein Admin, gilt für interaktive Sessions):
[System.Environment]::SetEnvironmentVariable(
  "OLLAMA_MODELS",
  "E:\Ollama\models",
  "User"
)

# Machine-Scope (Admin nötig, gilt systemweit inkl. Dienste):
[System.Environment]::SetEnvironmentVariable(
  "OLLAMA_MODELS",
  "E:\Ollama\models",
  "Machine"
)
```

**Wichtig:** Die Variable muss gesetzt sein **bevor** Ollama startet. Bereits heruntergeladene Modelle unter `C:` können manuell nach `E:\Ollama\models` verschoben werden.

### Installierte Modelle

| Modell | Größe | Typ | Zweck |
| --- | --- | --- | --- |
| `llama3.1:8b` | ~4,7 GB | Generalist | Standard-Fallback wenn kein OpenAI-Key |

### Ollama starten

```powershell
# Interaktiv (Tray-App):
ollama serve

# Modell testen:
ollama run llama3.1:8b "Hallo, wer bist du?"

# Verfügbare Modelle anzeigen:
ollama list

# Weiteres Modell laden:
ollama pull llama3.2:3b    # Kleiner, schneller, weniger präzise
ollama pull mistral:7b     # Alternative zu llama, gut für Code
```

---

## MariaDB auf E:

### Installationspfade

```text
E:\MariaDB\server\          — Binaries (mariadbd.exe, mysql.exe, ...)
E:\MariaDB\server\bin\      — Ausführbare Dateien
E:\MariaDB\data\            — Datenbankdateien (InnoDB, Logs, ...)
```

### Windows-Dienst

MariaDB läuft als Windows-Dienst mit Autostart.

```powershell
# Dienst-Status
Get-Service MariaDB

# Starten / Stoppen (Admin)
net start MariaDB
net stop MariaDB

# Direkte DB-Verbindung (Admin)
"E:\MariaDB\server\bin\mysql.exe" -u root -p

# ella-User
"E:\MariaDB\server\bin\mysql.exe" -u ella -p ella
```

---

## GPU-Beschleunigung (Potential)

Die RTX 2080 mit 8 GB VRAM könnte die Ollama-Inferenz drastisch beschleunigen:

| Modus | Erwartete Latenz | Voraussetzung |
| --- | --- | --- |
| CPU (aktuell) | 5-15 Sek./Antwort | — |
| GPU (RTX 2080) | 0,5-2 Sek./Antwort | CUDA-Treiber, Ollama CUDA-Build |

**Modell-Fit:** llama3.1:8b braucht ~5 GB VRAM — passt in 8 GB mit Puffer für OS-GPU-Anteil (~500 MB).

**Aktivierung:**

```powershell
# Prüfen ob CUDA verfügbar ist:
nvidia-smi

# Ollama erkennt CUDA automatisch wenn CUDA Toolkit installiert ist
# Beim nächsten Modell-Load wird GPU genutzt

# Verifikation in Ollama-Output:
# "using NVIDIA GPU" statt "using CPU"
```

**Aktuelle Hürde:** CUDA Toolkit noch nicht installiert. Setup steht auf der Roadmap.

---

## Auslagerungsdatei (Virtuelle Speicher)

**Frage:** Kann eine größere Auslagerungsdatei RAM oder VRAM entlasten?

**Antwort:**

- **Für RAM:** Marginal hilfreich. Mit 32 GB RAM ist Swapping sehr unwahrscheinlich. Eine größere Auslagerungsdatei hilft nur wenn RAM tatsächlich voll ist.
- **Für VRAM:** Nicht hilfreich. GPU-VRAM kann nicht per Auslagerungsdatei erweitert werden. Wenn ein Modell nicht in den VRAM passt, fällt Ollama automatisch auf CPU zurück.

**Aktuell:** Windows verwaltet die Auslagerungsdatei automatisch — das ist für die gegebene RAM-Ausstattung die richtige Einstellung.

---

## Performance-Einschätzung

| Aufgabe | Performance | Engpass |
| --- | --- | --- |
| Node.js API (Express) | Sehr gut | — |
| MariaDB Abfragen | Sehr gut | — |
| Ollama (CPU, llama3.1:8b) | Akzeptabel (5-15s) | CPU-Kerne |
| Ollama (GPU, mit CUDA) | Gut (0.5-2s) | VRAM-Bandwidth |
| OpenAI GPT-4o | Sehr gut (1-3s) | Netzwerklatenz |
| React Dev-Server (Vite) | Sehr gut | — |
