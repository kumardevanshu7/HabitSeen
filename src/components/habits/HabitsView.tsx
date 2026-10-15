import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { HabitCard } from './HabitCard';
import { DayStrip } from './DayStrip';
import { Habit, Category, FrequencyType } from '../../types/habit';
import { isHabitDueOnDate, getTodayKey } from '../../utils/dateMath';
import { CATEGORY_ICONS } from '../../constants/iconsAndColors';
import { boostVibrancy, getContrastIconColor } from '../../utils/colorUtils';
import { CreateCategoryModal } from '../categories/CreateCategoryModal';
import { CreateChallengeModal } from '../challenges/CreateChallengeModal';
import { Modal } from '../ui/Modal';
import { SecurityModal } from '../security/SecurityModal';
import { Button } from '../ui/Button';
import { parseISO, format } from 'date-fns';
import { useDragScroll } from '../../hooks/useDragScroll';
import {
  Plus,
  CheckCheck,
  LayoutGrid,
  List,
  Sparkles,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Archive,
  Flame,
  Zap,
  Edit2,
  Trash2,
  Calendar,
} from 'lucide-react';
import clsx from 'clsx';

interface HabitsViewProps {
  onOpenCreateHabit: () => void;
  onOpenCreateHabitWithFrequency?: (freq: FrequencyType) => void;
  onOpenHabitDetails: (habit: Habit) => void;
  selectedCategory?: string;
  onSelectCategory?: (catId: string) => void;
  onOpenChallengesTab?: () => void;
}

export const HabitsView: React.FC<HabitsViewProps> = ({
  onOpenCreateHabit,
  onOpenCreateHabitWithFrequency,
  onOpenHabitDetails,
  selectedCategory,
  onSelectCategory,
  onOpenChallengesTab,
}) => {
  const {
    habits,
    categories,
    logs,
    challenges,
    selectedDate,
    setSelectedDate,
    reorderCategories,
    deleteCategory,
  } = useAppStore();

  const [internalCatFilter, setInternalCatFilter] = useState<string>('all');
  const selectedCatFilter = selectedCategory ?? internalCatFilter;
  const setSelectedCatFilter = (catId: string) => {
    setInternalCatFilter(catId);
    onSelectCategory?.(catId);
  };

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [draggedCatId, setDraggedCatId] = useState<string | null>(null);

  // Category hold menu & security verification state
  const [categoryForOptions, setCategoryForOptions] = useState<Category | null>(null);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [categoryForSecurity, setCategoryForSecurity] = useState<{
    action: 'EDIT' | 'DELETE';
    category: Category;
  } | null>(null);

  const catHoldTimerRef = useRef<NodeJS.Timeout | null>(null);
  const catTouchStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isHoldingRef = useRef(false);

  const { ref: categoriesScrollRef, isDragging: isCatDragging, events: catScrollEvents } =
    useDragScroll<HTMLDivElement>();

  const selectedDateTime = parseISO(selectedDate);

  // Check if a habit is permanently ended/archived (NOT just completed for today)
  const isHabitArchived = (h: Habit): boolean => {
    if (h.isArchived) return true;
    if (h.schedule?.endDate && selectedDate > h.schedule.endDate) return true;
    return false;
  };

  // All mandatory habits due on selected date (for 100% Perfect Day calculation)
  const allScheduledDueToday = habits.filter(
    (h) => !isHabitArchived(h) && isHabitDueOnDate(h, selectedDateTime, logs) && h.frequency?.type !== 'JUST_TRACKING'
  );
  const totalDueCount = allScheduledDueToday.length;
  const completedDueCount = allScheduledDueToday.filter((h) => {
    const l = logs[`${h.id}_${selectedDate}`];
    return l?.status === 'COMPLETED' || l?.status === 'EXCUSED';
  }).length;
  const isAllCompletedToday = totalDueCount > 0 && completedDueCount === totalDueCount;

  // Floating celebratory toast when user achieves 100% completion
  const [showPerfectDayToast, setShowPerfectDayToast] = useState(false);
  const prevAllCompletedRef = useRef(isAllCompletedToday);

  useEffect(() => {
    if (!prevAllCompletedRef.current && isAllCompletedToday) {
      setShowPerfectDayToast(true);
      const timer = setTimeout(() => setShowPerfectDayToast(false), 5000);
      return () => clearTimeout(timer);
    }
    prevAllCompletedRef.current = isAllCompletedToday;
  }, [isAllCompletedToday]);

  // Check if a habit is completed/excused on the currently selected date
  const isHabitCompletedOnSelectedDate = (h: Habit): boolean => {
    const l = logs[`${h.id}_${selectedDate}`];
    return l?.status === 'COMPLETED' || l?.status === 'EXCUSED';
  };

  // Sort habits: pending/uncompleted tasks always stay on TOP, completed tasks move to the BOTTOM!
  const sortHabitsWithPendingOnTop = (habitList: Habit[]): Habit[] => {
    return [...habitList].sort((a, b) => {
      const aDone = isHabitCompletedOnSelectedDate(a) ? 1 : 0;
      const bDone = isHabitCompletedOnSelectedDate(b) ? 1 : 0;
      // Pending tasks (0) appear before completed tasks (1)
      if (aDone !== bDone) {
        return aDone - bDone;
      }
      // Within the same completion status, sort by priority (100 = highest)
      const pA = typeof a.schedule.priority === 'number' ? a.schedule.priority : 50;
      const pB = typeof b.schedule.priority === 'number' ? b.schedule.priority : 50;
      return pB - pA;
    });
  };

  // Habits that belong in the "Archived" category (finished duration or manually archived)
  const archivedHabits = habits
    .filter((h) => isHabitArchived(h))
    .sort((a, b) => {
      const pA = typeof a.schedule.priority === 'number' ? a.schedule.priority : 50;
      const pB = typeof b.schedule.priority === 'number' ? b.schedule.priority : 50;
      return pB - pA;
    });

  // Active (not archived / ended) habits
  const activeHabits = habits.filter((h) => !isHabitArchived(h));

  // Active Just Tracking habits
  const justTrackingHabits = habits.filter(
    (h) => !isHabitArchived(h) && h.frequency?.type === 'JUST_TRACKING'
  );

  // If currently selected category was deleted, safely fallback to 'all'
  const isSelectedCategoryValid =
    selectedCatFilter === 'all' ||
    selectedCatFilter === 'cat-archived' ||
    selectedCatFilter === 'cat-just-tracking' ||
    categories.some((c) => c.id === selectedCatFilter);
  const effectiveCatFilter = isSelectedCategoryValid ? selectedCatFilter : 'all';

  // Filter habits to display based on whether "Archived", "Just Tracking", or an active category is selected
  const dueHabits =
    effectiveCatFilter === 'cat-archived'
      ? archivedHabits
      : effectiveCatFilter === 'cat-just-tracking'
      ? sortHabitsWithPendingOnTop(justTrackingHabits)
      : sortHabitsWithPendingOnTop(
          activeHabits.filter((h) => {
            if (effectiveCatFilter !== 'all' && h.categoryId !== effectiveCatFilter) {
              return false;
            }
            return isHabitDueOnDate(h, selectedDateTime, logs);
          })
        );

  // Unique categories list in order
  const uniqueCategories = Array.from(
    new Map(categories.map((c) => [c.name.trim().toLowerCase(), c])).values()
  );

  const handleMoveCategory = async (catId: string, direction: 'left' | 'right') => {
    const index = uniqueCategories.findIndex((c) => c.id === catId);
    if (index === -1) return;

    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= uniqueCategories.length) return;

    const updated = [...uniqueCategories];
    const [removed] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, removed);

    await reorderCategories(updated);
  };

  const handleDragStart = (catId: string) => {
    setDraggedCatId(catId);
  };

  const handleDragOver = (e: React.DragEvent, targetCatId: string) => {
    e.preventDefault();
    if (!draggedCatId || draggedCatId === targetCatId) return;

    const fromIndex = uniqueCategories.findIndex((c) => c.id === draggedCatId);
    const toIndex = uniqueCategories.findIndex((c) => c.id === targetCatId);
    if (fromIndex === -1 || toIndex === -1) return;

    const updated = [...uniqueCategories];
    const [removed] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, removed);

    reorderCategories(updated);
  };

  const handleDragEnd = () => {
    setDraggedCatId(null);
  };

  const handleCatTouchStart = (cat: Category, e: React.TouchEvent) => {
    isHoldingRef.current = false;
    const touch = e.touches[0];
    catTouchStartPos.current = { x: touch.clientX, y: touch.clientY };
    if (catHoldTimerRef.current) clearTimeout(catHoldTimerRef.current);
    catHoldTimerRef.current = setTimeout(() => {
      isHoldingRef.current = true;
      navigator.vibrate?.(40);
      setCategoryForOptions(cat);
    }, 450);
  };

  const handleCatTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - catTouchStartPos.current.x);
    const dy = Math.abs(touch.clientY - catTouchStartPos.current.y);
    if (dx > 10 || dy > 10) {
      if (catHoldTimerRef.current) clearTimeout(catHoldTimerRef.current);
    }
  };

  const handleCatTouchEnd = () => {
    if (catHoldTimerRef.current) clearTimeout(catHoldTimerRef.current);
  };

  const handleCatMouseDown = (cat: Category, e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isHoldingRef.current = false;
    if (catHoldTimerRef.current) clearTimeout(catHoldTimerRef.current);
    catHoldTimerRef.current = setTimeout(() => {
      isHoldingRef.current = true;
      setCategoryForOptions(cat);
    }, 450);
  };

  const handleCatMouseUp = () => {
    if (catHoldTimerRef.current) clearTimeout(catHoldTimerRef.current);
  };

  return (
    <div className="space-y-4">
      {/* 1. DATE PICKER STRIP */}
      <DayStrip />

      {/* REORDER / ALIGN CATEGORIES BANNER */}
      {isReorderMode && (
        <div className="p-2.5 bg-gradient-to-r from-primary/15 via-rose-500/10 to-primary/15 border border-primary/30 rounded-2xl flex items-center justify-between gap-2 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
              <ArrowLeftRight size={13} />
            </span>
            <span className="text-xs font-bold text-ink">
              Reorder Mode: Tap arrows &lt; &gt; or drag to align positions
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsReorderMode(false)}
            className="text-xs font-bold bg-primary hover:bg-primary-deep text-white px-3 py-1 rounded-full shadow-xs transition-colors shrink-0"
          >
            Done
          </button>
        </div>
      )}

      {/* 2. CATEGORY PILLS FILTER BAR (HOLD TO EDIT / RENAME / DELETE) */}
      <div
        ref={categoriesScrollRef}
        {...catScrollEvents}
        className={clsx(
          'flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 select-none cursor-grab active:cursor-grabbing',
          isCatDragging && 'cursor-grabbing'
        )}
      >
        <button
          onClick={() => setSelectedCatFilter('all')}
          className={clsx(
            'px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border shrink-0',
            effectiveCatFilter === 'all'
              ? 'bg-ink text-white border-ink shadow-xs'
              : 'bg-surface-card text-charcoal border-hairline hover:bg-surface-bone'
          )}
        >
          All Habits ({activeHabits.length})
        </button>

        {uniqueCategories.map((cat, catIdx) => {
          const isSelected = selectedCatFilter === cat.id;
          const Icon =
            CATEGORY_ICONS.find((i) => i.id === cat.icon)?.icon ||
            CATEGORY_ICONS[0].icon;
          const vibrantColor = boostVibrancy(cat.color);
          const iconColor = getContrastIconColor(vibrantColor);
          const isBeingDragged = draggedCatId === cat.id;

          return (
            <div
              key={cat.id}
              onTouchStart={(e) => handleCatTouchStart(cat, e)}
              onTouchEnd={handleCatTouchEnd}
              onTouchMove={handleCatTouchMove}
              onMouseDown={(e) => handleCatMouseDown(cat, e)}
              onMouseUp={handleCatMouseUp}
              onMouseLeave={handleCatMouseUp}
              onContextMenu={(e) => {
                e.preventDefault();
                setCategoryForOptions(cat);
              }}
              draggable={isReorderMode}
              onDragStart={() => handleDragStart(cat.id)}
              onDragOver={(e) => handleDragOver(e, cat.id)}
              onDragEnd={handleDragEnd}
              className={clsx(
                'flex items-center transition-all shrink-0',
                isBeingDragged && 'opacity-50 scale-95'
              )}
            >
              <button
                type="button"
                onClick={() => {
                  if (isHoldingRef.current) {
                    isHoldingRef.current = false;
                    return;
                  }
                  setSelectedCatFilter(cat.id);
                }}
                title="Tap to filter · Hold for edit / rename / delete"
                className={clsx(
                  'flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border-2 shrink-0',
                  isSelected
                    ? 'shadow-xs text-ink'
                    : 'text-charcoal hover:text-ink',
                  isReorderMode && 'ring-2 ring-primary/40'
                )}
                style={{
                  backgroundColor: isSelected ? `${vibrantColor}30` : `${vibrantColor}15`,
                  borderColor: vibrantColor,
                  boxShadow: isSelected ? `0 0 0 2px ${vibrantColor}` : undefined,
                }}
              >
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-2xs"
                  style={{ backgroundColor: vibrantColor, color: iconColor }}
                >
                  <Icon size={12} strokeWidth={2.5} />
                </span>
                <span>{cat.name}</span>

                {/* MOVE LEFT / RIGHT POSITION ARROWS IN REORDER MODE */}
                {isReorderMode && (
                  <span
                    className="flex items-center gap-0.5 ml-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      disabled={catIdx === 0}
                      onClick={() => handleMoveCategory(cat.id, 'left')}
                      className="w-4 h-4 rounded-full bg-white hover:bg-stone/20 text-ink flex items-center justify-center disabled:opacity-25 border border-hairline shadow-2xs transition-all active:scale-90"
                      title="Move Left"
                    >
                      <ChevronLeft size={10} />
                    </button>
                    <button
                      type="button"
                      disabled={catIdx === uniqueCategories.length - 1}
                      onClick={() => handleMoveCategory(cat.id, 'right')}
                      className="w-4 h-4 rounded-full bg-white hover:bg-stone/20 text-ink flex items-center justify-center disabled:opacity-25 border border-hairline shadow-2xs transition-all active:scale-90"
                      title="Move Right"
                    >
                      <ChevronRight size={10} />
                    </button>
                  </span>
                )}
              </button>
            </div>
          );
        })}

        {/* JUST TRACKING CATEGORY PILL (FLEXIBLE LOG ANYTIME) */}
        <button
          type="button"
          onClick={() => setSelectedCatFilter('cat-just-tracking')}
          className={clsx(
            'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border-2 shrink-0',
            effectiveCatFilter === 'cat-just-tracking'
              ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
              : 'bg-purple-500/10 text-purple-800 border-purple-500/40 hover:bg-purple-500/20'
          )}
          title="View flexible Just Tracking habits (log anytime without streak breaks or penalties)"
        >
          <Sparkles
            size={13}
            className={
              effectiveCatFilter === 'cat-just-tracking'
                ? 'text-amber-300'
                : 'text-purple-600'
            }
          />
          <span>Just Tracking ({justTrackingHabits.length})</span>
        </button>

        {/* ARCHIVED CATEGORY PILL (COMPLETED & ARCHIVED HABITS) */}
        <button
          type="button"
          onClick={() => setSelectedCatFilter('cat-archived')}
          className={clsx(
            'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border-2 shrink-0',
            effectiveCatFilter === 'cat-archived'
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
              : 'bg-emerald-500/10 text-emerald-800 border-emerald-500/40 hover:bg-emerald-500/20'
          )}
          title="View completed & archived habits"
        >
          <Archive size={13} />
          <span>Archived ({archivedHabits.length})</span>
        </button>

        {/* QUICK ADD CHALLENGE BUTTON */}
        <button
          type="button"
          onClick={() => setIsChallengeModalOpen(true)}
          className="text-xs font-black text-rose-600 hover:text-rose-700 bg-rose-500/10 hover:bg-rose-500/20 border-2 border-rose-500/40 px-3.5 py-1.5 rounded-full whitespace-nowrap flex items-center gap-1.5 transition-colors shrink-0"
          title="Create a Hardcore Challenge (-90% Health on Failure)"
        >
          <Flame size={13} className="fill-rose-600" />
          <span>
            Add Challenge
            {challenges.filter((c) => c.status === 'ACTIVE').length > 0
              ? ` (${challenges.filter((c) => c.status === 'ACTIVE').length})`
              : ''}
          </span>
        </button>

        <button
          onClick={() => {
            setCategoryToEdit(null);
            setIsCategoryModalOpen(true);
          }}
          className="text-xs font-semibold text-primary hover:text-primary-deep bg-surface-card border border-dashed border-primary/40 px-3 py-1.5 rounded-full whitespace-nowrap flex items-center gap-1 transition-colors shrink-0"
        >
          <Plus size={13} /> New Category
        </button>

        <button
          type="button"
          onClick={() => setIsReorderMode(!isReorderMode)}
          className={clsx(
            'text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap flex items-center gap-1 transition-colors shrink-0 border',
            isReorderMode
              ? 'bg-ink text-white border-ink shadow-2xs'
              : 'text-charcoal hover:text-ink bg-surface-card border-hairline hover:bg-surface-bone'
          )}
          title="Hold any category pill or click here to align & reorder positions"
        >
          <ArrowLeftRight size={12} />
          <span>{isReorderMode ? 'Done' : 'Align'}</span>
        </button>
      </div>

      {/* 100% PERFECT DAY CELEBRATION FLOATING TOAST */}
      {showPerfectDayToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-ink/95 text-white text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2.5 rounded-full shadow-2xl border border-amber-400/50 flex items-center gap-2.5 animate-in slide-in-from-top-4 duration-300">
          <Sparkles size={16} className="text-amber-400 shrink-0" />
          <span>🎉 <strong>100% Perfect Day!</strong> +100 Bonus Willpower XP Awarded! ⚡</span>
        </div>
      )}

      {/* 100% PERFECT DAY CELEBRATION BANNER */}
      {isAllCompletedToday && (
        <div className="p-3.5 sm:p-4 bg-gradient-to-r from-emerald-500/15 via-amber-500/15 to-emerald-500/15 border-2 border-emerald-500/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm animate-in fade-in duration-300">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles size={19} />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-black text-ink block">
                  🎉 100% Perfect Day Completed!
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-black bg-amber-400/25 text-amber-800 border border-amber-400/50 shadow-2xs">
                  <Zap size={11} className="fill-amber-500 text-amber-500 shrink-0" />
                  +100 Bonus XP
                </span>
              </div>
              <span className="text-[11px] sm:text-xs text-charcoal block mt-0.5">
                All {totalDueCount} tasks conquered for today! +100 Willpower XP added to your score.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. TOOLBAR: HABITS COUNT & VIEW MODE SWITCHER (GRID VS HORIZONTAL LIST) */}
      <div className="flex items-center justify-between gap-2 pt-1 pb-0.5">
        <span className="text-xs font-bold text-charcoal uppercase tracking-wider ml-1 flex items-center gap-1.5">
          {effectiveCatFilter === 'cat-archived' ? (
            <>
              <Archive size={13} className="text-emerald-600" />
              <span>Archived Habits ({dueHabits.length})</span>
            </>
          ) : effectiveCatFilter === 'cat-just-tracking' ? (
            <>
              <Sparkles size={13} className="text-purple-600" />
              <span>Just Tracking Habits ({dueHabits.length})</span>
            </>
          ) : effectiveCatFilter === 'all' ? (
            <span>All Habits ({dueHabits.length})</span>
          ) : (
            <span>
              {categories.find((c) => c.id === effectiveCatFilter)?.name || 'Category'} Habits ({dueHabits.length})
            </span>
          )}
        </span>

        {/* View Mode Switcher: Grid vs Horizontal List */}
        <div className="flex items-center bg-surface-card p-1 rounded-full border border-hairline shadow-2xs">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all',
              viewMode === 'grid'
                ? 'bg-ink text-white shadow-2xs'
                : 'text-charcoal hover:text-ink'
            )}
            title="Grid Card View"
          >
            <LayoutGrid size={13} />
            <span>Grid View</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all',
              viewMode === 'list'
                ? 'bg-ink text-white shadow-2xs'
                : 'text-charcoal hover:text-ink'
            )}
            title="Horizontal List View"
          >
            <List size={13} />
            <span>Horizontal List</span>
          </button>
        </div>
      </div>

      {/* 4. HABITS LIST (GRID OR HORIZONTAL ROWS) */}
      {dueHabits.length === 0 ? (
        <div className="text-center py-14 px-4 bg-surface-card border border-hairline rounded-3xl">
          <div className="w-14 h-14 rounded-full bg-surface-bone flex items-center justify-center text-charcoal mx-auto mb-3">
            {effectiveCatFilter === 'cat-archived' ? (
              <Archive size={28} className="text-emerald-600" />
            ) : effectiveCatFilter === 'cat-just-tracking' ? (
              <Sparkles size={28} className="text-purple-600" />
            ) : (
              <CheckCheck size={28} />
            )}
          </div>
          <h3 className="font-display font-bold text-lg text-ink">
            {effectiveCatFilter === 'cat-archived'
              ? 'No Archived Habits Yet'
              : effectiveCatFilter === 'cat-just-tracking'
              ? 'No Just Tracking Habits Yet'
              : habits.length === 0
                ? 'No Habits Created Yet'
                : `No habits for ${format(selectedDateTime, 'EEEE, dd MMMM yyyy')}`}
          </h3>
          <p className="text-charcoal text-xs sm:text-sm mt-1 max-w-md mx-auto">
            {effectiveCatFilter === 'cat-archived'
              ? 'Habits that reach their end date or are manually archived will appear here.'
              : effectiveCatFilter === 'cat-just-tracking'
              ? 'Just Tracking habits are flexible habits you can log anytime with no streak breaks, missed penalties, or lost hearts.'
              : habits.length === 0
                ? 'Start small. Click the button below to configure your first daily habit target.'
                : `You have ${activeHabits.length} active habit(s).`}
          </p>

          <div className="flex items-center justify-center gap-2.5 mt-5 flex-wrap">
            {effectiveCatFilter !== 'all' && (
              <Button
                variant="outline"
                size="md"
                onClick={() => setSelectedCatFilter('all')}
              >
                Back to All Habits ({activeHabits.length})
              </Button>
            )}

            {effectiveCatFilter === 'cat-just-tracking' ? (
              <Button
                onClick={() => {
                  if (onOpenCreateHabitWithFrequency) {
                    onOpenCreateHabitWithFrequency('JUST_TRACKING');
                  } else {
                    onOpenCreateHabit();
                  }
                }}
                variant="primary"
                size="md"
                className="gap-1.5"
              >
                <Plus size={16} /> Create Just Tracking Habit
              </Button>
            ) : (
              <>
                {effectiveCatFilter !== 'cat-archived' && archivedHabits.length > 0 && (
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => setSelectedCatFilter('cat-archived')}
                    className="gap-1.5 border-emerald-500/40 text-emerald-700 hover:bg-emerald-50"
                  >
                    <Archive size={15} /> View Archived ({archivedHabits.length})
                  </Button>
                )}

                {selectedDate !== getTodayKey() && (
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => setSelectedDate(getTodayKey())}
                  >
                    Jump to Today
                  </Button>
                )}

                <Button
                  onClick={onOpenCreateHabit}
                  variant="primary"
                  size="md"
                  className="gap-1.5"
                >
                  <Plus size={16} /> Create Habit Now
                </Button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div
          className={clsx(
            viewMode === 'grid'
              ? 'columns-1 md:columns-2 gap-3.5'
              : 'flex flex-col gap-3 sm:gap-3.5'
          )}
        >
          {dueHabits.map((habit) => (
            <div
              key={habit.id}
              className={clsx(viewMode === 'grid' && 'break-inside-avoid mb-3.5')}
            >
              <HabitCard
                habit={habit}
                dateKey={selectedDate}
                variant={viewMode}
                onOpenDetails={onOpenHabitDetails}
              />
            </div>
          ))}
        </div>
      )}

      {/* CATEGORY HOLD OPTIONS MODAL (EDIT / RENAME / REORDER / DELETE) */}
      <Modal
        isOpen={Boolean(categoryForOptions)}
        onClose={() => setCategoryForOptions(null)}
        title="Category Options"
        subtitle={categoryForOptions ? `Manage "${categoryForOptions.name}"` : undefined}
        maxWidth="md"
      >
        {categoryForOptions && (() => {
          const cat = categoryForOptions;
          const Icon =
            CATEGORY_ICONS.find((i) => i.id === cat.icon)?.icon ||
            CATEGORY_ICONS[0].icon;
          const vibrantColor = boostVibrancy(cat.color);
          const iconColor = getContrastIconColor(vibrantColor);
          const isProtected = cat.isDefault || cat.id === 'cat-others';

          return (
            <div className="space-y-4">
              {/* Category Preview Header */}
              <div
                className="p-3.5 rounded-2xl flex items-center gap-3 border-2"
                style={{
                  backgroundColor: `${vibrantColor}15`,
                  borderColor: vibrantColor,
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
                  style={{ backgroundColor: vibrantColor, color: iconColor }}
                >
                  <Icon size={20} strokeWidth={2.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm text-ink truncate">
                    {cat.name}
                  </div>
                  <div className="text-[11px] text-charcoal">
                    {habits.filter((h) => h.categoryId === cat.id).length} Habits assigned
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const target = categoryForOptions;
                    setCategoryForOptions(null);
                    setCategoryForSecurity({ action: 'EDIT', category: target });
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-hairline hover:border-primary/50 hover:bg-primary/5 text-ink text-left transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Edit2 size={16} />
                    </span>
                    <div>
                      <div className="text-xs font-bold text-ink">Edit &amp; Rename Category</div>
                      <div className="text-[11px] text-charcoal">Change name, icon, and accent color</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-primary">Password Protected</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCategoryForOptions(null);
                    setIsReorderMode(true);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-hairline hover:border-ink/30 hover:bg-surface-bone text-ink text-left transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-ink/10 text-ink flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <ArrowLeftRight size={16} />
                    </span>
                    <div>
                      <div className="text-xs font-bold text-ink">Reorder &amp; Align Positions</div>
                      <div className="text-[11px] text-charcoal">Shift category left or right in filter bar</div>
                    </div>
                  </div>
                </button>

                {!isProtected ? (
                  <button
                    type="button"
                    onClick={() => {
                      const target = categoryForOptions;
                      setCategoryForOptions(null);
                      setCategoryForSecurity({ action: 'DELETE', category: target });
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-rose-200 hover:border-rose-400 hover:bg-rose-50 text-left transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Trash2 size={16} />
                      </span>
                      <div>
                        <div className="text-xs font-bold text-rose-600">Delete Category</div>
                        <div className="text-[11px] text-rose-500/80">Habits will be moved to &quot;Others&quot;</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-rose-600">Password Protected</span>
                  </button>
                ) : (
                  <div className="p-2.5 rounded-xl bg-surface-bone text-charcoal text-[11px] text-center">
                    Default system categories cannot be deleted.
                  </div>
                )}
              </div>

              <div className="pt-2">
                <Button
                  variant="ghost"
                  size="md"
                  className="w-full"
                  onClick={() => setCategoryForOptions(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Security Verification Modal for Category Actions */}
      {categoryForSecurity && (
        <SecurityModal
          isOpen={Boolean(categoryForSecurity)}
          onClose={() => setCategoryForSecurity(null)}
          title="Security Verification"
          actionTitle={
            categoryForSecurity.action === 'EDIT'
              ? `Edit Category: "${categoryForSecurity.category.name}"`
              : `Delete Category: "${categoryForSecurity.category.name}"`
          }
          isDanger={categoryForSecurity.action === 'DELETE'}
          onSuccess={async () => {
            const target = categoryForSecurity;
            setCategoryForSecurity(null);
            if (target.action === 'EDIT') {
              setCategoryToEdit(target.category);
              setIsCategoryModalOpen(true);
            } else {
              await deleteCategory(target.category.id);
              if (selectedCatFilter === target.category.id) {
                setSelectedCatFilter('all');
              }
            }
          }}
        />
      )}

      {/* Create / Edit Category Modal */}
      <CreateCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setCategoryToEdit(null);
        }}
        categoryToEdit={categoryToEdit}
        onCategoryCreated={(newCat) => {
          setSelectedCatFilter(newCat.id);
          setCategoryToEdit(null);
        }}
      />

      {/* Create Hardcore Challenge Modal */}
      <CreateChallengeModal
        isOpen={isChallengeModalOpen}
        onClose={() => setIsChallengeModalOpen(false)}
        onChallengeCreated={() => {
          setIsChallengeModalOpen(false);
          onOpenChallengesTab?.();
        }}
      />
    </div>
  );
};
