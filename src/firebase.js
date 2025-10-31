// TODO: Replace with your Firebase project config from the Firebase Console
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Guard against missing/invalid env at runtime; log a helpful hint instead of cryptic errors
if (!firebaseConfig.apiKey || firebaseConfig.apiKey.length < 10) {
  console.error(
    "Firebase API key missing/invalid. Ensure VITE_FIREBASE_* env vars are set before build and rebuild your app."
  );
}

const app = initializeApp(firebaseConfig);
// Debug (safe) – verify envs made it into the bundle without exposing secrets
try {
  const mask = (v) =>
    typeof v === "string" && v.length >= 4 ? v.slice(0, 4) + "***" : v;
  console.debug("[Firebase cfg]", {
    apiKey: mask(firebaseConfig.apiKey),
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
  });
} catch {
  /* noop */
}
export const db = getFirestore(app);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);
