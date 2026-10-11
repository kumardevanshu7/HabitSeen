import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { AuthModal } from './AuthModal';
import { InstallPromptBanner } from '../pwa/InstallPromptBanner';
import {
  ShieldAlert,
  Award,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Zap,
  Target,
  BarChart3,
  Calendar,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');

  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col selection:bg-primary selection:text-white">
      {/* PWA 1-TAP INSTALLATION PROMPT */}
      <InstallPromptBanner />

      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-40 bg-canvas/90 backdrop-blur-md border-b border-hairline">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/android-chrome-192x192.png"
              alt="HabitsSeen Logo"
              className="w-9 h-9 rounded-xl object-contain shadow-xs"
            />
            <span className="font-display font-bold text-xl text-ink tracking-tight">
              HabitsSeen
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenAuth('login')}
              className="text-xs sm:text-sm font-semibold"
            >
              Sign In
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenAuth('signup')}
              className="text-xs sm:text-sm"
            >
              Get Started Free
            </Button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-surface-card border border-hairline px-4 py-1.5 rounded-full text-xs font-semibold text-charcoal shadow-2xs mb-6 animate-in fade-in">
          <Sparkles size={14} className="text-primary" />
          <span>Next-Generation Behavioral Intelligence & Sobriety Chronometer</span>
        </div>

        <h1 className="font-display font-extrabold text-4xl sm:text-6xl md:text-7xl text-ink tracking-tight leading-[1.05] max-w-4xl mx-auto">
          Master your routines. Break destructive loops.
        </h1>

        <p className="text-charcoal text-base sm:text-xl max-w-2xl mx-auto mt-6 leading-relaxed">
          The all-in-one habit system featuring <strong className="text-ink">4 behavioral models</strong>, real-time <strong className="text-ink">abstinence stopwatches</strong>, and the gamified <strong className="text-ink">"Will Habit"</strong> leveling engine.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mt-8">
          <Button
            variant="primary"
            size="lg"
            onClick={() => handleOpenAuth('signup')}
            className="w-full sm:w-auto text-base gap-2 px-8 shadow-md"
          >
            Start Your Journey <ArrowRight size={18} />
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleOpenAuth('login')}
            className="w-full sm:w-auto text-base"
          >
            Sign In to Existing Account
          </Button>
        </div>

        <p className="text-xs text-stone mt-3">
          100% Free &bull; Cloud Firestore Real-time Sync &bull; Zero Mock Data
        </p>
      </section>

      {/* 3. CORE ARCHITECTURAL PILLARS (CARDS) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="font-display font-bold text-2xl sm:text-4xl text-ink tracking-tight">
            Designed for serious self-mastery
          </h2>
          <p className="text-charcoal text-sm mt-2">
            Every feature is calibrated to eliminate resistance and build unwavering consistency.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: 4 Habit Types */}
          <div className="bg-surface-card border border-hairline rounded-3xl p-6 sm:p-7 shadow-xs hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-5">
              <Target size={26} />
            </div>
            <h3 className="font-display font-bold text-xl text-ink">
              4 Adaptive Habit Types
            </h3>
            <p className="text-charcoal text-xs sm:text-sm mt-2 leading-relaxed">
              Track simple <strong>Yes/No</strong> habits, <strong>Numeric targets</strong> with customizable operators (at least, less than, exactly), <strong>Interactive Timers</strong>, and dynamic <strong>Checklists</strong> with starred critical tasks.
            </p>
          </div>

          {/* Card 2: Will Habit Gamification */}
          <div className="bg-surface-card border border-hairline rounded-3xl p-6 sm:p-7 shadow-xs hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5">
              <Award size={26} />
            </div>
            <h3 className="font-display font-bold text-xl text-ink">
              "Will Habit" Level Badges
            </h3>
            <p className="text-charcoal text-xs sm:text-sm mt-2 leading-relaxed">
              Unlock Tier 1 upon onboarding and earn dynamic XP points based on difficulty, priority, and streak multipliers. Level up from <em>Will Initiate</em> to <em>Legendary Monk</em>.
            </p>
          </div>

          {/* Card 3: Timer Habit Break */}
          <div className="bg-surface-card border border-hairline rounded-3xl p-6 sm:p-7 shadow-xs hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-5">
              <ShieldAlert size={26} />
            </div>
            <h3 className="font-display font-bold text-xl text-ink">
              Timer Habit Break (Sobriety)
            </h3>
            <p className="text-charcoal text-xs sm:text-sm mt-2 leading-relaxed">
              Quitting smoking, doomscrolling, or sugar? A continuous timestamp stopwatch calculates exact elapsed abstinence 24/7—even when the app or your device is turned off.
            </p>
          </div>
        </div>
      </section>

      {/* 4. STREAK CHALLENGE SHOWCASE (10 MILESTONES) */}
      <section className="bg-surface-bone border-y border-hairline py-14 my-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                GAMIFIED RETENTION
              </span>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-ink tracking-tight mt-1">
                The 10 Streak Challenge Milestones
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-charcoal max-w-md">
              From Day 1 (The Spark) to Day 500 (Legendary Monk), your consistency is recognized with permanent trophies.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { days: '1D', title: 'The Spark' },
              { days: '7D', title: 'One-Week Strong' },
              { days: '10D', title: 'Double Digits' },
              { days: '15D', title: 'Fortitude' },
              { days: '30D', title: 'Monthly Master' },
              { days: '60D', title: 'Transformer' },
              { days: '100D', title: 'Centurion of Will' },
              { days: '200D', title: 'Unwavering' },
              { days: '365D', title: 'Year of Triumph' },
              { days: '500D', title: 'Legendary Monk' },
            ].map((m) => (
              <div
                key={m.days}
                className="bg-surface-card border border-hairline p-3 rounded-2xl text-center shadow-2xs"
              >
                <div className="font-mono text-base font-bold text-primary mb-0.5">
                  {m.days}
                </div>
                <div className="text-xs font-medium text-ink truncate">{m.title}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="mt-auto bg-surface-dark text-white py-10 px-4 sm:px-6 border-t border-hairline">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img
              src="/android-chrome-192x192.png"
              alt="HabitsSeen Logo"
              className="w-7 h-7 rounded-lg object-contain shadow-xs"
            />
            <span className="font-display font-bold text-lg">HabitsSeen</span>
          </div>
          <p className="text-xs text-white/60">
            &copy; 2026 HabitsSeen by Arigato Labs. Designed with precision & purpose.
          </p>
        </div>
      </footer>

      {/* AUTH MODAL */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authMode}
      />
    </div>
  );
};
