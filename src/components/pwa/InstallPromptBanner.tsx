import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPromptBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // 1. Check if already installed / running in standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      return;
    }

    try {
      const dismissedAt = localStorage.getItem('habitsseen_install_prompt_dismissed');
      if (dismissedAt) {
        const diffDays = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
        if (diffDays < 7) {
          return;
        }
      }
    } catch {
      // Ignore storage errors in restricted/private browsing modes
    }

    // 2. Check for iOS device (including iPadOS 13+ desktop userAgent)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice =
      /iphone|ipad|ipod/.test(userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isIosDevice);

    // 3. Check for pre-captured global prompt from main.tsx
    const globalPrompt = (window as any).__pwaInstallPrompt;
    if (globalPrompt) {
      setDeferredPrompt(globalPrompt);
      setTimeout(() => setShowBanner(true), 2000);
    }

    // 4. Listen for Chrome/Edge/Android beforeinstallprompt & custom prompt event
    const handlePromptEvent = (e: Event) => {
      e.preventDefault();
      const promptEvent = (e as CustomEvent).detail || e;
      setDeferredPrompt(promptEvent as BeforeInstallPromptEvent);
      setTimeout(() => setShowBanner(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handlePromptEvent);
    window.addEventListener('pwa-prompt-available', handlePromptEvent);

    // 5. Dismiss banner on appinstalled event
    const handleAppInstalled = () => {
      setShowBanner(false);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    // If on iOS and not standalone, show banner after delay
    if (isIosDevice && !isStandalone) {
      setTimeout(() => setShowBanner(true), 2000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handlePromptEvent);
      window.removeEventListener('pwa-prompt-available', handlePromptEvent);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) {
      alert('To install, tap the 3 dots in your browser menu and choose "Install App" or "Add to Home Screen".');
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.error('Install prompt error:', err);
    }
  };

  if (!showBanner) return null;

  return (
    <>
      {/* FLOATING PWA INSTALL PILL */}
      <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-md w-[calc(100%-2rem)] animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-ink text-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl shadow-2xl border border-white/10 flex items-center justify-between gap-3 backdrop-blur-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white shrink-0 shadow-md">
              <Smartphone size={20} />
            </div>
            <div>
              <p className="font-display font-bold text-xs sm:text-sm text-white leading-tight">
                Install HabitsSeen
              </p>
              <p className="text-[11px] text-stone font-medium">
                Fast 1-tap homescreen access &amp; habit tracking
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3.5 py-1.5 rounded-full bg-primary hover:bg-primary-deep text-white text-xs font-bold transition-all shadow-xs active:scale-95 flex items-center gap-1.5"
            >
              <Download size={13} />
              Install
            </button>
            <button
              onClick={() => {
                setShowBanner(false);
                try {
                  localStorage.setItem('habitsseen_install_prompt_dismissed', String(Date.now()));
                } catch {}
              }}
              className="p-1 text-stone hover:text-white rounded-full transition-colors"
              title="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* IOS INSTRUCTIONS MODAL */}
      {showIOSInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm bg-surface-card border border-hairline rounded-3xl p-6 text-ink shadow-2xl">
            <button
              onClick={() => setShowIOSInstructions(false)}
              className="absolute top-4 right-4 p-1.5 text-charcoal hover:text-ink rounded-full"
            >
              <X size={18} />
            </button>

            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center mb-2">
                <Share size={24} />
              </div>
              <h3 className="font-display font-bold text-lg text-ink">
                Install on iOS Safari
              </h3>
              <p className="text-xs text-charcoal mt-1">
                Install HabitsSeen directly on your home screen in 2 taps:
              </p>
            </div>

            <ol className="space-y-3 text-xs text-ink/90 font-medium">
              <li className="flex items-center gap-2 p-2.5 bg-surface-bone rounded-xl border border-hairline">
                <span className="w-5 h-5 rounded-full bg-ink text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                  1
                </span>
                <span>
                  Tap the <strong>Share</strong> button (box with arrow) at the bottom of Safari.
                </span>
              </li>
              <li className="flex items-center gap-2 p-2.5 bg-surface-bone rounded-xl border border-hairline">
                <span className="w-5 h-5 rounded-full bg-ink text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                  2
                </span>
                <span>
                  Scroll down and tap <strong>Add to Home Screen</strong>.
                </span>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSInstructions(false)}
              className="w-full mt-5 py-2.5 rounded-full bg-ink text-white text-xs font-bold hover:bg-charcoal transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
