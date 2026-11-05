import React, { useEffect, useId, useRef } from 'react';
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
  zIndex?: string;
  isBusy?: boolean;
  closeOnBackdrop?: boolean;
}

// Global modal counter to prevent multiple modals from clobbering body overflow
let activeModalCount = 0;
let originalOverflow = '';

// Global stack of open modals for mobile back-gesture support
interface ModalStackEntry {
  id: string;
  close: () => void;
  closedByPopState: boolean;
}
const openModalStack: ModalStackEntry[] = [];
let historyModalDepth = 0;
let programmaticBackCount = 0;
let programmaticBackTimer: ReturnType<typeof setTimeout> | null = null;
let syncScheduled = false;

const scheduleModalHistorySync = () => {
  if (syncScheduled || typeof window === 'undefined') return;
  syncScheduled = true;
  queueMicrotask(() => {
    syncScheduled = false;
    const targetDepth = openModalStack.length;
    if (targetDepth > historyModalDepth) {
      const toPush = targetDepth - historyModalDepth;
      for (let i = 0; i < toPush; i++) {
        window.history.pushState(
          { ...(window.history.state || {}), modalDepth: historyModalDepth + i + 1 },
          ''
        );
      }
      historyModalDepth = targetDepth;
    } else if (targetDepth < historyModalDepth) {
      const toPop = historyModalDepth - targetDepth;
      historyModalDepth = targetDepth;
      programmaticBackCount++;
      if (programmaticBackTimer) clearTimeout(programmaticBackTimer);
      programmaticBackTimer = setTimeout(() => {
        programmaticBackCount = 0;
      }, 350);
      window.history.go(-toPop);
    }
  });
};

export const isModalHandlingPopState = (): boolean => {
  if (programmaticBackCount > 0) {
    programmaticBackCount--;
    if (programmaticBackTimer) clearTimeout(programmaticBackTimer);
    return true;
  }
  if (openModalStack.length > 0) {
    historyModalDepth = Math.max(0, historyModalDepth - 1);
    const topModal = openModalStack.pop()!;
    topModal.closedByPopState = true;
    topModal.close();
    return true;
  }
  return false;
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'md',
  zIndex = 'z-50',
  isBusy = false,
  closeOnBackdrop = true,
}) => {
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const isBusyRef = useRef(isBusy);
  isBusyRef.current = isBusy;

  // 1. Stack-safe scroll lock + Mobile Back Gesture History Entry
  useEffect(() => {
    if (!isOpen) return;

    if (activeModalCount === 0) {
      originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    activeModalCount++;

    const entry: ModalStackEntry = {
      id: titleId,
      close: () => {
        if (!isBusyRef.current) {
          onCloseRef.current();
        }
      },
      closedByPopState: false,
    };
    openModalStack.push(entry);
    scheduleModalHistorySync();

    return () => {
      activeModalCount = Math.max(0, activeModalCount - 1);
      if (activeModalCount === 0) {
        document.body.style.overflow = originalOverflow || '';
      }

      const idx = openModalStack.indexOf(entry);
      if (idx !== -1) {
        openModalStack.splice(idx, 1);
      }

      // If closed via UI button/backdrop (not back gesture), sync history depth in microtask
      if (!entry.closedByPopState) {
        scheduleModalHistorySync();
      }
    };
  }, [isOpen, titleId]);

  // 2. Escape key handler (only closes the top-most modal in the stack if not busy)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isBusyRef.current) return;
        const topModal = openModalStack[openModalStack.length - 1];
        if (topModal && topModal.id === titleId) {
          e.stopPropagation();
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, titleId]);

  if (!isOpen) return null;

  const maxW = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-2xl',
    xl: 'sm:max-w-3xl',
    '2xl': 'sm:max-w-4xl',
    '4xl': 'sm:max-w-6xl',
  };

  const handleBackdropClick = () => {
    if (!isBusy && closeOnBackdrop) {
      onClose();
    }
  };

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      className={clsx(
        'fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200',
        zIndex
      )}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/50 backdrop-blur-sm transition-opacity"
        onClick={handleBackdropClick}
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
        {(title || subtitle) ? (
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
              disabled={isBusy}
              aria-label="Close modal"
              className={clsx(
                'p-2 text-charcoal rounded-full transition-colors',
                isBusy
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:text-ink hover:bg-surface-bone cursor-pointer'
              )}
            >
              <X size={20} />
            </button>
          </div>
        ) : (
          /* Close button fallback when no header is provided */
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            aria-label="Close modal"
            className={clsx(
              'absolute top-4 right-4 z-20 p-2 text-charcoal rounded-full transition-colors',
              isBusy
                ? 'opacity-40 cursor-not-allowed'
                : 'hover:text-ink hover:bg-surface-bone/80 cursor-pointer'
            )}
          >
            <X size={20} />
          </button>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto overflow-x-hidden space-y-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
