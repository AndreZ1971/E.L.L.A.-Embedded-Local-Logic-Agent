import React from "react";

interface Setup {
  id: string;
  name: string;
  schedule?: {
    enabled?: boolean;
    days?: boolean[];
    time?: string;
  };
}

const DAY_LABELS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

const HudRoutinesPanel: React.FC<{ setups: Setup[] }> = ({ setups }) => {
  const scheduled = setups.filter((s) => s.schedule?.enabled);

  return (
    <div className="hud-panel">
      <div className="hud-label">ROUTINEN</div>
      {scheduled.length === 0 ? (
        <div style={{ fontSize: "0.75rem", color: "var(--ella-text-dim)" }}>
          Keine aktiven Zeitpläne
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {scheduled.map((s) => {
            const days = (s.schedule?.days ?? [])
              .map((on, i) => (on ? DAY_LABELS[i] : null))
              .filter(Boolean)
              .join(" ");
            return (
              <div
                key={s.id}
                style={{
                  fontSize: "0.75rem",
                  fontFamily: "var(--ella-font-data)",
                  color: "var(--ella-text-muted)",
                }}
              >
                <div style={{ color: "var(--ella-text)", marginBottom: 2 }}>
                  {s.name}
                </div>
                <div
                  style={{
                    fontSize: "0.65rem",
                    color: "var(--ella-text-dim)",
                    letterSpacing: "0.5px",
                  }}
                >
                  {s.schedule?.time ?? "--:--"} · {days || "---"}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HudRoutinesPanel;
