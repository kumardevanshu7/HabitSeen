# HabitsSeen — Full Code Audit, Fix Guide & Enhancement Roadmap

Oct 11, 2026 · @Kumar Devanshu

## Summary

25 files review hui, unmein 40 se zyada issues mile; 12 ko pehle fix karna chahiye kyunki wo data galat karte hain ya user ka progress kho sakte hain. 4 badi files (HabitCard, CreateHabitModal, HabitBreakHub, OverallAnalyticsView) ka content nahi aaya, isliye wo is report mein shamil nahi hain.

Pehle ek correction: pehli baar maine "duplicate dates" ka streak bug bataya tha. Log key `habitId_dateKey` hai, to ek din ka ek hi log banta hai. Wo bug nahi hai, ignore karo.

### Pehle fix karne wale 12 issues

| # | Issue | File | Asar |
| --- | --- | --- | --- |
| 1 | Week/Month/Year counts mein all-time number save ho raha hai | useAppStore.ts | Stats galat |
| 2 | Complete, partial, complete karne par dobara XP milta hai; edit par XP record 0 ho jaata hai | useAppStore.ts | XP farming / loss |
| 3 | `get()` ka purana snapshot 3 awaits ke baad `set` mein use hota hai | useAppStore.ts | Data overwrite |
| 4 | Existing user ko onboarding dikh sakta hai, XP 150 pe reset | OnboardingModal + useAppStore | Progress loss |
| 5 | `updateDoc` + cleaner: hataya hua optional field DB mein reh jaata hai | firestoreService.ts | Stale data |
| 6 | Cleaner `Timestamp` / `serverTimestamp()` ko plain object bana deta hai | firestoreCleaner.ts | Firestore types toot |
| 7 | Default category DB se delete ho jaati hai | useAppStore.ts | Data loss |
| 8 | Streak sirf consecutive calendar days gino, schedule ignore | streakEngine.ts | Streak galat tootti hai |
| 9 | Sign In dabane par Create Account khulta hai | AuthModal.tsx | Auth UX bug |
| 10 | Calendar ki dates galat weekday ke neeche | HabitDetailsModal.tsx | Calendar galat |
| 11 | Offline mein UI update nahi hota (DB await pehle) | useAppStore.ts | App atak jaata hai |
| 12 | Firestore security rules verify nahi hain | firebase.ts | Security risk |

### Severity ginti

| Level | Matlab | Ginti |
| --- | --- | --- |
| Critical / High | Data ya progress galat ya loss | 12 |
| Medium | UX ya logic galat, workaround hai | 16 |
| Low | Cleanup, unused code, copy mismatch | 15+ |

## File-wise issues (logic, data, services)

Har point: problem, phir fix.

### streakEngine.ts

- **Schedule ignore hota hai.** Streak sirf consecutive calendar days se banti hai. Mon/Wed/Fri wali habit mein Tuesday miss hone par streak tootti hai, jabki wo due hi nahi tha. Fix: `isHabitDueOnDate` se sirf due dates par chalo; non-due din skip karo.
- **Future-dated log.** `diffFromToday <= 1` negative value par bhi pass ho jaata hai. Fix: `diffFromToday >= 0 && diffFromToday <= 1`.
- **Default return nahi.** `evaluateHabitSuccess` ke `switch` ke baad kuch return nahi hota. Fix: `return { isSuccess: false, progressRatio: 0 }`.
- **Checklist progress 1 se upar ja sakta hai** (stale item ids). Fix: `Math.min(1, ...)` teeno branches mein.
- **`LESS_THAN` mein 0 fail maana jaata hai** (`current > 0` shart). "0 cigarettes < 3" success hona chahiye ya nahi, ye design decision lo.
- **SKIPPED ka rule tay nahi.** Abhi har non-COMPLETED log streak todta hai. Tay karo: skip neutral hai ya streak todta hai.
- **Stored `currentStreak` stale ho jaati hai.** Din guzar jaye aur log na ho, to DB mein purani value rehti hai. Fix: streak display time par compute karo.
- **Import problem.** `STREAK_CHALLENGES` `iconsAndColors.ts` se aata hai, jo React + lucide kheenchta hai. Fix: `constants/gamification.ts` banao.

### dateMath.ts

- **`parseISO` ke aas-paas try/catch bekaar hai**, kyunki wo throw nahi karta, `Invalid Date` deta hai. Fix: `isValid()` check.
- **`DAYS_PER_PERIOD` hamesha `true` deta hai** aur `daysPerPeriod.targetCount` kahin evaluate nahi hoti.
- **`getTodayKey()` timezone aur midnight.** Device timezone badle ya app raat bhar khuli rahe to date stale. Fix: ek `useToday()` hook jo midnight par refresh ho.
- **`parseHMSToSeconds`** fractional values floor nahi karta. Fix: `Math.floor`.

### firestoreCleaner.ts

- **Firestore special types toot jaate hain.** `Timestamp`, `GeoPoint`, `DocumentReference`, `serverTimestamp()`, `increment()` sab `object` hain; cleaner unhe plain object bana deta hai. Fix: sirf plain objects (`Object.getPrototypeOf(obj) === Object.prototype`) recurse karo, baaki jaisa hai chhod do.
- **Top-level `undefined` ko `null` bana deta hai**, par nested `undefined` hata deta hai. Ek rule rakho.
- **Array se `undefined` filter** karne par indexes shift hote hain. Tuples ke liye galat.

### colorUtils.ts

- `#EDEDE9` pehle hi return ho jaata hai, isliye `paleMap` ki wo entry kabhi chalti nahi.
- 3-digit hex (`#FFF`) aur 8-digit (`#RRGGBBAA`) handle nahi hote. `getContrastIconColor` 3-digit par galat white deta hai.
- Luminance formula simple hai, WCAG relative luminance nahi. Contrast accurate chahiye to gamma-corrected formula lo.

### useAppStore.ts (sabse zyada issues)

- **Week/Month/Year counts galat.** Teeno `allCompletedLogs.length` hain. Fix: `isDateInThisWeek/Month/Year` se filter karo, ya store mein na rakho, display time par compute karo.
- **XP logic.** Re-complete par dobara XP; COMPLETED log edit par `xpEarned: 0` se overwrite; complete se partial/skip par XP wapas nahi katta. Fix: log ka `xpEarned` preserve karo aur user ka total `delta = newXp - oldXp` se update karo.
- **Stale `get()` snapshot.** `logHabit` mein `const state = get()` ke baad awaits aate hain, phir purane `state.habits` se `set`. Yahi pattern `addHabit`, `addCategory`, `updateHabit`, `deleteHabit`, `skipHabit` mein hai. Fix: `set((s) => ({ ... }))` functional form.
- **`deleteCategory`** DB delete pehle karta hai, `isDefault` check baad mein. Fix: check pehle; us category ke habits `cat-others` par reassign karo.
- **`deleteHabit`** uske logs delete nahi karta (orphan logs). Fix: batch delete.
- **`skipHabit`** streak aur XP recompute nahi karta.
- **`consistencyScore`** onboarding mein 100 set hota hai, phir kabhi update nahi hota.
- **Offline.** `await DB` ke baad `set()` hota hai, to offline mein UI nahi badlega. Fix: optimistic update, phir DB write, fail par rollback.
- **`completeOnboarding`** dobara chale to XP 150 par reset; `currentUser` null par silent return. Fix: `profileLoading` flag, aur existing profile par kabhi overwrite nahi.
- **`selectedDate`** module load par ek baar set hoti hai.
- **`DEFAULT_CATEGORY.createdAt`** module load ka time hai; chhota issue.

### firestoreService.ts

- **`updateDoc` + cleaner.** Optional field hataane par cleaner use omit karta hai aur `updateDoc` purani value DB mein chhod deta hai. Fix: `setDoc(ref, cleaned)` (full replace) ya `deleteField()`. `updateDoc` doc na ho to throw bhi karta hai.
- **`onSnapshot` mein error callback nahi.** Rules ya network error chupchaap fail hoga. Fix: har subscribe mein `(err) => ...`.
- `subscribeUserProfile` mein `updatedAt` extra field type mein nahi hai.

### firebase.ts aur firebaseConfig.ts

- **Security rules.** Web API key public hoti hai, uski chinta nahi. Lekin `users/{uid}/**` par `request.auth.uid == uid` rule zaroor verify karo.
- `firebaseConfig.ts` dead file hai (placeholder keys), aur `firebase.ts` mein bhi `firebaseConfig` export hai. Ek hata do.
- Unused imports (`getDoc`, `setDoc`, `collection`, ...); `let firestoreInstance;` implicit `any` hai. Type do: `Firestore`.
- Offline persistence on nahi hai (advanced section dekho).

### habit.ts, IHabitRepository.ts, iconsAndColors.ts

- `IHabitRepository` kahin implement nahi hai, aur `getHabitLogs(userId, habitId)` store ke "saare logs ek map" model se match nahi karta. Use karo ya hata do.
- `HabitBreak.unlockedMilestones` kahin update nahi hota; `bestStreakSeconds` sirf relapse par badhta hai. Fix: display par `max(best, current elapsed)`.
- `schedule.totalDays` stored duplicate hai, `endDate` badalne par stale ho sakta hai.
- `NumericConfig.suffix: 'a day'` hardcoded type hai; period ke saath mismatch ho sakta hai.

## UI component issues

### Real bugs

- **AuthModal:** `useState(defaultMode === 'signup')` sirf pehli render par chalta hai, aur modal LandingPage mein hamesha mounted rehta hai. "Sign In" dabane par bhi Create Account khulta hai. Fix: `useEffect` jo `isOpen` par `isSignUp` set kare aur `error` clear kare; close par email/password clear.
- **OnboardingModal:** `user` null ho (profile abhi load nahi hui) to existing user ko bhi onboarding dikhta hai; "Enter Dashboard" par XP 150 par reset. Fix: store mein `profileLoading`; snapshot aane ke baad hi dikhao.
- **HabitDetailsModal calendar:** header `S M T W T F S` hai, par mahine ke pehle din ka offset nahi. 1 tareekh hamesha Sunday ke neeche. Fix: `getDay(monthStart)` jitne khaali cells pehle daalo.
- **HabitDetailsModal bar:** red hissa `100 - successRate` hai (PARTIAL bhi red), legend mein sirf skipped. Calendar mein PARTIAL ka rang nahi. "X / 10 Unlocked" `stats.unlockedChallenges` se, badges `bestStreak` se. Fix: ek source (`bestStreak`), PARTIAL ka alag segment.
- **HabitsView:** `isArchived` filter nahi; "All Habits (N)" mein archived bhi. Category delete hone par `selectedCatFilter` us id par atka rehta hai aur list khaali dikhti hai.
- **Input / Select:** `Math.random()` id har render par badalti hai. Fix: `React.useId()`. `Select` mein `error` prop bhi nahi.

### Medium / UX

- **Modal:** `overflow = 'unset'` cleanup se nested modal band hone par scroll lock hat jaata hai (counter chahiye). Escape key, `role="dialog"`, `aria-modal`, focus trap nahi.
- **CustomSelect:** modal body `overflow-y-auto` hai aur dropdown `absolute`, to menu kat sakta hai. Fix: portal ya `position: fixed`. Keyboard navigation (arrow, Enter, Escape) nahi.
- **DayStrip:** strip hamesha `selectedDate` ke around 15 din banata hai, to click karte hi poori strip khisakti hai. `scrollContainerRef` unused. `todayKey` midnight ke baad stale. Fix: alag `anchorDate`.
- **BottomNav:** `pb-[env(safe-area-inset-bottom)]` nahi (iPhone home-bar). Navbar ka "Add" aur bottom ka "+" dono mobile par dikhte hain. XP pill mobile par `hidden`, to mobile par XP dikhta hi nahi.
- **Logout:** `logOut()` store reset nahi karta; doosre user ko pichle user ka data kuch der dikh sakta hai. Fix: `onAuthStateChanged` mein `reset()`.
- **CreateCategoryModal:** Cancel par form reset nahi, duplicate names allowed, offline mein "Saving..." atak sakta hai.
- **Button:** default `type` nahi, form ke andar bhoolne par submit. Fix: default `type='button'`.

### Copy aur code mismatch

- Onboarding: "unnecessary skips par points deduct honge", par `skipHabit` kuch deduct nahi karta.
- Landing: "XP based on difficulty", par XP sirf streak aur priority se banta hai.
- Landing: "Will Initiate se Legendary Monk", par tiers `Legendary God` par khatam hote hain (Monk 500-day badge hai).
- Landing milestones hardcoded hain (`Unwavering` vs `Unwavering Pillar`). Fix: `STREAK_CHALLENGES` import karo.
- Onboarding mein Hinglish, baaki UI English. Ek language rakho.

### Chhote

- Unused imports: HabitDetailsModal (`CheckCircle2`, `XCircle`, `Clock`, `isSameMonth`), LandingPage (`Clock`, `Zap`, `BarChart3`, `Calendar`, `CheckCircle2`), DayStrip (`s``crollContainerRef bana hai par use nahi hota`).
- Calendar month modal dobara kholne par reset nahi hota.
- Landing par "Zero Mock Data" jaisi claims; verify karke rakho.

## Apne AI model se fix kaise karwana hai

Ek saath saari files fix karwane par model naye bugs banata hai. Isliye 5 chhote phase mein karwao: har phase ke baad app chalao, test karo, tab agla.

### Model ke liye rules (har prompt ke shuru mein paste karo)

```text
Project: HabitsSeen (React + TypeScript + Zustand + Firebase Firestore + date-fns).
Rules:
1. Sirf wahi files badlo jo is phase mein likhi hain. Koi refactor ya rename mat karo.
2. Har fix ke saath ek chhota test case (input aur expected output) likho.
3. Zustand mein await ke baad kabhi purana get() snapshot use mat karo; set((s) => ...) use karo.
4. Firestore mein undefined mat bhejo; Timestamp/FieldValue ko plain object mat banao.
5. Existing public function signatures mat badlo, jab tak likha na ho.
6. Aakhir mein batao: kya badla, kis file mein, aur kya test karna hai.
```

### Phase-wise order

1. **Phase 1: data safety.** `firestoreCleaner.ts` (sirf plain objects clean karo), `firestoreService.ts` (`updateDoc` ki jagah `setDoc`, `onSnapshot` error callback), `useAppStore.deleteCategory` (default category check pehle, habits `cat-others` par move).
2. **Phase 2: store correctness.** `logHabit` rewrite: functional `set`, XP delta se, log ka `xpEarned` preserve, week/month/year counts date filter se. Phir `skipHabit`, `deleteHabit` (logs bhi), optimistic update + rollback.
3. **Phase 3: streak engine.** Naya `constants/gamification.ts`; `computeHabitStreaks` ko schedule-aware banao (due dates par); future-date guard; `evaluateHabitSuccess` mein default return; display time par streak compute.
4. **Phase 4: auth aur onboarding.** `AuthModal` mode reset, store mein `profileLoading`, onboarding sirf tab dikhe jab profile load ho chuki ho aur `isOnboarded` false ho; logout par store reset.
5. **Phase 5: UI bugs.** Calendar offset, archived filter, `useId`, bar/badge source, Modal scroll counter + Escape, CustomSelect portal, DayStrip anchor, BottomNav safe-area.

### Phase 2 ka example prompt

```text
File: stores/useAppStore.ts. Sirf logHabit, skipHabit, deleteHabit badlo.
Kaam:
- logHabit mein const state = get() ke baad awaits ke bajay optimistic set((s) => ...) karo, phir Firestore write; fail par rollback.
- XP: newXp = isSuccess ? calculateXpForCompletion(...) : 0; delta = newXp - existingLog.xpEarned; user.totalXp += delta (minimum 0). Log mein xpEarned = newXp save karo.
- timesCompletedThisWeek/Month/Year ko isDateInThisWeek/Month/Year se filter karke nikalo (utils/dateMath.ts).
- skipHabit ke baad streak aur stats recompute karo.
Test cases: complete, partial, complete par XP sirf ek baar; complete se skip par XP wapas; purani date ka log is hafte ki count mein nahi.
```

### Model ke output ko verify kaise karo

- Har phase ke baad `tsc --noEmit` aur app chalao.
- Firestore emulator ya test project par check karo: field hataane par DB se bhi hataa, `serverTimestamp()` sahi save hua.
- Do browser tabs mein ek hi habit par quick logs karo: koi overwrite nahi hona chahiye.
- Network offline karke habit log karo: UI turant update hona chahiye.

## Advanced features aur enhancements

Pehle bugs fix karo, phir ye features. Har feature ke saath Effort likha hai; Low wale jaldi value dete hain.

### Habits aur streaks

| Feature | Kyun | Effort |
| --- | --- | --- |
| Streak freeze / grace day (mahine mein 1-2 skip bina streak toote) | Retention badhta hai; abhi ek miss par streak zero | Low |
| Weekly/monthly target progress (`DAYS_PER_PERIOD`): "3/5 is hafte" | Type mein hai par evaluate nahi hota | Medium |
| Past din ka backfill log (bhoole hue din bharna) | Streak sahi rehti hai | Low |
| Habit templates (Water, Gym, Reading) | Onboarding tez | Low |
| Notes ke saath daily journal view | `notes` field already hai | Low |
| Habit pause / vacation mode | Streak bina toote break | Medium |

### Analytics

| Feature | Kyun | Effort |
| --- | --- | --- |
| GitHub-style yearly heatmap | Ek nazar mein consistency | Medium |
| Weekday-wise success rate ("Sunday ko sabse zyada miss") | Actionable insight | Low |
| Asli `consistencyScore` (last 30 din ka due vs completed) | Abhi 100 par fixed | Medium |
| Weekly review summary (best habit, most missed) | Engagement | Medium |
| CSV / JSON export aur import | Data ownership | Low |

### Habit Break (sobriety timer)

| Feature | Kyun | Effort |
| --- | --- | --- |
| Milestone auto-unlock (1d, 7d, 30d) aur notification | `unlockedMilestones` abhi update hi nahi hota | Low |
| "Craving aaya" button aur trigger tag (stress, boredom) | Relapse se pehle pattern pakadna | Medium |
| Paisa bacha counter (cost per day) | Strong motivation | Low |
| Relapse reason ka insight chart | `relapseHistory.reason` already store hota hai | Medium |

### Technical / platform

| Feature | Kyun | Effort |
| --- | --- | --- |
| Firestore offline persistence (`persistentLocalCache`) + optimistic UI | Offline kaam, tez UI | Medium |
| Zod validation har Firestore read par | Corrupt data par app crash nahi | Low |
| Unit tests (Vitest) streak, XP, dateMath ke liye | Wahi bugs wapas na aayein | Medium |
| PWA install + push reminders (FCM) | Daily reminder, app jaisa feel | High |
| Cloud Functions mein XP / level calculation | Client se XP cheat na ho | High |
| Dark mode, accessibility (focus trap, aria, keyboard) | Quality | Medium |
| Error tracking (Sentry) aur loading / error states | Production debugging | Low |
| Friends / accountability streaks, leaderboard | Social retention | High |

### Suggested roadmap

1. **Hafta 1-2:** saare 12 critical bugs (Phase 1 se 4).
2. **Hafta 3:** unit tests, Zod, error states, streak freeze, backfill.
3. **Hafta 4-5:** heatmap, asli consistency score, habit break milestones, export.
4. **Baad mein:** offline persistence, PWA reminders, Cloud Functions XP, social features.

## Testing checklist aur pending files

### Fix ke baad ye sab test karo

- [ ] Habit complete, partial, phir complete: XP sirf ek baar mile
- [ ] Complete se skip: XP wapas kate, streak recompute ho
- [ ] Week/Month/Year counts alag-alag aur sahi dikhein
- [ ] Mon/Wed/Fri habit: Tuesday miss par streak na tute
- [ ] Aaj ya kal ka log ho to streak zinda; parson ka ho to zero
- [ ] Optional field (jaise description) hataane par DB se bhi hate
- [ ] `serverTimestamp()` wala field sahi save ho
- [ ] Default category delete na ho; baaki category delete par habits `Others` mein jaayein
- [ ] Habit delete karne par uske logs bhi hatein
- [ ] Landing par "Sign In" login form khole, "Get Started" signup form
- [ ] Existing user login kare to onboarding na dikhe aur XP wahi rahe
- [ ] Calendar mein 1 tareekh sahi weekday ke neeche
- [ ] Archived habit list aur count mein na aaye
- [ ] Offline mein habit log karo: UI turant badle, online aane par sync ho
- [ ] Logout, phir doosra user login: pichle user ka data na dikhe
- [ ] Raat 12 ke baad app khuli ho to `Today` aur selected date aage badhein

### Jo files review nahi ho payi

`HabitCard.tsx`, `CreateHabitModal.tsx`, `HabitBreakHub.tsx`, `OverallAnalyticsView.tsx` ka content upload mein nahi aaya. In files mein ye cheezein pehle check karwana: habit complete/skip ka flow, timer start/stop ka state, numeric validation, relapse ka confirm, aur analytics ke numbers (kya stored stats se aa rahe hain ya logs se, kyunki stored week/month/year counts galat hain). Paste karoge to inka alag section jod dunga.

### Firestore rules (verify karne wala)

Rules file mujhe nahi dikhi. Ye shape honi chahiye:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
