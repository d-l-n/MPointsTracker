import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "firebase/auth";

import { STORAGE_KEY } from "../lib/storage";
import { clearSpotifyAuthStorage } from "../lib/spotifyClient";
import {
  getRedirectResultAuth,
  initAuthPersistence,
  listenAuthState,
  resetPassword as authResetPassword,
  signInEmail as authSignInEmail,
  signInWithGoogle,
  signInWithGoogleRedirect,
  signOutUser as authSignOutUser,
  signUpEmail as authSignUpEmail,
} from "../services/authService";
import {
  loadLegacyUserDoc,
  loadUserData,
  pullSharedMatches,
  saveDataToCloud,
  savePlayerGroupsToCloud,
  saveSpotifyPreferenceToCloud,
  saveSpotifyPositionToCloud,
  saveUserProfile,
} from "../services/userService";
import type { Match, PlayerGroup, SpotifyPosition, TranslationFn } from "../types";

const isIOS =
  typeof navigator !== "undefined" &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

interface AuthHookOptions {
  addLog: (message: string, level?: string) => void;
  showToast: (msg: string, duration?: number) => void;
  t: TranslationFn;
  mergeCloudData: (cloudData: Record<string, unknown>) => void;
  mergeSharedMatches: (toMerge: Record<string, Match[]>) => void;
}

interface UserDataPayload {
  data?: string;
  playerGroups?: string;
  spotifyEnabled?: string | boolean;
  spotifyPosition?: SpotifyPosition;
  [key: string]: unknown;
}

const SPOTIFY_ENABLED_KEY = "bgt_spotify_enabled";
const SPOTIFY_POSITION_KEY = "bgt_spotify_position";

type TestAuthUser = Partial<User> & {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
  admin?: boolean;
};

declare global {
  interface Window {
    __MP_TEST_AUTH_USER__?: TestAuthUser;
  }
}

function readStoredPlayerGroups(): PlayerGroup[] {
  try {
    const parsed = JSON.parse(localStorage.getItem("bgt_player_groups") || "[]");
    return Array.isArray(parsed) ? (parsed as PlayerGroup[]) : [];
  } catch {
    return [];
  }
}

function readStoredSpotifyEnabled(): boolean {
  try {
    return localStorage.getItem(SPOTIFY_ENABLED_KEY) === "1";
  } catch {
    return false;
  }
}

function normalizeSpotifyEnabled(value: unknown): boolean | null {
  if (value === true || value === "1") return true;
  if (value === false || value === "0") return false;
  return null;
}

function readStoredSpotifyPosition(): SpotifyPosition {
  try {
    const val = localStorage.getItem(SPOTIFY_POSITION_KEY);
    if (val === "center" || val === "left" || val === "right" || val === "draggable") {
      return val as SpotifyPosition;
    }
  } catch {
    // ignore
  }
  return "center";
}

function readHadPreviousSession(): boolean {
  try {
    return !!localStorage.getItem("bgt_last_uid");
  } catch {
    return false;
  }
}

function readGuestMode(hadPreviousSession: boolean): boolean {
  if (hadPreviousSession) return false;
  try {
    return !!localStorage.getItem("bgt_guest_mode");
  } catch {
    return false;
  }
}

function parsePlayerGroups(raw: string): PlayerGroup[] | null {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PlayerGroup[]) : null;
  } catch {
    return null;
  }
}

export function useAuth({
  addLog,
  showToast,
  t,
  mergeCloudData,
  mergeSharedMatches,
}: AuthHookOptions) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [playerGroups, setPlayerGroups] = useState<PlayerGroup[]>(readStoredPlayerGroups);
  const [spotifyEnabled, setSpotifyEnabled] = useState<boolean>(readStoredSpotifyEnabled);
  const [spotifyPosition, setSpotifyPosition] = useState<SpotifyPosition>(readStoredSpotifyPosition);
  const [isAdmin, setIsAdmin] = useState(false);

  const hadPreviousSession = readHadPreviousSession();
  const [authChecked, setAuthChecked] = useState(hadPreviousSession);
  const [guestMode, setGuestMode] = useState(readGuestMode(hadPreviousSession));

  const handledUid = useRef<string | null>(null);

  const handleUser = useCallback(
    async (currentUser: User | null) => {
      if (!currentUser) {
        addLog("handleUser: u is null — signed out");
        return;
      }
      if (handledUid.current === currentUser.uid) {
        addLog(`handleUser: skip dup uid ${currentUser.uid.slice(0, 8)}`);
        return;
      }
      handledUid.current = currentUser.uid;
      addLog(`handleUser: START uid=${currentUser.uid.slice(0, 8)} email=${currentUser.email}`);

      setGuestMode(false);
      localStorage.removeItem("bgt_guest_mode");
      setUser(currentUser);
      setAuthChecked(true);
      localStorage.setItem("bgt_last_uid", currentUser.uid);

      try {
        const token = await currentUser.getIdTokenResult();
        setIsAdmin(token.claims.admin === true);
      } catch {
        setIsAdmin(false);
      }

      try {
        await saveUserProfile(currentUser.uid, currentUser);
        addLog("profile saved OK");
      } catch (error) {
        addLog(`profile save ERR: ${error && typeof error === "object" && "code" in error ? String(error.code) : error}`, "err");
      }

      try {
        const userData = (await loadUserData(currentUser.uid)) as UserDataPayload | null;
        addLog(`userdata load: ${userData ? "doc found" : "no doc"}`);

        if (userData?.data) {
          try {
            const cloud = JSON.parse(userData.data) as Record<string, unknown>;
            mergeCloudData(cloud);
            addLog("data merged OK (userdata)");
          } catch (error) {
            addLog(`data parse ERR (userdata): ${error}`, "err");
          }
        }

        if (userData?.playerGroups) {
          const groups = parsePlayerGroups(userData.playerGroups);
          if (groups && groups.length > 0) {
            setPlayerGroups(groups);
            localStorage.setItem("bgt_player_groups", JSON.stringify(groups));
            addLog(`player groups loaded (userdata): ${groups.length}`);
          }
        }

        const cloudSpotifyEnabled = normalizeSpotifyEnabled(userData?.spotifyEnabled);
        if (cloudSpotifyEnabled !== null) {
          setSpotifyEnabled(cloudSpotifyEnabled);
          localStorage.setItem(SPOTIFY_ENABLED_KEY, cloudSpotifyEnabled ? "1" : "0");
          addLog(`spotify preference loaded (userdata): ${cloudSpotifyEnabled ? "enabled" : "disabled"}`);
        } else if (readStoredSpotifyEnabled()) {
          await saveSpotifyPreferenceToCloud(currentUser.uid, true);
          addLog("spotify preference uploaded from local storage");
        }

        const cloudSpotifyPosition = userData?.spotifyPosition;
        if (cloudSpotifyPosition === "center" || cloudSpotifyPosition === "left" || cloudSpotifyPosition === "right" || cloudSpotifyPosition === "draggable") {
          setSpotifyPosition(cloudSpotifyPosition);
          localStorage.setItem(SPOTIFY_POSITION_KEY, cloudSpotifyPosition);
          addLog(`spotify position loaded (userdata): ${cloudSpotifyPosition}`);
        }

        if (!userData?.data && !userData?.playerGroups && cloudSpotifyEnabled === null) {
          addLog("no userdata found - checking legacy users doc...");
          try {
            const legacy = (await loadLegacyUserDoc(currentUser.uid)) as UserDataPayload | null;

            if (legacy?.data) {
              addLog("migrating data from legacy users doc...");
              const parsed = JSON.parse(legacy.data) as Record<string, unknown>;
              mergeCloudData(parsed);
              await saveDataToCloud(currentUser.uid, parsed);
              addLog("data migrated to userdata OK");
            }

            if (legacy?.playerGroups) {
              addLog("migrating playerGroups from legacy users doc...");
              const groups = parsePlayerGroups(legacy.playerGroups);
              if (groups && groups.length > 0) {
                setPlayerGroups(groups);
                localStorage.setItem("bgt_player_groups", JSON.stringify(groups));
                await savePlayerGroupsToCloud(currentUser.uid, groups);
                addLog(`playerGroups migrated: ${groups.length}`);
              }
            }
          } catch (error) {
            addLog(`legacy migration ERR: ${error && typeof error === "object" && "code" in error ? String(error.code) : error}`, "warn");
          }
        }
      } catch (error) {
        addLog(`cloud load ERR: ${error && typeof error === "object" && "code" in error ? String(error.code) : error}`, "err");
      }

      try {
        const toMerge = (await pullSharedMatches(currentUser.uid)) as Record<string, Match[]>;
        if (Object.keys(toMerge).length > 0) {
          mergeSharedMatches(toMerge);
          addLog(`syncSharedMatches: imported ${Object.values(toMerge).flat().length} shared matches`);
        }
      } catch (error) {
        addLog(`syncSharedMatches ERR: ${error && typeof error === "object" && "code" in error ? String(error.code) : error}`, "warn");
      }

      addLog("handleUser: DONE ✓", "ok");
    },
    [addLog, mergeCloudData, mergeSharedMatches],
  );

  useEffect(() => {
    let unsubAuth: (() => void) | null = null;
    let cancelled = false;

    const init = async () => {
      const isDevMode = typeof import.meta !== "undefined" && import.meta.env?.DEV;
      const testUser = isDevMode && typeof window !== "undefined" ? window.__MP_TEST_AUTH_USER__ : null;
      if (testUser?.uid) {
        const syntheticUser = {
          displayName: null,
          email: null,
          photoURL: null,
          ...testUser,
        } as User;
        handledUid.current = syntheticUser.uid;
        setGuestMode(false);
        setUser(syntheticUser);
        setIsAdmin(testUser.admin === true);
        setAuthChecked(true);
        setPlayerGroups(readStoredPlayerGroups());
        localStorage.removeItem("bgt_guest_mode");
        localStorage.setItem("bgt_last_uid", syntheticUser.uid);
        addLog(`test auth user loaded: ${syntheticUser.uid.slice(0, 8)}`, "ok");
        return;
      }

      addLog(`init START — isIOS=${isIOS} ua=${typeof navigator === "undefined" ? "n/a" : navigator.userAgent.slice(0, 40)}`);

      try {
        addLog("setting auth persistence...");
        await initAuthPersistence();
        addLog("auth persistence OK");
      } catch (error) {
        const code = error && typeof error === "object" && "code" in error ? String(error.code) : String(error);
        addLog(`auth persistence ERR: ${code}`, "warn");
      }

      try {
        addLog("calling getRedirectResult...");
        const result = await getRedirectResultAuth();
        addLog(`getRedirectResult: ${result?.user ? `user=${result.user.email}` : "null"}`);
        if (!cancelled && result?.user) {
          await handleUser(result.user);
        }
      } catch (error) {
        const code = error && typeof error === "object" && "code" in error ? String(error.code) : String(error);
        addLog(`getRedirectResult ERR: ${code}`, "err");
        if (code === "auth/web-storage-unsupported") {
          if (!cancelled) {
            setAuthChecked(true);
            showToast(t("authSafariStorage"));
          }
          return;
        }
      }

      if (cancelled) return;
      addLog("setting up onAuthStateChanged...");

      unsubAuth = listenAuthState(async (nextUser: User | null) => {
        if (cancelled) return;
        addLog(`onAuthStateChanged: ${nextUser ? `user=${nextUser.email}` : "null"}`);
        if (nextUser) {
          await handleUser(nextUser);
        } else {
          handledUid.current = null;
          setUser(null);
          setIsAdmin(false);
          setAuthChecked(true);
          addLog("signed out — showing login screen");
        }
      });
      addLog("onAuthStateChanged listener registered");
    };

    init();
    return () => {
      cancelled = true;
      if (unsubAuth) unsubAuth();
    };
  }, [handleUser, addLog, showToast]);

  const signInGoogle = useCallback(async () => {
    addLog(`signInGoogle START — isIOS=${isIOS} ua=${typeof navigator === "undefined" ? "n/a" : navigator.userAgent.slice(0, 50)}`);
    try {
      addLog("calling signInWithPopup...");
      const result = await signInWithGoogle();
      addLog(`signInWithPopup OK — user=${result?.user?.email}`);
    } catch (error) {
      const code = error && typeof error === "object" && "code" in error ? String(error.code) : String(error);
      addLog(`signInGoogle ERR: ${code}`, "err");
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        addLog("user closed popup — no action needed", "warn");
        return;
      }
      if (code === "auth/popup-blocked") {
        addLog("popup blocked — trying redirect fallback", "warn");
        try {
          await signInWithGoogleRedirect();
        } catch (redirectError) {
          addLog(
            `redirect also failed: ${
              redirectError && typeof redirectError === "object" && "code" in redirectError
                ? String(redirectError.code)
                : String(redirectError)
            }`,
            "err",
          );
          showToast(t("loginError"));
        }
        return;
      }
      showToast(t("loginError"));
    }
  }, [addLog, showToast, t]);

  const signInWithEmail = useCallback(
    async (email: string, password: string): Promise<string | null> => {
      try {
        await authSignInEmail(email, password);
      } catch {
        return t("emailError");
      }
      return null;
    },
    [t],
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string, name?: string): Promise<string | null> => {
      try {
        await authSignUpEmail(email, password, name);
      } catch (error) {
        const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
        if (code === "auth/email-already-in-use") return t("emailExists");
        if (code === "auth/weak-password") return t("weakPassword");
        return t("emailError");
      }
      return null;
    },
    [t],
  );

  const sendPasswordReset = useCallback(
    async (email: string): Promise<string | null> => {
      try {
        await authResetPassword(email);
        return null;
      } catch {
        return t("emailError");
      }
    },
    [t],
  );

  const signOut = useCallback(
    async (clearLocal = false) => {
      await authSignOutUser();
      localStorage.removeItem("bgt_last_uid");
      localStorage.removeItem("bgt_guest_mode");
      if (clearLocal) {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          // ignore
        }
        try {
          localStorage.removeItem("bgt_player_groups");
        } catch {
          // ignore
        }
      }
      clearSpotifyAuthStorage();
      setUser(null);
      setIsAdmin(false);
      showToast(t("sessionClosed"));
    },
    [showToast, t],
  );

  const enterGuestMode = useCallback(() => {
    localStorage.setItem("bgt_guest_mode", "1");
    setGuestMode(true);
  }, []);

  const savePlayerGroups = useCallback(
    async (groups: PlayerGroup[]) => {
      setPlayerGroups(groups);
      try {
        localStorage.setItem("bgt_player_groups", JSON.stringify(groups));
      } catch (error) {
        console.error("[useAuth] savePlayerGroups localStorage error:", error);
      }
      if (user) {
        try {
          await savePlayerGroupsToCloud(user.uid, groups);
        } catch (error) {
          console.warn("[playerGroups] cloud save failed:", error);
        }
      }
    },
    [user],
  );

  const saveSpotifyPreference = useCallback(
    async (enabled: boolean) => {
      setSpotifyEnabled(enabled);
      try {
        if (enabled) {
          localStorage.setItem(SPOTIFY_ENABLED_KEY, "1");
        } else {
          localStorage.setItem(SPOTIFY_ENABLED_KEY, "0");
        }
      } catch (error) {
        console.error("[useAuth] saveSpotifyPreference localStorage error:", error);
      }
      if (user) {
        try {
          await saveSpotifyPreferenceToCloud(user.uid, enabled);
        } catch (error) {
          console.warn("[spotify] cloud preference save failed:", error);
        }
      }
    },
    [user],
  );

  const saveSpotifyPosition = useCallback(
    async (position: SpotifyPosition) => {
      setSpotifyPosition(position);
      try {
        localStorage.setItem(SPOTIFY_POSITION_KEY, position);
      } catch (error) {
        console.error("[useAuth] saveSpotifyPosition localStorage error:", error);
      }
      if (user) {
        try {
          await saveSpotifyPositionToCloud(user.uid, position);
        } catch (error) {
          console.warn("[spotify] cloud position save failed:", error);
        }
      }
    },
    [user],
  );

  return {
    user,
    isAdmin,
    authChecked,
    hadPreviousSession,
    guestMode,
    playerGroups,
    spotifyEnabled,
    spotifyPosition,
    signInGoogle,
    signInWithEmail,
    signUpWithEmail,
    sendPasswordReset,
    signOut,
    enterGuestMode,
    savePlayerGroups,
    saveSpotifyPreference,
    saveSpotifyPosition,
  };
}
