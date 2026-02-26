

## Make Progress More Visible on the Home Screen

Right now, progress is hidden behind a small ghost button at the bottom of the home screen. Most users never tap it. The fix: bring the key stats directly onto the home screen so users see their streak and total days every time they open the app — no extra tap needed.

### What Changes

**1. Add an inline progress summary card to HomeScreen**

Replace the bottom "View progress" ghost button with a compact, always-visible progress card placed between the status badge and the action buttons. It will show:
- Streak (flame icon + day count)
- Total days journaled (calendar icon + count)
- A subtle tap target to see the full progress screen

This card uses the same warm styling as the rest of the app (rounded corners, gentle shadow, bilingual labels).

**2. Pass streak and totalDays to HomeScreen**

The `HomeScreen` component currently doesn't receive streak/totalDays props. We'll add them from `useJournal` (already available in `JournalApp`).

### Files to Change

- **`src/components/journal/HomeScreen.tsx`**
  - Add `streak` and `totalDays` to props interface
  - Replace the bottom "View progress" ghost button with an inline stats card showing streak + total days, with the card itself still clickable to open the full progress screen
  
- **`src/components/journal/JournalApp.tsx`**
  - Pass `streak` and `totalDays` props to `HomeScreen`

### Design Details

The progress card will be a horizontal two-column layout (matching the ProgressScreen grid style) but more compact — showing the flame icon with streak count and calendar icon with total days. Bilingual labels underneath. The whole card is tappable to navigate to the full progress view, keeping it low-friction.

This follows the ADHD principle of "visible progress" — users see their streak every time they open the app without needing to remember to check it.

