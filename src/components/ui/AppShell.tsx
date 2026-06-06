import { useRef, type ReactNode, type TouchEvent, type WheelEvent } from "react";

import type { ToastState, TranslationFn } from "../../types";
import Toast from "./Toast";

const LOCAL_DEVELOPMENT_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

export function isLocalDevelopmentHost(hostname = globalThis.window?.location.hostname ?? "") {
  return LOCAL_DEVELOPMENT_HOSTS.has(hostname);
}

interface AppShellProps {
  dark: boolean;
  toast: ToastState;
  children: ReactNode;
  t?: TranslationFn;
}

export default function AppShell({ dark, toast, children, t: _t = (key) => key }: AppShellProps) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const touchStartY = useRef<number | null>(null);
  const showDevelopmentIndicator = isLocalDevelopmentHost();

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (!contentRef.current) return;
    const rect = contentRef.current.getBoundingClientRect();
    const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
    if (outside || event.target === contentRef.current) {
      contentRef.current.scrollTop += event.deltaY;
    }
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 1) {
      touchStartY.current = event.touches[0].clientY;
    }
  };

  const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    if (!contentRef.current || touchStartY.current === null) return;
    const touch = event.touches[0];
    const rect = contentRef.current.getBoundingClientRect();
    const outside = touch.clientX < rect.left || touch.clientX > rect.right || touch.clientY < rect.top || touch.clientY > rect.bottom;
    if (outside || event.target === contentRef.current) {
      const deltaY = touchStartY.current - touch.clientY;
      contentRef.current.scrollTop += deltaY;
    }
    touchStartY.current = touch.clientY;
  };

  const handleTouchEnd = () => {
    touchStartY.current = null;
  };

  return (
    <>
      <div
        className={`app ${dark ? "dark" : "light"}`}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="app-bg"><div className="app-bg-shimmer" /></div>
        <div className="app-content" ref={contentRef}>
          <div className="app-content-inner">{children}</div>
        </div>
        {showDevelopmentIndicator && (
          <div
            aria-label="Entorno local de desarrollo"
            className="dev-environment-indicator"
            data-testid="dev-environment-indicator"
          >
            <span className="dev-environment-indicator__dot" aria-hidden="true" />
            <span>DEV</span>
          </div>
        )}
        <Toast msg={toast.msg} show={toast.show} />
      </div>
    </>
  );
}
