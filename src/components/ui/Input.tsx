import React, { useId } from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className, id, ...props }) => {
  const generatedId = useId();
  const inputId = id || props.name || generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1.5 ml-1"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={clsx(
          'w-full bg-surface-card text-ink text-sm px-4 py-2.5 h-11 rounded-full border border-hairline',
          'focus:outline-none focus:border-hairline-strong focus:ring-2 focus:ring-primary/20 transition-all',
          'placeholder:text-ash',
          error && 'border-red-500 focus:ring-red-200',
          className
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
}

export const Select: React.FC<SelectProps> = ({ label, className, id, children, ...props }) => {
  const generatedId = useId();
  const selectId = id || props.name || generatedId;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1.5 ml-1"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={clsx(
          'w-full bg-surface-card text-ink text-sm px-4 py-2.5 h-11 rounded-full border border-hairline',
          'focus:outline-none focus:border-hairline-strong focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer',
          className
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  );
};
