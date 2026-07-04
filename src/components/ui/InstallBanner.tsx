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
  const DISMISS_LATER_KEY = "bgt_install_dismissed_later";
  const DISMISS_TTL_MS = 30 * 24 * 60 * 60 * 1000;
  const DISMISS_LATER_TTL_MS = 1 * 24 * 60 * 60 * 1000;
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia("(max-width: 767px)").matches
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem(DISMISSED_KEY);
    if (raw) {
      const ts = parseInt(raw, 10);
      if (!isNaN(ts) && Date.now() - ts < DISMISS_TTL_MS) return;
      localStorage.removeItem(DISMISSED_KEY);
    }
    const later = localStorage.getItem(DISMISS_LATER_KEY);
    if (later) {
      const ts = parseInt(later, 10);
      if (!isNaN(ts) && Date.now() - ts < DISMISS_LATER_TTL_MS) return;
      localStorage.removeItem(DISMISS_LATER_KEY);
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

  const close = (later = false) => {
    setHiding(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setMode(null);
      setHiding(false);
      hideTimerRef.current = null;
    }, 300);
    localStorage.setItem(later ? DISMISS_LATER_KEY : DISMISSED_KEY, String(Date.now()));
  };

  const handleInstall = async () => {
    if (!deferredPrompt.current) return;
    await deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    if (outcome === "accepted") {
      close();
    }
    deferredPrompt.current = null;
  };

  if (!mode) return null;

  if (mode === "ios") {
    return (
      <div className={`ios-hint${hiding ? " hiding" : ""}`}>
        <button className="ios-hint-close" onClick={() => close()} aria-label={t("cancel")}>
          ✕
        </button>
        <div className="ios-hint-title">📲 {t("installTitle")}</div>
        <div className="ios-hint-desc">{t("installPrompt")}</div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className={`install-popup-overlay${hiding ? " hiding" : ""}`} role="dialog" aria-modal="true" aria-label={t("installTitle")}>
        <div className="install-popup">
          <button className="install-popup-close" onClick={() => close()} aria-label={t("cancel")}>✕</button>
          <div className="install-popup-icon">🃏</div>
          <div className="install-popup-title">{t("installTitle")}</div>
          <div className="install-popup-desc">{t("installDesc")}</div>
          <div className="install-popup-actions">
            <button className="install-popup-btn" onClick={handleInstall}>{t("installBtn")}</button>
            <button className="install-popup-later" onClick={() => close(true)}>{t("installLater")}</button>
          </div>
        </div>
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
      <button className="install-banner-close" onClick={() => close()} aria-label={t("cancel")}>
        ✕
      </button>
    </div>
  );
}

export default InstallBanner;
