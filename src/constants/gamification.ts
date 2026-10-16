export interface StreakMilestone {
  days: number;
  title: string;
  badgeLabel: string;
  description: string;
}

export const STREAK_CHALLENGES: StreakMilestone[] = [
  { days: 1, title: 'The Spark', badgeLabel: '1D', description: 'The journey of consistency begins with a single day.' },
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
    xpPenalty: 15,
    heartsLost: 1,
    preserveStreak: false,
    maxPerMonth: Infinity,
    title: 'Forgot / Slipped Mind',
    badge: '⚠️ Minor Penalty',
  },
  INTENTIONAL_MISS: {
    xpPenalty: 25,
    heartsLost: 1,
    preserveStreak: false,
    maxPerMonth: Infinity,
    title: 'Intentional Skip / Procrastinated',
    badge: '❌ Major Penalty',
  },
} as const;

export const XP_LOSS_PER_HEART = 350;
export const MIDNIGHT_MISSED_HABIT_XP_PENALTY = 50;

/**
 * Calculates heart deductions based on accumulated XP losses:
 * Every 350 XP lost deducts exactly 1 heart (-1 Heart per 350 XP down).
 * Any remainder (0 - 349) is carried forward.
 */
export function calculateHeartLossFromXpDrop(
  xpDropAmount: number,
  existingLossAccumulator: number = 0
): { heartsToDeduct: number; newLossAccumulator: number } {
  if (xpDropAmount <= 0) {
    return { heartsToDeduct: 0, newLossAccumulator: existingLossAccumulator };
  }
  const totalLoss = existingLossAccumulator + xpDropAmount;
  const heartsToDeduct = Math.floor(totalLoss / XP_LOSS_PER_HEART);
  const newLossAccumulator = totalLoss % XP_LOSS_PER_HEART;
  return { heartsToDeduct, newLossAccumulator };
}

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
export const xpForLevel = (L: number) => Math.round(100 * Math.pow(Math.max(1, L), 1.6));

export function getTitleForLevel(level: number): string {
  const L = Math.floor(Math.max(1, level));
  if (L >= 30) return 'The Ascended';
  if (L >= 25) return 'Legendary Monk';
  if (L >= 20) return 'Stoic Sage';
  if (L >= 15) return 'Master Mind';
  if (L >= 10) return 'The Centurion';
  if (L >= 8) return 'Neural Master';
  if (L >= 5) return 'Iron Will Veteran';
  if (L >= 2) return 'Iron Will';
  return 'Will Habit Initiate';
}

export function getColorForLevel(level: number): string {
  const L = Math.floor(Math.max(1, level));
  if (L >= 30) return '#ea2804'; // Mythic red
  if (L >= 25) return '#f59e0b'; // Amber
  if (L >= 20) return '#8b5cf6'; // Purple
  if (L >= 15) return '#3b82f6'; // Blue
  if (L >= 10) return '#06b6d4'; // Cyan
  if (L >= 5) return '#10b981';  // Emerald
  if (L >= 2) return '#2b9a66';  // Green
  return '#646464';              // Slate
}

export interface WillHabitTier {
  level: number;
  title: string;
  minXp: number;
  maxXp: number;
  color: string;
}

export const WILL_HABIT_TIERS: WillHabitTier[] = Array.from({ length: 30 }, (_, i) => {
  const level = i + 1;
  return {
    level,
    title: getTitleForLevel(level),
    minXp: level === 1 ? 0 : xpForLevel(level),
    maxXp: level === 30 ? Infinity : xpForLevel(level + 1),
    color: getColorForLevel(level),
  };
});

export function levelFromXp(totalXp: number): {
  level: number;
  title: string;
  currentLevelXp: number;
  nextLevelXp: number;
  progress: number;
} {
  const safeXp = Math.max(0, Math.floor(Number(totalXp) || 0));
  let L = 1;
  while (L < 30 && safeXp >= xpForLevel(L + 1)) {
    L++;
  }
  const currentLevelXp = L === 1 ? 0 : xpForLevel(L);
  const nextLevelXp = xpForLevel(L + 1);
  const progress = Math.min(
    1,
    Math.max(0, (safeXp - currentLevelXp) / Math.max(1, nextLevelXp - currentLevelXp))
  );

  return {
    level: L,
    title: getTitleForLevel(L),
    currentLevelXp,
    nextLevelXp,
    progress,
  };
}

/**
 * Dynamic Vitality (Hearts / Lives) Progression:
 * - Starting Base (0 - 499 XP): 5 Lives
 * - 500 XP: 10 Lives
 * - 750 XP: 15 Lives
 * - 1000 XP: 20 Lives
 * - Every +250 XP awards +5 Lives up to a hard cap of 50 Lives (at 2500 XP).
 */
export function calculateMaxHearts(totalXp: number): number {
  if (totalXp < 500) return 5;
  const extraTiers = Math.floor((totalXp - 500) / 250);
  const calculated = 10 + extraTiers * 5;
  return Math.min(50, Math.max(5, calculated));
}

export function getNextHeartsUpgrade(totalXp: number): {
  currentMax: number;
  nextThreshold: number | null;
  xpNeeded: number;
} {
  const currentMax = calculateMaxHearts(totalXp);
  if (currentMax >= 50) {
    return { currentMax: 50, nextThreshold: null, xpNeeded: 0 };
  }
  let nextThreshold = 500;
  if (totalXp >= 500) {
    const tier = Math.floor((totalXp - 500) / 250);
    nextThreshold = 500 + (tier + 1) * 250;
  }
  return {
    currentMax,
    nextThreshold,
    xpNeeded: Math.max(0, nextThreshold - totalXp),
  };
}

export function getChallengeReward(challenge: { targetDays: number }) {
  const targetDays = Math.max(1, challenge.targetDays || 7);
  const dailyXp = 50;
  const victoryBonusXp = targetDays * 30;
  const totalPossibleXp = targetDays * dailyXp + victoryBonusXp;
  return {
    dailyXp,
    victoryBonusXp,
    totalPossibleXp,
  };
}
