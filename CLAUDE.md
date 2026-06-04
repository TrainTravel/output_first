# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Lovable vs Claude Code

When planning any new feature, assess which tool fits first:

**Suggest Lovable when the task is primarily:**
- A new screen or page built from scratch
- Layout, spacing, or visual component structure
- UI iteration that benefits from seeing it in the browser immediately

**Use Claude Code directly when the task is:**
- Bug fixes, logic errors, or state management
- Tests (unit or E2E)
- Multi-file wiring or data flow
- Cleanup or hardening of Lovable-generated code
- Edge function / backend logic

**Default workflow:** Lovable to scaffold → Claude Code to harden, test, and fix.
Avoid both tools editing the same file in the same session without review.

## Build & Development Commands

```bash
npm run dev          # Start Vite dev server (port 8080)
npm run build        # Production build
npm run build:dev    # Development build
npm run lint         # ESLint on all files
npm run preview      # Preview production build
```

## Architecture Overview

**Stack:** React 18 + TypeScript + Vite + Supabase + Tailwind CSS + shadcn/ui

**Application:** OutputFirst - A multilingual journaling app for emotional awareness, gratitude practice, and thought organization. Supports English, French, Spanish, and Mandarin Chinese (Simplified + Traditional). Designed with ADHD-friendly, low-friction UX principles.

### Key Architectural Patterns

**State Management:**
- `AuthContext` and `LanguageContext` for global state
- TanStack React Query for server state
- Custom hooks encapsulate complex logic:
  - `useJournal()` - journaling flow state across 13 steps
  - `useThoughts()` - brain dump thoughts management
  - `useClusters()` - thought clustering

**Language Pair System:**
- Language config is split into two independent preferences: `targetLang` (language being learned: `fr`, `es`, `zh-Hans`, `zh-Hant`) and `primaryLang` (native/fluent language for UI chrome: `en`, `fr`, `es`)
- Invariant: `targetLang !== primaryLang`, enforced in the UI, in the `setLangPair` setter, and by a hydration validator
- Stored in `localStorage` under `outputfirst_lang_pair`; defaults to `{ primary: 'en', target: 'fr' }`
- `LanguageSettingsScreen` (reachable via gear icon on HomeScreen) lets users change the pair without a Save button — commits on tap
- `LanguageToggle` is a one-tap shortcut that cycles `primaryLang` (en → fr → es, skipping current target)

**Bilingual Display:**
- Use `t({ fr, en, es }).primary` for UI chrome (buttons, labels, helper text) — shows single language
- Use `bilingual({ fr, en, es })` for vocabulary anchors (feature names, emotion terms, key concepts) — shows both languages
- Journaling prompts use `t().primary` (large) + `t().secondary` (italic) for structured display
- `t` and `bilingual` take a single `Translations` object; `zh-Hans` / `zh-Hant` keys are optional and fall back to English

**When to use which:**
```typescript
// Navigation, actions, status — single language
t({ fr: 'Continuer', en: 'Continue', es: 'Continuar' }).primary

// Feature names, mental health terms — bilingual anchors
bilingual({ fr: 'Vide-tête', en: 'Brain Dump', es: 'Volcado mental' })
bilingual({ fr: 'Jardin de pensées', en: 'Thought Garden', es: 'Jardín de pensamientos' })
```

**Component Organization:**
- `src/components/journal/` - screen components (HomeScreen, WriteScreen, LanguageSettingsScreen, etc.)
- `src/components/ui/` - shadcn/ui components (40+ Radix primitives)
- Screen components are pure UI; `JournalApp.tsx` handles orchestration
- `<ProtectedRoute>` wraps authenticated pages

**Journaling Flow:**
```typescript
type JournalStep =
  | 'home' | 'breathe' | 'promptchoice' | 'promptlibrary'
  | 'write' | 'feedback' | 'emotions' | 'reflection' | 'gratitude' | 'complete'
  | 'chat' | 'braindump' | 'thoughtgarden' | 'clusters' | 'clusterdetail'
  | 'zengarden' | 'freewrite' | 'freewritechoice' | 'expressivewrite'
  | 'vocabulary' | 'smallwins' | 'sandtimer' | 'focusplan' | 'todolist' | 'tinyexperiment'
  | 'languagesettings';
```

### Supabase Backend

**Tables:**
- `thoughts` - Brain dump entries with ai_theme tagging
- `clusters` - Organized thought collections
- `cluster_thoughts` - Many-to-many relationship
- `proposals` - AI-generated proposals from clusters

**Edge Functions (Deno):**
- `reflection` - Generates compassionate reflections using Gemini 2.5 Flash
- `french-chat` - French conversation practice
- `french-feedback` - Feedback on French writing
- `chinese-chat` - Mandarin conversation partner (responds with pinyin + English gloss for key vocab)
- `chinese-feedback` - Feedback on Chinese writing (character corrections, grammar, vocab upgrades)
- `generate-embedding` - Vector embeddings for thoughts
- `speech-to-text` - Whisper-powered voice input (infra deployed, UI not yet wired; needs `OPENAI_API_KEY`)
- `todo-from-image` - Extract to-do items from an image
- `todo-triage` - AI-assisted task prioritisation

All edge functions accept `primaryLang` in the request body and thread it into the system prompt; fall back to `'en'` if missing.

Uses `LOVABLE_API_KEY` for AI integration via Lovable's AI gateway.

### Styling

- Tailwind CSS with custom theme (warm palette: sage green primary, terracotta accent)
- Typography: Cormorant Garamond (serif) + DM Sans (sans)
- Dark mode supported via `next-themes`
- Custom animations: fade-in-up, breathe

### Path Aliases

`@` maps to `./src` (configured in vite.config.ts and tsconfig.json)

## Coding Standards

### Option Pattern — Model Absence Explicitly

**Rule:** Use `fp-ts` `Option<T>` to represent values that may or may not exist, rather than `T | null | undefined`. This makes absence visible in the type system and forces callers to handle both cases.

```typescript
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';

// ✅ Prefer — absence is explicit in the type
const displayName = pipe(
  O.fromNullable(localStorage.getItem('user')),
  O.map(raw => JSON.parse(raw).email),
  O.getOrElse(() => 'Anonymous'),
);

// ❌ Avoid — null leaks silently through the call chain
const raw = localStorage.getItem('user'); // string | null
const name = raw ? JSON.parse(raw).email : 'Anonymous'; // easy to forget
```

**Core fp-ts utilities to know:**
- `O.some(value)` / `O.none` — construct an Option
- `O.fromNullable(x)` — wrap any `T | null | undefined` into `Option<T>`
- `O.map(f)` — transform the inner value if present
- `O.flatMap(f)` — chain operations that also return Option
- `O.getOrElse(() => default)` — extract with a fallback
- `O.isSome(o)` / `O.isNone(o)` — type-safe guards
- `pipe(value, O.fromNullable, O.map(...), O.getOrElse(...))` — compose safely

**When to apply:**
- `localStorage.getItem()` — always returns `string | null`
- Supabase query results (`.data` rows, `.single()` responses)
- Optional component props or config values
- Any function that may legitimately return nothing

**Use `Either<E, A>` for operations that can fail with a typed error** (not just absent):
```typescript
import * as E from 'fp-ts/Either';
// E.right(value) = success, E.left(error) = failure
```

---

### Duplication Watch — Rule of Three

**Rule:** Before copying an entire file as a sibling (e.g. `french-feedback/` → `chinese-feedback/`, `ScreenA.tsx` → `ScreenB.tsx` with the same shape), STOP and check: **is this the 3rd instance of a pattern?**

- **1st instance:** write it. No abstraction visible yet.
- **2nd instance:** tolerate the duplication. Two siblings might still diverge.
- **3rd instance:** STOP. Refactor to parameterize FIRST, then add the new instance as a config change instead of a new file.

**Why:** Late consolidations are expensive — they touch every existing copy, every caller, every test, and usually surface latent bugs (e.g. the Spanish-using-the-French-edge-function bug exposed during the 2026-05-26 `language-*` consolidation). Catching the pattern at copy #3 costs minutes; catching it at copy #5 costs hours and a risky migration.

**Don't generalize on copy #2.** "Duplication is far cheaper than the wrong abstraction" (Sandi Metz). Two near-twins may diverge in ways that defeat the abstraction. Wait for the third before lifting.

**Known parameterized patterns in this repo (extend, don't clone):**
- `supabase/functions/language-feedback/` + `language-chat/` — parameterized by `targetLang`. Adding a new target language = add to the `targetName` ladder, **NOT** a new edge function file.
- `LanguageContext.tsx` `Translations` type — adding a new language = one optional key, **NOT** a new helper.
- `COMPASSION_PHRASES`, `EMOTION_SUGGESTIONS`, `VAGUE_EMOTIONS`, `GARDEN_THEMES` — language/variant content lives in config arrays, not separate code paths.

**Spec / plan checklist question:** Every spec or plan for a non-trivial change must answer: *"Does this create a 3rd instance of an existing pattern? If yes, list the siblings and decide: parameterize OR justify the divergence."*

**Examples that would catch this rule:**
- "Add Korean as a target language" → DON'T create `korean-feedback`; extend the existing `language-feedback` `targetName` ladder.
- "Add a 4th cluster type" → DON'T copy `ClusterDetailScreen`; pass a config.
- "Add a 6th color theme" → already correct (themes live in `GARDEN_THEMES` config).

---

### Chrome Translation Conventions

**Rule:** When adding or modifying `t()` / `bilingual()` call sites that include CJK languages (`ja`, `zh-Hans`, `zh-Hant`), follow the register and structure conventions established across the Tier 1+2 translation sweep (PRs #40–#48).

**Japanese (`ja`):**
- Use polite register (です・ます形) by default — natural for adult journaling/coaching context
- Don't use 敬語 (keigo) — too cold for personal reflection
- Don't drop into plain form (普通形) unless the user does first
- Drop the `あなた` pronoun in supportive / emotional contexts — too direct/distant in Japanese supportive register
- Include furigana (hiragana readings in parentheses) for kanji a learner may not yet know, e.g. `嬉(うれ)しい`

**Chinese (Simplified `zh-Hans` / Traditional `zh-Hant`):**
- Modern, direct register; no Gen-Z slang
- **Distinguish Simplified vs Traditional characters** where they actually differ. Common splits in this codebase:
  - 继续 / 繼續, 跳过 / 跳過, 学 / 學, 体 / 體, 实 / 實, 关 / 關
  - 词 / 詞, 处 / 處, 内 / 內, 园 / 園, 浏览 / 瀏覽, 页 / 頁
- DO NOT auto-convert Simplified → Traditional — many characters are identical between the two scripts; preserve identity where it holds, split where it actually does. Verify each pair.

**Dynamic strings that NAME a language:**
- DO NOT translate literally (e.g. "French journaling practice" → 法語日記練習). When a string contains a fact (`"French"`) that is also in app state (`pair.target`), the string is wrong by design — translating it 5 ways propagates the wrong design.
- Derive from app state via a `LANGUAGE_NAMES` helper (planned; not yet implemented as of 2026-05-27). Until that helper exists, flag any such call site in the PR description so the user knows where the future refactor needs to land.

**Fallback policy:**
- `ja`, `zh-Hans`, `zh-Hant` keys on the `Translations` type are OPTIONAL. When omitted, `stringFor()` falls back to `en` and emits a dev-mode warning: `[i18n] Missing X translation, falling back to en: "..."` (PR #42).
- Eventually these keys will be promoted to required once all chrome is translated; the fallback branch can then be deleted entirely. Until then, treat the dev warnings as a TODO list of unswept call sites.

**Native review:**
- All AI-authored CJK translations are queued for native-speaker review (iTalki / r/translator / native colleague). Treat AI-authored translations as functional drafts, not final. The reviewer's findings should be filed as fix PRs, not retro-edits to the original translation PR.

**PR scope discipline:**
- Translation PRs should be small enough to review every string by eye. Rule of thumb: ≤ 8 files, ≤ 200 lines changed. Larger sweeps must be cherry-picked into per-flow PRs (Home, Write flow, Reflection flow, Thought management, etc.).

---

### Keep CI Green — Don't Let It Drift

**Rule:** Never merge a PR while CI is red on `main`, even if "your" tests pass. A red baseline destroys signal — once red is normal, every new regression is invisible until someone bisects 12 PRs of accumulated drift.

**Why:** E2E went red on 2026-03-08 and stayed red for 12 weeks (through 2026-06-04) because a single user-feedback fix (collapse "More tools") broke ~16 tests, and once red was "normal" the next four refactors (FreeWriteChoiceScreen insertion, progress card redesign, ProfileChip replacing LanguageToggle, PhilosopherQuoteDialog interaction) added their own breakages indistinguishable from the first. Fixing one PR's drift while it's still warm costs ~30 minutes. Unwinding 12 weeks of drift across 21 failures cost an afternoon plus near-certain merge conflicts.

**When you change UI flow or layout, do this in the same PR:**
- **Insert a screen between two existing ones** (e.g., `CenterChoiceScreen` between Home and Breathe): `grep -r` E2E for tests that navigate the old path — they're now broken even if your component compiles.
- **Collapse, rename, or move a HomeScreen button**: search `e2e/` for the old aria-label / text / role+name. Don't leave selector drift for Future You.
- **Remove user-visible copy that was uniquely used as a test selector** (e.g., "Série" on the progress card → numbers-only design): update the test in the same PR.

**Stable test selectors:**
- Prefer `data-testid="…"` for elements that E2E *navigates to*. Reserve text-based selectors for *assertions* (does the user see "Welcome"?), not *navigation* (click "Welcome").
- Text and aria-label selectors get rewritten in i18n sweeps; `data-testid` doesn't.

**Modal/a11y trap:** Modals that mark the page `aria-hidden` (Radix `Dialog`, `Sheet`, etc.) silently break `getByRole` queries against underlying buttons even though the element is "rendered." If a test lands on the `'complete'` step (or any step that auto-opens a modal like `PhilosopherQuoteDialog`), call `suppressPhilosopherQuoteDialog(page)` in `beforeEach`. Rolling that into `setupJournalMocks` is a one-line PR worth doing.

**Spec / plan checklist questions** (extend the Rule-of-Three checklist):
- *"Does this PR change the navigation graph, move a HomeScreen button, or rename a user-visible string that an E2E test selects by?"* If yes, list affected specs and update them in THIS PR.
- *"Is CI green on `main` right now?"* If no, fixing it is part of the PR scope unless explicitly carved out into a sibling `chore/e2e-…` branch.

**The deepest lesson:** green CI is a budget, not a goal. When it's green, the next regression is loud and bisectable. When it's red, every regression is silent. Most test-rot stories come down to that one phase transition — never let CI go red overnight.

---

## ADHD-Friendly UX Principles

This app is designed for neurodivergent users. Follow these principles when adding features:

**One Thing at a Time:**
- Each screen focuses on a single action
- No multi-step forms or complex navigation
- Clear, binary choices when decisions are needed

**Low Friction:**
- Enter key submits (no hunting for buttons)
- Skip is always available (no forced completion)
- Auto-save where possible
- Rotating placeholders reduce blank-page paralysis

**Visible Progress:**
- Show streaks, counts, and completion indicators
- Cycle dots during multi-step flows
- Gentle confirmations (fade-in recently added items)

**Bilingual as Learning:**
- Key terms (emotions, features, mental health vocabulary) shown in both languages act as "anchor points"
- Pattern recognition is an ADHD strength — bilingual anchors help users map concepts
- UI chrome in single language reduces visual noise

**Avoid:**
- Infinite scroll or endless options
- Requiring categorization before capture (Brain Dump first, organize later)
- Delete without archive option (preserve without decision fatigue)
- Forced linear flows without exit points

## Neuro-Inclusive Design Standards

**Addressing Time Blindness:**
- **Externalize Time:** Avoid invisible countdowns. Use visual anchors (progress bars, shrinking shapes) to show the "flow" of time.
- **Immediate Rewards:** Every "effort" step (writing, categorizing) must be followed by an immediate "reward" (animation, summary, or compassionate feedback) to bridge the "time chasm."
- **Chunking:** Break long processes into steps that take < 2 minutes.

**AI Interaction & Consistency:**
- **Clarity First:** If the AI (Gemini/Claude) generates a response, it must use "Supportive Scaffolding"—explaining complex terms or offering bilingual nuances (e.g., clarifying false friends like 'Forfait').
- **Persistence:** Important status info (e.g., "3 thoughts remaining to cluster") should remain visible to prevent "out of sight, out of mind" forgetting.

## Agentic AI Development & Iteration

**Core Philosophy:** Speed brings real information. Real information brings correct decisions. Correct decisions bring optimization. In the LLM era, perfect design never beats rapid iteration.

**1. The "Targeted Strike" Development Cycle:**
- **The Flow:** Build → Observe Traces → Error Analysis → Data-Driven Decisions → Targeted Optimization.
- **Anti-Pattern:** Do NOT "Think a long time → Design complex → Hope to get it right in one go". Avoid blind refactoring without data.

**2. Error Analysis (The 10-20 Rule):**
- When debugging AI features (reflection quality, clustering, embeddings), do not guess. Track 10–20 real failure cases.
- Categorize errors (Is it the Prompt? The Search? The Data?) and fix only the highest-percentage failure category first.

**3. Evaluation Starts Small (Anti-Procrastination):**
- Do not build complex automated testing or LLM-as-judge frameworks during the prototype phase.
- Rely on manual inspection and simple rule-based checks for the first 10–20 samples.
- Introduce complex evaluation only when the system is stable and patterns are clear.

**4. Quality First, Cost Later:**
- During prototyping, prioritize **Quality** over Cost.
- Do not prematurely optimize for API costs, latency, or token counts.
- If users grow and costs rise, that is a "good problem." Optimization (smaller models, caching, parallel calls) comes after value is confirmed.

## Git Workflow

**Always work on a feature branch — never commit directly to `main`.**

Before starting any code changes:
1. Create a branch: `git checkout -b <type>/<short-description>` (e.g. `feat/spanish-support`, `fix/breathe-animation`)
2. Make commits on the branch
3. When done, open a PR targeting `main` via `gh pr create`

Branch naming: `feat/`, `fix/`, `chore/`, `docs/`, `refactor/` prefix matching the commit type.

## Commit Conventions

**When committing code changes:**
1. Use conventional commit prefixes: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`
2. **Always update `docs/CHANGELOG.md`** for user-facing changes (features, UX improvements, bug fixes)
3. Changelog entries should explain the ADHD-friendly rationale when applicable
4. Separate concerns into multiple commits when appropriate

**Changelog format:**
```markdown
### Feature Name

**Brief description of what changed**

- Bullet points with specific changes
- Include entry points and user flows

**ADHD-Friendly:** (when applicable)
- Explain why this helps neurodivergent users
```

## 🍄 The "Pikmin" Logic (User Retention)
- **Object Permanence:** Thoughts are "Creatures." They must be visually persistent. If a user "harvests" a thought, it should live in the Garden forever.
- **Visual Urgency:** Use a "Sun/Moon" cycle for session timers to provide a non-anxiety-inducing external time reference.
- **Squad Goals:** Grouping/Clustering should feel like "gathering your team." Use distinct colors (Sage, Terracotta, Ochre) to distinguish thought types.

## 🧠 Biometric Empathy & Contextual Validation Guidelines

**Core Philosophy:** OutputFirst does not track metrics to judge productivity; it tracks context to validate the user's current cognitive state.

**1. The "Rhythm of the Day" Rule:**
- **Validation over Judgement:** If the app detects high-frequency loops or high BPM music (via future API integrations), the UI should interpret this as a need for focus/stimming, not distraction.
- **Adaptive Arousal UI:** The interface must adapt its visual "noise" based on context. High user arousal = increase visual "Ma" (negative space) in the Garden.

**2. Passive Organization & Forgiveness:**
- **Zero Admin:** Users are never required to manually tag or organize. The AI handles all semantic clustering (The "Pikmin" Rule).
- **Grace Re-entry:** Absence is treated as a natural cycle. If a user returns after a week, display a "Warm Recovery" message (e.g., "Le jardin t'attendait / The garden was waiting for you"). No red notification dots or broken streak counters.

**3. Externalized Executive Function:**
- **Visual Anchors:** Always use visual, non-numeric indicators for time (e.g., a moving sun, a filling bamboo pipe) to combat time blindness.
- **Immediate Closure:** Every completed task "chunk" must immediately trigger a low-friction reward (e.g., a "Bloom" animation or a Haiku summary).

**4. ADHD Music Listening Research (informs future audio/context features):**

| Pattern | Research Finding | Why it matters for UI |
|---|---|---|
| High Frequency Use | ADHD individuals listen to background music significantly more often than neurotypicals, especially during "boring" tasks. | Treat active music listening as a signal of productive effort, not distraction. |
| Preference for Stimulating Tracks | Strong preference for upbeat, heavily modulated music (high BPM, complex textures) even during cognitively heavy tasks. | High-energy music context = executive function is "online." UI should match that arousal, not suppress it. |
| The "Stimming" Repeat | Song looping (one track on repeat for hours) provides a predictable sensory anchor that quiets internal mental noise. | Never interrupt or suggest changing a looping track. Treat repetition as self-regulation, not stuck behavior. |
| Lyric-Free Superiority | Instrumental music with beta-range modulations (12–20 Hz) is most effective for sustained attention. Lyrics compete with reading/writing brain regions. | Future writing prompts could suggest instrumental playlists. Flag lyric-heavy contexts as higher cognitive load. |

## 💰 Ethical Monetization Principles
- **No Dark Patterns:** Never use "loss aversion" (e.g., losing progress) to force a payment.
- **Privacy First:** If selling "Cognitive Insights," the data must be processed securely and never sold to third parties.
- **Transparency:** Clearly distinguish between "Core Utility" (Free) and "Premium Experience" (Paid).

## Self-Improvement

After every correction or mistake, update this CLAUDE.md with a rule to prevent repeating it.

End corrections with: "Now update CLAUDE.md so you don't make that mistake again."

Keep iterating until the mistake rate measurably drops.

## Working with Plan Mode

- Start every complex task in plan mode (shift+tab to cycle)
- Pour energy into the plan so Claude can 1-shot the implementation
- When something goes sideways, switch back to plan mode and re-plan. Don't keep pushing.
- **Verification section is mandatory in every plan** — must include: type check, new unit tests for all new logic, new E2E tests for new user flows, and a regression check that runs the *full* E2E suite (not just the new tests). "Existing tests still pass" alone is not sufficient — you must also confirm you haven't *added* to a red baseline. See [Keep CI Green — Don't Let It Drift](#keep-ci-green--dont-let-it-drift).

## Parallel Work

- For tasks that need more compute, use subagents to work in parallel
- Offload individual tasks to subagents to keep the main context window clean and focused
- When working in parallel, only one agent should edit a given file at a time
- For fully parallel workstreams, use git worktrees:
  `git worktree add .claude/worktrees/<name> origin/main`

## Things Claude Should NOT Do

- Don't use `any` type in TypeScript without explicit approval
- Don't skip error handling
- Don't commit without running tests first
- Don't make breaking API changes without discussion
- **Don't ship a feature without writing tests for its new logic** — new step transitions, derived state, and user flows all need unit and/or E2E coverage in the same PR
- **Don't open or push a PR that adds a new E2E failure to an already-red baseline** without flagging it explicitly. Run the full E2E suite locally and diff failures against `main`. If `main` is red, fix or carve out the rot first — silence is how 12 weeks of drift accumulates.
- **Don't navigate E2E tests by user-visible text or aria-label when a `data-testid` would do.** Copy gets rewritten; testids don't.

## Backlog / Future Ideas

- ~~**Free journaling mode**~~ — shipped in `feat/prompts-freewrite-badges` (PR #16). Optional AI and "graduate mode" polish still possible.
- **Voice input (Whisper)** — infra committed (edge fn + hook + button), UI not wired. Requires `supabase secrets set OPENAI_API_KEY` + `supabase functions deploy speech-to-text` before activation.
- **5 Whys root-cause analysis** — Claude artifact prototype exists (pasted session 2026-03-10). Uses `window.claude.complete()` → needs Supabase edge function. Natural follow-on to the ABC Todo List: surface as "Why am I avoiding this?" on a stuck/Category-A task. FR translations missing.
- **Chinese Learner MVP** — full plan in `.lovable/plan.md`. 5 phases: (1) language infra already done (zh-Hans/zh-Hant in `LanguageContext`, toggle, font stack); (2) Chinese emotion vocabulary (48 words with pinyin, `src/data/chinese-emotions.ts`); (3) journaling prompts + situation vocab chips (`src/data/chinese-prompts.ts`); (4) edge functions `chinese-feedback` + `chinese-chat` already deployed; (5) inline vocab assist (`chinese-inline-assist` edge fn + `InlineAssistBar` adaptation). Phases 2–5 still needed.

## Important Notes

- Playwright E2E test suite in `e2e/` (11 spec files: braindump, freq-mirror, home, journal-flow, language, navigation, prompts-freewrite, self-compassion, small-wins, todo-list; run with `npm run test:e2e`)
- CI workflow at `.github/workflows/e2e.yml` — runs on push/PR to main
- Dev server runs on `localhost:8080`
- Component tagging via `lovable-tagger` active in dev mode
- See `docs/CHANGELOG.md` for recent updates and design rationale
