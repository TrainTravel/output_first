## Mirror PR #55 — remove SelfCompassionPractice from ProgressScreen

PR #55 deletes the collapsible self-compassion card from ProgressScreen, reverting it to a pure progress/calendar surface. The component itself stays (still used in ReflectionScreen, defaultOpen when emotion is hard) and the HomeScreen `SelfCompassionSeed` stays.

### Changes

**`src/components/journal/ProgressScreen.tsx`**
- Remove line 9: `import { SelfCompassionPractice } from './SelfCompassionPractice';`
- Remove lines 242–243 (the `{/* Self-compassion practice ... */}` comment and `<SelfCompassionPractice lang={lang} />` JSX, plus the surrounding blank line).

**`e2e/self-compassion.spec.ts`**
- Delete the `ProgressScreen — SelfCompassionPractice` describe block (lines ~37–63, 2 tests) — the testids no longer render on that screen.
- Keep the HomeScreen `SelfCompassionSeed` block and the ReflectionScreen block intact.

### Not touched
- `SelfCompassionPractice.tsx` — still consumed by `ReflectionScreen.tsx:179`.
- `SelfCompassionSeed` on HomeScreen.
- `docs/CHANGELOG.md` historical entry.

### Verification
- Type check passes (no dangling import).
- HomeScreen and ReflectionScreen compassion E2E describe blocks remain green.
- Visual: ProgressScreen renders without the compassion card between the affirmation and the Actions buttons.