import React, { useState, useEffect, useCallback } from "react";
import type {
  PipelineConfig,
  PipelineAgentDef,
  PipelineEvent,
} from "@ella/shared";
import { apiFetch } from "../../lib/api";

// ── Typen ────────────────────────────────────────────────────────────────────

interface PipelineMeta {
  id: string;
  name: string;
  description: string;
  icon: string;
  executionMode: string;
  agentCount: number;
  isCustom: boolean;
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

type ViewMode = "select" | "build" | "run";

// ── Tool-Kategorien für den Builder ─────────────────────────────────────────

const TOOL_CATEGORIES: { label: string; tools: string[] }[] = [
  {
    label: "Kalender & Mail",
    tools: [
      "read_calendar",
      "read_google_calendar",
      "create_appointment",
      "read_emails",
      "read_gmail",
      "compose_email",
    ],
  },
  {
    label: "Aufgaben & Erinnerungen",
    tools: [
      "list_tasks",
      "add_task",
      "complete_task",
      "list_reminders",
      "list_alarms",
    ],
  },
  {
    label: "System",
    tools: [
      "get_system_status",
      "get_disk_usage",
      "get_temperatures",
      "get_battery_status",
      "list_processes",
      "get_system_info",
      "free_ram",
    ],
  },
  {
    label: "Netzwerk",
    tools: [
      "get_wifi_info",
      "scan_network",
      "list_connections",
      "list_devices",
    ],
  },
  {
    label: "Wetter & Zeit",
    tools: ["get_weather", "get_location", "get_datetime"],
  },
  {
    label: "Dateien & Dokumente",
    tools: [
      "search_files",
      "read_file_content",
      "list_folder",
      "find_duplicates",
    ],
  },
  {
    label: "Suche & Web",
    tools: ["search_web", "describe_webpage", "fetch_url"],
  },
  {
    label: "Musik & Medien",
    tools: ["get_now_playing", "play_music", "control_media"],
  },
];

const ICON_OPTIONS = [
  "⚡",
  "🌅",
  "📊",
  "🔍",
  "🎯",
  "🛠️",
  "📋",
  "🚀",
  "💡",
  "⚙️",
];

// ── Styles ───────────────────────────────────────────────────────────────────

const S = {
  wrap: {
    height: "100%",
    display: "flex",
    flexDirection: "column" as const,
    background: "#13151f",
    color: "#e2e8f0",
    fontFamily: "system-ui, sans-serif",
    overflow: "hidden",
  },
  header: {
    padding: "18px 24px 14px",
    borderBottom: "1px solid #2d3148",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "#e2e8f0",
    letterSpacing: "0.04em",
  },
  headerSub: { fontSize: "0.78rem", color: "#64748b", marginTop: 2 },
  body: {
    flex: 1,
    overflow: "auto",
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column" as const,
    gap: 16,
  },
  label: {
    fontSize: "0.75rem",
    color: "#64748b",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    marginBottom: 6,
  },
  pipelineBtn: (active: boolean, disabled: boolean) => ({
    display: "flex",
    alignItems: "flex-start",
    gap: 14,
    padding: "14px 16px",
    background: active ? "rgba(124,106,247,0.12)" : "rgba(255,255,255,0.03)",
    border: `1px solid ${active ? "#7c6af7" : "#2d3148"}`,
    borderRadius: 10,
    cursor: disabled ? "not-allowed" : "pointer",
    textAlign: "left" as const,
    opacity: disabled ? 0.5 : 1,
    transition: "border-color 0.15s, background 0.15s",
    width: "100%",
    position: "relative" as const,
  }),
  chip: (color: string) => ({
    fontSize: "0.68rem",
    padding: "2px 7px",
    background: `rgba(${color},0.15)`,
    border: `1px solid rgba(${color},0.3)`,
    borderRadius: 20,
    color: `rgb(${color})`,
  }),
  input: {
    background: "#1e2130",
    border: "1px solid #2d3148",
    borderRadius: 7,
    color: "#e2e8f0",
    padding: "9px 12px",
    fontSize: "0.875rem",
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
  },
  textarea: {
    background: "#1e2130",
    border: "1px solid #2d3148",
    borderRadius: 7,
    color: "#e2e8f0",
    padding: "9px 12px",
    fontSize: "0.875rem",
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
    resize: "vertical" as const,
    minHeight: 70,
    fontFamily: "inherit",
  },
  btn: (variant: "primary" | "ghost" | "danger") => ({
    padding: "8px 16px",
    background:
      variant === "primary"
        ? "#7c6af7"
        : variant === "danger"
          ? "rgba(248,113,113,0.1)"
          : "rgba(255,255,255,0.05)",
    border: `1px solid ${variant === "primary" ? "#7c6af7" : variant === "danger" ? "rgba(248,113,113,0.3)" : "#2d3148"}`,
    borderRadius: 7,
    color: variant === "danger" ? "#f87171" : "#e2e8f0",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: variant === "primary" ? 600 : 400,
  }),
};

// ── Haupt-Komponente ─────────────────────────────────────────────────────────

export default function Pipeline() {
  const [pipelines, setPipelines] = useState<PipelineMeta[]>([]);
  const [openaiAvailable, setOpenaiAvailable] = useState(false);
  const [setups, setSetups] = useState<{ name: string }[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedSetup, setSelectedSetup] = useState("");
  const [view, setView] = useState<ViewMode>("select");

  // Run-State
  const [agents, setAgents] = useState<AgentState[]>([]);
  const [runStatus, setRunStatus] = useState<"running" | "done" | "error">(
    "running",
  );
  const [summary, setSummary] = useState("");
  const [setupResult, setSetupResult] = useState<SetupResult | null>(null);
  const [runError, setRunError] = useState("");

  // Builder-State
  const [editId, setEditId] = useState<string | null>(null);
  const [bName, setBName] = useState("");
  const [bDesc, setBDesc] = useState("");
  const [bIcon, setBIcon] = useState("⚡");
  const [bMode, setBMode] = useState<"parallel" | "sequential">("parallel");
  const [bAgents, setBAgents] = useState<PipelineAgentDef[]>([
    { id: "agent_1", name: "Agent 1", role: "", tools: [] },
  ]);
  const [saving, setSaving] = useState(false);

  const loadPipelines = useCallback(() => {
    apiFetch("/api/pipeline")
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
          if (d.pipelines.length > 0 && !selected)
            setSelected(d.pipelines[0].id);
        },
      )
      .catch(() => {});
  }, [selected]);

  useEffect(() => {
    loadPipelines();
  }, []);

  // ── Builder-Helpers ──────────────────────────────────────────────────────

  function openBuilder(pipeline?: PipelineMeta) {
    if (pipeline) {
      // Lade volle Agenten-Daten
      apiFetch("/api/pipeline/custom")
        .then((r) => r.json())
        .then((all: PipelineConfig[]) => {
          const found = all.find((p) => p.id === pipeline.id);
          if (found) {
            setEditId(found.id);
            setBName(found.name);
            setBDesc(found.description);
            setBIcon(found.icon);
            setBMode(found.executionMode);
            setBAgents(found.agents);
          }
        })
        .catch(() => {});
    } else {
      setEditId(null);
      setBName("");
      setBDesc("");
      setBIcon("⚡");
      setBMode("parallel");
      setBAgents([
        { id: `agent_${Date.now()}`, name: "Agent 1", role: "", tools: [] },
      ]);
    }
    setView("build");
  }

  function addAgent() {
    setBAgents((prev) => [
      ...prev,
      {
        id: `agent_${Date.now()}`,
        name: `Agent ${prev.length + 1}`,
        role: "",
        tools: [],
      },
    ]);
  }

  function removeAgent(id: string) {
    setBAgents((prev) => prev.filter((a) => a.id !== id));
  }

  function updateAgent(id: string, patch: Partial<PipelineAgentDef>) {
    setBAgents((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    );
  }

  function toggleTool(agentId: string, tool: string) {
    setBAgents((prev) =>
      prev.map((a) =>
        a.id === agentId
          ? {
              ...a,
              tools: a.tools.includes(tool)
                ? a.tools.filter((t) => t !== tool)
                : [...a.tools, tool],
            }
          : a,
      ),
    );
  }

  async function savePipeline() {
    if (!bName.trim() || bAgents.length === 0) return;
    setSaving(true);
    const body: Partial<PipelineConfig> = {
      name: bName.trim(),
      description: bDesc.trim(),
      icon: bIcon,
      executionMode: bMode,
      agents: bAgents,
    };
    try {
      const url = editId
        ? `/api/pipeline/custom/${editId}`
        : `/api/pipeline/custom`;
      const method = editId ? "PUT" : "POST";
      await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      loadPipelines();
      setView("select");
    } finally {
      setSaving(false);
    }
  }

  async function deletePipeline(id: string) {
    await apiFetch(`/api/pipeline/custom/${id}`, { method: "DELETE" });
    if (selected === id)
      setSelected(pipelines.find((p) => !p.isCustom)?.id ?? null);
    loadPipelines();
  }

  // ── Run-Helpers ──────────────────────────────────────────────────────────

  function startPipeline() {
    if (!selected) return;
    setAgents([]);
    setSummary("");
    setSetupResult(null);
    setRunError("");
    setRunStatus("running");
    setView("run");

    apiFetch(`/api/pipeline/${selected}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(selectedSetup ? { setupName: selectedSetup } : {}),
    })
      .then((res) => {
        if (!res.ok) {
          res
            .json()
            .then((d: { error: string }) => {
              setRunError(d.error ?? "Fehler");
              setRunStatus("error");
            })
            .catch(() => {});
          return;
        }
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        function pump() {
          reader.read().then(({ done, value }) => {
            if (done) {
              setRunStatus((s) => (s === "running" ? "done" : s));
              return;
            }
            buf += decoder.decode(value, { stream: true });
            const lines = buf.split("\n");
            buf = lines.pop() ?? "";
            for (const line of lines) {
              const t = line.trim();
              if (!t.startsWith("data: ")) continue;
              try {
                handleEvent(JSON.parse(t.slice(6)) as PipelineEvent);
              } catch {
                /* skip */
              }
            }
            pump();
          });
        }
        pump();
      })
      .catch((err: Error) => {
        setRunError(err.message);
        setRunStatus("error");
      });
  }

  function handleEvent(event: PipelineEvent) {
    switch (event.type) {
      case "agent_start":
        setAgents((prev) =>
          prev.find((a) => a.id === event.agentId)
            ? prev
            : [
                ...prev,
                {
                  id: event.agentId,
                  name: event.agentName,
                  status: "running",
                  content: "",
                  toolsUsed: [],
                },
              ],
        );
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
        setRunStatus("done");
        break;
      case "setup_executed":
        setSetupResult({
          name: event.setupName,
          success: event.success,
          message: event.message,
        });
        break;
      case "error":
        setRunError(event.message);
        setRunStatus("error");
        break;
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  const selectedMeta = pipelines.find((p) => p.id === selected);

  return (
    <div style={S.wrap}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={S.headerTitle}>
            {view === "build"
              ? editId
                ? "Pipeline bearbeiten"
                : "Neue Pipeline"
              : "Multi-Agenten"}
          </div>
          <div style={S.headerSub}>
            {view === "build"
              ? "Agenten konfigurieren und Tools zuweisen"
              : "Mehrere KI-Agenten arbeiten parallel an einer Aufgabe"}
          </div>
        </div>
        {view === "select" && (
          <button
            onClick={() => openBuilder()}
            style={{
              ...S.btn("ghost"),
              padding: "6px 14px",
              fontSize: "0.82rem",
            }}
          >
            + Eigene Pipeline
          </button>
        )}
        {view === "build" && (
          <button
            onClick={() => setView("select")}
            style={{
              ...S.btn("ghost"),
              padding: "6px 14px",
              fontSize: "0.82rem",
            }}
          >
            Abbrechen
          </button>
        )}
      </div>

      <div style={S.body}>
        {/* ── OpenAI Gate ── */}
        {view !== "build" && !openaiAvailable && (
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
            <span>⚠️</span>
            <span>
              Pipelines erfordern einen OpenAI-Key. Konfiguriere ihn unter{" "}
              <strong>Einstellungen → API-Key</strong>.
            </span>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            VIEW: select
        ════════════════════════════════════════════════════════════════ */}
        {view === "select" && (
          <>
            <div>
              <div style={S.label}>Pipeline wählen</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {pipelines.map((p) => (
                  <div key={p.id} style={{ position: "relative" }}>
                    <button
                      onClick={() => setSelected(p.id)}
                      disabled={!openaiAvailable}
                      style={S.pipelineBtn(selected === p.id, !openaiAvailable)}
                    >
                      <span style={{ fontSize: "1.4rem", flexShrink: 0 }}>
                        {p.icon}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
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
                            marginTop: 2,
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
                          <span style={S.chip("124,106,247")}>
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
                          {p.isCustom && (
                            <span style={S.chip("34,197,94")}>eigene</span>
                          )}
                        </div>
                      </div>
                    </button>
                    {/* Edit / Delete für eigene Pipelines */}
                    {p.isCustom && (
                      <div
                        style={{
                          position: "absolute",
                          top: 10,
                          right: 10,
                          display: "flex",
                          gap: 4,
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openBuilder(p);
                          }}
                          style={{
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid #2d3148",
                            borderRadius: 5,
                            color: "#94a3b8",
                            cursor: "pointer",
                            fontSize: "0.7rem",
                            padding: "2px 7px",
                          }}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePipeline(p.id);
                          }}
                          style={{
                            background: "rgba(248,113,113,0.08)",
                            border: "1px solid rgba(248,113,113,0.2)",
                            borderRadius: 5,
                            color: "#f87171",
                            cursor: "pointer",
                            fontSize: "0.7rem",
                            padding: "2px 7px",
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {setups.length > 0 && openaiAvailable && (
              <div>
                <div style={S.label}>Setup nach Abschluss (optional)</div>
                <select
                  value={selectedSetup}
                  onChange={(e) => setSelectedSetup(e.target.value)}
                  style={{ ...S.input, cursor: "pointer" }}
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

            {selectedMeta && openaiAvailable && (
              <button
                onClick={startPipeline}
                style={{
                  ...S.btn("primary"),
                  alignSelf: "flex-start",
                  padding: "10px 20px",
                }}
              >
                {selectedMeta.icon} {selectedMeta.name} starten
              </button>
            )}
          </>
        )}

        {/* ════════════════════════════════════════════════════════════════
            VIEW: build
        ════════════════════════════════════════════════════════════════ */}
        {view === "build" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Name + Icon */}
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div>
                <div style={S.label}>Icon</div>
                <div
                  style={{
                    display: "flex",
                    gap: 4,
                    flexWrap: "wrap",
                    maxWidth: 160,
                  }}
                >
                  {ICON_OPTIONS.map((ic) => (
                    <button
                      key={ic}
                      onClick={() => setBIcon(ic)}
                      style={{
                        fontSize: "1.2rem",
                        padding: "4px 6px",
                        background:
                          bIcon === ic
                            ? "rgba(124,106,247,0.2)"
                            : "rgba(255,255,255,0.04)",
                        border: `1px solid ${bIcon === ic ? "#7c6af7" : "#2d3148"}`,
                        borderRadius: 6,
                        cursor: "pointer",
                      }}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={S.label}>Name *</div>
                <input
                  value={bName}
                  onChange={(e) => setBName(e.target.value)}
                  placeholder="Pipeline-Name"
                  style={S.input}
                />
                <div style={{ marginTop: 8 }}>
                  <div style={S.label}>Beschreibung</div>
                  <input
                    value={bDesc}
                    onChange={(e) => setBDesc(e.target.value)}
                    placeholder="Was macht diese Pipeline?"
                    style={S.input}
                  />
                </div>
              </div>
            </div>

            {/* Ausführungsmodus */}
            <div>
              <div style={S.label}>Ausführungsmodus</div>
              <div style={{ display: "flex", gap: 8 }}>
                {(["parallel", "sequential"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setBMode(m)}
                    style={{
                      padding: "7px 16px",
                      background:
                        bMode === m
                          ? "rgba(124,106,247,0.15)"
                          : "rgba(255,255,255,0.04)",
                      border: `1px solid ${bMode === m ? "#7c6af7" : "#2d3148"}`,
                      borderRadius: 7,
                      color: bMode === m ? "#a78bfa" : "#94a3b8",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                    }}
                  >
                    {m === "parallel" ? "⚡ Parallel" : "→ Sequenziell"}
                  </button>
                ))}
              </div>
            </div>

            {/* Agenten */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <div style={S.label}>Agenten *</div>
                <button
                  onClick={addAgent}
                  style={{
                    ...S.btn("ghost"),
                    fontSize: "0.78rem",
                    padding: "4px 10px",
                  }}
                >
                  + Agent hinzufügen
                </button>
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                {bAgents.map((agent, idx) => (
                  <div
                    key={agent.id}
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid #2d3148",
                      borderRadius: 10,
                      padding: 14,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        marginBottom: 10,
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.7rem",
                          color: "#64748b",
                          width: 20,
                          textAlign: "center",
                        }}
                      >
                        {idx + 1}
                      </span>
                      <input
                        value={agent.name}
                        onChange={(e) =>
                          updateAgent(agent.id, { name: e.target.value })
                        }
                        placeholder="Agent-Name"
                        style={{ ...S.input, flex: 1 }}
                      />
                      {bAgents.length > 1 && (
                        <button
                          onClick={() => removeAgent(agent.id)}
                          style={{
                            ...S.btn("danger"),
                            padding: "6px 10px",
                            fontSize: "0.75rem",
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div style={{ marginBottom: 10 }}>
                      <div style={S.label}>Rolle / Aufgabenbeschreibung</div>
                      <textarea
                        value={agent.role}
                        onChange={(e) =>
                          updateAgent(agent.id, { role: e.target.value })
                        }
                        placeholder="Was soll dieser Agent tun? Z.B.: Du bist ein Kalender-Assistent. Lies alle heutigen Termine und liste sie kompakt auf."
                        style={S.textarea}
                      />
                    </div>

                    <div>
                      <div style={S.label}>
                        Tools ({agent.tools.length} gewählt)
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        {TOOL_CATEGORIES.map((cat) => (
                          <div key={cat.label}>
                            <div
                              style={{
                                fontSize: "0.7rem",
                                color: "#475569",
                                marginBottom: 4,
                              }}
                            >
                              {cat.label}
                            </div>
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 5,
                              }}
                            >
                              {cat.tools.map((tool) => {
                                const active = agent.tools.includes(tool);
                                return (
                                  <button
                                    key={tool}
                                    onClick={() => toggleTool(agent.id, tool)}
                                    style={{
                                      fontSize: "0.68rem",
                                      padding: "3px 8px",
                                      background: active
                                        ? "rgba(124,106,247,0.18)"
                                        : "rgba(255,255,255,0.04)",
                                      border: `1px solid ${active ? "rgba(124,106,247,0.5)" : "#2d3148"}`,
                                      borderRadius: 20,
                                      color: active ? "#a78bfa" : "#64748b",
                                      cursor: "pointer",
                                    }}
                                  >
                                    {tool}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Speichern */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={savePipeline}
                disabled={!bName.trim() || bAgents.length === 0 || saving}
                style={{
                  ...S.btn("primary"),
                  opacity: !bName.trim() || saving ? 0.5 : 1,
                }}
              >
                {saving
                  ? "Speichern …"
                  : editId
                    ? "Änderungen speichern"
                    : "Pipeline erstellen"}
              </button>
              <button onClick={() => setView("select")} style={S.btn("ghost")}>
                Abbrechen
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            VIEW: run
        ════════════════════════════════════════════════════════════════ */}
        {view === "run" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
                  fontWeight: 600,
                  color:
                    runStatus === "done"
                      ? "#22c55e"
                      : runStatus === "error"
                        ? "#f87171"
                        : "#a78bfa",
                }}
              >
                {runStatus === "running" && (
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#a78bfa",
                      display: "inline-block",
                      animation: "ellaPulse 1s ease-in-out infinite",
                    }}
                  />
                )}
                {runStatus === "running"
                  ? "Pipeline läuft …"
                  : runStatus === "done"
                    ? "✓ Pipeline abgeschlossen"
                    : "✗ Fehler"}
              </div>
              {runStatus !== "running" && (
                <button
                  onClick={() => setView("select")}
                  style={{
                    ...S.btn("ghost"),
                    fontSize: "0.78rem",
                    padding: "5px 14px",
                  }}
                >
                  Zurück
                </button>
              )}
            </div>

            {runError && (
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
                {runError}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid ${agent.status === "done" ? "rgba(34,197,94,0.25)" : agent.status === "error" ? "rgba(248,113,113,0.25)" : "rgba(167,139,250,0.25)"}`,
                    borderRadius: 8,
                    overflow: "hidden",
                  }}
                >
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

            {setupResult && (
              <div
                style={{
                  background: setupResult.success
                    ? "rgba(34,197,94,0.06)"
                    : "rgba(248,113,113,0.06)",
                  border: `1px solid ${setupResult.success ? "rgba(34,197,94,0.25)" : "rgba(248,113,113,0.25)"}`,
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
