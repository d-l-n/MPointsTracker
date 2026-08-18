import { initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAt_MtNqiFCELcYh9pncK7xVoYSaw-l9TE",
  authDomain: "mpoints-tracker.firebaseapp.com",
  projectId: "mpoints-tracker",
  storageBucket: "mpoints-tracker.firebasestorage.app",
  messagingSenderId: "67365418898",
  appId: "1:67365418898:web:ae8afc78313eadfbbcf34b",
};

const fbApp: FirebaseApp = initializeApp(firebaseConfig);
const fbAuth: Auth = getAuth(fbApp);

const fbDb: Firestore = initializeFirestore(fbApp, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

// Emulator support for E2E tests (tests/shared-matches-emulator.spec.js).
// Enabled by the dev server env var (webServer in playwright.config.js) or by
// the bgt_use_emulator localStorage flag — but only on the test server origin
// (port 5199). The flag is set by the emulator test suite; scoping it to 5199
// stops a stale flag from redirecting `npm run dev` (port 5173) to emulators
// that aren't running. To run dev against local emulators instead of the real
// backend: VITE_FIREBASE_EMULATOR=true npm run dev. Production builds never
// set either, so this stays a no-op outside tests.
const TEST_SERVER_PORT = "5199";
const useEmulator = import.meta.env?.VITE_FIREBASE_EMULATOR === "true"
  || (typeof window !== "undefined"
    && window.location.port === TEST_SERVER_PORT
    && window.localStorage.getItem("bgt_use_emulator") === "1");
if (useEmulator) {
  connectFirestoreEmulator(fbDb, "127.0.0.1", 8080);
  connectAuthEmulator(fbAuth, "http://127.0.0.1:9099", { disableWarnings: true });
}

export { fbApp, fbAuth, fbDb };
