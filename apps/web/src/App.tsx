import React, {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";
import { useTranslation } from "react-i18next";
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
  NavLink,
  useLocation,
} from "react-router-dom";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            padding: 24,
            color: "#f87171",
            fontFamily: "monospace",
            fontSize: "0.85rem",
            background: "#1a1d27",
            borderRadius: 8,
            margin: 16,
          }}
        >
          <strong style={{ display: "block", marginBottom: 8 }}>
            {i18n.t("app.error_boundary_title")}
          </strong>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              color: "#fca5a5",
              marginBottom: 16,
            }}
          >
            {this.state.error.message}
            {"\n"}
            {this.state.error.stack}
          </pre>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              padding: "6px 16px",
              borderRadius: 6,
              background: "#7c6af7",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            {i18n.t("app.error_boundary_reload")}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
import TitleBar from "./components/TitleBar";
import Dashboard from "./pages/dashboard/Dashboard";
import Chat from "./pages/chat/Chat";
import Settings from "./pages/settings/Settings";
import Onboarding from "./pages/onboarding/Onboarding";
import Eula from "./pages/eula/Eula";
import Setup from "./pages/setup/Setup";
import Activation from "./pages/activation/Activation";
import LanguageSelect from "./pages/language/LanguageSelect";
import ModelSelectOverlay from "./pages/model-select/ModelSelectOverlay";
import Pipeline from "./pages/pipeline/Pipeline";
import Chess from "./pages/chess/Chess";
import i18n from "./i18n";

const API = import.meta.env.VITE_API_BASE ?? "";

export interface BootStatus {
  eulaAccepted: boolean;
  licenseActivated: boolean;
  onboardingComplete: boolean;
  language: string;
}

interface BootCtxValue {
  boot: BootStatus | null;
  setBoot: React.Dispatch<React.SetStateAction<BootStatus | null>>;
}

export const BootContext = createContext<BootCtxValue>({
  boot: null,
  setBoot: () => {},
});

export function useBootContext() {
  return useContext(BootContext);
}

function OllamaBanner() {
  const { t } = useTranslation();
  const [offline, setOffline] = useState(false);
  const [checking, setChecking] = useState(false);

  const check = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/health`);
      const d = (await r.json()) as { ollama: boolean; provider: string };
      setOffline(d.provider !== "openai" && !d.ollama);
    } catch {
      // API itself offline — don't spam banner
    }
  }, []);

  useEffect(() => {
    check();
    const id = setInterval(check, 30_000);
    return () => clearInterval(id);
  }, [check]);

  if (!offline) return null;
  return (
    <div
      style={{
        background: "#78350f",
        color: "#fef3c7",
        fontSize: "0.78rem",
        padding: "6px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        borderBottom: "1px solid #92400e",
      }}
    >
      <span>{t("app.ollama_offline")}</span>
      <button
        disabled={checking}
        onClick={async () => {
          setChecking(true);
          await check();
          setChecking(false);
        }}
        style={{
          background: "transparent",
          border: "1px solid #fef3c7",
          borderRadius: 4,
          color: "#fef3c7",
          cursor: "pointer",
          fontSize: "0.75rem",
          padding: "2px 10px",
        }}
      >
        {checking ? t("app.ollama_checking") : t("app.ollama_retry")}
      </button>
    </div>
  );
}

function EllaSplash({ setupMsg }: { setupMsg: string }) {
  const { t } = useTranslation();
  const quips = t("splash.quips", { returnObjects: true }) as string[];
  const [quipIdx, setQuipIdx] = useState(() =>
    Math.floor(Math.random() * quips.length),
  );
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setQuipIdx((i) => (i + 1) % quips.length);
        setFade(true);
      }, 400);
    }, 3200);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#0f1117",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
        zIndex: 9999,
      }}
    >
      <div
        style={{
          fontSize: "2.2rem",
          fontWeight: 800,
          letterSpacing: "0.12em",
          color: "#7c6af7",
          fontFamily: "monospace",
        }}
      >
        E.L.L.A.
      </div>
      <div
        style={{
          width: 220,
          height: 3,
          background: "#1e2130",
          borderRadius: 99,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            background: "linear-gradient(90deg,#7c6af7,#a78bfa)",
            borderRadius: 99,
            animation: "ella-bar 1.6s ease-in-out infinite",
          }}
        />
      </div>
      {setupMsg ? (
        <div
          style={{
            maxWidth: 380,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {setupMsg.split("\n").map((line, i) => (
            <p
              key={i}
              style={{
                color: i === 0 ? "#a78bfa" : "#94a3b8",
                fontSize: i === 0 ? "0.95rem" : "0.82rem",
                fontWeight: i === 0 ? 600 : 400,
                margin: 0,
                fontStyle: i > 0 && !line.match(/\d/) ? "italic" : "normal",
              }}
            >
              {line}
            </p>
          ))}
        </div>
      ) : (
        <p
          style={{
            color: "#94a3b8",
            fontSize: "0.88rem",
            maxWidth: 320,
            textAlign: "center",
            fontStyle: "italic",
            transition: "opacity 0.4s",
            opacity: fade ? 1 : 0,
            minHeight: "2.5em",
          }}
        >
          „{quips[quipIdx]}"
        </p>
      )}
      <style>{`
        @keyframes ella-bar {
          0%   { width: 0%; margin-left: 0 }
          50%  { width: 80%; margin-left: 10% }
          100% { width: 0%; margin-left: 100% }
        }
      `}</style>
    </div>
  );
}

function AppShell() {
  const { t } = useTranslation();
  const location = useLocation();
  const [boot, setBoot] = useState<BootStatus | null>(null);
  const [ollamaReady, setOllamaReady] = useState(false);
  const [setupMsg, setSetupMsg] = useState("");
  const [modelPulling, setModelPulling] = useState(false);
  const [showModelSelect, setShowModelSelect] = useState(false);

  // IPC: model-pull-state — keeps splash visible during first-time download
  useEffect(() => {
    const api = (
      window as {
        electronAPI?: {
          onModelPullState?: (cb: (active: boolean) => void) => () => void;
        };
      }
    ).electronAPI;
    if (!api?.onModelPullState) return;
    return api.onModelPullState((active) => setModelPulling(active));
  }, []);

  // IPC: main process requests model selection before first download
  useEffect(() => {
    const api = (
      window as {
        electronAPI?: {
          onChooseModel?: (cb: () => void) => () => void;
        };
      }
    ).electronAPI;
    if (!api?.onChooseModel) return;
    return api.onChooseModel(() => setShowModelSelect(true));
  }, []);

  // IPC: setup-status from Electron main process
  useEffect(() => {
    const api = (
      window as {
        electronAPI?: {
          onSetupStatus?: (cb: (m: string) => void) => () => void;
        };
      }
    ).electronAPI;
    if (!api?.onSetupStatus) return;
    return api.onSetupStatus((msg) => setSetupMsg(msg));
  }, []);

  useEffect(() => {
    const loadSettings = (d: Partial<BootStatus>) => {
      const lang = (d.language as string) || "";
      if (lang) void i18n.changeLanguage(lang);
      setBoot({
        eulaAccepted: d.eulaAccepted ?? false,
        licenseActivated: d.licenseActivated ?? false,
        onboardingComplete: d.onboardingComplete ?? false,
        language: lang,
      });
    };
    const fetchSettings = (retry: boolean) =>
      fetch(`${API}/api/settings`)
        .then((r) => {
          if (!r.ok) throw new Error(String(r.status));
          return r.json();
        })
        .then((d: Partial<BootStatus>) => loadSettings(d))
        .catch(() => {
          if (retry) {
            setTimeout(() => fetchSettings(false), 3000);
          } else {
            // API nicht erreichbar — leeres Boot zeigt Sprachauswahl
            setBoot({
              eulaAccepted: false,
              licenseActivated: false,
              onboardingComplete: false,
              language: "",
            });
          }
        });
    fetchSettings(true);
  }, []);

  // Warte bis API antwortet — Ollama-Status wird danach per Banner gezeigt
  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const MAX_WAIT_MS = 120_000; // 2 Minuten Timeout als Failsafe
    const startTime = Date.now();

    const check = async () => {
      try {
        const r = await fetch(`${API}/api/health`);
        const d = (await r.json()) as {
          ollama: boolean;
          provider: string;
          model_ready: boolean;
          model_pull?: { pct: number; status: string } | null;
        };
        if (!cancelled) {
          // API ist oben — Splash weg, OllamaBanner übernimmt Ollama-Status
          if (d.model_pull?.status) setSetupMsg(d.model_pull.status);
          setOllamaReady(true);
        }
      } catch {
        if (!cancelled) {
          attempts++;
          if (Date.now() - startTime > MAX_WAIT_MS) {
            // Failsafe: nach 2 Min trotzdem App zeigen
            setOllamaReady(true);
          } else {
            const delay = Math.min(500 * attempts, 3000);
            setTimeout(check, delay);
          }
        }
      }
    };
    check();
    return () => {
      cancelled = true;
    };
  }, []);

  if (showModelSelect) {
    return (
      <ModelSelectOverlay
        onChosen={(model) => {
          const api = (
            window as {
              electronAPI?: { modelChosen?: (m: string) => void };
            }
          ).electronAPI;
          api?.modelChosen?.(model);
          setShowModelSelect(false);
        }}
      />
    );
  }

  // chess_open SSE-Event → Electron-Fenster öffnen
  useEffect(() => {
    const es = new EventSource(`${API}/api/events/stream`);
    es.onmessage = (ev) => {
      try {
        const d = JSON.parse(ev.data) as { type: string };
        if (d.type === "chess_open") {
          (
            window as { electronAPI?: { openChess?: () => void } }
          ).electronAPI?.openChess?.();
        }
      } catch {
        /* ignorieren */
      }
    };
    return () => es.close();
  }, []);

  if (boot === null || !ollamaReady) return <EllaSplash setupMsg={setupMsg} />;

  const path = location.pathname;

  // Chess-Fenster: direkt rendern ohne Boot-Checks
  if (path === "/chess") return <Chess />;

  const isFullscreen =
    path === "/language" ||
    path === "/eula" ||
    path === "/activation" ||
    path === "/setup" ||
    path === "/onboarding";

  const onboardingPath =
    path === "/language" ||
    path === "/eula" ||
    path === "/activation" ||
    path === "/setup" ||
    path === "/onboarding";

  if (!boot.language && !onboardingPath) {
    return <Navigate to="/language" replace />;
  }

  if (boot.language && !boot.eulaAccepted && !onboardingPath) {
    return <Navigate to="/eula" replace />;
  }

  if (
    boot.language &&
    boot.eulaAccepted &&
    !boot.licenseActivated &&
    !onboardingPath
  ) {
    return <Navigate to="/activation" replace />;
  }

  const modelPullBanner =
    modelPulling && setupMsg ? (
      <div
        style={{
          background: "linear-gradient(90deg,#1e1b4b,#2d1f6e)",
          borderBottom: "1px solid #4c3d9e",
          padding: "8px 20px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          fontSize: "0.8rem",
          color: "#c4b5fd",
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: "1rem" }}>⬇</span>
        <span style={{ fontWeight: 600, color: "#a78bfa" }}>
          {t("model_pull.banner_title")}
        </span>
        <span style={{ color: "#94a3b8", flex: 1 }}>
          {setupMsg.split("\n").find((l) => l.match(/\d+%/)) ??
            t("model_pull.banner_hint")}
        </span>
        <span
          style={{
            width: 100,
            height: 4,
            background: "#1e1b4b",
            borderRadius: 99,
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              display: "block",
              height: "100%",
              background: "linear-gradient(90deg,#7c6af7,#a78bfa)",
              borderRadius: 99,
              animation: "ella-bar 1.6s ease-in-out infinite",
            }}
          />
        </span>
      </div>
    ) : null;

  if (isFullscreen) {
    return (
      <BootContext.Provider value={{ boot, setBoot }}>
        <TitleBar />
        {modelPullBanner}
        <Routes>
          <Route path="/language" element={<LanguageSelect />} />
          <Route path="/eula" element={<Eula />} />
          <Route path="/activation" element={<Activation />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="*" element={<Navigate to="/language" replace />} />
        </Routes>
      </BootContext.Provider>
    );
  }

  if (!boot.onboardingComplete && path !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <BootContext.Provider value={{ boot, setBoot }}>
      <div className="ella-root">
        <TitleBar />
        {modelPullBanner}
        <OllamaBanner />
        <div className="ella-layout">
          <nav className="ella-sidebar">
            <h1 className="ella-logo">E.L.L.A.</h1>
            <NavLink to="/dashboard">{t("nav.dashboard")}</NavLink>
            <NavLink to="/chat">{t("nav.chat")}</NavLink>
            <NavLink to="/pipeline">{t("nav.pipeline")}</NavLink>
            <NavLink to="/settings">{t("nav.settings")}</NavLink>
          </nav>
          <main className="ella-main">
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Navigate to="/chat" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/pipeline" element={<Pipeline />} />
                <Route path="/settings" element={<Settings />} />
                <Route
                  path="/onboarding"
                  element={<Navigate to="/chat" replace />}
                />
              </Routes>
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </BootContext.Provider>
  );
}

function App() {
  return (
    <HashRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="*" element={<AppShell />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
