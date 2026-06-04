import { google } from "googleapis";
import { getAuthenticatedClient } from "./auth.js";

export interface GoogleCalendarEvent {
  id: string;
  subject: string;
  start: string;
  end: string;
  location: string;
  allDay: boolean;
  source: "google";
}

export async function readGoogleCalendar(
  days = 2,
): Promise<GoogleCalendarEvent[]> {
  const auth = await getAuthenticatedClient();
  const calendar = google.calendar({ version: "v3", auth });

  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + days);

  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin: now.toISOString(),
    timeMax: end.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 50,
  });

  return (res.data.items ?? []).map((event) => {
    const allDay = Boolean(event.start?.date && !event.start?.dateTime);
    const start = event.start?.dateTime ?? event.start?.date ?? "";
    const endTime = event.end?.dateTime ?? event.end?.date ?? "";

    return {
      id: event.id ?? "",
      subject: event.summary ?? "(kein Titel)",
      start: start.replace("T", " ").slice(0, 16),
      end: endTime.replace("T", " ").slice(0, 16),
      location: event.location ?? "",
      allDay,
      source: "google",
    };
  });
}

export async function createGoogleAppointment(
  subject: string,
  start: string,
  end: string,
  location = "",
): Promise<{ success: boolean; error?: string }> {
  const auth = await getAuthenticatedClient();
  const calendar = google.calendar({ version: "v3", auth });

  await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: subject,
      location,
      start: { dateTime: new Date(start).toISOString() },
      end: { dateTime: new Date(end).toISOString() },
    },
  });

  return { success: true };
}
