import { useCallback, useEffect, useRef, useState } from "react";

import type { ToastState } from "../types";

export function useToast() {
  const [toast, setToast] = useState<ToastState>({ msg: "", show: false });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    setToast((currentToast) => ({ ...currentToast, show: false }));
  }, []);

  const showToast = useCallback((msg: string, duration = 2400, action?: { label: string; onAction: () => void }) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({
      msg,
      show: true,
      ...(action ? { actionLabel: action.label, onAction: action.onAction } : {}),
    });
    timerRef.current = setTimeout(() => {
      setToast((currentToast) => ({ ...currentToast, show: false }));
      timerRef.current = null;
    }, duration);
  }, []);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return { toast, showToast };
}
