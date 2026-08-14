import React, { useState, useEffect, useRef } from "react";
import type { PipelineConfig, AgentResult, PipelineEvent } from "@ella/shared";

const API = (import.meta.env.VITE_API_BASE ?? "") as string;

interface PipelineMeta {
  id: string;
  name: string;
  description: string;
  icon: string;
  executionMode: string;
  agentCount: number;
}

interface AgentState {
  id: string;
  name: string;
  status: "pending" | "running" | "done" | "error";
  content: string;
  toolsUsed: string[];
}

interface SetupResult {
  name: string;
  success: boolean;
  message: string;
}

type RunState = "idle" | "running" | "done" | "error";

export default function Pipeline() {
  const [pipelines, setPipelines] = useState<PipelineMeta[]>([]);
  const [openaiAvailable, setOpenaiAvailable] = useState(false);
  const [setups, setSetups] = useState<{ name: string }[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedSetup, setSelectedSetup] = useState<string>("");
  const [runState, setRunState] = useState<RunState>("idle");
  const [agents, setAgents] = useState<AgentState[]>([]);
  const [summary, setSummary] = useState("");
  const [setupResult, setSetupResult] = useState<SetupResult | null>(null);
  const [error, setError] = useState("");
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    fetch(`${API}/api/pipeline`)
      .then((r) => r.json())
      .then(
        (d: {
          pipelines: PipelineMeta[];
          setups: { name: string }[];
          openaiAvailable: boolean;
        }) => {
          setPipelines(d.pipelines);
          setOpenaiAvailable(d.openaiAvailable);
          setSetups(d.setups ?? []);
          if (d.pipelines.length > 0) setSelected(d.pipelines[0].id);
        },
      )
      .catch(() => {});
  }, []);

  function startPipeline() {
    if (!selected || runState === "running") return;
    eventSourceRef.current?.close();

    const pipeline = pipelines.find((p) => p.id === selected);
    if (!pipeline) return;

    setAgents([]);
    setSummary("");
    setSetupResult(null);
    setError("");
    setRunState("running");

    // POST via fetch + ReadableStream (EventSource unterstützt kein POST)
    fetch(`${API}/api/pipeline/${selected}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(selectedSetup ? { setupName: selectedSetup } : {}),
    })
      .then((res) => {
        if (!res.ok) {
          res
            .json()
            .then((d: { error: string }) => {
              setError(d.error ?? "Unbekannter Fehler");
              setRunState("error");
            })
            .catch(() => {
              setError(`HTTP ${res.status}`);
              setRunState("error");
            });
          return;
        }

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buf = "";

        function processChunk() {
          reader.read().then(({ done, value }) => {
            if (done) {
              setRunState((s) => (s === "running" ? "done" : s));
              return;
            }
            buf += decoder.decode(value, { stream: true });
            const lines = buf.split("\n");
            buf = lines.pop() ?? "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data: ")) continue;
              try {
                const event = JSON.parse(trimmed.slice(6)) as PipelineEvent;
                handleEvent(event);
              } catch {
                // ungültiger Chunk
              }
            }
            processChunk();
          });
        }

        processChunk();
      })
      .catch((err: Error) => {
        setError(err.message);
        setRunState("error");
      });
  }

  function handleEvent(event: PipelineEvent) {
    switch (event.type) {
      case "agent_start":
        setAgents((prev) => {
          if (prev.find((a) => a.id === event.agentId)) return prev;
          return [
            ...prev,
            {
              id: event.agentId,
              name: event.agentName,
              status: "running",
              content: "",
              toolsUsed: [],
            },
          ];
        });
        break;

      case "agent_chunk":
        setAgents((prev) =>
          prev.map((a) =>
            a.id === event.agentId
              ? { ...a, content: a.content + event.text }
              : a,
          ),
        );
        break;

      case "agent_tool":
        setAgents((prev) =>
          prev.map((a) =>
            a.id === event.agentId && !a.toolsUsed.includes(event.toolName)
              ? { ...a, toolsUsed: [...a.toolsUsed, event.toolName] }
              : a,
          ),
        );
        break;

      case "agent_done":
        setAgents((prev) =>
          prev.map((a) =>
            a.id === event.agentId
              ? {
                  ...a,
                  status: "done",
                  content: event.content || a.content,
                  toolsUsed: event.toolsUsed,
                }
              : a,
          ),
        );
        break;

      case "pipeline_done":
        setSummary(event.summary);
        setRunState("done");
        break;

      case "setup_executed":
        setSetupResult({
          name: event.setupName,
          success: event.success,
          message: event.message,
        });
        break;

      case "error":
        setError(event.message);
        setRunState("error");
        break;
    }
  }

  function reset() {
    setAgents([]);
    setSummary("");
    setSetupResult(null);
    setError("");
    setRunState("idle");
  }

  const selectedPipeline = pipelines.find((p) => p.id === selected);

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 0,
        background: "#13151f",
        color: "#e2e8f0",
        fontFamily: "system-ui, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "18px 24px 14px",
          borderBottom: "1px solid #2d3148",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: "1.1rem",
            fontWeight: 700,
            color: "#e2e8f0",
            letterSpacing: "0.04em",
          }}
        >
          Multi-Agenten
        </div>
        <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: 2 }}>
          Mehrere KI-Agenten arbeiten parallel an einer Aufgabe
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "20px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* OpenAI Gate */}
        {!openaiAvailable && (
          <div
            style={{
              background: "rgba(251,191,36,0.08)",
              border: "1px solid rgba(251,191,36,0.3)",
              borderRadius: 8,
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: "0.85rem",
              color: "#fbbf24",
            }}
          >
            <span style={{ fontSize: "1.1rem" }}>⚠️</span>
            <span>
              Pipelines erfordern einen OpenAI-Key. Konfiguriere ihn unter{" "}
              <strong>Einstellungen → API-Key</strong>.
            </span>
          </div>
        )}

        {/* Pipeline-Auswahl */}
        {runState === "idle" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div
              style={{
                fontSize: "0.75rem",
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Pipeline wählen
            </div>
            {pipelines.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                disabled={!openaiAvailable}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  padding: "14px 16px",
                  background:
                    selected === p.id
                      ? "rgba(124,106,247,0.12)"
                      : "rgba(255,255,255,0.03)",
                  border: `1px solid ${selected === p.id ? "#7c6af7" : "#2d3148"}`,
                  borderRadius: 10,
                  cursor: openaiAvailable ? "pointer" : "not-allowed",
                  textAlign: "left",
                  opacity: openaiAvailable ? 1 : 0.5,
                  transition: "border-color 0.15s, background 0.15s",
                  width: "100%",
                }}
              >
                <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>
                  {p.icon}
                </span>
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      color: "#e2e8f0",
                      fontSize: "0.9rem",
                    }}
                  >
                    {p.name}
                  </div>
                  <div
                    style={{
                      fontSize: "0.78rem",
                      color: "#64748b",
                      marginTop: 3,
                    }}
                  >
                    {p.description}
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      display: "flex",
                      gap: 6,
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.68rem",
                        padding: "2px 7px",
                        background: "rgba(124,106,247,0.15)",
                        border: "1px solid rgba(124,106,247,0.3)",
                        borderRadius: 20,
                        color: "#a78bfa",
                      }}
                    >
                      {p.agentCount} Agenten
                    </span>
                    <span
                      style={{
                        fontSize: "0.68rem",
                        padding: "2px 7px",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid #2d3148",
                        borderRadius: 20,
                        color: "#64748b",
                      }}
                    >
                      {p.executionMode === "parallel"
                        ? "⚡ parallel"
                        : "→ sequenziell"}
                    </span>
                  </div>
                </div>
              </button>
            ))}

            {setups.length > 0 && openaiAvailable && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Setup nach Abschluss (optional)
                </div>
                <select
                  value={selectedSetup}
                  onChange={(e) => setSelectedSetup(e.target.value)}
                  style={{
                    background: "#1e2130",
                    border: "1px solid #2d3148",
                    borderRadius: 7,
                    color: "#cbd5e1",
                    padding: "8px 12px",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  <option value="">— Kein Setup —</option>
                  {setups.map((s) => (
                    <option key={s.name} value={s.name}>
                      ⚡ {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedPipeline && openaiAvailable && (
              <button
                onClick={startPipeline}
                style={{
                  marginTop: 4,
                  padding: "11px 24px",
                  background: "#7c6af7",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  alignSelf: "flex-start",
                  transition: "background 0.15s",
                }}
              >
                {selectedPipeline.icon} {selectedPipeline.name} starten
              </button>
            )}
          </div>
        )}

        {/* Laufende / abgeschlossene Pipeline */}
        {(runState === "running" ||
          runState === "done" ||
          runState === "error") && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Status-Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: "0.85rem",
                  color:
                    runState === "done"
                      ? "#22c55e"
                      : runState === "error"
                        ? "#f87171"
                        : "#a78bfa",
                  fontWeight: 600,
                }}
              >
                {runState === "running" && (
                  <span
                    style={{
                      display: "inline-block",
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#a78bfa",
                      animation: "ellaPulse 1s ease-in-out infinite",
                    }}
                  />
                )}
                {runState === "running"
                  ? "Pipeline läuft …"
                  : runState === "done"
                    ? "✓ Pipeline abgeschlossen"
                    : "✗ Fehler"}
              </div>
              {runState !== "running" && (
                <button
                  onClick={reset}
                  style={{
                    padding: "5px 14px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid #2d3148",
                    borderRadius: 6,
                    color: "#94a3b8",
                    cursor: "pointer",
                    fontSize: "0.78rem",
                  }}
                >
                  Neue Pipeline
                </button>
              )}
            </div>

            {/* Fehler */}
            {error && (
              <div
                style={{
                  background: "rgba(248,113,113,0.08)",
                  border: "1px solid rgba(248,113,113,0.3)",
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontSize: "0.82rem",
                  color: "#f87171",
                }}
              >
                {error}
              </div>
            )}

            {/* Agent-Karten */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid ${
                      agent.status === "done"
                        ? "rgba(34,197,94,0.25)"
                        : agent.status === "error"
                          ? "rgba(248,113,113,0.25)"
                          : "rgba(167,139,250,0.25)"
                    }`,
                    borderRadius: 8,
                    overflow: "hidden",
                  }}
                >
                  {/* Agent-Header */}
                  <div
                    style={{
                      padding: "8px 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      borderBottom: agent.content
                        ? "1px solid #2d3148"
                        : "none",
                      background: "rgba(255,255,255,0.02)",
                    }}
                  >
                    <div
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background:
                          agent.status === "done"
                            ? "#22c55e"
                            : agent.status === "error"
                              ? "#f87171"
                              : "#a78bfa",
                        flexShrink: 0,
                        animation:
                          agent.status === "running"
                            ? "ellaPulse 1s ease-in-out infinite"
                            : "none",
                      }}
                    />
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: "0.82rem",
                        color: "#cbd5e1",
                      }}
                    >
                      {agent.name}
                    </span>
                    {agent.status === "running" && (
                      <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                        analysiert …
                      </span>
                    )}
                    {agent.toolsUsed.length > 0 && (
                      <div
                        style={{
                          marginLeft: "auto",
                          display: "flex",
                          gap: 4,
                          flexWrap: "wrap",
                        }}
                      >
                        {agent.toolsUsed.map((t) => (
                          <span
                            key={t}
                            style={{
                              fontSize: "0.65rem",
                              padding: "1px 6px",
                              background: "rgba(124,106,247,0.12)",
                              border: "1px solid rgba(124,106,247,0.2)",
                              borderRadius: 20,
                              color: "#a78bfa",
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Agent-Inhalt */}
                  {agent.content && (
                    <div
                      style={{
                        padding: "10px 14px",
                        fontSize: "0.82rem",
                        color: "#cbd5e1",
                        lineHeight: 1.6,
                        whiteSpace: "pre-wrap",
                        maxHeight: 200,
                        overflow: "auto",
                      }}
                    >
                      {agent.content}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Setup-Ergebnis */}
            {setupResult && (
              <div
                style={{
                  background: setupResult.success
                    ? "rgba(34,197,94,0.06)"
                    : "rgba(248,113,113,0.06)",
                  border: `1px solid ${
                    setupResult.success
                      ? "rgba(34,197,94,0.25)"
                      : "rgba(248,113,113,0.25)"
                  }`,
                  borderRadius: 10,
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span style={{ fontSize: "1.1rem" }}>
                  {setupResult.success ? "✅" : "❌"}
                </span>
                <div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: setupResult.success ? "#22c55e" : "#f87171",
                    }}
                  >
                    Setup: {setupResult.name}
                  </div>
                  <div
                    style={{
                      fontSize: "0.78rem",
                      color: "#94a3b8",
                      marginTop: 2,
                    }}
                  >
                    {setupResult.message}
                  </div>
                </div>
              </div>
            )}

            {/* Zusammenfassung */}
            {summary && (
              <div
                style={{
                  background: "rgba(124,106,247,0.06)",
                  border: "1px solid rgba(124,106,247,0.25)",
                  borderRadius: 10,
                  padding: "14px 16px",
                }}
              >
                <div
                  style={{
                    fontSize: "0.72rem",
                    color: "#7c6af7",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 8,
                  }}
                >
                  ✦ Zusammenfassung
                </div>
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "#e2e8f0",
                    lineHeight: 1.65,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {summary}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
