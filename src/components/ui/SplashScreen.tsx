import { useEffect, useState } from "react";

import BootShell from "./BootShell";

interface SplashScreenProps {
  dark: boolean;
  onDone: () => void;
  t?: (key: string) => string;
}

export default function SplashScreen({ dark, onDone, t = (key) => key }: SplashScreenProps) {
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    const hideTimer = setTimeout(() => setHiding(true), 1600);
    const doneTimer = setTimeout(() => onDone(), 2050);
    return () => {
      clearTimeout(hideTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div className={`splash ${dark ? "dark-splash" : "light-splash"}${hiding ? " hiding" : ""}`}>
      <BootShell
        stage="splash"
        copy={t("splashCopy")}
      />
    </div>
  );
}
