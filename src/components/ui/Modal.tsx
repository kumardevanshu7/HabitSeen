import React, { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import clsx from 'clsx';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

// Global modal counter to prevent multiple modals from clobbering body overflow
let activeModalCount = 0;
let originalOverflow = '';

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'md',
}) => {
  const titleId = useId();

  // 1. Stack-safe scroll lock
  useEffect(() => {
    if (isOpen) {
      if (activeModalCount === 0) {
        originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
      }
      activeModalCount++;
    } else {
      return;
    }

    return () => {
      activeModalCount = Math.max(0, activeModalCount - 1);
      if (activeModalCount === 0) {
        document.body.style.overflow = originalOverflow || '';
      }
    };
  }, [isOpen]);

  // 2. Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxW = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-2xl',
    xl: 'sm:max-w-3xl',
    '2xl': 'sm:max-w-4xl',
    '4xl': 'sm:max-w-6xl',
  };

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Surface - Opaque solid background */}
      <div
        className={clsx(
          'relative w-full bg-[#f9f7f3] border border-hairline rounded-t-3xl sm:rounded-2xl shadow-2xl z-10 opacity-100',
          'max-h-[92dvh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200',
          maxW[maxWidth]
        )}
      >
        {/* Header */}
        {(title || subtitle) && (
          <div className="px-6 pt-6 pb-4 border-b border-hairline flex items-center justify-between bg-[#f9f7f3] shrink-0">
            <div>
              {title && (
                <h3
                  id={titleId}
                  className="font-display font-bold text-xl sm:text-2xl text-ink tracking-tight"
                >
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs sm:text-sm text-charcoal mt-0.5">{subtitle}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="p-2 text-charcoal hover:text-ink hover:bg-surface-bone rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto overflow-x-hidden space-y-4">
          {children}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
