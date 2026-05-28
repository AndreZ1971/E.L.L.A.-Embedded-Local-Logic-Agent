import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBootContext } from "../../App";

const API = import.meta.env.VITE_API_BASE ?? "";

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { setBoot } = useBootContext();

  useEffect(() => {
    fetch(`${API}/api/onboarding/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
      .catch(() => {})
      .finally(() => {
        setBoot((prev) => ({ ...prev!, onboardingComplete: true }));
        navigate("/chat", { replace: true });
      });
  }, [navigate, setBoot]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f1117",
        color: "#7c6af7",
        fontSize: "1.1rem",
        letterSpacing: "0.08em",
      }}
    >
      E.L.L.A. startet…
    </div>
  );
};

export default Onboarding;
