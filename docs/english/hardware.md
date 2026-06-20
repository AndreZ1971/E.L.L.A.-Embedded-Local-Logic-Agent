# Hardware — Development Machine "Dante-Home"

---

## Specifications

| Component | Specification                  | Relevance for E.L.L.A.                                                  |
| --------- | ------------------------------ | ----------------------------------------------------------------------- |
| CPU       | Intel Core i3, 12th generation | Sufficient for Node.js + Express. Ollama on CPU: 5–15 sec/response      |
| RAM       | 32 GB DDR4/5                   | llama3.1:8b needs ~5 GB — plenty of headroom for OS + browser + Node.js |
| GPU       | NVIDIA GTX 1060 (6 GB VRAM)    | GPU inference active: llama3.1:8b fits with ~5 GB into VRAM             |
| Drive C:  | (Primary, Windows)             | Operating system, code editor, Node.js, npm — no AI overhead            |
| Drive E:  | 238 GB, internal               | "Brain" — Ollama models + MariaDB                                       |
| Drive Z:  | 34 GB, internal                | Code & projects (incl. E.L.L.A.)                                        |
| Drive H:  | External                       | Media — not suitable for AI infrastructure                              |

---

## Drive Architecture

### Why a dedicated E: for AI?

**Problem:** C: was completely full (0 bytes free). Ollama downloads failed. Windows was unable to create temporary files.

**Solution:** E: (238 GB, internal) is dedicated exclusively to everything related to AI infrastructure.

**Principle:** Clear physical separation of concerns.

```text
C: — Operating system, apps, development tools
     Nothing that grows or is hard to remove

E: — "Brain" — everything that consumes and grows in storage
     ├─ E:\Ollama\models\   — LLM models (grow with each new model)
     └─ E:\MariaDB\         — Database server + data (grows with usage)

Z: — Code & projects
     Small, no binary overhead
```

---

## Ollama on E:

### Configuration

Ollama stores models at `C:\Users\<User>\.ollama\models` by default. The `OLLAMA_MODELS` environment variable overrides this path.

```powershell
# User scope (no admin required, applies to interactive sessions):
[System.Environment]::SetEnvironmentVariable(
  "OLLAMA_MODELS",
  "E:\Ollama\models",
  "User"
)

# Machine scope (admin required, applies system-wide including services):
[System.Environment]::SetEnvironmentVariable(
  "OLLAMA_MODELS",
  "E:\Ollama\models",
  "Machine"
)
```

**Important:** The variable must be set **before** Ollama starts. Models already downloaded to `C:` can be moved manually to `E:\Ollama\models`.

### Installed Models

| Model         | Size    | Type       | Purpose                                     |
| ------------- | ------- | ---------- | ------------------------------------------- |
| `llama3.1:8b` | ~4.7 GB | Generalist | Standard fallback when no OpenAI key is set |

### Starting Ollama

```powershell
# Interactive (tray app):
ollama serve

# Test a model:
ollama run llama3.1:8b "Hallo, wer bist du?"

# Show available models:
ollama list

# Pull an additional model:
ollama pull llama3.2:3b    # Smaller, faster, less precise
ollama pull mistral:7b     # Alternative to llama, good for code
```

---

## MariaDB on E:

### Installation Paths

```text
E:\MariaDB\server\          — Binaries (mariadbd.exe, mysql.exe, ...)
E:\MariaDB\server\bin\      — Executable files
E:\MariaDB\data\            — Database files (InnoDB, logs, ...)
```

### Windows Service

MariaDB runs as a Windows service with autostart.

```powershell
# Service status
Get-Service MariaDB

# Start / stop (admin)
net start MariaDB
net stop MariaDB

# Direct DB connection (admin)
"E:\MariaDB\server\bin\mysql.exe" -u root -p

# ella user
"E:\MariaDB\server\bin\mysql.exe" -u ella -p ella
```

---

## GPU Acceleration (Active)

GPU: **GTX 1060 (6 GB VRAM)** — CUDA 13.0, driver 582.28.

| Mode          | Measured rate | VRAM usage | Status   |
| ------------- | ------------- | ---------- | -------- |
| CPU           | ~3–5 t/s      | —          | Previous |
| GPU (GTX1060) | **14.6 t/s**  | 5.8 GB     | Active ✓ |

**Model fit:** llama3.1:8b occupies ~5.8 GB of the 6 GB — runs entirely in VRAM.

**Configuration:**

```powershell
# Set OLLAMA_MODELS to E:\Ollama (user scope, persistent):
[System.Environment]::SetEnvironmentVariable("OLLAMA_MODELS", "E:\Ollama", "User")

# Restart Ollama — detects CUDA automatically
# Models are located in E:\Ollama\blobs and E:\Ollama\manifests
```

**Note:** With only ~200 MB of VRAM headroom, the system runs stably but tightly. Other GPU-intensive applications (games, etc.) cannot run concurrently with Ollama.

---

## Swap File (Virtual Memory)

**Question:** Can a larger swap file relieve pressure on RAM or VRAM?

**Answer:**

- **For RAM:** Marginally helpful. With 32 GB of RAM, swapping is very unlikely. A larger swap file only helps if RAM is actually full.
- **For VRAM:** Not helpful. GPU VRAM cannot be extended via the swap file. If a model does not fit in VRAM, Ollama automatically falls back to CPU.

**Current setting:** Windows manages the swap file automatically — this is the correct setting for the available RAM.

---

## Performance Assessment

| Task                      | Performance         | Bottleneck      |
| ------------------------- | ------------------- | --------------- |
| Node.js API (Express)     | Very good           | —               |
| MariaDB queries           | Very good           | —               |
| Ollama (GPU, llama3.1:8b) | **Good (14.6 t/s)** | VRAM bandwidth  |
| OpenAI GPT-4o             | Very good (1–3 s)   | Network latency |
| React dev server (Vite)   | Very good           | —               |
