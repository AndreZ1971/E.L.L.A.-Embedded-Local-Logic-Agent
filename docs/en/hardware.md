# E.L.L.A. – Hardware Guide

Version 1.6.9

The figures on [ella-agent.de](https://ella-agent.de) are binding. This guide explains them.

---

## In short

E.L.L.A. runs on most Windows computers of recent years. She runs best with an NVIDIA graphics card, because the language model is loaded into the memory of the graphics card. Without a suitable graphics card the processor does the work – that works, but is slower.

> **What is VRAM?** VRAM is the memory of the graphics card. The language model is loaded there. The more VRAM, the more smoothly E.L.L.A. answers.

---

## System requirements

| Component        | Minimum                           | Recommended                   |
| ---------------- | --------------------------------- | ----------------------------- |
| Operating system | Windows 10/11 (64-bit)            | Windows 11                    |
| Processor        | Intel i3 (12th gen) / AMD Ryzen 3 | Intel i5/i7 / AMD Ryzen 5/7   |
| Memory           | 8 GB                              | 16 GB                         |
| Graphics card    | NVIDIA GTX 1060 (6 GB VRAM)       | NVIDIA RTX 2060+ (12 GB VRAM) |
| Storage          | 10 GB SSD                         | 20 GB SSD                     |

With the minimum configuration E.L.L.A. runs but answers more slowly. With the recommended configuration she answers smoothly.

On the first start E.L.L.A. checks your hardware and suggests a suitable language model. You confirm the choice before anything is downloaded.

---

## With and without a graphics card

### With an NVIDIA graphics card

If your computer has an NVIDIA graphics card with enough VRAM, the language model runs directly on the graphics card. This is the fastest option.

The default model is `llama3.1:8b`. On a card with 12 GB of VRAM it fits completely into the graphics memory. If the graphics memory is not quite enough, the processor handles part of the work – E.L.L.A. then answers more slowly.

| Graphics card             | VRAM       | Experience with E.L.L.A.                     |
| ------------------------- | ---------- | -------------------------------------------- |
| RTX 2060 12 GB and above  | from 12 GB | smooth – the recommended configuration       |
| RTX 3060 8 GB and similar | 8 GB       | good                                         |
| GTX 1060 6 GB and similar | 6 GB       | minimum – runs, slower depending on the load |

> **Note:** AMD graphics cards are supported by Ollama on Windows only to a limited extent. If acceleration does not work, the processor takes over automatically.

### Without a graphics card

Without a suitable graphics card the processor computes the answers. That works but takes noticeably longer.

**Tip:** With your own **OpenAI key** E.L.L.A. can have the answers computed by OpenAI. Your own hardware then matters less. In return your messages go to OpenAI, and OpenAI bills you for the usage.

| Setting        | Speed                                       | Data                   |
| -------------- | ------------------------------------------- | ---------------------- |
| Ollama (local) | fast with a graphics card, otherwise slower | stays on your computer |
| OpenAI         | consistently fast                           | goes to OpenAI         |
| Auto           | local first, OpenAI only as a fallback      | depends on the request |

---

## Does E.L.L.A. work on my laptop?

Yes, from 8 GB of memory (16 GB recommended). How fast she answers depends on the graphics card:

| Laptop                             | Experience                                       |
| ---------------------------------- | ------------------------------------------------ |
| with a strong NVIDIA graphics card | like a desktop computer                          |
| with a small NVIDIA graphics card  | works, answers more slowly                       |
| without a dedicated graphics card  | works but is slow – an OpenAI key is recommended |

**Battery:** The language model uses a lot of energy. On a laptop, mains power is recommended.

If the computer is not powerful enough for the elaborate HUD or Aura appearances, E.L.L.A. stays on the plain “Calm” appearance by herself.

---

## Automatic acceleration

E.L.L.A. switches on two Ollama optimizations by herself: **Flash Attention** speeds up the processing of your requests, and a compact way of storing the cache reduces the need for graphics memory. You do not have to configure anything.

---

## Disk space

| Component                         | Size (approx.) | Note                                               |
| --------------------------------- | -------------- | -------------------------------------------------- |
| Installer                         | 1 GB           | contains the database, Ollama and other components |
| Language model `llama3.1:8b`      | 5 GB           | downloaded once on the first start                 |
| Memory model                      | 0.3 GB         | for memories and document knowledge                |
| Copy of the installer for updates | 1 GB           | the basis for keeping updates small                |
| Database                          | grows          | with use                                           |

The language model takes up most of the space. Its download shows progress, speed and time left.

---

## Frequently asked hardware questions

### Can I choose a smaller language model?

Yes. Under **Settings → LLM** you choose another hardware profile or enter the name of your own Ollama model. Smaller models need less graphics memory and answer faster but understand difficult requests less well. Not every model can use tools – E.L.L.A. is proven with `llama3.1:8b`.

### My computer has only 8 GB of memory – does that work?

Yes, 8 GB is the minimum. Close other programs if E.L.L.A. gets slow. 16 GB is recommended.

### Do I need an SSD?

Recommended. An SSD speeds up the start of E.L.L.A. and the loading of the language model considerably.

### Can I use E.L.L.A. and games at the same time?

If the language model occupies the graphics memory, little is left for games. Quit E.L.L.A. before gaming via the icon in the notification area.

---

_E.L.L.A. v1.6.9_

_Further documentation: [FAQ](faq.md) – [Network connections](network.md) – [User manual](bedienungsanleitung.md)_
