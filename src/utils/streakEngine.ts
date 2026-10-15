import { Habit, HabitLog } from '../types/habit';
import { STREAK_CHALLENGES } from '../constants/gamification';
import {
  differenceInCalendarDays,
  parseISO,
  addDays,
  format,
  startOfWeek,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  addYears,
  subYears,
} from 'date-fns';
import { isHabitDueOnDate, getTodayKey } from './dateMath';

export function evaluateHabitSuccess(
  habit: Habit,
  log?: Partial<HabitLog>
): { isSuccess: boolean; progressRatio: number } {
  if (!log) return { isSuccess: false, progressRatio: 0 };

  switch (habit.type) {
    case 'YES_NO':
      return {
        isSuccess: Boolean(log.valueYesNo),
        progressRatio: log.valueYesNo ? 1 : 0,
      };

    case 'NUMERIC': {
      const cfg = habit.config.numeric;
      if (!cfg) return { isSuccess: false, progressRatio: 0 };
      if (log.valueNumeric === undefined && log.status !== 'COMPLETED') {
        return { isSuccess: false, progressRatio: 0 };
      }
      const current = Number(log.valueNumeric) || 0;
      const rawGoal = Number(cfg.goal);
      const goal = Number.isFinite(rawGoal) ? rawGoal : 1;
      const op = (cfg.operator || 'AT_LEAST').toUpperCase();
      let ok = false;
      if (op === 'LESS_THAN') ok = log.valueNumeric !== undefined && current < goal;
      else if (op === 'EXACTLY') ok = current === goal;
      else if (op === 'ANY_VALUE') ok = current > 0;
      else ok = current >= goal;

      let ratio = 0;
      if (op === 'LESS_THAN') {
        ratio = goal > 0 ? Math.min(1, Math.max(0, 1 - current / goal)) : current < goal ? 1 : 0;
      } else {
        ratio = goal > 0 ? Math.min(1, Math.max(0, current / goal)) : ok ? 1 : 0;
      }

      return {
        isSuccess: ok,
        progressRatio: ratio,
      };
    }

    case 'TIMER': {
      const cfg = habit.config.timer;
      if (!cfg) return { isSuccess: false, progressRatio: 0 };
      if (log.valueTimerSeconds === undefined && log.status !== 'COMPLETED') {
        return { isSuccess: false, progressRatio: 0 };
      }
      const current = Number(log.valueTimerSeconds) || 0;
      const rawTarget = Number(cfg.targetSeconds);
      const target = Number.isFinite(rawTarget) ? rawTarget : 1;
      const op = (cfg.operator || 'AT_LEAST').toUpperCase();
      let ok = false;
      if (op === 'LESS_THAN') ok = log.valueTimerSeconds !== undefined && current < target;
      else if (op === 'ANY_VALUE') ok = current > 0;
      else ok = current >= target;

      let ratio = 0;
      if (op === 'LESS_THAN') {
        ratio = target > 0 ? Math.min(1, Math.max(0, 1 - current / target)) : current < target ? 1 : 0;
      } else {
        ratio = target > 0 ? Math.min(1, Math.max(0, current / target)) : ok ? 1 : 0;
      }

      return {
        isSuccess: ok,
        progressRatio: ratio,
      };
    }

    case 'CHECKLIST': {
      const cfg = habit.config.checklist;
      if (!cfg || !cfg.items.length) return { isSuccess: false, progressRatio: 0 };
      const validItemIds = new Set(cfg.items.map((it) => it.id));
      const rawCompleted = log.valueChecklistCompletedItemIds || [];
      const completed = rawCompleted.filter((id) => validItemIds.has(id));

      if (cfg.successCondition === 'ALL_MANDATORY') {
        const ok = cfg.items.every((it) => completed.includes(it.id));
        return {
          isSuccess: ok,
          progressRatio: Math.min(1, Math.max(0, completed.length / cfg.items.length)),
        };
      } else if (cfg.successCondition === 'STARRED_ONLY') {
        const starred = cfg.items.filter((it) => it.isStarred);
        if (!starred.length) {
          const ok = completed.length > 0;
          return {
            isSuccess: ok,
            progressRatio: Math.min(1, Math.max(0, completed.length / cfg.items.length)),
          };
        }
        const ok = starred.every((it) => completed.includes(it.id));
        return {
          isSuccess: ok,
          progressRatio: Math.min(1, Math.max(0, completed.length / starred.length)),
        };
      } else {
        // CUSTOM_MIN_ITEMS
        const minReq = cfg.customMinCount || 1;
        const ok = completed.length >= minReq;
        return {
          isSuccess: ok,
          progressRatio: Math.min(1, Math.max(0, completed.length / minReq)),
        };
      }
    }

    default:
      return { isSuccess: false, progressRatio: 0 };
  }
}

/**
 * Returns how many EXCUSED logs a habit has used in a given month (format: 'yyyy-MM').
 */
export function getUsedExcusesInMonth(
  habitId: string,
  monthKey: string,
  allLogs: Record<string, HabitLog>
): number {
  return Object.values(allLogs).filter(
    (l) => l.habitId === habitId && l.status === 'EXCUSED' && l.date.startsWith(monthKey)
  ).length;
}

/**
 * Checks whether any date strictly between fromDate and toDate was a due date
 * that was not completed or excused.
 */
function hasMissedDueDay(
  habit: Habit,
  fromDate: Date,
  toDate: Date,
  allLogs: Record<string, HabitLog>
): boolean {
  if (habit.frequency.type === 'JUST_TRACKING') {
    return false;
  }
  const totalDays = differenceInCalendarDays(toDate, fromDate);
  if (totalDays <= 1) return false;
  // If gap is more than 365 days and habit is not yearly, it has missed due days
  if (totalDays > 365 && habit.frequency.type !== 'SPECIFIC_DAYS_OF_YEAR') {
    return true;
  }
  let check = addDays(fromDate, 1);
  let iterations = 0;
  while (differenceInCalendarDays(toDate, check) > 0 && iterations < 366) {
    iterations++;
    if (isHabitDueOnDate(habit, check, allLogs)) {
      const checkKey = format(check, 'yyyy-MM-dd');
      const log = allLogs[`${habit.id}_${checkKey}`];
      // If no log exists or it was marked MISSED/SKIPPED, then it was a missed due date!
      if (!log || (log.status !== 'COMPLETED' && log.status !== 'EXCUSED')) {
        return true;
      }
    }
    check = addDays(check, 1);
  }
  return iterations >= 366;
}

export function computeHabitStreaks(
  habit: Habit,
  allLogs: Record<string, HabitLog>
): {
  currentStreak: number;
  bestStreak: number;
  unlockedChallenges: number[];
} {
  // SPECIAL CASE: JUST_TRACKING (Flexible tracking, no broken streaks, total completed logs)
  if (habit.frequency.type === 'JUST_TRACKING') {
    const completedDates = Object.values(allLogs)
      .filter((l) => l.habitId === habit.id && l.status === 'COMPLETED')
      .map((l) => l.date);
    const count = completedDates.length;
    const unlocked = STREAK_CHALLENGES.filter((c) => count >= c.days).map((c) => c.days);
    return {
      currentStreak: count,
      bestStreak: count,
      unlockedChallenges: unlocked,
    };
  }

  // SPECIAL CASE: DAYS_PER_PERIOD (e.g. 3 times a week / month)
  if (habit.frequency.type === 'DAYS_PER_PERIOD' && habit.frequency.daysPerPeriod) {
    const { targetCount, period } = habit.frequency.daysPerPeriod;
    const periodDays = period === 'MONTH' ? 30 : period === 'YEAR' ? 365 : 7;

    // Only COMPLETED logs increment the period target
    const completedDates = Object.values(allLogs)
      .filter((l) => l.habitId === habit.id && l.status === 'COMPLETED')
      .map((l) => l.date);

    // Group logs by period key
    const periodMap = new Map<string, number>();
    for (const dStr of completedDates) {
      const d = parseISO(dStr);
      let pKey = '';
      if (period === 'MONTH') {
        pKey = format(d, 'yyyy-MM');
      } else if (period === 'YEAR') {
        pKey = format(d, 'yyyy');
      } else {
        // Default: WEEK (starts Monday)
        pKey = format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      }
      periodMap.set(pKey, (periodMap.get(pKey) || 0) + 1);
    }

    const getPeriodKey = (d: Date): string => {
      if (period === 'MONTH') return format(d, 'yyyy-MM');
      if (period === 'YEAR') return format(d, 'yyyy');
      return format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    };

    const prevPeriodDate = (d: Date): Date => {
      if (period === 'MONTH') return subMonths(d, 1);
      if (period === 'YEAR') return subYears(d, 1);
      return subWeeks(d, 1);
    };

    // Calculate current consecutive successful periods ending at current or previous period
    const now = new Date();
    const currentPKey = getPeriodKey(now);
    const prevPDate = prevPeriodDate(now);

    let consecutiveCurrent = 0;
    let checkDate: Date;

    if ((periodMap.get(currentPKey) || 0) >= targetCount) {
      consecutiveCurrent = 1;
      checkDate = prevPDate;
    } else {
      checkDate = prevPDate;
    }

    while ((periodMap.get(getPeriodKey(checkDate)) || 0) >= targetCount) {
      consecutiveCurrent++;
      checkDate = prevPeriodDate(checkDate);
    }

    // Calculate best consecutive periods historically across all periods
    const successfulPeriodKeys = Array.from(periodMap.entries())
      .filter(([_, count]) => count >= targetCount)
      .map(([k]) => k)
      .sort();

    let bestPeriods = 0;
    for (const key of successfulPeriodKeys) {
      let chain = 1;
      const d = parseISO(key.length === 4 ? `${key}-01-01` : key.length === 7 ? `${key}-01` : key);
      let nextD = period === 'MONTH' ? addMonths(d, 1) : period === 'YEAR' ? addYears(d, 1) : addWeeks(d, 1);
      while (successfulPeriodKeys.includes(getPeriodKey(nextD))) {
        chain++;
        nextD = period === 'MONTH' ? addMonths(nextD, 1) : period === 'YEAR' ? addYears(nextD, 1) : addWeeks(nextD, 1);
      }
      if (chain > bestPeriods) bestPeriods = chain;
    }
    bestPeriods = Math.max(bestPeriods, consecutiveCurrent);

    const currentStreakDays = consecutiveCurrent * periodDays;
    const bestStreakDays = bestPeriods * periodDays;
    const unlocked = STREAK_CHALLENGES.filter((c) => bestStreakDays >= c.days).map((c) => c.days);

    return {
      currentStreak: currentStreakDays,
      bestStreak: bestStreakDays,
      unlockedChallenges: unlocked,
    };
  }

  // STANDARD DAILY / SCHEDULE-BASED STREAKS
  // Extract streak dates (COMPLETED or EXCUSED) sorted in ascending order (deduplicated)
  const streakDates = Array.from(
    new Set(
      Object.values(allLogs)
        .filter(
          (l) =>
            l.habitId === habit.id &&
            (l.status === 'COMPLETED' || l.status === 'EXCUSED')
        )
        .map((l) => l.date)
    )
  ).sort();

  if (streakDates.length === 0) {
    return { currentStreak: 0, bestStreak: 0, unlockedChallenges: [] };
  }

  // Calculate best streak taking schedule into account
  // Excused days freeze and preserve the chain, but only COMPLETED days increment the streak counter
  let bestStreak = 0;
  let currentChain: string[] = [streakDates[0]];

  for (let i = 1; i < streakDates.length; i++) {
    const prev = parseISO(streakDates[i - 1]);
    const curr = parseISO(streakDates[i]);

    if (!hasMissedDueDay(habit, prev, curr, allLogs)) {
      currentChain.push(streakDates[i]);
    } else {
      const completedCount = currentChain.filter(
        (d) => allLogs[`${habit.id}_${d}`]?.status === 'COMPLETED'
      ).length;
      if (completedCount > bestStreak) bestStreak = completedCount;
      currentChain = [streakDates[i]];
    }
  }
  const lastChainCount = currentChain.filter(
    (d) => allLogs[`${habit.id}_${d}`]?.status === 'COMPLETED'
  ).length;
  if (lastChainCount > bestStreak) bestStreak = lastChainCount;

  // Calculate current active streak relative to today
  const todayKey = getTodayKey();
  const today = parseISO(todayKey);

  // Guard future-dated logs: only consider logs on or before today
  const validDates = streakDates.filter((d) => d <= todayKey);

  let currentStreak = 0;

  if (validDates.length > 0) {
    const latestDateStr = validDates[validDates.length - 1];
    const latestDate = parseISO(latestDateStr);

    // If no due date was missed between latest completion/excuse and today, streak is alive
    if (!hasMissedDueDay(habit, latestDate, today, allLogs)) {
      const activeChain: string[] = [latestDateStr];
      for (let i = validDates.length - 1; i > 0; i--) {
        const curr = parseISO(validDates[i]);
        const prev = parseISO(validDates[i - 1]);
        if (!hasMissedDueDay(habit, prev, curr, allLogs)) {
          activeChain.push(validDates[i - 1]);
        } else {
          break;
        }
      }
      currentStreak = activeChain.filter(
        (d) => allLogs[`${habit.id}_${d}`]?.status === 'COMPLETED'
      ).length;
    }
  }

  // Determine unlocked challenge milestones
  const finalBestStreak = Math.max(bestStreak, currentStreak);
  const unlockedChallenges = STREAK_CHALLENGES.filter(
    (c) => finalBestStreak >= c.days
  ).map((c) => c.days);

  return {
    currentStreak,
    bestStreak: finalBestStreak,
    unlockedChallenges,
  };
}

export function calculateXpForCompletion(habit: Habit, streak: number): number {
  const base = 50;
  // Streak multiplier
  let streakMultiplier = 1.0;
  if (streak >= 30) streakMultiplier = 2.0;
  else if (streak >= 14) streakMultiplier = 1.5;
  else if (streak >= 7) streakMultiplier = 1.25;

  // Priority multiplier (0 to 100 scale: e.g. 100 -> 1.5x, 50 -> 1.0x, 0 -> 0.75x)
  const p = typeof habit.schedule.priority === 'number' ? habit.schedule.priority : 50;
  const priorityMultiplier = 0.75 + (Math.min(100, Math.max(0, p)) / 100) * 0.75;

  return Math.round(base * streakMultiplier * priorityMultiplier);
}
