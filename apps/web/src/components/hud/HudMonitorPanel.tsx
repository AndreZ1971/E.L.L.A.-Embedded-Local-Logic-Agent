import React from "react";

interface MonitorInfo {
  index: number;
  name: string;
  primary: boolean;
  resolution: string;
  position: { x: number; y: number };
  apps?: string[];
  lastUsed?: boolean;
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
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {monitors.map((m) => (
            <div
              key={m.index}
              style={{
                flex: "1 1 100px",
                border: `1px solid ${m.lastUsed ? "#a78bfa" : "rgba(79,209,255,0.5)"}`,
                borderRadius: 0,
                padding: 8,
                boxShadow: m.lastUsed
                  ? "0 0 18px rgba(167,139,250,0.25)"
                  : "none",
              }}
            >
              <div
                style={{
                  fontSize: "0.68rem",
                  fontFamily: "var(--ella-font-data)",
                  color: "var(--ella-text-dim)",
                  letterSpacing: "1px",
                  marginBottom: 4,
                }}
              >
                MONITOR {m.index}
                {m.primary && (
                  <span style={{ marginLeft: 6, color: "var(--ella-accent)" }}>
                    PRI
                  </span>
                )}
              </div>
              {(!m.apps || m.apps.length === 0) && (
                <div
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--ella-text-dim)",
                    fontFamily: "var(--ella-font-data)",
                  }}
                >
                  {m.resolution}
                </div>
              )}
              {m.apps && m.apps.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                    marginTop: 2,
                  }}
                >
                  {m.apps.map((app, i) => {
                    const isNewest = m.lastUsed && i === m.apps!.length - 1;
                    return (
                      <div
                        key={app}
                        style={{
                          fontSize: "0.72rem",
                          fontFamily: "var(--ella-font-ui)",
                          padding: "2px 6px",
                          background: "rgba(79,209,255,0.14)",
                          color: "var(--ella-text)",
                        }}
                      >
                        {app}
                        {isNewest && (
                          <span
                            style={{
                              marginLeft: 6,
                              fontSize: "0.65rem",
                              color: "var(--ella-accent-soft)",
                            }}
                          >
                            &larr; neu
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
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
