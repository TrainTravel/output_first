

# Surge Guardrail: Task Breakdown + Pomodoro Integration

## Problem
When the user finally overcomes inertia and starts, they try to do *everything at once* (hike + lift + clean). This "surge" leads to exhaustion and crashes. The solution: a gentle **"One Thing" task breaker** that helps decompose a big intention into small, measurable steps — then pairs each step with a Pomodoro/Sand Timer session.

## What it does

1. **New tab on SandTimerScreen**: Add a third tab — "Focus Plan" (bilingual: "Plan Focus / Focus Plan") alongside Sablier and Pomodoro
2. **Step 1 — Name the One Thing**: A single text input asking "What do you want to do?" (e.g. "Go hiking and lifting"). Low friction — just type and press Enter.
3. **Step 2 — Break it down**: The user taps "+" to add small steps (max 5). Each step is a short text (e.g. "Put on shoes", "Drive to trailhead", "Hike 30 min"). Pre-populated with a gentle suggestion: "What's the *smallest* first step?"
4. **Step 3 — Pick one & timer**: User taps a step → it highlights as "active" → a duration picker appears (reusing the existing Sand Timer or Pomodoro durations). Tapping start launches the hourglass for that step.
5. **Step completion**: When timer ends, the step gets a checkmark. The next unchecked step auto-highlights with "Ready for the next one?" prompt. User can stop anytime — no pressure to finish all steps.
6. **Done state**: Shows completed steps with checkmarks, a gentle "You did ___" summary. Option to save steps as a Brain Dump cluster for later.

## Design principles applied
- **Surge guardrail**: Forces choosing ONE thing before starting, then ONE step at a time
- **No numeric pressure**: Steps shown as dots/checkmarks, not "3/5 completed"
- **PDA-safe language**: "What do you want to do?" not "Set a goal". Steps not "tasks"
- **Micro-commitment**: Each step should feel trivially small ("just put on shoes")
- **Exit always available**: Can stop after any step without guilt messaging

## Technical changes

| File | Change |
|---|---|
| `SandTimerScreen.tsx` | Add `'focusplan'` to `Mode` type. Add third tab "Focus Plan". New state: `planGoal` (string), `planSteps` (array of `{text, done}`), `activeStepIdx` (number). Three sub-states within the focus plan: `naming` → `breaking` → `stepping`. When a step is selected, reuse existing `launchTimerFn` with a duration picker. On timer done, mark step complete and prompt next. Done state shows completed steps with checkmarks. |

Single file change — everything stays in SandTimerScreen.tsx. No new routes, types, or hooks needed.

## UI flow sketch

```text
┌─────────────────────────┐
│  Sablier │ Pomodoro │ Focus Plan │   ← tabs
├─────────────────────────┤
│                         │
│  What do you want to do?│   ← naming state
│  ┌───────────────────┐  │
│  │ Go hiking         │  │
│  └───────────────────┘  │
│       [Continue →]      │
├─────────────────────────┤
│  Break it into steps:   │   ← breaking state
│                         │
│  ○ Put on hiking shoes  │
│  ○ Drive to trailhead   │
│  ○ Hike for 30 min      │
│  [+ Add step]           │
│                         │
│  [Start first step →]   │
├─────────────────────────┤
│  ● Put on hiking shoes  │   ← stepping state (active)
│  ○ Drive to trailhead   │
│  ○ Hike for 30 min      │
│                         │
│   (duration picker)     │
│   ⏳ hourglass runs     │
│                         │
│  ✓ Put on hiking shoes  │   ← after timer done
│  ● Drive to trailhead   │   ← auto-highlights next
│  ○ Hike for 30 min      │
│  [Ready for next one?]  │
└─────────────────────────┘
```

