import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { Challenge } from '../../types/habit';
import { CATEGORY_ICONS } from '../../constants/iconsAndColors';
import { boostVibrancy, getContrastIconColor } from '../../utils/colorUtils';
import { getTodayKey } from '../../utils/dateMath';
import { Button } from '../ui/Button';
import { CreateChallengeModal } from './CreateChallengeModal';
import { ChallengeDetailsModal } from './ChallengeDetailsModal';
import { SecurityModal } from '../security/SecurityModal';
import {
  Flame,
  Plus,
  Trophy,
  Heart,
  Zap,
  ShieldAlert,
  BarChart2,
  Check,
  AlertTriangle,
  Trash2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { addDays, format, parseISO } from 'date-fns';
import clsx from 'clsx';

export const ChallengesView: React.FC = () => {
  const {
    challenges,
    logChallengeDay,
    failChallengeDay,
    deleteChallenge,
    user,
  } = useAppStore();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [inspectedChallenge, setInspectedChallenge] = useState<Challenge | null>(null);
  const [challengeToDelete, setChallengeToDelete] = useState<Challenge | null>(null);
  const [penaltyToast, setPenaltyToast] = useState<string | null>(null);
  const autoEnforcedRef = useRef<Set<string>>(new Set());

  const activeDateKey = getTodayKey();

  // Auto-enforce Rule 2 (-90% Health Deduction) on any past day (startDate <= d < today) left incomplete/PARTIAL
  useEffect(() => {
    const today = getTodayKey();
    for (const c of challenges) {
      if (c.status === 'COMPLETED') continue;
      const targetDays = Math.max(1, c.targetDays || 7);
      for (let idx = 0; idx < targetDays; idx++) {
        const dKey = format(addDays(parseISO(c.startDate), idx), 'yyyy-MM-dd');
        if (dKey >= today) break; // Only inspect past days that have fully elapsed
        const log = c.dayLogs?.[dKey];
        const enforceKey = `${c.id}_${dKey}`;
        if (
          (!log || log.status === 'PARTIAL') &&
          !autoEnforcedRef.current.has(enforceKey)
        ) {
          autoEnforcedRef.current.add(enforceKey);
          failChallengeDay(c.id, dKey).then(() => {
            setPenaltyToast(
              `⚠️ Rule 2 Auto-Enforced on "${c.name}" (${dKey}): Missed day detected — 90% Health & 50 XP deducted!`
            );
          });
        }
      }
    }
  }, [challenges, failChallengeDay]);

  const activeChallenges = challenges.filter((c) => c.status !== 'COMPLETED');
  const completedChallenges = challenges.filter((c) => c.status === 'COMPLETED');

  // Aggregate Challenge Analytics
  const totalChallengeDaysCompleted = challenges.reduce((sum, c) => {
    const logs = Object.values(c.dayLogs || {});
    return sum + logs.filter((l) => l.status === 'COMPLETED').length;
  }, 0);

  const totalChallengeDaysFailed = challenges.reduce((sum, c) => {
    const logs = Object.values(c.dayLogs || {});
    return sum + logs.filter((l) => l.status === 'FAILED').length;
  }, 0);

  const totalChallengeXp = challenges.reduce(
    (sum, c) => sum + (c.totalXpEarned || 0),
    0
  );

  const overallSurvivalRate =
    totalChallengeDaysCompleted + totalChallengeDaysFailed > 0
      ? Math.round(
          (totalChallengeDaysCompleted /
            (totalChallengeDaysCompleted + totalChallengeDaysFailed)) *
            100
        )
      : 100;

  const handleToggleSubTask = async (
    challenge: Challenge,
    dateKey: string,
    taskId: string
  ) => {
    const dayLog = challenge.dayLogs?.[dateKey];
    if (dayLog?.status === 'COMPLETED' || dayLog?.status === 'FAILED') return;

    const currentIds = dayLog?.completedTaskIds || [];
    const exists = currentIds.includes(taskId);
    const nextIds = exists
      ? currentIds.filter((id) => id !== taskId)
      : [...currentIds, taskId];

    await logChallengeDay(challenge.id, dateKey, nextIds, false);
  };

  const handleTriggerFailPenalty = async (challenge: Challenge, dateKey: string) => {
    const currentHearts = user?.gamification?.hearts ?? 5;
    const lost = Number((currentHearts * 0.9).toFixed(2));
    await failChallengeDay(challenge.id, dateKey);
    setPenaltyToast(
      `⚠️ Rule 2 Enforced on "${challenge.name}": -90% Health (-${lost} ❤️) & -50 XP deducted! Zero excuses.`
    );
    setTimeout(() => setPenaltyToast(null), 6000);
  };

  return (
    <div className="space-y-6">
      {/* 1. HERO BANNER */}
      <div className="p-6 bg-gradient-to-br from-[#180a0a] via-[#231010] to-[#121212] text-white rounded-3xl border border-red-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
        <div>
          <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-500/40 px-3 py-1 rounded-full text-xs font-bold text-red-300 mb-2">
            <Flame size={14} className="text-red-400 fill-red-400" />
            <span>Hardcore Challenge Protocol • 90% Health Stake</span>
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight">
            Discipline Challenges
          </h2>
          <p className="text-white/75 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
            Commit to <strong>7, 9, 11, or Custom Days</strong>. Conquer every day to earn massive{' '}
            <strong className="text-amber-400">Willpower EXP &amp; Health ❤️</strong>. Miss even a single task and{' '}
            <strong className="text-red-400">90% of your Health is immediately deducted</strong> — zero excuses allowed.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          variant="primary"
          size="lg"
          className="self-start sm:self-auto gap-2 shrink-0 shadow-lg"
        >
          <Plus size={18} /> Add Challenge
        </Button>
      </div>

      {/* PENALTY ALERT TOAST */}
      {penaltyToast && (
        <div className="p-4 bg-red-950 text-white border-2 border-red-500 rounded-2xl flex items-center justify-between gap-3 shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold">
            <AlertTriangle size={20} className="text-red-400 shrink-0" />
            <span>{penaltyToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setPenaltyToast(null)}
            className="text-xs text-red-300 hover:text-white underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. CHALLENGE ANALYTICS OVERVIEW BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-surface-card border border-hairline rounded-2xl shadow-2xs">
          <span className="text-xs text-charcoal flex items-center gap-1.5">
            <Flame size={14} className="text-primary" /> Active Challenges
          </span>
          <p className="font-mono text-2xl sm:text-3xl font-black text-ink mt-1">
            {activeChallenges.length}
          </p>
        </div>

        <div className="p-4 bg-surface-card border border-hairline rounded-2xl shadow-2xs">
          <span className="text-xs text-charcoal flex items-center gap-1.5">
            <Trophy size={14} className="text-amber-500" /> Conquered
          </span>
          <p className="font-mono text-2xl sm:text-3xl font-black text-badge-success mt-1">
            {completedChallenges.length}
          </p>
        </div>

        <div className="p-4 bg-surface-card border border-hairline rounded-2xl shadow-2xs">
          <span className="text-xs text-charcoal flex items-center gap-1.5">
            <Zap size={14} className="text-amber-500" /> Challenge EXP
          </span>
          <p className="font-mono text-2xl sm:text-3xl font-black text-amber-600 mt-1">
            +{totalChallengeXp}
          </p>
        </div>

        <div className="p-4 bg-surface-card border border-hairline rounded-2xl shadow-2xs">
          <span className="text-xs text-charcoal flex items-center gap-1.5">
            <Heart size={14} className="text-red-500" /> Survival Rate
          </span>
          <p className="font-mono text-2xl sm:text-3xl font-black text-primary mt-1">
            {overallSurvivalRate}%
          </p>
        </div>
      </div>

      {/* 3. CHALLENGES LIST */}
      {challenges.length === 0 ? (
        <div className="text-center py-14 px-4 bg-surface-card border border-hairline rounded-3xl">
          <div className="w-16 h-16 rounded-full bg-red-50 text-primary flex items-center justify-center mx-auto mb-3">
            <Flame size={32} />
          </div>
          <h3 className="font-display font-bold text-xl text-ink">
            No Active Challenges Yet
          </h3>
          <p className="text-charcoal text-xs sm:text-sm mt-1 max-w-md mx-auto">
            Test your iron willpower. Start a 7, 9, 11, or Custom Day Challenge where missing a task costs 90% of your health and completing it rewards massive EXP &amp; Hearts!
          </p>
          <Button
            onClick={() => setIsCreateOpen(true)}
            variant="primary"
            size="md"
            className="mt-5 gap-1.5"
          >
            <Plus size={16} /> Add First Challenge
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {challenges.map((c) => {
            const IconComp =
              CATEGORY_ICONS.find((i) => i.id === c.icon)?.icon ||
              CATEGORY_ICONS[0].icon;
            const vibrantColor = boostVibrancy(c.color);
            const iconColor = getContrastIconColor(vibrantColor);

            const dayLogs = c.dayLogs || {};
            const completedDays = Object.values(dayLogs).filter(
              (l) => l.status === 'COMPLETED'
            ).length;
            const targetDays = Math.max(1, c.targetDays || 7);
            const pct = Math.min(100, Math.round((completedDays / targetDays) * 100));

            const todayLog = dayLogs[activeDateKey];
            const isTodayCompleted = todayLog?.status === 'COMPLETED';
            const isTodayFailed = todayLog?.status === 'FAILED';
            const hasSubTasks = Array.isArray(c.tasks) && c.tasks.length > 0;
            const todayCompletedTaskIds = todayLog?.completedTaskIds || [];

            // Mini day strip preview
            const dayPills = Array.from({ length: targetDays }).map((_, idx) => {
              const d = addDays(parseISO(c.startDate), idx);
              const k = format(d, 'yyyy-MM-dd');
              const l = dayLogs[k];
              return { dayNum: idx + 1, dateKey: k, status: l?.status };
            });

            return (
              <div
                key={c.id}
                className={clsx(
                  'bg-surface-card border-2 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between',
                  c.status === 'COMPLETED' && 'ring-2 ring-badge-success/40'
                )}
                style={{
                  borderColor: `${vibrantColor}45`,
                  borderTopWidth: '6px',
                  borderTopColor: vibrantColor,
                }}
              >
                <div className="space-y-4">
                  {/* TOP HEADER */}
                  <div className="flex items-start justify-between gap-2">
                    <div
                      onClick={() => setInspectedChallenge(c)}
                      className="flex items-center gap-3 cursor-pointer group min-w-0"
                    >
                      <span
                        className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs"
                        style={{ backgroundColor: vibrantColor, color: iconColor }}
                      >
                        <IconComp size={22} strokeWidth={2.5} />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-ink text-white whitespace-nowrap">
                            {targetDays} Days
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 whitespace-nowrap">
                            ⚠️ -90% ❤️ Stake
                          </span>
                          {c.status === 'COMPLETED' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 whitespace-nowrap">
                              🏆 Completed
                            </span>
                          )}
                        </div>
                        <h3 className="font-display font-bold text-lg text-ink tracking-tight truncate group-hover:text-primary transition-colors mt-1">
                          {c.name}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setInspectedChallenge(c)}
                        className="p-1.5 text-charcoal hover:text-ink hover:bg-surface-bone rounded-full transition-colors"
                        title="View Challenge Analytics"
                      >
                        <BarChart2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setChallengeToDelete(c)}
                        className="p-1.5 text-stone hover:text-red-500 hover:bg-surface-bone rounded-full transition-colors"
                        title="Delete Challenge"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* PROGRESS BAR */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-charcoal font-semibold">
                        Progress:{' '}
                        <strong className="text-ink">
                          {completedDays} / {targetDays} Days
                        </strong>
                      </span>
                      <span className="font-extrabold text-primary">{pct}%</span>
                    </div>
                    <div className="w-full bg-surface-bone h-2.5 rounded-full overflow-hidden border border-hairline">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: vibrantColor }}
                      />
                    </div>
                  </div>

                  {/* DAY PILLS MATRIX STRIP */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                    {dayPills.map((dp) => {
                      const isDone = dp.status === 'COMPLETED';
                      const isFail = dp.status === 'FAILED';
                      const isSelectedDay = dp.dateKey === activeDateKey;
                      return (
                        <div
                          key={dp.dateKey}
                          onClick={() => setInspectedChallenge(c)}
                          className={clsx(
                            'w-8 h-8 rounded-xl font-mono text-[11px] font-bold flex flex-col items-center justify-center shrink-0 border cursor-pointer transition-all',
                            isDone &&
                              'bg-badge-success text-white border-badge-success shadow-2xs',
                            isFail && 'bg-red-600 text-white border-red-600 shadow-2xs',
                            !isDone &&
                              !isFail &&
                              'bg-surface-bone text-charcoal border-hairline',
                            isSelectedDay && 'ring-2 ring-ink ring-offset-1'
                          )}
                          title={`Day ${dp.dayNum} (${dp.dateKey})`}
                        >
                          <span>D{dp.dayNum}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* SUB-TASKS CHECKLIST IF CONFIGURED */}
                  {hasSubTasks && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal block">
                        Mandatory Daily Tasks ({todayCompletedTaskIds.length}/{c.tasks.length}):
                      </span>
                      {c.tasks.map((task) => {
                        const isChecked =
                          isTodayCompleted || todayCompletedTaskIds.includes(task.id);
                        return (
                          <div
                            key={task.id}
                            onClick={() =>
                              handleToggleSubTask(c, activeDateKey, task.id)
                            }
                            className={clsx(
                              'flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all',
                              isChecked
                                ? 'bg-emerald-50/60 border-emerald-300 text-charcoal line-through'
                                : 'bg-surface-bone/70 border-hairline text-ink hover:bg-stone/20'
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                readOnly
                                className="rounded-full text-badge-success focus:ring-0 cursor-pointer"
                              />
                              <span className="font-medium">{task.text}</span>
                            </div>
                            <span className="text-[10px] font-mono text-stone">
                              Required
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* BOTTOM ACTION AREA */}
                <div className="pt-3.5 mt-4 border-t border-hairline flex items-center justify-between gap-2">
                  {isTodayCompleted ? (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-badge-success flex items-center gap-1.5">
                        <CheckCircle2 size={16} /> Completed for {activeDateKey} (+50 XP &amp; +1 ❤️)
                      </span>
                      <button
                        type="button"
                        onClick={() => setInspectedChallenge(c)}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        Analytics
                      </button>
                    </div>
                  ) : isTodayFailed ? (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-red-600 flex items-center gap-1.5">
                        <XCircle size={16} /> Failed on {activeDateKey} (-90% ❤️ Deducted)
                      </span>
                      <button
                        type="button"
                        onClick={() => setInspectedChallenge(c)}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        Analytics
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* FAIL BUTTON: NO EXCUSES, IMMEDIATE -90% HEALTH DEDUCTION */}
                      <button
                        type="button"
                        onClick={() => handleTriggerFailPenalty(c, activeDateKey)}
                        className="px-3 py-2 rounded-full bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                        title="No excuses allowed. Deducts 90% of your current Health!"
                      >
                        <ShieldAlert size={14} className="text-red-600 shrink-0" />
                        <span>Missed (-90% ❤️)</span>
                      </button>

                      {/* COMPLETE TODAY BUTTON */}
                      <button
                        type="button"
                        onClick={() =>
                          logChallengeDay(c.id, activeDateKey, undefined, true)
                        }
                        className="px-4 py-2 rounded-full bg-badge-success hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                      >
                        <Check size={15} className="stroke-[3]" />
                        <span>Complete Day (+50 XP &amp; ❤️)</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE CHALLENGE MODAL (+ RULES DISCLAIMER POPUP) */}
      <CreateChallengeModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      {/* CHALLENGE ANALYTICS MODAL */}
      <ChallengeDetailsModal
        challenge={
          inspectedChallenge
            ? challenges.find((c) => c.id === inspectedChallenge.id) ||
              inspectedChallenge
            : null
        }
        isOpen={Boolean(inspectedChallenge)}
        onClose={() => setInspectedChallenge(null)}
        onDelete={(chl) => {
          setInspectedChallenge(null);
          setChallengeToDelete(chl);
        }}
      />

      {/* SECURITY MODAL FOR DELETING A CHALLENGE */}
      <SecurityModal
        isOpen={Boolean(challengeToDelete)}
        onClose={() => setChallengeToDelete(null)}
        title="Confirm Challenge Deletion"
        actionTitle={`Permanently delete challenge "${challengeToDelete?.name}"`}
        isDanger={true}
        onSuccess={async () => {
          if (challengeToDelete) {
            await deleteChallenge(challengeToDelete.id);
            setChallengeToDelete(null);
          }
        }}
      />
    </div>
  );
};
