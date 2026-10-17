import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Heart, Zap, ShieldAlert, Clock, Sparkles, Trophy, CheckCircle2, ShieldCheck, Skull } from 'lucide-react';
import {
  XP_LOSS_PER_HEART,
  MIDNIGHT_MISSED_HABIT_XP_PENALTY,
  MISS_PENALTIES,
} from '../../constants/gamification';

interface PointsSystemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PointsSystemModal: React.FC<PointsSystemModalProps> = ({
  isOpen,
  onClose,
}) => {
  const maxMonthlyExcuses = MISS_PENALTIES.GENUINE_REASON.maxPerMonth;

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
            How Points, Hearts &amp; Rules Work
          </h3>
          <p className="text-charcoal text-xs mt-1">
            Crystal clear rules so anyone can understand! Follow these to keep your vitality and streaks alive.
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
              You start with <strong>5 Hearts</strong>! As your willpower rank grows, your max hearts increase. If you ever hit <strong>0 Hearts</strong>, your streak rank fractures into Zero Vitality mode!
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
              Every time you complete a habit, you earn <strong>XP</strong>! XP levels up your profile from Initiate to Centurion and Legendary Monk.
            </p>
          </div>
        </div>

        {/* 3. EXCUSE SHIELD */}
        <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h4 className="font-bold text-sm text-blue-900 flex items-center gap-1.5">
              3. Genuine Excuse Shield (3 Freezes / Month) 🛡️
            </h4>
            <p className="text-xs text-blue-800/90 mt-0.5 leading-relaxed">
              Life happens! If you are sick or traveling, you get <strong>{maxMonthlyExcuses} Genuine Excuse shields</strong> per month. Logging a valid reason preserves your streak with <strong>0 XP penalty</strong> and <strong>0 Hearts lost</strong>.
            </p>
          </div>
        </div>

        {/* 4. THE 350 XP RULE */}
        <div className="p-3.5 bg-rose-100/70 border-2 border-rose-300 rounded-2xl flex items-start gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h4 className="font-black text-sm text-rose-950 flex items-center gap-1.5">
              4. Midnight Lock &amp; The -{XP_LOSS_PER_HEART} XP Rule 🚨
            </h4>
            <p className="text-xs text-rose-900 mt-0.5 leading-relaxed">
              Today's habits must be completed <strong>TODAY</strong>! At 12:00 midnight, past days lock permanently. Uncompleted tasks drop -{MIDNIGHT_MISSED_HABIT_XP_PENALTY} XP each.
              <br />
              <strong className="text-rose-950 underline decoration-rose-400">
                For every {XP_LOSS_PER_HEART} XP you lose, exactly 1 Heart is deducted (-1 Heart)!
              </strong>
            </p>
            <div className="mt-2 inline-flex items-center gap-2 bg-white/80 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold text-rose-900 border border-rose-200">
              <span>-{XP_LOSS_PER_HEART} XP = -1 ❤️</span>
              <span>•</span>
              <span>-{XP_LOSS_PER_HEART * 2} XP = -2 ❤️</span>
            </div>
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

        {/* 6. ZERO VITALITY WARNING */}
        <div className="p-3.5 bg-stone/20 border border-hairline rounded-2xl flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-ink text-white flex items-center justify-center shrink-0 shadow-xs">
            <Skull size={20} className="text-red-400" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-ink flex items-center gap-1.5">
              6. What Happens at 0 Hearts? ⚡
            </h4>
            <p className="text-xs text-charcoal mt-0.5 leading-relaxed">
              If all hearts are lost, your profile enters <strong>Zero Vitality</strong>. You must complete a discipline recovery check or use the vitality revival protocol to restore your journey!
            </p>
          </div>
        </div>

        {/* 7. JUST TRACKING & CHALLENGES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3 bg-surface-card border border-hairline rounded-2xl">
            <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
              <Sparkles size={14} className="text-amber-500" />
              <span>Just Tracking</span>
            </div>
            <p className="text-[11px] text-charcoal mt-1 leading-relaxed">
              Zero pressure mode! These habits never deduct XP or Hearts and cannot break your streak.
            </p>
          </div>

          <div className="p-3 bg-surface-card border border-hairline rounded-2xl">
            <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
              <Trophy size={14} className="text-rose-600" />
              <span>Challenges</span>
            </div>
            <p className="text-[11px] text-charcoal mt-1 leading-relaxed">
              7, 9, or 11-day hard commitments. Finish all days to win massive XP and archive conquered victories.
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
