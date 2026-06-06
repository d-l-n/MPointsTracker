import { useEffect, useState } from "react";

function readOnlineStatus(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(readOnlineStatus);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const reconcile = () => setIsOnline(readOnlineStatus());

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("focus", reconcile);
    document.addEventListener("visibilitychange", reconcile);

    const intervalId = window.setInterval(reconcile, 1000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("focus", reconcile);
      document.removeEventListener("visibilitychange", reconcile);
      window.clearInterval(intervalId);
    };
  }, []);

  return isOnline;
}
