import { execSync } from "child_process";
import os from "os";
import { remember } from "./memory.js";

function psEncode(script: string): string {
  return Buffer.from(script, "utf16le").toString("base64");
}

function psSync(script: string): string {
  try {
    return execSync(
      `powershell -NoProfile -NonInteractive -EncodedCommand ${psEncode(script)}`,
      { stdio: ["ignore", "pipe", "ignore"], encoding: "utf-8", timeout: 8000 },
    );
  } catch {
    return "";
  }
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
    psSync(
      `Get-CimInstance Win32_ComputerSystem -Property Name | Select-Object -ExpandProperty Name`,
    ).trim() || os.hostname();

  const cpu =
    psSync(
      `Get-CimInstance Win32_Processor -Property Name | Select-Object -ExpandProperty Name`,
    ).trim() || "Unbekannte CPU";

  const gpu =
    psSync(
      `Get-CimInstance Win32_VideoController -Property Caption | Select-Object -ExpandProperty Caption`,
    ).trim() || "Unbekannte GPU";

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
