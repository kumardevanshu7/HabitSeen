import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { isHabitDueOnDate } from '../../utils/dateMath';
import { useTodayKey } from '../../hooks/useTodayKey';
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
  const { habits, logs, selectedDate, setSelectedDate } = useAppStore();
  const todayKey = useTodayKey();
  const [anchorDate, setAnchorDate] = useState(() => parseISO(selectedDate));

  const { ref: dayStripRef, isDragging: isStripDragging, events: stripDragEvents } =
    useDragScroll<HTMLDivElement>();

  // Filter out archived habits
  const activeHabits = habits.filter((h) => !h.isArchived);

  // Center anchor only when selectedDate explicitly changes to a date outside the current window
  const prevSelectedDateRef = useRef(selectedDate);
  useEffect(() => {
    if (prevSelectedDateRef.current === selectedDate) return;
    prevSelectedDateRef.current = selectedDate;
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
    const today = parseISO(todayKey);
    setAnchorDate(today);
    setSelectedDate(todayKey);
  };

  const radius = 14;
  const circumference = 2 * Math.PI * radius; // ~87.96

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

          // Compute habits scheduled & completed on this date
          const dueHabits = activeHabits.filter((h) => isHabitDueOnDate(h, day, logs));
          const completedHabits = dueHabits.filter((h) => {
            const l = logs[`${h.id}_${key}`];
            return l?.status === 'COMPLETED' || l?.status === 'EXCUSED';
          });

          const totalDue = dueHabits.length;
          const totalCompleted = completedHabits.length;
          const completionPercentage =
            totalDue > 0 ? Math.round((totalCompleted / totalDue) * 100) : 0;
          const strokeOffset = circumference - (completionPercentage / 100) * circumference;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedDate(key)}
              title={`${format(day, 'EEEE, d MMM yyyy')}: ${totalCompleted}/${totalDue} completed (${completionPercentage}%)`}
              className={clsx(
                'flex flex-col items-center justify-center min-w-[58px] sm:min-w-[64px] py-2 px-1.5 rounded-2xl border transition-all select-none shrink-0 gap-0.5',
                isSelected
                  ? 'bg-ink text-white border-ink ring-2 ring-primary shadow-sm scale-102'
                  : 'bg-canvas text-charcoal border-hairline hover:bg-surface-bone hover:text-ink'
              )}
            >
              {/* Day of Week + Today Dot */}
              <div className="flex items-center gap-1">
                <span
                  className={clsx(
                    'text-[10px] uppercase font-bold tracking-wider',
                    isSelected ? 'text-primary-pink' : 'text-stone'
                  )}
                >
                  {format(day, 'EEE')}
                </span>
                {isToday && (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"
                    title="Today"
                  />
                )}
              </div>

              {/* Circular Progress Ring enclosing the Date Number */}
              <div className="relative w-9 h-9 flex items-center justify-center my-0.5">
                <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
                  {/* Background Track Circle */}
                  <circle
                    cx="18"
                    cy="18"
                    r={radius}
                    fill="none"
                    stroke={isSelected ? 'rgba(255, 255, 255, 0.2)' : 'currentColor'}
                    strokeWidth="2.5"
                    className={clsx(!isSelected && 'text-stone/20')}
                  />
                  {/* Progress Indicator Circle */}
                  {totalDue > 0 && completionPercentage > 0 && (
                    <circle
                      cx="18"
                      cy="18"
                      r={radius}
                      fill="none"
                      stroke={
                        completionPercentage === 100
                          ? '#10B981'
                          : isSelected
                          ? '#FF758F'
                          : '#F43F5E'
                      }
                      strokeWidth="2.5"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeOffset}
                      strokeLinecap="round"
                      className="transition-all duration-300"
                    />
                  )}
                </svg>

                <span className="absolute font-mono text-xs sm:text-sm font-bold leading-none">
                  {format(day, 'd')}
                </span>
              </div>

              {/* Completion Percentage Badge */}
              <span
                className={clsx(
                  'text-[10px] font-mono font-bold leading-tight',
                  isSelected
                    ? completionPercentage === 100
                      ? 'text-emerald-300'
                      : 'text-white/80'
                    : completionPercentage === 100
                    ? 'text-emerald-600'
                    : completionPercentage > 0
                    ? 'text-primary'
                    : 'text-stone/60'
                )}
              >
                {totalDue > 0 ? `${completionPercentage}%` : '0%'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
