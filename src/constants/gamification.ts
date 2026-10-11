export interface StreakMilestone {
  days: number;
  title: string;
  badgeLabel: string;
  description: string;
}

export const STREAK_CHALLENGES: StreakMilestone[] = [
  { days: 1, title: 'The Spark', badgeLabel: '1D', description: 'The journey of consistency begins with single day.' },
  { days: 7, title: 'One-Week Strong', badgeLabel: '7D', description: 'Survived the first full cycle and weekend.' },
  { days: 10, title: 'Double Digits', badgeLabel: '10D', description: 'Breaking through the initial novelty phase.' },
  { days: 15, title: 'Fortitude', badgeLabel: '15D', description: 'Neural pathways are actively rewiring.' },
  { days: 30, title: 'Monthly Master', badgeLabel: '30D', description: 'A habit crystallized into identity.' },
  { days: 60, title: 'Transformer', badgeLabel: '60D', description: 'Autonomous habit loop successfully formed.' },
  { days: 100, title: 'Centurion of Will', badgeLabel: '100D', description: 'Elite tier of personal discipline.' },
  { days: 200, title: 'Unwavering Pillar', badgeLabel: '200D', description: 'Resistant to excuses, distractions, and burnout.' },
  { days: 365, title: 'Year of Triumph', badgeLabel: '365D', description: 'One complete rotation around the sun unconquered.' },
  { days: 500, title: 'Legendary Monk', badgeLabel: '500D', description: 'Top 0.1% dedication tier achieved.' },
];

export const WILL_HABIT_TIERS = [
  { level: 1, title: 'Will Habit Initiate', minXp: 0, maxXp: 500, color: '#646464' },
  { level: 2, title: 'Will Habit: Iron Will', minXp: 500, maxXp: 1500, color: '#2b9a66' },
  { level: 3, title: 'Will Habit: Unbreakable', minXp: 1500, maxXp: 3500, color: '#3b82f6' },
  { level: 4, title: 'Will Habit: Master Mind', minXp: 3500, maxXp: 7000, color: '#8b5cf6' },
  { level: 5, title: 'Will Habit: Legendary God', minXp: 7000, maxXp: 20000, color: '#ea2804' },
];

export const MISS_PENALTIES = {
  GENUINE_REASON: {
    xpPenalty: 0,
    heartsLost: 0,
    preserveStreak: true,
    maxPerMonth: 3,
    title: 'Genuine Reason',
    badge: '🛡️ Streak Preserved',
  },
  FORGOT_ACCIDENTAL: {
    xpPenalty: 10,
    heartsLost: 1,
    preserveStreak: false,
    maxPerMonth: Infinity,
    title: 'Forgot / Slipped Mind',
    badge: '⚠️ Minor Penalty',
  },
  INTENTIONAL_MISS: {
    xpPenalty: 25,
    heartsLost: 2,
    preserveStreak: false,
    maxPerMonth: Infinity,
    title: 'Intentional Skip',
    badge: '❌ Major Penalty',
  },
} as const;

export const FLAME_TIERS = [
  { minStreak: 365, title: 'Legendary Flame', color: '#ea2804', text: 'text-red-500', glow: 'shadow-red-500/50' },
  { minStreak: 100, title: 'Golden Flame', color: '#eab308', text: 'text-amber-500', glow: 'shadow-amber-500/50' },
  { minStreak: 30, title: 'Blue Flame', color: '#3b82f6', text: 'text-blue-500', glow: 'shadow-blue-500/50' },
  { minStreak: 7, title: 'Orange Flame', color: '#f97316', text: 'text-orange-500', glow: 'shadow-orange-500/30' },
  { minStreak: 1, title: 'Spark', color: '#94a3b8', text: 'text-slate-400', glow: '' },
];

export function getFlameTier(streak: number) {
  return FLAME_TIERS.find((t) => streak >= t.minStreak) || FLAME_TIERS[FLAME_TIERS.length - 1];
}

// 30-level dynamic XP progression curve: XP(L) = round(100 * L^1.6)
export const xpForLevel = (L: number) => Math.round(100 * Math.pow(L, 1.6));

export function levelFromXp(totalXp: number): {
  level: number;
  title: string;
  currentLevelXp: number;
  nextLevelXp: number;
  progress: number;
} {
  let L = 1;
  while (L < 30 && totalXp >= xpForLevel(L + 1)) {
    L++;
  }
  const currentLevelXp = xpForLevel(L);
  const nextLevelXp = xpForLevel(L + 1);
  const progress = Math.min(1, Math.max(0, (totalXp - currentLevelXp) / Math.max(1, nextLevelXp - currentLevelXp)));

  let title = 'Will Initiate';
  if (L >= 30) title = 'Ascended';
  else if (L >= 25) title = 'Legendary Monk';
  else if (L >= 20) title = 'Stoic Sage';
  else if (L >= 15) title = 'Master Mind';
  else if (L >= 10) title = 'Unbreakable';
  else if (L >= 5) title = 'Iron Will';

  return { level: L, title, currentLevelXp, nextLevelXp, progress };
}
