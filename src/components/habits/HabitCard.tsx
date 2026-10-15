import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Habit, HabitLog } from '../../types/habit';
import { useAppStore } from '../../stores/useAppStore';
import { CATEGORY_ICONS } from '../../constants/iconsAndColors';
import { boostVibrancy, getContrastIconColor } from '../../utils/colorUtils';
import {
  formatSecondsToHMS,
  parseHMSToSeconds,
  isDateInThisWeek,
  isDateInThisMonth,
} from '../../utils/dateMath';
import {
  Check,
  Flame,
  Minus,
  Plus,
  Star,
  ChevronDown,
  ChevronUp,
  BarChart2,
  Lock,
  Unlock,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Copy,
  Trash2,
  MoreVertical,
  Archive,
  ArchiveRestore,
  Flag,
} from 'lucide-react';
import clsx from 'clsx';
import confetti from 'canvas-confetti';
import { LogMissedModal } from './LogMissedModal';
import { computeHabitStreaks } from '../../utils/streakEngine';
import { getFlameTier } from '../../constants/gamification';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { SecurityModal } from '../security/SecurityModal';

interface HabitCardProps {
  habit: Habit;
  dateKey: string;
  onOpenDetails: (habit: Habit) => void;
  variant?: 'grid' | 'list';
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  dateKey,
  onOpenDetails,
  variant = 'grid',
}) => {
  const { categories, logs, logHabit, skipHabit, addHabit, toggleArchiveHabit, deleteHabit, user } = useAppStore();

  const isJustTracking = habit.frequency?.type === 'JUST_TRACKING';

  const habitCompletedLogs = useMemo(
    () => Object.values(logs || {}).filter((l) => l?.habitId === habit.id && l?.status === 'COMPLETED'),
    [logs, habit.id]
  );
  const timesCompletedThisWeek = useMemo(
    () => habitCompletedLogs.filter((l) => l.date && isDateInThisWeek(l.date)).length,
    [habitCompletedLogs]
  );
  const timesCompletedThisMonth = useMemo(
    () => habitCompletedLogs.filter((l) => l.date && isDateInThisMonth(l.date)).length,
    [habitCompletedLogs]
  );

  const category = categories.find((c) => c.id === habit.categoryId);
  const CategoryIcon =
    CATEGORY_ICONS.find((i) => i.id === category?.icon)?.icon || CATEGORY_ICONS[0].icon;

  const vibrantColor = boostVibrancy(category?.color);
  const iconColor = getContrastIconColor(vibrantColor);

  const logKey = `${habit.id}_${dateKey}`;
  const dayLog = logs[logKey];
  const isCompleted = dayLog?.status === 'COMPLETED';
  const isSkipped = dayLog?.status === 'SKIPPED';
  const isExcused = dayLog?.status === 'EXCUSED';
  const isMissed = dayLog?.status === 'MISSED' || dayLog?.status === 'FAILED';

  const streakInfo = computeHabitStreaks(habit, logs);
  const currentStreak = streakInfo.currentStreak;
  const flameTier = getFlameTier(currentStreak);

  const [isMissedModalOpen, setIsMissedModalOpen] = useState(false);
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [duplicateName, setDuplicateName] = useState('');
  const [isSecurityDeleteOpen, setIsSecurityDeleteOpen] = useState(false);

  // State for Numeric Value
  const [currentNum, setCurrentNum] = useState<number>(dayLog?.valueNumeric ?? 0);

  // State for Manual Timer Logging (HH : MM : SS) - NO AUTO STOPWATCH
  const targetSeconds = habit.config.timer?.targetSeconds || 1500;
  const initialLoggedSeconds = dayLog?.valueTimerSeconds ?? 0;
  const initialHMS = formatSecondsToHMS(initialLoggedSeconds);

  const [inputHours, setInputHours] = useState<string>(
    String(initialHMS.hours).padStart(2, '0')
  );
  const [inputMinutes, setInputMinutes] = useState<string>(
    String(initialHMS.minutes).padStart(2, '0')
  );
  const [inputSecs, setInputSecs] = useState<string>(
    String(initialHMS.seconds).padStart(2, '0')
  );

  // State for Checklist
  const [completedItems, setCompletedItems] = useState<string[]>(
    dayLog?.valueChecklistCompletedItemIds ?? []
  );
  const [isChecklistExpanded, setIsChecklistExpanded] = useState(false);

  // Sync state when dayLog changes
  useEffect(() => {
    if (dayLog) {
      if (typeof dayLog.valueNumeric === 'number') setCurrentNum(dayLog.valueNumeric);
      if (typeof dayLog.valueTimerSeconds === 'number') {
        const hms = formatSecondsToHMS(dayLog.valueTimerSeconds);
        setInputHours(String(hms.hours).padStart(2, '0'));
        setInputMinutes(String(hms.minutes).padStart(2, '0'));
        setInputSecs(String(hms.seconds).padStart(2, '0'));
      }
      if (Array.isArray(dayLog.valueChecklistCompletedItemIds)) {
        setCompletedItems(dayLog.valueChecklistCompletedItemIds);
      }
    } else {
      setCurrentNum(0);
      setInputHours('00');
      setInputMinutes('00');
      setInputSecs('00');
      setCompletedItems([]);
    }
  }, [dayLog]);

  // YES / NO TOGGLE
  const handleToggleYesNo = () => {
    if (isCompleted) {
      if (isJustTracking) {
        // Locked permanently once completed for this day! Cannot uncheck.
        return;
      }
      logHabit(habit.id, dateKey, { valueYesNo: false });
      return;
    }
    confetti({ particleCount: 45, spread: 60, origin: { y: 0.7 } });
    logHabit(habit.id, dateKey, { valueYesNo: true });
  };

  // NUMERIC HANDLERS: User can adjust counts freely with stepper buttons, then tap checkmark to lock!
  const adjustNumeric = (delta: number) => {
    const nextVal = Math.max(0, currentNum + delta);
    setCurrentNum(nextVal);
    const goal = habit.config.numeric?.goal || 1;
    if (nextVal >= goal && currentNum < goal) {
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
    }
    // Maintain PARTIAL status while user adjusts count; lock as COMPLETED when they click the checkmark
    logHabit(habit.id, dateKey, { valueNumeric: nextVal, forceStatus: 'PARTIAL' });
  };

  // NUMERIC TOGGLE / LOCK HANDLER (tap checkmark to lock with entered value or goal)
  const handleToggleNumericComplete = () => {
    if (isCompleted) {
      if (isJustTracking) return; // Just Tracking habits lock permanently once marked done
      handleUnlock();
      return;
    }
    const goal = habit.config.numeric?.goal || 1;
    const finalVal = currentNum > 0 ? currentNum : goal;
    setCurrentNum(finalVal);
    confetti({ particleCount: 45, spread: 60, origin: { y: 0.7 } });
    logHabit(habit.id, dateKey, {
      valueNumeric: finalVal,
      forceStatus: 'COMPLETED',
    });
  };

  // MANUAL TIMER LOGGING (User writes their time, no auto-start stopwatch)
  const handleSaveTimer = (overrideSeconds?: number, markComplete: boolean = true) => {
    let totalSecs =
      overrideSeconds !== undefined
        ? overrideSeconds
        : parseHMSToSeconds(
            Number(inputHours) || 0,
            Number(inputMinutes) || 0,
            Number(inputSecs) || 0
          );

    // If inputs are 0 and user ticked the completion circle, auto-fill targetSeconds
    if (totalSecs === 0 && markComplete) {
      totalSecs = targetSeconds;
      const hms = formatSecondsToHMS(targetSeconds);
      setInputHours(String(hms.hours).padStart(2, '0'));
      setInputMinutes(String(hms.minutes).padStart(2, '0'));
      setInputSecs(String(hms.seconds).padStart(2, '0'));
    }

    if (markComplete || totalSecs >= targetSeconds) {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    }
    logHabit(habit.id, dateKey, {
      valueTimerSeconds: totalSecs,
      forceStatus: markComplete ? 'COMPLETED' : undefined,
    });
  };

  const handleMatchTargetTimer = () => {
    const hms = formatSecondsToHMS(targetSeconds);
    setInputHours(String(hms.hours).padStart(2, '0'));
    setInputMinutes(String(hms.minutes).padStart(2, '0'));
    setInputSecs(String(hms.seconds).padStart(2, '0'));
  };

  // CHECKLIST HANDLERS
  const toggleChecklistItem = (itemId: string) => {
    const exists = completedItems.includes(itemId);
    const updated = exists
      ? completedItems.filter((id) => id !== itemId)
      : [...completedItems, itemId];

    setCompletedItems(updated);
    logHabit(habit.id, dateKey, { valueChecklistCompletedItemIds: updated });
  };

  const handleToggleChecklistComplete = () => {
    if (isCompleted) {
      logHabit(habit.id, dateKey, {
        valueChecklistCompletedItemIds: completedItems,
        forceStatus: 'PARTIAL',
      });
      return;
    }
    confetti({ particleCount: 45, spread: 60, origin: { y: 0.7 } });
    logHabit(habit.id, dateKey, {
      valueChecklistCompletedItemIds: completedItems,
      forceStatus: 'COMPLETED',
    });
  };

  // UNLOCK ACTION
  const handleUnlock = () => {
    if (isExcused || isMissed) {
      logHabit(habit.id, dateKey, { valueYesNo: false, valueNumeric: 0, valueTimerSeconds: 0 });
      return;
    }
    if (habit.type === 'YES_NO') {
      logHabit(habit.id, dateKey, { valueYesNo: false });
    } else if (habit.type === 'NUMERIC') {
      const goal = habit.config.numeric?.goal || 1;
      const lower = Math.max(0, currentNum >= goal ? goal - 1 : currentNum);
      setCurrentNum(lower);
      logHabit(habit.id, dateKey, { valueNumeric: lower, forceStatus: 'PARTIAL' });
    } else if (habit.type === 'TIMER') {
      const lower = Math.max(0, targetSeconds - 60);
      const hms = formatSecondsToHMS(lower);
      setInputHours(String(hms.hours).padStart(2, '0'));
      setInputMinutes(String(hms.minutes).padStart(2, '0'));
      setInputSecs(String(hms.seconds).padStart(2, '0'));
      logHabit(habit.id, dateKey, { valueTimerSeconds: lower });
    } else if (habit.type === 'CHECKLIST') {
      logHabit(habit.id, dateKey, {
        valueChecklistCompletedItemIds: completedItems,
        forceStatus: 'PARTIAL',
      });
    }
  };

  const formattedTargetHMS = formatSecondsToHMS(targetSeconds).formatted;
  const currentLoggedSeconds = dayLog?.valueTimerSeconds ?? 0;
  const formattedLoggedHMS = formatSecondsToHMS(currentLoggedSeconds).formatted;

  const formatCompactDuration = (totalSeconds: number): string => {
    const s = Math.max(0, Math.floor(totalSeconds || 0));
    const hours = Math.floor(s / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    if (hours > 0) {
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
    if (minutes > 0) return `${minutes}m`;
    return `${s}s`;
  };

  const compactTargetTime = formatCompactDuration(targetSeconds);
  const compactLoggedTime = formatCompactDuration(currentLoggedSeconds);

  // =========================================================================
  // HOLD / LONG-PRESS HANDLERS FOR HABIT CARD (DELETE / DUPLICATE)
  // =========================================================================
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, input, textarea, a, select')) return;

    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    holdTimerRef.current = setTimeout(() => {
      navigator.vibrate?.(40);
      setIsOptionsMenuOpen(true);
    }, 650);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPos.current.x);
    const dy = Math.abs(touch.clientY - touchStartPos.current.y);
    if (dx > 10 || dy > 10) {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    }
  };

  const handleTouchEnd = () => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, input, textarea, a, select')) return;

    holdTimerRef.current = setTimeout(() => {
      setIsOptionsMenuOpen(true);
    }, 650);
  };

  const handleMouseUp = () => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('input, textarea')) return;
    e.preventDefault();
    setIsOptionsMenuOpen(true);
  };

  const handleOpenDuplicate = () => {
    setIsOptionsMenuOpen(false);
    setDuplicateName(`${habit.name} (Copy)`);
    setIsDuplicateModalOpen(true);
  };

  const handleConfirmDuplicate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!duplicateName.trim()) return;
    try {
      await addHabit({
        name: duplicateName.trim(),
        description: habit.description || '',
        categoryId: habit.categoryId,
        type: habit.type,
        config: JSON.parse(JSON.stringify(habit.config)),
        frequency: JSON.parse(JSON.stringify(habit.frequency)),
        schedule: JSON.parse(JSON.stringify(habit.schedule)),
        isArchived: false,
      });
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      setIsDuplicateModalOpen(false);
    } catch (err) {
      console.error('Failed to duplicate habit:', err);
    }
  };

  const handleDeleteRequest = () => {
    setIsOptionsMenuOpen(false);
    if (user?.security?.question && user?.security?.answer) {
      setIsSecurityDeleteOpen(true);
    } else {
      if (window.confirm(`Are you sure you want to permanently delete "${habit.name}"?`)) {
        deleteHabit(habit.id);
      }
    }
  };

  // =========================================================================
  // 1. HORIZONTAL LIST VIEW VARIANT (TRUE COMPACT HORIZONTAL ROW)
  // =========================================================================
  const renderListView = () => (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={handleContextMenu}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('button, input, textarea, a, select, [data-interactive="true"]')) return;
        onOpenDetails(habit);
      }}
      className={clsx(
        'group relative rounded-2xl border transition-all duration-200 overflow-hidden shadow-2xs select-none w-full cursor-pointer',
        isCompleted && habit.type === 'YES_NO'
          ? 'bg-stone/10 border-stone/30 opacity-75'
          : isCompleted
          ? 'bg-emerald-50/15 border-emerald-200/50'
          : isExcused
          ? 'bg-blue-50/40 border-blue-200'
          : isMissed
          ? 'bg-red-50/30 border-red-200'
          : isSkipped
          ? 'bg-red-50/20 border-red-200'
          : 'bg-surface-card border-hairline hover:border-hairline-strong hover:shadow-xs'
      )}
      style={{
        borderLeftWidth: '5px',
        borderLeftColor: vibrantColor,
      }}
    >
      <div className="p-3 sm:p-3.5 flex items-center justify-between gap-2 sm:gap-3.5">
        {/* LEFT: Category Icon + Habit Title & Meta */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetails(habit);
          }}
          className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 cursor-pointer"
        >
          <span
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 shadow-2xs"
            style={{
              backgroundColor: vibrantColor,
              color: iconColor,
            }}
          >
            <CategoryIcon size={16} strokeWidth={2.5} />
          </span>

          <div className="min-w-0 flex-1 pr-1">
            <h4
              className={clsx(
                'font-display font-bold text-sm sm:text-base text-ink tracking-tight truncate hover:text-primary transition-colors',
                isCompleted && habit.type === 'YES_NO' && 'line-through text-charcoal'
              )}
            >
              {habit.name}
            </h4>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-charcoal mt-0.5 truncate whitespace-nowrap">
              <span className="font-semibold uppercase tracking-wider">
                {category?.name || 'Category'}
              </span>
              <span>•</span>
              <span
                className="inline-flex items-center gap-0.5 font-mono font-medium text-stone"
                title={`Priority: ${habit.schedule.priority ?? 50}`}
              >
                <Flag size={9} className="shrink-0 text-stone" />
                <span>{habit.schedule.priority ?? 50}</span>
              </span>
              {isJustTracking ? (
                <>
                  <span>•</span>
                  <span
                    className="inline-flex items-center gap-1 font-mono font-bold text-primary"
                    title={`Just Tracking: ${timesCompletedThisWeek} this week • ${timesCompletedThisMonth} this month`}
                  >
                    <Sparkles size={10} className="text-primary shrink-0" />
                    <span>{timesCompletedThisWeek}w / {timesCompletedThisMonth}m</span>
                  </span>
                </>
              ) : (
                currentStreak > 0 && (
                  <>
                    <span>•</span>
                    <span
                      className={clsx(
                        'inline-flex items-center gap-0.5 font-mono font-bold',
                        currentStreak >= 7 ? 'text-orange-600' : 'text-primary'
                      )}
                    >
                      <Flame size={10} className="fill-current" /> {currentStreak}d
                    </span>
                  </>
                )
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Actions + Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* YES_NO */}
          {habit.type === 'YES_NO' && (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                disabled={isJustTracking && isCompleted}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleYesNo();
                }}
                className={clsx(
                  'w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all shadow-xs shrink-0',
                  isCompleted
                    ? clsx(
                        'bg-badge-success border-2 border-badge-success text-white',
                        isJustTracking ? 'cursor-default ring-2 ring-badge-success/30' : 'active:scale-90 cursor-pointer'
                      )
                    : 'border-2 border-red-500 bg-red-50 hover:bg-red-100 text-red-500 active:scale-90 cursor-pointer'
                )}
                title={
                  isCompleted
                    ? isJustTracking
                      ? 'Completed & Locked: Just Tracking habits cannot be unchecked once marked done'
                      : 'Completed! Tap to unmark'
                    : 'Tap to mark done'
                }
              >
                {isJustTracking && isCompleted ? (
                  <Check size={16} className="stroke-[3]" />
                ) : (
                  <Check size={18} className={clsx(isCompleted ? 'stroke-[3]' : 'stroke-[2.5]')} />
                )}
              </button>
              {isJustTracking && isCompleted && (
                <span className="hidden xs:inline-flex items-center gap-0.5 text-[10px] font-bold text-badge-success bg-badge-success/10 px-1.5 py-0.5 rounded-full border border-badge-success/20">
                  <Lock size={9} /> Locked
                </span>
              )}
            </div>
          )}

          {/* NUMERIC */}
          {habit.type === 'NUMERIC' && (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="font-mono text-xs font-bold text-ink whitespace-nowrap">
                <span
                  className={clsx(
                    'text-sm font-black',
                    isCompleted ? 'text-badge-success' : 'text-primary'
                  )}
                >
                  {currentNum}
                </span>
                <span className="text-charcoal font-medium">/{habit.config.numeric?.goal}</span>
              </div>
              {!isExcused && !isMissed && (
                <div className="flex items-center gap-1">
                  {!isCompleted && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          adjustNumeric(-1);
                        }}
                        className="w-7 h-7 rounded-full bg-surface-bone hover:bg-stone/20 flex items-center justify-center text-ink border border-hairline transition-all active:scale-90 cursor-pointer"
                        title="Decrease count"
                      >
                        <Minus size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          adjustNumeric(1);
                        }}
                        className="w-7 h-7 rounded-full bg-surface-bone hover:bg-stone/20 flex items-center justify-center text-ink border border-hairline transition-all active:scale-90 cursor-pointer"
                        title="Increase count"
                      >
                        <Plus size={12} />
                      </button>
                    </>
                  )}
                  {/* RED CIRCLE -> GREEN TICK TOGGLE */}
                  <button
                    type="button"
                    disabled={isJustTracking && isCompleted}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleNumericComplete();
                    }}
                    className={clsx(
                      'w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-xs shrink-0',
                      isCompleted
                        ? clsx(
                            'bg-badge-success border-2 border-badge-success text-white',
                            isJustTracking
                              ? 'cursor-default ring-2 ring-badge-success/30'
                              : 'active:scale-90 cursor-pointer'
                          )
                        : 'border-2 border-red-500 bg-red-50 hover:bg-red-100 text-red-500 active:scale-90 cursor-pointer'
                    )}
                    title={
                      isCompleted
                        ? isJustTracking
                          ? 'Completed & Locked'
                          : 'Completed! Click to unlock'
                        : 'Tap to mark complete & lock'
                    }
                  >
                    <Check
                      size={16}
                      className={clsx(isCompleted ? 'stroke-[3]' : 'stroke-[2.5]')}
                    />
                  </button>
                  {isJustTracking && isCompleted && (
                    <span className="hidden xs:inline-flex items-center gap-0.5 text-[10px] font-bold text-badge-success bg-badge-success/10 px-1.5 py-0.5 rounded-full border border-badge-success/20">
                      <Lock size={9} /> Locked
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TIMER */}
          {habit.type === 'TIMER' && (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span
                className={clsx(
                  'font-mono text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0',
                  isCompleted
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-surface-bone text-charcoal border-hairline'
                )}
                title={`${formattedLoggedHMS} / ${formattedTargetHMS}`}
              >
                {compactLoggedTime} / {compactTargetTime}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isCompleted) {
                    handleUnlock();
                  } else {
                    handleSaveTimer(undefined, true);
                  }
                }}
                className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 cursor-pointer shrink-0',
                  isCompleted
                    ? 'bg-badge-success border-2 border-badge-success text-white'
                    : 'border-2 border-red-500 bg-red-50 hover:bg-red-100 text-red-500'
                )}
                title={isCompleted ? 'Completed! Tap to reset or edit' : 'Tap to mark complete'}
              >
                <Check size={16} className={clsx(isCompleted ? 'stroke-[3]' : 'stroke-[2.5]')} />
              </button>
            </div>
          )}

          {/* CHECKLIST */}
          {habit.type === 'CHECKLIST' && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsChecklistExpanded(!isChecklistExpanded);
                }}
                className="text-xs font-mono font-bold text-charcoal hover:text-ink bg-surface-bone px-2 py-1 rounded-full border border-hairline flex items-center gap-1 cursor-pointer"
              >
                <span>{completedItems.length}/{habit.config.checklist?.items.length || 0}</span>
                {isChecklistExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleChecklistComplete();
                }}
                className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-xs active:scale-90 cursor-pointer shrink-0',
                  isCompleted
                    ? 'bg-badge-success border-2 border-badge-success text-white'
                    : 'border-2 border-red-500 bg-red-50 hover:bg-red-100 text-red-500'
                )}
                title={isCompleted ? 'Completed! Tap to undo' : 'Tap to mark done'}
              >
                <Check size={16} className={clsx(isCompleted ? 'stroke-[3]' : 'stroke-[2.5]')} />
              </button>
            </div>
          )}

          {/* STATUS / MISSED BUTTON */}
          {isExcused ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold whitespace-nowrap shrink-0">
              <ShieldCheck size={11} className="text-blue-600 shrink-0" /> Excused
            </span>
          ) : isMissed ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-bold whitespace-nowrap shrink-0">
              <AlertTriangle size={11} className="text-red-600 shrink-0" /> Missed
            </span>
          ) : !isCompleted && !isJustTracking && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMissedModalOpen(true);
              }}
              className="p-1.5 text-charcoal hover:text-red-600 bg-surface-bone hover:bg-red-50 border border-hairline rounded-full flex items-center justify-center transition-colors shrink-0 cursor-pointer"
              title="Log missed habit with reason"
            >
              <ShieldAlert size={13} />
            </button>
          )}

          {/* ANALYTICS BUTTON (DESKTOP/TABLET) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails(habit);
            }}
            className="hidden sm:inline-flex p-1.5 rounded-full bg-surface-bone hover:bg-stone/20 text-charcoal hover:text-ink border border-hairline transition-colors shrink-0 cursor-pointer"
            title="View Habit Analytics & History"
          >
            <BarChart2 size={13} className="text-primary" />
          </button>

          {/* MORE OPTIONS (DELETE / DUPLICATE / ARCHIVE) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOptionsMenuOpen(true);
            }}
            className="p-1.5 text-charcoal hover:text-ink hover:bg-surface-bone rounded-full transition-colors cursor-pointer shrink-0"
            title="Habit Options (Tap to edit / duplicate / delete)"
          >
            <MoreVertical size={15} />
          </button>
        </div>
      </div>

      {/* EXPANDED CHECKLIST IF TOGGLED */}
      {habit.type === 'CHECKLIST' && isChecklistExpanded && (
        <div className="px-3 pb-3 pt-1 border-t border-hairline/60 bg-surface-bone/30 space-y-1.5 animate-in fade-in duration-150">
          {habit.config.checklist?.items.map((item) => {
            const isDone = completedItems.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleChecklistItem(item.id);
                }}
                className={clsx(
                  'flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-all',
                  isDone
                    ? 'bg-emerald-50/50 border-emerald-300 line-through text-charcoal'
                    : 'bg-surface-card border-hairline text-ink hover:bg-surface-bone'
                )}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isDone}
                    readOnly
                    className="rounded-full text-badge-success focus:ring-0 cursor-pointer"
                  />
                  <span>{item.text}</span>
                </div>
                {item.isStarred && (
                  <Star size={13} className="text-amber-500 fill-amber-500" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // =========================================================================
  // 2. GRID CARD VIEW VARIANT
  // =========================================================================
  const renderGridView = () => (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={handleContextMenu}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('button, input, textarea, a, select, [data-interactive="true"]')) return;
        onOpenDetails(habit);
      }}
      className={clsx(
        'group relative rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md h-fit w-full select-none cursor-pointer',
        isCompleted && habit.type === 'YES_NO'
          ? 'bg-stone/10 border-stone/30 opacity-75'
          : isCompleted
          ? 'bg-emerald-50/15 border-emerald-200/50'
          : isExcused
          ? 'bg-blue-50/40 border-blue-200 opacity-85'
          : isMissed
          ? 'bg-red-50/30 border-red-200 opacity-75'
          : isSkipped
          ? 'bg-red-50/20 border-red-200 opacity-75'
          : 'bg-surface-card border-hairline hover:border-hairline-strong'
      )}
      style={{
        borderLeftWidth: '6px',
        borderLeftColor: vibrantColor,
      }}
    >
      <div className="p-3.5 sm:p-4">
        {/* TOP ROW: CATEGORY + PRIORITY + STATUS BADGE + DETAILS BUTTON (OPTIMIZED NO-WRAP) */}
        <div className="flex items-center justify-between gap-1.5 mb-2.5">
          <div
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails(habit);
            }}
            className="flex items-center gap-1.5 min-w-0 cursor-pointer"
          >
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-2xs"
              style={{
                backgroundColor: vibrantColor,
                color: iconColor,
              }}
            >
              <CategoryIcon size={14} strokeWidth={2.5} />
            </span>
            <span className="text-[11px] font-bold text-charcoal uppercase tracking-wide whitespace-nowrap truncate max-w-[85px] xs:max-w-[120px] sm:max-w-none">
              {category?.name || 'Category'}
            </span>
            <span
              className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full border bg-surface-bone text-charcoal border-hairline whitespace-nowrap shrink-0"
              title={`Priority: ${habit.schedule.priority ?? 50}`}
            >
              <Flag size={9} className="text-stone shrink-0" />
              <span className="hidden sm:inline text-stone">Pri</span>
              <span>{habit.schedule.priority ?? 50}</span>
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-auto">
            {isCompleted && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 whitespace-nowrap shrink-0 shadow-2xs">
                <Check size={11} className="stroke-[3]" />
                <span>Done</span>
              </span>
            )}
            {isExcused && (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold border border-blue-200 whitespace-nowrap shrink-0">
                <ShieldCheck size={11} className="text-blue-600 shrink-0" />
                <span>Shielded</span>
              </div>
            )}
            {isMissed && (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-bold border border-red-200 whitespace-nowrap shrink-0">
                <AlertTriangle size={11} className="text-red-600 shrink-0" />
                <span>{dayLog?.status === 'FAILED' ? 'Skipped' : 'Missed'}</span>
              </div>
            )}
            {isJustTracking ? (
              <span
                className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 whitespace-nowrap shrink-0"
                title={`Just Tracking: ${timesCompletedThisWeek} this week • ${timesCompletedThisMonth} this month`}
              >
                <Sparkles size={11} className="text-primary shrink-0" />
                <span>{timesCompletedThisWeek}w / {timesCompletedThisMonth}m</span>
              </span>
            ) : (
              !isExcused && !isMissed && currentStreak > 0 && (
                <span
                  className={clsx(
                    'inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0',
                    currentStreak >= 30
                      ? 'bg-blue-50 text-blue-600 border-blue-200'
                      : currentStreak >= 7
                      ? 'bg-orange-50 text-orange-600 border-orange-200'
                      : 'bg-primary/10 text-primary border-primary/20'
                  )}
                  title={`${flameTier.title} (${currentStreak} consecutive days)`}
                >
                  <Flame
                    size={12}
                    className={clsx(flameTier.text, currentStreak >= 7 && 'fill-current shrink-0')}
                  />
                  {currentStreak}d
                </span>
              )
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetails(habit);
              }}
              className="p-1.5 rounded-full bg-surface-bone hover:bg-stone/20 text-charcoal hover:text-ink border border-hairline transition-colors cursor-pointer shrink-0"
              title="View Habit Analytics & History"
            >
              <BarChart2 size={13} className="text-primary" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOptionsMenuOpen(true);
              }}
              className="p-1 text-charcoal hover:text-ink hover:bg-surface-bone rounded-full transition-colors shrink-0"
              title="Habit Options (Hold card or tap: Delete / Duplicate)"
            >
              <MoreVertical size={15} />
            </button>
          </div>
        </div>

        {/* HABIT TITLE & DESCRIPTION (CLICK OPENS ANALYTICS) */}
        <div
          className="mb-4 cursor-pointer group/title"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetails(habit);
          }}
        >
          <h3
            className={clsx(
              'font-display font-bold text-lg sm:text-xl text-ink tracking-tight group-hover/title:text-primary transition-colors',
              isCompleted && habit.type === 'YES_NO' && 'line-through text-charcoal'
            )}
          >
            {habit.name}
          </h3>
          {habit.description && (
            <p className="text-xs text-charcoal line-clamp-1 mt-0.5">
              {habit.description}
            </p>
          )}
        </div>

        {/* EXCUSED BANNER */}
        {isExcused && (
          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                <ShieldCheck size={18} />
              </span>
              <div>
                <span className="text-xs font-bold text-blue-900 block">
                  🛡️ Streak Preserved (Excused)
                </span>
                <span className="text-[11px] text-blue-700 italic line-clamp-1">
                  "{dayLog?.missedReasonText || dayLog?.notes || 'Genuine reason'}"
                </span>
              </div>
            </div>
          </div>
        )}

        {/* MISSED BANNER */}
        {isMissed && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0">
                <AlertTriangle size={18} />
              </span>
              <div>
                <span className="text-xs font-bold text-red-900 block">
                  {dayLog?.status === 'FAILED' ? '❌ Intentional Skip (-25 XP)' : '⚠️ Missed Habit (-10 XP)'}
                </span>
                <span className="text-[11px] text-red-700">
                  {dayLog?.status === 'FAILED' ? '-2 Hearts Lost' : '-1 Heart Lost'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* INTERACTION AREA (BASED ON 4 TYPES) */}
        <div className="pt-2 border-t border-hairline/60">
          {isExcused || isMissed ? (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-bone/90 border border-hairline/80">
              <div className="flex items-center gap-2.5">
                <div
                  className={clsx(
                    'w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-2xs',
                    isExcused ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                  )}
                >
                  <Lock size={15} />
                </div>
                <div>
                  <span className="text-xs font-bold text-ink block">
                    {isExcused ? '🔒 Task Protected & Excused' : '🔒 Task Locked for Today'}
                  </span>
                  <span className="text-[11px] text-charcoal">
                    {isExcused
                      ? 'Streak preserved. No checkmark required today.'
                      : 'Logged as missed. Action locked for today.'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* 1. YES / NO HABIT */}
              {habit.type === 'YES_NO' && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-charcoal">
                    {isCompleted
                      ? isJustTracking
                        ? '🔒 Locked (Completed for today)'
                        : '✓ Completed for today'
                      : isSkipped
                      ? 'Skipped for today'
                      : 'Tap circle to mark complete:'}
                  </span>
                  <div className="flex items-center gap-2">
                    {!isCompleted && !isSkipped && !isExcused && !isMissed && !isJustTracking && (
                      <button
                        type="button"
                        onClick={() => setIsMissedModalOpen(true)}
                        className="text-xs font-semibold text-charcoal hover:text-red-600 bg-surface-bone hover:bg-red-50 border border-hairline px-2.5 py-1.5 rounded-full flex items-center gap-1 transition-colors cursor-pointer"
                        title="Log missed habit with reason"
                      >
                        <ShieldAlert size={13} className="text-charcoal" />
                        <span>Missed</span>
                      </button>
                    )}
                    {/* RED CIRCLE -> GREEN TICK TOGGLE */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={isJustTracking && isCompleted}
                        onClick={handleToggleYesNo}
                        className={clsx(
                          'w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-xs shrink-0',
                          isCompleted
                            ? clsx(
                                'bg-badge-success border-2 border-badge-success text-white shadow-md',
                                isJustTracking ? 'cursor-default ring-2 ring-badge-success/30' : 'active:scale-90 cursor-pointer'
                              )
                            : 'border-2 border-red-500 bg-red-50 hover:bg-red-100 text-red-500 active:scale-90 cursor-pointer'
                        )}
                        title={
                          isCompleted
                            ? isJustTracking
                              ? 'Completed & Locked: Just Tracking habits cannot be unchecked once marked done'
                              : 'Completed! Click to unmark'
                            : 'Tap to mark done'
                        }
                      >
                        {isJustTracking && isCompleted ? (
                          <Check size={20} className="stroke-[3]" />
                        ) : (
                          <Check size={20} className={clsx(isCompleted ? 'stroke-[3]' : 'stroke-[2.5]')} />
                        )}
                      </button>
                      {isJustTracking && isCompleted && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-badge-success bg-badge-success/10 px-2 py-0.5 rounded-full border border-badge-success/20">
                          <Lock size={11} /> Locked
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 2. NUMERIC HABIT */}
              {habit.type === 'NUMERIC' && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={clsx(
                        'font-mono text-xl font-bold',
                        isCompleted ? 'text-badge-success' : 'text-ink'
                      )}
                    >
                      {currentNum}
                    </span>
                    <span className="text-xs text-charcoal">
                      / {habit.config.numeric?.goal} {habit.config.numeric?.unit} a day
                    </span>
                    {isCompleted && (
                      <span className="text-xs font-bold text-badge-success ml-1 flex items-center gap-0.5">
                        ✓ Goal Met
                      </span>
                    )}
                  </div>

                  {!isExcused && !isMissed ? (
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {!isCompleted && (
                        <>
                          <button
                            type="button"
                            onClick={() => setIsMissedModalOpen(true)}
                            className="text-xs font-semibold text-charcoal hover:text-red-600 bg-surface-bone hover:bg-red-50 border border-hairline px-2.5 py-1.5 rounded-full flex items-center gap-1 transition-colors cursor-pointer"
                            title="Log missed habit with reason"
                          >
                            <ShieldAlert size={13} className="text-charcoal" />
                            <span>Missed</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => adjustNumeric(-1)}
                            className="w-9 h-9 rounded-full bg-surface-bone hover:bg-stone/20 flex items-center justify-center text-ink border border-hairline transition-all active:scale-90 cursor-pointer"
                            title="Decrease count"
                          >
                            <Minus size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => adjustNumeric(1)}
                            className="w-9 h-9 rounded-full bg-surface-bone hover:bg-stone/20 flex items-center justify-center text-ink border border-hairline transition-all active:scale-90 cursor-pointer"
                            title="Increase count"
                          >
                            <Plus size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => adjustNumeric(5)}
                            className="px-2.5 h-9 rounded-full bg-surface-bone hover:bg-stone/20 flex items-center justify-center text-xs font-mono font-bold text-ink border border-hairline transition-all active:scale-90 cursor-pointer"
                            title="Add 5"
                          >
                            +5
                          </button>
                        </>
                      )}

                      {/* RED CIRCLE -> GREEN TICK TOGGLE */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={isJustTracking && isCompleted}
                          onClick={handleToggleNumericComplete}
                          className={clsx(
                            'w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-xs shrink-0',
                            isCompleted
                              ? clsx(
                                  'bg-badge-success border-2 border-badge-success text-white shadow-md',
                                  isJustTracking
                                    ? 'cursor-default ring-2 ring-badge-success/30'
                                    : 'active:scale-90 cursor-pointer'
                                )
                              : 'border-2 border-red-500 bg-red-50 hover:bg-red-100 text-red-500 active:scale-90 cursor-pointer'
                          )}
                          title={
                            isCompleted
                              ? isJustTracking
                                ? 'Completed & Locked: Just Tracking habits cannot be unchecked once marked done'
                                : 'Completed! Click to unlock & edit count'
                              : 'Tap to mark complete & lock'
                          }
                        >
                          <Check
                            size={20}
                            className={clsx(isCompleted ? 'stroke-[3]' : 'stroke-[2.5]')}
                          />
                        </button>
                        {isJustTracking && isCompleted && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-badge-success bg-badge-success/10 px-2 py-0.5 rounded-full border border-badge-success/20">
                            <Lock size={11} /> Locked
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-charcoal">
                      {isExcused ? 'Excused' : 'Missed'}
                    </span>
                  )}
                </div>
              )}

              {/* 3. TIMER HABIT (NO AUTO STOPWATCH - MANUAL INPUT & LOG) */}
              {habit.type === 'TIMER' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-charcoal">
                      Target: <span className="text-ink font-extrabold">{formattedTargetHMS}</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-charcoal">
                      Logged:{' '}
                      <span
                        className={clsx(
                          'font-extrabold',
                          isCompleted ? 'text-badge-success' : 'text-primary'
                        )}
                      >
                        {formattedLoggedHMS}
                      </span>
                    </span>
                  </div>

                  {!isCompleted ? (
                    <div className="p-2.5 bg-surface-bone/80 rounded-2xl border border-hairline space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-charcoal uppercase">
                          Time Spent:
                        </span>
                        <button
                          type="button"
                          onClick={handleMatchTargetTimer}
                          className="font-bold text-primary hover:underline cursor-pointer"
                        >
                          Fill Target Time
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Hours */}
                        <div className="flex-1 text-center bg-surface-card rounded-xl py-1 px-1 border border-hairline">
                          <span className="text-[8px] text-charcoal uppercase font-bold block leading-none mb-0.5">Hours</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={inputHours}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              if (val === '') {
                                setInputHours('');
                                return;
                              }
                              const num = parseInt(val, 10);
                              setInputHours(String(Math.min(99, num)));
                            }}
                            onBlur={() => {
                              const num = parseInt(inputHours, 10) || 0;
                              setInputHours(String(Math.max(0, num)).padStart(2, '0'));
                            }}
                            className="w-full text-center font-mono font-bold text-sm bg-transparent text-ink focus:outline-none"
                          />
                        </div>

                        <span className="font-mono font-bold text-stone">:</span>

                        {/* Minutes */}
                        <div className="flex-1 text-center bg-surface-card rounded-xl py-1 px-1 border border-hairline">
                          <span className="text-[8px] text-charcoal uppercase font-bold block leading-none mb-0.5">Mins</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={inputMinutes}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              if (val === '') {
                                setInputMinutes('');
                                return;
                              }
                              const num = parseInt(val, 10);
                              setInputMinutes(String(Math.min(59, num)));
                            }}
                            onBlur={() => {
                              const num = parseInt(inputMinutes, 10) || 0;
                              setInputMinutes(
                                String(Math.max(0, Math.min(59, num))).padStart(2, '0')
                              );
                            }}
                            className="w-full text-center font-mono font-bold text-sm bg-transparent text-ink focus:outline-none"
                          />
                        </div>

                        <span className="font-mono font-bold text-stone">:</span>

                        {/* Seconds */}
                        <div className="flex-1 text-center bg-surface-card rounded-xl py-1 px-1 border border-hairline">
                          <span className="text-[8px] text-charcoal uppercase font-bold block leading-none mb-0.5">Secs</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={inputSecs}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              if (val === '') {
                                setInputSecs('');
                                return;
                              }
                              const num = parseInt(val, 10);
                              setInputSecs(String(Math.min(59, num)));
                            }}
                            onBlur={() => {
                              const num = parseInt(inputSecs, 10) || 0;
                              setInputSecs(
                                String(Math.max(0, Math.min(59, num))).padStart(2, '0')
                              );
                            }}
                            className="w-full text-center font-mono font-bold text-sm bg-transparent text-ink focus:outline-none"
                          />
                        </div>

                        {!isCompleted && !isExcused && !isMissed && (
                          <button
                            type="button"
                            onClick={() => setIsMissedModalOpen(true)}
                            className="h-10 px-2.5 rounded-xl bg-surface-bone hover:bg-red-50 border border-hairline text-charcoal hover:text-red-600 flex items-center gap-1 text-xs font-semibold transition-all shrink-0 cursor-pointer"
                            title="Log missed habit with reason"
                          >
                            <ShieldAlert size={13} />
                            <span>Missed</span>
                          </button>
                        )}

                        {/* RED CIRCLE COMPLETE BUTTON */}
                        <button
                          type="button"
                          onClick={() => handleSaveTimer(undefined, true)}
                          className="w-10 h-10 rounded-full border-2 border-red-500 bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 shadow-xs hover:shadow-sm transition-all duration-200 active:scale-90 cursor-pointer shrink-0"
                          title="Tap to mark complete"
                        >
                          <Check size={20} className="stroke-[2.5]" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50/40 rounded-2xl border border-emerald-200/60 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {/* GREEN CIRCLE WITH WHITE CHECKMARK */}
                        <button
                          type="button"
                          disabled={isJustTracking}
                          onClick={handleUnlock}
                          className={clsx(
                            'w-11 h-11 rounded-full bg-badge-success border-2 border-badge-success text-white flex items-center justify-center shadow-md transition-all shrink-0',
                            isJustTracking
                              ? 'cursor-default ring-2 ring-badge-success/30'
                              : 'active:scale-90 cursor-pointer'
                          )}
                          title={
                            isJustTracking
                              ? 'Completed & Locked'
                              : 'Completed! Click to unlock & edit'
                          }
                        >
                          <Check size={20} className="stroke-[3]" />
                        </button>
                        <div>
                          <span className="font-bold text-ink text-xs sm:text-sm block">
                            ✓ Completed for today!
                          </span>
                          <span className="text-xs font-mono text-charcoal">
                            Time logged: {formattedLoggedHMS}
                          </span>
                        </div>
                      </div>
                      {isJustTracking && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-badge-success bg-badge-success/10 px-2 py-0.5 rounded-full border border-badge-success/20">
                          <Lock size={11} /> Locked
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 4. CHECKLIST HABIT */}
              {habit.type === 'CHECKLIST' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold text-charcoal block">
                        Progress: <span className="font-mono font-bold text-ink">{completedItems.length}</span> /{' '}
                        {habit.config.checklist?.items.length || 0} tasks
                      </span>
                      {isCompleted && (
                        <span className="text-[11px] font-bold text-badge-success">
                          ✓ Completed for today ({completedItems.length}/{habit.config.checklist?.items.length || 0})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsChecklistExpanded(!isChecklistExpanded)}
                        className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline mr-1 cursor-pointer"
                      >
                        {isChecklistExpanded ? 'Hide tasks' : 'View tasks'}
                        {isChecklistExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>

                      {!isCompleted && !isExcused && !isMissed && (
                        <button
                          type="button"
                          onClick={() => setIsMissedModalOpen(true)}
                          className="text-xs font-semibold text-charcoal hover:text-red-600 bg-surface-bone hover:bg-red-50 border border-hairline px-2.5 py-1.5 rounded-full flex items-center gap-1 transition-colors cursor-pointer"
                          title="Log missed habit with reason"
                        >
                          <ShieldAlert size={13} className="text-charcoal" />
                          <span>Missed</span>
                        </button>
                      )}

                      {/* RED CIRCLE -> GREEN TICK TOGGLE */}
                      <button
                        type="button"
                        onClick={handleToggleChecklistComplete}
                        className={clsx(
                          'w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-xs shrink-0 active:scale-90 cursor-pointer',
                          isCompleted
                            ? 'bg-badge-success border-2 border-badge-success text-white shadow-md'
                            : 'border-2 border-red-500 bg-red-50 hover:bg-red-100 text-red-500'
                        )}
                        title={
                          isCompleted
                            ? 'Completed! Click to unmark'
                            : 'Tap to mark done for today with checked tasks'
                        }
                      >
                        <Check
                          size={20}
                          className={clsx(isCompleted ? 'stroke-[3]' : 'stroke-[2.5]')}
                        />
                      </button>
                    </div>
                  </div>

              {isChecklistExpanded && (
                <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                  {habit.config.checklist?.items.map((item) => {
                    const isDone = completedItems.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleChecklistItem(item.id)}
                        className={clsx(
                          'flex items-center justify-between p-2 rounded-xl border cursor-pointer text-xs transition-all',
                          isDone
                            ? 'bg-emerald-50/50 border-emerald-300 text-charcoal line-through'
                            : 'bg-surface-bone border-hairline text-ink hover:bg-stone/20'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isDone}
                            readOnly
                            className="rounded-full text-badge-success focus:ring-0 cursor-pointer"
                          />
                          <span>{item.text}</span>
                        </div>
                        {item.isStarred && (
                          <Star size={14} className="text-amber-500 fill-amber-500 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {variant === 'list' ? renderListView() : renderGridView()}

      {/* SHARED MODALS ACROSS BOTH VIEWS */}
      <LogMissedModal
        isOpen={isMissedModalOpen}
        onClose={() => setIsMissedModalOpen(false)}
        habit={habit}
        dateKey={dateKey}
      />

      {/* HABIT OPTIONS MODAL (HOLD TRIGGERED: DUPLICATE / DELETE) */}
      <Modal
        isOpen={isOptionsMenuOpen}
        onClose={() => setIsOptionsMenuOpen(false)}
        title={habit.name}
        subtitle={`${category?.name || 'Category'} • Priority ${habit.schedule.priority ?? 50}`}
        maxWidth="sm"
      >
        <div className="space-y-2.5 pt-1">
          <p className="text-xs text-charcoal">
            Choose an action for this habit:
          </p>

          <button
            type="button"
            onClick={handleOpenDuplicate}
            className="w-full flex items-center gap-3 p-3 rounded-2xl bg-surface-bone hover:bg-stone/20 text-ink text-left transition-colors font-medium border border-hairline group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Copy size={18} />
            </div>
            <div>
              <span className="font-bold text-sm block text-ink group-hover:text-primary transition-colors">
                Duplicate Habit
              </span>
              <span className="text-xs text-stone">
                Clone habit with same settings & edit name
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsOptionsMenuOpen(false);
              toggleArchiveHabit(habit.id, !habit.isArchived);
            }}
            className="w-full flex items-center gap-3 p-3 rounded-2xl bg-surface-bone hover:bg-stone/20 text-ink text-left transition-colors font-medium border border-hairline group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center shrink-0">
              {habit.isArchived ? <ArchiveRestore size={18} /> : <Archive size={18} />}
            </div>
            <div>
              <span className="font-bold text-sm block text-ink group-hover:text-primary transition-colors">
                {habit.isArchived ? 'Restore / Unarchive Habit' : 'Archive Habit (End Task)'}
              </span>
              <span className="text-xs text-stone">
                {habit.isArchived
                  ? 'Return this habit to your active schedule'
                  : 'End this habit completely and move it to Archived'}
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={handleDeleteRequest}
            className="w-full flex items-center gap-3 p-3 rounded-2xl bg-red-50 hover:bg-red-100 text-red-700 text-left transition-colors font-medium border border-red-200 group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <Trash2 size={18} />
            </div>
            <div>
              <span className="font-bold text-sm block text-red-800">
                Delete Habit
              </span>
              <span className="text-xs text-red-600">
                Permanently remove habit and logs
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsOptionsMenuOpen(false);
              setTimeout(() => {
                onOpenDetails(habit);
              }, 50);
            }}
            className="w-full flex items-center gap-3 p-3 rounded-2xl bg-surface-bone hover:bg-stone/20 text-ink text-left transition-colors font-medium border border-hairline group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-stone/20 text-charcoal flex items-center justify-center shrink-0">
              <BarChart2 size={18} />
            </div>
            <div>
              <span className="font-bold text-sm block text-ink group-hover:text-primary transition-colors">
                Habit Analytics & History
              </span>
              <span className="text-xs text-stone">
                View streaks, consistency, and calendar logs
              </span>
            </div>
          </button>

          <div className="pt-2 border-t border-hairline flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsOptionsMenuOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* DUPLICATE HABIT MODAL (ONLY ASKS TO EDIT NAME AND DONE) */}
      <Modal
        isOpen={isDuplicateModalOpen}
        onClose={() => setIsDuplicateModalOpen(false)}
        title="Duplicate Habit"
        subtitle="Edit name and confirm to create a duplicate"
        maxWidth="sm"
      >
        <form onSubmit={handleConfirmDuplicate} className="space-y-4 pt-1">
          <div>
            <Input
              label="Habit Name"
              placeholder="Enter habit name..."
              value={duplicateName}
              onChange={(e) => setDuplicateName(e.target.value)}
              autoFocus
              required
            />
            <p className="text-[11px] text-stone mt-1.5 ml-0.5">
              All schedule frequencies, targets, and settings will be preserved.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-hairline">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsDuplicateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!duplicateName.trim()}
            >
              Done
            </Button>
          </div>
        </form>
      </Modal>

      {/* SECURITY VERIFICATION FOR DELETION */}
      <SecurityModal
        isOpen={isSecurityDeleteOpen}
        onClose={() => setIsSecurityDeleteOpen(false)}
        title="Authorize Habit Deletion"
        actionTitle={`Permanently delete habit: "${habit.name}"`}
        isDanger={true}
        onSuccess={async () => {
          await deleteHabit(habit.id);
        }}
      />
    </>
  );
};
