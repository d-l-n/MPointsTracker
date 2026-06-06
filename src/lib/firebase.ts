import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import {
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

export { fbApp, fbAuth, fbDb };
