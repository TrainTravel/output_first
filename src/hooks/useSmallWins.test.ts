import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSmallWins } from './useSmallWins';

const WINS_KEY = 'outputfirst_wins';

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('useSmallWins', () => {
  it('starts with an empty wins list', () => {
    const { result } = renderHook(() => useSmallWins());
    expect(result.current.wins).toEqual([]);
    expect(result.current.winsToday).toEqual([]);
  });

  it('addWin creates a win with today\'s date and a UUID', () => {
    const { result } = renderHook(() => useSmallWins());
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
    const { result } = renderHook(() => useSmallWins());
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

    const { result } = renderHook(() => useSmallWins());

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
    const { result } = renderHook(() => useSmallWins());

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

    const { result } = renderHook(() => useSmallWins());

    expect(result.current.wins).toHaveLength(1);
    expect(result.current.wins[0].text).toBe('Pre-existing win');
    expect(result.current.winsToday).toHaveLength(1);
  });
});
