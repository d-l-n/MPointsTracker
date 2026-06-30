import { getGlobalT } from "../../data/translations";

interface OfflineBannerProps {
  compact?: boolean;
}

export default function OfflineBanner({ compact = false }: OfflineBannerProps) {
  const t = getGlobalT();
  return (
    <div
      className="offline-banner glass"
      data-testid="offline-banner"
      role="status"
      style={{
        margin: compact ? "12px 16px 0" : "0 0 12px",
        padding: compact ? "10px 12px" : "12px 14px",
        borderRadius: "var(--rsm, 10px)",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <span aria-hidden="true" style={{ fontSize: "1.1rem", lineHeight: 1 }}>
        📴
      </span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: ".8rem", fontWeight: 800, color: "var(--tx)" }}>{t("offline")}</div>
        <div style={{ fontSize: ".72rem", color: "var(--tx2)", marginTop: 2 }}>
          {t("offlineBannerDesc")}
        </div>
      </div>
    </div>
  );
}
