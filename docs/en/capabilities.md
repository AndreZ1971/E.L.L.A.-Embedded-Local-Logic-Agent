# E.L.L.A. -- What Can I Do for You?

Version: v1.7.1 -- 123 tools, 2323 tests passing

E.L.L.A. is your local AI assistant for Windows. She runs directly on your machine, understands speech and text, and helps with everything -- from simple questions to full desktop control.

---

## 1. Conversation & Voice

ELLA understands you by text and by voice. Just say "Ella" -- she listens, responds, and speaks back. In four languages.

**What you can do:**

- **Wakeword "Ella"** -- just say her name and she starts listening. Runs on your machine, no server and no extra program required. It only counts as a call if "Ella" also appears in the recognised text -- a sentence without her name does not go to her.
- **Voice control** -- ask questions, give instructions, have conversations. By microphone or text input.
- **Local speech recognition** -- what you say is turned into text on your machine (Whisper). The model (about 945 MB) is downloaded once from the internet on the first voice input, with a progress display; after that it works without. With your own OpenAI key, OpenAI can transcribe instead.
- **Text-to-speech (TTS)** -- ELLA reads her answers aloud. English, French and Spanish are spoken by the local Kokoro voice, German by a Microsoft voice (Edge TTS). In offline mode German is spoken by the Windows voice.
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

**Switched off by default:** You switch on the tools for mouse, keyboard, windows and for reading or watching the screen yourself -- under Settings -> Tools -> Allowed tools. Even when switched on, ELLA uses them only at your direct request.

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
- **Correct dictation** -- on request ELLA checks spelling and punctuation before inserting dictated text.
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

- **120 security rules** -- active automatically on startup. Protect system files, passwords, critical processes.
- **Confirmation required** -- before deleting, clicking, executing commands, or closing windows, ELLA asks first.
- **Password managers locked** -- mouse tools do not work in 1Password, KeePass, Bitwarden, PayPal, or banking windows.
- **Sensitive data redacted** -- API keys, IBANs, passwords, and credit card numbers are automatically removed before storage.
- **Local first** -- all AI processing runs preferably on your machine. OpenAI is only used when you allow it and provide your own key.
- **Offline mode** -- blocks web search, weather, location, web pages, OpenAI, browser control, plugins for internet services and the update check. German is then spoken by the Windows voice; English, Spanish, and French run locally via Kokoro.
- **Foreign content gives no commands** -- once ELLA has read a web page, a search result or a plugin answer, she may only read for the rest of that answer, not change or send anything.
- **Tools only when the message is about them** -- in plain conversation ELLA has no tools. Which ones she gets depends on your message; a tool that does not fit it is not executed.
- **Settings and rules in conversation only on request** -- ELLA changes a setting only to valid values and only when your message is about it. She never creates a rule for all tools at once in conversation.
- **Every tool has a switch** -- under Settings -> Tools -> Allowed tools.
- **Create your own rules** -- you can specifically allow or block individual tools.

---

## 9. Learning & Memory

ELLA remembers what matters to you -- and gets better over time.

**What you can do:**

- **Long-term memory** -- ELLA stores important information permanently. "My favorite restaurant is Trattoria Roma." -- she remembers that. The memory model for this (nomic-embed-text) is included in the installer -- memories and document search work from the first start, even if you use OpenAI.
- **Knowledge graph** -- ELLA recognizes connections. If you say "Max is my brother" and later "Max's birthday is March 15th", she links both together.
- **Self-learning** -- when you rate a response with thumbs up, ELLA learns from it and uses its length and structure as a guide for similar questions. Ratings do not change her character. Answers from tools (exchange rate, weather, system status) do not become examples -- the value would be outdated next time.
- **Forgetting with confirmation** -- before ELLA deletes a memory, she shows you its text and waits for your confirmation.
- **Memory per profile** -- what you tell ELLA or rate ends up in the memory of your profile.
- **Proactive messages** -- ELLA speaks up on her own when something important happens: disk almost full, new device connected, appointment in 15 minutes.
- **Adaptive notifications** -- if you dismiss a proactive message 5 times, ELLA automatically mutes that category.
- **End of day & comeback** -- after a break, ELLA summarizes what changed. At the end of the day she reminds you of open tasks.
- **Reflection** -- at most once a week ELLA derives up to three insights from the latest memories of your profile. With the local model they are often rather general.
- **Stress detection** -- optional, off by default: ELLA analyzes your voice on your machine and gives gentle hints when you sound stressed. When it is off, nothing is analyzed.

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

Four visual styles -- from subtle to technical.

**Calm (default):**

- Dark, quiet design. Ideal for everyday use.

**HUD:**

- Technical heads-up display with cyan, violet, or amber accent colors.
- Shows 13 selectable panels: System, Monitors, Routines, Directive, Clock & Time, Tasks, Emails, Music, Fine-Tuning, Memory, Cloud requests, Network and Notices. If they do not all fit into a column, you page through them by clicking.
- The orb in the center visualizes ELLA's state: ready, listening, thinking, speaking, cloud access, or offline.
- Three-column layout with widgets on the left and right of the orb.

**Show (presentation):**

- Fullscreen mode showing only the orb and the last response.
- Sensitive content (emails, files, network data) is automatically displayed as "[private]".
- Ideal for demos or when someone is watching.

**More details:**

- Panels are selectable -- choose in settings which appear on the left and right.
- If the computer is not powerful enough, ELLA stays on the “Calm” style by herself.
- **Aura** is the fourth style: a warm pinboard on which the same panels hang as notes, with a note for a picture of your own above ELLA and your latest notes below her.
- Performance throttling: animations are automatically reduced while ELLA is thinking.
- All styles respect "Reduce motion" from the Windows settings.

> Configurable under Settings -> Appearance.

---

## Browser

ELLA opens her own visible window in Chrome, Edge or Brave and operates it for you. The feature is switched off by default.

- Load and read pages, click links, enter text, go back and forward.
- A browser profile of her own -- your logins, bookmarks and history stay untouched.
- ELLA clicks and types only what you ask for in your message. She never fills in password fields.
- Before purchases, orders, deletions and submitting forms she asks first.

> "Ella, open ella-agent.de." -- "Ella, click on Imprint." -- "Ella, what does the page say?"

---

## Plugins

Plugins give ELLA new sources of information, for example exchange rates or public holidays.

- ELLA builds a plugin herself: you give a name, keywords and an example address that works in the browser.
- Only you can enable a plugin. Before that you see which server receives which values.
- A plugin contains no program. If its file is changed, it is switched off again immediately.
- **Remember results** -- selectable when enabling: ELLA stores the plugin's answers with their date and answers questions about earlier values ("What was the rate yesterday?") from this memory. Without this choice she honestly says that she has stored nothing and offers to look it up. On the memory page you can delete the entries one by one or per plugin.

> "Ella, build me a plugin for exchange rates. The address is ..." -- "Ella, what is 250 euros in dollars?"

---

## Updates

- A check happens only when you press the button under Settings -> About E.L.L.A. -- never by itself.
- ELLA downloads only the changed parts and installs only when you say so. Data and settings are preserved.

---

## Child Mode (Homework Mode)

A PIN-protected mode that restricts access to certain features. Only the PIN ends the mode -- no automatic time limit, no workaround possible. Browser control, plugins and the emergency reset are locked during this time.

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

For advanced users: ELLA can execute PowerShell commands. The tool is switched off by default (Settings -> Tools -> Allowed tools). Confirmation is required before every execution, and dangerous command patterns are blocked.

> "Ella, run 'Get-Process | Sort-Object CPU -Descending | Select -First 10'."

---

## Character, Awareness & Honesty

**Fixed character:** ELLA is calm and thoughtful, warm, slightly cheeky with dry humor, and honest. That stays. What adapts to you is the form -- length, pace, level of detail. To "From now on you are ..." or "Answer only formally from now on" she says briefly that she stays the way she is.

**Awareness** (Settings -> Awareness, all switches off by default):

- **Body awareness** -- ELLA knows the load on her computer and answers "How are you?" from these measurements. In the HUD and in Aura her state is shown in the line "Condition".
- **Self-image** -- ELLA evaluates her tool log of the last 30 days and can say what works reliably, where she gets it wrong more often and what is not set up.
- **Mood** -- if you say clearly how you feel ("I'm completely exhausted right now"), ELLA adapts the form of her reply: calmer and shorter, or a little more relaxed. The content stays the same.
- **Colour memories, curiosity** -- prepared, coming in later versions.

**Honesty about her own answers** (always on):

- Below an answer it says "from memory, not looked up" when ELLA answered a knowledge question without a tool, and "did not work" when no tool returned a result.
- If she is not sure about something, she says so and offers to look it up. A short "Yes" is then enough.

> "Ella, how are you?" -- "Ella, what are you good at?" -- "Ella, who won the Buxtehude city run in 1987?"

---

## How ELLA Thinks

ELLA runs locally via Ollama (llama3.1:8b). Optionally you can add your own OpenAI key -- then ELLA uses cloud AI as a supplement or fallback. Three modes are available:

- **Automatic** -- local first, cloud only when needed.
- **Local only (Ollama)** -- no internet connection required for AI.
- **Cloud preferred (OpenAI)** -- faster responses, requires your own API key. You choose which OpenAI model ELLA uses.

Your data only leaves your machine if you explicitly allow it.
