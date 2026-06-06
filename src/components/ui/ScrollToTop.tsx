import { useState, useEffect } from "react";

function getScrollContainer(): HTMLElement | null {
  return document.querySelector<HTMLElement>(".app-content,.detail-wrapper");
}

function getScrollTop(): number {
  const el = getScrollContainer();
  return el && el.scrollTop > 0 ? el.scrollTop : window.scrollY || document.documentElement.scrollTop || 0;
}

function scrollTop() {
  const el = getScrollContainer();
  if (el && el.scrollTop > 0) el.scrollTo({ top: 0, behavior: "smooth" });
  else window.scrollTo({ top: 0, behavior: "smooth" });
}

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(getScrollTop() > 300);
    onScroll();
    document.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => document.removeEventListener("scroll", onScroll, { capture: true, passive: true });
  }, []);

  return (
    <button
      className={`scroll-to-top${visible ? " scroll-to-top--visible" : ""}`}
      onClick={scrollTop}
      aria-label="Volver arriba"
    >
      ↑
    </button>
  );
}
