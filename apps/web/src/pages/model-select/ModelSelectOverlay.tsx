import React, { useState } from "react";
import { useTranslation } from "react-i18next";

type ModelTier = "small" | "standard" | "large";

const TIER_DATA: {
  key: ModelTier;
  model: string;
  size: string;
  vram: string;
}[] = [
  { key: "small", model: "llama3.2:3b", size: "~2 GB", vram: "4 GB+" },
  { key: "standard", model: "llama3.1:8b", size: "~5 GB", vram: "6 GB+" },
  { key: "large", model: "qwen2.5:14b", size: "~8.5 GB", vram: "12 GB+" },
];

interface Props {
  onChosen: (model: string) => void;
}

export default function ModelSelectOverlay({ onChosen }: Props) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<ModelTier>("standard");

  const tiers = TIER_DATA.map((b) => ({
    ...b,
    label: t(`settings.tier_${b.key}_label`),
    desc: t(`settings.tier_${b.key}_desc`),
  }));

  const handleConfirm = () => {
    const tier = TIER_DATA.find((b) => b.key === selected)!;
    onChosen(tier.model);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#0f1117",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: "24px",
      }}
    >
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        style={{
          maxWidth: 520,
          width: "100%",
          background: "#1a1d27",
          borderRadius: 16,
          padding: "40px 36px",
          border: "1px solid #2a2d3e",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
          animation: "fadeInUp 0.4s ease",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* Header */}
        <div>
          <div
            style={{
              fontSize: "1rem",
              fontWeight: 800,
              letterSpacing: "0.15em",
              color: "#7c6af7",
              fontFamily: "monospace",
              marginBottom: 12,
            }}
          >
            E.L.L.A.
          </div>
          <h2
            style={{
              margin: 0,
              fontSize: "1.35rem",
              fontWeight: 700,
              color: "#e2e8f0",
              lineHeight: 1.3,
            }}
          >
            {t("model_select.heading")}
          </h2>
          <p
            style={{
              margin: "8px 0 0",
              fontSize: "0.875rem",
              color: "#64748b",
              lineHeight: 1.6,
            }}
          >
            {t("model_select.subtitle")}
          </p>
        </div>

        {/* Tier Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {tiers.map((tier) => {
            const active = selected === tier.key;
            return (
              <div
                key={tier.key}
                onClick={() => setSelected(tier.key)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: `1px solid ${active ? "#7c6af7" : "#2d3148"}`,
                  background: active ? "#1a1440" : "#0f1117",
                  cursor: "pointer",
                  transition: "border-color 0.15s, background 0.15s",
                }}
              >
                <input
                  type="radio"
                  readOnly
                  checked={active}
                  style={{
                    accentColor: "#7c6af7",
                    flexShrink: 0,
                    marginTop: 3,
                  }}
                />
                <div style={{ flex: 1 }}>
                  {/* Top row: label + model badge + size */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 3,
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        color: active ? "#a78bfa" : "#e2e8f0",
                        fontSize: "0.92rem",
                      }}
                    >
                      {tier.label}
                    </span>
                    <code
                      style={{
                        fontSize: "0.78rem",
                        color: "#94a3b8",
                        background: "#1e2130",
                        padding: "1px 7px",
                        borderRadius: 4,
                      }}
                    >
                      {tier.model}
                    </code>
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      {tier.size}
                    </span>
                  </div>

                  {/* Description + VRAM */}
                  <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                    {tier.desc} &nbsp;·&nbsp; min. {tier.vram} VRAM
                  </div>

                  {/* OpenAI hint — only on small */}
                  {tier.key === "small" && (
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: "0.73rem",
                        color: "#7c6af7",
                        lineHeight: 1.5,
                      }}
                    >
                      {t("model_select.openai_hint")}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <button
          onClick={handleConfirm}
          style={{
            width: "100%",
            padding: "13px",
            borderRadius: 8,
            background: "#7c6af7",
            color: "#fff",
            border: "none",
            fontSize: "1rem",
            fontWeight: 600,
            cursor: "pointer",
            letterSpacing: "0.02em",
          }}
        >
          {t("model_select.cta")}
        </button>

        {/* Footer notes */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "0.75rem",
              color: "#475569",
              textAlign: "center",
            }}
          >
            {t("model_select.footer")}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "0.73rem",
              color: "#3a4156",
              textAlign: "center",
            }}
          >
            {t("model_select.change_hint")}
          </p>
        </div>
      </div>
    </div>
  );
}
