# Changelog

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
