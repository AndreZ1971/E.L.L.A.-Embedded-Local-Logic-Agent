import React from "react";
import { useTranslation } from "react-i18next";
import type { HudMailItem } from "./widgetRegistry";

const HudMailWidget: React.FC<{
  source: string;
  unreadCount: number;
  mails: HudMailItem[];
}> = ({ source, unreadCount, mails }) => {
  const { t } = useTranslation();

  return (
    <div className="hud-panel">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontFamily: "var(--ella-font-display)",
            fontWeight: 700,
            fontSize: "0.7rem",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "var(--ella-text-muted)",
          }}
        >
          {t("hud.widget_mails")}
        </span>
        <span
          style={{
            fontFamily: "var(--ella-font-data)",
            fontSize: "0.75rem",
            color: unreadCount > 0 ? "#f59e0b" : "var(--ella-text-dim)",
          }}
        >
          {unreadCount > 0
            ? `${unreadCount} ${t("hud.unread")}`
            : source === "none"
              ? t("hud.no_mail_client")
              : "0"}
        </span>
      </div>
      {mails.length === 0 ? (
        <div
          style={{
            fontSize: "0.75rem",
            color: "var(--ella-text-dim)",
            fontStyle: "italic",
          }}
        >
          {source === "none" ? t("hud.no_mail_client") : t("hud.no_mails")}
        </div>
      ) : (
        mails.slice(0, 4).map((mail, i) => (
          <div
            key={i}
            style={{
              padding: "3px 0",
              borderBottom: "1px solid rgba(79,209,255,0.08)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--ella-font-data)",
                  fontSize: "0.72rem",
                  color: mail.unread
                    ? "var(--ella-text)"
                    : "var(--ella-text-dim)",
                  fontWeight: mail.unread ? 600 : 400,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  flex: 1,
                }}
              >
                {mail.subject || t("hud.no_subject")}
              </span>
              {mail.unread && (
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#f59e0b",
                    flexShrink: 0,
                  }}
                />
              )}
            </div>
            <div
              style={{
                fontFamily: "var(--ella-font-data)",
                fontSize: "0.65rem",
                color: "var(--ella-text-dim)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {mail.sender}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default HudMailWidget;
