# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

**Application:** OutputFirst - A bilingual (English/French) journaling app for emotional awareness, gratitude practice, and thought organization. Designed with ADHD-friendly, low-friction UX principles.

### Key Architectural Patterns

**State Management:**
- `AuthContext` and `LanguageContext` for global state
- TanStack React Query for server state
- Custom hooks encapsulate complex logic:
  - `useJournal()` - journaling flow state across 13 steps
  - `useThoughts()` - brain dump thoughts management
  - `useClusters()` - thought clustering

**Bilingual System:**
- Use `t(fr, en).primary` for UI chrome (buttons, labels, helper text) — shows single language
- Use `bilingual(fr, en)` for vocabulary anchors (feature names, emotion terms, key concepts) — shows both languages
- Journaling prompts use `t().primary` (large) + `t().secondary` (italic) for structured display
- Language preference stored in localStorage and Context

**When to use which:**
```typescript
// Navigation, actions, status — single language
t('Continuer', 'Continue').primary

// Feature names, mental health terms — bilingual anchors
bilingual('Vide-tête', 'Brain Dump')
bilingual('Jardin de pensées', 'Thought Garden')
```

**Component Organization:**
- `src/components/journal/` - 13 screen components (HomeScreen, WriteScreen, etc.)
- `src/components/ui/` - shadcn/ui components (40+ Radix primitives)
- Screen components are pure UI; `JournalApp.tsx` handles orchestration
- `<ProtectedRoute>` wraps authenticated pages

**Journaling Flow:**
```typescript
type JournalStep = 'home' | 'write' | 'feedback' | 'emotions' | 'reflection' |
                   'gratitude' | 'complete' | 'chat' | 'braindump' |
                   'thoughtgarden' | 'clusters' | 'clusterdetail'
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
- `generate-embedding` - Vector embeddings for thoughts

Uses `LOVABLE_API_KEY` for AI integration via Lovable's AI gateway.

### Styling

- Tailwind CSS with custom theme (warm palette: sage green primary, terracotta accent)
- Typography: Cormorant Garamond (serif) + DM Sans (sans)
- Dark mode supported via `next-themes`
- Custom animations: fade-in-up, breathe

### Path Aliases

`@` maps to `./src` (configured in vite.config.ts and tsconfig.json)

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

## Important Notes

- Playwright E2E test suite in `e2e/` (25 tests, run with `npm run test:e2e`)
- CI workflow at `.github/workflows/e2e.yml` — runs on push/PR to main
- Dev server runs on `localhost:8080`
- Component tagging via `lovable-tagger` active in dev mode
- See `docs/CHANGELOG.md` for recent updates and design rationale
