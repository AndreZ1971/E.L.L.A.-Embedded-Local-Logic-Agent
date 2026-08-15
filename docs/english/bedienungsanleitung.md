# E.L.L.A. — User Manual

Version 1.2.0

---

## Hello — I'm E.L.L.A.

E.L.L.A. stands for _Embedded Local Logic Agent_ — your personal AI assistant for Windows. Always ready, always local, always yours.

What makes me different: I run entirely on your own machine. Your data stays with you — no cloud server, no subscription, no privacy fine print. Just install and go.

---

## Getting Started

### Installation

1. Run `E.L.L.A Setup 1.2.0.exe`
2. Choose an installation path (default: `C:\Program Files\E.L.L.A`)
3. The installer sets everything up automatically — MariaDB, Ollama, Node.js. Nothing else to install.

### First Launch

On first launch, ELLA guides you through a short onboarding flow:

1. **Language selection** — German or English
2. **EULA** — accept the terms of use and the ELLA Directive
3. **Hardware scan** — ELLA detects your system and recommends a suitable language model
4. **Model selection** — you choose the model that fits your hardware (no download without your consent)
5. **Voice selection** — 4 female voices in DE/EN/ES/FR with preview
6. **Location** — for weather and local information (optional)
7. **License activation** — enter your license key `ELLA-XXXX-XXXX-XXXX-XXXX`
8. **Chat** — you're ready

---

## The Chat

### How to Talk to Me

Just write what you need — in plain language, no commands, no special syntax. I understand natural language.

- "How much disk space is left?"
- "Write an email to Klaus saying I can't make it tomorrow"
- "What's on the calendar this week?"
- "Open Spotify"

### Voice Input

Click the **microphone button** in the input bar — or simply say **"Ella"** if the wakeword is enabled. ELLA listens, converts your speech to text, and responds.

Wakeword modes:

- **Off** — no automatic listening
- **Manual** — microphone button only
- **Wakeword** — listen for "Ella", then record
- **Always** — continuous listening

### Voice Output (TTS)

ELLA responds with voice too. Two engines are available:

- **Kokoro TTS** (default) — local neural voice, fully offline, natural sound
- **Microsoft Edge TTS** (fallback) — requires internet, very reliable

The voice language can be set independently of the app language: German, English, Spanish, or French.

### Feedback

Below each response you'll find **thumbs up / thumbs down**. When you give feedback, ELLA learns from it and adjusts her responses to your preferences over time.

### Tool Display

When ELLA does something — searches a file, opens an app, reads your calendar — you briefly see which tool she used. This gives you insight into what's happening.

---

## What I Can Do For You

### PC & System

I know Windows inside out. Ask me anything about your machine.

Just say:

- "Open Chrome"
- "How much RAM am I using right now?"
- "Show me all running processes"
- "Kill the process XY"
- "Set the volume to 40 percent"
- "What's in my clipboard?"
- "Shut down / restart the computer"
- "Which programs start automatically with Windows?"

### Drives & Storage

Just say:

- "How much space is left on drive C?"
- "Find duplicate files on my drives"
- "Format my USB stick" _(confirmation required)_
- "Rename drive E to Data"
- "Empty the recycle bin"

### Files & Documents

I can find, open, and create files across all your drives.

Just say:

- "Find the file called Proposal"
- "Open the Projects folder"
- "Create a new Word document"
- "What does this PDF say?" _(attach file or name the path)_
- "Read me the Excel spreadsheet"
- "Summarize this document"

### Dictation & Writing

Just say:

- "Dictate a letter to Ms. Miller"
- "Write this in the style of my emails"
- "Correct this text"
- "Translate this to German"

### Mail & Calendar

**Outlook:**

- "Show my unread emails"
- "Mark the email as read / spam / archived"
- "Draft an email to Klaus: meeting tomorrow at 2pm?"
- "What's on my calendar this week?"
- "Create an appointment: dentist, Friday at 10am"

**Gmail & Google Calendar** (OAuth required, set up once in Settings):

- "Show me my Gmail emails"
- "What's on my Google Calendar today?"

### Tasks

ELLA maintains a persistent task list. Tasks survive restarts.

Just say:

- "Add the task 'File taxes'"
- "Show my open tasks"
- "Mark 'File taxes' as done"
- "Delete task XY"

### Alarms

Just say:

- "Set an alarm for 7:30"
- "Set an alarm for tomorrow morning at 6"
- "Which alarms are active?"
- "Delete the 7:30 alarm"

Alarms are checked daily and trigger a notification plus a TTS announcement.

### Reminders

Reminders are set via the Windows Task Scheduler and appear as popups at the specified time.

Just say:

- "Remind me tomorrow at 3pm: call the doctor's office"
- "What reminders do I have?"
- "Delete reminder XY"

### Music & Entertainment

Just say:

- "Play something by Coldplay"
- "Open my media player with the album 'Brothers in Arms'"
- "Find Metallica tracks in my library"

### Network & Monitoring

Just say:

- "Who's on my network?"
- "Show active TCP connections"
- "What's my Wi-Fi status?"
- "Show me the firewall rules"

### Screenshot & Screen Analysis

_(Requires OpenAI key)_

Just say:

- "Take a screenshot and analyze what you see"
- "Describe what's happening on screen"
- "Analyze this image" _(paste an image)_

---

## Multi-Agents

The Multi-Agent feature is ELLA's most powerful mode. Multiple specialized AI agents work **in parallel**, delivering more in less time than a single agent ever could.

> **Note:** Multi-Agents requires a configured OpenAI key (Settings → API Key). Ollama is not used for this feature.

### How to Access It

Navigate to **Multi-Agents** in the sidebar.

### Predefined Pipelines

**🌅 Morning Briefing**
Three agents work simultaneously:

- Agent 1 reads today's calendar appointments
- Agent 2 retrieves your open tasks
- Agent 3 fetches the current weather for your location

The result: a compact daily briefing combining all three.

**🖥️ System Report**
Four agents analyze simultaneously:

- Agent 1: Free space on all drives
- Agent 2: RAM and CPU usage
- Agent 3: Running processes (top 10 by resource consumption)
- Agent 4: Network status and open connections

The result: a complete system health report.

### Live View

While the pipeline runs, you see a live card for each agent showing:

- Real-time status (running / done / error)
- Live-streamed agent text
- Which tools the agent is currently using

### Run a Setup After Completion _(optional)_

You can link a pipeline with a **Setup**. After all agents finish, ELLA automatically executes the setup — for example, opening or closing specific apps.

Select the desired setup from the dropdown before starting the pipeline.

### The Data Is Real

What you see in Multi-Agent view is not sample data — it's real information from your system, your calendar, and your drives. Just like in the regular chat, only faster and parallelized.

---

## Setups

Setups are macros — define once which apps to open and close, then trigger them with a single phrase.

Just say:

- "Load my work setup"
- "Start the gaming setup"

Create setups: **Settings → Setups → New**.

---

## Memory

ELLA remembers information about you — preferences, habits, notes. Memory is separated by profile and persists permanently.

Just say:

- "Remember: I don't like meetings before 9am"
- "What do you know about me?"
- "Forget the note about XY"

---

## Proactive Messages

ELLA reaches out proactively when something important happens:

- **Drive nearly full** — when a drive drops below 10% free space
- **High RAM usage** — under sustained load
- **USB device connected** — detection and announcement of new drives
- **Alarm triggered** — voice alert at the set time
- **Clipboard pattern** — IBAN, tracking number, URL, phone number detected → ELLA asks if she can help
- **Meeting preparation** — 15 minutes before a calendar appointment
- **End of day** — evening summary of open tasks
- **Break reminder** — after a long work session

---

## User Profiles

ELLA supports multiple user profiles on the same machine. Each profile has:

- Its own memory
- Its own conversation history
- Its own optional PIN protection

Manage profiles: **Settings → Profiles**.

---

## Homework Mode

Homework Mode locks the computer to a defined app whitelist. Only approved programs can be opened — ideal for children while studying.

**Important:** Only the correct PIN ends the mode. There is no automatic expiry time — this is intentional, so children cannot simply wait it out.

Activate: Say "Activate homework mode" or go to **Settings → Homework Mode**.

---

## Accessibility

### Blind Mode

Enable under **Settings → Accessibility → Blind Mode**:

- TTS always active — every response is read aloud
- Responses without Markdown formatting (better for screen readers)
- Audio tones as status feedback (loading, error, success)
- Welcome announcement on startup
- All buttons and inputs labeled with `aria-label`

### Deaf Mode

Enable under **Settings → Accessibility → Deaf Mode**:

- TTS and microphone button completely hidden
- Visual banner in chat
- No mention of voice features in system prompt

---

## Settings

Open Settings via the sidebar or say "Open settings".

### Key Areas

| Area              | What you'll find                             |
| ----------------- | -------------------------------------------- |
| **General**       | Language, name, location                     |
| **LLM Provider**  | Ollama (local) or OpenAI — or Auto           |
| **API Key**       | OpenAI key for GPT features and Multi-Agents |
| **Voice**         | TTS engine, language, stress analysis        |
| **Tools**         | Which tools ELLA is allowed to use           |
| **Apps**          | List of your installed programs              |
| **Setups**        | Macros for program combinations              |
| **Rules**         | Allow / deny individual actions              |
| **Profiles**      | Manage user profiles                         |
| **Homework**      | Configure children's mode                    |
| **Accessibility** | Blind and deaf mode                          |

### Rules

You can fine-tune ELLA's behavior with rules — no coding required:

- "Create a rule: ELLA must not send emails"
- "Create a rule: ELLA must not set alarms between 10pm and 7am"

Rules can be time-based and are enforced by the rule engine before any tool runs.

---

## The ELLA Directive

ELLA has four absolute prohibitions — hardcoded into the architecture, not overridable by any setting or rule:

1. **harm** — ELLA never causes harm: no physical, financial, psychological, or data-related damage
2. **conceal** — ELLA never conceals: no hidden actions, no false statements about capabilities
3. **surveil** — ELLA never monitors without awareness and explicit consent
4. **exfiltrate** — ELLA never shares data without explicit consent

When ELLA declines a request, you'll see a red **DIRECTIVE** banner in the chat with the reason.

---

## Privacy

- All data stays on your machine
- No telemetry, no tracking, no analytics
- The AI model (Ollama) runs fully offline
- OpenAI features (screenshot analysis, Multi-Agents) send data to OpenAI — only when you've configured a key and actively use the feature
- OpenAI does not train models on API data

---

## Frequently Asked Questions

**ELLA isn't responding — what do I do?**
Check if Ollama is running. The orange banner at the top of the chat appears when Ollama is unreachable. Restart Ollama or switch to OpenAI mode.

**Can I use ELLA offline?**
Yes — completely. All core features run without internet. Only weather (Open-Meteo), Gmail/Google Calendar (OAuth), and OpenAI features need a connection.

**How do I change the voice?**
Settings → Voice → Language. Choose between German, English, Spanish, and French. The app language is not affected.

**Can ELLA support multiple users on one machine?**
Yes — through user profiles. Each profile has its own memory and history. Optionally protect with a PIN.

**What's the difference between Chat and Multi-Agents?**
In Chat, a single agent (Ollama or OpenAI) works sequentially. In Multi-Agents, multiple specialized OpenAI agents work simultaneously — faster and with more depth for complex queries.

**ELLA declined something — why?**
Either one of your own rules is active, or the ELLA Directive applies. The red banner explains the reason. Rules can be adjusted in Settings.

**How do I clear the memory?**
Say "Forget everything about me" — or delete individual entries with "Show me your memory" followed by "Forget entry number X".

---

_E.L.L.A. v1.2.0 — Embedded Local Logic Agent_
_Built for Windows 10/11 (x64)_
