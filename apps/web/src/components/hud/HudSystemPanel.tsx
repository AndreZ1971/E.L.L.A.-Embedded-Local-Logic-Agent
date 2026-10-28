import React from "react";
import { useTranslation } from "react-i18next";

interface TelemetryData {
  cpu: { pct: number; cores: number };
  ram: { pct: number; freeMB: number; totalMB: number };
  vram: { usedMB: number; totalMB: number; gpu?: string } | null;
  model: string;
  tokensPerSec: number | null;
  ttsEngine?: string;
}

function fmtGB(mb: number, locale: string): string {
  return (mb / 1024).toLocaleString(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div
      style={{
        height: 4,
        background: "rgba(79,209,255,0.15)",
        borderRadius: 0,
        overflow: "hidden",
        flex: 1,
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${Math.min(100, pct)}%`,
          background: pct > 85 ? "var(--ella-danger)" : color,
          transition: "width 0.4s",
        }}
      />
    </div>
  );
}

function Row({
  label,
  value,
  pct,
  barColor,
}: {
  label: string;
  value: string;
  pct?: number;
  barColor?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontSize: "0.78rem",
        fontFamily: "var(--ella-font-data)",
        color: "var(--ella-text-muted)",
        marginBottom: 8,
      }}
    >
      <span
        style={{
          minWidth: 32,
          color: "var(--ella-text-dim)",
          letterSpacing: "1px",
          textTransform: "uppercase",
          fontSize: "0.72rem",
        }}
      >
        {label}
      </span>
      {pct !== undefined && (
        <Bar pct={pct} color={barColor ?? "var(--ella-accent)"} />
      )}
      <span
        style={{ minWidth: 80, textAlign: "right", color: "var(--ella-text)" }}
      >
        {value}
      </span>
    </div>
  );
}

const HudSystemPanel: React.FC<{ data: TelemetryData | null }> = ({ data }) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "de" ? "de-DE" : "en-US";

  return (
    <div className="hud-panel">
      <div className="hud-label">SYSTEM</div>
      {!data ? (
        <div style={{ fontSize: "0.75rem", color: "var(--ella-text-dim)" }}>
          ...
        </div>
      ) : (
        <>
          <Row label="CPU" value={`${data.cpu.pct} %`} pct={data.cpu.pct} />
          <Row
            label="RAM"
            value={`${fmtGB(data.ram.totalMB - data.ram.freeMB, locale)} / ${fmtGB(data.ram.totalMB, locale)} GB`}
            pct={data.ram.pct}
          />
          {data.vram && (
            <Row
              label="VRAM"
              value={`${fmtGB(data.vram.usedMB, locale)} / ${fmtGB(data.vram.totalMB, locale)} GB`}
              pct={Math.round((data.vram.usedMB / data.vram.totalMB) * 100)}
              barColor="#a78bfa"
            />
          )}
          {data.vram?.gpu && (
            <div
              style={{
                fontSize: "0.68rem",
                color: "var(--ella-text-dim)",
                fontFamily: "var(--ella-font-data)",
                letterSpacing: "0.5px",
                marginTop: -4,
                marginBottom: 6,
                paddingLeft: 42,
              }}
            >
              {data.vram.gpu.replace(/^NVIDIA\s+GeForce\s+/i, "")}
            </div>
          )}
          <div
            style={{
              borderTop: "1px solid var(--ella-border)",
              paddingTop: 8,
              marginTop: 4,
            }}
          >
            <div
              style={{
                fontSize: "0.72rem",
                color: "var(--ella-text-dim)",
                fontFamily: "var(--ella-font-data)",
                letterSpacing: "0.5px",
              }}
            >
              MODELL{" "}
              <span style={{ color: "var(--ella-text)" }}>{data.model}</span>
            </div>
            {data.tokensPerSec != null && (
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "var(--ella-text-dim)",
                  fontFamily: "var(--ella-font-data)",
                  letterSpacing: "0.5px",
                  marginTop: 2,
                }}
              >
                TEMPO{" "}
                <span style={{ color: "var(--ella-text)" }}>
                  {data.tokensPerSec.toLocaleString(locale, {
                    maximumFractionDigits: 1,
                  })}{" "}
                  tok/s
                </span>
              </div>
            )}
            {data.ttsEngine && (
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "var(--ella-text-dim)",
                  fontFamily: "var(--ella-font-data)",
                  letterSpacing: "0.5px",
                  marginTop: 2,
                }}
              >
                STIMME{" "}
                <span style={{ color: "var(--ella-text)" }}>
                  {data.ttsEngine === "off"
                    ? t("hud.tts_off_offline")
                    : data.ttsEngine}
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default HudSystemPanel;
export type { TelemetryData };
