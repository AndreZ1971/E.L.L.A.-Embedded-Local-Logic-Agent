# E.L.L.A. -- Hardware Guide

Version 1.5.7 -- Last updated: 2026-10-28

---

## Summary

ELLA runs on most Windows machines from the last 5 years. For the best experience, we recommend a **dedicated graphics card with at least 10 GB of video memory (VRAM)**. ELLA also works without a dedicated graphics card -- in that case, the processor handles the AI computation, which is slower.

> **What is VRAM?** VRAM (Video RAM) is the memory on your graphics card. The AI model is loaded entirely into this memory. The more VRAM available, the larger and better models ELLA can use.

---

## System Requirements

### Minimum (works, but slow)

| Component        | Requirement                                 |
| ---------------- | ------------------------------------------- |
| Operating system | Windows 10/11 (64-bit)                      |
| Processor        | Intel Core i3 / AMD Ryzen 3 (or comparable) |
| Memory           | 16 GB RAM                                   |
| Graphics card    | Not strictly required (see below)           |
| Disk space       | 20 GB free                                  |

With this configuration ELLA works, but the AI responds noticeably slower -- especially without a graphics card. An OpenAI key (optional, paid) can significantly improve response speed because the computation then happens in the cloud.

### Recommended (smooth experience)

| Component        | Requirement                                                   |
| ---------------- | ------------------------------------------------------------- |
| Operating system | Windows 10/11 (64-bit)                                        |
| Processor        | Intel Core i5 / AMD Ryzen 5 (or better)                       |
| Memory           | 32 GB RAM                                                     |
| Graphics card    | NVIDIA with 10-12 GB VRAM (e.g. RTX 3060 12GB, RTX 2060 12GB) |
| Disk space       | 40 GB free (SSD recommended)                                  |

With this configuration ELLA responds quickly and all local features work without delay.

---

## With and Without a Graphics Card

### With an NVIDIA Graphics Card (GPU Mode)

If your machine has an NVIDIA graphics card with enough VRAM, the AI model runs directly on the graphics card. This is the fastest option -- ELLA responds within a few seconds.

**Your graphics card needs at least 10 GB of VRAM** to fully load the default model (qwen2.5:14b, 14 billion parameters). With less VRAM, part of the computation is offloaded to the processor, which is slower.

> **What are parameters?** An AI model consists of billions of learned numerical values -- the "parameters." More parameters generally mean better language understanding and more precise answers, but also require more memory.

**VRAM guidelines:**

| Graphics card                 | VRAM   | Experience with ELLA                                  |
| ----------------------------- | ------ | ----------------------------------------------------- |
| RTX 4060 Ti 16GB              | 16 GB  | Excellent -- plenty of headroom                       |
| RTX 3060 12GB / RTX 2060 12GB | 12 GB  | Very good -- recommended configuration                |
| RTX 3060 8GB / RTX 2060 6GB   | 6-8 GB | Limited -- smaller model needed or mixed CPU/GPU mode |
| GTX 1060 6GB                  | 6 GB   | Only usable with a smaller model                      |

> **Note:** AMD graphics cards (Radeon) are experimentally supported by Ollama on Windows via Vulkan. Results may vary depending on the model. Without working GPU acceleration, the processor takes over automatically.

### Without a Graphics Card (CPU Mode)

Without a suitable graphics card, the processor (CPU) computes the AI responses. This works but is considerably slower -- depending on the processor, roughly 3-10 seconds before a response starts, compared to under 2 seconds with a GPU.

**Tip:** With an **OpenAI key** (optional, your own key), ELLA can send computations over the internet. The calculation then happens on OpenAI servers and is very fast regardless of your hardware. However, conversation data is transmitted to OpenAI in that case.

### With an OpenAI Key (Cloud Mode)

If you enter your own OpenAI API key, ELLA can optionally or additionally use OpenAI for chat responses. In this case, local hardware matters less -- even an older laptop without a graphics card delivers fast answers.

| Mode           | Speed                    | Privacy                          | Hardware requirement |
| -------------- | ------------------------ | -------------------------------- | -------------------- |
| Local (Ollama) | GPU: fast, CPU: slower   | Everything stays on your machine | GPU recommended      |
| Cloud (OpenAI) | Always fast              | Data is sent to OpenAI           | Low                  |
| Auto           | Automatically picks best | Mixed                            | GPU recommended      |

---

## Does ELLA Work on My Laptop?

**Yes** -- ELLA runs on any Windows laptop with at least 16 GB of RAM. The experience depends on whether your laptop has a dedicated graphics card:

| Laptop type                                 | Experience                                |
| ------------------------------------------- | ----------------------------------------- |
| Gaming laptop with NVIDIA GPU (10+ GB VRAM) | Very good -- like a desktop               |
| Laptop with smaller NVIDIA GPU (4-8 GB)     | OK -- slower AI mode or smaller model     |
| Laptop without a dedicated graphics card    | Works, but slow -- OpenAI key recommended |

**Battery note:** AI computation uses a lot of energy. On a laptop, we recommend plugging in while using ELLA.

---

## Flash Attention -- Automatic Acceleration

ELLA automatically enables **Flash Attention** -- an optimization that makes processing your requests up to 12 times faster. You do not need to configure anything; the feature is active by default.

> **What is Flash Attention?** A technique that optimizes how the AI model processes your text. Instead of holding all text in memory at once, it is processed in smaller chunks more efficiently. This saves memory and speeds up responses.

Additionally, ELLA uses **KV cache optimization**, which reduces video memory usage without noticeably affecting response quality.

---

## Disk Space

ELLA requires disk space for the following components:

| Component              | Size (approx.) | Note                             |
| ---------------------- | -------------- | -------------------------------- |
| ELLA installation      | 300 MB         | Program files + bundled services |
| AI model (qwen2.5:14b) | 8.4 GB         | Downloaded on first launch       |
| Memory model           | 274 MB         | For memories and search          |
| Voice model (Kokoro)   | 80 MB          | For local text-to-speech         |
| Database               | 50-500 MB      | Grows with usage                 |
| **Total (initial)**    | **~10 GB**     |                                  |

The largest share is the AI model. It is downloaded once on first launch.

---

## Common Hardware Questions

### Can I choose a smaller AI model?

Yes. In Settings under **LLM** you can enter a different model that you have loaded in Ollama. Smaller models (e.g. with 3 or 7 billion parameters) need less VRAM and respond faster, but understand complex requests less well.

### My machine only has 8 GB of RAM -- will that work?

Not recommended. The AI model alone needs several GB of working memory. With 8 GB RAM, too little remains for Windows and ELLA at the same time. 16 GB is the minimum; 32 GB is recommended.

### Do I need an SSD?

Not strictly, but recommended. An SSD significantly speeds up ELLA's startup and AI model loading.

### Can I use ELLA and games at the same time?

If the GPU is fully occupied by the AI model, no VRAM remains for games. With high-VRAM cards (16+ GB), simultaneous use is possible. Otherwise, we recommend quitting ELLA via the tray icon before gaming.

---

_E.L.L.A. v1.5.7 -- Proprietary -- All rights reserved_

_Further documentation: [FAQ](faq.md) -- [Network](netzwerk.md) -- [User Manual](bedienungsanleitung.md)_
