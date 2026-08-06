import { memo } from "react";
import type { TranslationFn } from "../../types";
import TrucoSettingsSection from "../settings/TrucoSettingsSection";

interface TrucoSettingsModalProps {
  t: TranslationFn;
  onClose: () => void;
  onSettingsChange?: () => void;
}

function TrucoSettingsModal({ t, onClose, onSettingsChange }: TrucoSettingsModalProps) {
  return (
    <div
      className="modal-overlay"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={onClose}
      data-testid="truco-settings-modal"
      role="dialog"
      aria-modal="true"
      aria-label={t("trucoSettingsTitle")}
    >
      <div
        className="modal-card"
        style={{
          background: "var(--ibg)",
          border: "1.5px solid var(--bo2)",
          borderRadius: "var(--rmd, 16px)",
          maxWidth: "460px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "20px",
          position: "relative",
          boxShadow: "0 12px 32px rgba(0,0,0,0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
            borderBottom: "1px solid var(--bo2)",
            paddingBottom: "12px",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--tx1)" }}>
            ⚙️ {t("trucoSettingsTitle")}
          </div>
          <button
            type="button"
            className="btnrm"
            onClick={onClose}
            aria-label={t("close")}
            style={{ width: 32, height: 32, fontSize: "1rem" }}
          >
            ✕
          </button>
        </div>

        <TrucoSettingsSection t={t} onSettingsChange={onSettingsChange} />

        <div style={{ marginTop: "16px", textAlign: "center" }}>
          <button type="button" className="btnpri" onClick={onClose} style={{ width: "100%" }}>
            {t("done")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(TrucoSettingsModal);
