
# Fix Build Errors + Layout Issues

## Problem
1. **Build errors (28 errors)**: The `t()` and `bilingual()` functions in `LanguageContext` were updated to require 3 arguments (French, English, Spanish), but many components still call them with only 2 arguments.
2. **"Discuss this cluster" button text cut off**: The bilingual button text is too long for the button width.
3. **Cluster card names truncated**: `truncate` CSS class forces single-line with ellipsis.

## Fix

### 1. Build errors -- Add Spanish fallback to all 2-argument calls

Files to update (add a 3rd Spanish argument to every `t()` and `bilingual()` call):
- `src/components/journal/ClusterPicker.tsx` -- 3 calls
- `src/components/journal/GardenThemeSelector.tsx` -- 3 calls
- `src/components/journal/ProgressScreen.tsx` -- 2 calls
- `src/components/journal/ThoughtGardenScreen.tsx` -- ~12 calls
- `src/components/journal/zen/ZenGardenScreen.tsx` -- ~7 calls

For each call, add an appropriate Spanish translation as the third argument.

### 2. "Discuss this cluster" button -- allow text wrap

In `ClusterDetailScreen.tsx`, the button uses `size="full"` which has fixed height `h-14`. Change to allow the text to wrap:
- Remove `whitespace-nowrap` (inherited from base button) by adding `whitespace-normal` class
- Ensure the button height can grow with `h-auto min-h-[3.5rem] py-3`

### 3. Cluster card title truncation -- allow 2-line wrap

In `ClustersScreen.tsx`, the `ClusterCard` component uses `truncate` on the `h3`. Replace `truncate` with `line-clamp-2` to allow wrapping to two lines before truncating.

## Technical Details

All changes are straightforward string additions and CSS class swaps. No logic or architecture changes needed.
