

## Add Scale-Up Animation to Earned Badges

Simple one-line change: add the existing `animate-scale-in` CSS class to earned badges so they pop with a subtle scale-up effect on mount.

### Change

**`src/components/journal/HomeScreen.tsx`** (line 114):
- Change `earned ? '' : 'opacity-30 grayscale'`
- To `earned ? 'animate-scale-in' : 'opacity-30 grayscale'`

The `animate-scale-in` keyframe (scale 0.95→1 + fade-in, 0.2s) is already defined in the Tailwind config. Earned badges will do a satisfying pop each time the home screen mounts.

