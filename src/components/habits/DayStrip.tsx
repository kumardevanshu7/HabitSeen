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
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
} from 'date-fns';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight, Calendar, Eye, CheckCircle2, Sparkles } from 'lucide-react';
import { useDragScroll } from '../../hooks/useDragScroll';
import { Modal } from '../ui/Modal';

export const DayStrip: React.FC = () => {
  const { habits, logs, selectedDate, setSelectedDate } = useAppStore();
  const todayKey = useTodayKey();
  const [anchorDate, setAnchorDate] = useState(() => parseISO(selectedDate));
  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);
  const [modalMonth, setModalMonth] = useState(() => parseISO(selectedDate));

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

  const openMonthModal = () => {
    setModalMonth(anchorDate);
    setIsMonthModalOpen(true);
  };

  // Full Month Calculation for Modal
  const mStart = startOfMonth(modalMonth);
  const mEnd = endOfMonth(modalMonth);
  const calStart = startOfWeek(mStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(mEnd, { weekStartsOn: 0 });
  const monthCalendarDays = eachDayOfInterval({ start: calStart, end: calEnd });

  // Month Statistics for modal header/footer
  const allDaysInMonth = eachDayOfInterval({ start: mStart, end: mEnd });
  let monthPerfectDaysCount = 0;
  let monthTotalDueHabits = 0;
  let monthTotalCompletedHabits = 0;

  allDaysInMonth.forEach((d) => {
    const dKey = format(d, 'yyyy-MM-dd');
    const due = activeHabits.filter((h) => isHabitDueOnDate(h, d, logs));
    if (due.length > 0) {
      monthTotalDueHabits += due.length;
      const completed = due.filter((h) => {
        const l = logs[`${h.id}_${dKey}`];
        return l?.status === 'COMPLETED' || l?.status === 'EXCUSED';
      }).length;
      monthTotalCompletedHabits += completed;
      if (completed === due.length) {
        monthPerfectDaysCount += 1;
      }
    }
  });

  const monthAvgRate =
    monthTotalDueHabits > 0
      ? Math.round((monthTotalCompletedHabits / monthTotalDueHabits) * 100)
      : 0;

  const radius = 14;
  const circumference = 2 * Math.PI * radius; // ~87.96

  return (
    <div className="bg-surface-card border border-hairline rounded-3xl p-4 sm:p-5 shadow-xs">
      {/* 1. TOP HEADER: MONTH, YEAR, AND CONTROLS */}
      <div className="flex items-center justify-between mb-3.5 px-1">
        <button
          type="button"
          onClick={openMonthModal}
          className="flex items-center gap-2 group text-left cursor-pointer transition-transform active:scale-98"
          title="Click to view full month calendar grid"
        >
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
            <Calendar size={17} className="shrink-0" />
          </div>
          <div className="flex items-center gap-2">
            <h2 className="font-display font-bold text-lg sm:text-xl text-ink tracking-tight group-hover:text-primary transition-colors">
              {monthYearLabel}
            </h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/10 hover:bg-primary/20 px-2.5 py-0.5 rounded-full border border-primary/20 transition-colors">
              <Eye size={12} /> View Month
            </span>
          </div>
        </button>

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

      {/* 3. FULL MONTH CALENDAR MODAL */}
      <Modal
        isOpen={isMonthModalOpen}
        onClose={() => setIsMonthModalOpen(false)}
        title="Full Month Calendar"
        subtitle="Inspect daily completion rates and click any date to jump directly to it"
        maxWidth="lg"
      >
        <div className="space-y-4">
          {/* Month Navigation & Metrics Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-surface-bone rounded-2xl border border-hairline">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setModalMonth((prev) => subMonths(prev, 1))}
                className="p-1.5 rounded-full hover:bg-white text-charcoal hover:text-ink transition-colors border border-hairline/60"
                title="Previous Month"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-display font-bold text-base sm:text-lg text-ink min-w-[140px] text-center">
                {format(modalMonth, 'MMMM yyyy')}
              </span>
              <button
                type="button"
                onClick={() => setModalMonth((prev) => addMonths(prev, 1))}
                className="p-1.5 rounded-full hover:bg-white text-charcoal hover:text-ink transition-colors border border-hairline/60"
                title="Next Month"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Quick KPI stats for this month */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 size={12} /> {monthPerfectDaysCount} Perfect Days
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                <Sparkles size={12} /> {monthAvgRate}% Completion
              </span>
              {!isSameMonth(modalMonth, new Date()) && (
                <button
                  type="button"
                  onClick={() => setModalMonth(new Date())}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white hover:bg-surface-bone text-charcoal hover:text-ink border border-hairline transition-colors"
                >
                  This Month
                </button>
              )}
            </div>
          </div>

          {/* 7-Day Column Headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <span
                key={d}
                className="text-[11px] uppercase font-bold tracking-wider text-charcoal/80 py-1"
              >
                {d}
              </span>
            ))}
          </div>

          {/* Calendar Day Cells Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {monthCalendarDays.map((day) => {
              const dKey = format(day, 'yyyy-MM-dd');
              const inCurrentMonth = isSameMonth(day, modalMonth);
              const isSelected = dKey === selectedDate;
              const isToday = dKey === todayKey;

              const dueHabits = activeHabits.filter((h) => isHabitDueOnDate(h, day, logs));
              const completedHabits = dueHabits.filter((h) => {
                const l = logs[`${h.id}_${dKey}`];
                return l?.status === 'COMPLETED' || l?.status === 'EXCUSED';
              });

              const totalDue = dueHabits.length;
              const totalCompleted = completedHabits.length;
              const pct = totalDue > 0 ? Math.round((totalCompleted / totalDue) * 100) : 0;

              return (
                <button
                  key={dKey}
                  type="button"
                  onClick={() => {
                    setSelectedDate(dKey);
                    setAnchorDate(day);
                    setIsMonthModalOpen(false);
                  }}
                  className={clsx(
                    'flex flex-col items-center justify-between p-1.5 sm:p-2 rounded-2xl border transition-all text-left relative min-h-[58px] sm:min-h-[68px] group cursor-pointer',
                    !inCurrentMonth && 'opacity-30 bg-surface-bone/50 border-hairline/40',
                    inCurrentMonth && !isSelected && 'bg-canvas hover:bg-surface-bone border-hairline',
                    isSelected && 'bg-ink text-white border-ink ring-2 ring-primary shadow-sm'
                  )}
                  title={`${format(day, 'EEEE, d MMMM yyyy')}: ${totalCompleted}/${totalDue} completed (${pct}%)`}
                >
                  {/* Date number and Today indicator */}
                  <div className="flex items-center justify-between w-full px-0.5">
                    <span
                      className={clsx(
                        'font-mono text-xs sm:text-sm font-bold',
                        isSelected ? 'text-white' : inCurrentMonth ? 'text-ink' : 'text-stone'
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                    {isToday && (
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-primary ring-2 ring-primary/20"
                        title="Today"
                      />
                    )}
                  </div>

                  {/* Completion status badge or progress indicator */}
                  {totalDue > 0 ? (
                    <div className="w-full mt-1">
                      <div className="flex items-center justify-between text-[10px] font-mono font-bold leading-none mb-1">
                        <span
                          className={clsx(
                            pct === 100
                              ? isSelected
                                ? 'text-emerald-300'
                                : 'text-emerald-600'
                              : isSelected
                              ? 'text-white/80'
                              : 'text-charcoal'
                          )}
                        >
                          {pct}%
                        </span>
                        <span
                          className={clsx(
                            'text-[9px] font-mono',
                            isSelected ? 'text-white/60' : 'text-stone/80'
                          )}
                        >
                          {totalCompleted}/{totalDue}
                        </span>
                      </div>
                      <div className="w-full bg-stone/20 h-1 rounded-full overflow-hidden">
                        <div
                          className={clsx(
                            'h-full rounded-full transition-all',
                            pct === 100
                              ? 'bg-emerald-500'
                              : pct >= 50
                              ? 'bg-amber-500'
                              : 'bg-primary'
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <span
                      className={clsx(
                        'text-[10px] font-mono self-center mt-2',
                        isSelected ? 'text-white/40' : 'text-stone/40'
                      )}
                    >
                      -
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend and jump footer */}
          <div className="flex items-center justify-between pt-2 border-t border-hairline text-xs text-charcoal flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[11px]">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> 100% Perfect
              </span>
              <span className="flex items-center gap-1 text-[11px]">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> In Progress
              </span>
              <span className="flex items-center gap-1 text-[11px]">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" /> Today
              </span>
            </div>
            <span className="text-[11px] text-stone">
              Click any day to jump to its habit checklist
            </span>
          </div>
        </div>
      </Modal>
    </div>
  );
};
