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

const API = import.meta.env.VITE_API_BASE ?? "";

export interface BootStatus {
  eulaAccepted: boolean;
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

function AppShell() {
  const location = useLocation();
  const [boot, setBoot] = useState<BootStatus | null>(null);

  useEffect(() => {
    fetch(`${API}/api/settings`)
      .then((r) => r.json())
      .then((d: Partial<BootStatus>) => {
        setBoot({
          eulaAccepted: d.eulaAccepted ?? false,
          onboardingComplete: d.onboardingComplete ?? false,
        });
      })
      .catch(() => {
        setBoot({ eulaAccepted: true, onboardingComplete: true });
      });
  }, []);

  if (boot === null) return null;

  const path = location.pathname;
  const isFullscreen =
    path === "/eula" || path === "/setup" || path === "/onboarding";

  if (!boot.eulaAccepted && !isFullscreen) {
    return <Navigate to="/eula" replace />;
  }

  if (isFullscreen) {
    return (
      <BootContext.Provider value={{ boot, setBoot }}>
        <TitleBar />
        <Routes>
          <Route path="/eula" element={<Eula />} />
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
