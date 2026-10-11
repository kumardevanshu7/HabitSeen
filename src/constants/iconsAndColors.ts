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
  { id: 'flame', label: 'Consistency', icon: Flame },
  { id: 'dumbbell', label: 'Workout', icon: Dumbbell },
  { id: 'book-open', label: 'Reading', icon: BookOpen },
  { id: 'droplets', label: 'Hydration', icon: Droplets },
  { id: 'heart-pulse', label: 'Health', icon: HeartPulse },
  { id: 'moon', label: 'Sleep', icon: Moon },
  { id: 'sun', label: 'Morning', icon: Sun },
  { id: 'brain', label: 'Mindset', icon: Brain },
  { id: 'apple', label: 'Diet', icon: Apple },
  { id: 'coffee', label: 'Moderation', icon: Coffee },
  { id: 'pen-tool', label: 'Writing', icon: PenTool },
  { id: 'code', label: 'Coding', icon: Code },
  { id: 'wallet', label: 'Finances', icon: Wallet },
  { id: 'music', label: 'Music', icon: Music },
  { id: 'footprints', label: 'Steps', icon: Footprints },
  { id: 'target', label: 'Focus', icon: Target },
  { id: 'sparkles', label: 'Self Care', icon: Sparkles },
  { id: 'shield-check', label: 'Discipline', icon: ShieldCheck },
  { id: 'zap', label: 'Energy', icon: Zap },
  { id: 'smile', label: 'Mood', icon: Smile },
  { id: 'clock', label: 'Punctuality', icon: Clock },
  { id: 'leaf', label: 'Nature', icon: Leaf },
  { id: 'briefcase', label: 'Career', icon: Briefcase },
  { id: 'users', label: 'Family', icon: Users },
  { id: 'palette', label: 'Creativity', icon: Palette },
  { id: 'bed', label: 'Rest', icon: Bed },
  { id: 'trophy', label: 'Goals', icon: Trophy },
  { id: 'compass', label: 'Reflection', icon: Compass },
  { id: 'crosshair', label: 'Precision', icon: Crosshair },
  { id: 'layout-grid', label: 'Others', icon: LayoutGrid },
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

