import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAppStore } from '../../stores/useAppStore';
import { ShieldCheck, ShieldAlert, Lock, AlertTriangle, KeyRound, Info } from 'lucide-react';
import clsx from 'clsx';
import { verifySecurityAnswer, hashSecurityAnswer } from '../../utils/cryptoUtils';
import { saveUserProfileToDb } from '../../services/firestoreService';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  actionTitle: string; // e.g. "Edit Habit: Drink Water" or "Delete Habit" or "Reset All Account Data"
  isDanger?: boolean;
  onSuccess: () => void | Promise<void>;
  onOpenProfileSetup?: () => void;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({
  isOpen,
  onClose,
  title = 'Security Verification',
  actionTitle,
  isDanger = false,
  onSuccess,
  onOpenProfileSetup,
}) => {
  const { user, currentUser } = useAppStore();
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAnswer('');
      setError('');
      setIsVerifying(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const security = user?.security;
  const hasSecurityQuestion = Boolean(security?.question && (security?.answerHash || security?.answer));

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!hasSecurityQuestion) {
      setIsVerifying(true);
      try {
        await onSuccess();
        onClose();
      } catch (err: any) {
        console.error('Action failed:', err);
        setError(err?.message || 'Action failed');
      } finally {
        setIsVerifying(false);
      }
      return;
    }

    const trimmedInput = answer.trim().toLowerCase();
    if (!trimmedInput) {
      setError('Please enter your security answer');
      return;
    }

    setIsVerifying(true);
    try {
      let isMatch = false;

      if (security?.answerHash && security?.salt) {
        isMatch = await verifySecurityAnswer(trimmedInput, security.answerHash, security.salt);
      } else if (security?.answer) {
        // Legacy plain text verification + auto migration to PBKDF2 hash
        isMatch = trimmedInput === security.answer.trim().toLowerCase();
        if (isMatch && currentUser && user) {
          try {
            const { hash, salt } = await hashSecurityAnswer(trimmedInput);
            await saveUserProfileToDb(currentUser.uid, {
              ...user,
              security: {
                question: security.question,
                answerHash: hash,
                salt,
              },
            });
          } catch (migrateErr) {
            console.warn('Auto migration of security answer failed:', migrateErr);
          }
        }
      }

      if (!isMatch) {
        setError('Incorrect answer. Please check your answer and try again.');
        setIsVerifying(false);
        return;
      }

      await onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Security action failed:', err);
      setError(err?.message || 'Action failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleProceedWithoutGuard = async () => {
    setIsVerifying(true);
    setError('');
    try {
      await onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Action failed:', err);
      setError(err?.message || 'Action failed');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle="Accidental-Action Guard: Protects your account against unintended actions"
      maxWidth="md"
    >
      <form onSubmit={handleVerify} className="space-y-4 pt-1">
        {/* ACTION SUMMARY BADGE */}
        <div
          className={clsx(
            'p-3.5 rounded-2xl border flex items-start gap-3 shadow-2xs',
            isDanger
              ? 'bg-red-50 border-red-200 text-red-900'
              : 'bg-surface-bone border-hairline text-ink'
          )}
        >
          {isDanger ? (
            <AlertTriangle size={20} className="text-red-600 shrink-0 mt-0.5" />
          ) : (
            <KeyRound size={20} className="text-primary shrink-0 mt-0.5" />
          )}
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider block opacity-70">
              Guarded Action:
            </span>
            <p className="text-xs sm:text-sm font-bold leading-tight">{actionTitle}</p>
          </div>
        </div>

        {/* CLARIFICATION NOTE */}
        <div className="flex items-start gap-2 p-2.5 bg-surface-bone/60 rounded-xl text-[11px] text-charcoal border border-hairline/60">
          <Info size={14} className="text-charcoal shrink-0 mt-0.5" />
          <span>This confirmation guard protects against accidental edits, deletions, and resets.</span>
        </div>

        {hasSecurityQuestion ? (
          <>
            {/* QUESTION DISPLAY */}
            <div className="p-4 bg-surface-card rounded-2xl border border-hairline space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal block">
                Your Security Question:
              </span>
              <p className="text-sm sm:text-base font-bold text-ink flex items-center gap-2">
                <Lock size={16} className="text-primary shrink-0" />
                <span>{security?.question}</span>
              </p>
            </div>

            {/* ANSWER INPUT */}
            <div className="space-y-1">
              <Input
                label="Your Secret Answer"
                placeholder="Type your answer here..."
                type="text"
                autoComplete="off"
                value={answer}
                onChange={(e) => {
                  setAnswer(e.target.value);
                  if (error) setError('');
                }}
                autoFocus
                required
              />
              <p className="text-[11px] text-stone ml-1">
                Answers are case-insensitive and hashed via PBKDF2 Web Crypto.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
                <ShieldAlert size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* ACTIONS */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-hairline">
              <Button type="button" variant="ghost" onClick={onClose} disabled={isVerifying}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant={isDanger ? 'danger' : 'primary'}
                size="md"
                disabled={isVerifying}
                className="gap-1.5"
              >
                {isVerifying ? (
                  'Verifying...'
                ) : (
                  <>
                    <ShieldCheck size={16} /> Confirm & Authorize
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          /* NO SECURITY QUESTION CONFIGURED YET */
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs space-y-1.5">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldAlert size={16} className="text-amber-600" /> No Security Question Set Up Yet
              </p>
              <p className="text-amber-800 leading-relaxed">
                You haven't set up a security question yet in your Profile. Setting one up prevents unauthorized edits, deletions, or data resets.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
                <ShieldAlert size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-hairline">
              <Button type="button" variant="ghost" onClick={onClose} disabled={isVerifying}>
                Cancel
              </Button>
              {onOpenProfileSetup && (
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  disabled={isVerifying}
                  onClick={() => {
                    onClose();
                    onOpenProfileSetup();
                  }}
                  className="gap-1.5"
                >
                  Configure in Profile
                </Button>
              )}
              <Button
                type="button"
                variant={isDanger ? 'danger' : 'primary'}
                size="md"
                disabled={isVerifying}
                onClick={handleProceedWithoutGuard}
              >
                {isVerifying ? 'Processing...' : 'Proceed Without Guard'}
              </Button>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};
