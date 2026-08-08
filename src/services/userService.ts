import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  where,
  writeBatch,
  type DocumentData,
  type DocumentReference,
} from "firebase/firestore";
import type { User } from "firebase/auth";

import { fbDb, fbAuth } from "../lib/firebase";
import type {
  AppStorageData,
  LegacyUserDoc,
  Match,
  PlayerGroup,
  PublicProfile,
  PublicStatsSummary,
  ThemeAccentMode,
  UserDataDoc,
  SpotifyPosition,
} from "../types";

const userRef = (uid: string) => doc(fbDb, "users", uid);
const userdataRef = (uid: string) => doc(fbDb, "userdata", uid);

type SharedMatchMap = Record<string, (Match & Record<string, unknown>)[]>;
type MinimalProfileUser = Pick<User, "displayName" | "photoURL"> & Partial<Pick<User, "email">>;

export function normalizePublicProfile(raw: LegacyUserDoc = {}): PublicProfile {
  return {
    displayName: (raw.displayName as string | null | undefined) ?? raw.profile?.displayName ?? null,
    photoURL: (raw.photoURL as string | null | undefined) ?? raw.profile?.photoURL ?? null,
    lastLogin: (raw.lastLogin as number | null | undefined) ?? raw.profile?.lastLogin ?? null,
    email: raw.profile?.email ?? null,
  };
}

export const saveUserProfile = async (uid: string, user: MinimalProfileUser) => {
  await setDoc(
    userRef(uid),
    {
      displayName: user.displayName || null,
      // searchName is the lowercased displayName so the search query can match
      // case-insensitively (Firestore queries can't lowercase on the fly).
      // Written on every login, so existing users self-heal on their next sign-in.
      searchName: (user.displayName || "").trim().toLowerCase() || null,
      photoURL: user.photoURL || null,
      lastLogin: Date.now(),
    },
    { merge: true },
  );
};

export interface SearchUserResult {
  uid: string;
  profile: PublicProfile;
}

export const searchUsersByName = async (
  q: string,
  currentUid: string,
  maxResults = 8,
): Promise<SearchUserResult[]> => {
  const term = q.trim().toLowerCase();
  if (!term) return [];

  // Prefix range on the normalized searchName field, capped server-side so we
  // never read the whole users collection. Fetch maxResults + 1 so the
  // self-exclusion filter below can't shrink the returned list.
  const snap = await getDocs(
    query(
      collection(fbDb, "users"),
      where("searchName", ">=", term),
      where("searchName", "<=", term + "\uf8ff"),
      limit(maxResults + 1),
    ),
  );

  return snap.docs
    .filter((entry) => entry.id !== currentUid)
    .slice(0, maxResults)
    .map((entry) => ({ uid: entry.id, profile: normalizePublicProfile(entry.data()) }));
};

export const savePublicStats = async (uid: string, stats: PublicStatsSummary) => {
  await setDoc(
    userRef(uid),
    {
      publicStats: stats,
      statsUpdatedAt: Date.now(),
    },
    { merge: true },
  );
};

export const loadUserProfile = async (uid: string): Promise<PublicProfile | null> => {
  const snap = await getDoc(userRef(uid));
  return snap.exists() ? normalizePublicProfile(snap.data()) : null;
};

export const getAllUsers = async () => {
  const { currentUser } = fbAuth;
  if (!currentUser) throw new Error("not-authenticated");

  const snap = await getDocs(collection(fbDb, "users"));
  return snap.docs.map((entry) => {
    const raw = entry.data();
    return {
      uid: entry.id,
      profile: normalizePublicProfile(raw),
      publicStats: raw.publicStats ?? null,
      statsUpdatedAt: raw.statsUpdatedAt ?? null,
    };
  });
};

export const loadUserData = async (uid: string): Promise<UserDataDoc | null> => {
  const snap = await getDoc(userdataRef(uid));
  return snap.exists() ? (snap.data() as UserDataDoc) : null;
};

export const saveDataToCloud = async (uid: string, data: AppStorageData) => {
  await setDoc(
    userdataRef(uid),
    {
      data: JSON.stringify(data),
      updatedAt: Date.now(),
    },
    { merge: true },
  );
};

export const savePlayerGroupsToCloud = async (uid: string, groups: PlayerGroup[]) => {
  await setDoc(
    userdataRef(uid),
    {
      playerGroups: JSON.stringify(groups),
    },
    { merge: true },
  );
};

export const saveSpotifyPreferenceToCloud = async (uid: string, enabled: boolean) => {
  await setDoc(
    userdataRef(uid),
    {
      spotifyEnabled: enabled ? "1" : "0",
    },
    { merge: true },
  );
};

export const saveSpotifyPositionToCloud = async (uid: string, position: SpotifyPosition) => {
  await setDoc(
    userdataRef(uid),
    {
      spotifyPosition: position,
    },
    { merge: true },
  );
};

export const saveThemeAccentToCloud = async (uid: string, accent: ThemeAccentMode) => {
  await setDoc(
    userdataRef(uid),
    {
      themeAccent: accent,
    },
    { merge: true },
  );
};

export const saveThemeCustomAccentToCloud = async (uid: string, hex: string) => {
  await setDoc(
    userdataRef(uid),
    {
      themeCustomAccent: hex,
    },
    { merge: true },
  );
};

export const pullSharedMatches = async (uid: string): Promise<SharedMatchMap> => {
  const snap = await getDocs(collection(fbDb, "users", uid, "shared_matches"));
  if (snap.empty) return {};

  const toMerge: SharedMatchMap = {};
  const refsToDelete: DocumentReference<DocumentData>[] = [];

  snap.docs.forEach((entry) => {
    const match = entry.data() as Match & Record<string, unknown>;
    const gameId = match._gameId;
    if (!gameId) return;
    if (!toMerge[gameId]) toMerge[gameId] = [];
    toMerge[gameId].push(match);
    refsToDelete.push(entry.ref);
  });

  if (Object.keys(toMerge).length === 0) return {};

  const commitDelete = async () => {
    try {
      const batch = writeBatch(fbDb);
      refsToDelete.forEach((ref) => batch.delete(ref));
      await batch.commit();
    } catch (error) {
      const reason = error && typeof error === "object" && "code" in error ? error.code : error;
      console.warn("[pullSharedMatches] batch delete failed (non-fatal):", reason);
    }
  };

  void commitDelete();
  return toMerge;
};

export const loadLegacyUserDoc = async (uid: string): Promise<LegacyUserDoc | null> => {
  const snap = await getDoc(userRef(uid));
  if (!snap.exists()) return null;

  const raw = snap.data() as LegacyUserDoc;
  const hasLegacyData = raw.data || raw.playerGroups || raw.profile;
  return hasLegacyData ? raw : null;
};
