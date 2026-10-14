import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { Habit, MissedReasonType } from '../../types/habit';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ShieldCheck, AlertTriangle, XCircle, Heart, Zap, ShieldAlert, Lock, Unlock } from 'lucide-react';
import clsx from 'clsx';
import confetti from 'canvas-confetti';
import { getUsedExcusesInMonth } from '../../utils/streakEngine';
import { MISS_PENALTIES } from '../../constants/gamification';

interface LogMissedModalProps {
  isOpen: boolean;
  onClose: () => void;
  habit: Habit;
  dateKey: string;
}

export const LogMissedModal: React.FC<LogMissedModalProps> = ({
  isOpen,
  onClose,
  habit,
  dateKey,
}) => {
  const { logMissedHabit, logHabit, logs } = useAppStore();

  const logKey = `${habit.id}_${dateKey}`;
  const existingLog = logs[logKey];

  const monthKey = dateKey.substring(0, 7);
  const usedExcuses = getUsedExcusesInMonth(habit.id, monthKey, logs);
  const maxExcuses = MISS_PENALTIES.GENUINE_REASON.maxPerMonth;
  const excusesRemaining = Math.max(0, maxExcuses - usedExcuses);
  const isCapReached = excusesRemaining <= 0 && existingLog?.missedReasonType !== 'GENUINE_REASON';

  const [selectedReason, setSelectedReason] = useState<MissedReasonType>(() => {
    if (existingLog?.missedReasonType) return existingLog.missedReasonType;
    if (existingLog?.status === 'EXCUSED') return 'GENUINE_REASON';
    if (existingLog?.status === 'FAILED') return 'INTENTIONAL_MISS';
    return isCapReached ? 'FORGOT_ACCIDENTAL' : 'GENUINE_REASON';
  });
  const [reasonText, setReasonText] = useState(
    () => existingLog?.missedReasonText || existingLog?.notes || ''
  );
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (existingLog?.missedReasonType) {
        setSelectedReason(existingLog.missedReasonType);
      } else if (existingLog?.status === 'EXCUSED') {
        setSelectedReason('GENUINE_REASON');
      } else if (existingLog?.status === 'FAILED') {
        setSelectedReason('INTENTIONAL_MISS');
      }
      setReasonText(existingLog?.missedReasonText || existingLog?.notes || '');
      setError('');
    }
  }, [isOpen, existingLog]);

  const handleUnlockAndReset = async () => {
    setIsSubmitting(true);
    try {
      await logHabit(habit.id, dateKey, {
        valueYesNo: false,
        valueNumeric: 0,
        valueTimerSeconds: 0,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to unlock habit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (selectedReason === 'GENUINE_REASON') {
      if (isCapReached) {
        setError('Monthly excuse cap reached (3 of 3 used). Please choose another option.');
        return;
      }
      if (reasonText.trim().length < 5) {
        setError('Please write at least 5 characters explaining your reason to preserve streak.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await logMissedHabit(
        habit.id,
        dateKey,
        selectedReason,
        reasonText.trim()
      );

      if (selectedReason === 'GENUINE_REASON') {
        // Trigger small gentle star confetti celebrating honesty and preserved streak
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#3B82F6', '#10B981', '#6366F1'],
        });
      }

      onClose();
    } catch (err: any) {
      console.error('Error logging missed habit:', err);
      setError(err.message || 'Failed to record missed habit');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Log Missed — ${habit.name}`}
      subtitle="Honesty builds genuine discipline. Choose what happened today."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
            {error}
          </div>
        )}

        {/* 3 REASON OPTIONS */}
        <div className="space-y-2.5">
          {/* OPTION 1: GENUINE REASON (PRESERVE STREAK) */}
          <button
            type="button"
            disabled={isCapReached}
            onClick={() => {
              if (isCapReached) return;
              setSelectedReason('GENUINE_REASON');
              setError('');
            }}
            className={clsx(
              'w-full p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-3.5 shadow-2xs',
              isCapReached
                ? 'border-hairline bg-surface-bone/50 opacity-60 cursor-not-allowed'
                : selectedReason === 'GENUINE_REASON'
                ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20'
                : 'border-hairline bg-surface-card hover:bg-surface-bone'
            )}
          >
            <div
              className={clsx(
                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs',
                isCapReached
                  ? 'bg-stone/30 text-charcoal'
                  : selectedReason === 'GENUINE_REASON'
                  ? 'bg-blue-600 text-white'
                  : 'bg-surface-bone text-charcoal'
              )}
            >
              {isCapReached ? <Lock size={20} /> : <ShieldCheck size={22} />}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-bold text-ink">Genuine Reason (Life Happened)</h4>
                <span
                  className={clsx(
                    'text-[10px] font-extrabold px-2 py-0.5 rounded-full border shrink-0',
                    isCapReached
                      ? 'text-charcoal bg-stone/20 border-stone/30'
                      : 'text-blue-700 bg-blue-100 border-blue-200'
                  )}
                >
                  {isCapReached
                    ? '🔒 Cap Reached (3/3 Used)'
                    : `🛡️ ${excusesRemaining} of ${maxExcuses} Left`}
                </span>
              </div>
              <p className="text-xs text-charcoal mt-1 leading-relaxed">
                Traveling, unwell, doctor appointment, or emergency.
              </p>
              <div className="flex items-center gap-3 text-[11px] font-semibold text-blue-600 mt-2">
                <span className="flex items-center gap-1">
                  <Zap size={12} /> {MISS_PENALTIES.GENUINE_REASON.xpPenalty} XP Penalty (Preserved)
                </span>
                <span className="flex items-center gap-1">
                  <Heart size={12} className="fill-blue-500" /> {MISS_PENALTIES.GENUINE_REASON.heartsLost} Hearts Lost
                </span>
              </div>
            </div>
          </button>

          {/* OPTION 2: FORGOT / ACCIDENTAL */}
          <button
            type="button"
            onClick={() => {
              setSelectedReason('FORGOT_ACCIDENTAL');
              setError('');
            }}
            className={clsx(
              'w-full p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-3.5 shadow-2xs',
              selectedReason === 'FORGOT_ACCIDENTAL'
                ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20'
                : 'border-hairline bg-surface-card hover:bg-surface-bone'
            )}
          >
            <div
              className={clsx(
                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs',
                selectedReason === 'FORGOT_ACCIDENTAL'
                  ? 'bg-amber-600 text-white'
                  : 'bg-surface-bone text-charcoal'
              )}
            >
              <AlertTriangle size={22} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-bold text-ink">Forgot / Slipped Mind</h4>
                <span className="text-[10px] font-extrabold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200 shrink-0">
                  ⚠️ Minor Penalty
                </span>
              </div>
              <p className="text-xs text-charcoal mt-1 leading-relaxed">
                Got distracted and forgot to execute before the day ended.
              </p>
              <div className="flex items-center gap-3 text-[11px] font-semibold text-amber-700 mt-2">
                <span className="flex items-center gap-1">
                  <Zap size={12} /> -{MISS_PENALTIES.FORGOT_ACCIDENTAL.xpPenalty} XP Penalty
                </span>
                <span className="flex items-center gap-1 text-red-600">
                  <Heart size={12} className="fill-red-500" /> -{MISS_PENALTIES.FORGOT_ACCIDENTAL.heartsLost} Heart Lost
                </span>
              </div>
            </div>
          </button>

          {/* OPTION 3: INTENTIONAL MISS / PROCRASTINATED */}
          <button
            type="button"
            onClick={() => {
              setSelectedReason('INTENTIONAL_MISS');
              setError('');
            }}
            className={clsx(
              'w-full p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-3.5 shadow-2xs',
              selectedReason === 'INTENTIONAL_MISS'
                ? 'border-red-500 bg-red-50/50 ring-2 ring-red-500/20'
                : 'border-hairline bg-surface-card hover:bg-surface-bone'
            )}
          >
            <div
              className={clsx(
                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs',
                selectedReason === 'INTENTIONAL_MISS'
                  ? 'bg-red-600 text-white'
                  : 'bg-surface-bone text-charcoal'
              )}
            >
              <XCircle size={22} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-bold text-ink">Intentional Skip / Procrastinated</h4>
                <span className="text-[10px] font-extrabold text-red-700 bg-red-100 px-2 py-0.5 rounded-full border border-red-200 shrink-0">
                  ❌ Major Penalty
                </span>
              </div>
              <p className="text-xs text-charcoal mt-1 leading-relaxed">
                Had the chance but chose comfort over discipline.
              </p>
              <div className="flex items-center gap-3 text-[11px] font-semibold text-red-700 mt-2">
                <span className="flex items-center gap-1">
                  <Zap size={12} /> -{MISS_PENALTIES.INTENTIONAL_MISS.xpPenalty} XP Penalty
                </span>
                <span className="flex items-center gap-1 text-red-600">
                  <Heart size={12} className="fill-red-500" /> -{MISS_PENALTIES.INTENTIONAL_MISS.heartsLost} Heart Lost
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* DYNAMIC TEXTBOX FOR GENUINE REASON */}
        {selectedReason === 'GENUINE_REASON' && (
          <div className="p-4 bg-blue-50/60 border border-blue-200/80 rounded-2xl space-y-2 animate-in fade-in duration-200">
            <label className="block text-xs font-bold text-blue-900">
              Please enter your genuine reason:
            </label>
            <textarea
              rows={2}
              required
              value={reasonText}
              onChange={(e) => {
                setReasonText(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. Main bahar tha, supplements pass mein nahi the / fever tha..."
              className="w-full text-xs sm:text-sm p-3 bg-white text-ink border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none shadow-2xs"
              autoFocus
            />
            <p className="text-[11px] text-blue-800/80">
              💡 Your streak will stay preserved and a protective shield badge will appear on your habit timeline.
            </p>
          </div>
        )}

        {/* ACTIONS */}
        <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-hairline">
          {existingLog &&
          (existingLog.status === 'EXCUSED' ||
            existingLog.status === 'MISSED' ||
            existingLog.status === 'FAILED') ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUnlockAndReset}
              disabled={isSubmitting}
              className="text-primary hover:text-primary-deep gap-1.5"
              title="Remove missed/excused status and unlock task"
            >
              <Unlock size={14} /> Unlock Task
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={selectedReason === 'GENUINE_REASON' ? 'primary' : 'danger'}
              size="md"
              disabled={isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                'Recording...'
              ) : selectedReason === 'GENUINE_REASON' ? (
                <>
                  <ShieldCheck size={16} /> Save Reason & Keep Streak
                </>
              ) : (
                <>
                  <ShieldAlert size={16} /> Confirm Missed Habit
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
