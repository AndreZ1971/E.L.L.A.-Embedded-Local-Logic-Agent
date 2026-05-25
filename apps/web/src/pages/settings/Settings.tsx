import React, { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_BASE ?? "";

const MASKED = "***";

interface Settings {
  provider: "auto" | "openai" | "ollama";
  ollamaModel: string;
  enabledTools: string[];
  sessionLimit: number;
  openaiApiKey: string;
}

const ALL_TOOLS: { name: string; label: string }[] = [
  { name: "open_app", label: "App öffnen" },
  { name: "get_disk_usage", label: "Festplattennutzung abrufen" },
  { name: "clean_temp", label: "Temp-Dateien bereinigen" },
  { name: "empty_recycle_bin", label: "Papierkorb leeren" },
];

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
  const [settings, setSettings] = useState<Settings | null>(null);
  const [models, setModels] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        maxWidth: 560,
      }}
    >
      <h2 style={{ margin: 0 }}>Einstellungen</h2>

      {/* LLM-Provider */}
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

      {/* Ollama-Modell */}
      <Section title="Ollama-Modell">
        <select
          value={settings.ollamaModel}
          onChange={(e) => patch({ ollamaModel: e.target.value })}
          style={{
            width: "100%",
            padding: "8px 10px",
            borderRadius: 6,
            border: "1px solid #2d3148",
            background: "#0f1117",
            color: "#e2e8f0",
            fontSize: "0.9rem",
          }}
        >
          {models.length === 0 && (
            <option value={settings.ollamaModel}>{settings.ollamaModel}</option>
          )}
          {models.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        {models.length === 0 && (
          <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: 6 }}>
            Ollama nicht erreichbar — Modell manuell eingeben
          </div>
        )}
      </Section>

      {/* Aktivierte Tools */}
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

      {/* Session-Limit */}
      <Section title="Session-Limit">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <input
            type="number"
            min={1}
            max={100}
            value={settings.sessionLimit}
            onChange={(e) => patch({ sessionLimit: Number(e.target.value) })}
            style={{
              width: 80,
              padding: "8px 10px",
              borderRadius: 6,
              border: "1px solid #2d3148",
              background: "#0f1117",
              color: "#e2e8f0",
              fontSize: "0.9rem",
            }}
          />
          <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
            Maximale Nachrichten im Verlauf (1–100)
          </span>
        </div>
      </Section>

      {/* OpenAI API-Key */}
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
          style={{
            width: "100%",
            padding: "8px 10px",
            borderRadius: 6,
            border: "1px solid #2d3148",
            background: "#0f1117",
            color: "#e2e8f0",
            fontSize: "0.9rem",
          }}
        />
        <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: 6 }}>
          Wird verschlüsselt auf dem Server gespeichert. Leer lassen = aus .env
          nutzen.
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
