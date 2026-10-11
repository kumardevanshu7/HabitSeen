import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '../../stores/useAppStore';
import { Skull, AlertTriangle, Flame, ShieldAlert, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

export const ZeroVitalityPurgeModal: React.FC = () => {
  const { user, currentUser, resetEntireAccount } = useAppStore();

  const hearts = user?.gamification?.hearts;
  const isZeroLives =
    Boolean(currentUser) &&
    Boolean(user?.isOnboarded) &&
    typeof hearts === 'number' &&
    hearts <= 0;

  const [secondsLeft, setSecondsLeft] = useState(10);
  const [isPurging, setIsPurging] = useState(false);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (!isZeroLives) {
      setSecondsLeft(10);
      setIsPurging(false);
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
          handleExecutePurge();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isZeroLives]);

  const handleExecutePurge = async () => {
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;
    setIsPurging(true);

    try {
      await resetEntireAccount();
    } catch (err) {
      console.error('Failed to purge account:', err);
      setIsPurging(false);
      hasTriggeredRef.current = false;
    }
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

      {/* Main Purge Container */}
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
            <span>0 Vitality &bull; System Purge</span>
          </div>

          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight uppercase">
            Discipline Broken
          </h2>
          <p className="text-stone text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
            All your hearts have reached <strong className="text-red-400">0</strong>. As per the Hardcore Protocol, an uncompromising clean wipe begins now.
          </p>
        </div>

        {/* 10-Second Digital Countdown Display */}
        <div className="p-5 bg-black/60 border border-red-900/60 rounded-2xl space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-widest text-red-400 block">
            Complete Account Wipe & Fresh Start In
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
            <span>What happens during this purge?</span>
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-stone/90 pl-1">
            <li>All active habits & logs are permanently deleted from Firestore.</li>
            <li>All streak records & habit break stopwatches are wiped clean.</li>
            <li>Your account returns to Onboarding for a fresh, rebirth start.</li>
          </ul>
        </div>

        {/* Immediate Purge Action Button */}
        <div>
          <button
            type="button"
            onClick={handleExecutePurge}
            disabled={isPurging}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-sm h-12 px-6 rounded-full shadow-lg transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            {isPurging ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Purging All Data & Restarting...</span>
              </>
            ) : (
              <>
                <Flame size={16} />
                <span>Wipe Data Now (Skip Countdown)</span>
              </>
            )}
          </button>
          <p className="text-[10px] text-stone/50 mt-2">
            No recovery. No undo. True discipline requires real stakes.
          </p>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};
