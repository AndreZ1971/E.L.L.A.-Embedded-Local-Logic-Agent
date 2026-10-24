import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../lib/api";

interface SetupStatus {
  ollama: boolean;
  nomic: boolean;
  mariadb: boolean;
  allOk: boolean;
}

export default function Setup() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [pulling, setPulling] = useState(false);
  const [pullLines, setPullLines] = useState<string[]>([]);
  const [pullDone, setPullDone] = useState(false);
  const [pullSuccess, setPullSuccess] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiFetch("/api/setup/status")
      .then((r) => r.json())
      .then((d: SetupStatus) => setStatus(d))
      .catch(() =>
        setStatus({ ollama: false, nomic: false, mariadb: true, allOk: false }),
      );
  }, []);

  async function pullNomic() {
    setPulling(true);
    setPullLines([]);
    setPullDone(false);
    setPullSuccess(false);

    const res = await apiFetch("/api/setup/pull-nomic", { method: "POST" });
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buf = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = JSON.parse(line.slice(5).trim()) as {
          text?: string;
          done?: boolean;
          success?: boolean;
        };
        if (payload.text) {
          setPullLines((prev) => [...prev, payload.text!]);
          setTimeout(
            () => logRef.current?.scrollTo(0, logRef.current.scrollHeight),
            10,
          );
        }
        if (payload.done) {
          setPullDone(true);
          setPullSuccess(payload.success ?? false);
          if (payload.success) {
            setStatus((s) => (s ? { ...s, nomic: true, allOk: s.ollama } : s));
          }
        }
      }
    }
    setPulling(false);
  }

  function proceed() {
    apiFetch("/api/onboarding/status")
      .then((r) => r.json())
      .then((d: { complete: boolean }) => {
        navigate(d.complete ? "/chat" : "/onboarding");
      })
      .catch(() => navigate("/chat"));
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>System-Check</h1>
        <p style={styles.subtitle}>
          E.L.L.A. prüft ob alle Abhängigkeiten vorhanden sind.
        </p>

        {status === null ? (
          <p style={styles.checking}>Prüfe Abhängigkeiten…</p>
        ) : (
          <div style={styles.checks}>
            <StatusRow label="MariaDB" ok={status.mariadb} />
            <StatusRow label="Ollama" ok={status.ollama} />
            <StatusRow
              label="nomic-embed-text (Gedächtnis-Modell)"
              ok={status.nomic}
            />
          </div>
        )}

        {status && !status.ollama && (
          <div style={styles.hint}>
            <strong>Ollama nicht gefunden.</strong> Lade es herunter und starte
            E.L.L.A. neu.{" "}
            <a
              href="https://ollama.ai"
              target="_blank"
              rel="noreferrer"
              style={styles.link}
            >
              ollama.ai
            </a>
          </div>
        )}

        {status && status.ollama && !status.nomic && !pullDone && (
          <div style={styles.hint}>
            <strong>nomic-embed-text fehlt.</strong> Das Modell wird für das
            Langzeitgedächtnis benötigt (~274 MB).
            <br />
            <button
              onClick={pullNomic}
              disabled={pulling}
              style={{ ...styles.pullBtn, opacity: pulling ? 0.6 : 1 }}
            >
              {pulling ? "Lade herunter…" : "Jetzt herunterladen"}
            </button>
          </div>
        )}

        {pullLines.length > 0 && (
          <div ref={logRef} style={styles.log}>
            {pullLines.map((l, i) => (
              <div key={i} style={styles.logLine}>
                {l}
              </div>
            ))}
            {pullDone && (
              <div
                style={{
                  ...styles.logLine,
                  color: pullSuccess ? "#4ade80" : "#f87171",
                  fontWeight: 600,
                }}
              >
                {pullSuccess
                  ? "Download abgeschlossen."
                  : "Download fehlgeschlagen."}
              </div>
            )}
          </div>
        )}

        <div style={styles.footer}>
          <button onClick={proceed} style={styles.btn}>
            {status?.allOk ? "Weiter →" : "Trotzdem fortfahren →"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div style={rowStyles.row}>
      <span
        style={{
          ...rowStyles.dot,
          background: ok ? "#4ade80" : "#f87171",
        }}
      />
      <span style={rowStyles.label}>{label}</span>
      <span style={{ ...rowStyles.badge, color: ok ? "#4ade80" : "#f87171" }}>
        {ok ? "OK" : "Nicht gefunden"}
      </span>
    </div>
  );
}

const rowStyles: Record<string, React.CSSProperties> = {
  row: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.6rem 0",
    borderBottom: "1px solid var(--border, #2a2a35)",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    flexShrink: 0,
  },
  label: {
    flex: 1,
    color: "var(--text, #e2e2e8)",
    fontSize: "0.9rem",
  },
  badge: {
    fontSize: "0.8rem",
    fontWeight: 600,
  },
};

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
    maxWidth: 540,
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
  checking: {
    color: "var(--text-muted, #888)",
    fontStyle: "italic",
    margin: "1rem 0",
  },
  checks: {
    marginBottom: "1.5rem",
  },
  hint: {
    background: "var(--surface2, #22222e)",
    borderRadius: 8,
    padding: "1rem",
    marginBottom: "1rem",
    color: "var(--text, #e2e2e8)",
    fontSize: "0.875rem",
    lineHeight: 1.6,
  },
  link: {
    color: "#7c3aed",
  },
  pullBtn: {
    marginTop: "0.75rem",
    padding: "0.5rem 1.25rem",
    background: "#7c3aed",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: "0.875rem",
    cursor: "pointer",
    fontWeight: 600,
  },
  log: {
    background: "#0a0a0f",
    borderRadius: 8,
    padding: "0.75rem",
    maxHeight: 180,
    overflowY: "auto",
    marginBottom: "1rem",
    fontFamily: "monospace",
    fontSize: "0.78rem",
  },
  logLine: {
    color: "#aaa",
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
  },
  footer: {
    marginTop: "1.5rem",
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
    cursor: "pointer",
  },
};
