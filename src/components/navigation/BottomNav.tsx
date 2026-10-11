import React from 'react';
import { CheckSquare, ShieldAlert, BarChart2, Plus } from 'lucide-react';
import clsx from 'clsx';

interface BottomNavProps {
  activeTab: 'habits' | 'breaks' | 'analytics';
  onSelectTab: (tab: 'habits' | 'breaks' | 'analytics') => void;
  onOpenCreateHabit: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenCreateHabit,
}) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-canvas/95 backdrop-blur-lg border-t border-hairline px-4 py-2 flex items-center justify-around shadow-lg">
      <button
        onClick={() => onSelectTab('habits')}
        className={clsx(
          'flex flex-col items-center gap-1 p-1 rounded-xl transition-colors',
          activeTab === 'habits' ? 'text-primary' : 'text-stone hover:text-ink'
        )}
      >
        <CheckSquare size={20} />
        <span className="text-[10px] font-semibold">Habits</span>
      </button>

      <button
        onClick={() => onSelectTab('breaks')}
        className={clsx(
          'flex flex-col items-center gap-1 p-1 rounded-xl transition-colors',
          activeTab === 'breaks' ? 'text-primary' : 'text-stone hover:text-ink'
        )}
      >
        <ShieldAlert size={20} />
        <span className="text-[10px] font-semibold">Quit Break</span>
      </button>

      {/* Floating Center Action Button */}
      <button
        onClick={onOpenCreateHabit}
        className="w-12 h-12 -mt-5 rounded-full bg-primary text-white flex items-center justify-center shadow-lg active:scale-95 transition-all"
        title="Add Habit"
      >
        <Plus size={24} />
      </button>

      <button
        onClick={() => onSelectTab('analytics')}
        className={clsx(
          'flex flex-col items-center gap-1 p-1 rounded-xl transition-colors',
          activeTab === 'analytics' ? 'text-primary' : 'text-stone hover:text-ink'
        )}
      >
        <BarChart2 size={20} />
        <span className="text-[10px] font-semibold">Analytics</span>
      </button>
    </div>
  );
};
