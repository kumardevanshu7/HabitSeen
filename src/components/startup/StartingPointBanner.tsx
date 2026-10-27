import React, { useState } from 'react';
import {
  STARTING_POINT_CONFIG,
  getDaysSinceStartingPoint,
  getDailyAnimeQuote,
  ANIME_CONSISTENCY_QUOTES,
} from '../../constants/startingPoint';
import { Compass, Flame, Sparkles, ChevronDown, ChevronUp, Quote } from 'lucide-react';
import clsx from 'clsx';

export const StartingPointBanner: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [quoteIndex, setQuoteIndex] = useState(() => {
    const daily = getDailyAnimeQuote();
    const idx = ANIME_CONSISTENCY_QUOTES.findIndex((q) => q.author === daily.author);
    return idx >= 0 ? idx : 0;
  });

  const daysCount = getDaysSinceStartingPoint();
  const currentQuote = ANIME_CONSISTENCY_QUOTES[quoteIndex] || ANIME_CONSISTENCY_QUOTES[0];

  const handleNextQuote = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuoteIndex((prev) => (prev + 1) % ANIME_CONSISTENCY_QUOTES.length);
  };

  return (
    <div className="w-full bg-gradient-to-r from-orange-50/80 via-amber-50/60 to-rose-50/80 dark:from-stone-900/40 dark:via-stone-900/30 dark:to-stone-900/40 border border-orange-200/80 dark:border-stone-700/80 rounded-3xl p-3.5 sm:p-4 shadow-2xs transition-all relative overflow-hidden select-none">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

      {/* TOP HEADER ROW */}
      <div
        className="flex items-center justify-between gap-2 cursor-pointer"
        onClick={() => setIsExpanded((prev) => !prev)}
      >
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <div className="w-7 h-7 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Compass size={14} className="animate-spin-slow" />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-display font-black text-xs sm:text-sm text-ink tracking-tight">
              Ground Zero: {STARTING_POINT_CONFIG.displayDate}
            </span>
            <span className="inline-flex items-center gap-1 font-mono font-bold text-[10px] sm:text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700 shadow-2xs">
              <Flame size={11} className="fill-current text-emerald-600 dark:text-emerald-400" />
              Day {daysCount}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleNextQuote}
            className="text-[10px] font-bold text-primary hover:text-primary-deep flex items-center gap-1 bg-white/80 dark:bg-stone-800 hover:bg-white px-2 py-1 rounded-full border border-orange-200 dark:border-stone-700 transition-colors shadow-2xs"
            title="Next inspiring anime quote"
          >
            <Sparkles size={11} />
            <span className="hidden xs:inline">Inspire</span>
          </button>
          <button
            type="button"
            className="p-1 text-charcoal hover:text-ink rounded-full transition-colors"
            title={isExpanded ? 'Collapse quote' : 'Expand quote'}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* EXPANDABLE ANIME MOTIVATION QUOTE */}
      {isExpanded && (
        <div className="mt-2.5 pt-2.5 border-t border-orange-200/60 dark:border-stone-800 animate-in fade-in duration-200">
          <div className="flex items-start gap-2">
            <Quote size={14} className="text-primary shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-semibold text-ink leading-relaxed">
                "{currentQuote.quote}"
              </p>
              {currentQuote.translation && (
                <p className="text-[11px] text-charcoal mt-1 italic leading-normal">
                  ↳ {currentQuote.translation}
                </p>
              )}
              <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-orange-100 dark:border-stone-800/60 text-[10px] text-charcoal">
                <span className="font-bold text-ink">
                  — {currentQuote.author}
                </span>
                <span className="font-mono font-semibold text-primary">
                  {currentQuote.anime}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
