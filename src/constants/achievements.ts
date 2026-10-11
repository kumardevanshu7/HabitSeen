import { Habit, HabitBreak, HabitLog, UserProfile, Category } from '../types/habit';

export type AchievementCategory =
  | 'STREAKS'
  | 'COMPLETIONS'
  | 'HABITS'
  | 'XP'
  | 'LEVELS'
  | 'PERFECT_DAYS'
  | 'VITALITY'
  | 'HABIT_BREAK'
  | 'ORGANIZATION';

export type AchievementRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC';

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  icon: string;
  targetValue: number;
  unit: string;
  check: (stats: CalculatedStats) => { current: number; isUnlocked: boolean };
}

export interface CalculatedStats {
  bestStreak: number;
  currentStreak: number;
  totalCompletions: number;
  totalHabitsCreated: number;
  hasYesNo: boolean;
  hasNumeric: boolean;
  hasTimer: boolean;
  hasChecklist: boolean;
  totalXp: number;
  userLevel: number;
  perfectDaysCount: number;
  maxHearts: number;
  hearts: number;
  totalBreaks: number;
  maxBreakElapsedHours: number;
  totalCategories: number;
}

export const CATEGORY_LABELS: Record<AchievementCategory, { title: string; icon: string }> = {
  STREAKS: { title: 'Streaks & Consistency', icon: 'Flame' },
  COMPLETIONS: { title: 'Total Completions', icon: 'CheckCheck' },
  HABITS: { title: 'Habit Architecture', icon: 'Target' },
  XP: { title: 'Willpower XP Milestones', icon: 'Zap' },
  LEVELS: { title: 'Will Habit Level Tiers', icon: 'Award' },
  PERFECT_DAYS: { title: 'Perfect Days', icon: 'Sparkles' },
  VITALITY: { title: 'Vitality & Lives Mastery', icon: 'Heart' },
  HABIT_BREAK: { title: 'Sobriety & Habit Break', icon: 'ShieldAlert' },
  ORGANIZATION: { title: 'Life Organization', icon: 'FolderKanban' },
};

export const RARITY_CONFIG: Record<
  AchievementRarity,
  { label: string; bg: string; text: string; border: string; glow: string }
> = {
  COMMON: {
    label: 'Common',
    bg: 'bg-stone/15',
    text: 'text-charcoal',
    border: 'border-hairline',
    glow: '',
  },
  RARE: {
    label: 'Rare',
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-200',
    glow: 'shadow-blue-500/10',
  },
  EPIC: {
    label: 'Epic',
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    border: 'border-purple-200',
    glow: 'shadow-purple-500/20',
  },
  LEGENDARY: {
    label: 'Legendary',
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    border: 'border-amber-300',
    glow: 'shadow-amber-500/25',
  },
  MYTHIC: {
    label: 'Mythic',
    bg: 'bg-red-50',
    text: 'text-primary font-black',
    border: 'border-primary/40',
    glow: 'shadow-red-500/30',
  },
};

// ============================================================================
// EXACTLY 100 HARDCORE ACHIEVEMENTS (NO SHORTCUTS)
// ============================================================================
export const ACHIEVEMENTS: AchievementDefinition[] = [
  // --------------------------------------------------------------------------
  // 1. STREAKS & CONSISTENCY (15 ACHIEVEMENTS)
  // --------------------------------------------------------------------------
  {
    id: 'streak_1',
    title: 'The Spark',
    description: 'Achieve a consecutive streak of 1 day on any habit.',
    category: 'STREAKS',
    rarity: 'COMMON',
    icon: 'Flame',
    targetValue: 1,
    unit: 'days',
    check: (s) => ({ current: s.bestStreak, isUnlocked: s.bestStreak >= 1 }),
  },
  {
    id: 'streak_3',
    title: 'Ignition Pulse',
    description: 'Maintain a 3-day consecutive discipline streak.',
    category: 'STREAKS',
    rarity: 'COMMON',
    icon: 'Flame',
    targetValue: 3,
    unit: 'days',
    check: (s) => ({ current: s.bestStreak, isUnlocked: s.bestStreak >= 3 }),
  },
  {
    id: 'streak_5',
    title: 'Workweek Champion',
    description: 'Execute 5 continuous consecutive habit days.',
    category: 'STREAKS',
    rarity: 'COMMON',
    icon: 'Flame',
    targetValue: 5,
    unit: 'days',
    check: (s) => ({ current: s.bestStreak, isUnlocked: s.bestStreak >= 5 }),
  },
  {
    id: 'streak_7',
    title: 'One-Week Strong',
    description: 'Complete a full 7-day uninterrupted streak cycle.',
    category: 'STREAKS',
    rarity: 'RARE',
    icon: 'Flame',
    targetValue: 7,
    unit: 'days',
    check: (s) => ({ current: s.bestStreak, isUnlocked: s.bestStreak >= 7 }),
  },
  {
    id: 'streak_10',
    title: 'Double Digits',
    description: 'Break into double digits with a 10-day streak.',
    category: 'STREAKS',
    rarity: 'RARE',
    icon: 'Flame',
    targetValue: 10,
    unit: 'days',
    check: (s) => ({ current: s.bestStreak, isUnlocked: s.bestStreak >= 10 }),
  },
  {
    id: 'streak_14',
    title: 'Fortnight of Iron',
    description: 'Survive 14 continuous days without dropping a session.',
    category: 'STREAKS',
    rarity: 'RARE',
    icon: 'Flame',
    targetValue: 14,
    unit: 'days',
    check: (s) => ({ current: s.bestStreak, isUnlocked: s.bestStreak >= 14 }),
  },
  {
    id: 'streak_21',
    title: 'Neurological Rewrite',
    description: 'Reach 21 days where the subconscious habit loop crystallizes.',
    category: 'STREAKS',
    rarity: 'EPIC',
    icon: 'Flame',
    targetValue: 21,
    unit: 'days',
    check: (s) => ({ current: s.bestStreak, isUnlocked: s.bestStreak >= 21 }),
  },
  {
    id: 'streak_30',
    title: 'Monthly Master',
    description: 'Complete a flawless 30-day streak milestone.',
    category: 'STREAKS',
    rarity: 'EPIC',
    icon: 'Flame',
    targetValue: 30,
    unit: 'days',
    check: (s) => ({ current: s.bestStreak, isUnlocked: s.bestStreak >= 30 }),
  },
  {
    id: 'streak_45',
    title: 'Relentless Momentum',
    description: 'Reach 45 consecutive days of unwavering willpower.',
    category: 'STREAKS',
    rarity: 'EPIC',
    icon: 'Flame',
    targetValue: 45,
    unit: 'days',
    check: (s) => ({ current: s.bestStreak, isUnlocked: s.bestStreak >= 45 }),
  },
  {
    id: 'streak_60',
    title: 'The Transformer',
    description: 'Achieve 60 consecutive days of personal discipline.',
    category: 'STREAKS',
    rarity: 'EPIC',
    icon: 'Flame',
    targetValue: 60,
    unit: 'days',
    check: (s) => ({ current: s.bestStreak, isUnlocked: s.bestStreak >= 60 }),
  },
  {
    id: 'streak_75',
    title: 'Diamond Resolve',
    description: 'Stand tall across 75 continuous unbroken days.',
    category: 'STREAKS',
    rarity: 'LEGENDARY',
    icon: 'Flame',
    targetValue: 75,
    unit: 'days',
    check: (s) => ({ current: s.bestStreak, isUnlocked: s.bestStreak >= 75 }),
  },
  {
    id: 'streak_100',
    title: 'Centurion of Will',
    description: 'Cross the monumental 100-day unbroken streak tier.',
    category: 'STREAKS',
    rarity: 'LEGENDARY',
    icon: 'Flame',
    targetValue: 100,
    unit: 'days',
    check: (s) => ({ current: s.bestStreak, isUnlocked: s.bestStreak >= 100 }),
  },
  {
    id: 'streak_150',
    title: 'Monastic Focus',
    description: 'Reach 150 consecutive days of supreme habit execution.',
    category: 'STREAKS',
    rarity: 'LEGENDARY',
    icon: 'Flame',
    targetValue: 150,
    unit: 'days',
    check: (s) => ({ current: s.bestStreak, isUnlocked: s.bestStreak >= 150 }),
  },
  {
    id: 'streak_200',
    title: 'Unwavering Pillar',
    description: 'Conquer 200 days unbroken by distractions or lethargy.',
    category: 'STREAKS',
    rarity: 'LEGENDARY',
    icon: 'Flame',
    targetValue: 200,
    unit: 'days',
    check: (s) => ({ current: s.bestStreak, isUnlocked: s.bestStreak >= 200 }),
  },
  {
    id: 'streak_365',
    title: 'Year of Triumph',
    description: 'One complete rotation around the sun (365 days) unconquered.',
    category: 'STREAKS',
    rarity: 'MYTHIC',
    icon: 'Flame',
    targetValue: 365,
    unit: 'days',
    check: (s) => ({ current: s.bestStreak, isUnlocked: s.bestStreak >= 365 }),
  },

  // --------------------------------------------------------------------------
  // 2. TOTAL HABIT COMPLETIONS (15 ACHIEVEMENTS)
  // --------------------------------------------------------------------------
  {
    id: 'comp_1',
    title: 'First Blood',
    description: 'Log and complete your first ever habit execution.',
    category: 'COMPLETIONS',
    rarity: 'COMMON',
    icon: 'CheckCheck',
    targetValue: 1,
    unit: 'tasks',
    check: (s) => ({ current: s.totalCompletions, isUnlocked: s.totalCompletions >= 1 }),
  },
  {
    id: 'comp_5',
    title: 'High Five',
    description: 'Successfully complete 5 total habit sessions.',
    category: 'COMPLETIONS',
    rarity: 'COMMON',
    icon: 'CheckCheck',
    targetValue: 5,
    unit: 'tasks',
    check: (s) => ({ current: s.totalCompletions, isUnlocked: s.totalCompletions >= 5 }),
  },
  {
    id: 'comp_10',
    title: 'Consistency Cadet',
    description: 'Log 10 total completed habit tasks across all time.',
    category: 'COMPLETIONS',
    rarity: 'COMMON',
    icon: 'CheckCheck',
    targetValue: 10,
    unit: 'tasks',
    check: (s) => ({ current: s.totalCompletions, isUnlocked: s.totalCompletions >= 10 }),
  },
  {
    id: 'comp_25',
    title: 'Quarter Century',
    description: 'Conquer 25 completed habit actions in your system.',
    category: 'COMPLETIONS',
    rarity: 'RARE',
    icon: 'CheckCheck',
    targetValue: 25,
    unit: 'tasks',
    check: (s) => ({ current: s.totalCompletions, isUnlocked: s.totalCompletions >= 25 }),
  },
  {
    id: 'comp_50',
    title: 'Half Centurion',
    description: 'Reach 50 recorded habit completions.',
    category: 'COMPLETIONS',
    rarity: 'RARE',
    icon: 'CheckCheck',
    targetValue: 50,
    unit: 'tasks',
    check: (s) => ({ current: s.totalCompletions, isUnlocked: s.totalCompletions >= 50 }),
  },
  {
    id: 'comp_75',
    title: 'Habit Artisan',
    description: 'Achieve 75 total successful habit completions.',
    category: 'COMPLETIONS',
    rarity: 'RARE',
    icon: 'CheckCheck',
    targetValue: 75,
    unit: 'tasks',
    check: (s) => ({ current: s.totalCompletions, isUnlocked: s.totalCompletions >= 75 }),
  },
  {
    id: 'comp_100',
    title: 'Century of Action',
    description: 'Reach 100 total habit executions logged in HabitsSeen.',
    category: 'COMPLETIONS',
    rarity: 'EPIC',
    icon: 'CheckCheck',
    targetValue: 100,
    unit: 'tasks',
    check: (s) => ({ current: s.totalCompletions, isUnlocked: s.totalCompletions >= 100 }),
  },
  {
    id: 'comp_150',
    title: 'Discipline Engine',
    description: 'Amass 150 completed sessions across your routines.',
    category: 'COMPLETIONS',
    rarity: 'EPIC',
    icon: 'CheckCheck',
    targetValue: 150,
    unit: 'tasks',
    check: (s) => ({ current: s.totalCompletions, isUnlocked: s.totalCompletions >= 150 }),
  },
  {
    id: 'comp_200',
    title: 'Bicentennial Force',
    description: 'Hit 200 logged and verified habit completions.',
    category: 'COMPLETIONS',
    rarity: 'EPIC',
    icon: 'CheckCheck',
    targetValue: 200,
    unit: 'tasks',
    check: (s) => ({ current: s.totalCompletions, isUnlocked: s.totalCompletions >= 200 }),
  },
  {
    id: 'comp_300',
    title: 'Spartan 300',
    description: 'Stand unconquered with 300 total habit executions.',
    category: 'COMPLETIONS',
    rarity: 'LEGENDARY',
    icon: 'CheckCheck',
    targetValue: 300,
    unit: 'tasks',
    check: (s) => ({ current: s.totalCompletions, isUnlocked: s.totalCompletions >= 300 }),
  },
  {
    id: 'comp_500',
    title: 'Habit Juggernaut',
    description: 'Execute 500 verified habit tasks in Cloud Firestore.',
    category: 'COMPLETIONS',
    rarity: 'LEGENDARY',
    icon: 'CheckCheck',
    targetValue: 500,
    unit: 'tasks',
    check: (s) => ({ current: s.totalCompletions, isUnlocked: s.totalCompletions >= 500 }),
  },
  {
    id: 'comp_750',
    title: 'Master of Execution',
    description: 'Reach 750 total habit completions.',
    category: 'COMPLETIONS',
    rarity: 'LEGENDARY',
    icon: 'CheckCheck',
    targetValue: 750,
    unit: 'tasks',
    check: (s) => ({ current: s.totalCompletions, isUnlocked: s.totalCompletions >= 750 }),
  },
  {
    id: 'comp_1000',
    title: 'The Millennium Will',
    description: 'Cross 1,000 lifetime habit completions.',
    category: 'COMPLETIONS',
    rarity: 'MYTHIC',
    icon: 'CheckCheck',
    targetValue: 1000,
    unit: 'tasks',
    check: (s) => ({ current: s.totalCompletions, isUnlocked: s.totalCompletions >= 1000 }),
  },
  {
    id: 'comp_1500',
    title: 'Living Legend',
    description: 'Achieve 1,500 total completed habit operations.',
    category: 'COMPLETIONS',
    rarity: 'MYTHIC',
    icon: 'CheckCheck',
    targetValue: 1500,
    unit: 'tasks',
    check: (s) => ({ current: s.totalCompletions, isUnlocked: s.totalCompletions >= 1500 }),
  },
  {
    id: 'comp_2000',
    title: 'God of Habit Execution',
    description: 'Cross 2,000 total habit completions in your life journey.',
    category: 'COMPLETIONS',
    rarity: 'MYTHIC',
    icon: 'CheckCheck',
    targetValue: 2000,
    unit: 'tasks',
    check: (s) => ({ current: s.totalCompletions, isUnlocked: s.totalCompletions >= 2000 }),
  },

  // --------------------------------------------------------------------------
  // 3. HABIT ARCHITECTURE & CREATION (10 ACHIEVEMENTS)
  // --------------------------------------------------------------------------
  {
    id: 'hab_1',
    title: 'Architect of Routine',
    description: 'Create your very first habit in HabitsSeen.',
    category: 'HABITS',
    rarity: 'COMMON',
    icon: 'Target',
    targetValue: 1,
    unit: 'habits',
    check: (s) => ({ current: s.totalHabitsCreated, isUnlocked: s.totalHabitsCreated >= 1 }),
  },
  {
    id: 'hab_3',
    title: 'Trinity Foundation',
    description: 'Configure at least 3 active habits in your daily engine.',
    category: 'HABITS',
    rarity: 'COMMON',
    icon: 'Target',
    targetValue: 3,
    unit: 'habits',
    check: (s) => ({ current: s.totalHabitsCreated, isUnlocked: s.totalHabitsCreated >= 3 }),
  },
  {
    id: 'hab_5',
    title: 'Pentagon Routine',
    description: 'Build a roster of 5 active habits simultaneously.',
    category: 'HABITS',
    rarity: 'RARE',
    icon: 'Target',
    targetValue: 5,
    unit: 'habits',
    check: (s) => ({ current: s.totalHabitsCreated, isUnlocked: s.totalHabitsCreated >= 5 }),
  },
  {
    id: 'hab_10',
    title: 'Decathlon of Will',
    description: 'Design 10 calibrated habits in your system.',
    category: 'HABITS',
    rarity: 'EPIC',
    icon: 'Target',
    targetValue: 10,
    unit: 'habits',
    check: (s) => ({ current: s.totalHabitsCreated, isUnlocked: s.totalHabitsCreated >= 10 }),
  },
  {
    id: 'hab_15',
    title: 'Habit Ecosystem',
    description: 'Scale your routine engine up to 15 configured habits.',
    category: 'HABITS',
    rarity: 'LEGENDARY',
    icon: 'Target',
    targetValue: 15,
    unit: 'habits',
    check: (s) => ({ current: s.totalHabitsCreated, isUnlocked: s.totalHabitsCreated >= 15 }),
  },
  {
    id: 'hab_yesno',
    title: 'Binary Master',
    description: 'Configure and activate a Yes/No boolean habit.',
    category: 'HABITS',
    rarity: 'COMMON',
    icon: 'Target',
    targetValue: 1,
    unit: 'model',
    check: (s) => ({ current: s.hasYesNo ? 1 : 0, isUnlocked: s.hasYesNo }),
  },
  {
    id: 'hab_numeric',
    title: 'Quantitative Pioneer',
    description: 'Configure and track a Numeric target counter habit.',
    category: 'HABITS',
    rarity: 'COMMON',
    icon: 'Target',
    targetValue: 1,
    unit: 'model',
    check: (s) => ({ current: s.hasNumeric ? 1 : 0, isUnlocked: s.hasNumeric }),
  },
  {
    id: 'hab_timer',
    title: 'Time Lord',
    description: 'Configure and log an interactive Timer duration habit.',
    category: 'HABITS',
    rarity: 'RARE',
    icon: 'Target',
    targetValue: 1,
    unit: 'model',
    check: (s) => ({ current: s.hasTimer ? 1 : 0, isUnlocked: s.hasTimer }),
  },
  {
    id: 'hab_checklist',
    title: 'Subtask General',
    description: 'Configure a dynamic multi-task Checklist habit.',
    category: 'HABITS',
    rarity: 'RARE',
    icon: 'Target',
    targetValue: 1,
    unit: 'model',
    check: (s) => ({ current: s.hasChecklist ? 1 : 0, isUnlocked: s.hasChecklist }),
  },
  {
    id: 'hab_all_4',
    title: 'Grand Quadrant Polymath',
    description: 'Have all 4 adaptive behavioral models active simultaneously.',
    category: 'HABITS',
    rarity: 'EPIC',
    icon: 'Target',
    targetValue: 4,
    unit: 'types',
    check: (s) => {
      const cnt = (s.hasYesNo ? 1 : 0) + (s.hasNumeric ? 1 : 0) + (s.hasTimer ? 1 : 0) + (s.hasChecklist ? 1 : 0);
      return { current: cnt, isUnlocked: cnt === 4 };
    },
  },

  // --------------------------------------------------------------------------
  // 4. WILLPOWER XP MILESTONES (15 ACHIEVEMENTS)
  // --------------------------------------------------------------------------
  {
    id: 'xp_100',
    title: 'Discipline Spark',
    description: 'Accumulate 100 Willpower XP points.',
    category: 'XP',
    rarity: 'COMMON',
    icon: 'Zap',
    targetValue: 100,
    unit: 'XP',
    check: (s) => ({ current: s.totalXp, isUnlocked: s.totalXp >= 100 }),
  },
  {
    id: 'xp_250',
    title: 'Will Awakened',
    description: 'Amass 250 Willpower XP from habit consistency.',
    category: 'XP',
    rarity: 'COMMON',
    icon: 'Zap',
    targetValue: 250,
    unit: 'XP',
    check: (s) => ({ current: s.totalXp, isUnlocked: s.totalXp >= 250 }),
  },
  {
    id: 'xp_500',
    title: 'Iron Foundation',
    description: 'Hit 500 Willpower XP and unlock Tier 2 Vitality (10 Lives)!',
    category: 'XP',
    rarity: 'RARE',
    icon: 'Zap',
    targetValue: 500,
    unit: 'XP',
    check: (s) => ({ current: s.totalXp, isUnlocked: s.totalXp >= 500 }),
  },
  {
    id: 'xp_750',
    title: 'Rising Titan',
    description: 'Reach 750 Willpower XP and unlock Tier 3 Vitality (15 Lives)!',
    category: 'XP',
    rarity: 'RARE',
    icon: 'Zap',
    targetValue: 750,
    unit: 'XP',
    check: (s) => ({ current: s.totalXp, isUnlocked: s.totalXp >= 750 }),
  },
  {
    id: 'xp_1000',
    title: 'Kilo Will',
    description: 'Surpass 1,000 total Willpower XP points (20 Lives Unlocked).',
    category: 'XP',
    rarity: 'RARE',
    icon: 'Zap',
    targetValue: 1000,
    unit: 'XP',
    check: (s) => ({ current: s.totalXp, isUnlocked: s.totalXp >= 1000 }),
  },
  {
    id: 'xp_1500',
    title: 'Fortress of Focus',
    description: 'Achieve 1,500 total Willpower XP.',
    category: 'XP',
    rarity: 'EPIC',
    icon: 'Zap',
    targetValue: 1500,
    unit: 'XP',
    check: (s) => ({ current: s.totalXp, isUnlocked: s.totalXp >= 1500 }),
  },
  {
    id: 'xp_2000',
    title: 'Willpower Grandmaster',
    description: 'Amass 2,000 lifetime Willpower XP points.',
    category: 'XP',
    rarity: 'EPIC',
    icon: 'Zap',
    targetValue: 2000,
    unit: 'XP',
    check: (s) => ({ current: s.totalXp, isUnlocked: s.totalXp >= 2000 }),
  },
  {
    id: 'xp_2500',
    title: 'Vitality Overlord (50 Lives Cap)',
    description: 'Reach 2,500 XP and unlock the maximum possible 50 Lives cap!',
    category: 'XP',
    rarity: 'EPIC',
    icon: 'Zap',
    targetValue: 2500,
    unit: 'XP',
    check: (s) => ({ current: s.totalXp, isUnlocked: s.totalXp >= 2500 }),
  },
  {
    id: 'xp_3500',
    title: 'Unbreakable Spirit',
    description: 'Surpass 3,500 lifetime Willpower XP.',
    category: 'XP',
    rarity: 'LEGENDARY',
    icon: 'Zap',
    targetValue: 3500,
    unit: 'XP',
    check: (s) => ({ current: s.totalXp, isUnlocked: s.totalXp >= 3500 }),
  },
  {
    id: 'xp_5000',
    title: 'Ascendant Will',
    description: 'Amass 5,000 Willpower XP from uncompromising execution.',
    category: 'XP',
    rarity: 'LEGENDARY',
    icon: 'Zap',
    targetValue: 5000,
    unit: 'XP',
    check: (s) => ({ current: s.totalXp, isUnlocked: s.totalXp >= 5000 }),
  },
  {
    id: 'xp_7500',
    title: 'Demigod of Discipline',
    description: 'Cross 7,500 total Willpower XP points.',
    category: 'XP',
    rarity: 'LEGENDARY',
    icon: 'Zap',
    targetValue: 7500,
    unit: 'XP',
    check: (s) => ({ current: s.totalXp, isUnlocked: s.totalXp >= 7500 }),
  },
  {
    id: 'xp_10000',
    title: 'Ten Thousandfold Will',
    description: 'Reach the elite 10,000 Willpower XP milestone.',
    category: 'XP',
    rarity: 'MYTHIC',
    icon: 'Zap',
    targetValue: 10000,
    unit: 'XP',
    check: (s) => ({ current: s.totalXp, isUnlocked: s.totalXp >= 10000 }),
  },
  {
    id: 'xp_15000',
    title: 'Celestial Discipline',
    description: 'Conquer 15,000 lifetime XP in HabitsSeen.',
    category: 'XP',
    rarity: 'MYTHIC',
    icon: 'Zap',
    targetValue: 15000,
    unit: 'XP',
    check: (s) => ({ current: s.totalXp, isUnlocked: s.totalXp >= 15000 }),
  },
  {
    id: 'xp_20000',
    title: 'Legendary God',
    description: 'Reach 20,000 XP and stand at the top tier of human will.',
    category: 'XP',
    rarity: 'MYTHIC',
    icon: 'Zap',
    targetValue: 20000,
    unit: 'XP',
    check: (s) => ({ current: s.totalXp, isUnlocked: s.totalXp >= 20000 }),
  },
  {
    id: 'xp_30000',
    title: 'Absolute Zenith',
    description: 'Reach an unprecedented 30,000 Willpower XP points.',
    category: 'XP',
    rarity: 'MYTHIC',
    icon: 'Zap',
    targetValue: 30000,
    unit: 'XP',
    check: (s) => ({ current: s.totalXp, isUnlocked: s.totalXp >= 30000 }),
  },

  // --------------------------------------------------------------------------
  // 5. WILL HABIT LEVEL TIERS (10 ACHIEVEMENTS)
  // --------------------------------------------------------------------------
  {
    id: 'lvl_1',
    title: 'The Initiate',
    description: 'Unlock Level 1 Will Habit badge upon profile onboarding.',
    category: 'LEVELS',
    rarity: 'COMMON',
    icon: 'Award',
    targetValue: 1,
    unit: 'level',
    check: (s) => ({ current: s.userLevel, isUnlocked: s.userLevel >= 1 }),
  },
  {
    id: 'lvl_2',
    title: 'Iron Will Unlocked',
    description: 'Ascend to Level 2 (500+ XP threshold).',
    category: 'LEVELS',
    rarity: 'RARE',
    icon: 'Award',
    targetValue: 2,
    unit: 'level',
    check: (s) => ({ current: s.userLevel, isUnlocked: s.userLevel >= 2 }),
  },
  {
    id: 'lvl_3',
    title: 'The Unbreakable',
    description: 'Reach Level 3 in the dynamic leveling curve.',
    category: 'LEVELS',
    rarity: 'RARE',
    icon: 'Award',
    targetValue: 3,
    unit: 'level',
    check: (s) => ({ current: s.userLevel, isUnlocked: s.userLevel >= 3 }),
  },
  {
    id: 'lvl_5',
    title: 'Iron Will Veteran',
    description: 'Reach Level 5 in the 30-tier dynamic XP progression.',
    category: 'LEVELS',
    rarity: 'EPIC',
    icon: 'Award',
    targetValue: 5,
    unit: 'level',
    check: (s) => ({ current: s.userLevel, isUnlocked: s.userLevel >= 5 }),
  },
  {
    id: 'lvl_8',
    title: 'Neural Master',
    description: 'Achieve Level 8 in the Willpower hierarchy.',
    category: 'LEVELS',
    rarity: 'EPIC',
    icon: 'Award',
    targetValue: 8,
    unit: 'level',
    check: (s) => ({ current: s.userLevel, isUnlocked: s.userLevel >= 8 }),
  },
  {
    id: 'lvl_10',
    title: 'The Centurion',
    description: 'Ascend to Level 10 of discipline mastery.',
    category: 'LEVELS',
    rarity: 'LEGENDARY',
    icon: 'Award',
    targetValue: 10,
    unit: 'level',
    check: (s) => ({ current: s.userLevel, isUnlocked: s.userLevel >= 10 }),
  },
  {
    id: 'lvl_15',
    title: 'Master Mind',
    description: 'Attain Level 15 rank in your personal profile.',
    category: 'LEVELS',
    rarity: 'LEGENDARY',
    icon: 'Award',
    targetValue: 15,
    unit: 'level',
    check: (s) => ({ current: s.userLevel, isUnlocked: s.userLevel >= 15 }),
  },
  {
    id: 'lvl_20',
    title: 'Stoic Sage',
    description: 'Advance to Level 20 rank of transcendent self-control.',
    category: 'LEVELS',
    rarity: 'LEGENDARY',
    icon: 'Award',
    targetValue: 20,
    unit: 'level',
    check: (s) => ({ current: s.userLevel, isUnlocked: s.userLevel >= 20 }),
  },
  {
    id: 'lvl_25',
    title: 'Legendary Monk',
    description: 'Conquer Level 25 in the Will Habit engine.',
    category: 'LEVELS',
    rarity: 'MYTHIC',
    icon: 'Award',
    targetValue: 25,
    unit: 'level',
    check: (s) => ({ current: s.userLevel, isUnlocked: s.userLevel >= 25 }),
  },
  {
    id: 'lvl_30',
    title: 'The Ascended Being',
    description: 'Reach maximum Level 30 — the highest peak of human discipline.',
    category: 'LEVELS',
    rarity: 'MYTHIC',
    icon: 'Award',
    targetValue: 30,
    unit: 'level',
    check: (s) => ({ current: s.userLevel, isUnlocked: s.userLevel >= 30 }),
  },

  // --------------------------------------------------------------------------
  // 6. PERFECT DAYS (10 ACHIEVEMENTS)
  // --------------------------------------------------------------------------
  {
    id: 'perf_1',
    title: 'Flawless Day',
    description: 'Achieve 100% completion on all scheduled habits for a day.',
    category: 'PERFECT_DAYS',
    rarity: 'COMMON',
    icon: 'Sparkles',
    targetValue: 1,
    unit: 'days',
    check: (s) => ({ current: s.perfectDaysCount, isUnlocked: s.perfectDaysCount >= 1 }),
  },
  {
    id: 'perf_3',
    title: 'Hat Trick Perfection',
    description: 'Score 3 total 100% perfect days.',
    category: 'PERFECT_DAYS',
    rarity: 'RARE',
    icon: 'Sparkles',
    targetValue: 3,
    unit: 'days',
    check: (s) => ({ current: s.perfectDaysCount, isUnlocked: s.perfectDaysCount >= 3 }),
  },
  {
    id: 'perf_7',
    title: 'Sevenfold Perfection',
    description: 'Accumulate 7 lifetime 100% perfect days.',
    category: 'PERFECT_DAYS',
    rarity: 'RARE',
    icon: 'Sparkles',
    targetValue: 7,
    unit: 'days',
    check: (s) => ({ current: s.perfectDaysCount, isUnlocked: s.perfectDaysCount >= 7 }),
  },
  {
    id: 'perf_10',
    title: 'Flawless Ten',
    description: 'Conquer 10 total 100% perfect habit days.',
    category: 'PERFECT_DAYS',
    rarity: 'EPIC',
    icon: 'Sparkles',
    targetValue: 10,
    unit: 'days',
    check: (s) => ({ current: s.perfectDaysCount, isUnlocked: s.perfectDaysCount >= 10 }),
  },
  {
    id: 'perf_14',
    title: 'Fortnight of Flawlessness',
    description: 'Log 14 total 100% perfect days in your journey.',
    category: 'PERFECT_DAYS',
    rarity: 'EPIC',
    icon: 'Sparkles',
    targetValue: 14,
    unit: 'days',
    check: (s) => ({ current: s.perfectDaysCount, isUnlocked: s.perfectDaysCount >= 14 }),
  },
  {
    id: 'perf_21',
    title: 'Three Perfect Weeks',
    description: 'Record 21 total 100% perfect days.',
    category: 'PERFECT_DAYS',
    rarity: 'EPIC',
    icon: 'Sparkles',
    targetValue: 21,
    unit: 'days',
    check: (s) => ({ current: s.perfectDaysCount, isUnlocked: s.perfectDaysCount >= 21 }),
  },
  {
    id: 'perf_30',
    title: 'Month of Perfection',
    description: 'Achieve 30 total 100% perfect days across your history.',
    category: 'PERFECT_DAYS',
    rarity: 'LEGENDARY',
    icon: 'Sparkles',
    targetValue: 30,
    unit: 'days',
    check: (s) => ({ current: s.perfectDaysCount, isUnlocked: s.perfectDaysCount >= 30 }),
  },
  {
    id: 'perf_50',
    title: 'Half-Centurion Perfection',
    description: 'Conquer 50 total 100% perfect days.',
    category: 'PERFECT_DAYS',
    rarity: 'LEGENDARY',
    icon: 'Sparkles',
    targetValue: 50,
    unit: 'days',
    check: (s) => ({ current: s.perfectDaysCount, isUnlocked: s.perfectDaysCount >= 50 }),
  },
  {
    id: 'perf_75',
    title: 'Apex Consistency',
    description: 'Log 75 total 100% perfect days.',
    category: 'PERFECT_DAYS',
    rarity: 'LEGENDARY',
    icon: 'Sparkles',
    targetValue: 75,
    unit: 'days',
    check: (s) => ({ current: s.perfectDaysCount, isUnlocked: s.perfectDaysCount >= 75 }),
  },
  {
    id: 'perf_100',
    title: 'The Perfect Hundred',
    description: 'Attain 100 total 100% perfect days in your lifetime record.',
    category: 'PERFECT_DAYS',
    rarity: 'MYTHIC',
    icon: 'Sparkles',
    targetValue: 100,
    unit: 'days',
    check: (s) => ({ current: s.perfectDaysCount, isUnlocked: s.perfectDaysCount >= 100 }),
  },

  // --------------------------------------------------------------------------
  // 7. VITALITY & LIVES MASTERY (10 ACHIEVEMENTS)
  // --------------------------------------------------------------------------
  {
    id: 'vit_full',
    title: 'Full Vitality',
    description: 'Maintain 100% full hearts in your profile.',
    category: 'VITALITY',
    rarity: 'COMMON',
    icon: 'Heart',
    targetValue: 5,
    unit: 'hearts',
    check: (s) => ({ current: s.hearts, isUnlocked: s.hearts >= s.maxHearts && s.hearts > 0 }),
  },
  {
    id: 'vit_10',
    title: '10 Lives Awakened',
    description: 'Unlock 10 maximum lives capacity by crossing 500 XP.',
    category: 'VITALITY',
    rarity: 'RARE',
    icon: 'Heart',
    targetValue: 10,
    unit: 'lives',
    check: (s) => ({ current: s.maxHearts, isUnlocked: s.maxHearts >= 10 }),
  },
  {
    id: 'vit_15',
    title: '15 Lives Bastion',
    description: 'Unlock 15 maximum lives capacity at 750 XP.',
    category: 'VITALITY',
    rarity: 'RARE',
    icon: 'Heart',
    targetValue: 15,
    unit: 'lives',
    check: (s) => ({ current: s.maxHearts, isUnlocked: s.maxHearts >= 15 }),
  },
  {
    id: 'vit_20',
    title: '20 Lives Fortress',
    description: 'Unlock 20 maximum lives capacity at 1,000 XP.',
    category: 'VITALITY',
    rarity: 'EPIC',
    icon: 'Heart',
    targetValue: 20,
    unit: 'lives',
    check: (s) => ({ current: s.maxHearts, isUnlocked: s.maxHearts >= 20 }),
  },
  {
    id: 'vit_25',
    title: 'Quarter Century Vitality',
    description: 'Scale your health pool to 25 lives capacity at 1,250 XP.',
    category: 'VITALITY',
    rarity: 'EPIC',
    icon: 'Heart',
    targetValue: 25,
    unit: 'lives',
    check: (s) => ({ current: s.maxHearts, isUnlocked: s.maxHearts >= 25 }),
  },
  {
    id: 'vit_30',
    title: '30 Lives Citadel',
    description: 'Unlock 30 maximum lives capacity at 1,500 XP.',
    category: 'VITALITY',
    rarity: 'LEGENDARY',
    icon: 'Heart',
    targetValue: 30,
    unit: 'lives',
    check: (s) => ({ current: s.maxHearts, isUnlocked: s.maxHearts >= 30 }),
  },
  {
    id: 'vit_35',
    title: 'Titan Blood',
    description: 'Expand your life capacity to 35 lives at 1,750 XP.',
    category: 'VITALITY',
    rarity: 'LEGENDARY',
    icon: 'Heart',
    targetValue: 35,
    unit: 'lives',
    check: (s) => ({ current: s.maxHearts, isUnlocked: s.maxHearts >= 35 }),
  },
  {
    id: 'vit_40',
    title: 'Immortal Reservoir',
    description: 'Unlock 40 maximum lives capacity at 2,000 XP.',
    category: 'VITALITY',
    rarity: 'LEGENDARY',
    icon: 'Heart',
    targetValue: 40,
    unit: 'lives',
    check: (s) => ({ current: s.maxHearts, isUnlocked: s.maxHearts >= 40 }),
  },
  {
    id: 'vit_50',
    title: 'Max 50 Lives Capped',
    description: 'Unlock the absolute maximum 50 lives vitality cap at 2,500 XP!',
    category: 'VITALITY',
    rarity: 'MYTHIC',
    icon: 'Heart',
    targetValue: 50,
    unit: 'lives',
    check: (s) => ({ current: s.maxHearts, isUnlocked: s.maxHearts >= 50 }),
  },
  {
    id: 'vit_clutch',
    title: 'Death Defier',
    description: 'Clutch survival with exactly 1 life remaining without triggering Sudden Death!',
    category: 'VITALITY',
    rarity: 'EPIC',
    icon: 'Heart',
    targetValue: 1,
    unit: 'life',
    check: (s) => ({ current: s.hearts === 1 ? 1 : 0, isUnlocked: s.hearts === 1 }),
  },

  // --------------------------------------------------------------------------
  // 8. SOBRIETY & HABIT BREAK HUB (10 ACHIEVEMENTS)
  // --------------------------------------------------------------------------
  {
    id: 'brk_1',
    title: 'Sobriety Initiated',
    description: 'Configure your first Timer Habit Break stopwatch to quit a vice.',
    category: 'HABIT_BREAK',
    rarity: 'COMMON',
    icon: 'ShieldAlert',
    targetValue: 1,
    unit: 'breaks',
    check: (s) => ({ current: s.totalBreaks, isUnlocked: s.totalBreaks >= 1 }),
  },
  {
    id: 'brk_24h',
    title: '24 Hours Clean',
    description: 'Stay completely clean and abstinent for 24 continuous hours.',
    category: 'HABIT_BREAK',
    rarity: 'COMMON',
    icon: 'ShieldAlert',
    targetValue: 24,
    unit: 'hours',
    check: (s) => ({ current: s.maxBreakElapsedHours, isUnlocked: s.maxBreakElapsedHours >= 24 }),
  },
  {
    id: 'brk_3d',
    title: '72-Hour Breakthrough',
    description: 'Overcome the critical first 3 days of sobriety (72 hours).',
    category: 'HABIT_BREAK',
    rarity: 'RARE',
    icon: 'ShieldAlert',
    targetValue: 72,
    unit: 'hours',
    check: (s) => ({ current: s.maxBreakElapsedHours, isUnlocked: s.maxBreakElapsedHours >= 72 }),
  },
  {
    id: 'brk_7d',
    title: 'One-Week Free',
    description: 'Reach 7 full days of clean abstinence on your stopwatch.',
    category: 'HABIT_BREAK',
    rarity: 'RARE',
    icon: 'ShieldAlert',
    targetValue: 168,
    unit: 'hours',
    check: (s) => ({ current: s.maxBreakElapsedHours, isUnlocked: s.maxBreakElapsedHours >= 168 }),
  },
  {
    id: 'brk_14d',
    title: 'Fortnight of Sobriety',
    description: 'Endure 14 days clean without a single reset.',
    category: 'HABIT_BREAK',
    rarity: 'RARE',
    icon: 'ShieldAlert',
    targetValue: 336,
    unit: 'hours',
    check: (s) => ({ current: s.maxBreakElapsedHours, isUnlocked: s.maxBreakElapsedHours >= 336 }),
  },
  {
    id: 'brk_30d',
    title: 'Monthly Clean Milestone',
    description: 'Complete 30 full days of sobriety from destructive loops.',
    category: 'HABIT_BREAK',
    rarity: 'EPIC',
    icon: 'ShieldAlert',
    targetValue: 720,
    unit: 'hours',
    check: (s) => ({ current: s.maxBreakElapsedHours, isUnlocked: s.maxBreakElapsedHours >= 720 }),
  },
  {
    id: 'brk_60d',
    title: 'Dopamine Reboot',
    description: 'Reach 60 days of abstinence as dopamine receptors re-sensitize.',
    category: 'HABIT_BREAK',
    rarity: 'EPIC',
    icon: 'ShieldAlert',
    targetValue: 1440,
    unit: 'hours',
    check: (s) => ({ current: s.maxBreakElapsedHours, isUnlocked: s.maxBreakElapsedHours >= 1440 }),
  },
  {
    id: 'brk_90d',
    title: 'Quarter Year Free',
    description: 'Conquer 90 full days of sobriety.',
    category: 'HABIT_BREAK',
    rarity: 'LEGENDARY',
    icon: 'ShieldAlert',
    targetValue: 2160,
    unit: 'hours',
    check: (s) => ({ current: s.maxBreakElapsedHours, isUnlocked: s.maxBreakElapsedHours >= 2160 }),
  },
  {
    id: 'brk_180d',
    title: 'Half-Year Rebirth',
    description: 'Maintain clean sobriety for 180 continuous days.',
    category: 'HABIT_BREAK',
    rarity: 'LEGENDARY',
    icon: 'ShieldAlert',
    targetValue: 4320,
    unit: 'hours',
    check: (s) => ({ current: s.maxBreakElapsedHours, isUnlocked: s.maxBreakElapsedHours >= 4320 }),
  },
  {
    id: 'brk_365d',
    title: 'One Year Unconquered',
    description: 'Reach 365 days of unbroken freedom from addiction or vice.',
    category: 'HABIT_BREAK',
    rarity: 'MYTHIC',
    icon: 'ShieldAlert',
    targetValue: 8760,
    unit: 'hours',
    check: (s) => ({ current: s.maxBreakElapsedHours, isUnlocked: s.maxBreakElapsedHours >= 8760 }),
  },

  // --------------------------------------------------------------------------
  // 9. LIFE ORGANIZATION & CUSTOMIZATION (5 ACHIEVEMENTS)
  // --------------------------------------------------------------------------
  {
    id: 'org_1',
    title: 'Category Curator',
    description: 'Create your first custom category to organize habits.',
    category: 'ORGANIZATION',
    rarity: 'COMMON',
    icon: 'FolderKanban',
    targetValue: 2,
    unit: 'categories',
    check: (s) => ({ current: s.totalCategories, isUnlocked: s.totalCategories >= 2 }),
  },
  {
    id: 'org_3',
    title: 'Domain Architect',
    description: 'Build 3 distinct life domain categories in HabitsSeen.',
    category: 'ORGANIZATION',
    rarity: 'RARE',
    icon: 'FolderKanban',
    targetValue: 3,
    unit: 'categories',
    check: (s) => ({ current: s.totalCategories, isUnlocked: s.totalCategories >= 3 }),
  },
  {
    id: 'org_5',
    title: 'Categorical Master',
    description: 'Organize your life across 5 or more custom categories.',
    category: 'ORGANIZATION',
    rarity: 'EPIC',
    icon: 'FolderKanban',
    targetValue: 5,
    unit: 'categories',
    check: (s) => ({ current: s.totalCategories, isUnlocked: s.totalCategories >= 5 }),
  },
  {
    id: 'org_breaks_multi',
    title: 'Multi-Front Guardian',
    description: 'Track at least 2 distinct bad habit stopwatches simultaneously.',
    category: 'ORGANIZATION',
    rarity: 'RARE',
    icon: 'FolderKanban',
    targetValue: 2,
    unit: 'breaks',
    check: (s) => ({ current: s.totalBreaks, isUnlocked: s.totalBreaks >= 2 }),
  },
  {
    id: 'org_habits_spread',
    title: 'Balanced Life Spectrum',
    description: 'Have active habits created in at least 3 distinct categories.',
    category: 'ORGANIZATION',
    rarity: 'LEGENDARY',
    icon: 'FolderKanban',
    targetValue: 3,
    unit: 'domains',
    check: (s) => ({ current: s.totalCategories, isUnlocked: s.totalCategories >= 3 }),
  },
];

// Helper to compute user stats and evaluate all 100 achievements dynamically
export function computeUserAchievements(
  habitsOrParams:
    | Habit[]
    | {
        habits: Habit[];
        logs: Record<string, HabitLog>;
        user: UserProfile | null;
        habitBreaks: HabitBreak[];
        categories: Category[];
      },
  maybeLogs?: Record<string, HabitLog>,
  maybeUser?: UserProfile | null,
  maybeHabitBreaks?: HabitBreak[],
  maybeCategories?: Category[]
): {
  achievementsWithStatus: (AchievementDefinition & {
    current: number;
    isUnlocked: boolean;
    percentage: number;
  })[];
  unlockedCount: number;
  totalCount: number;
  percentageUnlocked: number;
} {
  let habits: Habit[];
  let logs: Record<string, HabitLog>;
  let user: UserProfile | null;
  let habitBreaks: HabitBreak[];
  let categories: Category[];

  if (Array.isArray(habitsOrParams)) {
    habits = habitsOrParams;
    logs = maybeLogs || {};
    user = maybeUser ?? null;
    habitBreaks = maybeHabitBreaks || [];
    categories = maybeCategories || [];
  } else {
    habits = habitsOrParams.habits || [];
    logs = habitsOrParams.logs || {};
    user = habitsOrParams.user ?? null;
    habitBreaks = habitsOrParams.habitBreaks || [];
    categories = habitsOrParams.categories || [];
  }

  const activeHabits = habits.filter((h) => !h.isArchived);

  // Best streak across all habits
  let bestStreak = 0;
  let currentStreak = 0;
  for (const h of habits) {
    if (h.stats?.bestStreak && h.stats.bestStreak > bestStreak) {
      bestStreak = h.stats.bestStreak;
    }
    if (h.stats?.currentStreak && h.stats.currentStreak > currentStreak) {
      currentStreak = h.stats.currentStreak;
    }
  }

  // Total completed logs
  const allLogs = Object.values(logs);
  const totalCompletions = allLogs.filter((l) => l.status === 'COMPLETED').length;

  // Habit models present
  const hasYesNo = activeHabits.some((h) => h.type === 'YES_NO');
  const hasNumeric = activeHabits.some((h) => h.type === 'NUMERIC');
  const hasTimer = activeHabits.some((h) => h.type === 'TIMER');
  const hasChecklist = activeHabits.some((h) => h.type === 'CHECKLIST');

  // XP, Levels, Hearts, Perfect Days
  const totalXp = user?.gamification?.totalXp ?? 0;
  const userLevel = user?.gamification?.level ?? 1;
  const perfectDaysCount = user?.gamification?.perfectDaysCompleted?.length ?? 0;
  const maxHearts = user?.gamification?.maxHearts ?? 5;
  const hearts = user?.gamification?.hearts ?? 5;

  // Habit Breaks elapsed
  let maxBreakElapsedHours = 0;
  const now = Date.now();
  for (const b of habitBreaks) {
    if (b.startedAt) {
      const elapsedMs = Math.max(0, now - new Date(b.startedAt).getTime());
      const hours = elapsedMs / (1000 * 60 * 60);
      if (hours > maxBreakElapsedHours) {
        maxBreakElapsedHours = hours;
      }
    }
  }

  const stats: CalculatedStats = {
    bestStreak,
    currentStreak,
    totalCompletions,
    totalHabitsCreated: habits.length,
    hasYesNo,
    hasNumeric,
    hasTimer,
    hasChecklist,
    totalXp,
    userLevel,
    perfectDaysCount,
    maxHearts,
    hearts,
    totalBreaks: habitBreaks.length,
    maxBreakElapsedHours,
    totalCategories: categories.length,
  };

  let unlockedCount = 0;

  const achievementsWithStatus = ACHIEVEMENTS.map((a) => {
    const { current, isUnlocked } = a.check(stats);
    if (isUnlocked) unlockedCount++;
    const percentage = Math.min(100, Math.max(0, Math.round((current / a.targetValue) * 100)));
    return {
      ...a,
      current: Math.round(current),
      isUnlocked,
      percentage,
    };
  });

  const totalCount = ACHIEVEMENTS.length;
  const percentageUnlocked = Math.round((unlockedCount / totalCount) * 100);

  return {
    achievementsWithStatus,
    unlockedCount,
    totalCount,
    percentageUnlocked,
  };
}
