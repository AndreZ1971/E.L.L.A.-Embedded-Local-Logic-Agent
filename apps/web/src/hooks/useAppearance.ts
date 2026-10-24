import { useState, useEffect, useRef, useCallback } from "react";
import { apiFetch } from "../lib/api";

export type Appearance = "calm" | "hud" | "show";

export interface AppearanceState {
  effective: Appearance;
  wanted: Appearance;
  forcedReason: string | null;
}

export function resolveAppearance(input: {
  wanted: Appearance;
  accessibilityMode: "none" | "blind" | "deaf";
  homeworkActive: boolean;
  reducedMotion: boolean;
}): { effective: Appearance; forcedReason: string | null } {
  if (input.accessibilityMode === "blind")
    return { effective: "calm", forcedReason: "blind" };
  if (input.homeworkActive)
    return { effective: "calm", forcedReason: "homework" };
  if (input.reducedMotion)
    return { effective: "calm", forcedReason: "reduced_motion" };
  return { effective: input.wanted, forcedReason: null };
}

export function useAppearance(): AppearanceState {
  const [wanted, setWanted] = useState<Appearance>("calm");
  const [accent, setAccent] = useState<"cyan" | "violett" | "bernstein">(
    "cyan",
  );
  const [accessibilityMode, setAccessibilityMode] = useState<
    "none" | "blind" | "deaf"
  >("none");
  const [homeworkActive, setHomeworkActive] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const poll = useCallback(async () => {
    try {
      const [settingsRes, homeworkRes] = await Promise.all([
        apiFetch("/api/settings").then((r) => (r.ok ? r.json() : null)),
        apiFetch("/api/homework/status").then((r) => (r.ok ? r.json() : null)),
      ]);
      if (settingsRes) {
        setWanted(settingsRes.appearance ?? "calm");
        setAccent(settingsRes.hudAccent ?? "cyan");
        setAccessibilityMode(settingsRes.accessibilityMode ?? "none");
      }
      if (homeworkRes) {
        setHomeworkActive(homeworkRes.active ?? false);
      }
    } catch {
      // offline
    }
  }, []);

  useEffect(() => {
    poll();
    intervalRef.current = setInterval(poll, 10_000);
    const onAppearanceChanged = () => poll();
    window.addEventListener("ella:appearance-changed", onAppearanceChanged);
    return () => {
      clearInterval(intervalRef.current);
      window.removeEventListener(
        "ella:appearance-changed",
        onAppearanceChanged,
      );
    };
  }, [poll]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const { effective, forcedReason } = resolveAppearance({
    wanted,
    accessibilityMode,
    homeworkActive,
    reducedMotion,
  });

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = effective;
    root.dataset.hudAccent = accent;
  }, [effective, accent]);

  return { effective, wanted, forcedReason };
}
