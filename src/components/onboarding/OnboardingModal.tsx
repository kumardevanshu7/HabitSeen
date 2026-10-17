import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useAppStore } from '../../stores/useAppStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CustomSelect, SelectOption } from '../ui/CustomSelect';
import { ShieldCheck, Sparkles, Award, ArrowRight, AlertTriangle } from 'lucide-react';
import { UserProfile } from '../../types/habit';

const GENDER_OPTIONS: SelectOption<UserProfile['gender']>[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'other', label: 'Other / Prefer not to say' },
];

const RELATION_OPTIONS: SelectOption<UserProfile['relationStatus']>[] = [
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
  { value: 'single', label: 'Single' },
  { value: 'in_relationship', label: 'In a Relationship' },
  { value: 'married', label: 'Married' },
];

export const OnboardingModal: React.FC = () => {
  const { user, currentUser, profileStatus, completeOnboarding } = useAppStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState(currentUser?.displayName || '');
  const [age, setAge] = useState<number>(24);
  const [relationStatus, setRelationStatus] = useState<UserProfile['relationStatus']>('prefer_not_to_say');
  const [gender, setGender] = useState<UserProfile['gender']>('male');
  const [loading, setLoading] = useState(false);

  const [nameError, setNameError] = useState('');
  const [ageError, setAgeError] = useState('');
  const [submitError, setSubmitError] = useState('');

  // Prefill display name when currentUser becomes available
  useEffect(() => {
    if (currentUser?.displayName && !name) {
      setName(currentUser.displayName);
    }
  }, [currentUser]);

  // Show onboarding ONLY when profileStatus is explicitly confirmed missing on server,
  // or exists but isOnboarded is false. Never show if loading, unknown (offline), or already onboarded.
  const shouldShow =
    Boolean(currentUser) &&
    (profileStatus === 'missing' || (profileStatus === 'exists' && user?.isOnboarded === false));

  if (!shouldShow) {
    return null;
  }

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;

    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Please tell us your name');
      hasError = true;
    } else if (trimmed.length < 2) {
      setNameError('Name must be at least 2 characters long');
      hasError = true;
    } else {
      setNameError('');
    }

    const parsedAge = Number(age);
    if (!Number.isFinite(parsedAge) || parsedAge < 13 || parsedAge > 120) {
      setAgeError('You must be at least 13 years old to use HabitsSeen');
      hasError = true;
    } else {
      setAgeError('');
    }

    if (hasError) return;

    setStep(2);

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ea2804', '#ff6a3d', '#2b9a66', '#202020'],
    });
  };

  const handleFinishOnboarding = async () => {
    setLoading(true);
    setSubmitError('');
    try {
      await completeOnboarding({
        name: name.trim(),
        age: Number(age) || 24,
        relationStatus,
        gender,
      });

      confetti({
        particleCount: 120,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#ea2804', '#2b9a66', '#ff6a3d'],
      });
    } catch (err: any) {
      console.error('Failed to complete onboarding:', err);
      setSubmitError(err?.message || 'Failed to complete setup. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg bg-canvas border border-hairline rounded-3xl p-6 sm:p-8 shadow-2xl text-ink">
        {step === 1 ? (
          <div>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary mb-3">
                <ShieldCheck size={32} />
              </div>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-ink tracking-tight">
                Welcome to HabitsSeen
              </h2>
              <p className="text-charcoal text-sm mt-1 max-w-sm mx-auto">
                Set up your profile to calibrate your personal habit engine and gamified discipline score.
              </p>
            </div>

            <form onSubmit={handleStep1Submit} className="space-y-4">
              <Input
                label="What should we call you? (Name)"
                placeholder="e.g. Alex Dev"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameError) setNameError('');
                }}
                error={nameError}
                required
                autoFocus
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Your Age"
                  type="number"
                  min={13}
                  max={120}
                  value={age}
                  onChange={(e) => {
                    setAge(Number(e.target.value));
                    if (ageError) setAgeError('');
                  }}
                  error={ageError}
                  required
                />

                <CustomSelect
                  label="Gender (Optional)"
                  value={gender}
                  options={GENDER_OPTIONS}
                  onChange={(val) => setGender(val)}
                />
              </div>

              <CustomSelect
                label="Relationship Status (Optional)"
                value={relationStatus}
                options={RELATION_OPTIONS}
                onChange={(val) => setRelationStatus(val)}
              />

              <p className="text-[11px] text-stone text-center pt-1">
                By continuing, you agree to our Terms and consent to personalized discipline scoring.
              </p>

              <div className="pt-2">
                <Button type="submit" variant="primary" className="w-full text-base">
                  Continue to Calibration <ArrowRight size={18} className="ml-2" />
                </Button>
              </div>
            </form>
          </div>
        ) : (
          /* Step 2: Unlocking "Will Habit" Badge */
          <div className="text-center py-4">
            {submitError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 text-left">
                <AlertTriangle size={16} className="shrink-0 text-red-600" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Clean Centered Badge Display */}
            <div className="mb-4 flex flex-col items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-primary-glow flex items-center justify-center text-white shadow-xl ring-8 ring-primary/20 mb-3">
                <Award size={48} />
              </div>

              <div className="inline-flex items-center gap-1.5 bg-surface-card border border-hairline px-3.5 py-1 rounded-full text-xs font-semibold shadow-2xs">
                <span className="text-charcoal uppercase tracking-wider text-[11px]">Level 1 Badge</span>
                <span className="text-stone">&bull;</span>
                <span className="text-badge-success font-bold text-[11px] uppercase">Unlocked</span>
              </div>
            </div>

            <h2 className="font-display font-bold text-3xl sm:text-4xl text-ink tracking-tight">
              Will Habit
            </h2>
            <p className="text-primary font-bold text-xs sm:text-sm tracking-widest uppercase mt-1">
              "Will Habit Initiate"
            </p>

            <div className="my-6 p-4 bg-surface-card border border-hairline rounded-2xl text-left text-xs sm:text-sm text-body space-y-2">
              <div className="flex items-start gap-2">
                <Sparkles size={18} className="text-primary shrink-0 mt-0.5" />
                <p>
                  <strong className="text-ink">Daily XP Tracker:</strong> Complete habits daily to earn XP, level up your rank, and crystallize consistency.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Sparkles size={18} className="text-primary shrink-0 mt-0.5" />
                <p>
                  <strong className="text-ink">Streaks &amp; Health:</strong> Maintain streaks for bonus XP multipliers; unexcused misses deduct Willpower XP and Health Hearts.
                </p>
              </div>
            </div>

            <Button
              onClick={handleFinishOnboarding}
              variant="primary"
              size="lg"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Saving Profile...' : 'Enter Dashboard'} <ArrowRight size={18} className="ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
