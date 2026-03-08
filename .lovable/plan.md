

## Add Tooltip on Badge Hover

Wrap each badge `span` in a `Tooltip` from shadcn/ui to show the badge name (bilingual), threshold, and earned status on hover.

### Changes

**`HomeScreen.tsx`**:
- Import `Tooltip, TooltipTrigger, TooltipContent, TooltipProvider` from `@/components/ui/tooltip`
- Wrap the badge row in `<TooltipProvider>`
- Wrap each badge `span` in `<Tooltip>` + `<TooltipTrigger>` / `<TooltipContent>`
- Tooltip content shows: badge name (bilingual via `t(badge.fr, badge.en, badge.es).primary`), threshold (e.g., "200 words"), and whether earned (checkmark or "locked")

