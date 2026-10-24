import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useBootContext } from "../../App";
import { apiFetch } from "../../lib/api";

type Step =
  "welcome" | "name" | "directive" | "scan" | "voice" | "location" | "done";

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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setBoot } = useBootContext();
  const [step, setStep] = useState<Step>("welcome");
  const [name, setName] = useState("");
  const [directiveAccepted, setDirectiveAccepted] = useState(false);
  const [scanDone, setScanDone] = useState(false);
  const [scanLines, setScanLines] = useState<string[]>([]);
  const locationRef = useRef<HTMLInputElement>(null);
  const [voices, setVoices] = useState<
    Array<{
      name: string;
      locale: string;
      gender: string;
      lang: string;
      label: string;
    }>
  >([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [selectedLang, setSelectedLang] = useState("de");

  const PREVIEW_TEXT: Record<string, string> = {
    de: `Hallo${name.trim() ? ` ${name.trim()}` : ""}. Ich bin E.L.L.A.`,
    en: `Hello${name.trim() ? ` ${name.trim()}` : ""}. I am E.L.L.A.`,
    es: `Hola${name.trim() ? ` ${name.trim()}` : ""}. Soy E.L.L.A.`,
    fr: `Bonjour${name.trim() ? ` ${name.trim()}` : ""}. Je suis E.L.L.A.`,
  };

  const directiveProhibitions = [
    { code: "I", text: t("onboarding.directive_i") },
    { code: "II", text: t("onboarding.directive_ii") },
    { code: "III", text: t("onboarding.directive_iii") },
    { code: "IV", text: t("onboarding.directive_iv") },
  ];

  const runScan = async () => {
    setStep("scan");
    const lines: string[] = [];
    const add = (line: string) => {
      lines.push(line);
      setScanLines([...lines]);
    };

    add(t("onboarding.scan_cpu"));
    await apiFetch("/api/onboarding/scan", { method: "POST" }).catch(() => {});
    add(t("onboarding.scan_ram"));
    add(t("onboarding.scan_drives"));
    await new Promise((r) => setTimeout(r, 800));
    add(t("onboarding.scan_network"));
    await new Promise((r) => setTimeout(r, 600));
    add(t("onboarding.scan_profile"));
    setScanDone(true);
    setTimeout(() => {
      apiFetch("/api/speech/voices")
        .then((r) => r.json())
        .then(
          (data: {
            voices: Array<{
              name: string;
              locale: string;
              gender: string;
              lang: string;
              label: string;
            }>;
          }) => {
            setVoices(data.voices);
            if (data.voices.length > 0) {
              setSelectedVoice(data.voices[0].name);
              setSelectedLang(data.voices[0].lang ?? "de");
            }
          },
        )
        .catch(() => {
          const fallback = [
            {
              name: "de-DE-KatjaNeural",
              locale: "de-DE",
              gender: "Female" as const,
              lang: "de",
              label: "Deutsch — Katja",
            },
            {
              name: "en-GB-SoniaNeural",
              locale: "en-GB",
              gender: "Female" as const,
              lang: "en",
              label: "English — Sonia",
            },
            {
              name: "es-ES-ElviraNeural",
              locale: "es-ES",
              gender: "Female" as const,
              lang: "es",
              label: "Español — Elvira",
            },
            {
              name: "fr-FR-DeniseNeural",
              locale: "fr-FR",
              gender: "Female" as const,
              lang: "fr",
              label: "Français — Denise",
            },
          ];
          setVoices(fallback);
          setSelectedVoice(fallback[0].name);
          setSelectedLang(fallback[0].lang);
        });
      setStep("voice");
    }, 1200);
  };

  const complete = async (location?: string) => {
    setStep("done");
    await apiFetch("/api/onboarding/complete", {
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
            <p style={s.body}>{t("onboarding.welcome_body")}</p>
            <button style={s.btn} onClick={() => setStep("name")}>
              {t("onboarding.welcome_btn")}
            </button>
          </>
        )}

        {step === "name" && (
          <>
            <div style={{ ...s.name, fontSize: "1.8rem", marginBottom: "4px" }}>
              {t("onboarding.name_title")}
            </div>
            <p style={{ ...s.body, marginBottom: "20px" }}>
              {t("onboarding.name_body")}
            </p>
            <input
              style={s.input}
              type="text"
              placeholder={t("onboarding.name_placeholder")}
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
              {t("onboarding.continue")}
            </button>
          </>
        )}

        {step === "directive" && (
          <>
            <div style={{ ...s.name, fontSize: "1.4rem", marginBottom: "4px" }}>
              {t("onboarding.directive_title")}
            </div>
            <p style={{ ...s.body, marginBottom: "16px" }}>
              {t("onboarding.directive_body")}
            </p>
            <div style={{ marginBottom: "24px" }}>
              {directiveProhibitions.map((p) => (
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
                {t("onboarding.directive_accept")}
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
              {t("onboarding.directive_btn")}
            </button>
          </>
        )}

        {step === "scan" && (
          <>
            <div style={{ ...s.name, fontSize: "1.4rem", marginBottom: "4px" }}>
              {t("onboarding.scan_title")}
            </div>
            <p style={{ ...s.body, marginBottom: "20px" }}>
              {t("onboarding.scan_body")}
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
              {t("onboarding.voice_title")}
            </div>
            <p style={{ ...s.body, marginBottom: "20px" }}>
              {t("onboarding.voice_body")}
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
                      setSelectedLang(v.lang ?? "de");
                      const previewText =
                        PREVIEW_TEXT[v.lang ?? "de"] ?? PREVIEW_TEXT["de"];
                      apiFetch("/api/speech/synthesize", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          text: previewText,
                          voice: v.name,
                        }),
                      })
                        .then((r) => r.blob())
                        .then((blob) => {
                          const url = URL.createObjectURL(blob);
                          const audio = new Audio(url);
                          audio.onended = () => URL.revokeObjectURL(url);
                          audio.play();
                        })
                        .catch(() => {});
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
                    {v.label ?? v.name}
                  </button>
                ))}
              </div>
            ) : (
              <p style={{ ...s.body, color: "#475569" }}>
                {t("onboarding.voice_none")}
              </p>
            )}
            <button
              style={{ ...s.btn, marginBottom: "12px" }}
              onClick={() => {
                if (selectedVoice) {
                  apiFetch("/api/settings", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      ttsEnabled: true,
                      spokenLanguage: selectedLang,
                    }),
                  }).catch(() => {});
                }
                setStep("location");
              }}
            >
              {selectedVoice
                ? t("onboarding.voice_btn_confirm")
                : t("onboarding.voice_btn_skip")}
            </button>
          </>
        )}

        {step === "location" && (
          <>
            <div style={{ ...s.name, fontSize: "1.4rem", marginBottom: "4px" }}>
              {t("onboarding.location_title")}
            </div>
            <p style={{ ...s.body, marginBottom: "20px" }}>
              {t("onboarding.location_body")}
            </p>
            <input
              ref={locationRef}
              style={s.input}
              type="text"
              placeholder={t("onboarding.location_placeholder")}
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
              {t("onboarding.location_save")}
            </button>
            <button style={s.btnGhost} onClick={() => complete()}>
              {t("onboarding.location_skip")}
            </button>
          </>
        )}

        {step === "done" && (
          <>
            <div style={s.name}>E.L.L.A.</div>
            <p style={{ ...s.body, textAlign: "center", marginTop: "8px" }}>
              {name.trim()
                ? t("onboarding.done_ready_named", { name: name.trim() })
                : t("onboarding.done_ready")}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
