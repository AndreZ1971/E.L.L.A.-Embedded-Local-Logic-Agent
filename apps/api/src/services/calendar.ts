import { execSync } from "child_process";

export interface CalendarEvent {
  subject: string;
  start: string;
  end: string;
  location: string;
  allDay: boolean;
}

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

export function readCalendar(days = 2): CalendarEvent[] {
  const script = `
$ErrorActionPreference = 'Stop'
$o = New-Object -ComObject Outlook.Application
$ns = $o.GetNamespace('MAPI')
$cal = $ns.GetDefaultFolder(9)
$items = $cal.Items
$items.Sort('[Start]')
$items.IncludeRecurrences = $true
$start = (Get-Date).Date
$end = $start.AddDays(${days})
$fmt = 'MM/dd/yyyy HH:mm'
$filter = "[Start] >= '" + $start.ToString($fmt) + "' AND [Start] < '" + $end.ToString($fmt) + "'"
$restricted = $items.Restrict($filter)
$results = [System.Collections.ArrayList]::new()
foreach ($item in $restricted) {
  [void]$results.Add([PSCustomObject]@{
    subject  = if ($item.Subject) { $item.Subject } else { '' }
    start    = $item.Start.ToString('yyyy-MM-dd HH:mm')
    end      = $item.End.ToString('yyyy-MM-dd HH:mm')
    location = if ($item.Location) { $item.Location } else { '' }
    allDay   = $item.AllDayEvent
  })
}
if ($results.Count -eq 0) { Write-Output '[]' } else { $results | ConvertTo-Json -Compress -Depth 3 }
`;
  const out = runPS(script).trim();
  if (!out || out === "[]") return [];
  const data = JSON.parse(out) as unknown;
  const arr = Array.isArray(data) ? data : [data];
  return (arr as Record<string, unknown>[]).map((e) => ({
    subject: String(e["subject"] || ""),
    start: String(e["start"] || ""),
    end: String(e["end"] || ""),
    location: String(e["location"] || ""),
    allDay: Boolean(e["allDay"]),
  }));
}

export function createAppointment(
  subject: string,
  start: string,
  end: string,
  location = "",
): { success: boolean; error?: string } {
  const script = `
$ErrorActionPreference = 'Stop'
$o = New-Object -ComObject Outlook.Application
$appt = $o.CreateItem(1)
$appt.Subject = '${esc(subject)}'
$appt.Start = [DateTime]::Parse('${esc(start)}')
$appt.End = [DateTime]::Parse('${esc(end)}')
$appt.Location = '${esc(location)}'
$appt.Save()
Write-Output '{"success":true}'
`;
  try {
    const out = runPS(script).trim();
    return JSON.parse(out) as { success: boolean; error?: string };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
