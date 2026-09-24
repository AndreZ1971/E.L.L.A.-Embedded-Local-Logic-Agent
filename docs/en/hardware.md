# Hardware Requirements — E.L.L.A.

---

## System Requirements

| Component | Minimum                   | Recommended                   |
| --------- | ------------------------- | ----------------------------- |
| OS        | Windows 10 64-bit         | Windows 11 64-bit             |
| RAM       | 16 GB                     | 32 GB                         |
| GPU       | NVIDIA GTX 1060 6 GB VRAM | RTX 3060 8 GB+ VRAM           |
| VRAM      | 6 GB                      | 8 GB+                         |
| Storage   | 10 GB free                | 20 GB free                    |
| CPU       | Any modern x64            | Intel 12th Gen+ / Ryzen 5000+ |
| Network   | Not required              | —                             |

---

## Why is a GPU Required?

E.L.L.A. runs a local language model (`llama3.1:8b`, ~4.7 GB) via Ollama. This model must fit entirely into GPU VRAM to respond in real time.

| Mode                      | Speed          | Requirement  |
| ------------------------- | -------------- | ------------ |
| GPU (GTX 1060, 6 GB VRAM) | ~14 tokens/sec | CUDA drivers |
| CPU (fallback)            | 3–5 tokens/sec | —            |

> CPU inference works but is noticeably slower. A CUDA-capable NVIDIA GPU is recommended for a fluid conversation experience.

---

## Storage Breakdown

| Component                       | Size          |
| ------------------------------- | ------------- |
| E.L.L.A. App                    | ~500 MB       |
| LLM `llama3.1:8b`               | ~4.7 GB       |
| Memory model `nomic-embed-text` | ~274 MB       |
| MariaDB (grows with use)        | 100 MB – 2 GB |
| **Total**                       | **~6–8 GB**   |

---

## Drive Layout Recommendation

E.L.L.A. intentionally separates app, models, and database:

```
C:\Program Files\E.L.L.A\    — App binaries
[Model drive]\Ollama\         — LLM models (grow with each new model)
[Data drive]\MariaDB\         — Database (grows with use)
```

If `C:` is limited, Ollama models and MariaDB can be placed on a separate drive. The installer asks for the target path.

---

## GPU Compatibility

E.L.L.A. uses Ollama for LLM inference. Ollama supports:

- **NVIDIA** — CUDA 11.8+ (recommended)
- **AMD** — ROCm (experimental, Linux only)
- **Intel** — no GPU acceleration

On Windows, an NVIDIA GPU with current CUDA drivers is the recommended path.

---

## Common Hardware Questions

**Can I use E.L.L.A. without a GPU?**  
Yes — Ollama automatically falls back to CPU. Responses take longer (5–15 seconds instead of 1–3 seconds), but all features are available.

**Is 8 GB RAM enough?**  
Technically possible, but not recommended. `llama3.1:8b` uses ~5 GB VRAM and ~500 MB RAM. Windows + browser + E.L.L.A. itself needs another 4–6 GB RAM. With 8 GB RAM, bottlenecks are likely.

**What is the minimum GPU VRAM?**  
6 GB VRAM for `llama3.1:8b`. With 4 GB VRAM the model does not fit fully into VRAM and falls back to CPU.

**Does E.L.L.A. work on a laptop?**  
Yes, if the laptop has an NVIDIA GPU with 6 GB VRAM (e.g. RTX 3060 Mobile). On CPU-only laptops, E.L.L.A. works but is slower.
