/**
 * Firebase Integration Slot for HabitsSeen
 * 
 * Paste your Firebase credentials and initialization code here once ready.
 * The entire state store (useAppStore) and Repository pattern (IHabitRepository)
 * are already decoupled and ready to bind directly to your Firestore collections!
 */

export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

export const isFirebaseConfigured = (): boolean => {
  return firebaseConfig.apiKey !== "YOUR_API_KEY";
};
