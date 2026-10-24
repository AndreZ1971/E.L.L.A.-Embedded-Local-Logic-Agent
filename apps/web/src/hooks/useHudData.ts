import { useState, useEffect, useRef, useCallback } from "react";
import { apiFetch } from "../lib/api";
import type { TelemetryData } from "../components/hud/HudSystemPanel";
import type { MonitorInfo } from "../components/hud/HudMonitorPanel";

interface HudData {
  telemetry: TelemetryData | null;
  monitors: MonitorInfo[];
  cloudToday: number | null;
  setups: Array<{
    id: string;
    name: string;
    schedule?: { enabled?: boolean; days?: boolean[]; time?: string };
  }>;
}

export function useHudData(
  active: boolean,
  telemetryEnabled: boolean,
): HudData {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [monitors, setMonitors] = useState<MonitorInfo[]>([]);
  const [cloudToday, setCloudToday] = useState<number | null>(null);
  const [setups, setSetups] = useState<HudData["setups"]>([]);
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

  return { telemetry, monitors, cloudToday, setups };
}
