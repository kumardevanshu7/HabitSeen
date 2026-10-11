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
  Habit,
  HabitBreak,
  HabitLog,
  UserProfile,
} from '../types/habit';
import { cleanFirestoreData } from '../utils/firestoreCleaner';

// 1. User Profile Sync
export const subscribeUserProfile = (
  userId: string,
  onUpdate: (profile: UserProfile | null) => void
) => {
  const ref = doc(db, 'users', userId);
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data() as UserProfile);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      console.error('subscribeUserProfile error:', error);
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
  onUpdate: (categories: Category[]) => void
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
    }
  );
};

export const addCategoryToDb = async (userId: string, category: Category) => {
  const ref = doc(db, 'users', userId, 'categories', category.id);
  await setDoc(ref, cleanFirestoreData(category));
};

export const deleteCategoryFromDb = async (userId: string, categoryId: string) => {
  const ref = doc(db, 'users', userId, 'categories', categoryId);
  await deleteDoc(ref);
};

// 3. Habits Sync
export const subscribeHabits = (
  userId: string,
  onUpdate: (habits: Habit[]) => void
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
      const batch = writeBatch(db);
      snap.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
    }
  } catch (err) {
    console.error('deleteHabitLogsFromDb error:', err);
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
  onUpdate: (logs: Record<string, HabitLog>) => void
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
  onUpdate: (breaks: HabitBreak[]) => void
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
