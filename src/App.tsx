import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase';
import { useAppStore } from './stores/useAppStore';
import { LandingPage } from './components/auth/LandingPage';
import { Navbar } from './components/navigation/Navbar';
import { BottomNav } from './components/navigation/BottomNav';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { HabitsView } from './components/habits/HabitsView';
import { HabitBreakHub } from './components/habit-break/HabitBreakHub';
import { OverallAnalyticsView } from './components/analytics/OverallAnalyticsView';
import { CreateHabitModal } from './components/habit-creation/CreateHabitModal';
import { HabitDetailsModal } from './components/analytics/HabitDetailsModal';
import { Habit } from './types/habit';
import {
  subscribeUserProfile,
  subscribeCategories,
  subscribeHabits,
  subscribeLogs,
  subscribeHabitBreaks,
} from './services/firestoreService';
import { InstallPromptBanner } from './components/pwa/InstallPromptBanner';

export const App: React.FC = () => {
  const {
    currentUser,
    authLoading,
    setCurrentUser,
    setAuthLoading,
    user,
    profileLoading,
    setUser,
    setProfileLoading,
    setCategories,
    setHabits,
    setLogs,
    setHabitBreaks,
    resetStore,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'habits' | 'breaks' | 'analytics'>('habits');
  const [isCreateHabitOpen, setIsCreateHabitOpen] = useState(false);
  const [inspectedHabit, setInspectedHabit] = useState<Habit | null>(null);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  // 1. Listen to Firebase Authentication State
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setCurrentUser(firebaseUser);
      setAuthLoading(false);
      if (!firebaseUser) {
        resetStore();
      }
    });

    return () => unsubscribeAuth();
  }, [setCurrentUser, setAuthLoading, resetStore]);

  // 2. Real-time Cloud Firestore Subscriptions for Authenticated User
  useEffect(() => {
    if (!currentUser) {
      resetStore();
      return;
    }

    setProfileLoading(true);
    const userId = currentUser.uid;

    const unsubProfile = subscribeUserProfile(userId, (profile) => {
      setUser(profile);
    });

    const unsubCategories = subscribeCategories(userId, (cats) => {
      setCategories(cats);
    });

    const unsubHabits = subscribeHabits(userId, (habits) => {
      setHabits(habits);
    });

    const unsubLogs = subscribeLogs(userId, (logs) => {
      setLogs(logs);
    });

    const unsubBreaks = subscribeHabitBreaks(userId, (breaks) => {
      setHabitBreaks(breaks);
    });

    return () => {
      unsubProfile();
      unsubCategories();
      unsubHabits();
      unsubLogs();
      unsubBreaks();
    };
  }, [currentUser, setUser, setProfileLoading, setCategories, setHabits, setLogs, setHabitBreaks, resetStore]);

  // Loading Splash Screen
  if (authLoading || (currentUser && profileLoading)) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4">
        <img
          src="/android-chrome-192x192.png"
          alt="HabitsSeen Logo"
          className="w-16 h-16 rounded-2xl object-contain shadow-lg animate-pulse mb-3"
        />
        <p className="font-display font-bold text-lg text-ink">HabitsSeen</p>
        <span className="text-xs text-charcoal mt-1">Connecting to Cloud Firestore...</span>
      </div>
    );
  }

  // If NOT authenticated, strictly display the Landing Page
  if (!currentUser) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col selection:bg-primary selection:text-white">
      {/* PWA 1-TAP INSTALLATION PROMPT */}
      <InstallPromptBanner />

      {/* ONBOARDING MODAL (Pops if user has not completed onboarding in Firestore) */}
      <OnboardingModal />

      {/* TOP DESKTOP & MOBILE NAVBAR */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenCreateHabit={() => {
          setEditingHabit(null);
          setIsCreateHabitOpen(true);
        }}
      />

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-12">
        {activeTab === 'habits' && (
          <HabitsView
            onOpenCreateHabit={() => {
              setEditingHabit(null);
              setIsCreateHabitOpen(true);
            }}
            onOpenHabitDetails={(habit) => setInspectedHabit(habit)}
          />
        )}

        {activeTab === 'breaks' && <HabitBreakHub />}

        {activeTab === 'analytics' && <OverallAnalyticsView />}
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenCreateHabit={() => {
          setEditingHabit(null);
          setIsCreateHabitOpen(true);
        }}
      />

      {/* CREATE & EDIT HABIT WIZARD MODAL */}
      <CreateHabitModal
        isOpen={isCreateHabitOpen}
        habitToEdit={editingHabit}
        onClose={() => {
          setIsCreateHabitOpen(false);
          setEditingHabit(null);
        }}
      />

      {/* HABIT DETAILS & STATISTICS MODAL */}
      <HabitDetailsModal
        habit={inspectedHabit}
        isOpen={Boolean(inspectedHabit)}
        onClose={() => setInspectedHabit(null)}
        onEdit={(habit) => {
          setInspectedHabit(null);
          setEditingHabit(habit);
          setIsCreateHabitOpen(true);
        }}
      />
    </div>
  );
};

export default App;
