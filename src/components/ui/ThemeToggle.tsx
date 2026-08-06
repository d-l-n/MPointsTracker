import { useRef } from "react";

import { Moon, Sun } from "reicon-react";

interface ThemeToggleProps {
  dark: boolean;
  onChange?: () => void;
  onLongPress?: () => void;
  t?: (key: string) => string;
}

export default function ThemeToggle({ dark, onChange, onLongPress, t = (key) => key }: ThemeToggleProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);

  const startPress = () => {
    firedRef.current = false;
    if (onLongPress) {
      timerRef.current = setTimeout(() => {
        firedRef.current = true;
        onLongPress();
      }, 600);
    }
  };

  const endPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  const handleClick = () => {
    if (!firedRef.current) onChange?.();
  };

  return (
    <button
      onClick={handleClick}
      onPointerDown={startPress}
      onPointerUp={endPress}
      onPointerLeave={endPress}
      title={dark ? t("themeToggleLight") : t("themeToggleDark")}
      aria-label={dark ? t("themeToggleLight") : t("themeToggleDark")}
      style={{
        width: 28, height: 28, borderRadius: "50%",
        border: "1.5px solid var(--bo2)", background: "var(--bg3)",
        color: "var(--tx)", fontSize: "1rem", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, lineHeight: 1,
        WebkitUserSelect: "none", userSelect: "none",
      }}
      >{dark ? <Moon size={18} /> : <Sun size={18} />}</button>
  );
}
