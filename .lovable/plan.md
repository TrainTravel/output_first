

# Tiny Experiments Tracker

## Overview

A new screen — **"Mes petites expériences / My Tiny Experiments"** — where users define one small experiment at a time using the format "I will ___ for ___", track daily check-ins, and reflect when it ends using Plus / Minus / Next.

## Database

Two new tables with RLS scoped to `user_id = auth.uid()::text`:

**`experiments`**: id, user_id, action (text), duration (text), started_at, ends_at, status (active/completed/paused), reflection_plus, reflection_minus, reflection_next, created_at

**`experiment_checkins`**: id, experiment_id (FK → experiments), date (text, unique per experiment), showed_up (boolean), note (text), created_at

RLS policies: users can CRUD their own experiments; checkins accessible via experiment ownership join.

## New Files

| File | Purpose |
|---|---|
| `src/hooks/useExperiments.ts` | CRUD hook using Supabase. Exposes `activeExperiment`, `pastExperiments`, `addExperiment`, `checkIn`, `completeExperiment`, `pauseExperiment`. localStorage fallback not needed — uses DB like thoughts/clusters. |
| `src/components/journal/TinyExperimentScreen.tsx` | Three-state screen: (1) Creation — fill-in "I will ___ for ___" with duration picker, (2) Active — shows experiment, today's check-in button, calendar dots, (3) Reflection — Plus/Minus/Next textareas then archive. |

## Modified Files

| File | Change |
|---|---|
| `src/types/journal.ts` | Add `'tinyexperiment'` to `JournalStep` union |
| `src/hooks/useJournal.ts` | Add `openTinyExperiment: () => setCurrentStep('tinyexperiment')` |
| `src/components/journal/JournalApp.tsx` | Add `tinyexperiment` case rendering `TinyExperimentScreen` |
| `src/components/journal/HomeScreen.tsx` | Add button with `Flask` icon in the "More tools" section: `bilingual('Petites expériences', 'Tiny Experiments', 'Pequeños experimentos')` |

## Screen Design

**Creation state** (no active experiment):
- Title: `bilingual('Mes petites expériences', 'My Tiny Experiments', 'Mis pequeños experimentos')`
- Fill-in prompt: "I will `[text input]` for `[duration picker]`"
- Duration options: 1 week / 2 weeks / 1 month (pill buttons)
- Past experiments listed below in a quiet archive section

**Active state** (one running experiment):
- Experiment statement displayed prominently
- Days remaining as a gentle visual indicator (progress bar, not numeric countdown)
- Today's check-in: single tap button — "Did this pull you in today?" (PDA-safe)
- Calendar-dot grid showing past check-in days (filled = showed up)
- Pause button available (grace re-entry)

**Reflection state** (experiment duration ended):
- Plus / Minus / Next textareas (bilingual labels)
- Complete button archives the experiment
- Option to start a new experiment from the "Next" reflection

## Design Principles

- One active experiment at a time (monotropism)
- Check-in is a single tap, not a form
- No guilt for missed days — dots just stay empty
- PDA-safe language throughout ("curious about" not "commit to")
- Bilingual feature name, single-language UI chrome

