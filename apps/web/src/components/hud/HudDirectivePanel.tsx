import React from "react";
import { useTranslation } from "react-i18next";

const DIRECTIVES = [
  { num: "I", key: "harm" },
  { num: "II", key: "conceal" },
  { num: "III", key: "surveil" },
  { num: "IV", key: "exfiltrate" },
] as const;

const HudDirectivePanel: React.FC<{ cloudToday: number | null }> = ({
  cloudToday,
}) => {
  const { t } = useTranslation();
  const sealed = t("hud.sealed", "Versiegelt");

  return (
    <div className="hud-panel">
      <div className="hud-label">DIRECTIVE</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {DIRECTIVES.map((d) => (
          <div
            key={d.key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              borderLeft: "2px solid rgba(79,209,255,0.4)",
              paddingLeft: 8,
              fontSize: "0.72rem",
              fontFamily: "var(--ella-font-data)",
              letterSpacing: "1px",
              color: "var(--ella-text-dim)",
            }}
          >
            <span
              style={{
                color: "var(--ella-accent-soft)",
                fontWeight: 600,
                minWidth: 16,
              }}
            >
              {d.num}
            </span>
            {d.key}
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: 10,
          fontSize: "0.7rem",
          fontFamily: "var(--ella-font-data)",
          color: "var(--ella-text-dim)",
          letterSpacing: "0.5px",
          lineHeight: 1.6,
        }}
      >
        <div>
          {sealed} · {t("hud.all_four_active", "alle vier aktiv")}
        </div>
        {cloudToday != null && (
          <div>
            {t("hud.cloud_requests_today", "Cloud-Anfragen heute")}{" "}
            <span
              style={{
                color:
                  cloudToday > 0 ? "var(--ella-warning)" : "var(--ella-accent)",
              }}
            >
              {cloudToday}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default HudDirectivePanel;
