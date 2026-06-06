import { useCallback, useEffect, useRef, useState } from "react";

const WAKE_LOCK_KEY = "bgt_wakelock";

type WakeLockSentinelLike = {
  release: () => Promise<void>;
};

type NavigatorWithWakeLock = Navigator & {
  wakeLock?: {
    request: (type: "screen") => Promise<WakeLockSentinelLike>;
  };
};

export function useWakeLock(selected: string | null) {
  const [wakeLockEnabled, setWakeLockEnabledState] = useState(() => {
    try {
      return localStorage.getItem(WAKE_LOCK_KEY) === "1";
    } catch {
      return false;
    }
  });
  const wakeLockRef = useRef<WakeLockSentinelLike | null>(null);

  const setWakeLockEnabled = useCallback((enabled: boolean) => {
    setWakeLockEnabledState(Boolean(enabled));
    try {
      localStorage.setItem(WAKE_LOCK_KEY, enabled ? "1" : "0");
    } catch {
      // storage unavailable
    }
  }, []);

  useEffect(() => {
    const acquire = async () => {
      const nextNavigator = navigator as NavigatorWithWakeLock;
      if (wakeLockEnabled && selected && nextNavigator.wakeLock) {
        try {
          wakeLockRef.current = await nextNavigator.wakeLock.request("screen");
        } catch {
          // not supported
        }
      } else if (wakeLockRef.current) {
        try {
          await wakeLockRef.current.release();
          wakeLockRef.current = null;
        } catch {
          // already released
        }
      }
    };

    void acquire();
    return () => {
      if (wakeLockRef.current) {
        void wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [selected, wakeLockEnabled]);

  return { wakeLockEnabled, setWakeLockEnabled };
}
