# SPEC: ABC List Focus Mode (Bailey ABC Step 3)

**Status:** draft → implementing
**Branch:** `feat/abc-focus-mode`
**Author:** Train + Claude, 2026-06-05
**Bailey reference:** ABC method — Step 3 ("Extract and protect your A list — do NOT work from the master list")

---

## 1. Objective

Today's `TodoListScreen` renders A + B + C sections together — that *is* the master list, the thing the ABC method's Step 3 explicitly warns against because seeing the full list triggers overwhelm freeze for ADHD brains.

This PR adds a **Focus / All toggle** at the top of the screen.

- **Focus mode (default)**: render only A-priority items. Hide B and C sections entirely.
- **All mode**: today's behavior unchanged — A, B, and C all visible with their section headers.
- **Empty Focus state**: when A is empty, show a soft, protective message — *"Nothing urgent today. Breathe."* — not a CTA, not a guilt nudge.

This is Phase 1 of a multi-PR plan to layer Bailey's framework onto the existing ABC List. Future phases (out of scope here):
- Phase 2: BrainDump → ABC List bridge ("triage these")
- Phase 3: "Too big?" break-down affordance on A tasks
- Phase 4: Shoelace nudge when AI triages a new item to C

---

## 2. Target user

The existing user of the ABC List feature (anyone who has opened it once). No new auth, no new opt-in flow — the toggle is just there next time they open the screen.

---

## 3. Acceptance criteria

### 3.1 Behavior
- [ ] On `TodoListScreen` first paint, Focus mode is active (regardless of last visit).
- [ ] In Focus mode, only items with `priority === 'A'` are visible. The B and C section headers and their items are hidden from the DOM.
- [ ] Pending-AI items (`pendingAI: true`) are NOT visible in Focus mode — their priority hasn't been decided yet, treat as "not urgent yet."
- [ ] In Focus mode with zero visible A items, render the empty state copy in place of the list. Do NOT render section headers.
- [ ] Tapping the toggle switches to All mode. All mode renders identically to today's screen.
- [ ] Toggle state is local to the screen session — leaving and re-entering resets to Focus. **Do not persist.**
- [ ] Adding a new task in either mode keeps the user in their current mode. The triage happens in the background as today; if the result is non-A while in Focus mode, the item is silently filtered out (it'll surface when the user switches to All).

### 3.2 Visuals
- [ ] Toggle sits between the header (back / title / chip) and the input row. Segmented-button style — two pills, "Focus" and "Tout / All".
- [ ] Active pill uses the existing primary (sage) treatment. Inactive pill is muted.
- [ ] Toggle has `data-testid="abc-mode-toggle"` (the wrapper) and each button has `data-testid="abc-mode-focus"` / `abc-mode-all"` (per [Keep CI Green](CLAUDE.md) — stable selectors over copy).
- [ ] Empty-Focus state uses the same italic `text-muted-foreground/60` treatment as today's empty-list message.

### 3.3 Languages
All new strings ship in all six configured languages: `en`, `fr`, `es`, `ja`, `zh-Hans`, `zh-Hant`. CJK follows the chrome-translation conventions in CLAUDE.md (Japanese: polite ます-form, no `あなた`; Hans/Hant character split where it actually differs).

| Key | en | fr | es | ja | zh-Hans | zh-Hant |
|---|---|---|---|---|---|---|
| Focus toggle label | `Focus` | `Focus` | `Foco` | `集中` | `专注` | `專注` |
| All toggle label | `All` | `Tout` | `Todo` | `すべて` | `全部` | `全部` |
| Empty Focus state | `Nothing urgent today. Breathe.` | `Rien d'urgent aujourd'hui. Respire.` | `Nada urgente hoy. Respira.` | `今日(きょう)は緊急(きんきゅう)なものはありません。深呼吸(しんこきゅう)を。` | `今天没有紧急的事。深呼吸。` | `今天沒有緊急的事。深呼吸。` |

### 3.4 Non-goals (deferred)
- Persisting toggle state across sessions
- Auto-switching to All when no A items exist
- Animated transition between modes
- BrainDump → ABC bridge
- Break-down affordance on A tasks
- Shoelace nudge on C-triaged adds
- Any change to `useTodoList` hook shape
- Any change to triage edge function or AI behavior

---

## 4. Tech stack & constraints

- **Stack** (unchanged): React 18 + TypeScript + Vite + Tailwind + shadcn/ui
- **State**: `useState<'focus' | 'all'>('focus')` local to `TodoListScreen`. No new hook. No new context.
- **Storage**: nothing new (per non-goal — toggle state does not persist).
- **i18n**: existing `t()` helper from `useLanguage`. Add strings to the inline call sites at the call site (same convention as the rest of `TodoListScreen`).
- **Selectors for E2E**: `data-testid` on toggle buttons. Text-based selectors only for assertions (e.g. "is the empty-Focus message visible").

---

## 5. Project structure (what changes)

```
src/
  components/journal/
    TodoListScreen.tsx          ← MODIFIED — add mode state, toggle UI, filter logic
src/
  hooks/
    useTodoList.ts              ← UNCHANGED
e2e/
  todo-list.spec.ts             ← MODIFIED — add Focus-mode specs, update mocks if needed
src/components/journal/
  TodoListScreen.test.tsx       ← NEW (or extend if exists) — unit test for filter logic
docs/
  CHANGELOG.md                  ← MODIFIED — Focus mode entry with ADHD-friendly rationale
```

Inspection shows no existing `TodoListScreen.test.tsx`. If a vitest test for the filter logic is straightforward to write against the component (with the existing `useTodoList` mocked), include it; otherwise put the filter as a small pure helper and unit test that. Prefer the helper-extraction route for simpler tests.

---

## 6. Code style

- TypeScript strict, no `any`.
- Match existing TodoListScreen conventions (inline `t({...}).primary`, inline Tailwind classes, sub-components defined in the same file when they're screen-specific).
- Extract the mode filter as a tiny pure function (e.g. `filterByMode(items, mode)`) so it's unit-testable without rendering.
- Use the existing `PRIORITY_STYLES['A'].header` color for the Focus pill's active state (consistency with the section header).
- No comments unless WHY is non-obvious. The toggle's purpose is self-documenting; the "do not persist" choice is non-obvious — that gets ONE comment.

---

## 7. Testing strategy

### 7.1 Unit (vitest)
- `filterByMode(items, 'focus')` returns only A-priority, non-pendingAI items.
- `filterByMode(items, 'all')` returns all items unchanged.
- Edge cases: empty list, all pendingAI, mixed A/B/C, A items where one is pendingAI.

### 7.2 E2E (playwright)
Extend `e2e/todo-list.spec.ts` with one focused spec block:

- **Focus is the default**: after navigation to ABC list, Focus pill is active; B/C section headers are NOT visible.
- **Toggle switches to All**: tapping the All pill reveals B and C section headers.
- **Empty Focus shows protective copy**: with only B/C items present (mock triage to return 'B'), Focus mode shows the "Rien d'urgent" message.
- **A item visible in Focus**: with one A item present (mock triage to return 'A'), the A item text is visible and B/C headers are not.

Selector strategy: `data-testid="abc-mode-focus"` and `abc-mode-all"` for navigation. Text selectors only for visibility assertions on the empty message.

### 7.3 Regression — full E2E suite
Per `CLAUDE.md` "Keep CI Green" rule:
- Run the full `npm run test:e2e` suite locally before opening the PR.
- Diff failures against `main`. The bar is: no NEW failures introduced by this PR.
- If a flake surfaces in an unrelated spec, document it in the PR body — do not silently fix it in this PR.

### 7.4 Lint + typecheck + build
- `npm run lint` — clean.
- `npm run build` — succeeds.

---

## 8. Boundaries

### Always do
- Use `data-testid` for E2E navigation selectors.
- Ship all six language strings in the same PR (no fallback-warning TODOs).
- Add a CHANGELOG entry with the ADHD-friendly rationale (cites Bailey Step 3).

### Ask first
- (Nothing in scope. Phase 1 is bounded.)

### Never do (in this PR)
- Touch `useTodoList`, the `todo-triage` edge function, or `useProfileStorage`.
- Touch any other screen — no HomeScreen, BrainDump, or LanguageContext changes.
- Add persistence for the toggle state.
- Auto-switch modes based on item count.
- Animate the transition (cute, but adds test surface).
- Add the BrainDump→ABC bridge, break-down affordance, or shoelace nudge — those are Phases 2-4.

---

## 9. Verification

A task is not complete until:
- [ ] `npm run lint` clean
- [ ] `npm run build` succeeds
- [ ] New vitest unit tests pass
- [ ] New E2E spec passes
- [ ] **Full E2E suite shows no new failures vs main**
- [ ] PR description quotes any unrelated flakes observed
- [ ] CHANGELOG entry includes Bailey Step 3 rationale
