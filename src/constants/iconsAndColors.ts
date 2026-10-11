import React from 'react';
import {
  Flame,
  Dumbbell,
  BookOpen,
  Droplets,
  HeartPulse,
  Moon,
  Sun,
  Brain,
  Apple,
  Coffee,
  PenTool,
  Code,
  Wallet,
  Music,
  Footprints,
  Target,
  Sparkles,
  ShieldCheck,
  Zap,
  Smile,
  Clock,
  Leaf,
  Briefcase,
  Users,
  Palette,
  Bed,
  Trophy,
  Compass,
  Crosshair,
  LayoutGrid,
  Gamepad2,
  ShoppingBag,
  Package,
  Cigarette,
  Wine,
  Beer,
  Smartphone,
  Tv,
  Pizza,
  Cookie,
  Pill,
  Coins,
  BedDouble,
  ShieldAlert,
  Skull,
  HeartCrack,
  AlertOctagon,
  Scale,
  Scissors,
  Eye,
} from 'lucide-react';

export interface IconOption {
  id: string;
  label: string;
  icon: React.ComponentType<{
    className?: string;
    size?: number | string;
    strokeWidth?: number | string;
  }>;
}

export const CATEGORY_ICONS: IconOption[] = [
  // Gaming, Digital & Screen vices
  { id: 'gamepad-2', label: 'Games & Gaming', icon: Gamepad2 },
  { id: 'smartphone', label: 'Screen & Social Media', icon: Smartphone },
  { id: 'tv', label: 'Binge Watching & TV', icon: Tv },
  
  // Beauty, Skincare & Grooming
  { id: 'sparkles', label: 'Skincare & Glow', icon: Sparkles },
  { id: 'scissors', label: 'Grooming & Haircare', icon: Scissors },
  { id: 'smile', label: 'Mood & Face', icon: Smile },

  // Products, Shopping & Finances
  { id: 'shopping-bag', label: 'Shopping & Clothes', icon: ShoppingBag },
  { id: 'package', label: 'Product Deliveries', icon: Package },
  { id: 'wallet', label: 'Finances & Budget', icon: Wallet },
  { id: 'coins', label: 'Spending & Gambling', icon: Coins },

  // Health, Diet, Food & Supplements
  { id: 'pill', label: 'Supplements & Meds', icon: Pill },
  { id: 'apple', label: 'Clean Diet', icon: Apple },
  { id: 'pizza', label: 'Junk Food', icon: Pizza },
  { id: 'cookie', label: 'Sugar & Sweets', icon: Cookie },
  { id: 'droplets', label: 'Hydration', icon: Droplets },
  { id: 'coffee', label: 'Caffeine & Coffee', icon: Coffee },

  // Abstinence, Vices & Harm Reduction
  { id: 'cigarette', label: 'Smoking & Vaping', icon: Cigarette },
  { id: 'wine', label: 'Alcohol & Wine', icon: Wine },
  { id: 'beer', label: 'Beer & Drinking', icon: Beer },
  { id: 'skull', label: 'Toxic Habits', icon: Skull },
  { id: 'heart-crack', label: 'Overthinking & Heartbreak', icon: HeartCrack },
  { id: 'alert-octagon', label: 'Impulses & Triggers', icon: AlertOctagon },
  { id: 'shield-alert', label: 'Strict Abstinence', icon: ShieldAlert },
  { id: 'shield-check', label: 'Discipline', icon: ShieldCheck },

  // Fitness, Body & Sleep
  { id: 'dumbbell', label: 'Workout & Gym', icon: Dumbbell },
  { id: 'heart-pulse', label: 'Cardio & Heart', icon: HeartPulse },
  { id: 'footprints', label: 'Daily Steps', icon: Footprints },
  { id: 'bed-double', label: 'Sleep & Night Routine', icon: BedDouble },
  { id: 'moon', label: 'Rest & Deep Sleep', icon: Moon },
  { id: 'sun', label: 'Morning Routine', icon: Sun },

  // Productivity, Learning & Mind
  { id: 'brain', label: 'Mindset & Meditation', icon: Brain },
  { id: 'book-open', label: 'Reading Books', icon: BookOpen },
  { id: 'code', label: 'Coding & Dev', icon: Code },
  { id: 'pen-tool', label: 'Writing & Journaling', icon: PenTool },
  { id: 'target', label: 'Deep Focus', icon: Target },
  { id: 'eye', label: 'Screen Awareness', icon: Eye },
  { id: 'briefcase', label: 'Career & Work', icon: Briefcase },
  { id: 'flame', label: 'Consistency & Fire', icon: Flame },
  { id: 'trophy', label: 'Milestones & Wins', icon: Trophy },
  { id: 'scale', label: 'Life Balance', icon: Scale },
  { id: 'clock', label: 'Punctuality', icon: Clock },
  { id: 'leaf', label: 'Nature & Calm', icon: Leaf },
  { id: 'music', label: 'Music & Audio', icon: Music },
  { id: 'palette', label: 'Art & Creativity', icon: Palette },
  { id: 'users', label: 'Relationships & Social', icon: Users },
  { id: 'layout-grid', label: 'General / Others', icon: LayoutGrid },
];

// Rich, ultra-vibrant, bright colors that pop clearly on screen
export const CATEGORY_COLORS: { hex: string; name: string }[] = [
  { hex: '#E11D48', name: 'Bright Rose' },
  { hex: '#EA580C', name: 'Vibrant Orange' },
  { hex: '#D97706', name: 'Golden Amber' },
  { hex: '#059669', name: 'Emerald Green' },
  { hex: '#0D9488', name: 'Vivid Teal' },
  { hex: '#0284C7', name: 'Electric Cyan' },
  { hex: '#2563EB', name: 'Royal Blue' },
  { hex: '#4F46E5', name: 'Deep Indigo' },
  { hex: '#7C3AED', name: 'Vivid Purple' },
  { hex: '#C026D3', name: 'Neon Fuchsia' },
  { hex: '#DB2777', name: 'Hot Pink' },
  { hex: '#65A30D', name: 'Fresh Lime' },
  { hex: '#DC2626', name: 'Ruby Red' },
  { hex: '#9333EA', name: 'Electric Violet' },
  { hex: '#475569', name: 'Slate Gray' },
];

export {
  STREAK_CHALLENGES,
  WILL_HABIT_TIERS,
  type StreakMilestone,
} from './gamification';

