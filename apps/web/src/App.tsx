import React, {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";
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
            UI-Fehler — bitte melden:
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
            Neu laden
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

const API = import.meta.env.VITE_API_BASE ?? "";

export interface BootStatus {
  eulaAccepted: boolean;
  licenseActivated: boolean;
  onboardingComplete: boolean;
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
      <span>Ollama ist offline — KI-Funktionen nicht verfügbar.</span>
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
        {checking ? "Prüfe..." : "Erneut prüfen"}
      </button>
    </div>
  );
}

const ELLA_QUIPS = [
  "Endlich bekommt Windows ein Gehirn.",
  "Ich lade mein Gewissen… dauert kurz.",
  "KI-Synapsen werden verknüpft. Bitte Geduld.",
  "Ich bin gleich wach. Ich bin kein Morgenmensch.",
  "Ollama denkt nach. Das dauert bei mir länger als bei Google.",
  "Neuronale Netze aufwärmen… wie Kaffee, nur smarter.",
  "Ich lerne gerade, wie man nicht antwortet. Fast fertig.",
  "Das Modell wird geladen. In der Zwischenzeit: Atme kurz durch.",
  "Intelligenz braucht Zeit. Künstliche erst recht.",
  "Lade Persönlichkeit… 73% snark, 27% Hilfsbereitschaft.",
  "Windows hätte hier schon dreimal neu gestartet.",
  "Ich warte auf mein Gewissen. Es kommt gleich.",
  "Starte KI. Bitte keine übereilten Fragen stellen.",
  "Gleich bin ich schlagfertig. Versprochen.",
];

function EllaSplash({ setupMsg }: { setupMsg: string }) {
  const [quipIdx, setQuipIdx] = useState(() =>
    Math.floor(Math.random() * ELLA_QUIPS.length),
  );
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setQuipIdx((i) => (i + 1) % ELLA_QUIPS.length);
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
        <p
          style={{
            color: "#7c6af7",
            fontSize: "0.88rem",
            maxWidth: 320,
            textAlign: "center",
            minHeight: "2.5em",
          }}
        >
          {setupMsg}
        </p>
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
          „{ELLA_QUIPS[quipIdx]}"
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
  const location = useLocation();
  const [boot, setBoot] = useState<BootStatus | null>(null);
  const [ollamaReady, setOllamaReady] = useState(false);
  const [setupMsg, setSetupMsg] = useState("");

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
    fetch(`${API}/api/settings`)
      .then((r) => r.json())
      .then((d: Partial<BootStatus>) => {
        setBoot({
          eulaAccepted: d.eulaAccepted ?? false,
          licenseActivated: d.licenseActivated ?? false,
          onboardingComplete: d.onboardingComplete ?? false,
        });
      })
      .catch(() => {
        setBoot({
          eulaAccepted: true,
          licenseActivated: true,
          onboardingComplete: true,
        });
      });
  }, []);

  // Warte bis Ollama läuft UND das Modell verfügbar ist
  useEffect(() => {
    let cancelled = false;
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
          if (d.provider === "openai" || d.model_ready) {
            setOllamaReady(true);
          } else {
            if (d.model_pull?.status) setSetupMsg(d.model_pull.status);
            else if (d.ollama) setSetupMsg("KI-Modell wird vorbereitet…");
            setTimeout(check, 1500);
          }
        }
      } catch {
        if (!cancelled) setTimeout(check, 2000);
      }
    };
    check();
    return () => {
      cancelled = true;
    };
  }, []);

  if (boot === null || !ollamaReady) return <EllaSplash setupMsg={setupMsg} />;

  const path = location.pathname;
  const isFullscreen =
    path === "/eula" ||
    path === "/activation" ||
    path === "/setup" ||
    path === "/onboarding";

  if (!boot.eulaAccepted && path !== "/eula") {
    return <Navigate to="/eula" replace />;
  }

  if (boot.eulaAccepted && !boot.licenseActivated && path !== "/activation") {
    return <Navigate to="/activation" replace />;
  }

  if (isFullscreen) {
    return (
      <BootContext.Provider value={{ boot, setBoot }}>
        <TitleBar />
        <Routes>
          <Route path="/eula" element={<Eula />} />
          <Route path="/activation" element={<Activation />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="*" element={<Navigate to="/eula" replace />} />
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
        <OllamaBanner />
        <div className="ella-layout">
          <nav className="ella-sidebar">
            <h1 className="ella-logo">E.L.L.A.</h1>
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/chat">Chat</NavLink>
            <NavLink to="/settings">Settings</NavLink>
          </nav>
          <main className="ella-main">
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Navigate to="/chat" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/chat" element={<Chat />} />
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
