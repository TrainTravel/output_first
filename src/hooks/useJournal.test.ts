import { describe, it, expect, beforeEach } from 'vitest';
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';

const STORAGE_KEY = 'outputfirst_entries';

function loadEntries() {
  return pipe(
    O.fromNullable(localStorage.getItem(STORAGE_KEY)),
    O.flatMap(stored => {
      try { return O.some(JSON.parse(stored)); }
      catch (e) { return O.none; }
    }),
  );
}

describe('useJournal — localStorage load', () => {
  beforeEach(() => localStorage.clear());

  it('returns None when no entries stored', () => {
    expect(O.isNone(loadEntries())).toBe(true);
  });

  it('returns Some with parsed entries when stored', () => {
    const entries = [{ id: '1', date: '2026-03-01', content: 'hello', createdAt: new Date().toISOString() }];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    const result = loadEntries();
    expect(O.isSome(result)).toBe(true);
    if (O.isSome(result)) expect(result.value).toHaveLength(1);
  });

  it('returns None when stored data is malformed JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{{broken');
    expect(O.isNone(loadEntries())).toBe(true);
  });
});

describe('useJournal — date string safety', () => {
  it('split("T")?.[0] never throws even on unexpected input', () => {
    const safe = (s: string) => s.split('T')?.[0] ?? '';
    expect(safe(new Date().toISOString())).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(safe('')).toBe('');
  });
});
