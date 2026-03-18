

# Resume Paused Experiments

## Changes

### 1. `useExperiments.ts` — Add `resumeExperiment` function

- Updates status back to `'active'` and recalculates `ends_at` based on remaining days (original duration minus days already elapsed before pause)
- Refreshes experiments list after update

<lov-plan>

# Resume Paused Experiments

## Changes

### 1. `useExperiments.ts` — Add `resumeExperiment` function

- Sets status back to `'active'`, resets `started_at` to now, recalculates `ends_at` to preserve remaining duration (original `ends_at - started_at` minus elapsed checkin days isn't reliable — simpler to just re-extend by the original duration string: parse "1 week" → 7 days, "2 weeks" → 14, "1 month" → 30)
- Clears any stale reflection fields
- Calls `fetchExperiments()` after update

### 2. `TinyExperimentScreen.tsx` — Add resume button on paused experiments in the past list

- For each `pastExperiment` where `status === 'paused'` and no active experiment exists: show a "Resume" button (Play icon) next to the paused card
- Disabled when there's already an active experiment (monotropism: one at a time)
- On click, calls `resumeExperiment(exp.id)` which reactivates it with a fresh timeline

### 3. Import additions

- Add `Play` from lucide-react for the resume button icon

