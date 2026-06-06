import { describe, it, expect } from 'vitest';
import { BODY_PARTS } from './body-parts';

describe('BODY_PARTS data integrity', () => {
  it('ships at least 6 anchors (intent: head-to-toe coverage on a phone screen)', () => {
    expect(BODY_PARTS.length).toBeGreaterThanOrEqual(6);
  });

  it('every body part has all required language fields populated', () => {
    for (const p of BODY_PARTS) {
      expect(p.label.fr.length).toBeGreaterThan(0);
      expect(p.label.en.length).toBeGreaterThan(0);
      expect(p.label.es.length).toBeGreaterThan(0);
      expect(p.label['zh-Hans']?.length ?? 0).toBeGreaterThan(0);
      expect(p.label['zh-Hant']?.length ?? 0).toBeGreaterThan(0);
      expect(p.label.ja?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it('IDs are unique', () => {
    const ids = BODY_PARTS.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('yNorm stays in [0,1] and is sorted head→toe', () => {
    let prev = -Infinity;
    for (const p of BODY_PARTS) {
      expect(p.yNorm).toBeGreaterThanOrEqual(0);
      expect(p.yNorm).toBeLessThanOrEqual(1);
      expect(p.yNorm).toBeGreaterThan(prev);
      prev = p.yNorm;
    }
  });

  it('xPercent stays in [0,100]', () => {
    for (const p of BODY_PARTS) {
      expect(p.xPercent).toBeGreaterThanOrEqual(0);
      expect(p.xPercent).toBeLessThanOrEqual(100);
    }
  });

  it('Simplified and Traditional Chinese diverge on at least one entry (script integrity)', () => {
    // Per CLAUDE.md: don't ship identical Hans/Hant across the board.
    const allIdentical = BODY_PARTS.every(p => p.label['zh-Hans'] === p.label['zh-Hant']);
    expect(allIdentical).toBe(false);
  });

  /**
   * Anatomical reference — where each body part actually sits on the current
   * silhouette in `BodyScanScreen.tsx` (viewBox 0 0 200 500, container 420px
   * tall). If a future silhouette redesign moves a body part, update BOTH
   * `BODY_PARTS.yNorm` AND this reference, OR the label will land on the
   * wrong anatomy. This test is the canary for that drift.
   */
  const ANATOMICAL_REFERENCE: Record<string, number> = {
    head: 0.10,       // ellipse cy=48 (48/500)
    shoulders: 0.22,  // shoulder line y≈108-124 (mid 116/500)
    chest: 0.33,      // upper torso ~y=162-170 (162/500)
    belly: 0.47,      // mid-belly y≈234 (234/500)
    hands: 0.60,      // arms terminate at hip y≈300 (300/500)
    legs: 0.80,       // mid-shin y≈400 (400/500)
  };
  const ANATOMICAL_TOLERANCE = 0.03;

  it('every yNorm anchor is within ±0.03 of the silhouette anatomy reference', () => {
    for (const p of BODY_PARTS) {
      const ref = ANATOMICAL_REFERENCE[p.id];
      expect(ref, `missing reference for body part "${p.id}" — update ANATOMICAL_REFERENCE`).toBeDefined();
      expect(Math.abs(p.yNorm - ref)).toBeLessThanOrEqual(ANATOMICAL_TOLERANCE);
    }
  });
});
