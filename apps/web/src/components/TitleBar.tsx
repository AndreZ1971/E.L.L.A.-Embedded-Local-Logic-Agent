import React, { useState, useEffect } from "react";
import "./TitleBar.css";

const TitleBar: React.FC = () => {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    if (!window.electronAPI) return;
    window.electronAPI.isMaximized().then(setMaximized);
    const unsub = window.electronAPI.onMaximizeChange(setMaximized);
    return unsub;
  }, []);

  if (!window.electronAPI) return null;

  return (
    <div className="titlebar">
      <div className="titlebar-drag">
        <span className="titlebar-title">E.L.L.A.</span>
      </div>
      <div className="titlebar-controls">
        <button
          className="titlebar-btn"
          onClick={() => window.electronAPI?.minimize()}
          title="Minimieren"
        >
          <svg width="10" height="1" viewBox="0 0 10 1">
            <rect width="10" height="1" fill="currentColor" />
          </svg>
        </button>
        <button
          className="titlebar-btn"
          onClick={() => window.electronAPI?.maximize()}
          title={maximized ? "Wiederherstellen" : "Maximieren"}
        >
          {maximized ? (
            <svg width="10" height="10" viewBox="0 0 10 10">
              <rect
                x="2"
                y="0"
                width="8"
                height="8"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
              <rect
                x="0"
                y="2"
                width="8"
                height="8"
                fill="#0f1117"
                stroke="currentColor"
                strokeWidth="1"
              />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10">
              <rect
                x="0"
                y="0"
                width="10"
                height="10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </svg>
          )}
        </button>
        <button
          className="titlebar-btn titlebar-btn--close"
          onClick={() => window.electronAPI?.close()}
          title="Schließen"
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <line
              x1="0"
              y1="0"
              x2="10"
              y2="10"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <line
              x1="10"
              y1="0"
              x2="0"
              y2="10"
              stroke="currentColor"
              strokeWidth="1.2"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TitleBar;
