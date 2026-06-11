## Body Scan — Abstract Aura Redesign

Remove the cartoon body SVG entirely. Replace with a soft vertical gradient "aura column" that the scan line travels through. Body-part labels float in space, anchored to vertical positions only.

### Visual concept

```
        Body scan
       Scan corporel

       ╭─────────╮
       │  ░░░░░  │   ← Head            (label fades in as scan passes)
       │  ▒▒▒▒▒  │
       │  ▓▓▓▓▓  │   ═══ scan line ═══  Chest    Poitrine
       │  ▓▓▓▓▓  │
       │  ▒▒▒▒▒  │   ← Belly
       │  ░░░░░  │
       │   ░░░   │   ← Legs
       ╰─────────╯

   Follow the light. Notice what you feel.
```

A narrow vertical column (~120px wide × 420px tall) filled with a vertical sage-green radial gradient — brightest at center, falling off softly to transparent at the edges. No outline, no body shape. The scan line is a horizontal soft-glow band that drifts top to bottom (existing animation kept). Labels appear to the left/right of the column at their vertical position, fading in as the scan crosses, lingering at 55% opacity afterward (existing behavior kept).

### Files changed

- `src/components/journal/BodyScanScreen.tsx` — remove the `<svg>` block (lines 60–110) including head circle, torso path, hand circles, and leg path. Replace with a single `<div>` aura column styled with a vertical linear-gradient mask + radial soft glow using `hsl(var(--primary))` at low opacity. Keep the existing scan-line `<div>` and the `BODY_PARTS.map` label rendering untouched.

### What stays

- 15s scan loop, 10s reveal delay for the continue button
- `BODY_PARTS` data and label positioning (yNorm/xPercent)
- Scan-line gradient + transitions
- Header, instruction copy, "I'm ready" button — unchanged

### Verification

- Visual check in preview at `/` → body scan step: no figure visible, only a soft glowing column; scan line still travels; labels still fade in/out at their positions.
- Confirm dark mode still reads well (column should glow, not look like a flat bar).
- No TS / lint errors.

### Out of scope

- No changes to `BODY_PARTS` data, copy, durations, or button behavior.
- No animation library additions.
