import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useBootContext } from "../../App";
import { apiFetch } from "../../lib/api";

export default function Eula() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setBoot } = useBootContext();
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const EULA_POINTS = [
    { title: t("eula.items.local_title"), body: t("eula.items.local_body") },
    { title: t("eula.items.openai_title"), body: t("eula.items.openai_body") },
    { title: t("eula.items.system_title"), body: t("eula.items.system_body") },
    {
      title: t("eula.items.boundary_title"),
      body: t("eula.items.boundary_body"),
    },
    {
      title: t("eula.items.responsibility_title"),
      body: t("eula.items.responsibility_body"),
    },
  ];

  async function confirm() {
    if (!accepted || saving) return;
    setSaving(true);
    setError("");
    try {
      const r = await apiFetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eulaAccepted: true }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setBoot((prev) => (prev ? { ...prev, eulaAccepted: true } : prev));
      navigate("/activation");
    } catch {
      setSaving(false);
      setError(t("eula.offline"));
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>{t("eula.title")}</h1>
        <p style={styles.subtitle}>{t("eula.subtitle")}</p>

        <ol style={styles.list}>
          {EULA_POINTS.map((p) => (
            <li key={p.title} style={styles.item}>
              <strong style={styles.itemTitle}>{p.title}</strong>
              <span style={styles.itemBody}>{p.body}</span>
            </li>
          ))}
        </ol>

        <label style={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            style={styles.checkbox}
          />
          <span>{t("eula.accept")}</span>
        </label>

        {error && (
          <p
            style={{
              color: "#f87171",
              fontSize: "0.85rem",
              marginBottom: "1rem",
              textAlign: "center",
            }}
          >
            {error}
          </p>
        )}
        <button
          onClick={confirm}
          disabled={!accepted || saving}
          style={{
            ...styles.btn,
            opacity: accepted && !saving ? 1 : 0.45,
            cursor: accepted && !saving ? "pointer" : "not-allowed",
          }}
        >
          {saving ? "…" : t("eula.confirm")}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--bg, #0f0f13)",
    padding: "2rem",
  },
  card: {
    maxWidth: 620,
    width: "100%",
    background: "var(--surface, #1a1a22)",
    borderRadius: 16,
    padding: "2.5rem",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  },
  title: {
    margin: "0 0 0.5rem",
    fontSize: "1.6rem",
    color: "var(--accent, #7c3aed)",
    fontWeight: 700,
  },
  subtitle: {
    margin: "0 0 1.5rem",
    color: "var(--text-muted, #888)",
    fontSize: "0.9rem",
  },
  list: {
    paddingLeft: "1.4rem",
    margin: "0 0 2rem",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  item: {
    lineHeight: 1.6,
    color: "var(--text, #e2e2e8)",
  },
  itemTitle: {
    display: "block",
    color: "var(--text, #e2e2e8)",
    marginBottom: "0.2rem",
  },
  itemBody: {
    color: "var(--text-muted, #aaa)",
    fontSize: "0.875rem",
  },
  checkboxRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.75rem",
    cursor: "pointer",
    color: "var(--text, #e2e2e8)",
    marginBottom: "1.5rem",
    lineHeight: 1.5,
  },
  checkbox: {
    marginTop: "0.2rem",
    width: 18,
    height: 18,
    flexShrink: 0,
    accentColor: "#7c3aed",
  },
  btn: {
    width: "100%",
    padding: "0.8rem 1.5rem",
    background: "#7c3aed",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: "1rem",
    fontWeight: 600,
    transition: "opacity 0.15s",
  },
};
