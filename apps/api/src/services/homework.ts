import { createHash } from "crypto";
import { execSync } from "child_process";
import * as path from "path";
import { openApp } from "@ella/agent-tools";
import { getSettings, saveSettings } from "./settings.js";
import type { ToolResult } from "@ella/shared";

export function hashPin(pin: string): string {
  return createHash("sha256").update(pin).digest("hex");
}

export function verifyPin(pin: string): boolean {
  const { homeworkMode } = getSettings();
  if (!homeworkMode.pinHash) return false;
  return hashPin(pin) === homeworkMode.pinHash;
}

function killProcess(command: string): void {
  const exe = path.basename(command.split(" ")[0]);
  if (!exe) return;
  try {
    execSync(`taskkill /F /IM "${exe}" /T`, { stdio: "ignore" });
  } catch {
    // Prozess war nicht aktiv — kein Fehler
  }
}

export async function activateHomeworkMode(): Promise<ToolResult> {
  const s = getSettings();
  if (s.homeworkMode.active)
    return { success: false, error: "Hausaufgaben-Modus ist bereits aktiv." };

  // Alle bekannten Apps schließen, die NICHT erlaubt sind
  for (const app of s.apps) {
    if (
      !s.homeworkMode.apps
        .map((a) => a.toLowerCase())
        .includes(app.name.toLowerCase())
    ) {
      killProcess(app.command);
    }
  }

  // Erlaubte Apps öffnen
  let opened = 0;
  for (const appName of s.homeworkMode.apps) {
    const entry = s.apps.find(
      (a) => a.name.toLowerCase() === appName.toLowerCase(),
    );
    if (entry?.allowed) {
      try {
        await openApp({ name: appName }, { [appName]: entry.command });
        opened++;
      } catch {}
    }
  }

  await saveSettings({ homeworkMode: { ...s.homeworkMode, active: true } });
  return {
    success: true,
    output: `Hausaufgaben-Modus aktiviert — ${opened} App${opened !== 1 ? "s" : ""} gestartet.`,
  };
}

export async function deactivateHomeworkMode(pin: string): Promise<ToolResult> {
  const s = getSettings();
  if (!verifyPin(pin)) return { success: false, error: "Falscher PIN." };
  if (!s.homeworkMode.active)
    return { success: false, error: "Hausaufgaben-Modus ist nicht aktiv." };

  await saveSettings({ homeworkMode: { ...s.homeworkMode, active: false } });
  return { success: true, output: "Hausaufgaben-Modus deaktiviert." };
}

export function getHomeworkStatus(): { active: boolean; configured: boolean } {
  const { homeworkMode } = getSettings();
  return {
    active: homeworkMode.active,
    configured: !!homeworkMode.pinHash,
  };
}
