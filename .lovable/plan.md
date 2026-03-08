

# Show Badges on Home Screen

Add a badge display row inside the Progress Card, showing all 6 badges (BADGES constant) with earned ones highlighted and unearned ones greyed out. This creates a visual "progress bar" effect that motivates users to keep writing.

## Design

Inside the existing Progress Card (lines 88-128), add a row of badge icons after the words/badge-name section. All 6 badges are shown as emoji circles — earned badges are full color, unearned ones are faded with a lock-like opacity. This keeps the display compact and immediately communicates progress.

```text
┌─────────────────────────────┐
│ 🔥 3 Streak    📅 12 Days  │
│─────────────────────────────│
│ 150 words written           │
│ 🌱 ✍️ 🎙️ 📖 🌿 🌳        │  ← badge row (earned = bright, unearned = dim)
└─────────────────────────────┘
```

## Changes

| File | Change |
|---|---|
| `HomeScreen.tsx` | Import `BADGES` from `@/types/journal`. Add a badge row inside the progress card (after line 126), showing all badges with earned ones at full opacity and unearned ones at reduced opacity + grayscale. Include a small label like "50 / 200 words to next badge" for motivation. |

The badge row uses `flex flex-wrap gap-2` with each badge rendered as a `span` styled conditionally: earned badges get full opacity, unearned get `opacity-30 grayscale`. A "next badge" hint shows the threshold for the next unearned badge.

