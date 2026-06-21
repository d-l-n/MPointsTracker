import { useEffect, useRef, useState } from "react";

import type { TranslationFn } from "../../types";

type InstallMode = "android" | "ios";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform?: string;
  }>;
}

interface InstallBannerProps {
  dark?: boolean;
  t?: TranslationFn;
}

function InstallBanner({ dark: _dark, t = ((key: string) => key) as TranslationFn }: InstallBannerProps) {
  const [mode, setMode] = useState<InstallMode | null>(null);
  const [hiding, setHiding] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const DISMISSED_KEY = "bgt_install_dismissed";
  /** Re-show the banner after 30 days so users who uninstall can be prompted again */
  const DISMISS_TTL_MS = 30 * 24 * 60 * 60 * 1000;

  useEffect(() => {
    const raw = localStorage.getItem(DISMISSED_KEY);
    if (raw) {
      const ts = parseInt(raw, 10);
      if (!isNaN(ts) && Date.now() - ts < DISMISS_TTL_MS) return;
      // TTL expired — remove stale flag so the banner can show again
      localStorage.removeItem(DISMISSED_KEY);
    }
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const iosNavigator = window.navigator as Navigator & { standalone?: boolean };
    if (iosNavigator.standalone) return;

    const handler = (event: Event) => {
      const installEvent = event as BeforeInstallPromptEvent;
      installEvent.preventDefault();
      deferredPrompt.current = installEvent;
      showTimerRef.current = setTimeout(() => setMode("android"), 3500);
    };

    window.addEventListener("beforeinstallprompt", handler);

    const isIosSafari =
      /iphone|ipad|ipod/i.test(navigator.userAgent) &&
      /safari/i.test(navigator.userAgent) &&
      !/crios|fxios|opios/i.test(navigator.userAgent);

    if (isIosSafari) {
      showTimerRef.current = setTimeout(() => setMode("ios"), 3500);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const dismiss = () => {
    setHiding(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setMode(null);
      setHiding(false);
      hideTimerRef.current = null;
    }, 300);
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
  };

  const handleInstall = async () => {
    if (!deferredPrompt.current) return;
    await deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    if (outcome === "accepted") {
      dismiss();
    }
    deferredPrompt.current = null;
  };

  if (!mode) return null;

  if (mode === "ios") {
    return (
      <div className={`ios-hint${hiding ? " hiding" : ""}`}>
        <button className="ios-hint-close" onClick={dismiss} aria-label={t("cancel")}>
          ✕
        </button>
        <div className="ios-hint-title">📲 {t("installTitle")}</div>
        <div className="ios-hint-desc">{t("installPrompt")}</div>
      </div>
    );
  }

  return (
    <div className={`install-banner${hiding ? " hiding" : ""}`}>
      <div className="install-banner-icon">🃏</div>
      <div className="install-banner-text">
        <div className="install-banner-title">{t("installTitle")}</div>
        <div className="install-banner-desc">{t("installDesc")}</div>
      </div>
      <button className="install-banner-btn" onClick={handleInstall}>
        {t("installBtn")}
      </button>
      <button className="install-banner-close" onClick={dismiss} aria-label={t("cancel")}>
        ✕
      </button>
    </div>
  );
}

export default InstallBanner;
