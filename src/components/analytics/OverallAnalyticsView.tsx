import React from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { WILL_HABIT_TIERS, CATEGORY_ICONS } from '../../constants/iconsAndColors';
import { boostVibrancy, getContrastIconColor } from '../../utils/colorUtils';
import {
  Award,
  Flame,
  CheckCircle2,
  Calendar,
  Layers,
  ShieldCheck,
  TrendingUp,
  PieChart,
  Target,
  Sparkles,
  Clock,
  CheckSquare,
  Hash,
  ToggleLeft,
} from 'lucide-react';
import {
  eachDayOfInterval,
  format,
  subDays,
  parseISO,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
} from 'date-fns';
import clsx from 'clsx';

export const OverallAnalyticsView: React.FC = () => {
  const { user, habits, logs, habitBreaks, categories } = useAppStore();

  const userLevel = user?.gamification?.level ?? 1;
  const userXp = user?.gamification?.totalXp ?? 100;
  const userTitle = user?.gamification?.levelTitle ?? 'Will Habit Initiate';
  const userConsistency = user?.gamification?.consistencyScore ?? 100;

  const currentTier =
    WILL_HABIT_TIERS.find((t) => t.level === userLevel) || WILL_HABIT_TIERS[0];
  const nextTier = WILL_HABIT_TIERS.find((t) => t.level === userLevel + 1);

  const xpProgress = nextTier
    ? Math.min(
        100,
        Math.max(
          0,
          ((userXp - currentTier.minXp) / (nextTier.minXp - currentTier.minXp)) * 100
        )
      )
    : 100;

  // Total Completed Logs
  const allLogsArray = Object.values(logs);
  const totalCompletedLogs = allLogsArray.filter((l) => l.status === 'COMPLETED').length;
  const bestOverallStreak = habits.reduce(
    (max, h) => Math.max(max, h.stats.bestStreak),
    0
  );

  // Weekly & Monthly Stats Calculation
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const weeklyLogs = allLogsArray.filter((l) => {
    try {
      const d = parseISO(l.date);
      return isWithinInterval(d, { start: weekStart, end: weekEnd });
    } catch {
      return false;
    }
  });
  const weeklyCompleted = weeklyLogs.filter((l) => l.status === 'COMPLETED').length;
  const weeklyRate = weeklyLogs.length > 0 ? Math.round((weeklyCompleted / weeklyLogs.length) * 100) : 100;

  const monthlyLogs = allLogsArray.filter((l) => {
    try {
      const d = parseISO(l.date);
      return isWithinInterval(d, { start: monthStart, end: monthEnd });
    } catch {
      return false;
    }
  });
  const monthlyCompleted = monthlyLogs.filter((l) => l.status === 'COMPLETED').length;
  const monthlyRate = monthlyLogs.length > 0 ? Math.round((monthlyCompleted / monthlyLogs.length) * 100) : 100;

  // Habit Type Breakdown
  const yesNoCount = habits.filter((h) => h.type === 'YES_NO').length;
  const numericCount = habits.filter((h) => h.type === 'NUMERIC').length;
  const timerCount = habits.filter((h) => h.type === 'TIMER').length;
  const checklistCount = habits.filter((h) => h.type === 'CHECKLIST').length;

  // Day of the Week Consistency (Mon..Sun)
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayStats = dayNames.map((name, dayIndex) => {
    const dayLogs = allLogsArray.filter((l) => {
      try {
        return parseISO(l.date).getDay() === dayIndex;
      } catch {
        return false;
      }
    });
    const completed = dayLogs.filter((l) => l.status === 'COMPLETED').length;
    const rate = dayLogs.length > 0 ? Math.round((completed / dayLogs.length) * 100) : 0;
    return { name, dayIndex, total: dayLogs.length, completed, rate };
  });

  // 120-Day Activity Heatmap Matrix
  const pastYearDays = eachDayOfInterval({
    start: subDays(now, 119),
    end: now,
  });

  return (
    <div className="space-y-6">
      {/* 1. WILL HABIT GAMIFICATION CARD */}
      <div className="bg-surface-card border border-hairline rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-primary-glow flex items-center justify-center text-white shadow-md">
              <Award size={32} />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal">
                CURRENT GAMIFICATION TIER
              </span>
              <h3 className="font-display font-bold text-2xl text-ink tracking-tight">
                {userTitle}
              </h3>
              <p className="text-xs text-charcoal">
                Level {userLevel} &bull;{' '}
                <span className="font-mono font-bold text-ink">{userXp} XP</span>{' '}
                Earned
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs font-semibold text-charcoal">Global Consistency Score</span>
            <div className="font-mono text-3xl font-bold text-primary">
              {userConsistency}%
            </div>
          </div>
        </div>

        {/* Level XP Progress Bar */}
        <div>
          <div className="flex justify-between text-xs text-charcoal mb-1.5 font-mono">
            <span>Progress: {Math.round(xpProgress)}%</span>
            <span>
              {nextTier ? `${nextTier.minXp - userXp} XP to ${nextTier.title}` : 'MAX TIER ACHIEVED'}
            </span>
          </div>
          <div className="w-full bg-surface-bone h-3 rounded-full overflow-hidden border border-hairline">
            <div
              className="bg-primary h-full rounded-full transition-all duration-700"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. ENRICHED MACRO METRICS GRID (6 CARDS) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 bg-surface-card border border-hairline rounded-2xl">
          <span className="text-xs text-charcoal flex items-center gap-1.5 truncate">
            <Layers size={14} className="text-primary" /> Active Habits
          </span>
          <p className="font-mono text-2xl sm:text-3xl font-bold text-ink mt-1">
            {habits.length}
          </p>
        </div>

        <div className="p-4 bg-surface-card border border-hairline rounded-2xl">
          <span className="text-xs text-charcoal flex items-center gap-1.5 truncate">
            <CheckCircle2 size={14} className="text-badge-success" /> Total Check-ins
          </span>
          <p className="font-mono text-2xl sm:text-3xl font-bold text-badge-success mt-1">
            {totalCompletedLogs}
          </p>
        </div>

        <div className="p-4 bg-surface-card border border-hairline rounded-2xl">
          <span className="text-xs text-charcoal flex items-center gap-1.5 truncate">
            <Flame size={14} className="text-primary" /> Top Active Streak
          </span>
          <p className="font-mono text-2xl sm:text-3xl font-bold text-primary mt-1">
            {bestOverallStreak} <span className="text-xs font-sans text-charcoal">days</span>
          </p>
        </div>

        <div className="p-4 bg-surface-card border border-hairline rounded-2xl">
          <span className="text-xs text-charcoal flex items-center gap-1.5 truncate">
            <ShieldCheck size={14} className="text-blue-600" /> Habits Broken
          </span>
          <p className="font-mono text-2xl sm:text-3xl font-bold text-blue-600 mt-1">
            {habitBreaks.length}
          </p>
        </div>

        <div className="p-4 bg-surface-card border border-hairline rounded-2xl">
          <span className="text-xs text-charcoal flex items-center gap-1.5 truncate">
            <TrendingUp size={14} className="text-emerald-600" /> Weekly Rate
          </span>
          <p className="font-mono text-2xl sm:text-3xl font-bold text-emerald-600 mt-1">
            {weeklyRate}%
          </p>
        </div>

        <div className="p-4 bg-surface-card border border-hairline rounded-2xl">
          <span className="text-xs text-charcoal flex items-center gap-1.5 truncate">
            <Sparkles size={14} className="text-amber-500" /> Monthly Rate
          </span>
          <p className="font-mono text-2xl sm:text-3xl font-bold text-amber-600 mt-1">
            {monthlyRate}%
          </p>
        </div>
      </div>

      {/* 3. CATEGORY PERFORMANCE BREAKDOWN */}
      <div className="p-5 bg-surface-card border border-hairline rounded-3xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-display font-bold text-lg text-ink flex items-center gap-2">
              <PieChart size={18} className="text-primary" /> Category Performance Matrix
            </h4>
            <p className="text-xs text-charcoal">
              Consistency distribution and active load across your custom categories.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {categories.map((cat) => {
            const catHabits = habits.filter((h) => h.categoryId === cat.id);
            const Icon =
              CATEGORY_ICONS.find((i) => i.id === cat.icon)?.icon ||
              CATEGORY_ICONS[0].icon;
            const effectiveColor = boostVibrancy(cat.color);
            const iconColor = getContrastIconColor(effectiveColor);

            // Completion rate for this category
            const catLogs = allLogsArray.filter((l) =>
              catHabits.some((h) => h.id === l.habitId)
            );
            const catCompleted = catLogs.filter((l) => l.status === 'COMPLETED').length;
            const catRate = catLogs.length > 0 ? Math.round((catCompleted / catLogs.length) * 100) : 0;

            return (
              <div
                key={cat.id}
                className="p-3.5 bg-canvas rounded-2xl border-2 transition-all"
                style={{ borderColor: `${effectiveColor}50` }}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-2xs"
                      style={{ backgroundColor: effectiveColor, color: iconColor }}
                    >
                      <Icon size={14} strokeWidth={2.5} />
                    </span>
                    <span className="font-bold text-xs text-ink">{cat.name}</span>
                  </div>
                  <span className="text-[11px] font-mono text-charcoal font-semibold">
                    {catHabits.length} habits
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-charcoal">
                    <span>Performance</span>
                    <span className="font-bold text-ink">{catRate}%</span>
                  </div>
                  <div className="w-full bg-surface-bone h-2 rounded-full overflow-hidden border border-hairline/60">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${catRate}%`,
                        backgroundColor: effectiveColor,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. DAY-OF-WEEK DISCIPLINE MATRIX & HABIT TYPES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Day of Week Consistency */}
        <div className="p-5 bg-surface-card border border-hairline rounded-3xl">
          <h4 className="font-display font-bold text-base text-ink mb-1 flex items-center gap-2">
            <Calendar size={17} className="text-primary" /> Day of Week Discipline Index
          </h4>
          <p className="text-xs text-charcoal mb-4">
            Which days of the week are you most consistent?
          </p>

          <div className="grid grid-cols-7 gap-1.5 text-center">
            {dayStats.map((d) => (
              <div
                key={d.name}
                className="p-2 bg-canvas rounded-2xl border border-hairline flex flex-col items-center justify-between h-20"
              >
                <span className="text-[10px] font-bold uppercase text-charcoal">{d.name}</span>
                <span className="font-mono text-sm font-extrabold text-ink">{d.rate}%</span>
                <div className="w-full bg-surface-bone h-1.5 rounded-full overflow-hidden">
                  <div
                    className={clsx(
                      'h-full rounded-full transition-all',
                      d.rate >= 80 ? 'bg-badge-success' : d.rate >= 50 ? 'bg-amber-500' : 'bg-primary'
                    )}
                    style={{ width: `${d.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Habit Type Distribution */}
        <div className="p-5 bg-surface-card border border-hairline rounded-3xl">
          <h4 className="font-display font-bold text-base text-ink mb-1 flex items-center gap-2">
            <Target size={17} className="text-primary" /> Behavioral Habit Types Load
          </h4>
          <p className="text-xs text-charcoal mb-4">
            Balance between your routine models.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-canvas rounded-2xl border border-hairline flex items-center gap-3">
              <span className="p-2 rounded-xl bg-primary/10 text-primary">
                <ToggleLeft size={20} />
              </span>
              <div>
                <span className="text-xs text-charcoal block">Yes / No</span>
                <span className="font-mono text-lg font-bold text-ink">{yesNoCount}</span>
              </div>
            </div>

            <div className="p-3 bg-canvas rounded-2xl border border-hairline flex items-center gap-3">
              <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Hash size={20} />
              </span>
              <div>
                <span className="text-xs text-charcoal block">Numeric Targets</span>
                <span className="font-mono text-lg font-bold text-ink">{numericCount}</span>
              </div>
            </div>

            <div className="p-3 bg-canvas rounded-2xl border border-hairline flex items-center gap-3">
              <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Clock size={20} />
              </span>
              <div>
                <span className="text-xs text-charcoal block">Timer Sessions</span>
                <span className="font-mono text-lg font-bold text-ink">{timerCount}</span>
              </div>
            </div>

            <div className="p-3 bg-canvas rounded-2xl border border-hairline flex items-center gap-3">
              <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
                <CheckSquare size={20} />
              </span>
              <div>
                <span className="text-xs text-charcoal block">Checklist Routines</span>
                <span className="font-mono text-lg font-bold text-ink">{checklistCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. ACTIVITY HEATMAP (120 DAYS) */}
      <div className="p-5 bg-surface-card border border-hairline rounded-3xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-display font-bold text-lg text-ink flex items-center gap-2">
              <Calendar size={18} /> Daily Consistency Matrix (120 Days)
            </h4>
            <p className="text-xs text-charcoal">
              Color intensity indicates total completions across all habits on that day.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1">
          {pastYearDays.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayCompletions = allLogsArray.filter(
              (l) => l.date === dateKey && l.status === 'COMPLETED'
            ).length;

            return (
              <div
                key={dateKey}
                className={clsx(
                  'w-5 h-5 rounded-md transition-all border',
                  dayCompletions === 0 && 'bg-surface-bone border-hairline/60',
                  dayCompletions === 1 && 'bg-emerald-200 border-emerald-300',
                  dayCompletions === 2 && 'bg-emerald-400 border-emerald-500',
                  dayCompletions >= 3 && 'bg-emerald-600 border-emerald-700 text-white'
                )}
                title={`${dateKey}: ${dayCompletions} habit(s) completed`}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-2 text-[11px] text-charcoal mt-3">
          <span>Less</span>
          <span className="w-3.5 h-3.5 rounded bg-surface-bone border border-hairline" />
          <span className="w-3.5 h-3.5 rounded bg-emerald-200" />
          <span className="w-3.5 h-3.5 rounded bg-emerald-400" />
          <span className="w-3.5 h-3.5 rounded bg-emerald-600" />
          <span>More Active</span>
        </div>
      </div>
    </div>
  );
};
