import React, { useState } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { HabitCard } from './HabitCard';
import { DayStrip } from './DayStrip';
import { Habit } from '../../types/habit';
import { isHabitDueOnDate } from '../../utils/dateMath';
import { CATEGORY_ICONS } from '../../constants/iconsAndColors';
import { boostVibrancy, getContrastIconColor } from '../../utils/colorUtils';
import { CreateCategoryModal } from '../categories/CreateCategoryModal';
import { Button } from '../ui/Button';
import { parseISO } from 'date-fns';
import { Plus, CheckCheck, LayoutGrid, List } from 'lucide-react';
import clsx from 'clsx';

interface HabitsViewProps {
  onOpenCreateHabit: () => void;
  onOpenHabitDetails: (habit: Habit) => void;
}

export const HabitsView: React.FC<HabitsViewProps> = ({
  onOpenCreateHabit,
  onOpenHabitDetails,
}) => {
  const { habits, categories, selectedDate } = useAppStore();

  const [selectedCatFilter, setSelectedCatFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

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

  return (
    <div className="space-y-4">
      {/* 1. DATE PICKER STRIP */}
      <DayStrip />

      {/* 2. CATEGORY PILLS FILTER BAR */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        <button
          onClick={() => setSelectedCatFilter('all')}
          className={clsx(
            'px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border',
            effectiveCatFilter === 'all'
              ? 'bg-ink text-white border-ink shadow-xs'
              : 'bg-surface-card text-charcoal border-hairline hover:bg-surface-bone'
          )}
        >
          All Habits ({activeHabits.length})
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCatFilter === cat.id;
          const Icon =
            CATEGORY_ICONS.find((i) => i.id === cat.icon)?.icon ||
            CATEGORY_ICONS[0].icon;
          const vibrantColor = boostVibrancy(cat.color);
          const iconColor = getContrastIconColor(vibrantColor);

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCatFilter(cat.id)}
              className={clsx(
                'flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border-2 shrink-0',
                isSelected
                  ? 'shadow-xs text-ink'
                  : 'text-charcoal hover:text-ink'
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
            </button>
          );
        })}

        <button
          onClick={() => setIsCategoryModalOpen(true)}
          className="text-xs font-semibold text-primary hover:text-primary-deep bg-surface-card border border-dashed border-primary/40 px-3 py-1.5 rounded-full whitespace-nowrap flex items-center gap-1 transition-colors"
        >
          <Plus size={13} /> New Category
        </button>
      </div>

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
            {habits.length === 0
              ? 'No Habits Created Yet'
              : 'All clear for this date!'}
          </h3>
          <p className="text-charcoal text-xs sm:text-sm mt-1 max-w-sm mx-auto">
            {habits.length === 0
              ? 'Start small. Click the button below to configure your first daily habit target.'
              : 'None of your habits are scheduled for this day, or a category filter was applied.'}
          </p>

          <div className="flex items-center justify-center gap-3 mt-5 flex-wrap">
            {selectedCatFilter !== 'all' && (
              <Button
                variant="outline"
                size="md"
                onClick={() => setSelectedCatFilter('all')}
              >
                Clear Filter (Show All {habits.length} Habits)
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
              ? 'grid grid-cols-1 md:grid-cols-2 gap-3.5'
              : 'flex flex-col gap-2.5'
          )}
        >
          {dueHabits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              dateKey={selectedDate}
              variant={viewMode}
              onOpenDetails={onOpenHabitDetails}
            />
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
