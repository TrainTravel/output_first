import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  useEngagement,
  tickEngagement,
  readEngagementCount,
  ENGAGEMENT_FEEDBACK_THRESHOLD,
  ENGAGEMENT_TIP_JAR_THRESHOLD,
  FEEDBACK_PROMPT_DELAY_MS,
  FEEDBACK_ELIGIBLE_EVENT,
} from './useEngagement';

const STORAGE_KEY = 'outputfirst_engagement_count';
const FEEDBACK_ELIGIBLE_KEY = 'feedback-eligible';

beforeEach(() => {
  localStorage.clear();
});

describe('useEngagement', () => {
  it('returns 0 on a fresh install', () => {
    const { result } = renderHook(() => useEngagement());
    expect(result.current.count).toBe(0);
  });

  it('reads a pre-existing count from localStorage', () => {
    localStorage.setItem(STORAGE_KEY, '7');
    const { result } = renderHook(() => useEngagement());
    expect(result.current.count).toBe(7);
  });

  it('clamps malformed values to 0', () => {
    localStorage.setItem(STORAGE_KEY, 'not-a-number');
    const { result } = renderHook(() => useEngagement());
    expect(result.current.count).toBe(0);
  });

  it('clamps negative values to 0', () => {
    localStorage.setItem(STORAGE_KEY, '-3');
    const { result } = renderHook(() => useEngagement());
    expect(result.current.count).toBe(0);
  });
});

describe('tickEngagement', () => {
  it('increments by one from a fresh start', () => {
    expect(readEngagementCount()).toBe(0);
    tickEngagement();
    expect(readEngagementCount()).toBe(1);
  });

  it('is monotonic across many ticks', () => {
    for (let i = 0; i < 10; i++) tickEngagement();
    expect(readEngagementCount()).toBe(10);
  });

  it('continues from a pre-seeded count', () => {
    localStorage.setItem(STORAGE_KEY, '3');
    tickEngagement();
    expect(readEngagementCount()).toBe(4);
  });

  it('does not throw when malformed data is present', () => {
    localStorage.setItem(STORAGE_KEY, 'garbage');
    expect(() => tickEngagement()).not.toThrow();
    expect(readEngagementCount()).toBe(1);
  });
});

describe('thresholds', () => {
  it('feedback threshold is lower than tip-jar threshold', () => {
    expect(ENGAGEMENT_FEEDBACK_THRESHOLD).toBeLessThan(ENGAGEMENT_TIP_JAR_THRESHOLD);
  });

  it('feedback threshold is at least 2 — never on first session', () => {
    expect(ENGAGEMENT_FEEDBACK_THRESHOLD).toBeGreaterThanOrEqual(2);
  });
});

describe('feedback prompt scheduling', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('does NOT set feedback-eligible synchronously on the first tick', () => {
    tickEngagement();
    expect(localStorage.getItem(FEEDBACK_ELIGIBLE_KEY)).toBeNull();
  });

  it('sets feedback-eligible after FEEDBACK_PROMPT_DELAY_MS on the first tick', () => {
    tickEngagement();
    vi.advanceTimersByTime(FEEDBACK_PROMPT_DELAY_MS - 1);
    expect(localStorage.getItem(FEEDBACK_ELIGIBLE_KEY)).toBeNull();
    vi.advanceTimersByTime(1);
    expect(localStorage.getItem(FEEDBACK_ELIGIBLE_KEY)).toBe('true');
  });

  it('dispatches the FEEDBACK_ELIGIBLE_EVENT when the timer fires', () => {
    const listener = vi.fn();
    window.addEventListener(FEEDBACK_ELIGIBLE_EVENT, listener);
    tickEngagement();
    vi.advanceTimersByTime(FEEDBACK_PROMPT_DELAY_MS);
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(FEEDBACK_ELIGIBLE_EVENT, listener);
  });

  it('does NOT schedule a second timer on subsequent ticks', () => {
    const listener = vi.fn();
    window.addEventListener(FEEDBACK_ELIGIBLE_EVENT, listener);
    tickEngagement(); // 0 → 1, schedules
    tickEngagement(); // 1 → 2, no schedule
    tickEngagement(); // 2 → 3, no schedule
    vi.advanceTimersByTime(FEEDBACK_PROMPT_DELAY_MS);
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(FEEDBACK_ELIGIBLE_EVENT, listener);
  });

  it('does NOT schedule when feedback-eligible is already true (legacy users)', () => {
    localStorage.setItem(FEEDBACK_ELIGIBLE_KEY, 'true');
    const listener = vi.fn();
    window.addEventListener(FEEDBACK_ELIGIBLE_EVENT, listener);
    tickEngagement();
    vi.advanceTimersByTime(FEEDBACK_PROMPT_DELAY_MS * 2);
    expect(listener).not.toHaveBeenCalled();
    window.removeEventListener(FEEDBACK_ELIGIBLE_EVENT, listener);
  });

  it('still increments the engagement counter even when scheduling is skipped', () => {
    localStorage.setItem(FEEDBACK_ELIGIBLE_KEY, 'true');
    tickEngagement();
    expect(readEngagementCount()).toBe(1);
  });
});
