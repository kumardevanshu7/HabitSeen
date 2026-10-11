import React, { useState, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { useAppStore } from '../../stores/useAppStore';
import {
  computeUserAchievements,
  AchievementCategory,
  AchievementRarity,
  CATEGORY_LABELS,
  RARITY_CONFIG,
} from '../../constants/achievements';
import {
  Trophy,
  Flame,
  CheckCheck,
  Target,
  Zap,
  Award,
  Sparkles,
  Heart,
  ShieldAlert,
  FolderKanban,
  Crown,
  Medal,
  Star,
  Search,
  Lock,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import clsx from 'clsx';

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: AchievementCategory | 'ALL';
}

const renderAchievementIcon = (iconName: string, className: string) => {
  switch (iconName) {
    case 'Flame':
      return <Flame className={className} />;
    case 'CheckCheck':
      return <CheckCheck className={className} />;
    case 'Target':
      return <Target className={className} />;
    case 'Zap':
      return <Zap className={className} />;
    case 'Award':
      return <Award className={className} />;
    case 'Sparkles':
      return <Sparkles className={className} />;
    case 'Heart':
      return <Heart className={className} />;
    case 'ShieldAlert':
      return <ShieldAlert className={className} />;
    case 'FolderKanban':
      return <FolderKanban className={className} />;
    case 'Crown':
      return <Crown className={className} />;
    case 'Medal':
      return <Medal className={className} />;
    case 'Star':
      return <Star className={className} />;
    default:
      return <Trophy className={className} />;
  }
};

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  isOpen,
  onClose,
  initialCategory = 'ALL',
}) => {
  const { habits, logs, user, habitBreaks, categories } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'ALL'>(
    initialCategory
  );
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNLOCKED' | 'LOCKED'>('ALL');
  const [selectedRarity, setSelectedRarity] = useState<AchievementRarity | 'ALL'>('ALL');

  // Compute all 100 achievements dynamically based on store stats
  const { achievementsWithStatus, unlockedCount, totalCount, percentageUnlocked } = useMemo(() => {
    return computeUserAchievements({ habits, logs, user, habitBreaks, categories });
  }, [habits, logs, user, habitBreaks, categories]);

  // Filtered achievements
  const filteredAchievements = useMemo(() => {
    return achievementsWithStatus.filter((a) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = a.title.toLowerCase().includes(query);
        const matchesDesc = a.description.toLowerCase().includes(query);
        const matchesCategory = a.category.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesCategory) return false;
      }

      // 2. Category
      if (selectedCategory !== 'ALL' && a.category !== selectedCategory) {
        return false;
      }

      // 3. Status
      if (statusFilter === 'UNLOCKED' && !a.isUnlocked) return false;
      if (statusFilter === 'LOCKED' && a.isUnlocked) return false;

      // 4. Rarity
      if (selectedRarity !== 'ALL' && a.rarity !== selectedRarity) return false;

      return true;
    });
  }, [achievementsWithStatus, searchQuery, selectedCategory, statusFilter, selectedRarity]);

  const categoriesList: (AchievementCategory | 'ALL')[] = [
    'ALL',
    'STREAKS',
    'COMPLETIONS',
    'HABITS',
    'XP',
    'LEVELS',
    'PERFECT_DAYS',
    'VITALITY',
    'HABIT_BREAK',
    'ORGANIZATION',
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Trophy Hall · 100 Achievements"
      subtitle="Track your lifetime progress and self-mastery milestones across all parameters"
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* OVERALL PROGRESS HERO BANNER */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 via-primary/5 to-purple-500/10 border border-amber-200/60 p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-13 h-13 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/25 shrink-0">
                <Trophy size={26} strokeWidth={2.2} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-display font-bold text-xl text-ink">
                    Mastery Hall
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    {unlockedCount} / {totalCount} Unlocked
                  </span>
                </div>
                <p className="text-xs text-charcoal mt-0.5">
                  Unlock achievements by building streaks, gaining Willpower XP, leveling up, and maintaining vitality.
                </p>
              </div>
            </div>

            <div className="w-full sm:w-auto text-left sm:text-right shrink-0">
              <div className="font-mono font-black text-2xl text-amber-600">
                {percentageUnlocked}%
              </div>
              <div className="text-[11px] text-stone uppercase tracking-wider font-semibold">
                Completed
              </div>
            </div>
          </div>

          {/* Overall Progress Bar */}
          <div className="mt-4">
            <div className="w-full h-3 bg-surface-bone rounded-full overflow-hidden border border-hairline p-0.5">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-primary to-purple-600 rounded-full transition-all duration-500"
                style={{ width: `${percentageUnlocked}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-charcoal font-medium mt-1.5 px-0.5">
              <span>0 Milestones</span>
              <span className="font-bold text-ink">{unlockedCount} Completed</span>
              <span>100 Milestones</span>
            </div>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search across 100 achievements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-surface-card border border-hairline rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-stone transition-all"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-surface-card p-1 rounded-xl border border-hairline shrink-0">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                  statusFilter === 'ALL'
                    ? 'bg-ink text-white shadow-2xs'
                    : 'text-charcoal hover:text-ink'
                )}
              >
                All ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('UNLOCKED')}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                  statusFilter === 'UNLOCKED'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-charcoal hover:text-ink'
                )}
              >
                Unlocked ({unlockedCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('LOCKED')}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                  statusFilter === 'LOCKED'
                    ? 'bg-ink text-white shadow-2xs'
                    : 'text-charcoal hover:text-ink'
                )}
              >
                Locked ({totalCount - unlockedCount})
              </button>
            </div>
          </div>

          {/* Category Horizontal Scroll Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
            <span className="text-[11px] font-bold text-stone shrink-0 flex items-center gap-1 mr-1">
              <Filter size={12} /> Category:
            </span>
            {categoriesList.map((catKey) => {
              const label =
                catKey === 'ALL'
                  ? 'All Categories (100)'
                  : CATEGORY_LABELS[catKey]?.title || catKey;
              const isSelected = selectedCategory === catKey;

              return (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => setSelectedCategory(catKey)}
                  className={clsx(
                    'px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0',
                    isSelected
                      ? 'bg-primary text-white shadow-xs font-bold'
                      : 'bg-surface-card hover:bg-surface-bone text-charcoal border border-hairline'
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Rarity Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
            <span className="text-[11px] font-bold text-stone shrink-0 mr-1">
              Rarity:
            </span>
            {(['ALL', 'COMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC'] as const).map(
              (rarity) => {
                const isSelected = selectedRarity === rarity;
                return (
                  <button
                    key={rarity}
                    type="button"
                    onClick={() => setSelectedRarity(rarity)}
                    className={clsx(
                      'px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all shrink-0',
                      isSelected
                        ? 'bg-ink text-white shadow-xs'
                        : 'bg-surface-card hover:bg-surface-bone text-charcoal border border-hairline'
                    )}
                  >
                    {rarity === 'ALL' ? 'All Rarities' : RARITY_CONFIG[rarity].label}
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* ACHIEVEMENTS GRID */}
        {filteredAchievements.length === 0 ? (
          <div className="py-12 text-center bg-surface-card rounded-2xl border border-hairline">
            <Trophy size={36} className="mx-auto text-stone mb-2 opacity-50" />
            <p className="font-semibold text-sm text-ink">No achievements match your filters</p>
            <p className="text-xs text-charcoal mt-1">Try resetting search or category filters.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setStatusFilter('ALL');
                setSelectedRarity('ALL');
              }}
              className="mt-3 text-xs text-primary font-bold hover:underline"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredAchievements.map((ach) => {
              const rarityConfig = RARITY_CONFIG[ach.rarity];
              const isUnlocked = ach.isUnlocked;

              return (
                <div
                  key={ach.id}
                  className={clsx(
                    'relative p-4 rounded-2xl border transition-all flex flex-col justify-between group',
                    isUnlocked
                      ? 'bg-surface-card border-hairline shadow-xs hover:border-amber-300'
                      : 'bg-surface-card/60 border-hairline/60 opacity-80 hover:opacity-100'
                  )}
                >
                  <div>
                    {/* Top row: Icon, Category & Rarity badges */}
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div
                        className={clsx(
                          'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105',
                          isUnlocked
                            ? clsx(rarityConfig.bg, rarityConfig.border, rarityConfig.text)
                            : 'bg-surface-bone border-hairline text-stone'
                        )}
                      >
                        {isUnlocked ? (
                          renderAchievementIcon(ach.icon, 'w-5 h-5')
                        ) : (
                          <Lock className="w-4 h-4 text-stone" />
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={clsx(
                            'px-2 py-0.5 rounded-full text-[10px] font-bold border',
                            rarityConfig.bg,
                            rarityConfig.text,
                            rarityConfig.border
                          )}
                        >
                          {rarityConfig.label}
                        </span>

                        {isUnlocked && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 size={11} /> Unlocked
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h5 className="font-display font-bold text-sm text-ink leading-snug">
                      {ach.title}
                    </h5>
                    <p className="text-xs text-charcoal mt-1 line-clamp-2 leading-relaxed">
                      {ach.description}
                    </p>
                  </div>

                  {/* Progress bar and Target */}
                  <div className="mt-4 pt-3 border-t border-hairline/80">
                    <div className="flex justify-between items-center text-[11px] font-mono mb-1.5">
                      <span className="text-charcoal font-medium">Progress</span>
                      <span className={clsx('font-bold', isUnlocked ? 'text-emerald-700' : 'text-ink')}>
                        {ach.current} / {ach.targetValue} {ach.unit} ({ach.percentage}%)
                      </span>
                    </div>

                    <div className="w-full h-2 bg-surface-bone rounded-full overflow-hidden border border-hairline">
                      <div
                        className={clsx(
                          'h-full rounded-full transition-all duration-300',
                          isUnlocked
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                            : 'bg-gradient-to-r from-primary to-amber-500'
                        )}
                        style={{ width: `${ach.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};
