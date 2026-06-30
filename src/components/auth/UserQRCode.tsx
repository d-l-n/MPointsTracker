import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";

import { getGlobalT } from "../../data/translations";
import type { TranslationFn } from "../../types";

interface UserQRCodeProps {
  uid?: string | null;
  displayName?: string | null;
  t?: TranslationFn;
}

function UserQRCode({ uid, displayName, t = getGlobalT() as TranslationFn }: UserQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!uid || !canvasRef.current) return;
    let cancelled = false;
    setReady(false);
    setError(false);

    const payload = JSON.stringify({ uid, name: displayName || "" });

    QRCode.toCanvas(canvasRef.current, payload, {
      width: 200,
      margin: 1,
      color: { dark: "#000000", light: "#ffffff" },
      errorCorrectionLevel: "M",
    })
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [uid, displayName]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div
        className="qr-canvas"
        style={{
          borderRadius: 8,
          background: "#fff",
          padding: 8,
          minWidth: 200,
          minHeight: 200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {!ready && !error ? <span style={{ fontSize: ".75rem", color: "#999" }}>{t("loading2")}</span> : null}
        {error ? <span style={{ fontSize: ".75rem", color: "#ff4444" }}>{t("qrError")}</span> : null}
        <canvas ref={canvasRef} role="img" aria-label={t("qrCodeHint")} style={{ display: ready ? "block" : "none" }} />
      </div>
      <div style={{ fontSize: ".7rem", color: "var(--tx3)", textAlign: "center", maxWidth: 200 }}>{t("qrCodeHint")}</div>
    </div>
  );
}

export default UserQRCode;
