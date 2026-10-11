import React, { useState } from 'react';
import { CheckSquare, ShieldAlert, BarChart2, Plus, User } from 'lucide-react';
import clsx from 'clsx';
import { ProfileModal } from '../profile/ProfileModal';

interface BottomNavProps {
  activeTab: 'habits' | 'breaks' | 'analytics';
  onSelectTab: (tab: 'habits' | 'breaks' | 'analytics') => void;
  onOpenCreateHabit: () => void;
  onOpenProfile?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenCreateHabit,
  onOpenProfile,
}) => {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleOpenProfile = () => {
    if (onOpenProfile) {
      onOpenProfile();
    } else {
      setIsProfileModalOpen(true);
    }
  };

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-canvas/95 backdrop-blur-lg border-t border-hairline px-2 py-1.5 grid grid-cols-5 items-center shadow-lg safe-bottom">
        {/* 1. Habits */}
        <button
          onClick={() => onSelectTab('habits')}
          className={clsx(
            'flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition-colors',
            activeTab === 'habits' ? 'text-primary' : 'text-stone hover:text-ink'
          )}
        >
          <CheckSquare size={20} />
          <span className="text-[10px] font-semibold">Habits</span>
        </button>

        {/* 2. Quit Break */}
        <button
          onClick={() => onSelectTab('breaks')}
          className={clsx(
            'flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition-colors',
            activeTab === 'breaks' ? 'text-primary' : 'text-stone hover:text-ink'
          )}
        >
          <ShieldAlert size={20} />
          <span className="text-[10px] font-semibold">Quit Break</span>
        </button>

        {/* 3. CENTER RAISED ACTION BUTTON */}
        <div className="flex flex-col items-center justify-center">
          <button
            onClick={onOpenCreateHabit}
            className="w-12 h-12 -mt-5 rounded-full bg-primary text-white flex items-center justify-center shadow-xl ring-4 ring-canvas active:scale-90 transition-transform hover:bg-primary-deep"
            title="Add Habit"
          >
            <Plus size={24} strokeWidth={2.5} />
          </button>
          <span className="text-[10px] font-bold text-primary mt-0.5">Add</span>
        </div>

        {/* 4. Analytics */}
        <button
          onClick={() => onSelectTab('analytics')}
          className={clsx(
            'flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition-colors',
            activeTab === 'analytics' ? 'text-primary' : 'text-stone hover:text-ink'
          )}
        >
          <BarChart2 size={20} />
          <span className="text-[10px] font-semibold">Analytics</span>
        </button>

        {/* 5. Profile & Willpower */}
        <button
          onClick={handleOpenProfile}
          className="flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition-colors text-stone hover:text-ink"
        >
          <User size={20} />
          <span className="text-[10px] font-semibold">Profile</span>
        </button>
      </div>

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
};
