import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export interface MailItem {
  id: string;
  subject: string;
  sender: string;
  senderEmail: string;
  received: string;
  preview: string;
  unread: boolean;
  source: "outlook" | "thunderbird";
}

export type MarkAction = "read" | "spam" | "archive" | "delete";

function runPS(script: string, timeoutMs = 15000): string {
  const encoded = Buffer.from(script, "utf16le").toString("base64");
  return execSync(
    `powershell -NoProfile -NonInteractive -EncodedCommand ${encoded}`,
    {
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf-8",
      timeout: timeoutMs,
    },
  );
}

function esc(s: string): string {
  return s.replace(/'/g, "''");
}

// --- Outlook COM ---

function readEmailsOutlook(limit: number): MailItem[] {
  const script = `
$ErrorActionPreference = 'Stop'
$o = New-Object -ComObject Outlook.Application
$ns = $o.GetNamespace('MAPI')
$inbox = $ns.GetDefaultFolder(6)
$items = $inbox.Items
$items.Sort('[ReceivedTime]', $true)
$results = [System.Collections.ArrayList]::new()
foreach ($item in $items) {
  $body = if ($item.Body) { $item.Body } else { '' }
  $preview = if ($body.Length -gt 200) { $body.Substring(0, 200) } else { $body }
  $preview = $preview -replace '[\\r\\n\\t]+', ' '
  [void]$results.Add([PSCustomObject]@{
    id           = $item.EntryID
    subject      = if ($item.Subject) { $item.Subject } else { '' }
    sender       = if ($item.SenderName) { $item.SenderName } else { '' }
    senderEmail  = if ($item.SenderEmailAddress) { $item.SenderEmailAddress } else { '' }
    received     = $item.ReceivedTime.ToString('yyyy-MM-dd HH:mm')
    preview      = $preview
    unread       = $item.UnRead
    source       = 'outlook'
  })
  if ($results.Count -ge ${limit}) { break }
}
if ($results.Count -eq 0) { Write-Output '[]' } else { $results | ConvertTo-Json -Compress -Depth 3 }
`;
  const out = runPS(script).trim();
  if (!out || out === "[]") return [];
  const data = JSON.parse(out) as unknown;
  const arr = Array.isArray(data) ? data : [data];
  return (arr as Record<string, unknown>[]).map((m) => ({
    id: String(m["id"] || ""),
    subject: String(m["subject"] || "(kein Betreff)"),
    sender: String(m["sender"] || ""),
    senderEmail: String(m["senderEmail"] || ""),
    received: String(m["received"] || ""),
    preview: String(m["preview"] || ""),
    unread: Boolean(m["unread"]),
    source: "outlook" as const,
  }));
}

export function markEmail(
  id: string,
  action: MarkAction,
): { success: boolean; directive?: boolean; error?: string } {
  const script = `
$ErrorActionPreference = 'Stop'
$o = New-Object -ComObject Outlook.Application
$ns = $o.GetNamespace('MAPI')
$item = $ns.GetItemFromID('${esc(id)}')
if ($null -eq $item) {
  Write-Output '{"success":false,"error":"Mail nicht gefunden."}'
  exit 0
}
if ('${esc(action)}' -eq 'delete' -and $item.UnRead) {
  Write-Output '{"success":false,"directive":true,"error":"Direktive: Ungelesene Mails duerfen nicht geloescht werden."}'
  exit 0
}
switch ('${esc(action)}') {
  'read' {
    $item.UnRead = $false
    $item.Save()
  }
  'spam' {
    $junk = $ns.GetDefaultFolder(23)
    $item.Move($junk) | Out-Null
  }
  'archive' {
    $archive = $null
    try { $archive = $ns.GetDefaultFolder(46) } catch { $archive = $ns.GetDefaultFolder(3) }
    $item.Move($archive) | Out-Null
  }
  'delete' {
    $item.Delete()
  }
}
Write-Output '{"success":true}'
`;
  try {
    const out = runPS(script).trim();
    return JSON.parse(out) as {
      success: boolean;
      directive?: boolean;
      error?: string;
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// --- Thunderbird (read-only fallback) ---

function decodeMimeWord(s: string): string {
  return s.replace(
    /=\?([^?]+)\?([BbQq])\?([^?]+)\?=/g,
    (_match, _charset, enc: string, data: string) => {
      try {
        if (enc.toUpperCase() === "B") {
          return Buffer.from(data, "base64").toString("utf-8");
        }
        const decoded = data
          .replace(/_/g, " ")
          .replace(/=([0-9A-Fa-f]{2})/g, (_m, h: string) =>
            String.fromCharCode(parseInt(h, 16)),
          );
        return Buffer.from(decoded, "binary").toString("utf-8");
      } catch {
        return s;
      }
    },
  );
}

function findThunderbirdProfiles(): string[] {
  const appData =
    process.env["APPDATA"] ?? path.join(os.homedir(), "AppData", "Roaming");
  const tbRoot = path.join(appData, "Thunderbird", "Profiles");
  if (!fs.existsSync(tbRoot)) return [];
  try {
    return fs
      .readdirSync(tbRoot, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => path.join(tbRoot, e.name));
  } catch {
    return [];
  }
}

function findInboxFiles(dir: string, depth = 3): string[] {
  if (depth === 0) return [];
  const results: string[] = [];
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...findInboxFiles(full, depth - 1));
      } else if (
        entry.isFile() &&
        entry.name.toLowerCase() === "inbox" &&
        !entry.name.endsWith(".msf")
      ) {
        results.push(full);
      }
    }
  } catch {
    // Kein Zugriff — überspringen
  }
  return results;
}

function parseMbox(filePath: string, limit: number): MailItem[] {
  const MAX_READ = 5 * 1024 * 1024;
  let stat: fs.Stats;
  try {
    stat = fs.statSync(filePath);
  } catch {
    return [];
  }
  if (stat.size === 0) return [];

  const readLen = Math.min(MAX_READ, stat.size);
  const buf = Buffer.alloc(readLen);
  const fd = fs.openSync(filePath, "r");
  fs.readSync(fd, buf, 0, readLen, Math.max(0, stat.size - readLen));
  fs.closeSync(fd);

  const content = buf.toString("utf-8");
  const parts = content.split(/^From .+$/m);
  const messages: MailItem[] = [];

  // iterate newest-first (end of mbox = newest); skip parts[0] (may be partial)
  for (let i = parts.length - 1; i >= 1 && messages.length < limit; i--) {
    const lines = parts[i].split(/\r?\n/);
    const headers: Record<string, string> = {};
    let inBody = false;
    const bodyLines: string[] = [];

    for (const line of lines) {
      if (!inBody) {
        if (line === "") {
          inBody = true;
          continue;
        }
        const m = /^([^:]+):\s*(.+)/.exec(line);
        if (m) {
          const key = m[1].toLowerCase();
          if (!headers[key]) headers[key] = m[2].trim();
        }
      } else if (bodyLines.length < 8) {
        bodyLines.push(line);
      }
    }

    const statusHex = headers["x-mozilla-status"];
    if (!statusHex) continue;
    const status = parseInt(statusHex, 16);
    if (status & 0x0008) continue; // gelöscht
    if (status & 0x0001) continue; // bereits gelesen

    const subject = decodeMimeWord(headers["subject"] ?? "(kein Betreff)");
    const fromRaw = decodeMimeWord(headers["from"] ?? "");
    const emailMatch = /<([^>]+)>/.exec(fromRaw);
    const senderEmail = emailMatch ? emailMatch[1] : fromRaw;
    const senderName = emailMatch
      ? fromRaw
          .replace(/<[^>]+>/, "")
          .trim()
          .replace(/^"|"$/g, "")
      : fromRaw;

    messages.push({
      id: headers["message-id"] ?? `tb:${i}`,
      subject,
      sender: senderName || senderEmail,
      senderEmail,
      received: headers["date"] ?? "",
      preview: bodyLines.join(" ").slice(0, 200),
      unread: true,
      source: "thunderbird",
    });
  }

  return messages;
}

function readEmailsThunderbird(limit: number): MailItem[] {
  const profiles = findThunderbirdProfiles();
  const results: MailItem[] = [];
  for (const profile of profiles) {
    for (const f of findInboxFiles(profile)) {
      results.push(...parseMbox(f, limit - results.length));
      if (results.length >= limit) break;
    }
    if (results.length >= limit) break;
  }
  return results;
}

// --- Öffentliche API ---

export function readEmails(limit = 10): {
  items: MailItem[];
  source: "outlook" | "thunderbird" | "none";
  error?: string;
} {
  try {
    const items = readEmailsOutlook(limit);
    return { items, source: "outlook" };
  } catch {
    // Outlook nicht verfügbar
  }

  const profiles = findThunderbirdProfiles();
  if (profiles.length > 0) {
    try {
      const items = readEmailsThunderbird(limit);
      return { items, source: "thunderbird" };
    } catch {
      return {
        items: [],
        source: "thunderbird",
        error: "Thunderbird-Postfach konnte nicht gelesen werden.",
      };
    }
  }

  return {
    items: [],
    source: "none",
    error:
      "Kein kompatibles E-Mail-Programm gefunden. Bitte Outlook oder Thunderbird installieren.",
  };
}
