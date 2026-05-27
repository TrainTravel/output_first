# Learning Profiles v1 — implementation plan

**Status:** planning + first-phase implementation (autopilot mode)
**Date:** 2026-05-27
**Scope:** localStorage-only. Supabase sync deferred to v1.5.

## What we're building

Duolingo-style sequential profiles: one active at a time, each profile = a `{primary, target}` language pair plus its own journal/vocab/freq-mirror/word-count data. Account-level state (streak, badges, total word count, self-compassion dismissals, theme, font, auth) is shared across all profiles.

Locked design (decisions captured 2026-05-27):

| Bucket | Storage scope |
|---|---|
| `journal_entries` | per-profile |
| `emotion_vocab` usage | per-profile |
| `freq_mirror` dismissals | per-profile |
| `todos` | per-profile |
| `small_wins` | per-profile |
| profile `wordCount` | per-profile (derived from this profile's entries) |
| daily `streak` | **shared** — journaling in any profile counts |
| `totalWordCount` | **shared** — sum across all profiles |
| `BADGES` thresholds | **shared** — against `totalWordCount` |
| `compassion_seed_dismissed` | **shared** — emotional, not linguistic |
| `theme`, `font_pref`, `theme_sort_mode` | **shared** — visual preferences |
| Profile list itself | **shared** — at `outputfirst_profiles` |

## Dependency graph

```
            ┌──────────────────────────────────────┐
            │  LanguageContext refactor (Phase 0)  │
            │  Profile type + active profile state │
            └──────────────────┬───────────────────┘
                               │
            ┌──────────────────┴───────────────────┐
            │                                       │
            ▼                                       ▼
  ┌────────────────────────┐         ┌──────────────────────┐
  │ useProfileStorage      │         │ HomeScreen picker UI │
  │ helper (Phase 1)       │         │ (Phase 2)            │
  └─────────┬──────────────┘         └──────────────────────┘
            │
            ▼
  ┌────────────────────────┐
  │ Migrate 5 hooks to     │
  │ per-profile storage    │
  │ (Phase 1)              │
  └─────────┬──────────────┘
            │
            ▼
  ┌────────────────────────┐
  │ Total word count +     │
  │ stat-strip polish      │
  │ (Phase 3)              │
  └─────────┬──────────────┘
            │
            ▼
  ┌────────────────────────┐
  │ Onboarding flow        │
  │ (Phase 4 — deferred)   │
  └────────────────────────┘
```

Phase 0 and Phase 2 can ship serially. Phase 1 depends only on Phase 0. Phase 3 needs Phase 1 done (otherwise no per-profile word count exists). Phase 4 is polish, deferable.

## Vertical slicing — each phase is one shippable PR

### Phase 0 — Profile model + LanguageContext refactor

**Goal:** structure under the hood, zero behavior change.

Tasks:
- Add `Profile` type: `{ id, primary, target, createdAt, name? }`
- Migrate `LanguageContext` from `{primary, target}` to `{profiles: Profile[], activeProfileId}`
- Hydration: if `outputfirst_lang_pair` exists in localStorage, migrate it once to one profile + delete the old key
- Keep existing `useLanguage()` API stable (`pair`, `targetLang`, `primaryLang`, `t`, `bilingual`, `setLangPair`, `toggleLanguage`) — they now read from / write to the active profile
- Add new APIs: `profiles`, `activeProfileId`, `createProfile()`, `switchProfile(id)`, `archiveProfile(id)`, `renameProfile(id, name)`

Acceptance:
- All 36 existing `LanguageContext.test.tsx` tests still pass against the same API
- Migration test: write old `outputfirst_lang_pair`, hydrate, assert one profile exists + old key gone
- New tests: create/switch/archive lifecycle
- `tsc --noEmit` clean
- `vitest run` 198+ passing (no regressions)

Verification:
- Manual: refresh app — language pair persists, no broken state
- Manual: open localStorage in DevTools — see `outputfirst_profiles` array

### Phase 1 — `useProfileStorage` helper + migrate per-profile hooks

**Goal:** journal/vocab/freq-mirror/todos/wins isolate by active profile.

Tasks:
- Build `useProfileStorage<T>(key, defaultValue)` hook:
  - Reads from `outputfirst_profile_<activeProfileId>_<key>`
  - Returns `[value, setValue]` with localStorage write-through
  - Uses `fp-ts/Option` for hydration (matches existing pattern)
- Migrate 5 hooks one at a time, each in its own commit if it fits PR scope:
  - `useJournal` (key `entries`)
  - `useEmotionVocab` (key `emotion_vocab`)
  - `useFrequencyMirror` (key `freq_mirror_dismissed`)
  - `useTodoList` (key `todos`)
  - `useSmallWins` (key `wins`)
- Each migration:
  - Replaces direct `localStorage.getItem/setItem` calls
  - Adds tests: data isolates between profiles

Acceptance:
- Each hook's existing test suite still passes
- New tests per hook: writing in profile A doesn't leak to profile B
- `tsc --noEmit` clean
- `vitest run` no regressions

Verification:
- Manual: with two profiles, write a journal entry in profile A, switch to B, confirm A's entries don't appear

### Phase 2 — HomeScreen profile picker UI

**Goal:** make multi-profile usable through real UI.

Tasks:
- Add `ProfileChip` component next to `LanguageToggle` on HomeScreen
- Click chip → dropdown shows all non-archived profiles + "+ Add profile" entry
- "+ Add profile" → opens existing `LanguageSettingsScreen` in "create" mode
- Switching profile is instant (no reload)
- e2e test: home → add profile → switch → verify HomeScreen reflects new pair

Acceptance:
- Picker visible when 2+ profiles exist (degrades gracefully to today's UX when only 1)
- e2e covers create + switch flow

### Phase 3 — Total word count + stat-strip polish

**Goal:** stat strip on HomeScreen and ProgressScreen reflects new model.

Tasks:
- `useTotalWordCount()` — sums across all profiles' entries
- HomeScreen stat strip: profile count primary, `↳ total` as small caption
- BADGES still threshold against total (already does — just confirm)
- Update relevant tests

Acceptance:
- Display matches design doc option (a): "289 字 in French" / "↳ 1,247 total"
- Badge tooltip shows total context

### Phase 4 — Onboarding + profile management UI (DEFERRED)

**Goal:** first-time users get guided through profile creation. Settings let them manage existing profiles.

Tasks (deferred — file as backlog after Phases 0-3 ship):
- New-user onboarding: "What do you speak?" → primary, "What are you learning?" → target
- Profile settings screen: rename, archive, delete
- "Add another profile" CTA in settings

## Checkpoints

After each phase:
- ☐ Local `npx tsc --noEmit` clean
- ☐ Local `npx vitest run` 198+ passing (no regressions)
- ☐ Manual sanity check listed in that phase's verification
- ☐ Open small PR, request review, wait for merge before starting next phase

## Risks called out

- **Data isolation bugs:** if `useProfileStorage` reads stale `activeProfileId` (closure capture, React re-render timing), one profile's data can leak into another. Mitigation: use `useSyncExternalStore` or a context-level subscription pattern, not closure capture.
- **Migration timing:** if hydration runs before LanguageProvider mounts, hooks read the wrong key. Mitigation: hydrate `profiles` synchronously in `LanguageProvider`'s initial state, not in `useEffect`.
- **Browser tab sync:** two tabs of the app on different profiles would write to different keys correctly but the `activeProfileId` itself could desync. Acceptable for v1 (last-write-wins).

## Out of scope for v1

- Supabase sync — local-only. Cross-device profile sync is v1.5.
- Side-by-side parallel view (Option B from prior turn).
- Profile import/export.
- Per-profile theme/font preferences.
- "Studying in multiple languages today" UX cues.

## Effort estimate

- Phase 0: 0.5 day (small but load-bearing)
- Phase 1: 1.5 days (5 hooks to migrate carefully)
- Phase 2: 1 day (UI work)
- Phase 3: 0.5 day (mostly display)
- Phase 4: deferred

Total: ~3-4 days, 3-4 PRs.
