import { describe, it, expect } from 'vitest';
import { GRATITUDE_PROMPTS, EXPRESSIVE_PROMPTS, promptHeadingClass } from './journal';

const HEAVY_MARKERS = [
  'write about a hard experience',
  'What causes you stress',
  'touched the people around you',
  'What would you do differently',
  'What did you learn from it',
  'help someone else',
];

describe('prompt pools', () => {
  it('keeps the gratitude rotation light', () => {
    expect(GRATITUDE_PROMPTS).toHaveLength(6);
    for (const p of GRATITUDE_PROMPTS) {
      for (const marker of HEAVY_MARKERS) {
        expect(p.en).not.toContain(marker);
      }
    }
  });

  it('holds the heavier prompts in the expressive pool', () => {
    expect(EXPRESSIVE_PROMPTS).toHaveLength(6);
    for (const marker of HEAVY_MARKERS) {
      expect(EXPRESSIVE_PROMPTS.some(p => p.en.includes(marker))).toBe(true);
    }
  });

  it('ships every language variant in both pools', () => {
    for (const p of [...GRATITUDE_PROMPTS, ...EXPRESSIVE_PROMPTS]) {
      expect(p.en.length).toBeGreaterThan(0);
      expect(p.fr.length).toBeGreaterThan(0);
      expect(p.zhHans?.length ?? 0).toBeGreaterThan(0);
      expect(p.zhHant?.length ?? 0).toBeGreaterThan(0);
    }
  });
});

describe('promptHeadingClass', () => {
  it('keeps short prompts at full size', () => {
    expect(promptHeadingClass('What simple comfort did you enjoy?')).toBe('text-2xl md:text-3xl');
  });

  it('steps long prompts down a size', () => {
    expect(promptHeadingClass(EXPRESSIVE_PROMPTS[4].en)).toBe('text-xl md:text-2xl');
  });
});
