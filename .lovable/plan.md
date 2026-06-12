## Goal

Today, "I already speak" is a single language (`primaryLang`). Switch it to a **multi-select set** drawn from the same pool as target languages: `en`, `fr`, `es`, `ja`, `zh-Hans`, `zh-Hant`. One of those known languages also serves as the chrome/UI display language (it has to — bilingual rendering can only show one secondary at a time).

## User-visible changes

**Language Settings → "I already speak" section**
- Each language renders as a toggleable checkbox card (multi-select), not a single-pick radio.
- Languages equal to the active profile's target are filtered out (you can't "already speak" the thing you're learning).
- At least one known language is required; the active profile's target can never be in the set.
- New sub-row below the grid: **"Show app in:"** — a single-select picker limited to the currently checked known languages. This is the existing chrome/`primaryLang`.
- No Save button — commits on tap (matches current behavior).

**Everywhere else**
- `LanguageToggle` (one-tap chrome cycler) cycles only through `knownLangs` minus the active target, instead of the hard-coded `PRIMARY_LANGS` list.
- `ProfileChip` and Home are unchanged visually.

## Data model

`ProfilesState` (in `LanguageContext`) gains one field:

```ts
knownLangs: PrimaryLang[]   // non-empty, must include primaryLang, must exclude active target
```

`primaryLang` stays (chrome/display language). Invariants enforced in setters + hydrator:
1. `knownLangs.length >= 1`
2. `primaryLang ∈ knownLangs`
3. `activeProfile.target ∉ knownLangs`

`PrimaryLang` type is widened to include `'ja'` so the "I speak Japanese" case is representable. (Today `ja` is target-only.) The chrome render path already handles `ja` in `stringFor`.

## Hydration / migration

In `hydrate()`:
- If stored state has `knownLangs` → validate & use.
- Else (legacy) → `knownLangs = [primaryLang]`. Write-back happens on next state change.
- Legacy `outputfirst_lang_pair` path also seeds `knownLangs = [primary]`.
- If invariants are violated post-load (e.g. target ∈ knownLangs), drop the conflicting entry and ensure `primaryLang` is still in the set; otherwise reset `primaryLang` to the first remaining known.

## New context API

```ts
knownLangs: readonly PrimaryLang[];
setKnownLangs: (next: PrimaryLang[]) => void;   // enforces invariants
toggleKnownLang: (lang: PrimaryLang) => void;   // add/remove; no-op if would empty the set or remove primary
```

`setLangPair` and `switchProfile` already auto-adjust primary on target conflict — extend them to also prune the new target out of `knownLangs` if present, and pick a new `primaryLang` from the remaining known set when needed.

## Edge functions

Threaded through the same way `primaryLang` is today. Add an optional `knownLangs: string[]` body field to:
- `supabase/functions/reflection/index.ts`
- `supabase/functions/language-feedback/index.ts`
- `supabase/functions/language-chat/index.ts`

In each system prompt's USER CONTEXT block, replace "native {primaryName} speaker" with:
> "comfortable in {humanList(knownLangs)}; chrome shown in {primaryName}"

Callers pass `knownLangs` from `useLanguage()`. Backward compatible: if absent, behave as today.

## UI plumbing

- `LanguageSettingsScreen` "I already speak" section: turn each option button into a checkbox card; pressing it calls `toggleKnownLang(code)`. Add a "Show app in" row of small pill buttons (filtered to `knownLangs`).
- Remove the existing single-pick logic (`onPickPrimary`) and the `availablePrimaries` filter on the grid (we'll filter on target only).
- `LanguageToggle.tsx` (one-tap chrome cycler): iterate `knownLangs` minus active target instead of `PRIMARY_LANGS`.

## Verification

- Type-check.
- New unit tests (`LanguageContext.test.tsx`):
  - hydration seeds `knownLangs = [primaryLang]` from legacy storage
  - `toggleKnownLang` adds/removes; refuses to remove last entry or the current primary
  - switching to a profile whose target ∈ knownLangs prunes it and re-picks primary if needed
  - widened `PrimaryLang` accepts `'ja'`
- New E2E (`e2e/language.spec.ts`):
  - Open Language Settings, check multiple known languages, reload, all remain checked
  - "Show app in" picker only lists checked languages; switching chrome doesn't change `knownLangs`
  - Target language not offered in the known-language grid
- Regression: existing language.spec tests still pass after updating the few that assumed single-pick.

## Out of scope

- New chrome translations beyond what already exists. Adding `ja` to the primary set just lets users *mark* it as known; chrome already has `ja` translations.
- AI behavior changes beyond passing the new field — no prompt rewrites beyond the one USER CONTEXT line.
- Touching `chinese-*` / `todo-triage` / other functions — only the three above receive `knownLangs` in this pass; others can be folded in later if needed.
