import React, { useState, useEffect } from 'react';
import { Habit, HabitLog } from '../../types/habit';
import { useAppStore } from '../../stores/useAppStore';
import { CATEGORY_ICONS } from '../../constants/iconsAndColors';
import { boostVibrancy, getContrastIconColor } from '../../utils/colorUtils';
import { formatSecondsToHMS, parseHMSToSeconds } from '../../utils/dateMath';
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
} from 'lucide-react';
import clsx from 'clsx';
import confetti from 'canvas-confetti';
import { LogMissedModal } from './LogMissedModal';
import { computeHabitStreaks } from '../../utils/streakEngine';
import { getFlameTier } from '../../constants/gamification';

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
  const { categories, logs, logHabit, skipHabit } = useAppStore();

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

  // State for Numeric Value
  const [currentNum, setCurrentNum] = useState<number>(dayLog?.valueNumeric ?? 0);

  // State for Manual Timer Logging (HH : MM : SS) - NO AUTO STOPWATCH
  const targetSeconds = habit.config.timer?.targetSeconds || 1500;
  const initialLoggedSeconds = dayLog?.valueTimerSeconds ?? 0;
  const initialHMS = formatSecondsToHMS(initialLoggedSeconds);

  const [inputHours, setInputHours] = useState<number>(initialHMS.hours);
  const [inputMinutes, setInputMinutes] = useState<number>(initialHMS.minutes);
  const [inputSecs, setInputSecs] = useState<number>(initialHMS.seconds);

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
        setInputHours(hms.hours);
        setInputMinutes(hms.minutes);
        setInputSecs(hms.seconds);
      }
      if (Array.isArray(dayLog.valueChecklistCompletedItemIds)) {
        setCompletedItems(dayLog.valueChecklistCompletedItemIds);
      }
    } else {
      setCurrentNum(0);
      setInputHours(0);
      setInputMinutes(0);
      setInputSecs(0);
      setCompletedItems([]);
    }
  }, [dayLog]);

  // YES / NO TOGGLE
  const handleToggleYesNo = () => {
    if (isCompleted) {
      // Toggle off / reset
      logHabit(habit.id, dateKey, { valueYesNo: false });
      return;
    }
    confetti({ particleCount: 45, spread: 60, origin: { y: 0.7 } });
    logHabit(habit.id, dateKey, { valueYesNo: true });
  };

  // NUMERIC HANDLERS
  const adjustNumeric = (delta: number) => {
    if (isCompleted && delta < 0) {
      // Allow modifying downward if user clicks minus
    }
    const nextVal = Math.max(0, currentNum + delta);
    setCurrentNum(nextVal);
    const goal = habit.config.numeric?.goal || 1;
    if (nextVal >= goal && !isCompleted) {
      confetti({ particleCount: 45, spread: 60, origin: { y: 0.7 } });
    }
    logHabit(habit.id, dateKey, { valueNumeric: nextVal });
  };

  // MANUAL TIMER LOGGING (User writes their time, no auto-start stopwatch)
  const handleSaveTimer = (overrideSeconds?: number, markComplete: boolean = true) => {
    let totalSecs =
      overrideSeconds !== undefined
        ? overrideSeconds
        : parseHMSToSeconds(inputHours, inputMinutes, inputSecs);

    // If inputs are 0 and user ticked the completion circle, auto-fill targetSeconds
    if (totalSecs === 0 && markComplete) {
      totalSecs = targetSeconds;
      const hms = formatSecondsToHMS(targetSeconds);
      setInputHours(hms.hours);
      setInputMinutes(hms.minutes);
      setInputSecs(hms.seconds);
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
    setInputHours(hms.hours);
    setInputMinutes(hms.minutes);
    setInputSecs(hms.seconds);
  };

  // CHECKLIST HANDLERS
  const toggleChecklistItem = (itemId: string) => {
    if (isCompleted) return;
    const exists = completedItems.includes(itemId);
    const updated = exists
      ? completedItems.filter((id) => id !== itemId)
      : [...completedItems, itemId];

    setCompletedItems(updated);
    logHabit(habit.id, dateKey, { valueChecklistCompletedItemIds: updated });
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
      const lower = Math.max(0, goal - 1);
      setCurrentNum(lower);
      logHabit(habit.id, dateKey, { valueNumeric: lower });
    } else if (habit.type === 'TIMER') {
      const lower = Math.max(0, targetSeconds - 60);
      const hms = formatSecondsToHMS(lower);
      setInputHours(hms.hours);
      setInputMinutes(hms.minutes);
      setInputSecs(hms.seconds);
      logHabit(habit.id, dateKey, { valueTimerSeconds: lower });
    } else if (habit.type === 'CHECKLIST') {
      const oneLess = completedItems.slice(0, Math.max(0, completedItems.length - 1));
      setCompletedItems(oneLess);
      logHabit(habit.id, dateKey, { valueChecklistCompletedItemIds: oneLess });
    }
  };

  const formattedTargetHMS = formatSecondsToHMS(targetSeconds).formatted;
  const currentLoggedSeconds = dayLog?.valueTimerSeconds ?? 0;
  const formattedLoggedHMS = formatSecondsToHMS(currentLoggedSeconds).formatted;

  // =========================================================================
  // 1. HORIZONTAL LIST VIEW VARIANT
  // =========================================================================
  if (variant === 'list') {
    return (
      <div
        className={clsx(
          'group relative rounded-2xl border transition-all duration-200 overflow-hidden shadow-2xs',
          isCompleted
            ? 'bg-stone/10 border-stone/30 opacity-65 grayscale-[35%]'
            : isExcused
            ? 'bg-blue-50/40 border-blue-200 opacity-85'
            : isMissed
            ? 'bg-red-50/30 border-red-200 opacity-75'
            : isSkipped
            ? 'bg-red-50/20 border-red-200 opacity-75'
            : 'bg-surface-card border-hairline hover:border-hairline-strong hover:shadow-xs'
        )}
        style={{
          borderLeftWidth: '6px',
          borderLeftColor: vibrantColor,
        }}
      >
        <div className="p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
          {/* LEFT: Category Icon + Habit Title & Meta */}
          <div className="flex items-center gap-3 min-w-0 md:w-1/3">
            <span
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-2xs"
              style={{
                backgroundColor: vibrantColor,
                color: iconColor,
              }}
            >
              <CategoryIcon size={16} strokeWidth={2.5} />
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold text-charcoal uppercase tracking-wider">
                  {category?.name || 'Category'}
                </span>
                <span
                  className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border bg-surface-bone text-charcoal border-hairline"
                  title="Priority score (0-100)"
                >
                  Priority {habit.schedule.priority ?? 50}
                </span>
                {currentStreak > 0 && (
                  <span
                    className={clsx(
                      'inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border',
                      currentStreak >= 30
                        ? 'bg-blue-50 text-blue-600 border-blue-200'
                        : currentStreak >= 7
                        ? 'bg-orange-50 text-orange-600 border-orange-200'
                        : 'bg-primary/10 text-primary border-primary/20'
                    )}
                    title={`${flameTier.title} (${currentStreak} consecutive days)`}
                  >
                    <Flame
                      size={11}
                      className={clsx(flameTier.text, currentStreak >= 7 && 'fill-current')}
                    />{' '}
                    {currentStreak}d
                  </span>
                )}
              </div>

              <h4
                onClick={() => onOpenDetails(habit)}
                className={clsx(
                  'font-display font-bold text-base text-ink tracking-tight truncate cursor-pointer hover:text-primary transition-colors mt-0.5',
                  isCompleted && 'line-through text-charcoal'
                )}
              >
                {habit.name}
              </h4>
            </div>
          </div>

          {/* MIDDLE: INTERACTIVE ACTION AREA (YES/NO, NUMERIC, MANUAL TIMER, CHECKLIST) */}
          <div className="flex-1 flex items-center justify-start md:justify-center">
            {isExcused || isMissed ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-bone border border-hairline text-xs">
                <Lock size={13} className={clsx(isExcused ? 'text-blue-600' : 'text-red-500', 'shrink-0')} />
                <span className="font-semibold text-charcoal">
                  {isExcused ? '🛡️ Protected (Excused)' : '⚠️ Locked (Missed)'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsMissedModalOpen(true)}
                  className="text-primary hover:underline font-bold text-[11px] ml-1"
                >
                  Edit Reason
                </button>
              </div>
            ) : (
              <>
                {/* 1. YES / NO IN LIST VIEW */}
                {habit.type === 'YES_NO' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleYesNo}
                  className={clsx(
                    'flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all shadow-xs active:scale-95',
                    isCompleted
                      ? 'bg-stone/30 text-charcoal cursor-default'
                      : 'bg-primary hover:bg-primary-deep text-white'
                  )}
                >
                  <Check size={14} className={clsx(isCompleted && 'stroke-[3]')} />
                  {isCompleted ? '✓ Completed' : 'Mark Done'}
                </button>
              </div>
            )}

            {/* 2. NUMERIC IN LIST VIEW */}
            {habit.type === 'NUMERIC' && (
              <div className="flex items-center gap-3">
                <div className="font-mono text-sm font-bold text-ink whitespace-nowrap">
                  <span className="text-base text-primary font-extrabold">{currentNum}</span>
                  <span className="text-xs text-charcoal"> / {habit.config.numeric?.goal} {habit.config.numeric?.unit} a day</span>
                </div>

                {!isCompleted && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => adjustNumeric(-1)}
                      className="w-8 h-8 rounded-full bg-surface-bone hover:bg-stone/20 flex items-center justify-center text-ink border border-hairline transition-all"
                    >
                      <Minus size={13} />
                    </button>
                    <button
                      onClick={() => adjustNumeric(1)}
                      className="w-8 h-8 rounded-full bg-surface-bone hover:bg-stone/20 flex items-center justify-center text-ink border border-hairline transition-all"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 3. MANUAL TIMER IN LIST VIEW (NO RUNNING STOPWATCH) */}
            {habit.type === 'TIMER' && (
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs font-mono font-bold text-charcoal bg-surface-bone px-2.5 py-1 rounded-full border border-hairline">
                  Target: {formattedTargetHMS}
                </span>

                {!isCompleted ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 font-mono text-xs">
                      <input
                        type="number"
                        min={0}
                        max={23}
                        value={inputHours}
                        onChange={(e) => setInputHours(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-10 text-center py-1 rounded-lg border border-hairline bg-surface-bone text-ink font-bold"
                        title="Hours"
                      />
                      <span>:</span>
                      <input
                        type="number"
                        min={0}
                        max={59}
                        value={inputMinutes}
                        onChange={(e) =>
                          setInputMinutes(Math.max(0, Math.min(59, parseInt(e.target.value, 10) || 0)))
                        }
                        className="w-10 text-center py-1 rounded-lg border border-hairline bg-surface-bone text-ink font-bold"
                        title="Minutes"
                      />
                      <span>:</span>
                      <input
                        type="number"
                        min={0}
                        max={59}
                        value={inputSecs}
                        onChange={(e) =>
                          setInputSecs(Math.max(0, Math.min(59, parseInt(e.target.value, 10) || 0)))
                        }
                        className="w-10 text-center py-1 rounded-lg border border-hairline bg-surface-bone text-ink font-bold"
                        title="Seconds"
                      />
                    </div>

                    {/* RED CIRCLE COMPLETE BUTTON */}
                    <button
                      type="button"
                      onClick={() => handleSaveTimer(undefined, true)}
                      className="w-8 h-8 rounded-full border-2 border-red-500 bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 shadow-xs transition-all active:scale-90 cursor-pointer shrink-0"
                      title="Tap to mark complete"
                    >
                      <Check size={16} className="stroke-[2.5]" />
                    </button>

                    <button
                      type="button"
                      onClick={handleMatchTargetTimer}
                      className="px-2 py-1 text-[11px] rounded-full bg-surface-bone hover:bg-stone/20 text-charcoal border border-hairline font-semibold"
                      title="Fill target time immediately"
                    >
                      Fill Target
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {/* GREEN CIRCLE WHEN COMPLETED */}
                    <button
                      type="button"
                      onClick={handleUnlock}
                      className="w-8 h-8 rounded-full bg-badge-success border-2 border-badge-success text-white flex items-center justify-center shadow-xs transition-all active:scale-90 cursor-pointer shrink-0"
                      title="Completed! Click to unlock"
                    >
                      <Check size={16} className="stroke-[3]" />
                    </button>
                    <span className="font-mono text-xs font-bold text-charcoal bg-stone/20 px-3 py-1 rounded-full">
                      Logged: {formattedLoggedHMS}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* 4. CHECKLIST IN LIST VIEW */}
            {habit.type === 'CHECKLIST' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-charcoal">
                  {completedItems.length} / {habit.config.checklist?.items.length || 0} tasks done
                </span>
                <button
                  onClick={() => setIsChecklistExpanded(!isChecklistExpanded)}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  {isChecklistExpanded ? 'Hide' : 'Checklist'}
                </button>
              </div>
            )}
              </>
            )}
          </div>

          {/* RIGHT: LOCKED STATUS & STATS BUTTON */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            {isCompleted ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone/20 text-charcoal text-xs font-bold border border-stone/30">
                <Lock size={12} />
                <span>Locked</span>
                <button
                  type="button"
                  onClick={handleUnlock}
                  className="text-[11px] text-primary hover:underline ml-1 font-semibold"
                  title="Unlock to edit"
                >
                  (Unlock)
                </button>
              </div>
            ) : isExcused ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200">
                <ShieldCheck size={13} className="text-blue-600" />
                <span className="truncate max-w-[120px]" title={dayLog?.missedReasonText || 'Excused'}>
                  {dayLog?.missedReasonText || 'Excused'}
                </span>
                <button
                  type="button"
                  onClick={handleUnlock}
                  className="text-[10px] text-blue-700 hover:underline font-semibold"
                  title="Clear to re-log"
                >
                  (Edit)
                </button>
              </div>
            ) : isMissed ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold border border-red-200">
                <AlertTriangle size={13} className="text-red-600" />
                <span>{dayLog?.status === 'FAILED' ? 'Skipped (-25 XP)' : 'Missed (-10 XP)'}</span>
                <button
                  type="button"
                  onClick={handleUnlock}
                  className="text-[10px] text-red-700 hover:underline font-semibold"
                  title="Clear to re-log"
                >
                  (Edit)
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsMissedModalOpen(true)}
                className="text-xs font-semibold text-charcoal hover:text-red-600 bg-surface-bone hover:bg-red-50 border border-hairline px-2.5 py-1 rounded-full flex items-center gap-1 transition-colors"
                title="Log missed habit with reason"
              >
                <ShieldAlert size={13} className="text-charcoal" />
                <span>Missed</span>
              </button>
            )}

            <button
              onClick={() => onOpenDetails(habit)}
              className="p-1.5 text-charcoal hover:text-ink hover:bg-surface-bone rounded-full transition-colors"
              title="View Habit Analytics"
            >
              <BarChart2 size={16} />
            </button>
          </div>
        </div>

        {/* EXPANDED CHECKLIST IF TOGGLED */}
        {habit.type === 'CHECKLIST' && isChecklistExpanded && (
          <div className="px-4 pb-4 pt-1 border-t border-hairline/60 bg-surface-bone/30 space-y-1.5">
            {habit.config.checklist?.items.map((item) => {
              const isDone = completedItems.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleChecklistItem(item.id)}
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

        <LogMissedModal
          isOpen={isMissedModalOpen}
          onClose={() => setIsMissedModalOpen(false)}
          habit={habit}
          dateKey={dateKey}
        />
      </div>
    );
  }

  // =========================================================================
  // 2. GRID CARD VIEW VARIANT
  // =========================================================================
  return (
    <div
      className={clsx(
        'group relative rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md',
        isCompleted
          ? 'bg-stone/10 border-stone/30 opacity-65 grayscale-[35%]'
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
      <div className="p-4 sm:p-5">
        {/* TOP ROW: CATEGORY + STREAK + STATUS BADGE + DETAILS BUTTON */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-2xs"
              style={{
                backgroundColor: vibrantColor,
                color: iconColor,
              }}
            >
              <CategoryIcon size={14} strokeWidth={2.5} />
            </span>
            <span className="text-xs font-semibold text-charcoal uppercase tracking-wider">
              {category?.name || 'Category'}
            </span>
            <span
              className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border bg-surface-bone text-charcoal border-hairline"
              title="Priority Rank (0 - 100)"
            >
              Priority {habit.schedule.priority ?? 50}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isCompleted ? (
              <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone/20 text-charcoal text-[11px] font-bold border border-stone/30">
                <Lock size={11} />
                <span>Locked</span>
                <button
                  type="button"
                  onClick={handleUnlock}
                  className="text-[10px] text-primary hover:underline ml-1 font-semibold"
                  title="Unlock to edit"
                >
                  (Unlock)
                </button>
              </div>
            ) : isExcused ? (
              <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold border border-blue-200">
                <ShieldCheck size={12} className="text-blue-600" />
                <span>Shielded</span>
                <button
                  type="button"
                  onClick={handleUnlock}
                  className="text-[10px] text-blue-700 hover:underline font-semibold"
                  title="Clear to edit"
                >
                  (Edit)
                </button>
              </div>
            ) : isMissed ? (
              <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-[11px] font-bold border border-red-200">
                <AlertTriangle size={12} className="text-red-600" />
                <span>{dayLog?.status === 'FAILED' ? 'Skipped' : 'Missed'}</span>
                <button
                  type="button"
                  onClick={handleUnlock}
                  className="text-[10px] text-red-700 hover:underline font-semibold"
                  title="Clear to edit"
                >
                  (Edit)
                </button>
              </div>
            ) : (
              currentStreak > 0 && (
                <span
                  className={clsx(
                    'inline-flex items-center gap-1 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border',
                    currentStreak >= 30
                      ? 'bg-blue-50 text-blue-600 border-blue-200'
                      : currentStreak >= 7
                      ? 'bg-orange-50 text-orange-600 border-orange-200'
                      : 'bg-primary/10 text-primary border-primary/20'
                  )}
                  title={`${flameTier.title} (${currentStreak} consecutive days)`}
                >
                  <Flame
                    size={13}
                    className={clsx(flameTier.text, currentStreak >= 7 && 'fill-current')}
                  />
                  {currentStreak}d streak
                </span>
              )
            )}

            <button
              onClick={() => onOpenDetails(habit)}
              className="p-1 text-charcoal hover:text-ink hover:bg-surface-bone rounded-full transition-colors"
              title="View Habit Analytics"
            >
              <BarChart2 size={16} />
            </button>
          </div>
        </div>

        {/* HABIT TITLE & DESCRIPTION */}
        <div className="mb-4">
          <h3
            onClick={() => onOpenDetails(habit)}
            className={clsx(
              'font-display font-bold text-lg sm:text-xl text-ink tracking-tight cursor-pointer hover:text-primary transition-colors',
              isCompleted && 'line-through text-charcoal'
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
            <button
              onClick={() => setIsMissedModalOpen(true)}
              className="text-xs font-bold text-blue-700 hover:underline px-2 py-1"
            >
              Edit
            </button>
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
            <button
              onClick={() => setIsMissedModalOpen(true)}
              className="text-xs font-bold text-red-700 hover:underline px-2 py-1"
            >
              Edit
            </button>
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
              <button
                type="button"
                onClick={() => setIsMissedModalOpen(true)}
                className="text-xs font-bold text-primary hover:underline px-2.5 py-1.5 rounded-full bg-surface-card border border-hairline shrink-0"
              >
                Edit Reason
              </button>
            </div>
          ) : (
            <>
              {/* 1. YES / NO HABIT */}
              {habit.type === 'YES_NO' && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-charcoal">
                {isCompleted
                  ? '✓ Completed & Locked for today'
                  : isSkipped
                  ? 'Skipped for today'
                  : 'Tap circle to mark complete:'}
              </span>
              <div className="flex items-center gap-2">
                {!isCompleted && !isSkipped && !isExcused && !isMissed && (
                  <button
                    type="button"
                    onClick={() => setIsMissedModalOpen(true)}
                    className="text-xs font-semibold text-charcoal hover:text-red-600 bg-surface-bone hover:bg-red-50 border border-hairline px-2.5 py-1.5 rounded-full flex items-center gap-1 transition-colors"
                    title="Log missed habit with reason"
                  >
                    <ShieldAlert size={13} className="text-charcoal" />
                    <span>Missed</span>
                  </button>
                )}
                {/* RED CIRCLE -> GREEN TICK TOGGLE */}
                <button
                  onClick={handleToggleYesNo}
                  className={clsx(
                    'w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-xs active:scale-90 cursor-pointer shrink-0',
                    isCompleted
                      ? 'bg-badge-success border-2 border-badge-success text-white shadow-md'
                      : 'border-2 border-red-500 bg-red-50 hover:bg-red-100 text-red-500'
                  )}
                  title={isCompleted ? 'Completed! Click to unmark' : 'Tap to mark done'}
                >
                  <Check size={20} className={clsx(isCompleted ? 'stroke-[3]' : 'stroke-[2.5]')} />
                </button>
              </div>
            </div>
          )}

          {/* 2. NUMERIC HABIT */}
          {habit.type === 'NUMERIC' && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xl font-bold text-ink">
                  {currentNum}
                </span>
                <span className="text-xs text-charcoal">
                  / {habit.config.numeric?.goal} {habit.config.numeric?.unit} a day
                </span>
                {isCompleted && (
                  <span className="text-xs font-bold text-badge-success ml-1">
                    ✓ Goal Met
                  </span>
                )}
              </div>

              {!isCompleted && !isExcused && !isMissed ? (
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setIsMissedModalOpen(true)}
                    className="text-xs font-semibold text-charcoal hover:text-red-600 bg-surface-bone hover:bg-red-50 border border-hairline px-2.5 py-1.5 rounded-full flex items-center gap-1 transition-colors"
                    title="Log missed habit with reason"
                  >
                    <ShieldAlert size={13} className="text-charcoal" />
                    <span>Missed</span>
                  </button>
                  <button
                    onClick={() => adjustNumeric(-1)}
                    className="w-9 h-9 rounded-full bg-surface-bone hover:bg-stone/20 flex items-center justify-center text-ink border border-hairline transition-all active:scale-90"
                  >
                    <Minus size={15} />
                  </button>
                  <button
                    onClick={() => adjustNumeric(1)}
                    className="w-9 h-9 rounded-full bg-surface-bone hover:bg-stone/20 flex items-center justify-center text-ink border border-hairline transition-all active:scale-90"
                  >
                    <Plus size={15} />
                  </button>
                  <button
                    onClick={() => adjustNumeric(5)}
                    className="px-2.5 h-9 rounded-full bg-surface-bone hover:bg-stone/20 flex items-center justify-center text-xs font-mono font-bold text-ink border border-hairline transition-all active:scale-90"
                  >
                    +5
                  </button>
                </div>
              ) : (
                <span className="text-xs font-bold text-charcoal">
                  {isCompleted ? 'Locked' : isExcused ? 'Excused' : 'Missed'}
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
                <div className="p-3 bg-surface-bone/80 rounded-2xl border border-hairline space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-charcoal uppercase">
                      Enter Time Spent (00:00:00):
                    </span>
                    <button
                      type="button"
                      onClick={handleMatchTargetTimer}
                      className="text-[11px] font-bold text-primary hover:underline"
                    >
                      Fill Target Time
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Hours */}
                    <div className="flex-1 text-center bg-surface-card rounded-xl p-1.5 border border-hairline">
                      <span className="text-[9px] text-charcoal uppercase font-bold block">Hours</span>
                      <input
                        type="number"
                        min={0}
                        max={23}
                        value={inputHours}
                        onChange={(e) =>
                          setInputHours(Math.max(0, parseInt(e.target.value, 10) || 0))
                        }
                        className="w-full text-center font-mono font-bold text-base bg-transparent text-ink focus:outline-none"
                      />
                    </div>

                    <span className="font-mono font-bold text-stone">:</span>

                    {/* Minutes */}
                    <div className="flex-1 text-center bg-surface-card rounded-xl p-1.5 border border-hairline">
                      <span className="text-[9px] text-charcoal uppercase font-bold block">Mins</span>
                      <input
                        type="number"
                        min={0}
                        max={59}
                        value={inputMinutes}
                        onChange={(e) =>
                          setInputMinutes(
                            Math.max(0, Math.min(59, parseInt(e.target.value, 10) || 0))
                          )
                        }
                        className="w-full text-center font-mono font-bold text-base bg-transparent text-ink focus:outline-none"
                      />
                    </div>

                    <span className="font-mono font-bold text-stone">:</span>

                    {/* Seconds */}
                    <div className="flex-1 text-center bg-surface-card rounded-xl p-1.5 border border-hairline">
                      <span className="text-[9px] text-charcoal uppercase font-bold block">Secs</span>
                      <input
                        type="number"
                        min={0}
                        max={59}
                        value={inputSecs}
                        onChange={(e) =>
                          setInputSecs(
                            Math.max(0, Math.min(59, parseInt(e.target.value, 10) || 0))
                          )
                        }
                        className="w-full text-center font-mono font-bold text-base bg-transparent text-ink focus:outline-none"
                      />
                    </div>

                    {!isCompleted && !isExcused && !isMissed && (
                      <button
                        type="button"
                        onClick={() => setIsMissedModalOpen(true)}
                        className="h-12 px-3 rounded-2xl bg-surface-bone hover:bg-red-50 border border-hairline text-charcoal hover:text-red-600 flex items-center gap-1.5 text-xs font-semibold transition-all shrink-0"
                        title="Log missed habit with reason"
                      >
                        <ShieldAlert size={15} />
                        <span>Missed</span>
                      </button>
                    )}

                    {/* RED CIRCLE COMPLETE BUTTON */}
                    <button
                      type="button"
                      onClick={() => handleSaveTimer(undefined, true)}
                      className="w-12 h-12 rounded-full border-2 border-red-500 bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 shadow-xs hover:shadow-sm transition-all duration-200 active:scale-90 cursor-pointer shrink-0"
                      title="Tap to mark complete"
                    >
                      <Check size={22} className="stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-stone/15 rounded-2xl border border-stone/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* GREEN CIRCLE WITH WHITE CHECKMARK */}
                    <button
                      type="button"
                      onClick={handleUnlock}
                      className="w-12 h-12 rounded-full bg-badge-success border-2 border-badge-success text-white flex items-center justify-center shadow-md hover:opacity-90 transition-all active:scale-90 cursor-pointer shrink-0"
                      title="Completed! Click to unlock / unmark"
                    >
                      <Check size={22} className="stroke-[3]" />
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
                  <button
                    type="button"
                    onClick={handleUnlock}
                    className="text-xs text-primary font-bold hover:underline px-2 py-1"
                  >
                    Unlock & Edit
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 4. CHECKLIST HABIT */}
          {habit.type === 'CHECKLIST' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-charcoal">
                  Progress: {completedItems.length} /{' '}
                  {habit.config.checklist?.items.length || 0} tasks
                </span>
                <button
                  onClick={() => setIsChecklistExpanded(!isChecklistExpanded)}
                  className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline"
                >
                  {isChecklistExpanded ? 'Hide tasks' : 'View tasks'}
                  {isChecklistExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
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

      <LogMissedModal
        isOpen={isMissedModalOpen}
        onClose={() => setIsMissedModalOpen(false)}
        habit={habit}
        dateKey={dateKey}
      />
    </div>
  );
};
