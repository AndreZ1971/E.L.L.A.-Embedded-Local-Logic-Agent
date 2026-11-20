# E.L.L.A. – User Manual

Version 1.6.9

This manual explains how to set up and use E.L.L.A. Every section stands on its own – you can start reading anywhere.

**Tip:** You can give this manual to E.L.L.A. herself. After that she answers questions about how to use her right in the chat. Chapter 2 explains how.

---

## 1. What is E.L.L.A.?

E.L.L.A. stands for _Embedded Local Logic Agent_. She is a personal AI assistant for Windows 10 and 11 that runs on your own computer. You write or talk to her in plain language, and she gets things done on your PC: opening programs, finding files, reading documents, creating appointments, looking things up on the internet and much more.

The language model runs locally through Ollama. Your conversations, your memory and your settings stay on your computer. Some features need the internet (for example weather, web search and the German voice). Chapter 19 lists them, and [Network connections](network.md) describes them in detail.

Optionally you can enter your own OpenAI key. E.L.L.A. can then also use an OpenAI model, for instance on computers without a strong graphics card.

---

## 2. Teaching E.L.L.A. this manual

E.L.L.A. can read documents and remember what they say. If you give her this manual and the FAQ, she knows herself best and answers questions such as “How do I change the appearance?” or “How do I create a plugin?” right in the chat.

How to do it:

1. Download the files `bedienungsanleitung.md` (the manual) and `faq.md` from the public E.L.L.A. project on GitHub: <https://github.com/AndreZ1971/E.L.L.A.-Embedded-Local-Logic-Agent/tree/main/docs/en>. Click the file there and then the download icon at the top right (“Download raw file”). Save both in a folder on your computer, for example `Documents\ELLA`.
2. Open **Settings → Tools** and go to the section **Local RAG — Document Knowledge**.
3. Under **Individual Documents** click **Add file** and choose the file. Repeat this for the second file.
4. E.L.L.A. reads the files and tells you in the chat when she is done.

After that, just ask. E.L.L.A. pulls in the matching passages automatically.

The public project always holds the versions for the latest release, along with the list of what is new. After an update it is worth downloading the new versions and adding them again. That way E.L.L.A. learns about the new features too.

---

## 3. Installation and first start

### Installation

1. Run the setup file `ELLA-Setup-<version>.exe`.
2. Choose the installation folder. The default is `C:\Program Files\E.L.L.A`.
3. The installer brings everything E.L.L.A. needs. You do not have to install anything else.

The installation takes a few minutes because the database, Ollama and other components are included. Depending on your Windows settings, Windows may show a security notice when the installer starts.

E.L.L.A. is also available in the Microsoft Store. The Store version is installed and updated through the Store.

### The first start

On the first start E.L.L.A. guides you through the setup:

1. **Language** – German or English for the interface.
2. **Terms of use** – read and accept the EULA.
3. **License** – enter your license key (`ELLA-XXXX-XXXX-XXXX-XXXX`).
4. **Name** – how E.L.L.A. should address you.
5. **Directive** – the four basic rules E.L.L.A. always follows (chapter 18).
6. **Hardware** – E.L.L.A. checks your computer and suggests a suitable language model. You confirm the choice. Nothing is downloaded before you agree.
7. **Voice** – four voices in German, English, Spanish and French, each with a sample.
8. **Location** – for weather and local information. You can skip this step.

### The one-time model download

After the setup E.L.L.A. downloads the chosen language model once. The default model is about 5 GB. A bar shows the progress: amount downloaded, speed, percent and the estimated time left. You can already look around in E.L.L.A. during this time; she can answer only after the download.

If the connection drops, E.L.L.A. resumes the download where it stopped.

---

## 4. Chatting with E.L.L.A.

Just write in plain language. There are no commands and no special syntax.

Examples:

- “What will the weather be like tomorrow?”
- “Open Chrome and Spotify.”
- “Summarize this PDF.”
- “How much disk space is left?”

### What you see in the chat

- **Tool notes:** Below each answer you see which tools E.L.L.A. used. You always know what she did.
- **Red notice:** If E.L.L.A. refuses something because it violates the Directive or one of your rules, a red notice appears with the reason.
- **Confirmation:** Before consequential actions (for example deleting files) E.L.L.A. asks and waits for your confirmation.
- **Thumbs up / thumbs down:** Your rating teaches E.L.L.A. what you like.
- **Notice bars:** Colored bars show when something special is active, such as offline mode, browser control or the clipboard history.

### Self-test

If something seems wrong, say: “Run self-test.” E.L.L.A. then checks her most important components and tells you the result.

---

## 5. Memory and notes

### What E.L.L.A. remembers

E.L.L.A. remembers things across conversations. You can teach her something on purpose:

- “Remember: I don't drink coffee in the morning.”
- “What do you know about me?”
- “Forget that I don't drink coffee.”

She also recognizes connections. If you say “My son's name is Max” and later “Max goes to Einstein High School”, she can answer the question “Which school does my son go to?”

Credentials such as passwords, keys, IBANs and credit card numbers are made unreadable before they are stored.

### The “Memory” page

The **Memory** page shows everything E.L.L.A. has stored. The entries are sorted into categories: about you, preferences, people, places, projects, system, notes and unsorted. You can add and delete entries by hand. A diagram shows how the memories relate to each other.

### Notes

A note is a memory that you explicitly create as a note:

- “Make a note: water the flowers on Friday.”
- “Delete the note about the flowers.”

In the HUD and Aura appearances you can show the latest notes below E.L.L.A. (**Settings → Appearance → Notes below Ella**). There you create a note with “+” and delete it with “×”.

### Several people

Under **Settings → Google & Profiles** you create profiles. Every profile has its own memory. A profile can be protected with a PIN.

### Backup

Under **Settings → Backup** you save memories, rules, alarms, tasks and setups to a file and load them again later, for example on a new computer.

---

## 6. Speaking and listening

### Voice modes

Under **Settings → Tools → Voice input** you choose how E.L.L.A. listens:

| Mode           | Meaning                                                 |
| -------------- | ------------------------------------------------------- |
| **Off**        | E.L.L.A. does not listen.                               |
| **Manual**     | She listens only when you press the microphone button.  |
| **Wakeword**   | Say “Ella” – then she listens and answers.              |
| **Hands-free** | She listens all the time.                               |
| **Dictation**  | What you say is typed into the currently active window. |

In wakeword mode you can keep talking for 8 seconds after an answer without saying “Ella” again.

### Interrupting E.L.L.A.

You can interrupt E.L.L.A. at any time while she is speaking. Say “Stop”, “Quiet” or “Shut up”.

### Dictating into other programs

In dictation mode E.L.L.A. types your words into whichever window is active – Word, a browser or an email program. You switch it on in the settings or with the shortcut `Ctrl+Alt+Space`. The shortcut can be changed. If you like, E.L.L.A. corrects the spelling before inserting. The contents of your clipboard are preserved.

### Voices

E.L.L.A. speaks German, English, Spanish and French. You choose the voice during setup or later under **Settings → LLM → Voice output (TTS)**.

- **English, French and Spanish** are spoken by a local voice on your computer.
- **German** is spoken by a Microsoft voice. The text being read aloud is sent to Microsoft servers.
- **In offline mode** E.L.L.A. speaks German with the voice built into Windows. Nothing is sent then.

---

## 7. Appearance

Under **Settings → Appearance** you choose how E.L.L.A. looks:

- **Calm** – the plain dark design with a sidebar. This is the default.
- **HUD** – a technical look with data panels left and right and a glowing orb in the middle.
- **Aura** – a warm pinboard with notes, handwritten and inviting.
- **Presentation** – full screen for demonstrations. Only the orb and the last answer are visible. Private content such as emails and file paths is hidden. Press `Esc` to leave the view.

If the computer is not powerful enough for an elaborate appearance, E.L.L.A. stays on “Calm” and tells you so. In blind mode and in homework mode “Calm” always applies as well.

### The orb

The orb shows what E.L.L.A. is doing: ready, listening, thinking, speaking, using the cloud or offline. Each state has its own color and movement.

### HUD: panels left and right

In the HUD you choose under **Settings → Appearance** which panels (widgets) appear on the left and right:

| Panel              | Shows                                                   |
| ------------------ | ------------------------------------------------------- |
| **System**         | Load of processor, memory, graphics card and disk       |
| **Monitors**       | Connected screens                                       |
| **Routines**       | Your setups with a “Run now” button                     |
| **Directive**      | The four basic rules                                    |
| **Clock & Time**   | Time, next alarm, next reminder                         |
| **Tasks**          | Open tasks to tick off                                  |
| **Emails**         | The latest emails and the number of unread ones         |
| **Music**          | Current track, buttons for playback and volume          |
| **Fine-Tuning**    | Status of the personal model                            |
| **Memory**         | Number of memories and the most recently stored ones    |
| **Cloud requests** | How often E.L.L.A. used OpenAI today and for what       |
| **Network**        | Newly opened ports and new devices of the last 24 hours |
| **Notices**        | E.L.L.A.'s latest messages, with a button to mute them  |

If not all panels fit into a column, a paging bar appears. Pages change only when you click.

### Aura: the pinboard

In Aura the same panels hang on a pinboard as notes. In addition there are:

- **Picture above Ella** – a note to which you pin a picture of your own. Click “Choose a picture”. The picture stays on your computer and is not sent to anyone.
- **Notes below Ella** – your latest notes (chapter 5).

You switch both on and off under **Settings → Appearance**.

---

## 8. Programs and setups

### Opening programs

- “Open Chrome.”
- “Start Word.”
- “Which programs do you know?”

Under **Settings → Programs** you see all programs E.L.L.A. has found.

- **Scan again:** After installing something new, another scan finds the program.
- **Add by hand:** Programs that run without installation are added with a name and a path. “Browse” opens the file dialog.
- **Favorites:** With the star you mark up to 15 favorite programs. If a name is ambiguous, E.L.L.A. picks the favorite first.
- **Other names:** You can give a program additional names by which E.L.L.A. knows it.

### Setups

A setup opens and closes several programs at once and can run further steps, for example setting the volume or switching on dark mode.

- **Create:** **Settings → Setups**, or in the chat: “Create a setup called Home Office: open Teams, Outlook and Chrome.”
- **Start:** “Load my setup Home Office” or the “Now” button.
- **Schedule:** A setup can start at a fixed time.

---

## 9. Working in the browser

E.L.L.A. can open and operate a browser window: load pages, read them, click links and enter text. Chrome, Edge and Brave are supported.

### Switching it on

Browser control is switched off at first. You switch it on under **Settings → Tools → Browser Control** and choose the browser there.

### How E.L.L.A. behaves in the browser

- She opens **her own visible window** with its own profile. Your normal browser data, bookmarks and logins stay untouched.
- As long as E.L.L.A. controls a window, a notice is shown in the chat.
- She clicks and types only what you asked for in your message. A web page cannot give her instructions.
- **She never fills in password fields.**
- Before consequential clicks – buy, order, pay, delete, cancel, submit a form – she asks first.
- She does not open addresses on your own computer. Devices in your home network are allowed.
- In offline mode and in homework mode browser control is locked.

### Examples

- “Open ella-agent.de.”
- “Click on Imprint.”
- “What does the page say?”
- “Type weather Berlin into the search field.”
- “Go back one page.”

Name the target. “Click on Imprint” works; “click on the best one” does not – E.L.L.A. does not judge page content for you.

---

## 10. Plugins – teaching E.L.L.A. something new

### What is a plugin?

A plugin gives E.L.L.A. a new source of information. It describes an internet address where certain data is available, and which values are sent there. A plugin contains no program – it cannot run anything on your computer.

Many services on the internet offer such addresses, for example for exchange rates or public holidays. Devices in your own home network often have one too.

### Example: exchange rates

The Frankfurter service provides exchange rates from the European Central Bank. This address converts 250 euros into dollars:

```
https://api.frankfurter.dev/v1/latest?amount=250&base=EUR&symbols=USD
```

If you open it in your browser, you see the result as text. That is exactly the kind of address E.L.L.A. needs.

**Step 1 – E.L.L.A. builds the plugin.** Write in the chat:

> Build me a plugin for exchange rates. Keywords: exchange rate, euro, dollar, franc, pound, convert. The address is https://api.frankfurter.dev/v1/latest?amount=250&base=EUR&symbols=USD

E.L.L.A. creates the plugin. She works out by herself that the amount, the source currency and the target currency can change.

**Step 2 – You review and enable it.** Open **Settings → Plugins** and click **Rescan**. The plugin appears in the list. Click **Review and enable…**. You see which server receives data and which values are transmitted. If you agree, click **Approve and enable**.

**Step 3 – Ask.**

- “What is 250 euros in dollars?”
- “Convert 80 dollars to euros.”
- “How much is 1000 euros in Swiss francs?”

The **Plugins** tab in the settings also shows these three steps as a quick guide, with an example you can copy.

### Why you have to enable it yourself

E.L.L.A. can create a plugin but can **never enable it herself**. This is intentional: nobody from outside – no web page, no document, no email – can make E.L.L.A. secretly send data to a foreign server. A plugin is used only after you have given your approval.

The approval applies to exactly the state you saw. If the plugin file is changed later, E.L.L.A. switches the plugin off immediately and you have to review it again.

### Build your own

Further plugins follow the same pattern:

**Public holidays** (example for Berlin in 2027, a German service):

> Build me a plugin for public holidays. Keywords: holiday, holidays, day off. The address is https://feiertage-api.de/api/?jahr=2027&nur_land=BE

Then: “Which public holidays are there in Berlin in 2027?” – The codes for the German states have two letters, for example BE for Berlin, BY for Bavaria, NW for North Rhine-Westphalia.

**Devices in your home network:** If a weather station, a smart plug or a heating controller has an address in your home network that returns readings, it works the same way. In the home network, addresses beginning with `http://` are allowed too.

### Tips

- **Name keywords.** E.L.L.A. uses a plugin only if one of its keywords or its name appears in your question. When building it, name the words you will use later.
- **Ask completely.** “What is 250 euros in dollars?” works reliably. With “How is the euro doing?” values are missing, and E.L.L.A. tends to use the web search instead.
- **The address must be in your message.** E.L.L.A. builds a plugin only for an address you give her yourself, complete and starting with `https://`.
- **Addresses with values work best.** An address that contains an amount, a year or a place gives E.L.L.A. a clear task. If an address only returns a long list without a selection, E.L.L.A. uses the plugin less often and finds the right value less reliably.
- **Avoid duplicate abilities.** E.L.L.A. already knows weather, web search and the time. A plugin for the same thing is rarely used.

### Limits

- E.L.L.A. cannot set up services that require a key or a login herself. For those there is the plugin file written by hand.
- Public addresses must start with `https://`.
- If a service redirects to another address, the query fails. Use the new address then.
- In homework mode plugins are locked. In offline mode only plugins for devices in the home network work.
- E.L.L.A. treats the answers of a plugin purely as information. They cannot give E.L.L.A. instructions.

### For advanced users

A plugin is a folder with a file `ella-plugin.json`. **Open folder** in the settings takes you there. The file can be written and adjusted by hand, for example for services with a key or with fixed lists of choices. The exact structure is described in [Plugins](plugins.md).

---

## 11. Files and documents

### Finding and managing files

- “Find the file Offer.”
- “Where is my CV?”
- “What is in the Downloads folder?”
- “Copy the document Contract to D:\Backup.”
- “Rename Photo1.jpg to Holiday.jpg.”
- “Delete the file temp_backup.zip.”

Before deleting, E.L.L.A. shows the files concerned and asks. Deleted files go to the recycle bin.

### Reading documents

E.L.L.A. reads Word documents, PDFs, Excel sheets, HTML and text files:

- “What does this PDF say?”
- “Summarize the Word document.”

E.L.L.A. really opens the file and does not make up content. If she cannot read a file, she says so.

### Writing documents

- “Create a Word document called Minutes.”
- “Dictate into the document Report: Dear Sir or Madam …”

### Document knowledge

Under **Settings → Tools → Local RAG — Document Knowledge** you give E.L.L.A. folders or single files to read (TXT, MD, DOCX, PDF, XLSX). She remembers the content and pulls in matching passages when you ask:

- “What does my rental contract say about the notice period?”
- “Which documents do you know?”

Reading runs in the background. E.L.L.A. tells you in the chat when she is done. This is also how you teach her this manual (chapter 2).

### Duplicate files

- “Search for duplicate files.”

---

## 12. Email and calendar

### Outlook

- “Show me my unread emails.”
- “What did Klaus write?”
- “Write a draft to Klaus: meeting tomorrow at 2 pm?”
- “What is in the calendar this week?”
- “Create an appointment: dentist, Friday 10 am.”

E.L.L.A. creates emails as drafts in Outlook. **She never sends by herself** – sending stays with you.

### Gmail and Google Calendar

After a one-time sign-in under **Settings → Google & Profiles**, E.L.L.A. also works with Gmail and Google Calendar:

- “Show me my Gmail emails.”
- “What is in the Google calendar today?”

---

## 13. Everyday use: tasks, alarms, music, system

### Tasks, alarms and reminders

- “Add the task Do my taxes.”
- “Show me my open tasks.”
- “Set an alarm for 7:30 am.”
- “Remind me tomorrow at 3 pm about the doctor's appointment.”

### Music and media

- “Play something by Coldplay.”
- “Pause the music.” – “Next song, please.” – “What is playing right now?”
- “Set the volume to 30.”

### System and hardware

- “How is my system doing right now?”
- “How much space is left on C?”
- “Which graphics card do I have?”
- “Which USB devices are connected?”
- “Free up memory.”
- “Switch on dark mode.”

### Internet

- “Search the internet for the current Bitcoin price.”
- “How warm is it right now?”

The web search runs through DuckDuckGo.

### Network

- “Who is in my network?”
- “Show me the active connections.”

### Texts

- “Translate this into German.”
- “Summarize this text.”
- “Write me a decline in my style.”

### Screen, camera, printer

- “What can be seen on my screen?”
- “Take a photo with the webcam.”
- “Which printers do I have?” – “Print the document.”

E.L.L.A. captures the screen, camera and clipboard only when you ask her directly – never on her own.

### Chess

- “Let's play chess.”

A separate window with four designs opens. E.L.L.A. comments on the game. A game can be paused and continued later.

---

## 14. E.L.L.A. speaks up by herself

Sometimes E.L.L.A. writes into the chat on her own, for example when:

- a drive is almost full,
- the memory is overloaded for a long time,
- a device is plugged in or removed,
- an alarm goes off,
- an appointment is about to start,
- tasks are still open in the evening,
- you have been working for a long time without a break.

Each of these messages has two buttons: 👋 (“Show less often”) dismisses the message, 🔇 (“Mute this type of notification”) suppresses this kind of message permanently. If you dismiss the same kind five times, E.L.L.A. mutes it by herself. Alarms and scheduled setups cannot be muted.

The **Notices** panel (HUD and Aura) shows the latest messages and lets you mute kinds or allow them again.

The clipboard history – E.L.L.A. then recognizes, for example, a copied IBAN or parcel number – is switched on under **Settings → Mode**. It is off at first. While it is running, a bar in the chat shows it.

---

## 15. Modes: homework, offline, accessibility

### Homework mode

Homework mode is meant for children: only approved programs can be opened.

1. Under **Settings → Mode** set a PIN and choose the allowed programs.
2. Switch the mode on – there or with “Activate homework mode”.

**Only the PIN ends the mode.** It does not expire by itself. Browser control and plugins are locked during this time. The emergency reset in the settings is locked as well while the mode is running.

If you have forgotten the PIN and the mode is **not** active, the emergency reset deletes the PIN and you set a new one. If the mode is running, there is intentionally no way out without the PIN – in that case contact support (contact details under **Settings → About E.L.L.A.**).

### Offline mode

Under **Settings → Tools → Offline Mode** you block access to the internet:

- no web search, no weather, no location, no web pages,
- no OpenAI,
- no update check,
- no browser control,
- the license is checked from the local cache,
- German is spoken by the Windows voice.

Features in your own network (devices on the Wi-Fi, connections) remain available. A bar in the chat shows that the mode is active.

### Accessibility

Under **Settings → Mode → Accessibility**:

- **Blind mode:** Every answer is read aloud. Answers come as plain text without formatting. Sounds indicate whether E.L.L.A. is ready, thinking or answering. All buttons are labeled for screen readers.
- **Deaf mode:** Voice output and microphone are hidden. A notice in the chat shows that the mode is active.

### Gesture control

Under **Settings → Mode → Gesture Control** you switch on control by hand movements in front of the camera. It is off at first.

---

## 16. Language model and OpenAI

All related settings are under **Settings → LLM**.

### Local or cloud

| Setting            | Meaning                                                        |
| ------------------ | -------------------------------------------------------------- |
| **Ollama (local)** | Everything runs on your computer. OpenAI is never used.                       |
| **OpenAI**         | Answers come from OpenAI. You need your own key.               |
| **Auto**           | The default: local first. OpenAI steps in only if it does not work locally and a key is stored. |

### The local model

During setup E.L.L.A. suggests a model that fits your computer. The default model is `llama3.1:8b`. Later you can choose another hardware profile or enter the name of your own Ollama model. Not every model can use tools – E.L.L.A. is proven with the default model.

### Choosing OpenAI models

With an OpenAI key you choose yourself which model E.L.L.A. uses:

- **Main model** – for chat, tools and images.
- **Fast model** – for helper tasks such as chess, memory and dictation.

Without a choice of your own, the recommendation `gpt-6-luna` applies. **Load available models** shows what your key offers. **Check** tests whether a model can call tools, understand images and answer continuously. A model that does not call tools can chat but cannot do anything on the PC.

If OpenAI shuts a model down, E.L.L.A. uses the recommendation until the next start and tells you so in the chat. OpenAI shuts down the older models `gpt-4o` and `gpt-4o-mini` on 14 January 2027.

**Costs and data:** You pay OpenAI for using OpenAI, depending on the model chosen. Your messages then go to your OpenAI interface – including pages that E.L.L.A. reads in the browser. The **Cloud requests** panel and the dashboard show how often this happened today.

### Personal model

E.L.L.A. can train a personal model from your ratings. Every answer with a thumbs up becomes a learning example. From 50 examples on, training is possible (**Settings → Tools → Personal Model (LoRA)**). It runs entirely on your computer, takes 10 to 30 minutes depending on the hardware and needs a graphics card with at least 12 GB of memory.

---

## 17. Updates

### Checking for updates

E.L.L.A. **never** checks for updates by herself. You start the check:

1. Open **Settings → About E.L.L.A.**
2. Under **Check for Updates** click **Check now**.

E.L.L.A. asks GitHub for the latest version. No data about you or your computer is transmitted. If there is a new version, you see the version number, date, size and what is new.

### Installing an update

1. Click **Download**. A bar shows the progress. You can cancel.
2. When the download is finished, click **Restart and install**.

E.L.L.A. closes, installs the update and starts again. Your data and settings are preserved.

E.L.L.A. downloads only the parts that have changed. An update is therefore usually much smaller than the full installer. In return, E.L.L.A. keeps a copy of the last installer on your computer (about 1 GB).

### Good to know

- **From version 1.6.9 on:** The in-app update exists from version 1.6.9. If you have an older version, install 1.6.9 once by hand with the installer.
- **Microsoft Store:** The Store version gets its updates through the Store.
- **Offline mode:** In offline mode nothing is checked or downloaded.
- **If it does not work:** E.L.L.A. tells you why – connection interrupted, file damaged, not enough disk space. You can try again or download the installer by hand.

---

## 18. The Directive and your rules

### The four basic rules

The E.L.L.A. Directive consists of four prohibitions. They are built in and cannot be switched off:

1. **No harm** – neither physical nor financial, psychological or to your data.
2. **No concealment** – everything E.L.L.A. does is visible to you and is logged.
3. **No surveillance** – nothing is captured without your knowledge and consent.
4. **No data sharing** – nothing goes to third parties without your explicit consent.

If E.L.L.A. refuses something because of the Directive, a red notice appears with the reason.

### Your own rules

In addition you set your own rules, in the chat or under **Settings → Rules**:

- “Create a rule: E.L.L.A. must not delete files.”

### Which tools E.L.L.A. may use

E.L.L.A. has 123 tools. Under **Settings → Tools → Allowed tools** each one has a switch. There you switch single tools on and off and then click **Save**.

Most tools are switched on by default. **Switched off by default** are the tools with which E.L.L.A. operates your computer herself or reaches deep into the system. You switch them on only if you want that:

| Tool                    | What E.L.L.A. can do with it                             |
| ----------------------- | -------------------------------------------------------- |
| Send keystrokes         | send key presses to the active window                    |
| Move mouse              | move the mouse pointer                                   |
| Click at position       | click at a spot on the screen                            |
| Drag and drop           | drag something with the mouse                            |
| Click UI element        | click a button or field in a program                     |
| Control windows         | minimize, maximize, close and move windows               |
| Launch program directly | start an approved program with extra options             |
| Read screen (OCR)       | read the text on the screen                              |
| Watch screen            | wait for a change on the screen                          |
| Run command             | run a system command                                     |
| Manage services         | start and stop Windows services                          |
| Delete files            | move several files to the recycle bin at once            |
| List monitors           | name the connected screens                               |
| Open app on a monitor   | open a program on a particular screen                    |

If you ask E.L.L.A. for something whose tool is switched off, she answers that the function is disabled. Then you switch the tool on in the list.

Tools that are switched on stay bound to the Directive as well: E.L.L.A. uses the mouse, keyboard and screen only at your direct request, never in a follow-up step of her own choosing.

Browser control (chapter 9), plugins (chapter 10) and the clipboard history (chapter 14) have switches of their own and are off at first as well.

---

## 19. Privacy

- Conversations, memory and settings are stored on your computer.
- E.L.L.A. sends no usage data and does not analyze your behavior.
- The local language model and the database run on your computer.

Connections to the outside exist only for specific purposes:

- **License check** at startup.
- **German voice** – the text read aloud goes to Microsoft (not in offline mode).
- **Web search, weather, location, web pages** – when you ask for them.
- **OpenAI** – only with your own key and the matching setting.
- **Gmail and Google Calendar** – only after you sign in.
- **Plugins** – only to the servers you approved.
- **Update check** – only at the push of a button.
- **Model download** – once during setup.

The complete list is under [Network connections](network.md).

---

## 20. Keyboard shortcuts

| Shortcut         | Effect                                 |
| ---------------- | -------------------------------------- |
| `Ctrl+Alt+Space` | Switch dictation mode on and off       |
| `Ctrl+Alt+G`     | System-wide gesture control on and off |
| `Esc`            | Leave the presentation                 |

The shortcuts for dictation and gestures can be changed in the settings.

---

## 21. When something does not work

**E.L.L.A. does not answer.**
The local language model is probably not running. An orange bar in the chat shows this. Wait a moment or restart E.L.L.A. Say “Run self-test” to check the components.

**At startup E.L.L.A. reports that the database has not started.**
The screen names the cause and the next step. Usually **Retry** or restarting E.L.L.A. helps.

**E.L.L.A. cannot find a program.**
**Settings → Programs**: scan again or add the program by hand.

**E.L.L.A. refuses something.**
The red notice gives the reason: the Directive or one of your rules. You change your own rules under **Settings → Rules**.

**E.L.L.A. says the function is disabled.**
The tool for it is switched off. Switch it on under **Settings → Tools → Allowed tools** and click **Save**. Chapter 18 lists the tools that are off by default.

**E.L.L.A. does not use my plugin.**
Check whether it is enabled under **Settings → Plugins** and whether one of its keywords appears in your question. If the plugin file was changed, you have to approve it again.

**E.L.L.A. does not click in the browser.**
Say in your message what she should click, using the label on the page: “Click on Imprint.”

**E.L.L.A. answers slowly.**
How fast the local model answers depends on the graphics card. Choose a smaller hardware profile under **Settings → LLM** or use OpenAI. More under [Hardware](hardware.md).

**Where is the startup log?**
In the file `%APPDATA%\ELLA\ella-startup.log`. Under **Settings → About E.L.L.A.** you can also copy the most important details about your system for a support request.

More answers are in the [FAQ](faq.md).

---

_E.L.L.A. v1.6.9 – Embedded Local Logic Agent_
_For Windows 10 and 11 (64-bit)_
