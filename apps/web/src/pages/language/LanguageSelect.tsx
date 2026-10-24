import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useBootContext } from "../../App";
import { SUPPORTED_LANGS, type SupportedLang } from "../../i18n";
import i18n from "../../i18n";
import { apiFetch } from "../../lib/api";

export default function LanguageSelect() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setBoot } = useBootContext();
  const [selected, setSelected] = useState<SupportedLang>("de");
  const [saving, setSaving] = useState(false);

  async function confirm() {
    if (saving) return;
    setSaving(true);
    await i18n.changeLanguage(selected);
    try {
      await apiFetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: selected }),
      });
    } catch {
      // best-effort save — UI proceeds regardless
    }
    setBoot((prev) => (prev ? { ...prev, language: selected } : prev));
    navigate("/eula");
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>E.L.L.A.</div>

        <h1 style={styles.title}>{t("lang.select")}</h1>
        <p style={styles.subtitle}>{t("lang.subtitle")}</p>

        <div style={styles.grid}>
          {SUPPORTED_LANGS.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setSelected(lang.code)}
              style={{
                ...styles.langBtn,
                ...(selected === lang.code ? styles.langBtnActive : {}),
              }}
            >
              <span style={styles.flag}>{lang.flag}</span>
              <span style={styles.langLabel}>{lang.label}</span>
              {selected === lang.code && <span style={styles.check}>✓</span>}
            </button>
          ))}
        </div>

        <button
          onClick={confirm}
          disabled={saving}
          style={{
            ...styles.btn,
            opacity: saving ? 0.6 : 1,
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "…" : t("lang.continue")}
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
    maxWidth: 480,
    width: "100%",
    background: "var(--surface, #1a1a22)",
    borderRadius: 16,
    padding: "2.5rem",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1.25rem",
  },
  logo: {
    fontSize: "2rem",
    fontWeight: 800,
    letterSpacing: "0.1em",
    color: "#7c6af7",
    fontFamily: "monospace",
    marginBottom: "0.25rem",
  },
  title: {
    margin: 0,
    fontSize: "1.5rem",
    color: "var(--text, #e2e2e8)",
    fontWeight: 700,
    textAlign: "center",
  },
  subtitle: {
    margin: 0,
    color: "var(--text-muted, #888)",
    fontSize: "0.9rem",
    textAlign: "center",
  },
  grid: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    width: "100%",
    marginTop: "0.5rem",
  },
  langBtn: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "1rem 1.25rem",
    background: "#0f0f13",
    border: "2px solid #2a2a3a",
    borderRadius: 10,
    cursor: "pointer",
    color: "var(--text, #e2e2e8)",
    fontSize: "1rem",
    transition: "border-color 0.15s, background 0.15s",
    textAlign: "left",
  },
  langBtnActive: {
    borderColor: "#7c6af7",
    background: "rgba(124,106,247,0.08)",
  },
  flag: {
    fontSize: "1.8rem",
    lineHeight: 1,
    flexShrink: 0,
  },
  langLabel: {
    flex: 1,
    fontWeight: 600,
    fontSize: "1.05rem",
  },
  check: {
    color: "#7c6af7",
    fontWeight: 700,
    fontSize: "1.1rem",
    flexShrink: 0,
  },
  btn: {
    width: "100%",
    padding: "0.9rem 1.5rem",
    background: "#7c3aed",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: "1rem",
    fontWeight: 600,
    marginTop: "0.5rem",
    transition: "opacity 0.15s",
  },
};
