

# Scaffolded Entry Points + Just-in-Time Vocabulary

## What Already Exists
- **Emotion wheel**: `EmotionsScreen` already shows 16 rotating emotion words with long-press for nuances — this IS the scaffolded emotion entry point
- **Sentence starters**: `PromptLibraryScreen` has fill-in-the-blank prompts like "Aujourd'hui je me sens ___ parce que ___" — this IS scaffolded sentence starters
- **AI feedback**: `french-feedback` edge function already detects vague words and suggests precise alternatives — partial overlap with Just-in-Time
- **Vocabulary bridge**: Already connects emotion words to journal content in feedback

## What's Missing

### Feature 1: Situation Prompts with Pre-loaded Vocabulary
Add a new prompt category in the Prompt Library: **"Situations"** — scenario-based prompts that come with 3-4 vocabulary words pre-loaded as chips above the writing area.

**Changes:**
- `src/types/journal.ts`: Add 5-6 `FillInPrompt` entries under a new `'Situations'` category, each paired with a `vocabulary` field (array of `{fr, en}` pairs)
- `src/components/journal/PromptLibraryScreen.tsx`: Add "Situations" to category list
- `src/components/journal/WriteScreen.tsx`: Accept an optional `preloadedVocab` prop. When present, render vocabulary chips above the textarea (tappable to insert the French word at cursor). Example: prompt "Describe a moment you felt proud" shows chips: `fier/fière`, `accomplissement`, `réussir`

### Feature 2: Just-in-Time Writing Assistance (Real-Time)
Add inline, non-intrusive vocabulary assistance while the user writes — detecting L1 (English) words in French text and vague words, offering upgrades without breaking flow.

**Changes:**
- `supabase/functions/french-feedback/index.ts`: Add a new `type: 'inline-assist'` mode — lightweight, fast prompt that returns suggestions for L1 words and vague words found in partial text. Uses tool-calling for structured output: `{l1Words: [{original, suggestions: [{fr, nuance}]}], vagueWords: [{original, upgrades: [{fr, collocation, nuance}]}]}`
- `src/hooks/useInlineAssist.ts` (new): Debounced hook (1.5s after last keystroke) that calls the edge function with current text. Caches results per text hash. Returns suggestions array.
- `src/components/journal/InlineAssistBar.tsx` (new): A subtle bar that slides up below the textarea when suggestions are available. Shows:
  - L1 detection: "You wrote **happy** → try **heureux/se** (general joy) or **ravi(e)** (delighted)"
  - Vague word upgrades: "**colère** → try **une colère sourde** (simmering anger) or **piquer une colère** (to fly into a rage)"
  - Tappable to insert the suggestion at the word's position
- Wire `InlineAssistBar` into `WriteScreen`, `FreeWriteScreen`, and `ExpressiveWriteScreen`

### Feature 3: Collocation Data in Emotion Detail Drawer
Enrich the existing `EmotionDetailDrawer` with French collocations for each emotion word.

**Changes:**
- `src/types/journal.ts`: Add optional `collocations` field to `EmotionWord` type — array of strings like `"une colère sourde"`, `"piquer une colère"`
- Add collocation data to the 48 emotion words in `EMOTION_SUGGESTIONS` (curated, not AI-generated — these are fixed linguistic patterns)
- `src/components/journal/EmotionDetailDrawer.tsx`: Render collocations section below the nuance text: "Common expressions" with each collocation as a styled chip

## Implementation Order
1. Situation Prompts (smallest scope — data + minor UI in WriteScreen)
2. Collocations in Emotion Drawer (data + small UI addition)
3. Just-in-Time Inline Assist (new edge function mode + new hook + new component + wiring)

## Technical Notes
- Inline assist uses a 1.5s debounce to avoid spamming the edge function while typing
- The `inline-assist` mode uses `gemini-2.5-flash-lite` (cheapest/fastest) since it only needs simple word detection
- Suggestions bar uses `animate-fade-in-up` and respects the app's warm color palette
- All text uses `t()` / `bilingual()` per the trilingual system
- No new database tables needed
- No new buttons on the home screen

## Verification
- Type check: `npm run build`
- Manual test: Write a journal entry mixing English words in French text → verify inline suggestions appear
- Manual test: Open Prompt Library → verify Situations category shows vocabulary chips
- Manual test: Long-press an emotion word → verify collocations section appears
- E2E: Add test for Situation prompt flow (select situation → verify vocab chips render → write → submit)

