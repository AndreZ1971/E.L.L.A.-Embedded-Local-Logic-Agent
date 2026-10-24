import React from "react";

const DIRECTIVES = [
  { num: "I", key: "harm" },
  { num: "II", key: "conceal" },
  { num: "III", key: "surveil" },
  { num: "IV", key: "exfiltrate" },
] as const;

const HudDirectivePanel: React.FC<{ cloudToday: number | null }> = ({
  cloudToday,
}) => {
  return (
    <div className="hud-panel">
      <div className="hud-label">DIRECTIVE</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {DIRECTIVES.map((d) => (
          <div
            key={d.key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: "0.72rem",
              fontFamily: "var(--ella-font-data)",
            }}
          >
            <span
              style={{
                color: "var(--ella-accent-soft)",
                fontWeight: 600,
                width: 24,
                letterSpacing: "1px",
              }}
            >
              {d.num}
            </span>
            <span
              style={{ color: "var(--ella-text-dim)", letterSpacing: "1px" }}
            >
              {d.key}
            </span>
            <span
              style={{
                marginLeft: "auto",
                color: "var(--ella-success)",
                fontSize: "0.6rem",
              }}
            >
              SEALED
            </span>
          </div>
        ))}
      </div>
      {cloudToday != null && (
        <div
          style={{
            marginTop: 10,
            paddingTop: 8,
            borderTop: "1px solid var(--ella-border)",
            fontSize: "0.7rem",
            fontFamily: "var(--ella-font-data)",
            color: "var(--ella-text-dim)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background:
                cloudToday > 0 ? "var(--ella-warning)" : "var(--ella-success)",
            }}
          />
          CLOUD {cloudToday}
        </div>
      )}
    </div>
  );
};

export default HudDirectivePanel;
