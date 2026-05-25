import React, { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_BASE ?? "";
const MASKED = "***";

interface AppEntry {
  name: string;
  command: string;
  allowed: boolean;
}

interface Settings {
  provider: "auto" | "openai" | "ollama";
  ollamaModel: string;
  enabledTools: string[];
  sessionLimit: number;
  openaiApiKey: string;
  apps: AppEntry[];
}

const ALL_TOOLS: { name: string; label: string }[] = [
  { name: "open_app", label: "App öffnen" },
  { name: "get_disk_usage", label: "Festplattennutzung abrufen" },
  { name: "clean_temp", label: "Temp-Dateien bereinigen" },
  { name: "empty_recycle_bin", label: "Papierkorb leeren" },
];

const inputStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid #2d3148",
  background: "#0f1117",
  color: "#e2e8f0",
  fontSize: "0.9rem",
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div
    style={{
      background: "#1a1d27",
      border: "1px solid #2d3148",
      borderRadius: 8,
      padding: "16px 20px",
    }}
  >
    <div
      style={{
        fontSize: "0.75rem",
        color: "#64748b",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        marginBottom: 14,
      }}
    >
      {title}
    </div>
    {children}
  </div>
);

const Settings: React.FC = () => {
  const [tab, setTab] = useState<"allgemein" | "programme">("allgemein");
  const [settings, setSettings] = useState<Settings | null>(null);
  const [models, setModels] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/settings`).then((r) => r.json()) as Promise<Settings>,
      fetch(`${API}/api/settings/models`).then((r) => r.json()) as Promise<{
        models: string[];
      }>,
    ]).then(([s, m]) => {
      setSettings(s);
      setModels(m.models);
    });
  }, []);

  const patch = (p: Partial<Settings>) =>
    setSettings((prev) => (prev ? { ...prev, ...p } : prev));

  const toggleTool = (name: string) => {
    if (!settings) return;
    const has = settings.enabledTools.includes(name);
    patch({
      enabledTools: has
        ? settings.enabledTools.filter((t) => t !== name)
        : [...settings.enabledTools, name],
    });
  };

  const toggleApp = (name: string) => {
    if (!settings) return;
    patch({
      apps: settings.apps.map((a) =>
        a.name === name ? { ...a, allowed: !a.allowed } : a,
      ),
    });
  };

  const scan = async () => {
    if (!settings) return;
    setScanning(true);
    try {
      const data = (await fetch(`${API}/api/system/programs`).then((r) =>
        r.json(),
      )) as { programs: { name: string; command: string }[] };

      const existing = new Map(
        settings.apps.map((a) => [a.name.toLowerCase(), a]),
      );

      const merged: AppEntry[] = [...settings.apps];
      for (const p of data.programs) {
        const key = p.name.toLowerCase();
        if (!existing.has(key)) {
          merged.push({ name: p.name, command: p.command, allowed: false });
        }
      }
      merged.sort((a, b) => a.name.localeCompare(b.name));
      patch({ apps: merged });
    } finally {
      setScanning(false);
    }
  };

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    await fetch(`${API}/api/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!settings) {
    return (
      <div style={{ color: "#64748b", fontSize: "0.9rem" }}>
        Lade Einstellungen…
      </div>
    );
  }

  const filteredApps = settings.apps.filter(
    (a) =>
      !filter ||
      a.name.toLowerCase().includes(filter.toLowerCase()) ||
      a.command.toLowerCase().includes(filter.toLowerCase()),
  );

  const allowedCount = settings.apps.filter((a) => a.allowed).length;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        maxWidth: 620,
        height: "100%",
      }}
    >
      <h2 style={{ margin: 0 }}>Einstellungen</h2>

      {/* Tab-Bar */}
      <div
        style={{
          display: "flex",
          gap: 4,
          borderBottom: "1px solid #2d3148",
        }}
      >
        {(["allgemein", "programme"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 18px",
              background: "transparent",
              border: "none",
              borderBottom:
                tab === t ? "2px solid #7c6af7" : "2px solid transparent",
              color: tab === t ? "#e2e8f0" : "#64748b",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: tab === t ? 600 : 400,
              marginBottom: -1,
            }}
          >
            {t === "allgemein"
              ? "Allgemein"
              : `Programme (${allowedCount} erlaubt)`}
          </button>
        ))}
      </div>

      {/* ── Tab: Allgemein ─────────────────────────────────── */}
      {tab === "allgemein" && (
        <>
          <Section title="LLM-Provider">
            {(["auto", "openai", "ollama"] as const).map((p) => (
              <label
                key={p}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 10,
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  color: settings.provider === p ? "#e2e8f0" : "#94a3b8",
                }}
              >
                <input
                  type="radio"
                  name="provider"
                  value={p}
                  checked={settings.provider === p}
                  onChange={() => patch({ provider: p })}
                  style={{ accentColor: "#7c6af7" }}
                />
                {p === "auto" && "Auto (OpenAI wenn verfügbar, sonst Ollama)"}
                {p === "openai" && "OpenAI GPT-4o"}
                {p === "ollama" && "Ollama (lokal)"}
              </label>
            ))}
          </Section>

          <Section title="Ollama-Modell">
            <select
              value={settings.ollamaModel}
              onChange={(e) => patch({ ollamaModel: e.target.value })}
              style={{ ...inputStyle, width: "100%" }}
            >
              {models.length === 0 && (
                <option value={settings.ollamaModel}>
                  {settings.ollamaModel}
                </option>
              )}
              {models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Section>

          <Section title="Aktivierte Tools">
            {ALL_TOOLS.map((t) => (
              <label
                key={t.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 10,
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  color: settings.enabledTools.includes(t.name)
                    ? "#e2e8f0"
                    : "#94a3b8",
                }}
              >
                <input
                  type="checkbox"
                  checked={settings.enabledTools.includes(t.name)}
                  onChange={() => toggleTool(t.name)}
                  style={{ accentColor: "#7c6af7", width: 15, height: 15 }}
                />
                {t.label}
                <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                  ({t.name})
                </span>
              </label>
            ))}
          </Section>

          <Section title="Session-Limit">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input
                type="number"
                min={1}
                max={100}
                value={settings.sessionLimit}
                onChange={(e) =>
                  patch({ sessionLimit: Number(e.target.value) })
                }
                style={{ ...inputStyle, width: 80 }}
              />
              <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                Maximale Nachrichten im Verlauf (1–100)
              </span>
            </div>
          </Section>

          <Section title="OpenAI API-Key">
            <input
              type="password"
              value={settings.openaiApiKey}
              placeholder={
                settings.openaiApiKey === MASKED
                  ? "gesetzt (ändern zum Überschreiben)"
                  : "sk-…"
              }
              onChange={(e) => patch({ openaiApiKey: e.target.value })}
              style={{ ...inputStyle, width: "100%" }}
            />
            <div
              style={{ fontSize: "0.78rem", color: "#64748b", marginTop: 6 }}
            >
              Leer lassen = Wert aus .env nutzen.
            </div>
            {settings.openaiApiKey === MASKED && (
              <button
                onClick={() => patch({ openaiApiKey: "" })}
                style={{
                  marginTop: 8,
                  padding: "4px 10px",
                  fontSize: "0.78rem",
                  borderRadius: 4,
                  background: "transparent",
                  border: "1px solid #7f1d1d",
                  color: "#f87171",
                  cursor: "pointer",
                }}
              >
                Key entfernen
              </button>
            )}
          </Section>
        </>
      )}

      {/* ── Tab: Programme ─────────────────────────────────── */}
      {tab === "programme" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            flex: 1,
            minHeight: 0,
          }}
        >
          {/* Toolbar */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Suchen…"
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              onClick={scan}
              disabled={scanning}
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                background: scanning ? "#2d3148" : "#7c6af7",
                color: "#fff",
                border: "none",
                cursor: scanning ? "not-allowed" : "pointer",
                fontSize: "0.85rem",
                whiteSpace: "nowrap",
              }}
            >
              {scanning ? "Scannt…" : "System scannen"}
            </button>
          </div>

          <div
            style={{
              fontSize: "0.78rem",
              color: "#64748b",
            }}
          >
            {settings.apps.length} Programme bekannt · {allowedCount} erlaubt ·{" "}
            {settings.apps.length - allowedCount} verboten
          </div>

          {/* Liste */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              background: "#1a1d27",
              border: "1px solid #2d3148",
              borderRadius: 8,
            }}
          >
            {filteredApps.length === 0 && (
              <div
                style={{
                  padding: 20,
                  color: "#64748b",
                  fontSize: "0.85rem",
                  textAlign: "center",
                }}
              >
                {settings.apps.length === 0
                  ? 'Noch keine Programme — "System scannen" klicken.'
                  : "Keine Treffer."}
              </div>
            )}
            {filteredApps.map((a) => (
              <label
                key={a.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "9px 16px",
                  borderBottom: "1px solid #1e2133",
                  cursor: "pointer",
                  background: a.allowed ? "transparent" : "#0f111780",
                }}
              >
                <input
                  type="checkbox"
                  checked={a.allowed}
                  onChange={() => toggleApp(a.name)}
                  style={{
                    accentColor: "#7c6af7",
                    width: 15,
                    height: 15,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    flex: 1,
                    fontSize: "0.875rem",
                    color: a.allowed ? "#e2e8f0" : "#64748b",
                  }}
                >
                  {a.name}
                </span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "#475569",
                    fontFamily: "monospace",
                    maxWidth: 260,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={a.command}
                >
                  {a.command}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Speichern */}
      <button
        onClick={save}
        disabled={saving}
        style={{
          alignSelf: "flex-start",
          padding: "10px 24px",
          borderRadius: 6,
          background: saved ? "#4ade80" : "#7c6af7",
          color: saved ? "#0f1117" : "#fff",
          border: "none",
          cursor: saving ? "not-allowed" : "pointer",
          fontSize: "0.9rem",
          fontWeight: 600,
          transition: "background 0.2s",
        }}
      >
        {saving ? "Speichern…" : saved ? "Gespeichert ✓" : "Speichern"}
      </button>
    </div>
  );
};

export default Settings;
