import React from "react";
import { useTranslation } from "react-i18next";
import type { HudNowPlaying } from "./widgetRegistry";

const HudMusicWidget: React.FC<{ nowPlaying: HudNowPlaying }> = ({
  nowPlaying,
}) => {
  const { t } = useTranslation();

  return (
    <div className="hud-panel">
      <div
        style={{
          fontFamily: "var(--ella-font-display)",
          fontWeight: 700,
          fontSize: "0.7rem",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          color: "var(--ella-text-muted)",
          marginBottom: 8,
        }}
      >
        {t("hud.widget_music")}
      </div>
      {!nowPlaying.available ? (
        <div
          style={{
            fontSize: "0.75rem",
            color: "var(--ella-text-dim)",
            fontStyle: "italic",
          }}
        >
          {t("hud.no_playback")}
        </div>
      ) : (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 4,
            }}
          >
            <span
              style={{
                fontSize: "1rem",
                color: nowPlaying.playing
                  ? "var(--ella-accent)"
                  : "var(--ella-text-dim)",
              }}
            >
              {nowPlaying.playing ? "▶" : "⏸"}
            </span>
            <span
              style={{
                fontFamily: "var(--ella-font-data)",
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "var(--ella-text)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                flex: 1,
              }}
            >
              {nowPlaying.title || t("hud.unknown_title")}
            </span>
          </div>
          {nowPlaying.artist && (
            <div
              style={{
                fontFamily: "var(--ella-font-data)",
                fontSize: "0.72rem",
                color: "var(--ella-text-dim)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {nowPlaying.artist}
            </div>
          )}
          {nowPlaying.album && (
            <div
              style={{
                fontFamily: "var(--ella-font-data)",
                fontSize: "0.65rem",
                color: "var(--ella-text-dim)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                marginTop: 2,
              }}
            >
              {nowPlaying.album}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HudMusicWidget;
