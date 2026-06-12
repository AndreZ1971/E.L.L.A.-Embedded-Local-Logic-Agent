import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBootContext } from "../../App";

const API = import.meta.env.VITE_API_BASE ?? "";

const ERROR_MESSAGES: Record<string, string> = {
  key_not_found: "Dieser Lizenzschluessel existiert nicht.",
  key_expired: "Dieser Lizenzschluessel ist abgelaufen.",
  max_activations_reached:
    "Maximale Anzahl an Aktivierungen fuer diesen Key erreicht.",
  invalid_key_format:
    "Ungültiges Key-Format. Erwartet: ELLA-XXXX-XXXX-XXXX-XXXX",
  too_many_attempts:
    "Zu viele Versuche. Bitte warte eine Stunde und versuche es erneut.",
  activation_failed: "Aktivierung fehlgeschlagen. Bitte versuche es erneut.",
  network: "Kein Internetzugang. Bitte pruefen und erneut versuchen.",
};

export default function Activation() {
  const navigate = useNavigate();
  const { setBoot } = useBootContext();
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function formatKey(raw: string): string {
    const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const parts: string[] = [];
    if (clean.startsWith("ELLA")) {
      parts.push("ELLA");
      const rest = clean.slice(4);
      for (let i = 0; i < rest.length && parts.length < 5; i += 4) {
        parts.push(rest.slice(i, i + 4));
      }
    } else {
      for (let i = 0; i < clean.length; i += 4) {
        parts.push(clean.slice(i, i + 4));
      }
    }
    return parts.join("-");
  }

  async function activate() {
    if (loading) return;
    const trimmed = key.trim();
    if (!trimmed) return;
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`${API}/api/license/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseKey: trimmed }),
      });
      const data = (await r.json()) as { ok?: boolean; error?: string };
      if (!r.ok || !data.ok) {
        setError(
          ERROR_MESSAGES[data.error ?? ""] ?? ERROR_MESSAGES.activation_failed,
        );
        setLoading(false);
        return;
      }
      setBoot((prev) => (prev ? { ...prev, licenseActivated: true } : prev));
      navigate("/onboarding");
    } catch {
      setError(ERROR_MESSAGES.network);
      setLoading(false);
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>E.L.L.A.</div>
        <h1 style={s.title}>Lizenz aktivieren</h1>
        <p style={s.sub}>
          Gib deinen Lizenzschluessel ein um E.L.L.A. freizuschalten.
        </p>

        <label style={s.label}>Lizenzschluessel</label>
        <input
          style={s.input}
          type="text"
          placeholder="ELLA-XXXX-XXXX-XXXX-XXXX"
          value={key}
          maxLength={24}
          onChange={(e) => setKey(formatKey(e.target.value))}
          onKeyDown={(e) => e.key === "Enter" && activate()}
          spellCheck={false}
          autoFocus
        />

        {error && <p style={s.error}>{error}</p>}

        <button
          style={{
            ...s.btn,
            opacity: key.length >= 19 && !loading ? 1 : 0.4,
            cursor: key.length >= 19 && !loading ? "pointer" : "not-allowed",
          }}
          disabled={key.length < 19 || loading}
          onClick={activate}
        >
          {loading ? "Wird aktiviert…" : "Aktivieren →"}
        </button>

        <p style={s.hint}>Noch keinen Key? Wende dich an den Hersteller.</p>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0f0f13",
    padding: "2rem",
  },
  card: {
    maxWidth: 480,
    width: "100%",
    background: "#1a1a22",
    borderRadius: 16,
    padding: "2.5rem",
    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  logo: {
    fontSize: "1.1rem",
    fontWeight: 800,
    letterSpacing: "0.15em",
    color: "#7c3aed",
    fontFamily: "monospace",
    marginBottom: "0.25rem",
  },
  title: {
    margin: 0,
    fontSize: "1.5rem",
    color: "#e2e2e8",
    fontWeight: 700,
  },
  sub: {
    margin: "0 0 0.75rem",
    color: "#888",
    fontSize: "0.875rem",
    lineHeight: 1.5,
  },
  label: {
    fontSize: "0.8rem",
    color: "#888",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
  input: {
    width: "100%",
    padding: "0.75rem 1rem",
    background: "#0f0f13",
    border: "1px solid #2a2a35",
    borderRadius: 8,
    color: "#e2e2e8",
    fontSize: "1.05rem",
    fontFamily: "monospace",
    letterSpacing: "0.08em",
    outline: "none",
    boxSizing: "border-box",
  },
  error: {
    margin: 0,
    color: "#f87171",
    fontSize: "0.85rem",
  },
  btn: {
    width: "100%",
    padding: "0.8rem",
    background: "#7c3aed",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: "1rem",
    fontWeight: 600,
    marginTop: "0.5rem",
    transition: "opacity 0.15s",
  },
  hint: {
    margin: 0,
    color: "#555",
    fontSize: "0.8rem",
    textAlign: "center",
  },
};
