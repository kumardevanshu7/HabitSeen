import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Habit, HabitLog } from '../../types/habit';
import { useAppStore } from '../../stores/useAppStore';
import { STREAK_CHALLENGES, CATEGORY_ICONS } from '../../constants/iconsAndColors';
import { boostVibrancy, getContrastIconColor } from '../../utils/colorUtils';
import {
  Flame,
  Trophy,
  Calendar as CalendarIcon,
  Edit2,
  Trash2,
  Award,
  Sparkles,
  Lock,
  CheckCircle2,
  History,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay,
  subMonths,
  addMonths,
  isAfter,
  startOfDay,
  parseISO,
} from 'date-fns';
import clsx from 'clsx';

import { computeHabitStreaks } from '../../utils/streakEngine';
import { isDateInThisWeek, isDateInThisMonth } from '../../utils/dateMath';
import { SecurityModal } from '../security/SecurityModal';

interface HabitDetailsModalProps {
  habit: Habit | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (habit: Habit) => void;
}

export const HabitDetailsModal: React.FC<HabitDetailsModalProps> = ({
  habit,
  isOpen,
  onClose,
  onEdit,
}) => {
  const { categories, logs, deleteHabit } = useAppStore();
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date());
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [pendingSecurityAction, setPendingSecurityAction] = useState<{
    type: 'edit' | 'delete';
    title: string;
  } | null>(null);

  useEffect(() => {
    setCurrentCalendarMonth(new Date());
  }, [habit?.id]);

  if (!habit) return null;

  const isJustTracking = habit.frequency?.type === 'JUST_TRACKING';

  const category = categories.find((c) => c.id === habit.categoryId);
  const CategoryIcon =
    CATEGORY_ICONS.find((i) => i.id === category?.icon)?.icon || CATEGORY_ICONS[0].icon;

  // Filter logs for this habit and derive live stats dynamically
  const habitLogs = Object.values(logs || {}).filter((l) => l && l.habitId === habit.id);
  const completedLogs = habitLogs.filter((l) => l.status === 'COMPLETED');
  const excusedLogs = habitLogs.filter((l) => l.status === 'EXCUSED');
  const missedLogs = habitLogs.filter((l) => l.status === 'MISSED' || l.status === 'FAILED');
  const skippedLogs = habitLogs.filter((l) => l.status === 'SKIPPED');
  const totalTracked = habitLogs.length;

  const sortedHabitLogs = [...habitLogs].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const displayedLogs = showAllLogs ? sortedHabitLogs : sortedHabitLogs.slice(0, 7);

  const formatSecondsReadable = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m`;
    return `${totalSecs}s`;
  };

  const renderLogWorkValue = (log: HabitLog) => {
    switch (habit.type) {
      case 'TIMER': {
        const secs = log.valueTimerSeconds ?? 0;
        const targetSecs = habit.config.timer?.targetSeconds ?? 0;
        return (
          <span className="font-mono text-xs font-bold text-ink">
            {formatSecondsReadable(secs)} <span className="text-stone text-[10px] font-normal">/ {formatSecondsReadable(targetSecs)}</span>
          </span>
        );
      }
      case 'NUMERIC': {
        const num = log.valueNumeric ?? 0;
        const goal = habit.config.numeric?.goal ?? 1;
        const unit = habit.config.numeric?.unit ? ` ${habit.config.numeric.unit}` : '';
        return (
          <span className="font-mono text-xs font-bold text-ink">
            {num} <span className="text-stone text-[10px] font-normal">/ {goal}{unit}</span>
          </span>
        );
      }
      case 'CHECKLIST': {
        const done = log.valueChecklistCompletedItemIds?.length ?? 0;
        const total = habit.config.checklist?.items?.length ?? 0;
        return (
          <span className="font-mono text-xs font-bold text-ink">
            {done} <span className="text-stone text-[10px] font-normal">/ {total} items done</span>
          </span>
        );
      }
      case 'YES_NO':
      default: {
        return (
          <span className="text-xs font-medium text-ink">
            {log.status === 'COMPLETED' ? 'Marked Complete' : 'Incomplete'}
          </span>
        );
      }
    }
  };

  const formatLogDateLabel = (dateStr: string) => {
    try {
      const parsed = parseISO(dateStr);
      if (isSameDay(parsed, new Date())) return 'Today';
      return format(parsed, 'EEE, dd MMM yyyy');
    } catch {
      return dateStr;
    }
  };

  let streakInfo = { currentStreak: 0, bestStreak: 0, unlockedChallenges: [] as number[] };
  try {
    streakInfo = computeHabitStreaks(habit, logs || {});
  } catch (err) {
    console.error('Failed to compute streaks:', err);
  }

  const currentStreak = streakInfo.currentStreak ?? habit.stats?.currentStreak ?? 0;
  const bestStreak = Math.max(streakInfo.bestStreak ?? 0, habit.stats?.bestStreak ?? 0);
  const unlockedBadges = streakInfo.unlockedChallenges?.length
    ? streakInfo.unlockedChallenges
    : (habit.stats?.unlockedChallenges || []);

  const timesCompletedThisWeek = habitLogs.filter((l) => l.status === 'COMPLETED' && l.date && isDateInThisWeek(l.date)).length;
  const timesCompletedThisMonth = habitLogs.filter((l) => l.status === 'COMPLETED' && l.date && isDateInThisMonth(l.date)).length;
  const timesCompletedAllTime = completedLogs.length || habit.stats?.timesCompletedAllTime || 0;

  const successRate =
    totalTracked > 0 ? Math.round((completedLogs.length / totalTracked) * 100) : 0;

  // Calendar days
  const monthStart = startOfMonth(currentCalendarMonth);
  const monthEnd = endOfMonth(currentCalendarMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const handleRequestEdit = () => {
    setPendingSecurityAction({
      type: 'edit',
      title: `Authorize editing habit: "${habit.name}"`,
    });
  };

  const handleRequestDelete = () => {
    setPendingSecurityAction({
      type: 'delete',
      title: `Permanently delete habit: "${habit.name}" and all historical stats`,
    });
  };

  const handleExecuteSecurityAction = async () => {
    if (!pendingSecurityAction) return;
    if (pendingSecurityAction.type === 'edit') {
      onEdit?.(habit);
    } else if (pendingSecurityAction.type === 'delete') {
      await deleteHabit(habit.id);
      onClose();
    }
    setPendingSecurityAction(null);
  };

  return (
    <>
      <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={habit.name}
      subtitle={habit.description || 'Behavioral analytics & consistency tracker'}
      maxWidth="xl"
    >
      <div className="space-y-6">
        {/* HEADER BADGE */}
        <div className="flex items-center justify-between gap-2 p-3 sm:p-4 bg-surface-card rounded-2xl border border-hairline shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shadow-xs shrink-0"
              style={{
                backgroundColor: boostVibrancy(category?.color),
                color: getContrastIconColor(boostVibrancy(category?.color)),
              }}
            >
              <CategoryIcon size={20} strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] sm:text-xs font-bold text-charcoal uppercase tracking-wider block truncate">
                {category?.name || 'Category'}
              </span>
              <p className="text-xs sm:text-sm font-semibold text-charcoal truncate">
                Priority: <span className="font-mono text-primary font-bold">{habit.schedule?.priority ?? 50}/100</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRequestEdit}
                className="gap-1 text-xs py-1.5 px-2.5 h-8"
              >
                <Edit2 size={13} /> <span className="hidden xs:inline">Edit</span>
              </Button>
            )}
            <Button
              variant="danger"
              size="sm"
              onClick={handleRequestDelete}
              className="gap-1 text-xs py-1.5 px-2.5 h-8"
            >
              <Trash2 size={13} /> <span className="hidden xs:inline">Delete</span>
            </Button>
          </div>
        </div>

        {/* JUST TRACKING FEATURE BANNER */}
        {isJustTracking && (
          <div className="p-3.5 bg-primary/10 border border-primary/20 rounded-2xl flex items-center gap-2.5 animate-in fade-in duration-200">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-primary">
              <Sparkles size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary">Just Tracking Mode</span>
                <span className="text-[10px] font-bold text-primary/80 bg-primary/15 px-2 py-0.5 rounded-full">
                  Flexible
                </span>
              </div>
              <p className="text-[11px] text-charcoal mt-0.5 leading-relaxed">
                Not mandatory daily. Log whenever you do it. Missed days do not break streaks or reduce hearts. Completed days lock permanently.
              </p>
            </div>
          </div>
        )}

        {/* 1. STREAK & COMPLETION METRICS GRID */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-charcoal mb-2 ml-1">
            {isJustTracking ? 'Tracking Frequency Analytics' : 'Streaks & Performance'}
          </h4>
          {isJustTracking ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-surface-card border border-hairline rounded-2xl text-center">
                <span className="text-xs text-charcoal flex items-center justify-center gap-1 font-medium">
                  <CalendarIcon size={14} className="text-primary" /> This Week
                </span>
                <p className="font-mono text-2xl font-bold text-primary mt-1">
                  {timesCompletedThisWeek}{' '}
                  <span className="text-xs font-sans text-charcoal">times</span>
                </p>
              </div>

              <div className="p-3.5 bg-surface-card border border-hairline rounded-2xl text-center">
                <span className="text-xs text-charcoal flex items-center justify-center gap-1 font-medium">
                  <CalendarIcon size={14} className="text-primary" /> This Month
                </span>
                <p className="font-mono text-2xl font-bold text-primary mt-1">
                  {timesCompletedThisMonth}{' '}
                  <span className="text-xs font-sans text-charcoal">times</span>
                </p>
              </div>

              <div className="p-3.5 bg-surface-card border border-hairline rounded-2xl text-center">
                <span className="text-xs text-charcoal flex items-center justify-center gap-1 font-medium">
                  <Trophy size={14} className="text-amber-500" /> All-Time
                </span>
                <p className="font-mono text-2xl font-bold text-badge-success mt-1">
                  {timesCompletedAllTime}{' '}
                  <span className="text-xs font-sans text-charcoal">times</span>
                </p>
              </div>

              <div className="p-3.5 bg-surface-card border border-hairline rounded-2xl text-center">
                <span className="text-xs text-charcoal flex items-center justify-center gap-1 font-medium">
                  <CheckCircle2 size={14} className="text-violet-500" /> Total Check-ins
                </span>
                <p className="font-mono text-2xl font-bold text-ink mt-1">
                  {completedLogs.length}{' '}
                  <span className="text-xs font-sans text-charcoal">days</span>
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-surface-card border border-hairline rounded-2xl text-center">
                <span className="text-xs text-charcoal flex items-center justify-center gap-1">
                  <Flame size={14} className="text-primary" /> Current Streak
                </span>
                <p className="font-mono text-2xl font-bold text-primary mt-1">
                  {currentStreak}{' '}
                  <span className="text-xs font-sans text-charcoal">days</span>
                </p>
              </div>

              <div className="p-3.5 bg-surface-card border border-hairline rounded-2xl text-center">
                <span className="text-xs text-charcoal flex items-center justify-center gap-1">
                  <Trophy size={14} className="text-amber-500" /> Best Streak
                </span>
                <p className="font-mono text-2xl font-bold text-ink mt-1">
                  {bestStreak}{' '}
                  <span className="text-xs font-sans text-charcoal">days</span>
                </p>
              </div>

              <div className="p-3.5 bg-surface-card border border-hairline rounded-2xl text-center">
                <span className="text-xs text-charcoal">This Week</span>
                <p className="font-mono text-2xl font-bold text-ink mt-1">
                  {timesCompletedThisWeek}
                </p>
              </div>

              <div className="p-3.5 bg-surface-card border border-hairline rounded-2xl text-center">
                <span className="text-xs text-charcoal">All-Time Completed</span>
                <p className="font-mono text-2xl font-bold text-badge-success mt-1">
                  {timesCompletedAllTime}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 2. SUCCESS VS FAILURE DISTRIBUTION */}
        <div className="p-4 bg-surface-card border border-hairline rounded-2xl">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-charcoal ml-1 truncate">
              {isJustTracking ? 'Consistency & Activity Summary' : 'Consistency & Breakdown'}
            </h4>
            <span className="text-xs font-mono font-bold text-ink bg-surface-bone px-2.5 py-1 rounded-full border border-hairline whitespace-nowrap shrink-0">
              {isJustTracking ? `${completedLogs.length} Completed` : `${successRate}% Success Rate`}
            </span>
          </div>

          <div className="w-full bg-surface-bone h-3 rounded-full overflow-hidden flex">
            <div
              className="bg-badge-success transition-all duration-500"
              style={{ width: `${totalTracked > 0 ? (completedLogs.length / totalTracked) * 100 : isJustTracking && completedLogs.length > 0 ? 100 : 0}%` }}
              title={`Completed: ${completedLogs.length}`}
            />
            {!isJustTracking && (
              <>
                <div
                  className="bg-blue-400 transition-all duration-500"
                  style={{ width: `${totalTracked > 0 ? (excusedLogs.length / totalTracked) * 100 : 0}%` }}
                  title={`Excused: ${excusedLogs.length}`}
                />
                <div
                  className="bg-red-400 transition-all duration-500"
                  style={{ width: `${totalTracked > 0 ? ((missedLogs.length + skippedLogs.length) / totalTracked) * 100 : 0}%` }}
                  title={`Missed/Skipped: ${missedLogs.length + skippedLogs.length}`}
                />
              </>
            )}
          </div>

          <div className="flex items-center justify-around mt-3 text-xs text-charcoal flex-wrap gap-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-badge-success" />
              Completed ({completedLogs.length})
            </span>
            {!isJustTracking && (
              <>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                  Excused ({excusedLogs.length})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  Missed ({missedLogs.length + skippedLogs.length})
                </span>
              </>
            )}
            <span className="flex items-center gap-1.5 font-semibold text-ink">
              Total Logged: {totalTracked}
            </span>
          </div>
        </div>

        {/* 3. STREAK CHALLENGE TROPHY RACK (10 MILESTONES) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-charcoal ml-1">
              Streak Challenge Badges (10 Milestones)
            </h4>
            <span className="text-xs text-primary font-semibold flex items-center gap-1">
              <Sparkles size={13} /> {unlockedBadges.length} / 10 Unlocked
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {STREAK_CHALLENGES.map((challenge) => {
              const isUnlocked = bestStreak >= challenge.days || unlockedBadges.includes(challenge.days);
              return (
                <div
                  key={challenge.days}
                  className={clsx(
                    'p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center',
                    isUnlocked
                      ? 'bg-amber-50/60 border-amber-300 shadow-xs'
                      : 'bg-surface-bone/60 border-hairline opacity-60'
                  )}
                >
                  <div
                    className={clsx(
                      'w-10 h-10 rounded-full flex items-center justify-center mb-1.5',
                      isUnlocked
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'bg-stone/30 text-charcoal'
                    )}
                  >
                    <Award size={20} />
                  </div>
                  <span className="font-mono text-xs font-bold text-ink">
                    {challenge.badgeLabel}
                  </span>
                  <span className="text-[11px] font-medium text-charcoal truncate max-w-full">
                    {challenge.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. INTERACTIVE CALENDAR VIEW */}
        <div className="p-4 bg-surface-card border border-hairline rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-charcoal ml-1 flex items-center gap-1.5">
              <CalendarIcon size={14} /> Habit Activity Calendar
            </h4>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous Month"
                onClick={() => setCurrentCalendarMonth(subMonths(currentCalendarMonth, 1))}
                className="px-2.5 py-1 text-xs bg-surface-bone hover:bg-stone/20 rounded-full border border-hairline font-semibold transition-colors cursor-pointer"
              >
                Prev
              </button>
              <span className="text-xs font-bold text-ink font-mono">
                {format(currentCalendarMonth, 'MMMM yyyy')}
              </span>
              <button
                type="button"
                aria-label="Next Month"
                onClick={() => setCurrentCalendarMonth(addMonths(currentCalendarMonth, 1))}
                className="px-2.5 py-1 text-xs bg-surface-bone hover:bg-stone/20 rounded-full border border-hairline font-semibold transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>

          {/* Calendar Day Grid (Monday First, Read-Only) */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
              <span key={idx} className="text-[10px] font-bold text-charcoal py-1">
                {day}
              </span>
            ))}
            {/* Monday-start offset padding */}
            {Array.from({ length: daysInMonth[0] ? (getDay(daysInMonth[0]) + 6) % 7 : 0 }).map((_, idx) => (
              <div key={`offset-${idx}`} className="h-9" />
            ))}
            {daysInMonth.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const logKey = `${habit.id}_${dateKey}`;
              const dayLog = logs?.[logKey];
              const isCompleted = dayLog?.status === 'COMPLETED';
              const isExcused = dayLog?.status === 'EXCUSED';
              const isMissed = dayLog?.status === 'MISSED' || dayLog?.status === 'FAILED';
              const isSkipped = dayLog?.status === 'SKIPPED';
              const isToday = isSameDay(day, new Date());
              const isFuture = isAfter(startOfDay(day), startOfDay(new Date()));

              return (
                <div
                  key={dateKey}
                  aria-label={`${dateKey} activity`}
                  className={clsx(
                    'h-9 rounded-xl flex flex-col items-center justify-center text-xs font-mono transition-all border select-none',
                    isCompleted && 'bg-badge-success text-white border-badge-success font-bold shadow-2xs',
                    isExcused && 'bg-blue-100 text-blue-700 border-blue-300 font-bold',
                    isMissed && 'bg-amber-100 text-amber-800 border-amber-300 font-semibold',
                    isSkipped && 'bg-red-100 text-red-600 border-red-200',
                    !dayLog && !isFuture && 'bg-surface-bone text-charcoal border-hairline/60',
                    isFuture && 'opacity-35 bg-surface-bone/50 text-charcoal/50 border-hairline/30',
                    isToday && 'ring-2 ring-primary ring-offset-1 font-bold'
                  )}
                  title={`${dateKey}: ${
                    isCompleted
                      ? 'Completed'
                      : isFuture
                      ? 'Upcoming'
                      : isExcused
                      ? `Excused: ${dayLog?.missedReasonText || 'Protected'}`
                      : isMissed
                      ? `Missed: ${dayLog?.missedReasonText || 'Incomplete'}`
                      : isSkipped
                      ? 'Skipped'
                      : 'Not Tracked'
                  }`}
                >
                  <span>{format(day, 'd')}</span>
                  {isCompleted && (
                    <div className="flex items-center gap-0.5 text-[8px] leading-none">
                      <span>✓</span>
                      {isJustTracking && <Lock size={7} />}
                    </div>
                  )}
                  {isExcused && <span className="text-[8px] leading-none">🛡️</span>}
                  {isMissed && <span className="text-[8px] leading-none">!</span>}
                </div>
              );
            })}
          </div>

          {/* Calendar Helper Info */}
          <div className="mt-3 pt-2.5 border-t border-hairline/70 flex items-center justify-between text-[11px] text-charcoal flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-badge-success shrink-0" /> Completed
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" /> Excused
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" /> Missed
              </span>
            </div>
            <span className="text-stone">
              💡 Activity history is read-only. Log check-ins and excuses from the daily dashboard.
            </span>
          </div>
        </div>

        {/* 5. DETAILED DAILY ACTIVITY LOGS & WORK RECORDED */}
        <div className="p-4 bg-surface-card border border-hairline rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History size={16} className="text-primary" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink">
                Daily Work &amp; Performance History
              </h4>
            </div>
            <span className="text-[11px] font-mono font-bold text-charcoal bg-surface-bone px-2 py-0.5 rounded-full border border-hairline">
              {sortedHabitLogs.length} Records
            </span>
          </div>

          {sortedHabitLogs.length === 0 ? (
            <div className="p-6 bg-surface-bone/50 border border-dashed border-hairline rounded-xl text-center text-xs text-charcoal">
              No activity logs recorded yet. Check off this habit on the dashboard to build your log history!
            </div>
          ) : (
            <div className="space-y-3">
              {/* MOBILE CARD VIEW (< sm) */}
              <div className="space-y-2 sm:hidden">
                {displayedLogs.map((log) => {
                  const isDone = log.status === 'COMPLETED';
                  const isExc = log.status === 'EXCUSED';
                  const isMis = log.status === 'MISSED' || log.status === 'FAILED';
                  return (
                    <div
                      key={log.date}
                      className="p-3 bg-canvas rounded-xl border border-hairline/80 flex flex-col gap-1.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-ink">
                          {formatLogDateLabel(log.date)}
                        </span>
                        {isDone && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            ✓ Done
                          </span>
                        )}
                        {isExc && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            🛡️ Excused
                          </span>
                        )}
                        {isMis && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            ⚠️ Missed
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-hairline/60">
                        <span className="text-charcoal font-medium">Recorded Work:</span>
                        {renderLogWorkValue(log)}
                      </div>

                      {log.missedReasonText && (
                        <div className="text-[11px] text-charcoal bg-surface-bone px-2.5 py-1 rounded-lg border border-hairline/60 italic">
                          "{log.missedReasonText}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* DESKTOP / TABLET TABLE VIEW (>= sm) */}
              <div className="hidden sm:block overflow-hidden rounded-xl border border-hairline bg-canvas">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-bone/80 border-b border-hairline text-charcoal font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3.5">Date</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Work / Value Recorded</th>
                      <th className="py-2.5 px-3.5 text-right">Notes / Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline/60">
                    {displayedLogs.map((log) => {
                      const isDone = log.status === 'COMPLETED';
                      const isExc = log.status === 'EXCUSED';
                      const isMis = log.status === 'MISSED' || log.status === 'FAILED';
                      return (
                        <tr key={log.date} className="hover:bg-surface-bone/40 transition-colors">
                          <td className="py-2.5 px-3.5 font-mono font-bold text-ink whitespace-nowrap">
                            {formatLogDateLabel(log.date)}
                          </td>
                          <td className="py-2.5 px-3">
                            {isDone && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                                ✓ Done
                              </span>
                            )}
                            {isExc && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 whitespace-nowrap">
                                🛡️ Excused
                              </span>
                            )}
                            {isMis && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">
                                ⚠️ Missed
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            {renderLogWorkValue(log)}
                          </td>
                          <td className="py-2.5 px-3.5 text-right text-charcoal text-[11px] truncate max-w-[200px]">
                            {log.missedReasonText ? `"${log.missedReasonText}"` : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {sortedHabitLogs.length > 7 && (
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAllLogs(!showAllLogs)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-deep px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer"
                  >
                    <span>{showAllLogs ? 'Show Recent 7 Days' : `View All ${sortedHabitLogs.length} Days`}</span>
                    {showAllLogs ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER CLOSE */}
        <div className="flex justify-end pt-2">
          <Button variant="dark" onClick={onClose}>
            Close Statistics
          </Button>
        </div>
      </div>
    </Modal>

    {/* SECURITY VERIFICATION MODAL FOR EDIT / DELETE */}
    <SecurityModal
      isOpen={Boolean(pendingSecurityAction)}
      onClose={() => setPendingSecurityAction(null)}
      title={
        pendingSecurityAction?.type === 'delete'
          ? 'Confirm Habit Deletion'
          : 'Authorize Habit Editing'
      }
      actionTitle={pendingSecurityAction?.title || ''}
      isDanger={pendingSecurityAction?.type === 'delete'}
      onSuccess={handleExecuteSecurityAction}
    />
  </>
  );
};
