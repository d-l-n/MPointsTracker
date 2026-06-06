import { useCallback, useState } from "react";

import type { DebugLogEntry } from "../types";

export function useDebugLog() {
  const [logs, setLogs] = useState<DebugLogEntry[]>([]);

  const addLog = useCallback((msg: string, type = "ok") => {
    const entry: DebugLogEntry = {
      msg: `[${new Date().toLocaleTimeString()}] ${msg}`,
      type,
      id: Date.now() + Math.random(),
    };
    setLogs((prev) => [...prev.slice(-30), entry]);
    if (import.meta.env.DEV) {
      console.log(`[Debug] ${msg}`);
    }
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  return { logs, addLog, clearLogs };
}
