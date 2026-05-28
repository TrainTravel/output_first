import { describe, it, expect } from 'vitest';
import { PHILOSOPHER_QUOTES, pickQuoteForDay } from './philosopher-quotes';
import type { TargetLang } from '@/contexts/LanguageContext';

describe('philosopher-quotes data', () => {
  it('every target language in the app has at least one quote', () => {
    const targets: TargetLang[] = ['fr', 'es', 'zh-Hans', 'zh-Hant', 'ja'];
    for (const t of targets) {
      expect(PHILOSOPHER_QUOTES.some(q => q.target === t)).toBe(true);
    }
  });

  it('every quote has the canonical English translation', () => {
    for (const q of PHILOSOPHER_QUOTES) {
      expect(q.translation.en).toBeTruthy();
    }
  });

  it('quote IDs are unique', () => {
    const ids = PHILOSOPHER_QUOTES.map(q => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('pickQuoteForDay', () => {
  it('returns the same quote when called twice for the same day', () => {
    const date = new Date('2026-05-28');
    const a = pickQuoteForDay('fr', date);
    const b = pickQuoteForDay('fr', date);
    expect(a).toEqual(b);
    expect(a).not.toBeNull();
  });

  it('returns different quotes on different days when the pool has >1', () => {
    const frPool = PHILOSOPHER_QUOTES.filter(q => q.target === 'fr');
    expect(frPool.length).toBeGreaterThan(1);
    const day1 = pickQuoteForDay('fr', new Date('2026-05-28'));
    const day2 = pickQuoteForDay('fr', new Date('2026-05-29'));
    expect(day1?.id).not.toBe(day2?.id);
  });

  it('returns a quote whose target matches the requested target', () => {
    const date = new Date('2026-05-28');
    expect(pickQuoteForDay('fr', date)?.target).toBe('fr');
    expect(pickQuoteForDay('ja', date)?.target).toBe('ja');
    expect(pickQuoteForDay('zh-Hans', date)?.target).toBe('zh-Hans');
    expect(pickQuoteForDay('zh-Hant', date)?.target).toBe('zh-Hant');
  });
});
