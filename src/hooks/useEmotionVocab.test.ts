import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createElement } from 'react';
import type { ReactNode } from 'react';
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';
import {
  LanguageProvider,
  useLanguage,
  DEFAULT_PROFILE_ID,
} from '@/contexts/LanguageContext';
import { profileKey } from './useProfileStorage';
import { useEmotionVocab, EMOTION_VOCAB_KEY } from './useEmotionVocab';

const LEGACY_STORAGE_KEY = 'outputfirst_emotion_vocab';
const STORAGE_KEY = profileKey(DEFAULT_PROFILE_ID, EMOTION_VOCAB_KEY);

beforeEach(() => localStorage.clear());

function makeWrapper() {
  return ({ children }: { children: ReactNode }) =>
    createElement(LanguageProvider, null, children);
}

// Isolated copy of the loadState logic (used in legacy / fallback assertions).
function loadStateAt(key: string) {
  return pipe(
    O.fromNullable(localStorage.getItem(key)),
    O.flatMap(raw => {
      try { return O.some(JSON.parse(raw)); }
      catch { return O.none; }
    }),
    O.getOrElse(() => ({ encountered: [], used: {}, lastSeen: {} })),
  );
}

describe('useEmotionVocab — loadState (per-profile)', () => {
  it('returns empty defaults when localStorage is empty', () => {
    const state = loadStateAt(STORAGE_KEY);
    expect(state).toEqual({ encountered: [], used: {}, lastSeen: {} });
  });

  it('returns parsed state when valid JSON is stored at the prefixed key', () => {
    const stored = { encountered: ['happy', 'sad'], used: { happy: 2 }, lastSeen: { happy: '2026-03-01' } };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    expect(loadStateAt(STORAGE_KEY)).toEqual(stored);
  });

  it('returns empty defaults when stored JSON is malformed', () => {
    localStorage.setItem(STORAGE_KEY, 'not-valid-json{{{');
    expect(loadStateAt(STORAGE_KEY)).toEqual({ encountered: [], used: {}, lastSeen: {} });
  });
});

describe('useEmotionVocab — per-profile isolation', () => {
  it('markUsed in profile A does not leak into profile B', () => {
    localStorage.setItem('outputfirst_profiles', JSON.stringify({
      profiles: [
        { id: DEFAULT_PROFILE_ID, primary: 'en', target: 'fr', createdAt: '2026-05-27T00:00:00.000Z' },
        { id: 'profile-b', primary: 'en', target: 'es', createdAt: '2026-05-27T00:00:00.000Z' },
      ],
      activeProfileId: DEFAULT_PROFILE_ID,
    }));

    const useBoth = () => ({ vocab: useEmotionVocab(), lang: useLanguage() });
    const { result } = renderHook(useBoth, { wrapper: makeWrapper() });

    // Mark a word used under profile A.
    const word = { en: 'curious', fr: 'curieux(se)', es: 'curioso/a' };
    act(() => result.current.vocab.markUsed([word]));
    expect(result.current.vocab.state.used.curious).toBe(1);

    // Switch to B — should be empty.
    act(() => result.current.lang.switchProfile('profile-b'));
    expect(result.current.vocab.state.used.curious).toBeUndefined();
    expect(result.current.vocab.state.encountered).toEqual([]);

    // Mark another word under B.
    const otherWord = { en: 'wistful', fr: 'mélancolique', es: 'nostálgico/a' };
    act(() => result.current.vocab.markEncountered([otherWord]));
    expect(result.current.vocab.state.encountered).toContain('wistful');

    // Back to A.
    act(() => result.current.lang.switchProfile(DEFAULT_PROFILE_ID));
    expect(result.current.vocab.state.used.curious).toBe(1);
    expect(result.current.vocab.state.encountered).not.toContain('wistful');
  });

  it('one-shot legacy migration: outputfirst_emotion_vocab → default profile key', () => {
    const legacyData = { encountered: ['proud'], used: { proud: 3 }, lastSeen: { proud: '2026-05-20' } };
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(legacyData));

    const { result } = renderHook(useEmotionVocab, { wrapper: makeWrapper() });

    // Hook surfaces the migrated state.
    expect(result.current.state.used.proud).toBe(3);
    // Legacy key is removed.
    expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
    // Migration flag is set.
    expect(
      localStorage.getItem(`outputfirst_profile_migrated_${EMOTION_VOCAB_KEY}`),
    ).toBe('true');
  });
});
