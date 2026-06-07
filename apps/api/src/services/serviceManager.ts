import { execSync } from "child_process";

const PROTECTED_SERVICES = [
  "winlogon",
  "lsass",
  "services",
  "smss",
  "wininit",
  "csrss",
  "spooler",
  "eventlog",
  "plugplay",
  "rpcss",
  "dcomlaunch",
  "cryptsvc",
  "netlogon",
  "ella",
  "mariadb",
];

export interface ServiceEntry {
  name: string;
  displayName: string;
  status: string;
  startType: string;
}

function encodePs(ps: string): string {
  return Buffer.from(ps, "utf16le").toString("base64");
}

export function listServicesPs(filter?: string): ServiceEntry[] {
  const where = filter
    ? `| Where-Object { $_.Name -like '*${filter.replace(/'/g, "''")}*' -or $_.DisplayName -like '*${filter.replace(/'/g, "''")}*' } | Select-Object -First 30`
    : "| Select-Object -First 50";

  const ps = `Get-Service ${where} | Select-Object Name,DisplayName,Status,StartType | ConvertTo-Json -Compress`;
  try {
    const out = execSync(
      `powershell -NoProfile -NonInteractive -EncodedCommand ${encodePs(ps)}`,
      { encoding: "utf-8", timeout: 10_000 },
    ).trim();
    if (!out) return [];
    const data = JSON.parse(out);
    const arr: unknown[] = Array.isArray(data) ? data : [data];
    return arr.map((s: unknown) => {
      const svc = s as Record<string, unknown>;
      const status =
        svc["Status"] === 4
          ? "Running"
          : svc["Status"] === 1
            ? "Stopped"
            : svc["Status"] === 2
              ? "StartPending"
              : String(svc["Status"] ?? "");
      const startType =
        svc["StartType"] === 2
          ? "Automatic"
          : svc["StartType"] === 3
            ? "Manual"
            : svc["StartType"] === 4
              ? "Disabled"
              : String(svc["StartType"] ?? "");
      return {
        name: String(svc["Name"] ?? ""),
        displayName: String(svc["DisplayName"] ?? ""),
        status,
        startType,
      };
    });
  } catch {
    return [];
  }
}

export function controlService(
  name: string,
  action: "start" | "stop" | "restart",
): { success: boolean; error?: string } {
  const lower = name.toLowerCase();
  if (PROTECTED_SERVICES.some((p) => lower.includes(p))) {
    return {
      success: false,
      error: `Dienst "${name}" ist systemkritisch und kann nicht geändert werden.`,
    };
  }

  const cmdMap: Record<string, string> = {
    start: `Start-Service -Name '${name.replace(/'/g, "''")}' -ErrorAction Stop`,
    stop: `Stop-Service -Name '${name.replace(/'/g, "''")}' -Force -ErrorAction Stop`,
    restart: `Restart-Service -Name '${name.replace(/'/g, "''")}' -Force -ErrorAction Stop`,
  };

  try {
    execSync(
      `powershell -NoProfile -NonInteractive -EncodedCommand ${encodePs(cmdMap[action])}`,
      { timeout: 15_000 },
    );
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
