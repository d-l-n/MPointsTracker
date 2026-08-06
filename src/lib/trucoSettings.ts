export type TrucoTallyStyle = "fosforitos" | "palitos" | "numerico";
export type TrucoBoardTheme = "classic" | "wood" | "minimal";

export interface TrucoSettings {
  style: TrucoTallyStyle;
  theme: TrucoBoardTheme;
  presets: boolean;
}

const STORAGE_KEY_STYLE = "bgt_truco_style";
const STORAGE_KEY_THEME = "bgt_truco_theme";
const STORAGE_KEY_PRESETS = "bgt_truco_presets";

export function getTrucoSettings(): TrucoSettings {
  try {
    const rawStyle = localStorage.getItem(STORAGE_KEY_STYLE);
    const rawTheme = localStorage.getItem(STORAGE_KEY_THEME);
    const rawPresets = localStorage.getItem(STORAGE_KEY_PRESETS);

    const style: TrucoTallyStyle =
      rawStyle === "palitos" || rawStyle === "numerico" ? rawStyle : "fosforitos";

    const theme: TrucoBoardTheme =
      rawTheme === "wood" || rawTheme === "minimal" ? rawTheme : "classic";

    const presets = rawPresets !== "0";

    return { style, theme, presets };
  } catch {
    return { style: "fosforitos", theme: "classic", presets: true };
  }
}

export function saveTrucoSettings(settings: Partial<TrucoSettings>): TrucoSettings {
  const current = getTrucoSettings();
  const next = { ...current, ...settings };

  try {
    localStorage.setItem(STORAGE_KEY_STYLE, next.style);
    localStorage.setItem(STORAGE_KEY_THEME, next.theme);
    localStorage.setItem(STORAGE_KEY_PRESETS, next.presets ? "1" : "0");
  } catch {
    // ignore local storage errors
  }

  return next;
}
