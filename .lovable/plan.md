
## Concise Badge Display Redesign

**Current issues**: 
- Three separate visual sections (streak/days, word count + latest badge, all badges + progress hint) create vertical bloat
- Redundant badge information (latest badge displayed + all badges shown again below)
- Progress hint takes up extra line

**Design goal**: Collapse into a single, elegant compact row that's less space-consuming while maintaining all key information.

**Proposed layout** (new structure):
```
┌─ Progress Card ─────────────────────┐
│ 🔥 3  │  📅 12  │  ✍️ 143 words    │
│ 🌱 ✍️ 🎙️ 📖 🌿 🌳  (143/200)      │
└─────────────────────────────────────┘
```

**Changes to HomeScreen.tsx**:

1. **Compress streak/days header** (lines 94–112):
   - Change from 2-column grid with labels to single-row inline display
   - Remove labels below numbers; use tooltips on hover instead
   - Format: `🔥 3  │  📅 12  │  ✍️ 143 words` (compact, one line)

2. **Remove redundant badge section** (lines 114–127):
   - Delete the "current badge + word count" section entirely (it duplicates info shown in badge row)
   - Keep only the badge row with progress hint

3. **Compact badge row** (lines 130–153):
   - Move all badges + progress hint into a single line with inline progress notation
   - Format: `🌱 ✍️ 🎙️ 📖 🌿 🌳  (143/200)`
   - Remove tooltip from badges; let the compact layout speak

**Visual result**: Progress card drops from ~100px to ~60px, two compact lines instead of four sections, same information at a glance.

**Files affected**:
- `src/components/journal/HomeScreen.tsx` (lines 89–154): Restructure the progress card layout
