import React, { useState, useEffect, useCallback } from "react";

const API = import.meta.env.VITE_API_BASE ?? "";
const REFRESH_MS = 30_000;

interface WorkerEvent {
  id: number;
  type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

interface SystemStatus {
  ollama: { ok: boolean; url: string };
  db: { ok: boolean };
}

interface DiskInfo {
  success: boolean;
  output?: {
    drive: string;
    usedBytes: number;
    freeBytes: number;
    totalBytes: number;
  };
  error?: string;
}

interface DiskData {
  C: DiskInfo;
  E: DiskInfo;
  Z: DiskInfo;
}

interface ProviderData {
  provider: "openai" | "ollama";
  model: string;
}

function fmt(bytes: number): string {
  const gb = bytes / 1024 ** 3;
  return gb >= 1
    ? `${gb.toFixed(1)} GB`
    : `${(bytes / 1024 ** 2).toFixed(0)} MB`;
}

const StatusDot: React.FC<{ ok: boolean }> = ({ ok }) => (
  <span
    style={{
      display: "inline-block",
      width: 8,
      height: 8,
      borderRadius: "50%",
      background: ok ? "#4ade80" : "#f87171",
      marginRight: 6,
      flexShrink: 0,
    }}
  />
);

const Card: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div
    style={{
      background: "#1a1d27",
      border: "1px solid #2d3148",
      borderRadius: 8,
      padding: "14px 18px",
    }}
  >
    <div
      style={{
        fontSize: "0.75rem",
        color: "#64748b",
        marginBottom: 10,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
      }}
    >
      {title}
    </div>
    {children}
  </div>
);

const DiskBar: React.FC<{ label: string; info: DiskInfo }> = ({
  label,
  info,
}) => {
  if (!info.success || !info.output) {
    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: 4 }}>
          {label} — nicht erreichbar
        </div>
      </div>
    );
  }
  const { usedBytes, totalBytes, freeBytes } = info.output;
  const pct = Math.round((usedBytes / totalBytes) * 100);
  const barColor = pct > 90 ? "#f87171" : pct > 70 ? "#fbbf24" : "#7c6af7";

  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "0.85rem",
          marginBottom: 5,
        }}
      >
        <span style={{ color: "#e2e8f0" }}>{label}</span>
        <span style={{ color: "#94a3b8" }}>
          {fmt(usedBytes)} / {fmt(totalBytes)} &nbsp;
          <span style={{ color: "#64748b" }}>({fmt(freeBytes)} frei)</span>
        </span>
      </div>
      <div
        style={{
          background: "#0f1117",
          borderRadius: 4,
          height: 6,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: barColor,
            borderRadius: 4,
            transition: "width 0.4s",
          }}
        />
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [disk, setDisk] = useState<DiskData | null>(null);
  const [provider, setProvider] = useState<ProviderData | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<WorkerEvent[]>([]);

  const load = useCallback(async () => {
    try {
      const [s, d, p] = await Promise.all([
        fetch(`${API}/api/system/status`).then((r) =>
          r.json(),
        ) as Promise<SystemStatus>,
        fetch(`${API}/api/system/disk`).then((r) =>
          r.json(),
        ) as Promise<DiskData>,
        fetch(`${API}/api/chat/provider`).then((r) =>
          r.json(),
        ) as Promise<ProviderData>,
      ]);
      setStatus(s);
      setDisk(d);
      setProvider(p);
      setLastUpdate(new Date());
    } catch {
      // API not yet reachable — silently retry on next interval
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  /* SSE: empfängt Worker-Events live + lädt initiale Historie */
  useEffect(() => {
    fetch(`${API}/api/events/recent`)
      .then((r) => r.json())
      .then((rows: WorkerEvent[]) => setEvents(rows.slice(0, 20)))
      .catch(() => {});

    const es = new EventSource(`${API}/api/events/stream`);
    es.onmessage = (e: MessageEvent<string>) => {
      const ev = JSON.parse(e.data) as WorkerEvent;
      setEvents((prev) => [ev, ...prev].slice(0, 20));

      if (ev.type === "disk") {
        const d = ev.payload as { drive: string; usedPct: number };
        if (d.drive === "C" || d.drive === "E" || d.drive === "Z") {
          load();
        }
      }
      if (ev.type === "ollama") {
        load();
      }
    };
    return () => es.close();
  }, [load]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        height: "100%",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2 style={{ margin: 0 }}>Dashboard</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {lastUpdate && (
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
              {lastUpdate.toLocaleTimeString("de-DE")}
            </span>
          )}
          <button
            onClick={load}
            style={{
              padding: "4px 12px",
              borderRadius: 4,
              fontSize: "0.8rem",
              background: "transparent",
              border: "1px solid #2d3148",
              color: "#64748b",
              cursor: "pointer",
            }}
          >
            Aktualisieren
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ color: "#64748b", fontSize: "0.9rem" }}>
          Lade Systemdaten…
        </div>
      ) : (
        <>
          {/* Status-Karten */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
            }}
          >
            <Card title="LLM-Provider">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  color: "#e2e8f0",
                }}
              >
                <StatusDot ok={true} />
                {provider
                  ? provider.provider === "openai"
                    ? "OpenAI GPT-4o"
                    : "Ollama"
                  : "—"}
              </div>
              {provider && (
                <div
                  style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 4 }}
                >
                  {provider.model}
                </div>
              )}
            </Card>

            <Card title="Ollama">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  color: "#e2e8f0",
                }}
              >
                <StatusDot ok={status?.ollama.ok ?? false} />
                {status?.ollama.ok ? "Erreichbar" : "Nicht erreichbar"}
              </div>
              <div
                style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 4 }}
              >
                {status?.ollama.url ?? "—"}
              </div>
            </Card>

            <Card title="MariaDB">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  color: "#e2e8f0",
                }}
              >
                <StatusDot ok={status?.db.ok ?? false} />
                {status?.db.ok ? "Verbunden" : "Nicht erreichbar"}
              </div>
              <div
                style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 4 }}
              >
                Port 3306
              </div>
            </Card>
          </div>

          {/* Disk-Usage */}
          <Card title="Speicherplatz">
            {disk ? (
              <>
                <DiskBar label="C: (System)" info={disk.C} />
                <DiskBar label="E: (Daten)" info={disk.E} />
                <DiskBar label="Z: (Repo)" info={disk.Z} />
              </>
            ) : (
              <div style={{ color: "#64748b", fontSize: "0.85rem" }}>
                Keine Daten
              </div>
            )}
          </Card>

          {/* System-Event-Feed */}
          <Card title="System-Events (Live)">
            {events.length === 0 ? (
              <div style={{ color: "#475569", fontSize: "0.82rem" }}>
                Warte auf ersten Worker-Tick…
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  maxHeight: 240,
                  overflowY: "auto",
                }}
              >
                {events.map((ev) => {
                  const isAlert = ev.type === "alert";
                  const severity = ev.payload.severity as string | undefined;
                  const color = isAlert
                    ? severity === "error"
                      ? "#f87171"
                      : "#fbbf24"
                    : "#64748b";
                  const time = new Date(ev.created_at).toLocaleTimeString(
                    "de-DE",
                  );
                  let summary = ev.type;
                  if (ev.type === "disk") {
                    const p = ev.payload as {
                      drive: string;
                      usedPct: number;
                    };
                    summary = `disk ${p.drive}: ${p.usedPct}%`;
                  } else if (ev.type === "ram") {
                    summary = `ram: ${ev.payload.usedPct as number}%`;
                  } else if (ev.type === "ollama") {
                    summary = `ollama: ${ev.payload.ok ? "ok" : "down"}`;
                  } else if (ev.type === "alert") {
                    summary = (ev.payload.message as string) ?? "alert";
                  }
                  return (
                    <div
                      key={ev.id}
                      style={{
                        display: "flex",
                        gap: 10,
                        fontSize: "0.8rem",
                        alignItems: "baseline",
                      }}
                    >
                      <span style={{ color: "#475569", flexShrink: 0 }}>
                        {time}
                      </span>
                      <span style={{ color }}>{summary}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default Dashboard;
