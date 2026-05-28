import React, { useState, useEffect } from "react";
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

interface BootStatus {
  eulaAccepted: boolean;
  onboardingComplete: boolean;
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
        // API nicht erreichbar — App normal starten
        setBoot({ eulaAccepted: true, onboardingComplete: true });
      });
  }, []);

  if (boot === null) return null;

  const path = location.pathname;
  const isFullscreen =
    path === "/eula" || path === "/setup" || path === "/onboarding";

  // EULA hard gate
  if (!boot.eulaAccepted && path !== "/eula") {
    return <Navigate to="/eula" replace />;
  }

  // After EULA: setup + onboarding flow handled by the pages themselves
  if (isFullscreen) {
    return (
      <>
        <TitleBar />
        <Routes>
          <Route path="/eula" element={<Eula />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="*" element={<Navigate to="/eula" replace />} />
        </Routes>
      </>
    );
  }

  // Onboarding gate (after EULA accepted)
  if (!boot.onboardingComplete && path !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return (
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
