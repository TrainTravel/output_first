import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import type { ReactNode } from 'react';
import { LanguageProvider } from '@/contexts/LanguageContext';

// Hoisted state so the vi.mock factories can read/write it.
const { mockInsertResult, mockUserId } = vi.hoisted(() => ({
  mockInsertResult: { error: null as null | { message: string } },
  mockUserId: 'test-user-id',
}));

const insertSpy = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/useUserId', () => ({
  useUserId: () => mockUserId,
}));

vi.mock('@/integrations/supabase/client', () => {
  const fromBuilder = {
    insert: (...args: unknown[]) => {
      insertSpy(...args);
      return Promise.resolve(mockInsertResult);
    },
  };
  return {
    supabase: {
      from: vi.fn(() => fromBuilder),
    },
  };
});

import { useProWaitlist } from './useProWaitlist';

beforeEach(() => {
  localStorage.clear();
  mockInsertResult.error = null;
  insertSpy.mockClear();
});

function wrapper({ children }: { children: ReactNode }) {
  return createElement(LanguageProvider, null, children);
}

describe('useProWaitlist — surface', () => {
  it('starts unsubmitted and not loading', () => {
    const { result } = renderHook(() => useProWaitlist(), { wrapper });
    expect(result.current.submitted).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('submit() inserts the vote with normalized fields and marks submitted', async () => {
    const { result } = renderHook(() => useProWaitlist(), { wrapper });

    await act(async () => {
      const res = await result.current.submit({
        features: ['sync', 'voice'],
        otherText: '  a quiet wish  ',
        email: 'user@example.com',
      });
      expect(res.ok).toBe(true);
    });

    expect(insertSpy).toHaveBeenCalledTimes(1);
    const payload = insertSpy.mock.calls[0][0];
    expect(payload).toMatchObject({
      user_anonymous_id: 'test-user-id',
      email: 'user@example.com',
      features: ['sync', 'voice'],
      other_text: 'a quiet wish',
    });
    expect(typeof payload.primary_lang).toBe('string');
    expect(typeof payload.target_lang).toBe('string');

    await waitFor(() => expect(result.current.submitted).toBe(true));
  });

  it('omits an invalid email and persists null instead', async () => {
    const { result } = renderHook(() => useProWaitlist(), { wrapper });
    await act(async () => {
      await result.current.submit({
        features: ['voice'],
        email: 'not-an-email',
      });
    });
    const payload = insertSpy.mock.calls[0][0];
    expect(payload.email).toBeNull();
  });

  it('omits an empty other_text and persists null instead', async () => {
    const { result } = renderHook(() => useProWaitlist(), { wrapper });
    await act(async () => {
      await result.current.submit({
        features: ['export'],
        otherText: '   ',
      });
    });
    const payload = insertSpy.mock.calls[0][0];
    expect(payload.other_text).toBeNull();
  });

  it('still marks submitted=true when Supabase returns an error — the user voted', async () => {
    mockInsertResult.error = { message: 'rls violation' };
    const { result } = renderHook(() => useProWaitlist(), { wrapper });

    await act(async () => {
      const res = await result.current.submit({
        features: ['sync'],
      });
      expect(res.ok).toBe(false);
    });

    await waitFor(() => expect(result.current.submitted).toBe(true));
    expect(result.current.error).toBe('rls violation');
  });

  it('a second hook instance sees the persisted submitted state', async () => {
    const { result } = renderHook(() => useProWaitlist(), { wrapper });
    await act(async () => {
      await result.current.submit({ features: ['sync'] });
    });

    const { result: second } = renderHook(() => useProWaitlist(), { wrapper });
    expect(second.current.submitted).toBe(true);
  });
});
