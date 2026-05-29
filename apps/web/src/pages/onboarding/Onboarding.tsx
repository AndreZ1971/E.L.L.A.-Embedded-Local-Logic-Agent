import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBootContext } from "../../App";

const API = import.meta.env.VITE_API_BASE ?? "";

type Step =
  | "welcome"
  | "name"
  | "directive"
  | "scan"
  | "voice"
  | "location"
  | "done";

const DIRECTIVE_PROHIBITIONS = [
  {
    code: "I",
    text: "Ich werde dir keinen Schaden zufügen — physisch, finanziell oder psychologisch.",
  },
  {
    code: "II",
    text: "Ich verberge nichts. Alles was ich tue, wird protokolliert.",
  },
  {
    code: "III",
    text: "Ich beobachte dich nicht ohne dein Wissen und deine Zustimmung.",
  },
  {
    code: "IV",
    text: "Deine Daten verlassen dieses Gerät nicht — außer auf deinen ausdrücklichen Wunsch.",
  },
];

const s: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0f1117",
    color: "#e2e8f0",
    fontFamily: "'Inter', system-ui, sans-serif",
    padding: "24px",
  },
  card: {
    background: "#1a1d27",
    borderRadius: "16px",
    padding: "48px 40px",
    maxWidth: "480px",
    width: "100%",
    border: "1px solid #2a2d3e",
    boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
  },
  name: {
    fontSize: "3.5rem",
    fontWeight: 700,
    color: "#7c6af7",
    letterSpacing: "0.15em",
    textAlign: "center",
    marginBottom: "8px",
  },
  subtitle: {
    fontSize: "0.85rem",
    color: "#64748b",
    textAlign: "center",
    letterSpacing: "0.25em",
    marginBottom: "32px",
    textTransform: "uppercase",
  },
  body: {
    fontSize: "0.95rem",
    color: "#94a3b8",
    lineHeight: 1.6,
    marginBottom: "24px",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    background: "#0f1117",
    border: "1px solid #2a2d3e",
    borderRadius: "8px",
    color: "#e2e8f0",
    fontSize: "1rem",
    outline: "none",
    boxSizing: "border-box",
    marginBottom: "24px",
  },
  btn: {
    width: "100%",
    padding: "14px",
    background: "#7c6af7",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
    letterSpacing: "0.03em",
  },
  btnDisabled: { opacity: 0.4, cursor: "not-allowed" },
  btnGhost: {
    width: "100%",
    padding: "14px",
    background: "transparent",
    color: "#64748b",
    border: "1px solid #2a2d3e",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  prohibitionRow: {
    display: "flex",
    gap: "16px",
    alignItems: "flex-start",
    padding: "14px 0",
    borderBottom: "1px solid #2a2d3e",
  },
  prohibitionCode: {
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "#7c6af7",
    letterSpacing: "0.1em",
    minWidth: "24px",
    paddingTop: "2px",
  },
  prohibitionText: { fontSize: "0.9rem", color: "#cbd5e1", lineHeight: 1.5 },
  scanLine: {
    fontSize: "0.85rem",
    color: "#7c6af7",
    marginBottom: "8px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  dot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#7c6af7",
    flexShrink: 0,
    animation: "pulse 1.5s infinite",
  },
  dotDone: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#22c55e",
    flexShrink: 0,
  },
};

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { setBoot } = useBootContext();
  const [step, setStep] = useState<Step>("welcome");
  const [name, setName] = useState("");
  const [directiveAccepted, setDirectiveAccepted] = useState(false);
  const [scanDone, setScanDone] = useState(false);
  const [scanLines, setScanLines] = useState<string[]>([]);
  const locationRef = useRef<HTMLInputElement>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState("");

  const runScan = async () => {
    setStep("scan");
    const lines: string[] = [];
    const add = (line: string) => {
      lines.push(line);
      setScanLines([...lines]);
    };

    add("CPU und GPU werden erkannt…");
    await fetch(`${API}/api/onboarding/scan`, { method: "POST" }).catch(
      () => {},
    );
    add("Arbeitsspeicher analysiert.");
    add("Laufwerke werden geprüft…");
    await new Promise((r) => setTimeout(r, 800));
    add("Netzwerk-Schnittstellen erkannt.");
    await new Promise((r) => setTimeout(r, 600));
    add("Hardware-Profil gespeichert.");
    setScanDone(true);
    setTimeout(() => {
      const v = window.speechSynthesis.getVoices();
      const deVoices = v.filter((voice) => voice.lang.startsWith("de"));
      setVoices(deVoices.length > 0 ? deVoices : v.slice(0, 5));
      setStep("voice");
    }, 1200);
  };

  const complete = async (location?: string) => {
    setStep("done");
    await fetch(`${API}/api/onboarding/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userName: name.trim() || undefined, location }),
    }).catch(() => {});
    setBoot((prev) => (prev ? { ...prev, onboardingComplete: true } : prev));
    setTimeout(() => navigate("/chat", { replace: true }), 1500);
  };

  return (
    <div style={s.root}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .ella-card { animation: fadeIn 0.4s ease; }
      `}</style>

      <div style={s.card} className="ella-card">
        {step === "welcome" && (
          <>
            <div style={s.name}>E.L.L.A.</div>
            <div style={s.subtitle}>Embedded Local Logic Agent</div>
            <p style={s.body}>
              Dein lokaler KI-Assistent. Läuft auf deinem Gerät. Deine Daten
              bleiben bei dir.
            </p>
            <button style={s.btn} onClick={() => setStep("name")}>
              Einrichten
            </button>
          </>
        )}

        {step === "name" && (
          <>
            <div style={{ ...s.name, fontSize: "1.8rem", marginBottom: "4px" }}>
              Wie heißt du?
            </div>
            <p style={{ ...s.body, marginBottom: "20px" }}>
              E.L.L.A. merkt sich deinen Namen.
            </p>
            <input
              style={s.input}
              type="text"
              placeholder="Dein Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && name.trim() && setStep("directive")
              }
              autoFocus
            />
            <button
              style={{ ...s.btn, ...(name.trim() ? {} : s.btnDisabled) }}
              disabled={!name.trim()}
              onClick={() => setStep("directive")}
            >
              Weiter
            </button>
          </>
        )}

        {step === "directive" && (
          <>
            <div style={{ ...s.name, fontSize: "1.4rem", marginBottom: "4px" }}>
              Die E.L.L.A. Directive
            </div>
            <p style={{ ...s.body, marginBottom: "16px" }}>
              Diese vier Verbote sind unveränderlich. Keine Einstellung, kein
              Befehl kann sie überschreiben.
            </p>
            <div style={{ marginBottom: "24px" }}>
              {DIRECTIVE_PROHIBITIONS.map((p) => (
                <div key={p.code} style={s.prohibitionRow}>
                  <span style={s.prohibitionCode}>{p.code}</span>
                  <span style={s.prohibitionText}>{p.text}</span>
                </div>
              ))}
            </div>
            <label
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "flex-start",
                marginBottom: "24px",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={directiveAccepted}
                onChange={(e) => setDirectiveAccepted(e.target.checked)}
                style={{ marginTop: "3px", accentColor: "#7c6af7" }}
              />
              <span
                style={{
                  fontSize: "0.9rem",
                  color: "#94a3b8",
                  lineHeight: 1.5,
                }}
              >
                Ich habe die Directive gelesen und verstanden.
              </span>
            </label>
            <button
              style={{
                ...s.btn,
                ...(!directiveAccepted ? s.btnDisabled : {}),
              }}
              disabled={!directiveAccepted}
              onClick={runScan}
            >
              Akzeptieren & weiter
            </button>
          </>
        )}

        {step === "scan" && (
          <>
            <div style={{ ...s.name, fontSize: "1.4rem", marginBottom: "4px" }}>
              System wird gescannt
            </div>
            <p style={{ ...s.body, marginBottom: "20px" }}>
              E.L.L.A. lernt dein System kennen.
            </p>
            <div style={{ marginBottom: "24px" }}>
              {scanLines.map((line, i) => (
                <div key={i} style={s.scanLine}>
                  {!scanDone && i === scanLines.length - 1 ? (
                    <span style={s.dot} />
                  ) : (
                    <span style={s.dotDone} />
                  )}
                  {line}
                </div>
              ))}
            </div>
          </>
        )}

        {step === "voice" && (
          <>
            <div style={{ ...s.name, fontSize: "1.4rem", marginBottom: "4px" }}>
              Stimme wählen
            </div>
            <p style={{ ...s.body, marginBottom: "20px" }}>
              Mit welcher Stimme soll E.L.L.A. sprechen?
            </p>
            {voices.length > 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  marginBottom: "24px",
                }}
              >
                {voices.map((v) => (
                  <button
                    key={v.name}
                    onClick={() => {
                      setSelectedVoice(v.name);
                      window.speechSynthesis.cancel();
                      const utt = new SpeechSynthesisUtterance(
                        `Hallo${name.trim() ? ` ${name.trim()}` : ""}. Ich bin E.L.L.A.`,
                      );
                      utt.voice = v;
                      utt.lang = v.lang;
                      window.speechSynthesis.speak(utt);
                    }}
                    style={{
                      padding: "10px 16px",
                      borderRadius: "8px",
                      border:
                        selectedVoice === v.name
                          ? "1px solid #7c6af7"
                          : "1px solid #2a2d3e",
                      background:
                        selectedVoice === v.name ? "#1e1b4b" : "#0f1117",
                      color: selectedVoice === v.name ? "#a5b4fc" : "#94a3b8",
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: "0.9rem",
                    }}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            ) : (
              <p style={{ ...s.body, color: "#475569" }}>
                Keine Stimmen verfügbar — Standardstimme wird verwendet.
              </p>
            )}
            <button
              style={{ ...s.btn, marginBottom: "12px" }}
              onClick={() => {
                if (selectedVoice) {
                  fetch(`${API}/api/settings`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      ttsEnabled: true,
                      ttsVoice: selectedVoice,
                    }),
                  }).catch(() => {});
                }
                setStep("location");
              }}
            >
              {selectedVoice ? "Stimme übernehmen" : "Überspringen"}
            </button>
          </>
        )}

        {step === "location" && (
          <>
            <div style={{ ...s.name, fontSize: "1.4rem", marginBottom: "4px" }}>
              Wo bist du?
            </div>
            <p style={{ ...s.body, marginBottom: "20px" }}>
              Für Wetter und lokale Informationen. Optional — du kannst das
              überspringen.
            </p>
            <input
              ref={locationRef}
              style={s.input}
              type="text"
              placeholder="z.B. Berlin"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter")
                  complete(locationRef.current?.value.trim() || undefined);
              }}
            />
            <button
              style={{ ...s.btn, marginBottom: "12px" }}
              onClick={() =>
                complete(locationRef.current?.value.trim() || undefined)
              }
            >
              Speichern
            </button>
            <button style={s.btnGhost} onClick={() => complete()}>
              Überspringen
            </button>
          </>
        )}

        {step === "done" && (
          <>
            <div style={s.name}>E.L.L.A.</div>
            <p style={{ ...s.body, textAlign: "center", marginTop: "8px" }}>
              {name.trim()
                ? `Hallo ${name.trim()} — ich bin bereit.`
                : "Ich bin bereit."}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
