import type { TelemetryData } from "./HudSystemPanel";
import type { MonitorInfo } from "./HudMonitorPanel";

export interface HudTaskItem {
  id: number;
  title: string;
  priority: "low" | "normal" | "high";
  dueDate: string | null;
}

export interface HudMailItem {
  subject: string;
  sender: string;
  received: string;
  unread: boolean;
}

export interface HudNowPlaying {
  available: boolean;
  playing?: boolean;
  status?: string;
  title?: string;
  artist?: string;
  album?: string;
}

export interface HudWidgetData {
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

export interface WidgetMeta {
  id: string;
  labelKey: string;
}

export const WIDGET_CATALOG: WidgetMeta[] = [
  { id: "system", labelKey: "hud.widget_system" },
  { id: "monitors", labelKey: "hud.widget_monitors" },
  { id: "routines", labelKey: "hud.widget_routines" },
  { id: "directive", labelKey: "hud.widget_directive" },
  { id: "clock", labelKey: "hud.widget_clock" },
  { id: "tasks", labelKey: "hud.widget_tasks" },
  { id: "mails", labelKey: "hud.widget_mails" },
  { id: "music", labelKey: "hud.widget_music" },
];

export const DEFAULT_HUD_WIDGETS = {
  left: ["system", "monitors"],
  right: ["routines", "directive"],
};
