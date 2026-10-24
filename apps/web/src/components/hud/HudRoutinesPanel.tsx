import React from "react";
import { useTranslation } from "react-i18next";

interface Setup {
  id: string;
  name: string;
  schedule?: {
    enabled?: boolean;
    days?: boolean[];
    time?: string;
  };
  lastRan?: string;
}

const DAY_LABELS = ["SO", "MO", "DI", "MI", "DO", "FR", "SA"];

function formatSchedule(days: boolean[], time: string): string {
  const active = days
    .map((on, i) => (on ? DAY_LABELS[i] : null))
    .filter(Boolean);
  if (active.length === 7) return `TÄGL. ${time}`;
  if (
    active.length === 5 &&
    days[1] &&
    days[2] &&
    days[3] &&
    days[4] &&
    days[5]
  )
    return `MO–FR ${time}`;
  if (active.length === 1) return `${active[0]} ${time}`;
  return `${active.join(" ")} ${time}`;
}

function ranToday(lastRan?: string): boolean {
  if (!lastRan) return false;
  const today = new Date().toISOString().slice(0, 10);
  return lastRan.startsWith(today);
}

const HudRoutinesPanel: React.FC<{ setups: Setup[] }> = ({ setups }) => {
  const { t } = useTranslation();
  const scheduled = setups.filter((s) => s.schedule?.enabled);

  return (
    <div className="hud-panel">
      <div className="hud-label">ROUTINEN</div>
      {scheduled.length === 0 ? (
        <div
          style={{
            fontSize: "0.75rem",
            color: "var(--ella-text-dim)",
            fontFamily: "var(--ella-font-data)",
          }}
        >
          {t("hud.no_schedules", "Keine Zeitpläne")}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {scheduled.map((s) => {
            const done = ranToday(s.lastRan);
            const sched = formatSchedule(
              s.schedule?.days ?? [],
              s.schedule?.time ?? "--:--",
            );
            return (
              <div
                key={s.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    fontSize: "0.82rem",
                    fontFamily: "var(--ella-font-ui)",
                    color: "var(--ella-text)",
                  }}
                >
                  {s.name}
                </span>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontFamily: "var(--ella-font-data)",
                    letterSpacing: "0.5px",
                    color: done
                      ? "var(--ella-accent)"
                      : "var(--ella-text-muted)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {sched}
                  {done && " ✓"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HudRoutinesPanel;
