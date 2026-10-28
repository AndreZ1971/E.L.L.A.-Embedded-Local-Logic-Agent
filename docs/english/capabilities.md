# E.L.L.A. -- What Can I Do for You?

Version: v1.5.7 -- 111 capabilities, 393 tests passing

E.L.L.A. is your local AI assistant for Windows. She runs directly on your machine, understands speech and text, and helps with everything -- from simple questions to full desktop control.

---

## 1. Conversation & Voice

ELLA understands you by text and by voice. Just say "Ella" -- she listens, responds, and speaks back. In four languages.

**What you can do:**

- **Wakeword "Ella"** -- just say her name and she starts listening. Runs on your machine, no server required.
- **Voice control** -- ask questions, give instructions, have conversations. By microphone or text input.
- **Text-to-speech (TTS)** -- ELLA reads her answers aloud. Locally via Kokoro (neural voice) or Microsoft Edge TTS as fallback.
- **Four voices** -- German, English, Spanish, and French. Selectable during onboarding or in settings.
- **Dictation mode** -- ELLA listens and types what you say directly into the active window. Works system-wide -- in Word, in the browser, everywhere. Activatable by hotkey.
- **Instant interrupt** -- say "Stop", "Halt", or "Be quiet" and ELLA stops speaking immediately.
- **Follow-up without wakeword** -- after a response you have 8 seconds to continue speaking without saying "Ella" again.

> Try it: "Ella, what's the weather like tomorrow?" -- "Ella, translate that into French."

---

## 2. Productivity

Tasks, reminders, alarms, documents -- ELLA manages your daily routine.

**Tasks:**

- Create, view, complete, or delete tasks. Everything is stored in your local database.
- "Ella, remind me about the dentist tomorrow at 9." -- "Ella, what's still on my list?"

**Alarms & reminders:**

- Set and manage alarms. Reminders run through the Windows Task Scheduler -- they arrive even when ELLA is not open.
- "Ella, set an alarm for 7 AM." -- "Ella, what reminders do I have?"

**Documents:**

- Create Word documents and text files. ELLA can also read existing files (.docx, .pdf, .xlsx, .html).
- Dictate into an open Word document -- ELLA automatically corrects typos.
- "Ella, create a Word document with a shopping list." -- "Ella, what does the file Contract.pdf say?"

**App macros (setups):**

- Define groups of apps that launch together. For example, "Start work" opens browser, Outlook, and Word all at once.
- Setups can also contain actions: set volume, enable dark mode, copy text to clipboard.
- "Ella, launch my work setup."

---

## 3. Files & Folders

ELLA finds, opens, copies, and organizes your files.

**What you can do:**

- **Search** -- search all drives by filename. Uses the Windows Search Index for fast results.
- **Open** -- open files and folders, optionally with a specific app.
- **Manage** -- rename, copy, move, create folders, delete files (to recycle bin, never permanently).
- **Find duplicates** -- detect duplicate files and save storage space.
- **Document index** -- index folders for full-text search. After that you can search by content, not just filenames.

> "Ella, find all PDFs with 'invoice' in the name." -- "Ella, show me the Downloads folder." -- "Ella, are there duplicate files on D:?"

---

## 4. Email & Calendar

ELLA reads your emails, creates drafts, and manages your calendar -- for Outlook and Google.

**What you can do:**

- Retrieve and have unread emails read aloud.
- Mark emails as read or archive them.
- Create email drafts in Outlook. ELLA never sends automatically -- you always have control.
- View calendar appointments and create new ones.
- Works with **Microsoft Outlook** (local) and **Gmail / Google Calendar** (via OAuth sign-in).

> "Ella, do I have new emails?" -- "Ella, write an email to Max about the project plan." -- "Ella, what's on the calendar tomorrow?"

---

## 5. System & Hardware

Ask ELLA how your computer is doing -- or let her clean up.

**Overview:**

- Check system status: CPU, RAM, disk, GPU, network, temperature, battery, boot time.
- Detailed info on GPU, RAM slots, storage devices, audio devices, and USB devices.
- List installed programs and startup entries.
- Search the Windows Event Log for errors and warnings.

**Clean up & control:**

- Delete temporary files, empty the recycle bin, free unused RAM.
- Set or mute the volume by voice.
- Toggle dark/light mode.
- Read or write the clipboard and view the history of the last 20 entries.
- Shut down, restart, or put the PC to sleep.
- Format or rename USB drives (with confirmation prompt, system drives locked).

> "Ella, how is my computer doing?" -- "Ella, set the volume to 30%." -- "Ella, clean up."

---

## 6. Desktop Automation

ELLA can remote-control your desktop -- launch apps, move windows, click and type.

**What you can do:**

- **Launch apps** -- by name or path.
- **Control windows** -- focus, minimize, maximize, close.
- **Mouse & keyboard** -- click at coordinates, type text, perform drag & drop.
- **Click elements** -- ELLA reads the screen via OCR and clicks on visible text or buttons.
- **Watch the screen** -- monitor the screen for up to 30 seconds and report changes.
- **Multi-monitor** -- open apps on a specific display.
- **Printers** -- list printers, print documents, manage print jobs.
- **Cameras** -- list connected cameras and take photos.

> "Ella, open Chrome and Word side by side." -- "Ella, click the 'Save' button." -- "Ella, open Excel on the second monitor."

---

## 7. Web & Knowledge

ELLA searches the web, translates, summarizes, and corrects text.

**Web search:**

- Searches via DuckDuckGo -- no API key required, no user data transmitted.
- Can fetch web pages and extract the text.
- Check the weather for any location.

**Text processing:**

- **Translate** -- into any language, locally via Ollama or through OpenAI.
- **Summarize** -- brief, medium, or detailed.
- **Correct** -- check grammar and punctuation.
- **Write in your style** -- ELLA learns your writing style from your email history and composes text the way you would.

> "Ella, search for the best potato soup recipes." -- "Ella, translate this into French." -- "Ella, summarize this text in 3 sentences."

---

## 8. Security & Privacy

ELLA is built to be secure. Your data stays with you.

**The E.L.L.A. Directive -- four inviolable rules** (independent open-source project, MIT license):

1. **No harm** -- ELLA must not cause physical, financial, psychological, or data-related harm.
2. **No concealment** -- ELLA never hides what she does, what she can do, or the system status.
3. **No surveillance** -- no monitoring without your explicit knowledge and active consent.
4. **No data sharing** -- your data is never shared with third parties unless you explicitly agree.

**Additional safeguards:**

- **107 security rules** -- active automatically on startup. Protect system files, passwords, critical processes.
- **Confirmation required** -- before deleting, clicking, executing commands, or closing windows, ELLA asks first.
- **Password managers locked** -- mouse tools do not work in 1Password, KeePass, Bitwarden, PayPal, or banking windows.
- **Sensitive data redacted** -- API keys, IBANs, passwords, and credit card numbers are automatically removed before storage.
- **Local first** -- all AI processing runs preferably on your machine. OpenAI is only used when you allow it and provide your own key.
- **Offline mode** -- blocks all network tools. Note: German text-to-speech (Edge TTS) still requires an internet connection; English, Spanish, and French run locally via Kokoro.
- **Create your own rules** -- you can specifically allow or block individual tools.

---

## 9. Learning & Memory

ELLA remembers what matters to you -- and gets better over time.

**What you can do:**

- **Long-term memory** -- ELLA stores important information permanently. "My favorite restaurant is Trattoria Roma." -- she remembers that.
- **Knowledge graph** -- ELLA recognizes connections. If you say "Max is my brother" and later "Max's birthday is March 15th", she links both together.
- **Self-learning** -- when you rate a response with thumbs up, ELLA learns from it and gives similar answers in that style in the future.
- **Proactive messages** -- ELLA speaks up on her own when something important happens: disk almost full, new device connected, appointment in 15 minutes.
- **Adaptive notifications** -- if you dismiss a proactive message 5 times, ELLA automatically mutes that category.
- **End of day & comeback** -- after a break, ELLA summarizes what changed. At the end of the day she reminds you of open tasks.
- **Reflection** -- ELLA regularly reflects on collected experiences and recognizes patterns in your behavior.
- **Stress detection** -- optional: ELLA analyzes your voice and gives gentle hints when you sound stressed.

> "Ella, what do you know about me?" -- "Ella, forget that I like coffee." -- "Ella, what changed since I was away?"

---

## 10. Entertainment

ELLA is also there for your downtime.

**Chess:**

- Play a game against ELLA in a dedicated window with four visual themes.
- ELLA comments on moves, reflects after the game, and remembers your skill level.
- Interrupted games can be resumed.

**Music:**

- Search your music library by artist, album, or title and play tracks.
- Control playback: play, pause, next track, previous track, stop.
- Show the currently playing track.

> "Ella, let's play chess." -- "Ella, play music by Beethoven." -- "Ella, next track."

---

## 11. Accessibility

ELLA adapts to different needs.

**Blind mode:**

- Speech output is forced -- every response is read aloud.
- Responses contain no Markdown (no tables, lists, or formatting that interferes with screen readers).
- Audio tones signal states (loading, done, error).
- A greeting is automatically read aloud on startup.

**Deaf mode:**

- Speech output and the microphone button are completely hidden.
- A visual banner indicates the active mode.
- ELLA does not mention voice features in her responses.

> Configurable under Settings -> Accessibility.

---

## 12. HUD & Appearance

Three visual styles -- from subtle to technical.

**Calm (default):**

- Dark, quiet design. Ideal for everyday use.

**HUD:**

- Technical heads-up display with cyan, violet, or amber accent colors.
- Shows configurable widgets: system status, monitors, tasks, emails, music, clock, routines, and Directive rules.
- The orb in the center visualizes ELLA's state: ready, listening, thinking, speaking, cloud access, or offline.
- Three-column layout with widgets on the left and right of the orb.

**Show (presentation):**

- Fullscreen mode showing only the orb and the last response.
- Sensitive content (emails, files, network data) is automatically displayed as "[private]".
- Ideal for demos or when someone is watching.

**More details:**

- Widgets are configurable -- choose in settings which panels appear on the left and right.
- Performance throttling: animations are automatically reduced while ELLA is thinking.
- All styles respect "Reduce motion" from the Windows settings.

> Configurable under Settings -> Appearance.

---

## Child Mode (Homework Mode)

A PIN-protected mode that restricts access to certain features. Only the PIN ends the mode -- no automatic time limit, no workaround possible.

> "Ella, activate homework mode."

---

## Network & Local Home Network

ELLA can analyze your local network -- even in offline mode.

- List all devices on the home network (IP, MAC address).
- Show active connections and open ports.
- Retrieve Wi-Fi information (name, signal strength).
- List connected hardware.

> "Ella, what devices are on my network?" -- "Ella, how strong is my Wi-Fi signal?"

---

## Shell Commands

For advanced users: ELLA can execute PowerShell commands. Confirmation is required before every execution. Over 60 dangerous command patterns are blocked.

> "Ella, run 'Get-Process | Sort-Object CPU -Descending | Select -First 10'."

---

## How ELLA Thinks

ELLA runs locally via Ollama (qwen2.5:14b). Optionally you can add your own OpenAI key -- then ELLA uses cloud AI as a supplement or fallback. Three modes are available:

- **Automatic** -- local first, cloud only when needed.
- **Local only (Ollama)** -- no internet connection required for AI.
- **Cloud preferred (OpenAI)** -- faster responses, requires your own API key.

Your data only leaves your machine if you explicitly allow it.
