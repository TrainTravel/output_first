# Changelog

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
### GDPR Account Deletion — 30-day soft-delete grace (Article 17)

**Right-to-erasure surfaced from a new AccountScreen.**

- New `AccountScreen` reachable from a footer "Account & data" link on `HomeScreen`.
- Destructive "Delete my account" button opens a confirmation modal explaining the 30-day undo window.
- On confirm: invokes `schedule-account-deletion` edge function (sets `profiles.scheduled_deletion_at = now() + 30 days`) and signs the user out.
- Returning within 30 days reveals a yellow banner "Your account is scheduled for deletion on {date}" with a one-click cancel that invokes `cancel-account-deletion`.
- **v1 limitation (no cron yet):** the AccountScreen itself triggers `hard-delete-account` lazily if the user returns *after* the deadline. A user who never returns is not purged until they do. Production should add a `pg_cron` job that invokes `hard-delete-account` for every row with `scheduled_deletion_at < now()`.
- New `profiles` table (1 row per `auth.users` row) with strict RLS — users can only see/modify their own row. **Migration must be applied (`supabase db push`) before merging.**

**ADHD-Friendly:**
- No dark patterns: deletion is a single confirmation, not a multi-step gauntlet.
- The grace window is generous (30 days) and the cancel path is one click — reduces panic-induced regret.
- The banner stays *visible* every time the user returns (Persistence) so the pending state doesn't fall out of mind.

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
