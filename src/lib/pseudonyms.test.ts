import { describe, expect, it } from 'vitest';
import { fnvHash, pickPseudonym, PSEUDONYM_POOL, type PseudonymLang } from './pseudonyms';

describe('fnvHash', () => {
  it('returns a 32-bit unsigned integer', () => {
    const h = fnvHash('hello');
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThanOrEqual(0xffffffff);
  });

  it('is deterministic for the same input', () => {
    expect(fnvHash('same')).toBe(fnvHash('same'));
  });

  it('differs for different inputs', () => {
    expect(fnvHash('a')).not.toBe(fnvHash('b'));
  });
});

describe('PSEUDONYM_POOL', () => {
  it('has at least 15 entries in every language', () => {
    for (const lang of Object.keys(PSEUDONYM_POOL) as PseudonymLang[]) {
      expect(PSEUDONYM_POOL[lang].length).toBeGreaterThanOrEqual(15);
    }
  });

  it('has no duplicates within a language', () => {
    for (const lang of Object.keys(PSEUDONYM_POOL) as PseudonymLang[]) {
      const pool = PSEUDONYM_POOL[lang];
      const unique = new Set(pool);
      expect(unique.size).toBe(pool.length);
    }
  });
});

describe('pickPseudonym', () => {
  it('returns a pseudonym from the requested language pool', () => {
    for (const lang of Object.keys(PSEUDONYM_POOL) as PseudonymLang[]) {
      const name = pickPseudonym(lang, 'seed-123');
      expect(PSEUDONYM_POOL[lang]).toContain(name);
    }
  });

  it('is stable for the same (language, seed)', () => {
    const a = pickPseudonym('en', 'seed-x');
    const b = pickPseudonym('en', 'seed-x');
    expect(a).toBe(b);
  });

  it('returns different pseudonyms for different seeds (probabilistically)', () => {
    // 20 names in the pool, FNV → very unlikely to collide across these seeds.
    const names = new Set(
      Array.from({ length: 20 }, (_, i) => pickPseudonym('en', `seed-${i}`)),
    );
    expect(names.size).toBeGreaterThan(1);
  });
});
