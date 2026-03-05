

# Friendly Access to Vocabulary Explorer

## Current State
- VocabularyScreen exists but is only reachable from the **Progress screen** (post-journaling completion)
- Users have no way to casually browse their vocabulary outside the journaling flow

## Proposed Entry Points (3 total, low-friction)

### 1. EmotionsScreen — "Explore all words" link
After the session's 16 words, add a subtle text link at the bottom: *"Explore all 48 words →"*. This is the most natural moment — the user is already thinking about emotions. Tapping it opens the Vocabulary Explorer, with a back button returning to the Emotions picker.

### 2. HomeScreen — Small "Vocabulary" card
Add a minimal entry below the existing action buttons (Brain Dump, Thought Garden, Zen Garden). A small card showing progress: *"12 / 48 words explored"* with a tap target to open the explorer. Keeps the home screen clean but gives returning users a reason to revisit words outside journaling.

### 3. ProgressScreen — Already exists (keep as-is)
The existing vocab growth card on the Progress screen already links to the explorer.

## Navigation Flow

```text
HomeScreen ──→ VocabularyScreen ──→ Back to Home
EmotionsScreen ──→ VocabularyScreen ──→ Back to Emotions
ProgressScreen ──→ VocabularyScreen ──→ Back to Progress
```

The `onBack` callback will vary by entry point so the user always returns where they came from.

## Changes

| File | Change |
|---|---|
| `HomeScreen.tsx` | Add `onOpenVocabulary` prop; render a small vocab progress card (Sprout icon + "X / 48 explored") |
| `EmotionsScreen.tsx` | Add "Explore all words →" link below the word grid, calling a new `onOpenVocabulary` prop |
| `useJournal.ts` | Wire `openVocabulary` to be callable from Home and Emotions screens; track return destination so `onBack` goes to the right place |
| `JournalApp.tsx` | Pass `onOpenVocabulary` to HomeScreen and EmotionsScreen |

No new screens or hooks needed — just more doors into the existing VocabularyScreen.

