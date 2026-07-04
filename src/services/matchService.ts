import { addDoc, collection } from "firebase/firestore";

import { fbDb } from "../lib/firebase";
import type { Match, SharedMatchRecipient } from "../types";

interface SharedByUser {
  uid?: string | null;
  displayName?: string | null;
  email?: string | null;
}

export const shareMatchWithPlayers = async (
  gameId: string,
  match: Match & Record<string, unknown>,
  linkedPlayers: SharedMatchRecipient[],
  sharedBy: SharedByUser | null | undefined,
) => {
  if (!linkedPlayers || linkedPlayers.length === 0) return;

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

  const results = await Promise.allSettled(
    linkedPlayers
      .filter((linkedPlayer) => linkedPlayer.uid && linkedPlayer.uid !== sharedBy?.uid)
      .map((linkedPlayer) =>
        addDoc(collection(fbDb, "users", linkedPlayer.uid as string, "shared_matches"), sharedMatch),
      ),
  );

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      const reason = result.reason && typeof result.reason === "object" && "code" in result.reason
        ? result.reason.code
        : result.reason;
      console.warn(`[matchService] Error sharing with player ${index}:`, reason);
    }
  });
};
