import {
  GoogleAuthProvider,
  indexedDBLocalPersistence,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  updateProfile,
  type User,
  type UserCredential,
} from "firebase/auth";

import { fbAuth } from "../lib/firebase";

let persistencePromise: Promise<void> | null = null;

export const initAuthPersistence = async (): Promise<void> => {
  if (!persistencePromise) {
    persistencePromise = setPersistence(fbAuth, indexedDBLocalPersistence).catch((error) => {
      persistencePromise = null;
      throw error;
    });
  }

  return persistencePromise;
};

export const getRedirectResultAuth = () => getRedirectResult(fbAuth);

export const listenAuthState = (callback: (user: User | null) => void | Promise<void>) =>
  onAuthStateChanged(fbAuth, callback);

export const signInWithGoogle = async (): Promise<UserCredential> => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return signInWithPopup(fbAuth, provider);
};

export const signInWithGoogleRedirect = async (): Promise<void> => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return signInWithRedirect(fbAuth, provider);
};

export const signInEmail = (email: string, password: string) =>
  signInWithEmailAndPassword(fbAuth, email, password);

export const signUpEmail = async (email: string, password: string, name: string) => {
  const cred = await createUserWithEmailAndPassword(fbAuth, email, password);
  if (name?.trim()) {
    await updateProfile(cred.user, { displayName: name.trim() });
    await cred.user.reload();
  }
  return cred;
};

export const resetPassword = (email: string) =>
  sendPasswordResetEmail(fbAuth, email);

export const signOutUser = () => signOut(fbAuth);
