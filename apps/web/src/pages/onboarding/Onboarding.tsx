import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_BASE ?? "";

interface HardwareInfo {
  computerName: string;
  cpu: string;
  gpu: string;
  ramBytes: number;
  ramLabel: string;
}

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [computerName, setComputerName] = useState("");
  const [hardware, setHardware] = useState<HardwareInfo | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [userName, setUserName] = useState("");
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/onboarding/status`)
      .then((r) => r.json())
      .then((d: { complete: boolean; computerName: string }) => {
        if (d.complete) {
          navigate("/chat", { replace: true });
        } else {
          setComputerName(d.computerName);
        }
      })
      .catch(() => {});
  }, [navigate]);

  const runScan = async () => {
    setScanning(true);
    setScanError("");
    try {
      const r = await fetch(`${API}/api/onboarding/scan`, { method: "POST" });
      const d = (await r.json()) as { ok: boolean; hardware?: HardwareInfo };
      if (d.ok && d.hardware) {
        setHardware(d.hardware);
        setStep(2);
      } else {
        setScanError("Scan fehlgeschlagen — bitte erneut versuchen.");
      }
    } catch {
      setScanError("Verbindung zur API fehlgeschlagen.");
    } finally {
      setScanning(false);
    }
  };

  const complete = async () => {
    setCompleting(true);
    try {
      await fetch(`${API}/api/onboarding/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName: userName.trim() || null }),
      });
      navigate("/chat", { replace: true });
    } finally {
      setCompleting(false);
    }
  };

  const skip = async () => {
    await fetch(`${API}/api/onboarding/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }).catch(() => {});
    navigate("/chat", { replace: true });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f1117",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          display: "flex",
          flexDirection: "column",
          gap: 28,
        }}
      >
        {/* Logo + Schritt-Indikator */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "2rem",
              fontWeight: 700,
              color: "#7c6af7",
              letterSpacing: "0.12em",
              marginBottom: 8,
            }}
          >
            E.L.L.A.
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
            {([1, 2, 3] as const).map((s) => (
              <div
                key={s}
                style={{
                  width: 28,
                  height: 4,
                  borderRadius: 2,
                  background: s <= step ? "#7c6af7" : "#2d3148",
                  transition: "background 0.3s",
                }}
              />
            ))}
          </div>
        </div>

        {/* ── Schritt 1: Willkommen + Scan ── */}
        {step === 1 && (
          <div
            style={{
              background: "#1a1d27",
              border: "1px solid #2d3148",
              borderRadius: 12,
              padding: 28,
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            <div>
              <h2 style={{ margin: "0 0 8px", color: "#e2e8f0" }}>
                Hallo{computerName ? `, ich bin auf ${computerName}` : ""}!
              </h2>
              <p
                style={{
                  margin: 0,
                  color: "#94a3b8",
                  fontSize: "0.9rem",
                  lineHeight: 1.6,
                }}
              >
                Ich bin E.L.L.A. — dein lokaler Assistent. Ich lerne kurz deinen
                Rechner kennen, damit ich dir besser helfen kann.
              </p>
            </div>

            {scanError && (
              <div
                style={{
                  background: "#2d1a1a",
                  border: "1px solid #7f1d1d",
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontSize: "0.85rem",
                  color: "#fca5a5",
                }}
              >
                {scanError}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={runScan}
                disabled={scanning}
                style={{
                  padding: "12px 20px",
                  borderRadius: 8,
                  background: scanning ? "#2d3148" : "#7c6af7",
                  color: "#fff",
                  border: "none",
                  cursor: scanning ? "not-allowed" : "pointer",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                }}
              >
                {scanning ? "System wird gescannt…" : "System kennenlernen"}
              </button>
              <button
                onClick={skip}
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  background: "transparent",
                  border: "1px solid #2d3148",
                  color: "#64748b",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                }}
              >
                Überspringen
              </button>
            </div>
          </div>
        )}

        {/* ── Schritt 2: Name ── */}
        {step === 2 && (
          <div
            style={{
              background: "#1a1d27",
              border: "1px solid #2d3148",
              borderRadius: 12,
              padding: 28,
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            {hardware && (
              <div
                style={{
                  background: "#12151f",
                  borderRadius: 8,
                  padding: "12px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    fontSize: "0.72rem",
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: 4,
                  }}
                >
                  Ich habe gelernt
                </div>
                {[
                  { label: "CPU", value: hardware.cpu },
                  { label: "GPU", value: hardware.gpu },
                  { label: "RAM", value: hardware.ramLabel },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    style={{ display: "flex", gap: 12, fontSize: "0.85rem" }}
                  >
                    <span
                      style={{ color: "#475569", width: 40, flexShrink: 0 }}
                    >
                      {label}
                    </span>
                    <span style={{ color: "#e2e8f0" }}>{value}</span>
                  </div>
                ))}
              </div>
            )}

            <div>
              <h2 style={{ margin: "0 0 8px", color: "#e2e8f0" }}>
                Wie darf ich dich nennen?
              </h2>
              <p
                style={{
                  margin: "0 0 14px",
                  color: "#94a3b8",
                  fontSize: "0.9rem",
                }}
              >
                Optional — du kannst das auch später jederzeit sagen.
              </p>
              <input
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && setStep(3)}
                placeholder="Dein Name…"
                autoFocus
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #2d3148",
                  background: "#0f1117",
                  color: "#e2e8f0",
                  fontSize: "0.95rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setStep(3)}
                style={{
                  flex: 1,
                  padding: "12px 20px",
                  borderRadius: 8,
                  background: "#7c6af7",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                }}
              >
                Weiter
              </button>
              <button
                onClick={skip}
                style={{
                  padding: "12px 16px",
                  borderRadius: 8,
                  background: "transparent",
                  border: "1px solid #2d3148",
                  color: "#64748b",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                }}
              >
                Überspringen
              </button>
            </div>
          </div>
        )}

        {/* ── Schritt 3: Zusammenfassung + Abschluss ── */}
        {step === 3 && (
          <div
            style={{
              background: "#1a1d27",
              border: "1px solid #2d3148",
              borderRadius: 12,
              padding: 28,
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            <div>
              <h2 style={{ margin: "0 0 8px", color: "#e2e8f0" }}>
                Alles klar{userName.trim() ? `, ${userName.trim()}` : ""}!
              </h2>
              <p
                style={{
                  margin: 0,
                  color: "#94a3b8",
                  fontSize: "0.9rem",
                  lineHeight: 1.6,
                }}
              >
                Ich kenne jetzt deinen Rechner und bin bereit. Du kannst mir
                jederzeit Fragen stellen, Programme öffnen lassen oder
                Einstellungen per Gespräch ändern.
              </p>
            </div>

            <div
              style={{
                background: "#12151f",
                borderRadius: 8,
                padding: "12px 16px",
                fontSize: "0.85rem",
                color: "#64748b",
                lineHeight: 1.7,
              }}
            >
              Tipp: Sag{" "}
              <span style={{ color: "#7c6af7" }}>
                "Was weißt du über diesen Rechner?"
              </span>{" "}
              um zu sehen was ich gelernt habe.
            </div>

            <button
              onClick={complete}
              disabled={completing}
              style={{
                padding: "14px 20px",
                borderRadius: 8,
                background: completing ? "#2d3148" : "#7c6af7",
                color: "#fff",
                border: "none",
                cursor: completing ? "not-allowed" : "pointer",
                fontSize: "1rem",
                fontWeight: 700,
                letterSpacing: "0.03em",
              }}
            >
              {completing ? "Einen Moment…" : "Los geht's →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
