import { useCallback, useState } from "react";

const HAPTIC_KEY = "bgt_haptic";

export function useHaptic() {
  const [hapticEnabled, setHapticEnabledState] = useState(() => {
    try {
      return localStorage.getItem(HAPTIC_KEY) !== "0";
    } catch {
      return true;
    }
  });

  const setHapticEnabled = useCallback((enabled: boolean) => {
    setHapticEnabledState(Boolean(enabled));
    try {
      localStorage.setItem(HAPTIC_KEY, enabled ? "1" : "0");
    } catch {
      // storage unavailable
    }
  }, []);

  return { hapticEnabled, setHapticEnabled };
}
