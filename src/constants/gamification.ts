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
