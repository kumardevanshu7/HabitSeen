import {
  format,
  differenceInCalendarDays,
  isSameDay,
  parseISO,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isWithinInterval,
} from 'date-fns';
import { Habit, HabitLog } from '../types/habit';

export function getTodayKey(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function formatDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function calculateDaysBetween(startDateStr: string, endDateStr?: string): number {
  if (!endDateStr) return 0;
  try {
    const start = parseISO(startDateStr);
    const end = parseISO(endDateStr);
    const diff = differenceInCalendarDays(end, start);
    return diff >= 0 ? diff + 1 : 0;
  } catch {
    return 0;
  }
}

export function isHabitDueOnDate(
  habit: Habit,
  targetDate: Date,
  allLogs?: Record<string, HabitLog>
): boolean {
  const targetKey = format(targetDate, 'yyyy-MM-dd');
  const { startDate, endDate } = habit.schedule;

  // Bound check
  if (targetKey < startDate) return false;
  if (endDate && targetKey > endDate) return false;

  const { type, daysOfWeek, daysOfMonth, daysOfYear, repeatEveryDays, daysPerPeriod } = habit.frequency;

  switch (type) {
    case 'EVERYDAY':
      return true;

    case 'SPECIFIC_DAYS_OF_WEEK': {
      // getDay() gives 0 for Sunday, 1 for Monday, etc.
      const day = targetDate.getDay();
      return Array.isArray(daysOfWeek) ? daysOfWeek.includes(day) : false;
    }

    case 'SPECIFIC_DAYS_OF_MONTH': {
      if (!Array.isArray(daysOfMonth)) return false;
      const dayOfMonth = targetDate.getDate();
      const lastDayOfMonth = endOfMonth(targetDate).getDate();
      // If target is the last day of month (e.g. Feb 28, Apr 30), match scheduled days beyond the month length
      if (dayOfMonth === lastDayOfMonth && daysOfMonth.some((d) => d >= lastDayOfMonth)) {
        return true;
      }
      return daysOfMonth.includes(dayOfMonth);
    }

    case 'SPECIFIC_DAYS_OF_YEAR': {
      const monthDay = format(targetDate, 'MM-dd');
      return Array.isArray(daysOfYear) ? daysOfYear.includes(monthDay) : false;
    }

    case 'DAYS_PER_PERIOD': {
      if (!daysPerPeriod) return true;
      const { targetCount, period } = daysPerPeriod;
      if (!allLogs) return true;

      // If targetDate was explicitly completed, it is due & completed
      const logToday = allLogs[`${habit.id}_${targetKey}`];
      if (logToday && (logToday.status === 'COMPLETED' || logToday.status === 'EXCUSED')) {
        return true;
      }

      // Check completions within targetDate's period
      let pStart: Date;
      let pEnd: Date;
      if (period === 'MONTH') {
        pStart = startOfMonth(targetDate);
        pEnd = endOfMonth(targetDate);
      } else if (period === 'YEAR') {
        pStart = startOfYear(targetDate);
        pEnd = endOfYear(targetDate);
      } else {
        pStart = startOfWeek(targetDate, { weekStartsOn: 1 });
        pEnd = endOfWeek(targetDate, { weekStartsOn: 1 });
      }

      let completedCount = 0;
      for (const log of Object.values(allLogs)) {
        if (log.habitId === habit.id && log.status === 'COMPLETED') {
          const lDate = parseISO(log.date);
          if (isWithinInterval(lDate, { start: pStart, end: pEnd })) {
            completedCount++;
          }
        }
      }

      // Due only while target count in period is not yet met
      return completedCount < targetCount;
    }

    case 'INTERVAL_REPEAT': {
      const start = parseISO(startDate);
      const diff = differenceInCalendarDays(targetDate, start);
      if (diff < 0) return false;
      const interval = repeatEveryDays && repeatEveryDays > 0 ? repeatEveryDays : 1;
      return diff % interval === 0;
    }

    default:
      return true;
  }
}

export function isDateInThisWeek(dateKey: string): boolean {
  if (!dateKey) return false;
  try {
    const date = parseISO(dateKey);
    const now = new Date();
    return isWithinInterval(date, {
      start: startOfWeek(now, { weekStartsOn: 1 }),
      end: endOfWeek(now, { weekStartsOn: 1 }),
    });
  } catch {
    return false;
  }
}

export function isDateInThisMonth(dateKey: string): boolean {
  if (!dateKey) return false;
  try {
    const date = parseISO(dateKey);
    const now = new Date();
    return isWithinInterval(date, {
      start: startOfMonth(now),
      end: endOfMonth(now),
    });
  } catch {
    return false;
  }
}

export function isDateInThisYear(dateKey: string): boolean {
  if (!dateKey) return false;
  try {
    const date = parseISO(dateKey);
    const now = new Date();
    return isWithinInterval(date, {
      start: startOfYear(now),
      end: endOfYear(now),
    });
  } catch {
    return false;
  }
}

export function formatSecondsToHMS(totalSeconds: number): {
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string;
} {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const formatted = `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  return { hours, minutes, seconds, formatted };
}

export function parseHMSToSeconds(hours: number, minutes: number, seconds: number): number {
  const h = Math.max(0, Number(hours) || 0);
  const m = Math.max(0, Math.min(59, Number(minutes) || 0));
  const s = Math.max(0, Math.min(59, Number(seconds) || 0));
  return h * 3600 + m * 60 + s;
}
