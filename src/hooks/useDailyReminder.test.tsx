import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDailyReminder } from './useDailyReminder';

vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    requestPermissions: vi.fn(async () => ({ display: 'granted' })),
    schedule: vi.fn(async () => undefined),
    cancel: vi.fn(async () => undefined),
  },
}));

// Stay on the "web" branch so we don't exercise the native plugin path.
vi.mock('@/lib/native', () => ({ isNative: () => false }));

const ENABLED_KEY = 'outputfirst_reminder_enabled';
const TIME_KEY = 'outputfirst_reminder_time';

beforeEach(() => {
  localStorage.clear();
});

describe('useDailyReminder', () => {
  it('defaults to disabled with 20:00 reminder time', () => {
    const { result } = renderHook(() => useDailyReminder());
    expect(result.current.enabled).toBe(false);
    expect(result.current.time).toBe('20:00');
  });

  it('setEnabled(true) persists and returns true on web (no permission prompt path)', async () => {
    const { result } = renderHook(() => useDailyReminder());
    let ok = false;
    await act(async () => { ok = await result.current.setEnabled(true); });
    expect(ok).toBe(true);
    expect(result.current.enabled).toBe(true);
    expect(localStorage.getItem(ENABLED_KEY)).toBe('true');
  });

  it('setEnabled(false) clears the persisted flag', async () => {
    localStorage.setItem(ENABLED_KEY, 'true');
    const { result } = renderHook(() => useDailyReminder());
    expect(result.current.enabled).toBe(true);
    await act(async () => { await result.current.setEnabled(false); });
    expect(result.current.enabled).toBe(false);
    expect(localStorage.getItem(ENABLED_KEY)).toBe('false');
  });

  it('setTime accepts a valid HH:mm and persists', async () => {
    const { result } = renderHook(() => useDailyReminder());
    await act(async () => { await result.current.setTime('07:30'); });
    expect(result.current.time).toBe('07:30');
    expect(localStorage.getItem(TIME_KEY)).toBe('07:30');
  });

  it('setTime ignores a malformed value', async () => {
    const { result } = renderHook(() => useDailyReminder());
    await act(async () => { await result.current.setTime('not-a-time'); });
    expect(result.current.time).toBe('20:00');
    expect(localStorage.getItem(TIME_KEY)).toBeNull();
  });

  it('reads a pre-seeded enabled=true + time from localStorage', () => {
    localStorage.setItem(ENABLED_KEY, 'true');
    localStorage.setItem(TIME_KEY, '08:15');
    const { result } = renderHook(() => useDailyReminder());
    expect(result.current.enabled).toBe(true);
    expect(result.current.time).toBe('08:15');
  });
});
