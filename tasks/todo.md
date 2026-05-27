# Learning Profiles v1 — task list

See `tasks/plan.md` for design rationale + dependency graph.

## Phase 0 — Profile model + LanguageContext refactor ✓

- [x] **0.1** Define `Profile` type + storage shape constants
- [x] **0.2** Migrate `LanguageContext` state: `pair` → `{profiles, activeProfileId}`
- [x] **0.3** Hydration: read existing `outputfirst_lang_pair`, migrate to one profile, delete old key
- [x] **0.4** Keep existing public API working (`pair`, `targetLang`, `primaryLang`, `setLangPair`, `toggleLanguage`)
- [x] **0.5** Add new public API (`profiles`, `activeProfileId`, `createProfile`, `switchProfile`, `archiveProfile`, `renameProfile`)
- [x] **0.6** Update `LanguageContext.test.tsx`: existing tests pass + 10 new (migration + lifecycle)
- [x] **0.7** Verify `tsc --noEmit` + `vitest run` green (208/208)
- [x] **0.8** Open PR

## Phase 1 — `useProfileStorage` helper + migrate per-profile hooks ✓

- [x] **1.1** Build `useProfileStorage<T>(key, defaultValue)` in `src/hooks/useProfileStorage.ts`
- [x] **1.2** Migrate `useJournal` to `useProfileStorage('entries', ...)`
- [x] **1.3** Migrate `useEmotionVocab` to `useProfileStorage('emotion_vocab', ...)`
- [x] **1.4** Migrate `useFrequencyMirror` (vocab + dismiss keys both)
- [x] **1.5** Migrate `useTodoList`
- [x] **1.6** Migrate `useSmallWins`
- [x] **1.7** Add cross-profile isolation tests per hook
- [x] **1.8** Verify `tsc --noEmit` + `vitest run` green (237 passed, was 208)
- [x] **1.9** Open PR (may split into 2 if too large)
- [x] **1.10** Review fixes: closure-capture timing in `useProfileStorage`, `EmotionFrequencyNudge` profile-switch refresh, eager legacy-migration mount via `MigrationsBootstrap` in `JournalApp`

## Phase 2 — HomeScreen profile picker

- [ ] **2.1** `ProfileChip` component (dropdown with profile list + "+ Add")
- [ ] **2.2** Wire into HomeScreen header
- [ ] **2.3** Hook the "+ Add" button to a profile-creation flow
- [ ] **2.4** Switching profile is instant (no remount needed)
- [ ] **2.5** e2e test: create profile, switch, verify state
- [ ] **2.6** Open PR

## Phase 3 — Total word count + stat-strip polish

- [ ] **3.1** `useTotalWordCount()` — sums across profile entries
- [ ] **3.2** HomeScreen stat strip: per-profile primary, total secondary
- [ ] **3.3** Confirm BADGES threshold against total still works
- [ ] **3.4** Update tests
- [ ] **3.5** Open PR

## Phase 4 — Onboarding + management UI (DEFERRED)

- [ ] **4.1** First-time onboarding flow
- [ ] **4.2** Settings: rename / archive / delete profile
- [ ] **4.3** Empty-state polish

## Current task

Starting **0.1** now.
