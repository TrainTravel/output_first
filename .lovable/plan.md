

# Long-Press to Open Emotion Detail (Remove Info Icons)

Replace the info icon buttons with a long-press gesture on the emotion word pills themselves. A quick tap selects/deselects; a long press (~400ms) opens the detail drawer.

## Changes

| File | Change |
|---|---|
| `EmotionsScreen.tsx` | Remove the `<Info>` icon button entirely. Add `onPointerDown`/`onPointerUp`/`onPointerLeave` handlers to each emotion button: start a 400ms timer on down, clear on up/leave. If timer fires, open the drawer (and prevent the tap selection). Remove the extra `pr-7` padding. Keep the "new" dot indicator. |

No new dependencies needed — pure pointer events with a `setTimeout`.

