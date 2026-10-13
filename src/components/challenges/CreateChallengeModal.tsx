import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { IconPicker } from '../ui/IconPicker';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '../../constants/iconsAndColors';
import { useAppStore } from '../../stores/useAppStore';
import { ChallengeTask } from '../../types/habit';
import { boostVibrancy, getContrastIconColor } from '../../utils/colorUtils';
import {
  Flame,
  ShieldAlert,
  Heart,
  Zap,
  Check,
  Plus,
  Trash2,
  AlertTriangle,
  Calendar,
  Award,
  CheckCircle2,
} from 'lucide-react';
import clsx from 'clsx';

interface CreateChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChallengeCreated?: () => void;
}

export const CreateChallengeModal: React.FC<CreateChallengeModalProps> = ({
  isOpen,
  onClose,
  onChallengeCreated,
}) => {
  const { addChallenge, user } = useAppStore();

  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('flame');
  const [selectedColor, setSelectedColor] = useState(CATEGORY_COLORS[0].hex);
  const [durationPreset, setDurationPreset] = useState<7 | 9 | 11 | 'custom'>(7);
  const [customDays, setCustomDays] = useState<number>(21);

  // Optional sub-tasks inside the challenge
  const [tasks, setTasks] = useState<ChallengeTask[]>([]);
  const [newTaskText, setNewTaskText] = useState('');

  // Step 2: Rules Disclaimer Popup
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setSelectedIcon('flame');
      setSelectedColor(CATEGORY_COLORS[0].hex);
      setDurationPreset(7);
      setCustomDays(21);
      setTasks([]);
      setNewTaskText('');
      setError('');
      setIsRulesModalOpen(false);
    }
  }, [isOpen]);

  const effectiveDays =
    durationPreset === 'custom' ? Math.max(1, Number(customDays) || 7) : durationPreset;

  const vibrantColor = boostVibrancy(selectedColor);
  const SelectedIconComp =
    CATEGORY_ICONS.find((i) => i.id === selectedIcon)?.icon || CATEGORY_ICONS[0].icon;

  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    setTasks([
      ...tasks,
      {
        id: `ctask-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        text: newTaskText.trim(),
      },
    ]);
    setNewTaskText('');
  };

  const handleRemoveTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const handleProceedToRules = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a challenge name');
      return;
    }
    if (durationPreset === 'custom' && (!customDays || customDays < 1)) {
      setError('Please enter a valid number of days (at least 1)');
      return;
    }
    setError('');
    setIsRulesModalOpen(true);
  };

  const handleConfirmRulesAndCreate = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      // Auto-include any typed task still in the input box
      const finalTasks = [...tasks];
      if (newTaskText.trim()) {
        finalTasks.push({
          id: `ctask-${Date.now()}`,
          text: newTaskText.trim(),
        });
      }

      await addChallenge({
        name: name.trim(),
        icon: selectedIcon,
        color: vibrantColor,
        targetDays: effectiveDays,
        tasks: finalTasks,
      });

      setIsRulesModalOpen(false);
      onClose();
      onChallengeCreated?.();
    } catch (err: any) {
      console.error('Failed to create challenge:', err);
      setError(err.message || 'Failed to create challenge');
      setIsRulesModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentHearts = user?.gamification?.hearts ?? 5;
  const penaltyPreview = Number((currentHearts * 0.9).toFixed(1));
  const victoryXpPreview = effectiveDays * 50 + effectiveDays * 30;

  return (
    <>
      {/* STEP 1: CHALLENGE CONFIGURATION MODAL */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Add New Hardcore Challenge"
        subtitle="Configure name, icon, color, and duration (7, 9, 11, or Custom days)"
        maxWidth="lg"
      >
        <form onSubmit={handleProceedToRules} className="space-y-5">
          {/* 1. CHALLENGE NAME */}
          <Input
            label="Challenge Name"
            placeholder="e.g. 7-Day Monk Mode, No Sugar & Daily Gym, 5 AM Club"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError('');
            }}
            error={error}
            autoFocus
            required
          />

          {/* LIVE CHALLENGE BADGE PREVIEW */}
          <div className="p-3.5 bg-surface-card border border-hairline rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
            <span className="text-xs font-semibold text-charcoal uppercase ml-1">
              Challenge Preview
            </span>
            <div
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border-2 text-ink text-xs sm:text-sm font-bold shadow-xs transition-all"
              style={{
                backgroundColor: `${vibrantColor}20`,
                borderColor: vibrantColor,
              }}
            >
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                style={{
                  backgroundColor: vibrantColor,
                  color: getContrastIconColor(vibrantColor),
                }}
              >
                <SelectedIconComp size={16} strokeWidth={2.5} />
              </span>
              <span className="truncate max-w-[160px] sm:max-w-[220px]">
                {name.trim() || 'Your Challenge'}
              </span>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-ink text-white shrink-0">
                {effectiveDays} Days
              </span>
            </div>
          </div>

          {/* 2. FOR HOW MANY DAYS: 7, 9, 11 OR CUSTOM */}
          <div className="p-4 bg-surface-card rounded-2xl border border-hairline space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-charcoal flex items-center gap-1.5">
                <Calendar size={14} className="text-primary" /> For How Many Days?
              </label>
              <span className="font-mono text-xs font-extrabold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                {effectiveDays} Days Challenge
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              {([7, 9, 11, 'custom'] as const).map((preset) => {
                const isSelected = durationPreset === preset;
                return (
                  <button
                    type="button"
                    key={String(preset)}
                    onClick={() => setDurationPreset(preset)}
                    className={clsx(
                      'py-3 px-2 rounded-2xl border-2 font-display font-bold text-xs sm:text-sm transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer',
                      isSelected
                        ? 'border-primary bg-primary text-white shadow-sm scale-[1.02]'
                        : 'border-hairline bg-surface-bone text-charcoal hover:text-ink hover:bg-stone/20'
                    )}
                  >
                    <span className="font-mono text-base sm:text-lg font-black">
                      {preset === 'custom' ? 'Custom' : `${preset}D`}
                    </span>
                    <span
                      className={clsx(
                        'text-[10px] font-medium',
                        isSelected ? 'text-white/90' : 'text-charcoal'
                      )}
                    >
                      {preset === 'custom' ? 'Any Days' : `${preset} Days`}
                    </span>
                  </button>
                );
              })}
            </div>

            {durationPreset === 'custom' && (
              <div className="pt-2 animate-in fade-in duration-150">
                <Input
                  label="Enter Custom Number of Days"
                  type="number"
                  min={1}
                  max={1000}
                  value={customDays}
                  onChange={(e) => setCustomDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  placeholder="e.g. 21, 30, 45, 75"
                  required
                />
              </div>
            )}
          </div>

          {/* 3. ICON PICKER */}
          <IconPicker
            selectedIcon={selectedIcon}
            onSelectIcon={(newIcon) => setSelectedIcon(newIcon)}
            label="Select Challenge Icon"
            accentColor={vibrantColor}
          />

          {/* 4. COLOR PICKER */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-2 ml-1">
              Select Challenge Color
            </label>
            <div className="grid grid-cols-5 sm:grid-cols-8 gap-2.5 p-2.5 bg-surface-card rounded-2xl border border-hairline">
              {CATEGORY_COLORS.map((col) => {
                const isSelected = selectedColor === col.hex;
                return (
                  <button
                    type="button"
                    key={col.hex}
                    title={col.name}
                    onClick={() => setSelectedColor(col.hex)}
                    className={clsx(
                      'h-10 w-full rounded-xl border border-hairline flex items-center justify-center transition-all cursor-pointer',
                      isSelected
                        ? 'ring-3 ring-ink ring-offset-2 scale-105 shadow-md'
                        : 'hover:opacity-90 hover:scale-102'
                    )}
                    style={{ backgroundColor: col.hex }}
                  >
                    {isSelected && <Check size={16} className="text-white stroke-[3] drop-shadow-sm" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. OPTIONAL DAILY TASKS LIST */}
          <div className="p-4 bg-surface-card rounded-2xl border border-hairline space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal">
                Daily Challenge Tasks (Optional)
              </label>
              <p className="text-[11px] text-charcoal mt-0.5">
                Add specific daily tasks to complete. Missing even 1 task triggers the 90% health penalty!
              </p>
            </div>

            {tasks.length > 0 && (
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {tasks.map((t, idx) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-2 px-3 py-2 bg-surface-bone rounded-xl border border-hairline text-xs"
                  >
                    <span className="font-medium text-ink truncate">
                      {idx + 1}. {t.text}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTask(t.id)}
                      className="text-stone hover:text-red-500 p-1 rounded-full transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. 45 min workout, Read 10 pages, Drink 3L water..."
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTask();
                  }
                }}
                className="flex-1 bg-surface-bone text-ink text-xs sm:text-sm px-4 py-2 rounded-full border border-hairline focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddTask}>
                <Plus size={14} /> Add Task
              </Button>
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-hairline">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="lg" className="gap-1.5">
              <ShieldAlert size={17} /> Review Rules & Create Challenge
            </Button>
          </div>
        </form>
      </Modal>

      {/* STEP 2: MANDATORY RULES DISCLAIMER POPUP */}
      <Modal
        isOpen={isOpen && isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        title="⚠️ Challenge Rules & Disclaimer"
        subtitle={`Read carefully before launching "${name.trim()}" (${effectiveDays} Days)`}
        maxWidth="md"
      >
        <div className="space-y-4 pt-1">
          {/* HIGH STAKES WARNING BANNER */}
          <div className="p-4 bg-red-950 text-white rounded-2xl border-2 border-red-500 shadow-md space-y-1.5">
            <div className="flex items-center gap-2 text-red-400 font-mono text-xs font-extrabold uppercase tracking-wider">
              <AlertTriangle size={16} className="text-red-500 shrink-0" />
              <span>Hardcore Protocol • High Stakes Contract</span>
            </div>
            <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
              You are entering a strict <strong>{effectiveDays}-Day Challenge</strong>. By confirming below, you bind yourself to the following 3 unbreakable rules:
            </p>
          </div>

          {/* THE 3 RULES */}
          <div className="space-y-3">
            {/* RULE 1 */}
            <div className="p-3.5 bg-surface-card border-2 border-hairline rounded-2xl flex items-start gap-3 shadow-2xs">
              <div className="w-8 h-8 rounded-xl bg-ink text-white font-mono font-black text-sm flex items-center justify-center shrink-0">
                1
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-ink">
                  Rule 1: You Have To Complete This Every Day
                </h4>
                <p className="text-xs text-charcoal mt-0.5 leading-relaxed">
                  You must complete this challenge (and all its tasks) every single day for all{' '}
                  <strong>{effectiveDays} days</strong> without breaking the chain.
                </p>
              </div>
            </div>

            {/* RULE 2 */}
            <div className="p-3.5 bg-red-50/80 border-2 border-red-300 rounded-2xl flex items-start gap-3 shadow-2xs">
              <div className="w-8 h-8 rounded-xl bg-red-600 text-white font-mono font-black text-sm flex items-center justify-center shrink-0">
                2
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-red-900">
                  Rule 2: 90% Health Deduction Punishment (-90% ❤️)
                </h4>
                <p className="text-xs text-red-800 mt-0.5 leading-relaxed">
                  Agar aapne ek bhi task complete nahi kiya, toh aapke current Health (Hearts) mein se{' '}
                  <strong>90% Health turant deduct kar diya jayega</strong> (currently{' '}
                  <strong>-{penaltyPreview} ❤️</strong> loss)!
                </p>
              </div>
            </div>

            {/* RULE 3 */}
            <div className="p-3.5 bg-amber-50/80 border-2 border-amber-300 rounded-2xl flex items-start gap-3 shadow-2xs">
              <div className="w-8 h-8 rounded-xl bg-amber-600 text-white font-mono font-black text-sm flex items-center justify-center shrink-0">
                3
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-amber-950">
                  Rule 3: Zero Excuses — Koi Reason Nahi Chahiye!
                </h4>
                <p className="text-xs text-amber-900 mt-0.5 leading-relaxed">
                  Ismien koi reason ya excuse nahi maanga jayega ki aapne kyun nahi kiya.{' '}
                  <strong>Aapko har haal mein karna hi hai!</strong> No shields, no excuses.
                </p>
              </div>
            </div>
          </div>

          {/* REWARD PREVIEW ON COMPLETION */}
          <div className="p-3.5 bg-emerald-50/80 border border-emerald-300 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Award size={20} />
              </div>
              <div>
                <span className="text-xs font-extrabold text-emerald-950 block">
                  Victory Reward on Completion
                </span>
                <span className="text-[11px] text-emerald-800">
                  Full Health Restore + Daily Hearts +{' '}
                  <strong>+{victoryXpPreview} Willpower EXP</strong>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-full border border-emerald-200 shrink-0">
              <Heart size={12} className="fill-red-500 text-red-500" />
              <Zap size={12} className="fill-amber-500 text-amber-500" />
            </div>
          </div>

          {/* CONFIRMATION ACTIONS */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-hairline">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsRulesModalOpen(false)}
              disabled={isSubmitting}
            >
              Back to Edit
            </Button>

            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={handleConfirmRulesAndCreate}
              disabled={isSubmitting}
              className="gap-2 bg-red-600 hover:bg-red-700 text-white shadow-md"
            >
              <CheckCircle2 size={18} />
              <span>{isSubmitting ? 'Launching...' : 'I Accept Rules & Confirm Challenge'}</span>
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
