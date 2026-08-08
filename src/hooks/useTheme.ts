import { useCallback, useEffect, useState } from "react";

import { load } from "../lib/storage";
import type {
  ActiveTheme,
  AppStorageData,
  DynamicThemeContract,
  DynamicThemeRoles,
  ThemeAccentMode,
  ThemeMode,
} from "../types";

const THEME_MODE_KEY = "bgt_theme_mode";
const THEME_ACCENT_KEY = "bgt_theme_accent";
const THEME_CUSTOM_ACCENT_KEY = "bgt_theme_custom_accent";
const DEFAULT_CUSTOM_ACCENT = "#006d77";
const REDUCE_EFFECTS_KEY = "bgt_reduce_effects";
const OLED_KEY = "bgt_oled";
const THEME_MODE_CHANGE_EVENT = "bgt:theme-mode-change";
const DYNAMIC_THEME_EVENT = "bgt:dynamic-theme-change";
const DYNAMIC_THEME_ROLE_KEYS: Array<keyof DynamicThemeRoles> = [
  "primary",
  "onPrimary",
  "primaryContainer",
  "onPrimaryContainer",
  "secondary",
  "onSecondary",
  "secondaryContainer",
  "onSecondaryContainer",
  "tertiary",
  "onTertiary",
  "tertiaryContainer",
  "onTertiaryContainer",
  "surface",
  "surfaceVariant",
  "onSurface",
  "onSurfaceVariant",
  "outline",
  "error",
  "onError",
];

function getSystemPreference(query: string): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(query).matches;
}

function readThemeMode(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_MODE_KEY);
    if (saved === "light" || saved === "dark" || saved === "system") return saved;
  } catch {
    // Ignore storage failures and fall back to legacy storage.
  }

  const data = load() as AppStorageData;
  if (data.__theme !== undefined) return data.__theme ? "dark" : "light";
  return "system";
}

function readThemeAccent(): ThemeAccentMode {
  try {
    const saved = localStorage.getItem(THEME_ACCENT_KEY);
    if (saved === "monet" || saved === "custom") return saved;
  } catch {
    // Ignore storage failures and fall back to the default accent.
  }
  return "default";
}

function readCustomAccent(): string {
  try {
    const saved = localStorage.getItem(THEME_CUSTOM_ACCENT_KEY);
    if (saved && /^#[0-9a-f]{6}$/i.test(saved)) return saved;
  } catch {
    // Ignore storage failures and fall back to the default accent.
  }
  return DEFAULT_CUSTOM_ACCENT;
}

/**
 * Returns the most readable text color (white or black) for a given hex background
 * using the WCAG relative-luminance threshold (0.179), the same split point used
 * by Material for `onPrimary`-style roles.
 */
export function readableOnColor(hex: string): string {
  const normalized = /^#[0-9a-f]{6}$/i.test(hex) ? hex : DEFAULT_CUSTOM_ACCENT;
  const channel = (index: number) => parseInt(normalized.slice(1 + index * 2, 3 + index * 2), 16) / 255;
  const linearize = (value: number) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  const luminance =
    0.2126 * linearize(channel(0)) +
    0.7152 * linearize(channel(1)) +
    0.0722 * linearize(channel(2));
  return luminance > 0.179 ? "#0a0a0a" : "#ffffff";
}


function readReduceEffects(): boolean | null {
  try {
    const saved = localStorage.getItem(REDUCE_EFFECTS_KEY);
    if (saved === "1") return true;
    if (saved === "0") return false;
  } catch {
    // Ignore storage failures and fall back to system preference.
  }

  return null;
}

function readOledEnabled(): boolean {
  try {
    return localStorage.getItem(OLED_KEY) === "1";
  } catch {
    return false;
  }
}

function isDynamicThemeRoles(value: unknown): value is DynamicThemeRoles {
  if (!value || typeof value !== "object") return false;

  return DYNAMIC_THEME_ROLE_KEYS.every((key) => {
    const roleValue = (value as Record<string, unknown>)[key];
    return typeof roleValue === "string" && roleValue.trim().length > 0;
  });
}

function readDynamicThemeContract(): DynamicThemeContract | null {
  if (typeof window === "undefined") return null;

  const dynamicTheme = (
    window as Window & { __BGT_DYNAMIC_THEME__?: unknown }
  ).__BGT_DYNAMIC_THEME__;

  if (!dynamicTheme || typeof dynamicTheme !== "object") return null;

  const contract = dynamicTheme as Record<string, unknown>;
  if (contract.source !== "android-dynamic-color") return null;
  if (!isDynamicThemeRoles(contract.roles)) return null;

  return {
    source: "android-dynamic-color",
    roles: contract.roles,
    version: typeof contract.version === "string" || typeof contract.version === "number"
      ? contract.version
      : undefined,
    updatedAt: typeof contract.updatedAt === "number" ? contract.updatedAt : undefined,
  };
}

export function useTheme() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(readThemeMode);
  const [themeAccentMode, setThemeAccentMode] = useState<ThemeAccentMode>(readThemeAccent);
  const [themeCustomAccent, setThemeCustomAccent] = useState<string>(readCustomAccent);
  const [reduceEffects, setReduceEffects] = useState<boolean | null>(readReduceEffects);
  const [oledEnabled, setOledEnabled] = useState<boolean>(readOledEnabled);
  const [dynamicThemeContract, setDynamicThemeContract] = useState<DynamicThemeContract | null>(readDynamicThemeContract);
  const [systemDark, setSystemDark] = useState<boolean>(
    () => getSystemPreference("(prefers-color-scheme: dark)"),
  );
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(
    () => getSystemPreference("(prefers-reduced-motion: reduce)"),
  );

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);

    setSystemDark(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches);

    setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleDynamicThemeChange = () => {
      setDynamicThemeContract(readDynamicThemeContract());
    };

    handleDynamicThemeChange();
    window.addEventListener(DYNAMIC_THEME_EVENT, handleDynamicThemeChange);

    return () => window.removeEventListener(DYNAMIC_THEME_EVENT, handleDynamicThemeChange);
  }, []);

  const dark = themeMode === "system" ? systemDark : themeMode === "dark";
  const reduceEffectsEnabled = reduceEffects ?? prefersReducedMotion;
  const activeTheme: ActiveTheme = dark ? (oledEnabled ? "oled" : "dark") : "light";
  const dynamicThemeRoles = themeAccentMode === "monet" ? dynamicThemeContract?.roles ?? null : null;

  const handleThemeMode = useCallback((mode: ThemeMode) => {
    setThemeMode(mode);
    try {
      localStorage.setItem(THEME_MODE_KEY, mode);
    } catch {
      // Ignore write failures when storage is unavailable.
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleThemeModeChange = (event: Event) => {
      const mode = (event as CustomEvent<ThemeMode>).detail;
      if (mode === "light" || mode === "dark" || mode === "system") {
        handleThemeMode(mode);
      }
    };

    window.addEventListener(THEME_MODE_CHANGE_EVENT, handleThemeModeChange);
    return () => window.removeEventListener(THEME_MODE_CHANGE_EVENT, handleThemeModeChange);
  }, [handleThemeMode]);

  const handleThemeAccentMode = useCallback((mode: ThemeAccentMode) => {
    setThemeAccentMode(mode);
    try {
      localStorage.setItem(THEME_ACCENT_KEY, mode);
    } catch {
      // Ignore write failures when storage is unavailable.
    }
  }, []);

  const handleThemeCustomAccent = useCallback((hex: string) => {
    const normalized = /^#[0-9a-f]{6}$/i.test(hex) ? hex : DEFAULT_CUSTOM_ACCENT;
    setThemeCustomAccent(normalized);
    try {
      localStorage.setItem(THEME_CUSTOM_ACCENT_KEY, normalized);
    } catch {
      // Ignore write failures when storage is unavailable.
    }
  }, []);

  const handleToggleReduceEffects = useCallback((value: boolean) => {
    setReduceEffects(value);
    try {
      localStorage.setItem(REDUCE_EFFECTS_KEY, value ? "1" : "0");
    } catch {
      // Ignore write failures when storage is unavailable.
    }
  }, []);

  const handleToggleOled = useCallback((value: boolean) => {
    setOledEnabled(value);
    try {
      localStorage.setItem(OLED_KEY, value ? "1" : "0");
    } catch {
      // Ignore write failures when storage is unavailable.
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    root.dataset.theme = activeTheme;
    root.dataset.themeAccent = themeAccentMode;
    if (dynamicThemeRoles && dynamicThemeContract) root.dataset.themeSource = dynamicThemeContract.source;
    else delete root.dataset.themeSource;
    // Expose the user-picked hex as inline custom properties so the CSS
    // `html[data-theme-accent="custom"]` block can derive every accent role
    // (containers via color-mix, on-primary via luminance).
    if (themeAccentMode === "custom") {
      root.style.setProperty("--theme-custom-accent", themeCustomAccent);
      root.style.setProperty("--theme-custom-on-accent", readableOnColor(themeCustomAccent));
    } else {
      root.style.removeProperty("--theme-custom-accent");
      root.style.removeProperty("--theme-custom-on-accent");
    }
    root.classList.toggle("dark", dark);
    root.classList.toggle("light", !dark);
    root.classList.toggle("oled", activeTheme === "oled");
    root.classList.toggle("reduced-effects", reduceEffectsEnabled);
    root.classList.toggle("full-effects", reduceEffects === false);
  }, [activeTheme, dark, dynamicThemeContract, dynamicThemeRoles, reduceEffects, reduceEffectsEnabled, themeAccentMode, themeCustomAccent]);

  return {
    activeTheme,
    dark,
    oledEnabled,
    reduceEffectsEnabled,
    themeMode,
    themeAccentMode,
    themeCustomAccent,
    dynamicThemeRoles,
    handleThemeMode,
    handleThemeAccentMode,
    handleThemeCustomAccent,
    handleToggleOled,
    handleToggleReduceEffects,
  };
}
