import { google } from "googleapis";
import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";
import { getSettings, saveSettings } from "../settings.js";

const TOKEN_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../../google-token.json",
);

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/userinfo.email",
];

export function createOAuth2Client() {
  const { googleClientId, googleClientSecret } = getSettings();
  return new google.auth.OAuth2(
    googleClientId,
    googleClientSecret,
    "http://localhost:3002/api/google/callback",
  );
}

export function getAuthUrl(): string {
  const client = createOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
}

export async function exchangeCode(code: string): Promise<string> {
  const client = createOAuth2Client();
  const { tokens } = await client.getToken(code);
  await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens, null, 2));

  client.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: "v2", auth: client });
  const { data } = await oauth2.userinfo.get();
  await saveSettings({
    googleConnected: true,
    googleUserEmail: data.email ?? "",
  });

  return data.email ?? "";
}

export async function getAuthenticatedClient() {
  const { googleClientId, googleClientSecret, googleConnected } = getSettings();
  if (!googleConnected) throw new Error("Google nicht verbunden.");
  if (!googleClientId || !googleClientSecret) {
    throw new Error("Google Client ID und Secret fehlen.");
  }

  let tokens: Record<string, unknown>;
  try {
    const raw = await fs.readFile(TOKEN_PATH, "utf-8");
    tokens = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error("Google Token nicht gefunden. Bitte neu verbinden.");
  }

  const client = createOAuth2Client();
  client.setCredentials(tokens);

  client.on("tokens", async (newTokens) => {
    try {
      const current = JSON.parse(
        await fs.readFile(TOKEN_PATH, "utf-8").catch(() => "{}"),
      ) as Record<string, unknown>;
      await fs.writeFile(
        TOKEN_PATH,
        JSON.stringify({ ...current, ...newTokens }, null, 2),
      );
    } catch {
      // token refresh logging — best effort
    }
  });

  return client;
}

export async function revokeAccess(): Promise<void> {
  try {
    const client = await getAuthenticatedClient();
    await client.revokeCredentials();
  } catch {
    // best effort
  }
  await fs.unlink(TOKEN_PATH).catch(() => {});
  await saveSettings({ googleConnected: false, googleUserEmail: "" });
}

export function isConfigured(): boolean {
  const { googleClientId, googleClientSecret } = getSettings();
  return Boolean(googleClientId && googleClientSecret);
}
