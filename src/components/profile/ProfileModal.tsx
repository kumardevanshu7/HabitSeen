import React from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { logOut } from '../../services/firebase';
import { Heart, Zap, Award, LogOut, Shield, User } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, currentUser, habits } = useAppStore();

  if (!user || !currentUser) return null;

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      onClose();
      await logOut();
    }
  };

  const hearts = user.gamification?.hearts ?? 5;
  const maxHearts = user.gamification?.maxHearts ?? 5;
  const totalXp = user.gamification?.totalXp ?? 0;
  const levelTitle = user.gamification?.levelTitle ?? 'Discipline Initiate';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Discipline Profile"
      subtitle="Your vitality, willpower rank, and account details"
      maxWidth="sm"
    >
      <div className="space-y-5 pt-2">
        {/* User Card */}
        <div className="p-4 bg-surface-bone rounded-2xl border border-hairline flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
            <User size={24} />
          </div>
          <div className="truncate flex-1">
            <h4 className="font-display font-bold text-ink text-base truncate">
              {user.name || 'Discipline Seeker'}
            </h4>
            <p className="text-xs text-charcoal truncate">
              {currentUser.email || 'Cloud Firestore User'}
            </p>
          </div>
        </div>

        {/* Vitality & Willpower Stats */}
        <div className="grid grid-cols-2 gap-3">
          {/* Hearts / Health */}
          <div className="p-4 bg-surface-card rounded-2xl border border-red-200/80 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-charcoal">
              <span>Vitality (Hearts)</span>
              <Heart size={16} className="text-red-500 fill-red-500" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-2xl font-black text-red-600">{hearts}</span>
              <span className="text-xs font-medium text-charcoal">/ {maxHearts}</span>
            </div>
            <div className="flex gap-1 pt-1">
              {Array.from({ length: maxHearts }).map((_, i) => (
                <Heart
                  key={i}
                  size={14}
                  className={
                    i < hearts
                      ? 'text-red-500 fill-red-500'
                      : 'text-stone/30 fill-stone/10'
                  }
                />
              ))}
            </div>
            <p className="text-[10px] text-charcoal pt-1">
              Complete habits to heal. Unexcused misses cost hearts.
            </p>
          </div>

          {/* Willpower XP */}
          <div className="p-4 bg-surface-card rounded-2xl border border-amber-200/80 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-charcoal">
              <span>Willpower XP</span>
              <Zap size={16} className="text-amber-500 fill-amber-500" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-2xl font-black text-amber-600">{totalXp}</span>
              <span className="text-xs font-medium text-charcoal">XP</span>
            </div>
            <div className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 truncate">
              <Award size={11} /> {levelTitle}
            </div>
            <p className="text-[10px] text-charcoal pt-1">
              Earn XP with daily streaks and high priority targets.
            </p>
          </div>
        </div>

        {/* Quick Summary Pill */}
        <div className="p-3 bg-surface-card rounded-2xl border border-hairline flex items-center justify-between text-xs">
          <span className="text-charcoal font-medium flex items-center gap-1.5">
            <Shield size={14} className="text-primary" /> Active Habits
          </span>
          <span className="font-mono font-bold text-ink">{habits.length} habits configured</span>
        </div>

        {/* Logout Action */}
        <div className="pt-2 border-t border-hairline">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={handleLogout}
            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 gap-2"
          >
            <LogOut size={16} /> Sign Out
          </Button>
        </div>
      </div>
    </Modal>
  );
};
