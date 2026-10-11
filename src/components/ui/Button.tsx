import React from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'dark' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  type = 'button',
  className,
  children,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const variants = {
    primary:
      'bg-primary text-white hover:bg-primary-deep shadow-sm hover:shadow',
    dark:
      'bg-surface-dark text-white hover:bg-black',
    outline:
      'bg-surface-card text-ink border border-hairline-strong hover:bg-surface-bone',
    ghost:
      'bg-transparent text-ink hover:bg-surface-bone',
    danger:
      'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 h-8 min-h-[36px] rounded-full',
    md: 'text-sm px-5 py-2.5 h-11 min-h-[44px] rounded-full',
    lg: 'text-base px-6 py-3 h-12 min-h-[48px] rounded-full font-semibold',
    icon: 'p-2.5 h-10 w-10 min-h-[40px] rounded-full',
  };

  return (
    <button
      type={type}
      className={clsx(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
};
