import { create } from 'zustand';
import {
  Category,
  Challenge,
  ChallengeDayLog,
  ChallengeTask,
  Habit,
  HabitBreak,
  HabitLog,
  HabitLogStatus,
  MissedReasonType,
  UserProfile,
} from '../types/habit';
import {
  getTodayKey,
  isDateInThisWeek,
  isDateInThisMonth,
  isDateInThisYear,
  isHabitDueOnDate,
} from '../utils/dateMath';
import { parseISO, addDays, format } from 'date-fns';
import confetti from 'canvas-confetti';
import {
  computeHabitStreaks,
  evaluateHabitSuccess,
  calculateXpForCompletion,
  getUsedExcusesInMonth,
} from '../utils/streakEngine';
import { WILL_HABIT_TIERS, MISS_PENALTIES, levelFromXp, calculateMaxHearts } from '../constants/gamification';
import { hashSecurityAnswer } from '../utils/cryptoUtils';
import { doc, getDoc } from 'firebase/firestore';
import {
  FirebaseUser,
  db,
} from '../services/firebase';
import {
  saveUserProfileToDb,
  addCategoryToDb,
  deleteCategoryFromDb,
  saveCategoriesOrderToDb,
  addHabitToDb,
  updateHabitInDb,
  deleteHabitFromDb,
  saveLogToDb,
  addHabitBreakToDb,
  updateHabitBreakInDb,
  deleteHabitBreakFromDb,
  addChallengeToDb,
  updateChallengeInDb,
  deleteChallengeFromDb,
  resetEntireUserDataInDb,
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
  profileStatus: 'loading' | 'exists' | 'missing' | 'unknown';
  syncError: string | null;
  setUser: (profile: UserProfile | null) => void;
  setProfileLoading: (loading: boolean) => void;
  setProfileStatus: (status: 'loading' | 'exists' | 'missing' | 'unknown') => void;
  setSyncError: (error: string | null) => void;
  softResetAccount: () => Promise<void>;
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
  reorderCategories: (ordered: Category[]) => Promise<void>;
  addCategory: (cat: Omit<Category, 'id' | 'createdAt'>) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;

  // Habits
  habits: Habit[];
  setHabits: (habits: Habit[]) => void;
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt' | 'stats'>) => Promise<Habit>;
  updateHabit: (habit: Habit) => Promise<void>;
  toggleArchiveHabit: (id: string, isArchived?: boolean) => Promise<void>;
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
  logMissedHabit: (
    habitId: string,
    dateKey: string,
    reasonType: MissedReasonType,
    reasonText?: string
  ) => Promise<void>;

  // Timer Habit Break
  habitBreaks: HabitBreak[];
  setHabitBreaks: (breaks: HabitBreak[]) => void;
  addHabitBreak: (data: {
    name: string;
    categoryId: string;
    icon: string;
    color: string;
    description?: string;
    startedAt?: string;
  }) => Promise<HabitBreak>;
  relapseHabitBreak: (id: string, reason?: string) => Promise<void>;
  deleteHabitBreak: (id: string) => Promise<void>;

  // Hardcore Challenges (7, 9, 11, or Custom Days with 90% Health Deduction Punishment)
  challenges: Challenge[];
  setChallenges: (challenges: Challenge[]) => void;
  addChallenge: (data: {
    name: string;
    icon: string;
    color: string;
    targetDays: number;
    startDate?: string;
    tasks?: ChallengeTask[];
  }) => Promise<Challenge>;
  logChallengeDay: (
    challengeId: string,
    dateKey: string,
    completedTaskIds?: string[],
    forceComplete?: boolean
  ) => Promise<void>;
  failChallengeDay: (challengeId: string, dateKey: string) => Promise<void>;
  deleteChallenge: (id: string) => Promise<void>;

  // Security Question & Fresh Account Reset
  setSecurityQuestion: (question: string, answer: string) => Promise<void>;
  resetEntireAccount: () => Promise<void>;

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
  profileStatus: 'loading',
  syncError: null,
  setUser: (profile) => {
    if (profile && profile.gamification) {
      const calculatedMax = calculateMaxHearts(profile.gamification.totalXp ?? 0);
      profile.gamification.maxHearts = calculatedMax;
      if (typeof profile.gamification.hearts !== 'number') {
        profile.gamification.hearts = calculatedMax;
      } else {
        profile.gamification.hearts = Math.min(calculatedMax, Math.max(0, profile.gamification.hearts));
      }
    }
    set({
      user: profile,
      profileLoading: false,
      profileStatus: profile ? 'exists' : 'missing',
      syncError: null,
    });
  },
  setProfileLoading: (loading) => set({ profileLoading: loading }),
  setProfileStatus: (profileStatus) => set({ profileStatus }),
  setSyncError: (syncError) => set({ syncError }),

  selectedDate: getTodayKey(),
  setSelectedDate: (dateKey) => set({ selectedDate: dateKey }),

  categories: [DEFAULT_CATEGORY],
  setCategories: (categories) => {
    // Deduplicate by normalized name and ensure default "Others" exists
    const uniqueMap = new Map<string, Category>();
    
    // Always include default category
    uniqueMap.set('others', DEFAULT_CATEGORY);

    for (const cat of categories) {
      const norm = cat.name.trim().toLowerCase();
      if (!uniqueMap.has(norm)) {
        uniqueMap.set(norm, cat);
      }
    }
    const sorted = Array.from(uniqueMap.values()).sort((a, b) => {
      const ordA = typeof a.order === 'number' ? a.order : 999;
      const ordB = typeof b.order === 'number' ? b.order : 999;
      return ordA - ordB;
    });
    set({ categories: sorted });
  },

  reorderCategories: async (orderedList) => {
    const { currentUser } = get();
    const updated = orderedList.map((cat, idx) => ({
      ...cat,
      order: idx,
    }));
    set({ categories: updated });
    if (currentUser) {
      await saveCategoriesOrderToDb(currentUser.uid, updated);
    }
  },

  habits: [],
  setHabits: (incoming) => {
    // 1. Deduplicate by unique ID
    const byId = Array.from(new Map(incoming.map((h) => [h.id, h])).values());
    // 2. Remove accidental double-write duplicates (same name, categoryId, created within 3s)
    const cleaned: Habit[] = [];
    for (const habit of byId) {
      const isDupe = cleaned.some(
        (existing) =>
          existing.name.trim().toLowerCase() === habit.name.trim().toLowerCase() &&
          existing.categoryId === habit.categoryId &&
          Math.abs(new Date(existing.createdAt).getTime() - new Date(habit.createdAt).getTime()) < 3000 &&
          existing.id !== habit.id
      );
      if (!isDupe) {
        cleaned.push(habit);
      }
    }
    set({ habits: cleaned });
  },

  logs: {},
  setLogs: (logs) => set({ logs }),

  habitBreaks: [],
  setHabitBreaks: (incoming) => {
    // 1. Deduplicate by unique ID
    const byId = Array.from(new Map(incoming.map((b) => [b.id, b])).values());
    // 2. Remove accidental double-write duplicates (same name, categoryId, created within 3s)
    const cleaned: HabitBreak[] = [];
    for (const brk of byId) {
      const isDupe = cleaned.some(
        (existing) =>
          existing.name.trim().toLowerCase() === brk.name.trim().toLowerCase() &&
          existing.categoryId === brk.categoryId &&
          Math.abs(new Date(existing.createdAt).getTime() - new Date(brk.createdAt).getTime()) < 3000 &&
          existing.id !== brk.id
      );
      if (!isDupe) {
        cleaned.push(brk);
      }
    }
    set({ habitBreaks: cleaned });
  },

  challenges: [],
  setChallenges: (incoming) => {
    const byId = Array.from(new Map(incoming.map((c) => [c.id, c])).values());
    set({ challenges: byId });
  },

  completeOnboarding: async (data) => {
    const { currentUser, user } = get();
    if (!currentUser) return;
    // Guard against overwriting an existing onboarded profile in memory
    if (user && user.isOnboarded) return;

    // Read the server doc first before writing to prevent accidental overwrite of existing gamification/profile
    let existingDocData: Partial<UserProfile> | null = null;
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        existingDocData = snap.data() as UserProfile;
        if (existingDocData.isOnboarded) {
          set({
            user: existingDocData as UserProfile,
            profileLoading: false,
            profileStatus: 'exists',
          });
          return;
        }
      }
    } catch (e) {
      console.warn('Could not read existing doc during onboarding check:', e);
    }

    const tier = WILL_HABIT_TIERS[0];
    const existingGamification = existingDocData?.gamification || user?.gamification;

    const newProfile: UserProfile = {
      name: data.name,
      age: data.age,
      relationStatus: data.relationStatus,
      gender: data.gender,
      isOnboarded: true,
      gamification:
        existingGamification && typeof existingGamification.totalXp === 'number'
          ? existingGamification
          : {
              level: tier.level,
              levelTitle: tier.title,
              totalXp: 150, // Welcome XP
              consistencyScore: 100,
              hearts: 5,
              maxHearts: 5,
            },
    };

    // Save directly to Firestore (no localStorage)
    await saveUserProfileToDb(currentUser.uid, newProfile);
    set({ user: newProfile, profileLoading: false, profileStatus: 'exists' });

    // Also initialize default "Others" category in Firestore if empty
    await addCategoryToDb(currentUser.uid, DEFAULT_CATEGORY);
  },

  addCategory: async (catData) => {
    const { currentUser, categories } = get();
    const norm = catData.name.trim().toLowerCase();
    const existing = categories.find((c) => c.name.trim().toLowerCase() === norm);
    if (existing) {
      return existing; // Return existing category, prevent duplicates!
    }

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
    const { currentUser, habits } = get();
    // Guard against rapid duplicate submissions
    const isRecentDuplicate = habits.some(
      (h) =>
        h.name.trim().toLowerCase() === habitData.name.trim().toLowerCase() &&
        h.categoryId === habitData.categoryId &&
        Date.now() - new Date(h.createdAt).getTime() < 3000
    );
    if (isRecentDuplicate) {
      return habits.find(
        (h) =>
          h.name.trim().toLowerCase() === habitData.name.trim().toLowerCase() &&
          h.categoryId === habitData.categoryId
      )!;
    }

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
    set((s) => ({
      habits: s.habits.some((h) => h.id === newHabit.id) ? s.habits : [...s.habits, newHabit],
    }));
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

  toggleArchiveHabit: async (id, forceArchived) => {
    const { currentUser, habits } = get();
    const target = habits.find((h) => h.id === id);
    if (!target) return;

    const updated: Habit = {
      ...target,
      isArchived: typeof forceArchived === 'boolean' ? forceArchived : !target.isArchived,
      updatedAt: new Date().toISOString(),
    };

    if (currentUser) {
      await updateHabitInDb(currentUser.uid, updated);
    }
    set((s) => ({
      habits: s.habits.map((h) => (h.id === id ? updated : h)),
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
    let newXp = 0;
    if (isSuccess) {
      const fullXp = calculateXpForCompletion(habit, habit.stats.currentStreak);
      if (habit.type === 'CHECKLIST') {
        const totalItems = habit.config.checklist?.items?.length || 1;
        const completedCount = mergedCandidate.valueChecklistCompletedItemIds?.length || 0;
        const ratio = totalItems > 0 ? Math.min(1, Math.max(0, completedCount / totalItems)) : 1;
        newXp = Math.round(fullXp * ratio);
      } else {
        newXp = fullXp;
      }
    }
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

    // 100% PERFECT DAY BONUS ALGORITHM
    let perfectDayBonusAwarded = false;
    let perfectDaysList = state.user?.gamification?.perfectDaysCompleted || [];
    let extraBonusXp = 0;
    let bonusHeartHealed = 0;

    if (status === 'COMPLETED' && state.user) {
      try {
        const parsedDate = parseISO(dateKey);
        const dueHabits = state.habits.filter(
          (h) => !h.isArchived && isHabitDueOnDate(h, parsedDate, updatedLogs)
        );

        if (dueHabits.length > 0) {
          const allCompleted = dueHabits.every((h) => {
            const hLogKey = `${h.id}_${dateKey}`;
            const logEntry = h.id === habitId ? newLog : updatedLogs[hLogKey];
            return logEntry?.status === 'COMPLETED' || logEntry?.status === 'EXCUSED';
          });

          if (allCompleted && !perfectDaysList.includes(dateKey)) {
            perfectDayBonusAwarded = true;
            extraBonusXp = 100; // +100 Perfect Day Willpower XP Bonus!
            perfectDaysList = [...perfectDaysList, dateKey];
            if ((state.user.gamification.hearts ?? 5) < (state.user.gamification.maxHearts ?? 5)) {
              bonusHeartHealed = 1;
            }

            // Confetti celebration
            confetti({
              particleCount: 100,
              spread: 80,
              origin: { y: 0.5 },
              colors: ['#10B981', '#F59E0B', '#3B82F6', '#EC4899'],
            });
          }
        }
      } catch (e) {
        console.error('Error computing perfect day bonus:', e);
      }
    }

    // Update user XP & vitality in Firestore if changed
    const totalXpDelta = xpDelta + extraBonusXp;
    if (state.user && (totalXpDelta !== 0 || bonusHeartHealed > 0 || perfectDayBonusAwarded)) {
      const newTotalXp = Math.max(0, state.user.gamification.totalXp + totalXpDelta);
      const lvlInfo = levelFromXp(newTotalXp);
      const oldMaxHearts = state.user.gamification.maxHearts ?? 5;
      const newMaxHearts = calculateMaxHearts(newTotalXp);
      const heartCapacityGain = Math.max(0, newMaxHearts - oldMaxHearts);
      const currentHearts = state.user.gamification.hearts ?? 5;
      const newHearts = Math.min(newMaxHearts, currentHearts + heartCapacityGain + bonusHeartHealed);

      const updatedUser: UserProfile = {
        ...state.user,
        gamification: {
          ...state.user.gamification,
          totalXp: newTotalXp,
          level: lvlInfo.level,
          levelTitle: lvlInfo.title,
          hearts: newHearts,
          maxHearts: newMaxHearts,
          perfectDaysCompleted: perfectDaysList,
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
      const lvlInfo = levelFromXp(newTotalXp);
      const newLevel = lvlInfo.level;
      const newLevelTitle = lvlInfo.title;

      const newMaxHearts = calculateMaxHearts(newTotalXp);
      const currentHearts = state.user.gamification.hearts ?? 5;
      const newHearts = Math.min(newMaxHearts, currentHearts);

      const updatedUser: UserProfile = {
        ...state.user,
        gamification: {
          ...state.user.gamification,
          totalXp: newTotalXp,
          level: newLevel,
          levelTitle: newLevelTitle,
          hearts: newHearts,
          maxHearts: newMaxHearts,
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

  logMissedHabit: async (habitId, dateKey, reasonType, reasonText) => {
    const state = get();
    const habit = state.habits.find((h) => h.id === habitId);
    if (!state.currentUser || !habit) return;

    const logKey = `${habitId}_${dateKey}`;
    const existingLog = state.logs[logKey];
    const oldXp = existingLog?.xpEarned || 0;

    // Monthly cap check for genuine excuses (max 3 per month per habit)
    const monthKey = dateKey.substring(0, 7);
    if (reasonType === 'GENUINE_REASON') {
      const usedExcusesThisMonth = getUsedExcusesInMonth(habitId, monthKey, state.logs);
      if (usedExcusesThisMonth >= MISS_PENALTIES.GENUINE_REASON.maxPerMonth) {
        throw new Error('Monthly excuse limit of 3 reached for this habit. Please choose another option.');
      }
    }

    const penaltyConfig = MISS_PENALTIES[reasonType];
    const status: HabitLogStatus = reasonType === 'GENUINE_REASON' ? 'EXCUSED' : reasonType === 'FORGOT_ACCIDENTAL' ? 'MISSED' : 'FAILED';
    const xpEarned = -penaltyConfig.xpPenalty;
    const heartLoss = penaltyConfig.heartsLost;

    const xpDelta = xpEarned - oldXp;

    const newLog: HabitLog = {
      date: dateKey,
      habitId,
      status,
      missedReasonType: reasonType,
      missedReasonText: reasonText,
      notes: reasonText,
      xpEarned,
      loggedAt: new Date().toISOString(),
    };

    await saveLogToDb(state.currentUser.uid, logKey, newLog);

    const updatedLogs = {
      ...state.logs,
      [logKey]: newLog,
    };

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

    if (state.user) {
      const currentHearts = state.user.gamification.hearts ?? 5;
      const newHearts = Math.max(0, currentHearts - heartLoss);
      const newTotalXp = Math.max(0, state.user.gamification.totalXp + xpDelta);

      const lvlInfo = levelFromXp(newTotalXp);
      const newLevel = lvlInfo.level;
      const newLevelTitle = lvlInfo.title;

      const newMaxHearts = calculateMaxHearts(newTotalXp);

      const updatedUser: UserProfile = {
        ...state.user,
        gamification: {
          ...state.user.gamification,
          hearts: newHearts,
          maxHearts: newMaxHearts,
          totalXp: newTotalXp,
          level: newLevel,
          levelTitle: newLevelTitle,
        },
      };

      await saveUserProfileToDb(state.currentUser.uid, updatedUser);
      set({ user: updatedUser });
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
    const { currentUser, habitBreaks } = get();
    // Guard against rapid duplicate submissions
    const isRecentDuplicate = habitBreaks.some(
      (b) =>
        b.name.trim().toLowerCase() === data.name.trim().toLowerCase() &&
        b.categoryId === data.categoryId &&
        Date.now() - new Date(b.createdAt).getTime() < 3000
    );
    if (isRecentDuplicate) {
      return habitBreaks.find(
        (b) =>
          b.name.trim().toLowerCase() === data.name.trim().toLowerCase() &&
          b.categoryId === data.categoryId
      )!;
    }

    const newBreak: HabitBreak = {
      id: `brk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: data.name,
      categoryId: data.categoryId,
      icon: data.icon,
      color: data.color,
      description: data.description,
      startedAt: data.startedAt || new Date().toISOString(),
      bestStreakSeconds: 0,
      unlockedMilestones: [],
      relapseHistory: [],
      createdAt: new Date().toISOString(),
    };

    if (currentUser) {
      await addHabitBreakToDb(currentUser.uid, newBreak);
    }
    set((s) => ({
      habitBreaks: s.habitBreaks.some((b) => b.id === newBreak.id) ? s.habitBreaks : [...s.habitBreaks, newBreak],
    }));
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

  addChallenge: async (data) => {
    const { currentUser } = get();
    const startDate = data.startDate || getTodayKey();
    const daysCount = Math.max(1, Number(data.targetDays) || 7);
    const endDate = format(addDays(parseISO(startDate), daysCount - 1), 'yyyy-MM-dd');

    const newChallenge: Challenge = {
      id: `chl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: data.name.trim(),
      icon: data.icon || 'flame',
      color: data.color || '#EA2804',
      targetDays: daysCount,
      startDate,
      endDate,
      tasks: data.tasks && data.tasks.length > 0 ? data.tasks : [],
      dayLogs: {},
      status: 'ACTIVE',
      rulesAccepted: true,
      totalXpEarned: 0,
      totalHeartsLost: 0,
      totalHeartsGained: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (currentUser) {
      await addChallengeToDb(currentUser.uid, newChallenge);
    }
    set((s) => ({
      challenges: s.challenges.some((c) => c.id === newChallenge.id)
        ? s.challenges
        : [newChallenge, ...s.challenges],
    }));
    return newChallenge;
  },

  logChallengeDay: async (challengeId, dateKey, completedTaskIds, forceComplete) => {
    const state = get();
    const challenge = state.challenges.find((c) => c.id === challengeId);
    if (!challenge || !state.currentUser) return;

    const existingLogs = challenge.dayLogs || {};
    const prevLog = existingLogs[dateKey];
    const wasAlreadyCompleted = prevLog?.status === 'COMPLETED';

    const hasSubTasks = Array.isArray(challenge.tasks) && challenge.tasks.length > 0;
    const effectiveTaskIds =
      completedTaskIds ??
      (forceComplete && hasSubTasks ? challenge.tasks.map((t) => t.id) : prevLog?.completedTaskIds || []);

    const isAllTasksDone = hasSubTasks
      ? effectiveTaskIds.length >= challenge.tasks.length || Boolean(forceComplete)
      : true;

    if (!isAllTasksDone) {
      // Partial task check-in on a multi-task challenge
      const partialLog: ChallengeDayLog = {
        date: dateKey,
        status: 'PARTIAL',
        completedTaskIds: effectiveTaskIds,
        xpEarned: 0,
        heartsDelta: 0,
        loggedAt: new Date().toISOString(),
      };
      const updatedChallenge: Challenge = {
        ...challenge,
        dayLogs: {
          ...existingLogs,
          [dateKey]: partialLog,
        },
        updatedAt: new Date().toISOString(),
      };
      await updateChallengeInDb(state.currentUser.uid, updatedChallenge);
      set((s) => ({
        challenges: s.challenges.map((c) => (c.id === challengeId ? updatedChallenge : c)),
      }));
      return;
    }

    // Daily Completion Reward: +50 XP & +1 Heart healed
    const dailyXp = 50;
    const dailyHeartHeal = 1;

    const newDayLog: ChallengeDayLog = {
      date: dateKey,
      status: 'COMPLETED',
      completedTaskIds: effectiveTaskIds,
      xpEarned: dailyXp,
      heartsDelta: dailyHeartHeal,
      loggedAt: new Date().toISOString(),
    };

    const nextDayLogs: Record<string, ChallengeDayLog> = {
      ...existingLogs,
      [dateKey]: newDayLog,
    };

    const completedDaysCount = Object.values(nextDayLogs).filter(
      (l) => l.status === 'COMPLETED'
    ).length;

    const isChallengeNowConquered =
      completedDaysCount >= challenge.targetDays && challenge.status !== 'COMPLETED';

    // Full Challenge Victory Bonus: +(targetDays * 30) XP & Full Health Restore (+2 Hearts)
    const victoryBonusXp = isChallengeNowConquered ? challenge.targetDays * 30 : 0;
    const victoryHeartHeal = isChallengeNowConquered ? 2 : 0;

    const xpGain = (wasAlreadyCompleted ? 0 : dailyXp) + victoryBonusXp;
    const heartGain = (wasAlreadyCompleted ? 0 : dailyHeartHeal) + victoryHeartHeal;

    const updatedChallenge: Challenge = {
      ...challenge,
      dayLogs: nextDayLogs,
      status: isChallengeNowConquered || challenge.status === 'COMPLETED' ? 'COMPLETED' : 'ACTIVE',
      completedAt: isChallengeNowConquered
        ? new Date().toISOString()
        : challenge.completedAt,
      totalXpEarned: (challenge.totalXpEarned || 0) + xpGain,
      totalHeartsGained: (challenge.totalHeartsGained || 0) + heartGain,
      updatedAt: new Date().toISOString(),
    };

    await updateChallengeInDb(state.currentUser.uid, updatedChallenge);

    if (state.user && (xpGain > 0 || heartGain > 0)) {
      const newTotalXp = Math.max(0, (state.user.gamification.totalXp || 0) + xpGain);
      const lvlInfo = levelFromXp(newTotalXp);
      const newMaxHearts = calculateMaxHearts(newTotalXp);
      const currentHearts = state.user.gamification.hearts ?? 5;
      const newHearts = isChallengeNowConquered
        ? newMaxHearts
        : Math.min(newMaxHearts, Number((currentHearts + heartGain).toFixed(1)));

      const updatedUser: UserProfile = {
        ...state.user,
        gamification: {
          ...state.user.gamification,
          totalXp: newTotalXp,
          level: lvlInfo.level,
          levelTitle: lvlInfo.title,
          hearts: newHearts,
          maxHearts: newMaxHearts,
        },
      };

      await saveUserProfileToDb(state.currentUser.uid, updatedUser);
      set({ user: updatedUser });
    }

    confetti({
      particleCount: isChallengeNowConquered ? 120 : 55,
      spread: isChallengeNowConquered ? 90 : 65,
      origin: { y: 0.6 },
    });

    set((s) => ({
      challenges: s.challenges.map((c) => (c.id === challengeId ? updatedChallenge : c)),
    }));
  },

  failChallengeDay: async (challengeId, dateKey) => {
    const state = get();
    const challenge = state.challenges.find((c) => c.id === challengeId);
    if (!challenge || !state.currentUser) return;

    const existingLogs = challenge.dayLogs || {};
    if (existingLogs[dateKey]?.status === 'FAILED') return;

    // 90% HEALTH DEDUCTION PUNISHMENT!
    const currentHearts = state.user?.gamification?.hearts ?? 5;
    const deductedHearts = Number((currentHearts * 0.9).toFixed(2));
    const remainingHearts = Math.max(0.05, Number((currentHearts - deductedHearts).toFixed(2)));
    const xpPenalty = 50;

    const failedLog: ChallengeDayLog = {
      date: dateKey,
      status: 'FAILED',
      completedTaskIds: [],
      xpEarned: -xpPenalty,
      heartsDelta: -deductedHearts,
      loggedAt: new Date().toISOString(),
    };

    const nextDayLogs: Record<string, ChallengeDayLog> = {
      ...existingLogs,
      [dateKey]: failedLog,
    };

    const updatedChallenge: Challenge = {
      ...challenge,
      dayLogs: nextDayLogs,
      totalHeartsLost: Number(((challenge.totalHeartsLost || 0) + deductedHearts).toFixed(1)),
      updatedAt: new Date().toISOString(),
    };

    await updateChallengeInDb(state.currentUser.uid, updatedChallenge);

    if (state.user) {
      const newTotalXp = Math.max(0, (state.user.gamification.totalXp || 0) - xpPenalty);
      const lvlInfo = levelFromXp(newTotalXp);
      const newMaxHearts = calculateMaxHearts(newTotalXp);

      const updatedUser: UserProfile = {
        ...state.user,
        gamification: {
          ...state.user.gamification,
          hearts: Math.min(newMaxHearts, remainingHearts),
          maxHearts: newMaxHearts,
          totalXp: newTotalXp,
          level: lvlInfo.level,
          levelTitle: lvlInfo.title,
        },
      };

      await saveUserProfileToDb(state.currentUser.uid, updatedUser);
      set({ user: updatedUser });
    }

    set((s) => ({
      challenges: s.challenges.map((c) => (c.id === challengeId ? updatedChallenge : c)),
    }));
  },

  deleteChallenge: async (id) => {
    const { currentUser } = get();
    if (currentUser) {
      await deleteChallengeFromDb(currentUser.uid, id);
    }
    set((s) => ({
      challenges: s.challenges.filter((c) => c.id !== id),
    }));
  },

  setSecurityQuestion: async (question, answer) => {
    const { currentUser, user } = get();
    if (!currentUser || !user) return;
    const normalizedAnswer = answer.trim().toLowerCase();
    const { hash, salt } = await hashSecurityAnswer(normalizedAnswer);
    const updatedUser: UserProfile = {
      ...user,
      security: {
        question: question.trim(),
        answerHash: hash,
        salt,
      },
    };
    await saveUserProfileToDb(currentUser.uid, updatedUser);
    set({ user: updatedUser });
  },

  softResetAccount: async () => {
    const { currentUser, user } = get();
    if (!currentUser || !user) return;
    const currentXp = user.gamification?.totalXp ?? 0;
    const xpPenalty = Math.min(100, currentXp);
    const newXp = Math.max(0, currentXp - xpPenalty);
    const maxH = calculateMaxHearts(newXp);
    const updatedUser: UserProfile = {
      ...user,
      gamification: {
        ...user.gamification,
        hearts: maxH,
        maxHearts: maxH,
        totalXp: newXp,
        lastDeathAt: new Date().toISOString(),
      },
    };
    await saveUserProfileToDb(currentUser.uid, updatedUser);
    set({ user: updatedUser });
  },

  resetEntireAccount: async () => {
    const { currentUser, user } = get();
    if (!currentUser) return;
    await resetEntireUserDataInDb(currentUser.uid);
    set({
      habits: [],
      logs: {},
      categories: [DEFAULT_CATEGORY],
      habitBreaks: [],
      challenges: [],
      user: user
        ? {
            ...user,
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
          }
        : null,
    });
  },

  resetStore: () =>
    set({
      currentUser: null,
      authLoading: false,
      user: null,
      profileLoading: false,
      profileStatus: 'loading',
      syncError: null,
      categories: [DEFAULT_CATEGORY],
      habits: [],
      logs: {},
      habitBreaks: [],
      challenges: [],
    }),
}));
