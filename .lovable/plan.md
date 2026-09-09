# Adapted CBT: Thought Reframe + Tiny-Step Contract

Two neurodiversity-affirming CBT tools, built on the app's existing calm/no-pressure language. Framing follows the source material: difference, not deficit. No diagnosis, no "you're wrong", no streaks or scores attached to either tool.

## 1. Reframe a thought

A short, one-question-per-screen card flow:

1. **What happened?** (optional one line — skippable)
2. **The thought** — what your mind said, in its own words
3. **Pattern** — the app gently names which of the ten common thinking patterns it might be (all-or-nothing, mind reading, fortune telling, should statements, mental filter, magnifying/minimising, overgeneralising, personalising, emotional reasoning, comparing). Tap to see a plain-language description; the user can change or clear the pick.
4. **A kinder, honest version** — the AI drafts one candidate reframe (short, in the user's language pair, never an affirmation, never disputing the feeling). Buttons: *Use this* / *Another one* / *Write my own*. The text lands in an editable box — the saved version is always whatever the user leaves there.
5. **Done** — a soft close, plus one optional strength metaphor card from the articles (paperweight, race-car brain and bicycle brakes, the switch), shown as reassurance rather than advice.

Skip is available on every step. Escape hatch back home at all times.

**Entry points**
- New Home tile: *Reframe a thought / Recadrer une pensée*.
- On Brain Dump items and in the Thought Garden: a "Reframe this" action that opens the flow with the thought text pre-filled at step 2.

## 2. Tiny-step contract

Reached from a task (Focus Plan / To-do / Quadrants A item) or standalone:

1. Name the step you intend to take.
2. Slider: *How likely is this, honestly? 1–10.*
3. If the answer is 8 or more — done, it's a commitment, warm confirmation.
4. If under 8 — the app asks "what would make it smaller?" and the AI offers 2–3 smaller versions of the step; the user picks or writes one, then re-rates. Repeat until it clears 8 or the user stops.
5. Saved with the confidence rating so the tool can later show "your steps get done when they start at 8+".

No nagging, no reminders, no failure state if the step doesn't happen.

## Where it lives

- New Home tile for Reframe; Tiny-step attaches to existing task screens plus a small entry inside Focus Plan.
- Both flows added as new steps in the app's screen router.
- Past reframes viewable in a simple list (newest first) from the Reframe screen's header — read-only, with an archive action, never a delete-only action.

## Technical notes

**Database** — two new tables, RLS-scoped to `auth.uid()` like existing tables, with grants for `authenticated` and `service_role`:

- `thought_records` — `user_id`, `situation`, `automatic_thought`, `distortion` (nullable text key), `reframe`, `source_thought_id` (nullable FK to `thoughts`), `archived`, timestamps.
- `tiny_steps` — `user_id`, `original_step`, `final_step`, `initial_confidence` (int), `final_confidence` (int), `status` (`open` / `done` / `let-go`), `source` text, timestamps.

**Edge function** — one new function `cbt-assist` with a `mode` field (`reframe` | `shrink-step`), mirroring how `todo-triage` already switches on mode, rather than two functions. It threads `targetLang`, `primaryLang`, `knownLangs` into the system prompt the same way `reflection` does, uses the existing auth guard from `_shared/auth.ts`, and returns structured JSON. Gateway 402/429/5xx handled with the same friendly, non-technical error copy used elsewhere.

Rule-of-three check: this is not a clone of `language-feedback`/`language-chat` (those are parameterised by target language for writing practice); `cbt-assist` is a distinct task family, and its two modes are parameterised inside one function.

**Content** — the ten patterns and the three metaphors live in a config array `src/data/cbt-distortions.ts` with EN/FR/ES/zh-Hans/zh-Hant strings, not in component code.

**Language** — all UI text through `t()` / `bilingual()`. Non-pathologising wording throughout: "patterns" and "experiences", never "symptoms", "risk", or "distorted thinking" as an accusation.

**Tests** — unit tests for the reframe step machine, the confidence-threshold logic, and the config data; a Playwright spec covering: Brain Dump → Reframe prefill → save, and a tiny-step that starts at 4 and gets shrunk to 8.
