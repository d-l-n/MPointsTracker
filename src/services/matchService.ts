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
}

const EMPTY_SHARE_RESULT: ShareResult = { attempted: 0, shared: 0, failed: 0, skipped: 0 };

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
    return { attempted: 0, shared: 0, failed: 0, skipped };
  }

  const results = await Promise.allSettled(
    shareablePlayers.map((linkedPlayer) =>
      addDoc(collection(fbDb, "users", linkedPlayer.uid as string, "shared_matches"), sharedMatch),
    ),
  );

  let failed = 0;
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      failed += 1;
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
  };
};
