import {
  Habit,
  HabitBreak,
  HabitLog,
  Category,
  UserProfile,
} from '../types/habit';

export interface IHabitRepository {
  // User & Profile
  getUserProfile(userId: string): Promise<UserProfile | null>;
  saveUserProfile(userId: string, profile: UserProfile): Promise<void>;

  // Categories
  getCategories(userId: string): Promise<Category[]>;
  saveCategory(userId: string, category: Category): Promise<void>;
  deleteCategory(userId: string, categoryId: string): Promise<void>;

  // Habits
  getHabits(userId: string): Promise<Habit[]>;
  saveHabit(userId: string, habit: Habit): Promise<void>;
  deleteHabit(userId: string, habitId: string): Promise<void>;

  // Logs
  getHabitLogs(userId: string, habitId: string): Promise<HabitLog[]>;
  saveHabitLog(userId: string, log: HabitLog): Promise<void>;

  // Timer Habit Break
  getHabitBreaks(userId: string): Promise<HabitBreak[]>;
  saveHabitBreak(userId: string, habitBreak: HabitBreak): Promise<void>;
  deleteHabitBreak(userId: string, breakId: string): Promise<void>;
}
