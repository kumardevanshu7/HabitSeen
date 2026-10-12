import React, { useState, useRef } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { HabitCard } from './HabitCard';
import { DayStrip } from './DayStrip';
import { Habit, Category } from '../../types/habit';
import { isHabitDueOnDate, getTodayKey } from '../../utils/dateMath';
import { CATEGORY_ICONS } from '../../constants/iconsAndColors';
import { boostVibrancy, getContrastIconColor } from '../../utils/colorUtils';
import { CreateCategoryModal } from '../categories/CreateCategoryModal';
import { Button } from '../ui/Button';
import { parseISO, format } from 'date-fns';
import { useDragScroll } from '../../hooks/useDragScroll';
import { Plus, CheckCheck, LayoutGrid, List, Sparkles, ArrowLeftRight, ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

interface HabitsViewProps {
  onOpenCreateHabit: () => void;
  onOpenHabitDetails: (habit: Habit) => void;
}

export const HabitsView: React.FC<HabitsViewProps> = ({
  onOpenCreateHabit,
  onOpenHabitDetails,
}) => {
  const { habits, categories, logs, selectedDate, setSelectedDate, reorderCategories } = useAppStore();

  const [selectedCatFilter, setSelectedCatFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [draggedCatId, setDraggedCatId] = useState<string | null>(null);

  const catHoldTimerRef = useRef<NodeJS.Timeout | null>(null);
  const catTouchStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const { ref: categoriesScrollRef, isDragging: isCatDragging, events: catScrollEvents } =
    useDragScroll<HTMLDivElement>();

  const selectedDateTime = parseISO(selectedDate);

  // Filter out archived habits
  const activeHabits = habits.filter((h) => !h.isArchived);

  // If currently selected category was deleted, safely fallback to 'all'
  const isSelectedCategoryValid =
    selectedCatFilter === 'all' || categories.some((c) => c.id === selectedCatFilter);
  const effectiveCatFilter = isSelectedCategoryValid ? selectedCatFilter : 'all';

  // Filter habits due on selected date and sort by priority number (0-100) descending
  const dueHabits = activeHabits
    .filter((h) => {
      // Category filter
      if (effectiveCatFilter !== 'all' && h.categoryId !== effectiveCatFilter) {
        return false;
      }
      // Frequency filter
      return isHabitDueOnDate(h, selectedDateTime);
    })
    .sort((a, b) => {
      const pA = typeof a.schedule.priority === 'number' ? a.schedule.priority : 50;
      const pB = typeof b.schedule.priority === 'number' ? b.schedule.priority : 50;
      return pB - pA; // Higher priority on top!
    });

  const totalDueCount = dueHabits.length;
  const completedDueCount = dueHabits.filter((h) => {
    const l = logs[`${h.id}_${selectedDate}`];
    return l?.status === 'COMPLETED' || l?.status === 'EXCUSED';
  }).length;
  const isAllCompletedToday = totalDueCount > 0 && completedDueCount === totalDueCount;

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

  const handleCatTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    catTouchStartPos.current = { x: touch.clientX, y: touch.clientY };
    catHoldTimerRef.current = setTimeout(() => {
      navigator.vibrate?.(35);
      setIsReorderMode(true);
    }, 400);
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

  const handleCatMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    catHoldTimerRef.current = setTimeout(() => {
      setIsReorderMode(true);
    }, 400);
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

      {/* 2. CATEGORY PILLS FILTER BAR (HOLD TO REORDER / ALIGN) */}
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
              onTouchStart={handleCatTouchStart}
              onTouchEnd={handleCatTouchEnd}
              onTouchMove={handleCatTouchMove}
              onMouseDown={handleCatMouseDown}
              onMouseUp={handleCatMouseUp}
              onMouseLeave={handleCatMouseUp}
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
                onClick={() => setSelectedCatFilter(cat.id)}
                title="Hold to align & reorder"
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

        <button
          onClick={() => setIsCategoryModalOpen(true)}
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

      {/* 100% PERFECT DAY CELEBRATION BANNER */}
      {isAllCompletedToday && (
        <div className="p-3.5 bg-gradient-to-r from-emerald-500/10 via-amber-500/15 to-emerald-500/10 border-2 border-emerald-500/40 rounded-2xl flex items-center justify-between gap-3 shadow-2xs animate-in fade-in duration-300">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles size={18} />
            </span>
            <div>
              <span className="text-xs font-black text-ink block">
                🎉 100% Perfect Day Completed!
              </span>
              <span className="text-[11px] text-charcoal">
                All {totalDueCount} tasks conquered! Bonus Willpower XP awarded & Heart restored.
              </span>
            </div>
          </div>
          <span className="text-xs font-mono font-bold bg-white text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-300 shrink-0">
            100% Done
          </span>
        </div>
      )}

      {/* 3. TOOLBAR: HABITS COUNT & VIEW MODE SWITCHER (GRID VS HORIZONTAL LIST) */}
      <div className="flex items-center justify-between gap-2 pt-1 pb-0.5">
        <span className="text-xs font-bold text-charcoal uppercase tracking-wider ml-1">
          Scheduled Habits ({dueHabits.length})
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
            <CheckCheck size={28} />
          </div>
          <h3 className="font-display font-bold text-lg text-ink">
            {activeHabits.length === 0
              ? 'No Habits Created Yet'
              : `No habits scheduled for ${format(selectedDateTime, 'EEEE, dd MMMM yyyy')}`}
          </h3>
          <p className="text-charcoal text-xs sm:text-sm mt-1 max-w-md mx-auto">
            {activeHabits.length === 0
              ? 'Start small. Click the button below to configure your first daily habit target.'
              : `You have ${activeHabits.length} active habit(s) in your system. Switch to "All Habits" or jump to Today to view them.`}
          </p>

          <div className="flex items-center justify-center gap-2.5 mt-5 flex-wrap">
            {effectiveCatFilter !== 'all' && (
              <Button
                variant="outline"
                size="md"
                onClick={() => setSelectedCatFilter('all')}
              >
                Clear Category Filter ({activeHabits.length})
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
          </div>
        </div>
      ) : (
        <div
          className={clsx(
            viewMode === 'grid'
              ? 'columns-1 md:columns-2 gap-3.5'
              : 'flex flex-col gap-2.5'
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

      {/* Create Category Modal */}
      <CreateCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onCategoryCreated={(newCat) => setSelectedCatFilter(newCat.id)}
      />
    </div>
  );
};
