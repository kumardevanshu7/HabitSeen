import React from 'react';
import clsx from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'neutral' | 'dark' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className,
}) => {
  const variants = {
    primary: 'bg-primary text-white font-medium',
    success: 'bg-badge-success text-white font-medium',
    neutral: 'bg-surface-bone text-ink border border-hairline',
    dark: 'bg-surface-dark text-white font-medium',
    outline: 'bg-transparent text-charcoal border border-hairline',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 rounded-full',
    md: 'text-xs px-2.5 py-1 rounded-full',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 select-none font-medium',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
};
