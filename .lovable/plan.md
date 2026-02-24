

# Brain Dump: Thought Capture and Project Builder

## Overview

A new section of OutputFirst designed for capturing scattered thoughts quickly and transforming them over time into organized projects and simple proposals. The design follows ADHD-friendly principles: zero friction input, no blank-page anxiety, and gentle AI-assisted organization.

## Core Concepts

1. **Brain Dump** -- A rapid-fire thought capture screen. Users type or dictate fleeting ideas one at a time (short snippets). No structure required. Just dump everything.
2. **Thought Garden** -- A view of all captured thoughts, loosely grouped by AI-suggested themes. Users can drag/tap to rearrange, merge, or archive.
3. **Projects** -- When a cluster of thoughts starts forming a pattern, users can promote them into a "Project" with a title and collected thoughts.
4. **Proposal Generator** -- AI takes a project's collected thoughts and generates a simple, structured proposal (goal, steps, timeline, why it matters) that users can refine and export.

## User Flow

```text
Home Screen
  |
  +-- [Brain Dump] --> Quick capture screen (one thought at a time)
  |                     |
  |                     +--> Thoughts saved to database
  |
  +-- [My Thoughts] --> Thought Garden (all thoughts, AI-grouped)
  |                     |
  |                     +--> Select thoughts --> Create Project
  |
  +-- [My Projects] --> List of projects
                        |
                        +--> View project --> See collected thoughts
                        |
                        +--> [Generate Proposal] --> AI creates proposal
                        |
                        +--> Edit / Export proposal
```

## What Gets Built

### Database (4 tables)

- **thoughts** -- id, user-anonymous-id (localStorage-based for now), content, created_at, archived, ai_theme (nullable)
- **projects** -- id, user-anonymous-id, title, description, status (draft/active/completed), created_at, updated_at
- **project_thoughts** -- links thoughts to projects (many-to-many)
- **proposals** -- id, project_id, content (markdown), generated_at

Since there's no auth currently, we'll use a localStorage-based anonymous ID to keep things simple and friction-free (aligned with the app's current pattern). No RLS needed since data is filtered client-side by anonymous ID.

### New Screens (4 components)

1. **BrainDumpScreen** -- Large text input, "Add" button, shows last few captured thoughts as fading confirmation. One thought at a time, press Enter to save. Minimal UI, maximum speed.
2. **ThoughtGardenScreen** -- Card grid of all thoughts, optionally grouped by AI-suggested themes. Select multiple to create a project. Archive/delete individual thoughts.
3. **ProjectsScreen** -- List of user's projects with thought count, status. Tap to view details.
4. **ProjectDetailScreen** -- Shows project title, linked thoughts, and a "Generate Proposal" button. Displays the generated proposal with options to copy/share.

### New Edge Function (1)

- **generate-proposal** -- Takes a project's thoughts and generates a structured proposal using Lovable AI (Gemini Flash). Returns a simple markdown proposal with: Goal, Key Ideas, Suggested Steps, Why This Matters.

### Home Screen Update

Add two new buttons to the home screen:
- "Brain Dump" -- quick thought capture
- "My Projects" -- view projects and proposals

### Navigation Update

Add new steps to the JournalStep type and useJournal hook to handle the new screens.

## Technical Details

### New Types (src/types/thoughts.ts)

- `Thought` interface (id, content, createdAt, aiTheme, archived)
- `Project` interface (id, title, description, status, thoughts, createdAt)
- `Proposal` interface (id, projectId, content, generatedAt)
- `ThoughtStep` type added to navigation

### New Hook (src/hooks/useThoughts.ts)

Manages all thought/project CRUD operations against localStorage initially, with the database tables ready for when auth is added.

### Edge Function: generate-proposal

Uses Lovable AI (google/gemini-2.5-flash) to take a collection of raw thoughts and produce a clean, encouraging proposal. The prompt will be bilingual-aware based on the user's language preference.

### ADHD-Friendly Design Principles Applied

- **One thing at a time**: Brain dump shows one input field, not a list to manage
- **Instant gratification**: Each saved thought gets a subtle animation confirmation
- **No blank page**: Placeholder text rotates gentle prompts like "What's on your mind?" / "Any idea, big or small..."
- **Low commitment**: Everything is a "thought" not a "task" -- no pressure to act
- **Gentle organization**: AI groups themes automatically, user doesn't have to categorize
- **Celebration**: Generating a proposal from scattered thoughts is framed as an achievement

