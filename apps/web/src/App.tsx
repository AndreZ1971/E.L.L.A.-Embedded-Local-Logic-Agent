import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  NavLink,
} from "react-router-dom";
import TitleBar from "./components/TitleBar";
import Dashboard from "./pages/dashboard/Dashboard";
import Chat from "./pages/chat/Chat";
import Settings from "./pages/settings/Settings";

function App() {
  return (
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
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
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
