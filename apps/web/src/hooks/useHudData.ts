import { useState, useEffect, useRef, useCallback } from "react";
import { apiFetch } from "../lib/api";
import type { TelemetryData } from "../components/hud/HudSystemPanel";
import type { MonitorInfo } from "../components/hud/HudMonitorPanel";
import type {
  HudTaskItem,
  HudMailItem,
  HudNowPlaying,
} from "../components/hud/widgetRegistry";

interface HudData {
  telemetry: TelemetryData | null;
  monitors: MonitorInfo[];
  cloudToday: number | null;
  setups: Array<{
    id: string;
    name: string;
    schedule?: { enabled?: boolean; days?: boolean[]; time?: string };
  }>;
  tasks: { count: number; items: HudTaskItem[] };
  mails: { source: string; unreadCount: number; items: HudMailItem[] };
  nowPlaying: HudNowPlaying;
}

export function useHudData(
  active: boolean,
  telemetryEnabled: boolean,
): HudData {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [monitors, setMonitors] = useState<MonitorInfo[]>([]);
  const [cloudToday, setCloudToday] = useState<number | null>(null);
  const [setups, setSetups] = useState<HudData["setups"]>([]);
  const [tasks, setTasks] = useState<HudData["tasks"]>({
    count: 0,
    items: [],
  });
  const [mails, setMails] = useState<HudData["mails"]>({
    source: "none",
    unreadCount: 0,
    items: [],
  });
  const [nowPlaying, setNowPlaying] = useState<HudNowPlaying>({
    available: false,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const poll = useCallback(async () => {
    if (document.visibilityState !== "visible") return;
    try {
      const promises: Promise<void>[] = [
        apiFetch("/api/events/cloud-today")
          .then((r) => (r.ok ? r.json() : null))
          .then((d: { count?: number } | null) => {
            if (d) setCloudToday(d.count ?? 0);
          }),
        apiFetch("/api/settings")
          .then((r) => (r.ok ? r.json() : null))
          .then((s: { setups?: HudData["setups"] } | null) => {
            if (s?.setups) setSetups(s.setups);
          }),
        apiFetch("/api/system/monitors")
          .then((r) => (r.ok ? r.json() : null))
          .then((d: { monitors?: MonitorInfo[] } | null) => {
            if (d?.monitors) setMonitors(d.monitors);
          }),
        apiFetch("/api/system/tasks")
          .then((r) => (r.ok ? r.json() : null))
          .then((d: { count?: number; tasks?: HudTaskItem[] } | null) => {
            if (d) setTasks({ count: d.count ?? 0, items: d.tasks ?? [] });
          }),
        apiFetch("/api/system/mails")
          .then((r) => (r.ok ? r.json() : null))
          .then(
            (
              d: {
                source?: string;
                unreadCount?: number;
                mails?: HudMailItem[];
              } | null,
            ) => {
              if (d)
                setMails({
                  source: d.source ?? "none",
                  unreadCount: d.unreadCount ?? 0,
                  items: d.mails ?? [],
                });
            },
          ),
        apiFetch("/api/system/now-playing")
          .then((r) => (r.ok ? r.json() : null))
          .then((d: HudNowPlaying | null) => {
            if (d) setNowPlaying(d);
          }),
      ];
      if (telemetryEnabled) {
        promises.push(
          apiFetch("/api/system/telemetry")
            .then((r) => (r.ok ? r.json() : null))
            .then((d: TelemetryData | null) => {
              if (d) setTelemetry(d);
            }),
        );
      }
      await Promise.all(promises);
    } catch {
      // offline
    }
  }, [telemetryEnabled]);

  useEffect(() => {
    if (!active) return;
    poll();
    intervalRef.current = setInterval(poll, 5000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") poll();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [active, poll]);

  return { telemetry, monitors, cloudToday, setups, tasks, mails, nowPlaying };
}
