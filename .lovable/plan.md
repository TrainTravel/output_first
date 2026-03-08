

# Move "One Thing at a Time" Button Under "Write Today"

Simple reorder: move the Focus Plan button from line 180-183 to right after the "Write today" button (after line 146), and keep its accent styling so it stands out as a secondary CTA.

## Change

| File | Change |
|---|---|
| `HomeScreen.tsx` | Remove the Focus Plan button from its current position (line 180-183). Insert it immediately after the "Write today" `Button` (after line 146), before "Free Write". |

The button keeps its current accent styling (`bg-accent text-accent-foreground`) to visually pair it with the primary "Write today" button as the two most important actions.

