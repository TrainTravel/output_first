# The ABC Method — ADHD Task Triage

> **Source:** common framework taught by psychiatrists and CBT therapists for ADHD adults. Codified in this repo to inform the design of `TodoListScreen` (shipped in PR #65 as Focus mode by default).
>
> **Why this lives here:** the ABC method's framing — especially Step 3, "extract and protect the A list" — directly shapes the UX rules in `CLAUDE.md` (ADHD-Friendly UX Principles) and is the rationale behind decisions like *Focus mode is the protective default on every entry*.

The ABC method is a simple triaging system designed to help individuals with ADHD prioritize their daily responsibilities based on **urgency** and **importance**, rather than how interesting or easy the tasks are.

Psychiatrists and cognitive behavioral therapists often recommend this framework because the **ADHD brain is naturally "interest-driven" rather than "importance-driven"**. Without a system, a person with ADHD will often fall into the trap of doing trivial, easy tasks (like going to the store to buy shoelaces) simply to get the rewarding feeling of crossing something off a list, while leaving critical responsibilities (like paying taxes or moving a car to avoid a ticket) completely undone.

---

## Step 1 — Consolidate Your Lists

Having multiple task lists scattered across different notebooks or apps means your list is essentially "nowhere." The first step is to do a complete "brain dump" and combine every single thing you need to do into one master list.

**Implementation in this codebase:** Brain Dump exists as a standalone feature today (`useThoughts`, BrainDump screen). The bridge from Brain Dump → ABC List ("triage these") is **Phase 2** of the planned ABC integration — not yet shipped.

---

## Step 2 — Assign the ABC Categories

Once the master list is created, triage the items into three buckets (often referred to as the Eisenhower Matrix, where "urgent" relates to time pressure and "important" relates to personal values):

| Category | Definition | Examples |
|----------|-----------|----------|
| **A — Urgent + Important** | Emergencies, crises, immediate deadlines. Must happen today. | Pay taxes due tonight, move car before ticket, urgent medical call |
| **B — Important, Not Urgent** | Significant projects or responsibilities that need planning, but not immediate. | Long-term project planning, exercise, building skills, planning a vacation |
| **C — Neither Urgent Nor Important** | The catch-all for trivial tasks, long-term ideas, or busywork tempting because it *feels* productive. | "Clean out the linen closet on a rainy day", buy shoelaces, reorganize the desk |

**Implementation in this codebase:** AI auto-triages on add via `todo-triage` edge function. User can manually cycle a badge A → B → C → A. Section labels in `TodoListScreen.tsx` already match these definitions verbatim.

---

## Step 3 — Extract and Protect Your "A" List

> ⚠️ **This is the signature move of the framework.** Looking at a massive master list can trigger "overwhelm freeze" for an ADHD brain — a state where the brain shuts down as if it just saw a tiger in the jungle. To prevent this, **do not work directly from the master list.** Instead, extract only the "Category A" tasks and move them to the top of a new, smaller daily schedule.

**Implementation in this codebase:** This is exactly what **PR #65 (Focus mode)** does. The `TodoListScreen` opens in Focus mode by default on every entry; only A-priority items render; B and C sections are hidden until the user explicitly switches to "All." Focus mode state is session-local (not persisted) so the protective default is automatic.

The empty-Focus state is also designed around this principle — when there are zero A's, the screen shows *"Rien d'urgent aujourd'hui. Respire." / "Nothing urgent today. Breathe."* instead of the master-list "no tasks" copy. This deliberately does NOT surface a CTA. Zero A's is a positive outcome, not a prompt to add busywork.

---

## Practical Tips for Success

### Use Visuals

If writing out separate lists is too tedious, use highlighters on the master list. For example, highlight all "A" tasks in yellow and "B" tasks in orange to visually separate them.

**In this codebase:** `PRIORITY_STYLES` in `TodoListScreen.tsx` uses the accent (terracotta) color for A badges, primary (sage) for B, muted gray for C. The badge color itself is the visual highlighter.

### Break Down the "A" Tasks

If a Category A task still feels too intimidating to start, remember the mantra: *"If I'm having trouble getting started, then the first step is too big."* Break that urgent task down into smaller chunks of time or smaller steps until the resistance fades.

**Implementation status:** Not yet shipped. **Phase 3** of the planned ABC integration is a "Too big?" affordance on A tasks that uses AI to suggest a smaller first step.

### Acknowledge the "Shoelace" Urge

When you feel the urge to do a "Category C" task, remind yourself that it is a distraction. The shoelaces will eventually become a Category A task when you completely run out of them, but until then, they are not a good use of your immediate time.

**Implementation status:** Not yet shipped. **Phase 4** of the planned ABC integration is an inline coaching nudge when the AI triages a newly-added item to C — gently reminding the user this is the kind of task we plan FOR, not act on now.

---

## Roadmap reference

The Bailey ABC method is implemented across this codebase in four planned phases. Phase 1 has shipped; Phases 2–4 are pending.

| Phase | Scope | Status |
|-------|-------|--------|
| 1 | Focus mode as default — extract A from master list | ✅ Shipped (PR #65) |
| 2 | BrainDump → ABC bridge ("triage these") | Pending |
| 3 | "Too big?" break-down affordance on A tasks | Pending |
| 4 | Shoelace nudge when AI triages a new item to C | Pending |

---

## Cross-references

- `docs/research/adhd-evidence-brief.md` — broader ADHD evidence synthesis informing app-wide UX rules.
- `CLAUDE.md` § "ADHD-Friendly UX Principles" — the codified rules derived from this and other frameworks.
- `CLAUDE.md` § "Neuro-Inclusive Design Standards" — design language that backs Step 3's protective default.
- `src/components/journal/TodoListScreen.tsx` — the implementation.
- `docs/CHANGELOG.md` — entry under 2026-06-05 documenting the Phase 1 ship.
