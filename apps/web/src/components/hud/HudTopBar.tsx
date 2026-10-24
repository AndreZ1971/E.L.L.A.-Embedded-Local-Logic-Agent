import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { apiFetch } from "../../lib/api";

interface NavItem {
  to: string;
  label: string;
}

interface HudTopBarProps {
  navItems: NavItem[];
}

const HudTopBar: React.FC<HudTopBarProps> = ({ navItems }) => {
  const [offlineMode, setOfflineMode] = useState(false);
  const [cloudToday, setCloudToday] = useState(0);
  const [time, setTime] = useState(() => formatTime());

  useEffect(() => {
    const tick = setInterval(() => setTime(formatTime()), 10_000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const [health, cloud] = await Promise.all([
          apiFetch("/api/health").then((r) => (r.ok ? r.json() : null)),
          apiFetch("/api/events/cloud-today").then((r) =>
            r.ok ? r.json() : null,
          ),
        ]);
        if (cancelled) return;
        if (health) setOfflineMode(!!health.offline_mode);
        if (cloud) setCloudToday(cloud.count ?? 0);
      } catch {
        /* offline */
      }
    }
    poll();
    const iv = setInterval(poll, 10_000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, []);

  return (
    <nav className="hud-topbar">
      <div className="hud-topbar-logo">
        <span className="hud-topbar-logo-name">E.L.L.A.</span>
        <span className="hud-topbar-logo-suffix">// HUD</span>
      </div>

      <div className="hud-topbar-nav">
        {navItems.map((n) => (
          <NavLink key={n.to} to={n.to}>
            {n.label}
          </NavLink>
        ))}
      </div>

      <div className="hud-topbar-chips">
        {offlineMode ? (
          <span className="hud-topbar-chip hud-topbar-chip--offline">
            <span className="hud-topbar-chip-dot hud-topbar-chip-dot--off" />
            OFFLINE
          </span>
        ) : (
          <span className="hud-topbar-chip hud-topbar-chip--local">
            <span className="hud-topbar-chip-dot" />
            LOKAL
          </span>
        )}
        <span
          className={`hud-topbar-chip${cloudToday > 0 ? " hud-topbar-chip--warn" : ""}`}
        >
          CLOUD {cloudToday}
        </span>
        <span className="hud-topbar-chip">{time}</span>
      </div>
    </nav>
  );
};

function formatTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default HudTopBar;
