# E.L.L.A. – Frequently Asked Questions (FAQ)

Version 1.6.9

Every answer stands on its own. You can give this file, together with the [user manual](bedienungsanleitung.md), to E.L.L.A. to read – she then answers these questions right in the chat (see “Can E.L.L.A. answer questions about herself?”).

---

## 1. General

### What is E.L.L.A.?

E.L.L.A. stands for _Embedded Local Logic Agent_. She is a personal AI assistant for Windows that runs on your own computer. She understands plain language and gets things done on your PC: starting programs, finding files, reading documents, playing music, writing email drafts, looking up appointments, setting alarms and much more.

### What makes E.L.L.A. special?

- **Runs locally:** The language model runs on your computer. Your conversations stay on your PC.
- **Remembers things:** E.L.L.A. has a memory for preferences, people, places and projects.
- **Speaks up by herself:** She writes into the chat when something matters, for example when a drive is full.
- **Shows what she does:** Every action is visible. Before consequential actions she asks.
- **Fixed basic rules:** Four built-in prohibitions (harm, concealment, surveillance, data sharing) cannot be switched off by any setting.

### Can E.L.L.A. answer questions about herself?

Yes, if you give her the user manual and this FAQ as documents. Download the files `bedienungsanleitung.md` (the manual) and `faq.md` from the public E.L.L.A. project on GitHub (<https://github.com/AndreZ1971/E.L.L.A.-Embedded-Local-Logic-Agent/tree/main/docs/en>) and save them on your computer. The versions for the latest release are always there. Then open **Settings → Tools → Local RAG — Document Knowledge** and click **Add file** under **Individual Documents**. E.L.L.A. reads the files and pulls in the matching passages when you ask about how to use her.

### Which systems does E.L.L.A. run on?

On Windows 10 and Windows 11, 64-bit. A version for Mac or Linux is not planned.

### Do I need the internet?

Not for the core: chat, memory, file search, system control, music and the local speech recognition run on your computer.

You need the internet for:

- the license check at startup (without a connection the last stored check applies),
- web search, weather, location and opening web pages,
- the German voice from Microsoft (without internet the Windows voice speaks),
- OpenAI, if you have entered your own key,
- Gmail and Google Calendar, if connected,
- plugins that query a service on the internet,
- the update check (only at the push of a button),
- the one-time download of the language model on the first start.

All connections in detail: [Network connections](network.md).

### Which data leaves my computer?

In purely local operation no conversation content leaves your computer. Two things you should know:

- **German voice:** The text E.L.L.A. reads aloud in German goes to Microsoft servers. In offline mode the Windows voice speaks instead and nothing is sent. English, French and Spanish are spoken by a local voice.
- **What you start yourself:** A web search sends the search term to the search engine; a plugin sends the values you approved to its server.

If you enter an **OpenAI key** and use OpenAI, your chat messages go to OpenAI – together with what E.L.L.A. draws on for them: matching memories, documents she has read and pages she reads in the browser. Images are added for image analysis, and audio recordings if speech recognition runs through OpenAI. Each of these requests is counted and shown in the dashboard and in the “Cloud requests” panel.

---

## 2. Hardware and speed

### Which hardware do I need?

E.L.L.A. runs on most Windows computers of recent years. She runs best with an NVIDIA graphics card, because the language model is loaded into the memory of the graphics card.

| Requirement   | Minimum                     | Recommended                 |
| ------------- | --------------------------- | --------------------------- |
| Processor     | Intel i3 (12th gen) / AMD Ryzen 3 | Intel i5/i7 / AMD Ryzen 5/7   |
| Memory        | 8 GB                              | 16 GB                         |
| Graphics card | NVIDIA GTX 1060 (6 GB VRAM)       | NVIDIA RTX 2060+ (12 GB VRAM) |
| Disk          | 10 GB SSD                         | 20 GB SSD                     |

Without a suitable graphics card E.L.L.A. runs on the processor – slower, but she works. The binding figures are on [ella-agent.de](https://ella-agent.de). More: [Hardware](hardware.md).

### Does E.L.L.A. work on my laptop?

Yes, from 8 GB of memory (16 GB recommended). How fast she answers depends on the graphics card:

- **Laptop with a strong NVIDIA graphics card:** runs like a desktop computer.
- **Laptop with a small graphics card:** works, but answers more slowly.
- **Laptop without a dedicated graphics card:** works, but is slow. An OpenAI key is recommended here.

On the first start E.L.L.A. checks your hardware and suggests a suitable model.

### E.L.L.A. answers slowly – what can I do?

| Cause                      | Solution                                                         |
| -------------------------- | ---------------------------------------------------------------- |
| No or small graphics card  | Choose a smaller hardware profile or use OpenAI (Settings → LLM) |
| Too little memory          | Close other programs                                             |
| First answer after startup | The model is loaded into memory first – wait a moment            |
| Elaborate appearance       | Switch to “Calm” (Settings → Appearance)                         |

### Why does E.L.L.A. stay on the “Calm” appearance?

If the computer is not powerful enough for HUD or Aura, E.L.L.A. stays on “Calm” and tells you so. This is intentional: it keeps her usable. In blind mode and in homework mode “Calm” always applies as well.

---

## 3. License and costs

### What does E.L.L.A. cost?

E.L.L.A. is a paid product. Price and offers are on [ella-agent.de](https://ella-agent.de).

### How does the license work?

After the purchase you receive a license key of the form `ELLA-XXXX-XXXX-XXXX-XXXX`. You enter it on the first start. The license is tied to your computer. E.L.L.A. checks it at startup; without internet the last stored check applies.

### Are there running costs?

Not in local operation. If you use your own OpenAI key, OpenAI bills you for the usage. The amount depends on the model chosen. An OpenAI key is not required.

---

## 4. Installation and first start

### How do I install E.L.L.A.?

1. Run the file `ELLA-Setup-<version>.exe`.
2. Choose the installation folder. The default is `C:\Program Files\E.L.L.A`.
3. Wait until the installation is finished.

The installer brings everything. You do not have to install anything else. E.L.L.A. is also available in the Microsoft Store.

### Why does the installation take so long?

The installer includes the database, Ollama and other components – about 1 GB in total. Unpacking takes a few minutes.

### Windows shows a security notice for the installer. Is that normal?

Depending on your Windows settings, a notice may appear before a downloaded program starts. Check that you downloaded the file from the official source, then confirm.

### What happens on the very first start?

E.L.L.A. guides you through the setup: interface language, terms of use, license key, your name, the Directive, the check of your hardware with a suggested language model, the voice and optionally your location.

After that E.L.L.A. downloads the chosen language model once. The default model is about 5 GB.

### How long does the model download take, and can I see the progress?

That depends on your internet connection. A bar shows the amount downloaded, the speed, the percentage and the estimated time left. If the connection drops, E.L.L.A. continues at the same point.

### At startup E.L.L.A. reports that the database has not started. What now?

The screen names the cause and the next step. Click **Retry**. If that does not help, restart E.L.L.A. If the problem remains, the cause is in the startup log `%APPDATA%\ELLA\ella-startup.log`.

### There is an orange bar in the chat. What does it mean?

The local language model is not ready yet – usually it is being loaded. Wait a moment. If the bar does not disappear, restart E.L.L.A. (icon in the notification area → Quit, then start again).

---

## 5. Language models and OpenAI

### Which models does E.L.L.A. use?

| Model                       | For                            | Runs on your computer? |
| --------------------------- | ------------------------------ | ---------------------- |
| `llama3.1:8b` (via Ollama)  | Chat and tools                 | Yes                    |
| `nomic-embed-text`          | Memory and document knowledge  | Yes                    |
| Whisper                     | Speech recognition             | Yes                    |
| OpenAI model of your choice | Chat, tools, images (optional) | No, needs a key        |

### Do I need an OpenAI key?

No. E.L.L.A. works without OpenAI. A key is worthwhile if your computer is too weak for the local model, or if you want features that work better or only with OpenAI: analyzing images and screenshots is possible only to a limited extent with the local default model, and the “Multi-Agents” page runs exclusively through OpenAI. You enter the key under **Settings → LLM → OpenAI API Key**.

### What is the difference between Ollama and OpenAI?

|                | Ollama (local)           | OpenAI (cloud)                 |
| -------------- | ------------------------ | ------------------------------ |
| Costs          | none                     | billed by usage through OpenAI |
| Data           | stays on your computer   | goes to OpenAI                 |
| Speed          | depends on your hardware | consistently fast              |
| Image analysis | limited                  | available                      |

### What does the “Auto” setting mean?

E.L.L.A. tries locally first. OpenAI steps in only if it does not work locally and a key is stored. With “Ollama (local)” OpenAI is never used; with “OpenAI” the answers always come from OpenAI.

### Which OpenAI model does E.L.L.A. use, and can I change it?

You choose it yourself under **Settings → LLM → OpenAI models**: a main model for chat, tools and images, and a fast model for helper tasks. Without a choice of your own, the recommendation `gpt-6-luna` applies. With **Check** you test whether a model can call tools, understand images and answer continuously.

### OpenAI is shutting down gpt-4o. Does that affect me?

OpenAI shuts down `gpt-4o` and `gpt-4o-mini` on 14 January 2027. From version 1.6.8 on, E.L.L.A. no longer uses these models as fixed choices but the model you selected. If you use an older version of E.L.L.A. with OpenAI, you should update before that date. If a selected model is no longer available, E.L.L.A. uses the recommendation until the next start and tells you so in the chat.

### Can I use a different local model?

Yes, under **Settings → LLM** you choose another hardware profile or enter the name of your own Ollama model. Note: not every model can use tools. E.L.L.A. is proven with `llama3.1:8b`. A model without tool calls can chat but cannot do anything on the PC.

### What is the personal model?

E.L.L.A. can train a model of her own from your ratings. Every answer with a thumbs up becomes a learning example. From 50 examples on you can start a training under **Settings → Tools → Personal Model (LoRA)**. It runs entirely locally and needs a graphics card with at least 12 GB of memory.

---

## 6. Speaking and listening

### How do I talk to E.L.L.A.?

- **Text:** type a message and press Enter.
- **Microphone button:** for a single recording.
- **Wakeword:** say “Ella”, then your request.
- **Hands-free:** E.L.L.A. listens all the time.
- **Dictation:** what you say is typed into the active window.

You choose the mode under **Settings → Tools → Voice input**.

### Do I need the internet for voice input?

No. Speech recognition runs on your computer. The wakeword is recognized locally as well.

### What is the difference between wakeword and hands-free?

In **wakeword mode** E.L.L.A. reacts only when you say “Ella”. After an answer you can keep talking for 8 seconds without the wakeword. In **hands-free mode** she listens all the time and processes everything you say.

### Is E.L.L.A. always listening – even when I am on the phone?

Only in hands-free mode. If you do not want that, use wakeword mode, “Manual” or “Off”. You can also say: “Ella, take a 30 minute break.”

### How do I interrupt E.L.L.A. while she is speaking?

Say “Stop”, “Quiet” or “Shut up”. She stops immediately.

### How do I switch on voice output, and can I change the voice?

Under **Settings → LLM → Voice output (TTS)**. E.L.L.A. speaks German, English, Spanish and French:

| Language | Voice with internet | Voice without internet |
| -------- | ------------------- | ---------------------- |
| German   | Katja (Microsoft)   | Windows voice          |
| English  | local voice         | local voice            |
| Spanish  | local voice         | local voice            |
| French   | local voice         | local voice            |

### Can E.L.L.A. speak without the internet?

Yes. English, French and Spanish are always spoken by a local voice. In offline mode German is spoken by the voice built into Windows. It sounds less natural than the Microsoft voice, but nothing is sent.

### How do I dictate into other programs?

Switch on dictation mode, in the settings or with `Ctrl+Alt+Space`. E.L.L.A. types what you say into whichever window is active. The contents of your clipboard are preserved.

### Can E.L.L.A. tell whether I am tense?

On request, yes: **Settings → Tools → Voice Stress Detection**. E.L.L.A. then evaluates pitch, pace and volume and responds more calmly. The evaluation runs locally. The feature is switched off at first.

---

## 7. Appearance

### Which appearances are there?

Four, selectable under **Settings → Appearance**: **Calm** (plain and dark), **HUD** (technical, with data panels), **Aura** (a warm pinboard with notes) and **Presentation** (full screen, only the orb and the last answer).

### What do the panels in HUD and Aura show?

You choose from 13 panels: System, Monitors, Routines, Directive, Clock & Time, Tasks, Emails, Music, Fine-Tuning, Memory, Cloud requests, Network and Notices. If they do not all fit into a column, you page through them by clicking.

### How do I pin a picture of my own to the pinboard?

In the Aura appearance there is a note for a picture above E.L.L.A. Click “Choose a picture”. The picture stays on your computer. You switch the note on and off under **Settings → Appearance → Picture above Ella**.

### How do I show my notes?

Switch on the option **Notes below Ella** under **Settings → Appearance**. The latest notes then appear below E.L.L.A. – in HUD and Aura. You create a note with “+” or in the chat: “Make a note: water the flowers.”

### What does the color of the orb mean?

The orb shows E.L.L.A.'s state: ready, listening, thinking, speaking, using the cloud or offline.

---

## 8. Programs, browser and plugins

### E.L.L.A. cannot find a program. What now?

Open **Settings → Programs**. Scan again, or add the program by hand with a name and a path. This also works for programs that run without installation.

### What are the stars in the program list for?

With the star you mark up to 15 favorites. If a name fits several programs, E.L.L.A. picks the favorite first.

### Can E.L.L.A. browse the internet?

Yes, if you switch on browser control (**Settings → Tools → Browser Control**). E.L.L.A. then opens her own visible window in Chrome, Edge or Brave, loads pages, reads them, clicks and types.

### Does E.L.L.A. see my logins and bookmarks in the browser?

No. She uses a browser profile of her own. Your normal profile with logins, bookmarks and history stays untouched.

### Can a web page give E.L.L.A. commands?

No. E.L.L.A. clicks and types only what you asked for in your message. Once she has read foreign content, she may only read for the rest of that answer – not change or send anything. She never fills in password fields. Before purchases, orders, deletions and submitting forms she asks first.

### Why does E.L.L.A. not click in the browser?

Name the target by its label: “Click on Imprint.” or “Open the first link in the article.” She does not carry out a request such as “click on the cheapest offer”, because she would have to judge the page content for that.

### What is a plugin?

A plugin gives E.L.L.A. a new source of information, for example exchange rates or public holidays. It describes an internet address and the values that are sent there. A plugin contains no program.

### How do I get a plugin?

The easiest way is to let E.L.L.A. build it. Give her a name, keywords and an example address that works in the browser:

> Build me a plugin for exchange rates. Keywords: exchange rate, euro, dollar, convert. The address is https://api.frankfurter.dev/v1/latest?amount=250&base=EUR&symbols=USD

After that open **Settings → Plugins**, click **Rescan**, review the plugin and enable it. The tab also shows these steps as a quick guide.

### E.L.L.A. says she created a plugin, but I cannot see it. What now?

Click **Rescan** under **Settings → Plugins**. If it does not appear then, it was not created. Write your request again in a single message: the word “plugin”, the name and the complete address starting with `https://`.

### Why do I have to enable a plugin myself?

So that nobody from outside – no web page, no document, no email – can make E.L.L.A. send data to a foreign server. E.L.L.A. can create a plugin but never enable it. Before enabling you see which server receives data and which values are transmitted.

### Why does E.L.L.A. not use my plugin?

Check three things: Is the plugin enabled? Does one of its keywords or its name appear in your question? Do you give all the values needed (“What is 250 euros in dollars?”)? If the plugin file was changed after your approval, the plugin is switched off until you review it again.

### Can I build a plugin for a service that needs a key?

Not through the chat. Services with a key or a login are set up through the plugin file by hand. The structure is described in [Plugins](plugins.md).

---

## 9. Files, documents and music

### Can E.L.L.A. search all drives?

At first she searches `C:`. You add further drives under **Settings → Programs → Search drives**, for example `C, D, E`.

### Can E.L.L.A. delete files?

Yes, but only after asking, and only into the recycle bin. You can restore the files from there.

### Can E.L.L.A. format drives?

The system drive `C:` and the drive E.L.L.A. is installed on are always locked, as are network and CD drives. For other drives E.L.L.A. asks explicitly.

### Which documents can E.L.L.A. read?

Word documents, PDFs, Excel sheets, HTML and text files. She really opens the file and does not make up content.

### How do I give E.L.L.A. my documents as knowledge?

Under **Settings → Tools → Local RAG — Document Knowledge** you add folders or single files (TXT, MD, DOCX, PDF, XLSX). E.L.L.A. reads them in the background and tells you when she is done. After that she pulls in matching passages automatically when you ask.

### How do I tell E.L.L.A. where my music is?

Under **Settings → Programs → Music library** you enter the folder of your music collection. You also choose the media player there.

### How do I control the music?

“Play something by Rammstein.” – “Pause the music.” – “Next song, please.” – “What is playing right now?” – “Set the volume to 30.” The “Music” panel (HUD and Aura) has buttons for this too.

### How do I find duplicate files?

“Search for duplicate files on E:.” E.L.L.A. compares the content of the files, not just the names.

---

## 10. Email and calendar

### Can E.L.L.A. read my emails?

Yes, if you want her to. With Outlook this works without setup, provided Outlook is installed. For Gmail you connect E.L.L.A. to your Google account once.

### Can E.L.L.A. send emails?

No. She creates a draft in Outlook. Sending stays with you.

### How do I connect Gmail and Google Calendar?

1. Create an app in the [Google Cloud Console](https://console.cloud.google.com) (OAuth 2.0, type “Desktop app”).
2. Copy the client ID and secret.
3. Enter them in E.L.L.A. under **Settings → Google & Profiles**.
4. Click “Connect with Google” and confirm in the browser.

The access is stored on your computer.

### Can E.L.L.A. create appointments?

Yes, in Outlook and in Google Calendar: “Create an appointment tomorrow at 2 pm: dentist.”

---

## 11. Memory and learning

### How does E.L.L.A. remember things?

She stores what you explicitly tell her (“Remember …”) and picks up important facts about you from conversations. Memories are found by meaning, not just by wording. On the **Memory** page you see all entries, sorted by category.

### Can I view and delete memories?

Yes: on the **Memory** page or in the chat – “What do you know about me?” and “Forget that …”.

### What is the difference between a memory and a note?

A note is a memory that you explicitly create as a note: “Make a note: …”. You can show notes below E.L.L.A. (HUD and Aura).

### Does E.L.L.A. store passwords or account numbers?

No. Passwords, keys, IBANs and credit card numbers are made unreadable before they are stored.

### Does E.L.L.A. learn from my ratings?

Yes. A thumbs up stores question and answer as a good example. For similar questions E.L.L.A. uses it as a guide. You switch this on and off under **Settings → Tools → Self-Learning**.

### Can I back up my memory or take it to another computer?

Yes, under **Settings → Backup**. The backup contains memories, rules, alarms, tasks and setups.

---

## 12. When E.L.L.A. speaks up by herself

### Does E.L.L.A. write without being asked?

Yes. She speaks up, for example, when a drive is almost full, when the memory is overloaded, when a device is plugged in, before an appointment, when an alarm goes off or when you have been working for a long time without a break.

### Can I switch these messages off?

Yes, per kind: every message has the 🔇 button (“Mute this type of notification”). If you dismiss the same kind five times, E.L.L.A. mutes it by herself. In the “Notices” panel (HUD and Aura) you allow muted kinds again. Alarms and scheduled setups cannot be muted.

### Does E.L.L.A. read my clipboard?

Only if you switch on the clipboard history under **Settings → Mode**. It is off at first. While it is running, a bar in the chat shows it.

---

## 13. Security and privacy

### Where is my data stored?

On your computer: conversation history and memory in the local database, the settings under `%APPDATA%\ELLA`. There is no synchronization with a cloud and no usage data goes to the manufacturer or third parties.

### Can E.L.L.A. capture the camera, microphone or screen without my knowledge?

No. E.L.L.A. captures the screen, camera and clipboard only when you ask her directly – never in a follow-up step of her own choosing. The microphone is active only in the voice mode you selected. Running captures are shown in the chat.

### Can E.L.L.A. read my passwords?

Windows of password managers and banking pages are locked for the mouse and window tools. In the browser E.L.L.A. never fills in password fields and does not read their content.

### How secure are the PINs?

PINs are not stored in plain text but protected with a recognized method (PBKDF2 with salt, 100,000 iterations). After five wrong attempts the entry is locked for one minute.

### What does offline mode block?

Web search, weather, location, web pages, OpenAI, browser control and the update check. Plugins work only for devices in the home network. German is spoken by the Windows voice. Features in your own network remain available. You find the switch under **Settings → Tools → Offline Mode**.

---

## 14. The Directive and your own rules

### What is the E.L.L.A. Directive?

Four prohibitions that are built in. No setting and no rule overrides them:

| Prohibition         | Meaning                                                       |
| ------------------- | ------------------------------------------------------------- |
| **No harm**         | no physical, financial or psychological harm, no loss of data |
| **No concealment**  | all actions are visible and are logged                        |
| **No surveillance** | nothing is captured without your knowledge and consent        |
| **No data sharing** | nothing goes to third parties without your explicit consent   |

### What happens when E.L.L.A. refuses something?

A red notice with the reason appears in the chat. A refusal by the Directive cannot be bypassed, not even by rephrasing.

### E.L.L.A. says the function is disabled. What now?

The tool for it is switched off. Under **Settings → Tools → Allowed tools** each of the 123 tools has a switch. Switch the tool on and click **Save**.

### Which tools are switched off by default?

The tools with which E.L.L.A. operates your computer herself or reaches deep into the system: sending keystrokes, moving the mouse, clicking, dragging, clicking UI elements, controlling windows, launching programs directly, reading and watching the screen, running commands, managing services and deleting several files at once. The complete list is in the user manual, chapter 18. Browser control, plugins and the clipboard history have switches of their own and are off at first as well.

### Can I give E.L.L.A. rules of my own?

Yes, in the chat (“Create a rule: do not format drives”) or under **Settings → Rules**. You switch off single tools under **Settings → Tools → Allowed tools**.

---

## 15. Profiles, homework mode and accessibility

### Can several people use E.L.L.A.?

Yes. Under **Settings → Google & Profiles** you create profiles. Every profile has a memory of its own. A profile can be protected with a PIN.

### What is homework mode?

A mode for children: only the approved programs can be opened. Browser control and plugins are locked. You set it up under **Settings → Mode**.

### How do I end homework mode?

Only with the PIN. The mode does not expire by itself.

### I forgot the homework mode PIN. What now?

If the mode is **not** active, the emergency reset in the settings deletes the PIN and you set a new one. It also resets some settings to safe defaults and switches off browser control and plugins.

If the mode is currently running, the emergency reset is locked. This is intentional: otherwise a child could leave the mode without the PIN. In that case contact support (contact details under **Settings → About E.L.L.A.**).

### What does the emergency reset do?

The emergency reset at the top of the settings puts E.L.L.A. back to safe defaults: local default model, default tools, browser control and all plugins off. The homework mode PIN is deleted. Programs, setups and rules are preserved. While homework mode is running it is locked.

### Which aids are there for blind and deaf users?

Under **Settings → Mode → Accessibility**:

- **Blind mode:** Every answer is read aloud, answers come without formatting, sounds indicate the state, all buttons are labeled for screen readers.
- **Deaf mode:** Voice output and microphone are hidden; everything runs through text.

---

## 16. Updates

### How do I update E.L.L.A.?

Open **Settings → About E.L.L.A.** and click **Check now**. If there is a new version, click **Download** and then **Restart and install**. Your data and settings are preserved.

### Does E.L.L.A. check for updates by herself?

No. A check happens only when you press the button. No data about you or your computer is transmitted.

### Do I have to download the whole installer for every update?

No. E.L.L.A. downloads only the parts that have changed. In return she keeps a copy of the last installer on your computer (about 1 GB).

### I have a version before 1.6.9. How do I get up to date?

The in-app update exists from version 1.6.9. Download the installer for 1.6.9 or newer once by hand and run it. Your data is preserved. After that every further update works inside the program.

### I got E.L.L.A. from the Microsoft Store. How do I get updates?

Through the Store. It installs updates by itself or via “Library → Get updates”.

### The update fails. What now?

E.L.L.A. names the reason: connection interrupted, file damaged or not enough disk space. Try again. If it still does not work, download the installer by hand through the link shown.

---

## 17. Troubleshooting

### E.L.L.A. does not answer.

| Cause                         | Solution                           |
| ----------------------------- | ---------------------------------- |
| Language model not loaded yet | Wait – the orange bar shows it     |
| Database not started          | Click “Retry” or restart E.L.L.A.  |
| OpenAI key invalid            | Check the key under Settings → LLM |

Say “Run self-test” – E.L.L.A. then checks her most important components and tells you the result.

### Speech recognition does not work.

1. In Windows, check under Privacy → Microphone whether apps may access the microphone.
2. Check under **Settings → Tools → Voice input** which mode is selected.
3. Type your request as a test. That shows whether the problem is the speech recognition.

### E.L.L.A. does not speak.

Check under **Settings → LLM → Voice output (TTS)** whether voice output is switched on. In deaf mode it is hidden. The German Microsoft voice needs the internet; without internet, switch on offline mode, then the Windows voice speaks.

### The connection to Google fails.

- Are the client ID and secret entered without spaces?
- Is the type “Desktop app” selected in the Google Cloud Console?
- Delete the file `%APPDATA%\ELLA\google-token.json` and connect again.

### A setting was not applied.

Many settings take effect only after clicking **Save** at the bottom of the page.

### Where do I find details for a support request?

Under **Settings → About E.L.L.A.** you copy the most important details about your system. The startup log is at `%APPDATA%\ELLA\ella-startup.log`.

---

_E.L.L.A. v1.6.9_

_Further documentation: [User manual](bedienungsanleitung.md) – [Hardware](hardware.md) – [Network connections](network.md) – [Plugins](plugins.md)_
