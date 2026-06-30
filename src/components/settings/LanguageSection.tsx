import { type TranslationFn } from "../../types";
import { SectionLabel, LANGUAGE_OPTIONS } from "./shared";

export interface LanguageSectionProps {
  lang: string;
  onLangChange: (lang: string) => void;
  t: TranslationFn;
}

export default function LanguageSection({ lang, onLangChange, t }: LanguageSectionProps) {
  return (
    <>
      <SectionLabel label={t("language")} />
      <div className="about-card" style={{ marginBottom: "14px" }}>
        <div className="about-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
          <span className="about-label">{t("languageLabel")}</span>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {LANGUAGE_OPTIONS.map(({ code, label }) => (
              <button
                key={code}
                className="lang-pill-btn"
                data-testid={`lang-pill-${code}`}
                onClick={() => onLangChange(code)}
                style={{
                  padding: "5px 12px", borderRadius: "var(--rxs)", cursor: "pointer",
                  border: "1.5px solid " + (lang === code ? "var(--accent,#006D77)" : "var(--bo2)"),
                  background: lang === code ? "color-mix(in srgb,var(--accent,#006D77) 15%,transparent)" : "none",
                  color: lang === code ? "var(--accent,#006D77)" : "var(--tx2)",
                  fontFamily: "'Google Sans',sans-serif", fontSize: ".82rem", fontWeight: 700,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
