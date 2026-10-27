import { parseISO, differenceInCalendarDays } from 'date-fns';

export interface AnimeQuote {
  quote: string;
  author: string;
  anime: string;
  translation?: string;
}

export const STARTING_POINT_CONFIG = {
  dateStr: '2026-10-27',
  displayDate: '27th Oct, 2026',
  tagline: 'Ground Zero • No More Restarts',
  subtext: 'Small daily choices compound into an unbreakable spirit.',
};

export const ANIME_CONSISTENCY_QUOTES: AnimeQuote[] = [
  {
    quote: 'A dropout will beat a genius through hard work. Small efforts repeated day after day build an unbreakable spirit.',
    author: 'Rock Lee',
    anime: 'Naruto',
    translation: 'Roz choti-choti mehnat hi ek din aage jaakar sabse bada parinaam banti hai.',
  },
  {
    quote: 'No matter how weak or unworthy you feel, keep your heart burning. Take one step, then another. Small steps conquer the impossible.',
    author: 'Kyojuro Rengoku',
    anime: 'Demon Slayer',
    translation: 'Apne dil ko jalaye rakho. Ek-ek kadam karke hi mushkil raaste paar hote hain.',
  },
  {
    quote: 'The future belongs to those who build it today. It doesn’t matter how small your progress is today, as long as you do not stop.',
    author: 'Shoyo Hinata',
    anime: 'Haikyuu!!',
    translation: 'Farq nahi padta kitna chota step liya, zaroori ye hai ki rukna nahi hai.',
  },
  {
    quote: 'Surpass your limits. Right here, right now. Consistency is not doing huge things once — it is showing up every single day.',
    author: 'Yami Sukehiro',
    anime: 'Black Clover',
    translation: 'Apni limits ko piche chhodo. Consistency roz chupchap aane ka naam hai.',
  },
  {
    quote: 'Even the tallest mountain begins with small grains of dust. Stand firm. 27th Oct is your permanent line in the sand.',
    author: 'Jiraiya',
    anime: 'Naruto',
    translation: 'Badi manzil chote chote kankad jod kar banti hai. Ab dobara restart nahi karna.',
  },
  {
    quote: 'Not everyone who works hard is rewarded, but everyone who succeeds has worked hard every single day without fail.',
    author: 'Coach Kamogawa',
    anime: 'Hajime no Ippo',
    translation: 'Har safal insaan ne bina naage roz mehnat ki hai.',
  },
  {
    quote: 'If I give up here, all the promises and sweat of yesterday will become lies. Small scars, daily iron discipline.',
    author: 'Roronoa Zoro',
    anime: 'One Piece',
    translation: 'Agar aaj chhod diya toh kal ka saara pasina jhooth ban jayega. Roz ka discipline hi taqat hai.',
  },
  {
    quote: 'My magic is never giving up! Even when you feel disturbed or tired, do not reset to zero. Build on yesterday!',
    author: 'Asta',
    anime: 'Black Clover',
    translation: 'Chaahe kitna bhi disturb ho jao, zero pe wapas mat jao. Kal ke upar aaj ek aur eet rakho!',
  },
];

/**
 * Calculates how many days have passed since the anchor starting point (27th Oct, 2026).
 * Day 1 is on 2026-10-27.
 */
export function getDaysSinceStartingPoint(targetDateStr = STARTING_POINT_CONFIG.dateStr): number {
  try {
    const start = parseISO(targetDateStr);
    const today = new Date();
    const diff = differenceInCalendarDays(today, start);
    return Math.max(1, diff + 1);
  } catch {
    return 1;
  }
}

/**
 * Returns quote of the day or random quote
 */
export function getDailyAnimeQuote(): AnimeQuote {
  const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % ANIME_CONSISTENCY_QUOTES.length;
  return ANIME_CONSISTENCY_QUOTES[dayIndex] || ANIME_CONSISTENCY_QUOTES[0];
}
