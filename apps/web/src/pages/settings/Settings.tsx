import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

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

interface Profile {
  id: number;
  name: string;
  color: string;
  hasPin: boolean;
  isActive: boolean;
  createdAt: string;
}

type ModelTier = "small" | "standard" | "large";

const TIER_BASE: {
  key: ModelTier;
  model: string;
  size: string;
  vram: string;
}[] = [
  { key: "small", model: "llama3.2:3b", size: "~2 GB", vram: "4 GB+" },
  { key: "standard", model: "llama3.1:8b", size: "~5 GB", vram: "6 GB+" },
  { key: "large", model: "qwen2.5:14b", size: "~8.5 GB", vram: "12 GB+" },
];

interface Settings {
  provider: "auto" | "openai" | "ollama";
  ollamaModel: string;
  voiceOllamaModel: string;
  modelTier: ModelTier;
  enabledTools: string[];
  sessionLimit: number;
  openaiApiKey: string;
  apps: AppEntry[];
  voiceMode: "off" | "manual" | "wakeword" | "always";
  setups: Setup[];
  homeworkMode: HomeworkModeConfig;
  ttsEnabled: boolean;
  ttsVoice: string;
  onboardingComplete: boolean;
  emergencyResetAt: string | null;
  googleClientId: string;
  googleClientSecret: string;
  googleConnected: boolean;
  googleUserEmail: string;
  musicLibraryPath: string;
  musicSearchPaths: string[];
  defaultMediaPlayer: string;
  windowContextEnabled: boolean;
  ttsEngine: "system" | "kokoro";
  sessionCompressionEnabled: boolean;
  clipboardPatternEnabled: boolean;
  accessibilityMode: "none" | "blind" | "deaf";
  searchDrives: string[];
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
  {
    name: "shutdown_system",
    label: "PC herunterfahren / Neu starten / Schlafmodus",
  },
  { name: "format_drive", label: "Laufwerk formatieren (Wechseldatenträger)" },
  { name: "rename_drive", label: "Laufwerk umbenennen" },
  { name: "list_programs", label: "Programme auflisten (ohne System32)" },
  { name: "pause_ella", label: "ELLA pausieren" },
  { name: "play_music", label: "Musik spielen" },
  { name: "search_files", label: "Dateien suchen" },
  { name: "open_file", label: "Datei öffnen" },
  { name: "explore_folder", label: "Ordner im Explorer öffnen" },
  { name: "list_folder", label: "Ordner-/Laufwerksinhalt auflisten" },
  { name: "create_document", label: "Dokument erstellen (Word/TXT)" },
  { name: "dictate_to_document", label: "Text diktieren (KI-Korrektur)" },
  { name: "compose_email", label: "E-Mail-Entwurf in Outlook" },
  { name: "list_processes", label: "Prozesse auflisten" },
  { name: "kill_process", label: "Prozess beenden" },
  { name: "set_volume", label: "Lautstärke setzen" },
  { name: "get_clipboard", label: "Zwischenablage lesen" },
  { name: "set_clipboard", label: "Zwischenablage setzen" },
  { name: "set_reminder", label: "Erinnerung setzen (Task Scheduler)" },
  { name: "list_reminders", label: "Erinnerungen auflisten" },
  { name: "delete_reminder", label: "Erinnerung löschen" },
  { name: "set_alarm", label: "Wecker stellen" },
  { name: "list_alarms", label: "Wecker auflisten" },
  { name: "delete_alarm", label: "Wecker löschen" },
  { name: "take_screenshot", label: "Screenshot + GPT-4o Analyse" },
  { name: "write_for_me", label: "Im Nutzerstil schreiben" },
  { name: "find_duplicates", label: "Doppelte Dateien finden" },
  { name: "list_autostart", label: "Autostart-Einträge auflisten" },
  { name: "read_gmail", label: "Gmail lesen" },
  { name: "mark_gmail", label: "Gmail markieren / archivieren" },
  { name: "read_google_calendar", label: "Google Kalender lesen" },
  { name: "create_google_appointment", label: "Google Termin erstellen" },
  { name: "add_task", label: "Aufgabe hinzufügen" },
  { name: "list_tasks", label: "Aufgaben auflisten" },
  { name: "complete_task", label: "Aufgabe als erledigt markieren" },
  { name: "delete_task", label: "Aufgabe löschen" },
  { name: "rename_file", label: "Datei umbenennen" },
  { name: "copy_file", label: "Datei kopieren" },
  { name: "create_folder", label: "Ordner erstellen" },
  {
    name: "describe_screen",
    label: "Bildschirm beschreiben (Barrierefreiheit)",
  },
  { name: "describe_image", label: "Bilddatei beschreiben" },
  { name: "describe_webpage", label: "Webseite beschreiben" },
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

type Tab =
  | "llm"
  | "tools"
  | "programme"
  | "setups"
  | "modus"
  | "regeln"
  | "google";

const Settings: React.FC = () => {
  const { t, i18n } = useTranslation();

  const TIER_OPTIONS = TIER_BASE.map((b) => ({
    ...b,
    label: t(`settings.tier_${b.key}_label`),
    desc: t(`settings.tier_${b.key}_desc`),
  }));

  const toolLabel = (name: string, fallback?: string) =>
    t(`tools.${name}`, { defaultValue: fallback ?? name });

  const [tab, setTab] = useState<Tab>("llm");
  const [settings, setSettings] = useState<Settings | null>(null);
  const [searchDrivesText, setSearchDrivesText] = useState("");
  const [musicSearchPathsText, setMusicSearchPathsText] = useState("");
  const [models, setModels] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [filter, setFilter] = useState("");
  const [selectedSetupId, setSelectedSetupId] = useState<string | null>(null);
  const [voices, setVoices] = useState<
    Array<{ name: string; locale: string; gender: string }>
  >([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [newRule, setNewRule] = useState<{
    name: string;
    tool_name: string;
    trigger: string;
    action: "allow" | "deny";
  }>({ name: "", tool_name: "*", trigger: "always", action: "allow" });
  const [ruleSaving, setRuleSaving] = useState(false);

  // Profile-States
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileColor, setNewProfileColor] = useState("#7c6af7");
  const [newProfilePin, setNewProfilePin] = useState("");
  const [profileMsg, setProfileMsg] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);
  const [switchPins, setSwitchPins] = useState<Record<number, string>>({});
  const [profileLoading, setProfileLoading] = useState(false);

  const loadProfiles = async () => {
    const data = (await fetch(`${API}/api/profiles`).then((r) =>
      r.json(),
    )) as Profile[];
    setProfiles(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    fetch(`${API}/api/speech/voices`)
      .then((r) => r.json())
      .then(
        (data: {
          voices: Array<{ name: string; locale: string; gender: string }>;
        }) => {
          setVoices(data.voices ?? []);
        },
      )
      .catch(() => {});
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
      fetch(`${API}/api/profiles`)
        .then((r) => r.json())
        .catch(() => []) as Promise<Profile[]>,
    ]).then(([s, m, r, p]) => {
      if (s) {
        setSettings(s);
        setSearchDrivesText((s.searchDrives ?? ["C"]).join(", "));
        setMusicSearchPathsText((s.musicSearchPaths ?? []).join("\n"));
      }
      setModels(m.models ?? []);
      setRules(Array.isArray(r) ? r : []);
      setProfiles(Array.isArray(p) ? p : []);
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
      const data = (await fetch(`${API}/api/system/scan-programs`, {
        method: "POST",
      }).then((r) => r.json())) as { ok: boolean; total: number };
      if (data.ok) {
        // Neue App-Liste vom Server laden
        const fresh = (await fetch(`${API}/api/settings`).then((r) =>
          r.json(),
        )) as { apps: AppEntry[] };
        patch({ apps: fresh.apps ?? [] });
      }
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
  const [pullProgress, setPullProgress] = useState<{
    pct: number;
    status: string;
  } | null>(null);
  const [pulling, setPulling] = useState(false);

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

  const selectTier = (tier: ModelTier) => {
    const opt = TIER_OPTIONS.find((opt) => opt.key === tier)!;
    patch({
      modelTier: tier,
      ollamaModel: opt.model,
      voiceOllamaModel: opt.model,
    });
  };

  const startModelDownload = async () => {
    if (pulling) return;
    await fetch(`${API}/api/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setPulling(true);
    setPullProgress({ pct: 0, status: "Starte Download…" });
    await fetch(`${API}/api/settings/pull-model`, { method: "POST" });

    const poll = setInterval(async () => {
      try {
        const r = await fetch(`${API}/api/health`);
        const d = (await r.json()) as {
          model_pull?: { pct: number; status: string } | null;
          model_ready?: boolean;
        };
        if (d.model_pull) {
          setPullProgress(d.model_pull);
        } else {
          clearInterval(poll);
          setPulling(false);
          setPullProgress(null);
          const fresh = (await fetch(`${API}/api/settings/models`).then((r) =>
            r.json(),
          )) as { models: string[] };
          setModels(fresh.models ?? []);
        }
      } catch {
        clearInterval(poll);
        setPulling(false);
        setPullProgress(null);
      }
    }, 2000);
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
        {t("settings.loading")}
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
    llm: t("settings.tab_llm"),
    tools: t("settings.tab_tools"),
    setups: `${t("settings.tab_setups")} (${(settings.setups ?? []).length})`,
    programme: `${t("settings.tab_programmes")} (${allowedCount})`,
    modus: settings.homeworkMode?.active
      ? `🔒 ${t("settings.tab_mode")}`
      : t("settings.tab_mode"),
    regeln: `${t("settings.tab_rules")} (${rules.length})`,
    google: settings.googleConnected
      ? `${t("settings.tab_google")} ✓`
      : t("settings.tab_google"),
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
        <h2 style={{ margin: 0 }}>{t("settings.title")}</h2>
        <button
          onClick={emergencyReset}
          disabled={resetting}
          title={t("settings.emergency_reset_title")}
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
          {resetting
            ? "…"
            : resetDone
              ? t("settings.emergency_reset_done")
              : t("settings.emergency_reset")}
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
          {t("settings.emergency_reset_banner", {
            date: new Date(settings.emergencyResetAt).toLocaleString(
              i18n.language || "de-DE",
            ),
          })}
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
          [
            "llm",
            "tools",
            "setups",
            "programme",
            "modus",
            "regeln",
            "google",
          ] as Tab[]
        ).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 14px",
              background: "transparent",
              border: "none",
              borderBottom:
                tab === t ? "2px solid #7c6af7" : "2px solid transparent",
              color: tab === t ? "#e2e8f0" : "#64748b",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: tab === t ? 600 : 400,
              marginBottom: -1,
              whiteSpace: "nowrap",
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
            <Section title={t("settings.tier_section_title")}>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#64748b",
                  marginBottom: 12,
                }}
              >
                {t("settings.tier_section_desc")}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {TIER_OPTIONS.map((tier) => {
                  const active =
                    (settings.modelTier ?? "standard") === tier.key;
                  const installed = models.some((m) =>
                    m.includes(tier.model.split(":")[0]),
                  );
                  return (
                    <div
                      key={tier.key}
                      onClick={() => selectTier(tier.key)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 14px",
                        borderRadius: 8,
                        border: `1px solid ${active ? "#7c6af7" : "#2d3148"}`,
                        background: active ? "#1a1440" : "#0f1117",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        readOnly
                        checked={active}
                        style={{ accentColor: "#7c6af7", flexShrink: 0 }}
                      />
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 2,
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 600,
                              color: active ? "#a78bfa" : "#e2e8f0",
                              fontSize: "0.9rem",
                            }}
                          >
                            {tier.label}
                          </span>
                          <code
                            style={{
                              fontSize: "0.78rem",
                              color: "#94a3b8",
                              background: "#1e2130",
                              padding: "1px 6px",
                              borderRadius: 4,
                            }}
                          >
                            {tier.model}
                          </code>
                          <span
                            style={{ fontSize: "0.75rem", color: "#64748b" }}
                          >
                            {tier.size}
                          </span>
                          {installed && (
                            <span
                              style={{ fontSize: "0.72rem", color: "#4ade80" }}
                            >
                              {t("settings.tier_installed")}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                          {tier.desc} &nbsp;·&nbsp; min. {tier.vram} VRAM
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Download-Button wenn aktives Modell noch nicht installiert */}
              {(() => {
                const tier =
                  TIER_OPTIONS.find(
                    (opt) => opt.key === (settings.modelTier ?? "standard"),
                  ) ?? TIER_OPTIONS[1];
                const installed = models.some((m) =>
                  m.includes(tier.model.split(":")[0]),
                );
                if (installed && !pulling) return null;
                return (
                  <div style={{ marginTop: 12 }}>
                    {pulling && pullProgress ? (
                      <div
                        style={{
                          background: "#0f1117",
                          border: "1px solid #2d3148",
                          borderRadius: 8,
                          padding: "10px 14px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.82rem",
                            color: "#a78bfa",
                            marginBottom: 6,
                          }}
                        >
                          {pullProgress.status}
                        </div>
                        <div
                          style={{
                            height: 4,
                            background: "#1e2130",
                            borderRadius: 99,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${pullProgress.pct}%`,
                              background:
                                "linear-gradient(90deg,#7c6af7,#a78bfa)",
                              borderRadius: 99,
                              transition: "width 0.4s ease",
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={startModelDownload}
                        style={{
                          padding: "8px 18px",
                          borderRadius: 6,
                          background: "#7c3aed",
                          color: "#fff",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                        }}
                      >
                        ⬇ {tier.model} {t("settings.tier_download")}
                      </button>
                    )}
                  </div>
                );
              })()}
            </Section>

            <Section title={t("settings.section_provider")}>
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
                  {p === "auto" && t("settings.provider_auto")}
                  {p === "openai" && t("settings.provider_openai")}
                  {p === "ollama" && t("settings.provider_ollama")}
                </label>
              ))}
            </Section>

            <Section title={t("settings.section_ollama_chat")}>
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

            <Section title={t("settings.section_ollama_voice")}>
              <p
                style={{
                  fontSize: "0.78rem",
                  color: "#64748b",
                  marginBottom: 8,
                }}
              >
                Schnelleres Modell für Sprachbefehle — empfohlen: llama3.2:3b
              </p>
              <select
                value={settings.voiceOllamaModel ?? "llama3.2:3b"}
                onChange={(e) => patch({ voiceOllamaModel: e.target.value })}
                style={{ ...input, width: "100%" }}
              >
                {models.length === 0 && (
                  <option value={settings.voiceOllamaModel ?? "llama3.2:3b"}>
                    {settings.voiceOllamaModel ?? "llama3.2:3b"}
                  </option>
                )}
                {models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </Section>

            <Section title={t("settings.section_openai_key")}>
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

            <Section title={t("settings.section_tts")}>
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
                  {settings.ttsEnabled
                    ? t("settings.tts_enabled")
                    : t("settings.tts_disabled")}
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
                    {t("settings.section_tts_voice")}
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
                        {v.name} ({v.locale})
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
            <Section title={t("settings.section_tools_heading")}>
              {ALL_TOOLS.map((tool) => (
                <label
                  key={tool.name}
                  style={{
                    ...rowLabel,
                    color: (settings.enabledTools ?? []).includes(tool.name)
                      ? "#e2e8f0"
                      : "#94a3b8",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={(settings.enabledTools ?? []).includes(tool.name)}
                    onChange={() => toggleTool(tool.name)}
                    style={{ accentColor: "#7c6af7", width: 15, height: 15 }}
                  />
                  {toolLabel(tool.name, tool.label)}
                  <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                    ({tool.name})
                  </span>
                </label>
              ))}
            </Section>

            <Section title={t("settings.section_session_limit")}>
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

            <Section title={t("settings.section_voice_mode")}>
              {(["off", "manual", "wakeword", "always"] as const).map((m) => (
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
                  {m === "off" && t("settings.voice_off")}
                  {m === "manual" && t("settings.voice_manual")}
                  {m === "wakeword" && t("settings.voice_wakeword")}
                  {m === "always" && t("settings.voice_always")}
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
                placeholder={t("settings.programmes_filter")}
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
                {scanning
                  ? t("settings.programmes_scanning")
                  : t("settings.programmes_scan")}
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
                </label>
              ))}
            </div>

            {/* Medienwiedergabe */}
            <div
              style={{
                marginTop: 24,
                borderTop: "1px solid #2d3148",
                paddingTop: 20,
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Medienwiedergabe
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.82rem", color: "#94a3b8" }}>
                  Suchlaufwerke (kommagetrennt)
                </label>
                <input
                  value={searchDrivesText}
                  onChange={(e) => setSearchDrivesText(e.target.value)}
                  onBlur={() =>
                    patch({
                      searchDrives: searchDrivesText
                        .split(",")
                        .map((d) =>
                          d
                            .trim()
                            .replace(/[:\\/]+$/, "")
                            .toUpperCase(),
                        )
                        .filter((d) => d.length > 0),
                    })
                  }
                  placeholder="z.B. C, E, H"
                  style={{
                    background: "#1e2538",
                    border: "1px solid #2d3148",
                    borderRadius: 6,
                    padding: "8px 12px",
                    color: "#e2e8f0",
                    fontSize: "0.85rem",
                  }}
                />
                <div style={{ fontSize: "0.72rem", color: "#475569" }}>
                  Diese Laufwerke durchsucht ELLA bei Datei- und Musiksuche
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.82rem", color: "#94a3b8" }}>
                  Musikbibliothek (primärer Pfad)
                </label>
                <input
                  value={settings.musicLibraryPath ?? ""}
                  onChange={(e) => patch({ musicLibraryPath: e.target.value })}
                  placeholder="z.B. H:\Musik"
                  style={{
                    background: "#1e2538",
                    border: "1px solid #2d3148",
                    borderRadius: 6,
                    padding: "8px 12px",
                    color: "#e2e8f0",
                    fontSize: "0.85rem",
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.82rem", color: "#94a3b8" }}>
                  Weitere Musikpfade (einer pro Zeile)
                </label>
                <textarea
                  value={musicSearchPathsText}
                  onChange={(e) => setMusicSearchPathsText(e.target.value)}
                  onBlur={() =>
                    patch({
                      musicSearchPaths: musicSearchPathsText
                        .split("\n")
                        .map((p) => p.trim())
                        .filter((p) => p.length > 0),
                    })
                  }
                  placeholder={"H:\\Musik\\Rock\nE:\\Alben"}
                  rows={3}
                  style={{
                    background: "#1e2538",
                    border: "1px solid #2d3148",
                    borderRadius: 6,
                    padding: "8px 12px",
                    color: "#e2e8f0",
                    fontSize: "0.85rem",
                    resize: "vertical",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.82rem", color: "#94a3b8" }}>
                  Standard Media Player
                </label>
                <select
                  value={settings.defaultMediaPlayer ?? "vlc"}
                  onChange={(e) =>
                    patch({ defaultMediaPlayer: e.target.value })
                  }
                  style={{
                    background: "#1e2538",
                    border: "1px solid #2d3148",
                    borderRadius: 6,
                    padding: "8px 12px",
                    color: "#e2e8f0",
                    fontSize: "0.85rem",
                  }}
                >
                  {(settings.apps ?? [])
                    .filter((a) => a.allowed)
                    .map((a) => (
                      <option key={a.name} value={a.name}>
                        {a.name}
                      </option>
                    ))}
                </select>
              </div>
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
                {t("chat.homework_banner")}
              </div>
            )}

            {/* PIN-Sektion */}
            <Section title={t("settings.section_homework_pin")}>
              <div
                style={{
                  fontSize: "0.82rem",
                  color: "#64748b",
                  marginBottom: 10,
                }}
              >
                {settings.homeworkMode?.pinHash
                  ? t("settings.pin_current")
                  : t("settings.pin_new")}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {settings.homeworkMode?.pinHash && (
                  <input
                    type="password"
                    value={pinCurrent}
                    onChange={(e) => setPinCurrent(e.target.value)}
                    placeholder={t("settings.pin_current")}
                    style={{ ...input, width: "100%", maxWidth: 280 }}
                  />
                )}
                <input
                  type="password"
                  value={pinNew}
                  onChange={(e) => setPinNew(e.target.value)}
                  placeholder={t("settings.pin_new")}
                  style={{ ...input, width: "100%", maxWidth: 280 }}
                />
                <input
                  type="password"
                  value={pinConfirm}
                  onChange={(e) => setPinConfirm(e.target.value)}
                  placeholder={t("settings.pin_confirm")}
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
                    {pinSaving ? "…" : t("settings.pin_save")}
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

            <Section title="Proaktive Intelligenz">
              {(
                [
                  {
                    key: "windowContextEnabled" as const,
                    label: "Aktives Fenster als Kontext",
                    desc: "ELLA kennt beim Chat die aktive Anwendung (nur Ollama-Modus)",
                  },
                  {
                    key: "clipboardPatternEnabled" as const,
                    label: "Zwischenablage-Muster erkennen",
                    desc: "IBAN, Paketnummern, E-Mail-Adressen automatisch erkennen",
                  },
                  {
                    key: "sessionCompressionEnabled" as const,
                    label: "Gesprächs-Kompression",
                    desc: "Lange Gespräche automatisch zusammenfassen (nur Ollama)",
                  },
                ] as const
              ).map(({ key, label, desc }) => (
                <label
                  key={key}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    marginBottom: 14,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={(settings[key] as boolean) ?? false}
                    onChange={(e) => patch({ [key]: e.target.checked })}
                    style={{ marginTop: 3, accentColor: "#7c6af7" }}
                  />
                  <div>
                    <div style={{ fontSize: "0.85rem", color: "#e2e8f0" }}>
                      {label}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      {desc}
                    </div>
                  </div>
                </label>
              ))}

              <div style={{ marginTop: 8 }}>
                <label
                  style={{
                    fontSize: "0.82rem",
                    color: "#94a3b8",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  TTS-Engine
                </label>
                <select
                  value={settings.ttsEngine ?? "system"}
                  onChange={(e) =>
                    patch({ ttsEngine: e.target.value as "system" | "kokoro" })
                  }
                  style={{
                    ...input,
                    width: "100%",
                  }}
                >
                  <option value="system">System (Windows Stimme)</option>
                  <option value="kokoro">
                    Kokoro (lokal, Python erforderlich)
                  </option>
                </select>
              </div>
            </Section>

            <Section title="Barrierefreiheit">
              <div
                style={{
                  marginBottom: 6,
                  fontSize: "0.75rem",
                  color: "#64748b",
                }}
              >
                Passt ELLAs Verhalten an die Bedürfnisse des Nutzers an.
              </div>
              {(
                [
                  {
                    value: "none" as const,
                    label: "Kein Modus",
                    desc: "Standard — kein spezielles Verhalten",
                  },
                  {
                    value: "blind" as const,
                    label: "Blind-Modus",
                    desc: "Sprachausgabe immer aktiv, TTS-optimierte Antworten (kein Markdown), Audio-Feedback bei Zustandswechseln",
                  },
                  {
                    value: "deaf" as const,
                    label: "Gehörlos-Modus",
                    desc: "Keine Sprachausgabe, keine Töne — alles läuft über den Chat-Text",
                  },
                ] as const
              ).map(({ value, label, desc }) => (
                <label
                  key={value}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    marginBottom: 14,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="accessibilityMode"
                    value={value}
                    checked={(settings.accessibilityMode ?? "none") === value}
                    onChange={() => patch({ accessibilityMode: value })}
                    style={{ marginTop: 3, accentColor: "#7c6af7" }}
                  />
                  <div>
                    <div style={{ fontSize: "0.85rem", color: "#e2e8f0" }}>
                      {label}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      {desc}
                    </div>
                  </div>
                </label>
              ))}
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
            <Section title={t("settings.rules_add")}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <input
                  value={newRule.name}
                  onChange={(e) =>
                    setNewRule((r) => ({ ...r, name: e.target.value }))
                  }
                  placeholder={t("settings.rules_new_name")}
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
                    {ALL_TOOLS.map((tool) => (
                      <option key={tool.name} value={tool.name}>
                        {tool.name}
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
                    {ruleSaving ? "…" : t("settings.rules_add")}
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
        {/* ── Tab: Google ──────────────────────────────────────── */}
        {tab === "google" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
              OAuth 2.0 — Credentials aus der Google Cloud Console (Desktop
              App).
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                Client ID
              </label>
              <input
                type="password"
                value={settings.googleClientId ?? ""}
                onChange={(e) => patch({ googleClientId: e.target.value })}
                placeholder="xxx.apps.googleusercontent.com"
                style={{
                  background: "#1e2538",
                  border: "1px solid #2d3148",
                  borderRadius: 6,
                  padding: "8px 12px",
                  color: "#e2e8f0",
                  fontSize: "0.85rem",
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                Client Secret
              </label>
              <input
                type="password"
                value={settings.googleClientSecret ?? ""}
                onChange={(e) => patch({ googleClientSecret: e.target.value })}
                placeholder="GOCSPX-…"
                style={{
                  background: "#1e2538",
                  border: "1px solid #2d3148",
                  borderRadius: 6,
                  padding: "8px 12px",
                  color: "#e2e8f0",
                  fontSize: "0.85rem",
                }}
              />
            </div>

            {settings.googleConnected ? (
              <div
                style={{
                  background: "#0f2a1a",
                  border: "1px solid #22c55e",
                  borderRadius: 8,
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <span style={{ color: "#22c55e", fontSize: "0.85rem" }}>
                  ✓ Verbunden als {settings.googleUserEmail}
                </span>
                <button
                  onClick={async () => {
                    await fetch(`${API}/api/google/disconnect`, {
                      method: "POST",
                    });
                    patch({ googleConnected: false, googleUserEmail: "" });
                  }}
                  style={{
                    background: "transparent",
                    border: "1px solid #ef4444",
                    borderRadius: 4,
                    color: "#ef4444",
                    padding: "4px 12px",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                  }}
                >
                  Trennen
                </button>
              </div>
            ) : (
              <button
                disabled={
                  !settings.googleClientId || !settings.googleClientSecret
                }
                onClick={async () => {
                  await save();
                  const res = await fetch(`${API}/api/google/auth-url`);
                  if (!res.ok) return;
                  const { url } = (await res.json()) as { url: string };
                  window.open(url, "_blank", "width=600,height=700");
                }}
                style={{
                  background:
                    settings.googleClientId && settings.googleClientSecret
                      ? "#7c6af7"
                      : "#2d3148",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "10px 20px",
                  cursor:
                    settings.googleClientId && settings.googleClientSecret
                      ? "pointer"
                      : "not-allowed",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  opacity:
                    settings.googleClientId && settings.googleClientSecret
                      ? 1
                      : 0.5,
                }}
              >
                Mit Google verbinden
              </button>
            )}
          </div>
        )}
        {/* ── Profile — direkt unter Google (selber Tab) ───────── */}
        {tab === "google" && (
          <React.Fragment>
            <Section title="Profile verwalten">
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {profiles.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 14px",
                      borderRadius: 8,
                      background: p.isActive ? "#1e1b3a" : "#12141e",
                      border: p.isActive
                        ? "1px solid #7c6af7"
                        : "1px solid #2d3148",
                    }}
                  >
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        background: p.color,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        flex: 1,
                        fontSize: "0.9rem",
                        color: "#e2e8f0",
                        fontWeight: p.isActive ? 600 : 400,
                      }}
                    >
                      {p.name}
                      {p.isActive && (
                        <span
                          style={{
                            marginLeft: 8,
                            fontSize: "0.75rem",
                            color: "#7c6af7",
                          }}
                        >
                          aktiv
                        </span>
                      )}
                      {p.hasPin && (
                        <span
                          style={{
                            marginLeft: 6,
                            fontSize: "0.75rem",
                            color: "#64748b",
                          }}
                        >
                          🔒
                        </span>
                      )}
                    </span>
                    {!p.isActive && (
                      <div style={{ display: "flex", gap: 6 }}>
                        {p.hasPin && (
                          <input
                            type="password"
                            placeholder="PIN"
                            maxLength={8}
                            value={switchPins[p.id] ?? ""}
                            onChange={(e) =>
                              setSwitchPins((prev) => ({
                                ...prev,
                                [p.id]: e.target.value,
                              }))
                            }
                            style={{ ...input, width: 70, padding: "4px 8px" }}
                          />
                        )}
                        <button
                          disabled={profileLoading}
                          onClick={async () => {
                            setProfileLoading(true);
                            setProfileMsg(null);
                            try {
                              const res = await fetch(
                                `${API}/api/profiles/${p.id}/activate`,
                                {
                                  method: "PUT",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    pin: switchPins[p.id] ?? "",
                                  }),
                                },
                              );
                              if (res.ok) {
                                await loadProfiles();
                                setSwitchPins({});
                                setProfileMsg({
                                  ok: true,
                                  text: `Profil "${p.name}" aktiviert.`,
                                });
                              } else {
                                const err = (await res.json()) as {
                                  error?: string;
                                };
                                setProfileMsg({
                                  ok: false,
                                  text: err.error ?? "Fehler",
                                });
                              }
                            } finally {
                              setProfileLoading(false);
                            }
                          }}
                          style={{
                            padding: "4px 12px",
                            borderRadius: 6,
                            background: "#7c6af7",
                            color: "#fff",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "0.82rem",
                          }}
                        >
                          Aktivieren
                        </button>
                        {p.id !== 1 && (
                          <button
                            disabled={profileLoading}
                            onClick={async () => {
                              if (
                                !window.confirm(
                                  `Profil "${p.name}" wirklich löschen?`,
                                )
                              )
                                return;
                              setProfileLoading(true);
                              setProfileMsg(null);
                              try {
                                const res = await fetch(
                                  `${API}/api/profiles/${p.id}`,
                                  { method: "DELETE" },
                                );
                                if (res.ok) {
                                  await loadProfiles();
                                  setProfileMsg({
                                    ok: true,
                                    text: "Profil gelöscht.",
                                  });
                                } else {
                                  const err = (await res.json()) as {
                                    error?: string;
                                  };
                                  setProfileMsg({
                                    ok: false,
                                    text: err.error ?? "Fehler",
                                  });
                                }
                              } finally {
                                setProfileLoading(false);
                              }
                            }}
                            style={{
                              padding: "4px 10px",
                              borderRadius: 6,
                              background: "transparent",
                              color: "#f87171",
                              border: "1px solid #7f1d1d",
                              cursor: "pointer",
                              fontSize: "0.82rem",
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {profiles.length === 0 && (
                  <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                    Keine Profile gefunden.
                  </div>
                )}
              </div>
            </Section>

            <Section title="Neues Profil erstellen">
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="text"
                    placeholder="Name"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    style={{ ...input, flex: 1 }}
                  />
                  <input
                    type="color"
                    value={newProfileColor}
                    onChange={(e) => setNewProfileColor(e.target.value)}
                    title="Profilfarbe"
                    style={{
                      width: 40,
                      height: 36,
                      border: "1px solid #2d3148",
                      borderRadius: 6,
                      background: "transparent",
                      cursor: "pointer",
                      padding: 2,
                    }}
                  />
                </div>
                <input
                  type="password"
                  placeholder="PIN (optional, 4–8 Ziffern)"
                  maxLength={8}
                  value={newProfilePin}
                  onChange={(e) => setNewProfilePin(e.target.value)}
                  style={input}
                />
                <button
                  disabled={profileLoading || !newProfileName.trim()}
                  onClick={async () => {
                    setProfileLoading(true);
                    setProfileMsg(null);
                    try {
                      const res = await fetch(`${API}/api/profiles`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          name: newProfileName.trim(),
                          color: newProfileColor,
                          pin: newProfilePin || undefined,
                        }),
                      });
                      if (res.ok) {
                        await loadProfiles();
                        setNewProfileName("");
                        setNewProfilePin("");
                        setNewProfileColor("#7c6af7");
                        setProfileMsg({
                          ok: true,
                          text: "Profil erstellt.",
                        });
                      } else {
                        const err = (await res.json()) as { error?: string };
                        setProfileMsg({
                          ok: false,
                          text: err.error ?? "Fehler beim Erstellen",
                        });
                      }
                    } finally {
                      setProfileLoading(false);
                    }
                  }}
                  style={{
                    padding: "9px 20px",
                    borderRadius: 6,
                    background:
                      !newProfileName.trim() || profileLoading
                        ? "#2d3148"
                        : "#7c6af7",
                    color: "#fff",
                    border: "none",
                    cursor:
                      !newProfileName.trim() || profileLoading
                        ? "not-allowed"
                        : "pointer",
                    fontSize: "0.88rem",
                    fontWeight: 600,
                    opacity: !newProfileName.trim() ? 0.5 : 1,
                  }}
                >
                  {profileLoading ? "…" : "Profil erstellen"}
                </button>
                {profileMsg && (
                  <div
                    style={{
                      fontSize: "0.82rem",
                      color: profileMsg.ok ? "#4ade80" : "#f87171",
                    }}
                  >
                    {profileMsg.text}
                  </div>
                )}
              </div>
            </Section>
          </React.Fragment>
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
          {saving ? "…" : saved ? t("settings.saved") : t("settings.save")}
        </button>
      </div>
    </div>
  );
};

export default Settings;
