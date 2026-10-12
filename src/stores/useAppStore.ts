import { create } from 'zustand';
import {
  Category,
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
import { parseISO } from 'date-fns';
import confetti from 'canvas-confetti';
import {
  computeHabitStreaks,
  evaluateHabitSuccess,
  calculateXpForCompletion,
  getUsedExcusesInMonth,
} from '../utils/streakEngine';
import { WILL_HABIT_TIERS, MISS_PENALTIES, levelFromXp, calculateMaxHearts } from '../constants/gamification';
import {
  FirebaseUser,
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
  syncError: string | null;
  setUser: (profile: UserProfile | null) => void;
  setProfileLoading: (loading: boolean) => void;
  setSyncError: (error: string | null) => void;
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
  }) => Promise<HabitBreak>;
  relapseHabitBreak: (id: string, reason?: string) => Promise<void>;
  deleteHabitBreak: (id: string) => Promise<void>;

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
    set({ user: profile, profileLoading: false, syncError: null });
  },
  setProfileLoading: (loading) => set({ profileLoading: loading }),
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
        hearts: 5,
        maxHearts: 5,
      },
    };

    // Save directly to Firestore (no localStorage)
    await saveUserProfileToDb(currentUser.uid, newProfile);
    set({ user: newProfile, profileLoading: false });

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
          (h) => !h.isArchived && isHabitDueOnDate(h, parsedDate)
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
      let newLevel = state.user.gamification.level;
      let newLevelTitle = state.user.gamification.levelTitle;

      for (const tier of WILL_HABIT_TIERS) {
        if (newTotalXp >= tier.minXp) {
          newLevel = tier.level;
          newLevelTitle = tier.title;
        }
      }

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

      let newLevel = state.user.gamification.level;
      let newLevelTitle = state.user.gamification.levelTitle;
      for (const tier of WILL_HABIT_TIERS) {
        if (newTotalXp >= tier.minXp) {
          newLevel = tier.level;
          newLevelTitle = tier.title;
        }
      }

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
      startedAt: new Date().toISOString(),
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

  setSecurityQuestion: async (question, answer) => {
    const { currentUser, user } = get();
    if (!currentUser || !user) return;
    const normalizedAnswer = answer.trim().toLowerCase();
    const updatedUser: UserProfile = {
      ...user,
      security: {
        question: question.trim(),
        answer: normalizedAnswer,
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
      syncError: null,
      categories: [DEFAULT_CATEGORY],
      habits: [],
      logs: {},
      habitBreaks: [],
    }),
}));
