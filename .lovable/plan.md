

# Prioritization in the Reflecting Phase — "Which one pulls you?"

## The Problem with Traditional Prioritization

Asking autistic/ADHD users to **rank** or **compare** items is a high-cost executive function task. It requires holding multiple items in working memory, applying abstract criteria, and making sequential judgments — all of which trigger decision paralysis.

## Approach: Body-First, Not Brain-First

Instead of ranking, we use a **single embodied question** after the sorting phase. When the user reaches the reflecting phase with multiple "Yes" cards, we don't ask "which is most important?" — we ask:

> **"Which one pulls you right now?"**
> *"Laquelle t'attire là, maintenant ?"*

This reframes prioritization from a cognitive task (comparing importance) to an **interoceptive check** (noticing what your body/attention is already drawn to). Monotropic brains already know where the pull is — we just need to give permission to follow it.

## Changes

### `RequestFilterTab.tsx` — Reflecting phase

When the "Yes" bucket has **2+ cards**, add a new sub-phase before showing all cards as equal options:

1. Show a body-anchoring prompt: "Which one pulls you right now?" / "Laquelle t'attire là, maintenant?" / "¿Cuál te atrae ahora mismo?"
2. Cards appear one at a time (carousel-style tap-through), not as a list — avoids comparison paralysis
3. Tapping a card selects it as the goal (same as current behavior)
4. A small "Show all" link at the bottom for users who prefer the list view

When there's only **1 "Yes" card**, skip straight to selection (current behavior).

### Visual treatment
- Each card appears centered with gentle fade-in, large touch target
- Left/right navigation dots (not arrows — less demanding)
- Selected card gets a subtle pulse before transitioning to Focus tab

This is ~40 lines of new UI logic in the reflecting phase, no new components or dependencies needed.

