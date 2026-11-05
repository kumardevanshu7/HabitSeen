import { format, parseISO, isValid } from 'date-fns';
import { Challenge } from '../types/habit';
import { getTodayKey } from './dateMath';

/**
 * Safely format a date string or Date object with fallback
 */
export function safeFormat(
  dateVal?: string | Date | null,
  fmt: string = 'dd MMM yyyy',
  fallback: string = '—'
): string {
  if (!dateVal) return fallback;
  try {
    const d = typeof dateVal === 'string' ? parseISO(dateVal) : dateVal;
    return isValid(d) ? format(d, fmt) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Evaluates whether a challenge is conquered (status is COMPLETED or completedDays >= targetDays)
 */
export function isChallengeConquered(c: Challenge): boolean {
  if (c.status === 'COMPLETED') return true;
  const targetDays = Math.max(1, c.targetDays || 7);
  const dayLogs = c.dayLogs || {};
  const completedDays = Object.values(dayLogs).filter(
    (l) => l.status === 'COMPLETED'
  ).length;
  return completedDays >= targetDays;
}

/**
 * Evaluates whether a challenge has passed its end date without conquering
 */
export function isChallengeExpired(c: Challenge, todayKey: string = getTodayKey()): boolean {
  if (isChallengeConquered(c)) return false;
  if (!c.endDate) return false;
  return todayKey > c.endDate;
}

/**
 * Evaluates whether a challenge is finished (archived, conquered, or expired/failed)
 */
export function isChallengeFinished(c: Challenge, todayKey: string = getTodayKey()): boolean {
  return Boolean(c.isArchived) || isChallengeConquered(c) || isChallengeExpired(c, todayKey) || c.status === 'FAILED';
}

/**
 * Evaluates whether a challenge is actively running (not archived, not conquered, and not expired)
 */
export function isChallengeActive(c: Challenge, todayKey: string = getTodayKey()): boolean {
  return !isChallengeFinished(c, todayKey);
}
