import { useState, type CSSProperties } from "react";

import { haptic } from "../../lib/storage";
import type { TranslationFn } from "../../types";

interface ActivePlayer {
  id: string;
  name: string;
}

interface MercyEliminatorProps {
  active?: ActivePlayer[];
  onEliminate: (eliminatedId: string, causerId: string) => void;
  onPendingChange?: (pending: boolean) => void;
  t?: TranslationFn;
}

interface SelectorButtonProps {
  label: string;
  value: string;
  current: string;
  onSelect: (value: string) => void;
  color?: string;
}

function SelectorButton({ label, value, current, onSelect, color = "#FF2222" }: SelectorButtonProps) {
  return (
    <button
      onClick={() => onSelect(value === current ? "" : value)}
      style={{
        padding: "8px 12px",
        border: `1.5px solid ${value === current ? color : "var(--bo2)"}`,
        borderRadius: "var(--rxs)",
        background: value === current ? `color-mix(in srgb,${color} 15%,transparent)` : "var(--ibg)",
        color: value === current ? color : "var(--tx2)",
        cursor: "pointer",
        fontFamily: "'Google Sans',sans-serif",
        fontSize: ".84rem",
        fontWeight: 600,
        textAlign: "left",
        flex: 1,
      }}
    >
      {label}
    </button>
  );
}

export default function MercyEliminator({
  active = [],
  onEliminate,
  onPendingChange,
  t = ((key: string) => key) as TranslationFn,
}: MercyEliminatorProps) {
  const [open, setOpen] = useState(true);
  const [elimId, setElimId] = useState("");
  const [causerId, setCauserId] = useState("");
  const canConfirm = Boolean(elimId && causerId && elimId !== causerId);

  const handleSetElimId = (value: string) => {
    setElimId(value);
    onPendingChange?.(Boolean(value));
  };

  const handleSetCauserId = (value: string) => {
    setCauserId(value);
  };

  const handleToggle = () => {
    if (open) {
      setElimId("");
      setCauserId("");
      onPendingChange?.(false);
    }
    setOpen((current) => !current);
  };

  return (
    <div className="mercybadge" style={{ marginBottom: "12px" }}>
      <button
        onClick={handleToggle}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          width: "100%",
        }}
      >
        <span className="mercytitle">{t("mercyRule")}</span>
        <span
          style={{
            fontSize: ".75rem",
            color: "var(--tx3)",
            fontWeight: 700,
            transition: "transform .2s",
            display: "inline-block",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          ▼
        </span>
      </button>

      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
          <div>
            <span className="rdlbl" style={{ display: "block", marginBottom: "6px" }}>
              {t("eliminatedPlayer")}:
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {active.map((player) => (
                <SelectorButton key={player.id} label={player.name} value={player.id} current={elimId} onSelect={handleSetElimId} />
              ))}
            </div>
          </div>
          <div>
            <span className="rdlbl" style={{ display: "block", marginBottom: "6px" }}>
              {t("mercyCaused")}
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {active
                .filter((player) => player.id !== elimId)
                .map((player) => (
                  <SelectorButton
                    key={player.id}
                    label={player.name}
                    value={player.id}
                    current={causerId}
                    onSelect={handleSetCauserId}
                    color="#FF8C00"
                  />
                ))}
            </div>
          </div>
          <button
            className="btnpri"
            style={{ "--gc": "#E63946", fontSize: ".9rem", padding: "10px" } as CSSProperties & Record<"--gc", string>}
            disabled={!canConfirm}
            onClick={() => {
              haptic("strong");
              onEliminate(elimId, causerId);
              setElimId("");
              setCauserId("");
              onPendingChange?.(false);
              setOpen(false);
            }}
          >
            {t("confirmElim")}
          </button>
        </div>
      )}
    </div>
  );
}
