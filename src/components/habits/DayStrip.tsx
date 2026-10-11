import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { getTodayKey } from '../../utils/dateMath';
import {
  format,
  subDays,
  addDays,
  parseISO,
  differenceInCalendarDays,
} from 'date-fns';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useDragScroll } from '../../hooks/useDragScroll';

export const DayStrip: React.FC = () => {
  const { selectedDate, setSelectedDate } = useAppStore();
  const todayKey = getTodayKey();
  const [anchorDate, setAnchorDate] = useState(() => parseISO(selectedDate));

  const { ref: dayStripRef, isDragging: isStripDragging, events: stripDragEvents } =
    useDragScroll<HTMLDivElement>();

  // Keep anchor centered if selectedDate moves outside current window
  useEffect(() => {
    try {
      const parsed = parseISO(selectedDate);
      const diff = Math.abs(differenceInCalendarDays(parsed, anchorDate));
      if (diff > 7) {
        setAnchorDate(parsed);
      }
    } catch {
      // Ignore invalid date parsing
    }
  }, [selectedDate, anchorDate]);

  // Generate 15 continuous days (-7 to +7 days around anchor date)
  const days = Array.from({ length: 15 }, (_, i) => addDays(anchorDate, i - 7));

  // Current active month & year label
  const monthYearLabel = format(anchorDate, 'MMMM yyyy');

  const handlePrevWeek = () => {
    setAnchorDate((prev) => subDays(prev, 7));
  };

  const handleNextWeek = () => {
    setAnchorDate((prev) => addDays(prev, 7));
  };

  const handleTodayClick = () => {
    const today = new Date();
    setAnchorDate(today);
    setSelectedDate(todayKey);
  };

  return (
    <div className="bg-surface-card border border-hairline rounded-3xl p-4 sm:p-5 shadow-xs">
      {/* 1. TOP HEADER: MONTH, YEAR, AND CONTROLS */}
      <div className="flex items-center justify-between mb-3.5 px-1">
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-primary shrink-0" />
          <h2 className="font-display font-bold text-lg sm:text-xl text-ink tracking-tight">
            {monthYearLabel}
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          {selectedDate !== todayKey && (
            <button
              onClick={handleTodayClick}
              className="text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-full border border-primary/20 transition-colors"
            >
              Today
            </button>
          )}

          <div className="flex items-center gap-1 bg-surface-bone p-1 rounded-full border border-hairline">
            <button
              type="button"
              onClick={handlePrevWeek}
              className="p-1 rounded-full hover:bg-white text-charcoal hover:text-ink transition-colors"
              title="Previous 7 Days"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={handleNextWeek}
              className="p-1 rounded-full hover:bg-white text-charcoal hover:text-ink transition-colors"
              title="Next 7 Days"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. CONTINUOUS DATES STRIP (NO CUTOFFS - DRAG TO SCROLL) */}
      <div
        ref={dayStripRef}
        {...stripDragEvents}
        className={clsx(
          'flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-0.5 select-none cursor-grab active:cursor-grabbing',
          isStripDragging && 'cursor-grabbing'
        )}
      >
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const isSelected = key === selectedDate;
          const isToday = key === todayKey;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedDate(key)}
              className={clsx(
                'flex flex-col items-center justify-center min-w-[56px] sm:min-w-[62px] py-2.5 px-2 rounded-2xl border transition-all select-none shrink-0',
                isSelected
                  ? 'bg-ink text-white border-ink ring-2 ring-primary shadow-sm scale-102'
                  : 'bg-canvas text-charcoal border-hairline hover:bg-surface-bone hover:text-ink'
              )}
            >
              <span
                className={clsx(
                  'text-[10px] uppercase font-bold tracking-wider',
                  isSelected ? 'text-primary-pink' : 'text-stone'
                )}
              >
                {format(day, 'EEE')}
              </span>
              <span className="font-mono text-base sm:text-lg font-bold leading-tight mt-1">
                {format(day, 'd')}
              </span>
              {isToday && (
                <span
                  className={clsx(
                    'w-1.5 h-1.5 rounded-full mt-1.5',
                    isSelected ? 'bg-primary' : 'bg-primary'
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
