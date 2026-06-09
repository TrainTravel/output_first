import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import type { ReactNode } from 'react';
import { LanguageProvider } from '@/contexts/LanguageContext';

// Hoisted shared state so the vi.mock factories can read/write it
// from inside their module scope.
const { mockThoughtsResult, mockUserId } = vi.hoisted(() => ({
  mockThoughtsResult: {
    data: [] as Array<{ id: string; content: string; quadrant: string | null }>,
    error: null as null | Error,
  },
  mockUserId: 'test-user-id',
}));

vi.mock('@/hooks/useUserId', () => ({
  useUserId: () => mockUserId,
}));

vi.mock('@/integrations/supabase/client', () => {
  const builder: Record<string, unknown> = {};
  builder.select = vi.fn(() => builder);
  builder.eq = vi.fn(() => builder);
  builder.not = vi.fn(() => builder);
  builder.order = vi.fn(() => Promise.resolve(mockThoughtsResult));
  return {
    supabase: {
      from: vi.fn(() => builder),
    },
  };
});

// Imported AFTER mocks are declared so the hook picks them up.
import { useQuadrants } from './useQuadrants';
import { useTodoList } from './useTodoList';

beforeEach(() => {
  localStorage.clear();
  mockThoughtsResult.data = [];
  mockThoughtsResult.error = null;
});

function wrapper({ children }: { children: ReactNode }) {
  return createElement(LanguageProvider, null, children);
}

describe('useQuadrants — empty + loading', () => {
  it('reports isEmpty after the thought fetch settles with no data', async () => {
    const { result } = renderHook(() => useQuadrants(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isEmpty).toBe(true);
    expect(result.current.totalCount).toBe(0);
    expect(result.current.buckets.q1).toEqual([]);
    expect(result.current.buckets.q2).toEqual([]);
    expect(result.current.buckets.q3).toEqual([]);
    expect(result.current.buckets.q4).toEqual([]);
  });
});

describe('useQuadrants — ABC → quadrant projection for todos', () => {
  it('A → q1, B → q2, C → q4 (q3 stays empty for todos)', async () => {
    const { result: todoResult } = renderHook(() => useTodoList(), { wrapper });
    act(() => {
      const idA = todoResult.current.addItem('Pay tax bill');
      todoResult.current.setPriority(idA, 'A');
      const idB = todoResult.current.addItem('Plan vacation');
      todoResult.current.setPriority(idB, 'B');
      const idC = todoResult.current.addItem('Reorganize desk');
      todoResult.current.setPriority(idC, 'C');
    });

    const { result } = renderHook(() => useQuadrants(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.buckets.q1.map(i => i.content)).toEqual(['Pay tax bill']);
    expect(result.current.buckets.q2.map(i => i.content)).toEqual(['Plan vacation']);
    expect(result.current.buckets.q3).toEqual([]);
    expect(result.current.buckets.q4.map(i => i.content)).toEqual(['Reorganize desk']);
  });

  it('completed todos are filtered out of every quadrant', async () => {
    const { result: todoResult } = renderHook(() => useTodoList(), { wrapper });
    let idA = '';
    act(() => {
      idA = todoResult.current.addItem('Urgent thing');
      todoResult.current.setPriority(idA, 'A');
      todoResult.current.toggleComplete(idA);
    });

    const { result } = renderHook(() => useQuadrants(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isEmpty).toBe(true);
    expect(result.current.buckets.q1).toEqual([]);
  });

  it('every todo item is tagged source: "todo"', async () => {
    const { result: todoResult } = renderHook(() => useTodoList(), { wrapper });
    act(() => {
      const id = todoResult.current.addItem('Some task');
      todoResult.current.setPriority(id, 'B');
    });

    const { result } = renderHook(() => useQuadrants(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.buckets.q2[0]).toMatchObject({ source: 'todo', content: 'Some task' });
  });
});

describe('useQuadrants — thoughts feed', () => {
  it('places classified thoughts into the matching quadrant bucket', async () => {
    mockThoughtsResult.data = [
      { id: 't1', content: 'Brain-dumped task one', quadrant: 'q1' },
      { id: 't2', content: 'Brain-dumped task two', quadrant: 'q3' },
    ];

    const { result } = renderHook(() => useQuadrants(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.buckets.q1.map(i => i.content)).toEqual(['Brain-dumped task one']);
    expect(result.current.buckets.q3.map(i => i.content)).toEqual(['Brain-dumped task two']);
    expect(result.current.buckets.q1[0].source).toBe('thought');
  });

  it('ignores rows with an invalid quadrant value', async () => {
    mockThoughtsResult.data = [
      { id: 't1', content: 'Valid', quadrant: 'q2' },
      // Defensive: the column is CHECKed but a stale row or join might leak garbage.
      { id: 't2', content: 'Invalid', quadrant: 'q9' },
      { id: 't3', content: 'Null', quadrant: null },
    ];

    const { result } = renderHook(() => useQuadrants(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.totalCount).toBe(1);
    expect(result.current.buckets.q2.map(i => i.content)).toEqual(['Valid']);
  });

  it('merges thoughts + todos in the same bucket when they land in the same quadrant', async () => {
    mockThoughtsResult.data = [
      { id: 'th1', content: 'Thought task', quadrant: 'q1' },
    ];

    const { result: todoResult } = renderHook(() => useTodoList(), { wrapper });
    act(() => {
      const id = todoResult.current.addItem('Todo task');
      todoResult.current.setPriority(id, 'A');
    });

    const { result } = renderHook(() => useQuadrants(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.buckets.q1).toHaveLength(2);
    const sources = result.current.buckets.q1.map(i => i.source).sort();
    expect(sources).toEqual(['thought', 'todo']);
  });
});

describe('useQuadrants — refresh', () => {
  it('refetches thoughts when refresh() is called', async () => {
    const { result } = renderHook(() => useQuadrants(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isEmpty).toBe(true);

    // Simulate that the backend now has classified items
    // (e.g. after a BrainDump completion triggers the edge fn).
    mockThoughtsResult.data = [
      { id: 'after', content: 'Newly classified', quadrant: 'q2' },
    ];

    await act(async () => { await result.current.refresh(); });

    expect(result.current.totalCount).toBe(1);
    expect(result.current.buckets.q2.map(i => i.content)).toEqual(['Newly classified']);
  });
});
