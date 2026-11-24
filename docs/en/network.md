# When does E.L.L.A. connect to the internet?

Version 1.7.1

**No telemetry. No tracking. No forced cloud.**
E.L.L.A. sends no usage data, no error reports and no analytics to us or to third parties.

Connections exist only for features you use or switch on – and for the license check at startup.

---

## Overview of all connections

### Always at startup

| Connection        | Destination    | What is sent                                                                                           | Can it be switched off?                                               |
| ----------------- | -------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| **License check** | License server | License key and a fingerprint of the hardware (SHA-256 of computer name, processor, network addresses) | No. Without internet or in offline mode the last stored check applies |

### German voice output

| Connection   | Destination       | What is sent                  | Can it be switched off?                                                           |
| ------------ | ----------------- | ----------------------------- | --------------------------------------------------------------------------------- |
| **Edge TTS** | Microsoft servers | the text E.L.L.A. reads aloud | Yes: switch off voice output, or use offline mode – then the Windows voice speaks |

English, French and Spanish are spoken by a local voice (Kokoro) without a connection. In offline mode E.L.L.A. speaks German with the voice built into Windows; nothing is sent then.

### One-time downloads

| What                                                                 | From                                   | Size approx.             | When                                                                                                         |
| -------------------------------------------------------------------- | -------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Language model (default: `llama3.1:8b`)                              | Ollama registry (`registry.ollama.ai`) | 5 GB, depending on model | after choosing the model on the first start                                                                  |
| Local voice Kokoro (EN/FR/ES)                                        | Hugging Face (`huggingface.co`)        | 80 MB                    | on the first start                                                                                           |
| Model for local speech recognition (`onnx-community/whisper-medium-ONNX`) | Hugging Face (`huggingface.co`)   | 0.9 GB                   | on the first voice input; if voice input is switched on, already at start. With a progress display |

Since v1.7.1 the **memory model** `nomic-embed-text` is included in the installer and is taken over without a connection on the first start. Only if it is missing anyway – for example because E.L.L.A. uses a separately installed Ollama – does she download it once from the Ollama registry (`registry.ollama.ai`, 0.3 GB).

Without internet the very first local voice input does not work, because its model is still missing; a failed download is retried on the next recording. The model is stored in the data folder (`…\ELLA\whisper-cache`).

The model for gesture control and the wake word models are included in the installer; no connection is needed for them.

### Only at your request

| Feature                                  | Destination               | What is sent                                                | In offline mode |
| ---------------------------------------- | ------------------------- | ----------------------------------------------------------- | --------------- |
| Web search                               | DuckDuckGo                | the search term                                             | blocked         |
| Weather                                  | Open-Meteo                | place or coordinates                                        | blocked         |
| Location                                 | ip-api.com                | your internet address (IP), unencrypted – only after asking | blocked         |
| Fetching or describing a web page        | the address named         | the page request                                            | blocked         |
| Browser control (if switched on)         | the pages you have opened | what a browser sends while browsing                         | blocked         |
| Gmail and Google Calendar (if connected) | Google                    | the respective request                                      | –               |

### Plugins (only enabled ones)

A plugin queries exactly the address you approved on the approval page and sends only the values named there. E.L.L.A. can create a plugin but can never enable it herself. In offline mode only plugins for devices in the home network work; in homework mode none do.

### Updates (only at the push of a button)

| When                               | Destination | What is sent                                                        |
| ---------------------------------- | ----------- | ------------------------------------------------------------------- |
| “Check now” under “About E.L.L.A.” | GitHub      | a query for the latest version – no data about you or your computer |
| “Download”                         | GitHub      | the request for the update files                                    |

E.L.L.A. never checks by herself. In offline mode nothing is checked or downloaded. The version from the Microsoft Store is updated through the Store.

### OpenAI (only with your own key)

| When                                                                          | What is sent                                                                                                                          |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Chat (setting “OpenAI”, or as a fallback with “Auto”)                         | your message with the history and what E.L.L.A. draws on for it: matching memories, documents she has read, pages read in the browser |
| Image analysis                                                                | the image or screenshot                                                                                                               |
| Speech recognition (only with the setting “OpenAI” or if the local one fails) | the audio recording                                                                                                                   |
| Web search as a fallback                                                      | the search term                                                                                                                       |
| The “Multi-Agents” page                                                       | the agents' requests (runs only through OpenAI)                                                                                       |
| Loading the model list, checking a model                                      | a query with your key                                                                                                                 |

Every request to OpenAI is counted and shown in the dashboard and in the “Cloud requests” panel. The setting under **Settings → LLM** decides when OpenAI is used:

- **Auto** (default): local first, OpenAI only as a fallback – and only if a key is stored
- **OpenAI**: answers come from OpenAI
- **Ollama (local)**: local only, OpenAI is never used

Without a stored key there is no connection to OpenAI.

---

## What offline mode blocks

The switch under **Settings → Tools → Offline Mode** blocks:

- web search, weather, location and fetching web pages
- all requests to OpenAI
- browser control
- plugins for services on the internet
- the update check and the update download
- the German Microsoft voice – the Windows voice speaks instead
- the license check with the server – the stored check applies

Features in your own network (devices on the network, connections) and plugins for devices in the home network remain available.

---

## Summary

E.L.L.A. works locally at its core. Connections to the outside exist only for:

1. the license check at startup
2. German voice output (Microsoft), except in offline mode
3. online features you use (web search, weather, location, web pages, browser, email)
4. plugins you approved
5. OpenAI with your own key
6. updates at the push of a button
7. one-time downloads of the models
