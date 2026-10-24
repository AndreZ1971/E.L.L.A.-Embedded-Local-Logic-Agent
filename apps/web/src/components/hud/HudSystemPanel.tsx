import React from "react";

interface TelemetryData {
  cpu: { pct: number; cores: number };
  ram: { pct: number; freeMB: number; totalMB: number };
  vram: { usedMB: number; totalMB: number } | null;
  model: string;
  tokensPerSec: number | null;
}

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div
      style={{
        height: 4,
        background: "rgba(255,255,255,0.06)",
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
}: {
  label: string;
  value: string;
  pct?: number;
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
        marginBottom: 6,
      }}
    >
      <span
        style={{
          width: 42,
          color: "var(--ella-text-dim)",
          letterSpacing: "1px",
          textTransform: "uppercase",
          fontSize: "0.7rem",
        }}
      >
        {label}
      </span>
      {pct !== undefined && <Bar pct={pct} color="var(--ella-accent)" />}
      <span
        style={{ minWidth: 46, textAlign: "right", color: "var(--ella-text)" }}
      >
        {value}
      </span>
    </div>
  );
}

const HudSystemPanel: React.FC<{ data: TelemetryData | null }> = ({ data }) => {
  return (
    <div className="hud-panel">
      <div className="hud-label">SYSTEM</div>
      {!data ? (
        <div
          style={{
            fontSize: "0.75rem",
            color: "var(--ella-text-dim)",
          }}
        >
          ...
        </div>
      ) : (
        <>
          <Row label="CPU" value={`${data.cpu.pct}%`} pct={data.cpu.pct} />
          <Row label="RAM" value={`${data.ram.pct}%`} pct={data.ram.pct} />
          {data.vram && (
            <Row
              label="VRAM"
              value={`${data.vram.usedMB}/${data.vram.totalMB}`}
              pct={Math.round((data.vram.usedMB / data.vram.totalMB) * 100)}
            />
          )}
          <div
            style={{
              fontSize: "0.7rem",
              color: "var(--ella-text-dim)",
              fontFamily: "var(--ella-font-data)",
              marginTop: 6,
              letterSpacing: "0.5px",
            }}
          >
            {data.model}
            {data.tokensPerSec != null && ` · ${data.tokensPerSec} tok/s`}
          </div>
        </>
      )}
    </div>
  );
};

export default HudSystemPanel;
export type { TelemetryData };
