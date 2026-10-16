import React, { useState } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { Button } from '../ui/Button';
import { logOut } from '../../services/firebase';
import { Plus, Award, LogOut, Heart, Zap, Flame, CheckSquare, Clock, BarChart2, Info, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { PointsSystemModal } from './PointsSystemModal';

interface NavbarProps {
  activeTab: 'habits' | 'challenges' | 'tracking' | 'breaks' | 'analytics';
  onSelectTab: (tab: 'habits' | 'challenges' | 'tracking' | 'breaks' | 'analytics') => void;
  onOpenCreateHabit: () => void;
  onOpenProfile?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenCreateHabit,
  onOpenProfile,
}) => {
  const { user, currentUser, challenges } = useAppStore();
  const [isPointsInfoOpen, setIsPointsInfoOpen] = useState(false);

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await logOut();
    }
  };

  const hearts = user?.gamification?.hearts ?? 5;
  const maxHearts = user?.gamification?.maxHearts ?? 5;
  const totalXp = user?.gamification?.totalXp ?? 0;
  const levelTitle = user?.gamification?.levelTitle ?? 'Discipline Initiate';
  const activeChallengesCount = challenges.filter((c) => c.status === 'ACTIVE').length;

  return (
    <>
      <header className="sticky top-0 z-40 bg-canvas/90 backdrop-blur-md border-b border-hairline">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* LOGO & BRAND */}
        <div className="flex items-center gap-2.5 shrink-0">
          <img
            src="/android-chrome-192x192.png"
            alt="HabitsSeen Logo"
            className="w-9 h-9 rounded-xl object-contain shadow-xs"
          />
          <div>
            <h1 className="font-display font-bold text-xl text-ink tracking-tight flex items-center gap-1.5">
              HabitsSeen
            </h1>
          </div>
        </div>

        {/* DESKTOP NAV TABS - DECONGESTED SINGLE-LINE CAPSULE */}
        <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-1 bg-surface-card p-1 rounded-full border border-hairline shadow-2xs shrink-0">
          <button
            type="button"
            aria-current={activeTab === 'habits' ? 'page' : undefined}
            onClick={() => onSelectTab('habits')}
            className={clsx(
              'px-3.5 lg:px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5',
              activeTab === 'habits'
                ? 'bg-ink text-white shadow-xs'
                : 'text-charcoal hover:text-ink hover:bg-surface-bone'
            )}
          >
            <CheckSquare size={13} />
            <span>Daily Habits</span>
          </button>
          <button
            type="button"
            aria-current={activeTab === 'challenges' ? 'page' : undefined}
            onClick={() => onSelectTab('challenges')}
            className={clsx(
              'px-3.5 lg:px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5',
              activeTab === 'challenges'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-charcoal hover:text-ink hover:bg-surface-bone'
            )}
          >
            <Flame size={13} className={activeTab === 'challenges' ? 'fill-white' : 'text-rose-500'} />
            <span>Challenges</span>
            {activeChallengesCount > 0 && (
              <span
                className={clsx(
                  'px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold',
                  activeTab === 'challenges'
                    ? 'bg-white text-rose-600'
                    : 'bg-rose-100 text-rose-600'
                )}
              >
                {activeChallengesCount}
              </span>
            )}
          </button>
          <button
            type="button"
            aria-current={activeTab === 'tracking' ? 'page' : undefined}
            onClick={() => onSelectTab('tracking')}
            className={clsx(
              'px-3.5 lg:px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5',
              activeTab === 'tracking'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-charcoal hover:text-ink hover:bg-surface-bone'
            )}
          >
            <Sparkles size={13} className={activeTab === 'tracking' ? 'text-white' : 'text-amber-500'} />
            <span>Just Tracking</span>
          </button>
          <button
            type="button"
            aria-current={activeTab === 'breaks' ? 'page' : undefined}
            onClick={() => onSelectTab('breaks')}
            className={clsx(
              'px-3.5 lg:px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5',
              activeTab === 'breaks'
                ? 'bg-ink text-white shadow-xs'
                : 'text-charcoal hover:text-ink hover:bg-surface-bone'
            )}
          >
            <Clock size={13} />
            <span>Quit Breaks</span>
          </button>
          <button
            type="button"
            aria-current={activeTab === 'analytics' ? 'page' : undefined}
            onClick={() => onSelectTab('analytics')}
            className={clsx(
              'px-3.5 lg:px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5',
              activeTab === 'analytics'
                ? 'bg-ink text-white shadow-xs'
                : 'text-charcoal hover:text-ink hover:bg-surface-bone'
            )}
          >
            <BarChart2 size={13} />
            <span>Analytics</span>
          </button>
        </nav>

        {/* RIGHT AREA: HEARTS VITALITY + WILLPOWER XP + INFO GUIDE + ADD HABIT CTA + LOGOUT */}
        <div className="flex items-center gap-2 shrink-0">
          {/* 1. Vitality Hearts Badge */}
          {user && (
            <button
              type="button"
              onClick={onOpenProfile}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-full border border-red-200 text-xs font-bold shadow-2xs transition-all active:scale-95 shrink-0"
              title={`${hearts}/${maxHearts} Hearts (Click to open profile)`}
            >
              <Heart size={14} className="fill-red-500 text-red-500" />
              <span className="font-mono">{hearts}</span>
              <span className="text-[10px] text-red-400 hidden sm:inline">/{maxHearts}</span>
            </button>
          )}

          {/* 2. Willpower XP Badge */}
          {user && (
            <button
              type="button"
              onClick={onOpenProfile}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-card hover:bg-surface-bone rounded-full border border-hairline text-xs font-medium text-ink shadow-2xs transition-all active:scale-95 shrink-0"
              title={`${levelTitle} — ${totalXp} Total XP (Click to open profile)`}
            >
              <Zap size={14} className="text-amber-500 fill-amber-500 shrink-0" />
              <span className="font-semibold hidden lg:inline max-w-[130px] truncate">{levelTitle}</span>
              <span className="text-stone font-mono font-bold text-xs whitespace-nowrap">{totalXp} XP</span>
            </button>
          )}

          {/* 3. Points System & Rules Info Icon Button */}
          <button
            type="button"
            onClick={() => setIsPointsInfoOpen(true)}
            aria-label="Points and Hearts System Guide"
            className="flex items-center justify-center w-8 h-8 rounded-full bg-surface-card hover:bg-surface-bone text-charcoal hover:text-primary border border-hairline shadow-2xs transition-all active:scale-95 shrink-0"
            title="Points, Hearts & Midnight Rules Guide"
          >
            <Info size={15} />
          </button>

          <Button
            onClick={onOpenCreateHabit}
            variant="primary"
            size="md"
            className="hidden sm:flex gap-1.5 text-xs sm:text-sm"
          >
            <Plus size={16} /> <span>New Habit</span>
          </Button>

          {/* User Sign Out Button */}
          {currentUser && (
            <button
              onClick={handleLogout}
              className="hidden sm:flex p-2 text-stone hover:text-red-600 hover:bg-surface-bone rounded-full transition-colors"
              title={`Sign out (${currentUser.email || 'User'})`}
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </header>

    {/* Points & Rules Info Modal */}
    <PointsSystemModal
      isOpen={isPointsInfoOpen}
      onClose={() => setIsPointsInfoOpen(false)}
    />
  </>
  );
};
