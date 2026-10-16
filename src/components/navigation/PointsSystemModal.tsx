import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Heart, Zap, ShieldAlert, Clock, Sparkles, Trophy, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface PointsSystemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PointsSystemModal: React.FC<PointsSystemModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Points & Rules Guide"
      maxWidth="xl"
    >
      <div className="space-y-4 text-ink">
        {/* HERO BADGE */}
        <div className="text-center p-4 bg-gradient-to-r from-red-500/10 via-amber-500/10 to-emerald-500/10 rounded-2xl border border-hairline">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-card border border-hairline text-xs font-bold text-primary mb-1 shadow-2xs">
            <Sparkles size={14} className="text-amber-500" />
            <span>Super Simple Guide</span>
          </div>
          <h3 className="font-display font-black text-xl text-ink tracking-tight">
            How Points &amp; Hearts Work
          </h3>
          <p className="text-charcoal text-xs mt-1">
            Simple rules so anyone can understand! Follow these to keep your streak alive.
          </p>
        </div>

        {/* 1. HEARTS */}
        <div className="p-3.5 bg-red-50/70 border border-red-200/80 rounded-2xl flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Heart size={20} className="fill-white" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-red-900 flex items-center gap-1.5">
              1. Hearts = Your Lives ❤️
            </h4>
            <p className="text-xs text-red-800/90 mt-0.5 leading-relaxed">
              You start with <strong>5 Hearts</strong>, just like in a video game! Hearts protect your journey. If you lose all your hearts, you run out of vitality!
            </p>
          </div>
        </div>

        {/* 2. XP */}
        <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Zap size={20} className="fill-white" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-amber-900 flex items-center gap-1.5">
              2. XP = Magic Energy ⚡
            </h4>
            <p className="text-xs text-amber-800/90 mt-0.5 leading-relaxed">
              Every time you do a habit, you earn <strong>XP</strong>! XP levels you up from an Initiate to an Iron Will Legend.
            </p>
          </div>
        </div>

        {/* 3. THE 350 XP RULE */}
        <div className="p-3.5 bg-rose-100/70 border-2 border-rose-300 rounded-2xl flex items-start gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h4 className="font-black text-sm text-rose-950 flex items-center gap-1.5">
              3. The -350 XP Rule (Very Important!) 🚨
            </h4>
            <p className="text-xs text-rose-900 mt-0.5 leading-relaxed">
              If you forget or skip your daily habits, your XP drops. 
              <br />
              <strong className="text-rose-950 underline decoration-rose-400">
                For every 350 XP you lose, 1 Heart is deducted (-1 Heart)!
              </strong>
            </p>
            <div className="mt-2 inline-flex items-center gap-2 bg-white/80 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold text-rose-900 border border-rose-200">
              <span>-350 XP = -1 ❤️</span>
              <span>•</span>
              <span>-700 XP = -2 ❤️</span>
            </div>
          </div>
        </div>

        {/* 4. MIDNIGHT RULE */}
        <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Clock size={20} />
          </div>
          <div>
            <h4 className="font-bold text-sm text-blue-900 flex items-center gap-1.5">
              4. Midnight Lock (12:00 AM) 🕛
            </h4>
            <p className="text-xs text-blue-800/90 mt-0.5 leading-relaxed">
              Today's habits must be marked <strong>TODAY</strong>! Once the clock hits 12:00 midnight, yesterday is locked. You can look at it, but cannot change it. Unfinished tasks count as missed and drop your XP!
            </p>
          </div>
        </div>

        {/* 5. SUPER BONUS (100% PERFECT DAY) */}
        <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <h4 className="font-bold text-sm text-emerald-900 flex items-center gap-1.5">
              5. Perfect Day Bonus (+100 XP &amp; +1 Heart) 🌟
            </h4>
            <p className="text-xs text-emerald-800/90 mt-0.5 leading-relaxed">
              Complete <strong>100% of your daily habits</strong> on the same day to earn a massive <strong>+100 Bonus XP</strong> and heal <strong>+1 Heart</strong> back!
            </p>
          </div>
        </div>

        {/* 6. JUST TRACKING & CHALLENGES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3 bg-surface-card border border-hairline rounded-2xl">
            <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
              <Sparkles size={14} className="text-amber-500" />
              <span>Just Tracking</span>
            </div>
            <p className="text-[11px] text-charcoal mt-1 leading-relaxed">
              Practice mode! These habits never deduct XP or Hearts. Zero penalty, zero stress.
            </p>
          </div>

          <div className="p-3 bg-surface-card border border-hairline rounded-2xl">
            <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
              <Trophy size={14} className="text-rose-600" />
              <span>Challenges</span>
            </div>
            <p className="text-[11px] text-charcoal mt-1 leading-relaxed">
              7, 9, or 11-day missions. Finish all days to win huge XP and enshrine your victory in the Archive!
            </p>
          </div>
        </div>

        {/* DISMISS BUTTON */}
        <div className="pt-2">
          <Button
            onClick={onClose}
            variant="primary"
            size="lg"
            className="w-full text-sm font-bold shadow-sm"
          >
            Got It! Let's Conquer Today 🚀
          </Button>
        </div>
      </div>
    </Modal>
  );
};
