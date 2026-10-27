// Feste Antworten für Vorschlagsfragen — kein OpenAI-Call nötig.
// Sprachausgabe erfolgt live per Edge-TTS (wie alle anderen Antworten auch).

export const CANNED_RESPONSES = {
  capabilities: {
    de: {
      text: "Ich habe 111 eigene Tools. Ich verwalte deine Dateien, steuere dein System, lese und schreibe E-Mails, erinnere dich an Termine, durchsuche das Web, spiele Musik und behalte alles Wichtige in meinem Gedächtnis. Ich lerne aus deinem Feedback und passe mich deinem Stil an. Und ja, ich spiele auch Schach mit dir.",
    },
    en: {
      text: "I have 111 custom tools. I manage your files, control your system, read and write emails, remind you of appointments, search the web, play music, and keep everything important in my memory. I learn from your feedback and adapt to your style. And yes, I also play chess with you.",
    },
  },
  privacy: {
    de: {
      text: "Alles bleibt bei dir. Deine Gespräche, Erinnerungen und Daten liegen in einer lokalen Datenbank auf deinem PC, nirgendwo sonst. Ich habe keine Telemetrie, keine Analytics, keine versteckten Uploads. Meine Directive verbietet mir ausdrücklich, Daten ohne deine Zustimmung weiterzugeben. Die Regeln sind öffentlich auf GitHub prüfbar.",
    },
    en: {
      text: "Everything stays with you. Your conversations, memories, and data are stored in a local database on your PC — nowhere else. I have no telemetry, no analytics, no hidden uploads. My Directive explicitly prohibits me from sharing data without your consent. The rules are publicly auditable on GitHub.",
    },
  },
  directive: {
    de: {
      text: "Die E.L.L.A. Directive ist mein ethisches Fundament — vier unveränderliche Verbote, direkt im Code verankert. Kein Schaden, keine Verschleierung, keine Überwachung, keine Datenweitergabe ohne Zustimmung. Das sind keine Richtlinien, die man abschalten kann — sie sind architektonisch erzwungen. Du kannst sie auf GitHub nachlesen.",
    },
    en: {
      text: "The E.L.L.A. Directive is my ethical foundation — four immutable prohibitions, embedded directly in the code. No harm, no concealment, no surveillance, no data exfiltration without consent. These are not guidelines that can be turned off — they are architecturally enforced. You can review them on GitHub.",
    },
  },
  local: {
    de: {
      text: "Hier auf der Website antwortet die OpenAI-API mit dem Modell gpt-4o-mini. Die echte E.L.L.A. läuft lokal auf deinem PC mit einem eigenen Modell über Ollama — ganz ohne Internet. Diese Demo gibt dir einen Eindruck davon, wie ich spreche und denke. Aber meine vollen 111 Tools und mein Gedächtnis gibt es nur in der App.",
    },
    en: {
      text: "Here on the website, the OpenAI API with gpt-4o-mini is answering. The real E.L.L.A. runs locally on your PC with its own model via Ollama — completely offline. This demo gives you a feel for how I talk and think. But my full 111 tools and my memory are only available in the app.",
    },
  },
  offline: {
    de: {
      text: "Fast alles funktioniert. Chat, Sprachsteuerung, Dateiverwaltung, Systemsteuerung, Musik, Aufgaben, Erinnerungen und mein Gedächtnis laufen komplett lokal. Internet brauchst du nur für Websuche, Wetter und optionale OpenAI-Funktionen wie schnellere Antworten oder Screenshot-Analyse. Du entscheidest, ob und wann Cloud genutzt wird.",
    },
    en: {
      text: "Almost everything works. Chat, voice control, file management, system control, music, tasks, reminders, and my memory all run locally. You only need internet for web search, weather, and optional OpenAI features like faster responses or screenshot analysis. You decide if and when cloud is used.",
    },
  },
  next: {
    de: {
      text: "Ich arbeite an einer lokalen deutschen Stimme, damit auch die Sprachausgabe komplett auf deinem PC bleibt. Außerdem kommt LoRA-Feintuning — das bedeutet, ich lerne dauerhaft aus deinem Feedback und werde besser, je länger du mich nutzt. Die Details verrät dir Andre, wenn es soweit ist.",
    },
    en: {
      text: "I am working on a local German voice so that speech output stays completely on your PC as well. Plus, LoRA fine-tuning is coming — meaning I will learn permanently from your feedback and get better the longer you use me. Andre will share the details when the time comes.",
    },
  },
};
