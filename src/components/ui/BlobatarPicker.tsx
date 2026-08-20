import { useState, useMemo, useEffect } from "react";
import { Check } from "reicon-react";
import { getBlobatarUri, AVATAR_HUES, AVATAR_SHAPES } from "../../lib/blobatar";

const HUE_COLORS: Record<number, string> = {
  12: "#e9d0d2",
  56: "#e7d3c6",
  100: "#dbd8c4",
  144: "#cdddcc",
  188: "#c4dedb",
  232: "#c6dbe7",
  276: "#d2d6ea",
  320: "#e0d2e3",
};
import { type TranslationFn } from "../../types";

interface BlobatarPickerProps {
  seed: string;
  value: string | null;
  onChange: (uri: string) => void;
  onCancel: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  t: TranslationFn;
  disabled?: boolean;
}

export default function BlobatarPicker({ seed, value, onChange, onCancel, onDirtyChange, t, disabled }: BlobatarPickerProps) {
  const initialHue = useMemo(() => {
    if (!value) return AVATAR_HUES[0];
    const match = AVATAR_SHAPES.find((s) => getBlobatarUri(seed, { hue: AVATAR_HUES[0], traits: { shape: s.position } }) === value);
    if (match) return AVATAR_HUES[0];
    for (const h of AVATAR_HUES) {
      if (AVATAR_SHAPES.some((s) => getBlobatarUri(seed, { hue: h, traits: { shape: s.position } }) === value)) return h;
    }
    return AVATAR_HUES[0];
  }, [seed, value]);

  const initialShape = useMemo(() => {
    if (!value) return null;
    const match = AVATAR_SHAPES.find((s) => getBlobatarUri(seed, { hue: initialHue, traits: { shape: s.position } }) === value);
    return match?.name ?? null;
  }, [seed, value, initialHue]);

  const [hue, setHue] = useState(initialHue);
  const [selectedShape, setSelectedShape] = useState<string | null>(initialShape);
  const [dirty, setDirty] = useState(false);

  const previewUri = useMemo(() => {
    const shape = AVATAR_SHAPES.find((s) => s.name === selectedShape);
    return getBlobatarUri(seed, { hue, traits: { shape: shape?.position ?? AVATAR_SHAPES[0]!.position } });
  }, [seed, hue, selectedShape]);

  const hasChanged = dirty && previewUri !== value;

  useEffect(() => { onDirtyChange?.(hasChanged); }, [hasChanged, onDirtyChange]);

  return (
    <div className="blobatar-picker">
      <div className="blobatar-picker-preview">
        <img src={previewUri} alt="" className="blobatar-picker-preview-img" />
      </div>

      <div className="blobatar-picker-section">
        <div className="blobatar-picker-label">{t("avatarColor")}</div>
        <div className="blobatar-picker-colors" role="group" aria-label={t("avatarColor")}>
          {AVATAR_HUES.map((h, i) => (
            <button
              key={h}
              type="button"            className={`blobatar-picker-swatch${h === hue ? " is-active" : ""}`}
            aria-label={`${t("avatarColor")} ${i + 1}`}
            aria-pressed={h === hue}
            disabled={disabled}
            style={{ background: HUE_COLORS[h] ?? "var(--bg3)" }}
            onClick={() => { setHue(h); setDirty(true); }}
          />
          ))}
        </div>
      </div>

      <div className="blobatar-picker-section">
        <div className="blobatar-picker-label">{t("avatarShape")}</div>
        <div className="blobatar-picker-grid" role="group" aria-label={t("avatarShape")}>
          {AVATAR_SHAPES.map((shape) => {
            const uri = getBlobatarUri(seed, { hue, traits: { shape: shape.position } });
            const isActive = selectedShape === shape.name;
            return (
              <button
                key={shape.name}
                type="button"
                className={`blobatar-picker-cell${isActive ? " is-active" : ""}`}
                aria-label={`${t("avatarShape")} ${shape.name}`}
                aria-pressed={isActive}
                disabled={disabled}
                onClick={() => { setSelectedShape(shape.name); setDirty(true); }}
              >
                <img src={uri} alt="" />
                {isActive && <span className="blobatar-picker-check blobatar-picker-check--cell"><Check /></span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="blobatar-picker-actions">
        <button
          type="button"
          className="btnpri blobatar-picker-confirm"
          disabled={disabled || !hasChanged}
          onClick={() => onChange(previewUri)}
        >
          {t("save")}
        </button>
        <button
          type="button"
          className="btnsec blobatar-picker-cancel"
          disabled={disabled}
          onClick={onCancel}
        >
          {t("cancel")}
        </button>
      </div>
    </div>
  );
}
