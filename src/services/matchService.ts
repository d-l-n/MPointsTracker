import { addDoc, collection } from "firebase/firestore";

import { fbDb } from "../lib/firebase";
import type { Match, SharedMatchRecipient } from "../types";

interface SharedByUser {
  uid?: string | null;
  displayName?: string | null;
  email?: string | null;
}

export interface ShareResult {
  attempted: number;
  shared: number;
  failed: number;
  skipped: number;
  /** Fallos por red (retryables) — el resto de `failed` son definitivos (rules, etc.) */
  retryable: number;
}

const EMPTY_SHARE_RESULT: ShareResult = { attempted: 0, shared: 0, failed: 0, skipped: 0, retryable: 0 };

// Firestore error codes that mean "transient network/server problem, retry later".
const RETRYABLE_ERROR_CODES = new Set([
  "unavailable",
  "network-request-failed",
  "deadline-exceeded",
  "internal",
  "resource-exhausted",
]);

export const isRetryableShareError = (reason: unknown): boolean => {
  const code = reason && typeof reason === "object" && "code" in reason
    ? String((reason as { code: unknown }).code)
    : "";
  return RETRYABLE_ERROR_CODES.has(code);
};

export const shareMatchWithPlayers = async (
  gameId: string,
  match: Match & Record<string, unknown>,
  linkedPlayers: SharedMatchRecipient[],
  sharedBy: SharedByUser | null | undefined,
): Promise<ShareResult> => {
  if (!linkedPlayers || linkedPlayers.length === 0) return EMPTY_SHARE_RESULT;

  const {
    _gameId: _g,
    _sharedBy: _sb,
    _sharedByUid: _sbu,
    _sharedAt: _sa,
    ...cleanMatch
  } = match;

  const sharedMatch = {
    ...cleanMatch,
    _gameId: gameId,
    _sharedBy: sharedBy?.displayName || sharedBy?.email || "Alguien",
    _sharedByUid: sharedBy?.uid || null,
    _sharedAt: Date.now(),
  };

  const shareablePlayers = linkedPlayers.filter(
    (linkedPlayer) => linkedPlayer.uid && linkedPlayer.uid !== sharedBy?.uid,
  );
  const skipped = linkedPlayers.length - shareablePlayers.length;
  if (shareablePlayers.length === 0) {
    return { attempted: 0, shared: 0, failed: 0, skipped, retryable: 0 };
  }

  const results = await Promise.allSettled(
    shareablePlayers.map((linkedPlayer) =>
      addDoc(collection(fbDb, "users", linkedPlayer.uid as string, "shared_matches"), sharedMatch),
    ),
  );

  let failed = 0;
  let retryable = 0;
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      failed += 1;
      if (isRetryableShareError(result.reason)) retryable += 1;
      const reason = result.reason && typeof result.reason === "object" && "code" in result.reason
        ? result.reason.code
        : result.reason;
      console.warn(`[matchService] Error sharing with player ${index}:`, reason);
    }
  });

  return {
    attempted: shareablePlayers.length,
    shared: results.length - failed,
    failed,
    skipped,
    retryable,
  };
};

// ── Pending share queue (offline retry) ─────────────────────────────────────
// If a share fails because the network is down, the match + recipients are kept
// in localStorage and retried on reconnect/login/next save instead of being
// silently lost. Entries are dropped once every recipient write succeeds (or a
// non-retryable error like permission-denied makes retrying pointless).

export interface PendingShare {
  gameId: string;
  match: Match & Record<string, unknown>;
  recipients: SharedMatchRecipient[];
  sharedBy: SharedByUser | null | undefined;
  createdAt: number;
}

const PENDING_SHARES_KEY = "bgt_pending_shares";

const readPendingShares = (): PendingShare[] => {
  try {
    const raw = window.localStorage.getItem(PENDING_SHARES_KEY);
    return raw ? (JSON.parse(raw) as PendingShare[]) : [];
  } catch {
    return [];
  }
};

const writePendingShares = (queue: PendingShare[]): void => {
  try {
    if (queue.length === 0) window.localStorage.removeItem(PENDING_SHARES_KEY);
    else window.localStorage.setItem(PENDING_SHARES_KEY, JSON.stringify(queue));
  } catch (error) {
    console.warn("[matchService] pending shares persist error:", error);
  }
};

export const getPendingShares = (): PendingShare[] => readPendingShares();

export const enqueuePendingShare = (share: Omit<PendingShare, "createdAt">): void => {
  const queue = readPendingShares();
  queue.push({ ...share, createdAt: Date.now() });
  writePendingShares(queue);
};

export const flushPendingShares = async (): Promise<{ flushed: number; stillPending: number }> => {
  const queue = readPendingShares();
  if (queue.length === 0) return { flushed: 0, stillPending: 0 };

  let flushed = 0;
  const remaining: PendingShare[] = [];
  for (const entry of queue) {
    const result = await shareMatchWithPlayers(entry.gameId, entry.match, entry.recipients, entry.sharedBy);
    if (result.failed > 0 && result.retryable === result.failed) {
      // Todos los fallos fueron por red → reintentar en el próximo flush.
      remaining.push(entry);
    } else {
      // Éxito, o fallo no retryable (permission-denied no se arregla solo) → descartar.
      flushed += 1;
    }
  }
  writePendingShares(remaining);
  return { flushed, stillPending: remaining.length };
};