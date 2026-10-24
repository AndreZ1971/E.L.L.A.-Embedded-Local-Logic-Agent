import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useBootContext } from "../../App";
import { apiFetch } from "../../lib/api";

export default function Activation() {
  const { t } = useTranslation();
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
      const r = await apiFetch("/api/license/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseKey: trimmed }),
      });
      const data = (await r.json()) as { ok?: boolean; error?: string };
      if (!r.ok || !data.ok) {
        const errKey = data.error ?? "activation_failed";
        setError(
          t(
            `activation.error_${errKey}`,
            t("activation.error_activation_failed"),
          ),
        );
        setLoading(false);
        return;
      }
      setBoot((prev) => (prev ? { ...prev, licenseActivated: true } : prev));
      navigate("/onboarding");
    } catch {
      setError(t("activation.error_network"));
      setLoading(false);
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>E.L.L.A.</div>
        <h1 style={s.title}>{t("activation.title")}</h1>
        <p style={s.sub}>{t("activation.subtitle")}</p>

        <label style={s.label}>{t("activation.label")}</label>
        <input
          style={s.input}
          type="text"
          placeholder={t("activation.placeholder")}
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
          {loading ? t("activation.btn_busy") : t("activation.btn_activate")}
        </button>

        <p style={s.hint}>{t("activation.hint")}</p>
        <p style={{ ...s.hint, marginTop: "0.1rem" }}>
          {t("activation.shop_pre")}{" "}
          <a
            href="https://www.ella-agent.de"
            onClick={(e) => {
              e.preventDefault();
              window.open("https://www.ella-agent.de", "_blank");
            }}
            style={{ color: "#7c3aed", textDecoration: "none" }}
          >
            {t("activation.shop_link")}
          </a>{" "}
          {t("activation.shop_post")}
        </p>
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
    color: "var(--ella-danger)",
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
