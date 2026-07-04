import { useState, type CSSProperties, type ChangeEvent } from "react";

import ConfirmModal from "../ui/ConfirmModal";
import LoginForm from "./LoginForm";
import type { TranslationFn } from "../../types";

type AuthMode = "main" | "signin" | "signup" | "reset";

interface LanguageOption {
  code: string;
  flag: string;
  label: string;
}

interface EmailAuthScreenProps {
  t: TranslationFn;
  onGoogle: () => Promise<unknown> | unknown;
  onSignIn: (email: string, password: string) => Promise<unknown> | unknown;
  onSignUp: (email: string, password: string, name?: string) => Promise<unknown> | unknown;
  onReset: (email: string) => Promise<unknown> | unknown;
  onGuest?: () => void;
  onLogoTap: () => void;
  initialMode?: AuthMode | string;
  lang?: string;
  onLangChange?: (lang: string) => void;
  dark?: boolean;
  onDarkChange?: () => void;
  onClose?: () => void;
  isOnline?: boolean;
  showDebug?: boolean;
}

const LANGS: LanguageOption[] = [
  { code: "es", flag: "🇦🇷", label: "ES" },
  { code: "en", flag: "🇺🇸", label: "EN" },
  { code: "de", flag: "🇩🇪", label: "DE" },
  { code: "zh", flag: "🇨🇳", label: "中文" },
  { code: "ja", flag: "🇯🇵", label: "日本語" },
  { code: "fr", flag: "🇫🇷", label: "FR" },
];

const iconButtonStyle: CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: "50%",
  border: "1.5px solid var(--bo2)",
  background: "var(--bg2)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const authLogoStyle: CSSProperties = {
  cursor: "pointer",
  userSelect: "none",
  border: "none",
  padding: 0,
  fontFamily: "inherit",
  display: "block",
  width: "100%",
};

const backLinkStyle: CSSProperties = {
  textAlign: "center",
  display: "block",
  margin: "4px auto 0",
};

const primaryButtonStyle = {
  "--gc": "#006D77",
} as CSSProperties & Record<"--gc", string>;

const subtleEmailButtonStyle: CSSProperties = {
  background: "var(--glass)",
  border: "1px solid var(--glass-border)",
  color: "var(--tx)",
};

const langRowStyle: CSSProperties = {
  position: "absolute",
  top: 16,
  right: 16,
  display: "flex",
  alignItems: "center",
  gap: 8,
  zIndex: 10,
};

const resetDoneStyle: CSSProperties = {
  textAlign: "center",
  color: "var(--tx)",
  fontSize: ".9rem",
  lineHeight: 1.6,
};

const offlineCopyStyle: CSSProperties = {
  maxWidth: 360,
  marginBottom: 14,
  padding: "10px 12px",
  borderRadius: "var(--rsm)",
  background: "color-mix(in srgb, var(--glass) 84%, #f59e0b 16%)",
  border: "1px solid color-mix(in srgb, #f59e0b 32%, transparent)",
  color: "var(--tx)",
  fontSize: ".78rem",
  lineHeight: 1.5,
  textAlign: "center",
};

const closeBtnStyle: CSSProperties = {
  background: "var(--glass)",
  border: "1px solid var(--glass-border)",
  color: "var(--tx2)",
  borderRadius: "var(--r)",
  padding: "10px 24px",
  fontFamily: "'Google Sans', sans-serif",
  fontSize: ".85rem",
  fontWeight: 600,
  cursor: "pointer",
  width: "100%",
  maxWidth: 280,
  textAlign: "center",
  marginTop: 4,
};

const guestButtonStyle: CSSProperties = {
  background: "color-mix(in srgb, var(--glass) 88%, transparent)",
  border: "1.5px solid var(--glass-border)",
  color: "var(--tx)",
  borderRadius: "var(--r)",
  padding: "12px 24px",
  fontFamily: "'Google Sans', sans-serif",
  fontSize: ".88rem",
  fontWeight: 700,
  cursor: "pointer",
  width: "100%",
  maxWidth: 280,
  textAlign: "center",
  boxShadow: "var(--glass-shadow)",
  transition: "box-shadow .18s, transform .18s",
};

function normalizeMode(mode?: AuthMode | string): AuthMode {
  return mode === "signin" || mode === "signup" || mode === "reset" ? mode : "main";
}

function EmailAuthScreen({
  t,
  onGoogle,
  onSignIn,
  onSignUp,
  onReset,
  onGuest,
  onLogoTap,
  initialMode = "main",
  lang,
  onLangChange,
  dark,
  onDarkChange,
  onClose,
  isOnline = true,
  showDebug: _showDebug,
}: EmailAuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>(normalizeMode(initialMode));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [showGuestConfirm, setShowGuestConfirm] = useState(false);

  const currentLang = LANGS.find((entry) => entry.code === lang) || LANGS[0];

  const handleSignUp = async () => {
    if (!email || !password) return;
    setLoading(true);
    setErr("");
    const error = await onSignUp(email, password, name);
    setLoading(false);
    if (error) setErr(String(error));
  };

  const handleReset = async () => {
    if (!email) return;
    setLoading(true);
    setErr("");
    const error = await onReset(email);
    setLoading(false);
    if (error) setErr(String(error));
    else setResetDone(true);
  };

  const back = () => {
    setMode("main");
    setErr("");
    setResetDone(false);
  };

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => setName(event.target.value);
  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value);
  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value);

  const langRow = (
    <div style={langRowStyle}>
      {onLangChange && (
        <div style={{ position: "relative" }}>
          <button onClick={() => setLangOpen((open) => !open)} className="lang-trigger">
            {currentLang.flag} {currentLang.label}
            <span style={{ fontSize: ".55rem", opacity: 0.6, marginLeft: 2 }}>▼</span>
          </button>
          {langOpen && (
            <div className="lang-menu">
              {LANGS.map((entry) => (
                <button
                  key={entry.code}
                  onClick={() => {
                    onLangChange(entry.code);
                    setLangOpen(false);
                  }}
                  className={`lang-option${lang === entry.code ? " active" : ""}`}
                >
                  {entry.flag} {entry.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {onDarkChange && (
        <button onClick={onDarkChange} style={{ ...iconButtonStyle, fontSize: "1rem" }} aria-label={dark ? t("themeToggleLight") : t("themeToggleDark")}>
          {dark ? "🌙" : "☀️"}
        </button>
      )}
    </div>
  );

  const closeBtn = onClose ? (
    <button style={closeBtnStyle} onClick={onClose}>
      {t("cancel")}
    </button>
  ) : null;

  if (mode === "signin") {
    return (
      <div className="auth-screen">
        {langRow}
        <button type="button" className="auth-logo" onClick={onLogoTap} style={authLogoStyle}>
          MPOINTS
          <br />
          TRACKER
        </button>
        <LoginForm
          t={t}
          onSignIn={onSignIn}
          onShowReset={() => {
            setMode("reset");
            setErr("");
          }}
          onShowSignup={() => {
            setMode("signup");
            setErr("");
          }}
          onBack={back}
        />
        {closeBtn}
      </div>
    );
  }

  if (mode === "signup") {
    return (
      <div className="auth-screen">
        {langRow}
        <button type="button" className="auth-logo" onClick={onLogoTap} style={authLogoStyle}>
          MPOINTS
          <br />
          TRACKER
        </button>
        <div className="auth-form">
          <div className="inp-group">
            <label id="signup-name-label" htmlFor="signup-name" className="inp-label">{t("namePlaceholder")}</label>
            <input id="signup-name" className="inp" type="text" placeholder={t("namePlaceholder")} value={name} onChange={handleNameChange} autoComplete="name" aria-invalid={!!err} aria-labelledby="signup-name-label" />
          </div>
          <div className="inp-group">
            <label id="signup-email-label" htmlFor="signup-email" className="inp-label">{t("emailPlaceholder")}</label>
            <input id="signup-email" className="inp" type="email" placeholder={t("emailPlaceholder")} value={email} onChange={handleEmailChange} autoComplete="email" aria-invalid={!!err} aria-labelledby="signup-email-label" />
          </div>
          <div className="inp-group">
            <label id="signup-password-label" htmlFor="signup-password" className="inp-label">{t("passwordPlaceholder")}</label>
            <input
              id="signup-password"
              className="inp"
              type="password"
              placeholder={t("passwordPlaceholder")}
              value={password}
              onChange={handlePasswordChange}
              autoComplete="new-password"
              aria-invalid={!!err}
              aria-labelledby="signup-password-label"
              aria-describedby={err ? "signup-error" : undefined}
            />
          </div>
          {err && <div id="signup-error" className="auth-err" aria-live="assertive">{err}</div>}
          <button className="btnpri" style={primaryButtonStyle} disabled={loading || !email || !password} onClick={handleSignUp}>
            {loading ? "..." : t("signUp")}
          </button>
          <button className="auth-link" style={backLinkStyle} onClick={back}>
            {t("backToLogin")}
          </button>
        </div>
        {closeBtn}
      </div>
    );
  }

  if (mode === "reset") {
    return (
      <div className="auth-screen">
        {langRow}
        <button type="button" className="auth-logo" onClick={onLogoTap} style={authLogoStyle}>
          MPOINTS
          <br />
          TRACKER
        </button>
        <div className="auth-form">
          {resetDone ? (
            <div style={resetDoneStyle}>{t("resetSent")}</div>
          ) : (
            <>
              <div className="inp-group">
                <label id="reset-email-label" htmlFor="reset-email" className="inp-label">{t("emailPlaceholder")}</label>
                <input id="reset-email" className="inp" type="email" placeholder={t("emailPlaceholder")} value={email} onChange={handleEmailChange} autoComplete="email" aria-invalid={!!err} aria-labelledby="reset-email-label" aria-describedby={err ? "reset-error" : undefined} />
              </div>
              {err && <div id="reset-error" className="auth-err" aria-live="assertive">{err}</div>}
              <button className="btnpri" style={primaryButtonStyle} disabled={loading || !email} onClick={handleReset}>
                {loading ? "..." : t("forgotPassword")}
              </button>
            </>
          )}
          <button className="auth-link" style={backLinkStyle} onClick={back}>
            {t("backToLogin")}
          </button>
        </div>
        {closeBtn}
      </div>
    );
  }

  return (
    <div className="auth-screen">
      {langRow}
      <button type="button" className="auth-logo" onClick={onLogoTap} style={authLogoStyle}>
        MPOINTS
        <br />
        TRACKER
      </button>
      <div className="auth-sub">{t("registroTitle")}</div>
      <div className="auth-desc">{t("authDesc")}</div>
      {!isOnline && (
        <div data-testid="offline-auth-copy" style={offlineCopyStyle}>
          {t("offlineAuthCopy")}
        </div>
      )}
      <button className="btn-google" onClick={onGoogle}>
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
        {t("continueGoogle")}
      </button>
      <div className="auth-divider">o</div>
      <button
        className="btn-google"
        style={subtleEmailButtonStyle}
        onClick={() => {
          setMode("signin");
          setErr("");
        }}
      >
        ✉️ {t("continueEmail")}
      </button>
      {onGuest && (
        <>
          <button
            style={guestButtonStyle}
            onClick={() => setShowGuestConfirm(true)}
            data-testid="guest-btn"
          >
            📱 {t("useWithout")}
          </button>
          {showGuestConfirm && (
            <ConfirmModal
              title={t("localAccountTitle")}
              msg={t("localAccountMsg")}
              confirmLabel={t("localAccountConfirm")}
              cancelLabel={t("cancel")}
              onConfirm={() => {
                setShowGuestConfirm(false);
                onGuest();
              }}
              onCancel={() => setShowGuestConfirm(false)}
            />
          )}
        </>
      )}
      {closeBtn}
    </div>
  );
}

export default EmailAuthScreen;
