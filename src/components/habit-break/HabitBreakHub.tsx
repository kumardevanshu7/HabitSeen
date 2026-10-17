import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { HabitBreak, RelapseRecord } from '../../types/habit';
import { CATEGORY_ICONS } from '../../constants/iconsAndColors';
import { boostVibrancy, getContrastIconColor } from '../../utils/colorUtils';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CustomSelect } from '../ui/CustomSelect';
import { Modal } from '../ui/Modal';
import { IconPicker } from '../ui/IconPicker';
import {
  ShieldAlert,
  Plus,
  RotateCcw,
  Trophy,
  History,
  Trash2,
  Clock,
  AlertTriangle,
  FileText,
  Calendar,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';
import confetti from 'canvas-confetti';
import { SecurityModal } from '../security/SecurityModal';

export const HabitBreakHub: React.FC = () => {
  const { habitBreaks, categories, addHabitBreak, relapseHabitBreak, deleteHabitBreak } =
    useAppStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [relapseModalBreakId, setRelapseModalBreakId] = useState<string | null>(null);
  const [relapseReason, setRelapseReason] = useState('');
  const [viewingHistoryBreakId, setViewingHistoryBreakId] = useState<string | null>(null);
  const [breakToDelete, setBreakToDelete] = useState<HabitBreak | null>(null);
  const [isRelapsing, setIsRelapsing] = useState(false);

  const relapseModalBreak = habitBreaks.find((b) => b.id === relapseModalBreakId) || null;
  const viewingHistoryBreak = habitBreaks.find((b) => b.id === viewingHistoryBreakId) || null;

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'cat-others');
  const [icon, setIcon] = useState('shield-check');
  const [color, setColor] = useState('#FF5C5C');
  const [startMode, setStartMode] = useState<'now' | 'custom'>('now');
  const [customStartDate, setCustomStartDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [customStartTime, setCustomStartTime] = useState(() => format(new Date(), 'HH:mm'));
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = React.useRef(false);

  // Sync default date/time when modal opens
  useEffect(() => {
    if (isAddModalOpen) {
      const now = new Date();
      setCustomStartDate(format(now, 'yyyy-MM-dd'));
      setCustomStartTime(format(now, 'HH:mm'));
      setStartMode('now');
    }
  }, [isAddModalOpen]);

  // Global ticker for live elapsed timers (updates every 1s)
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current || isSubmitting) return;

    if (!name.trim()) {
      setError('Please provide a habit name to quit');
      return;
    }
    setError('');
    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      let computedStartedAt = new Date().toISOString();
      if (startMode === 'custom' && customStartDate) {
        const timePart = customStartTime || '00:00';
        const parsed = new Date(`${customStartDate}T${timePart}:00`);
        const now = new Date();
        if (isNaN(parsed.getTime())) {
          setError('Invalid start date and time.');
          submittingRef.current = false;
          setIsSubmitting(false);
          return;
        }
        if (parsed.getTime() > now.getTime() + 60 * 1000) {
          setError('Start date cannot be in the future.');
          submittingRef.current = false;
          setIsSubmitting(false);
          return;
        }
        const fiveYearsAgo = new Date();
        fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
        if (parsed.getTime() < fiveYearsAgo.getTime()) {
          setError('Start date cannot be more than 5 years in the past.');
          submittingRef.current = false;
          setIsSubmitting(false);
          return;
        }
        computedStartedAt = parsed.toISOString();
      }

      await addHabitBreak({
        name: name.trim(),
        description: description.trim(),
        categoryId,
        icon,
        color,
        startedAt: computedStartedAt,
      });

      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });

      setName('');
      setDescription('');
      setStartMode('now');
      setIsAddModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to start break timer');
    } finally {
      setIsSubmitting(false);
      submittingRef.current = false;
    }
  };

  const handleConfirmRelapse = async () => {
    if (!relapseModalBreakId || isRelapsing) return;
    setIsRelapsing(true);
    try {
      await relapseHabitBreak(relapseModalBreakId, relapseReason.trim());
      setRelapseReason('');
      setRelapseModalBreakId(null);
    } catch (err) {
      console.error('Failed to log relapse:', err);
    } finally {
      setIsRelapsing(false);
    }
  };

  // Format Elapsed Time (Days, Hours, Mins, Secs)
  const formatElapsedTime = (startedAt: string) => {
    const startMs = new Date(startedAt).getTime();
    if (isNaN(startMs)) {
      return { days: 0, hours: 0, mins: 0, secs: 0, totalSeconds: 0, isScheduledFuture: false };
    }
    const diffMs = Date.now() - startMs;
    const isScheduledFuture = diffMs < 0;
    const elapsedSeconds = Math.max(0, Math.floor(Math.abs(diffMs) / 1000));

    const days = Math.floor(elapsedSeconds / 86400);
    const hours = Math.floor((elapsedSeconds % 86400) / 3600);
    const mins = Math.floor((elapsedSeconds % 3600) / 60);
    const secs = elapsedSeconds % 60;

    return { days, hours, mins, secs, totalSeconds: elapsedSeconds, isScheduledFuture };
  };

  const formatDurationReadable = (totalSecs: number) => {
    const d = Math.floor(totalSecs / 86400);
    const h = Math.floor((totalSecs % 86400) / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0 || d > 0) parts.push(`${h}h`);
    parts.push(`${m}m`);
    return parts.join(' ');
  };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="p-6 bg-surface-dark text-white rounded-3xl border border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-semibold text-rose-300 mb-2">
            <ShieldAlert size={14} /> Persistent Sobriety / Abstinence Engine
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight">
            Timer Habit Break
          </h2>
          <p className="text-white/70 text-xs sm:text-sm mt-1 max-w-lg">
            A real-time persistent chronometer for habits you want to quit forever. Tracks continuous abstinence 24/7 even when the app is closed.
          </p>
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          variant="primary"
          size="lg"
          className="self-start sm:self-auto gap-2"
        >
          <Plus size={18} /> Start New Break Timer
        </Button>
      </div>

      {/* Medical Safety Disclaimer */}
      <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
        <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
        <p>
          <strong className="font-semibold text-amber-950">Medical Notice:</strong> If you are quitting alcohol, benzodiazepines, or substances with dangerous acute withdrawal symptoms, consult a qualified healthcare professional before stopping abruptly. Behavioral tracking is not a substitute for supervised medical care.
        </p>
      </div>

      {/* ACTIVE BREAK TIMERS LIST */}
      {habitBreaks.length === 0 ? (
        <div className="text-center py-12 px-4 bg-surface-card border border-hairline rounded-3xl">
          <div className="w-16 h-16 rounded-full bg-surface-bone flex items-center justify-center text-charcoal mx-auto mb-3">
            <Clock size={32} />
          </div>
          <h3 className="font-display font-bold text-xl text-ink">No Active Habit Breaks</h3>
          <p className="text-charcoal text-xs sm:text-sm mt-1 max-w-sm mx-auto">
            Choose any destructive habit you want to break (Smoking, Sugar, Doomscrolling, Alcohol) and launch your clean streak timer now!
          </p>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            variant="outline"
            size="md"
            className="mt-4 gap-1.5"
          >
            <Plus size={16} /> Add First Habit to Break
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {habitBreaks.map((b) => {
            const time = formatElapsedTime(b.startedAt);
            const liveTotalSecs = time.isScheduledFuture ? 0 : time.totalSeconds;
            const effectiveBestStreak = Math.max(b.bestStreakSeconds || 0, liveTotalSecs);
            const bestTime = {
              days: Math.floor(effectiveBestStreak / 86400),
              hours: Math.floor((effectiveBestStreak % 86400) / 3600),
            };

            const IconComp =
              CATEGORY_ICONS.find((i) => i.id === b.icon)?.icon || CATEGORY_ICONS[0].icon;
            const effectiveColor = b.color || '#FF5C5C';

            return (
              <div
                key={b.id}
                className="bg-surface-card border-2 rounded-3xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                style={{ borderColor: `${effectiveColor}40`, borderTopWidth: '6px', borderTopColor: effectiveColor }}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-xs"
                        style={{
                          backgroundColor: boostVibrancy(effectiveColor),
                          color: getContrastIconColor(boostVibrancy(effectiveColor)),
                        }}
                      >
                        <IconComp size={20} strokeWidth={2.5} />
                      </span>
                      <div>
                        <h3 className="font-display font-bold text-lg sm:text-xl text-ink tracking-tight">
                          {b.name}
                        </h3>
                        {b.description && (
                          <p className="text-xs text-charcoal line-clamp-1">
                            {b.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => setBreakToDelete(b)}
                      className="p-1.5 text-stone hover:text-red-500 rounded-full hover:bg-surface-bone transition-colors"
                      title="Delete break habit"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* LIVE CHRONOMETER DISPLAY */}
                  <div className="my-4 p-4 bg-canvas rounded-2xl border border-hairline text-center">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-primary block mb-1">
                      {time.isScheduledFuture
                        ? '⏳ SCHEDULED TO START IN'
                        : '● TIMER RUNNING — PERSISTENT CLEAN STREAK'}
                    </span>
                    <span className="text-[11px] font-mono text-charcoal block mb-2.5">
                      Started: {format(new Date(b.startedAt), 'dd MMM yyyy, hh:mm a')}
                    </span>

                    <div className="grid grid-cols-4 gap-2 font-mono">
                      <div className="p-2 bg-surface-card rounded-xl border border-hairline">
                        <span className="text-2xl sm:text-3xl font-bold text-ink block">
                          {time.days}
                        </span>
                        <span className="text-[10px] font-sans text-charcoal uppercase">
                          Days
                        </span>
                      </div>
                      <div className="p-2 bg-surface-card rounded-xl border border-hairline">
                        <span className="text-2xl sm:text-3xl font-bold text-ink block">
                          {time.hours.toString().padStart(2, '0')}
                        </span>
                        <span className="text-[10px] font-sans text-charcoal uppercase">
                          Hours
                        </span>
                      </div>
                      <div className="p-2 bg-surface-card rounded-xl border border-hairline">
                        <span className="text-2xl sm:text-3xl font-bold text-ink block">
                          {time.mins.toString().padStart(2, '0')}
                        </span>
                        <span className="text-[10px] font-sans text-charcoal uppercase">
                          Mins
                        </span>
                      </div>
                      <div className="p-2 bg-surface-card rounded-xl border border-hairline">
                        <span className="text-2xl sm:text-3xl font-bold text-primary block">
                          {time.secs.toString().padStart(2, '0')}
                        </span>
                        <span className="text-[10px] font-sans text-charcoal uppercase">
                          Secs
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Best Record & Relapses History Button */}
                  <div className="flex items-center justify-between text-xs text-charcoal px-1 mb-4">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Trophy size={14} className="text-amber-500" />
                      Best Streak: <strong className="text-ink">{bestTime.days}d {bestTime.hours}h</strong>
                    </span>

                    {/* RELAPSE HISTORY BUTTON */}
                    <button
                      type="button"
                      onClick={() => setViewingHistoryBreakId(b.id)}
                      className="flex items-center gap-1 text-primary hover:text-primary-deep font-bold bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-full border border-primary/20 transition-colors"
                    >
                      <History size={13} />
                      <span>Relapse Log ({b.relapseHistory?.length || 0})</span>
                    </button>
                  </div>
                </div>

                {/* RELAPSE ACTION */}
                <div className="pt-3 border-t border-hairline flex items-center justify-between gap-2">
                  <span className="text-[11px] text-stone">One day, one moment at a time.</span>
                  <button
                    onClick={() => setRelapseModalBreakId(b.id)}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-full border border-red-200 transition-colors flex items-center gap-1.5 active:scale-95"
                  >
                    <RotateCcw size={13} /> I Relapsed
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE BREAK MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Start Habit Break Timer"
        subtitle="Specify what you want to quit and launch your continuous abstinence chronometer"
        maxWidth="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="What habit are you quitting?"
            placeholder="e.g. Cigarettes, Sugar & Sodas, Instagram Scrolling"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError('');
            }}
            error={error}
            autoFocus
            required
          />

          <CustomSelect
            label="Category"
            value={categoryId}
            options={categories.map((c) => ({
              value: c.id,
              label: c.name,
            }))}
            onChange={(val) => setCategoryId(val)}
          />

          {/* START DATE & CUSTOM TIME SELECTOR */}
          <div className="p-4 sm:p-5 bg-surface-card rounded-2xl border border-hairline space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal">
                  Start Date & Time
                </label>
                <p className="text-[11px] text-stone mt-0.5">
                  Launch immediately or specify when your streak began
                </p>
              </div>

              <div className="flex items-center bg-surface-bone p-1 rounded-full border border-hairline self-start sm:self-auto shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    setCustomStartDate(format(now, 'yyyy-MM-dd'));
                    setCustomStartTime(format(now, 'HH:mm'));
                    setStartMode('now');
                  }}
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap',
                    startMode === 'now'
                      ? 'bg-ink text-white shadow-2xs'
                      : 'text-charcoal hover:text-ink'
                  )}
                >
                  <Zap size={13} className={startMode === 'now' ? 'text-amber-300' : 'text-charcoal'} />
                  <span>Right Now</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStartMode('custom')}
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap',
                    startMode === 'custom'
                      ? 'bg-primary text-white shadow-2xs'
                      : 'text-charcoal hover:text-ink'
                  )}
                >
                  <Calendar size={13} className={startMode === 'custom' ? 'text-white' : 'text-charcoal'} />
                  <span>Custom Time</span>
                </button>
              </div>
            </div>

            {startMode === 'now' ? (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-bone/70 border border-hairline text-charcoal text-xs">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                  <Zap size={14} />
                </div>
                <div>
                  <span className="font-semibold text-ink">Streak starts right now:</span>{' '}
                  <span className="font-mono text-stone">
                    {format(new Date(), 'h:mm a, d MMM yyyy')}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-charcoal mb-1.5 ml-0.5 flex items-center gap-1.5">
                      <Calendar size={12} className="text-primary" /> Start Date
                    </label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => {
                        setCustomStartDate(e.target.value);
                        setStartMode('custom');
                      }}
                      className="w-full bg-surface-bone text-ink text-sm font-mono font-bold px-3.5 py-2.5 h-11 rounded-xl border border-hairline focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-charcoal mb-1.5 ml-0.5 flex items-center gap-1.5">
                      <Clock size={12} className="text-primary" /> Start Time
                    </label>
                    <input
                      type="time"
                      value={customStartTime}
                      onChange={(e) => {
                        setCustomStartTime(e.target.value);
                        setStartMode('custom');
                      }}
                      className="w-full bg-surface-bone text-ink text-sm font-mono font-bold px-3.5 py-2.5 h-11 rounded-xl border border-hairline focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                      required
                    />
                  </div>
                </div>
                <p className="text-[11px] text-stone ml-1">
                  Helpful if you began your abstinence period earlier today or on a past date.
                </p>
              </div>
            )}
          </div>

          {/* Icon Selector */}
          <IconPicker
            selectedIcon={icon}
            onSelectIcon={(newIcon) => setIcon(newIcon)}
            label="Select Protective Badge Icon"
            accentColor={color}
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1.5 ml-1">
              Why are you breaking this habit? (Your North Star)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. To reclaim my energy, focus on my career, and protect my health."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-surface-card text-ink text-sm p-3 rounded-2xl border border-hairline focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-hairline">
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="lg" disabled={isSubmitting}>
              {isSubmitting ? 'Starting...' : 'Start Persistent Timer'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* RELAPSE TRIGGER REFLECTION MODAL */}
      <Modal
        isOpen={Boolean(relapseModalBreak)}
        onClose={() => setRelapseModalBreakId(null)}
        title="Reset & Learn (Relapse Reflection)"
        subtitle="A slip is data, not defeat. Your past streak will be preserved in your Relapse Log."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-800">
            <AlertTriangle size={18} className="shrink-0 mt-0.5 text-red-600" />
            <p>
              Your past streak duration will be securely archived into your <strong>Relapse History Log</strong>. Your best clean record will remain intact, and the timer will restart from now.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1.5 ml-1">
              What triggered this relapse? (Reflection Journal Note)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Stress after late work, emotional fatigue, peer pressure..."
              value={relapseReason}
              onChange={(e) => setRelapseReason(e.target.value)}
              className="w-full bg-surface-card text-ink text-sm p-3 rounded-2xl border border-hairline focus:outline-none resize-none"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-hairline">
            <Button variant="ghost" onClick={() => setRelapseModalBreakId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmRelapse} disabled={isRelapsing}>
              {isRelapsing ? 'Logging...' : 'Log Relapse & Restart Timer'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* DEDICATED RELAPSE HISTORY & JOURNEY LOG MODAL */}
      <Modal
        isOpen={Boolean(viewingHistoryBreak)}
        onClose={() => setViewingHistoryBreakId(null)}
        title={`${viewingHistoryBreak?.name || 'Habit Break'} — Relapse Journey Log`}
        subtitle="Full chronological record of past streaks and trigger reflections"
        maxWidth="lg"
      >
        <div className="space-y-4">
          {viewingHistoryBreak && (viewingHistoryBreak.relapseHistory || []).length === 0 ? (
            <div className="text-center py-10 px-4 bg-surface-card rounded-2xl border border-hairline">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-badge-success flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 size={32} />
              </div>
              <h4 className="font-display font-bold text-lg text-ink">Zero Relapses!</h4>
              <p className="text-xs sm:text-sm text-charcoal mt-1 max-w-sm mx-auto">
                You are currently on your first unbroken streak. Keep your momentum strong!
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {(viewingHistoryBreak?.relapseHistory || [])
                .slice()
                .reverse()
                .map((rel: RelapseRecord, idx: number) => {
                  const endedDate = new Date(rel.endedAt);
                  const readableDuration = formatDurationReadable(rel.durationSeconds);

                  return (
                    <div
                      key={rel.id || idx}
                      className="p-4 bg-surface-card border border-hairline rounded-2xl shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-hairline/60 pb-2">
                        <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                          <History size={14} className="text-primary" />
                          Relapse #{(viewingHistoryBreak?.relapseHistory?.length || 0) - idx}
                        </span>
                        <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                          Lasted {readableDuration}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-charcoal">
                        <Calendar size={13} />
                        <span>{format(endedDate, 'dd MMMM yyyy, hh:mm a')}</span>
                      </div>

                      {rel.reason ? (
                        <div className="p-3 bg-surface-bone rounded-xl text-xs text-body border border-hairline/60">
                          <strong className="text-ink block mb-0.5">Trigger / Reflection:</strong>
                          <p>{rel.reason}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-stone italic">No trigger note recorded.</p>
                      )}
                    </div>
                  );
                })}
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-hairline">
            <Button variant="dark" onClick={() => setViewingHistoryBreakId(null)}>
              Close Relapse Log
            </Button>
          </div>
        </div>
      </Modal>

      {/* SECURITY VERIFICATION MODAL FOR DELETING BREAK TIMER */}
      <SecurityModal
        isOpen={Boolean(breakToDelete)}
        onClose={() => setBreakToDelete(null)}
        title="Confirm Deletion of Habit Break"
        actionTitle={`Permanently delete abstinence timer for "${breakToDelete?.name}" and all relapse history`}
        isDanger={true}
        onSuccess={async () => {
          if (breakToDelete) {
            await deleteHabitBreak(breakToDelete.id);
            setBreakToDelete(null);
          }
        }}
      />
    </div>
  );
};
