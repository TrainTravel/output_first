import { describe, it, expect, beforeEach } from 'vitest';
import {
  pickOverUsedVagueWord,
  getOverUsedVagueWord,
  dismissWord,
  VAGUE_EMOTIONS,
  USE_THRESHOLD,
  RECENCY_DAYS,
  DISMISS_WINDOW_DAYS,
} from './useFrequencyMirror';

const VOCAB_KEY = 'outputfirst_emotion_vocab';
const DISMISS_KEY = 'outputfirst_freq_mirror_dismissed';

const NOW = new Date('2026-05-23T12:00:00Z');

function isoDaysAgo(days: number, now: Date = NOW): string {
  const d = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return d.toISOString().split('T')[0];
}

beforeEach(() => {
  localStorage.clear();
});

describe('pickOverUsedVagueWord — pure picker', () => {
  it('returns null when vocab is empty', () => {
    const result = pickOverUsedVagueWord(
      { encountered: [], used: {}, lastSeen: {} },
      {},
      NOW,
    );
    expect(result).toBeNull();
  });

  it('returns null when only a non-vague word is over-used', () => {
    // `grateful` is in the Light category — not vague
    const result = pickOverUsedVagueWord(
      {
        encountered: ['grateful'],
        used: { grateful: 10 },
        lastSeen: { grateful: isoDaysAgo(1) },
      },
      {},
      NOW,
    );
    expect(result).toBeNull();
  });

  it('returns the qualifying word with correct count', () => {
    const result = pickOverUsedVagueWord(
      {
        encountered: ['tired'],
        used: { tired: 6 },
        lastSeen: { tired: isoDaysAgo(1) },
      },
      {},
      NOW,
    );
    expect(result).toEqual({ word: 'tired', count: 6 });
  });

  it('returns null when use count is below threshold', () => {
    // USE_THRESHOLD is 5, so count of 4 shouldn't trigger.
    const result = pickOverUsedVagueWord(
      {
        encountered: ['tired'],
        used: { tired: USE_THRESHOLD - 1 },
        lastSeen: { tired: isoDaysAgo(1) },
      },
      {},
      NOW,
    );
    expect(result).toBeNull();
  });

  it('returns null when lastSeen is older than the recency window', () => {
    const result = pickOverUsedVagueWord(
      {
        encountered: ['tired'],
        used: { tired: 10 },
        lastSeen: { tired: isoDaysAgo(RECENCY_DAYS + 1) },
      },
      {},
      NOW,
    );
    expect(result).toBeNull();
  });

  it('returns null when there is no lastSeen entry for the word', () => {
    const result = pickOverUsedVagueWord(
      {
        encountered: ['tired'],
        used: { tired: 10 },
        lastSeen: {},
      },
      {},
      NOW,
    );
    expect(result).toBeNull();
  });

  it('picks the highest-count word when multiple qualify', () => {
    const result = pickOverUsedVagueWord(
      {
        encountered: ['tired', 'low', 'overwhelmed'],
        used: { tired: 6, low: 9, overwhelmed: 5 },
        lastSeen: {
          tired: isoDaysAgo(1),
          low: isoDaysAgo(2),
          overwhelmed: isoDaysAgo(3),
        },
      },
      {},
      NOW,
    );
    expect(result).toEqual({ word: 'low', count: 9 });
  });

  it('tie-breaks on most-recent lastSeen when counts are equal', () => {
    const result = pickOverUsedVagueWord(
      {
        encountered: ['tired', 'low'],
        used: { tired: 6, low: 6 },
        lastSeen: { tired: isoDaysAgo(5), low: isoDaysAgo(1) },
      },
      {},
      NOW,
    );
    expect(result).toEqual({ word: 'low', count: 6 });
  });

  it('skips a word dismissed within the suppression window', () => {
    const result = pickOverUsedVagueWord(
      {
        encountered: ['tired'],
        used: { tired: 8 },
        lastSeen: { tired: isoDaysAgo(1) },
      },
      { tired: isoDaysAgo(3) },
      NOW,
    );
    expect(result).toBeNull();
  });

  it('reappears once the dismissal window has elapsed', () => {
    const result = pickOverUsedVagueWord(
      {
        encountered: ['tired'],
        used: { tired: 8 },
        lastSeen: { tired: isoDaysAgo(1) },
      },
      { tired: isoDaysAgo(DISMISS_WINDOW_DAYS + 1) },
      NOW,
    );
    expect(result).toEqual({ word: 'tired', count: 8 });
  });

  it('honors per-word dismissal — a different word can still surface', () => {
    const result = pickOverUsedVagueWord(
      {
        encountered: ['tired', 'low'],
        used: { tired: 9, low: 6 },
        lastSeen: { tired: isoDaysAgo(1), low: isoDaysAgo(2) },
      },
      { tired: isoDaysAgo(3) },
      NOW,
    );
    expect(result).toEqual({ word: 'low', count: 6 });
  });
});

describe('VAGUE_EMOTIONS set', () => {
  it('includes "tired"', () => {
    expect(VAGUE_EMOTIONS.has('tired')).toBe(true);
  });

  it('includes "low"', () => {
    expect(VAGUE_EMOTIONS.has('low')).toBe(true);
  });

  it('does NOT include precise emotions like "wistful"', () => {
    expect(VAGUE_EMOTIONS.has('wistful')).toBe(false);
  });

  it('does NOT include "grateful"', () => {
    expect(VAGUE_EMOTIONS.has('grateful')).toBe(false);
  });
});

describe('getOverUsedVagueWord — reads from localStorage', () => {
  it('returns null when localStorage is empty', () => {
    expect(getOverUsedVagueWord(NOW)).toBeNull();
  });

  it('returns the qualifying word when vocab is seeded', () => {
    localStorage.setItem(
      VOCAB_KEY,
      JSON.stringify({
        encountered: ['tired'],
        used: { tired: 7 },
        lastSeen: { tired: isoDaysAgo(1) },
      }),
    );
    expect(getOverUsedVagueWord(NOW)).toEqual({ word: 'tired', count: 7 });
  });

  it('returns null when malformed JSON is stored', () => {
    localStorage.setItem(VOCAB_KEY, 'not-json{');
    expect(getOverUsedVagueWord(NOW)).toBeNull();
  });
});

describe('dismissWord — persists per-word dismissal', () => {
  it('writes a date entry for the given word', () => {
    dismissWord('tired', NOW);
    const raw = localStorage.getItem(DISMISS_KEY);
    expect(raw).not.toBeNull();
    const stored = JSON.parse(raw!) as Record<string, string>;
    expect(stored.tired).toBe(NOW.toISOString().split('T')[0]);
  });

  it('preserves prior dismissals when adding a new one', () => {
    dismissWord('tired', NOW);
    dismissWord('low', NOW);
    const stored = JSON.parse(localStorage.getItem(DISMISS_KEY)!) as Record<string, string>;
    expect(Object.keys(stored).sort()).toEqual(['low', 'tired']);
  });

  it('a freshly-dismissed word is no longer picked by getOverUsedVagueWord', () => {
    localStorage.setItem(
      VOCAB_KEY,
      JSON.stringify({
        encountered: ['tired'],
        used: { tired: 8 },
        lastSeen: { tired: isoDaysAgo(1) },
      }),
    );
    expect(getOverUsedVagueWord(NOW)).not.toBeNull();
    dismissWord('tired', NOW);
    expect(getOverUsedVagueWord(NOW)).toBeNull();
  });
});
