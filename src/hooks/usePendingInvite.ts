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
  const [invitePromptOpen, setInvitePromptOpen] = useState(false);
  const pendingInviteRef = useRef<PendingInvite | null>(null);

  useEffect(() => {
    pendingInviteRef.current = pendingInvite;
  }, [pendingInvite]);

  // Decline: cierra el prompt y descarta la invitación por completo.
  const declinePendingInvite = useCallback(() => {
    setInvitePromptOpen(false);
    pendingInviteRef.current = null;
    setPendingInvite(null);
  }, []);

  // Accept: cierra el prompt pero conserva la invitación para que
  // LinkedPlayerInput la reclame al crear la próxima partida.
  const acceptPendingInvite = useCallback(() => {
    const invite = pendingInviteRef.current;
    if (!invite) {
      setInvitePromptOpen(false);
      return;
    }
    setInvitePromptOpen(false);
    showToast(t("inviteJoinDone").replace("{name}", invite.displayName));
  }, [showToast, t]);

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
        setInvitePromptOpen(true);
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

  return { pendingInvite, invitePromptOpen, acceptPendingInvite, declinePendingInvite, claimPendingInvite };
}
