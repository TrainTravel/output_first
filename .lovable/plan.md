

# Add AI Feedback to Expressive Writing Flow

## Problem
Expressive writing entries bypass the FeedbackScreen entirely — `ExpressiveWriteScreen` calls `saveFreeContent` which saves and jumps straight to `complete`. No grammar checking or emotional granularity feedback occurs.

## Solution
Route expressive writing through the existing feedback flow instead of skipping it. After the self-care phase, save the content via `saveContent` (which stores it in `currentEntry` and navigates to `feedback`) instead of `saveFreeContent`.

## Changes

### `ExpressiveWriteScreen.tsx`
- In `handleSave`, call `onSave(content)` only when there's content (already does this)
- No changes needed to this file — the fix is in how it's wired

### `useJournal.ts`
- Add a new function `saveExpressiveContent(content: string)` that:
  - Sets `currentEntry` with the content (like `saveContent` does)
  - Navigates to `'feedback'` step
- This reuses the existing feedback → emotions → reflection → gratitude flow

### `JournalApp.tsx`
- Change `ExpressiveWriteScreen`'s `onSave` prop from `saveFreeContent` to `saveExpressiveContent`
- Wire `saveExpressiveContent` from the hook

### `useJournal.ts` — return value
- Export `saveExpressiveContent` from the hook

## What this preserves
- The self-care phase still shows after writing (it's inside `ExpressiveWriteScreen`)
- Session counter still increments in localStorage
- After self-care, the user hits "Continue" → entry goes through FeedbackScreen → EmotionsScreen → ReflectionScreen → GratitudeScreen → complete (the full guided flow)

## No new files needed
Reuses existing `FeedbackScreen` and the guided journal pipeline entirely.

