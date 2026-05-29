import { describe, it, expect } from 'vitest';
import { COMPASSION_PHRASES, type CompassionLang } from './compassionPhrases';

const LANGS: CompassionLang[] = ['fr', 'en', 'es', 'ja', 'zh-Hans', 'zh-Hant'];

describe('COMPASSION_PHRASES — data shape', () => {
  it('has exactly 3 steps (Mindfulness, Common Humanity, Self-Kindness)', () => {
    expect(COMPASSION_PHRASES).toHaveLength(3);
  });

  it('every step has a label for every language', () => {
    for (const step of COMPASSION_PHRASES) {
      for (const lang of LANGS) {
        expect(step.label[lang]).toBeTruthy();
        expect(typeof step.label[lang]).toBe('string');
      }
    }
  });

  it('every step has exactly 8 phrases per language', () => {
    for (const step of COMPASSION_PHRASES) {
      for (const lang of LANGS) {
        expect(step.phrases[lang]).toHaveLength(8);
      }
    }
  });

  it('no phrase or label is the empty string', () => {
    for (const step of COMPASSION_PHRASES) {
      for (const lang of LANGS) {
        expect(step.label[lang].length).toBeGreaterThan(0);
        for (const phrase of step.phrases[lang]) {
          expect(typeof phrase).toBe('string');
          expect(phrase.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('Simplified vs Traditional phrases use distinct character sets where they should', () => {
    // Mindfulness step #0: 这/這 — first character of phrase[0] should differ.
    const hans0 = COMPASSION_PHRASES[0].phrases['zh-Hans'][0];
    const hant0 = COMPASSION_PHRASES[0].phrases['zh-Hant'][0];
    expect(hans0).not.toBe(hant0);
    expect(hans0.startsWith('这')).toBe(true);
    expect(hant0.startsWith('這')).toBe(true);
  });

  it('Japanese label for step 1 is the canonical 共通の人間性', () => {
    expect(COMPASSION_PHRASES[1].label.ja).toBe('共通の人間性');
  });
});
