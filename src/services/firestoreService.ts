import {
  doc,
  setDoc,
  collection,
  onSnapshot,
  deleteDoc,
  writeBatch,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Category,
  Challenge,
  Habit,
  HabitBreak,
  HabitLog,
  UserProfile,
} from '../types/habit';
import { cleanFirestoreData } from '../utils/firestoreCleaner';

// 1. User Profile Sync
export const subscribeUserProfile = (
  userId: string,
  onUpdate: (profile: UserProfile | null) => void,
  onError?: (error: Error) => void
) => {
  const ref = doc(db, 'users', userId);
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data() as UserProfile);
      } else if (!snap.metadata.fromCache) {
        // Document genuinely doesn't exist on server (not an initial offline cache miss)
        onUpdate(null);
      }
    },
    (error) => {
      console.error('subscribeUserProfile error:', error);
      onError?.(error);
    }
  );
};

export const saveUserProfileToDb = async (
  userId: string,
  profile: Partial<UserProfile>
) => {
  const ref = doc(db, 'users', userId);
  const cleaned = cleanFirestoreData({
    ...profile,
    updatedAt: new Date().toISOString(),
  });
  await setDoc(ref, cleaned, { merge: true });
};

// 2. Categories Sync
export const subscribeCategories = (
  userId: string,
  onUpdate: (categories: Category[]) => void,
  onError?: (error: Error) => void
) => {
  const colRef = collection(db, 'users', userId, 'categories');
  return onSnapshot(
    colRef,
    (snap) => {
      const list: Category[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Category);
      });
      onUpdate(list);
    },
    (error) => {
      console.error('subscribeCategories error:', error);
      onError?.(error);
    }
  );
};

export const addCategoryToDb = async (userId: string, category: Category) => {
  const ref = doc(db, 'users', userId, 'categories', category.id);
  await setDoc(ref, cleanFirestoreData(category));
};

export const updateCategoryInDb = async (userId: string, category: Category) => {
  const ref = doc(db, 'users', userId, 'categories', category.id);
  await setDoc(ref, cleanFirestoreData(category), { merge: true });
};

export const saveCategoriesOrderToDb = async (userId: string, categories: Category[]) => {
  try {
    const batch = writeBatch(db);
    categories.forEach((cat, index) => {
      const ref = doc(db, 'users', userId, 'categories', cat.id);
      batch.set(ref, cleanFirestoreData({ ...cat, order: index }), { merge: true });
    });
    await batch.commit();
  } catch (err) {
    console.error('saveCategoriesOrderToDb error:', err);
  }
};

export const deleteCategoryFromDb = async (userId: string, categoryId: string) => {
  const ref = doc(db, 'users', userId, 'categories', categoryId);
  await deleteDoc(ref);
};

// 3. Habits Sync
export const subscribeHabits = (
  userId: string,
  onUpdate: (habits: Habit[]) => void,
  onError?: (error: Error) => void
) => {
  const colRef = collection(db, 'users', userId, 'habits');
  return onSnapshot(
    colRef,
    (snap) => {
      const list: Habit[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Habit);
      });
      onUpdate(list);
    },
    (error) => {
      console.error('subscribeHabits error:', error);
      onError?.(error);
    }
  );
};

export const addHabitToDb = async (userId: string, habit: Habit) => {
  const ref = doc(db, 'users', userId, 'habits', habit.id);
  const cleaned = cleanFirestoreData(habit);
  await setDoc(ref, cleaned);
};

export const updateHabitInDb = async (userId: string, habit: Habit) => {
  const ref = doc(db, 'users', userId, 'habits', habit.id);
  const cleaned = cleanFirestoreData({
    ...habit,
    updatedAt: new Date().toISOString(),
  });
  await setDoc(ref, cleaned);
};

export const deleteHabitLogsFromDb = async (userId: string, habitId: string) => {
  try {
    const colRef = collection(db, 'users', userId, 'logs');
    const q = query(colRef, where('habitId', '==', habitId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      // Chunk in batches of 400 to respect Firestore's 500-operation writeBatch limit
      const docs = snap.docs;
      const CHUNK_SIZE = 400;
      for (let i = 0; i < docs.length; i += CHUNK_SIZE) {
        const chunk = docs.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(db);
        chunk.forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });
        await batch.commit();
      }
    }
  } catch (err) {
    console.error('deleteHabitLogsFromDb error:', err);
    throw err;
  }
};

export const deleteHabitFromDb = async (userId: string, habitId: string) => {
  const ref = doc(db, 'users', userId, 'habits', habitId);
  await deleteDoc(ref);
  await deleteHabitLogsFromDb(userId, habitId);
};

// 4. Daily Logs Sync
export const subscribeLogs = (
  userId: string,
  onUpdate: (logs: Record<string, HabitLog>) => void,
  onError?: (error: Error) => void
) => {
  const colRef = collection(db, 'users', userId, 'logs');
  return onSnapshot(
    colRef,
    (snap) => {
      const map: Record<string, HabitLog> = {};
      snap.forEach((d) => {
        map[d.id] = d.data() as HabitLog;
      });
      onUpdate(map);
    },
    (error) => {
      console.error('subscribeLogs error:', error);
      onError?.(error);
    }
  );
};

export const saveLogToDb = async (
  userId: string,
  logKey: string,
  log: HabitLog
) => {
  const ref = doc(db, 'users', userId, 'logs', logKey);
  const cleaned = cleanFirestoreData(log);
  await setDoc(ref, cleaned);
};

// 5. Timer Habit Break Sync (Sobriety Chronometers)
export const subscribeHabitBreaks = (
  userId: string,
  onUpdate: (breaks: HabitBreak[]) => void,
  onError?: (error: Error) => void
) => {
  const colRef = collection(db, 'users', userId, 'habitBreaks');
  return onSnapshot(
    colRef,
    (snap) => {
      const list: HabitBreak[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as HabitBreak);
      });
      onUpdate(list);
    },
    (error) => {
      console.error('subscribeHabitBreaks error:', error);
      onError?.(error);
    }
  );
};

export const addHabitBreakToDb = async (
  userId: string,
  habitBreak: HabitBreak
) => {
  const ref = doc(db, 'users', userId, 'habitBreaks', habitBreak.id);
  const cleaned = cleanFirestoreData(habitBreak);
  await setDoc(ref, cleaned);
};

export const updateHabitBreakInDb = async (
  userId: string,
  habitBreak: HabitBreak
) => {
  const ref = doc(db, 'users', userId, 'habitBreaks', habitBreak.id);
  const cleaned = cleanFirestoreData(habitBreak);
  await setDoc(ref, cleaned);
};

export const deleteHabitBreakFromDb = async (
  userId: string,
  breakId: string
) => {
  const ref = doc(db, 'users', userId, 'habitBreaks', breakId);
  await deleteDoc(ref);
};

// 5.5 Hardcore Challenges Sync
export const subscribeChallenges = (
  userId: string,
  onUpdate: (challenges: Challenge[]) => void,
  onError?: (error: Error) => void
) => {
  const colRef = collection(db, 'users', userId, 'challenges');
  return onSnapshot(
    colRef,
    (snap) => {
      const list: Challenge[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Challenge);
      });
      onUpdate(list);
    },
    (error) => {
      console.error('subscribeChallenges error:', error);
      onError?.(error);
    }
  );
};

export const addChallengeToDb = async (
  userId: string,
  challenge: Challenge
) => {
  const ref = doc(db, 'users', userId, 'challenges', challenge.id);
  const cleaned = cleanFirestoreData(challenge);
  await setDoc(ref, cleaned);
};

export const updateChallengeInDb = async (
  userId: string,
  challenge: Challenge
) => {
  const ref = doc(db, 'users', userId, 'challenges', challenge.id);
  const cleaned = cleanFirestoreData({
    ...challenge,
    updatedAt: new Date().toISOString(),
  });
  await setDoc(ref, cleaned);
};

export const deleteChallengeFromDb = async (
  userId: string,
  challengeId: string
) => {
  const ref = doc(db, 'users', userId, 'challenges', challengeId);
  await deleteDoc(ref);
};

// 6. Complete User Data Reset (Fresh Start)
export const resetEntireUserDataInDb = async (userId: string) => {
  // 1. Delete habits
  const habitsCol = collection(db, 'users', userId, 'habits');
  const habitsSnap = await getDocs(habitsCol);
  if (!habitsSnap.empty) {
    const batch1 = writeBatch(db);
    habitsSnap.forEach((d) => batch1.delete(d.ref));
    await batch1.commit();
  }

  // 2. Delete logs
  const logsCol = collection(db, 'users', userId, 'logs');
  const logsSnap = await getDocs(logsCol);
  if (!logsSnap.empty) {
    const batch2 = writeBatch(db);
    logsSnap.forEach((d) => batch2.delete(d.ref));
    await batch2.commit();
  }

  // 3. Delete categories
  const catsCol = collection(db, 'users', userId, 'categories');
  const catsSnap = await getDocs(catsCol);
  if (!catsSnap.empty) {
    const batch3 = writeBatch(db);
    catsSnap.forEach((d) => batch3.delete(d.ref));
    await batch3.commit();
  }

  // 4. Delete habit breaks
  const breaksCol = collection(db, 'users', userId, 'habitBreaks');
  const breaksSnap = await getDocs(breaksCol);
  if (!breaksSnap.empty) {
    const batch4 = writeBatch(db);
    breaksSnap.forEach((d) => batch4.delete(d.ref));
    await batch4.commit();
  }

  // 5. Delete challenges
  const challengesCol = collection(db, 'users', userId, 'challenges');
  const challengesSnap = await getDocs(challengesCol);
  if (!challengesSnap.empty) {
    const batch5 = writeBatch(db);
    challengesSnap.forEach((d) => batch5.delete(d.ref));
    await batch5.commit();
  }

  // 6. Reset user profile to isOnboarded: false
  const userRef = doc(db, 'users', userId);
  await setDoc(
    userRef,
    {
      isOnboarded: false,
      gamification: {
        level: 1,
        levelTitle: 'Will Habit Initiate',
        totalXp: 0,
        consistencyScore: 0,
        hearts: 5,
        maxHearts: 5,
        perfectDaysCompleted: [],
      },
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
};

