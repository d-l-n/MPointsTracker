import { useOptimistic, useState, type CSSProperties } from "react";
import { useFormStatus } from "react-dom";

import type { TranslationFn } from "../../types";

interface LoginSubmitButtonProps {
  disabled?: boolean;
  t: TranslationFn;
}

interface LoginFormProps {
  t: TranslationFn;
  onSignIn: (email: string, password: string) => Promise<unknown> | unknown;
  onShowReset: () => void;
  onShowSignup: () => void;
  onBack: () => void;
}

interface OptimisticLoginState {
  email: string;
  message: string;
}

const primaryButtonStyle = {
  "--gc": "#006D77",
} as CSSProperties & Record<"--gc", string>;

const optimisticStatusStyle: CSSProperties = {
  marginTop: 4,
  textTransform: "none",
  letterSpacing: 0,
};

const footerRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const backLinkStyle: CSSProperties = {
  textAlign: "center",
  display: "block",
  margin: "4px auto 0",
};

function LoginSubmitButton({ disabled, t }: LoginSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      className="btnpri"
      style={primaryButtonStyle}
      type="submit"
      data-testid="login-submit"
      disabled={disabled || pending}
    >
      {pending ? `${t("loading")}...` : t("signIn")}
    </button>
  );
}

export default function LoginForm({ t, onSignIn, onShowReset, onShowSignup, onBack }: LoginFormProps) {
  const [error, setError] = useState("");
  const [optimisticState, setOptimisticState] = useOptimistic<OptimisticLoginState, OptimisticLoginState>(
    { email: "", message: "" },
    (_currentState, nextState) => nextState,
  );

  const handleSubmit = async (formData: FormData) => {
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    if (!email || !password) return;

    setError("");
    setOptimisticState({
      email,
      message: t("loading"),
    });

    const nextError = await onSignIn(email, password);
    if (nextError) {
      setError(String(nextError));
    }
  };

  return (
    <form className="auth-form" action={handleSubmit}>
      <input
        className="inp"
        name="email"
        type="email"
        placeholder={t("emailPlaceholder")}
        autoComplete="email"
      />
      <input
        className="inp"
        name="password"
        type="password"
        placeholder={t("passwordPlaceholder")}
        autoComplete="current-password"
      />
      {optimisticState.email && !error && (
        <div className="auth-sub" data-testid="login-optimistic-status" style={optimisticStatusStyle}>
          {optimisticState.message} {optimisticState.email}
        </div>
      )}
      {error && <div className="auth-err">{error}</div>}
      <LoginSubmitButton t={t} />
      <div style={footerRowStyle}>
        <button type="button" className="auth-link" onClick={onShowReset}>
          {t("forgotPassword")}
        </button>
        <button type="button" className="auth-link" onClick={onShowSignup}>
          → {t("signUp")}
        </button>
      </div>
      <button type="button" className="auth-link" style={backLinkStyle} onClick={onBack}>
        {t("backToLogin")}
      </button>
    </form>
  );
}
