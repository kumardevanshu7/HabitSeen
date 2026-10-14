import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CustomSelect } from '../ui/CustomSelect';
import { useAppStore } from '../../stores/useAppStore';
import {
  HabitType,
  NumericOperator,
  TimerOperator,
  FrequencyType,
  ChecklistItem,
  HabitConfig,
  HabitFrequency,
  HabitSchedule,
  Habit,
} from '../../types/habit';
import {
  calculateDaysBetween,
  getTodayKey,
  formatSecondsToHMS,
  parseHMSToSeconds,
} from '../../utils/dateMath';
import { CreateCategoryModal } from '../categories/CreateCategoryModal';
import { CATEGORY_ICONS } from '../../constants/iconsAndColors';
import { boostVibrancy, getContrastIconColor } from '../../utils/colorUtils';
import {
  Plus,
  Trash2,
  Star,
  CheckSquare,
  Clock,
  Hash,
  ToggleLeft,
  Calendar,
  Check,
  Flame,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import clsx from 'clsx';

interface CreateHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  habitToEdit?: Habit | null;
}

export const CreateHabitModal: React.FC<CreateHabitModalProps> = ({
  isOpen,
  onClose,
  habitToEdit,
}) => {
  const { categories, addHabit, updateHabit } = useAppStore();

  // Wizard Step: 1 = Category, 2 = Habit & Target, 3 = Schedule & Priority
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);

  // Category State
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    categories[0]?.id || 'cat-others'
  );
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Habit Core
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<HabitType>('YES_NO');

  // 1. Numeric Fields
  const [numericOp, setNumericOp] = useState<NumericOperator>('AT_LEAST');
  const [numericGoal, setNumericGoal] = useState<number>(8);
  const [numericUnit, setNumericUnit] = useState('glasses');

  // 2. Timer Fields (00:00:00 Hours, Minutes, Seconds)
  const [timerOp, setTimerOp] = useState<TimerOperator>('AT_LEAST');
  const [timerHours, setTimerHours] = useState<number>(0);
  const [timerMinutes, setTimerMinutes] = useState<number>(25);
  const [timerSecs, setTimerSecs] = useState<number>(0);

  // 3. Checklist Fields
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([
    { id: 'item-1', text: 'Brush teeth & drink water', isStarred: true },
    { id: 'item-2', text: '10 minutes deep stretching', isStarred: false },
  ]);
  const [newItemText, setNewItemText] = useState('');
  const [checklistCondition, setChecklistCondition] = useState<
    'ALL_MANDATORY' | 'CUSTOM_MIN_ITEMS' | 'STARRED_ONLY'
  >('ALL_MANDATORY');
  const [customMinCount, setCustomMinCount] = useState<number>(1);

  // Frequency ("How often do you want to do it")
  const [frequencyType, setFrequencyType] = useState<FrequencyType>('EVERYDAY');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri default
  const [daysOfMonthStr, setDaysOfMonthStr] = useState<string>('1, 15, 30');
  const [daysOfYearStr, setDaysOfYearStr] = useState<string>('01-01, 12-25');
  const [periodCount, setPeriodCount] = useState<number>(3);
  const [periodType, setPeriodType] = useState<'WEEK' | 'MONTH' | 'YEAR'>('WEEK');
  const [intervalDays, setIntervalDays] = useState<number>(2);

  // Schedule & Continuous Priority Number (0 to 100)
  const [startDate, setStartDate] = useState<string>(getTodayKey());
  const [endDate, setEndDate] = useState<string>('');
  const [priority, setPriority] = useState<number>(50); // Default 50 out of 100

  // Error validation & loading
  const [nameError, setNameError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = React.useRef(false);

  // Sync state whenever habitToEdit changes or modal is opened
  useEffect(() => {
    if (habitToEdit && isOpen) {
      setSelectedCategoryId(habitToEdit.categoryId || categories[0]?.id || 'cat-others');
      setName(habitToEdit.name || '');
      setDescription(habitToEdit.description || '');
      setType(habitToEdit.type || 'YES_NO');

      // 1. Numeric
      if (habitToEdit.config?.numeric) {
        setNumericOp(habitToEdit.config.numeric.operator || 'AT_LEAST');
        setNumericGoal(habitToEdit.config.numeric.goal ?? 8);
        setNumericUnit(habitToEdit.config.numeric.unit || 'glasses');
      } else {
        setNumericOp('AT_LEAST');
        setNumericGoal(8);
        setNumericUnit('glasses');
      }

      // 2. Timer (00:00:00)
      if (habitToEdit.config?.timer) {
        const hms = formatSecondsToHMS(habitToEdit.config.timer.targetSeconds || 1500);
        setTimerOp(habitToEdit.config.timer.operator || 'AT_LEAST');
        setTimerHours(hms.hours);
        setTimerMinutes(hms.minutes);
        setTimerSecs(hms.seconds);
      } else {
        setTimerOp('AT_LEAST');
        setTimerHours(0);
        setTimerMinutes(25);
        setTimerSecs(0);
      }

      // 3. Checklist
      if (habitToEdit.config?.checklist) {
        setChecklistItems(habitToEdit.config.checklist.items || []);
        setChecklistCondition(habitToEdit.config.checklist.successCondition || 'ALL_MANDATORY');
        setCustomMinCount(habitToEdit.config.checklist.customMinCount || 1);
      } else {
        setChecklistItems([
          { id: 'item-1', text: 'Brush teeth & drink water', isStarred: true },
          { id: 'item-2', text: '10 minutes deep stretching', isStarred: false },
        ]);
        setChecklistCondition('ALL_MANDATORY');
        setCustomMinCount(1);
      }

      // Frequency
      setFrequencyType(habitToEdit.frequency?.type || 'EVERYDAY');
      setDaysOfWeek(habitToEdit.frequency?.daysOfWeek || [1, 2, 3, 4, 5]);
      setDaysOfMonthStr(habitToEdit.frequency?.daysOfMonth?.join(', ') || '1, 15, 30');
      setDaysOfYearStr(habitToEdit.frequency?.daysOfYear?.join(', ') || '01-01, 12-25');
      setPeriodCount(habitToEdit.frequency?.daysPerPeriod?.targetCount || 3);
      setPeriodType(habitToEdit.frequency?.daysPerPeriod?.period || 'WEEK');
      setIntervalDays(habitToEdit.frequency?.repeatEveryDays || 2);

      // Schedule & Priority
      setStartDate(habitToEdit.schedule?.startDate || getTodayKey());
      setEndDate(habitToEdit.schedule?.endDate || '');
      setPriority(
        typeof habitToEdit.schedule?.priority === 'number'
          ? habitToEdit.schedule.priority
          : 50
      );
      setNameError('');
      setWizardStep(2); // Start directly at habit details when editing
    } else if (!habitToEdit && isOpen) {
      setSelectedCategoryId(categories[0]?.id || 'cat-others');
      setName('');
      setDescription('');
      setType('YES_NO');
      setNumericOp('AT_LEAST');
      setNumericGoal(8);
      setNumericUnit('glasses');
      setTimerOp('AT_LEAST');
      setTimerHours(0);
      setTimerMinutes(25);
      setTimerSecs(0);
      setChecklistItems([
        { id: 'item-1', text: 'Brush teeth & drink water', isStarred: true },
        { id: 'item-2', text: '10 minutes deep stretching', isStarred: false },
      ]);
      setChecklistCondition('ALL_MANDATORY');
      setCustomMinCount(1);
      setFrequencyType('EVERYDAY');
      setDaysOfWeek([1, 2, 3, 4, 5]);
      setDaysOfMonthStr('1, 15, 30');
      setDaysOfYearStr('01-01, 12-25');
      setPeriodCount(3);
      setPeriodType('WEEK');
      setIntervalDays(2);
      setStartDate(getTodayKey());
      setEndDate('');
      setNewItemText('');
      setPriority(50);
      setNameError('');
      setWizardStep(1); // Start at category when creating new habit
    }
  }, [habitToEdit, isOpen, categories]);

  // Checklist Helpers
  const addChecklistItem = () => {
    if (!newItemText.trim()) return;
    setChecklistItems([
      ...checklistItems,
      {
        id: `item-${Date.now()}`,
        text: newItemText.trim(),
        isStarred: false,
      },
    ]);
    setNewItemText('');
  };

  const removeChecklistItem = (id: string) => {
    setChecklistItems(checklistItems.filter((it) => it.id !== id));
  };

  const toggleStarItem = (id: string) => {
    setChecklistItems(
      checklistItems.map((it) =>
        it.id === id ? { ...it, isStarred: !it.isStarred } : it
      )
    );
  };

  const toggleDayOfWeek = (day: number) => {
    if (daysOfWeek.includes(day)) {
      setDaysOfWeek(daysOfWeek.filter((d) => d !== day));
    } else {
      setDaysOfWeek([...daysOfWeek, day].sort());
    }
  };

  const totalDays = calculateDaysBetween(startDate, endDate);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (submittingRef.current || isSubmitting) return;
    if (!name.trim()) {
      setWizardStep(2);
      setNameError('Please enter a habit name');
      return;
    }
    setNameError('');
    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      // 1. Cleanly construct config without any undefined fields
      const config: HabitConfig = {};
      if (type === 'NUMERIC') {
        config.numeric = {
          operator: numericOp,
          goal: Number(numericGoal) || 1,
          unit: numericUnit.trim() || 'units',
          suffix: 'a day',
        };
      } else if (type === 'TIMER') {
        const totalSecs = parseHMSToSeconds(timerHours, timerMinutes, timerSecs) || 60;
        config.timer = {
          operator: timerOp,
          targetSeconds: totalSecs,
        };
      } else if (type === 'CHECKLIST') {
        config.checklist = {
          items: checklistItems,
          successCondition: checklistCondition,
          customMinCount: Number(customMinCount) || 1,
        };
      }

      // 2. Cleanly construct frequency without undefined fields
      const frequency: HabitFrequency = { type: frequencyType };
      if (frequencyType === 'SPECIFIC_DAYS_OF_WEEK') {
        frequency.daysOfWeek = daysOfWeek;
      } else if (frequencyType === 'SPECIFIC_DAYS_OF_MONTH') {
        frequency.daysOfMonth = daysOfMonthStr
          .split(',')
          .map((s) => parseInt(s.trim(), 10))
          .filter((n) => !isNaN(n) && n >= 1 && n <= 31);
      } else if (frequencyType === 'SPECIFIC_DAYS_OF_YEAR') {
        frequency.daysOfYear = daysOfYearStr
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
      } else if (frequencyType === 'DAYS_PER_PERIOD') {
        frequency.daysPerPeriod = {
          targetCount: Number(periodCount) || 1,
          period: periodType,
        };
      } else if (frequencyType === 'INTERVAL_REPEAT') {
        frequency.repeatEveryDays = Number(intervalDays) || 1;
      }

      // 3. Cleanly construct schedule with priority number (0 to 100)
      const schedule: HabitSchedule = {
        startDate,
        totalDays: totalDays > 0 ? totalDays : 0,
        priority: Math.min(100, Math.max(0, Number(priority) || 50)),
      };
      if (endDate) {
        schedule.endDate = endDate;
      }

      if (habitToEdit) {
        await updateHabit({
          ...habitToEdit,
          name: name.trim(),
          description: description.trim(),
          categoryId: selectedCategoryId,
          type,
          config,
          frequency,
          schedule,
        });
      } else {
        await addHabit({
          name: name.trim(),
          description: description.trim(),
          categoryId: selectedCategoryId,
          type,
          config,
          frequency,
          schedule,
        });
      }

      onClose();
    } catch (err: any) {
      console.error('Failed to save habit:', err);
      setNameError(err.message || 'Failed to save habit');
    } finally {
      setIsSubmitting(false);
      submittingRef.current = false;
    }
  };

  const DAYS_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Current selected category object
  const activeCategory =
    categories.find((c) => c.id === selectedCategoryId) || categories[0] || {
      id: 'cat-others',
      name: 'Others',
      icon: 'layout-grid',
      color: '#2563EB',
    };
  const ActiveCategoryIcon =
    CATEGORY_ICONS.find((i) => i.id === activeCategory?.icon)?.icon ||
    CATEGORY_ICONS[0].icon;
  const activeVibrantColor = boostVibrancy(activeCategory?.color);

  // Formatted preview of 00:00:00 duration
  const timerTotalSeconds = parseHMSToSeconds(timerHours, timerMinutes, timerSecs);
  const formattedTimerPreview = formatSecondsToHMS(timerTotalSeconds).formatted;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={habitToEdit ? 'Edit Habit' : 'Create New Habit'}
        subtitle={
          habitToEdit
            ? 'Update cadence, targets, or priority order (0-100)'
            : 'Configure your behavioral habit, cadence, and priority order'
        }
        maxWidth="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 3-STEP WIZARD PROGRESS BAR (CLEAN, NO DUPLICATE NUMBERS) */}
          <div className="flex items-center gap-2 p-1 bg-surface-bone rounded-2xl border border-hairline">
            <button
              type="button"
              onClick={() => setWizardStep(1)}
              className={clsx(
                'flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-2',
                wizardStep === 1
                  ? 'bg-ink text-white shadow-xs'
                  : 'text-charcoal hover:text-ink'
              )}
            >
              <span
                className={clsx(
                  'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                  wizardStep === 1 ? 'bg-white/20 text-white' : 'bg-stone/30 text-charcoal'
                )}
              >
                1
              </span>
              <span>Category</span>
            </button>

            <button
              type="button"
              onClick={() => setWizardStep(2)}
              className={clsx(
                'flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-2',
                wizardStep === 2
                  ? 'bg-ink text-white shadow-xs'
                  : 'text-charcoal hover:text-ink'
              )}
            >
              <span
                className={clsx(
                  'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                  wizardStep === 2 ? 'bg-white/20 text-white' : 'bg-stone/30 text-charcoal'
                )}
              >
                2
              </span>
              <span>Habit & Target</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!name.trim()) {
                  setNameError('Please enter a habit name');
                  setWizardStep(2);
                  return;
                }
                setWizardStep(3);
              }}
              className={clsx(
                'flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-2',
                wizardStep === 3
                  ? 'bg-ink text-white shadow-xs'
                  : 'text-charcoal hover:text-ink'
              )}
            >
              <span
                className={clsx(
                  'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                  wizardStep === 3 ? 'bg-white/20 text-white' : 'bg-stone/30 text-charcoal'
                )}
              >
                3
              </span>
              <span>Schedule & Priority</span>
            </button>
          </div>

          {/* ============================================================ */}
          {/* STEP 1: CATEGORY SELECTION (BRIGHT, VIVID, CRISP CONTRAST) */}
          {/* ============================================================ */}
          {wizardStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-display font-bold text-base text-ink">
                    Select Habit Category
                  </h4>
                  <p className="text-xs text-charcoal">
                    Choose a domain for this habit, or create your own custom domain
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="text-xs font-bold text-primary hover:text-primary-deep bg-primary/10 border border-primary/20 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-colors"
                >
                  <Plus size={14} /> Create Category
                </button>
              </div>

              {/* Category Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {Array.from(new Map(categories.map((c) => [c.name.trim().toLowerCase(), c])).values()).map((cat) => {
                  const Icon =
                    CATEGORY_ICONS.find((i) => i.id === cat.icon)?.icon ||
                    CATEGORY_ICONS[0].icon;
                  const isSelected = selectedCategoryId === cat.id;
                  const vibrantColor = boostVibrancy(cat.color);
                  const iconColor = getContrastIconColor(vibrantColor);

                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={clsx(
                        'flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-left shadow-xs',
                        isSelected
                          ? 'ring-3 ring-ink scale-[1.02] shadow-sm font-bold'
                          : 'hover:bg-surface-bone bg-surface-card'
                      )}
                      style={{
                        borderColor: vibrantColor,
                        backgroundColor: isSelected ? `${vibrantColor}22` : '#FFFFFF',
                      }}
                    >
                      {/* VIBRANT ICON CIRCLE WITH WCAG CONTRAST */}
                      <span
                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                        style={{
                          backgroundColor: vibrantColor,
                          color: iconColor,
                        }}
                      >
                        <Icon size={20} strokeWidth={2.5} />
                      </span>

                      <div className="truncate flex-1">
                        <p className="truncate text-sm font-bold text-ink">
                          {cat.name}
                        </p>
                        <span className="text-[11px] font-mono text-charcoal">
                          {cat.isDefault ? 'Default domain' : 'Custom domain'}
                        </span>
                      </div>

                      {/* CHECKMARK INDICATOR */}
                      {isSelected && (
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 shadow-2xs"
                          style={{
                            backgroundColor: vibrantColor,
                            color: iconColor,
                          }}
                        >
                          <Check size={14} strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Selected Badge Preview Banner */}
              <div
                className="p-3.5 rounded-2xl border-2 flex items-center justify-between shadow-2xs"
                style={{
                  borderColor: activeVibrantColor,
                  backgroundColor: `${activeVibrantColor}15`,
                }}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-xs"
                    style={{
                      backgroundColor: activeVibrantColor,
                      color: getContrastIconColor(activeVibrantColor),
                    }}
                  >
                    <ActiveCategoryIcon size={16} strokeWidth={2.5} />
                  </span>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-charcoal block">
                      Active Selection
                    </span>
                    <span className="text-sm font-bold text-ink">
                      {activeCategory?.name}
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => setWizardStep(2)}
                  className="gap-1.5"
                >
                  Continue to Habit Target <ArrowRight size={14} />
                </Button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 2: HABIT TYPE & CONFIGURATION */}
          {/* ============================================================ */}
          {wizardStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* HABIT TYPE SELECTOR (4 TYPES) - NO DUPLICATE NUMBER */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-2 ml-1">
                  Habit Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setType('YES_NO')}
                    className={clsx(
                      'flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all text-center gap-1.5',
                      type === 'YES_NO'
                        ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/30 shadow-xs font-bold'
                        : 'border-hairline bg-surface-card hover:bg-surface-bone text-charcoal'
                    )}
                  >
                    <ToggleLeft size={22} />
                    <span className="text-xs font-semibold">Yes or No</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setType('NUMERIC')}
                    className={clsx(
                      'flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all text-center gap-1.5',
                      type === 'NUMERIC'
                        ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/30 shadow-xs font-bold'
                        : 'border-hairline bg-surface-card hover:bg-surface-bone text-charcoal'
                    )}
                  >
                    <Hash size={22} />
                    <span className="text-xs font-semibold">Numeric Goal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setType('TIMER')}
                    className={clsx(
                      'flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all text-center gap-1.5',
                      type === 'TIMER'
                        ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/30 shadow-xs font-bold'
                        : 'border-hairline bg-surface-card hover:bg-surface-bone text-charcoal'
                    )}
                  >
                    <Clock size={22} />
                    <span className="text-xs font-semibold">Timer Duration</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setType('CHECKLIST')}
                    className={clsx(
                      'flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all text-center gap-1.5',
                      type === 'CHECKLIST'
                        ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/30 shadow-xs font-bold'
                        : 'border-hairline bg-surface-card hover:bg-surface-bone text-charcoal'
                    )}
                  >
                    <CheckSquare size={22} />
                    <span className="text-xs font-semibold">Checklist</span>
                  </button>
                </div>
              </div>

              {/* HABIT NAME & INPUTS - NO DUPLICATE NUMBER */}
              <div className="space-y-4 p-4 bg-surface-card rounded-2xl border border-hairline shadow-2xs">
                <Input
                  label="Habit Name"
                  placeholder={
                    type === 'YES_NO'
                      ? 'e.g. Cold Shower, No Social Media'
                      : type === 'NUMERIC'
                      ? 'e.g. Daily Water Intake, Read Pages'
                      : type === 'TIMER'
                      ? 'e.g. Deep Meditation, Focused Coding'
                      : 'e.g. Morning Routine, Evening Wind Down'
                  }
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (nameError) setNameError('');
                  }}
                  error={nameError}
                  required
                  autoFocus
                />

                {/* 1. NUMERIC TYPE CONFIG */}
                {type === 'NUMERIC' && (
                  <div className="pt-2 border-t border-hairline space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <CustomSelect<NumericOperator>
                        label="Evaluation Rule"
                        value={numericOp}
                        options={[
                          { value: 'AT_LEAST', label: 'At least (≥)' },
                          { value: 'LESS_THAN', label: 'Less than (<)' },
                          { value: 'EXACTLY', label: 'Exactly (=)' },
                          { value: 'ANY_VALUE', label: 'Any value (> 0)' },
                        ]}
                        onChange={(val) => setNumericOp(val)}
                      />

                      <Input
                        label="Goal Target"
                        type="number"
                        min={1}
                        value={numericGoal}
                        onChange={(e) => setNumericGoal(Number(e.target.value))}
                        required
                      />

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1.5 ml-1">
                          Unit & Frequency
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="glasses / pages / km"
                            value={numericUnit}
                            onChange={(e) => setNumericUnit(e.target.value)}
                            className="w-full bg-surface-card text-ink text-sm px-4 py-2.5 h-11 rounded-full border border-hairline focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                          />
                          <span className="text-xs font-bold uppercase text-primary whitespace-nowrap bg-primary/10 px-3.5 py-2.5 rounded-full border border-primary/20">
                            a day
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. TIMER TYPE CONFIG (00:00:00 HH:MM:SS DURATION) */}
                {type === 'TIMER' && (
                  <div className="pt-2 border-t border-hairline space-y-3.5">
                    <CustomSelect<TimerOperator>
                      label="Evaluation Rule"
                      value={timerOp}
                      options={[
                        { value: 'AT_LEAST', label: 'At least (≥)' },
                        { value: 'LESS_THAN', label: 'Less than (<)' },
                        { value: 'ANY_VALUE', label: 'Any value (> 0)' },
                      ]}
                      onChange={(val) => setTimerOp(val)}
                    />

                    <div>
                      <div className="flex items-center justify-between mb-2 ml-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-charcoal">
                          Target Timer Duration (00:00:00)
                        </label>
                        <span className="font-mono text-xs font-extrabold text-primary bg-primary/10 px-3 py-0.5 rounded-full border border-primary/20">
                          Target: {formattedTimerPreview}
                        </span>
                      </div>

                      {/* 3 Coordinated HH : MM : SS Inputs */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 bg-surface-bone rounded-2xl border border-hairline text-center">
                          <span className="text-[10px] font-bold text-charcoal uppercase block mb-1">
                            Hours (HH)
                          </span>
                          <input
                            type="number"
                            min={0}
                            max={23}
                            value={timerHours}
                            onChange={(e) =>
                              setTimerHours(
                                Math.max(0, parseInt(e.target.value, 10) || 0)
                              )
                            }
                            placeholder="00"
                            className="w-full text-center font-mono font-bold text-xl py-1 bg-transparent text-ink focus:outline-none"
                          />
                        </div>

                        <div className="p-3 bg-surface-bone rounded-2xl border border-hairline text-center">
                          <span className="text-[10px] font-bold text-charcoal uppercase block mb-1">
                            Minutes (MM)
                          </span>
                          <input
                            type="number"
                            min={0}
                            max={59}
                            value={timerMinutes}
                            onChange={(e) =>
                              setTimerMinutes(
                                Math.max(
                                  0,
                                  Math.min(59, parseInt(e.target.value, 10) || 0)
                                )
                              )
                            }
                            placeholder="25"
                            className="w-full text-center font-mono font-bold text-xl py-1 bg-transparent text-ink focus:outline-none"
                          />
                        </div>

                        <div className="p-3 bg-surface-bone rounded-2xl border border-hairline text-center">
                          <span className="text-[10px] font-bold text-charcoal uppercase block mb-1">
                            Seconds (SS)
                          </span>
                          <input
                            type="number"
                            min={0}
                            max={59}
                            value={timerSecs}
                            onChange={(e) =>
                              setTimerSecs(
                                Math.max(
                                  0,
                                  Math.min(59, parseInt(e.target.value, 10) || 0)
                                )
                              )
                            }
                            placeholder="00"
                            className="w-full text-center font-mono font-bold text-xl py-1 bg-transparent text-ink focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Quick Presets */}
                      <div className="flex items-center gap-2 pt-2.5">
                        <span className="text-[11px] font-semibold text-charcoal">
                          Quick Presets:
                        </span>
                        {[
                          { label: '15m (00:15:00)', h: 0, m: 15, s: 0 },
                          { label: '25m (00:25:00)', h: 0, m: 25, s: 0 },
                          { label: '45m (00:45:00)', h: 0, m: 45, s: 0 },
                          { label: '1h (01:00:00)', h: 1, m: 0, s: 0 },
                          { label: '2h (02:00:00)', h: 2, m: 0, s: 0 },
                        ].map((preset) => (
                          <button
                            type="button"
                            key={preset.label}
                            onClick={() => {
                              setTimerHours(preset.h);
                              setTimerMinutes(preset.m);
                              setTimerSecs(preset.s);
                            }}
                            className={clsx(
                              'px-2.5 py-1 text-xs font-mono font-bold rounded-full border transition-all',
                              timerHours === preset.h &&
                                timerMinutes === preset.m &&
                                timerSecs === preset.s
                                ? 'bg-ink text-white border-ink'
                                : 'bg-surface-bone text-charcoal hover:text-ink border-hairline hover:bg-stone/20'
                            )}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. CHECKLIST TYPE CONFIG */}
                {type === 'CHECKLIST' && (
                  <div className="pt-2 border-t border-hairline space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                      <CustomSelect<typeof checklistCondition>
                        label={`Success Rule (${checklistItems.length} items)`}
                        value={checklistCondition}
                        options={[
                          { value: 'ALL_MANDATORY', label: 'All items are mandatory' },
                          { value: 'STARRED_ONLY', label: 'Starred (★) items only' },
                          { value: 'CUSTOM_MIN_ITEMS', label: 'Custom minimum count' },
                        ]}
                        onChange={(val) => setChecklistCondition(val)}
                      />

                      {checklistCondition === 'CUSTOM_MIN_ITEMS' && (
                        <Input
                          label="Minimum items required"
                          type="number"
                          min={1}
                          max={checklistItems.length || 1}
                          value={customMinCount}
                          onChange={(e) => setCustomMinCount(Number(e.target.value))}
                        />
                      )}
                    </div>

                    <div className="space-y-2 pt-1 max-h-48 overflow-y-auto">
                      {checklistItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-2 p-2 bg-surface-bone rounded-xl border border-hairline"
                        >
                          <button
                            type="button"
                            onClick={() => toggleStarItem(item.id)}
                            className={clsx(
                              'p-1 rounded-full transition-colors',
                              item.isStarred ? 'text-amber-500' : 'text-stone hover:text-ink'
                            )}
                            title="Mark as Starred (Critical)"
                          >
                            <Star size={18} fill={item.isStarred ? 'currentColor' : 'none'} />
                          </button>
                          <span className="text-sm flex-1 font-medium text-ink truncate">
                            {item.text}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeChecklistItem(item.id)}
                            className="p-1 text-stone hover:text-red-500 rounded-full transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add sub-task..."
                        value={newItemText}
                        onChange={(e) => setNewItemText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addChecklistItem();
                          }
                        }}
                        className="flex-1 bg-surface-bone text-ink text-sm px-4 py-2 rounded-full border border-hairline focus:outline-none"
                      />
                      <Button type="button" variant="outline" size="sm" onClick={addChecklistItem}>
                        <Plus size={14} /> Add Item
                      </Button>
                    </div>
                  </div>
                )}

                {/* DESCRIPTION / MOTIVATION NOTE */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1.5 ml-1">
                    Description / Motivation Note (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Why is this habit critical for your self-mastery?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-surface-bone text-ink text-sm p-3 rounded-2xl border border-hairline focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>
              </div>

              {/* Step 2 Bottom Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-hairline">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setWizardStep(1)}
                  className="gap-1.5"
                >
                  <ArrowLeft size={14} /> Back to Category
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  onClick={() => {
                    if (!name.trim()) {
                      setNameError('Please enter a habit name');
                      return;
                    }
                    setWizardStep(3);
                  }}
                  className="gap-1.5"
                >
                  Next: Schedule & Priority <ArrowRight size={14} />
                </Button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 3: SCHEDULE & STRICT 0 TO 100 NUMERIC PRIORITY */}
          {/* ============================================================ */}
          {wizardStep === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* 1. FREQUENCY SELECTOR */}
              <div className="p-4 bg-surface-card rounded-2xl border border-hairline space-y-3">
                <CustomSelect<FrequencyType>
                  label="How often do you want to do it?"
                  value={frequencyType}
                  options={[
                    { value: 'EVERYDAY', label: 'Everyday' },
                    { value: 'SPECIFIC_DAYS_OF_WEEK', label: 'Specific days of the week (Sun - Mon)' },
                    { value: 'SPECIFIC_DAYS_OF_MONTH', label: 'Specific days of a month' },
                    { value: 'SPECIFIC_DAYS_OF_YEAR', label: 'Specific days of the year' },
                    { value: 'DAYS_PER_PERIOD', label: 'Some days per period' },
                    { value: 'INTERVAL_REPEAT', label: 'Repeat every X days' },
                  ]}
                  onChange={(val) => setFrequencyType(val)}
                />

                {/* Sub-frequencies */}
                {frequencyType === 'SPECIFIC_DAYS_OF_WEEK' && (
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-charcoal mb-2">
                      Choose Days of the Week
                    </label>
                    <div className="grid grid-cols-7 gap-1.5">
                      {DAYS_NAMES.map((dayName, idx) => {
                        const isDayActive = daysOfWeek.includes(idx);
                        return (
                          <button
                            type="button"
                            key={idx}
                            onClick={() => toggleDayOfWeek(idx)}
                            className={clsx(
                              'h-10 rounded-xl text-xs font-bold transition-all border',
                              isDayActive
                                ? 'bg-primary text-white border-primary shadow-xs'
                                : 'bg-surface-bone text-charcoal border-hairline hover:bg-stone/20'
                            )}
                          >
                            {dayName}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {frequencyType === 'SPECIFIC_DAYS_OF_MONTH' && (
                  <Input
                    label="Days of Month (comma separated 1-31)"
                    placeholder="e.g. 1, 15, 30"
                    value={daysOfMonthStr}
                    onChange={(e) => setDaysOfMonthStr(e.target.value)}
                  />
                )}

                {frequencyType === 'SPECIFIC_DAYS_OF_YEAR' && (
                  <Input
                    label="Days of Year (MM-DD comma separated)"
                    placeholder="e.g. 01-01, 12-25"
                    value={daysOfYearStr}
                    onChange={(e) => setDaysOfYearStr(e.target.value)}
                  />
                )}

                {frequencyType === 'DAYS_PER_PERIOD' && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <Input
                      label="Target Days"
                      type="number"
                      min={1}
                      value={periodCount}
                      onChange={(e) => setPeriodCount(Number(e.target.value))}
                    />
                    <CustomSelect<'WEEK' | 'MONTH' | 'YEAR'>
                      label="Period"
                      value={periodType}
                      options={[
                        { value: 'WEEK', label: 'Per Week' },
                        { value: 'MONTH', label: 'Per Month' },
                        { value: 'YEAR', label: 'Per Year' },
                      ]}
                      onChange={(val) => setPeriodType(val)}
                    />
                  </div>
                )}

                {frequencyType === 'INTERVAL_REPEAT' && (
                  <Input
                    label="Repeat Interval (Days)"
                    type="number"
                    min={1}
                    value={intervalDays}
                    onChange={(e) => setIntervalDays(Number(e.target.value))}
                  />
                )}
              </div>

              {/* 2. START DATE & END DATE */}
              <div className="p-4 bg-surface-card rounded-2xl border border-hairline space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Start Date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />

                  <div>
                    <Input
                      label="End Date (Optional)"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                {totalDays > 0 && (
                  <div className="p-2.5 bg-surface-bone rounded-xl border border-hairline flex items-center justify-between text-xs">
                    <span className="text-charcoal flex items-center gap-1.5 font-medium">
                      <Calendar size={14} className="text-primary" /> Active Duration Cycle:
                    </span>
                    <span className="font-mono font-bold text-ink">
                      {totalDays} days total
                    </span>
                  </div>
                )}
              </div>

              {/* 3. STRICT 0-100 NUMERIC PRIORITY (EXACT FIX FOR 3RD PIC) */}
              <div className="p-4 bg-surface-card rounded-2xl border border-hairline space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-charcoal ml-1 block">
                      Priority Number (0 to 100)
                    </label>
                    <span className="text-[11px] text-charcoal ml-1">
                      Tasks with higher priority scores appear at the very top of your dashboard
                    </span>
                  </div>

                  <span className="font-mono text-xs font-extrabold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                    Priority: {priority} / 100
                  </span>
                </div>

                {/* Slider + Number Input */}
                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={priority}
                    onChange={(e) =>
                      setPriority(
                        Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0))
                      )
                    }
                    className="w-20 text-center font-mono font-extrabold text-lg py-2 rounded-xl border-2 border-hairline bg-surface-bone text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />

                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value))}
                    className="flex-1 accent-primary h-2 cursor-pointer bg-stone/20 rounded-lg"
                  />
                </div>

                {/* Pure Numeric Preset Pills (Strictly numbers, no enum words!) */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] font-semibold text-charcoal">
                    Quick Presets:
                  </span>
                  {[10, 25, 50, 75, 100].map((presetNum) => (
                    <button
                      type="button"
                      key={presetNum}
                      onClick={() => setPriority(presetNum)}
                      className={clsx(
                        'px-3 py-1 rounded-full text-xs font-mono font-bold border transition-all',
                        priority === presetNum
                          ? 'bg-ink text-white border-ink shadow-2xs scale-105'
                          : 'bg-surface-bone text-charcoal hover:text-ink border-hairline hover:bg-stone/20'
                      )}
                    >
                      {presetNum}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3 Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-hairline">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setWizardStep(2)}
                  className="gap-1.5"
                >
                  <ArrowLeft size={14} /> Back to Target
                </Button>

                <div className="flex items-center gap-2">
                  <Button type="button" variant="ghost" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {habitToEdit
                      ? isSubmitting
                        ? 'Saving Changes...'
                        : 'Save Changes'
                      : isSubmitting
                      ? 'Saving to Cloud...'
                      : 'Create Habit'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* Embedded Create Category Modal */}
      <CreateCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onCategoryCreated={(newCat) => {
          setSelectedCategoryId(newCat.id);
          setIsCategoryModalOpen(false);
        }}
      />
    </>
  );
};
