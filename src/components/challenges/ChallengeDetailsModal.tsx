import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Challenge } from '../../types/habit';
import { CATEGORY_ICONS } from '../../constants/iconsAndColors';
import { boostVibrancy, getContrastIconColor } from '../../utils/colorUtils';
import {
  Flame,
  Trophy,
  Heart,
  Zap,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Target,
  Trash2,
  Award,
  TrendingUp,
} from 'lucide-react';
import { addDays, format, parseISO, isSameDay } from 'date-fns';
import clsx from 'clsx';

interface ChallengeDetailsModalProps {
  challenge: Challenge | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (challenge: Challenge) => void;
}

export const ChallengeDetailsModal: React.FC<ChallengeDetailsModalProps> = ({
  challenge,
  isOpen,
  onClose,
  onDelete,
}) => {
  if (!challenge) return null;

  const IconComp =
    CATEGORY_ICONS.find((i) => i.id === challenge.icon)?.icon || CATEGORY_ICONS[0].icon;
  const vibrantColor = boostVibrancy(challenge.color);
  const iconColor = getContrastIconColor(vibrantColor);

  const dayLogs = challenge.dayLogs || {};
  const logValues = Object.values(dayLogs);
  const completedCount = logValues.filter((l) => l.status === 'COMPLETED').length;
  const failedCount = logValues.filter((l) => l.status === 'FAILED').length;
  const targetDays = Math.max(1, challenge.targetDays || 7);
  const completionPct = Math.min(100, Math.round((completedCount / targetDays) * 100));
  const daysRemaining = Math.max(0, targetDays - completedCount);

  // Compute current & best streak inside this challenge
  let currentStreak = 0;
  let bestStreak = 0;
  let running = 0;

  const challengeDays = Array.from({ length: targetDays }).map((_, i) => {
    const d = addDays(parseISO(challenge.startDate), i);
    const key = format(d, 'yyyy-MM-dd');
    const log = dayLogs[key];
    if (log?.status === 'COMPLETED') {
      running++;
      if (running > bestStreak) bestStreak = running;
    } else if (log?.status === 'FAILED') {
      running = 0;
    }
    return {
      dayNumber: i + 1,
      dateObj: d,
      dateKey: key,
      log,
    };
  });
  currentStreak = running;

  const disciplineIntegrity =
    completedCount + failedCount > 0
      ? Math.round((completedCount / (completedCount + failedCount)) * 100)
      : 100;

  const projectedVictoryXp = targetDays * 50 + targetDays * 30;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${challenge.name} — Challenge Analytics`}
      subtitle={`Hardcore ${targetDays}-Day Challenge • Started ${format(
        parseISO(challenge.startDate),
        'dd MMM yyyy'
      )}`}
      maxWidth="xl"
    >
      <div className="space-y-5">
        {/* 1. HEADER SUMMARY CARD */}
        <div
          className="p-4 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
          style={{
            borderColor: `${vibrantColor}60`,
            backgroundColor: `${vibrantColor}12`,
          }}
        >
          <div className="flex items-center gap-3">
            <span
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
              style={{ backgroundColor: vibrantColor, color: iconColor }}
            >
              <IconComp size={24} strokeWidth={2.5} />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-ink text-white">
                  {targetDays} Days Challenge
                </span>
                {challenge.status === 'COMPLETED' ? (
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-badge-success text-white">
                    🏆 Conquered
                  </span>
                ) : (
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                    ⚠️ -90% Health Penalty Active
                  </span>
                )}
              </div>
              <h3 className="font-display font-bold text-lg text-ink mt-1">
                {challenge.name}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="text-right mr-2">
              <span className="text-[10px] font-bold uppercase text-charcoal block">
                Overall Progress
              </span>
              <span className="font-mono text-2xl font-black text-ink">
                {completionPct}%
              </span>
            </div>
            {onDelete && (
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => onDelete(challenge)}
                className="gap-1.5"
              >
                <Trash2 size={14} /> Delete
              </Button>
            )}
          </div>
        </div>

        {/* 2. KEY ANALYTICS METRICS (6 CARDS) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3.5 bg-surface-card border border-hairline rounded-2xl">
            <span className="text-xs text-charcoal flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-badge-success" /> Days Conquered
            </span>
            <p className="font-mono text-2xl font-black text-badge-success mt-1">
              {completedCount}{' '}
              <span className="text-xs font-sans text-charcoal">/ {targetDays}</span>
            </p>
          </div>

          <div className="p-3.5 bg-surface-card border border-hairline rounded-2xl">
            <span className="text-xs text-charcoal flex items-center gap-1.5">
              <Target size={14} className="text-primary" /> Days Remaining
            </span>
            <p className="font-mono text-2xl font-black text-ink mt-1">
              {daysRemaining}{' '}
              <span className="text-xs font-sans text-charcoal">days left</span>
            </p>
          </div>

          <div className="p-3.5 bg-surface-card border border-hairline rounded-2xl">
            <span className="text-xs text-charcoal flex items-center gap-1.5">
              <Flame size={14} className="text-orange-500" /> Best Streak
            </span>
            <p className="font-mono text-2xl font-black text-orange-600 mt-1">
              {bestStreak}{' '}
              <span className="text-xs font-sans text-charcoal">
                (Now: {currentStreak}d)
              </span>
            </p>
          </div>

          <div className="p-3.5 bg-surface-card border border-hairline rounded-2xl">
            <span className="text-xs text-charcoal flex items-center gap-1.5">
              <Zap size={14} className="text-amber-500" /> EXP Earned
            </span>
            <p className="font-mono text-2xl font-black text-amber-600 mt-1">
              +{challenge.totalXpEarned || completedCount * 50}{' '}
              <span className="text-xs font-sans text-charcoal">XP</span>
            </p>
          </div>

          <div className="p-3.5 bg-surface-card border border-hairline rounded-2xl">
            <span className="text-xs text-charcoal flex items-center gap-1.5">
              <Heart size={14} className="text-red-500" /> Health Impact
            </span>
            <div className="flex items-center gap-2 mt-1 font-mono text-sm font-bold">
              <span className="text-emerald-600">
                +{challenge.totalHeartsGained || completedCount} ❤️
              </span>
              <span className="text-stone">/</span>
              <span className="text-red-600">
                -{challenge.totalHeartsLost || 0} ❤️
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-surface-card border border-hairline rounded-2xl">
            <span className="text-xs text-charcoal flex items-center gap-1.5">
              <TrendingUp size={14} className="text-blue-600" /> Survival Rate
            </span>
            <p className="font-mono text-2xl font-black text-blue-600 mt-1">
              {disciplineIntegrity}%
            </p>
          </div>
        </div>

        {/* 3. PROGRESS BAR & VICTORY BONUS TRACKER */}
        <div className="p-4 bg-surface-card border border-hairline rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-ink flex items-center gap-1.5">
              <Award size={15} className="text-amber-500" />
              Challenge Completion Trajectory
            </span>
            <span className="font-mono font-bold text-primary">
              Full Reward: +{projectedVictoryXp} XP & Full ❤️ Heal
            </span>
          </div>

          <div className="w-full bg-surface-bone h-3.5 rounded-full overflow-hidden border border-hairline">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${completionPct}%`,
                backgroundColor: vibrantColor,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-charcoal">
            <span>Start: {format(parseISO(challenge.startDate), 'dd MMM yyyy')}</span>
            <span>
              {failedCount === 0
                ? '🔥 Unbroken Zero-Excuse Record!'
                : `⚠️ ${failedCount} day(s) penalized (-90% HP each)`}
            </span>
            <span>Target End: {format(parseISO(challenge.endDate), 'dd MMM yyyy')}</span>
          </div>
        </div>

        {/* 4. DAY-BY-DAY CHALLENGE TIMELINE MATRIX */}
        <div className="p-4 bg-surface-card border border-hairline rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal flex items-center gap-1.5">
              <Calendar size={14} className="text-primary" /> Day-by-Day Execution Matrix (
              {targetDays} Days)
            </h4>
            <div className="flex items-center gap-3 text-[11px] font-semibold">
              <span className="flex items-center gap-1 text-badge-success">
                <CheckCircle2 size={12} /> Done ({completedCount})
              </span>
              <span className="flex items-center gap-1 text-red-600">
                <XCircle size={12} /> Failed ({failedCount})
              </span>
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 max-h-60 overflow-y-auto p-0.5">
            {challengeDays.map((d) => {
              const isDone = d.log?.status === 'COMPLETED';
              const isFailed = d.log?.status === 'FAILED';
              const isToday = isSameDay(d.dateObj, new Date());

              return (
                <div
                  key={d.dateKey}
                  className={clsx(
                    'p-2.5 rounded-xl border text-center flex flex-col items-center justify-center gap-0.5 transition-all',
                    isDone &&
                      'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold shadow-2xs',
                    isFailed &&
                      'bg-red-50 border-red-400 text-red-900 font-bold shadow-2xs',
                    !isDone &&
                      !isFailed &&
                      'bg-surface-bone/70 border-hairline text-charcoal',
                    isToday && 'ring-2 ring-primary ring-offset-1'
                  )}
                >
                  <span className="text-[10px] font-mono uppercase opacity-75">
                    Day {d.dayNumber}
                  </span>
                  <span className="font-mono text-xs font-black">
                    {format(d.dateObj, 'dd MMM')}
                  </span>
                  <span className="text-[10px] mt-0.5">
                    {isDone
                      ? '✓ +50 XP'
                      : isFailed
                      ? '✕ -90% ❤️'
                      : isToday
                      ? '● Today'
                      : '○ Pending'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. RULES REMINDER */}
        <div className="p-3.5 bg-red-50/70 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-900">
          <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <strong className="block">Active Hardcore Rules Contract:</strong>
            <span>
              1. Mandatory daily completion • 2. Missing even 1 task deducts 90% of your
              Health (Hearts) • 3. Zero excuses or reasons accepted.
            </span>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-hairline">
          <Button variant="dark" onClick={onClose}>
            Close Challenge Analytics
          </Button>
        </div>
      </div>
    </Modal>
  );
};
