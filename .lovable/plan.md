

# Expressive Writing — Integrated into Existing Free Write

Instead of adding a new button, we integrate expressive writing as a **mode within the existing Free Write screen**. When the user taps "Free Write" from More tools, they see a mode choice (like PromptChoiceScreen does for guided writing): regular free write vs. expressive writing session.

## How it works

1. User taps **Free Write** (already on Home → More tools)
2. A new **FreeWriteChoiceScreen** appears with two options:
   - **Écriture libre / Free Write** — current behavior, no timer, no structure
   - **Écriture expressive / Expressive Writing** — timed 20-min session with Pennebaker-style guidance
3. Choosing expressive writing opens a new **ExpressiveWriteScreen** with:
   - A brief safety intro (bilingual): "Write about something deeply personal. This is private and only for you."
   - A 20-minute countdown timer (gentle, like the sand timer — a thin progress bar, not a stressful clock)
   - The textarea — same styling as FreeWriteScreen
   - Word count + elapsed time shown subtly
   - A "Finish early" option (escape hatch — PDA-safe)
4. When time is up or user finishes:
   - Entry is saved (same `saveFreeContent` flow → goes to `complete`)
   - A gentle **self-care reminder** card appears before transitioning: "It's normal to feel intense emotions. Take a moment to breathe."
   - Session count is tracked (localStorage: `expressive_session_count`) to show progress toward the recommended 3-5 sessions

## Files

### New files
| File | Purpose |
|---|---|
| `src/components/journal/FreeWriteChoiceScreen.tsx` | Two-option choice screen (like PromptChoiceScreen): Free Write vs Expressive Writing |
| `src/components/journal/ExpressiveWriteScreen.tsx` | Timed 20-min writing screen with safety intro, progress bar timer, self-care outro |

### Modified files
| File | Change |
|---|---|
| `src/types/journal.ts` | Add `'freewritechoice'` and `'expressivewrite'` to `JournalStep` |
| `src/hooks/useJournal.ts` | `startFreeWrite` now goes to `'freewritechoice'` instead of `'freewrite'`; add `startExpressiveWrite` that sets step to `'expressivewrite'`; add `saveExpressiveContent` that saves + shows self-care message |
| `src/components/journal/JournalApp.tsx` | Add cases for `freewritechoice` and `expressivewrite` |

### No HomeScreen changes needed
The existing "Free Write" button in More tools now leads to the choice screen, which branches into the two modes.

## ExpressiveWriteScreen design

**Safety intro** (shown for 5 seconds, then fades to writing area):
- "Écrivez sur quelque chose de profondément personnel. Ceci est privé et uniquement pour vous."
- "Write about something deeply personal. This is private and only for you."
- "Don't worry about grammar or spelling — just let it flow."

**During writing:**
- Thin progress bar at top (20 minutes, accent color)
- Textarea fills the screen
- Subtle word count + time remaining in muted text
- "Finish early" ghost button at bottom

**Post-writing self-care card** (shown before navigating to complete):
- "Il est normal de ressentir des émotions intenses. Prenez un moment pour respirer."
- "It's normal to feel intense emotions. Take a moment to breathe."
- Session counter: "Session 2 of 4" (tracking toward recommended 3-5 sessions)
- "Continue" button after a 10-second gentle delay (forced pause principle)

## Database
No new tables needed — entries save through the existing `saveFreeContent` → `journal_entries` flow. Session count stored in localStorage (`expressive_sessions`).

