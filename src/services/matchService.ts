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

// ── Cross-user deletion ─────────────────────────────────────────────────────
// When a match that was shared with registered players is deleted, the owner
// (or any participant) drops a "tombstone" doc in each recipient's
// shared_matches subcollection. Recipients pick it up on their next pull and
// remove the match from their local store, so the record disappears for
// everyone instead of only for the person who deleted it.

export interface DeleteShareResult {
  notified: number;
  failed: number;
}

export const deleteSharedMatchForRecipients = async (
  gameId: string,
  matchId: string | undefined | null,
  recipientUids: Array<string | null | undefined> | undefined,
  deletedByUid: string | null | undefined,
): Promise<DeleteShareResult> => {
  if (!matchId) return { notified: 0, failed: 0 };

  const targets = Array.from(
    new Set((recipientUids || []).filter((uid): uid is string => Boolean(uid) && uid !== deletedByUid)),
  );
  if (targets.length === 0) return { notified: 0, failed: 0 };

  const results = await Promise.allSettled(
    targets.map((uid) =>
      addDoc(collection(fbDb, "users", uid, "shared_matches"), {
        _deleted: true,
        _gameId: gameId,
        _matchId: matchId,
        _deletedBy: deletedByUid || null,
        _deletedAt: Date.now(),
      }),
    ),
  );

  const failed = results.filter((result) => result.status === "rejected").length;
  return { notified: targets.length - failed, failed };
};

// ── Cross-user edits ────────────────────────────────────────────────────────
// When a match that was shared with registered players is edited, the editor
// drops an updated copy in each recipient's shared_matches subcollection.
// Recipients pick it up on their next pull and replace their local copy
// (mergeSharedMatchLists compares `_sharedAt` timestamps), so the edit
// propagates to everyone instead of only the person who made it.

export interface UpdateShareResult {
  notified: number;
  failed: number;
}

export const updateSharedMatchForRecipients = async (
  gameId: string,
  match: (Match & Record<string, unknown>) | null | undefined,
  recipientUids: Array<string | null | undefined> | undefined,
  editorUid: string | null | undefined,
  editorName?: string | null,
): Promise<UpdateShareResult> => {
  if (!match || !match.id) return { notified: 0, failed: 0 };

  const targets = Array.from(
    new Set((recipientUids || []).filter((uid): uid is string => Boolean(uid) && uid !== editorUid)),
  );
  if (targets.length === 0) return { notified: 0, failed: 0 };

  const {
    _gameId: _g,
    _sharedBy: _sb,
    _sharedByUid: _sbu,
    _sharedAt: _sa,
    _deleted: _d,
    _matchId: _mi,
    ...cleanMatch
  } = match;

  const updatedCopy = {
    ...cleanMatch,
    _gameId: gameId,
    _sharedBy: _sb || editorName || "Alguien",
    _sharedByUid: _sbu || editorUid || null,
    _sharedAt: Date.now(),
  };

  const results = await Promise.allSettled(
    targets.map((uid) =>
      addDoc(collection(fbDb, "users", uid, "shared_matches"), updatedCopy),
    ),
  );

  const failed = results.filter((result) => result.status === "rejected").length;
  return { notified: targets.length - failed, failed };
};

// ── Shared-match merge (replace-by-newer) ───────────────────────────────────
// Recipients pull shared_matches docs and merge them into their local store.
// An updated copy of a match carries the same `id` as the local one, so a plain
// "add if missing" merge would silently drop the edit. This helper replaces an
// existing entry only when the incoming copy is newer (by `_sharedAt`); ties
// keep the local copy. Multiple incoming copies of the same id within one pull
// are applied in ascending `_sharedAt` order so the newest wins
// (last-write-wins). Existing entries keep their position; new ones append.

export const mergeSharedMatchLists = (
  existing: Array<Match & Record<string, unknown>>,
  incoming: Array<Match & Record<string, unknown>>,
): Array<Match & Record<string, unknown>> => {
  const byId = new Map<string, Match & Record<string, unknown>>();
  existing.forEach((match) => {
    if (match.id) byId.set(match.id, match);
  });
  const sorted = [...incoming].sort(
    (a, b) => Number(a._sharedAt || 0) - Number(b._sharedAt || 0),
  );
  for (const candidate of sorted) {
    if (!candidate.id) continue;
    const current = byId.get(candidate.id);
    if (!current || Number(candidate._sharedAt || 0) > Number(current._sharedAt || 0)) {
      byId.set(candidate.id, candidate);
    }
  }
  // Existing order preserved; id-less existing entries kept in place; incoming
  // ids that were never present append (first-seen order, ascending _sharedAt).
  const knownIds = new Set(existing.map((match) => match.id).filter(Boolean));
  const merged = existing.map((match) => (match.id ? byId.get(match.id) ?? match : match));
  for (const candidate of sorted) {
    if (!candidate.id || knownIds.has(candidate.id)) continue;
    knownIds.add(candidate.id);
    merged.push(candidate);
  }
  return merged;
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