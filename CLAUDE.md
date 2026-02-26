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

## Important Notes

- No test suite currently exists
- Dev server runs on `localhost:8080`
- Component tagging via `lovable-tagger` active in dev mode
- See `docs/CHANGELOG.md` for recent updates and design rationale
