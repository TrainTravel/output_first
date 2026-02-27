# E2E Test Suite

Playwright tests covering the main user flows of OutputFirst.
All 25 tests run headless against a local dev server with mocked Supabase/AI network calls.

## Running Tests

```bash
npm run test:e2e            # Headless (CI-style)
npm run test:e2e:headed     # Watch tests run in a real browser
npm run test:e2e:ui         # Interactive Playwright UI
npm run test:e2e -- e2e/home.spec.ts   # Single spec file
npx playwright show-report  # Open the last HTML report
```

> **Node version:** requires Node 22. If the system node is older, prefix commands with:
> `export PATH="/usr/local/opt/node@22/bin:$PATH" &&`

---

## Test Files

### `e2e/home.spec.ts` — 6 tests

Verifies the home screen renders correctly in French (default language).

| Test | What it checks |
|------|---------------|
| Shows app title | "OutputFirst" is visible |
| Shows CTA button | "Écrire aujourd'hui" present on fresh load |
| Shows status badge | "Pas encore" visible when not yet journaled |
| Shows 4 nav buttons | Brain Dump, Thought Garden, Mes Clusters, Voir vos progrès |
| Language toggle | Renders with "FR" label and correct aria-label |
| Subtitle | "Journaling en français" visible |

---

### `e2e/journal-flow.spec.ts` — 3 tests

Covers the full 8-step journaling flow with mocked AI responses.

| Test | What it checks |
|------|---------------|
| Happy path | Home → Breathe → Write → Feedback → Emotions → Reflection → Gratitude → Complete → Home |
| Skip gratitude | Same flow but uses "Passer et terminer" instead of saving gratitude |
| BreatheScreen clock | `page.clock.fastForward(10s)` unlocks the "Je suis prêt(e)" button |

**Mock responses used:**
- `french-feedback` → acknowledgment + emotional granularity object
- `reflection` → `{ reflection, question }` fields

**Notes:**
- The "Écrire aujourd'hui" CTA has a CSS `animate-breathe` animation; tests use `click({ force: true })` to bypass the stability check
- Emotion pill selection only toggles selection — a separate "Continuer" click is required to advance
- After completing the journal, the home CTA changes to "Écrire encore"

---

### `e2e/braindump.spec.ts` — 5 tests

Verifies the Brain Dump input and submission flow. Requires a mocked authenticated session because `useThoughts.addThought()` returns null for unauthenticated users.

| Test | What it checks |
|------|---------------|
| Title visible | Brain Dump screen renders correctly |
| Add button disabled when empty | Cannot submit with no text |
| Enter key submits | Thought appears in list after pressing Enter |
| Add button submits | Same result via button click |
| Back button | Returns to home screen |

**Mocks used:** `injectMockSession` + `mockAuthRoutes` + `mockThoughts` + `mockGenerateEmbedding`

---

### `e2e/navigation.spec.ts` — 5 tests

Verifies each section can be opened from home and returned from.

| Test | Route |
|------|-------|
| Brain Dump → back | Home → BrainDumpScreen → Home |
| Thought Garden → back | Home → ThoughtGardenScreen → Home |
| Clusters → back | Home → ClustersScreen → Home |
| Progress → back | Home → ProgressScreen (checks "jours de suite" stat) → Home |
| Write → back | Home → BreatheScreen → Home |

---

### `e2e/language.spec.ts` — 6 tests

Verifies the language toggle and bilingual rendering.

| Test | What it checks |
|------|---------------|
| Defaults to French | "Écrire aujourd'hui" + "FR" toggle on fresh load |
| Toggle to English | Shows "Write today" + "EN" |
| Toggle back to French | Round-trip works correctly |
| Persistence after reload | Toggled language survives `page.reload()` |
| FR-first bilingual order | "Vide-tête / Brain Dump" in French mode |
| EN-first bilingual order | "Brain Dump / Vide-tête" in English mode |

**Note:** The persistence test does NOT use `addInitScript` for the language — that helper runs on every page load including `page.reload()` and would override the toggled value.

---

## Shared Helpers — `e2e/helpers/mocks.ts`

| Helper | Purpose |
|--------|---------|
| `setFrenchLanguage(page)` | Sets `outputfirst_language = 'fr'` via `addInitScript` |
| `injectMockSession(page)` | Injects a fake Supabase auth token into localStorage |
| `mockAuthRoutes(page)` | Intercepts `**/auth/v1/token*` to prevent token refresh errors |
| `mockFeedback(page)` | Intercepts `**/functions/v1/french-feedback` |
| `mockReflection(page)` | Intercepts `**/functions/v1/reflection` |
| `mockThoughts(page)` | Intercepts `**/rest/v1/thoughts*` (GET → `[]`, POST → created thought) |
| `mockGenerateEmbedding(page)` | Intercepts `**/functions/v1/generate-embedding` (fire-and-forget) |
| `setupJournalMocks(page)` | Convenience: runs `mockFeedback` + `mockReflection` |

---

## CI

Tests run automatically on every push and pull request to `main` via `.github/workflows/e2e.yml`.
The Playwright HTML report is uploaded as an artifact on every run (kept for 7 days).
