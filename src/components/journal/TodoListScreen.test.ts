import { describe, it, expect } from 'vitest';
import { filterByMode } from './TodoListScreen';
import type { TodoItem } from '@/hooks/useTodoList';

function makeItem(overrides: Partial<TodoItem> = {}): TodoItem {
  return {
    id: crypto.randomUUID(),
    text: 'task',
    priority: 'A',
    pendingAI: false,
    aiReason: '',
    completed: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('filterByMode', () => {
  it('returns all items unchanged in "all" mode', () => {
    const items = [
      makeItem({ priority: 'A' }),
      makeItem({ priority: 'B' }),
      makeItem({ priority: 'C' }),
      makeItem({ priority: 'C', pendingAI: true }),
    ];
    expect(filterByMode(items, 'all')).toEqual(items);
  });

  it('returns only A-priority items in "focus" mode', () => {
    const a1 = makeItem({ priority: 'A', text: 'a1' });
    const a2 = makeItem({ priority: 'A', text: 'a2' });
    const items = [a1, makeItem({ priority: 'B' }), a2, makeItem({ priority: 'C' })];
    expect(filterByMode(items, 'focus')).toEqual([a1, a2]);
  });

  it('excludes pendingAI items in "focus" mode even if priority is A', () => {
    // pendingAI means AI hasn't decided yet — items default to priority='C'
    // while pending, but a manual setPriority could land on A before the AI
    // resolves. Either way, pendingAI shouldn't be promoted to "urgent now."
    const items = [
      makeItem({ priority: 'A', pendingAI: false, text: 'resolved' }),
      makeItem({ priority: 'A', pendingAI: true, text: 'pending' }),
    ];
    const result = filterByMode(items, 'focus');
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe('resolved');
  });

  it('returns empty array in "focus" mode when no A items exist', () => {
    const items = [
      makeItem({ priority: 'B' }),
      makeItem({ priority: 'C' }),
    ];
    expect(filterByMode(items, 'focus')).toEqual([]);
  });

  it('returns empty array for empty input regardless of mode', () => {
    expect(filterByMode([], 'focus')).toEqual([]);
    expect(filterByMode([], 'all')).toEqual([]);
  });

  it('preserves completed items in both modes', () => {
    // Completed A tasks still belong on the Focus view — wins shouldn't
    // vanish on completion.
    const completedA = makeItem({ priority: 'A', completed: true, text: 'done' });
    const items = [completedA, makeItem({ priority: 'B' })];
    expect(filterByMode(items, 'focus')).toEqual([completedA]);
    expect(filterByMode(items, 'all')).toEqual(items);
  });
});
