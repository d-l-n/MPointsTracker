import { memo } from "react";

import { WifiOff } from "reicon-react";
import type { TranslationFn } from "../../types";

interface SyncDotProps {
  syncing: boolean;
  error: unknown;
  t: TranslationFn;
  isOnline?: boolean;
}

const SyncDot = memo(function SyncDot({ syncing, error, t, isOnline = true }: SyncDotProps) {
  if (!isOnline) {
    return <span className="sync-dot sync-dot--offline" title={t("offline")}><WifiOff size={14} /></span>;
  }
  return (
    <span
      className={`sync-dot${syncing ? " syncing" : error ? " error" : ""}`}
      title={syncing ? t("syncing") : error ? t("syncError") : t("synced")}
      aria-live="polite"
    />
  );
});

export default SyncDot;
