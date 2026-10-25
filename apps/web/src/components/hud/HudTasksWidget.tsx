import React from "react";
import { useTranslation } from "react-i18next";
import type { HudTaskItem } from "./widgetRegistry";

const PRIO_COLOR: Record<string, string> = {
  high: "#ef4444",
  normal: "var(--ella-accent)",
  low: "var(--ella-text-dim)",
};

const HudTasksWidget: React.FC<{
  count: number;
  tasks: HudTaskItem[];
}> = ({ count, tasks }) => {
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
          {t("hud.widget_tasks")}
        </span>
        <span
          style={{
            fontFamily: "var(--ella-font-data)",
            fontSize: "0.75rem",
            color: "var(--ella-accent)",
          }}
        >
          {count}
        </span>
      </div>
      {tasks.length === 0 ? (
        <div
          style={{
            fontSize: "0.75rem",
            color: "var(--ella-text-dim)",
            fontStyle: "italic",
          }}
        >
          {t("hud.no_tasks")}
        </div>
      ) : (
        tasks.slice(0, 5).map((task) => (
          <div
            key={task.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "3px 0",
              borderBottom: "1px solid rgba(79,209,255,0.08)",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: PRIO_COLOR[task.priority] ?? PRIO_COLOR.normal,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: "var(--ella-font-data)",
                fontSize: "0.72rem",
                color: "var(--ella-text)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                flex: 1,
              }}
            >
              {task.title}
            </span>
            {task.dueDate && (
              <span
                style={{
                  fontFamily: "var(--ella-font-data)",
                  fontSize: "0.65rem",
                  color: "var(--ella-text-dim)",
                  flexShrink: 0,
                }}
              >
                {task.dueDate}
              </span>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default HudTasksWidget;
