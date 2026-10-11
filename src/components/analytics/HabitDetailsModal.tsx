import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Habit } from '../../types/habit';
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
} from 'date-fns';
import clsx from 'clsx';

import { computeHabitStreaks } from '../../utils/streakEngine';
import { isDateInThisWeek } from '../../utils/dateMath';
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

  if (!habit) return null;

  const category = categories.find((c) => c.id === habit.categoryId);
  const CategoryIcon =
    CATEGORY_ICONS.find((i) => i.id === category?.icon)?.icon || CATEGORY_ICONS[0].icon;

  // Filter logs for this habit and derive live stats dynamically
  const habitLogs = Object.values(logs).filter((l) => l.habitId === habit.id);
  const completedLogs = habitLogs.filter((l) => l.status === 'COMPLETED');
  const excusedLogs = habitLogs.filter((l) => l.status === 'EXCUSED');
  const missedLogs = habitLogs.filter((l) => l.status === 'MISSED' || l.status === 'FAILED');
  const skippedLogs = habitLogs.filter((l) => l.status === 'SKIPPED');
  const totalTracked = habitLogs.length;

  const streakInfo = computeHabitStreaks(habit, logs);
  const currentStreak = streakInfo.currentStreak;
  const bestStreak = Math.max(streakInfo.bestStreak, habit.stats?.bestStreak || 0);
  const timesCompletedThisWeek = habitLogs.filter((l) => l.status === 'COMPLETED' && isDateInThisWeek(l.date)).length;
  const timesCompletedAllTime = completedLogs.length;

  const successRate =
    totalTracked > 0 ? Math.round((completedLogs.length / totalTracked) * 100) : 0;

  // Calendar days
  const monthStart = startOfMonth(currentCalendarMonth);
  const monthEnd = endOfMonth(currentCalendarMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const [pendingSecurityAction, setPendingSecurityAction] = useState<{
    type: 'edit' | 'delete';
    title: string;
  } | null>(null);

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
        <div className="flex items-center justify-between p-3.5 bg-surface-card rounded-2xl border border-hairline shadow-xs">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center shadow-xs shrink-0"
              style={{
                backgroundColor: boostVibrancy(category?.color),
                color: getContrastIconColor(boostVibrancy(category?.color)),
              }}
            >
              <CategoryIcon size={22} strokeWidth={2.5} />
            </div>
            <div>
              <span className="text-xs font-bold text-charcoal uppercase tracking-wider block">
                {category?.name || 'Category'}
              </span>
              <p className="text-sm font-bold text-ink">
                Priority Score:{' '}
                <span className="font-mono text-primary font-extrabold">
                  {habit.schedule.priority ?? 50} / 100
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRequestEdit}
                className="gap-1.5"
              >
                <Edit2 size={14} /> Edit
              </Button>
            )}
            <Button
              variant="danger"
              size="sm"
              onClick={handleRequestDelete}
              className="gap-1.5"
            >
              <Trash2 size={14} /> Delete
            </Button>
          </div>
        </div>

        {/* 1. STREAK & COMPLETION METRICS GRID */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-charcoal mb-2 ml-1">
            Streaks & Performance
          </h4>
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
        </div>

        {/* 2. SUCCESS VS FAILURE DISTRIBUTION */}
        <div className="p-4 bg-surface-card border border-hairline rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-charcoal ml-1">
              Consistency & Breakdown
            </h4>
            <span className="text-xs font-mono font-bold text-ink bg-surface-bone px-2.5 py-1 rounded-full border border-hairline">
              {successRate}% Success Rate
            </span>
          </div>

          <div className="w-full bg-surface-bone h-3 rounded-full overflow-hidden flex">
            <div
              className="bg-badge-success transition-all duration-500"
              style={{ width: `${totalTracked > 0 ? (completedLogs.length / totalTracked) * 100 : 0}%` }}
              title={`Completed: ${completedLogs.length}`}
            />
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
          </div>

          <div className="flex items-center justify-around mt-3 text-xs text-charcoal flex-wrap gap-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-badge-success" />
              Completed ({completedLogs.length})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
              Excused ({excusedLogs.length})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              Missed ({missedLogs.length + skippedLogs.length})
            </span>
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
              <Sparkles size={13} /> {habit.stats.unlockedChallenges.length} / 10 Unlocked
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {STREAK_CHALLENGES.map((challenge) => {
              const isUnlocked = habit.stats.bestStreak >= challenge.days;
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
                onClick={() => setCurrentCalendarMonth(subMonths(currentCalendarMonth, 1))}
                className="px-2 py-1 text-xs bg-surface-bone hover:bg-stone/20 rounded-full border border-hairline font-semibold"
              >
                Prev
              </button>
              <span className="text-xs font-bold text-ink font-mono">
                {format(currentCalendarMonth, 'MMMM yyyy')}
              </span>
              <button
                type="button"
                onClick={() => setCurrentCalendarMonth(addMonths(currentCalendarMonth, 1))}
                className="px-2 py-1 text-xs bg-surface-bone hover:bg-stone/20 rounded-full border border-hairline font-semibold"
              >
                Next
              </button>
            </div>
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
              <span key={idx} className="text-[10px] font-bold text-charcoal py-1">
                {day}
              </span>
            ))}
            {/* Day of week offset padding */}
            {Array.from({ length: getDay(daysInMonth[0]) }).map((_, idx) => (
              <div key={`offset-${idx}`} className="h-9" />
            ))}
            {daysInMonth.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const logKey = `${habit.id}_${dateKey}`;
              const dayLog = logs[logKey];
              const isCompleted = dayLog?.status === 'COMPLETED';
              const isExcused = dayLog?.status === 'EXCUSED';
              const isMissed = dayLog?.status === 'MISSED' || dayLog?.status === 'FAILED';
              const isSkipped = dayLog?.status === 'SKIPPED';
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={dateKey}
                  className={clsx(
                    'h-9 rounded-xl flex flex-col items-center justify-center text-xs font-mono transition-all border',
                    isCompleted && 'bg-badge-success text-white border-badge-success font-bold shadow-2xs',
                    isExcused && 'bg-blue-100 text-blue-700 border-blue-300 font-bold',
                    isMissed && 'bg-amber-100 text-amber-800 border-amber-300 font-semibold',
                    isSkipped && 'bg-red-100 text-red-600 border-red-200',
                    !dayLog && 'bg-surface-bone text-charcoal border-hairline/60',
                    isToday && 'ring-2 ring-primary ring-offset-1 font-bold'
                  )}
                  title={`${dateKey}: ${
                    isCompleted
                      ? 'Completed'
                      : isExcused
                      ? `Excused: ${dayLog?.missedReasonText || 'Protected'}`
                      : isMissed
                      ? `Missed: ${dayLog?.missedReasonText || 'Uncompleted'}`
                      : isSkipped
                      ? 'Skipped'
                      : 'No record'
                  }`}
                >
                  <span>{format(day, 'd')}</span>
                  {isCompleted && <span className="text-[8px] leading-none">✓</span>}
                  {isExcused && <span className="text-[8px] leading-none">🛡️</span>}
                  {isMissed && <span className="text-[8px] leading-none">!</span>}
                </div>
              );
            })}
          </div>
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
