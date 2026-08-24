import { useCallback, useEffect, useRef, useState } from "react";

import {
  acceptInvite,
  clearInviteFromUrl,
  getInviteCodeFromUrl,
  resolveInvite as resolveInviteCode,
} from "../lib/inviteService";
import type { PendingInvite, TranslationFn } from "../types";

interface InviteUser {
  uid?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}

interface UsePendingInviteOptions {
  showToast: (msg: string, duration?: number) => void;
  t: TranslationFn;
  user: InviteUser | null | undefined;
}

export function usePendingInvite({ showToast, t, user }: UsePendingInviteOptions) {
  const [pendingInvite, setPendingInvite] = useState<PendingInvite | null>(null);
  const [invitePromptOpen, setInvitePromptOpen] = useState(false);
  const pendingInviteRef = useRef<PendingInvite | null>(null);
  const inviteCodeRef = useRef<string | null>(null);
  const userRef = useRef(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    pendingInviteRef.current = pendingInvite;
  }, [pendingInvite]);

  // Decline: cierra el prompt y descarta la invitación por completo.
  const declinePendingInvite = useCallback(() => {
    setInvitePromptOpen(false);
    pendingInviteRef.current = null;
    inviteCodeRef.current = null;
    setPendingInvite(null);
  }, []);

  // Accept: cierra el prompt pero conserva la invitación para que
  // LinkedPlayerInput la reclame al crear la próxima partida. Además
  // reporta la aceptación al invite del host (best-effort: en modo
  // invitado sin sesión o offline el write falla y no afecta la UX).
  const acceptPendingInvite = useCallback(() => {
    const invite = pendingInviteRef.current;
    if (!invite) {
      setInvitePromptOpen(false);
      return;
    }
    setInvitePromptOpen(false);
    showToast(t("inviteJoinDone").replace("{name}", invite.displayName));

    const code = inviteCodeRef.current;
    if (code && userRef.current?.uid) {
      acceptInvite(code, userRef.current).catch((error) => {
        console.warn("[usePendingInvite] acceptance write-back failed:", error);
      });
    }
  }, [showToast, t]);

  const claimPendingInvite = useCallback((): PendingInvite | null => {
    const invite = pendingInviteRef.current;
    if (!invite) return null;

    pendingInviteRef.current = null;
    inviteCodeRef.current = null;
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
        inviteCodeRef.current = code;
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
