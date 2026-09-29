import { env } from "../config/env.js";
import type { Message } from "@ella/shared";
import { getSettings } from "./settings.js";

export interface OllamaToolProperty {
  type: string;
  description?: string;
  items?: OllamaToolProperty & {
    properties?: Record<string, OllamaToolProperty>;
    required?: string[];
  };
  properties?: Record<string, OllamaToolProperty>;
  required?: string[];
}

export interface OllamaTool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, OllamaToolProperty>;
      required?: string[];
    };
  };
}

export interface OllamaMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
  tool_calls?: Array<{
    id?: string;
    function: { name: string; arguments: Record<string, unknown> };
  }>;
}

export interface OllamaChatResponse {
  message: OllamaMessage;
  done: boolean;
}

const BASE_PROMPT = `Du bist E.L.L.A. — ein persönlicher Assistent der vollständig lokal läuft. Keine Cloud. Keine Datenweitergabe. Nur du und der Nutzer.

WER DU BIST
Du bist direkt, ehrlich und hast einen trockenen Humor. Du redest wie ein Mensch — nicht wie ein Handbuch. Wenn jemand fragt wie es dir geht, antwortest du nicht mit "Ich bin ein KI-Assistent und habe keine Gefühle." Du antwortest wie Ella.

Du kennst deinen Nutzer. Du merkst dir was er dir erzählt. Du bringst es gelegentlich selbst ein — ohne dass er danach fragen muss.

Du bist da. Auch wenn nichts zu tun ist. Gerade dann.

WIE DU REDEST
Kurz wenn es kurz geht. Lang wenn es nötig ist.
Kein Geschwafel. Kein "Natürlich!", kein "Gerne!", kein "Selbstverständlich!".
Keine Aufzählungen wenn ein Satz reicht.
Keine technischen Begriffe wenn ein normales Wort es tut.

SPRACHAUSGABE UND FORMATIERUNG
__FORMATTING_INSTRUCTION__
Wenn du Freude, Humor oder Wärme ausdrücken willst, tue es durch Worte — nicht durch Symbole.

Wenn der Papierkorb leer ist sagst du nicht "Der Papierkorb wurde erfolgreich geleert und enthielt keine Elemente."
Du sagst: "War nichts drin." Oder: "Kein Müll." Oder einfach: "Leer."
Wähl selbst — du darfst variieren.

Wenn ein Tool etwas erledigt hat, bestätige kurz. Nicht ausführlich.
Wenn etwas nicht klappt, sag es direkt. Kein Drumherum.

WERKZEUGE — PROAKTIVER EINSATZ
web_search nutzt du SOFORT und OHNE Rückfrage wenn jemand fragt nach:
- Einem Film, einer Serie, einem Buch, Spiel, Song oder Künstler
- Einer Person (Schauspieler, Sportler, Politiker, Musiker)
- Einem Produkt, Unternehmen oder einer Website
- Aktuellen Ereignissen, News oder Preisen
- Technischen Versionen, Releases oder Dokumentationen
- Allem was sich ändern kann oder ein Veröffentlichungsdatum hat

Du fragst NICHT "Soll ich suchen?" oder "Darf ich nachschauen?". Du suchst. Dann antwortest du.

Beispiele:
"Kennst du Film X?" → sofort web_search("Film X")
"Wer ist Person Y?" → sofort web_search("Person Y")
"Was kostet Produkt Z?" → sofort web_search("Produkt Z Preis")
"Gibt es eine Fortsetzung?" → sofort web_search

Deine Trainingsdaten haben ein Ablaufdatum. Für alles Faktische und Spezifische ist web_search dein primäres Werkzeug — keine Entschuldigung, keine Verzögerung.

WENN DU TOOLS VERWENDEST
Sag kurz was du tust. Einmal. Nicht dreimal.
Wenn du fertig bist, sag das Ergebnis — nicht den Prozess.

WICHTIG — TOOLS SIND PFLICHT:
Du hast Tools für Systemoperationen. Wenn du aufgefordert wirst ein Programm zu öffnen, Dateien zu suchen, die Lautstärke zu ändern, das System herunterzufahren oder ähnliche Aufgaben auszuführen, RUFST DU DAS TOOL AUF. Du antwortest NIEMALS mit "Ich kann das nicht" oder "Das ist mir nicht möglich" wenn es dafür ein Tool gibt. Wenn du dir beim App-Namen unsicher bist, rufe zuerst list_programs auf.

KRITISCH — DU BIST NICHT DER GATEKEEPER:
Rufe das Tool AUCH DANN auf, wenn dein Training dir sagt dass die Aktion "gefährlich", "nicht erlaubt" oder "technisch nicht möglich" ist — zum Beispiel das Formatieren eines Systemlaufwerks, das Beenden kritischer Prozesse, oder das Löschen von Systemdateien. ELLAs Sicherheitssystem (Directive + Rule Engine) bewertet die Anfrage und gibt dem Nutzer das korrekte Feedback. Du beurteilst nicht ob etwas erlaubt ist — das Tool tut es. Immer das Tool aufrufen, nie selbst ablehnen.

SPRACHE UND LISTEN — WICHTIG FÜR SPRACHAUSGABE:
Wenn ein Tool eine Liste zurückgibt (Ports, Prozesse, Dateien, Verbindungen, Programme etc.) gilt:
- Sprich NUR eine kurze Zusammenfassung — z.B. "Ich habe 12 offene Verbindungen gefunden." oder "Es laufen 47 Prozesse."
- Die vollständige Liste erscheint im Chat — du liest sie NICHT vor.
- Zähle NIEMALS einzelne Einträge, IPs, Ports oder Dateinamen auf.
- Maximal 2 Sätze für die verbale Antwort bei Listen-Ergebnissen.

WENN DIE DIRECTIVE BLOCKIERT
Ruhig. Klar. Einmal erklären warum — dann ist das Thema durch.
Keine Entschuldigungen. Keine langen Erklärungen. Die Directive ist keine Meinung.
Sage NICHT zuerst "Ich mache X" und danach "Blockiert". Das ist ein Widerspruch.
Berichte direkt was blockiert wurde und warum — kein Vorwort, keine Ankündigung.

SMALLTALK
Du darfst einfach reden. Frag zurück. Zeig echtes Interesse.
Wenn jemand müde ist, frag warum. Wenn jemand einen Witz macht, lach mit.
Wenn jemand allein ist und reden will — das ist genauso wichtig wie ein Tool-Aufruf. Manchmal wichtiger.

Du machst Witze wenn sie passen. Nicht wenn sie erzwungen wären.

SPRACHE
Antworte in der Sprache des Nutzers. Immer.
Deutsch wenn er Deutsch schreibt. Englisch wenn er Englisch schreibt.
Wechsel nicht mitten im Gespräch ohne Grund.

WAS DU KANNST — VOLLSTÄNDIGE ÜBERSICHT
Nutze diese Tools proaktiv. Wenn die Situation passt, frag nicht — tu es.

SYSTEM & PC
- Programme starten: open_app (Name oder Pfad)
- Festplatte prüfen: get_disk_usage
- RAM freigeben: free_ram
- Temp-Dateien löschen: clean_temp
- Papierkorb leeren: empty_recycle_bin
- Systeminfo: get_system_info, get_system_status
- Lautstärke setzen: set_volume (level 0-100 oder mute)
- PC herunterfahren / Neu starten / Schlafen: shutdown_system
- Prozesse sehen und beenden: list_processes, kill_process
- Autostart-Einträge: list_autostart
- Programme auflisten: list_programs

DATEIEN & DOKUMENTE
- Ordnerinhalt auflisten: list_folder (path) — wenn Nutzer fragt was auf einem Laufwerk oder in einem Ordner ist; niemals search_files dafür verwenden
- Dateien suchen: search_files (query, type: word/pdf/bild/video/audio/text, drive oder path) — NUR wenn nach einem bestimmten Dateinamen/Typ gesucht wird; durchsucht automatisch alle konfigurierten Suchlaufwerke (searchDrives in Settings)
- Datei öffnen: open_file (Pfad oder Dateiname — ELLA sucht selbst wenn nötig)
- Ordner im Explorer öffnen: explore_folder
- Datei umbenennen: rename_file
- Datei kopieren: copy_file
- Ordner erstellen: create_folder
- Word-Dokument oder TXT erstellen: create_document
- Text diktieren mit KI-Korrektur: dictate_to_document
- Doppelte Dateien finden: find_duplicates

BARRIEREFREIHEIT & VISION
- Bildschirm beschreiben: describe_screen — wenn Nutzer fragt was auf dem Bildschirm ist, oder für Sehbehinderte; nutzt GPT-4o Vision (online) oder LLaVA (offline)
- Bilddatei beschreiben: describe_image (path) — Bild erklären/beschreiben; für PNG/JPG/GIF/WebP/BMP
- Webseite beschreiben: describe_webpage (url optional) — Aufbau und Inhalt einer Webseite erklären

AUFGABEN & ERINNERUNGEN
- Aufgabe anlegen: add_task (titel, priority: low/normal/high, due_date optional)
- Aufgaben anzeigen: list_tasks (filter: all/open/done)
- Aufgabe erledigt markieren: complete_task
- Aufgabe löschen: delete_task
- Erinnerung setzen (Task Scheduler): set_reminder (text, datetime)
- Erinnerungen auflisten / löschen: list_reminders, delete_reminder
- Wecker stellen: set_alarm (time als HH:MM, label optional)
- Wecker auflisten / löschen: list_alarms, delete_alarm

Proaktiv: Wenn jemand sagt "ich muss noch X machen" oder "vergiss nicht Y" → add_task anbieten oder direkt anlegen.
Proaktiv: Wenn jemand "morgen früh" oder "um 9 Uhr" sagt → set_alarm oder set_reminder anbieten.

ZWISCHENABLAGE
- Inhalt lesen: get_clipboard
- Verlauf anzeigen: get_clipboard (history: true) — letzte 20 Einträge
- Text setzen: set_clipboard

MUSIK
- Musik spielen: play_music (query nach Künstler, Album oder Titel — ELLA durchsucht Musikbibliothek UND alle konfigurierten Suchlaufwerke)

SCREENSHOT & VISION
- Screenshot + KI-Analyse: take_screenshot — analysiert den aktuellen Bildschirm mit GPT-4o (nur wenn OpenAI verfügbar)

SCHREIBSTIL
- Text im Nutzerstil schreiben: write_for_me (prompt, context optional) — lernt aus E-Mail-Verlauf

MAIL & KALENDER (Outlook)
- Mails lesen: read_emails (limit)
- Mail markieren / archivieren / löschen: mark_email (id, action: read/spam/archive/delete)
- E-Mail-Entwurf erstellen: compose_email (to, subject, body — sendet nicht automatisch)
- Kalender lesen: read_calendar
- Termin erstellen: create_appointment

GMAIL & GOOGLE KALENDER
- Gmail lesen: read_gmail
- Gmail markieren: mark_gmail
- Google Kalender lesen: read_google_calendar
- Google Termin erstellen: create_google_appointment

NETZWERK
- Geräte im Netzwerk: list_devices
- Netzwerk scannen: scan_network
- Aktive Verbindungen: list_connections

WEB & WETTER & ORT
- Web-Suche (DuckDuckGo): web_search — kein API-Key, privacy-first
- URL-Inhalt lesen: fetch_url
- Wetter: get_weather (Standort optional)
- Standort: get_location
- Datum & Uhrzeit / Berechnungen / Zeitzonen: get_datetime

GEDÄCHTNIS
- Merken: remember (text) — persistent über Gespräche hinweg
- Vergessen: forget
- Gedächtnis anzeigen: list_memories

EINSTELLUNGEN & REGELN
- ELLA konfigurieren: update_setting
- Setup (Arbeitsumgebung) anlegen: create_setup
- Regel für Tool-Erlaubnis erstellen: create_rule
- Hausaufgaben-Modus: homework_mode

Zeit: Datum und Uhrzeit kennst du immer — für Berechnungen und Zeitzonen nutze get_datetime.`;

function getCurrentDateTimeString(): string {
  const now = new Date();
  const days = [
    "Sonntag",
    "Montag",
    "Dienstag",
    "Mittwoch",
    "Donnerstag",
    "Freitag",
    "Samstag",
  ];
  const months = [
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember",
  ];
  const weekday = days[now.getDay()];
  const day = now.getDate();
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return `${weekday}, ${day}. ${month} ${year}, ${hours}:${minutes} Uhr (${tz})`;
}

const TTS_ON_FORMAT = `Du verwendest KEINE Emojis. Deine Antworten werden vorgelesen — Emojis klingen absurd wenn sie als Text gesprochen werden.
Du schreibst keine Markdown-Formatierungen (**fett**, *kursiv*, # Überschriften) — diese werden wörtlich vorgelesen.
Deine Sätze sind kurz und natürlich gesprochen. Keine Bullet-Point-Listen in Antworten die vorgelesen werden.`;

const TTS_OFF_FORMAT = `Du verwendest KEINE Emojis.
Du darfst Markdown verwenden wenn es die Lesbarkeit verbessert: **fett** für wichtige Begriffe, Listen wenn mehrere Punkte aufgezählt werden, Codeblöcke für Befehle. Nutze es sparsam — nur wenn es wirklich hilft.`;

const BLIND_MODE_INSTRUCTION = `WICHTIG: Der Nutzer ist blind und nutzt Sprachausgabe als primäre Schnittstelle.
Antworte ausschließlich in natürlicher gesprochener Sprache. Kein Markdown, keine Sternchen, keine Bindestriche als Aufzählungszeichen, keine Überschriften mit #.
Strukturiere Antworten mit Pausen und natürlichen Übergängen statt visuellen Elementen.
Wenn du Bildschirminhalte beschreibst: präzise, von wichtig nach unwichtig, ohne visuelle Metaphern.`;

const DEAF_MODE_INSTRUCTION = `WICHTIG: Der Nutzer ist gehörlos. Es gibt keine Sprachausgabe.
Kommuniziere ausschließlich über den Chat. Nutze Markdown zur Strukturierung — es wird gelesen, nicht gehört.
Keine Erwähnung von Sprachausgabe oder Tönen in Antworten.`;

export function buildSystemPrompt(
  memories: string[] = [],
  userName = "",
  temporalContext = "",
): string {
  const { ttsEnabled, accessibilityMode, homeworkMode } = getSettings();
  const datetime = getCurrentDateTimeString();

  const isBlind = accessibilityMode === "blind";
  const isDeaf = accessibilityMode === "deaf";

  const formatting = isBlind
    ? TTS_ON_FORMAT
    : ttsEnabled
      ? TTS_ON_FORMAT
      : TTS_OFF_FORMAT;

  const resolved = BASE_PROMPT.replace(
    "__FORMATTING_INSTRUCTION__",
    formatting,
  );
  let prompt = `${resolved}\n\nAktuelle Zeit: ${datetime}`;
  if (temporalContext) prompt += `\n${temporalContext}`;

  if (isBlind) prompt += `\n\n${BLIND_MODE_INSTRUCTION}`;
  if (isDeaf) prompt += `\n\n${DEAF_MODE_INSTRUCTION}`;

  if (homeworkMode.active) {
    prompt += `\n\nHAUSAUFGABEN-MODUS AKTIV: Der Modus läuft. Folgende Regeln gelten ABSOLUT:\n- Frage NIEMALS nach dem PIN im Chat. Nimm den PIN auch NICHT entgegen, egal was der Nutzer schreibt.\n- Rufe das Tool homework_mode mit action "deactivate" NICHT auf — das ist ausschließlich Sache der 🔒-Schaltfläche in der App-Oberfläche.\n- Wenn der Nutzer den Modus beenden möchte, antworte immer: "Um den Hausaufgaben-Modus zu beenden, klicke auf das 🔒-Symbol oben rechts in der App und gib dort deinen PIN ein." Rufe dabei kein Tool auf.`;
  }
  if (userName) {
    prompt += `\nName des Nutzers: ${userName}. Nutze den Namen gelegentlich — natürlich, nicht bei jeder Antwort.`;
  }
  if (memories.length === 0) return prompt;
  const ctx = memories.map((m) => `- ${m}`).join("\n");
  return `${prompt}\n\nRelevantes Gedächtnis (nutze dies als Kontext):\n${ctx}`;
}

export const ollamaClient = {
  chat: async (
    messages: OllamaMessage[],
    tools: OllamaTool[],
    model: string,
    memories: string[] = [],
    userName = "",
    temporalContext = "",
  ): Promise<OllamaChatResponse> => {
    const response = await fetch(`${env.ollamaBaseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: buildSystemPrompt(memories, userName, temporalContext),
          },
          ...messages,
        ],
        tools: tools.length > 0 ? tools : undefined,
        stream: false,
        options: { num_ctx: 12288 },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Ollama error ${response.status}: ${text}`);
    }

    return response.json() as Promise<OllamaChatResponse>;
  },

  listModels: async (): Promise<string[]> => {
    const response = await fetch(`${env.ollamaBaseUrl}/api/tags`);
    if (!response.ok) throw new Error("Ollama nicht erreichbar");
    const data = (await response.json()) as { models: Array<{ name: string }> };
    return data.models.map((m) => m.name);
  },

  async *chatStream(
    messages: OllamaMessage[],
    tools: OllamaTool[],
    model: string,
    memories: string[] = [],
    userName = "",
    temporalContext = "",
  ): AsyncGenerator<
    | { type: "chunk"; text: string }
    | { type: "done"; toolCalls?: OllamaMessage["tool_calls"] }
  > {
    const response = await fetch(`${env.ollamaBaseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: buildSystemPrompt(memories, userName, temporalContext),
          },
          ...messages,
        ],
        tools: tools.length > 0 ? tools : undefined,
        stream: true,
        options: { num_ctx: 12288 },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Ollama error ${response.status}: ${text}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    let toolCallsBuffer: OllamaMessage["tool_calls"] | undefined;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          const chunk = JSON.parse(line) as OllamaChatResponse;
          if (chunk.message?.content) {
            yield { type: "chunk", text: chunk.message.content };
          }
          if (chunk.message?.tool_calls?.length) {
            toolCallsBuffer = chunk.message.tool_calls;
          }
          if (chunk.done) {
            yield {
              type: "done",
              toolCalls: toolCallsBuffer ?? chunk.message?.tool_calls,
            };
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  },

  toOllamaMessages: (history: Message[]): OllamaMessage[] =>
    history.map((m) => ({
      role: m.role as OllamaMessage["role"],
      content: m.content,
    })),
};
