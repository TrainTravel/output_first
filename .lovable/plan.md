

# Add Long-Press Hint on Emotions Screen

Add a subtle hint below the "Choose up to X words" instruction text, telling users they can long-press to learn more. Show it only on the first few visits using localStorage, then fade it away.

## Changes

| File | Change |
|---|---|
| `EmotionsScreen.tsx` | Add a small muted hint line below the "Choose up to X words" text: *"Long-press a word to explore it"* (bilingual). Use localStorage to track if the user has opened the drawer at least once — after that, hide the hint permanently. Style: `text-xs text-muted-foreground/70` with a subtle fade-in. |

Single file change, no new dependencies.

