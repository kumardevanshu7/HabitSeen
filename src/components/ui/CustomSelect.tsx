import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import clsx from 'clsx';

export interface SelectOption<T = string | number> {
  value: T;
  label: string;
  badge?: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps<T = string | number> {
  label?: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (val: T) => void;
  className?: string;
  placeholder?: string;
}

export function CustomSelect<T extends string | number>({
  label,
  value,
  options,
  onChange,
  className,
  placeholder = 'Select an option',
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div className={clsx('relative w-full', className)} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1.5 ml-1">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'w-full bg-surface-card text-ink text-sm px-4 py-2.5 h-11 rounded-full border border-hairline',
          'flex items-center justify-between transition-all select-none',
          'hover:border-hairline-strong focus:outline-none focus:ring-2 focus:ring-primary/20',
          isOpen && 'border-ink ring-2 ring-primary/20 shadow-xs'
        )}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption?.icon}
          <span className="font-medium text-ink">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="text-[10px] font-bold uppercase bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {selectedOption.badge}
            </span>
          )}
        </span>
        <ChevronDown
          size={16}
          className={clsx(
            'text-charcoal shrink-0 transition-transform duration-200',
            isOpen && 'rotate-180 text-ink'
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-surface-card border border-hairline rounded-2xl shadow-xl overflow-hidden py-1.5 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                type="button"
                key={String(opt.value)}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={clsx(
                  'w-full px-4 py-2.5 text-xs sm:text-sm text-left flex items-center justify-between transition-colors',
                  isSelected
                    ? 'bg-surface-bone font-semibold text-ink'
                    : 'text-body hover:bg-canvas hover:text-ink'
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  {opt.icon}
                  <span>{opt.label}</span>
                  {opt.badge && (
                    <span className="text-[10px] font-bold uppercase bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {opt.badge}
                    </span>
                  )}
                </div>
                {isSelected && <Check size={16} className="text-primary shrink-0 stroke-[2.5]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
