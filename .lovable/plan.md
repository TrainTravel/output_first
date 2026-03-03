# Oakley-Aligned Emotion Vocabulary System

## Overview

Redesign the emotion vocabulary experience to follow Barbara Oakley's learning science principles: **spaced repetition with diversity**, **chunking**, **retrieval practice**, and **building bridges from familiar to new**. The user sees a rotating selection of emotion words each session -- some familiar (reinforcement), some new (expansion) -- and the AI feedback connects new vocabulary to words the user already knows.

## Current State

- 16 emotion words across 4 categories (Calm, Uncertain, Heavy, Light)
- All 16 shown every session -- no rotation, no growth tracking
- AI feedback suggests precise alternatives but has no memory of what the user has seen before

## Design Principles (mapped to Oakley)


| Oakley Principle          | Implementation                                                                                                  |
| ------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Spaced repetition         | Track seen/used words; re-surface used words at intervals alongside new ones                                    |
| Chunking                  | Expand to 8 categories with 6 words each (48 total); show 4 categories per session                              |
| Retrieval practice        | AI feedback references words the user has seen before -- "Remember *accable(e)*? This might be a moment for it" |
| Declarative to procedural | First encounters show nuance explanation; encounters more than twice just show the word (building fluency)      |
| Metaphor/bridging         | AI uses the user's own journal content as the metaphor bridge to new emotion words                              |
| Daily micro-practice      | Show a "Vocabulary growth" indicator -- words encountered vs. words used in writing                             |


## Changes

### 1. Expand emotion vocabulary pool

**File: `src/types/journal.ts**`

Grow from 4 categories / 16 words to 8 categories / 48 words:

- Calm (6 words): peaceful, content, relaxed, settled, serene, grounded
- Uncertain (6): unsure, hesitant, questioning, searching, ambivalent, torn
- Heavy (6): tired, weary, drained, low, overwhelmed, burdened
- Light (6): hopeful, curious, grateful, present, energized, inspired
- **NEW -- Tender (6)**: vulnerable, moved, nostalgic, tender, compassionate, wistful
- **NEW -- Frustrated (6)**: irritated, impatient, stuck, restless, exasperated, defeated
- **NEW -- Anxious (6)**: nervous, apprehensive, on-edge, scattered, uneasy, panicked
- **NEW -- Connected (6)**: belonging, understood, supported, warm, included, cherished

Each word includes `en`, `fr`, `es` translations plus a new `nuance` field (short English explanation of when this word fits, shown on first encounters).

### 2. Create vocabulary tracker

**New file: `src/hooks/useEmotionVocab.ts**`

A hook backed by localStorage that tracks:

- `encountered`: Set of word keys the user has seen in the emotion picker
- `used`: Map of word keys to count of times the user selected them
- `lastSeen`: Map of word keys to date strings (for spacing)

Exposes:

- `getSessionWords()`: Returns 4 categories with 4 words each (16 words per session). Algorithm:
  - Pick 4 of 8 categories (rotate which 4 based on day-of-year, ensuring all categories appear within 2 days)
  - Within each category: 2 previously used words (retrieval) + 2 new or rarely seen words (expansion). If the user hasn't used enough words yet, fill with new ones.
- `markEncountered(words)`: Called when EmotionsScreen renders
- `markUsed(words)`: Called when user selects emotions
- `stats`: `{ totalEncountered, totalUsed, totalAvailable }` for the growth indicator

### 3. Update EmotionsScreen to use rotating vocabulary

**File: `src/components/journal/EmotionsScreen.tsx**`

- Import `useEmotionVocab` instead of static `EMOTION_SUGGESTIONS`
- Call `getSessionWords()` on mount to get today's rotation
- Call `markEncountered()` with displayed words
- Call `markUsed()` when user selects emotions
- Show a small "growth badge" at the top: "12 / 48 words explored" with a subtle progress ring
- For words the user is seeing for the first time, show the `nuance` tooltip on hover/tap (declarative learning). For familiar words, show just the word (procedural fluency).

### 4. Enhance AI feedback with vocabulary memory

**File: `supabase/functions/french-feedback/index.ts**`

Update the request body to accept `vocabularyContext`:

```
{ text, type, vocabularyContext: { encountered: [...], used: [...], recentlyLearned: [...] } }
```

Update the system prompt to:

- When suggesting precise emotion alternatives, **prefer words the user has encountered but not yet used** (bridging familiar to active)
- Occasionally **reintroduce** a word the user used 3+ sessions ago (spaced repetition)
- Frame suggestions as connections: "You wrote about feeling stuck -- you've seen *exaspere(e)* before. Does that capture it better?"
- Add a new optional JSON field `vocabularyBridge` to the response:

```json
"vocabularyBridge": {
  "word": { "fr": "...", "en": "..." },
  "connection": "brief sentence connecting this word to what they wrote",
  "isRevisit": true/false
}
```

### 5. Update FeedbackScreen to render vocabulary bridge

**File: `src/components/journal/FeedbackScreen.tsx**`

- Pass vocabulary context when invoking the edge function
- Render the new `vocabularyBridge` section with a distinct visual treatment:
  - Revisited words get a "You've seen this before" tag (retrieval cue)
  - New words get a "New word" tag
  - Show the connection sentence as a bridge metaphor

### 6. Show vocabulary growth on ProgressScreen

**File: `src/components/journal/ProgressScreen.tsx**`

- Import `useEmotionVocab` for stats
- Add a small "Emotion vocabulary" card showing words explored / total with a progress bar
- Frame it warmly: "Your emotional vocabulary is growing" (not gamified, aligned with the app's gentle tone)

## Technical Notes

- All vocabulary state lives in localStorage (key: `outputfirst_emotion_vocab`). No DB migration needed -- this is a personal learning aid, not shared data.
- The expanded word list stays in `src/types/journal.ts` as a static export (source of truth).
- The rotation algorithm uses deterministic seeding (day-of-year + user entry count) so refreshing the page shows the same words within a session.
- The edge function prompt change is backward-compatible -- if `vocabularyContext` is missing, behavior is unchanged.