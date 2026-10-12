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
  // Added icons for requested categories
  Candy,
  Cake,
  CakeSlice,
  Cupcake,
  IceCream,
  IceCreamBowl,
  Sunrise,
  AlarmClock,
  MoonStar,
  CloudMoon,
  Sunset,
  Utensils,
  UtensilsCrossed,
  Salad,
  Carrot,
  Soup,
  Hamburger,
  Sandwich,
  Popcorn,
  CupSoda,
  BicepsFlexed,
  Bike,
  PillBottle,
  BriefcaseBusiness,
  Laptop,
  HeartHandshake,
  Baby,
  Heart,
  HouseHeart,
} from 'lucide-react';

export type IconCategoryKey =
  | 'all'
  | 'sweets'
  | 'morning'
  | 'night'
  | 'evening'
  | 'eating'
  | 'junk_food'
  | 'exercise'
  | 'supplements'
  | 'work'
  | 'family'
  | 'vices'
  | 'others';

export interface IconCategoryMeta {
  id: IconCategoryKey;
  label: string;
  emoji: string;
}

export const ICON_CATEGORIES: IconCategoryMeta[] = [
  { id: 'all', label: 'All', emoji: '✨' },
  { id: 'sweets', label: 'Sweets & Sugar', emoji: '🍬' },
  { id: 'morning', label: 'Morning', emoji: '🌅' },
  { id: 'night', label: 'Night', emoji: '🌙' },
  { id: 'evening', label: 'Evening', emoji: '🌇' },
  { id: 'eating', label: 'Healthy Eating', emoji: '🥗' },
  { id: 'junk_food', label: 'Junk Food', emoji: '🍕' },
  { id: 'exercise', label: 'Exercise & Gym', emoji: '💪' },
  { id: 'supplements', label: 'Supplements', emoji: '💊' },
  { id: 'work', label: 'Work & Career', emoji: '💼' },
  { id: 'family', label: 'Parents (Mom & Dad)', emoji: '👨‍👩‍👧' },
  { id: 'vices', label: 'Vices & Bad Habits', emoji: '🚫' },
  { id: 'others', label: 'Mind & Others', emoji: '🎯' },
];

export interface IconOption {
  id: string;
  label: string;
  category: IconCategoryKey;
  icon: React.ComponentType<{
    className?: string;
    size?: number | string;
    strokeWidth?: number | string;
  }>;
}

export const CATEGORY_ICONS: IconOption[] = [
  // ==========================================
  // 1. SWEETS & SUGAR (Requested by user)
  // ==========================================
  { id: 'candy', label: 'Sugar & Candy', category: 'sweets', icon: Candy },
  { id: 'cake', label: 'Cake & Pastries', category: 'sweets', icon: Cake },
  { id: 'cake-slice', label: 'Cake Slice & Desserts', category: 'sweets', icon: CakeSlice },
  { id: 'cupcake', label: 'Cupcake & Bakery', category: 'sweets', icon: Cupcake },
  { id: 'ice-cream', label: 'Ice Cream Cone', category: 'sweets', icon: IceCream },
  { id: 'ice-cream-bowl', label: 'Sundae & Ice Cream', category: 'sweets', icon: IceCreamBowl },
  { id: 'cookie', label: 'Cookies & Biscuits', category: 'sweets', icon: Cookie },

  // ==========================================
  // 2. MORNING ROUTINE
  // ==========================================
  { id: 'sunrise', label: 'Sunrise & Early Rise', category: 'morning', icon: Sunrise },
  { id: 'sun', label: 'Morning Sunshine', category: 'morning', icon: Sun },
  { id: 'alarm-clock', label: 'Alarm & Punctuality', category: 'morning', icon: AlarmClock },
  { id: 'coffee', label: 'Morning Coffee / Tea', category: 'morning', icon: Coffee },
  { id: 'zap', label: 'Morning Energy & Boost', category: 'morning', icon: Zap },

  // ==========================================
  // 3. NIGHT & SLEEP
  // ==========================================
  { id: 'moon', label: 'Night Routine & Moon', category: 'night', icon: Moon },
  { id: 'moon-star', label: 'Deep Sleep & Stargazing', category: 'night', icon: MoonStar },
  { id: 'bed', label: 'Early Bedtime', category: 'night', icon: Bed },
  { id: 'bed-double', label: 'Restorative Sleep', category: 'night', icon: BedDouble },
  { id: 'cloud-moon', label: 'Night Wind Down', category: 'night', icon: CloudMoon },

  // ==========================================
  // 4. EVENING
  // ==========================================
  { id: 'sunset', label: 'Sunset & Dusk', category: 'evening', icon: Sunset },
  { id: 'book-open', label: 'Evening Reading', category: 'evening', icon: BookOpen },
  { id: 'music', label: 'Evening Music & Unwind', category: 'evening', icon: Music },

  // ==========================================
  // 5. HEALTHY EATING & NUTRITION
  // ==========================================
  { id: 'utensils', label: 'Mindful Meals & Dining', category: 'eating', icon: Utensils },
  { id: 'utensils-crossed', label: 'Eating & Fasting Window', category: 'eating', icon: UtensilsCrossed },
  { id: 'salad', label: 'Salad & Greens', category: 'eating', icon: Salad },
  { id: 'apple', label: 'Fresh Fruits & Clean Diet', category: 'eating', icon: Apple },
  { id: 'carrot', label: 'Vegetables & Fiber', category: 'eating', icon: Carrot },
  { id: 'soup', label: 'Warm Soups & Home Food', category: 'eating', icon: Soup },

  // ==========================================
  // 6. JUNK FOOD
  // ==========================================
  { id: 'pizza', label: 'Pizza & Fast Food', category: 'junk_food', icon: Pizza },
  { id: 'hamburger', label: 'Burgers & Fries', category: 'junk_food', icon: Hamburger },
  { id: 'sandwich', label: 'Deli Sandwiches', category: 'junk_food', icon: Sandwich },
  { id: 'popcorn', label: 'Late Night Snacks & Popcorn', category: 'junk_food', icon: Popcorn },
  { id: 'cup-soda', label: 'Soda & Sugary Drinks', category: 'junk_food', icon: CupSoda },

  // ==========================================
  // 7. EXERCISE & FITNESS
  // ==========================================
  { id: 'dumbbell', label: 'Gym & Weight Training', category: 'exercise', icon: Dumbbell },
  { id: 'biceps-flexed', label: 'Strength & Muscle Building', category: 'exercise', icon: BicepsFlexed },
  { id: 'bike', label: 'Cycling & Cardio', category: 'exercise', icon: Bike },
  { id: 'footprints', label: 'Daily Steps & Walking', category: 'exercise', icon: Footprints },
  { id: 'heart-pulse', label: 'Cardio & Heart Health', category: 'exercise', icon: HeartPulse },
  { id: 'flame', label: 'Calorie Burn & Fire', category: 'exercise', icon: Flame },
  { id: 'trophy', label: 'Athletic Milestones', category: 'exercise', icon: Trophy },

  // ==========================================
  // 8. SUPPLEMENTS & HEALTH
  // ==========================================
  { id: 'pill', label: 'Vitamins & Capsules', category: 'supplements', icon: Pill },
  { id: 'pill-bottle', label: 'Supplement Bottles', category: 'supplements', icon: PillBottle },
  { id: 'droplets', label: 'Daily Hydration & Electrolytes', category: 'supplements', icon: Droplets },
  { id: 'sparkles', label: 'Skin Care & Glow Supplements', category: 'supplements', icon: Sparkles },

  // ==========================================
  // 9. WORK, CAREER & PRODUCTIVITY
  // ==========================================
  { id: 'briefcase', label: 'Career & Professional Work', category: 'work', icon: Briefcase },
  { id: 'briefcase-business', label: 'Business & Office Meetings', category: 'work', icon: BriefcaseBusiness },
  { id: 'laptop', label: 'Deep Work & Laptop Time', category: 'work', icon: Laptop },
  { id: 'code', label: 'Software Coding & Development', category: 'work', icon: Code },
  { id: 'pen-tool', label: 'Writing & Creative Work', category: 'work', icon: PenTool },
  { id: 'target', label: 'High Focus & Goal Execution', category: 'work', icon: Target },
  { id: 'clock', label: 'Punctuality & Time Blocking', category: 'work', icon: Clock },
  { id: 'wallet', label: 'Budget & Finances', category: 'work', icon: Wallet },
  { id: 'coins', label: 'Savings & Income Tracking', category: 'work', icon: Coins },

  // ==========================================
  // 10. PARENTS, MOM, DAD & FAMILY (Requested by user)
  // ==========================================
  { id: 'users', label: 'Parents (Mom & Dad)', category: 'family', icon: Users },
  { id: 'heart-handshake', label: 'Respect & Care for Parents', category: 'family', icon: HeartHandshake },
  { id: 'heart', label: 'Family Love & Quality Time', category: 'family', icon: Heart },
  { id: 'house-heart', label: 'Home & Family Bonding', category: 'family', icon: HouseHeart },
  { id: 'baby', label: 'Children & Family Care', category: 'family', icon: Baby },
  { id: 'smile', label: 'Family Happiness & Smiles', category: 'family', icon: Smile },

  // ==========================================
  // 11. VICES, BAD HABITS & QUITTING
  // ==========================================
  { id: 'cigarette', label: 'Smoking & Vaping', category: 'vices', icon: Cigarette },
  { id: 'wine', label: 'Alcohol & Wine', category: 'vices', icon: Wine },
  { id: 'beer', label: 'Beer & Excessive Drinking', category: 'vices', icon: Beer },
  { id: 'gamepad-2', label: 'Gaming Addiction', category: 'vices', icon: Gamepad2 },
  { id: 'smartphone', label: 'Doomscrolling & Phone Screen', category: 'vices', icon: Smartphone },
  { id: 'tv', label: 'Binge Watching TV / OTT', category: 'vices', icon: Tv },
  { id: 'shopping-bag', label: 'Impulsive Shopping', category: 'vices', icon: ShoppingBag },
  { id: 'skull', label: 'Toxic Vices & Harmful Habits', category: 'vices', icon: Skull },
  { id: 'heart-crack', label: 'Overthinking & Negative Loops', category: 'vices', icon: HeartCrack },
  { id: 'alert-octagon', label: 'Impulses & Emotional Triggers', category: 'vices', icon: AlertOctagon },
  { id: 'shield-alert', label: 'Strict Abstinence Shield', category: 'vices', icon: ShieldAlert },
  { id: 'shield-check', label: 'Unshakable Discipline', category: 'vices', icon: ShieldCheck },

  // ==========================================
  // 12. OTHERS & GENERAL
  // ==========================================
  { id: 'brain', label: 'Mindset & Meditation', category: 'others', icon: Brain },
  { id: 'leaf', label: 'Nature & Calm', category: 'others', icon: Leaf },
  { id: 'palette', label: 'Art, Hobbies & Creativity', category: 'others', icon: Palette },
  { id: 'scale', label: 'Life Balance', category: 'others', icon: Scale },
  { id: 'scissors', label: 'Grooming & Self-Care', category: 'others', icon: Scissors },
  { id: 'eye', label: 'Screen Mindfulness & Eye Care', category: 'others', icon: Eye },
  { id: 'compass', label: 'Life Direction & Exploration', category: 'others', icon: Compass },
  { id: 'crosshair', label: 'Precision Targets', category: 'others', icon: Crosshair },
  { id: 'package', label: 'Deliveries & Logistics', category: 'others', icon: Package },
  { id: 'layout-grid', label: 'General / Miscellaneous', category: 'others', icon: LayoutGrid },
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
