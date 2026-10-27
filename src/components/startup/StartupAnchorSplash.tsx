import React, { useState, useEffect } from 'react';
import {
  STARTING_POINT_CONFIG,
  getDaysSinceStartingPoint,
  getDailyAnimeQuote,
  ANIME_CONSISTENCY_QUOTES,
} from '../../constants/startingPoint';
import { Button } from '../ui/Button';
import {
  Flame,
  Sparkles,
  RefreshCw,
  AlertCircle,
  WifiOff,
  Quote,
  Compass,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

interface StartupAnchorSplashProps {
  splashTimedOut: boolean;
  syncError: string | null;
  onContinueOffline: () => void;
  onReload: () => void;
  onProceed: () => void;
  isReady?: boolean;
}

export const StartupAnchorSplash: React.FC<StartupAnchorSplashProps> = ({
  splashTimedOut,
  syncError,
  onContinueOffline,
  onReload,
  onProceed,
  isReady = true,
}) => {
  const [quoteIndex, setQuoteIndex] = useState(() => {
    const daily = getDailyAnimeQuote();
    const idx = ANIME_CONSISTENCY_QUOTES.findIndex((q) => q.author === daily.author);
    return idx >= 0 ? idx : 0;
  });

  const [fadeQuote, setFadeQuote] = useState(false);

  const daysCount = getDaysSinceStartingPoint();
  const currentQuote = ANIME_CONSISTENCY_QUOTES[quoteIndex] || ANIME_CONSISTENCY_QUOTES[0];

  const handleNextQuote = () => {
    setFadeQuote(true);
    setTimeout(() => {
      setQuoteIndex((prev) => (prev + 1) % ANIME_CONSISTENCY_QUOTES.length);
      setFadeQuote(false);
    }, 150);
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col items-center justify-between p-6 sm:p-8 select-none relative overflow-hidden">
      {/* Subtle Background Glow Accent */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/8 rounded-full blur-3xl pointer-events-none" />

      {/* TOP: Brand Minimal Pill */}
      <div className="w-full max-w-md flex items-center justify-between z-10 pt-2">
        <div className="flex items-center gap-2">
          <img
            src="/android-chrome-192x192.png"
            alt="HabitsSeen"
            className="w-7 h-7 rounded-xl object-contain shadow-2xs"
          />
          <span className="font-display font-bold text-sm tracking-tight text-ink">HabitsSeen</span>
        </div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-charcoal bg-surface-bone px-2.5 py-1 rounded-full border border-hairline">
          Discipline OS
        </span>
      </div>

      {/* CENTER: THE STARTING POINT & ANIME MOTIVATIONAL QUOTE */}
      <div className="w-full max-w-md my-auto py-6 flex flex-col items-center text-center z-10 space-y-6">
        {/* STARTING POINT BADGE */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-bold tracking-wide shadow-2xs animate-in fade-in zoom-in-95 duration-500">
          <Compass size={14} className="animate-spin-slow text-primary" />
          <span>STARTING POINT • GROUND ZERO</span>
        </div>

        {/* DATE HERO */}
        <div className="space-y-2">
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-ink tracking-tight drop-shadow-xs">
            {STARTING_POINT_CONFIG.displayDate}
          </h1>
          <div className="flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1 font-mono font-bold text-xs sm:text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full shadow-2xs">
              <Flame size={14} className="fill-current text-emerald-600" />
              Day {daysCount} of Lifelong Consistency
            </span>
          </div>
          <p className="text-xs text-charcoal font-medium italic pt-1">
            "Ab dobara restart nahi karna — ye hamara permanent starting point hai."
          </p>
        </div>

        {/* ANIME QUOTE CARD */}
        <div className="w-full bg-surface-card border-2 border-hairline/80 rounded-3xl p-5 sm:p-6 shadow-sm text-left relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/10 to-transparent pointer-events-none" />

          {/* Quote Header */}
          <div className="flex items-center justify-between mb-3 border-b border-hairline/60 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs">
                <Quote size={13} />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal">
                Anime Discipline Insight
              </span>
            </div>

            <button
              type="button"
              onClick={handleNextQuote}
              className="text-[10px] font-bold text-primary hover:text-primary-deep flex items-center gap-1 bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded-full transition-colors active:scale-95"
              title="Next inspiring quote"
            >
              <Sparkles size={11} />
              <span>Next Quote</span>
            </button>
          </div>

          {/* Quote Body */}
          <div
            className={`transition-opacity duration-200 ${
              fadeQuote ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <p className="font-display text-sm sm:text-base font-semibold text-ink leading-relaxed">
              "{currentQuote.quote}"
            </p>

            {currentQuote.translation && (
              <p className="text-xs text-charcoal mt-2 italic font-normal leading-normal">
                ↳ {currentQuote.translation}
              </p>
            )}

            <div className="mt-3.5 pt-2.5 border-t border-hairline/40 flex items-center justify-between">
              <span className="font-bold text-xs text-ink">
                — {currentQuote.author}
              </span>
              <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                {currentQuote.anime}
              </span>
            </div>
          </div>
        </div>

        {/* PROCEED ACTION BUTTON */}
        <div className="w-full pt-1 space-y-2">
          <button
            type="button"
            onClick={onProceed}
            className="w-full py-4 px-6 rounded-2xl bg-ink hover:bg-stone-800 text-white font-display font-black text-sm sm:text-base tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 active:scale-[0.98] cursor-pointer group"
          >
            <span>Proceed to Discipline</span>
            <ArrowRight size={18} className="text-primary group-hover:translate-x-1.5 transition-transform" />
          </button>

          <div className="flex items-center justify-center gap-2 text-[11px] text-charcoal/80">
            {isReady ? (
              <>
                <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                <span className="font-medium">Ready • Take your time & tap Proceed</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                <span className="font-medium">Syncing Discipline Chamber...</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM: SAFETY TIMEOUT / OFFLINE CONTROLS */}
      <div className="w-full max-w-md z-10 pb-2">
        {(splashTimedOut || syncError) && (
          <div className="bg-surface-card border border-amber-300/80 p-4 rounded-2xl shadow-sm text-left animate-in fade-in duration-300">
            <div className="flex items-start gap-2.5 text-amber-700 text-xs">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-ink mb-0.5">Connection taking a moment</p>
                <p className="text-charcoal leading-relaxed">
                  {syncError || 'Network is slow. You can enter immediately with local offline data.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3.5">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs gap-1.5"
                onClick={onReload}
              >
                <RefreshCw size={13} /> Retry
              </Button>
              <Button
                variant="dark"
                size="sm"
                className="flex-1 text-xs gap-1.5 font-bold"
                onClick={onContinueOffline}
              >
                <WifiOff size={13} /> Enter Offline
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
