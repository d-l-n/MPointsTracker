import { useCallback, type ChangeEvent } from "react";
import { type MatchStore, type TranslationFn } from "../../types";
import { SectionLabel, SettingsToggleRow } from "./shared";

type BackupResult =
  | { ok: true; data: MatchStore; matchCount: number }
  | { ok: false; error: "invalid-json" | "invalid-shape" | "empty" };

function parseBackupJson(text: string): BackupResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "invalid-json" };
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "invalid-shape" };
  }
  const data: MatchStore = {};
  let matchCount = 0;
  for (const key of Object.keys(raw as Record<string, unknown>)) {
    const value = (raw as Record<string, unknown>)[key];
    if (!Array.isArray(value)) continue;
    data[key] = value;
    matchCount += value.length;
  }
  return matchCount > 0 ? { ok: true, data, matchCount } : { ok: false, error: "empty" };
}

export interface AdvancedSectionProps {
  wakeLockEnabled: boolean;
  onToggleWakeLock: (value: boolean) => void;
  hapticEnabled: boolean;
  onToggleHaptic: (value: boolean) => void;
  data: MatchStore;
  onImportData: (data: MatchStore) => Promise<void> | void;
  showToast?: (msg: string, duration?: number) => void;
  t: TranslationFn;
}

export default function AdvancedSection({
  wakeLockEnabled,
  onToggleWakeLock,
  hapticEnabled,
  onToggleHaptic,
  data,
  onImportData,
  showToast,
  t,
}: AdvancedSectionProps) {
  const handleExport = useCallback(() => {
    try {
      const exportData: Record<string, unknown> = {};
      Object.entries(data).forEach(([key, value]) => {
        if (!key.startsWith("__")) {
          exportData[key] = value;
        }
      });
      const json = JSON.stringify(exportData, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "mpoints_backup_" + new Date().toISOString().slice(0, 10) + ".json";
      anchor.click();
      URL.revokeObjectURL(url);
      showToast?.(t("exportDone") || "✅ Datos exportados");
    } catch {
      showToast?.("❌ Error al exportar");
    }
  }, [data, showToast, t]);

  const handleImport = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const parsed = parseBackupJson(await file.text());
    if (!parsed.ok) {
      showToast?.(t("importDataError"));
      return;
    }

    await onImportData(parsed.data);
    showToast?.(`${t("importDataDone")} (${parsed.matchCount})`);
  }, [onImportData, showToast, t]);

  return (
    <div className="page">
      {"wakeLock" in navigator && (
        <>
          <SectionLabel label={t("displaySection")} />
          <div className="about-card" style={{ marginBottom: "14px" }}>
            <SettingsToggleRow
              title={t("screenOn")}
              desc={t("screenOnDesc")}
              enabled={wakeLockEnabled}
              onToggle={onToggleWakeLock}
            />
          </div>
        </>
      )}

      {"vibrate" in navigator && (
        <>
          <SectionLabel label={t("interactionSection")} />
          <div className="about-card" style={{ marginBottom: "14px" }}>
            <SettingsToggleRow
              title={t("hapticFeedback")}
              desc={t("hapticFeedbackDesc")}
              enabled={hapticEnabled}
              onToggle={onToggleHaptic}
            />
          </div>
        </>
      )}

      <SectionLabel label={t("dataSection")} />
      <div className="about-card" style={{ marginBottom: "14px" }}>
        <div style={{ padding: "4px 0 4px" }}>
          <div style={{ fontSize: ".78rem", color: "var(--tx2)", marginBottom: 12 }}>
            {t("exportDataDesc")}
          </div>
          <button
            className="btnpri"
            style={{ fontSize: ".9rem", padding: "11px" }}
            onClick={handleExport}
          >
            {t("exportDataBtn")}
          </button>
          <div style={{ marginTop: 12 }}>
            <label
              id="backup-import-label"
              className="btnsec"
              htmlFor="backup-import"
              style={{ display: "block", textAlign: "center", fontSize: ".9rem", padding: "11px" }}
            >
              {t("importDataBtn")}
            </label>
            <input
              id="backup-import"
              type="file"
              accept="application/json,.json"
              onChange={handleImport}
              aria-labelledby="backup-import-label"
              style={{ display: "none" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
