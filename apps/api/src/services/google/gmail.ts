import { google } from "googleapis";
import { getAuthenticatedClient } from "./auth.js";

export interface GmailMessage {
  id: string;
  subject: string;
  sender: string;
  senderEmail: string;
  received: string;
  preview: string;
  unread: boolean;
  source: "gmail";
}

export async function readGmailMessages(limit = 10): Promise<GmailMessage[]> {
  const auth = await getAuthenticatedClient();
  const gmail = google.gmail({ version: "v1", auth });

  const listRes = await gmail.users.messages.list({
    userId: "me",
    q: "is:unread in:inbox",
    maxResults: Math.min(20, limit),
  });

  const messages = listRes.data.messages ?? [];
  const results: GmailMessage[] = [];

  for (const msg of messages) {
    if (!msg.id) continue;
    const detail = await gmail.users.messages.get({
      userId: "me",
      id: msg.id,
      format: "metadata",
      metadataHeaders: ["Subject", "From", "Date"],
    });

    const headers = detail.data.payload?.headers ?? [];
    const get = (name: string) =>
      headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())
        ?.value ?? "";

    const fromRaw = get("From");
    const emailMatch = /<([^>]+)>/.exec(fromRaw);
    const senderEmail = emailMatch ? emailMatch[1] : fromRaw;
    const senderName = emailMatch
      ? fromRaw
          .replace(/<[^>]+>/, "")
          .trim()
          .replace(/^"|"$/g, "")
      : fromRaw;

    results.push({
      id: msg.id,
      subject: get("Subject") || "(kein Betreff)",
      sender: senderName || senderEmail,
      senderEmail,
      received: get("Date"),
      preview: (detail.data.snippet ?? "").slice(0, 200),
      unread: true,
      source: "gmail",
    });
  }

  return results;
}

export type GmailAction = "read" | "archive" | "delete" | "spam";

export async function markGmailMessage(
  id: string,
  action: GmailAction,
): Promise<{ success: boolean; directive?: boolean; error?: string }> {
  const auth = await getAuthenticatedClient();
  const gmail = google.gmail({ version: "v1", auth });

  if (action === "delete") {
    const msg = await gmail.users.messages.get({
      userId: "me",
      id,
      format: "minimal",
    });
    const isUnread = msg.data.labelIds?.includes("UNREAD");
    if (isUnread) {
      return {
        success: false,
        directive: true,
        error: "Direktive: Ungelesene Mails dürfen nicht gelöscht werden.",
      };
    }
  }

  switch (action) {
    case "read":
      await gmail.users.messages.modify({
        userId: "me",
        id,
        requestBody: { removeLabelIds: ["UNREAD"] },
      });
      break;
    case "archive":
      await gmail.users.messages.modify({
        userId: "me",
        id,
        requestBody: { removeLabelIds: ["INBOX"] },
      });
      break;
    case "spam":
      await gmail.users.messages.modify({
        userId: "me",
        id,
        requestBody: { addLabelIds: ["SPAM"], removeLabelIds: ["INBOX"] },
      });
      break;
    case "delete":
      await gmail.users.messages.trash({ userId: "me", id });
      break;
  }

  return { success: true };
}
