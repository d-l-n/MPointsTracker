import { useState } from "react";
import { getBlobatarUri, AVATAR_HUES, AVATAR_SHAPES } from "../../lib/blobatar";
import { type TranslationFn } from "../../types";

interface BlobatarPickerProps {
  seed: string;
  value: string | null;
  onChange: (uri: string) => void;
  t: TranslationFn;
  disabled?: boolean;
}

export default function BlobatarPicker({ seed, value, onChange, t, disabled }: BlobatarPickerProps) {
  const [hue, setHue] = useState(AVATAR_HUES[0]);
  return (
    <div className="blobatar-picker">
      <div className="blobatar-picker-colors" role="group" aria-label={t("avatarColor")}>
        {AVATAR_HUES.map((h, i) => (
          <button
            key={h}
            type="button"
            className="blobatar-picker-swatch"
            aria-label={`${t("avatarColor")} ${i + 1}`}
            aria-pressed={h === hue}
            disabled={disabled}
            onClick={() => setHue(h)}
          >
            <img src={getBlobatarUri(seed, { hue: h, traits: { shape: AVATAR_SHAPES[4]!.position } })} alt="" />
          </button>
        ))}
      </div>
      <div className="blobatar-picker-grid" role="group" aria-label={t("avatarShape")}>
        {AVATAR_SHAPES.map((shape) => {
          const uri = getBlobatarUri(seed, { hue, traits: { shape: shape.position } });
          return (
            <button
              key={shape.name}
              type="button"
              className="blobatar-picker-cell"
              aria-label={`${t("avatarShape")} ${shape.name}`}
              aria-pressed={value === uri}
              disabled={disabled}
              onClick={() => onChange(uri)}
            >
              <img src={uri} alt="" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
