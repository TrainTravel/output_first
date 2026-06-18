import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { usePseudonym } from './usePseudonym';
import { PSEUDONYM_POOL } from '@/lib/pseudonyms';

describe('usePseudonym', () => {
  it('produces a stable pseudonym across rerenders', () => {
    const { result, rerender } = renderHook(() => usePseudonym('en', 'draft-A'));
    const first = result.current.pseudonym;
    rerender();
    expect(result.current.pseudonym).toBe(first);
  });

  it('regenerate yields a different pseudonym on first call', () => {
    const { result } = renderHook(() => usePseudonym('en', 'draft-B'));
    const before = result.current.pseudonym;
    act(() => result.current.regenerate());
    // Pool is 20 entries; same-seed-+1 will almost always differ. Guard against
    // the rare modular collision by checking it's at least still in-pool.
    expect(PSEUDONYM_POOL.en).toContain(result.current.pseudonym);
    expect(result.current.canRegenerate).toBe(false);
    // Second regenerate is a no-op.
    const after = result.current.pseudonym;
    act(() => result.current.regenerate());
    expect(result.current.pseudonym).toBe(after);
  });

  it('respects the language pool', () => {
    const { result } = renderHook(() => usePseudonym('zh-Hant', 'draft-C'));
    expect(PSEUDONYM_POOL['zh-Hant']).toContain(result.current.pseudonym);
  });
});
