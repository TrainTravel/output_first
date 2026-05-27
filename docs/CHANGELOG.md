# Changelog

## [Unreleased] - 2026-05-27

### Chrome translation — Thought Garden (~31 sites)

**Adds ja / zh-Hans / zh-Hant keys to ThoughtGardenScreen.tsx**, the largest single-file translation surface in the chrome sweep. Spun out as its own PR because the file's 31 sites would have made the bundled thought-management PR too big to review.

Files in this PR:
- `src/components/journal/ThoughtGardenScreen.tsx`
- `CLAUDE.md` — adds the new **Chrome Translation Conventions** section codifying register, S/T character split, fallback policy, and PR scope discipline (same content as PR #47)

The CLAUDE.md addition is duplicated across PR #47 and PR #48 by design — whichever merges first lands the content; the second rebase will detect the no-op and skip cleanly.

Register matches PR #40 + PR #44+: polite Japanese (です・ます), neutral Mandarin with S/T distinguished where they diverge.

---

### Chrome translation — write flow (WriteScreen + FreeWrite × 3)

**Adds ja / zh-Hans / zh-Hant keys to the four writing-entry screens** so journaling never silently falls back to English mid-session.

Files in this PR:
- `WriteScreen.tsx` — Back, "Useful vocabulary" label, placeholder, "Don't worry about mistakes." tagline, Continue
- `FreeWriteScreen.tsx` — Back, "Free Write" bilingual anchor, structureless tagline, placeholder, word/sentence helpers, Finish
- `FreeWriteChoiceScreen.tsx` — Back, "What kind of writing?" header + secondary, both writing-mode cards (Free Write + Expressive Writing) with descriptions
- `ExpressiveWriteScreen.tsx` — intro phase (3 reassurances + Start now), writing phase (Back, placeholder, words counter, Finish early), self-care phase (2 grounding lines + Session counter + Continue + "One moment...")

Register matches PR #40 + PR #44: polite Japanese (です・ます), neutral Mandarin with S/T distinguished where they diverge (继续/繼續, 字 is shared, 书写/書寫, etc.).

Cherry-picked from the larger sweep branch (`feat/chrome-translation-tier2-3`) as a reviewable per-flow PR. Native review pass still planned post-merge.
---
### Chrome translation — reflection flow (Reflection + Gratitude + Feedback)

**Adds ja / zh-Hans / zh-Hant keys to the three post-write reflection screens.**

Files in this PR:
- `ReflectionScreen.tsx` — Back, "Taking a moment to reflect..." loader, error-state Continue, response placeholder + optional-helper, "Finish with gratitude" bilingual anchor
- `GratitudeScreen.tsx` — Back, optional-skip helper, placeholder, Complete journal, Skip and finish
- `FeedbackScreen.tsx` — header "A moment of clarity", three section bilingual anchors (Naming with precision / A small note / Vocabulary bridge), Continue, Skip

Note: the hard-coded `isFr ? : isEs ? : ...` ternaries in ReflectionScreen and FeedbackScreen are pre-existing technical debt (they are not `t()` calls). They are outside the scope of this chrome-translation pass and are tracked separately.

Register matches PR #40 + PR #44.
---
### Chrome translation — thought management (Brain Dump + Clusters)

**Adds ja / zh-Hans / zh-Hant keys to the brain-dump capture and cluster-list screens.** ThoughtGardenScreen is large enough (~31 sites) that it gets its own PR.

Files in this PR:
- `BrainDumpScreen.tsx` — Back, thought counter, "Brain Dump" bilingual anchor, "One thought at a time" helper, Add button
- `ClustersScreen.tsx` — Back, "My Clusters" anchor, intro tagline, create-cluster input + button, Loading + empty states
- `ClusterDetailScreen.tsx` — Back, Cluster fallback title (2 sites), "Linked Thoughts" anchor, Loading + empty states, "Discuss this cluster" CTA

Register matches PR #40 + PR #44 + PR #45.

---

### Dev-mode warning for missing i18n translations

**Surfaces every `t()` / `bilingual()` call site that's silently falling back to English.**

`stringFor()` now logs `[i18n] Missing {lang} translation, falling back to en: "{en-value}"` to the dev console whenever a `ja`, `zh-Hans`, or `zh-Hant` key is requested but not present on the Translations object. Memoized per `(lang, en-value)` pair so the console isn't flooded by re-renders.

**Prod is unaffected.** The warning is gated on `import.meta.env.DEV`; the fallback string is still returned in both environments. This is purely an in-development visibility lever — not a behavior change.

**Why:** the "Write today / Write today" bug in PR #39 + the Spanish-using-French-CBT bug in PR #38 + the chrome-stays-English problem from PR #36 all share a root cause — silent fallbacks hiding incomplete translations. PR #39 fixed the most visible symptom (`bilingual()` dedupe). This PR adds the surveillance layer so future fallbacks are immediately visible during development, not discovered later by a user screenshot.

**Roadmap (not in this PR):** once Tier 2 and Tier 3 chrome translations land and CI is green for a sprint, the `ja` / `zh-Hans` / `zh-Hant` keys on the `Translations` type can be promoted from optional to required and the fallback branch deleted entirely. Until then, the warning is the early-warning system.

**Tests:** 5 new tests in `LanguageContext.test.tsx` cover: warning fires for missing ja key, warning fires for missing zh-Hant key, no warning when key is present, no warning for fr/en/es lookups, and dedupe behavior (3 lookups → 1 warning).

---

## [Unreleased] - 2026-05-26

### Chrome translation pass — Tier 1 (Home + Breathe + badges)

**First pass of Japanese / Simplified Chinese / Traditional Chinese keys on the highest-visibility chrome.** Pairs with PR #39's `bilingual()` dedupe — together they fix the "Write today / Write today" rendering you see when target=ja and primary=zh-* with no real translations.

What's translated in this PR (~40 strings × 3 langs = ~120 new keys):

- **HomeScreen** — sign-out button, hero subtitle, "Completed" badge, word counter, badge tooltips (via Badge type extension), "More tools" toggle, all secondary action `bilingual()` anchors (Brain Dump, Thought Garden, Free Write, One Thing at a Time, ABC List, Small Wins, Tiny Experiments, Zen Garden, Sand Timer), Emotion vocabulary card, "One or two sentences is enough." tagline
- **BreatheScreen** — Back, three breathing phases (inhale / hold / exhale), grounding prompt, "I'm ready" CTA
- **`BADGES` constant** — `Badge` type now accepts optional `ja`, `zh-Hans`, `zh-Hant` keys; all 6 badges (Seedling, Writer, Your Voice, Storyteller, Gardener, Sage) have CJK translations

**Deliberately out of scope (deferred to Tier 2 + Tier 3):**

- WriteScreen, EmotionsScreen, ReflectionScreen, GratitudeScreen, FeedbackScreen
- BrainDumpScreen body, ThoughtGardenScreen interior, ProgressScreen
- All settings / account / font / theme / language picker chrome
- Anything in `src/components/ui` (shadcn primitives)
- Error messages / edge-case toasts

**Tiered approach:** The full sweep would be ~350 sites × 3 langs = ~1050 strings of unreviewed AI translation. That's 100× the surface area of the Japanese prompts that already need native review. Tier 1 covers the 80% of visual weight without committing 1000 strings; Tier 2 ships only after Tier 1 + the Japanese prompts have had a native pass.

**Known follow-ups:**
- "French journaling practice" subtitle is hardcoded — translates literally but is semantically wrong for non-French targets. Future PR makes it target-aware.
- Word counter is split on `/\s+/`, which produces unreliable counts for Japanese / Chinese. Counter logic itself is a separate fix.
- Native (iTalki / Preply / r/translator) review is still planned for the Japanese and Chinese strings shipped here, same as PR #36's prompts.

---

### Spanish CBT scaffolding — fixes a latent routing bug

**Spanish learners were previously coached using French phrases.** Before this PR, `targetLang === 'es'` users fell into the French branch of the `cbtBlock` and `granularityBlock` in `language-chat` (a behavior preserved during the PR #36 consolidation, NOT introduced by it). Spanish journal entries would receive Cognitive Behavioral Therapy prompts in French (`"Quand ça s'est passé, quelle a été ta première pensée ?"`).

This PR adds a proper Spanish branch in both blocks:

- **granularityBlock** — Spanish vague-emotion examples (`mal → agotado, desanimado, abrumado`; `estresado → ansioso, desbordado, tenso`; etc.) instead of the French defaults.
- **cbtBlock** — the full 6-technique CBT scaffolding translated into Spanish, plus an explicit instruction to use `tú` (informal) rather than `usted` for the journaling/coaching register.

French CBT scaffolding stays as the explicit default fallback. No behavior change for any other language.

**Why:** Spanish was target-language #2 added to the app, but the original French edge function was never split. The bug only surfaced when the language-* consolidation reorganized the file. Catching it now keeps the granularity goal honest — coaching prompts should be in the target language, full stop.
---
### Bilingual rendering — dedupe identical sides, CTA gets Japanese + Chinese

**Fixes the "Write today / Write today" rendering when the active pair has no translation for either side.**

Two changes:

1. **`bilingual()` dedupes identical sides.** When `targetLang` and `primaryLang` resolve to the same string (typically because both fell back to English via the Translations fallback chain), the helper now returns the string once instead of `"X / X"`. Silent improvement for every call site across the app — no API change, no semantic change for pairs that legitimately differ (e.g. `fr / en`).

2. **HomeScreen CTA gets explicit Japanese, Simplified Chinese, and Traditional Chinese keys.** "Write today" / "Write another" now render correctly when the target is `ja` or the primary is `zh-Hans` / `zh-Hant`:
   - ja: `今日書きましょう` / `もう一度書きましょう` (polite, inviting register)
   - zh-Hans: `今天写日记` / `再写一篇`
   - zh-Hant: `今天寫日記` / `再寫一篇`

**Why partial:** the CTA is the most visually prominent bilingual call on Home, so it gets translations now. The rest of the chrome (`Brain Dump`, `Thought Garden`, `French journaling practice`, `More tools`, etc.) is silently improved by the dedupe alone — they no longer say `"Brain Dump / Brain Dump"` when both sides fall back. A future translation-pass PR will add `ja:` and `zh-*:` keys to the remaining anchors.

### Japanese language support — target-only

**You can now pick Japanese (日本語) as a learning target. Japanese is intentionally NOT offered as a primary/UI-chrome language yet — that requires a translation sweep across the codebase.**

What's wired:
- `日本語` appears as a card in "I'm learning" inside `LanguageSettingsScreen`.
- `LanguageToggle` displays `日` when target=ja, with English (or another primary) on the side.
- `t({ ..., ja: '...' })` and `bilingual({ ..., ja: '...' })` accept an optional `ja` key — when present, it is used; when absent, the lookup gracefully falls back to English.
- Edge functions (`language-feedback`, `language-chat`, `reflection`) recognize `targetLang: 'ja'` and prompt the model as a "Japanese learner" with readings (hiragana / romaji) for new vocabulary.

What's deferred (acceptable for v1):
- **Chrome stays English when target=ja.** Existing `t()` / `bilingual()` call sites have not yet been swept to add `ja:` keys — those return English via fallback. A future PR will translate the chrome.
- **IME composition handling** on text inputs is a separate follow-up. Pressing Enter mid-IME-composition (e.g. while picking a kanji candidate) will currently submit prematurely. Will be addressed in a focused PR.
- **Honorific tuning** in the AI prompts is intentionally simple ("Japanese learner" framing, plain/neutral register). Tone polish lives in the future translation pass.
- **Japanese-specific font** is not loaded — system fonts handle Japanese acceptably.

---

### Edge function consolidation — language-feedback + language-chat (was: french-* / chinese-*)

**Four edge functions collapsed into two generic ones parameterized by `targetLang`.**

Before: `french-feedback`, `french-chat`, `chinese-feedback`, `chinese-chat` — picked by the client based on the active target.
After: `language-feedback`, `language-chat` — single endpoints that branch internally on `targetLang` (`fr | es | zh-Hans | zh-Hant | ja`).

Behavior is preserved for fr/es/zh users; the language-specific prompt branches (pinyin guidance for Chinese, four-character idioms, French CBT scaffolding) are intact inside the consolidated functions.

**Deployment step (manual):**
```bash
supabase functions deploy language-feedback language-chat
supabase functions delete french-feedback french-chat chinese-feedback chinese-chat
```

The body shape is unchanged on the client side — old code paths kept `lang` in the body alongside the new `targetLang` field for forward-compat with any in-flight deployments.

---

## [Unreleased] - 2026-05-23

### t() / bilingual() — positional args → single Translations object

**API refactor — same return shape, self-documenting call sites.**

Replaced the positional signatures of `t` and `bilingual` with a single object keyed by language code. `t()` still returns `{ primary, secondary }`; `bilingual()` still returns `"{target} / {primary}"`.

Before:
```typescript
t('Continuer', 'Continue', 'Continuar', '继续', '繼續').primary
```

After:
```typescript
t({ fr: 'Continuer', en: 'Continue', es: 'Continuar', 'zh-Hans': '继续', 'zh-Hant': '繼續' }).primary
```

Why object form:
- Call sites are self-documenting — the key states which language each string is.
- Order mistakes (es vs zh-Hans) are now impossible.
- Adding a sixth language no longer ripples through every call site; just add a new optional key.

Scope:
- `LanguageContext.tsx` — new exported `Translations` type, single-arg signatures for both helpers.
- `LanguageContext.test.tsx` — 3 call sites updated; all language tests still pass.
- **350 call sites across 35 files** rewritten via AST codemod.
- Codemod kept at `scripts/codemod-t-object-form.mjs` for future similar refactors.
- `CLAUDE.md` "Bilingual System" examples updated to object form.

Single break, single PR — explicit decision to skip a dual-signature transition. This is the deferred follow-up from the language-pair refactor (PRs #25, #26).
---
### Vague-word frequency mirror — HomeScreen nudge for emotional granularity

**Surfaces a soft "you've named yourself X this many times this month" card when a user reaches for the same vague emotion word too often.**

The mirror reads from the existing `useEmotionVocab` storage (no new tracking system) and surfaces above the existing Vocabulary card on HomeScreen. It picks the top-qualifying word by:

1. Cumulative use count `>= 5`
2. Last used within the past 30 days
3. Word is in a curated `VAGUE_EMOTIONS` set (`tired`, `low`, `overwhelmed`, plus forward-compat: `fine`, `okay`, `good`, `bad`, `stressed`, `sad`, `happy`, `angry`, `anxious`, `numb`, `empty`)
4. Not currently in an active dismissal window

Tie-break is highest count, then most-recent `lastSeen`. Only one nudge shows at a time.

**Dismissal:** per-word, persisted in `outputfirst_freq_mirror_dismissed` as a `Record<word, ISO date>`. Suppresses that word for 14 days; other words can still surface.

**Routing:** "See alternatives →" reuses the existing `onOpenVocabulary` handler — no new screens, just a thematic on-ramp to the Vocabulary surface that already does the alternative-word work.

**Why this serves emotional granularity:**
- The mirror externalizes a pattern users can't see ("I've defaulted to 'tired' six times this month") without judging it — pattern-recognition without shame.
- Pairs naturally with the existing self-compassion seed: that one widens range from "bad" to "this is a hard moment"; this one widens range from "tired" to a more precise texture.
- Dismissable per-word (not global) because some weeks `tired` IS the right word, and forcing a global mute would punish self-knowledge.

**ADHD-Friendly:**
- Externalizes a slow-moving pattern that's invisible day-to-day (frequency over a month), addressing time blindness around emotional habits.
- One sentence, two clear actions, no forced action — matches the "one thing at a time" rule.
- Sits next to the Vocabulary card, so the cognitive jump from "I'm in a rut" to "browse alternatives" is one tap.

**Tests:** 21 unit tests in `useFrequencyMirror.test.ts` (picker, threshold, recency, dismissal window, tie-break), 6 component tests in `EmotionFrequencyNudge.test.tsx` (render, dismiss persistence, alternatives callback, a11y), 4 E2E tests in `freq-mirror.spec.ts` (visibility on seeded vocab, dismiss, reload persistence, empty-state).

---

### Self-Compassion Practice — Neff's 3-step framework, wired into the journal flow

**Refocused on the core goal: improving emotional granularity by offering precise reframes for hard feelings.**

Kristin Neff's three-step self-compassion model is now woven into three surfaces:

- **HomeScreen** — daily "seed" card showing one phrase from today's step (Mindfulness, Common Humanity, or Self-Kindness). Dismissable for the day; returns tomorrow with a new phrase. Day-of-year-deterministic.
- **ProgressScreen** — collapsible practice card listing all 3 steps with prev/next navigation across all 24 phrases per language.
- **ReflectionScreen** — practice card opens automatically (`defaultOpen={true}`) when the user's emotion is in `HARD_EMOTIONS` (18 heavy/anxious/frustrated words). Hidden when the emotion is light.

**Defensive language handling:** phrase data covers fr/en/es. A new `asCompassionLang` helper falls back to `en` so the card still renders for `zh-Hans`/`zh-Hant` primary users without crashing. Chinese phrases are a future translation pass.

**Journal CTA bilingualism:** the "Écrire aujourd'hui" / "Write today" button now shows both target and primary languages (e.g. "Écrire aujourd'hui / Write today"), matching the bilingual treatment already used by Vide-tête / Brain Dump and Jardin de pensées / Thought Garden. Removes the inconsistency where the main CTA was the only single-language action.

**Why this serves emotional granularity:**
- Self-compassion phrases ARE granular reframes of "I feel bad" — "This is a hard moment. I notice it without judgment." names a texture that "bad" hides.
- `isStruggling()` is a vague-word detector: when the user picks a heavy word, the system responds with a more nuanced framing rather than just acknowledging.

**Coverage:** 28 pre-existing unit tests now wired; 6 E2E tests now passing (seed visibility + dismissal + reload, practice trigger + expansion, struggling-emotion-driven defaultOpen on ReflectionScreen).

---

### Garden Themes — ADHD/ASD-aware metadata, validation, and calm-first sort

**Three new metadata dimensions on every theme + runtime hydration validator**

The 10 garden themes are unchanged in identity, but every theme now carries three sensory-load tags so neurodivergent users can choose by load, not by aesthetic name alone:

- `arousal` — visual stimulation level (`low` / `medium` / `high`), proxied by HSL saturation and the primary-vs-accent gap
- `contrast` — perceived primary-vs-bg contrast (`low` / `standard` / `high`), relevant for photosensitivity and visual fatigue
- `intent` — emotional use case (`calming` / `balanced` / `energizing`)

Hydration is now validator-gated: a stored id like `"comic-sans"` (or any unknown string) falls back to `default` rather than poisoning state. Mirrors the `validatePair` pattern in `LanguageContext.tsx`. `localStorage.getItem` throwing (private mode, quota error) also falls back cleanly via `fp-ts` `Option`.

The selector gained a **sort mode toggle** persisted in `outputfirst_theme_sort_mode`:

- `palette` (default) — declaration order, the curated/creative ordering
- `calm-first` — themes sorted by `arousal` ascending then `intent` ascending, so a dysregulated user doesn't have to scan past saturated options to reach a soothing one

Each swatch now exposes `data-arousal` / `data-intent` attributes and an `aria-label` that includes intent and arousal verbally for screen readers. A small color-coded arousal dot is also rendered in the swatch.

**Reduced-motion respect:** `prefers-reduced-motion: reduce` now disables `animate-fade-in/up/scale-in/gentle-pulse/breathe/celebrate` plus the `.theme-card` hover scale transition. Color changes still apply instantly — only motion is suppressed.

**Tests:** 34 new tests covering hydration (default, valid, malformed/unknown, localStorage throws), `setTheme` persistence + classList management, sort mode persistence, calm-first ordering invariants, metadata population, and selector rendering / click behaviour.

**ADHD/ASD-Friendly:**
- Calm-first sort lets a dysregulated user find low-arousal options without scanning past saturated ones (decision fatigue ↓)
- Validator + Option-based hydration removes a class of "ghost state" bugs where an invalid stored value silently corrupted the theme system
- Reduced-motion support is table stakes for vestibular sensitivity and ASD sensory overwhelm
- `aria-label` exposes the sensory profile verbally so users on screen readers get the same affordance, not a downgraded one

---

### Language Toggle — visual refresh

**Stacked layout replaces the "EN → FR" arrow**

The previous toggle ("EN → FR") read as "translate from English to French" — the wrong mental model. The toggle now shows a stacked target/primary pair (target letter large, primary letter as small caption), with no arrow. On hover or keyboard focus, the toggle expands a labeled popover: "speak EN · learn FR" (verbs localized by primary lang: en/fr/es).

- Idle: 48×48 stacked button. Target dominant, primary as small uppercase caption.
- Hover / `:focus-within`: popover reveals via absolute positioning (no layout shift).
- Verbs localized by primary lang: en→{speak, learn}, fr→{parle, apprend}, es→{hablo, aprendo}.
- Aria-label and title contain no `→` character anywhere.
- One-tap flip behavior unchanged (still calls `toggleLanguage`).

**ADHD-Friendly:**
- The arrow implied directional transformation; the new layout reads as a *pair* — what you speak, what you're learning
- Target is the visual focal point (large letter), reinforcing "what this app is teaching me"
- Progressive disclosure: compact by default, expanded only on intent — doesn't compete for attention while writing

---

## [Unreleased] - 2026-05-21

### Language Pair Setting

**Split the single `lang` state into two independent preferences**

The app no longer conflates "what I'm learning" with "what I already speak." Each user now configures a pair:

- `targetLang` — the language being learned (`fr`, `es`, `zh-Hans`, `zh-Hant`)
- `primaryLang` — the fluent/native language used for chrome + glosses (`en`, `fr`, `es`)

Invariant: `targetLang !== primaryLang`, enforced at three layers (UI filter, single `setLangPair` setter with swap-or-fallback, Zod-style hydration validator that resets to default on conflict/malformed input).

**Defaults:**
- New users: `{ primary: 'en', target: 'fr' }`
- Storage key migrated from `outputfirst_language` to `outputfirst_lang_pair` (no in-place migration — no existing users on prod)

**New screen:** `LanguageSettingsScreen` reachable from a gear icon next to the language toggle on Home. Two sections (I'm learning / I already speak); the option that equals the other section's value is filtered out so the user cannot pick a conflicting pair. Commits on tap, no Save button.

**`LanguageToggle`:** kept as a one-tap shortcut, but now flips only `primaryLang` (cycles en→fr→es, skipping the current target). The pair invariant holds across every toggle. Gear icon opens the full settings.

**Edge functions:** `chinese-feedback`, `chinese-chat`, `french-feedback`, `french-chat`, `reflection` now accept `primaryLang` in the request body and thread it into the system prompt as `native ${primaryName} speaker`. Defense-in-depth fallback to `'en'` if the field is missing.

**ADHD-Friendly:**
- One screen, one decision per row, commit on tap — no multi-step form, no Save button
- Structural prevention of invalid state (the conflicting card is *not rendered*, not just disabled) avoids the "find what's wrong and fix it" friction
- One-tap primary flip preserved on the home toggle — the cheap action stays cheap
- Default pair (`en`/`fr`) chosen to put the learning language (French) as the visual anchor with English chrome — fewer cold-start decisions

---

## [Unreleased] - 2026-02-27

### Spanish Language Support

**Full trilingual support: French → English → Spanish**

- Language toggle cycles FR → EN → ES → FR
- Toggle button shows `FR`, `EN`, or `ES` label
- Spanish translations across all 17 screens and components
- Bilingual anchors in ES mode show `ES / EN` (e.g. "Volcado mental / Brain Dump")
- Emotion vocabulary and categories translated to Spanish
- Date formatting uses `es-ES` locale in Spanish mode
- Brain Dump rotating placeholders in Spanish

**ADHD-Friendly:** Spanish adds a third anchor language for multilingual users. The bilingual anchor pattern (feature name + English) keeps the English term visible as a universal reference point, supporting cross-language concept mapping.

---

## [Unreleased] - 2026-02-26

### 4-2-6 Breathing Pattern

- **Breathe in:** 4 seconds (circle grows)
- **Hold:** 2 seconds (circle stays expanded)
- **Breathe out:** 6 seconds (circle shrinks)
- Button reveal: 9 seconds

**ADHD-Friendly:** Structured breathing technique externalizes time and provides a calming rhythm. The hold phase creates a natural pause point.

---

### Improved Error Messages

**Technical:** Edge functions now return structured error responses with diagnostic codes.

- Error codes: `RATE_LIMIT`, `CREDITS_EXHAUSTED`, `API_KEY_MISSING`, `AI_AUTH_FAILED`, `AI_ERROR`, `INTERNAL_ERROR`
- Frontend displays error code in parentheses for easier debugging
- Helps identify whether issue is rate limiting, credits, or configuration

---

## [2026-02-25]

### Bilingual Display Refinement

**ADHD-Friendly Improvement:** Reduced cognitive overload by showing both languages only where it supports learning.

- Navigation buttons (Back, Continue, Skip) now show single language
- Action buttons and status labels show single language
- **Key vocabulary anchors remain bilingual** — feature names like "Vide-tête / Brain Dump" and "Jardin de pensées / Thought Garden" continue showing both languages

**Why this helps:**
- Pattern recognition is an ADHD strength — bilingual anchors let users map concepts across languages
- Reduces "translation lag" by keeping familiar terms visible in both languages
- Focuses dual-language display on vocabulary that matters (emotions, mental health terms)
- Removes visual noise from repetitive UI chrome

---

### Thought-Aware AI Chat

**Feature:** Chat with AI while it has context of your grouped thoughts.

- **Discuss all thoughts** — Button in Thought Garden header opens chat with your whole garden
- **Discuss a theme** — Chat icon on each theme group focuses conversation on that topic
- **Discuss a cluster** — Button in cluster detail explores connections between grouped thoughts

**How it works:**
- AI receives up to 20 of your thoughts (truncated for context)
- System prompt adapts based on mode:
  - *All*: AI picks emotionally significant thoughts to explore
  - *Theme*: AI focuses on the specific theme you selected
  - *Cluster*: AI helps articulate connections between thoughts you grouped
- Chat header shows context label and thought count badge

**ADHD-Friendly:**
- No need to re-explain your thoughts — AI already has context
- Focused conversations prevent scattered tangents
- Visual badge confirms AI knows what you're discussing
- One-tap entry from wherever you are in the app

---

## [2026-02-24]

### Authentication & Data Security

- Added email/password authentication via Supabase Auth
- Implemented Row Level Security (RLS) on all tables
- Protected routes require authentication
- Edge functions validate JWT tokens
- Migrated from anonymous IDs to authenticated user IDs

**ADHD-Friendly:** Single sign-in persists across sessions — no repeated friction.

---

### AI Theme Tagging for Thoughts

- Thoughts in Brain Dump are now auto-tagged with AI-generated themes
- Thought Garden groups thoughts by theme instead of semantic clustering
- Added "Tag new" and "Re-tag all" buttons for manual control
- Predefined theme categories keep organization consistent

**ADHD-Friendly:**
- Auto-organization removes the burden of manual categorization
- Visual grouping by theme reduces overwhelm when reviewing thoughts
- One-tap re-tagging gives control without complexity

---

## [2026-02-23]

### Brain Dump & Thought Garden

- **Brain Dump:** Quick capture for fleeting thoughts — one thought at a time, Enter to save
- **Thought Garden:** Visual review of captured thoughts with search and archive
- **Clusters:** Manual grouping for project-focused thought organization

**ADHD-Friendly:**
- Brain Dump has zero friction — no forms, no categories, just type and press Enter
- Rotating placeholder prompts reduce blank-page paralysis
- Recent thoughts fade in below input as gentle confirmation
- Archive (not delete) preserves thoughts without decision fatigue

---

### Reflection Cycles

- AI-generated compassionate reflections after journaling
- Follow-up questions invite deeper exploration
- Users choose: "Explore more" or "Move to gratitude"
- Maximum 3 cycles prevents infinite loops

**ADHD-Friendly:**
- Clear exit points prevent hyperfocus spirals
- Binary choices (explore vs. gratitude) simplify decisions
- Cycle dots show progress and remaining depth

---

## Design Principles

### One Thing at a Time
Each screen focuses on a single action. No multi-step forms, no complex navigation trees.

### Low Friction Defaults
- Enter submits (no hunting for buttons)
- Skip is always available (no forced completion)
- Auto-save where possible

### Visible Progress
- Streak counters and completion badges
- Cycle indicators during reflection
- Thought counts in gardens

### Bilingual as Learning, Not Translation
- Primary language leads, secondary supports
- Key terms shown bilingually as anchors
- Users learn vocabulary in context, not through translation exercises
