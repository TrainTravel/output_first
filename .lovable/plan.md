

# Request Filter Ritual — Inside Focus Plan

A card-sorting exercise that helps users triage incoming demands (from others or themselves) before committing to their "One Thing." Users dump requests onto cards, then sort them into three buckets: **Yes**, **Expand** (negotiate/reframe), and **Not Now**. This acts as a demand-reduction gateway before the existing Focus Plan flow.

## User Flow

```text
Focus Plan Screen
  ├─ [NEW] Tab: "Filter" / "Filtre" / "Filtro"
  │     Phase 1: DUMP — type requests as cards (Enter to add, up to 8)
  │     Phase 2: SORT — drag each card into one of 3 columns:
  │       ✓ Yes (I'll do this)
  │       ↔ Expand (negotiate scope, reframe, or delay)
  │       ✕ Not Now (let it go for today)
  │     Phase 3: REFLECT — summary + gentle prompt:
  │       "You kept X, let go of Y. Pick your One Thing."
  │       → Tapping a "Yes" card pre-fills the Focus Plan goal
  └─ [EXISTING] Tab: "Focus" (current FocusPlanTab)
```

## Technical Plan

### 1. New component: `src/components/journal/RequestFilterTab.tsx`

- **Phase: `dumping`** — Input field + card list. Enter adds a card. Cards show text + subtle fade-in animation. Max 8 cards. Rotating placeholders like Brain Dump ("Reply to boss email", "Finish laundry", "Call dentist").
- **Phase: `sorting`** — Three drop zones rendered as columns (mobile: stacked). Each card is draggable using `@dnd-kit/core` + `@dnd-kit/sortable` (already installed). Columns: "Yes" (primary), "Expand" (accent), "Not Now" (muted). Cards start in an "unsorted" area at the top.
- **Phase: `reflecting`** — Summary counts. "Yes" cards listed with a tap-to-select action. Selected card flows into FocusPlanTab as pre-filled goal. "Expand" cards show a gentle prompt: "Can you make this smaller? Set a condition?" "Not Now" cards get a compassionate dismissal: "These will wait. You chose what matters."
- Bilingual labels throughout using `t()` and `bilingual()`.
- State is local (useState), no persistence needed — this is a ritual, not a record.

### 2. Modify `src/components/journal/FocusPlanScreen.tsx`

- Add tabs (using shadcn Tabs): "Filter" | "Focus"
- Default to "Filter" tab when no goal is set
- When user selects a "Yes" card from the filter, switch to "Focus" tab with goal pre-filled
- Pass a `prefillGoal` callback to `RequestFilterTab`

### 3. Modify `src/types/journal.ts`

- No changes needed — no new step, this lives inside the existing `focusplan` step.

### ADHD-Friendly Design Decisions

- **No forced order** — users can skip the filter and go straight to Focus tab
- **Card limit (8)** keeps it bounded — prevents "dumping forever"
- **Three simple buckets** — no ambiguity, no complex taxonomy
- **"Not Now" not "No"** — PDA-safe language, removes permanence anxiety
- **"Expand" not "Maybe"** — action-oriented, encourages reframing rather than indecision
- **Pre-fill goal** — zero-friction transition from filter to focus

