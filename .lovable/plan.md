

# Sand Timer Widget

A visual sand timer that users can launch from the Home screen to externalize time — one of the key strategies from the executive dysfunction guide. Inspired by the hourglass image, it uses a CSS-animated "falling sand" effect with preset durations (1, 2, 3, 5 min), fitting the app's warm color palette.

## What it does

- Appears as a new button on the Home screen (e.g. "Sablier / Sand Timer")
- Opens a dedicated `SandTimerScreen` with 4 color-coded duration options (matching the reference image: red/1min, blue/2min, yellow/3min, green/5min)
- User taps a duration → an animated hourglass visualization counts down:
  - Top chamber empties (CSS `scaleY` shrinking from 1→0)
  - Bottom chamber fills (CSS `scaleY` growing from 0→1)
  - Gentle sand particle animation in the neck
- A subtle arc or progress ring shows remaining time without numeric pressure
- On completion: a soft chime sound effect + bilingual "Time's up" message + breathing circle invite
- Back button returns to Home at any time

## Technical changes

| File | Change |
|---|---|
| `src/types/journal.ts` | Add `'sandtimer'` to the `JournalStep` union |
| `src/hooks/useJournal.ts` | Add `openSandTimer: () => setCurrentStep('sandtimer')` |
| `src/components/journal/SandTimerScreen.tsx` | **New file.** Duration picker (4 pill buttons), animated hourglass SVG/CSS, countdown logic with `requestAnimationFrame`, completion state with gentle reward animation. Bilingual labels. |
| `src/components/journal/JournalApp.tsx` | Add `sandtimer` case rendering `SandTimerScreen`, pass `onOpenSandTimer` to `HomeScreen` |
| `src/components/journal/HomeScreen.tsx` | Add a Sand Timer button (using `Timer` or `Hourglass` icon from lucide) in the actions section |

## Design details

- **No numeric countdown** — uses visual fill level only (time blindness friendly)
- Hourglass shape built with CSS border-radius + clip-path, sand as gradient fills
- Colors map to the reference: Terracotta (1min), Primary/Sage (2min), Ochre (3min), a soft green (5min)
- Completion reward: the hourglass glows briefly + a bilingual message fades in
- Mobile-first, centered layout consistent with BreatheScreen

