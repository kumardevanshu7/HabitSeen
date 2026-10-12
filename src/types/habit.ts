export type HabitType = 'YES_NO' | 'NUMERIC' | 'TIMER' | 'CHECKLIST';

export type NumericOperator = 'AT_LEAST' | 'LESS_THAN' | 'EXACTLY' | 'ANY_VALUE';

export type TimerOperator = 'AT_LEAST' | 'LESS_THAN' | 'ANY_VALUE';

export type PriorityLevel = number; // 0 to 100 (100 = Highest priority, 0 = Lowest)

export type FrequencyType =
  | 'EVERYDAY'
  | 'SPECIFIC_DAYS_OF_WEEK'
  | 'SPECIFIC_DAYS_OF_MONTH'
  | 'SPECIFIC_DAYS_OF_YEAR'
  | 'DAYS_PER_PERIOD'
  | 'INTERVAL_REPEAT';

export interface ChecklistItem {
  id: string;
  text: string;
  isStarred?: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;         // Lucide icon name
  color: string;        // Hex code
  isDefault?: boolean;
  order?: number;       // Custom sort order
  createdAt: string;
}

export interface HabitConfig {
  numeric?: {
    operator: NumericOperator;
    goal: number;
    unit: string;
    suffix: 'a day';
  };
  timer?: {
    operator: TimerOperator;
    targetSeconds: number; // e.g. 1800 for 30m
  };
  checklist?: {
    items: ChecklistItem[];
    successCondition: 'ALL_MANDATORY' | 'CUSTOM_MIN_ITEMS' | 'STARRED_ONLY';
    customMinCount?: number;
  };
}

export interface HabitFrequency {
  type: FrequencyType;
  daysOfWeek?: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  daysOfMonth?: number[]; // 1..31
  daysOfYear?: string[]; // MM-DD
  daysPerPeriod?: {
    targetCount: number;
    period: 'WEEK' | 'MONTH' | 'YEAR';
  };
  repeatEveryDays?: number; // every N days
}

export interface HabitSchedule {
  startDate: string; // YYYY-MM-DD
  endDate?: string;  // YYYY-MM-DD
  totalDays: number; // Duration in days
  priority: PriorityLevel;
}

export interface HabitStats {
  currentStreak: number;
  bestStreak: number;
  timesCompletedThisWeek: number;
  timesCompletedThisMonth: number;
  timesCompletedThisYear: number;
  timesCompletedAllTime: number;
  totalTrackedDays: number;
  unlockedChallenges: number[]; // e.g. [1, 7, 10, 15, 30, 60, 100, 200, 365, 500]
}

export interface Habit {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  type: HabitType;
  config: HabitConfig;
  frequency: HabitFrequency;
  schedule: HabitSchedule;
  stats: HabitStats;
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type HabitLogStatus = 'COMPLETED' | 'PARTIAL' | 'SKIPPED' | 'FAILED' | 'EXCUSED' | 'MISSED';

export type MissedReasonType = 'GENUINE_REASON' | 'FORGOT_ACCIDENTAL' | 'INTENTIONAL_MISS';

export interface HabitLog {
  date: string; // YYYY-MM-DD
  habitId: string;
  status: HabitLogStatus;
  valueYesNo?: boolean;
  valueNumeric?: number;
  valueTimerSeconds?: number;
  valueChecklistCompletedItemIds?: string[];
  notes?: string;
  missedReasonType?: MissedReasonType;
  missedReasonText?: string;
  xpEarned: number;
  loggedAt: string;
}

export interface RelapseRecord {
  id: string;
  endedAt: string;
  durationSeconds: number;
  reason?: string;
}

export interface HabitBreak {
  id: string;
  name: string;             // Bad habit to quit
  categoryId: string;
  icon: string;
  color: string;
  description?: string;
  startedAt: string;        // ISO timestamp
  bestStreakSeconds: number;
  unlockedMilestones: number[]; // seconds: [86400 (1d), 604800 (7d), ...]
  relapseHistory: RelapseRecord[];
  isArchived?: boolean;
  createdAt: string;
}

export interface UserSecurityConfig {
  question: string;
  answer: string; // Stored trimmed and in lowercase for case-insensitive verification
}

export interface UserProfile {
  name: string;
  age: number;
  relationStatus: 'single' | 'in_relationship' | 'married' | 'prefer_not_to_say';
  gender: 'male' | 'female' | 'non_binary' | 'other';
  isOnboarded: boolean;
  security?: UserSecurityConfig;
  gamification: {
    level: number;
    levelTitle: string;
    totalXp: number;
    consistencyScore: number; // 0 - 100%
    hearts: number;           // Default 5 ❤️
    maxHearts: number;        // Default 5
    perfectDaysCompleted?: string[]; // Dates (YYYY-MM-DD) where 100% perfect day bonus was awarded
  };
}
