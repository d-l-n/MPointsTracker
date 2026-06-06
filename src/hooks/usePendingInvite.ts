import { useCallback, useEffect, useRef, useState } from "react";

import {
  clearInviteFromUrl,
  getInviteCodeFromUrl,
  resolveInvite as resolveInviteCode,
} from "../lib/inviteService";
import type { PendingInvite, TranslationFn } from "../types";

interface UsePendingInviteOptions {
  showToast: (msg: string, duration?: number) => void;
  t: TranslationFn;
}

export function usePendingInvite({ showToast, t }: UsePendingInviteOptions) {
  const [pendingInvite, setPendingInvite] = useState<PendingInvite | null>(null);
  const pendingInviteRef = useRef<PendingInvite | null>(null);

  useEffect(() => {
    pendingInviteRef.current = pendingInvite;
  }, [pendingInvite]);

  const dismissPendingInvite = useCallback(() => {
    pendingInviteRef.current = null;
    setPendingInvite(null);
  }, []);

  const claimPendingInvite = useCallback((): PendingInvite | null => {
    const invite = pendingInviteRef.current;
    if (!invite) return null;

    pendingInviteRef.current = null;
    setPendingInvite(null);
    return invite;
  }, []);

  useEffect(() => {
    const code = getInviteCodeFromUrl();
    if (!code) return;

    clearInviteFromUrl();
    let cancelled = false;

    const loadInvite = async () => {
      const invite = (await resolveInviteCode(code)) as PendingInvite | null;
      if (cancelled) return;

      if (invite) {
        setPendingInvite(invite);
        showToast(`${invite.displayName} ${t("inviteReady")}`);
        return;
      }

      showToast(t("inviteExpiredOrInvalid"));
    };

    void loadInvite().catch(() => {
      if (!cancelled) showToast(t("inviteExpiredOrInvalid"));
    });

    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { pendingInvite, dismissPendingInvite, claimPendingInvite };
}
