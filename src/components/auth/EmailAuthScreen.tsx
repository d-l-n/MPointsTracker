import { useEffect, useState, type CSSProperties, type ChangeEvent, type ReactNode } from "react";

import { LANGUAGE_OPTIONS } from "../settings/shared";
import { Language } from "reicon-react";
import LoginForm from "./LoginForm";
import type { TranslationFn } from "../../types";

type AuthMode = "main" | "signin" | "signup" | "reset";

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

const MailIcon = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="m4.5 7.5 7.5 5.5 7.5-5.5" />
  </svg>
);

const PhoneIcon = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
    <path d="M11 18.5h2" />
  </svg>
);

const primaryButtonStyle = {
  "--gc": "#006D77",
} as CSSProperties & Record<"--gc", string>;

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

  useEffect(() => {
    if (!showGuestConfirm) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowGuestConfirm(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showGuestConfirm]);

  const currentLang = LANGUAGE_OPTIONS.find((entry) => entry.code === lang) || LANGUAGE_OPTIONS[0];

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
            <Language size={13} />
            {currentLang.label}
            <span style={{ fontSize: ".55rem", opacity: 0.6, marginLeft: 2 }}>▼</span>
          </button>
          {langOpen && (
            <div className="lang-menu">
              {LANGUAGE_OPTIONS.map((entry) => (
                <button
                  key={entry.code}
                  onClick={() => {
                    onLangChange(entry.code);
                    setLangOpen(false);
                  }}
                  className={`lang-option${lang === entry.code ? " active" : ""}`}
                >
                  {entry.label}
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
    <button className="auth-btn-quiet" onClick={onClose}>
      {t("cancel")}
    </button>
  ) : null;

  const brand = (
    <button type="button" className="auth-logo" onClick={onLogoTap}>
      <span className="auth-logo-main">MPOINTS</span>
      <span className="auth-logo-sub">TRACKER</span>
    </button>
  );

  const shell = (children: ReactNode) => (
    <div className="auth-screen">
      <span className="auth-bg" aria-hidden="true">
        <span className="auth-orb auth-orb--a" />
        <span className="auth-orb auth-orb--b" />
      </span>
      {langRow}
      <section className="auth-card">
        {brand}
        {children}
        {closeBtn}
      </section>
    </div>
  );

  if (mode === "signin") {
    return shell(
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
    );
  }

  if (mode === "signup") {
    return shell(
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
        <button className="auth-link" onClick={back}>
          {t("backToLogin")}
        </button>
      </div>
    );
  }

  if (mode === "reset") {
    return shell(
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
        <button className="auth-link" onClick={back}>
          {t("backToLogin")}
        </button>
      </div>
    );
  }

  return shell(
    showGuestConfirm && onGuest ? (
      <div className="auth-confirm">
        <div className="auth-confirm-title">{t("localAccountTitle")}</div>
        <div className="auth-confirm-msg">{t("localAccountMsg")}</div>
        <button
          className="modal-confirm"
          data-testid="confirm-local-account"
          onClick={() => {
            setShowGuestConfirm(false);
            onGuest();
          }}
        >
          {t("localAccountConfirm")}
        </button>
        <button className="auth-btn-quiet" onClick={() => setShowGuestConfirm(false)}>
          {t("cancel")}
        </button>
      </div>
    ) : (
      <>
        <div className="auth-sub">{t("registroTitle")}</div>
        <div className="auth-desc">{t("authDesc")}</div>
        {!isOnline && (
          <div data-testid="offline-auth-copy" className="auth-offline">
            {t("offlineAuthCopy")}
          </div>
        )}
        <button className="btn-google" onClick={onGoogle}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
          {t("continueGoogle")}
        </button>
        <div className="auth-divider">o</div>
        <button
          className="auth-btn-outline"
          onClick={() => {
            setMode("signin");
            setErr("");
          }}
        >
          {MailIcon}
          {t("continueEmail")}
        </button>
        {onGuest && (
          <button
            className="auth-btn-outline"
            onClick={() => setShowGuestConfirm(true)}
            data-testid="guest-btn"
          >
            {PhoneIcon}
            {t("useWithout")}
          </button>
        )}
      </>
    )
  );
}

export default EmailAuthScreen;
