import React, { useMemo } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { computeUserAchievements } from '../../constants/achievements';
import { BrandLegalTab } from '../brand/BrandLegalModal';
import {
  Trophy,
  Flame,
  Award,
  Zap,
  Heart,
  ShieldAlert,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface DashboardFooterProps {
  onOpenAchievements: () => void;
  onOpenBrandLegal: (tab: BrandLegalTab) => void;
}

export const DashboardFooter: React.FC<DashboardFooterProps> = ({
  onOpenAchievements,
  onOpenBrandLegal,
}) => {
  const { habits, logs, user, habitBreaks, categories } = useAppStore();

  const { unlockedCount, totalCount, percentageUnlocked } = useMemo(() => {
    return computeUserAchievements({ habits, logs, user, habitBreaks, categories });
  }, [habits, logs, user, habitBreaks, categories]);

  return (
    <footer className="w-full mt-12 border-t border-hairline bg-surface-card/60 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        {/* 1. 100 ACHIEVEMENTS SHOWCASE BANNER */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/10 via-surface-card to-primary/5 border border-amber-200/70 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0">
                <Trophy size={30} strokeWidth={2.2} />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="font-display font-black text-xl sm:text-2xl text-ink tracking-tight">
                    100 Mastery Achievements
                  </h3>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                    {unlockedCount} / {totalCount} Unlocked
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-charcoal max-w-xl leading-relaxed">
                  Earn milestone badges across your streak consistency, total completions,
                  Willpower XP, level promotions, perfect days, vitality lives, and habit break sobriety.
                </p>
              </div>
            </div>

            {/* Quick Button to Open Modal */}
            <button
              type="button"
              onClick={onOpenAchievements}
              className="w-full lg:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-ink text-white hover:bg-black font-display font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-95 shrink-0"
            >
              <span>View All 100 Achievements</span>
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Progress Bar & Quick Stats */}
          <div className="mt-6 pt-5 border-t border-hairline/80">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs mb-2">
              <span className="font-semibold text-ink flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-500" /> Lifetime Progress
              </span>
              <span className="font-mono font-bold text-amber-700">
                {unlockedCount} of {totalCount} Milestones Completed ({percentageUnlocked}%)
              </span>
            </div>

            <div className="w-full h-3 bg-surface-bone rounded-full overflow-hidden border border-hairline p-0.5">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-primary to-purple-600 rounded-full transition-all duration-500"
                style={{ width: `${percentageUnlocked}%` }}
              />
            </div>

            {/* Category Quick Badges */}
            <div className="flex flex-wrap items-center gap-2 mt-4 text-[11px] text-charcoal">
              <span className="font-bold text-ink">Parameters Tracked:</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-card border border-hairline">
                <Flame size={12} className="text-orange-500" /> Streaks (15)
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-card border border-hairline">
                <Award size={12} className="text-blue-500" /> Completions (15)
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-card border border-hairline">
                <Zap size={12} className="text-amber-500" /> Willpower XP (15)
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-card border border-hairline">
                <Heart size={12} className="text-red-500" /> Vitality & Lives (10)
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-card border border-hairline">
                <ShieldAlert size={12} className="text-purple-500" /> Habit Breaks (10)
              </span>
            </div>
          </div>
        </div>

        {/* 2. ARIGATO LABS BRAND & LEGAL LINKS SECTION */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-2">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onOpenBrandLegal('explore')}
              className="flex items-center gap-2 text-ink hover:text-primary transition-colors group"
            >
              <img
                src="/arigato-single-logo.png"
                alt="Arigato Labs"
                className="w-[17px] h-[17px] object-contain group-hover:scale-110 transition-transform"
              />
              <span className="font-display font-black text-sm tracking-wide">
                ARIGATO LABS
              </span>
            </button>
            <span className="text-stone">·</span>
            <span className="text-xs text-charcoal">
              HabitsSeen
            </span>
          </div>

          {/* Legal Navigation Links */}
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-charcoal">
            <button
              type="button"
              onClick={() => onOpenBrandLegal('explore')}
              className="flex items-center gap-1.5 hover:text-primary transition-colors"
            >
              <img
                src="/arigato-single-logo.png"
                alt="Arigato Labs"
                className="w-3.5 h-3.5 object-contain"
              />
              <span>Explore Arigato Labs</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenBrandLegal('about')}
              className="hover:text-primary transition-colors"
            >
              About
            </button>
            <button
              type="button"
              onClick={() => onOpenBrandLegal('privacy')}
              className="hover:text-primary transition-colors"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => onOpenBrandLegal('terms')}
              className="hover:text-primary transition-colors"
            >
              Terms & Conditions
            </button>
            <button
              type="button"
              onClick={() => onOpenBrandLegal('disclaimer')}
              className="hover:text-primary transition-colors"
            >
              Disclaimer
            </button>
            <button
              type="button"
              onClick={() => onOpenBrandLegal('contact')}
              className="hover:text-primary transition-colors"
            >
              Contact
            </button>
          </nav>
        </div>

        {/* 3. LEGAL COPYRIGHT & NOTICE */}
        <div className="pt-6 border-t border-hairline text-center text-xs text-stone space-y-1.5">
          <p className="leading-relaxed">
            <strong>HabitsSeen</strong> is a product of <strong>Arigato Labs</strong>, proudly
            developed by <strong>Kumar Devanshu</strong> in 2026.
          </p>
          <p className="text-[11px]">
            Copyright © 2026 Arigato Labs. All Rights Reserved. Contact:{' '}
            <a
              href="mailto:kumardevanshu3001@gmail.com"
              className="font-mono text-charcoal hover:text-primary transition-colors"
            >
              kumardevanshu3001@gmail.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};
