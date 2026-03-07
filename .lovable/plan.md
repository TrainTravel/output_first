

# Pomodoro Timer + Sand Timer Physics Fix

Two changes in one: fix the sand timer's gravity physics and add a Pomodoro mode that integrates into the same screen.

## 1. Sand Physics Fix

**Current bug**: The top sand rect is anchored at `y=10` and shrinks its height — visually the sand disappears from the bottom up (defying gravity). The bottom sand rect grows downward from the neck. Both are wrong.

**Fix**: 
- **Top chamber**: Keep height = `128 * (1 - progress)` but shift the rect's `y` so it always sits at the *bottom* of the top chamber. As progress increases, the sand surface drops: `y = 10 + 128 * progress`, `height = 128 * (1 - progress)`.
- **Bottom chamber**: The rect should always be anchored at the bottom (`y = 278 - height`), growing upward. This is already close but needs the y-anchor fixed to `278 - 128 * progress` with height `128 * progress` — which is what's there, so the bottom is mostly correct. The top is the main issue.

## 2. Pomodoro Mode Integration

Add a **Pomodoro tab/toggle** to the existing SandTimerScreen so users can switch between "Sand Timer" (free durations) and "Pomodoro" (structured work/break cycles).

### Pomodoro behaviour
- **Work interval**: 25 min (customizable: 15, 20, 25)
- **Short break**: 5 min
- **Cycle**: Work → Break → Work → Break... up to 4 rounds
- Visual: reuses the same hourglass SVG, but shows a small **round counter** (e.g. "2 / 4" as dots, not numbers) and a label ("Focus" / "Break") 
- On work completion: hourglass glows + bilingual "Break time" message, auto-starts break timer
- On break completion: "Ready to focus?" prompt with a button to start next round or finish
- After 4 rounds: congratulatory message + done

### UI structure
- Add a **tab row** at the top of the picking state: "Sablier | Pomodoro"
- Sablier tab = current duration picker (1/2/3/5 min)
- Pomodoro tab = round count selector (2 or 4 rounds) + work duration selector (15/20/25 min)
- Running state reuses the hourglass but adds:
  - A subtle label above: "Focus" or "Pause" (bilingual)
  - Dot indicators below for round progress (filled = completed)

### Technical changes

| File | Change |
|---|---|
| `SandTimerScreen.tsx` | Fix top-chamber sand rect y-position for correct gravity. Add `mode` state (`'sand' | 'pomodoro'`), Pomodoro config (rounds, work/break durations), round tracking, auto-transition between work/break phases. Add tab switcher in picking state. Add round dots + phase label in running state. |

Single file change — all logic stays in SandTimerScreen.

