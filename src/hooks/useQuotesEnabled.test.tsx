import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QUOTES_ENABLED_KEY, readQuotesEnabled, useQuotesEnabled } from './useQuotesEnabled';

beforeEach(() => {
  localStorage.clear();
});

describe('useQuotesEnabled', () => {
  it('defaults to true when no key is set', () => {
    const { result } = renderHook(() => useQuotesEnabled());
    expect(result.current[0]).toBe(true);
  });

  it('reads "true" / "false" round-trip', () => {
    const { result } = renderHook(() => useQuotesEnabled());
    act(() => result.current[1](false));
    expect(result.current[0]).toBe(false);
    expect(localStorage.getItem(QUOTES_ENABLED_KEY)).toBe('false');
  });

  it('readQuotesEnabled mirrors the persisted state', () => {
    expect(readQuotesEnabled()).toBe(true);
    localStorage.setItem(QUOTES_ENABLED_KEY, 'false');
    expect(readQuotesEnabled()).toBe(false);
    localStorage.setItem(QUOTES_ENABLED_KEY, 'true');
    expect(readQuotesEnabled()).toBe(true);
  });
});
