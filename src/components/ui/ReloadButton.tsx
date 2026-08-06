import { useEffect, useState, type CSSProperties, type MouseEvent } from "react";

import type { TranslationFn } from "../../types";
import { ArrowUp, ArrowRotate, WifiOff } from "reicon-react";

declare global {
  interface Window {
    __swPendingReload?: boolean;
    __swRegistration?: ServiceWorkerRegistration;
  }
}

interface ReloadButtonProps {
  t?: TranslationFn;
}

const baseIconStyle: CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: "50%",
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  flexBasis: "auto",
  lineHeight: 1,
};

export default function ReloadButton({ t = ((key: string) => key) as TranslationFn }: ReloadButtonProps) {
  const [updateReady, setUpdateReady] = useState(false);
  const [isOffline, setIsOffline] = useState(typeof navigator !== "undefined" ? !navigator.onLine : false);

  useEffect(() => {
    const goOnline = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  useEffect(() => {
    const onUpdate = () => setUpdateReady(true);
    window.addEventListener("sw-update-available", onUpdate);
    return () => window.removeEventListener("sw-update-available", onUpdate);
  }, []);

  const handleClick = () => {
    if (updateReady) {
      window.__swPendingReload = true;
      const registration = window.__swRegistration;
      const newWorker = registration?.waiting || registration?.installing;
      if (newWorker) {
        // Signal the newly installed (waiting) worker directly: it is the one
        // that must skipWaiting() to take control and trigger the reload.
        newWorker.postMessage({ type: "SKIP_WAITING" });
      } else if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({ type: "SKIP_WAITING" });
      } else {
        window.location.reload();
      }
      return;
    }
    window.location.reload();
  };

  const handleMouseEnter = (event: MouseEvent<HTMLButtonElement>) => {
    event.currentTarget.style.transform = "rotate(180deg)";
  };

  const handleMouseLeave = (event: MouseEvent<HTMLButtonElement>) => {
    event.currentTarget.style.transform = "rotate(0deg)";
  };

  if (isOffline) {
    return (
      <div
        title={t("offline")}
        style={{
          ...baseIconStyle,
          border: "var(--surface-stroke-width, 1.5px) solid #f4a261",
          background: "color-mix(in srgb,#f4a261 15%,var(--bg3))",
          fontSize: ".7rem",
          cursor: "default",
        }}
      >
          <WifiOff size={16} />
        </div>
    );
  }

  if (updateReady) {
    return (
      <button
        onClick={handleClick}
        title={t("updateAvailable")}
        aria-label={t("updateAvailable")}
        style={{
          ...baseIconStyle,
          border: "var(--surface-stroke-width, 1.5px) solid #52b788",
          background: "color-mix(in srgb,#52b788 20%,var(--bg3))",
          color: "#52b788",
          fontSize: ".65rem",
          cursor: "pointer",
          animation: "pulse-green 1.5s ease-in-out infinite",
        }}
      >
        <ArrowUp size={16} />
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      title={t("reloadAppTitle")}
      aria-label={t("reloadAppTitle")}
        style={{
          ...baseIconStyle,
          border: "var(--surface-stroke-width, 1.5px) solid var(--bo2)",
          background: "var(--bg3)",
          color: "var(--tx2)",
          fontSize: ".9rem",
        cursor: "pointer",
        transition: "transform .3s",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <ArrowRotate size={16} />
    </button>
  );
}
