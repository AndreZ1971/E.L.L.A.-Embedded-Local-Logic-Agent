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

const API = import.meta.env.VITE_API_BASE ?? "";

function AppShell() {
  const location = useLocation();
  const [checked, setChecked] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/onboarding/status`)
      .then((r) => r.json())
      .then((d: { complete: boolean }) => {
        setOnboardingComplete(d.complete);
      })
      .catch(() => {
        // API nicht erreichbar — Onboarding überspringen
      })
      .finally(() => setChecked(true));
  }, []);

  if (!checked) return null;

  const isOnboarding = location.pathname === "/onboarding";

  if (!onboardingComplete && !isOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  if (isOnboarding) {
    return (
      <>
        <TitleBar />
        <Onboarding />
      </>
    );
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
