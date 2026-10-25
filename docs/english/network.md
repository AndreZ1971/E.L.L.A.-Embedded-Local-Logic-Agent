# When Does E.L.L.A. Connect to the Internet?

**No telemetry. No tracking. No cloud dependency.**
ELLA does not send usage data, error reports, or analytics to us or any third party.

Network connections exist only for features you actively use — and for the license check at startup.

---

## All Connections at a Glance

### Always at Startup

| Connection        | Destination                      | What is sent                                                                        | Can it be disabled?                                                                          |
| ----------------- | -------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **License check** | `ella-agent.de` (license server) | License key + hashed hardware fingerprint (SHA-256 of hostname, CPU, MAC addresses) | No, but offline-tolerant: when there is no internet, the last valid state from cache is used |

### German Text-to-Speech

| Connection   | Destination       | What is sent                                    | Can it be disabled?                                                                                                          |
| ------------ | ----------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Edge TTS** | Microsoft servers | The **spoken text** is transmitted to Microsoft | TTS can be disabled in settings. A local German voice is in development — currently there is no alternative without internet |

> **Important:** For English, French, and Spanish, ELLA uses the local Kokoro voice (no internet required). Only for German, Edge TTS (Microsoft) is used because Kokoro quality is not yet sufficient for German.

### One-Time Downloads (on first use)

| What                                     | From                          | Approx. size             | When                                            |
| ---------------------------------------- | ----------------------------- | ------------------------ | ----------------------------------------------- |
| Kokoro voice model (EN/FR/ES)            | HuggingFace Hub               | ~80 MB                   | First startup                                   |
| Whisper speech model (local recognition) | HuggingFace Hub               | ~150 MB                  | First voice input without OpenAI                |
| Ollama LLM model                         | Ollama Registry               | 4–8 GB depending on tier | When choosing a model in onboarding or settings |
| MediaPipe hand model (gestures)          | jsdelivr CDN + Google Storage | ~5 MB                    | When first activating gesture control           |

The offline installer (`vendor/`) includes Kokoro and Ollama pre-bundled — in that case, these downloads are not needed.

### Only on Request (you trigger the connection)

| Feature                                         | Destination     | Can it be disabled?                 |
| ----------------------------------------------- | --------------- | ----------------------------------- |
| Web search (`search_web`)                       | DuckDuckGo      | Offline mode blocks this tool       |
| Weather (`get_weather`)                         | Weather API     | Offline mode blocks this tool       |
| Location (`get_location`)                       | Geolocation API | Offline mode blocks this tool       |
| Fetch webpage (`fetch_url`, `describe_webpage`) | Any URL         | Offline mode blocks these tools     |
| Gmail and Google Calendar                       | Google APIs     | Only when you have connected Google |

### OpenAI API (only with your own key)

| When                                                          | What is sent                                  |
| ------------------------------------------------------------- | --------------------------------------------- |
| Chat (provider "openai" or fallback in "auto" mode)           | Your message + context to `api.openai.com`    |
| Whisper (speech recognition, when `cloudFirst`)               | Audio recording                               |
| Vision (`describe_image`, `describe_screen`, `capture_photo`) | Screenshot/image                              |
| Multi-agent pipeline                                          | Pipeline requests (only available via OpenAI) |

Every OpenAI request is logged in the **cloud counter** (dashboard tile). The provider mode controls when OpenAI is used:

- **"auto"** (default): Ollama first, OpenAI only as fallback on error
- **"openai"**: OpenAI preferred
- **"ollama"**: Local only, no OpenAI even as fallback

---

## What Offline Mode Blocks

The "Offline Mode" setting in preferences disables:

- ✗ All web tools (search, weather, location, webpages)
- ✗ All OpenAI requests (`cloudAllowed()` returns `false`)
- ✗ License check uses cache instead of server

**Not blocked in offline mode:**

- ✓ Edge TTS for German speech output (requires internet to work)
- ✓ Local network tools (`scan_network`, `list_connections`, `list_devices`)

---

## Summary

ELLA operates locally at its core. Network access occurs only for:

1. License check at startup (offline-tolerant)
2. German text-to-speech (Edge TTS — Microsoft servers)
3. Online features you actively use (web search, weather, email)
4. OpenAI API with your own key (when configured)
5. One-time model downloads on first use
