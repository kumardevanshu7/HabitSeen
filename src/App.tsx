import React, { useState, useEffect, useRef, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase';
import { useAppStore } from './stores/useAppStore';
import { LandingPage } from './components/auth/LandingPage';
import { Navbar } from './components/navigation/Navbar';
import { BottomNav } from './components/navigation/BottomNav';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { HabitsView } from './components/habits/HabitsView';
import { ChallengesView } from './components/challenges/ChallengesView';
import { HabitBreakHub } from './components/habit-break/HabitBreakHub';
import { OverallAnalyticsView } from './components/analytics/OverallAnalyticsView';
import { CreateHabitModal } from './components/habit-creation/CreateHabitModal';
import { HabitDetailsModal } from './components/analytics/HabitDetailsModal';
import { Habit, FrequencyType } from './types/habit';
import {
  subscribeUserProfile,
  subscribeCategories,
  subscribeHabits,
  subscribeLogs,
  subscribeHabitBreaks,
  subscribeChallenges,
} from './services/firestoreService';
import { InstallPromptBanner } from './components/pwa/InstallPromptBanner';
import { ProfileModal } from './components/profile/ProfileModal';
import { ZeroVitalityPurgeModal } from './components/gamification/ZeroVitalityPurgeModal';
import { DashboardFooter } from './components/navigation/DashboardFooter';
import { AchievementsModal } from './components/achievements/AchievementsModal';
import { BrandLegalModal, BrandLegalTab } from './components/brand/BrandLegalModal';
import { isModalHandlingPopState } from './components/ui/Modal';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { Button } from './components/ui/Button';
import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react';

type AppTab = 'habits' | 'challenges' | 'breaks' | 'analytics';

export const App: React.FC = () => {
  const {
    currentUser,
    authLoading,
    setCurrentUser,
    setAuthLoading,
    profileLoading,
    syncError,
    setUser,
    setProfileLoading,
    setProfileStatus,
    setSyncError,
    setCategories,
    setHabits,
    setLogs,
    setHabitBreaks,
    setChallenges,
    resetStore,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<AppTab>('habits');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCreateHabitOpen, setIsCreateHabitOpen] = useState(false);
  const [createHabitInitialFrequency, setCreateHabitInitialFrequency] = useState<FrequencyType | undefined>(undefined);
  const [inspectedHabit, setInspectedHabit] = useState<Habit | null>(null);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [isBrandLegalOpen, setIsBrandLegalOpen] = useState(false);
  const [brandLegalTab, setBrandLegalTab] = useState<BrandLegalTab>('explore');
  const [splashTimedOut, setSplashTimedOut] = useState(false);
  const [showExitToast, setShowExitToast] = useState(false);
  const exitToastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastBackPressTimeRef = useRef<number>(0);

  const navStateRef = useRef<{ tab: AppTab; category: string }>({
    tab: 'habits',
    category: 'all',
  });
  navStateRef.current = { tab: activeTab, category: selectedCategory };

  // Navigate to a tab and push browser history so mobile back gesture goes back instead of closing the app
  const handleSelectTab = useCallback((nextTab: AppTab) => {
    const current = navStateRef.current;
    if (current.tab === nextTab && (nextTab !== 'habits' || current.category === 'all')) {
      return;
    }
    const nextCategory = nextTab === 'habits' ? 'all' : current.category;
    setActiveTab(nextTab);
    if (nextTab === 'habits') {
      setSelectedCategory('all');
    }
    if (typeof window !== 'undefined') {
      window.history.pushState(
        { tab: nextTab, category: nextCategory, isAppNav: true },
        ''
      );
    }
  }, []);

  // Navigate to a category within HabitsView and push browser history so back gesture returns to 'all'
  const handleSelectCategory = useCallback((nextCategory: string) => {
    const current = navStateRef.current;
    if (current.category === nextCategory) return;
    setSelectedCategory(nextCategory);
    if (typeof window !== 'undefined') {
      window.history.pushState(
        { tab: current.tab, category: nextCategory, isAppNav: true },
        ''
      );
    }
  }, []);

  // Global mobile back-gesture (popstate) listener
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Seed initial root state + guard entry so back gesture inside the app never immediately exits
    if (!window.history.state || !window.history.state.isAppNav) {
      window.history.replaceState(
        { tab: 'habits', category: 'all', isAppNav: true, isRoot: true },
        ''
      );
      window.history.pushState(
        { tab: 'habits', category: 'all', isAppNav: true },
        ''
      );
    }

    const handlePopState = (event: PopStateEvent) => {
      // 1. If any modal is open (or cleaning up its own history entry), let Modal handle it
      if (isModalHandlingPopState()) {
        return;
      }

      const state = event.state;
      const current = navStateRef.current;

      // 2. If history state has explicit tab/category, restore it
      if (state && state.isAppNav && !state.isRoot) {
        setActiveTab(state.tab || 'habits');
        setSelectedCategory(state.category || 'all');
        return;
      }

      // 3. If user hit the root guard entry while on a sub-category or non-home tab, step back gracefully
      if (current.tab === 'habits' && current.category !== 'all') {
        setSelectedCategory('all');
        window.history.pushState(
          { tab: 'habits', category: 'all', isAppNav: true },
          ''
        );
        return;
      }

      if (current.tab !== 'habits') {
        setActiveTab('habits');
        setSelectedCategory('all');
        window.history.pushState(
          { tab: 'habits', category: 'all', isAppNav: true },
          ''
        );
        return;
      }

      // 4. On Home ('habits' + 'all'): Double-back to exit
      const now = Date.now();
      if (now - lastBackPressTimeRef.current < 2000) {
        window.history.back();
        return;
      }

      lastBackPressTimeRef.current = now;
      setShowExitToast(true);
      if (exitToastTimerRef.current) clearTimeout(exitToastTimerRef.current);
      exitToastTimerRef.current = setTimeout(() => setShowExitToast(false), 2000);

      window.history.pushState(
        { tab: 'habits', category: 'all', isAppNav: true },
        ''
      );
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Splash screen safety timer: if cloud connection exceeds 8s, surface offline/retry controls
  useEffect(() => {
    if (!currentUser || !profileLoading) {
      setSplashTimedOut(false);
      return;
    }

    const timer = setTimeout(() => {
      setSplashTimedOut(true);
    }, 8000);

    return () => clearTimeout(timer);
  }, [currentUser, profileLoading]);

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
  const currentUid = currentUser?.uid;

  useEffect(() => {
    if (!currentUid) {
      return;
    }

    setProfileLoading(true);
    const userId = currentUid;

    const unsubProfile = subscribeUserProfile(
      userId,
      (profile, meta) => {
        setUser(profile);
        if (profile) {
          setProfileStatus('exists');
        } else if (!meta.fromCache) {
          setProfileStatus('missing');
        }
      },
      (err) => {
        setSyncError(err.message);
      },
      () => {
        setProfileStatus('unknown');
        setProfileLoading(false);
      }
    );

    const unsubCategories = subscribeCategories(
      userId,
      (cats) => {
        setCategories(cats);
      },
      (err) => {
        setSyncError(err.message);
      }
    );

    const unsubHabits = subscribeHabits(
      userId,
      (habits) => {
        setHabits(habits);
      },
      (err) => {
        setSyncError(err.message);
      }
    );

    const unsubLogs = subscribeLogs(
      userId,
      (logs) => {
        setLogs(logs);
      },
      (err) => {
        setSyncError(err.message);
      }
    );

    const unsubBreaks = subscribeHabitBreaks(
      userId,
      (breaks) => {
        setHabitBreaks(breaks);
      },
      (err) => {
        setSyncError(err.message);
      }
    );

    const unsubChallenges = subscribeChallenges(
      userId,
      (challenges) => {
        setChallenges(challenges);
      },
      (err) => {
        setSyncError(err.message);
      }
    );

    return () => {
      unsubProfile();
      unsubCategories();
      unsubHabits();
      unsubLogs();
      unsubBreaks();
      unsubChallenges();
    };
  }, [
    currentUid,
    setUser,
    setProfileLoading,
    setSyncError,
    setCategories,
    setHabits,
    setLogs,
    setHabitBreaks,
    setChallenges,
    setProfileStatus,
  ]);

  // Loading Splash Screen with 8s Timeout & Offline Fallback
  if (authLoading || (currentUser && profileLoading)) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 text-center">
        <img
          src="/android-chrome-192x192.png"
          alt="HabitsSeen Logo"
          className="w-16 h-16 rounded-2xl object-contain shadow-lg animate-pulse mb-3"
        />
        <p className="font-display font-bold text-xl text-ink">HabitsSeen</p>
        <span className="text-xs text-charcoal mt-1">Connecting to Cloud Firestore...</span>

        {(splashTimedOut || syncError) && (
          <div className="mt-6 max-w-sm w-full bg-surface-card border border-amber-200/80 p-4 rounded-2xl shadow-sm text-left animate-in fade-in duration-300">
            <div className="flex items-start gap-2.5 text-amber-700 text-xs">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-ink mb-0.5">Connection taking longer than usual</p>
                <p className="text-charcoal leading-relaxed">
                  {syncError || 'Network might be slow or offline. You can proceed with local cached data.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs gap-1.5"
                onClick={() => window.location.reload()}
              >
                <RefreshCw size={13} /> Retry
              </Button>
              <Button
                variant="dark"
                size="sm"
                className="flex-1 text-xs gap-1.5"
                onClick={() => {
                  setProfileStatus('unknown');
                  setProfileLoading(false);
                }}
              >
                <WifiOff size={13} /> Continue Offline
              </Button>
            </div>
          </div>
        )}
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

      {/* SUDDEN DEATH 0-LIVES 10S COUNTDOWN PURGE MODAL */}
      <ZeroVitalityPurgeModal />

      {/* TOP DESKTOP & MOBILE NAVBAR */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenCreateHabit={() => {
          setEditingHabit(null);
          setIsCreateHabitOpen(true);
        }}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-12 space-y-4">
        {syncError && (
          <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-900 shadow-2xs">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-600 shrink-0" />
              <span>
                <strong>Cloud Sync Alert:</strong> {syncError} (operating in local offline cache mode)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSyncError(null)}
              className="text-amber-700 hover:text-amber-900 underline font-semibold shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        <ErrorBoundary fallbackTitle="An error occurred rendering this section">
          {activeTab === 'habits' && (
            <HabitsView
              selectedCategory={selectedCategory}
              onSelectCategory={handleSelectCategory}
              onOpenChallengesTab={() => handleSelectTab('challenges')}
              onOpenCreateHabit={() => {
                setEditingHabit(null);
                setCreateHabitInitialFrequency(undefined);
                setIsCreateHabitOpen(true);
              }}
              onOpenCreateHabitWithFrequency={(freq) => {
                setEditingHabit(null);
                setCreateHabitInitialFrequency(freq);
                setIsCreateHabitOpen(true);
              }}
              onOpenHabitDetails={(habit) => setInspectedHabit(habit)}
            />
          )}

          {activeTab === 'challenges' && <ChallengesView />}

          {activeTab === 'breaks' && <HabitBreakHub />}

          {activeTab === 'analytics' && (
            <OverallAnalyticsView
              onOpenHabitDetails={(habit) => setInspectedHabit(habit)}
            />
          )}
        </ErrorBoundary>
      </main>

      {/* DASHBOARD AUTHENTICATED FOOTER: 100 ACHIEVEMENTS & ARIGATO LABS BRANDING */}
      <DashboardFooter
        onOpenAchievements={() => setIsAchievementsOpen(true)}
        onOpenBrandLegal={(tab) => {
          setBrandLegalTab(tab);
          setIsBrandLegalOpen(true);
        }}
      />

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenCreateHabit={() => {
          setEditingHabit(null);
          setIsCreateHabitOpen(true);
        }}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* USER PROFILE MODAL */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onOpenAchievements={() => setIsAchievementsOpen(true)}
        onOpenBrandLegal={(tab) => {
          setBrandLegalTab(tab);
          setIsBrandLegalOpen(true);
        }}
      />

      {/* 100 HARDCORE ACHIEVEMENTS MODAL */}
      <AchievementsModal
        isOpen={isAchievementsOpen}
        onClose={() => setIsAchievementsOpen(false)}
      />

      {/* ARIGATO LABS COMPANY & LEGAL MODAL */}
      <BrandLegalModal
        isOpen={isBrandLegalOpen}
        initialTab={brandLegalTab}
        onClose={() => setIsBrandLegalOpen(false)}
      />

      {/* CREATE & EDIT HABIT WIZARD MODAL */}
      <CreateHabitModal
        isOpen={isCreateHabitOpen}
        habitToEdit={editingHabit}
        initialFrequencyType={createHabitInitialFrequency}
        onClose={() => {
          setIsCreateHabitOpen(false);
          setEditingHabit(null);
          setCreateHabitInitialFrequency(undefined);
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

      {/* DOUBLE-BACK EXIT TOAST */}
      {showExitToast && (
        <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-50 bg-ink/95 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg border border-white/10 animate-in fade-in duration-200 pointer-events-none">
          Press back again to exit
        </div>
      )}
    </div>
  );
};

export default App;
