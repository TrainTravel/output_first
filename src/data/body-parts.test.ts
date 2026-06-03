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
});
