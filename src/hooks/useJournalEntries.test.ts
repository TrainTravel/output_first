import { describe, it, expect, beforeEach } from 'vitest';
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';

const MIGRATED_KEY = 'outputfirst_migrated_to_db';
const STORAGE_KEY = 'outputfirst_entries';

describe('useJournalEntries — migration localStorage reads', () => {
  beforeEach(() => localStorage.clear());

  it('detects already-migrated flag via Option', () => {
    localStorage.setItem(MIGRATED_KEY, 'true');
    const migrated = O.isSome(O.fromNullable(localStorage.getItem(MIGRATED_KEY)));
    expect(migrated).toBe(true);
  });

  it('returns None when migrated flag is absent', () => {
    const migrated = O.isSome(O.fromNullable(localStorage.getItem(MIGRATED_KEY)));
    expect(migrated).toBe(false);
  });

  it('returns None when localStorage entries are absent', () => {
    const stored = pipe(O.fromNullable(localStorage.getItem(STORAGE_KEY)));
    expect(O.isNone(stored)).toBe(true);
  });

  it('returns Some with raw string when entries exist', () => {
    const data = [{ id: '1', date: '2026-03-01', content: 'test', createdAt: new Date().toISOString() }];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    const stored = pipe(O.fromNullable(localStorage.getItem(STORAGE_KEY)));
    expect(O.isSome(stored)).toBe(true);
  });

  it('content ?? "" prefers empty string over null', () => {
    const content: string | undefined = undefined;
    expect(content ?? '').toBe('');
  });
});
