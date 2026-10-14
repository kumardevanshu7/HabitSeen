import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { useAppStore } from '../../stores/useAppStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CustomSelect, SelectOption } from '../ui/CustomSelect';
import { ShieldCheck, Sparkles, Award, ArrowRight } from 'lucide-react';
import { UserProfile } from '../../types/habit';

const GENDER_OPTIONS: SelectOption<UserProfile['gender']>[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'other', label: 'Other / Self-describe' },
];

const RELATION_OPTIONS: SelectOption<UserProfile['relationStatus']>[] = [
  { value: 'single', label: 'Single' },
  { value: 'in_relationship', label: 'In a Relationship' },
  { value: 'married', label: 'Married' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export const OnboardingModal: React.FC = () => {
  const { user, currentUser, profileStatus, completeOnboarding } = useAppStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState(currentUser?.displayName || '');
  const [age, setAge] = useState<number>(24);
  const [relationStatus, setRelationStatus] = useState<UserProfile['relationStatus']>('single');
  const [gender, setGender] = useState<UserProfile['gender']>('male');
  const [loading, setLoading] = useState(false);

  const [nameError, setNameError] = useState('');

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
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Please tell us your name');
      return;
    }
    if (trimmed.length < 2) {
      setNameError('Name must be at least 2 characters long');
      return;
    }
    const parsedAge = Number(age);
    if (!Number.isFinite(parsedAge) || parsedAge < 10 || parsedAge > 120) {
      setNameError('Please enter a valid age between 10 and 120');
      return;
    }
    setNameError('');
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
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
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
                  min={10}
                  max={120}
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  required
                />

                <CustomSelect
                  label="Gender"
                  value={gender}
                  options={GENDER_OPTIONS}
                  onChange={(val) => setGender(val)}
                />
              </div>

              <CustomSelect
                label="Relationship Status"
                value={relationStatus}
                options={RELATION_OPTIONS}
                onChange={(val) => setRelationStatus(val)}
              />

              <div className="pt-4">
                <Button type="submit" variant="primary" className="w-full text-base">
                  Continue to Calibration <ArrowRight size={18} className="ml-2" />
                </Button>
              </div>
            </form>
          </div>
        ) : (
          /* Step 2: Unlocking "Will Habit" Badge */
          <div className="text-center py-4">
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
              "The Will Initiate"
            </p>

            <div className="my-6 p-4 bg-surface-card border border-hairline rounded-2xl text-left text-xs sm:text-sm text-body space-y-2">
              <div className="flex items-start gap-2">
                <Sparkles size={18} className="text-primary shrink-0 mt-0.5" />
                <p>
                  <strong className="text-ink">Daily XP Tracker:</strong> Har din habit complete karne par points (XP) milenge jo tumhari consistency ko level up karenge.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Sparkles size={18} className="text-primary shrink-0 mt-0.5" />
                <p>
                  <strong className="text-ink">Skip & Streak Rules:</strong> Regular streaks par bonus multipliers milenge, jabki unnecessary skips par points deduct honge.
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
