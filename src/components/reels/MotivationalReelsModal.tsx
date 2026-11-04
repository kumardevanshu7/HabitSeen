import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Heart,
  ChevronUp,
  ChevronDown,
  Play,
  Pause,
  Sparkles,
  Flame,
  Share2,
} from 'lucide-react';
import clsx from 'clsx';
import { MOTIVATIONAL_REELS, MotivationalReel } from '../../utils/motivationalReels';

interface MotivationalReelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialReelIndex?: number;
}

export const MotivationalReelsModal: React.FC<MotivationalReelsModalProps> = ({
  isOpen,
  onClose,
  initialReelIndex = 0,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialReelIndex);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [progress, setProgress] = useState(0);
  const [likedReelIds, setLikedReelIds] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('hs_liked_reels');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const touchStartY = useRef<number | null>(null);
  const lastWheelTime = useRef<number>(0);
  const lastTapTime = useRef<number>(0);

  const totalReels = MOTIVATIONAL_REELS.length;
  const currentReel: MotivationalReel | undefined = MOTIVATIONAL_REELS[currentIndex];

  // Go to next reel
  const handleNextReel = useCallback(() => {
    if (currentIndex < totalReels - 1) {
      setIsLoading(true);
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
      setIsPlaying(true);
    }
  }, [currentIndex, totalReels]);

  // Go to prev reel
  const handlePrevReel = useCallback(() => {
    if (currentIndex > 0) {
      setIsLoading(true);
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
      setIsPlaying(true);
    }
  }, [currentIndex]);

  // Like current reel
  const handleToggleLike = useCallback(() => {
    if (!currentReel) return;
    setLikedReelIds((prev) => {
      const next = { ...prev, [currentReel.id]: !prev[currentReel.id] };
      try {
        localStorage.setItem('hs_liked_reels', JSON.stringify(next));
      } catch (err) {
        console.error('Failed to save liked reels:', err);
      }
      return next;
    });
  }, [currentReel]);

  // Double-tap to heart
  const handleVideoTap = () => {
    const now = Date.now();
    const diff = now - lastTapTime.current;
    lastTapTime.current = now;

    if (diff < 300) {
      // Double tap -> trigger heart animation & like
      if (currentReel && !likedReelIds[currentReel.id]) {
        handleToggleLike();
      }
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 900);
      return;
    }

    // Single tap -> toggle Play/Pause
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(console.error);
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
      setShowPlayIcon(true);
      setTimeout(() => setShowPlayIcon(false), 600);
    }
  };

  // Keyboard navigation (Arrow keys)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === 'j') {
        e.preventDefault();
        handleNextReel();
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === 'k') {
        e.preventDefault();
        handlePrevReel();
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        handleVideoTap();
      } else if (e.key === 'm' || e.key === 'M') {
        setIsMuted((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNextReel, handlePrevReel, onClose]);

  // Touch swipe support (Up / Down)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;
    touchStartY.current = null;

    if (diff > 50) {
      // Swiped up -> next reel
      handleNextReel();
    } else if (diff < -50) {
      // Swiped down -> previous reel
      handlePrevReel();
    }
  };

  // Desktop mouse wheel scroll support
  const handleWheel = (e: React.WheelEvent) => {
    const now = Date.now();
    if (now - lastWheelTime.current < 450) return; // Debounce wheel
    lastWheelTime.current = now;

    if (e.deltaY > 30) {
      handleNextReel();
    } else if (e.deltaY < -30) {
      handlePrevReel();
    }
  };

  // Autoplay video on reel change
  useEffect(() => {
    if (!isOpen || !videoRef.current) return;
    setIsLoading(true);
    videoRef.current.currentTime = 0;
    setProgress(0);
    setIsPlaying(true);
    const playPromise = videoRef.current.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay may be restricted with sound; mute & retry
        setIsMuted(true);
        if (videoRef.current) {
          videoRef.current.play().catch(console.error);
        }
      });
    }
  }, [currentIndex, isOpen]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !currentReel) return null;

  const isLiked = Boolean(likedReelIds[currentReel.id]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center select-none"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 9:16 VERTICAL REEL PLAYER CONTAINER */}
      <div className="relative w-full max-w-[420px] h-full sm:h-[92vh] sm:max-h-[820px] bg-black sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-center items-center">
        {/* AMBIENT BLURRED BACKDROP (INSTAGRAM REELS STYLE FOR LETTERBOX PADDING) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <video
            key={`blur-${currentReel.id}`}
            src={currentReel.url}
            className="w-full h-full object-cover blur-3xl opacity-35 scale-125"
            playsInline
            autoPlay
            loop
            muted
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-black/65" />
        </div>

        {/* NATIVE VIDEO PLAYER - PRESERVES ORIGINAL ASPECT RATIO (4:5, 1:1, 9:16, ETC.) */}
        <video
          ref={videoRef}
          key={currentReel.id}
          src={currentReel.url}
          className="relative z-10 w-full h-full object-contain cursor-pointer"
          playsInline
          autoPlay
          preload="auto"
          loop
          muted={isMuted}
          onClick={handleVideoTap}
          onWaiting={() => setIsLoading(true)}
          onPlaying={() => setIsLoading(false)}
          onCanPlay={() => setIsLoading(false)}
          onLoadedData={() => setIsLoading(false)}
          onTimeUpdate={() => {
            if (videoRef.current && videoRef.current.duration) {
              setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
            }
          }}
        />

        {/* LOADING BUFFER SPINNER (WHEN VIDEO IS BUFFERING OR LOADING) */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-25 pointer-events-none bg-black/30 backdrop-blur-2xs">
            <div className="w-12 h-12 rounded-full border-3 border-white/20 border-t-rose-500 animate-spin shadow-xl" />
            <span className="text-[11px] font-mono font-bold text-white/90 mt-2.5 drop-shadow-md">
              Buffering Reel...
            </span>
          </div>
        )}

        {/* BACKGROUND PRELOADERS FOR ADJACENT REELS (ZERO-LAG SWIPING) */}
        {currentIndex < totalReels - 1 && (
          <video
            key={`preload-next-${MOTIVATIONAL_REELS[currentIndex + 1].id}`}
            src={MOTIVATIONAL_REELS[currentIndex + 1].url}
            preload="auto"
            className="hidden"
            muted
            aria-hidden="true"
          />
        )}
        {currentIndex > 0 && (
          <video
            key={`preload-prev-${MOTIVATIONAL_REELS[currentIndex - 1].id}`}
            src={MOTIVATIONAL_REELS[currentIndex - 1].url}
            preload="auto"
            className="hidden"
            muted
            aria-hidden="true"
          />
        )}

        {/* TOP BAR OVERLAY */}
        <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 via-black/30 to-transparent flex items-center justify-between z-20 pointer-events-auto">
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-90 border border-white/10 shadow-lg cursor-pointer"
            title="Close Reels"
            aria-label="Close Reels"
          >
            <X size={20} />
          </button>

          {/* Reel Index Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-white text-xs font-mono font-bold shadow-lg">
            <Flame size={13} className="text-rose-500 fill-rose-500" />
            <span>
              {currentIndex + 1} / {totalReels}
            </span>
          </div>

          {/* Mute / Unmute Button */}
          <button
            type="button"
            onClick={() => setIsMuted((prev) => !prev)}
            className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-90 border border-white/10 shadow-lg cursor-pointer"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX size={18} className="text-rose-400" /> : <Volume2 size={18} className="text-emerald-400" />}
          </button>
        </div>

        {/* TAP FOR SOUND TOAST (WHEN MUTED) */}
        {isMuted && (
          <div
            onClick={() => setIsMuted(false)}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-black/70 text-white/90 border border-white/20 text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer backdrop-blur-md shadow-lg animate-pulse"
          >
            <VolumeX size={12} className="text-rose-400" />
            <span>Tap to unmute sound</span>
          </div>
        )}

        {/* PLAY / PAUSE MICRO ANIMATION POP */}
        {showPlayIcon && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 animate-out fade-out zoom-out duration-500">
            <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-2xl">
              {isPlaying ? <Play size={28} className="ml-1 fill-white" /> : <Pause size={28} className="fill-white" />}
            </div>
          </div>
        )}

        {/* DOUBLE TAP HEART BURST ANIMATION */}
        {showHeartBurst && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-in zoom-in-50 duration-300">
            <Heart size={84} className="text-rose-500 fill-rose-500 drop-shadow-2xl animate-bounce" />
          </div>
        )}

        {/* RIGHT ACTION RAIL (LIKE INSTAGRAM REELS) */}
        <div className="absolute right-3 bottom-24 flex flex-col items-center gap-4 z-20 pointer-events-auto">
          {/* Like Heart Button */}
          <button
            type="button"
            onClick={handleToggleLike}
            className="flex flex-col items-center gap-1 text-white group cursor-pointer"
            title="Like this reel"
          >
            <div
              className={clsx(
                'w-11 h-11 rounded-full flex items-center justify-center transition-all backdrop-blur-md shadow-lg border active:scale-75',
                isLiked
                  ? 'bg-rose-600/90 border-rose-400 text-white'
                  : 'bg-black/50 border-white/15 text-white hover:bg-black/70'
              )}
            >
              <Heart
                size={22}
                className={clsx(
                  'transition-transform duration-200',
                  isLiked ? 'fill-white scale-110' : 'group-hover:scale-110'
                )}
              />
            </div>
            <span className="text-[10px] font-bold font-mono drop-shadow-md">
              {isLiked ? 'Liked' : 'Like'}
            </span>
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setIsMuted((prev) => !prev)}
            className="w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 border border-white/15 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-90 shadow-lg cursor-pointer"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX size={19} className="text-rose-400" /> : <Volume2 size={19} />}
          </button>

          {/* Navigation Chevron UP (Prev) */}
          {currentIndex > 0 && (
            <button
              type="button"
              onClick={handlePrevReel}
              className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 border border-white/15 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-90 shadow-lg cursor-pointer"
              title="Previous Reel (Swipe Down / Arrow Up)"
            >
              <ChevronUp size={22} />
            </button>
          )}

          {/* Navigation Chevron DOWN (Next) */}
          {currentIndex < totalReels - 1 && (
            <button
              type="button"
              onClick={handleNextReel}
              className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 border border-white/15 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-90 shadow-lg cursor-pointer"
              title="Next Reel (Swipe Up / Arrow Down)"
            >
              <ChevronDown size={22} />
            </button>
          )}
        </div>

        {/* BOTTOM METADATA & REEL INFO */}
        <div className="absolute bottom-0 inset-x-0 p-4 pt-10 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-20 pointer-events-none">
          <div className="pr-14">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="px-2 py-0.5 rounded-full bg-rose-600/90 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-md">
                <Sparkles size={10} /> Discipline Fuel
              </span>
              <span className="text-[11px] text-white/70 font-mono font-medium">
                #{String(currentIndex + 1).padStart(2, '0')}
              </span>
            </div>
            <h3 className="font-display font-black text-lg text-white leading-tight drop-shadow-md">
              {currentReel.title}
            </h3>
            <p className="text-xs text-white/85 mt-1 font-medium leading-snug drop-shadow-sm line-clamp-2">
              "{currentReel.tagline}"
            </p>
          </div>

          {/* SWIPE HINT */}
          <div className="flex items-center justify-between text-[10px] text-white/50 font-medium mt-3">
            <span>Tap video to pause • Double tap to heart</span>
            <span>Swipe ↑ for next</span>
          </div>

          {/* MICRO VIDEO PROGRESS SCRUB BAR */}
          <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden mt-2">
            <div
              className="bg-rose-500 h-full rounded-full transition-all duration-100 ease-linear shadow-sm"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
