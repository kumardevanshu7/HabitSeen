# HabitsSeen: Audit Report, AI Fix Guide & Upgrade Roadmap

*Based on 33 uploaded files (components, UI kit, store helpers, Firestore service, streak engine). Missing from review: `useAppStore.ts`, `firestore.rules`, `HabitCard`, `CreateHabitModal`, `HabitBreakHub`, `OverallAnalyticsView`. Ye files bhejoge to report ka part 2 ban sakta hai.*

---

## 1. Executive Summary

App ka concept strong hai: 4 habit types, sobriety timer, XP/hearts, streak badges. UI clean hai aur code structure achha hai. Problems ye hain:

- **Data safety:** offline pe onboarding overwrite, delete batch limit, silent Firestore errors.
- **Logic:** streak engine `DAYS_PER_PERIOD` ko galat handle karta hai, `EXCUSED` din ka exploit, stale `habit.stats`.
- **Accessibility / UI kit:** Modal, CustomSelect, Input mein keyboard aur ARIA gaps.
- **Consistency:** naming (3 alag tier-1 naam), hardcoded milestones, Tailwind v3 vs v4 classes.

**Pehle ye 5 fix karo:** P1 offline onboarding, P2 stuck splash, P3 delete batch, P4 Tailwind v3 classes, P5 Modal scroll-lock stack.

---

## 2. Priority Table

| # | Issue | Severity | Effort |
| --- | --- | --- | --- |
| 1 | Offline cold start pe profile `null` → onboarding + overwrite | Critical | S |
| 2 | Firestore errors swallow → splash pe atka rehna | Critical | S |
| 3 | `deleteHabitFromDb` batch 500 limit + swallowed error + wrong order | High | S |
| 4 | Tailwind v3 mein `ring-3`, `scale-102`, `active:scale-98`, `shadow-xs/2xs` kaam nahi karte | High | S |
| 5 | Modal scroll-lock stack nahi, Escape/focus trap nahi | High | M |
| 6 | `habit.stats` stale (DB mein cached) | High | M |
| 7 | `DAYS_PER_PERIOD` streak toot jaata hai | High | M |
| 8 | `EXCUSED` din streak +1 deta hai, limit nahi (exploit) | High | M |
| 9 | ProfileModal desktop pe khulta hi nahi | High | S |
| 10 | `inspectedHabit` stale snapshot | Medium | S |
| 11 | HabitDetailsModal statuses mismatch + khali habit pe red bar | Medium | S |
| 12 | DayStrip `selectedDate` se sync nahi | Medium | S |
| 13 | Category dedup UI-only, habits chhup sakti hain | Medium | M |
| 14 | Input `Math.random()` id, Button default `type=submit` | Medium | S |
| 15 | App effect `currentUser` object pe (uid pe hona chahiye) | Medium | S |
| 16 | `safe-bottom`, `font-display`, custom tokens define hain ya nahi | Medium | S |
| 17 | Din badalne par `getTodayKey()` refresh nahi hota | Medium | S |
| 18 | Naming / hardcoded content / dead code | Low | S |

*Effort: S = 1 ghanta tak, M = aadha din.*

---

## 3. Detailed Issues + AI Model ke liye Fix Instructions

Har issue ke neeche ek **AI prompt** hai. Copy karke apne AI coding model ko do, saath mein related file attach karo.

### 3.1 Data Safety

**P1. Offline cold start pe onboarding dikh jaata hai**

- **Kya hota hai:** `subscribeUserProfile` doc na milne par `onUpdate(null)` deta hai. Offline mein pehla snapshot cache se khali aata hai, to existing user bhi "naya" lagta hai aur `completeOnboarding` default values (XP 0, age 24) likh sakta hai.
- **Fix:** `snap.metadata.fromCache` check karo. Null tabhi do jab server se confirm ho. `persistentLocalCache` on karo.

> **AI Prompt:** "In `firestoreService.ts`, change `subscribeUserProfile` so it calls `onUpdate(null)` only when `!snap.exists() && !snap.metadata.fromCache`. If the snapshot is from cache and does not exist, do not call onUpdate yet. In `firebase.ts`, replace `initializeFirestore` options with `localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })` and keep `experimentalAutoDetectLongPolling`. Also make `completeOnboarding` use `setDoc(..., {merge:true})` and refuse to write if `user?.isOnboarded` is already true."

**P2. Errors silently nigal liye jaate hain**

- **Kya hota hai:** Sab `subscribe*` ke error callback sirf `console.error`. `permission-denied` ya network error pe splash "Connecting..." pe hamesha atka reh sakta hai.
- **Fix:** Har subscribe ko `onError` callback do. Store mein `syncError` state rakho. Splash pe retry button aur toast dikhao.

> **AI Prompt:** "Add an optional `onError: (e: FirestoreError) => void` param to every `subscribe*` function in `firestoreService.ts`. In `App.tsx`, on error set `profileLoading=false` and store a `syncError` message in `useAppStore`. Render a dismissible banner with a Retry button when `syncError` is set. Never leave the app on the splash screen for more than 8 seconds; add a timeout fallback."

**P3. Habit delete**

- **Kya hota hai:** `writeBatch` max 500 ops. 500+ logs wali habit pe fail. `catch` error swallow karta hai. Habit pehle delete hoti hai, logs baad mein, to beech mein fail hone par orphan logs bachte hain.
- **Fix:** Pehle logs delete karo (400-400 ke chunks), phir habit. Error throw karo. Better: `logs` ko `users/{uid}/habits/{habitId}/logs` subcollection mein rakho.

> **AI Prompt:** "Rewrite `deleteHabitFromDb`: query logs where habitId == id, delete them in chunks of 400 using `writeBatch`, throw on any error, and only after all logs are deleted delete the habit doc. Return a Promise that rejects so the UI can show an error toast."

### 3.2 Game Logic (Streak / XP / Hearts)

**P6. `habit.stats` stale**

- Weekly/monthly counts aur `currentStreak` DB mein cached hain. 3 din app na khola to purana streak dikhega.
- **Fix:** Streak/counters ko render time pe `computeHabitStreaks(habit, logs)` se derive karo (memoized). DB mein sirf `bestStreak` aur `unlockedChallenges` rakho.

> **AI Prompt:** "Create a selector hook `useHabitStats(habitId)` that derives currentStreak, bestStreak, thisWeek, thisMonth, thisYear, allTime from `logs` using `computeHabitStreaks` and `date-fns`, memoized with useMemo. Replace every read of `habit.stats.*` in HabitDetailsModal, HabitCard and analytics with this hook. Persist only `bestStreak` and `unlockedChallenges` when they increase."

**P7. `DAYS_PER_PERIOD` streak**

- `isHabitDueOnDate` is type ke liye har din `true` deta hai, to "hafte mein 3 baar" wali habit ka streak off-days pe toot jaata hai.
- **Fix:** Is type ke liye alag **period streak**: kitne continuous weeks/months/years mein target count poora hua. Detail algorithm section 4.2 mein hai.

**P8. EXCUSED exploit**

- Koi bhi text likh kar 0 penalty + streak +1 le sakta hai.
- **Fix:** EXCUSED din ko **freeze** maano: streak na badhe, na toote. Mahine mein max 3 excuses (configurable), uske baad normal miss. Streak milestones sirf COMPLETED days se count ho.

> **AI Prompt:** "In `streakEngine.ts`, change `computeHabitStreaks` so EXCUSED logs bridge gaps (do not break a streak) but do not increment the streak counter. Add a monthly cap of 3 excuses per habit: beyond the cap treat the log as MISSED. Update `LogMissedModal` to show remaining excuses this month and disable the Genuine Reason option when exhausted."

**Penalty values hardcoded**

- `LogMissedModal` mein -10/-25 XP aur -1/-2 hearts text hardcoded hai. Store logic se alag ho sakta hai.
- **Fix:** `constants/gamification.ts` mein `MISS_PENALTIES` object banao, UI aur store dono wahin se padhein.

### 3.3 State / Architecture

- **`inspectedHabit` object ki jagah `inspectedHabitId`** rakho aur `habits.find` se nikalo, taaki realtime updates dikhein.
- **`App.tsx` effect** dependency `[currentUser?.uid]` karo.
- **`InstallPromptBanner`** ko App root pe ek hi baar mount karo, `beforeinstallprompt` ko global capture karo, dismiss `localStorage` mein save karo, `appinstalled` handle karo, iPadOS detect karo (`navigator.maxTouchPoints > 1` + `Macintosh`).
- **Midnight rollover:** `useToday()` hook banao jo `visibilitychange` aur midnight timer pe `todayKey` update kare.
- **`subscribeLogs`** poori collection sunta hai. Last 120 din tak limit karo (`where('date','>=',...)`), purani history analytics ke liye on-demand fetch karo.
- **Dead code hatao:** `firebaseConfig.ts` (placeholder), `IHabitRepository.ts` (koi implement nahi karta) ya sach mein implement karo.

### 3.4 UI Kit (Modal, Input, Button, CustomSelect)

| Component | Problem | Fix |
| --- | --- | --- |
| Modal | Scroll-lock stack nahi (2 modals = bug) | Global counter / purani `overflow` value restore |
| Modal | Escape, focus trap, `role="dialog"`, `aria-modal`, close `aria-label` nahi | Add karo; `inert` ya `focus-trap-react` |
| Modal | Title nahi to X button gayab | Close button hamesha render karo |
| Modal | `max-h-[92vh]` mobile mein galat | `max-h-[92dvh]` |
| Input / Select | `Math.random()` id har render pe badalti hai | `useId()` |
| Input | Error ke liye `aria-invalid`, `aria-describedby` nahi; class conflict | Add + `tailwind-merge` |
| Button | Default `type="submit"` | Default `type="button"`; `twMerge` |
| Button | `sm` 32px, `icon` 40px (touch target chhota) | Mobile pe min 44px |
| CustomSelect | Keyboard, ARIA nahi, label link nahi, Modal ke andar clip | Combobox/listbox pattern ya **Radix Select / Headless UI**, portal use karo |

> **AI Prompt (UI kit):** "Rewrite `Modal.tsx`, `Input.tsx`, `Button.tsx`, `CustomSelect.tsx` with these requirements: (1) Modal uses a global open-count to lock body scroll, closes on Escape, traps focus, has role=dialog, aria-modal, aria-labelledby, always renders a close button with aria-label, uses dvh units, renders via React portal. (2) Input and Select use `useId()`, set aria-invalid and aria-describedby, and merge classes with `tailwind-merge`. (3) Button defaults to type=button, merges classes with `twMerge`, and has min touch target 44px on mobile. (4) CustomSelect is replaced by Radix UI Select (or Headless UI Listbox) keeping the same props API and visual style. Keep the existing design tokens."

### 3.5 Tailwind aur Design Tokens

- `index.css` mein `@tailwind base/components/utilities` hai, yaani **Tailwind v3**. Ye classes v3 mein nahi chalti: `ring-3`, `scale-102`, `hover:scale-102`, `active:scale-98`, `shadow-xs`, `shadow-2xs`. Ya to `tailwind.config` mein extend karo ya `ring-2`, `scale-[1.02]`, `active:scale-[0.98]`, `shadow-sm` use karo.
- Ye custom tokens config mein hone chahiye: `canvas, ink, charcoal, stone, ash, body, hairline, hairline-strong, surface-card, surface-bone, surface-dark, primary, primary-deep, primary-glow, primary-pink, badge-success`. `font-display` ke liye `fontFamily.display`.
- `animate-in`, `slide-in-from-*` ke liye `tailwindcss-animate` plugin chahiye.
- `.safe-bottom` class define karo aur `index.html` mein `viewport-fit=cover`.
- Fonts (Inter, Bricolage Grotesque) ka `<link>` ya `@fontsource` import add karo.

> **AI Prompt:** "Audit every className in the project against `tailwind.config.js` (v3). List each class that is not generated (custom tokens, ring-3, scale-102, active:scale-98, shadow-xs, shadow-2xs, safe-bottom, font-display, animate-in). Then update the config (colors, fontFamily.display, boxShadow xs/2xs, scale 102, ringWidth 3, plugins: tailwindcss-animate) and add `.safe-bottom` to index.css."

### 3.6 Feature Bugs

- **ProfileModal desktop pe nahi khulta:** sirf `BottomNav` (`md:hidden`) se khulta hai. Navbar ke hearts/XP badge ko button banao jo ProfileModal khole.
- **HabitDetailsModal:** khali habit (`totalTracked === 0`) pe poora red bar. EXCUSED/MISSED/PARTIAL/FAILED statuses count/calendar mein handle nahi. Calendar week Sunday se, `dateMath` Monday se. Month state reset nahi hota. Genuine-reason din ke liye shield icon dikhao.
- **DayStrip:** `selectedDate` badalne par `anchorDate` update karo (`useEffect`) aur selected day ko `scrollIntoView` karo. Dono branch same wala `isSelected ? 'bg-primary' : 'bg-primary'` fix karo.
- **HabitsView category dedup:** UI mein name se dedupe hota hai par filter id se. Duplicate banna roko (default categories seed karte waqt race condition) aur purani duplicates merge karo.
- **OnboardingModal:** `displayName` prefill `useEffect` se karo; `completeOnboarding` fail ho to error dikhao; age min 13 rakho; `Select` ko consistent rakho.
- **LogMissedModal:** modal band hone par state reset karo; subtitle mein "today" ki jagah actual date; Hinglish placeholder ya to sab jagah rakho ya hatao.
- **AuthModal:** mode toggle par error clear; `auth/too-many-requests`; Forgot password; PWA standalone mein `signInWithRedirect` fallback.
- **Landing:** milestone list `STREAK_CHALLENGES` se render karo ("Unwavering" vs "Unwavering Pillar"), "XP based on difficulty" claim hatao ya difficulty add karo, footer year dynamic.
- **Naming:** `WILL_HABIT_TIERS[0].title` ek hi source banao. Abhi `Will Habit Initiate`, `Discipline Initiate`, `Will Initiate` teen jagah hain.

---

## 4. Algorithm Upgrades

### 4.1 Habit Strength Score (streak se behtar)

Abhi sirf streak hai, jo ek miss pe 0 ho jaata hai aur demotivate karta hai. **Exponentially weighted score** use karo (Loop Habit Tracker jaisa):

```
S(t) = S(t-1) + α · (x(t) − S(t-1))
x(t) = 1 agar done, 0 agar missed   (sirf due days pe update, EXCUSED skip)
α ≈ 0.05   → ek miss se score thoda girta hai, collapse nahi hota
```

- 0–100% "Habit Strength" ring dikhao.
- Streak aur strength dono dikhao: streak = momentum, strength = asli consistency.
- Analytics mein 30/90 din ka strength trend line.

### 4.2 Period-based Streak (`DAYS_PER_PERIOD`)

```
for each period (week/month/year) in history:
    done = count(COMPLETED in period)
    success = done >= targetCount
streak = consecutive successful periods ending at current or previous period
current period abhi chal raha hai to usse break mat maano jab tak target possible hai:
    remainingDays >= (targetCount - done)
```

UI: "This week 2/3 • 4 din bache".

### 4.3 Streak Freeze + Grace Day

- Har 7 completed din par 1 **Freeze token** milta hai (max 2).
- Miss hone par token auto-use ho (user ko notification: "Freeze used, streak safe").
- `EXCUSED` alag rakho: monthly cap ke saath (section 3.2).
- Freeze se XP nahi milta, sirf streak bachta hai.

### 4.4 Fair XP Formula

```
XP = base × streakMult × priorityMult × difficultyMult × diminishing
diminishing = 1 / (1 + 0.15 × (habitsDoneToday − 1))   // spam-proof
dailyCap = 400 XP
comebackBonus = +25% pehle 3 din, jab 7+ din ka gap ke baad wapas aaye
```

- `difficultyMult`: user manually Easy/Medium/Hard (0.8 / 1.0 / 1.3) chunta hai ya target size se auto nikalta hai.
- Landing page ka "difficulty" claim tab sach hoga.

### 4.5 Hearts Regeneration

- Abhi hearts kaise wapas aate hain clear nahi hai. Rule: **3 consecutive perfect days = +1 heart**, ya 1 heart = 100 XP se revive.
- Hearts 0 par "Recovery Mode": XP penalty off, sirf 3 easy habits dikhao jab tak 1 heart wapas na aaye. Isse user app chhodta nahi.

### 4.6 Smart "Today's Focus" Ranking

```
score = priority × 0.5 + riskOfMiss × 0.3 + streakAtStake × 0.2
riskOfMiss = weekday miss rate pichle 8 hafte mein (0–1)
streakAtStake = min(currentStreak / 30, 1)
```

Top 3 habits ko "Focus" section mein dikhao, baaki neeche. Ye personalised aur halka algorithm hai, ML ki zaroorat nahi.

### 4.7 Best Time Detector

- `loggedAt` ke hours ka histogram nikaalo. Jis ghante mein sabse zyada completions hain, wahi "Your golden hour" hai.
- Reminder usi ghante se 15 min pehle bhejo.

### 4.8 Sobriety (Habit Break) Improvements

- Relapse par sirf reset mat karo. Dikhao: **"Last 90 din mein clean days: 78/90 (87%)"**. Relapse ke baad bhi progress dikhta hai, shame kam hota hai.
- Milestones: 1h, 6h, 24h, 3d, 7d, 30d, 90d, 1y. Shuru ke ghanton mein zyada milestones, taaki early cravings mein reward mile.
- Health timeline (smoking ke liye jaise): "20 min: heart rate normal" jaise info cards. Sirf verified generic facts use karo aur medical claim se bacho.
- **Craving SOS button:** 10-minute countdown + breathing animation + "Why I quit" note.

### 4.9 Weekly Auto-Insights (rule-based)

- "Tumhari sabse kamzor habit Saturday ko hai (43%)."
- "Morning mein complete hui habits ka success rate 82%, raat mein 51%."
- "Is hafte tumne pichle hafte se 18% zyada XP kamaye."

Sab simple group-by aur averages se banta hai.

---

## 5. UI/UX Upgrades (App ko "mast" banane ke liye)

### 5.1 Home screen

1. **Progress ring header:** upar "Today 4/7" ka bada ring, completion par confetti.
2. **Swipe gestures** habit card pe: right = complete, left = skip/miss (LogMissedModal khule).
3. **Quick add FAB** thumb zone mein (BottomNav ka center button already hai, good).
4. **Haptics:** `navigator.vibrate(10)` complete par.
5. **Optimistic UI:** tap par turant check dikhao, Firestore baad mein sync ho.
6. **Undo toast** (5 sec) har complete/miss par.
7. **Skeleton loaders** splash ki jagah, taaki app fast lage.

### 5.2 Motion aur feedback

- Streak badge unlock par full-screen celebration (Lottie ya CSS).
- XP number count-up animation, heart break animation penalty par.
- `prefers-reduced-motion` respect karo.

### 5.3 Visual polish

- **Dark mode:** tokens pehle se hain, `dark:` variants add karna aasan hai. Raat ko habit log karne wale users ke liye zaroori.
- **Heatmap calendar** (GitHub style) HabitDetailsModal mein, 12 mahine ka. Color intensity = completion.
- **Category color** ko card ke left border/glow mein use karo, abhi sirf icon mein hai.
- **Level progress bar** Navbar badge mein: "Iron Will • 340/1000 XP".
- **Empty states** mein illustration aur ek-click templates ("Drink water", "Read 10 pages").
- **Typography:** numbers ke liye `tabular-nums` taaki timer jhatke na kare.

### 5.4 Mobile aur PWA

- Touch targets 44px, `safe-bottom`, `dvh`.
- Web Push notifications (Firebase Cloud Messaging) + Cloud Function jo daily reminder bheje.
- App shortcuts (manifest): "Add habit", "Today".
- Home screen widget nahi ho sakta PWA mein, par badge API (`navigator.setAppBadge`) se pending count dikha sakte ho.
- Update available toast (`registerSW` ka `onNeedRefresh`).

### 5.5 Accessibility

- Sab icon-only buttons pe `aria-label`.
- Color ke saath icon/text bhi (red/green colorblind-safe).
- Focus ring visible, keyboard se poori app chalni chahiye.

---

## 6. Naye Feature Ideas HabitsSeen ke liye

| Idea | Kya hai | Impact |
| --- | --- | --- |
| **Identity statements** | "Main woh insaan hoon jo roz padhta hai" har habit ke saath | Retention |
| **Habit stacking** | "Chai ke baad → 5 min meditation" chain, ek complete karte hi agla suggest | Habit formation |
| **Implementation intention** | Create flow mein "Kab aur kahan?" field + reminder | Scientifically strong |
| **Why I quit vault** | Sobriety mein apna reason, relapse risk pe dikhao | Sobriety success |
| **Accountability partner** | 1 dost invite karo, sirf streak dikhe (privacy safe) | Social retention |
| **Weekly review card** | Har Sunday auto summary + 1 goal for next week | Engagement |
| **Templates / Challenges** | "30-Day No Sugar", "75 Hard" ek tap import | Onboarding |
| **Mood tracker link** | Din ke end mein 1-5 mood, habit se correlation | Insights |
| **Data export** | CSV / JSON download | Trust |
| **Badges beyond streak** | "Early Bird" (10 morning completions), "Comeback Kid" | Variety |
| **Pomodoro for TIMER habits** | Focus timer ke saath break reminders | Utility |
| **Quotes / tips** | Din ka ek discipline tip, offline cached | Delight |

**Safety note:** Sobriety aur smoking/alcohol/drugs ke features mein "Agar tumhe struggle ho raha hai to professional help lo" ka link rakho. Self-harm jaisi keywords pe helpline info dikhao. Medical claims verified source ke bina mat likho.

---

## 7. Security aur Production Checklist

- [ ] `firestore.rules` review karo: har path `request.auth.uid == userId` tak limited, field validation (XP, hearts range), `isOnboarded` ko client se wapas false na kar sako.
- [ ] **XP/hearts client-side likhna cheating ka darwaza hai.** Long term mein Cloud Function se compute karo, ya rules mein delta limit lagao.
- [ ] Firebase **App Check** on karo, API key ko HTTP referrer se restrict karo.
- [ ] `.env` mein config rakho, `firebase.ts` ke hardcoded fallback hatao.
- [ ] `vite-env.d.ts` mein `ImportMetaEnv` typing.
- [ ] Error monitoring (Sentry) + Firebase Analytics events (habit\_created, streak\_milestone).
- [ ] Privacy Policy aur Terms page (age, gender, relationship status collect karte ho; GDPR/India DPDP ke hisaab se consent aur account delete option do).
- [ ] Account delete flow: user ka saara data Firestore se hataye.
- [ ] Unit tests: `streakEngine`, `dateMath`, `evaluateHabitSuccess` pe (Vitest). Edge cases: month end, DST, leap year, timezone change.
- [ ] Timezone: `YYYY-MM-DD` local date par based hai. Travel karne par logs duplicate/miss ho sakte hain. User ka timezone profile mein save karo.

---

## 8. Roadmap

**Week 1 (Stability):** P1, P2, P3, Tailwind config audit, Modal/Input/Button rewrite, ProfileModal desktop, `inspectedHabitId`, `uid` dependency.

**Week 2 (Logic):** derived stats hook, period streak, EXCUSED freeze + cap, penalties constants, tests for streak engine, midnight rollover.

**Week 3 (Delight):** habit strength score, progress ring, swipe gestures, undo toast, heatmap, dark mode, celebration animations.

**Week 4 (Growth):** push notifications, templates, weekly review, Today's Focus ranking, install prompt cleanup, data export.

**Later:** Cloud Functions for XP, accountability partner, insights, Craving SOS.

---

## 9. Master Prompt (poore project ke liye AI model ko do)

> "You are a senior React + TypeScript + Firebase engineer. The project is HabitsSeen, a PWA habit tracker (Vite, Tailwind v3, Zustand, Firestore, date-fns). I will attach files one task at a time. For each task: (1) read the file fully, (2) list the bugs you will fix, (3) output the complete updated file, not snippets, (4) keep existing design tokens and component APIs unless told otherwise, (5) add unit tests with Vitest for any logic change, (6) never introduce Tailwind classes that do not exist in v3 without adding them to tailwind.config, (7) handle loading, empty, and error states, (8) keep accessibility in mind: aria labels, keyboard support, 44px touch targets. After the code, give a 3-line summary of what changed and any follow-up risk."

**Kaam ka order AI ko dene ke liye:** 1) `firestoreService.ts` + `firebase.ts` (P1–P3), 2) UI kit (Modal, Input, Button, Select), 3) `tailwind.config` + `index.css`, 4) `streakEngine.ts` + tests, 5) `App.tsx` + `useAppStore.ts`, 6) HabitDetailsModal, DayStrip, ProfileModal, Navbar, 7) enhancements (strength score, freeze, focus ranking).

---

## 10. Next Step

`useAppStore.ts`, `firestore.rules`, `HabitCard.tsx`, `CreateHabitModal.tsx`, `HabitBreakHub.tsx`, `OverallAnalyticsView.tsx` bhej do. XP/hearts ka asli logic, security rules aur sobriety timer ka review abhi baaki hai, aur wahan sabse zyada impactful bugs milne ke chance hain.

---

## 11. Gamification System: Poora Structure + Algorithms

Abhi HabitsSeen mein XP, hearts, 5 tiers aur 10 streak badges hain. Ye achhi base hai, par ek **poora game loop** nahi hai. Neeche complete design hai jo seedha implement ho sakta hai.

### 11.1 Core Loop (Hook Model)

```
TRIGGER  →  ACTION  →  REWARD  →  INVESTMENT  →  (wapas TRIGGER)
reminder     habit log    XP, chest,   streak, level,
/ quest      (1 tap)      animation    identity, history
```

- **Trigger:** push reminder, "Today's Focus", daily quest.
- **Action:** jitna chhota ho utna behtar (1 tap complete).
- **Reward:** turant feedback (animation + XP) aur kabhi-kabhi surprise (chest).
- **Investment:** jo user ne banaya (streak, level, badges) wo chhodna mushkil hota hai.

### 11.2 Currencies (Economy)

| Currency | Kaise milti hai | Kahan kharch hoti hai | Purpose |
| --- | --- | --- | --- |
| **XP** | Habit complete, quests | Kharch nahi hoti, sirf level badhati hai | Progress / rank |
| **Hearts** (max 5) | 3 perfect din = +1 | Miss par ghatti hai | Consequence, tension |
| **Willpower Coins** | Quests, chests, level-up | Streak freeze, heart revive, themes | Soft currency |
| **Freeze Tokens** (max 2) | Har 7 din streak par 1 | Miss par auto-use | Streak protection |

**Rule:** XP kabhi kharch nahi hoti (level kabhi neeche nahi jaata). Coins kharch hote hain, isse economy balanced rehti hai.

### 11.3 Level Curve

Abhi 5 tiers hain (0–20000 XP). Smooth progression ke liye formula-based 30 levels, aur har 5 level par **tier title** badle:

```
XP_for_level(L) = round(100 × L^1.6)

L=2  →  ~303 XP        L=10 →  ~3,981 XP
L=5  →  ~1,313 XP      L=20 →  ~12,000 XP
                         L=30 →  ~23,000 XP
```

Tier titles (suggestion):

| Levels | Title |
| --- | --- |
| 1–4 | Will Initiate |
| 5–9 | Iron Will |
| 10–14 | Unbreakable |
| 15–19 | Master Mind |
| 20–24 | Stoic Sage |
| 25–29 | Legendary Monk |
| 30 | Ascended |

Har level-up par: confetti, +coins (`L × 10`), aur naya cosmetic unlock.

### 11.4 Quest System

Quests wo "mini goals" hain jo user ko roz wapas laate hain.

| Type | Example | Reward | Reset |
| --- | --- | --- | --- |
| **Daily** (3 quests) | "Aaj 3 habits complete karo" | +30 XP, +5 coins | Roz midnight |
| **Daily bonus** | "Subah 9 se pehle ek habit" | +20 XP | Roz |
| **Weekly Boss** | "Is hafte 80% completion" | +200 XP, chest | Monday |
| **Monthly Challenge** | "30 din mein 25 din active" | Rare badge, +500 XP | 1st tarikh |
| **Comeback quest** | 3+ din gap ke baad: "Aaj sirf ek easy habit" | 2× XP | Auto trigger |

**Quest generation algorithm (personalised):**

```
candidates = QUEST_TEMPLATES filtered by:
    user ke active habit types
    pichle 7 din mein kamzor area (low completion category)
pick 3 with:
    1 easy (user ki avg completion se 20% neeche target)
    1 medium (avg ke barabar)
    1 stretch (avg se 20% upar)
seed = hash(userId + todayKey)   // roz same quests, refresh par badlein nahi
```

### 11.5 Achievements (Streak ke alawa)

| Category | Examples |
| --- | --- |
| **Consistency** | 7/30/100/365 din streak (already hai) |
| **Volume** | 100 / 500 / 1000 habits complete |
| **Time-based** | Early Bird (10 completions 7 AM se pehle), Night Owl |
| **Resilience** | Comeback Kid (7+ din gap ke baad 7 din streak), Phoenix (3 baar wapas aaya) |
| **Variety** | Polymath (5 alag categories mein active), All four types use kiye |
| **Sobriety** | 24 hours / 7 / 30 / 90 din clean, "Relapse ke baad bhi wapas aaya" |
| **Perfection** | Perfect Week (7/7), Perfect Month |
| **Secret** | Hidden badges (surprise delight) |

Har badge ki **rarity** rakho: Common, Rare, Epic, Legendary, aur % users dikhao jinke paas wo hai (baad mein, analytics se).

### 11.6 Streak Flame Tiers (Visual Feedback)

| Streak | Flame | Effect |
| --- | --- | --- |
| 1–6 | Chhoti chingari | Normal |
| 7–29 | Orange flame | Halka glow |
| 30–99 | Neeli flame | Glow + sparkle |
| 100+ | Golden flame | Animated aura |
| 365+ | Legendary | Special border on profile |

Navbar/HabitCard par flame dikhao. Ye bina text ke instantly progress batata hai.

### 11.7 Variable Rewards (Mystery Chest)

Predictable reward jaldi boring ho jaata hai. **Kabhi-kabhi milne wala reward** dopamine zyada deta hai.

```
Trigger: weekly boss complete, level-up, 30-din milestone, ya daily 1% chance

rarity roll (seeded RNG):
  Common     60%  →  10–30 coins
  Rare       25%  →  50 coins ya 1 freeze token
  Epic       12%  →  100 coins + cosmetic
  Legendary   3%  →  250 coins + rare badge

pity rule: 10 chests mein Epic nahi mila to agla guaranteed Epic
```

**Ethics:** Paise se chest kabhi mat bechna. Sirf earned rewards. Gambling jaisa pattern sobriety wale users ke liye harmful ho sakta hai.

### 11.8 Hearts aur Recovery Design

```
Miss penalties (constants mein):
  FORGOT          → -1 heart, -10 XP
  INTENTIONAL     → -2 heart, -25 XP
  GENUINE (cap 3/month) → 0 penalty, streak freeze

Hearts == 0 → "Recovery Mode":
  - XP penalty band
  - sirf 3 easy habits dikhao
  - 3 complete = +1 heart
  - ya 50 coins se instant revive
```

Isse user ko "game over" nahi milta. Wapas aane ka asaan rasta hamesha rehta hai.

### 11.9 Weekly League (Optional, Social)

- Har hafte 30 random users ka group (anonymous naam ya nickname).
- Hafte ke **XP** pe rank. Top 5 promote, bottom 5 demote (Bronze → Silver → Gold → Diamond).
- Sirf rank aur XP dikhao, habit ke naam ya private data nahi.
- Opt-in rakho. Sobriety/personal habits ke liye privacy zaroori hai.
- Cloud Function se weekly reset aur ranking compute karo (client pe nahi).

### 11.10 Anti-Cheat aur Balance

| Risk | Guard |
| --- | --- |
| Ek habit baar baar toggle karke XP farm | XP sirf pehli completion par; undo par XP wapas |
| Bahut saari fake habits banana | Daily XP cap (400), diminishing returns (section 4.4) |
| Future ya purani date ke logs | Server rules: `date <= today`, backfill sirf 2 din tak |
| Client se XP/hearts edit | Cloud Function ya Firestore rules mein delta limit |
| Genuine reason spam | Monthly cap (3), reason min 10 characters |
| Timezone hack | Server timestamp se `today` verify karo |

### 11.11 Data Model (TypeScript)

```ts
interface GamificationState {
  level: number;
  totalXp: number;
  hearts: number; maxHearts: number;
  coins: number;
  freezeTokens: number;           // max 2
  excusesUsedByMonth: Record<string, number>; // "2026-10": 2
  dailyXp: { date: string; xp: number };     // cap track
  unlockedBadges: Record<string, { at: string; rarity: Rarity }>;
  quests: {
    daily: Quest[]; weekly: Quest[]; monthly: Quest[];
    generatedForDate: string;
  };
  chestPity: { sinceEpic: number };
  league?: { tier: 'BRONZE'|'SILVER'|'GOLD'|'DIAMOND'; weekXp: number };
}

interface Quest {
  id: string; type: 'DAILY'|'WEEKLY'|'MONTHLY'|'COMEBACK';
  title: string; target: number; progress: number;
  reward: { xp: number; coins: number; chest?: boolean };
  claimedAt?: string;
}

type Rarity = 'COMMON'|'RARE'|'EPIC'|'LEGENDARY';
```

### 11.12 Central Reward Engine (Pseudocode)

Saara logic ek jagah rakho, taaki UI aur store mein duplicate na ho:

```ts
function onHabitCompleted(state, habit, log, ctx) {
  // 1. XP
  let xp = calculateXp(habit, ctx.streak, ctx.doneToday, ctx.isComeback);
  xp = Math.min(xp, DAILY_CAP - state.dailyXp.xp);

  // 2. Streak freeze earn
  if (ctx.streak > 0 && ctx.streak % 7 === 0)
    state.freezeTokens = Math.min(2, state.freezeTokens + 1);

  // 3. Heart regen
  if (ctx.perfectDaysInRow >= 3) state.hearts = Math.min(state.maxHearts, state.hearts + 1);

  // 4. Quest progress
  updateQuests(state.quests, { type: 'HABIT_DONE', habit, time: log.loggedAt });

  // 5. Level check
  const newLevel = levelFromXp(state.totalXp + xp);
  const leveledUp = newLevel > state.level;

  // 6. Badge check
  const newBadges = evaluateBadges(state, habit, ctx);

  // 7. Chest roll
  const chest = shouldDropChest(state, { leveledUp, newBadges });

  return { xp, leveledUp, newBadges, chest, events: buildUiEvents(...) };
}
```

UI sirf `events` ko sunke animations chalaye: `XP_GAINED`, `LEVEL_UP`, `BADGE_UNLOCKED`, `CHEST_DROPPED`, `HEART_RESTORED`. Isse animations aur logic alag rehte hain, aur tests likhna aasan hota hai.

### 11.13 Level aur Streak Helpers

```ts
const xpForLevel = (L: number) => Math.round(100 * Math.pow(L, 1.6));

function levelFromXp(totalXp: number) {
  let L = 1;
  while (L < 30 && totalXp >= xpForLevel(L + 1)) L++;
  return L;
}

const progressInLevel = (xp: number, L: number) =>
  (xp - xpForLevel(L)) / (xpForLevel(L + 1) - xpForLevel(L));
```

### 11.14 Gamification Design Principles

1. **Reward effort, not outcome.** Sirf streak nahi, comeback aur consistency ko bhi reward do.
2. **Loss aversion dhyan se.** Streak freeze aur recovery mode rakho. Zyada shame/guilt wala UI mat banao, khaaskar sobriety mein.
3. **Intrinsic motivation pehle.** Identity statements aur weekly review ke saath mila ke use karo. Agar sirf points ke liye karte hain, to points band hote hi user chhod deta hai.
4. **Chhote, turant rewards.** Har action pe 1 second ke andar feedback.
5. **Progress hamesha visible.** Level bar, quest bar, "3 more to next heart".
6. **Dark patterns nahi.** Fake urgency, guilt-trip notifications ya paid chests nahi.
7. **Sobriety mode alag treat karo.** Wahan leaderboard/chest/competition off rakho by default, sirf supportive milestones aur private progress.

### 11.15 Metrics (Gamification kaam kar raha hai ya nahi)

| Metric | Target idea |
| --- | --- |
| D1 / D7 / D30 retention | D7 > 35%, D30 > 15% |
| Daily active habits per user | Badhta hua trend |
| Streak > 7 wale users % | Badhta hua |
| Comeback rate (gap ke baad return) | > 40% |
| Quest completion rate | 50–70% (zyada = easy, kam = tough) |
| Hearts 0 par churn | Recovery mode se kam hona chahiye |

Har event (`xp_gained`, `quest_claimed`, `badge_unlocked`, `chest_opened`, `heart_lost`) Firebase Analytics mein bhejo, taaki balance data se tune ho sake.

### 11.16 Build Order (Gamification ke liye)

1. `constants/gamification.ts` mein penalties, level curve, quest templates, badges.
2. `services/rewardEngine.ts` (pure functions) + Vitest tests.
3. Store mein `GamificationState` aur `onHabitCompleted` integrate karo.
4. UI: XP/level bar, flame tiers, quest panel, badge shelf, celebration events.
5. Chest + coins economy.
6. Cloud Function se XP/hearts validate karo.
7. Optional: weekly league.

> **AI Prompt:** "Implement the gamification system from section 11 of the HabitsSeen report. Create `services/rewardEngine.ts` as pure TypeScript functions (no React, no Firestore): `calculateXp`, `levelFromXp`, `generateDailyQuests(seed, userStats)`, `evaluateBadges`, `rollChest(state, rng)`, `onHabitCompleted`. Add `GamificationState` to `types/habit.ts` and a migration that fills defaults for existing users. Write Vitest tests for level boundaries, daily XP cap, freeze token earning, excuse cap, chest pity rule, and quest generation determinism. Do not touch UI in this step."
