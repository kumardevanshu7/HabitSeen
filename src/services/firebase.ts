import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  Firestore,
} from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAMyiIzXonkgJoYXSRTLis_P-YGeBhRQJ4",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "pro13-habitseen.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "pro13-habitseen",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "pro13-habitseen.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "408400447866",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:408400447866:web:71c80fe3d021084f21aec3",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-0BYW7QTZHY",
};

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Auto-detect long polling allows Firestore to recover if ad blockers or network proxies intercept WebChannels
let firestoreInstance: Firestore;
try {
  firestoreInstance = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
  });
} catch {
  firestoreInstance = getFirestore(app);
}
export const db = firestoreInstance;
export const googleProvider = new GoogleAuthProvider();

// Auth Helpers
export const signInWithGoogle = async () => {
  return await signInWithPopup(auth, googleProvider);
};

export const signInWithEmail = async (email: string, pass: string) => {
  return await signInWithEmailAndPassword(auth, email, pass);
};

export const signUpWithEmail = async (email: string, pass: string) => {
  return await createUserWithEmailAndPassword(auth, email, pass);
};

export const logOut = async () => {
  return await signOut(auth);
};

export type { FirebaseUser };
