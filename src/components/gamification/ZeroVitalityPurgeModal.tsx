import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '../../stores/useAppStore';
import { Skull, AlertTriangle, ShieldAlert, RefreshCw, HeartPulse, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { SecurityModal } from '../security/SecurityModal';

export const ZeroVitalityPurgeModal: React.FC = () => {
  const { user, currentUser, softResetAccount, resetEntireAccount } = useAppStore();

  const hearts = user?.gamification?.hearts;
  const isZeroLives =
    Boolean(currentUser) &&
    Boolean(user?.isOnboarded) &&
    typeof hearts === 'number' &&
    hearts <= 0;

  const [secondsLeft, setSecondsLeft] = useState(10);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullWipeSecurityOpen, setIsFullWipeSecurityOpen] = useState(false);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (!isZeroLives) {
      setSecondsLeft(10);
      setIsProcessing(false);
      setError(null);
      hasTriggeredRef.current = false;
      return;
    }

    // Trigger red hazard confetti burst when entering zero vitality
    try {
      confetti({
        particleCount: 50,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#ea2804', '#7f1d1d', '#000000', '#f59e0b'],
      });
    } catch (e) {
      // Ignore confetti if not loaded
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isZeroLives]);

  // Separate effect for triggering when countdown hits 0 (avoids stale closures and updater side effects)
  useEffect(() => {
    if (isZeroLives && secondsLeft === 0 && !hasTriggeredRef.current && !error) {
      handleSoftReset();
    }
  }, [secondsLeft, isZeroLives, error]);

  const handleSoftReset = async () => {
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;
    setIsProcessing(true);
    setError(null);

    try {
      await softResetAccount();
    } catch (err: any) {
      console.error('Failed to revive account vitality:', err);
      setIsProcessing(false);
      setError(err?.message || 'Failed to revive vitality. Please check your connection and retry.');
    }
  };

  const handleRetry = () => {
    hasTriggeredRef.current = false;
    handleSoftReset();
  };

  if (!isZeroLives) return null;

  const modalContent = (
    <div
      role="alertdialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] bg-[#0c0505] text-white flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden select-none animate-in fade-in duration-300"
    >
      {/* Background Red Warning Ambient Glow */}
      <div className="absolute inset-0 bg-radial from-red-600/20 via-transparent to-black pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-amber-500 to-red-600 animate-pulse" />

      {/* Main Revival Container */}
      <div className="relative z-10 w-full max-w-lg bg-[#180a0a] border-2 border-red-600/60 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(234,40,4,0.35)] text-center space-y-6">
        {/* Pulsing Skull Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-red-950/80 border-2 border-red-500 flex items-center justify-center text-red-500 shadow-[0_0_30px_rgba(234,40,4,0.6)] animate-pulse">
              <Skull size={48} className="stroke-[2.2]" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-black shadow-md border-2 border-[#180a0a]">
              0
            </div>
          </div>
        </div>

        {/* Header Titles */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono font-bold uppercase tracking-wider">
            <AlertTriangle size={13} className="text-red-500 shrink-0" />
            <span>0 Vitality &bull; Disciplinary Revival</span>
          </div>

          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight uppercase">
            Discipline Broken
          </h2>
          <p className="text-stone text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
            All your hearts have reached <strong className="text-red-400">0</strong>. A disciplinary Soft Reset will revive your vitality so you can get back on track.
          </p>
        </div>

        {/* 10-Second Digital Countdown Display */}
        <div className="p-5 bg-black/60 border border-red-900/60 rounded-2xl space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-widest text-red-400 block">
            Automatic Revival In
          </span>

          <div className="font-mono font-black text-6xl sm:text-7xl text-red-500 tracking-tight flex items-center justify-center gap-1 drop-shadow-[0_0_20px_rgba(234,40,4,0.6)]">
            <span>00:</span>
            <span>{String(secondsLeft).padStart(2, '0')}</span>
          </div>

          {/* Smooth Depleting Progress Bar */}
          <div className="w-full bg-red-950/80 rounded-full h-2.5 overflow-hidden border border-red-900/50">
            <div
              className="bg-gradient-to-r from-red-600 to-amber-500 h-full rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${(secondsLeft / 10) * 100}%` }}
            />
          </div>
        </div>

        {/* Consequence Description */}
        <div className="text-[11px] text-stone/80 text-left bg-red-950/20 border border-red-900/40 rounded-xl p-3 space-y-1">
          <p className="font-bold text-red-300 flex items-center gap-1.5">
            <ShieldAlert size={14} className="text-red-500 shrink-0" />
            <span>Soft Reset Protocol:</span>
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-stone/90 pl-1">
            <li>Your habits, categories, and logs remain completely safe.</li>
            <li>Hearts are restored to full vitality (5/5).</li>
            <li>A 100 XP penalty is applied for broken discipline.</li>
          </ul>
        </div>

        {/* Error Alert with Retry Button */}
        {error && (
          <div className="p-3 bg-red-950/80 border border-red-500 rounded-xl text-left space-y-2">
            <p className="text-xs text-red-300 flex items-center gap-1.5 font-bold">
              <AlertTriangle size={14} className="text-red-400 shrink-0" />
              <span>{error}</span>
            </p>
            <button
              type="button"
              onClick={handleRetry}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Retry Revival
            </button>
          </div>
        )}

        {/* Immediate Revival Action Button */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleSoftReset}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-sm h-12 px-6 rounded-full shadow-lg transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Restoring Vitality...</span>
              </>
            ) : (
              <>
                <HeartPulse size={16} />
                <span>Revive Now (Skip Countdown)</span>
              </>
            )}
          </button>

          {/* Optional Full Account Wipe behind Security Check */}
          <div>
            <button
              type="button"
              onClick={() => setIsFullWipeSecurityOpen(true)}
              className="text-stone/60 hover:text-red-400 text-xs font-medium underline-offset-2 hover:underline transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <Trash2 size={12} />
              <span>Want a fresh start? Perform full account wipe</span>
            </button>
          </div>
        </div>
      </div>

      {/* Security Modal Guard for Full Account Wipe */}
      <SecurityModal
        isOpen={isFullWipeSecurityOpen}
        onClose={() => setIsFullWipeSecurityOpen(false)}
        title="Authorize Full Account Wipe"
        actionTitle="Permanently Delete All Habits, History, and Reset to Onboarding"
        isDanger
        onSuccess={async () => {
          setIsProcessing(true);
          await resetEntireAccount();
        }}
      />
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};
