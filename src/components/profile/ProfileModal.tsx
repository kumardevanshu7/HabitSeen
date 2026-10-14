import React, { useState } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CustomSelect } from '../ui/CustomSelect';
import { logOut } from '../../services/firebase';
import {
  Heart,
  Zap,
  Award,
  LogOut,
  Shield,
  User,
  Lock,
  KeyRound,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Skull,
} from 'lucide-react';
import { SecurityModal } from '../security/SecurityModal';
import { getNextHeartsUpgrade } from '../../constants/gamification';
import { verifySecurityAnswer } from '../../utils/cryptoUtils';
import clsx from 'clsx';

import { Trophy, ChevronRight } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAchievements?: () => void;
  onOpenBrandLegal?: (tab: 'explore' | 'about' | 'privacy' | 'terms' | 'disclaimer' | 'contact') => void;
}

const PRESET_QUESTIONS = [
  'What was the name of your first school?',
  "What is your mother's maiden name?",
  'What was the name of your first pet?',
  'What city were you born in?',
  'What is your favorite book or movie?',
  'Custom Question...',
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenAchievements,
  onOpenBrandLegal,
}) => {
  const { user, currentUser, habits, setSecurityQuestion, resetEntireAccount } =
    useAppStore();

  const [isEditingSecurity, setIsEditingSecurity] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(PRESET_QUESTIONS[0]);
  const [customQuestion, setCustomQuestion] = useState('');
  const [previousAnswerInput, setPreviousAnswerInput] = useState('');
  const [answerInput, setAnswerInput] = useState('');
  const [showPasswordToggle, setShowPasswordToggle] = useState(false);
  const [securitySuccessMsg, setSecuritySuccessMsg] = useState('');
  const [securityError, setSecurityError] = useState('');
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);

  // Danger Zone Reset State
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);

  if (!user || !currentUser) return null;

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      onClose();
      await logOut();
    }
  };

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError('');
    setSecuritySuccessMsg('');

    // If an existing security question/password is set, MUST verify previous answer first
    if (user.security && (user.security.answerHash || user.security.answer)) {
      if (!previousAnswerInput.trim()) {
        setSecurityError('Please enter your previous secret answer / password to verify identity');
        return;
      }
      let isValid = false;
      if (user.security.answerHash && user.security.salt) {
        isValid = await verifySecurityAnswer(
          previousAnswerInput.trim(),
          user.security.answerHash,
          user.security.salt
        );
      } else if (user.security.answer) {
        isValid =
          previousAnswerInput.trim().toLowerCase() ===
          user.security.answer.trim().toLowerCase();
      }

      if (!isValid) {
        setSecurityError(
          'Incorrect previous secret answer / password. Security check failed.'
        );
        return;
      }
    }

    const finalQuestion =
      selectedPreset === 'Custom Question...'
        ? customQuestion.trim()
        : selectedPreset;

    if (!finalQuestion) {
      setSecurityError('Please select or write a security question');
      return;
    }

    if (!answerInput.trim() || answerInput.trim().length < 2) {
      setSecurityError('New answer must be at least 2 characters long');
      return;
    }

    setIsSavingSecurity(true);
    try {
      await setSecurityQuestion(finalQuestion, answerInput.trim());
      setSecuritySuccessMsg('Security question & password updated successfully!');
      setIsEditingSecurity(false);
      setPreviousAnswerInput('');
      setAnswerInput('');
      setCustomQuestion('');
    } catch (err: any) {
      setSecurityError(err.message || 'Failed to save security question');
    } finally {
      setIsSavingSecurity(false);
    }
  };

  const handleExecuteReset = async () => {
    await resetEntireAccount();
    setIsConfirmResetOpen(false);
    onClose();
  };

  const hearts = user.gamification?.hearts ?? 5;
  const maxHearts = user.gamification?.maxHearts ?? 5;
  const totalXp = user.gamification?.totalXp ?? 0;
  const heartsUpgrade = getNextHeartsUpgrade(totalXp);
  const levelTitle = user.gamification?.levelTitle ?? 'Discipline Initiate';
  const existingSecurity = user.security;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Discipline Profile & Settings"
        subtitle="Your vitality, willpower rank, security guard, and account controls"
        maxWidth="md"
      >
        <div className="space-y-5 pt-1">
          {/* USER CARD */}
          <div className="p-4 bg-surface-bone rounded-2xl border border-hairline flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
              <User size={24} />
            </div>
            <div className="truncate flex-1">
              <h4 className="font-display font-bold text-ink text-base truncate">
                {user.name || 'Discipline Seeker'}
              </h4>
              <p className="text-xs text-charcoal truncate">
                {currentUser.email || 'Cloud Firestore User'}
              </p>
            </div>
          </div>

          {/* QUICK LINKS: ACHIEVEMENTS & EXPLORE ARIGATO LABS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {onOpenAchievements && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAchievements();
                }}
                className="flex items-center justify-between p-3 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-300/70 rounded-xl transition-all text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Trophy size={16} />
                  </div>
                  <div>
                    <span className="font-display font-bold text-xs text-ink block">
                      100 Achievements
                    </span>
                    <span className="text-[10px] text-amber-800 font-medium">
                      Trophy Hall & Progress
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-amber-700 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}

            {onOpenBrandLegal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBrandLegal('explore');
                }}
                className="flex items-center justify-between p-3 bg-surface-card hover:bg-surface-bone border border-hairline rounded-xl transition-all text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-surface-bone border border-hairline flex items-center justify-center shrink-0">
                    <img
                      src="/arigato-single-logo.png"
                      alt="Arigato Labs"
                      className="w-4 h-4 object-contain"
                    />
                  </div>
                  <div>
                    <span className="font-display font-bold text-xs text-ink block">
                      Arigato Labs
                    </span>
                    <span className="text-[10px] text-stone font-medium">
                      Explore Company & Legal
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-stone group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>

          {/* VITALITY & WILLPOWER STATS */}
          <div className="grid grid-cols-2 gap-3">
            {/* Hearts / Health */}
            <div className="p-3.5 bg-surface-card rounded-2xl border border-red-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-charcoal">
                <span>Vitality (Hearts)</span>
                <Heart size={16} className="text-red-500 fill-red-500" />
              </div>
              <div className="flex items-baseline justify-between gap-1">
                <div className="flex items-baseline gap-1">
                  <span className="font-mono text-2xl font-black text-red-600">{hearts}</span>
                  <span className="text-xs font-medium text-charcoal">/ {maxHearts}</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                  {Math.round((hearts / Math.max(1, maxHearts)) * 100)}%
                </span>
              </div>

              {/* Health Bar */}
              <div className="w-full bg-red-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-red-500 to-rose-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, (hearts / Math.max(1, maxHearts)) * 100))}%` }}
                />
              </div>

              {/* Heart Icons (Supports up to 50 lives cleanly) */}
              <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto no-scrollbar py-0.5">
                {Array.from({ length: maxHearts }).map((_, i) => (
                  <Heart
                    key={i}
                    size={13}
                    className={
                      i < hearts
                        ? 'text-red-500 fill-red-500'
                        : 'text-stone/30 fill-stone/10'
                    }
                  />
                ))}
              </div>

              {/* Next Milestone info */}
              <div className="pt-1 border-t border-hairline/60 text-[10px] space-y-1">
                {heartsUpgrade.nextThreshold ? (
                  <p className="text-red-700 font-semibold flex items-center justify-between">
                    <span>Next: +5 Lives</span>
                    <span className="font-mono font-bold">{heartsUpgrade.xpNeeded} XP to {heartsUpgrade.nextThreshold} XP</span>
                  </p>
                ) : (
                  <p className="text-emerald-700 font-bold">Max 50 Lives Unlocked! 🛡️</p>
                )}
                <p className="text-charcoal leading-tight">
                  <span className="text-red-600 font-bold">⚠️ Sudden Death:</span> 0 lives triggers a 10s countdown to full fresh start wipe.
                </p>
              </div>
            </div>

            {/* Willpower XP */}
            <div className="p-3.5 bg-surface-card rounded-2xl border border-amber-200/80 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-charcoal">
                <span>Willpower XP</span>
                <Zap size={16} className="text-amber-500 fill-amber-500" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-2xl font-black text-amber-600">{totalXp}</span>
                <span className="text-xs font-medium text-charcoal">XP</span>
              </div>
              <div className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 truncate">
                <Award size={11} /> {levelTitle}
              </div>
              <p className="text-[10px] text-charcoal pt-1">
                100% Perfect Days award +100 bonus Willpower XP.
              </p>
            </div>
          </div>

          {/* SECURITY QUESTION SETTINGS */}
          <div className="p-4 bg-surface-card rounded-2xl border border-hairline space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound size={17} className="text-primary" />
                <h4 className="font-display font-bold text-sm text-ink">
                  Security Guard & Question
                </h4>
              </div>

              {existingSecurity ? (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 size={12} /> Active
                </span>
              ) : (
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <AlertTriangle size={12} /> Not Configured
                </span>
              )}
            </div>

            <p className="text-xs text-charcoal leading-relaxed">
              Required to edit tasks, delete habits, and authorize complete application data resets.
            </p>

            {securitySuccessMsg && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-1.5">
                <CheckCircle2 size={14} /> {securitySuccessMsg}
              </div>
            )}

            {!isEditingSecurity ? (
              <div className="pt-1 flex items-center justify-between gap-2">
                {existingSecurity ? (
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] text-charcoal block">Current Question:</span>
                    <p className="text-xs font-bold text-ink truncate">
                      "{existingSecurity.question}"
                    </p>
                  </div>
                ) : (
                  <span className="text-xs text-stone italic">No question set yet</span>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditingSecurity(true);
                    setPreviousAnswerInput('');
                    setAnswerInput('');
                    setCustomQuestion('');
                    setSecuritySuccessMsg('');
                    setSecurityError('');
                  }}
                >
                  {existingSecurity ? 'Change Question & Password' : 'Set Question Now'}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSaveSecurity} className="space-y-3.5 pt-2">
                {securityError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                    <AlertTriangle size={15} className="shrink-0 text-red-600" />
                    <span>{securityError}</span>
                  </div>
                )}

                {/* CURRENT / PREVIOUS PASSWORD VERIFICATION (REQUIRED IF ALREADY CONFIGURED) */}
                {existingSecurity && (
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1.5">
                    <div className="flex items-center gap-1.5 text-amber-900 font-semibold text-xs">
                      <Lock size={13} className="text-amber-600" />
                      <span>Security Verification</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-snug">
                      Enter your current secret answer / password to verify authorization before changing credentials.
                    </p>
                    <Input
                      label="Current / Previous Secret Answer"
                      placeholder="Enter current answer to authorize change"
                      type={showPasswordToggle ? 'text' : 'password'}
                      value={previousAnswerInput}
                      onChange={(e) => setPreviousAnswerInput(e.target.value)}
                      required
                    />
                  </div>
                )}

                <CustomSelect
                  label="Select New Question:"
                  value={selectedPreset}
                  options={PRESET_QUESTIONS.map((q) => ({ value: q, label: q }))}
                  onChange={(val) => setSelectedPreset(val)}
                />

                {selectedPreset === 'Custom Question...' && (
                  <div>
                    <Input
                      label="Your Custom Security Question"
                      placeholder="e.g. What is my private childhood nickname?"
                      value={customQuestion}
                      onChange={(e) => setCustomQuestion(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div>
                  <Input
                    label={existingSecurity ? "New Secret Answer / Password" : "Your Secret Answer"}
                    placeholder="Enter new secret answer (case-insensitive)"
                    type={showPasswordToggle ? 'text' : 'password'}
                    value={answerInput}
                    onChange={(e) => setAnswerInput(e.target.value)}
                    required
                  />
                  <div className="flex items-center justify-between mt-1 px-0.5">
                    <span className="text-[11px] text-stone">
                      Case-insensitive (answers match regardless of caps)
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPasswordToggle(!showPasswordToggle)}
                      className="text-[11px] text-primary hover:underline font-semibold"
                    >
                      {showPasswordToggle ? 'Hide Characters' : 'Show Characters'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-hairline/60">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditingSecurity(false);
                      setPreviousAnswerInput('');
                      setAnswerInput('');
                      setSecurityError('');
                    }}
                    disabled={isSavingSecurity}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isSavingSecurity}
                  >
                    {isSavingSecurity ? 'Saving...' : 'Save Security Question'}
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* DANGER ZONE: FRESH START & FULL RESET */}
          <div className="p-4 bg-red-50/70 border border-red-200 rounded-2xl space-y-2.5">
            <div className="flex items-center gap-2 text-red-900">
              <AlertTriangle size={17} className="text-red-600 shrink-0" />
              <h4 className="font-display font-bold text-sm">
                Danger Zone: Fresh Start / Reset Account
              </h4>
            </div>
            <p className="text-xs text-red-800 leading-relaxed">
              Permanently wipes all habits, history logs, breaks, and categories from Cloud Firestore. Restarts onboarding from scratch for a fresh beginning.
            </p>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => setIsConfirmResetOpen(true)}
              className="w-full gap-2 mt-1"
            >
              <Trash2 size={14} /> Reset All Data & Start Fresh
            </Button>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="pt-2 border-t border-hairline flex items-center justify-between gap-3">
            <span className="text-xs text-charcoal font-medium flex items-center gap-1.5">
              <Shield size={14} className="text-primary" /> {habits.length} Active Habits
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 gap-1.5"
            >
              <LogOut size={14} /> Sign Out
            </Button>
          </div>
        </div>
      </Modal>

      {/* SECURITY VERIFICATION MODAL FOR FULL ACCOUNT RESET */}
      <SecurityModal
        isOpen={isConfirmResetOpen}
        onClose={() => setIsConfirmResetOpen(false)}
        title="Authorize Complete Account Reset"
        actionTitle="Permanently wipe all habits, logs, breaks, and restart onboarding from scratch."
        isDanger={true}
        onSuccess={handleExecuteReset}
      />
    </>
  );
};
