import React from "react";

interface MonitorInfo {
  index: number;
  name: string;
  primary: boolean;
  resolution: string;
  position: { x: number; y: number };
}

const HudMonitorPanel: React.FC<{ monitors: MonitorInfo[] }> = ({
  monitors,
}) => {
  return (
    <div className="hud-panel">
      <div className="hud-label">MONITORE</div>
      {monitors.length === 0 ? (
        <div style={{ fontSize: "0.75rem", color: "var(--ella-text-dim)" }}>
          ...
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {monitors.map((m) => (
            <div
              key={m.index}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: "0.75rem",
                fontFamily: "var(--ella-font-data)",
                color: "var(--ella-text-muted)",
              }}
            >
              <span
                style={{
                  width: 18,
                  height: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1px solid ${m.primary ? "var(--ella-accent)" : "var(--ella-border)"}`,
                  color: m.primary
                    ? "var(--ella-accent)"
                    : "var(--ella-text-dim)",
                  fontSize: "0.65rem",
                  fontWeight: 600,
                }}
              >
                {m.index}
              </span>
              <span style={{ color: "var(--ella-text)" }}>{m.resolution}</span>
              {m.primary && (
                <span
                  style={{
                    fontSize: "0.6rem",
                    letterSpacing: "1.5px",
                    color: "var(--ella-accent-soft)",
                    textTransform: "uppercase",
                  }}
                >
                  PRI
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HudMonitorPanel;
export type { MonitorInfo };
