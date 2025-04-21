import { initializeApp } from "firebase/app";
import {
  initializeFirestore,
  connectFirestoreEmulator
} from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// 🔐 Your .env variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// 🚀 Init app
const app = initializeApp(firebaseConfig);

// ✅ Init Firestore with region workaround settings
const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
  experimentalForceLongPolling: true,
  useFetchStreams: false,
});

// ✅ Force target region (if needed in advanced SDK builds)
// db.settings({
//   host: "europe-west4-firestore.googleapis.com",
//   ssl: true
// });

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, db, auth, googleProvider };
