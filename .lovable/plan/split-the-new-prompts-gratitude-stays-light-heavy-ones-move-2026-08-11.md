# Split the new prompts: gratitude stays light, heavy ones move to Expressive Writing

## What's happening now

Eight new prompts were added to the gratitude rotation in `src/types/journal.ts`. Verified in the browser: today's rotation lands on "How has what you went through touched the people around you?" and renders correctly. But the heaviest ones (writing about a hard experience, stress causes, what you'd do differently) now appear on the daily gratitude screen — a screen the user reaches at the end of every ordinary journaling session, with no safety pause around it.

## What changes

### 1. Gratitude rotation keeps only the light prompts

`GRATITUDE_PROMPTS` keeps the four original prompts plus the two gentlest new ones:

- "Is there something you wish you had appreciated more before? Name it gently."
- "Where can you let a little gratitude in today, just enough to soften the stress?"

Total: 6 prompts in the daily rotation.

### 2. The six heavier prompts move to Expressive Writing

A new `EXPRESSIVE_PROMPTS` array holds the post-growth / stress-processing prompts:

- Is there a way your experience could help someone else?
- What causes you stress these days? Has that changed over time?
- How has what you went through touched the people around you?
- What would you do differently now, and why does that matter?
- If you're ready, write about a hard experience — what happened, and how it felt.
- What did you learn from it — good or bad? How does it live with you now?

Expressive Writing already has the right container: a private 20-minute session, an intro screen that frames it as "something deeply personal", and a mandatory self-care pause afterward.

**How the user meets them:** the Expressive Writing intro screen currently shows a fixed line. It gains an optional prompt below the existing framing — one drawn from `EXPRESSIVE_PROMPTS` — with a small "Another prompt" link to cycle, and a "Blank page" option to write without any prompt. Nothing is forced; the intro's existing 5-second auto-advance and "Start now" link stay as they are.

### 3. Long prompts auto-shrink

The gratitude heading currently uses a fixed `text-2xl md:text-3xl`. Prompts longer than ~70 characters step down to `text-xl md:text-2xl` so the text box stays visible above the fold on small phones. Same treatment on the Expressive Writing prompt line.

## Technical notes

- `src/types/journal.ts` — trim `GRATITUDE_PROMPTS` back to 6; add `export const EXPRESSIVE_PROMPTS: BilingualPrompt[]` with the six heavier prompts. All entries keep `en` / `fr` / `zhHans` / `zhHant`, matching the existing shape.
- `src/components/journal/GratitudeScreen.tsx` — derive the heading size from `promptText.primary.length`. Presentation only; no prop or hook changes.
- `src/components/journal/ExpressiveWriteScreen.tsx` — add `useState` for the selected prompt index (random on mount), render it in the `intro` phase, plus "Another prompt" and "Blank page" affordances. When a prompt is chosen it also renders as a small muted line above the textarea in the `writing` phase so it isn't forgotten mid-session. No change to `SESSION_DURATION_MS`, the RAF timer, or the self-care gate.
- No backend, hook, or edge-function changes.

## Verification

- Vitest: `GRATITUDE_PROMPTS` has 6 entries and contains none of the heavy strings; `EXPRESSIVE_PROMPTS` has 6; every entry in both arrays has non-empty `en`, `fr`, `zhHans`, `zhHant`.
- Unit test for the heading-size helper: short prompt → `text-2xl`, long prompt → `text-xl`.
- Browser check with a screenshot: gratitude screen at 420px shows a short prompt at full size and the text box above the fold; Expressive Writing intro shows a prompt with the cycle and blank-page options.
- `npm run lint` and `npm run build` clean.
