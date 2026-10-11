import { create } from 'zustand';
import {
  Category,
  Habit,
  HabitBreak,
  HabitLog,
  HabitLogStatus,
  UserProfile,
} from '../types/habit';
import {
  getTodayKey,
  isDateInThisWeek,
  isDateInThisMonth,
  isDateInThisYear,
} from '../utils/dateMath';
import {
  computeHabitStreaks,
  evaluateHabitSuccess,
  calculateXpForCompletion,
} from '../utils/streakEngine';
import { WILL_HABIT_TIERS } from '../constants/gamification';
import {
  FirebaseUser,
} from '../services/firebase';
import {
  saveUserProfileToDb,
  addCategoryToDb,
  deleteCategoryFromDb,
  addHabitToDb,
  updateHabitInDb,
  deleteHabitFromDb,
  saveLogToDb,
  addHabitBreakToDb,
  updateHabitBreakInDb,
  deleteHabitBreakFromDb,
} from '../services/firestoreService';

interface AppState {
  // Auth
  currentUser: FirebaseUser | null;
  authLoading: boolean;
  setCurrentUser: (user: FirebaseUser | null) => void;
  setAuthLoading: (loading: boolean) => void;

  // User Profile
  user: UserProfile | null;
  profileLoading: boolean;
  setUser: (profile: UserProfile | null) => void;
  setProfileLoading: (loading: boolean) => void;
  completeOnboarding: (data: {
    name: string;
    age: number;
    relationStatus: UserProfile['relationStatus'];
    gender: UserProfile['gender'];
  }) => Promise<void>;

  // Selected Date
  selectedDate: string;
  setSelectedDate: (dateKey: string) => void;

  // Categories
  categories: Category[];
  setCategories: (cats: Category[]) => void;
  addCategory: (cat: Omit<Category, 'id' | 'createdAt'>) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;

  // Habits
  habits: Habit[];
  setHabits: (habits: Habit[]) => void;
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt' | 'stats'>) => Promise<Habit>;
  updateHabit: (habit: Habit) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;

  // Logs
  logs: Record<string, HabitLog>;
  setLogs: (logs: Record<string, HabitLog>) => void;
  logHabit: (
    habitId: string,
    dateKey: string,
    data: {
      valueYesNo?: boolean;
      valueNumeric?: number;
      valueTimerSeconds?: number;
      valueChecklistCompletedItemIds?: string[];
      notes?: string;
      forceStatus?: HabitLogStatus;
    }
  ) => Promise<void>;
  skipHabit: (habitId: string, dateKey: string, notes?: string) => Promise<void>;

  // Timer Habit Break
  habitBreaks: HabitBreak[];
  setHabitBreaks: (breaks: HabitBreak[]) => void;
  addHabitBreak: (data: {
    name: string;
    categoryId: string;
    icon: string;
    color: string;
    description?: string;
  }) => Promise<HabitBreak>;
  relapseHabitBreak: (id: string, reason?: string) => Promise<void>;
  deleteHabitBreak: (id: string) => Promise<void>;

  // Reset entire store state on sign out
  resetStore: () => void;
}

export const DEFAULT_CATEGORY: Category = {
  id: 'cat-others',
  name: 'Others',
  icon: 'layout-grid',
  color: '#64748B',
  isDefault: true,
  createdAt: new Date().toISOString(),
};

export const useAppStore = create<AppState>()((set, get) => ({
  currentUser: null,
  authLoading: true,
  setCurrentUser: (user) => set({ currentUser: user }),
  setAuthLoading: (loading) => set({ authLoading: loading }),

  user: null,
  profileLoading: true,
  setUser: (profile) => set({ user: profile, profileLoading: false }),
  setProfileLoading: (loading) => set({ profileLoading: loading }),

  selectedDate: getTodayKey(),
  setSelectedDate: (dateKey) => set({ selectedDate: dateKey }),

  categories: [DEFAULT_CATEGORY],
  setCategories: (categories) => {
    // Ensure default "Others" exists
    if (!categories.some((c) => c.isDefault || c.id === 'cat-others')) {
      set({ categories: [DEFAULT_CATEGORY, ...categories] });
    } else {
      set({ categories });
    }
  },

  habits: [],
  setHabits: (habits) => set({ habits }),

  logs: {},
  setLogs: (logs) => set({ logs }),

  habitBreaks: [],
  setHabitBreaks: (habitBreaks) => set({ habitBreaks }),

  completeOnboarding: async (data) => {
    const { currentUser, user } = get();
    if (!currentUser) return;
    // Guard against overwriting an existing onboarded profile
    if (user && user.isOnboarded) return;

    const tier = WILL_HABIT_TIERS[0];
    const newProfile: UserProfile = {
      name: data.name,
      age: data.age,
      relationStatus: data.relationStatus,
      gender: data.gender,
      isOnboarded: true,
      gamification: {
        level: tier.level,
        levelTitle: tier.title,
        totalXp: 150, // Welcome XP
        consistencyScore: 100,
      },
    };

    // Save directly to Firestore (no localStorage)
    await saveUserProfileToDb(currentUser.uid, newProfile);
    set({ user: newProfile, profileLoading: false });

    // Also initialize default "Others" category in Firestore if empty
    await addCategoryToDb(currentUser.uid, DEFAULT_CATEGORY);
  },

  addCategory: async (catData) => {
    const { currentUser } = get();
    const newCat: Category = {
      ...catData,
      id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };

    if (currentUser) {
      await addCategoryToDb(currentUser.uid, newCat);
    }
    set((s) => ({ categories: [...s.categories, newCat] }));
    return newCat;
  },

  deleteCategory: async (id) => {
    const { currentUser, categories, habits } = get();
    const target = categories.find((c) => c.id === id);
    // Never allow deleting the default category
    if (!target || target.isDefault || id === 'cat-others') {
      return;
    }

    if (currentUser) {
      await deleteCategoryFromDb(currentUser.uid, id);

      // Reassign habits belonging to this category to 'cat-others' in DB
      const habitsToReassign = habits.filter((h) => h.categoryId === id);
      for (const h of habitsToReassign) {
        const reassigned: Habit = {
          ...h,
          categoryId: 'cat-others',
          updatedAt: new Date().toISOString(),
        };
        await updateHabitInDb(currentUser.uid, reassigned);
      }
    }

    set((s) => ({
      categories: s.categories.filter((c) => c.id !== id),
      habits: s.habits.map((h) =>
        h.categoryId === id ? { ...h, categoryId: 'cat-others' } : h
      ),
    }));
  },

  addHabit: async (habitData) => {
    const { currentUser } = get();
    const newHabit: Habit = {
      ...habitData,
      id: `hbt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      stats: {
        currentStreak: 0,
        bestStreak: 0,
        timesCompletedThisWeek: 0,
        timesCompletedThisMonth: 0,
        timesCompletedThisYear: 0,
        timesCompletedAllTime: 0,
        totalTrackedDays: 0,
        unlockedChallenges: [],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (currentUser) {
      await addHabitToDb(currentUser.uid, newHabit);
    }
    set((s) => ({ habits: [...s.habits, newHabit] }));
    return newHabit;
  },

  updateHabit: async (updated) => {
    const { currentUser } = get();
    if (currentUser) {
      await updateHabitInDb(currentUser.uid, updated);
    }
    set((s) => ({
      habits: s.habits.map((h) => (h.id === updated.id ? updated : h)),
    }));
  },

  deleteHabit: async (id) => {
    const { currentUser } = get();
    if (currentUser) {
      await deleteHabitFromDb(currentUser.uid, id);
    }
    set((s) => {
      const filteredLogs = Object.fromEntries(
        Object.entries(s.logs).filter(([_, l]) => l.habitId !== id)
      );
      return {
        habits: s.habits.filter((h) => h.id !== id),
        logs: filteredLogs,
      };
    });
  },

  logHabit: async (habitId, dateKey, data) => {
    const state = get();
    const habit = state.habits.find((h) => h.id === habitId);
    if (!habit || !state.currentUser) return;

    const logKey = `${habitId}_${dateKey}`;
    const existingLog = state.logs[logKey] || {};

    const mergedCandidate = {
      ...existingLog,
      ...data,
      date: dateKey,
      habitId,
    };

    const { isSuccess: evaluatedSuccess } = evaluateHabitSuccess(habit, mergedCandidate);
    const status: HabitLogStatus = data.forceStatus ?? (evaluatedSuccess ? 'COMPLETED' : 'PARTIAL');
    const isSuccess = status === 'COMPLETED';

    // XP calculation: calculate delta to prevent duplicate or missing XP on re-complete/edit
    const newXp = isSuccess ? calculateXpForCompletion(habit, habit.stats.currentStreak) : 0;
    const oldXp = existingLog.xpEarned || 0;
    const xpDelta = newXp - oldXp;

    const newLog: HabitLog = {
      date: dateKey,
      habitId,
      status,
      valueYesNo: data.valueYesNo ?? existingLog.valueYesNo,
      valueNumeric: data.valueNumeric ?? existingLog.valueNumeric,
      valueTimerSeconds: data.valueTimerSeconds ?? existingLog.valueTimerSeconds,
      valueChecklistCompletedItemIds:
        data.valueChecklistCompletedItemIds ?? existingLog.valueChecklistCompletedItemIds,
      notes: data.notes ?? existingLog.notes,
      xpEarned: newXp,
      loggedAt: new Date().toISOString(),
    };

    // Save log to Firestore
    await saveLogToDb(state.currentUser.uid, logKey, newLog);

    const updatedLogs = {
      ...state.logs,
      [logKey]: newLog,
    };

    // Recompute streak schedule-aware
    const { currentStreak, bestStreak, unlockedChallenges } = computeHabitStreaks(
      habit,
      updatedLogs
    );

    const allCompletedLogs = Object.values(updatedLogs).filter(
      (l) => l.habitId === habitId && l.status === 'COMPLETED'
    );

    // Filter counts properly per period
    const timesCompletedThisWeek = allCompletedLogs.filter((l) =>
      isDateInThisWeek(l.date)
    ).length;
    const timesCompletedThisMonth = allCompletedLogs.filter((l) =>
      isDateInThisMonth(l.date)
    ).length;
    const timesCompletedThisYear = allCompletedLogs.filter((l) =>
      isDateInThisYear(l.date)
    ).length;
    const timesCompletedAllTime = allCompletedLogs.length;

    const updatedHabit: Habit = {
      ...habit,
      stats: {
        ...habit.stats,
        currentStreak,
        bestStreak,
        unlockedChallenges,
        timesCompletedAllTime,
        timesCompletedThisYear,
        timesCompletedThisMonth,
        timesCompletedThisWeek,
        totalTrackedDays: Object.values(updatedLogs).filter(
          (l) => l.habitId === habitId
        ).length,
      },
      updatedAt: new Date().toISOString(),
    };

    await updateHabitInDb(state.currentUser.uid, updatedHabit);

    // Update user XP in Firestore if changed
    if (state.user && xpDelta !== 0) {
      const newTotalXp = Math.max(0, state.user.gamification.totalXp + xpDelta);
      let newLevel = state.user.gamification.level;
      let newLevelTitle = state.user.gamification.levelTitle;

      for (const tier of WILL_HABIT_TIERS) {
        if (newTotalXp >= tier.minXp) {
          newLevel = tier.level;
          newLevelTitle = tier.title;
        }
      }

      const updatedUser: UserProfile = {
        ...state.user,
        gamification: {
          ...state.user.gamification,
          totalXp: newTotalXp,
          level: newLevel,
          levelTitle: newLevelTitle,
        },
      };

      await saveUserProfileToDb(state.currentUser.uid, updatedUser);
      set((s) => ({ user: updatedUser }));
    }

    // Functional state update avoids stale snapshot overwrite
    set((s) => ({
      logs: {
        ...s.logs,
        [logKey]: newLog,
      },
      habits: s.habits.map((h) => (h.id === habitId ? updatedHabit : h)),
    }));
  },

  skipHabit: async (habitId, dateKey, notes) => {
    const state = get();
    const habit = state.habits.find((h) => h.id === habitId);
    if (!state.currentUser || !habit) return;

    const logKey = `${habitId}_${dateKey}`;
    const existingLog = state.logs[logKey];
    const oldXp = existingLog?.xpEarned || 0;
    const xpDelta = -oldXp;

    const newLog: HabitLog = {
      date: dateKey,
      habitId,
      status: 'SKIPPED',
      notes,
      xpEarned: 0,
      loggedAt: new Date().toISOString(),
    };

    await saveLogToDb(state.currentUser.uid, logKey, newLog);

    const updatedLogs = {
      ...state.logs,
      [logKey]: newLog,
    };

    // Recompute streak and stats after skip
    const { currentStreak, bestStreak, unlockedChallenges } = computeHabitStreaks(
      habit,
      updatedLogs
    );

    const allCompletedLogs = Object.values(updatedLogs).filter(
      (l) => l.habitId === habitId && l.status === 'COMPLETED'
    );

    const timesCompletedThisWeek = allCompletedLogs.filter((l) =>
      isDateInThisWeek(l.date)
    ).length;
    const timesCompletedThisMonth = allCompletedLogs.filter((l) =>
      isDateInThisMonth(l.date)
    ).length;
    const timesCompletedThisYear = allCompletedLogs.filter((l) =>
      isDateInThisYear(l.date)
    ).length;
    const timesCompletedAllTime = allCompletedLogs.length;

    const updatedHabit: Habit = {
      ...habit,
      stats: {
        ...habit.stats,
        currentStreak,
        bestStreak,
        unlockedChallenges,
        timesCompletedAllTime,
        timesCompletedThisYear,
        timesCompletedThisMonth,
        timesCompletedThisWeek,
        totalTrackedDays: Object.values(updatedLogs).filter(
          (l) => l.habitId === habitId
        ).length,
      },
      updatedAt: new Date().toISOString(),
    };

    await updateHabitInDb(state.currentUser.uid, updatedHabit);

    // Revert previously earned XP if user is now skipping a previously completed habit
    if (state.user && xpDelta !== 0) {
      const newTotalXp = Math.max(0, state.user.gamification.totalXp + xpDelta);
      let newLevel = state.user.gamification.level;
      let newLevelTitle = state.user.gamification.levelTitle;

      for (const tier of WILL_HABIT_TIERS) {
        if (newTotalXp >= tier.minXp) {
          newLevel = tier.level;
          newLevelTitle = tier.title;
        }
      }

      const updatedUser: UserProfile = {
        ...state.user,
        gamification: {
          ...state.user.gamification,
          totalXp: newTotalXp,
          level: newLevel,
          levelTitle: newLevelTitle,
        },
      };

      await saveUserProfileToDb(state.currentUser.uid, updatedUser);
      set((s) => ({ user: updatedUser }));
    }

    set((s) => ({
      logs: {
        ...s.logs,
        [logKey]: newLog,
      },
      habits: s.habits.map((h) => (h.id === habitId ? updatedHabit : h)),
    }));
  },

  addHabitBreak: async (data) => {
    const { currentUser } = get();
    const newBreak: HabitBreak = {
      id: `brk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: data.name,
      categoryId: data.categoryId,
      icon: data.icon,
      color: data.color,
      description: data.description,
      startedAt: new Date().toISOString(),
      bestStreakSeconds: 0,
      unlockedMilestones: [],
      relapseHistory: [],
      createdAt: new Date().toISOString(),
    };

    if (currentUser) {
      await addHabitBreakToDb(currentUser.uid, newBreak);
    }
    set((s) => ({ habitBreaks: [...s.habitBreaks, newBreak] }));
    return newBreak;
  },

  relapseHabitBreak: async (id, reason) => {
    const { currentUser, habitBreaks } = get();
    const target = habitBreaks.find((b) => b.id === id);
    if (!target || !currentUser) return;

    const elapsedSeconds = Math.max(
      0,
      Math.floor((Date.now() - new Date(target.startedAt).getTime()) / 1000)
    );
    const bestStreakSeconds = Math.max(target.bestStreakSeconds, elapsedSeconds);

    const updated: HabitBreak = {
      ...target,
      bestStreakSeconds,
      startedAt: new Date().toISOString(),
      relapseHistory: [
        ...target.relapseHistory,
        {
          id: `rel-${Date.now()}`,
          endedAt: new Date().toISOString(),
          durationSeconds: elapsedSeconds,
          reason,
        },
      ],
    };

    await updateHabitBreakInDb(currentUser.uid, updated);
    set((s) => ({
      habitBreaks: s.habitBreaks.map((b) => (b.id === id ? updated : b)),
    }));
  },

  deleteHabitBreak: async (id) => {
    const { currentUser } = get();
    if (currentUser) {
      await deleteHabitBreakFromDb(currentUser.uid, id);
    }
    set((s) => ({
      habitBreaks: s.habitBreaks.filter((b) => b.id !== id),
    }));
  },

  resetStore: () =>
    set({
      currentUser: null,
      authLoading: false,
      user: null,
      profileLoading: false,
      categories: [DEFAULT_CATEGORY],
      habits: [],
      logs: {},
      habitBreaks: [],
    }),
}));
