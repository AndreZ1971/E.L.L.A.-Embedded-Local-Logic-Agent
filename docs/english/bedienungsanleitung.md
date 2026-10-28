# E.L.L.A. -- User Manual

Version 1.5.7

---

## What is E.L.L.A.?

E.L.L.A. stands for _Embedded Local Logic Agent_ -- your personal AI assistant for Windows. ELLA runs directly on your own machine. No subscription, no privacy fine print. Install and go.

The AI runs locally via Ollama -- your data stays on your computer. For some optional features (German voice output, multi-agents, image recognition) you can configure your own OpenAI key -- details at [Network connections](network.md).

---

## 1. First Launch

### Installation

1. Run the setup file
2. Choose an installation path (default: `C:\Program Files\E.L.L.A`)
3. The installer sets everything up automatically -- nothing else to install

### Onboarding

On first launch, ELLA guides you through setup in six steps:

1. **Language** -- German or English for the interface
2. **Terms of use** -- accept the EULA and the ELLA Directive
3. **Hardware scan** -- ELLA detects your system and suggests a suitable language model. You confirm the choice -- no download without your consent
4. **Voice selection** -- 4 female voices in German, English, Spanish, and French. Each voice can be previewed
5. **Location** -- for weather and local information (optional, can be skipped)
6. **License activation** -- enter your license key (`ELLA-XXXX-XXXX-XXXX-XXXX`)

After that the chat opens -- done.

---

## 2. Chat -- How Do I Talk to ELLA?

Just write in plain language. No commands, no special syntax. ELLA understands natural language.

**Examples:**

- "What's the weather like tomorrow?"
- "Open Chrome and Spotify"
- "Summarize this PDF"
- "How much storage space is left?"

### What You See in the Chat

- **Tool chips:** Below each response, ELLA briefly shows which tool she used -- full transparency over every action
- **Provider chip:** Bottom-left in the chat, a green chip shows whether the local AI or the cloud is currently active
- **Directive banner:** When ELLA declines a request, a red banner appears with the reason
- **Feedback buttons:** Thumbs up or thumbs down below each response -- ELLA learns from your feedback and adapts permanently

### Memory

ELLA remembers things across conversations. You can teach her explicitly:

- "Remember: I don't drink coffee in the morning"
- "What do you know about me?"
- "Forget the note about coffee"

ELLA also recognizes connections: If you say "My son's name is Max" and later "Max goes to Einstein High", ELLA can answer the question "What school does my son go to?"

---

## 3. Voice Control

### Voice Modes

In Settings under "Voice" you'll find four modes:

| Mode         | Description                                       |
| ------------ | ------------------------------------------------- |
| **Off**      | No automatic listening                            |
| **Manual**   | Microphone button in the chat only                |
| **Wakeword** | Say "Ella" -- ELLA then listens and responds      |
| **Always**   | Continuous listening -- ELLA listens all the time |

**Tip:** In wakeword mode you can continue speaking for 8 seconds after a response without saying "Ella" again.

### Stop Command

While ELLA is speaking, you can interrupt her at any time. Just say "Stop", "Quiet", "Shut up", or "Be quiet" -- voice output stops immediately.

### Dictation Mode

In dictation mode, your speech is transcribed and typed directly into the active window on your screen -- whether it's Word, a browser, or an email program.

**Activate:**

- Settings -> Voice -> set mode to "Dictation"
- Or: keyboard shortcut `Ctrl+Alt+Space` (configurable in Settings)

ELLA listens, converts speech to text, and types it into the active window. Optionally, spell correction can be enabled before insertion. Your clipboard is not overwritten in the process.

### Voice Output

ELLA speaks in four languages: German, English, Spanish, and French.

- **English, French, and Spanish** use a local voice (Kokoro); if Kokoro is unavailable, Edge TTS is used as fallback (internet connection required)
- **German** uses Microsoft Edge TTS -- the spoken text is sent to Microsoft servers

You choose the voice during onboarding or later under Settings -> Voice.

---

## 4. Settings

All settings are accessible via the gear icon.

### AI Provider

| Mode               | Description                                      |
| ------------------ | ------------------------------------------------ |
| **Ollama (local)** | Everything runs on your machine. Default setting |
| **OpenAI**         | Cloud-based. Requires your own OpenAI API key    |
| **Auto**           | Local first, OpenAI as fallback when needed      |

### Language Model

ELLA suggests a model suited to your hardware during onboarding. You can change it anytime:

- **Predefined models:** Small, Standard, or Large -- depending on your machine's power
- **Custom model:** Any model installed in Ollama appears as a selectable option. You can also enter any model name

### Voice and Language

- **Spoken language:** DE / EN / ES / FR -- determines the voice and pronunciation
- **Stress detection:** Optional -- ELLA detects tension in your voice and responds more empathetically (opt-in, off by default)

### Appearance

Three visual styles:

- **Calm** (default) -- Quiet, dark design. Classic sidebar
- **HUD** -- Technical layout with data panels, top bar instead of sidebar, and a central orb as visualization
- **Show** -- Presentation mode in fullscreen. Shows only the orb and the last response. Sensitive data (emails, file paths) is automatically hidden

**Accent colors in HUD mode:** Cyan, Violet, or Amber.

Switch: Settings -> Appearance.

In blind mode, homework mode, or when reduced motion is enabled on the system, ELLA automatically falls back to Calm.

### Programs

ELLA can open and control installed programs. Under Settings -> Programs you see all detected apps.

- **Program not found?** Use the search field or add it manually via the "Browse" button
- Newly installed programs appear automatically after a scan

### Setups (App Macros)

A setup opens and closes multiple programs at once -- like pressing a single button.

- **Create:** Settings -> Setups -> New. Or in chat: "Create a setup called Home Office: open Teams, Outlook, and Chrome"
- **Run:** "Load my work setup" or the "Run now" button in Settings
- **Actions:** Each setup can include additional actions (change volume, toggle dark mode, translate text, and more)

### Rules

You can control ELLA's behavior with custom rules:

- "Create a rule: ELLA must not send emails"
- "Rule: no alarms between 10pm and 7am"

Rules can be managed in Settings.

### Cloud Transparency

All requests to OpenAI are counted and shown as a tile on the dashboard. You can always see how often the cloud was used today.

### Offline Mode

Under Settings -> Offline Mode you can block most internet services:

- Web search, weather, location, and webpage analysis blocked
- No OpenAI
- License verification uses the local cache
- Local network features (devices on WiFi, connections) remain available

Note: In offline mode, only Kokoro TTS is available (English, French, Spanish). German voice output (Edge TTS) is disabled in offline mode.

---

## 5. HUD Mode

HUD mode turns ELLA into a technical dashboard with live data.

### Activate

Settings -> Appearance -> select HUD.

### What Changes?

- **Top bar** instead of sidebar -- with logo, navigation, and status chips (LOCAL / OFFLINE / CLOUD)
- **Central orb** -- an animated circle that visualizes ELLA's state (ready, listening, thinking, speaking, cloud, offline)
- **Widget columns** -- left and right of the chat, configurable panels show live data

### Widgets

In Settings (Appearance tab) you can choose which widgets appear on the left and right. Available widgets:

| Widget        | Shows                                   |
| ------------- | --------------------------------------- |
| **System**    | CPU, RAM, VRAM, disk, temperature       |
| **Monitors**  | Connected displays                      |
| **Routines**  | Your setups with next execution time    |
| **Directive** | The 4 core rules of the ELLA Directive  |
| **Clock**     | Digital clock                           |
| **Tasks**     | Open tasks (max 5) with priority colors |
| **Email**     | Last 4 emails with unread count         |
| **Music**     | Currently playing track                 |

### Performance

ELLA automatically throttles animations while thinking -- so your machine is not slowed down. This throttling can be toggled under Settings -> Appearance.

---

## 6. Homework Mode

Homework mode is a PIN-secured kiosk mode -- designed for situations where only certain programs should be allowed.

### How It Works

1. Say: "Activate homework mode" or go to Settings
2. Set a PIN
3. From now on, only approved programs can be accessed

### Ending It

Only with the PIN. There is no automatic expiry -- the mode stays active until the correct PIN is entered.

If the PIN is lost, there is an emergency reset.

---

## 7. Accessibility

### Blind Mode

Optimized for screen readers and blind users:

- Voice output is always active -- every response is read aloud
- No markdown formatting (bullet points, bold text, etc.) -- only clear, linear text
- Audio tones signal state changes (ready, thinking, responding)
- All buttons and input fields have descriptive labels for screen readers
- Welcome announcement when the app loads

### Deaf Mode

Optimized for deaf users:

- Voice output and the microphone button are completely hidden
- A visual banner in the chat shows that the mode is active
- ELLA does not mention voice features in her responses

Both modes are found under Settings -> Accessibility.

---

## 8. Proactive Messages

ELLA sometimes reaches out on her own -- without you asking. This happens for example when:

- A drive drops below 10% free space
- RAM is sustained high
- A USB device is plugged in or removed
- An alarm triggers
- An IBAN, tracking number, or phone number is detected in the clipboard
- A calendar appointment starts in 15 minutes
- Open tasks remain in the evening
- You have been working for a long time without a break

### Muting

Every proactive message has two buttons:

- **Dismiss** -- close this individual message
- **Mute** -- permanently suppress this type of message

After dismissing the same category 5 times, ELLA mutes it automatically.

System-critical notifications (alarms, scheduled setups) cannot be muted.

---

## 9. Playing Chess

ELLA can play chess -- in a dedicated window with four visual themes.

```
"Let's play chess"
"Open the chess board"
```

- **4 Themes** -- Classic, Neon, Marble, and Midnight. Each with its own color scheme, glow effect, and particle background
- **AI opponent** -- ELLA picks her move from the legal options and comments on the game live
- **Pause and resume** -- Interrupt games anytime. When reopening, a "Continue" button appears
- **Reflection** -- After the game ends, ELLA stores insights and plays better next time
- **Captured pieces** -- Displayed with material advantage above and below the board

---

## 10. Files and Documents

### Searching for Files

```
"Search for the file Proposal"
"Find all PDFs with the word Invoice"
"Where is my resume?"
```

ELLA searches all drives -- using the Windows Search Index for fast results.

### Opening, Copying, Renaming, Deleting Files

```
"Open C:\Documents\Report.docx"
"Copy the document Contract to D:\Backup"
"Rename the file Photo1.jpg to Vacation2024.jpg"
"Delete the file temp_backup.zip"
```

### Reading and Understanding Documents

ELLA can read Word documents, PDFs, Excel spreadsheets, HTML, and text files:

```
"What does this PDF say?"
"Summarize the Word document"
"Read me the Excel spreadsheet"
```

### Creating Documents and Dictating

```
"Create a new Word document called Minutes"
"Dictate into the document Report: Dear Sir or Madam..."
```

### Full-Text Search in Your Documents

ELLA can index folders and make their contents searchable:

```
"Index my Documents folder"
"Search my indexed documents for tax notice"
```

### Finding Duplicate Files

```
"Find duplicate files"
"How much space am I wasting on duplicates?"
```

---

## 11. Email and Calendar

### Outlook

ELLA works directly with Outlook:

**Reading emails:**

```
"Show me my unread emails"
"What did Klaus write?"
```

**Composing emails:**

```
"Write a draft to Klaus: meeting tomorrow at 2pm?"
```

ELLA opens a draft in Outlook -- the email is not sent automatically.

**Calendar:**

```
"What's on my calendar this week?"
"Create an appointment: dentist, Friday at 10am"
```

### Gmail and Google Calendar

ELLA also supports Gmail and Google Calendar via a one-time sign-in (OAuth):

```
"Show me my Gmail emails"
"What's on my Google Calendar today?"
"Appointment in Google Calendar: doctor, Monday 9am"
```

Setup is found in the Settings.

---

## 12. Keyboard Shortcuts

| Shortcut         | Function                                         |
| ---------------- | ------------------------------------------------ |
| `Ctrl+Alt+Space` | Toggle dictation mode (configurable in Settings) |
| `Esc`            | Exit presentation mode (Show)                    |

---

## More Features

### Writing and Translating Text

```
"Write me a professional cover letter for the position of..."
"Translate this to German"
"Summarize this text"
"Correct this text"
```

ELLA can also learn your personal writing style and compose texts that sound like you.

### System and Performance

```
"How is my system running right now?"
"How much space is left on C?"
"How hot is my CPU?"
"Free the RAM"
"Clean up temp files"
```

### Music and Media

```
"Play something by Coldplay"
"Pause"
"Next track"
"What's playing right now?"
```

### Tasks and Reminders

```
"Add the task 'File taxes'"
"Show me my open tasks"
"Set an alarm for 7:30"
"Remind me tomorrow at 3pm: call the doctor"
```

### Network

```
"Who's on my network?"
"Show me active connections"
"What's my WiFi status?"
```

### Internet and Search

```
"Search for the current Bitcoin price"
"What's the weather like today?"
```

Web search runs via DuckDuckGo -- no tracking.

### Programs and Window Control

```
"Open Chrome"
"Minimize the current window"
"Close all Word windows"
"Turn on dark mode"
"Shut down the computer"
```

### Multi-Agents

The most powerful feature: Multiple AI agents work simultaneously on a task -- faster and more thorough.

Requires an OpenAI key. Two predefined pipelines:

- **Morning Briefing** -- calendar appointments, open tasks, and weather at a glance
- **System Report** -- storage, RAM, top processes, and network status

You'll find Multi-Agents as a separate page in the navigation.

### Hardware Information

```
"What graphics card do I have?"
"How much RAM is installed?"
"What USB devices are connected?"
"Which monitors are connected?"
```

### Printers

```
"What printers do I have?"
"Print the document"
"Show me active print jobs"
```

### Camera

```
"What cameras are connected?"
"Take a photo"
```

### Desktop Automation

ELLA can read your screen, control mouse and keyboard:

```
"What does my screen say?"
"Click the OK button"
"Send Ctrl+C to the active window"
```

---

## User Profiles

Multiple people can use ELLA on the same machine -- each profile has its own memory and its own history. Profiles can optionally be protected with a PIN.

Settings -> Profiles.

---

## The ELLA Directive

Four absolute core rules -- anchored in the architecture, not disableable:

1. **No harm** -- physical, financial, psychological, or data-related
2. **No concealment** -- all actions and capabilities are transparent
3. **No surveillance** -- without your knowledge and consent
4. **No data sharing** -- without your explicit consent

When ELLA declines a request because of the Directive, a red banner appears in the chat with the reason.

---

## Privacy

- All data stays on your machine -- no usage data sent to third parties
- No telemetry, no tracking
- Ollama and the database run locally
- German voice output via Edge TTS: the spoken text is sent to Microsoft servers (only exception during standard operation)
- OpenAI features (image recognition, multi-agents, speech recognition) only when you have configured your own key
- Full transparency: [Network connections](network.md)

---

## Frequently Asked Questions

**ELLA isn't responding?**
Ollama may not be running. The orange banner at the top of the chat indicates this. Wait briefly or switch to OpenAI in Settings.

**Can I use ELLA offline?**
Yes, the core (chat, tools, memory) runs on your machine. Only German voice output (Edge TTS), weather, Gmail/Google Calendar, and OpenAI features need internet. Offline mode blocks web search, weather, cloud AI (OpenAI), and German voice output. Gmail and Google Calendar remain available in offline mode.

**How do I change the language model?**
Settings -> LLM -> choose a model or enter a custom name.

**How do I add a program ELLA can't find?**
Settings -> Programs -> search field or Browse button.

**ELLA declined something -- why?**
Either one of your custom rules is active or the ELLA Directive applies. The red banner explains the reason. Custom rules can be adjusted in Settings.

**How do I clear the memory?**
"Forget everything about me" -- or individual entries: "Show me your memory" and then "Forget entry number X".

**What does cloud usage cost?**
ELLA itself is a one-time purchase. If you use an OpenAI key, the standard OpenAI API costs apply. In Auto mode, the cloud is used only as a fallback -- most requests run locally.

---

_E.L.L.A. v1.5.7 -- Embedded Local Logic Agent_
_Built for Windows 10/11 (x64)_
