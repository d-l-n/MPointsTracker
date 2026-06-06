import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import type { PendingInvite } from "../types";
import { fbDb } from "./firebase";

const INVITE_PARAM = "invite";
const INVITE_TTL_MS = 24 * 60 * 60 * 1000;

interface InviteUser {
  uid?: string | null;
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
}

interface InvitePayload extends PendingInvite {
  createdAt: number;
  expiresAt: number;
}

interface StoredInvite extends InvitePayload {
  code: string;
}

interface BrowserInviteMap {
  [code: string]: Partial<InvitePayload> | undefined;
}

interface CreateInviteLinkStoreOptions {
  user: InviteUser | null | undefined;
  now?: number;
  listInvitesByUid: (uid: string) => Promise<StoredInvite[]>;
  deleteInviteByCode: (code: string) => Promise<unknown>;
  writeInvite: (code: string, payload: InvitePayload) => Promise<unknown>;
  generateCode?: () => string;
  getBaseUrl?: () => string;
}

declare global {
  interface Window {
    __MP_TEST_INVITES__?: BrowserInviteMap;
  }
}

function generateInviteCode(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

function buildInvitePayload(user: InviteUser | null | undefined, now = Date.now()): InvitePayload {
  if (!user?.uid) {
    throw new Error("missing-user");
  }

  return {
    uid: user.uid,
    displayName: user.displayName || user.email?.split("@")[0] || user.uid.slice(0, 8),
    photoURL: user.photoURL || null,
    createdAt: now,
    expiresAt: now + INVITE_TTL_MS,
  };
}

function resolveInviteDoc(
  data: Partial<InvitePayload> | null | undefined,
  now = Date.now()
): PendingInvite | null {
  if (!data?.uid || !data.displayName || !data.expiresAt) return null;
  if (data.expiresAt < now) return null;

  return {
    uid: data.uid,
    displayName: data.displayName,
    photoURL: data.photoURL || null,
  };
}

async function createInviteLinkWithStore({
  user,
  now = Date.now(),
  listInvitesByUid,
  deleteInviteByCode,
  writeInvite,
  generateCode = generateInviteCode,
  getBaseUrl = () => window.location.href,
}: CreateInviteLinkStoreOptions): Promise<string> {
  const payload = buildInvitePayload(user, now);
  const existingInvites = await listInvitesByUid(payload.uid);
  await Promise.allSettled(existingInvites.map((invite) => deleteInviteByCode(invite.code)));

  const code = generateCode();
  await writeInvite(code, payload);

  const url = new URL(getBaseUrl());
  url.searchParams.set(INVITE_PARAM, code);
  url.hash = "";
  return url.toString();
}

async function createInviteLink(user: InviteUser | null | undefined, now = Date.now()): Promise<string> {
  return createInviteLinkWithStore({
    user,
    now,
    listInvitesByUid: async (uid) => {
      const snap = await getDocs(query(collection(fbDb, "invites"), where("uid", "==", uid)));
      return snap.docs.map((entry) => ({ code: entry.id, ...(entry.data() as InvitePayload) }));
    },
    deleteInviteByCode: async (code) => deleteDoc(doc(fbDb, "invites", code)),
    writeInvite: async (code, payload) => setDoc(doc(fbDb, "invites", code), payload),
  });
}

function getInviteCodeFromUrl(url = window.location.href): string | null {
  try {
    return new URL(url).searchParams.get(INVITE_PARAM);
  } catch {
    return null;
  }
}

async function resolveInvite(code: string | null | undefined, now = Date.now()): Promise<PendingInvite | null> {
  if (!code) return null;

  const browserTestInvites = typeof window !== "undefined" ? window.__MP_TEST_INVITES__ : null;
  if (browserTestInvites && browserTestInvites[code]) {
    return resolveInviteDoc(browserTestInvites[code], now);
  }

  const snap = await getDoc(doc(fbDb, "invites", code));
  if (!snap.exists()) return null;
  return resolveInviteDoc(snap.data() as Partial<InvitePayload>, now);
}

function clearInviteFromUrl(url = window.location.href): void {
  try {
    const nextUrl = new URL(url);
    nextUrl.searchParams.delete(INVITE_PARAM);
    window.history.replaceState({}, "", nextUrl.toString());
  } catch {
    // ignore malformed URLs and restricted history environments
  }
}

export {
  INVITE_PARAM,
  INVITE_TTL_MS,
  buildInvitePayload,
  clearInviteFromUrl,
  createInviteLink,
  createInviteLinkWithStore,
  getInviteCodeFromUrl,
  resolveInvite,
  resolveInviteDoc,
};
