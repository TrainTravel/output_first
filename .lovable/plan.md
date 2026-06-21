# Circulation of Love — visual current pass

Purely presentational. No hook/data/testid/string-key changes. Edits 4 files: `src/index.css`, `LettersInCirculationScreen.tsx`, `ShareALetterScreen.tsx`, `HomeScreen.tsx`. `CirculationSettingsScreen.tsx` only touched if a small consistency tweak is warranted on view (toggles softened to match).

## Moves I'll make

**A. Paper, not card (pick: asymmetric hand-folded corners)**
On feed cards + opened-letter modal: swap `rounded-3xl` for `rounded-tl-[28px] rounded-tr-[18px] rounded-bl-[20px] rounded-br-[26px]`. Add a near-invisible warm paper wash: `bg-gradient-to-br from-card to-primary/[0.025]` and a soft resting shadow `shadow-[0_4px_24px_-12px_rgba(60,40,20,0.08)]`. Skip rotation + skip inner highlight — combining all three reads costume-y.

**B. One current, not 12 ticks**
Per-card inline style adds `animationDuration: ${10 + (i % 3) * 2}s` alongside the existing delay so cards drift past each other at 10/12/14s.

**C. Horizontal sway in the keyframe**
In `src/index.css` `@keyframes letterDrift`, nudge x values: 25% → `translate3d(3px,-3px,0)`, 50% → `translate3d(-3px,-5px,0)`, 75% → `translate3d(-4px,-2px,0)`. Rotation unchanged. Still gentle, still respects `prefers-reduced-motion` (existing media query already disables it).

**D. Negative space**
Feed grid: `gap-4` → `gap-6 sm:gap-8`. Outer wrapper `py-12` stays.

**E. CTA reworked as an invitation, not a modal**
"Join the current" card: remove hard border, use `bg-primary/[0.03]` with `rounded-[32px]`. Behind the text, 3 absolutely-positioned empty divs styled as ghost letters (`bg-card/40`, asymmetric corners, `opacity-20`, `animate-letter-drift` with offset delays/durations, `pointer-events-none`, `aria-hidden`). Heart stays but smaller and paired. Replace the default button with `rounded-full` pill variant on the existing `<Button>` via `className="rounded-full px-8"`.

**F. Opened-letter modal = unfolded paper**
Same asymmetric corners + paper wash + softer shadow `shadow-[0_8px_40px_-16px_rgba(60,40,20,0.18)]`. Pseudonym line gets `border-t border-primary/10 pt-3 mt-1` so it reads as a signature.

**G. HomeScreen tile hint**
Wrap tile contents in `relative overflow-hidden`. Add 2 `aria-hidden` ghost-paper divs (`absolute`, very small, `opacity-15`, asymmetric corners, no animation at this scale). Layout/testid/strings unchanged.

## Constraints honored

- No new deps, no new files, no new strings.
- All listed testids preserved verbatim.
- All 6-language bilingual maps unchanged.
- Reduced-motion already covers `animate-letter-drift`; ghost letters reuse that class so they're auto-stilled.
- Dark mode: only token-based colors (`card`, `primary`, `muted`) — both themes verified by token system.
- Mobile-first: gap increases, no horizontal layouts added; ghost shapes are `absolute` and clipped by `overflow-hidden`.
- Hooks `useLoveLetters` / `useCirculationSettings` / `usePseudonym` untouched.

## Verification

After implement: `browser--view_preview` at mobile width (390) and desktop (1024), both themes, with the opt-in CTA visible (no letters) and (mentally) with letters. Confirm drift feels like a current, not a grid.

## Final deliverable

One-paragraph summary in the closing message: what I kept, what I cut (rotation, inner-highlight, extra keyframe), and why (combining all paper-aesthetic moves crossed from "letter" into "prop").
