import React, { useState, useRef, useEffect } from "react";

import { APP_VERSION } from "../../lib/storage";
import BlackjackCPU from "./BlackjackCPU";

function VersionTapper() {
  const [taps, setTaps] = useState(0);
  const [show, setShow] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const NEEDED = 7;

  const handleTap = () => {
    const next = taps + 1;
    setTaps(next);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (next >= NEEDED) {
      setShow(true);
      setTaps(0);
      return;
    }
    timerRef.current = setTimeout(() => setTaps(0), 2000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const remaining = NEEDED - taps;
  const hint = taps > 0 ? ` (${remaining}...)` : "";

  return (
    <>
      <button type="button" className="about-value" style={{ cursor: "pointer", userSelect: "none", background: "none", border: "none", padding: 0, font: "inherit", color: "inherit" }} onClick={handleTap} title="🃏" aria-label={`${APP_VERSION}${hint}`}>
        v{APP_VERSION}
        {hint}
      </button>
      {show ? <BlackjackCPU onClose={() => setShow(false)} /> : null}
    </>
  );
}

export default VersionTapper;
