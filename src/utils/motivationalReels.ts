// Loads and manages the 47 Motivational Reels from src/motiv-reels/

export interface MotivationalReel {
  id: string; // e.g. "mv-01"
  number: number; // 1 to 47
  title: string; // "Discipline & Will #01"
  tagline?: string;
  url: string; // Resolved video asset URL
  filename: string;
}

// Vite static glob import for MP4 files
const reelModules = import.meta.glob<string>('../motiv-reels/*.mp4', {
  eager: true,
  query: '?url',
  import: 'default',
});

// Curated motivational taglines for the reels
const TAGLINES = [
  'Conquer your inner resistance.',
  'Small daily disciplines create unstoppable momentum.',
  'Your future self is watching you right now.',
  'Pain of discipline vs. pain of regret.',
  'Don’t count the days, make the days count.',
  'Focus on what is within your control.',
  'Consistency beats talent when talent is lazy.',
  'One step, then another. Keep moving forward.',
  'Master your impulses, master your destiny.',
  'The body achieves what the mind believes.',
];

export const MOTIVATIONAL_REELS: MotivationalReel[] = Object.entries(reelModules)
  .map(([filepath, url]) => {
    const filename = filepath.split('/').pop() || '';
    const match = filename.match(/MV\s*(\d+)/i);
    const num = match ? parseInt(match[1], 10) : 1;
    const padded = String(num).padStart(2, '0');
    const tagline = TAGLINES[(num - 1) % TAGLINES.length];

    return {
      id: `reel-${padded}`,
      number: num,
      title: `Discipline Fuel #${padded}`,
      tagline,
      url,
      filename,
    };
  })
  .sort((a, b) => a.number - b.number);

export const getReelByNumber = (num: number): MotivationalReel | undefined => {
  return MOTIVATIONAL_REELS.find((r) => r.number === num);
};
