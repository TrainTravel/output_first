import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createElement } from 'react';
import type { ReactNode } from 'react';
import {
  LanguageProvider,
  useLanguage,
  DEFAULT_PROFILE_ID,
} from '@/contexts/LanguageContext';
import { profileKey } from './useProfileStorage';
import { EMOTION_VOCAB_KEY } from './useEmotionVocab';
import {
  pickOverUsedVagueWord,
  getOverUsedVagueWordForProfile,
  dismissWordForProfile,
  useFrequencyMirror,
  VAGUE_EMOTIONS,
  USE_THRESHOLD,
  RECENCY_DAYS,
  DISMISS_WINDOW_DAYS,
  FREQ_MIRROR_DISMISS_KEY,
} from './useFrequencyMirror';

const VOCAB_KEY_DEFAULT = profileKey(DEFAULT_PROFILE_ID, EMOTION_VOCAB_KEY);
const DISMISS_KEY_DEFAULT = profileKey(DEFAULT_PROFILE_ID, FREQ_MIRROR_DISMISS_KEY);

const NOW = new Date('2026-05-23T12:00:00Z');

function isoDaysAgo(days: number, now: Date = NOW): string {
  const d = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return d.toISOString().split('T')[0];
}

beforeEach(() => {
  localStorage.clear();
});

function makeWrapper() {
  return ({ children }: { children: ReactNode }) =>
    createElement(LanguageProvider, null, children);
}

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

describe('getOverUsedVagueWordForProfile — reads from per-profile localStorage', () => {
  it('returns null when localStorage is empty', () => {
    expect(getOverUsedVagueWordForProfile(DEFAULT_PROFILE_ID, NOW)).toBeNull();
  });

  it('returns the qualifying word when vocab is seeded under the profile', () => {
    localStorage.setItem(
      VOCAB_KEY_DEFAULT,
      JSON.stringify({
        encountered: ['tired'],
        used: { tired: 7 },
        lastSeen: { tired: isoDaysAgo(1) },
      }),
    );
    expect(getOverUsedVagueWordForProfile(DEFAULT_PROFILE_ID, NOW)).toEqual({ word: 'tired', count: 7 });
  });

  it('returns null when malformed JSON is stored', () => {
    localStorage.setItem(VOCAB_KEY_DEFAULT, 'not-json{');
    expect(getOverUsedVagueWordForProfile(DEFAULT_PROFILE_ID, NOW)).toBeNull();
  });
});

describe('dismissWordForProfile — persists per-word dismissal', () => {
  it('writes a date entry for the given word under the profile key', () => {
    dismissWordForProfile(DEFAULT_PROFILE_ID, 'tired', NOW);
    const raw = localStorage.getItem(DISMISS_KEY_DEFAULT);
    expect(raw).not.toBeNull();
    const stored = JSON.parse(raw!) as Record<string, string>;
    expect(stored.tired).toBe(NOW.toISOString().split('T')[0]);
  });

  it('preserves prior dismissals when adding a new one', () => {
    dismissWordForProfile(DEFAULT_PROFILE_ID, 'tired', NOW);
    dismissWordForProfile(DEFAULT_PROFILE_ID, 'low', NOW);
    const stored = JSON.parse(localStorage.getItem(DISMISS_KEY_DEFAULT)!) as Record<string, string>;
    expect(Object.keys(stored).sort()).toEqual(['low', 'tired']);
  });

  it('a freshly-dismissed word is no longer picked by getOverUsedVagueWordForProfile', () => {
    localStorage.setItem(
      VOCAB_KEY_DEFAULT,
      JSON.stringify({
        encountered: ['tired'],
        used: { tired: 8 },
        lastSeen: { tired: isoDaysAgo(1) },
      }),
    );
    expect(getOverUsedVagueWordForProfile(DEFAULT_PROFILE_ID, NOW)).not.toBeNull();
    dismissWordForProfile(DEFAULT_PROFILE_ID, 'tired', NOW);
    expect(getOverUsedVagueWordForProfile(DEFAULT_PROFILE_ID, NOW)).toBeNull();
  });
});

describe('useFrequencyMirror — per-profile isolation', () => {
  it('dismissals in profile A do not affect profile B', () => {
    // Seed both profiles with the same vocab data.
    const vocab = {
      encountered: ['tired'],
      used: { tired: 8 },
      lastSeen: { tired: isoDaysAgo(1) },
    };
    localStorage.setItem(VOCAB_KEY_DEFAULT, JSON.stringify(vocab));
    localStorage.setItem(profileKey('profile-b', EMOTION_VOCAB_KEY), JSON.stringify(vocab));
    localStorage.setItem('outputfirst_profiles', JSON.stringify({
      profiles: [
        { id: DEFAULT_PROFILE_ID, primary: 'en', target: 'fr', createdAt: '2026-05-27T00:00:00.000Z' },
        { id: 'profile-b', primary: 'en', target: 'es', createdAt: '2026-05-27T00:00:00.000Z' },
      ],
      activeProfileId: DEFAULT_PROFILE_ID,
    }));

    const useBoth = () => ({ mirror: useFrequencyMirror(), lang: useLanguage() });
    const { result } = renderHook(useBoth, { wrapper: makeWrapper() });

    // Both profiles initially surface the nudge.
    expect(result.current.mirror.getOverUsedVagueWord(NOW)).toEqual({ word: 'tired', count: 8 });

    // Dismiss in A.
    act(() => result.current.mirror.dismissWord('tired', NOW));
    expect(result.current.mirror.getOverUsedVagueWord(NOW)).toBeNull();

    // Switch to B — should still surface (dismissal was per-profile).
    act(() => result.current.lang.switchProfile('profile-b'));
    expect(result.current.mirror.getOverUsedVagueWord(NOW)).toEqual({ word: 'tired', count: 8 });
  });

  it('vocab data flows from useEmotionVocab via the shared per-profile key', () => {
    // Seed only profile A's vocab via the same per-profile key useEmotionVocab writes to.
    localStorage.setItem(VOCAB_KEY_DEFAULT, JSON.stringify({
      encountered: ['low'],
      used: { low: 9 },
      lastSeen: { low: isoDaysAgo(1) },
    }));

    const { result } = renderHook(useFrequencyMirror, { wrapper: makeWrapper() });
    expect(result.current.getOverUsedVagueWord(NOW)).toEqual({ word: 'low', count: 9 });
  });
});
