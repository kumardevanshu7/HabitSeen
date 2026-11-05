import React, { useId } from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className, id, ...props }) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1.5 ml-1"
        >
          {label} {props.required && <span className="text-primary">*</span>}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={twMerge(
          clsx(
            'w-full bg-surface-card text-ink text-sm px-4 py-2.5 h-11 rounded-full border border-hairline',
            'focus:outline-none focus:border-hairline-strong focus:ring-2 focus:ring-primary/20 transition-all',
            'placeholder:text-ash',
            error && 'border-red-500 focus:ring-red-200',
            className
          )
        )}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-xs text-red-500 mt-1 ml-2">
          {error}
        </p>
      )}
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select: React.FC<SelectProps> = ({ label, error, className, id, children, required, ...props }) => {
  const generatedId = useId();
  const selectId = id || generatedId;
  const errorId = `${selectId}-error`;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1.5 ml-1"
        >
          {label} {required && <span className="text-primary">*</span>}
        </label>
      )}
      <select
        id={selectId}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={twMerge(
          clsx(
            'w-full bg-surface-card text-ink text-sm px-4 py-2.5 h-11 rounded-full border border-hairline',
            'focus:outline-none focus:border-hairline-strong focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer',
            error && 'border-red-500 focus:ring-red-200',
            className
          )
        )}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p id={errorId} className="text-xs text-red-500 mt-1 ml-2">
          {error}
        </p>
      )}
    </div>
  );
};
