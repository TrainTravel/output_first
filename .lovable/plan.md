## Goal

The current body scan silhouette in `BodyScanScreen.tsx` has a thin tapered waist and narrow hips that can read as a "fashion figure" and risk triggering body image anxiety in neurodivergent users (many of whom have overlapping ED / body-image sensitivities — already flagged in `docs/research/adhd-comprehensive-briefing.md`).

Replace it with a gender-neutral, soft rounded form — closer to a soft pillar or column with a rounded head — that still anchors head / shoulders / chest / belly / hands / legs without depicting body proportions.

## Changes

**`src/components/journal/BodyScanScreen.tsx`** — replace only the SVG paths inside the existing `<svg viewBox="0 0 200 500">`:

- **Head**: keep a soft circle, slightly larger and rounder (e.g. `cx=100 cy=52 r=26`) — no neck taper.
- **Neck**: very short, almost flush — a gentle 8px transition, no shoulder slope.
- **Body**: a single soft pillar from shoulders (y≈80) to hip (y≈320). Sides are nearly vertical with only a 4–6px gentle curve (no waist indent, no hip flare). Width ~70 units wide, centered on x=100 (so x≈65 to x≈135). Rounded shoulder corners and rounded hip corners.
- **Arms**: removed as separate side strokes. Instead, hands are anchored as small rounded shapes at the sides of the pillar at hip level (y≈300). This avoids drawing limb thickness at all.
- **Legs**: a single soft rounded base from y≈320 to y≈470, same width as the torso, with a subtle center divot (10–14 units deep) at the bottom to suggest two legs without drawing thin separated limbs.

Keep stroke / fill tokens unchanged (`hsl(var(--primary))` etc.) — only the path geometry changes.

## What stays the same

- `BODY_PARTS` data, `yNorm` values, `xPercent` values — unchanged. The new silhouette is designed around the existing anchor y-positions (0.10 head, 0.22 shoulders, 0.33 chest, 0.47 belly, 0.60 hands, 0.80 legs), so `body-parts.test.ts` (the anatomical reference test, ±0.03) still passes.
- Scan line animation, label reveal logic, translations, copy, `SCAN_DURATION_MS`, `REVEAL_DELAY_MS` — unchanged.
- The `ANATOMICAL_REFERENCE` table in `body-parts.test.ts` — unchanged. The new silhouette places anatomy at the same y%s, so no test update needed.

## Verification

1. Visual check via preview at `/` → trigger Body Scan flow → confirm:
   - Silhouette reads as a soft neutral form, no waist taper, no thin limbs.
   - Each label (head, shoulders, chest, belly, hands, legs) still lands on the corresponding region of the new shape.
   - Scan line still sweeps cleanly top → bottom.
2. Run `body-parts.test.ts` to confirm anatomical anchors still pass.
3. Run typecheck.

## Out of scope

- No copy changes.
- No changes to `BODY_PARTS` data, labels, or translations.
- No changes to scan timing or reveal logic.
- No new tests (existing anatomical reference test already guards label drift).
