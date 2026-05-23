import { describe, it, expect, beforeEach } from 'vitest';
import {
  isStruggling,
  getDailyStep,
  getDailyPhrase,
  getDailyStepLabel,
  isSeedDismissedToday,
  dismissSeedToday,
} from './useSelfCompassion';

const SEED_KEY = 'outputfirst_compassion_seed_dismissed';

beforeEach(() => {
  localStorage.clear();
});

// ---- isStruggling ----

describe('isStruggling', () => {
  it('returns false for undefined', () => {
    expect(isStruggling(undefined)).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isStruggling('')).toBe(false);
  });

  it('returns false for whitespace-only string', () => {
    expect(isStruggling('   ')).toBe(false);
  });

  it('returns false for calm emotion', () => {
    expect(isStruggling('calm')).toBe(false);
  });

  it('returns false for light/joyful emotion', () => {
    expect(isStruggling('grateful')).toBe(false);
  });

  it('returns true for single heavy emotion "tired"', () => {
    expect(isStruggling('tired')).toBe(true);
  });

  it('returns true for "scattered"', () => {
    expect(isStruggling('scattered')).toBe(true);
  });

  it('returns true for "stuck"', () => {
    expect(isStruggling('stuck')).toBe(true);
  });

  it('returns true for "overwhelmed"', () => {
    expect(isStruggling('overwhelmed')).toBe(true);
  });

  it('returns true for "on-edge" (hyphenated)', () => {
    expect(isStruggling('on-edge')).toBe(true);
  });

  it('returns true when mixed calm + heavy emotions', () => {
    expect(isStruggling('calm, overwhelmed')).toBe(true);
  });

  it('returns false for "tiredness" (substring, not exact match)', () => {
    expect(isStruggling('tiredness')).toBe(false);
  });
});

// ---- getDailyStep ----

describe('getDailyStep', () => {
  it('returns deterministic step for the same date', () => {
    const date = new Date(2024, 2, 18); // March 18, 2024
    expect(getDailyStep(date)).toBe(getDailyStep(date));
  });

  it('cycles through 0, 1, 2 on consecutive days', () => {
    // Find three consecutive days that give steps 0, 1, 2 in some order
    const base = new Date(2024, 0, 1); // Jan 1 — dayOfYear=1, step=1
    const day1 = new Date(2024, 0, 2); // dayOfYear=2, step=2
    const day2 = new Date(2024, 0, 3); // dayOfYear=3, step=0
    const day3 = new Date(2024, 0, 4); // dayOfYear=4, step=1

    expect(getDailyStep(base)).toBe(1);
    expect(getDailyStep(day1)).toBe(2);
    expect(getDailyStep(day2)).toBe(0);
    expect(getDailyStep(day3)).toBe(1);
  });

  it('returns 0 for dayOfYear divisible by 3', () => {
    const date = new Date(2024, 0, 3); // dayOfYear=3, 3%3=0
    expect(getDailyStep(date)).toBe(0);
  });

  it('result is always 0, 1, or 2', () => {
    const date = new Date(2024, 5, 15);
    const step = getDailyStep(date);
    expect([0, 1, 2]).toContain(step);
  });
});

// ---- getDailyPhrase ----

describe('getDailyPhrase', () => {
  it('returns a non-empty string for step 0, lang en', () => {
    const phrase = getDailyPhrase(0, 'en', new Date(2024, 2, 18));
    expect(typeof phrase).toBe('string');
    expect(phrase.length).toBeGreaterThan(0);
  });

  it('returns a non-empty string for step 1, lang fr', () => {
    const phrase = getDailyPhrase(1, 'fr', new Date(2024, 2, 18));
    expect(phrase.length).toBeGreaterThan(0);
  });

  it('returns a non-empty string for step 2, lang es', () => {
    const phrase = getDailyPhrase(2, 'es', new Date(2024, 2, 18));
    expect(phrase.length).toBeGreaterThan(0);
  });

  it('returns same phrase for same date (deterministic)', () => {
    const date = new Date(2024, 2, 18);
    expect(getDailyPhrase(0, 'en', date)).toBe(getDailyPhrase(0, 'en', date));
  });

  it('returns different phrase for different dates when indices differ', () => {
    // dayOfYear for Jan 1 = 1, Jan 9 = 9; 1%8=1, 9%8=1 (same) — use Jan 1 vs Jan 2 instead
    // Jan 1: dayOfYear=1, 1%8=1; Jan 2: dayOfYear=2, 2%8=2 → different phrases
    const date1 = new Date(2024, 0, 1);
    const date2 = new Date(2024, 0, 2);
    expect(getDailyPhrase(0, 'en', date1)).not.toBe(getDailyPhrase(0, 'en', date2));
  });

  it('returns different phrase for FR vs EN for same step and date', () => {
    const date = new Date(2024, 2, 18);
    const fr = getDailyPhrase(0, 'fr', date);
    const en = getDailyPhrase(0, 'en', date);
    expect(fr).not.toBe(en);
  });
});

// ---- getDailyStepLabel ----

describe('getDailyStepLabel', () => {
  it('returns French label for step 0', () => {
    expect(getDailyStepLabel(0, 'fr')).toBe('Présence consciente');
  });

  it('returns English label for step 1', () => {
    expect(getDailyStepLabel(1, 'en')).toBe('Common humanity');
  });

  it('returns Spanish label for step 2', () => {
    expect(getDailyStepLabel(2, 'es')).toBe('Bondad hacia uno mismo');
  });
});

// ---- Seed dismissal ----

describe('isSeedDismissedToday / dismissSeedToday', () => {
  it('returns false when nothing is stored', () => {
    expect(isSeedDismissedToday()).toBe(false);
  });

  it('returns true after dismissSeedToday is called', () => {
    dismissSeedToday();
    expect(isSeedDismissedToday()).toBe(true);
  });

  it('returns false when stored date is yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    localStorage.setItem(SEED_KEY, yesterdayStr);
    expect(isSeedDismissedToday()).toBe(false);
  });
});
