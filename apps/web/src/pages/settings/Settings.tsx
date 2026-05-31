import React, { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_BASE ?? "";
const MASKED = "***";

interface AppEntry {
  name: string;
  command: string;
  allowed: boolean;
}

interface Setup {
  id: string;
  name: string;
  open: string[];
  close: string[];
}

interface HomeworkModeConfig {
  pinHash: string;
  apps: string[];
  active: boolean;
}

interface Rule {
  id: number;
  name: string;
  tool_name: string;
  trigger: string;
  action: "allow" | "deny";
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface Settings {
  provider: "auto" | "openai" | "ollama";
  ollamaModel: string;
  enabledTools: string[];
  sessionLimit: number;
  openaiApiKey: string;
  apps: AppEntry[];
  voiceMode: "off" | "manual" | "wakeword";
  setups: Setup[];
  homeworkMode: HomeworkModeConfig;
  ttsEnabled: boolean;
  ttsVoice: string;
  onboardingComplete: boolean;
  emergencyResetAt: string | null;
}

const ALL_TOOLS: { name: string; label: string }[] = [
  { name: "open_app", label: "App öffnen" },
  { name: "get_disk_usage", label: "Festplattennutzung abrufen" },
  { name: "clean_temp", label: "Temp-Dateien bereinigen" },
  { name: "empty_recycle_bin", label: "Papierkorb leeren" },
  { name: "remember", label: "Erinnerungen speichern" },
  { name: "forget", label: "Erinnerungen löschen" },
  { name: "list_memories", label: "Erinnerungen auflisten" },
  { name: "homework_mode", label: "Hausaufgaben-Modus steuern" },
  { name: "get_system_info", label: "Systeminfo abrufen" },
  { name: "create_setup", label: "Setup anlegen" },
  { name: "update_setting", label: "Einstellung ändern" },
  { name: "create_rule", label: "Regel erstellen" },
  { name: "free_ram", label: "RAM freigeben" },
  { name: "read_emails", label: "E-Mails lesen" },
  { name: "mark_email", label: "E-Mail markieren" },
  { name: "read_calendar", label: "Kalender lesen" },
  { name: "create_appointment", label: "Termin erstellen" },
  { name: "list_devices", label: "Geräte auflisten" },
  { name: "scan_network", label: "Netzwerk scannen" },
  { name: "list_connections", label: "Verbindungen auflisten" },
  { name: "get_system_status", label: "System-Status abrufen" },
  { name: "search_web", label: "Web-Suche (Small Talk / Wetter)" },
  { name: "get_location", label: "Standort ermitteln (Memory / IP-Geo)" },
  { name: "get_datetime", label: "Datum & Uhrzeit (Berechnungen / Zeitzonen)" },
  {
    name: "delete_files",
    label: "Dateien löschen (Directive-Demo — immer blockiert)",
  },
  { name: "web_search", label: "Web-Suche via DuckDuckGo (kein API-Key)" },
  { name: "fetch_url", label: "URL-Inhalt abrufen" },
  { name: "get_weather", label: "Wettervorhersage (Open-Meteo)" },
];

const input: React.CSSProperties = {
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
      padding: "14px 18px",
    }}
  >
    <div
      style={{
        fontSize: "0.72rem",
        color: "#64748b",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        marginBottom: 12,
      }}
    >
      {title}
    </div>
    {children}
  </div>
);

type Tab = "llm" | "tools" | "programme" | "setups" | "modus" | "regeln";

const Settings: React.FC = () => {
  const [tab, setTab] = useState<Tab>("llm");
  const [settings, setSettings] = useState<Settings | null>(null);
  const [models, setModels] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [filter, setFilter] = useState("");
  const [selectedSetupId, setSelectedSetupId] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [newRule, setNewRule] = useState<{
    name: string;
    tool_name: string;
    trigger: string;
    action: "allow" | "deny";
  }>({ name: "", tool_name: "*", trigger: "always", action: "allow" });
  const [ruleSaving, setRuleSaving] = useState(false);

  useEffect(() => {
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Hausaufgaben-Modus PIN-Formular
  const [pinCurrent, setPinCurrent] = useState("");
  const [pinNew, setPinNew] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [pinSaving, setPinSaving] = useState(false);
  const [pinMsg, setPinMsg] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  const loadRules = async () => {
    const data = (await fetch(`${API}/api/rules`).then((r) =>
      r.json(),
    )) as Rule[];
    setRules(data);
  };

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/settings`)
        .then((r) => r.json())
        .catch(() => null) as Promise<Settings | null>,
      fetch(`${API}/api/settings/models`)
        .then((r) => r.json())
        .catch(() => ({ models: [] })) as Promise<{ models: string[] }>,
      fetch(`${API}/api/rules`)
        .then((r) => r.json())
        .catch(() => []) as Promise<Rule[]>,
    ]).then(([s, m, r]) => {
      if (s) setSettings(s);
      setModels(m.models ?? []);
      setRules(Array.isArray(r) ? r : []);
    });
  }, []);

  const patch = (p: Partial<Settings>) =>
    setSettings((prev) => (prev ? { ...prev, ...p } : prev));

  const toggleTool = (name: string) => {
    if (!settings) return;
    const cur = settings.enabledTools ?? [];
    patch({
      enabledTools: cur.includes(name)
        ? cur.filter((t) => t !== name)
        : [...cur, name],
    });
  };

  const toggleApp = (name: string) => {
    if (!settings) return;
    patch({
      apps: (settings.apps ?? []).map((a) =>
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
      )) as {
        programs: { name: string; command: string }[];
      };
      const existing = new Map(
        (settings.apps ?? []).map((a) => [a.name.toLowerCase(), a]),
      );
      const merged: AppEntry[] = [...(settings.apps ?? [])];
      for (const p of data.programs) {
        if (!existing.has(p.name.toLowerCase())) {
          merged.push({ name: p.name, command: p.command, allowed: false });
        }
      }
      merged.sort((a, b) => a.name.localeCompare(b.name));
      patch({ apps: merged });
    } finally {
      setScanning(false);
    }
  };

  const addSetup = () => {
    if (!settings) return;
    const id = crypto.randomUUID();
    patch({
      setups: [
        ...(settings.setups ?? []),
        { id, name: "Neues Setup", open: [], close: [] },
      ],
    });
    setSelectedSetupId(id);
  };

  const deleteSetup = (id: string) => {
    if (!settings) return;
    patch({ setups: (settings.setups ?? []).filter((s) => s.id !== id) });
    if (selectedSetupId === id) setSelectedSetupId(null);
  };

  const renameSetup = (id: string, name: string) => {
    if (!settings) return;
    patch({
      setups: (settings.setups ?? []).map((s) =>
        s.id === id ? { ...s, name } : s,
      ),
    });
  };

  const toggleSetupList = (
    setupId: string,
    appName: string,
    list: "open" | "close",
  ) => {
    if (!settings) return;
    patch({
      setups: (settings.setups ?? []).map((s) => {
        if (s.id !== setupId) return s;
        const arr = s[list];
        const has = arr.includes(appName);
        return {
          ...s,
          [list]: has ? arr.filter((a) => a !== appName) : [...arr, appName],
        };
      }),
    });
  };

  const savePin = async () => {
    if (!pinNew) {
      setPinMsg({ ok: false, text: "Bitte neuen PIN eingeben." });
      return;
    }
    if (pinNew !== pinConfirm) {
      setPinMsg({ ok: false, text: "PINs stimmen nicht überein." });
      return;
    }
    if (pinNew.length < 4) {
      setPinMsg({ ok: false, text: "PIN muss mindestens 4 Zeichen haben." });
      return;
    }
    setPinSaving(true);
    setPinMsg(null);
    try {
      const body: Record<string, string> = { newPin: pinNew };
      if (pinCurrent) body.currentPin = pinCurrent;
      const r = await fetch(`${API}/api/homework/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await r.json()) as { success?: boolean; error?: string };
      if (data.success) {
        setPinMsg({ ok: true, text: "PIN gespeichert." });
        setPinCurrent("");
        setPinNew("");
        setPinConfirm("");
        // Refresh settings to update pinHash indicator
        const s = (await fetch(`${API}/api/settings`).then((r) =>
          r.json(),
        )) as Settings;
        setSettings(s);
      } else {
        setPinMsg({ ok: false, text: data.error ?? "Fehler beim Speichern." });
      }
    } finally {
      setPinSaving(false);
    }
  };

  const toggleRuleEnabled = async (id: number) => {
    await fetch(`${API}/api/rules/${id}/toggle`, { method: "PATCH" });
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
    );
  };

  const deleteRule = async (id: number) => {
    await fetch(`${API}/api/rules/${id}`, { method: "DELETE" });
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const addRule = async () => {
    if (!newRule.name.trim()) return;
    setRuleSaving(true);
    try {
      await fetch(`${API}/api/rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRule),
      });
      setNewRule({
        name: "",
        tool_name: "*",
        trigger: "always",
        action: "allow",
      });
      await loadRules();
    } finally {
      setRuleSaving(false);
    }
  };

  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const emergencyReset = async () => {
    if (
      !window.confirm(
        "Notschalter: Alle KI-Einstellungen auf sichere Defaults zurücksetzen?\n\nApps, Setups, PIN und Regeln bleiben erhalten.",
      )
    )
      return;
    setResetting(true);
    try {
      const data = (await fetch(`${API}/api/settings/emergency-reset`, {
        method: "POST",
      }).then((r) => r.json())) as Settings;
      setSettings(data);
      setResetDone(true);
      setTimeout(() => setResetDone(false), 4000);
    } finally {
      setResetting(false);
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

  const allowedCount = (settings.apps ?? []).filter((a) => a.allowed).length;
  const filteredApps = (settings.apps ?? []).filter(
    (a) =>
      !filter ||
      a.name.toLowerCase().includes(filter.toLowerCase()) ||
      a.command.toLowerCase().includes(filter.toLowerCase()),
  );

  const TAB_LABELS: Record<Tab, string> = {
    llm: "LLM",
    tools: "Tools",
    setups: `Setups (${(settings.setups ?? []).length})`,
    programme: `Programme (${allowedCount})`,
    modus: settings.homeworkMode?.active ? "🔒 Modus" : "Modus",
    regeln: `Regeln (${rules.length})`,
  };

  const rowLabel: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
    cursor: "pointer",
    fontSize: "0.9rem",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        maxWidth: 620,
        height: "100%",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2 style={{ margin: 0 }}>Einstellungen</h2>
        <button
          onClick={emergencyReset}
          disabled={resetting}
          title="Setzt KI-Einstellungen auf sichere Defaults zurück"
          style={{
            padding: "6px 14px",
            borderRadius: 6,
            background: "transparent",
            border: "1px solid #7f1d1d",
            color: resetDone ? "#4ade80" : "#f87171",
            cursor: resetting ? "not-allowed" : "pointer",
            fontSize: "0.8rem",
            fontWeight: 600,
          }}
        >
          {resetting ? "…" : resetDone ? "✓ Zurückgesetzt" : "Notschalter"}
        </button>
      </div>

      {/* Banner wenn Notschalter aktiv war */}
      {settings.emergencyResetAt && (
        <div
          style={{
            background: "#2d1a1a",
            border: "1px solid #7f1d1d",
            borderRadius: 8,
            padding: "8px 14px",
            fontSize: "0.82rem",
            color: "#fca5a5",
            flexShrink: 0,
          }}
        >
          Notschalter aktiviert am{" "}
          {new Date(settings.emergencyResetAt).toLocaleString("de-DE")} —
          Einstellungen wurden auf sichere Defaults zurückgesetzt.
        </div>
      )}

      {/* Tab-Bar */}
      <div
        style={{
          display: "flex",
          gap: 4,
          borderBottom: "1px solid #2d3148",
          flexShrink: 0,
        }}
      >
        {(
          ["llm", "tools", "setups", "programme", "modus", "regeln"] as Tab[]
        ).map((t) => (
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
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* ── Scrollbarer Tab-Inhalt ────────────────────────────── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          paddingTop: 14,
        }}
      >
        {/* ── Tab: LLM ─────────────────────────────────────────── */}
        {tab === "llm" && (
          <>
            <Section title="Provider">
              {(["auto", "openai", "ollama"] as const).map((p) => (
                <label
                  key={p}
                  style={{
                    ...rowLabel,
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
                value={settings.ollamaModel ?? ""}
                onChange={(e) => patch({ ollamaModel: e.target.value })}
                style={{ ...input, width: "100%" }}
              >
                {models.length === 0 && (
                  <option value={settings.ollamaModel ?? ""}>
                    {settings.ollamaModel ?? ""}
                  </option>
                )}
                {models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </Section>

            <Section title="OpenAI API-Key">
              <input
                type="password"
                value={settings.openaiApiKey ?? ""}
                placeholder={
                  settings.openaiApiKey === MASKED
                    ? "gesetzt (ändern zum Überschreiben)"
                    : "sk-…"
                }
                onChange={(e) => patch({ openaiApiKey: e.target.value })}
                style={{ ...input, width: "100%" }}
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

            <Section title="Sprachausgabe (TTS)">
              <label style={{ ...rowLabel, marginBottom: 14 }}>
                <input
                  type="checkbox"
                  checked={settings.ttsEnabled ?? false}
                  onChange={(e) => patch({ ttsEnabled: e.target.checked })}
                  style={{ accentColor: "#7c6af7", width: 15, height: 15 }}
                />
                <span
                  style={{ color: settings.ttsEnabled ? "#e2e8f0" : "#94a3b8" }}
                >
                  E.L.L.A. spricht Antworten vor
                </span>
              </label>
              {voices.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "#64748b",
                      marginBottom: 6,
                    }}
                  >
                    Stimme
                  </div>
                  <select
                    value={settings.ttsVoice ?? ""}
                    onChange={(e) => patch({ ttsVoice: e.target.value })}
                    disabled={!settings.ttsEnabled}
                    style={{
                      ...input,
                      width: "100%",
                      opacity: settings.ttsEnabled ? 1 : 0.4,
                    }}
                  >
                    <option value="">
                      — Automatisch (erste deutsche Stimme) —
                    </option>
                    {voices.map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </Section>
          </>
        )}

        {/* ── Tab: Tools ───────────────────────────────────────── */}
        {tab === "tools" && (
          <>
            <Section title="Aktivierte Tools">
              {ALL_TOOLS.map((t) => (
                <label
                  key={t.name}
                  style={{
                    ...rowLabel,
                    color: (settings.enabledTools ?? []).includes(t.name)
                      ? "#e2e8f0"
                      : "#94a3b8",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={(settings.enabledTools ?? []).includes(t.name)}
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
                  value={settings.sessionLimit ?? 40}
                  onChange={(e) =>
                    patch({ sessionLimit: Number(e.target.value) })
                  }
                  style={{ ...input, width: 80 }}
                />
                <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                  Maximale Nachrichten im Verlauf (1–100)
                </span>
              </div>
            </Section>

            <Section title="Spracheingabe">
              {(["off", "manual", "wakeword"] as const).map((m) => (
                <label
                  key={m}
                  style={{
                    ...rowLabel,
                    color: settings.voiceMode === m ? "#e2e8f0" : "#94a3b8",
                  }}
                >
                  <input
                    type="radio"
                    name="voiceMode"
                    value={m}
                    checked={settings.voiceMode === m}
                    onChange={() => patch({ voiceMode: m })}
                    style={{ accentColor: "#7c6af7" }}
                  />
                  {m === "off" && "Aus — nur Tastatur"}
                  {m === "manual" && "Manuell — Mikrofon-Taste im Chat"}
                  {m === "wakeword" && 'Immer aktiv — Aktivierungswort "ella"'}
                </label>
              ))}
              {settings.voiceMode === "wakeword" && (
                <div
                  style={{
                    fontSize: "0.78rem",
                    color: "#64748b",
                    marginTop: 2,
                  }}
                >
                  "ella" zum Aktivieren → Befehl sprechen → "ausführen" oder
                  "los"
                </div>
              )}
            </Section>
          </>
        )}

        {/* ── Tab: Setups ──────────────────────────────────────── */}
        {tab === "setups" && (
          <div style={{ display: "flex", gap: 12, flex: 1, minHeight: 0 }}>
            {/* Setup-Liste links */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                width: 180,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                {(settings.setups ?? []).length === 0 && (
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "#475569",
                      padding: "8px 4px",
                    }}
                  >
                    Noch keine Setups.
                  </div>
                )}
                {(settings.setups ?? []).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSetupId(s.id)}
                    style={{
                      textAlign: "left",
                      padding: "8px 12px",
                      borderRadius: 6,
                      background:
                        selectedSetupId === s.id ? "#2d3148" : "transparent",
                      border:
                        selectedSetupId === s.id
                          ? "1px solid #7c6af7"
                          : "1px solid #2d3148",
                      color: selectedSetupId === s.id ? "#e2e8f0" : "#94a3b8",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {s.name}
                    <span
                      style={{
                        fontSize: "0.72rem",
                        color: "#475569",
                        marginLeft: 6,
                      }}
                    >
                      ({s.open.length}↑ {s.close.length}↓)
                    </span>
                  </button>
                ))}
              </div>
              <button
                onClick={addSetup}
                style={{
                  padding: "7px 12px",
                  borderRadius: 6,
                  border: "1px dashed #2d3148",
                  background: "transparent",
                  color: "#7c6af7",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                }}
              >
                + Neues Setup
              </button>
            </div>

            {/* Setup-Editor rechts */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {(() => {
                const setup = (settings.setups ?? []).find(
                  (s) => s.id === selectedSetupId,
                );
                if (!setup) {
                  return (
                    <div
                      style={{
                        color: "#475569",
                        fontSize: "0.85rem",
                        paddingTop: 8,
                      }}
                    >
                      Setup auswählen oder neu anlegen.
                    </div>
                  );
                }
                return (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                      height: "100%",
                    }}
                  >
                    {/* Name + Löschen */}
                    <div
                      style={{ display: "flex", gap: 8, alignItems: "center" }}
                    >
                      <input
                        value={setup.name}
                        onChange={(e) => renameSetup(setup.id, e.target.value)}
                        style={{ ...input, flex: 1 }}
                      />
                      <button
                        onClick={() => deleteSetup(setup.id)}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 6,
                          background: "transparent",
                          border: "1px solid #7f1d1d",
                          color: "#f87171",
                          cursor: "pointer",
                          fontSize: "0.8rem",
                        }}
                      >
                        Löschen
                      </button>
                    </div>

                    {/* Öffnen / Schließen — zwei Spalten */}
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        flex: 1,
                        minHeight: 0,
                      }}
                    >
                      {(
                        [
                          {
                            key: "open" as const,
                            label: "Öffnen",
                            apps: (settings.apps ?? []).filter(
                              (a) => a.allowed,
                            ),
                            emptyHint: 'Erst unter "Programme" Apps erlauben.',
                            color: "#7c6af7",
                          },
                          {
                            key: "close" as const,
                            label: "Schließen",
                            apps: settings.apps ?? [],
                            emptyHint: "Keine Programme bekannt.",
                            color: "#f87171",
                          },
                        ] as const
                      ).map(({ key, label, apps, emptyHint, color }) => (
                        <div
                          key={key}
                          style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            minWidth: 0,
                          }}
                        >
                          <div
                            style={{
                              fontSize: "0.72rem",
                              color,
                              textTransform: "uppercase",
                              letterSpacing: "0.06em",
                              marginBottom: 6,
                            }}
                          >
                            {label}
                          </div>
                          <div
                            style={{
                              flex: 1,
                              overflowY: "auto",
                              background: "#1a1d27",
                              border: "1px solid #2d3148",
                              borderRadius: 8,
                            }}
                          >
                            {apps.length === 0 && (
                              <div
                                style={{
                                  padding: 12,
                                  color: "#475569",
                                  fontSize: "0.82rem",
                                }}
                              >
                                {emptyHint}
                              </div>
                            )}
                            {apps.map((a) => {
                              const checked = setup[key].includes(a.name);
                              return (
                                <label
                                  key={a.name}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    padding: "7px 12px",
                                    borderBottom: "1px solid #1e2133",
                                    cursor: "pointer",
                                    background: checked
                                      ? "#1e2440"
                                      : "transparent",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() =>
                                      toggleSetupList(setup.id, a.name, key)
                                    }
                                    style={{
                                      accentColor: color,
                                      width: 14,
                                      height: 14,
                                      flexShrink: 0,
                                    }}
                                  />
                                  <span
                                    style={{
                                      fontSize: "0.85rem",
                                      color: checked ? "#e2e8f0" : "#94a3b8",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {a.name}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ── Tab: Programme ───────────────────────────────────── */}
        {tab === "programme" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              flex: 1,
              minHeight: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Suchen…"
                style={{ ...input, flex: 1 }}
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
              style={{ fontSize: "0.78rem", color: "#64748b", flexShrink: 0 }}
            >
              {(settings.apps ?? []).length} bekannt · {allowedCount} erlaubt ·{" "}
              {(settings.apps ?? []).length - allowedCount} verboten
            </div>

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
                  {(settings.apps ?? []).length === 0
                    ? '"System scannen" klicken.'
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

        {/* ── Tab: Modus ───────────────────────────────────────── */}
        {tab === "modus" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              flex: 1,
              minHeight: 0,
            }}
          >
            {/* Status-Banner wenn aktiv */}
            {settings.homeworkMode?.active && (
              <div
                style={{
                  background: "#431407",
                  border: "1px solid #c2410c",
                  borderRadius: 8,
                  padding: "10px 16px",
                  fontSize: "0.88rem",
                  color: "#fdba74",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span>🔒</span>
                Hausaufgaben-Modus ist aktiv — nur erlaubte Programme laufen.
              </div>
            )}

            {/* PIN-Sektion */}
            <Section title="PIN">
              <div
                style={{
                  fontSize: "0.82rem",
                  color: "#64748b",
                  marginBottom: 10,
                }}
              >
                {settings.homeworkMode?.pinHash
                  ? "PIN ist gesetzt. Zum Ändern aktuellen PIN eingeben."
                  : "Noch kein PIN gesetzt."}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {settings.homeworkMode?.pinHash && (
                  <input
                    type="password"
                    value={pinCurrent}
                    onChange={(e) => setPinCurrent(e.target.value)}
                    placeholder="Aktueller PIN"
                    style={{ ...input, width: "100%", maxWidth: 280 }}
                  />
                )}
                <input
                  type="password"
                  value={pinNew}
                  onChange={(e) => setPinNew(e.target.value)}
                  placeholder="Neuer PIN (min. 4 Zeichen)"
                  style={{ ...input, width: "100%", maxWidth: 280 }}
                />
                <input
                  type="password"
                  value={pinConfirm}
                  onChange={(e) => setPinConfirm(e.target.value)}
                  placeholder="PIN bestätigen"
                  style={{ ...input, width: "100%", maxWidth: 280 }}
                />
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button
                    onClick={savePin}
                    disabled={pinSaving}
                    style={{
                      padding: "8px 18px",
                      borderRadius: 6,
                      background: pinSaving ? "#2d3148" : "#7c6af7",
                      color: "#fff",
                      border: "none",
                      cursor: pinSaving ? "not-allowed" : "pointer",
                      fontSize: "0.85rem",
                    }}
                  >
                    {pinSaving ? "Speichern…" : "PIN setzen"}
                  </button>
                  {pinMsg && (
                    <span
                      style={{
                        fontSize: "0.82rem",
                        color: pinMsg.ok ? "#4ade80" : "#f87171",
                      }}
                    >
                      {pinMsg.ok ? "✓" : "✗"} {pinMsg.text}
                    </span>
                  )}
                </div>
              </div>
            </Section>

            {/* Erlaubte Apps */}
            <Section title="Erlaubte Apps im Hausaufgaben-Modus">
              <div
                style={{
                  fontSize: "0.82rem",
                  color: "#64748b",
                  marginBottom: 10,
                }}
              >
                Nur diese Apps laufen wenn der Modus aktiviert wird. Alle
                anderen bekannten Programme werden geschlossen.
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {(settings.apps ?? []).length === 0 && (
                  <div
                    style={{
                      color: "#475569",
                      fontSize: "0.85rem",
                      padding: 8,
                    }}
                  >
                    Erst unter "Programme" Apps eintragen.
                  </div>
                )}
                {(settings.apps ?? []).map((a) => {
                  const checked = (settings.homeworkMode?.apps ?? []).includes(
                    a.name,
                  );
                  return (
                    <label
                      key={a.name}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "7px 4px",
                        borderBottom: "1px solid #1e2133",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const cur = settings.homeworkMode?.apps ?? [];
                          patch({
                            homeworkMode: {
                              ...(settings.homeworkMode ?? {
                                pinHash: "",
                                active: false,
                                apps: [],
                              }),
                              apps: checked
                                ? cur.filter((n) => n !== a.name)
                                : [...cur, a.name],
                            },
                          });
                        }}
                        style={{
                          accentColor: "#f97316",
                          width: 14,
                          height: 14,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: "0.875rem",
                          color: checked ? "#e2e8f0" : "#94a3b8",
                          flex: 1,
                        }}
                      >
                        {a.name}
                      </span>
                      {!a.allowed && (
                        <span
                          style={{ fontSize: "0.72rem", color: "#475569" }}
                          title="App ist unter 'Programme' nicht erlaubt — wird trotzdem geöffnet"
                        >
                          (nicht erlaubt)
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </Section>
          </div>
        )}

        {/* ── Tab: Regeln ──────────────────────────────────────── */}
        {tab === "regeln" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              flex: 1,
              minHeight: 0,
            }}
          >
            {/* Neue Regel */}
            <Section title="Neue Regel">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <input
                  value={newRule.name}
                  onChange={(e) =>
                    setNewRule((r) => ({ ...r, name: e.target.value }))
                  }
                  placeholder="Name der Regel"
                  style={{ ...input, width: "100%" }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <select
                    value={newRule.tool_name}
                    onChange={(e) =>
                      setNewRule((r) => ({ ...r, tool_name: e.target.value }))
                    }
                    style={{ ...input, flex: 1 }}
                  >
                    <option value="*">* (alle Tools)</option>
                    {ALL_TOOLS.map((t) => (
                      <option key={t.name} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={newRule.action}
                    onChange={(e) =>
                      setNewRule((r) => ({
                        ...r,
                        action: e.target.value as "allow" | "deny",
                      }))
                    }
                    style={{
                      ...input,
                      width: 100,
                      color: newRule.action === "allow" ? "#4ade80" : "#f87171",
                    }}
                  >
                    <option value="allow">allow</option>
                    <option value="deny">deny</option>
                  </select>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    value={newRule.trigger}
                    onChange={(e) =>
                      setNewRule((r) => ({ ...r, trigger: e.target.value }))
                    }
                    placeholder="Bedingung: always · hour > 18 · disk_C > 90"
                    style={{ ...input, flex: 1 }}
                  />
                  <button
                    onClick={addRule}
                    disabled={ruleSaving || !newRule.name.trim()}
                    style={{
                      padding: "8px 18px",
                      borderRadius: 6,
                      background:
                        ruleSaving || !newRule.name.trim()
                          ? "#2d3148"
                          : "#7c6af7",
                      color: "#fff",
                      border: "none",
                      cursor:
                        ruleSaving || !newRule.name.trim()
                          ? "not-allowed"
                          : "pointer",
                      fontSize: "0.85rem",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {ruleSaving ? "…" : "+ Hinzufügen"}
                  </button>
                </div>
              </div>
            </Section>

            {/* Regeln-Liste */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                background: "#1a1d27",
                border: "1px solid #2d3148",
                borderRadius: 8,
              }}
            >
              {rules.length === 0 && (
                <div
                  style={{
                    padding: 20,
                    color: "#64748b",
                    fontSize: "0.85rem",
                    textAlign: "center",
                  }}
                >
                  Noch keine Regeln. Ohne Erlaubnis-Regel sind alle Tools
                  gesperrt.
                </div>
              )}
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 14px",
                    borderBottom: "1px solid #1e2133",
                    opacity: rule.enabled ? 1 : 0.45,
                  }}
                >
                  {/* Toggle */}
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={() => toggleRuleEnabled(rule.id)}
                    style={{
                      accentColor: "#7c6af7",
                      width: 15,
                      height: 15,
                      flexShrink: 0,
                      cursor: "pointer",
                    }}
                  />
                  {/* Action badge */}
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      padding: "2px 7px",
                      borderRadius: 4,
                      background:
                        rule.action === "allow" ? "#14532d" : "#7f1d1d",
                      color: rule.action === "allow" ? "#4ade80" : "#f87171",
                      flexShrink: 0,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {rule.action}
                  </span>
                  {/* Name */}
                  <span
                    style={{
                      flex: 1,
                      fontSize: "0.875rem",
                      color: "#e2e8f0",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {rule.name}
                  </span>
                  {/* Tool + Trigger */}
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "#64748b",
                      fontFamily: "monospace",
                      flexShrink: 0,
                    }}
                  >
                    {rule.tool_name} · {rule.trigger}
                  </span>
                  {/* Delete */}
                  <button
                    onClick={() => deleteRule(rule.id)}
                    style={{
                      padding: "3px 8px",
                      borderRadius: 4,
                      background: "transparent",
                      border: "1px solid #7f1d1d",
                      color: "#f87171",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                      flexShrink: 0,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* Ende scrollbarer Bereich */}

      {/* Speichern — sticky am unteren Rand */}
      <div
        style={{
          flexShrink: 0,
          paddingTop: 10,
          borderTop: "1px solid #2d3148",
        }}
      >
        <button
          onClick={save}
          disabled={saving}
          style={{
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
    </div>
  );
};

export default Settings;
