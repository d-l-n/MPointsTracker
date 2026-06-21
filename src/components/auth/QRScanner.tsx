import React, { useState, useEffect, useRef } from "react";
import jsQR from "jsqr";

import { useFocusTrap } from "../../hooks/useFocusTrap";
import type { TranslationFn } from "../../types";

interface QRPayload {
  uid?: string | null;
  name?: string;
}

interface QRScannerProps {
  onScan: (payload: QRPayload) => void;
  onClose: () => void;
  t: TranslationFn;
}

function QRScanner({ onScan, onClose, t }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animRef = useRef<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const stopCamera = () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };

    const scanLoop = () => {
      const video = videoRef.current;
      if (!video) return;
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            try {
              const data = JSON.parse(code.data) as QRPayload;
              if (data.uid) {
                stopCamera();
                onScan(data);
                return;
              }
            } catch {
              // ignore decode failure
            }
          }
        }
      }
      animRef.current = requestAnimationFrame(scanLoop);
    };

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
        scanLoop();
      } catch {
        setError(t("cameraError"));
      }
    };

    void startCamera();
    return () => stopCamera();
  }, [onScan, t]);

  const dialogRef = useFocusTrap();

  return (
    <div className="qr-modal" ref={dialogRef as React.RefObject<HTMLDivElement>} role="dialog" aria-modal="true" aria-labelledby="qr-title" onClick={onClose} onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <div className="qr-box" onClick={(event) => event.stopPropagation()}>
        <div id="qr-title" className="qr-title">📷 {t("scanQR")}</div>
        {error ? (
          <div style={{ color: "#ff4444", fontSize: ".8rem", textAlign: "center" }}>{error}</div>
        ) : (
          <div className="scan-viewport">
            <video ref={videoRef} playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div className="scan-overlay" />
          </div>
        )}
        <div className="qr-sub">{t("scanInstructions")}</div>
        <button className="btnsec" onClick={onClose}>{t("cancel")}</button>
      </div>
    </div>
  );
}

export default QRScanner;
