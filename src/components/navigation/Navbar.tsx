import React from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { Button } from '../ui/Button';
import { logOut } from '../../services/firebase';
import { Plus, Award, LogOut } from 'lucide-react';
import clsx from 'clsx';

interface NavbarProps {
  activeTab: 'habits' | 'breaks' | 'analytics';
  onSelectTab: (tab: 'habits' | 'breaks' | 'analytics') => void;
  onOpenCreateHabit: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenCreateHabit,
}) => {
  const { user, currentUser } = useAppStore();

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await logOut();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-canvas/90 backdrop-blur-md border-b border-hairline">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* LOGO & BRAND */}
        <div className="flex items-center gap-2.5">
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

        {/* DESKTOP NAV TABS */}
        <nav className="hidden md:flex items-center gap-1 bg-surface-card p-1 rounded-full border border-hairline shadow-2xs">
          <button
            onClick={() => onSelectTab('habits')}
            className={clsx(
              'px-4 py-1.5 rounded-full text-xs font-semibold transition-all',
              activeTab === 'habits'
                ? 'bg-ink text-white shadow-xs'
                : 'text-charcoal hover:text-ink'
            )}
          >
            Daily Habits
          </button>
          <button
            onClick={() => onSelectTab('breaks')}
            className={clsx(
              'px-4 py-1.5 rounded-full text-xs font-semibold transition-all',
              activeTab === 'breaks'
                ? 'bg-ink text-white shadow-xs'
                : 'text-charcoal hover:text-ink'
            )}
          >
            Timer Habit Break
          </button>
          <button
            onClick={() => onSelectTab('analytics')}
            className={clsx(
              'px-4 py-1.5 rounded-full text-xs font-semibold transition-all',
              activeTab === 'analytics'
                ? 'bg-ink text-white shadow-xs'
                : 'text-charcoal hover:text-ink'
            )}
          >
            Overall Analytics
          </button>
        </nav>

        {/* RIGHT AREA: WILL HABIT LEVEL BADGE + ADD HABIT CTA + LOGOUT */}
        <div className="flex items-center gap-2">
          {/* Will Habit Badge Pill */}
          {user && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-surface-card rounded-full border border-hairline text-xs font-medium text-ink shadow-2xs">
              <Award size={15} className="text-primary" />
              <span className="font-semibold">{user.gamification.levelTitle}</span>
              <span className="text-stone font-mono">| {user.gamification.totalXp} XP</span>
            </div>
          )}

          <Button
            onClick={onOpenCreateHabit}
            variant="primary"
            size="md"
            className="gap-1.5 text-xs sm:text-sm"
          >
            <Plus size={16} /> <span className="hidden sm:inline">New Habit</span>
            <span className="sm:hidden">Add</span>
          </Button>

          {/* User Sign Out Button */}
          {currentUser && (
            <button
              onClick={handleLogout}
              className="p-2 text-stone hover:text-red-600 hover:bg-surface-bone rounded-full transition-colors"
              title={`Sign out (${currentUser.email || 'User'})`}
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
