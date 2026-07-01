import { createHash } from "crypto";
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

export async function activateHomeworkMode(): Promise<ToolResult> {
  const s = getSettings();
  if (s.homeworkMode.active)
    return { success: false, error: "Hausaufgaben-Modus ist bereits aktiv." };

  await saveSettings({ homeworkMode: { ...s.homeworkMode, active: true } });
  return {
    success: true,
    output: "Hausaufgaben-Modus aktiviert.",
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
