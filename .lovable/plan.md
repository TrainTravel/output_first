

## Add Thought-to-Cluster Management in Thought Garden

### What You'll Get

Three new ways to organize thoughts into clusters, directly from the Thought Garden screen:

1. **Link individual thoughts to a cluster** -- Each thought card gets a small "link" button. Tap it, pick a cluster from a dropdown, and the thought is added to that cluster instantly.

2. **Bulk-move selected thoughts** -- When you select multiple thoughts (by tapping them), a new "Add to Cluster" button appears alongside the existing "Archive" button. Pick a cluster and all selected thoughts get linked at once.

3. **Convert an AI theme into a cluster** -- Each theme group header gets a new button to automatically create a cluster from that theme name and link all its thoughts into it in one tap.

### How It Works

**ThoughtGardenScreen.tsx changes:**

- Add a small `Link` icon button on each `ThoughtCard` that opens a popover/dropdown listing available clusters. Selecting one calls `addThoughtToCluster`.
- When thoughts are selected (`selectedIds.size > 0`), show an "Add to Cluster" button next to the existing "Archive" button. This opens the same cluster picker and bulk-links all selected thoughts.
- On each theme group header (next to the existing chat button), add a "Convert to Cluster" button. This calls `createCluster(themeName)` then loops through the group's thoughts calling `addThoughtToCluster` for each, and shows a success toast.

**ThoughtCard component updates:**
- Add an `onLinkToCluster` callback prop
- Render a small link icon button (visible on hover, like the existing archive button)

**Cluster picker component:**
- A small reusable popover (using the existing Popover + Command components from shadcn/ui) that lists available clusters and optionally lets you create a new one inline.

**No database changes needed** -- the `cluster_thoughts` table and `addThoughtToCluster` / `createCluster` functions already exist.

### Technical Details

| File | Change |
|------|--------|
| `src/components/journal/ThoughtGardenScreen.tsx` | Add cluster picker popover, bulk "Add to Cluster" button for selected thoughts, "Convert to Cluster" button on theme headers, pass new props to ThoughtCard |
| `ThoughtCard` (inline component) | Add `onLinkToCluster` prop with a link icon button on hover |
| New: `src/components/journal/ClusterPicker.tsx` | Small popover component using Popover + Command that lists clusters and allows selection |

**Flow for "Convert Theme to Cluster":**
1. User taps the convert button on a theme header
2. A new cluster is created with the theme name as title
3. All thoughts in that group are linked to the new cluster via `addThoughtToCluster`
4. Clusters list refreshes, success toast shown
5. Thoughts remain visible in the garden (they're linked, not moved)

**ADHD-friendly considerations:**
- One-tap actions wherever possible (no multi-step modals)
- Thoughts stay visible after linking (no anxiety about "losing" them)
- Bulk operations reduce repetitive work
- Theme-to-cluster conversion removes the need to manually recreate what AI already organized

