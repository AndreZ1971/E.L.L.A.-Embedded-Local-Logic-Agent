import React, { useState, useEffect, createContext, useContext } from "react";
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
  NavLink,
  useLocation,
} from "react-router-dom";
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
        <div className="ella-layout">
          <nav className="ella-sidebar">
            <h1 className="ella-logo">E.L.L.A.</h1>
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/chat">Chat</NavLink>
            <NavLink to="/settings">Settings</NavLink>
          </nav>
          <main className="ella-main">
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
