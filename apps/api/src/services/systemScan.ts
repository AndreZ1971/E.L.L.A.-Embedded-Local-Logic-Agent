import { execSync } from "child_process";
import os from "os";
import { remember } from "./memory.js";

// WMIC ist seit Windows 11 22H2 deprecated. Fallback wenn wmic nicht verfügbar:
//   wmic cpu get name                          → Get-CimInstance Win32_Processor -Property Name
//   wmic computersystem get name               → Get-CimInstance Win32_ComputerSystem -Property Name
//   wmic path win32_videocontroller get caption → Get-CimInstance Win32_VideoController -Property Caption
// Umbau erfolgt wenn erste 22H2-Produktivmeldung eingeht — WMIC läuft noch überall.
function wmic(query: string): string {
  try {
    const out = execSync(`wmic ${query} /format:value`, {
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf-8",
    });
    return out.trim();
  } catch {
    return "";
  }
}

function wmicValue(query: string, field: string): string {
  const raw = wmic(query);
  const line = raw
    .split(/\r?\n/)
    .find((l) => l.toLowerCase().startsWith(field.toLowerCase() + "="));
  return line ? line.split("=").slice(1).join("=").trim() : "";
}

export interface HardwareInfo {
  computerName: string;
  cpu: string;
  gpu: string;
  ramBytes: number;
  ramLabel: string;
}

export function scanHardware(): HardwareInfo {
  const computerName =
    wmicValue("computersystem get name", "Name") || os.hostname();
  const cpu = wmicValue("cpu get name", "Name") || "Unbekannte CPU";
  const gpu =
    wmicValue("path win32_videocontroller get caption", "Caption") ||
    "Unbekannte GPU";
  const ramBytes = os.totalmem();
  const ramLabel = `${(ramBytes / 1024 ** 3).toFixed(1)} GB`;

  return { computerName, cpu, gpu, ramBytes, ramLabel };
}

export async function runSystemScan(): Promise<HardwareInfo> {
  const hw = scanHardware();

  await remember("system", `Computername: ${hw.computerName}`);
  await remember("system", `CPU: ${hw.cpu}`);
  await remember("system", `GPU: ${hw.gpu}`);
  await remember("system", `RAM: ${hw.ramLabel}`);

  return hw;
}
