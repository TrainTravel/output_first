import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createElement } from 'react';
import type { ReactNode } from 'react';
import { useSmallWins, WINS_STORAGE_KEY } from './useSmallWins';
import {
  LanguageProvider,
  useLanguage,
  DEFAULT_PROFILE_ID,
} from '@/contexts/LanguageContext';
import { profileKey } from './useProfileStorage';

const LEGACY_KEY = 'outputfirst_wins';
const WINS_KEY = profileKey(DEFAULT_PROFILE_ID, WINS_STORAGE_KEY);

function makeWrapper() {
  return ({ children }: { children: ReactNode }) =>
    createElement(LanguageProvider, null, children);
}

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('useSmallWins', () => {
  it('starts with an empty wins list', () => {
    const { result } = renderHook(() => useSmallWins(), { wrapper: makeWrapper() });
    expect(result.current.wins).toEqual([]);
    expect(result.current.winsToday).toEqual([]);
  });

  it('addWin creates a win with today\'s date and a UUID', () => {
    const { result } = renderHook(() => useSmallWins(), { wrapper: makeWrapper() });
    let win: ReturnType<typeof result.current.addWin>;

    act(() => {
      win = result.current.addWin('Replied to all emails');
    });

    const today = new Date().toISOString().split('T')[0];
    expect(win!.text).toBe('Replied to all emails');
    expect(win!.date).toBe(today);
    expect(win!.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(win!.createdAt).toBeTruthy();
  });

  it('addWin returns the created SmallWin object', () => {
    const { result } = renderHook(() => useSmallWins(), { wrapper: makeWrapper() });
    let returned: ReturnType<typeof result.current.addWin>;

    act(() => {
      returned = result.current.addWin('Got out of bed');
    });

    expect(result.current.wins).toHaveLength(1);
    expect(result.current.wins[0].id).toBe(returned!.id);
  });

  it('winsToday filters to only today\'s wins', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const oldWin = {
      id: 'old-1',
      text: 'Old win',
      date: yesterday.toISOString().split('T')[0],
      createdAt: yesterday.toISOString(),
    };
    localStorage.setItem(WINS_KEY, JSON.stringify([oldWin]));

    const { result } = renderHook(() => useSmallWins(), { wrapper: makeWrapper() });

    // Old win loaded but not in winsToday
    expect(result.current.wins).toHaveLength(1);
    expect(result.current.winsToday).toHaveLength(0);

    // Add a win today
    act(() => {
      result.current.addWin('Today win');
    });

    expect(result.current.winsToday).toHaveLength(1);
    expect(result.current.winsToday[0].text).toBe('Today win');
  });

  it('wins persist to localStorage', () => {
    const { result } = renderHook(() => useSmallWins(), { wrapper: makeWrapper() });

    act(() => {
      result.current.addWin('Finished the report');
    });

    const stored = JSON.parse(localStorage.getItem(WINS_KEY) ?? '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].text).toBe('Finished the report');
  });

  it('loads wins from localStorage on mount', () => {
    const today = new Date().toISOString().split('T')[0];
    const existing = [
      { id: 'abc', text: 'Pre-existing win', date: today, createdAt: new Date().toISOString() },
    ];
    localStorage.setItem(WINS_KEY, JSON.stringify(existing));

    const { result } = renderHook(() => useSmallWins(), { wrapper: makeWrapper() });

    expect(result.current.wins).toHaveLength(1);
    expect(result.current.wins[0].text).toBe('Pre-existing win');
    expect(result.current.winsToday).toHaveLength(1);
  });
});

describe('useSmallWins — per-profile isolation', () => {
  it('wins in profile A do not leak to profile B', () => {
    localStorage.setItem('outputfirst_profiles', JSON.stringify({
      profiles: [
        { id: DEFAULT_PROFILE_ID, primary: 'en', target: 'fr', createdAt: '2026-05-27T00:00:00.000Z' },
        { id: 'profile-b', primary: 'en', target: 'es', createdAt: '2026-05-27T00:00:00.000Z' },
      ],
      activeProfileId: DEFAULT_PROFILE_ID,
    }));

    const useBoth = () => ({ wins: useSmallWins(), lang: useLanguage() });
    const { result } = renderHook(useBoth, { wrapper: makeWrapper() });

    act(() => { result.current.wins.addWin('Win in A'); });
    expect(result.current.wins.wins).toHaveLength(1);

    act(() => result.current.lang.switchProfile('profile-b'));
    expect(result.current.wins.wins).toEqual([]);

    act(() => { result.current.wins.addWin('Win in B'); });
    expect(result.current.wins.wins).toHaveLength(1);
    expect(result.current.wins.wins[0].text).toBe('Win in B');

    act(() => result.current.lang.switchProfile(DEFAULT_PROFILE_ID));
    expect(result.current.wins.wins[0].text).toBe('Win in A');
  });

  it('one-shot legacy migration: outputfirst_wins → default profile key', () => {
    const today = new Date().toISOString().split('T')[0];
    const legacy = [
      { id: 'old-1', text: 'Legacy win', date: today, createdAt: new Date().toISOString() },
    ];
    localStorage.setItem(LEGACY_KEY, JSON.stringify(legacy));

    const { result } = renderHook(() => useSmallWins(), { wrapper: makeWrapper() });

    expect(result.current.wins).toHaveLength(1);
    expect(result.current.wins[0].text).toBe('Legacy win');
    expect(localStorage.getItem(LEGACY_KEY)).toBeNull();
    expect(
      localStorage.getItem(`outputfirst_profile_migrated_${WINS_STORAGE_KEY}`),
    ).toBe('true');
  });
});
