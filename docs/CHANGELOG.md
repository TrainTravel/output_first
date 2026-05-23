# Changelog

## [Unreleased] - 2026-05-23

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
