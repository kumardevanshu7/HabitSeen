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

  // Filter logs for this habit
  const habitLogs = Object.values(logs).filter((l) => l.habitId === habit.id);
  const completedLogs = habitLogs.filter((l) => l.status === 'COMPLETED');
  const skippedLogs = habitLogs.filter((l) => l.status === 'SKIPPED');
  const totalTracked = habitLogs.length;

  const successRate =
    totalTracked > 0 ? Math.round((completedLogs.length / totalTracked) * 100) : 0;

  // Calendar days
  const monthStart = startOfMonth(currentCalendarMonth);
  const monthEnd = endOfMonth(currentCalendarMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${habit.name}"?`)) {
      await deleteHabit(habit.id);
      onClose();
    }
  };

  return (
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
                onClick={() => onEdit(habit)}
                className="gap-1.5"
              >
                <Edit2 size={14} /> Edit
              </Button>
            )}
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
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
                {habit.stats.currentStreak}{' '}
                <span className="text-xs font-sans text-charcoal">days</span>
              </p>
            </div>

            <div className="p-3.5 bg-surface-card border border-hairline rounded-2xl text-center">
              <span className="text-xs text-charcoal flex items-center justify-center gap-1">
                <Trophy size={14} className="text-amber-500" /> Best Streak
              </span>
              <p className="font-mono text-2xl font-bold text-ink mt-1">
                {habit.stats.bestStreak}{' '}
                <span className="text-xs font-sans text-charcoal">days</span>
              </p>
            </div>

            <div className="p-3.5 bg-surface-card border border-hairline rounded-2xl text-center">
              <span className="text-xs text-charcoal">This Week</span>
              <p className="font-mono text-2xl font-bold text-ink mt-1">
                {habit.stats.timesCompletedThisWeek}
              </p>
            </div>

            <div className="p-3.5 bg-surface-card border border-hairline rounded-2xl text-center">
              <span className="text-xs text-charcoal">All-Time Completed</span>
              <p className="font-mono text-2xl font-bold text-badge-success mt-1">
                {habit.stats.timesCompletedAllTime}
              </p>
            </div>
          </div>
        </div>

        {/* 2. SUCCESS VS FAILURE DISTRIBUTION */}
        <div className="p-4 bg-surface-card border border-hairline rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-charcoal ml-1">
              Success vs Failure Ratio
            </h4>
            <span className="text-xs font-mono font-bold text-ink bg-surface-bone px-2.5 py-1 rounded-full border border-hairline">
              {successRate}% Success Rate
            </span>
          </div>

          <div className="w-full bg-surface-bone h-3 rounded-full overflow-hidden flex">
            <div
              className="bg-badge-success transition-all duration-500"
              style={{ width: `${successRate}%` }}
              title={`Success: ${completedLogs.length}`}
            />
            <div
              className="bg-red-400 transition-all duration-500"
              style={{ width: `${100 - successRate}%` }}
              title={`Failed/Skipped: ${skippedLogs.length}`}
            />
          </div>

          <div className="flex items-center justify-around mt-3 text-xs text-charcoal">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-badge-success" />
              Completed ({completedLogs.length})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              Skipped/Missed ({skippedLogs.length})
            </span>
            <span className="flex items-center gap-1.5">
              Total Logged: {totalTracked} days
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
              const isSkipped = dayLog?.status === 'SKIPPED';
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={dateKey}
                  className={clsx(
                    'h-9 rounded-xl flex flex-col items-center justify-center text-xs font-mono transition-all border',
                    isCompleted && 'bg-badge-success text-white border-badge-success font-bold',
                    isSkipped && 'bg-red-100 text-red-600 border-red-200',
                    !isCompleted && !isSkipped && 'bg-surface-bone text-charcoal border-hairline/60',
                    isToday && 'ring-2 ring-primary ring-offset-1 font-bold'
                  )}
                  title={`${dateKey}: ${isCompleted ? 'Completed' : isSkipped ? 'Skipped' : 'No record'}`}
                >
                  <span>{format(day, 'd')}</span>
                  {isCompleted && <span className="text-[8px] leading-none">✓</span>}
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
  );
};
