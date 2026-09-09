# Phase 1: Tiny-Step Contract

A standalone tool for shrinking a task until it feels genuinely doable. Neurodiversity-affirming framing: difference, not deficit. Nothing here judges the user.

## The flow

1. **Name the step** — one line, free text, Enter submits.
2. **Confidence** — a slider: *Honestly, how likely is this? 1–10.*
3. **8 or higher** — warm confirmation, saved as a commitment. Done.
4. **Under 8** — *What would make it smaller?* The AI offers 2–3 smaller versions. The user picks one, writes their own, or skips. Then re-rates. The loop repeats until it clears 8 or the user taps *This is small enough*.
5. **Saved** with both the original wording/rating and the final wording/rating.

Deliberately absent in v1: no reminders, no done/not-done tracking, no streaks, no points, no failure state. Skip is available at every step.

**Past steps** — a read-only list reachable from the tool's header, newest first, with an archive action (never delete-only).

**Entry points** — a small entry inside Focus Plan, plus a secondary Home tile.

## Two things I'd flag

- **The slider itself.** A 1–10 slider is a fair bit of fine motor targeting on a phone. I'd render it as ten tappable dots (still 1–10, same data) so it works with one thumb and no dragging. Same semantics, lower friction. Say the word if you'd rather keep a true slider.
- **Loop guard.** If the AI's suggestions keep failing to clear 8, after the third round the app stops offering more and just says the step may not be the real blocker — offering *Save it as-is* or *Leave it for now*, with no implication the user failed. Prevents an infinite shrink spiral for someone already stuck.

## Technical notes

**Database** — one new table `tiny_steps`: `user_id`, `original_step`, `final_step`, `initial_confidence` (int), `final_confidence` (int), `source` (text), `archived` (bool), `created_at`, `updated_at`. RLS scoped to `auth.uid()` exactly like existing tables, grants for `authenticated` and `service_role`. No `status` field in v1.

**Edge function** — new `cbt-assist`, switching on a `mode` field. Only `shrink-step` is implemented; the switch and the shared prompt-context builder are structured so `mode: "reframe"` slots in later with no refactor, and a comment in the file records the Phase 2 intent (reframe as a native-speaker rendering that doubles as a vocabulary lesson, feeding the spaced-repetition vocabulary system; explicitly no distortion picker, no metaphor cards, no "your thought was distorted" framing). Uses the existing `_shared/auth.ts` guard, threads `targetLang` / `primaryLang` / `knownLangs` into the system prompt the way `reflection` does, and handles gateway 402/429/5xx with the app's standard friendly error copy.

**Client** — `src/hooks/useTinySteps.ts` for data, `src/components/journal/TinyStepScreen.tsx` for UI, a new `tinystep` step in the journal router, wired from `HomeScreen` and `FocusPlanScreen`. The confidence-threshold logic lives in a pure helper so it is testable without rendering.

**Language** — all text through `t()` / `bilingual()`, gentle phrasing throughout ("What would make it smaller?" — never "try again with a smaller step").

**Tests** — unit tests for the confidence-threshold state machine (clears at 8, loops under 8, honours the round-3 guard, records original vs final). Playwright spec: a step entered at confidence 4, shrunk via a suggestion, re-rated to 8, saved and visible in the past-steps list.

## Phase 2 (not built now)

Vocabulary-integrated reframe. Recorded only as a comment in `cbt-assist` so the architecture supports it; revisited after we see whether people complete the shrink loop and come back.
