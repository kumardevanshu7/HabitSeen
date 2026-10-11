import { Habit, HabitLog } from '../types/habit';
import { STREAK_CHALLENGES } from '../constants/gamification';
import { differenceInCalendarDays, parseISO, addDays, format } from 'date-fns';
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
      const current = Number(log.valueNumeric) || 0;
      const goal = Number(cfg.goal) || 1;
      const op = (cfg.operator || 'AT_LEAST').toUpperCase();
      let ok = false;
      if (op === 'LESS_THAN') ok = current >= 0 && current < goal;
      else if (op === 'EXACTLY') ok = current === goal;
      else if (op === 'ANY_VALUE') ok = current > 0;
      else ok = current >= goal;

      return {
        isSuccess: ok,
        progressRatio: Math.min(1, Math.max(0, goal > 0 ? current / goal : 1)),
      };
    }

    case 'TIMER': {
      const cfg = habit.config.timer;
      if (!cfg) return { isSuccess: false, progressRatio: 0 };
      const current = Number(log.valueTimerSeconds) || 0;
      const target = Number(cfg.targetSeconds) || 1;
      const op = (cfg.operator || 'AT_LEAST').toUpperCase();
      let ok = false;
      if (op === 'LESS_THAN') ok = current >= 0 && current < target;
      else if (op === 'ANY_VALUE') ok = current > 0;
      else ok = current >= target;

      return {
        isSuccess: ok,
        progressRatio: Math.min(1, Math.max(0, target > 0 ? current / target : 1)),
      };
    }

    case 'CHECKLIST': {
      const cfg = habit.config.checklist;
      if (!cfg || !cfg.items.length) return { isSuccess: false, progressRatio: 0 };
      const completed = log.valueChecklistCompletedItemIds || [];

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
          progressRatio: Math.min(1, Math.max(0, completed.length / cfg.items.length)),
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
 * Checks whether any date strictly between fromDate and toDate was a due date
 * that was not completed or excused.
 */
function hasMissedDueDay(
  habit: Habit,
  fromDate: Date,
  toDate: Date,
  allLogs: Record<string, HabitLog>
): boolean {
  let check = addDays(fromDate, 1);
  while (differenceInCalendarDays(toDate, check) > 0) {
    if (isHabitDueOnDate(habit, check)) {
      const checkKey = getTodayKey().length === 10 ? format(check, 'yyyy-MM-dd') : '';
      const log = allLogs[`${habit.id}_${checkKey}`];
      // If no log exists or it was marked MISSED/FAILED, then it was truly a missed due date!
      if (!log || (log.status !== 'COMPLETED' && log.status !== 'EXCUSED')) {
        return true;
      }
    }
    check = addDays(check, 1);
  }
  return false;
}

export function computeHabitStreaks(
  habit: Habit,
  allLogs: Record<string, HabitLog>
): {
  currentStreak: number;
  bestStreak: number;
  unlockedChallenges: number[];
} {
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
  let bestStreak = 1;
  let tempStreak = 1;

  for (let i = 1; i < streakDates.length; i++) {
    const prev = parseISO(streakDates[i - 1]);
    const curr = parseISO(streakDates[i]);

    if (!hasMissedDueDay(habit, prev, curr, allLogs)) {
      tempStreak++;
      if (tempStreak > bestStreak) bestStreak = tempStreak;
    } else {
      tempStreak = 1;
    }
  }

  // Calculate current streak relative to today
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
      currentStreak = 1;
      for (let i = validDates.length - 1; i > 0; i--) {
        const curr = parseISO(validDates[i]);
        const prev = parseISO(validDates[i - 1]);
        if (!hasMissedDueDay(habit, prev, curr, allLogs)) {
          currentStreak++;
        } else {
          break;
        }
      }
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
