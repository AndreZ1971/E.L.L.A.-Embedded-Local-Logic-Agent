import React, { useState, useEffect } from "react";

const HudClockWidget: React.FC = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = now.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const date = now.toLocaleDateString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="hud-panel" style={{ textAlign: "center" }}>
      <div
        style={{
          fontFamily: "var(--ella-font-data)",
          fontSize: "2rem",
          fontWeight: 600,
          color: "var(--ella-accent)",
          letterSpacing: "0.05em",
        }}
      >
        {time}
      </div>
      <div
        style={{
          fontFamily: "var(--ella-font-data)",
          fontSize: "0.75rem",
          color: "var(--ella-text-dim)",
          marginTop: 4,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        {date}
      </div>
    </div>
  );
};

export default HudClockWidget;
