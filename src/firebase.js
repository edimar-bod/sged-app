// TODO: Replace with your Firebase project config from the Firebase Console
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCj3kg5sux9JjR6mWgRwgrhlgSUWAli08w",
  authDomain: "sged-6f08a.firebaseapp.com",
  projectId: "sged-6f08a",
  storageBucket: "sged-6f08a.appspot.com", // <-- fixed typo here
  messagingSenderId: "237694642789",
  appId: "1:237694642789:web:d05edbfd722db5a9de748c",
  measurementId: "G-XX0NKMZBQV",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);
