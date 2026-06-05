import { readCalendar } from "./calendar.js";
import { sendProactiveMessage } from "./proactive.js";

let lastMeetingAlert = "";

export async function checkUpcomingMeetings(): Promise<void> {
  try {
    const events = readCalendar(1);
    const now = new Date();

    for (const event of events) {
      const start = new Date(event.start.replace(" ", "T"));
      const diffMin = (start.getTime() - now.getTime()) / 60000;

      if (diffMin > 25 && diffMin < 35 && lastMeetingAlert !== event.subject) {
        lastMeetingAlert = event.subject;
        sendProactiveMessage(
          `Du hast in ${Math.round(diffMin)} Minuten einen Termin: "${event.subject}"` +
            (event.location ? ` in ${event.location}` : "") +
            `. Soll ich relevante Dokumente suchen und dein Arbeits-Setup laden?`,
          "suggestion",
        );
      }
    }
  } catch {
    // Outlook nicht verfügbar — kein Fehler
  }
}
