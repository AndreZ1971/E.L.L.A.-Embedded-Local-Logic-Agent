import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_BASE ?? "";

const EULA_POINTS = [
  {
    title: "Vollständig lokal",
    body: "E.L.L.A. läuft auf deinem Rechner. Keine Cloud, kein Tracking, kein Abo.",
  },
  {
    title: "OpenAI-Hinweis",
    body: "Falls du unter Einstellungen einen OpenAI-API-Key einträgst, werden deine Nachrichten an OpenAI-Server übertragen. Mit Ollama bleiben alle Daten ausschließlich auf deinem Gerät.",
  },
  {
    title: "Systemzugriff",
    body: "E.L.L.A. kann Programme starten, temporäre Dateien bereinigen, E-Mails lesen und Kalendereinträge erstellen — aber nur auf deinen expliziten Befehl hin.",
  },
  {
    title: "Unveränderliche Grenze",
    body: "Ungelesene E-Mails werden niemals gelöscht. Diese Grenze ist technisch verankert und kann durch keine Regel überschrieben werden.",
  },
  {
    title: "Verantwortung",
    body: "Du trägst die Verantwortung für alle Aktionen die du E.L.L.A. beauftragst. Destruktive Aktionen (Papierkorb leeren, Temp-Dateien löschen) sind standardmäßig gesperrt und müssen explizit freigeschaltet werden.",
  },
] as const;

export default function Eula() {
  const navigate = useNavigate();
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);

  async function confirm() {
    if (!accepted || saving) return;
    setSaving(true);
    try {
      await fetch(`${API}/api/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eulaAccepted: true }),
      });
      navigate("/setup");
    } catch {
      setSaving(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Nutzungshinweise</h1>
        <p style={styles.subtitle}>
          Bitte lies die folgenden Punkte bevor du E.L.L.A. verwendest.
        </p>

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
          <span>
            Ich habe die Nutzungshinweise gelesen und stimme ihnen zu.
          </span>
        </label>

        <button
          onClick={confirm}
          disabled={!accepted || saving}
          style={{
            ...styles.btn,
            opacity: accepted && !saving ? 1 : 0.45,
            cursor: accepted && !saving ? "pointer" : "not-allowed",
          }}
        >
          {saving ? "Wird gespeichert…" : "Bestätigen und weiter →"}
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
