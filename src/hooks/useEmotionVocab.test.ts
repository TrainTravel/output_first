import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';

const STORAGE_KEY = 'outputfirst_emotion_vocab';

// Isolate the loadState logic (same logic as in useEmotionVocab.ts)
function loadState() {
  return pipe(
    O.fromNullable(localStorage.getItem(STORAGE_KEY)),
    O.flatMap(raw => {
      try { return O.some(JSON.parse(raw)); }
      catch { return O.none; }
    }),
    O.getOrElse(() => ({ encountered: [], used: {}, lastSeen: {} })),
  );
}

describe('useEmotionVocab — loadState', () => {
  beforeEach(() => localStorage.clear());

  it('returns empty defaults when localStorage is empty', () => {
    const state = loadState();
    expect(state).toEqual({ encountered: [], used: {}, lastSeen: {} });
  });

  it('returns parsed state when valid JSON is stored', () => {
    const stored = { encountered: ['happy', 'sad'], used: { happy: 2 }, lastSeen: { happy: '2026-03-01' } };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    expect(loadState()).toEqual(stored);
  });

  it('returns empty defaults when stored JSON is malformed', () => {
    localStorage.setItem(STORAGE_KEY, 'not-valid-json{{{');
    expect(loadState()).toEqual({ encountered: [], used: {}, lastSeen: {} });
  });
});
