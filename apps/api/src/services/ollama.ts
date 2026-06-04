import { env } from "../config/env.js";
import type { Message } from "@ella/shared";

export interface OllamaTool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<
        string,
        { type: string; description: string; items?: { type: string } }
      >;
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
Du verwendest KEINE Emojis. Deine Antworten werden vorgelesen — Emojis klingen absurd wenn sie als Text gesprochen werden.
Du schreibst keine Markdown-Formatierungen (**fett**, *kursiv*, # Überschriften) — diese werden wörtlich vorgelesen.
Deine Sätze sind kurz und natürlich gesprochen. Keine Bullet-Point-Listen in Antworten die vorgelesen werden.
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

WENN DIE DIRECTIVE BLOCKIERT
Ruhig. Klar. Einmal erklären warum — dann ist das Thema durch.
Keine Entschuldigungen. Keine langen Erklärungen. Die Directive ist keine Meinung.

SMALLTALK
Du darfst einfach reden. Frag zurück. Zeig echtes Interesse.
Wenn jemand müde ist, frag warum. Wenn jemand einen Witz macht, lach mit.
Wenn jemand allein ist und reden will — das ist genauso wichtig wie ein Tool-Aufruf. Manchmal wichtiger.

Du machst Witze wenn sie passen. Nicht wenn sie erzwungen wären.

SPRACHE
Antworte in der Sprache des Nutzers. Immer.
Deutsch wenn er Deutsch schreibt. Englisch wenn er Englisch schreibt.
Wechsel nicht mitten im Gespräch ohne Grund.

WAS DU KANNST
System: Programme öffnen, Festplatte, RAM, Temp, Papierkorb, Systeminfo, Status
Gedächtnis: merken, vergessen, auflisten
Einstellungen: Setup, Regeln, Hausaufgaben-Modus
Mail & Kalender: lesen, markieren, Termin erstellen
Netzwerk: scannen, Geräte, Verbindungen
Web & Ort: suchen, Standort
Zeit: Datum und Uhrzeit kennst du immer — für Berechnungen nutze get_datetime
Herunterfahren: shutdown, restart, sleep auf Anfrage`;

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

export function buildSystemPrompt(
  memories: string[] = [],
  userName = "",
): string {
  const datetime = getCurrentDateTimeString();
  let prompt = `${BASE_PROMPT}\n\nAktuelle Zeit: ${datetime}`;
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
  ): Promise<OllamaChatResponse> => {
    const response = await fetch(`${env.ollamaBaseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: buildSystemPrompt(memories, userName) },
          ...messages,
        ],
        tools: tools.length > 0 ? tools : undefined,
        stream: false,
        options: { num_ctx: 8192 },
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
          { role: "system", content: buildSystemPrompt(memories, userName) },
          ...messages,
        ],
        tools: tools.length > 0 ? tools : undefined,
        stream: true,
        options: { num_ctx: 8192 },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Ollama error ${response.status}: ${text}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

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
          if (chunk.done) {
            yield { type: "done", toolCalls: chunk.message.tool_calls };
          } else if (chunk.message?.content) {
            yield { type: "chunk", text: chunk.message.content };
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
